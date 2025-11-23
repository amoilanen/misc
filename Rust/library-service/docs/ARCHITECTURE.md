# Architecture Documentation

## Overview

The Library Service is a RESTful API service built with Rust, following a clean 3-layer architecture pattern. It provides book management, user management, and loan tracking capabilities, with event-driven updates via Kafka.

## Architecture Layers

### 1. Routes Layer (Controllers)

**Location**: `src/routes/`

**Responsibilities**:
- HTTP request/response handling
- Request validation using `validator` crate
- Error transformation to appropriate HTTP status codes
- JSON serialization/deserialization

**Key Files**:
- `routes/book.rs` - Book endpoints
- `routes/user.rs` - User endpoints
- `routes/loan.rs` - Loan endpoints
- `routes/mod.rs` - Router configuration

**Design Principles**:
- Routes are thin - they only handle HTTP concerns
- All validation happens at this layer
- Business logic is delegated to services
- Errors are transformed using `AppError` enum

### 2. Service Layer (Business Logic)

**Location**: `src/service/`

**Responsibilities**:
- All business logic and rules
- Transaction coordination
- Validation of business rules
- Orchestration of multiple DAL operations

**Key Files**:
- `service/book.rs` - Book business logic
- `service/user.rs` - User business logic
- `service/loan.rs` - Loan business logic

**Design Principles**:
- Services contain all business rules
- Services coordinate between repositories
- Services handle business-level validation
- Services are stateless

**Example Business Rules**:
- Available copies cannot exceed total copies
- Cannot delete books with active loans
- Cannot loan unavailable books
- Users cannot have duplicate active loans for the same book

### 3. DAL Layer (Data Access)

**Location**: `src/dal/`

**Responsibilities**:
- Database connection management
- SQL queries and statements
- Data mapping between database and domain models
- Transaction management

**Key Files**:
- `dal/database.rs` - Database connection pool
- `dal/book.rs` - Book repository
- `dal/user.rs` - User repository
- `dal/loan.rs` - Loan repository

**Design Principles**:
- All SQL is contained in this layer
- Repositories are focused on data access only
- No business logic in DAL
- Uses sqlx for type-safe queries

## Data Flow

```
HTTP Request
    ↓
Routes (Validation, Error Handling)
    ↓
Service (Business Logic)
    ↓
DAL (Database Queries)
    ↓
PostgreSQL Database
```

## Database Schema

### Tables

1. **users**
   - Stores librarians and library users
   - Roles: 'librarian' or 'user'
   - Unique email constraint

2. **books**
   - Stores book information
   - Tracks total and available copies
   - Indexed on ISBN, author, genre, title

3. **loans**
   - Tracks book loans
   - Status: 'active', 'returned', 'overdue'
   - Foreign keys to books and users

### Relationships

- One user can have many loans
- One book can have many loans
- Loans reference both users and books

## Kafka Integration

### Event Types

The service subscribes to Kafka topic `book-events` and handles:

1. **book_added**: Creates or updates a book
2. **book_loaned**: Creates a loan record and decrements available copies
3. **book_returned**: Marks loan as returned and increments available copies
4. **book_removed**: Deletes a book (if no active loans)

### Event Processing

- Events are processed asynchronously
- Errors are logged but don't crash the service
- Idempotent operations where possible

## Error Handling

### Error Types

`AppError` enum covers:
- `Database` - SQL errors
- `NotFound` - Resource not found (404)
- `Validation` - Invalid input (400)
- `BadRequest` - Malformed request (400)
- `Conflict` - Business rule violation (409)
- `Internal` - Unexpected errors (500)

### Error Flow

1. DAL errors are wrapped in `AppError::Database`
2. Service layer converts to appropriate `AppError` variants
3. Routes transform `AppError` to HTTP responses

## Configuration

Configuration is loaded from environment variables with sensible defaults:

- `SERVER_ADDRESS` - HTTP server bind address
- `DATABASE_URL` - PostgreSQL connection string
- `KAFKA_BROKERS` - Kafka broker addresses
- `KAFKA_TOPIC` - Kafka topic name
- `KAFKA_GROUP_ID` - Kafka consumer group ID

## Concurrency and Scalability

### Database Connection Pooling

- Uses sqlx connection pool
- Configurable max connections (default: 10)
- Connection reuse for efficiency

### Stateless Design

- Services are stateless
- Can scale horizontally
- No in-memory state between requests

### Kafka Consumer

- Single consumer per instance
- Kafka handles message distribution across instances
- Consumer group ensures load balancing

## Security Considerations

### Input Validation

- All inputs validated using `validator` crate
- SQL injection prevention via parameterized queries (sqlx)
- Type safety through Rust's type system

### Error Messages

- Internal errors don't expose implementation details
- User-facing errors are sanitized
- Detailed errors logged server-side

## Testing Strategy

### Unit Tests

- Test business logic in isolation
- Mock dependencies where needed
- Located in `tests/` directory

### Integration Tests

- Test full request/response cycle
- Require running database
- Test real SQL queries
- Located in `tests/integration_test.rs`

### Test Data

- Each test should clean up after itself
- Use transactions where possible
- Isolated test data

## Deployment Architecture

### Local Development

- Docker Compose for dependencies
- Direct Rust binary execution
- Hot reload during development

### Kubernetes Deployment

- Stateless pods (can scale horizontally)
- ConfigMap for configuration
- Persistent volumes for PostgreSQL
- StatefulSets for Kafka/Zookeeper
- Service discovery via Kubernetes DNS

### AWS Deployment

- EKS for Kubernetes orchestration
- RDS for managed PostgreSQL
- MSK for managed Kafka
- ALB for load balancing
- Auto-scaling based on CPU/memory

## Performance Considerations

### Database

- Indexes on frequently queried columns
- Connection pooling
- Efficient queries (avoid N+1 problems)

### API

- Async/await for non-blocking I/O
- Efficient serialization
- Proper HTTP status codes for caching

### Kafka

- Async message processing
- Batch processing where possible
- Consumer group for parallel processing

## Monitoring and Observability

### Logging

- Structured logging with `tracing`
- Log levels: ERROR, WARN, INFO, DEBUG
- Request tracing for debugging

### Health Checks

- `/health` endpoint for liveness/readiness probes
- Database connectivity check (implicit)
- Kafka connectivity check (implicit)

### Metrics

- HTTP request metrics (via tower-http)
- Database query metrics (via sqlx)
- Kafka consumer lag (via rdkafka)

## Future Enhancements

Potential improvements:

1. **Caching**: Redis for frequently accessed books
2. **Search**: Full-text search with Elasticsearch
3. **Authentication**: JWT-based auth for API
4. **Rate Limiting**: Protect against abuse
5. **API Versioning**: Support multiple API versions
6. **GraphQL**: Alternative to REST API
7. **WebSockets**: Real-time updates
8. **Event Sourcing**: Complete event history

