pub mod book;
pub mod user;
pub mod loan;
pub mod auth_route;

use axum::{
    Router,
    routing::{get, post},
};
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
};

use crate::dal::Database;
use crate::cache::Cache;
use crate::auth::middleware::AuthState;
use crate::config::AuthConfig;

pub fn create_router(db: Database, cache: Option<Cache>, auth_config: AuthConfig) -> Router {
    let auth_state = AuthState {
        jwt_secret: auth_config.jwt_secret,
    };

    Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/auth/login", post(auth_route::login))
        .nest("/api/v1/books", book::routes())
        .nest("/api/v1/users", user::routes())
        .nest("/api/v1/loans", loan::routes())
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|_request: &axum::http::Request<_>| {
                    tracing::info_span!(
                        "http_request",
                        method = %_request.method(),
                        uri = %_request.uri(),
                        version = ?_request.version(),
                    )
                })
        )
        .layer(CorsLayer::permissive())
        .with_state((db, cache, auth_state))
}

async fn health_check() -> &'static str {
    "OK"
}

