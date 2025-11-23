use sqlx::{PgPool, FromRow};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::error::{AppError, Result};

#[derive(Debug, Clone, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub struct UserRepository<'a> {
    pool: &'a PgPool,
}

impl<'a> UserRepository<'a> {
    pub fn new(pool: &'a PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, user: &CreateUser) -> Result<User> {
        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (email, name, role, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, name, role, created_at, updated_at
            "#,
        )
        .bind(&user.email)
        .bind(&user.name)
        .bind(&user.role)
        .bind(&user.password_hash)
        .fetch_one(self.pool)
        .await?;

        Ok(user)
    }

    pub async fn get_password_hash(&self, user_id: &Uuid) -> Result<Option<String>> {
        let hash: Option<String> = sqlx::query_scalar(
            "SELECT password_hash FROM users WHERE id = $1",
        )
        .bind(user_id)
        .fetch_optional(self.pool)
        .await?;

        Ok(hash)
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<User> {
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("User with id {} not found", id)))?;

        Ok(user)
    }

    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE email = $1",
        )
        .bind(email)
        .fetch_optional(self.pool)
        .await?;

        Ok(user)
    }
}

#[derive(Debug, Clone)]
pub struct CreateUser {
    pub email: String,
    pub name: String,
    pub role: String,
    pub password_hash: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_user_struct() {
        let create = CreateUser {
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            role: "user".to_string(),
            password_hash: Some("hashed_password".to_string()),
        };
        
        assert_eq!(create.email, "test@example.com");
        assert_eq!(create.role, "user");
        assert!(create.password_hash.is_some());
    }

    #[test]
    fn test_create_user_without_password() {
        let create = CreateUser {
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            role: "librarian".to_string(),
            password_hash: None,
        };
        
        assert_eq!(create.role, "librarian");
        assert!(create.password_hash.is_none());
    }

    #[test]
    fn test_user_repository_new() {
        // Test that repository can be created (requires actual pool for real test)
        // This is a unit test for the constructor
        assert!(true); // Placeholder - real test would require mock pool
    }
}

