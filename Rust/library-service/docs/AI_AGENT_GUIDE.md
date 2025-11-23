# AI Agent Guide

This document provides essential information for AI agents working with this codebase.

## Project Overview

**Library Service** - A production-ready Rust microservice for managing a book library with:
- RESTful API for books, users, and loans
- Kafka event consumption for book updates
- PostgreSQL database
- 3-layer architecture (Routes → Services → DAL)

## Key Architecture Principles

1. **Separation of Concerns**:
   - Routes: HTTP handling, validation, error transformation
   - Services: Business logic, rules, orchestration
   - DAL: Database queries, SQL only

2. **Error Handling**:
   - `AppError` enum for all application errors
   - Automatic HTTP status code mapping
   - Errors logged but sanitized in responses

3. **Database**:
   - Migrations in `migrations/` directory
   - Auto-run on startup
   - Type-safe queries with sqlx

4. **Kafka**:
   - Consumes `book-events` topic
   - Handles: book_added, book_loaned, book_returned, book_removed
   - Async processing, errors logged but don't crash service

## File Structure

```
src/
├── main.rs              # Entry point, server setup, Kafka consumer spawn
├── lib.rs               # Library exports for tests
├── config.rs            # Environment-based configuration
├── error.rs             # AppError enum and HTTP error transformation
├── dal/                 # Data Access Layer
│   ├── database.rs      # Connection pool, migrations
│   ├── book.rs          # Book repository (CRUD, search)
│   ├── user.rs          # User repository
│   └── loan.rs          # Loan repository
├── service/             # Business Logic Layer
│   ├── book.rs          # Book business rules
│   ├── user.rs          # User business rules
│   └── loan.rs          # Loan business rules (loan/return logic)
├── routes/              # HTTP Routes/Controllers
│   ├── book.rs          # Book endpoints
│   ├── user.rs          # User endpoints
│   └── loan.rs          # Loan endpoints
└── kafka/               # Kafka Consumer
    └── mod.rs           # Event handling, message processing
```

## Common Patterns

### Adding a New Endpoint

1. Add handler in `routes/{resource}.rs`
2. Add request/response types with validation
3. Call service method
4. Transform errors to HTTP responses
5. Register route in `routes/mod.rs`

### Adding Business Logic

1. Add method to `service/{resource}.rs`
2. Implement business rules
3. Call repository methods
4. Handle errors appropriately

### Adding Database Query

1. Add method to `dal/{resource}.rs`
2. Use parameterized queries (sqlx)
3. Return domain models
4. Handle sqlx::Error

## Key Dependencies

- `axum` - Web framework
- `sqlx` - Database (PostgreSQL)
- `rdkafka` - Kafka client
- `serde` - Serialization
- `validator` - Request validation
- `tracing` - Logging
- `uuid` - UUID generation
- `chrono` - Date/time handling

## Environment Variables

- `SERVER_ADDRESS` - HTTP server address (default: 0.0.0.0:3000)
- `DATABASE_URL` - PostgreSQL connection string
- `KAFKA_BROKERS` - Kafka broker addresses (default: localhost:9092)
- `KAFKA_TOPIC` - Kafka topic name (default: book-events)
- `KAFKA_GROUP_ID` - Consumer group ID (default: library-service)
- `RUST_LOG` - Log level (default: info)

## Testing

- Unit tests: `cargo test`
- Integration tests: `cargo test --test integration_test -- --ignored` (requires database)
- Tests use real database, clean up after themselves

## Database Schema

- `users` - Librarians and library users (role: 'librarian' or 'user')
- `books` - Books with ISBN, title, author, genre, copies tracking
- `loans` - Loan records linking users and books (status: 'active', 'returned', 'overdue')

## Kafka Events

Events are JSON with `event_type` field:
- `book_added` - {isbn, title, author, genre, published_year, total_copies}
- `book_loaned` - {book_id, user_id}
- `book_returned` - {book_id, user_id}
- `book_removed` - {book_id}

## Common Tasks for AI Agents

### "Add a new endpoint"
1. Check existing routes for pattern
2. Add handler function
3. Add request/response types
4. Register route
5. Add tests

### "Fix a bug"
1. Identify layer (route/service/dal)
2. Check error handling
3. Verify business rules
4. Check database constraints
5. Add test case

### "Add a feature"
1. Design database schema (if needed)
2. Add migration
3. Add DAL methods
4. Add service methods
5. Add routes
6. Add tests

### "Optimize performance"
1. Check database queries (indexes, N+1)
2. Review connection pooling
3. Check Kafka consumer lag
4. Profile with cargo flamegraph

## Important Notes

- All SQL uses parameterized queries (sqlx) - no SQL injection risk
- Services are stateless - can scale horizontally
- Database connection pool size: 10 (configurable)
- Migrations run automatically on startup
- Kafka consumer runs in background task
- Health check endpoint: `/health`

## Quick Reference

```rust
// Create repository
let repo = BookRepository::new(db.pool());

// Create service
let service = BookService::new(db);

// Handle error
return Err(AppError::NotFound("Resource not found".to_string()));

// Validate request
payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;
```

## Documentation Files

- `README.md` - Overview and quick start
- `docs/QUICK_START.md` - 5-minute setup guide
- `docs/API_EXAMPLES.md` - API usage examples
- `docs/ARCHITECTURE.md` - Detailed architecture
- `docs/DEVELOPMENT.md` - Development guide
- `docs/DEPLOYMENT.md` - Deployment instructions (kind, AWS)

## When Making Changes

1. Follow 3-layer architecture
2. Keep business logic in services
3. Keep SQL in DAL
4. Validate inputs in routes
5. Handle errors appropriately
6. Write tests
7. Update documentation

