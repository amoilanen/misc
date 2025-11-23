use sqlx::{PgPool, FromRow};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::error::{AppError, Result};

#[derive(Debug, Clone, FromRow)]
pub struct Book {
    pub id: Uuid,
    pub isbn: String,
    pub title: String,
    pub author: String,
    pub genre: String,
    pub published_year: Option<i32>,
    pub total_copies: i32,
    pub available_copies: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct BookSearchParams {
    pub author: Option<String>,
    pub genre: Option<String>,
    pub title: Option<String>,
    pub isbn: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub struct BookRepository<'a> {
    pool: &'a PgPool,
}

impl<'a> BookRepository<'a> {
    pub fn new(pool: &'a PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, book: &CreateBook) -> Result<Book> {
        let book = sqlx::query_as::<_, Book>(
            r#"
            INSERT INTO books (isbn, title, author, genre, published_year, total_copies, available_copies)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
        )
        .bind(&book.isbn)
        .bind(&book.title)
        .bind(&book.author)
        .bind(&book.genre)
        .bind(book.published_year)
        .bind(book.total_copies)
        .bind(book.available_copies)
        .fetch_one(self.pool)
        .await?;

        Ok(book)
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Book> {
        let book = sqlx::query_as::<_, Book>(
            "SELECT * FROM books WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Book with id {} not found", id)))?;

        Ok(book)
    }

    pub async fn find_by_isbn(&self, isbn: &str) -> Result<Option<Book>> {
        let book = sqlx::query_as::<_, Book>(
            "SELECT * FROM books WHERE isbn = $1",
        )
        .bind(isbn)
        .fetch_optional(self.pool)
        .await?;

        Ok(book)
    }

    pub async fn search(&self, params: &BookSearchParams) -> Result<Vec<Book>> {
        let mut query = "SELECT * FROM books WHERE 1=1".to_string();
        let mut conditions = Vec::new();
        let mut bind_index = 1;

        if let Some(ref _author) = params.author {
            conditions.push(format!("author ILIKE ${}", bind_index));
            bind_index += 1;
        }
        if let Some(ref _genre) = params.genre {
            conditions.push(format!("genre ILIKE ${}", bind_index));
            bind_index += 1;
        }
        if let Some(ref _title) = params.title {
            conditions.push(format!("title ILIKE ${}", bind_index));
            bind_index += 1;
        }
        if let Some(ref _isbn) = params.isbn {
            conditions.push(format!("isbn = ${}", bind_index));
            bind_index += 1;
        }

        if !conditions.is_empty() {
            query.push_str(" AND ");
            query.push_str(&conditions.join(" AND "));
        }

        query.push_str(" ORDER BY title LIMIT $");
        query.push_str(&bind_index.to_string());
        bind_index += 1;
        query.push_str(" OFFSET $");
        query.push_str(&bind_index.to_string());

        let mut query_builder = sqlx::query_as::<_, Book>(&query);

        if let Some(ref author) = params.author {
            query_builder = query_builder.bind(format!("%{}%", author));
        }
        if let Some(ref genre) = params.genre {
            query_builder = query_builder.bind(format!("%{}%", genre));
        }
        if let Some(ref title) = params.title {
            query_builder = query_builder.bind(format!("%{}%", title));
        }
        if let Some(ref isbn) = params.isbn {
            query_builder = query_builder.bind(isbn);
        }

        let limit = params.limit.unwrap_or(50);
        let offset = params.offset.unwrap_or(0);
        query_builder = query_builder.bind(limit);
        query_builder = query_builder.bind(offset);

        let books = query_builder.fetch_all(self.pool).await?;
        Ok(books)
    }

