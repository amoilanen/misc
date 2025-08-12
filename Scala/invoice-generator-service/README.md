# Invoice Generator Service

A production-ready microservice built with Scala 3 and ZIO 2 for processing invoice events and generating PDF invoices.

## Features

- **Kafka Event Processing**: Consumes invoice events from Kafka topics
- **PDF Generation**: Generates professional PDF invoices using iText7
- **GCP Storage**: Stores PDFs in Google Cloud Storage
- **REST API**: Read-only API for querying invoices with pagination
- **Database Persistence**: PostgreSQL with Flyway migrations
- **Production Ready**: Health checks, logging, monitoring, and containerization

## Tech Stack

- **Scala 3.7.1** - Modern functional programming
- **ZIO 2.1.3** - Type-safe, composable asynchronous programming
- **Doobie** - Type-safe database access
- **tapir + ZIO HTTP** - Type-safe HTTP APIs
- **iText7** - PDF generation
- **PostgreSQL** - Database
- **Kafka** - Event streaming
- **Google Cloud Storage** - File storage
- **Docker & Kubernetes** - Containerization and orchestration
- **Testcontainers** - Integration testing

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Kafka     │    │   Service   │    │   GCP       │
│   Events    │───▶│   (ZIO)     │───▶│   Storage   │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ PostgreSQL  │
                   │   Database  │
                   └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   REST API  │
                   │   (tapir)   │
                   └─────────────┘
```

## Quick Start

### Prerequisites

- Java 17+
- sbt 1.11.3+
- Docker & Docker Compose
- Python 3 (for testing scripts)
- `requests` library: `pip install requests`
- Google Cloud SDK (for GCP deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice-generator-service
   ```

2. **Start dependencies with Docker Compose**
   ```bash
   python scripts/dev.py start
   ```
   This starts PostgreSQL, Kafka, Zookeeper, and **fake-gcs-server** for local GCP emulation.

3. **Initialize fake-gcs-server bucket (optional)**
   ```bash
   python scripts/dev.py init-gcs
   ```
   This creates the required bucket in the fake GCS server.

4. **Configure the application**
   ```bash
   # The application is pre-configured for local development
   # Edit src/main/resources/application.conf if needed
   vim src/main/resources/application.conf
   ```

5. **Run the application**
   ```bash
   python scripts/dev.py run
   ```

6. **Send test events**
   ```bash
   # In a new terminal
   python scripts/send_events_docker.py
   ```

7. **Test the API**
   ```bash
   # In another terminal
   python scripts/test_api.py all
   ```

8. **Run tests**
   ```bash
   sbt test
   ```

**Quick Start (All-in-one):**
```bash
python scripts/dev.py dev
```
This command starts all dependencies, initializes the fake GCS bucket, and runs the application.

### Docker Compose Setup

The project includes a complete `docker-compose.yml` for local development with:

- **PostgreSQL** - Database
- **Kafka & Zookeeper** - Event streaming
- **fake-gcs-server** - GCP Storage emulation
- **Kafka UI** - Web interface for Kafka management
- **Adminer** - Database administration interface

The fake-gcs-server provides a local emulation of Google Cloud Storage, allowing you to develop and test without needing real GCP credentials or internet access.

**Services and Ports:**
- PostgreSQL: `localhost:5432`
- Kafka: `localhost:9092`
- fake-gcs-server: `localhost:4443`
- Kafka UI: `http://localhost:8080`
- Adminer: `http://localhost:8081`

**Initialize fake-gcs-server:**
```bash
python scripts/init_fake_gcs.py
```

## API Documentation

The service provides a REST API with the following endpoints:

### Get Invoice by ID
```http
GET /api/v1/invoices/{id}
```

### List Invoices by Company
```http
GET /api/v1/invoices/company/{companyId}?page=1&pageSize=20
```

### List Invoices by Date Range
```http
GET /api/v1/invoices/date-range?fromDate=2024-01-01T00:00:00&toDate=2024-01-31T23:59:59&page=1&pageSize=20
```

### Health Check
```http
GET /api/v1/health
```

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:8080/docs
```

## Testing with Example Events

The service includes 5 example invoice events for testing:

### Example Events
- **B2C Customer** (John Smith) - $499.98 USD
- **B2B Enterprise** (Enterprise Solutions Inc.) - $13,500.00 USD  
- **B2C Customer** (Sarah Johnson) - $99.99 USD
- **B2B International** (Global Manufacturing Ltd.) - $21,000.00 CAD
- **B2B Startup** (Innovation Labs) - $750.00 USD

### Quick Testing
```bash
# Send all example events
python scripts/send_events_docker.py

# Send specific event
python scripts/send_events_docker.py --single 550e8400-e29b-41d4-a716-446655440001

