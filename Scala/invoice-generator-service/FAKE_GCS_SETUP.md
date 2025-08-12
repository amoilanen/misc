# Fake GCS Server Setup Guide

This guide explains how to use the fake-gcs-server for local development of the Invoice Generator Service.

## What is fake-gcs-server?

[fake-gcs-server](https://github.com/fsouza/fake-gcs-server) is a local emulation of Google Cloud Storage that implements the GCS API. It allows you to develop and test applications that use Google Cloud Storage without needing:

- Real GCP credentials
- Internet access
- GCP billing setup
- Service account keys

## Quick Start

### 1. Start the fake-gcs-server

```bash
# Start all dependencies including fake-gcs-server
python scripts/dev.py start

# Or start just the fake-gcs-server
docker-compose up -d fake-gcs-server
```

### 2. Initialize the bucket

```bash
# Initialize the required bucket
python scripts/dev.py init-gcs
```

### 3. Test the integration

```bash
# Test that everything works
python scripts/dev.py test-gcs
```

### 4. Run the application

```bash
# Start the application (it will use fake-gcs-server automatically)
python scripts/dev.py run
```

## Configuration

The application is pre-configured to use fake-gcs-server for local development:

```hocon
app.gcp {
  projectId = "fake-project-id"
  bucketName = "invoice-pdfs"
  credentialsPath = null
  endpoint = "http://localhost:4443"  # fake-gcs-server endpoint
}
```

## Manual Testing

You can manually test the fake-gcs-server using curl:

### List buckets
```bash
curl http://localhost:4443/storage/v1/b
```

### List objects in bucket
```bash
curl http://localhost:4443/storage/v1/b/invoice-pdfs/o
```

### Upload a file
```bash
curl -X POST \
  "http://localhost:4443/upload/storage/v1/b/invoice-pdfs/o?uploadType=media&name=test.pdf" \
  -H "Content-Type: application/pdf" \
  --data-binary @test.pdf
```

### Download a file
```bash
curl "http://localhost:4443/storage/v1/b/invoice-pdfs/o/test.pdf?alt=media"
```

### Delete a file
```bash
curl -X DELETE http://localhost:4443/storage/v1/b/invoice-pdfs/o/test.pdf
```

## Docker Compose Configuration

The fake-gcs-server is configured in `docker-compose.yml`:

```yaml
fake-gcs-server:
  image: fsouza/fake-gcs-server:latest
  container_name: invoice-generator-fake-gcs
  command: ["-scheme", "http", "-port", "4443", "-backend", "memory", "-public-host", "fake-gcs-server:4443"]
  ports:
    - "4443:4443"
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:4443/storage/v1/b || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Configuration Options

- `-scheme http`: Use HTTP instead of HTTPS
- `-port 4443`: Listen on port 4443
- `-backend memory`: Store data in memory (cleared on restart)
- `-public-host fake-gcs-server:4443`: Public hostname for the service

## Production vs Development

### Development (with fake-gcs-server)
```hocon
app.gcp {
  endpoint = "http://localhost:4443"
  projectId = "fake-project-id"
  bucketName = "invoice-pdfs"
  credentialsPath = null
}
```

### Production (real GCP)
```hocon
app.gcp {
  endpoint = null  # Use default GCP endpoints
  projectId = "your-real-project-id"
  bucketName = "invoice-pdfs"
  credentialsPath = "/path/to/service-account-key.json"
}
```

## Troubleshooting

### fake-gcs-server not starting
```bash
# Check if the container is running
docker ps | grep fake-gcs

# Check logs
docker logs invoice-generator-fake-gcs

# Restart the service
docker-compose restart fake-gcs-server
```

### Bucket not found
```bash
# Initialize the bucket manually
python scripts/init_fake_gcs.py

# Or create it via API
curl -X POST \
  "http://localhost:4443/storage/v1/b" \
  -H "Content-Type: application/json" \
  -d '{"name": "invoice-pdfs", "location": "US"}' \
  -G -d "project=fake-project-id"
```

### Application can't connect
1. Ensure fake-gcs-server is running: `docker ps | grep fake-gcs`
2. Check the endpoint configuration in `application.conf`
3. Verify the bucket exists: `python scripts/dev.py init-gcs`
4. Test the connection: `python scripts/dev.py test-gcs`

## Advanced Usage

### Persistent Storage

To persist data between restarts, modify the docker-compose.yml:

```yaml
fake-gcs-server:
  image: fsouza/fake-gcs-server:latest
  command: ["-scheme", "http", "-port", "4443", "-backend", "filesystem", "-filesystem-root", "/data"]
  volumes:
    - fake_gcs_data:/data
  # ... other config

volumes:
  fake_gcs_data:
```

### Custom Port

To use a different port, update both docker-compose.yml and application.conf:

```yaml
# docker-compose.yml
fake-gcs-server:
  ports:
    - "8080:4443"  # Map host port 8080 to container port 4443
```

```hocon
# application.conf
app.gcp.endpoint = "http://localhost:8080"
```

### Multiple Buckets

You can create additional buckets for testing:

```bash
# Create a test bucket
curl -X POST \
  "http://localhost:4443/storage/v1/b" \
  -H "Content-Type: application/json" \
  -d '{"name": "test-bucket", "location": "US"}' \
  -G -d "project=fake-project-id"
```

## Integration with Tests

The fake-gcs-server can be used in integration tests. Update your test configuration to use the fake endpoint:

```hocon
# test.conf
app.gcp {
  endpoint = "http://localhost:4443"
  projectId = "fake-project-id"
  bucketName = "test-invoice-pdfs"
  credentialsPath = null
}
```

## Resources

- [fake-gcs-server GitHub](https://github.com/fsouza/fake-gcs-server)
- [Google Cloud Storage API Reference](https://cloud.google.com/storage/docs/reference/rest)
- [GCS Client Library Documentation](https://cloud.google.com/storage/docs/reference/libraries)
