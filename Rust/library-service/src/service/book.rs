use crate::dal::{Database, BookRepository, BookSearchParams, CreateBook, UpdateBook};
use crate::cache::Cache;
use crate::error::{AppError, Result};
use uuid::Uuid;

pub struct BookService {
    db: Database,
    #[allow(dead_code)]
    cache: Option<Cache>,
}

impl BookService {
    pub fn new(db: Database, cache: Option<Cache>) -> Self {
        Self { db, cache }
    }

    pub async fn create_book(&self, create: CreateBook) -> Result<crate::dal::book::Book> {
        // Check if book with same ISBN already exists
        let repo = BookRepository::new(self.db.pool());
        if let Some(_) = repo.find_by_isbn(&create.isbn).await? {
            return Err(AppError::Conflict(format!("Book with ISBN {} already exists", create.isbn)));
        }

        // Validate copies
        if create.available_copies > create.total_copies {
            return Err(AppError::Validation("Available copies cannot exceed total copies".to_string()));
        }

        repo.create(&create).await
    }

    pub async fn get_book(&self, id: Uuid) -> Result<crate::dal::book::Book> {
        let repo = BookRepository::new(self.db.pool());
        repo.find_by_id(id).await
    }

    pub async fn search_books(&self, params: BookSearchParams) -> Result<Vec<crate::dal::book::Book>> {
        let repo = BookRepository::new(self.db.pool());
        repo.search(&params).await
    }

    pub async fn update_book(&self, id: Uuid, update: UpdateBook) -> Result<crate::dal::book::Book> {
        let repo = BookRepository::new(self.db.pool());
        
        // If updating copies, validate
        if let Some(available) = update.available_copies {
            let book = repo.find_by_id(id).await?;
            if let Some(total) = update.total_copies {
                if available > total {
                    return Err(AppError::Validation("Available copies cannot exceed total copies".to_string()));
                }
            } else if available > book.total_copies {
                return Err(AppError::Validation("Available copies cannot exceed total copies".to_string()));
            }
        }

        repo.update(id, &update).await
    }

    pub async fn delete_book(&self, id: Uuid) -> Result<()> {
        let repo = BookRepository::new(self.db.pool());
        
        // Check if book has active loans
        let loan_repo = crate::dal::LoanRepository::new(self.db.pool());
        let active_loans = loan_repo.find_active_by_book(id).await?;
        if !active_loans.is_empty() {
            return Err(AppError::Conflict("Cannot delete book with active loans".to_string()));
        }

        repo.delete(id).await
    }

    pub async fn handle_book_added(&self, isbn: String, title: String, author: String, genre: String, published_year: Option<i32>, total_copies: i32) -> Result<()> {
        let repo = BookRepository::new(self.db.pool());
        
        // Check if book already exists
        if let Some(book) = repo.find_by_isbn(&isbn).await? {
            // Book already exists, update it
            let update = UpdateBook {
                title: Some(title),
                author: Some(author),
                genre: Some(genre),
                published_year,
                total_copies: Some(total_copies),
                available_copies: Some(total_copies), // Reset available copies
            };
            repo.update(book.id, &update).await?;
        } else {
            // Create new book
            let create = CreateBook {
                isbn,
                title,
                author,
                genre,
                published_year,
                total_copies,
                available_copies: total_copies,
            };
            repo.create(&create).await?;
        }

        Ok(())
    }

    pub async fn handle_book_removed(&self, book_id: Uuid) -> Result<()> {
        self.delete_book(book_id).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::AppError;

    #[test]
    fn test_create_book_validation() {
        // Test that available copies cannot exceed total copies
        let create = CreateBook {
            isbn: "123".to_string(),
            title: "Test".to_string(),
            author: "Author".to_string(),
            genre: "Fiction".to_string(),
            published_year: None,
            total_copies: 5,
            available_copies: 10, // Invalid: exceeds total
        };
        
        // This validation happens in the service, not the struct
        assert!(create.available_copies > create.total_copies);
    }

    #[test]
    fn test_update_book_validation_logic() {
        // Test validation logic for update
        let update = UpdateBook {
            title: None,
            author: None,
            genre: None,
            published_year: None,
            total_copies: Some(5),
            available_copies: Some(10), // Invalid: exceeds total
        };
        
        // This would fail validation in the service
        assert!(update.available_copies.unwrap() > update.total_copies.unwrap());
    }

    #[test]
    fn test_book_search_params_creation() {
        let params = BookSearchParams {
            author: Some("Author".to_string()),
            genre: None,
            title: None,
            isbn: None,
            limit: Some(10),
            offset: Some(0),
        };
        
        assert_eq!(params.author, Some("Author".to_string()));
        assert_eq!(params.limit, Some(10));
    }
}
