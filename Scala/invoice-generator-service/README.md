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

3. **Configure the application**
   ```bash
   # Edit the configuration file with your settings
   vim src/main/resources/application.conf
   ```

4. **Run the application**
   ```bash
   python scripts/dev.py run
   ```

5. **Send test events**
   ```bash
   # In a new terminal
   python scripts/send_events_docker.py
   ```

6. **Test the API**
   ```bash
   # In another terminal
   python scripts/test_api.py all
   ```

7. **Run tests**
   ```bash
   sbt test
   ```

### Docker Compose Setup

Create a `docker-compose.yml` file for local development:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: invoice_generator
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"

  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

volumes:
  postgres_data:
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

## Configuration

The application uses TypeSafe Config for configuration management:

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
    projectId = "your-gcp-project-id"
    bucketName = "invoice-pdfs"
    credentialsPath = "/path/to/service-account-key.json"
  }
  
  server {
    host = "0.0.0.0"
    port = 8080
  }
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
