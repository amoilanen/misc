#!/usr/bin/env python3

"""
Script to test the Invoice Generator Service API endpoints
"""

import os
import sys
import json
import time
import argparse
import requests
from pathlib import Path
from typing import Dict, Any, Optional

# Colors for output
class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'

def print_status(message: str) -> None:
    """Print a status message in green."""
    print(f"{Colors.GREEN}[INFO]{Colors.NC} {message}")

def print_warning(message: str) -> None:
    """Print a warning message in yellow."""
    print(f"{Colors.YELLOW}[WARNING]{Colors.NC} {message}")

def print_error(message: str) -> None:
    """Print an error message in red."""
    print(f"{Colors.RED}[ERROR]{Colors.NC} {message}")

def print_header(message: str) -> None:
    """Print a header message in blue."""
    print(f"{Colors.BLUE}[TEST]{Colors.NC} {message}")

def wait_for_service(api_base_url: str, max_attempts: int = 30) -> None:
    """Wait for service to be ready."""
    print_status("Waiting for service to be ready...")
    
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.get(f"{api_base_url}/api/v1/health", timeout=5)
            if response.status_code == 200:
                print_status("Service is ready!")
                return
        except requests.RequestException:
            pass
        
        print_warning(f"Attempt {attempt}/{max_attempts}: Service not ready yet...")
        time.sleep(2)
    
    print_error(f"Service failed to start within {max_attempts * 2} seconds")
    sys.exit(1)

def api_request(method: str, url: str, data: Optional[Dict[str, Any]] = None) -> requests.Response:
    """Make API request and return response."""
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=10)
        else:
            print_error(f"Unsupported method: {method}")
            sys.exit(1)
        
        return response
    except requests.RequestException as e:
        print_error(f"Request failed: {e}")
        sys.exit(1)

def test_health(api_base_url: str) -> None:
    """Test health endpoint."""
    print_header("Testing Health Endpoint")
    
    response = api_request("GET", f"{api_base_url}/api/v1/health")
    print(f"Response: {response.text}")
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        print_status("✓ Health check passed")
    else:
        print_error("✗ Health check failed")
    print()

def test_company_invoices(api_base_url: str) -> None:
    """Test getting invoices by company."""
    print_header("Testing Get Invoices by Company")
    
    company_id = "acme-corp"
    url = f"{api_base_url}/api/v1/invoices/company/{company_id}?page=1&pageSize=10"
    
    response = api_request("GET", url)
    print(f"Response: {response.text}")
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        print_status("✓ Company invoices query successful")
        
        try:
            data = response.json()
            invoice_count = data.get('totalCount', 0)
            print_status(f"Found {invoice_count} invoices for company: {company_id}")
        except json.JSONDecodeError:
            print_warning("Could not parse JSON response")
    else:
        print_error("✗ Company invoices query failed")
    print()

def test_date_range_invoices(api_base_url: str) -> None:
    """Test getting invoices by date range."""
    print_header("Testing Get Invoices by Date Range")
    
    from_date = "2024-01-15T00:00:00"
    to_date = "2024-01-20T23:59:59"
    url = f"{api_base_url}/api/v1/invoices/date-range?fromDate={from_date}&toDate={to_date}&page=1&pageSize=10"
    
    response = api_request("GET", url)
    print(f"Response: {response.text}")
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        print_status("✓ Date range query successful")
        
        try:
            data = response.json()
            invoice_count = data.get('totalCount', 0)
            print_status(f"Found {invoice_count} invoices in date range: {from_date} to {to_date}")
        except json.JSONDecodeError:
            print_warning("Could not parse JSON response")
    else:
        print_error("✗ Date range query failed")
    print()

def test_specific_invoice(api_base_url: str) -> None:
    """Test getting specific invoice."""
    print_header("Testing Get Specific Invoice")
    
    # First get a list of invoices to find an ID
    url = f"{api_base_url}/api/v1/invoices/company/acme-corp?page=1&pageSize=1"
    response = api_request("GET", url)
    
    if response.status_code == 200:
        try:
            data = response.json()
            invoices = data.get('invoices', [])
            
            if invoices:
                invoice_id = invoices[0].get('id')
                if invoice_id:
                    print_status(f"Testing with invoice ID: {invoice_id}")
                    
                    # Get specific invoice
                    specific_url = f"{api_base_url}/api/v1/invoices/{invoice_id}"
                    specific_response = api_request("GET", specific_url)
                    
                    print(f"Response: {specific_response.text}")
                    print(f"HTTP Status: {specific_response.status_code}")
                    
                    if specific_response.status_code == 200:
                        print_status("✓ Specific invoice query successful")
                        
                        try:
                            invoice_data = specific_response.json()
                            customer_name = invoice_data.get('customerName', 'unknown')
                            print_status(f"Retrieved invoice for: {customer_name}")
                        except json.JSONDecodeError:
                            print_warning("Could not parse JSON response")
                    else:
                        print_error("✗ Specific invoice query failed")
                else:
                    print_warning("No invoice ID found in response")
            else:
                print_warning("No invoices found to test specific invoice endpoint")
        except json.JSONDecodeError:
            print_error("✗ Could not parse invoice list response")
    else:
        print_error("✗ Could not get invoice list for testing")
    print()

