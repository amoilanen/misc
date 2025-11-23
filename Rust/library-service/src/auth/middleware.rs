use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use axum_extra::headers::Authorization;
use axum_extra::TypedHeader;
use tracing::warn;
use uuid::Uuid;

use crate::auth::jwt::{verify_token, Claims};
use crate::error::AppError;

#[derive(Clone)]
pub struct AuthState {
    pub jwt_secret: String,
}

#[allow(dead_code)]
pub async fn require_auth(
    State(auth_state): State<AuthState>,
    TypedHeader(auth): TypedHeader<Authorization<axum_extra::headers::authorization::Bearer>>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = auth.token();
    
    match verify_token(token, &auth_state.jwt_secret) {
        Ok(claims) => {
            // Attach user info to request extensions
            request.extensions_mut().insert(claims.user_id()?);
            request.extensions_mut().insert(claims.clone());
            Ok(next.run(request).await)
        }
        Err(e) => {
            warn!("Authentication failed: {}", e);
            Err(e)
        }
    }
}

#[allow(dead_code)]
pub async fn require_role(
    required_role: &'static str,
    State(auth_state): State<AuthState>,
    TypedHeader(auth): TypedHeader<Authorization<axum_extra::headers::authorization::Bearer>>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = auth.token();
    
    match verify_token(token, &auth_state.jwt_secret) {
        Ok(claims) => {
            if claims.role != required_role {
                return Err(AppError::BadRequest(
                    format!("Insufficient permissions. Required role: {}", required_role)
                ));
            }
            
            request.extensions_mut().insert(claims.user_id()?);
            request.extensions_mut().insert(claims);
            Ok(next.run(request).await)
        }
        Err(e) => {
            warn!("Authentication failed: {}", e);
            Err(e)
        }
    }
}

// Helper to extract user ID from request extensions
#[allow(dead_code)]
pub fn get_user_id(request: &Request) -> Option<Uuid> {
    request.extensions().get::<Uuid>().copied()
}

// Helper to extract claims from request extensions
#[allow(dead_code)]
pub fn get_claims(request: &Request) -> Option<Claims> {
    request.extensions().get::<Claims>().cloned()
}

