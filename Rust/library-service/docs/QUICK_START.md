# Quick Start Guide

Get up and running with the Library Service in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Rust 1.87+ installed ([rustup.rs](https://rustup.rs/))

## Step 1: Start Dependencies

```bash
docker-compose up -d
```

Wait for services to be ready (about 30 seconds):
```bash
docker-compose ps
```

## Step 2: Run the Service

```bash
cargo run
```

You should see:
```
Starting library service on 0.0.0.0:3000
Database connection established
Database migrations completed
Kafka consumer started
Server listening on 0.0.0.0:3000
```

## Step 3: Test the API

In another terminal:

```bash
# Health check
curl http://localhost:3000/health

# Create a book
curl -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-0-123456-78-9",
    "title": "The Rust Book",
    "author": "Steve Klabnik",
    "genre": "Programming",
    "published_year": 2018,
    "total_copies": 5,
    "available_copies": 5
  }'

# Search books
curl "http://localhost:3000/api/v1/books/search?author=Steve"
```

## Next Steps

- Read [API_EXAMPLES.md](API_EXAMPLES.md) for more API usage examples
- Read [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for architecture details

## Troubleshooting

**Port already in use?**
```bash
# Change port in docker-compose.yml or set SERVER_ADDRESS environment variable
export SERVER_ADDRESS=0.0.0.0:3001
```

**Database connection error?**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres
```

**Kafka connection error?**
```bash
# Kafka takes longer to start, wait 30-60 seconds
docker-compose logs kafka
```

## Stopping Services

```bash
# Stop the service (Ctrl+C)
# Stop dependencies
docker-compose down
```

