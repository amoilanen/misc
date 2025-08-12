#!/usr/bin/env python3
"""
Test script to verify fake-gcs-server integration.
This script tests basic GCS operations using the fake server.
"""

import requests
import json
import sys
import time
from pathlib import Path

FAKE_GCS_URL = "http://localhost:4443"
BUCKET_NAME = "invoice-pdfs"
TEST_FILE_NAME = "test-invoice.pdf"
TEST_CONTENT = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF\n"

def test_fake_gcs_connection():
    """Test basic connection to fake-gcs-server"""
    print("Testing fake-gcs-server connection...")
    
    try:
        response = requests.get(f"{FAKE_GCS_URL}/storage/v1/b", timeout=5)
        if response.status_code == 200:
            print("✓ fake-gcs-server is accessible")
            return True
        else:
            print(f"✗ fake-gcs-server returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Cannot connect to fake-gcs-server: {e}")
        return False

def test_bucket_exists():
    """Test if the invoice-pdfs bucket exists"""
    print(f"Testing if bucket '{BUCKET_NAME}' exists...")
    
    try:
        response = requests.get(f"{FAKE_GCS_URL}/storage/v1/b/{BUCKET_NAME}", timeout=5)
        if response.status_code == 200:
            print(f"✓ Bucket '{BUCKET_NAME}' exists")
            return True
        else:
            print(f"✗ Bucket '{BUCKET_NAME}' not found (status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Error checking bucket: {e}")
        return False

def test_upload_file():
    """Test uploading a file to the bucket"""
    print(f"Testing file upload to '{BUCKET_NAME}/{TEST_FILE_NAME}'...")
    
    try:
        # Upload file
        upload_url = f"{FAKE_GCS_URL}/upload/storage/v1/b/{BUCKET_NAME}/o"
        params = {
            "uploadType": "media",
            "name": TEST_FILE_NAME
        }
        
        response = requests.post(
            upload_url,
            params=params,
            data=TEST_CONTENT,
            headers={"Content-Type": "application/pdf"},
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✓ File uploaded successfully")
            return True
        else:
            print(f"✗ Upload failed (status: {response.status_code}): {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Error uploading file: {e}")
        return False

def test_list_files():
    """Test listing files in the bucket"""
    print(f"Testing file listing in bucket '{BUCKET_NAME}'...")
    
    try:
        response = requests.get(f"{FAKE_GCS_URL}/storage/v1/b/{BUCKET_NAME}/o", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if "items" in data and len(data["items"]) > 0:
                print(f"✓ Found {len(data['items'])} files in bucket")
                for item in data["items"]:
                    print(f"  - {item['name']}")
                return True
            else:
                print("✗ No files found in bucket")
                return False
        else:
            print(f"✗ Failed to list files (status: {response.status_code})")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Error listing files: {e}")
        return False

def test_download_file():
    """Test downloading a file from the bucket"""
    print(f"Testing file download from '{BUCKET_NAME}/{TEST_FILE_NAME}'...")
    
    try:
        response = requests.get(f"{FAKE_GCS_URL}/storage/v1/b/{BUCKET_NAME}/o/{TEST_FILE_NAME}?alt=media", timeout=10)
        
        if response.status_code == 200:
            content = response.content
            if content == TEST_CONTENT:
                print(f"✓ File downloaded successfully and content matches")
                return True
            else:
                print(f"✗ Downloaded content doesn't match original")
                return False
        else:
            print(f"✗ Download failed (status: {response.status_code})")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Error downloading file: {e}")
        return False

def test_delete_file():
    """Test deleting a file from the bucket"""
    print(f"Testing file deletion from '{BUCKET_NAME}/{TEST_FILE_NAME}'...")
    
    try:
        response = requests.delete(f"{FAKE_GCS_URL}/storage/v1/b/{BUCKET_NAME}/o/{TEST_FILE_NAME}", timeout=5)
        
        if response.status_code == 204:
            print(f"✓ File deleted successfully")
            return True
        else:
            print(f"✗ Deletion failed (status: {response.status_code})")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Error deleting file: {e}")
        return False

def main():
    """Main test function"""
    print("Testing fake-gcs-server integration...")
    print(f"Fake GCS URL: {FAKE_GCS_URL}")
    print(f"Bucket name: {BUCKET_NAME}")
    print()
    
    tests = [
        ("Connection", test_fake_gcs_connection),
        ("Bucket Exists", test_bucket_exists),
        ("Upload File", test_upload_file),
        ("List Files", test_list_files),
        ("Download File", test_download_file),
        ("Delete File", test_delete_file)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} Test ---")
        if test_func():
            passed += 1
        else:
            print(f"✗ {test_name} test failed")
    
    print(f"\n--- Test Results ---")
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All tests passed! fake-gcs-server integration is working correctly.")
        return 0
    else:
        print("✗ Some tests failed. Please check the fake-gcs-server setup.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