def test_pagination(api_base_url: str) -> None:
    """Test pagination."""
    print_header("Testing Pagination")
    
    company_id = "acme-corp"
    
    # Test first page
    print_status("Testing page 1...")
    url1 = f"{api_base_url}/api/v1/invoices/company/{company_id}?page=1&pageSize=2"
    response1 = api_request("GET", url1)
    
    if response1.status_code == 200:
        try:
            data1 = response1.json()
            page1_count = len(data1.get('invoices', []))
            total_count = data1.get('totalCount', 0)
            total_pages = data1.get('totalPages', 0)
            
            print_status(f"Page 1: {page1_count} invoices, Total: {total_count}, Pages: {total_pages}")
            
            # Test second page if available
            if total_pages > 1:
                print_status("Testing page 2...")
                url2 = f"{api_base_url}/api/v1/invoices/company/{company_id}?page=2&pageSize=2"
                response2 = api_request("GET", url2)
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    page2_count = len(data2.get('invoices', []))
                    print_status(f"Page 2: {page2_count} invoices")
                    print_status("✓ Pagination working correctly")
                else:
                    print_error("✗ Page 2 query failed")
            else:
                print_status("✓ Pagination working (only one page needed)")
        except json.JSONDecodeError:
            print_error("✗ Could not parse pagination response")
    else:
        print_error("✗ Pagination test failed")
    print()

def test_error_handling(api_base_url: str) -> None:
    """Test error handling."""
    print_header("Testing Error Handling")
    
    # Test non-existent invoice
    print_status("Testing non-existent invoice...")
    response = api_request("GET", f"{api_base_url}/api/v1/invoices/00000000-0000-0000-0000-000000000000")
    print(f"Response: {response.text}")
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 404:
        print_status("✓ 404 error handled correctly")
    else:
        print_warning("Expected 404 but got different response")
    print()
    
    # Test invalid company ID
    print_status("Testing invalid company ID...")
    response = api_request("GET", f"{api_base_url}/api/v1/invoices/company/non-existent-company?page=1&pageSize=10")
    print(f"Response: {response.text}")
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            invoice_count = data.get('totalCount', 0)
            if invoice_count == 0:
                print_status("✓ Empty result for non-existent company")
            else:
                print_warning("Unexpected result for non-existent company")
        except json.JSONDecodeError:
            print_warning("Could not parse response")
    else:
        print_error("✗ Error handling for invalid company failed")
    print()

def show_api_info(api_base_url: str) -> None:
    """Show API information."""
    print_header("API Information")
    print(f"Base URL: {api_base_url}")
    print(f"Swagger UI: {api_base_url}/docs")
    print(f"Health Check: {api_base_url}/api/v1/health")
    print()
    print("Available endpoints:")
    print("  GET /api/v1/health                                    - Health check")
    print("  GET /api/v1/invoices/{id}                            - Get invoice by ID")
    print("  GET /api/v1/invoices/company/{companyId}             - List invoices by company")
    print("  GET /api/v1/invoices/date-range                      - List invoices by date range")
    print()

def show_help() -> None:
    """Show help message."""
    help_text = """
Usage: python scripts/test_api.py [COMMAND]

Commands:
  all         Run all API tests
  health      Test health endpoint only
  company     Test company invoices endpoint only
  date-range  Test date range endpoint only
  specific    Test specific invoice endpoint only
  pagination  Test pagination only
  errors      Test error handling only
  info        Show API information
  help        Show this help message

Environment variables:
  API_BASE_URL  Base URL for API (default: http://localhost:8080)
  WAIT_TIME     Time to wait for service startup (default: 5)

Examples:
  python scripts/test_api.py all                    # Run all tests
  python scripts/test_api.py health                 # Test health endpoint
  API_BASE_URL=http://other-host:8080 python scripts/test_api.py all  # Test different host
"""
    print(help_text)

def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description="Test Invoice Generator Service API")
    parser.add_argument("command", nargs="?", default="all", help="Command to execute")
    
    args = parser.parse_args()
    
    # Configuration
    api_base_url = os.environ.get("API_BASE_URL", "http://localhost:8080")
    
    # Check if requests is available
    try:
        import requests
    except ImportError:
        print_error("requests library is required but not installed")
        print("Please install it with: pip install requests")
        sys.exit(1)
    
    # Command mapping
    commands = {
        "all": lambda: (
            wait_for_service(api_base_url),
            test_health(api_base_url),
            test_company_invoices(api_base_url),
            test_date_range_invoices(api_base_url),
            test_specific_invoice(api_base_url),
            test_pagination(api_base_url),
            test_error_handling(api_base_url),
            print_status("All tests completed!")
        ),
        "health": lambda: (wait_for_service(api_base_url), test_health(api_base_url)),
        "company": lambda: (wait_for_service(api_base_url), test_company_invoices(api_base_url)),
        "date-range": lambda: (wait_for_service(api_base_url), test_date_range_invoices(api_base_url)),
        "specific": lambda: (wait_for_service(api_base_url), test_specific_invoice(api_base_url)),
        "pagination": lambda: (wait_for_service(api_base_url), test_pagination(api_base_url)),
        "errors": lambda: (wait_for_service(api_base_url), test_error_handling(api_base_url)),
        "info": lambda: show_api_info(api_base_url),
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