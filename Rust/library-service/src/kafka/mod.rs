use rdkafka::{
    config::ClientConfig,
    consumer::{stream_consumer::StreamConsumer, Consumer},
    message::BorrowedMessage,
    Message,
};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::config::KafkaConfig;
use crate::dal::Database;
use crate::cache::Cache;
use crate::service::{BookService, LoanService};

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "event_type")]
pub enum BookEvent {
    #[serde(rename = "book_added")]
    BookAdded {
        book_id: Option<Uuid>,
        isbn: String,
        title: String,
        author: String,
        genre: String,
        published_year: Option<i32>,
        total_copies: i32,
    },
    #[serde(rename = "book_loaned")]
    BookLoaned {
        book_id: Uuid,
        user_id: Uuid,
    },
    #[serde(rename = "book_returned")]
    BookReturned {
        book_id: Uuid,
        user_id: Uuid,
    },
    #[serde(rename = "book_removed")]
    BookRemoved {
        book_id: Uuid,
    },
}

pub struct KafkaConsumer {
    config: KafkaConfig,
    db: Database,
    cache: Option<Cache>,
}

impl KafkaConsumer {
    pub fn new(config: &KafkaConfig, db: Database, cache: Option<Cache>) -> Self {
        Self {
            config: config.clone(),
            db,
            cache,
        }
    }

    pub async fn start(&self) -> anyhow::Result<()> {
        let consumer: StreamConsumer = ClientConfig::new()
            .set("bootstrap.servers", &self.config.brokers)
            .set("group.id", &self.config.group_id)
            .set("enable.partition.eof", "false")
            .set("session.timeout.ms", "6000")
            .set("enable.auto.commit", "true")
            .set("auto.offset.reset", "earliest")
            .create()?;

        consumer.subscribe(&[&self.config.topic])?;

        info!("Kafka consumer subscribed to topic: {}", self.config.topic);

        loop {
            match consumer.recv().await {
                Ok(message) => {
                    if let Err(e) = self.handle_message(&message).await {
                        error!("Error handling Kafka message: {}", e);
                    }
                }
                Err(e) => {
                    warn!("Kafka consumer error: {}", e);
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
            }
        }
    }

    async fn handle_message(&self, message: &BorrowedMessage<'_>) -> anyhow::Result<()> {
        let payload = match message.payload_view::<str>() {
            None => {
                warn!("Received empty message");
                return Ok(());
            }
            Some(Ok(s)) => s,
            Some(Err(e)) => {
                error!("Error deserializing message payload: {}", e);
                return Ok(());
            }
        };

        let event: BookEvent = match serde_json::from_str(payload) {
            Ok(e) => e,
            Err(e) => {
                error!("Error parsing event JSON: {}", e);
                return Ok(());
            }
        };

        info!("Received event: {:?}", event);

        match event {
            BookEvent::BookAdded {
                isbn,
                title,
                author,
                genre,
                published_year,
                total_copies,
                ..
            } => {
                let service = BookService::new(self.db.clone(), self.cache.clone());
                if let Err(e) = service
                    .handle_book_added(isbn, title, author, genre, published_year, total_copies)
                    .await
                {
                    error!("Error handling book_added event: {}", e);
                }
            }
            BookEvent::BookLoaned { book_id, user_id } => {
                let service = LoanService::new(self.db.clone());
                if let Err(e) = service.handle_book_loaned(book_id, user_id).await {
                    error!("Error handling book_loaned event: {}", e);
                }
            }
            BookEvent::BookReturned { book_id, user_id } => {
                let service = LoanService::new(self.db.clone());
                if let Err(e) = service.handle_book_returned(book_id, user_id).await {
                    error!("Error handling book_returned event: {}", e);
                }
            }
            BookEvent::BookRemoved { book_id } => {
                let service = BookService::new(self.db.clone(), self.cache.clone());
                if let Err(e) = service.handle_book_removed(book_id).await {
                    error!("Error handling book_removed event: {}", e);
                }
            }
        }

        Ok(())
    }
}

