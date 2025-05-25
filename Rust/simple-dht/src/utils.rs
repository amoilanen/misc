use std::net::SocketAddr;
use std::str::FromStr;
use crate::NodeId;

/// Parse a socket address string into a SocketAddr
pub fn parse_addr(addr_str: &str) -> Result<SocketAddr, std::net::AddrParseError> {
    SocketAddr::from_str(addr_str)
}

/// Format a NodeId as a hex string
pub fn format_node_id(id: &NodeId) -> String {
    id.0.iter().map(|b| format!("{:02x}", b)).collect()
}

/// Calculate the XOR distance between two NodeIds
pub fn xor_distance(a: &NodeId, b: &NodeId) -> u128 {
    a.0.iter()
        .zip(b.0.iter())
        .fold(0, |acc, (x, y)| (acc << 8) + (x ^ y) as u128)
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
        let id = NodeId::random();
        let hex = format_node_id(&id);
        assert_eq!(hex.len(), 64); // 32 bytes = 64 hex chars
    }

    #[test]
    fn test_xor_distance() {
        let id1 = NodeId::random();
        let id2 = NodeId::random();
        let id3 = id1.clone();

        assert!(xor_distance(&id1, &id2) > 0);
        assert_eq!(xor_distance(&id1, &id3), 0);
    }

    #[test]
    fn test_random_port() {
        let port = random_port(4000, 5000);
        assert!(port >= 4000 && port < 5000);
    }
} 