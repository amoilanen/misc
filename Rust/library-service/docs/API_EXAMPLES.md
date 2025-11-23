# API Examples

This document provides practical examples for using the Library Service API.

## Base URL

- Local: `http://localhost:3000`
- Kind (with port-forward): `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication

Currently, the API does not require authentication. In production, add JWT or API key authentication.

## Books API

### Create a Book

```bash
curl -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-0-123456-78-9",
    "title": "The Rust Programming Language",
    "author": "Steve Klabnik and Carol Nichols",
    "genre": "Programming",
    "published_year": 2018,
    "total_copies": 5,
    "available_copies": 5
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "isbn": "978-0-123456-78-9",
  "title": "The Rust Programming Language",
  "author": "Steve Klabnik and Carol Nichols",
  "genre": "Programming",
  "published_year": 2018,
  "total_copies": 5,
  "available_copies": 5,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Get Book by ID

```bash
curl http://localhost:3000/api/v1/books/550e8400-e29b-41d4-a716-446655440000
```

### Search Books by Author

```bash
curl "http://localhost:3000/api/v1/books/search?author=Steve"
```

### Search Books by Genre

```bash
curl "http://localhost:3000/api/v1/books/search?genre=Programming"
```

### Search Books by Title

```bash
curl "http://localhost:3000/api/v1/books/search?title=Rust"
```

### Search Books by ISBN

```bash
curl "http://localhost:3000/api/v1/books/search?isbn=978-0-123456-78-9"
```

### Combined Search

```bash
curl "http://localhost:3000/api/v1/books/search?author=Steve&genre=Programming&limit=10&offset=0"
```

### Update Book

```bash
curl -X PUT http://localhost:3000/api/v1/books/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Rust Programming Language (2nd Edition)",
    "total_copies": 10,
    "available_copies": 8
  }'
```

### Delete Book

```bash
curl -X DELETE http://localhost:3000/api/v1/books/550e8400-e29b-41d4-a716-446655440000
```

## Users API

### Create a Librarian

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "librarian@library.com",
    "name": "Jane Librarian",
    "role": "librarian"
  }'
```

### Create a Library User

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }'
```

Response:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Get User by ID

```bash
curl http://localhost:3000/api/v1/users/660e8400-e29b-41d4-a716-446655440000
```

## Loans API

### Loan a Book

```bash
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440000",
    "loan_days": 14
  }'
```

Response:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "loaned_at": "2024-01-01T12:00:00Z",
  "returned_at": null,
  "due_date": "2024-01-15T12:00:00Z",
  "status": "active",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Return a Book

```bash
curl -X POST http://localhost:3000/api/v1/loans/770e8400-e29b-41d4-a716-446655440000/return
```

Response:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "loaned_at": "2024-01-01T12:00:00Z",
  "returned_at": "2024-01-10T12:00:00Z",
  "due_date": "2024-01-15T12:00:00Z",
  "status": "returned",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-10T12:00:00Z"
}
```

### Get User's Loans

```bash
curl "http://localhost:3000/api/v1/loans/user?user_id=660e8400-e29b-41d4-a716-446655440000"
```

## Error Responses

### Validation Error (400)

```json
{
  "error": "Validation error: email: must be a valid email"
}
```

### Not Found (404)

```json
{
  "error": "Book with id 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

### Conflict (409)

```json
{
  "error": "Book with ISBN 978-0-123456-78-9 already exists"
}
```

## Complete Workflow Example

```bash
# 1. Create a book
BOOK_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-0-123456-78-9",
    "title": "Test Book",
    "author": "Test Author",
    "genre": "Fiction",
    "published_year": 2023,
    "total_copies": 3,
    "available_copies": 3
  }')

BOOK_ID=$(echo $BOOK_RESPONSE | jq -r '.id')
echo "Created book: $BOOK_ID"

# 2. Create a user
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  }')

USER_ID=$(echo $USER_RESPONSE | jq -r '.id')
echo "Created user: $USER_ID"

# 3. Loan the book
LOAN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -d "{
    \"book_id\": \"$BOOK_ID\",
    \"user_id\": \"$USER_ID\",
    \"loan_days\": 14
  }")

LOAN_ID=$(echo $LOAN_RESPONSE | jq -r '.id')
echo "Created loan: $LOAN_ID"

# 4. Check available copies (should be 2)
BOOK_UPDATED=$(curl -s http://localhost:3000/api/v1/books/$BOOK_ID)
AVAILABLE=$(echo $BOOK_UPDATED | jq -r '.available_copies')
echo "Available copies: $AVAILABLE"

# 5. Return the book
curl -s -X POST http://localhost:3000/api/v1/loans/$LOAN_ID/return > /dev/null
echo "Book returned"

# 6. Check available copies (should be 3)
BOOK_FINAL=$(curl -s http://localhost:3000/api/v1/books/$BOOK_ID)
AVAILABLE_FINAL=$(echo $BOOK_FINAL | jq -r '.available_copies')
echo "Available copies after return: $AVAILABLE_FINAL"
```

## Using jq for JSON Processing

Install jq: `brew install jq` (macOS) or `apt-get install jq` (Linux)

```bash
# Pretty print JSON
curl -s http://localhost:3000/api/v1/books/search?author=Steve | jq '.'

# Extract specific field
curl -s http://localhost:3000/api/v1/books/550e8400-e29b-41d4-a716-446655440000 | jq -r '.title'

# Filter results
curl -s http://localhost:3000/api/v1/books/search?genre=Programming | jq '.[] | select(.available_copies > 0)'
```