# Test API endpoints
python scripts/test_api.py all
```

For comprehensive testing instructions, see [TESTING.md](TESTING.md).

For detailed fake-gcs-server setup and usage, see [FAKE_GCS_SETUP.md](FAKE_GCS_SETUP.md).

## Configuration

The application uses TypeSafe Config for configuration management. The default configuration is set up for local development with fake-gcs-server.

### Local Development Configuration

```hocon
app {
  database {
    url = "jdbc:postgresql://localhost:5432/invoice_generator"
    username = "postgres"
    password = "password"
    driver = "org.postgresql.Driver"
    maxConnections = 10
  }
  
  kafka {
    bootstrapServers = "localhost:9092"
    topic = "invoice-events"
    groupId = "invoice-generator-service"
    autoOffsetReset = "earliest"
  }
  
  gcp {
    projectId = "fake-project-id"
    bucketName = "invoice-pdfs"
    credentialsPath = null
    endpoint = "http://localhost:4443"  # fake-gcs-server endpoint
  }
  
  server {
    host = "0.0.0.0"
    port = 8080
  }
}
```

### Production Configuration

For production deployment, update the GCP configuration:

```hocon
app.gcp {
  projectId = "your-gcp-project-id"
  bucketName = "invoice-pdfs"
  credentialsPath = "/path/to/service-account-key.json"
  endpoint = null  # Use default GCP endpoints
}
```

## Deployment

### Docker

1. **Build the Docker image**
   ```bash
   docker build -t invoice-generator-service .
   ```

2. **Run the container**
   ```bash
   docker run -p 8080:8080 invoice-generator-service
   ```

### Kubernetes (GCP)

1. **Set up GKE cluster**
   ```bash
   gcloud container clusters create invoice-generator-cluster \
     --zone=us-central1-a \
     --num-nodes=3 \
     --machine-type=e2-standard-2
   ```

2. **Configure kubectl**
   ```bash
   gcloud container clusters get-credentials invoice-generator-cluster --zone=us-central1-a
   ```

3. **Create secrets and configs**
   ```bash
   kubectl apply -f k8s/config.yaml
   ```

4. **Deploy the application**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

5. **Verify deployment**
   ```bash
   kubectl get pods
   kubectl get services
   ```

### GCP Setup

1. **Enable required APIs**
   ```bash
   gcloud services enable container.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

2. **Create service account**
   ```bash
   gcloud iam service-accounts create invoice-generator-sa \
     --display-name="Invoice Generator Service Account"
   ```

3. **Grant permissions**
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:invoice-generator-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"
   ```

4. **Create and download key**
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=invoice-generator-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

## Testing

### Unit Tests
```bash
sbt test
```

### Integration Tests
```bash
sbt it:test
```

### Test Coverage
```bash
sbt coverage test coverageReport
```

## Local GCP Emulation with fake-gcs-server

The project uses [fake-gcs-server](https://github.com/fsouza/fake-gcs-server) to provide a local emulation of Google Cloud Storage. This allows you to develop and test the application without needing real GCP credentials or internet access.

### Features
- **Local Storage**: All files are stored in memory during development
- **GCS API Compatibility**: Implements the Google Cloud Storage API
- **No Credentials Required**: Works without GCP service account keys
- **Easy Setup**: Automatically configured in docker-compose.yml

### Usage

1. **Start the fake-gcs-server:**
   ```bash
   python scripts/dev.py start
   ```

2. **Initialize the bucket:**
   ```bash
   python scripts/dev.py init-gcs
   ```

3. **Access the fake GCS API:**
   ```bash
   # List buckets
   curl http://localhost:4443/storage/v1/b
   
   # List objects in bucket
   curl http://localhost:4443/storage/v1/b/invoice-pdfs/o
   ```

### Configuration

The application is pre-configured to use fake-gcs-server for local development:

```hocon
app.gcp {
  endpoint = "http://localhost:4443"  # fake-gcs-server endpoint
  projectId = "fake-project-id"
  bucketName = "invoice-pdfs"
  credentialsPath = null
}
```

For production, set `endpoint = null` to use real GCP endpoints.

## Monitoring & Observability

### Health Checks
The service provides health check endpoints:
- `/api/v1/health` - Application health
- `/api/v1/ready` - Readiness probe

### Logging
Structured logging with SLF4J and Logback:
- Console output for development
- File rotation for production
- JSON format for log aggregation

### Metrics
The service exposes metrics for:
- HTTP request/response times
- Database connection pool status
- Kafka consumer lag
- PDF generation performance

## Development

### Project Structure
```
src/
├── main/
│   ├── scala/
│   │   ├── api/           # REST API layer
│   │   ├── config/        # Configuration
│   │   ├── db/           # Database layer
│   │   ├── domain/       # Domain models
│   │   ├── repository/   # Data access layer
│   │   ├── service/      # Business logic
│   │   └── Main.scala    # Application entry point
│   └── resources/
│       ├── application.conf
│       ├── logback.xml
│       └── db/migration/ # Flyway migrations
└── test/
    ├── scala/
    │   ├── service/      # Unit tests
    │   └── integration/  # Integration tests
    └── resources/
        └── test.conf
```

### Code Style
- Follow Scala 3 best practices
- Use functional programming principles
- Implement proper error handling with ZIO
- Write comprehensive tests
- Use meaningful names and documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:
- Create an issue in the repository
- Contact the development team
- Check the documentation and examples
