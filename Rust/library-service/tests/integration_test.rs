// Integration tests for the library service
// These tests require a running database and can be run with:
// DATABASE_URL=postgresql://library_user:library_pass@localhost:5432/library_db cargo test --test integration_test

use library_service::dal::{Database, BookRepository, UserRepository, LoanRepository};
use library_service::service::{BookService, UserService, LoanService};
use uuid::Uuid;
use chrono::Utc;

#[tokio::test]
#[ignore] // Ignore by default, run with --ignored flag
async fn test_book_crud() {
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://library_user:library_pass@localhost:5432/library_db".to_string());
    
    let db = Database::new(&db_url).await.expect("Failed to connect to database");
    db.run_migrations().await.expect("Failed to run migrations");

    let service = BookService::new(db.clone(), None);

    // Create book
    let create = library_service::dal::book::CreateBook {
        isbn: "978-0-123456-78-9".to_string(),
        title: "Test Book".to_string(),
        author: "Test Author".to_string(),
        genre: "Fiction".to_string(),
        published_year: Some(2023),
        total_copies: 5,
        available_copies: 5,
    };

    let book = service.create_book(create).await.expect("Failed to create book");
    assert_eq!(book.title, "Test Book");
    assert_eq!(book.available_copies, 5);

    // Get book
    let retrieved = service.get_book(book.id).await.expect("Failed to get book");
    assert_eq!(retrieved.id, book.id);

    // Search books
    let search_params = library_service::dal::book::BookSearchParams {
        author: Some("Test Author".to_string()),
        genre: None,
        title: None,
        isbn: None,
        limit: Some(10),
        offset: Some(0),
    };
    let results = service.search_books(search_params).await.expect("Failed to search books");
    assert!(!results.is_empty());

    // Update book
    let update = library_service::dal::book::UpdateBook {
        title: Some("Updated Title".to_string()),
        author: None,
        genre: None,
        published_year: None,
        total_copies: None,
        available_copies: None,
    };
    let updated = service.update_book(book.id, update).await.expect("Failed to update book");
    assert_eq!(updated.title, "Updated Title");

    // Delete book
    service.delete_book(book.id).await.expect("Failed to delete book");
}

#[tokio::test]
#[ignore]
async fn test_user_crud() {
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://library_user:library_pass@localhost:5432/library_db".to_string());
    
    let db = Database::new(&db_url).await.expect("Failed to connect to database");
    db.run_migrations().await.expect("Failed to run migrations");

    let service = UserService::new(db.clone());

    // Create user
    let create = library_service::dal::user::CreateUser {
        email: format!("test_{}@example.com", Uuid::new_v4()),
        name: "Test User".to_string(),
        role: "user".to_string(),
        password_hash: None,
    };

    let user = service.create_user(create, Some("testpassword123".to_string())).await.expect("Failed to create user");
    assert_eq!(user.role, "user");

    // Get user
    let retrieved = service.get_user(user.id).await.expect("Failed to get user");
    assert_eq!(retrieved.id, user.id);
}

#[tokio::test]
#[ignore]
async fn test_loan_flow() {
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://library_user:library_pass@localhost:5432/library_db".to_string());
    
    let db = Database::new(&db_url).await.expect("Failed to connect to database");
    db.run_migrations().await.expect("Failed to run migrations");

    // Create book
    let book_service = BookService::new(db.clone(), None);
    let book_create = library_service::dal::book::CreateBook {
        isbn: format!("978-0-123456-78-{}", Uuid::new_v4().to_string().chars().take(1).collect::<String>()),
        title: "Loan Test Book".to_string(),
        author: "Test Author".to_string(),
        genre: "Fiction".to_string(),
        published_year: Some(2023),
        total_copies: 3,
        available_copies: 3,
    };
    let book = book_service.create_book(book_create).await.expect("Failed to create book");

    // Create user
    let user_service = UserService::new(db.clone());
    let user_create = library_service::dal::user::CreateUser {
        email: format!("loan_test_{}@example.com", Uuid::new_v4()),
        name: "Loan Test User".to_string(),
        role: "user".to_string(),
        password_hash: None,
    };
    let user = user_service.create_user(user_create, Some("testpassword123".to_string())).await.expect("Failed to create user");

    // Loan book
    let loan_service = LoanService::new(db.clone());
    let loan = loan_service.loan_book(book.id, user.id, Some(14)).await.expect("Failed to loan book");
    assert_eq!(loan.status, "active");

    // Verify available copies decreased
    let updated_book = book_service.get_book(book.id).await.expect("Failed to get book");
    assert_eq!(updated_book.available_copies, 2);

    // Return book
    let returned_loan = loan_service.return_book(loan.id).await.expect("Failed to return book");
    assert_eq!(returned_loan.status, "returned");
    assert!(returned_loan.returned_at.is_some());

    // Verify available copies increased
    let final_book = book_service.get_book(book.id).await.expect("Failed to get book");
    assert_eq!(final_book.available_copies, 3);
}

