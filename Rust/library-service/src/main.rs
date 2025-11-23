mod config;
mod dal;
mod error;
mod routes;
mod service;
#[cfg(feature = "kafka")]
mod kafka;
mod auth;
mod cache;

use anyhow::Result;
use tracing::{info, warn};
use crate::config::Config;
use crate::dal::Database;
use crate::routes::create_router;
#[cfg(feature = "kafka")]
use crate::kafka::KafkaConsumer;
use crate::cache::Cache;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize enhanced tracing with JSON output option
    let subscriber = tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .with_target(false)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .finish();
    
    tracing::subscriber::set_global_default(subscriber)
        .expect("Failed to set tracing subscriber");

    // Load configuration
    let config = Config::load()?;
    info!("Starting library service on {}", config.server.address);
    info!(version = env!("CARGO_PKG_VERSION"), "Library Service");

    // Initialize database
    let db = Database::new(&config.database.url).await?;
    info!("Database connection established");

    // Run migrations
    db.run_migrations().await?;
    info!("Database migrations completed");

    // Initialize Redis cache
    let cache = match Cache::new(&config.redis.url, config.cache.ttl_seconds).await {
        Ok(c) => {
            info!("Redis cache connection established");
            Some(c)
        }
        Err(e) => {
            warn!("Failed to connect to Redis cache: {}. Continuing without cache.", e);
            None
        }
    };

    // Start Kafka consumer in background (if Kafka feature is enabled)
    #[cfg(feature = "kafka")]
    {
        let kafka_consumer = KafkaConsumer::new(&config.kafka, db.clone(), cache.clone());
        tokio::spawn(async move {
            if let Err(e) = kafka_consumer.start().await {
                tracing::error!("Kafka consumer error: {}", e);
            }
        });
        info!("Kafka consumer started");
    }
    
    #[cfg(not(feature = "kafka"))]
    {
        warn!("Kafka feature is disabled. Kafka consumer will not start.");
    }

    // Create router
    let app = create_router(db, cache, config.auth.clone());

    // Start server
    let listener = tokio::net::TcpListener::bind(&config.server.address).await?;
    info!("Server listening on {}", config.server.address);
    axum::serve(listener, app).await?;

    Ok(())
}

