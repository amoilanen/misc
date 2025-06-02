use std::net::SocketAddr;
use std::str::FromStr;
use crate::DhtKey;

/// Parse a socket address string into a SocketAddr
pub fn parse_addr(addr_str: &str) -> Result<SocketAddr, std::net::AddrParseError> {
    SocketAddr::from_str(addr_str)
}

/// Format a NodeId as a hex string
pub fn format_node_id(id: &DhtKey) -> String {
    id.0.iter().map(|b| format!("{:02x}", b)).collect()
}

/// Generate a random port number in a given range
pub fn random_port(min: u16, max: u16) -> u16 {
    use rand::Rng;
    rand::thread_rng().gen_range(min..max)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr};

    #[test]
    fn test_parse_addr() {
        let addr = parse_addr("127.0.0.1:4000").unwrap();
        assert_eq!(addr.ip(), IpAddr::V4(Ipv4Addr::LOCALHOST));
        assert_eq!(addr.port(), 4000);
    }

    #[test]
    fn test_format_node_id() {
        let id = DhtKey::random();
        let hex = format_node_id(&id);
        assert_eq!(hex.len(), 64); // 32 bytes = 64 hex chars
    }

    #[test]
    fn test_random_port() {
        let port = random_port(4000, 5000);
        assert!(port >= 4000 && port < 5000);
    }
} 