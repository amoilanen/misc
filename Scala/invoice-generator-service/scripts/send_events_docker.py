#!/usr/bin/env python3

"""
Simple script to send test events to Kafka using Docker Compose
"""

import os
import sys
import json
import time
import subprocess
import argparse
from pathlib import Path
from typing import List, Dict, Any

# Colors for output
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    NC = '\033[0m'

def print_status(message: str) -> None:
    """Print a status message in green."""
    print(f"{Colors.GREEN}[INFO]{Colors.NC} {message}")

def print_error(message: str) -> None:
    """Print an error message in red."""
    print(f"{Colors.RED}[ERROR]{Colors.NC} {message}")

def run_command(command: List[str], check: bool = True, capture_output: bool = False) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    result = subprocess.run(
        command,
        check=check,
        capture_output=capture_output,
        text=True,
        shell=False
    )
    return result

def check_docker_compose_running() -> bool:
    """Check if Docker Compose services are running."""
    try:
        result = subprocess.run(
            ["docker-compose", "ps"],
            capture_output=True,
            text=True,
            check=True
        )
        return "kafka" in result.stdout and "Up" in result.stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def load_events_file(events_file: str) -> List[Dict[str, Any]]:
    """Load events from JSON file."""
    try:
        with open(events_file, 'r') as f:
            events = json.load(f)
        return events
    except FileNotFoundError:
        print_error(f"Events file not found: {events_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON in events file: {e}")
        sys.exit(1)

def create_topic(topic: str) -> None:
    """Create Kafka topic if it doesn't exist."""
    print_status("Creating topic if it doesn't exist...")
    
    try:
        run_command([
            "docker-compose", "exec", "kafka", "kafka-topics.sh",
            "--create",
            "--topic", topic,
            "--bootstrap-server", "localhost:9092",
            "--partitions", "3",
            "--replication-factor", "1"
        ], check=False)
        print_status("Topic created successfully")
    except subprocess.CalledProcessError:
        print_status("Topic already exists")

def send_event(event: Dict[str, Any], topic: str) -> None:
    """Send a single event to Kafka."""
    event_json = json.dumps(event)
    
    try:
        result = subprocess.run([
            "docker-compose", "exec", "-T", "kafka", "kafka-console-producer.sh",
            "--topic", topic,
            "--bootstrap-server", "localhost:9092"
        ], input=event_json, text=True, capture_output=True, check=True)
        
        event_id = event.get('id', 'unknown')
        customer_name = event.get('customerName', 'unknown')
        print_status(f"Sent event: {event_id} ({customer_name})")
        
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to send event {event.get('id', 'unknown')}: {e}")

def send_all_events(events: List[Dict[str, Any]], topic: str) -> None:
    """Send all events to Kafka."""
    print_status("Sending events...")
    
    for event in events:
        send_event(event, topic)
        time.sleep(0.5)  # Small delay between events

def send_single_event(events: List[Dict[str, Any]], event_id: str, topic: str) -> None:
    """Send a single event by ID."""
    print_status(f"Sending single event: {event_id}")
    
    # Find the event with the specified ID
    target_event = None
    for event in events:
        if event.get('id') == event_id:
            target_event = event
            break
    
    if target_event is None:
        print_error(f"Event with ID {event_id} not found")
        sys.exit(1)
    
    send_event(target_event, topic)

def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description="Send test events to Kafka using Docker Compose")
    parser.add_argument("--topic", default="invoice-events", help="Kafka topic (default: invoice-events)")
    parser.add_argument("--file", default="examples/invoice-events.json", help="Events file (default: examples/invoice-events.json)")
    parser.add_argument("--single", help="Send a single event by ID")
    
    args = parser.parse_args()
    
    # Check if Docker Compose is running
    if not check_docker_compose_running():
        print_error("Kafka is not running. Please start it first:")
        print("  docker-compose up -d kafka")
        sys.exit(1)
    
    # Check if events file exists
    if not Path(args.file).exists():
        print_error(f"Events file not found: {args.file}")
        sys.exit(1)
    
    # Load events
    events = load_events_file(args.file)
    
    print_status(f"Sending test events to Kafka topic: {args.topic}")
    
    # Create topic
    create_topic(args.topic)
    
    # Send events
    if args.single:
        send_single_event(events, args.single, args.topic)
    else:
        send_all_events(events, args.topic)
    
    print_status("All events sent successfully!")
    print_status("You can now check the application logs to see the processing:")
    print("  docker-compose logs -f invoice-generator-service")

if __name__ == "__main__":
    main() 