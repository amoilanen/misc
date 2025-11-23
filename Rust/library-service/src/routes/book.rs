use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::dal::Database;
use crate::service::BookService;
use crate::cache::Cache;
use crate::cache::redis::{book_key, book_search_key};
use crate::error::{AppError, Result};
use tracing::debug;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateBookRequest {
    #[validate(length(min = 1, max = 20))]
    pub isbn: String,
    #[validate(length(min = 1, max = 500))]
    pub title: String,
    #[validate(length(min = 1, max = 255))]
    pub author: String,
    #[validate(length(min = 1, max = 100))]
    pub genre: String,
    pub published_year: Option<i32>,
    #[validate(range(min = 1))]
    pub total_copies: i32,
    #[validate(range(min = 0))]
    pub available_copies: i32,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateBookRequest {
    #[validate(length(min = 1, max = 500))]
    pub title: Option<String>,
    #[validate(length(min = 1, max = 255))]
    pub author: Option<String>,
    #[validate(length(min = 1, max = 100))]
    pub genre: Option<String>,
    pub published_year: Option<i32>,
    #[validate(range(min = 1))]
    pub total_copies: Option<i32>,
    #[validate(range(min = 0))]
    pub available_copies: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct SearchBooksQuery {
    pub author: Option<String>,
    pub genre: Option<String>,
    pub title: Option<String>,
    pub isbn: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookResponse {
    pub id: Uuid,
    pub isbn: String,
    pub title: String,
    pub author: String,
    pub genre: String,
    pub published_year: Option<i32>,
    pub total_copies: i32,
    pub available_copies: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<crate::dal::book::Book> for BookResponse {
    fn from(book: crate::dal::book::Book) -> Self {
        Self {
            id: book.id,
            isbn: book.isbn,
            title: book.title,
            author: book.author,
            genre: book.genre,
            published_year: book.published_year,
            total_copies: book.total_copies,
            available_copies: book.available_copies,
            created_at: book.created_at,
            updated_at: book.updated_at,
        }
    }
}

pub fn routes(db: Database, cache: Option<Cache>) -> Router<(Database, Option<Cache>, crate::auth::middleware::AuthState)> {
    Router::new()
        .route("/", post(create_book))
        .route("/search", get(search_books))
        .route("/:id", get(get_book))
        .route("/:id", axum::routing::put(update_book))
        .route("/:id", delete(delete_book))
        .with_state((db, cache, crate::auth::middleware::AuthState { jwt_secret: String::new() }))
}

async fn create_book(
    State((db, cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Json(payload): Json<CreateBookRequest>,
) -> Result<Json<BookResponse>> {
    payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let service = BookService::new(db.clone(), cache.clone());
    let create = crate::dal::book::CreateBook {
        isbn: payload.isbn,
        title: payload.title,
        author: payload.author,
        genre: payload.genre,
        published_year: payload.published_year,
        total_copies: payload.total_copies,
        available_copies: payload.available_copies,
    };

    let book = service.create_book(create).await?;
    
    // Invalidate search cache
    if let Some(ref cache) = cache {
        let _ = cache.delete_pattern("book:search:*").await;
    }
    
    Ok(Json(BookResponse::from(book)))
}

async fn get_book(
    State((db, cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Path(id): Path<Uuid>,
) -> Result<Json<BookResponse>> {
    let cache_key = book_key(&id);
    
    // Try cache first
    if let Some(ref cache) = cache {
        if let Ok(Some(cached)) = cache.get::<BookResponse>(&cache_key).await {
            debug!("Cache hit for book {}", id);
            return Ok(Json(cached));
        }
    }
    
    debug!("Cache miss for book {}", id);
    let service = BookService::new(db.clone(), cache.clone());
    let book = service.get_book(id).await?;
    let response = BookResponse::from(book);
    
    // Cache the result
    if let Some(ref cache) = cache {
        let _ = cache.set(&cache_key, &response).await;
    }
    
    Ok(Json(response))
}

async fn search_books(
    State((db, cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Query(params): Query<SearchBooksQuery>,
) -> Result<Json<Vec<BookResponse>>> {
    let cache_key = book_search_key(params.author.as_deref(), params.genre.as_deref(), params.title.as_deref());
    
    // Try cache first
    if let Some(ref cache) = cache {
        if let Ok(Some(cached)) = cache.get::<Vec<BookResponse>>(&cache_key).await {
            debug!("Cache hit for search");
            return Ok(Json(cached));
        }
    }
    
    debug!("Cache miss for search");
    let service = BookService::new(db.clone(), cache.clone());
    let search_params = crate::dal::book::BookSearchParams {
        author: params.author,
        genre: params.genre,
        title: params.title,
        isbn: params.isbn,
        limit: params.limit,
        offset: params.offset,
    };

    let books = service.search_books(search_params).await?;
    let responses: Vec<BookResponse> = books.into_iter().map(BookResponse::from).collect();
    
    // Cache the result
    if let Some(ref cache) = cache {
        let _ = cache.set(&cache_key, &responses).await;
    }
    
    Ok(Json(responses))
}

async fn update_book(
    State((db, cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateBookRequest>,
) -> Result<Json<BookResponse>> {
    payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let service = BookService::new(db.clone(), cache.clone());
    let update = crate::dal::book::UpdateBook {
        title: payload.title,
        author: payload.author,
        genre: payload.genre,
        published_year: payload.published_year,
        total_copies: payload.total_copies,
        available_copies: payload.available_copies,
    };

    let book = service.update_book(id, update).await?;
    let response = BookResponse::from(book);
    
    // Invalidate cache
    if let Some(ref cache) = cache {
        let _ = cache.delete(&book_key(&id)).await;
        let _ = cache.delete_pattern("book:search:*").await;
    }
    
    Ok(Json(response))
}

async fn delete_book(
    State((db, cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode> {
    let service = BookService::new(db.clone(), cache.clone());
    service.delete_book(id).await?;
    
    // Invalidate cache
    if let Some(ref cache) = cache {
        let _ = cache.delete(&book_key(&id)).await;
        let _ = cache.delete_pattern("book:search:*").await;
    }
    
    Ok(StatusCode::NO_CONTENT)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_book_request_validation() {
        let valid_request = CreateBookRequest {
            isbn: "1234567890".to_string(),
            title: "Test Book".to_string(),
            author: "Author".to_string(),
            genre: "Fiction".to_string(),
            published_year: Some(2023),
            total_copies: 5,
            available_copies: 3,
        };
        
        assert!(valid_request.validate().is_ok());
    }

    #[test]
    fn test_create_book_request_invalid_isbn() {
        let invalid_request = CreateBookRequest {
            isbn: "".to_string(), // Empty ISBN should fail
            title: "Test Book".to_string(),
            author: "Author".to_string(),
            genre: "Fiction".to_string(),
            published_year: None,
            total_copies: 5,
            available_copies: 3,
        };
        
        assert!(invalid_request.validate().is_err());
    }

    #[test]
    fn test_create_book_request_invalid_copies() {
        let invalid_request = CreateBookRequest {
            isbn: "1234567890".to_string(),
            title: "Test Book".to_string(),
            author: "Author".to_string(),
            genre: "Fiction".to_string(),
            published_year: None,
            total_copies: 0, // Invalid: must be >= 1
            available_copies: -1, // Invalid: must be >= 0
        };
        
        assert!(invalid_request.validate().is_err());
    }

    #[test]
    fn test_update_book_request_partial() {
        let update = UpdateBookRequest {
            title: Some("New Title".to_string()),
            author: None,
            genre: None,
            published_year: None,
            total_copies: None,
            available_copies: None,
        };
        
        assert!(update.validate().is_ok());
        assert_eq!(update.title, Some("New Title".to_string()));
    }

    #[test]
    fn test_book_response_from_book() {
        use chrono::Utc;
        let book = crate::dal::book::Book {
            id: Uuid::new_v4(),
            isbn: "123".to_string(),
            title: "Test".to_string(),
            author: "Author".to_string(),
            genre: "Fiction".to_string(),
            published_year: Some(2023),
            total_copies: 5,
            available_copies: 3,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let response = BookResponse::from(book);
        assert_eq!(response.isbn, "123");
        assert_eq!(response.total_copies, 5);
    }

    #[test]
    fn test_search_books_query() {
        let query = SearchBooksQuery {
            author: Some("Author".to_string()),
            genre: Some("Fiction".to_string()),
            title: None,
            isbn: None,
            limit: Some(10),
            offset: Some(0),
        };
        
        assert_eq!(query.author, Some("Author".to_string()));
        assert_eq!(query.limit, Some(10));
    }
}
