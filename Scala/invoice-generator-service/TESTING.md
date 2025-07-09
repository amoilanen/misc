# Testing Guide - Invoice Generator Service

This guide provides comprehensive instructions for testing the Invoice Generator Service using the provided example invoice events.

## Prerequisites

Before testing, ensure you have the following installed:
- Docker and Docker Compose
- Python 3 (for testing scripts)
- `requests` library: `pip install requests`

## Quick Start Testing

### 1. Start the Service and Dependencies

```bash
# Start all dependencies (PostgreSQL, Kafka, Zookeeper)
python scripts/dev.py start

# Wait for services to be ready (about 30 seconds)
sleep 30

# Start the application
python scripts/dev.py run
```

### 2. Send Test Events

In a new terminal, send the example invoice events to Kafka:

```bash
# Send all test events
python scripts/send_events_docker.py

# Or send a specific event
python scripts/send_events_docker.py --single 550e8400-e29b-41d4-a716-446655440001
```

### 3. Test the API

In another terminal, test the REST API endpoints:

```bash
# Run all API tests
python scripts/test_api.py all

# Or test specific endpoints
python scripts/test_api.py health
python scripts/test_api.py company
python scripts/test_api.py date-range
```

## Example Invoice Events

The service includes 5 example invoice events in `examples/invoice-events.json`:

### Event 1: B2C Customer (John Smith)
- **Company**: acme-corp
- **Customer**: John Smith (B2C)
- **Items**: Premium Software License + Technical Support
- **Total**: $499.98 USD

### Event 2: B2B Enterprise (Enterprise Solutions Inc.)
- **Company**: tech-startup
- **Customer**: Enterprise Solutions Inc. (B2B)
- **Items**: 100 Enterprise Licenses + Custom Integration + Priority Support
- **Total**: $13,500.00 USD

### Event 3: B2C Customer (Sarah Johnson)
- **Company**: acme-corp
- **Customer**: Sarah Johnson (B2C)
- **Items**: Basic Software License
- **Total**: $99.99 USD

### Event 4: B2B International (Global Manufacturing Ltd.)
- **Company**: global-consulting
- **Customer**: Global Manufacturing Ltd. (B2B)
- **Items**: Consulting Services + Training Workshop
- **Total**: $21,000.00 CAD

### Event 5: B2B Startup (Innovation Labs)
- **Company**: tech-startup
- **Customer**: Innovation Labs (B2B)
- **Items**: Startup Package + Setup Services
- **Total**: $750.00 USD

## Testing Scenarios

### Scenario 1: End-to-End Invoice Processing

1. **Start the service**:
   ```bash
   python scripts/dev.py dev
   ```

2. **Send test events**:
   ```bash
   python scripts/send_events_docker.py
   ```

3. **Verify processing**:
   - Check application logs for processing messages
   - Verify invoices are stored in the database
   - Check that PDFs are generated and stored

4. **Test API endpoints**:
   ```bash
   python scripts/test_api.py all
   ```

### Scenario 2: Company-Specific Queries

Test retrieving invoices for specific companies:

```bash
# Test acme-corp invoices
curl "http://localhost:8080/api/v1/invoices/company/acme-corp?page=1&pageSize=10"

# Test tech-startup invoices
curl "http://localhost:8080/api/v1/invoices/company/tech-startup?page=1&pageSize=10"
```

Expected results:
- **acme-corp**: 2 invoices (John Smith, Sarah Johnson)
- **tech-startup**: 2 invoices (Enterprise Solutions, Innovation Labs)

### Scenario 3: Date Range Queries

Test retrieving invoices within specific date ranges:

```bash
# January 15-20, 2024
curl "http://localhost:8080/api/v1/invoices/date-range?fromDate=2024-01-15T00:00:00&toDate=2024-01-20T23:59:59&page=1&pageSize=10"

# January 15-16, 2024 (should return 2 invoices)
curl "http://localhost:8080/api/v1/invoices/date-range?fromDate=2024-01-15T00:00:00&toDate=2024-01-16T23:59:59&page=1&pageSize=10"
```

### Scenario 4: Pagination Testing

Test pagination with different page sizes:

```bash
# Page 1 with 2 items per page
curl "http://localhost:8080/api/v1/invoices/company/acme-corp?page=1&pageSize=2"

# Page 2 with 2 items per page
curl "http://localhost:8080/api/v1/invoices/company/acme-corp?page=2&pageSize=2"
```

### Scenario 5: Error Handling

Test error scenarios:

```bash
# Non-existent invoice
curl "http://localhost:8080/api/v1/invoices/00000000-0000-0000-0000-000000000000"

# Non-existent company
curl "http://localhost:8080/api/v1/invoices/company/non-existent-company?page=1&pageSize=10"

# Invalid date format
curl "http://localhost:8080/api/v1/invoices/date-range?fromDate=invalid-date&toDate=2024-01-20T23:59:59"
```

## Manual Testing with curl

### Health Check
```bash
curl -s http://localhost:8080/api/v1/health | jq
```

Expected response:
```json
{
  "status": "UP",
  "message": "Invoice Generator Service is running"
}
```