    pub async fn update(&self, id: Uuid, update: &UpdateBook) -> Result<Book> {
        let mut query = "UPDATE books SET ".to_string();
        let mut updates = Vec::new();
        let mut bind_index = 1;

        if let Some(ref _title) = update.title {
            updates.push(format!("title = ${}", bind_index));
            bind_index += 1;
        }
        if let Some(ref _author) = update.author {
            updates.push(format!("author = ${}", bind_index));
            bind_index += 1;
        }
        if let Some(ref _genre) = update.genre {
            updates.push(format!("genre = ${}", bind_index));
            bind_index += 1;
        }
        if let Some(_published_year) = update.published_year {
            updates.push(format!("published_year = ${}", bind_index));
            bind_index += 1;
        }
        if let Some(_total_copies) = update.total_copies {
            updates.push(format!("total_copies = ${}", bind_index));
            bind_index += 1;
        }
        if let Some(_available_copies) = update.available_copies {
            updates.push(format!("available_copies = ${}", bind_index));
            bind_index += 1;
        }

        if updates.is_empty() {
            return self.find_by_id(id).await;
        }

        query.push_str(&updates.join(", "));
        query.push_str(&format!(" WHERE id = ${} RETURNING *", bind_index));

        let mut query_builder = sqlx::query_as::<_, Book>(&query);

        if let Some(ref title) = update.title {
            query_builder = query_builder.bind(title);
        }
        if let Some(ref author) = update.author {
            query_builder = query_builder.bind(author);
        }
        if let Some(ref genre) = update.genre {
            query_builder = query_builder.bind(genre);
        }
        if let Some(published_year) = update.published_year {
            query_builder = query_builder.bind(published_year);
        }
        if let Some(total_copies) = update.total_copies {
            query_builder = query_builder.bind(total_copies);
        }
        if let Some(available_copies) = update.available_copies {
            query_builder = query_builder.bind(available_copies);
        }

        query_builder = query_builder.bind(id);

        let book = query_builder
            .fetch_optional(self.pool)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Book with id {} not found", id)))?;

        Ok(book)
    }

    pub async fn delete(&self, id: Uuid) -> Result<()> {
        let result = sqlx::query("DELETE FROM books WHERE id = $1")
            .bind(id)
            .execute(self.pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Book with id {} not found", id)));
        }

        Ok(())
    }

    pub async fn increment_available_copies(&self, id: Uuid, amount: i32) -> Result<Book> {
        let book = sqlx::query_as::<_, Book>(
            r#"
            UPDATE books
            SET available_copies = available_copies + $1
            WHERE id = $2
            RETURNING *
            "#,
        )
        .bind(amount)
        .bind(id)
        .fetch_optional(self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Book with id {} not found", id)))?;

        Ok(book)
    }

    pub async fn decrement_available_copies(&self, id: Uuid, amount: i32) -> Result<Book> {
        let book = sqlx::query_as::<_, Book>(
            r#"
            UPDATE books
            SET available_copies = available_copies - $1
            WHERE id = $2 AND available_copies >= $1
            RETURNING *
            "#,
        )
        .bind(amount)
        .bind(id)
        .fetch_optional(self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Book with id {} not found or insufficient copies", id)))?;

        Ok(book)
    }
}

#[derive(Debug, Clone)]
pub struct CreateBook {
    pub isbn: String,
    pub title: String,
    pub author: String,
    pub genre: String,
    pub published_year: Option<i32>,
    pub total_copies: i32,
    pub available_copies: i32,
}

#[derive(Debug, Clone)]
pub struct UpdateBook {
    pub title: Option<String>,
    pub author: Option<String>,
    pub genre: Option<String>,
    pub published_year: Option<i32>,
    pub total_copies: Option<i32>,
    pub available_copies: Option<i32>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_book_struct() {
        let create = CreateBook {
            isbn: "978-0-123456-78-9".to_string(),
            title: "Test Book".to_string(),
            author: "Test Author".to_string(),
            genre: "Fiction".to_string(),
            published_year: Some(2023),
            total_copies: 5,
            available_copies: 5,
        };
        
        assert_eq!(create.isbn, "978-0-123456-78-9");
        assert_eq!(create.total_copies, 5);
    }

    #[test]
    fn test_update_book_struct() {
        let update = UpdateBook {
            title: Some("Updated Title".to_string()),
            author: None,
            genre: None,
            published_year: None,
            total_copies: None,
            available_copies: None,
        };
        
        assert_eq!(update.title, Some("Updated Title".to_string()));
        assert_eq!(update.author, None);
    }

    #[test]
    fn test_book_search_params() {
        let params = BookSearchParams {
            author: Some("Author".to_string()),
            genre: Some("Fiction".to_string()),
            title: None,
            isbn: None,
            limit: Some(10),
            offset: Some(0),
        };
        
        assert_eq!(params.author, Some("Author".to_string()));
        assert_eq!(params.limit, Some(10));
    }
}
