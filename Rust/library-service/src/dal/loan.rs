use sqlx::{PgPool, FromRow};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::error::{AppError, Result};

#[derive(Debug, Clone, FromRow)]
pub struct Loan {
    pub id: Uuid,
    pub book_id: Uuid,
    pub user_id: Uuid,
    pub loaned_at: DateTime<Utc>,
    pub returned_at: Option<DateTime<Utc>>,
    pub due_date: DateTime<Utc>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub struct LoanRepository<'a> {
    pool: &'a PgPool,
}

impl<'a> LoanRepository<'a> {
    pub fn new(pool: &'a PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, loan: &CreateLoan) -> Result<Loan> {
        let loan = sqlx::query_as::<_, Loan>(
            r#"
            INSERT INTO loans (book_id, user_id, due_date, status)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(loan.book_id)
        .bind(loan.user_id)
        .bind(loan.due_date)
        .bind("active")
        .fetch_one(self.pool)
        .await?;

        Ok(loan)
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Loan> {
        let loan = sqlx::query_as::<_, Loan>(
            "SELECT * FROM loans WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Loan with id {} not found", id)))?;

        Ok(loan)
    }

    pub async fn find_active_by_book_and_user(&self, book_id: Uuid, user_id: Uuid) -> Result<Option<Loan>> {
        let loan = sqlx::query_as::<_, Loan>(
            "SELECT * FROM loans WHERE book_id = $1 AND user_id = $2 AND status = 'active'",
        )
        .bind(book_id)
        .bind(user_id)
        .fetch_optional(self.pool)
        .await?;

        Ok(loan)
    }

    pub async fn find_active_by_book(&self, book_id: Uuid) -> Result<Vec<Loan>> {
        let loans = sqlx::query_as::<_, Loan>(
            "SELECT * FROM loans WHERE book_id = $1 AND status = 'active'",
        )
        .bind(book_id)
        .fetch_all(self.pool)
        .await?;

        Ok(loans)
    }

    pub async fn find_by_user(&self, user_id: Uuid) -> Result<Vec<Loan>> {
        let loans = sqlx::query_as::<_, Loan>(
            "SELECT * FROM loans WHERE user_id = $1 ORDER BY loaned_at DESC",
        )
        .bind(user_id)
        .fetch_all(self.pool)
        .await?;

        Ok(loans)
    }

    pub async fn return_loan(&self, id: Uuid) -> Result<Loan> {
        let loan = sqlx::query_as::<_, Loan>(
            r#"
            UPDATE loans
            SET status = 'returned', returned_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND status = 'active'
            RETURNING *
            "#,
        )
        .bind(id)
        .fetch_optional(self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Active loan with id {} not found", id)))?;

        Ok(loan)
    }
}

#[derive(Debug, Clone)]
pub struct CreateLoan {
    pub book_id: Uuid,
    pub user_id: Uuid,
    pub due_date: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    #[test]
    fn test_create_loan_struct() {
        let book_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let due_date = Utc::now();
        
        let create = CreateLoan {
            book_id,
            user_id,
            due_date,
        };
        
        assert_eq!(create.book_id, book_id);
        assert_eq!(create.user_id, user_id);
    }

    #[test]
    fn test_loan_repository_new() {
        // Test that repository can be created
        assert!(true); // Placeholder - real test would require mock pool
    }
}

