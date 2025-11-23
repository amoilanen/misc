# Authentication Guide

The Library Service uses JWT (JSON Web Tokens) for authentication with Argon2 password hashing.

## Overview

- **Password Hashing**: Argon2 (secure, memory-hard algorithm)
- **Token Format**: JWT (JSON Web Token)
- **Token Expiry**: 24 hours (configurable)
- **Roles**: `librarian` and `user`

## User Registration

Users are created via the `/api/v1/users` endpoint with a password:

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

**Password Requirements**:
- Minimum 8 characters
- Should include letters, numbers, and special characters for security

## Login

Authenticate to receive a JWT token:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user"
}
```

## Using the Token

Include the token in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/api/v1/books/search?author=Steve \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Token Structure

The JWT token contains:
- `sub`: User ID (subject)
- `email`: User email
- `role`: User role (`librarian` or `user`)
- `exp`: Expiration timestamp
- `iat`: Issued at timestamp

## Role-Based Access Control

Currently, authentication middleware is available but not enforced on all endpoints. To protect endpoints:

```rust
use crate::auth::middleware::{require_auth, require_role};

// Require any authenticated user
.route("/protected", get(handler).layer(middleware::from_fn_with_state(auth_state, require_auth)))

// Require specific role
.route("/admin", get(handler).layer(middleware::from_fn_with_state(auth_state, |req, next| require_role("librarian", req, next))))
```

## Security Best Practices

1. **JWT Secret**: Use a strong, random secret in production:
   ```bash
   export JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Password Storage**: Passwords are hashed with Argon2 before storage

3. **Token Expiry**: Tokens expire after 24 hours

4. **HTTPS**: Always use HTTPS in production to protect tokens in transit

5. **Token Storage**: Store tokens securely (e.g., httpOnly cookies in browsers)

## Environment Variables

- `JWT_SECRET`: Secret key for signing tokens (required, change in production)

## Error Responses

### Invalid Credentials
```json
{
  "error": "Invalid email or password"
}
```

### Invalid Token
```json
{
  "error": "Invalid token: ..."
}
```

### Insufficient Permissions
```json
{
  "error": "Insufficient permissions. Required role: librarian"
}
```

