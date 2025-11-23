# Library Service

A production-ready book library service built with Rust, providing APIs for managing books, users, and loans, with Kafka integration for event-driven book updates.

## Features

- **Book Management**: Create, read, update, delete, and search books by author, genre, title, or ISBN
- **User Management**: Support for librarians and library users with password authentication
- **Loan Management**: Loan and return books with automatic copy tracking
- **Authentication**: JWT-based authentication with role-based access control
- **Caching**: Redis caching for improved performance on frequently accessed data
- **Kafka Integration**: Subscribe to book events (added, loaned, returned, removed)
- **RESTful API**: Clean HTTP API with proper error handling and validation
- **Enhanced Logging**: Structured logging with request tracing and OpenTelemetry support
- **Production Ready**: Comprehensive error handling, logging, health checks, and observability

## Architecture

The service follows a 3-layer architecture:

1. **Routes (Controllers)**: Handle HTTP requests, validation, and error transformation
2. **Services**: Contain all business logic
3. **DAL (Data Access Layer)**: Handle all database queries and SQL operations

### Technology Stack

- **Language**: Rust 1.91.1 (edition 2021)
- **Web Framework**: Axum
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (jsonwebtoken) with Argon2 password hashing
- **Message Queue**: Apache Kafka
- **Logging**: Tracing with structured logging and OpenTelemetry
- **Containerization**: Docker
- **Orchestration**: Kubernetes (kind for local testing)

## Quick Start

### Prerequisites

- Rust 1.91.1+ (or latest stable)
- Docker and Docker Compose
- PostgreSQL client (optional, for direct database access)
- Redis client (optional, for cache inspection)

### Local Development Setup

1. **Start dependencies**:
   ```bash
   docker-compose up -d
   ```

2. **Set environment variables** (optional, defaults are provided):
   ```bash
   export DATABASE_URL="postgresql://library_user:library_pass@localhost:5432/library_db"
   export REDIS_URL="redis://localhost:6379"
   export KAFKA_BROKERS="localhost:9092"
   export KAFKA_TOPIC="book-events"
   export JWT_SECRET="your-secret-key-change-in-production"
   export CACHE_TTL_SECONDS="3600"
   export SERVER_ADDRESS="0.0.0.0:3000"
   export RUST_LOG="info"  # or "debug" for more verbose logging
   ```

3. **Run migrations** (automatically runs on startup):
   The service will automatically run migrations on startup. Alternatively, you can use sqlx-cli:
   ```bash
   cargo install sqlx-cli --features postgres
   sqlx migrate run
   ```

4. **Run the service**:
   ```bash
   cargo run
   ```

5. **Test the API**:
   ```bash
   curl http://localhost:3000/health
   ```

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Authentication
- `POST /api/v1/auth/login` - Login and receive JWT token
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Books
- `POST /api/v1/books` - Create a new book
- `GET /api/v1/books/:id` - Get book by ID (cached)
- `GET /api/v1/books/search?author=...&genre=...&title=...&isbn=...` - Search books (cached)
- `PUT /api/v1/books/:id` - Update a book
- `DELETE /api/v1/books/:id` - Delete a book

### Users
- `POST /api/v1/users` - Create a new user (requires password)
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "password": "securepassword123"
  }
  ```
- `GET /api/v1/users/:id` - Get user by ID (cached)

### Loans
- `POST /api/v1/loans` - Create a new loan
- `POST /api/v1/loans/:id/return` - Return a book
- `GET /api/v1/loans/user?user_id=...` - Get loans for a user

## Example API Usage

### Create a Book
```bash
curl -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-0-123456-78-9",
    "title": "The Rust Programming Language",
    "author": "Steve Klabnik",
    "genre": "Programming",
    "published_year": 2018,
    "total_copies": 5,
    "available_copies": 5
  }'
```

### Search Books
```bash
curl "http://localhost:3000/api/v1/books/search?author=Steve&genre=Programming"
```

### Create a User
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "password": "securepassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

Response includes JWT token:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "user"
}
```

### Use JWT Token
```bash
curl -X GET http://localhost:3000/api/v1/books/search?author=Steve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Loan a Book
```bash
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "BOOK_UUID",
    "user_id": "USER_UUID",
    "loan_days": 14
  }'
```

## Kafka Events

The service subscribes to Kafka topic `book-events` (configurable) and handles the following event types:

### Book Added
```json
{
  "event_type": "book_added",
  "isbn": "978-0-123456-78-9",
  "title": "Book Title",
  "author": "Author Name",
  "genre": "Genre",
  "published_year": 2023,
  "total_copies": 5
}
```

### Book Loaned
```json
{
  "event_type": "book_loaned",
  "book_id": "uuid",
  "user_id": "uuid"
}
```

### Book Returned
```json
{
  "event_type": "book_returned",
  "book_id": "uuid",
  "user_id": "uuid"
}
```

### Book Removed
```json
{
  "event_type": "book_removed",
  "book_id": "uuid"
}
```

## Testing

### Unit Tests
```bash
cargo test
```

### Integration Tests
Integration tests require running dependencies. Start dependencies first:
```bash
docker-compose up -d
# Wait for services to be ready
sleep 10

# Run all integration tests
cargo test --test integration_test -- --ignored
cargo test --test auth_test -- --ignored
cargo test --test cache_test -- --ignored
```

## Deployment

### Local Testing with Kind

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions on deploying to kind (Kubernetes in Docker) for local testing.

### AWS Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for AWS deployment instructions.

## Project Structure

```
library-service/
├── src/
│   ├── main.rs           # Application entry point
│   ├── lib.rs            # Library exports
│   ├── config.rs          # Configuration management
│   ├── error.rs           # Error types and handling
│   ├── dal/               # Data Access Layer
│   │   ├── database.rs   # Database connection
│   │   ├── book.rs       # Book repository
│   │   ├── user.rs       # User repository
│   │   └── loan.rs       # Loan repository
│   ├── service/           # Business logic layer
│   │   ├── book.rs       # Book service
│   │   ├── user.rs       # User service
│   │   └── loan.rs       # Loan service
│   ├── routes/            # HTTP routes/controllers
│   │   ├── book.rs       # Book endpoints
│   │   ├── user.rs       # User endpoints
│   │   └── loan.rs       # Loan endpoints
│   └── kafka/             # Kafka consumer
│       └── mod.rs        # Event handling
├── migrations/            # Database migrations
├── tests/                 # Integration tests
├── k8s/                   # Kubernetes manifests
├── docker-compose.yml     # Local development setup
├── Dockerfile            # Container image
└── Cargo.toml            # Rust dependencies
```

## Development Guidelines

### Code Style

- Follow Rust community best practices
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting

### Error Handling

- Use `AppError` enum for application errors
- Transform database errors appropriately
- Return proper HTTP status codes

### Database Migrations

Migrations are located in `migrations/` directory and are automatically run on application startup.

### Logging

The service uses `tracing` for structured logging. Set `RUST_LOG` environment variable to control log levels:
```bash
export RUST_LOG=info
export RUST_LOG=debug  # for more verbose logging
```

## Contributing

1. Follow the 3-layer architecture pattern
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

[Add your license here]

