#!/usr/bin/env python3

"""
Development script for Invoice Generator Service
"""

import os
import sys
import subprocess
import time
import argparse
from pathlib import Path
from typing import Optional, List

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
    try:
        result = subprocess.run(
            command,
            check=check,
            capture_output=capture_output,
            text=True,
            shell=False
        )
        return result
    except subprocess.CalledProcessError as e:
        if check:
            print_error(f"Command failed: {' '.join(command)}")
            print_error(f"Error: {e}")
            sys.exit(1)
        return e

def check_command_exists(command: str) -> bool:
    """Check if a command exists in the system PATH."""
    try:
        subprocess.run([command, "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def check_prerequisites() -> None:
    """Check if all required tools are installed."""
    print_status("Checking prerequisites...")
    
    required_commands = {
        "java": "Java 17+",
        "sbt": "sbt",
        "docker": "Docker",
        "docker-compose": "Docker Compose"
    }
    
    missing_commands = []
    
    for command, description in required_commands.items():
        if check_command_exists(command):
            print_status(f"✓ {description} is installed")
        else:
            missing_commands.append(description)
            print_error(f"✗ {description} is required but not installed")
    
    if missing_commands:
        print_error("Please install the missing prerequisites before continuing.")
        sys.exit(1)
    
    print_status("All prerequisites are satisfied")

def start_dependencies() -> None:
    """Start dependencies using Docker Compose."""
    print_status("Starting dependencies with Docker Compose...")
    
    # Check if docker-compose.yml exists
    if not Path("docker-compose.yml").exists():
        print_error("docker-compose.yml not found in current directory")
        sys.exit(1)
    
    # Start services including fake-gcs-server
    run_command(["docker-compose", "up", "-d", "postgres", "kafka", "zookeeper", "fake-gcs-server"])
    
    print_status("Waiting for services to be ready...")
    time.sleep(30)
    print_status("Dependencies are ready")

def init_fake_gcs() -> None:
    """Initialize fake-gcs-server bucket."""
    print_status("Initializing fake-gcs-server bucket...")
    
    # Check if init_fake_gcs.py exists
    init_script = Path("scripts/init_fake_gcs.py")
    if not init_script.exists():
        print_error("scripts/init_fake_gcs.py not found")
        sys.exit(1)
    
    # Run the initialization script
    run_command([sys.executable, str(init_script)])
    print_status("Fake GCS bucket initialized")

def test_fake_gcs() -> None:
    """Test fake-gcs-server integration."""
    print_status("Testing fake-gcs-server integration...")
    
    # Check if test_fake_gcs.py exists
    test_script = Path("scripts/test_fake_gcs.py")
    if not test_script.exists():
        print_error("scripts/test_fake_gcs.py not found")
        sys.exit(1)
    
    # Run the test script
    result = run_command([sys.executable, str(test_script)], check=False)
    if result.returncode == 0:
        print_status("Fake GCS integration test passed")
    else:
        print_error("Fake GCS integration test failed")
        sys.exit(1)

def stop_dependencies() -> None:
    """Stop dependencies using Docker Compose."""
    print_status("Stopping dependencies...")
    run_command(["docker-compose", "down"])
    print_status("Dependencies stopped")

def run_tests() -> None:
    """Run unit tests."""
    print_status("Running tests...")
    run_command(["sbt", "test"])
    print_status("Tests completed")

def run_integration_tests() -> None:
    """Run integration tests."""
    print_status("Running integration tests...")
    run_command(["sbt", "it:test"])
    print_status("Integration tests completed")

def build_app() -> None:
    """Build the application."""
    print_status("Building application...")
    run_command(["sbt", "clean", "compile"])
    print_status("Application built successfully")

def create_jar() -> None:
    """Create fat JAR."""
    print_status("Creating fat JAR...")
    run_command(["sbt", "assembly"])
    print_status("Fat JAR created successfully")

def run_app() -> None:
    """Run the application."""
    print_status("Running application...")
    run_command(["sbt", "run"])

def clean() -> None:
    """Clean up everything."""
    stop_dependencies()
    run_command(["sbt", "clean"])
    print_status("Cleanup completed")

def dev() -> None:
    """Start dependencies and run application."""
    check_prerequisites()
    start_dependencies()
    init_fake_gcs()
    run_app()

def show_help() -> None:
    """Show help message."""
    help_text = """
Usage: python scripts/dev.py [COMMAND]

Commands:
  check       Check prerequisites
  start       Start dependencies (PostgreSQL, Kafka, fake-gcs-server)
  stop        Stop dependencies
  init-gcs    Initialize fake-gcs-server bucket
  test-gcs    Test fake-gcs-server integration
  test        Run unit tests
  itest       Run integration tests
  build       Build the application
  jar         Create fat JAR
  run         Run the application
  dev         Start dependencies, init GCS, and run application
  clean       Stop dependencies and clean build
  help        Show this help message

Examples:
  python scripts/dev.py dev      # Start dependencies, init GCS, and run application
  python scripts/dev.py test     # Run tests only
  python scripts/dev.py jar      # Create deployable JAR
  python scripts/dev.py init-gcs # Initialize fake-gcs-server bucket only
  python scripts/dev.py test-gcs # Test fake-gcs-server integration
"""
    print(help_text)

def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description="Invoice Generator Service Development Script")
    parser.add_argument("command", nargs="?", default="help", help="Command to execute")
    
    args = parser.parse_args()
    
    # Command mapping
    commands = {
        "check": check_prerequisites,
        "start": start_dependencies,
        "stop": stop_dependencies,
        "init-gcs": init_fake_gcs,
        "test-gcs": test_fake_gcs,
        "test": run_tests,
        "itest": run_integration_tests,
        "build": build_app,
        "jar": create_jar,
        "run": run_app,
        "dev": dev,
        "clean": clean,
        "help": show_help
    }
    
    # Execute command
    command_func = commands.get(args.command)
    if command_func:
        command_func()
    else:
        print_error(f"Unknown command: {args.command}")
        show_help()
        sys.exit(1)

if __name__ == "__main__":
    main() 