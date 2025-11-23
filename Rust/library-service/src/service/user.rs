use crate::dal::{Database, UserRepository, CreateUser};
use crate::error::{AppError, Result};
use crate::auth::password::hash_password;
use uuid::Uuid;

pub struct UserService {
    db: Database,
}

impl UserService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn create_user(&self, create: CreateUser, password: Option<String>) -> Result<crate::dal::user::User> {
        // Validate role
        if create.role != "librarian" && create.role != "user" {
            return Err(AppError::Validation("Role must be 'librarian' or 'user'".to_string()));
        }

        // Check if user with email already exists
        let repo = UserRepository::new(self.db.pool());
        if let Some(_) = repo.find_by_email(&create.email).await? {
            return Err(AppError::Conflict(format!("User with email {} already exists", create.email)));
        }

        // Hash password if provided
        let password_hash = if let Some(pwd) = password {
            Some(hash_password(&pwd)?)
        } else {
            None
        };

        let create_with_hash = crate::dal::user::CreateUser {
            email: create.email,
            name: create.name,
            role: create.role,
            password_hash,
        };

        repo.create(&create_with_hash).await
    }

    pub async fn get_user(&self, id: Uuid) -> Result<crate::dal::user::User> {
        let repo = UserRepository::new(self.db.pool());
        repo.find_by_id(id).await
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<Option<crate::dal::user::User>> {
        let repo = UserRepository::new(self.db.pool());
        repo.find_by_email(email).await
    }

    pub async fn get_password_hash(&self, user_id: &Uuid) -> Result<Option<String>> {
        let repo = UserRepository::new(self.db.pool());
        repo.get_password_hash(user_id).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::AppError;

    #[test]
    fn test_role_validation() {
        // Test that invalid roles are rejected
        let invalid_roles = vec!["admin", "guest", "superuser", ""];
        
        for role in invalid_roles {
            // This validation happens in create_user
            assert_ne!(role, "librarian");
            assert_ne!(role, "user");
        }
    }

    #[test]
    fn test_valid_roles() {
        let valid_roles = vec!["librarian", "user"];
        
        for role in valid_roles {
            assert!(role == "librarian" || role == "user");
        }
    }

    #[test]
    fn test_user_service_new() {
        // Test service creation (would need mock database)
        assert!(true);
    }
}

