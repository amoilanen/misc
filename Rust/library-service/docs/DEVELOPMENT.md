# Development Guide

This guide covers local development setup, coding standards, and development workflows.

## Local Development Setup

### Prerequisites

- Rust 1.87+ (install via [rustup](https://rustup.rs/))
- Docker and Docker Compose
- PostgreSQL client (optional)
- Kafka client tools (optional)

### Initial Setup

1. **Clone the repository** (if applicable)

2. **Start dependencies**:
   ```bash
   docker-compose up -d
   ```

3. **Verify dependencies are running**:
   ```bash
   docker-compose ps
   ```

4. **Set up environment variables** (optional):
   ```bash
   export DATABASE_URL="postgresql://library_user:library_pass@localhost:5432/library_db"
   export KAFKA_BROKERS="localhost:9092"
   export KAFKA_TOPIC="book-events"
   export SERVER_ADDRESS="0.0.0.0:3000"
   export RUST_LOG=debug
   ```

5. **Run the service**:
   ```bash
   cargo run
   ```

### Database Migrations

Migrations are automatically run on startup. To manually run migrations:

```bash
# Install sqlx-cli
cargo install sqlx-cli --features postgres

# Run migrations
sqlx migrate run

# Create a new migration
sqlx migrate add <migration_name>
```

### Hot Reloading

For faster development iteration, use `cargo watch`:

```bash
cargo install cargo-watch
cargo watch -x run
```

## Code Organization

### Project Structure

```
src/
├── main.rs           # Entry point, server setup
├── lib.rs            # Library exports for tests
├── config.rs         # Configuration management
├── error.rs          # Error types
├── dal/              # Data Access Layer
│   ├── mod.rs
│   ├── database.rs
│   ├── book.rs
│   ├── user.rs
│   └── loan.rs
├── service/          # Business Logic Layer
│   ├── mod.rs
│   ├── book.rs
│   ├── user.rs
│   └── loan.rs
├── routes/           # HTTP Routes/Controllers
│   ├── mod.rs
│   ├── book.rs
│   ├── user.rs
│   └── loan.rs
└── kafka/            # Kafka Consumer
    └── mod.rs
```

### Adding a New Feature

1. **Add database schema** (if needed):
   - Create migration: `sqlx migrate add <name>`
   - Add SQL to migration file

2. **Add DAL repository**:
   - Create file in `src/dal/`
   - Implement repository struct with methods
   - Export in `dal/mod.rs`

3. **Add service**:
   - Create file in `src/service/`
   - Implement business logic
   - Export in `service/mod.rs`

4. **Add routes**:
   - Create file in `src/routes/`
   - Implement handlers
   - Register in `routes/mod.rs`

5. **Add tests**:
   - Unit tests in service files
   - Integration tests in `tests/`

## Coding Standards

### Rust Style

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `cargo fmt` before committing
- Use `cargo clippy` to catch common issues

### Error Handling

- Use `Result<T, AppError>` for fallible operations
- Convert errors at layer boundaries
- Provide meaningful error messages

### Naming Conventions

- Types: PascalCase (`BookService`)
- Functions: snake_case (`create_book`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- Modules: snake_case (`book_service`)

### Documentation

- Document public APIs with `///` comments
- Use `# Examples` sections for complex functions
- Document error conditions

Example:
```rust
/// Creates a new book in the library.
///
/// # Arguments
/// * `create` - Book creation data
///
/// # Returns
/// The created book
///
/// # Errors
/// Returns `AppError::Conflict` if ISBN already exists
pub async fn create_book(&self, create: CreateBook) -> Result<Book> {
    // ...
}
```

## Testing

### Running Tests

```bash
# All tests
cargo test

# Specific test
cargo test test_book_crud

# Integration tests (requires database)
cargo test --test integration_test -- --ignored
```

### Writing Tests

**Unit Tests**:
- Test business logic in isolation
- Mock dependencies
- Fast execution

**Integration Tests**:
- Test full request/response cycle
- Use real database
- Clean up test data

Example unit test:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validation() {
        // Test logic
    }
}
```

Example integration test:
```rust
#[tokio::test]
#[ignore]
async fn test_feature() {
    // Setup
    let db = Database::new(&db_url).await?;
    
    // Test
    // ...
    
    // Cleanup
}
```

## Debugging

### Logging

Set log level:
```bash
export RUST_LOG=debug
cargo run
```

View logs:
```bash
# Application logs
cargo run 2>&1 | tee app.log

# Docker logs
docker-compose logs -f postgres
docker-compose logs -f kafka
```

### Database Debugging

Connect to database:
```bash
docker-compose exec postgres psql -U library_user -d library_db
```

Query examples:
```sql
-- List all books
SELECT * FROM books;

-- List active loans
SELECT * FROM loans WHERE status = 'active';

-- Check available copies
SELECT id, title, available_copies, total_copies FROM books;
```

### Kafka Debugging

List topics:
```bash
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

Consume messages:
```bash
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic book-events \
  --from-beginning
```

Produce test message:
```bash
docker-compose exec kafka kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic book-events
```

Then paste JSON:
```json
{"event_type": "book_added", "isbn": "123", "title": "Test", "author": "Author", "genre": "Fiction", "total_copies": 1}
```

## Common Tasks

### Adding a New Endpoint

1. Add handler function in appropriate route file
2. Register route in `routes/mod.rs`
3. Add request/response types
4. Implement validation
5. Call service method
6. Return appropriate response

### Adding a New Database Query

1. Add method to repository in `dal/`
2. Use parameterized queries
3. Handle errors appropriately
4. Return domain models

### Adding Business Logic

1. Add method to service in `service/`
2. Implement business rules
3. Call repository methods
4. Handle errors and edge cases

## Git Workflow

### Commit Messages

Follow conventional commits:
- `feat: add book search by genre`
- `fix: correct loan validation logic`
- `docs: update API documentation`
- `test: add integration tests for loans`
- `refactor: simplify error handling`

### Branching

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

## Performance Profiling

### Benchmarking

Use `criterion` for benchmarks:
```toml
[dev-dependencies]
criterion = "0.5"
```

### Profiling

Use `perf` or `flamegraph`:
```bash
cargo install flamegraph
cargo flamegraph --bin library-service
```

## Troubleshooting

### Common Issues

**Database connection errors**:
- Check `docker-compose ps`
- Verify `DATABASE_URL` is correct
- Check PostgreSQL logs: `docker-compose logs postgres`

**Kafka connection errors**:
- Wait for Kafka to be ready (can take 30+ seconds)
- Check Kafka logs: `docker-compose logs kafka`
- Verify `KAFKA_BROKERS` environment variable

**Compilation errors**:
- Run `cargo clean` and rebuild
- Check Rust version: `rustc --version`
- Update dependencies: `cargo update`

**Test failures**:
- Ensure database is running
- Check test database is clean
- Verify environment variables

## IDE Setup

### VS Code

Recommended extensions:
- rust-analyzer
- CodeLLDB (for debugging)
- Better TOML

### IntelliJ / CLion

- Rust plugin
- Database tools for PostgreSQL

## Resources

- [Rust Book](https://doc.rust-lang.org/book/)
- [Axum Documentation](https://docs.rs/axum/)
- [SQLx Documentation](https://docs.rs/sqlx/)
- [Kafka Rust Client](https://docs.rs/rdkafka/)

