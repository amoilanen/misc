# Invoice Generator Service

A microservice that consumes invoice events from Kafka, generates PDF invoices, stores them in Google Cloud Storage, and exposes a REST API for retrieval. Built with Scala 3, ZIO, and deployed to Kubernetes.

## Architecture

```
                          +-----------------+
  Kafka (invoice-events)  |                 |
  ----------------------->| Invoice Service |---> PostgreSQL
                          |                 |---> GCS (PDF storage)
  REST API (Tapir/ZIO HTTP)|                 |---> Jaeger (traces)
  <---------------------->|                 |
                          +-----------------+
```

**Core components:**

| Component | Description |
|---|---|
| `InvoiceEventConsumer` | Kafka consumer that listens to `invoice-events` topic |
| `InvoiceService` | Business logic: event processing, PDF generation, storage |
| `InvoiceServer` | REST API endpoints via Tapir + ZIO HTTP |
| `InvoiceRepository` | PostgreSQL persistence via Doobie |
| `PdfGenerator` | PDF rendering via iText 7 |
| `StorageService` | Google Cloud Storage client |
| `Tracing` | OpenTelemetry integration (optional, via Jaeger) |

## Technology Stack

- **Language**: Scala 3.7.1
- **Effect system**: ZIO 2.1.3
- **HTTP**: ZIO HTTP 3.0.0-RC5 + Tapir 1.10.0
- **Database**: PostgreSQL 15 + Doobie 1.0.0-RC5 + Flyway
- **Messaging**: Apache Kafka via ZIO Kafka
- **PDF**: iText 7
- **Storage**: Google Cloud Storage
- **Observability**: OpenTelemetry + Jaeger
- **Testing**: ZIO Test + TestContainers

## Local Development

### Prerequisites

- JDK 17+
- sbt 1.11+
- Docker and Docker Compose

### Start infrastructure

```bash
docker compose up -d
```

This starts:

| Service | URL/Port |
|---|---|
| PostgreSQL | `localhost:5432` |
| Kafka | `localhost:9092` |
| Kafka UI | `http://localhost:8082` |
| Fake GCS Server | `http://localhost:4443` |
| Jaeger UI | `http://localhost:16686` |
| Adminer (DB UI) | `http://localhost:8081` |

### Run the application

```bash
sbt run
```

The service starts on `http://localhost:8080`. Database migrations run automatically on startup.

### Run tests

```bash
# All tests (requires Docker for integration tests)
sbt test

# Unit tests only
sbt "testOnly service.PdfGeneratorSpec"
```

### Send a test event

Produce a message to the `invoice-events` Kafka topic:

```bash
echo '{
  "id": "evt-001",
  "companyId": "company-1",
  "customerId": "cust-001",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerAddress": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "country": "US"
  },
  "invoiceType": "B2C",
  "items": [
    {
      "description": "Widget",
      "quantity": 2,
      "unitPrice": 25.00,
      "totalPrice": 50.00
    }
  ],
  "totalAmount": 50.00,
  "currency": "USD",
  "issuedAt": "2024-06-01T10:00:00",
  "dueDate": "2024-07-01T10:00:00",
  "metadata": {}
}' | docker compose exec -T kafka kafka-console-producer \
  --broker-list localhost:9092 \
  --topic invoice-events
```

## API Endpoints

Base URL: `http://localhost:8080`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/invoices/{id}` | Get invoice by ID |
| `GET` | `/api/v1/invoices/company/{companyId}?page=1&pageSize=20` | List invoices by company |
| `GET` | `/api/v1/invoices/date-range?fromDate=...&toDate=...&page=1&pageSize=20` | List invoices by date range |
| `GET` | `/api/v1/invoices/{id}/pdf` | Download invoice PDF |
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/docs` | Swagger UI |

### Example requests

```bash
# Get an invoice
curl http://localhost:8080/api/v1/invoices/<invoice-id>

# List by company
curl "http://localhost:8080/api/v1/invoices/company/company-1?page=1&pageSize=10"

# Download PDF
curl -o invoice.pdf http://localhost:8080/api/v1/invoices/<invoice-id>/pdf

# Health check
curl http://localhost:8080/api/v1/health
```

## Configuration

All configuration is in `src/main/resources/application.conf` and can be overridden via environment variables:

| Environment Variable | Description | Default |
|---|---|---|
| `APP_DATABASE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/invoice_generator` |
| `APP_DATABASE_USERNAME` | Database username | `postgres` |
| `APP_DATABASE_PASSWORD` | Database password | `password` |
| `APP_DATABASE_DRIVER` | JDBC driver class | `org.postgresql.Driver` |
| `APP_DATABASE_MAX_CONNECTIONS` | Connection pool size | `10` |
| `APP_KAFKA_BOOTSTRAP_SERVERS` | Kafka bootstrap servers | `localhost:9092` |
| `APP_KAFKA_TOPIC` | Kafka topic name | `invoice-events` |
| `APP_KAFKA_GROUP_ID` | Consumer group ID | `invoice-generator-service` |
| `APP_KAFKA_AUTO_OFFSET_RESET` | Auto offset reset strategy | `earliest` |
| `APP_GCP_PROJECT_ID` | GCP project ID | `fake-project-id` |
| `APP_GCP_BUCKET_NAME` | GCS bucket name | `invoice-pdfs` |
| `APP_GCP_CREDENTIALS_PATH` | Path to GCP credentials JSON | (none) |
| `APP_GCP_ENDPOINT` | GCS endpoint (for local dev) | `http://localhost:4443` |
| `APP_SERVER_HOST` | HTTP server bind host | `0.0.0.0` |
| `APP_SERVER_PORT` | HTTP server port | `8080` |
| `APP_TELEMETRY_ENABLED` | Enable OpenTelemetry tracing | `false` |
| `APP_TELEMETRY_ENDPOINT` | OTLP gRPC endpoint | `http://localhost:4317` |
| `APP_TELEMETRY_SERVICE_NAME` | Service name for traces | `invoice-generator-service` |

## Project Structure

```
src/main/scala/
  api/
    InvoiceEndpoints.scala   # Tapir endpoint definitions
    InvoiceServer.scala      # Server implementation
  config/
    AppConfig.scala          # Configuration case classes
  db/
    DatabaseLayer.scala      # HikariCP + Flyway setup
  domain/
    Invoice.scala            # Domain model, opaque types, enums
  repository/
    InvoiceRepository.scala  # Doobie-based persistence
  service/
    InvoiceService.scala     # Core business logic
    InvoiceEventConsumer.scala # Kafka consumer
    PdfGenerator.scala       # iText PDF generation
    StorageService.scala     # GCS client
  telemetry/
    Tracing.scala            # OpenTelemetry setup
  Main.scala                 # Application entry point

src/test/scala/
  integration/               # Integration tests (TestContainers)
  repository/                # Repository tests (TestContainers)
  service/                   # Unit tests

k8s/
  deployment.yaml            # K8s Deployment + Service
  config.yaml                # ConfigMap + Secret template
```

## Building

```bash
# Compile
sbt compile

# Run tests
sbt test

# Build fat JAR
sbt assembly

# Build Docker image
docker build -t invoice-generator-service .
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for Kubernetes deployment instructions.
