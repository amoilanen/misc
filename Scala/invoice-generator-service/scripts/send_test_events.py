#!/usr/bin/env python3

"""
Script to send test invoice events to Kafka
"""

import os
import sys
import json
import time
import subprocess
import argparse
import socket
from pathlib import Path
from typing import List, Dict, Any, Optional

# Colors for output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    NC = '\033[0m'  # No Color

def print_status(message: str) -> None:
    """Print a status message in green."""
    print(f"{Colors.GREEN}[INFO]{Colors.NC} {message}")

def print_warning(message: str) -> None:
    """Print a warning message in yellow."""
    print(f"{Colors.YELLOW}[WARNING]{Colors.NC} {message}")

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

def check_kafka() -> None:
    """Check if Kafka is running."""
    print_status("Checking Kafka connectivity...")
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(('localhost', 9092))
        sock.close()
        
        if result != 0:
            print_error("Kafka is not running on localhost:9092")
            print_status("Please start Kafka first: python scripts/dev.py start")
            sys.exit(1)
    except Exception as e:
        print_error(f"Failed to check Kafka connectivity: {e}")
        sys.exit(1)
    
    print_status("Kafka is running")

def check_kubectl_kafka() -> bool:
    """Check if Kafka is running in Kubernetes."""
    try:
        result = subprocess.run(
            ["kubectl", "get", "pod", "kafka-0", "-n", "kafka"],
            capture_output=True,
            text=True,
            check=True
        )
        return "Running" in result.stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def create_topic_kubectl(topic: str) -> None:
    """Create Kafka topic using kubectl."""
    print_status(f"Creating Kafka topic: {topic}")
    
    try:
        # Check if topic exists
        result = subprocess.run([
            "kubectl", "exec", "-it", "kafka-0", "-n", "kafka", "--",
            "kafka-topics.sh", "--list", "--bootstrap-server", "localhost:9092"
        ], capture_output=True, text=True, check=True)
        
        if topic in result.stdout:
            print_status(f"Topic {topic} already exists")
        else:
            subprocess.run([
                "kubectl", "exec", "-it", "kafka-0", "-n", "kafka", "--",
                "kafka-topics.sh",
                "--create",
                "--topic", topic,
                "--bootstrap-server", "localhost:9092",
                "--partitions", "3",
                "--replication-factor", "1"
            ], check=True)
            print_status(f"Topic {topic} created successfully")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to create topic: {e}")

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

def send_events_kubectl(events: List[Dict[str, Any]], topic: str) -> None:
    """Send events using kubectl."""
    print_status("Sending events using kubectl...")
    
    for event in events:
        event_json = json.dumps(event)
        try:
            subprocess.run([
                "kubectl", "exec", "-i", "kafka-0", "-n", "kafka", "--",
                "kafka-console-producer.sh",
                "--topic", topic,
                "--bootstrap-server", "localhost:9092"
            ], input=event_json, text=True, check=True)
            
            event_id = event.get('id', 'unknown')
            print_status(f"Sent event: {event_id}")
            time.sleep(1)
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to send event {event.get('id', 'unknown')}: {e}")

def send_events_local(events: List[Dict[str, Any]], topic: str, bootstrap_servers: str) -> None:
    """Send events using local kafka-console-producer."""
    print_status("Sending events using local kafka-console-producer...")
    
    # Check if kafka-console-producer is available
    try:
        subprocess.run(["kafka-console-producer", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_error("kafka-console-producer not found. Please install Kafka tools or use Docker Compose.")
        sys.exit(1)
    
    for event in events:
        event_json = json.dumps(event)
        try:
            subprocess.run([
                "kafka-console-producer.sh",
                "--topic", topic,
                "--bootstrap-server", bootstrap_servers
            ], input=event_json, text=True, check=True)
            
            event_id = event.get('id', 'unknown')
            print_status(f"Sent event: {event_id}")
            time.sleep(1)
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to send event {event.get('id', 'unknown')}: {e}")

def send_single_event(events: List[Dict[str, Any]], event_id: str, topic: str, bootstrap_servers: str) -> None:
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
    
    event_json = json.dumps(target_event)
    
    if check_kubectl_kafka():
        try:
            subprocess.run([
                "kubectl", "exec", "-i", "kafka-0", "-n", "kafka", "--",
                "kafka-console-producer.sh",
                "--topic", topic,
                "--bootstrap-server", "localhost:9092"
            ], input=event_json, text=True, check=True)
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to send event: {e}")
    else:
        try:
            subprocess.run([
                "kafka-console-producer.sh",
                "--topic", topic,
                "--bootstrap-server", bootstrap_servers
            ], input=event_json, text=True, check=True)
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to send event: {e}")
    
    print_status(f"Sent event: {event_id}")

def show_help() -> None:
    """Show help message."""
    help_text = """
Usage: python scripts/send_test_events.py [COMMAND] [OPTIONS]

Commands:
  all         Send all test events to Kafka
  single ID   Send a single event by ID
  help        Show this help message

Options:
  --topic TOPIC           Kafka topic (default: invoice-events)
  --bootstrap-servers URL Kafka bootstrap servers (default: localhost:9092)
  --file FILE             Events file (default: examples/invoice-events.json)

Examples:
  python scripts/send_test_events.py all                                    # Send all events
  python scripts/send_test_events.py single 550e8400-e29b-41d4-a716-446655440001  # Send specific event
  python scripts/send_test_events.py all --topic test-events               # Send to custom topic
"""
    print(help_text)

def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description="Send test invoice events to Kafka")
    parser.add_argument("command", nargs="?", help="Command to execute (all, single, help)")
    parser.add_argument("event_id", nargs="?", help="Event ID for single command")
    parser.add_argument("--topic", default="invoice-events", help="Kafka topic (default: invoice-events)")
    parser.add_argument("--bootstrap-servers", default="localhost:9092", help="Kafka bootstrap servers (default: localhost:9092)")
    parser.add_argument("--file", default="examples/invoice-events.json", help="Events file (default: examples/invoice-events.json)")
    
    args = parser.parse_args()
    
    # Check if events file exists
    if not Path(args.file).exists():
        print_error(f"Events file not found: {args.file}")
        sys.exit(1)
    
    # Load events
    events = load_events_file(args.file)
    
    # Parse command
    command = args.command or "help"
    
    if command == "help":
        show_help()
        return
    
    # Check Kafka connectivity
    check_kafka()
    
    if command == "all":
        # Try to use kubectl first, fallback to local kafka
        if check_kubectl_kafka():
            create_topic_kubectl(args.topic)
            send_events_kubectl(events, args.topic)
        else:
            send_events_local(events, args.topic, args.bootstrap_servers)
        
        print_status("All events sent successfully!")
        
    elif command == "single":
        if not args.event_id:
            print_error("Event ID is required for single command")
            show_help()
            sys.exit(1)
        
        send_single_event(events, args.event_id, args.topic, args.bootstrap_servers)
        
    else:
        print_error(f"Unknown command: {command}")
        show_help()
        sys.exit(1)

if __name__ == "__main__":
    main() 