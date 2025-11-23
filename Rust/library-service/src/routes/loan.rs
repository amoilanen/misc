use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::dal::Database;
use crate::service::LoanService;
use crate::cache::Cache;
use crate::error::Result;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateLoanRequest {
    pub book_id: Uuid,
    pub user_id: Uuid,
    #[validate(range(min = 1, max = 365))]
    pub loan_days: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct LoanResponse {
    pub id: Uuid,
    pub book_id: Uuid,
    pub user_id: Uuid,
    pub loaned_at: chrono::DateTime<chrono::Utc>,
    pub returned_at: Option<chrono::DateTime<chrono::Utc>>,
    pub due_date: chrono::DateTime<chrono::Utc>,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<crate::dal::loan::Loan> for LoanResponse {
    fn from(loan: crate::dal::loan::Loan) -> Self {
        Self {
            id: loan.id,
            book_id: loan.book_id,
            user_id: loan.user_id,
            loaned_at: loan.loaned_at,
            returned_at: loan.returned_at,
            due_date: loan.due_date,
            status: loan.status,
            created_at: loan.created_at,
            updated_at: loan.updated_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UserLoansQuery {
    pub user_id: Uuid,
}

pub fn routes() -> Router<(Database, Option<Cache>, crate::auth::middleware::AuthState)> {
    Router::new()
        .route("/", post(create_loan))
        .route("/:id/return", post(return_book))
        .route("/user", get(get_user_loans))
}

async fn create_loan(
    State((db, cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Json(payload): Json<CreateLoanRequest>,
) -> Result<Json<LoanResponse>> {
    payload.validate().map_err(|e| crate::error::AppError::Validation(e.to_string()))?;

    let service = LoanService::new(db);
    let loan = service.loan_book(payload.book_id, payload.user_id, payload.loan_days).await?;
    
    // Invalidate book cache
    if let Some(ref cache) = cache {
        use crate::cache::redis::book_key;
        let _ = cache.delete(&book_key(&payload.book_id)).await;
        let _ = cache.delete_pattern("book:search:*").await;
    }
    
    Ok(Json(LoanResponse::from(loan)))
}

async fn return_book(
    State((db, cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Path(id): Path<Uuid>,
) -> Result<Json<LoanResponse>> {
    let service = LoanService::new(db);
    let loan = service.return_book(id).await?;
    
    // Invalidate book cache
    if let Some(ref cache) = cache {
        use crate::cache::redis::book_key;
        let _ = cache.delete(&book_key(&loan.book_id)).await;
        let _ = cache.delete_pattern("book:search:*").await;
    }
    
    Ok(Json(LoanResponse::from(loan)))
}

async fn get_user_loans(
    State((db, _cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Query(params): Query<UserLoansQuery>,
) -> Result<Json<Vec<LoanResponse>>> {
    let service = LoanService::new(db);
    let loans = service.get_user_loans(params.user_id).await?;
    let responses: Vec<LoanResponse> = loans.into_iter().map(LoanResponse::from).collect();
    Ok(Json(responses))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[test]
    fn test_create_loan_request_validation() {
        let valid_request = CreateLoanRequest {
            book_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            loan_days: Some(14),
        };
        
        assert!(valid_request.validate().is_ok());
    }

    #[test]
    fn test_create_loan_request_invalid_days() {
        let invalid_request = CreateLoanRequest {
            book_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            loan_days: Some(400), // Exceeds max of 365
        };
        
        assert!(invalid_request.validate().is_err());
    }

    #[test]
    fn test_create_loan_request_zero_days() {
        let invalid_request = CreateLoanRequest {
            book_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            loan_days: Some(0), // Less than min of 1
        };
        
        assert!(invalid_request.validate().is_err());
    }

    #[test]
    fn test_loan_response_from_loan() {
        let loan = crate::dal::loan::Loan {
            id: Uuid::new_v4(),
            book_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            loaned_at: Utc::now(),
            returned_at: None,
            due_date: Utc::now(),
            status: "active".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let response = LoanResponse::from(loan);
        assert_eq!(response.status, "active");
        assert!(response.returned_at.is_none());
    }

    #[test]
    fn test_user_loans_query() {
        let user_id = Uuid::new_v4();
        let query = UserLoansQuery { user_id };
        
        assert_eq!(query.user_id, user_id);
    }
}

