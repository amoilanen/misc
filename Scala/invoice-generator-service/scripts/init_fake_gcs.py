#!/usr/bin/env python3
"""
Script to initialize the fake-gcs-server bucket for local development.
This script creates the required bucket and sets up basic permissions.
"""

import requests
import json
import time
import sys
from urllib.parse import urljoin

FAKE_GCS_URL = "http://localhost:4443"
BUCKET_NAME = "invoice-pdfs"

def wait_for_fake_gcs():
    """Wait for fake-gcs-server to be ready"""
    print("Waiting for fake-gcs-server to be ready...")
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            response = requests.get(f"{FAKE_GCS_URL}/storage/v1/b", timeout=5)
            if response.status_code == 200:
                print("✓ fake-gcs-server is ready")
                return True
        except requests.exceptions.RequestException:
            pass
        
        retry_count += 1
        time.sleep(2)
        print(f"  Retrying... ({retry_count}/{max_retries})")
    
    print("✗ fake-gcs-server failed to start")
    return False

def create_bucket():
    """Create the invoice-pdfs bucket"""
    print(f"Creating bucket '{BUCKET_NAME}'...")
    
    bucket_data = {
        "name": BUCKET_NAME,
        "location": "US"
    }
    
    try:
        response = requests.post(
            f"{FAKE_GCS_URL}/storage/v1/b",
            params={"project": "fake-project-id"},
            json=bucket_data,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✓ Bucket '{BUCKET_NAME}' created successfully")
            return True
        else:
            print(f"✗ Failed to create bucket: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Error creating bucket: {e}")
        return False

def list_buckets():
    """List all buckets to verify setup"""
    print("Listing buckets...")
    
    try:
        response = requests.get(f"{FAKE_GCS_URL}/storage/v1/b", timeout=10)
        
        if response.status_code == 200:
            buckets = response.json()
            if "items" in buckets:
                for bucket in buckets["items"]:
                    print(f"  - {bucket['name']}")
            else:
                print("  No buckets found")
        else:
            print(f"✗ Failed to list buckets: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Error listing buckets: {e}")

def main():
    """Main function"""
    print("Initializing fake-gcs-server for local development...")
    print(f"Fake GCS URL: {FAKE_GCS_URL}")
    print(f"Bucket name: {BUCKET_NAME}")
    print()
    
    # Wait for fake-gcs-server to be ready
    if not wait_for_fake_gcs():
        sys.exit(1)
    
    # Create bucket
    if not create_bucket():
        sys.exit(1)
    
    # List buckets to verify
    list_buckets()
    
    print()
    print("✓ Fake GCS setup complete!")
    print("The service can now use fake-gcs-server for local development.")
    print()
    print("You can access the fake GCS API at:")
    print(f"  {FAKE_GCS_URL}/storage/v1/b")
    print()
    print("To test file uploads, you can use:")
    print(f"  curl -X POST {FAKE_GCS_URL}/storage/v1/b/{BUCKET_NAME}/o")

if __name__ == "__main__":
    main()
