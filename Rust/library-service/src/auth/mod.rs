pub mod jwt;
pub mod middleware;
pub mod password;

pub use jwt::{Claims, create_token, verify_token};
pub use middleware::{require_auth, require_role, AuthState};
pub use password::{hash_password, verify_password};

