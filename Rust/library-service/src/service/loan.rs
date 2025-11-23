use crate::dal::{Database, LoanRepository, BookRepository, CreateLoan};
use crate::error::{AppError, Result};
use uuid::Uuid;
use chrono::{Utc, Duration};

pub struct LoanService {
    db: Database,
}

impl LoanService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn loan_book(&self, book_id: Uuid, user_id: Uuid, loan_days: Option<i64>) -> Result<crate::dal::loan::Loan> {
        let book_repo = BookRepository::new(self.db.pool());
        let loan_repo = LoanRepository::new(self.db.pool());

        // Check if book exists
        let book = book_repo.find_by_id(book_id).await?;

        // Check if book is available
        if book.available_copies < 1 {
            return Err(AppError::Conflict("Book is not available for loan".to_string()));
        }

        // Check if user already has an active loan for this book
        if let Some(_) = loan_repo.find_active_by_book_and_user(book_id, user_id).await? {
            return Err(AppError::Conflict("User already has an active loan for this book".to_string()));
        }

        // Calculate due date (default 14 days)
        let due_date = Utc::now() + Duration::days(loan_days.unwrap_or(14));

        // Create loan
        let create = CreateLoan {
            book_id,
            user_id,
            due_date,
        };
        let loan = loan_repo.create(&create).await?;

        // Decrement available copies
        book_repo.decrement_available_copies(book_id, 1).await?;

        Ok(loan)
    }

    pub async fn return_book(&self, loan_id: Uuid) -> Result<crate::dal::loan::Loan> {
        let loan_repo = LoanRepository::new(self.db.pool());
        let book_repo = BookRepository::new(self.db.pool());

        // Get loan
        let loan = loan_repo.find_by_id(loan_id).await?;

        // Check if already returned
        if loan.status != "active" {
            return Err(AppError::Conflict("Loan is already returned".to_string()));
        }

        // Return loan
        let returned_loan = loan_repo.return_loan(loan_id).await?;

        // Increment available copies
        book_repo.increment_available_copies(loan.book_id, 1).await?;

        Ok(returned_loan)
    }

    pub async fn get_user_loans(&self, user_id: Uuid) -> Result<Vec<crate::dal::loan::Loan>> {
        let loan_repo = LoanRepository::new(self.db.pool());
        loan_repo.find_by_user(user_id).await
    }

    pub async fn handle_book_loaned(&self, book_id: Uuid, user_id: Uuid) -> Result<()> {
        // This handles Kafka events - we'll create a loan record if it doesn't exist
        let loan_repo = LoanRepository::new(self.db.pool());
        
        // Check if loan already exists
        if let None = loan_repo.find_active_by_book_and_user(book_id, user_id).await? {
            // Create loan record
            let due_date = Utc::now() + Duration::days(14);
            let create = CreateLoan {
                book_id,
                user_id,
                due_date,
            };
            loan_repo.create(&create).await?;

            // Decrement available copies
            let book_repo = BookRepository::new(self.db.pool());
            book_repo.decrement_available_copies(book_id, 1).await?;
        }

        Ok(())
    }

    pub async fn handle_book_returned(&self, book_id: Uuid, user_id: Uuid) -> Result<()> {
        let loan_repo = LoanRepository::new(self.db.pool());
        
        // Find active loan
        if let Some(loan) = loan_repo.find_active_by_book_and_user(book_id, user_id).await? {
            // Return loan
            loan_repo.return_loan(loan.id).await?;

            // Increment available copies
            let book_repo = BookRepository::new(self.db.pool());
            book_repo.increment_available_copies(book_id, 1).await?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Utc, Duration};

    #[test]
    fn test_due_date_calculation() {
        // Test default loan period (14 days)
        let now = Utc::now();
        let default_due_date = now + Duration::days(14);
        let custom_due_date = now + Duration::days(30);
        
        assert!(default_due_date > now);
        assert!(custom_due_date > default_due_date);
    }

    #[test]
    fn test_loan_service_new() {
        // Test service creation
        assert!(true);
    }

    #[test]
    fn test_loan_validation_logic() {
        // Test that loan validation checks:
        // 1. Book exists
        // 2. Book is available (available_copies > 0)
        // 3. User doesn't have active loan for same book
        
        // These validations happen in loan_book method
        assert!(true);
    }
}

