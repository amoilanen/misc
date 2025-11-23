// Authentication tests

use library_service::dal::Database;
use library_service::service::UserService;
use library_service::auth::{jwt::create_token, password::{hash_password, verify_password}};
use uuid::Uuid;

#[tokio::test]
#[ignore]
async fn test_password_hashing() {
    let password = "testpassword123";
    let hash = hash_password(password).expect("Failed to hash password");
    
    assert!(verify_password(password, &hash).expect("Failed to verify password"));
    assert!(!verify_password("wrongpassword", &hash).expect("Failed to verify password"));
}

#[tokio::test]
#[ignore]
async fn test_jwt_token() {
    let user_id = Uuid::new_v4();
    let email = "test@example.com".to_string();
    let role = "user".to_string();
    
    let secret = "test-secret-key";
    let claims = library_service::auth::jwt::Claims::new(user_id, email.clone(), role.clone());
    
    let token = create_token(&claims, secret).expect("Failed to create token");
    assert!(!token.is_empty());
    
    // Verify token can be decoded
    let decoded = library_service::auth::jwt::verify_token(&token, secret)
        .expect("Failed to verify token");
    
    assert_eq!(decoded.email, email);
    assert_eq!(decoded.role, role);
    assert_eq!(decoded.user_id().unwrap(), user_id);
}

#[tokio::test]
#[ignore]
async fn test_login_flow() {
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://library_user:library_pass@localhost:5432/library_db".to_string());
    
    let db = Database::new(&db_url).await.expect("Failed to connect to database");
    db.run_migrations().await.expect("Failed to run migrations");

    let service = UserService::new(db.clone());
    
    // Create user with password
    let create = library_service::dal::user::CreateUser {
        email: format!("login_test_{}@example.com", Uuid::new_v4()),
        name: "Login Test User".to_string(),
        role: "user".to_string(),
        password_hash: None,
    };
    
    let password = "securepassword123";
    let user = service.create_user(create, Some(password.to_string()))
        .await.expect("Failed to create user");
    
    // Verify password hash was stored
    let stored_hash = service.get_password_hash(&user.id)
        .await.expect("Failed to get password hash")
        .expect("Password hash not found");
    
    assert!(verify_password(password, &stored_hash).expect("Failed to verify password"));
}