### Get Invoice by ID
```bash
# First, get an invoice ID from the company query
INVOICE_ID=$(curl -s "http://localhost:8080/api/v1/invoices/company/acme-corp?page=1&pageSize=1" | jq -r '.invoices[0].id')

# Then get the specific invoice
curl -s "http://localhost:8080/api/v1/invoices/$INVOICE_ID" | jq
```

### List Invoices by Company
```bash
curl -s "http://localhost:8080/api/v1/invoices/company/acme-corp?page=1&pageSize=10" | jq
```

Expected response structure:
```json
{
  "invoices": [
    {
      "id": "...",
      "companyId": "acme-corp",
      "customerName": "John Smith",
      "totalAmount": 499.98,
      "status": "Generated",
      "pdfUrl": "gs://bucket/invoices/acme-corp/...",
      ...
    }
  ],
  "totalCount": 2,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

### List Invoices by Date Range
```bash
curl -s "http://localhost:8080/api/v1/invoices/date-range?fromDate=2024-01-15T00:00:00&toDate=2024-01-20T23:59:59&page=1&pageSize=10" | jq
```

## Testing with Swagger UI

1. Open your browser and navigate to: `http://localhost:8080/docs`
2. You'll see the interactive Swagger UI with all available endpoints
3. Click on any endpoint to expand it
4. Click "Try it out" to test the endpoint
5. Fill in the required parameters
6. Click "Execute" to send the request

## Database Verification

You can verify that invoices are being stored correctly by connecting to the database:

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d invoice_generator

# List all invoices
SELECT id, company_id, customer_name, total_amount, status, created_at FROM invoices;

# Count invoices by company
SELECT company_id, COUNT(*) as invoice_count FROM invoices GROUP BY company_id;

# Check invoice status distribution
SELECT status, COUNT(*) as count FROM invoices GROUP BY status;
```

## Kafka Topic Verification

Check that events are being consumed from Kafka:

```bash
# List topics
docker-compose exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Check consumer group
docker-compose exec kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group invoice-generator-service

# View messages in the topic
docker-compose exec kafka kafka-console-consumer.sh --topic invoice-events --bootstrap-server localhost:9092 --from-beginning
```

## PDF Generation Verification

Check that PDFs are being generated and stored:

1. **Check application logs** for PDF generation messages
2. **Verify GCP Storage** (if configured) or check local storage
3. **Check database** for PDF URLs:
   ```sql
   SELECT id, pdf_url, status FROM invoices WHERE pdf_url IS NOT NULL;
   ```

## Performance Testing

### Load Testing with Multiple Events

Create a larger test file for load testing:

```bash
# Generate 100 test events
for i in {1..100}; do
  jq -c ".[0] | .id = \"$(uuidgen)\" | .customerName = \"Test Customer $i\"" examples/invoice-events.json
done > examples/load-test-events.json

# Send load test events
jq -c '.[]' examples/load-test-events.json | while read -r event; do
  echo "$event" | docker-compose exec -T kafka kafka-console-producer.sh \
    --topic invoice-events \
    --bootstrap-server localhost:9092
  sleep 0.1
done
```

### API Performance Testing

Test API response times:

```bash
# Test response time for company query
time curl -s "http://localhost:8080/api/v1/invoices/company/acme-corp?page=1&pageSize=10" > /dev/null

# Test with Apache Bench (if available)
ab -n 100 -c 10 "http://localhost:8080/api/v1/health"
```

## Troubleshooting

### Common Issues

1. **Kafka not running**:
   ```bash
   docker-compose ps | grep kafka
   docker-compose logs kafka
   ```

2. **Database connection issues**:
   ```bash
   docker-compose logs postgres
   docker-compose exec postgres pg_isready -U postgres
   ```

3. **Application not starting**:
   ```bash
   python scripts/dev.py check  # Check prerequisites
   sbt clean compile       # Clean and rebuild
   ```

4. **Events not being processed**:
   ```bash
   # Check Kafka topic
   docker-compose exec kafka kafka-topics.sh --describe --topic invoice-events --bootstrap-server localhost:9092
   
   # Check application logs
   docker-compose logs -f invoice-generator-service
   ```

### Debug Mode

Enable debug logging by modifying `src/main/resources/logback.xml`:

```xml
<root level="DEBUG">
  <appender-ref ref="STDOUT" />
  <appender-ref ref="FILE" />
</root>
```

## Continuous Testing

For continuous integration, you can run tests automatically:

```bash
# Run all tests
python scripts/dev.py test

# Run integration tests
python scripts/dev.py itest

# Run API tests
python scripts/test_api.py all
```

## Test Data Management

### Reset Test Data

To start fresh:

```bash
# Stop all services
python scripts/dev.py clean

# Start services (this will recreate the database)
python scripts/dev.py start

# Wait for services to be ready
sleep 30

# Start application
python scripts/dev.py run
```

### Custom Test Data

Create your own test events by modifying `examples/invoice-events.json` or creating new files:

```bash
# Create custom test file
cp examples/invoice-events.json examples/my-test-events.json

# Edit the file with your test data
# Then send your custom events
python scripts/send_events_docker.py --file examples/my-test-events.json
```

This testing guide provides comprehensive coverage of all aspects of the Invoice Generator Service. Use these examples and scripts to thoroughly test the functionality and ensure everything works as expected. 