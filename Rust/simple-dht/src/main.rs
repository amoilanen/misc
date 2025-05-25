use std::{collections::HashMap, env, sync::Arc};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    net::{TcpListener, TcpStream},
    sync::Mutex,
};
use rand::Rng;
use sha2::{Digest, Sha256};
use std::net::SocketAddr;
use std::str::FromStr;
use simple_dht::{DhtNode, NodeId, rpc::RpcServer};

#[derive(Clone, Debug)]
struct PeerInfo {
    id: String,
    addr: String,
}

#[derive(Clone)]
struct Node {
    id: String,
    addr: String,
    peers: Arc<Mutex<Vec<PeerInfo>>>,
    store: Arc<Mutex<HashMap<String, String>>>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        println!("Usage: {} <port> [bootstrap_addr]", args[0]);
        return Ok(());
    }

    let port = args[1].parse::<u16>()?;
    let addr = SocketAddr::from_str(&format!("127.0.0.1:{}", port))?;
    
    let node = DhtNode::new(addr);
    println!("Starting DHT node {} on {}", node.id.0.iter().map(|b| format!("{:02x}", b)).collect::<String>(), addr);

    // Bootstrap if bootstrap address is provided
    if args.len() > 2 {
        let bootstrap_addr = SocketAddr::from_str(&args[2])?;
        println!("Bootstrapping from {}", bootstrap_addr);
        node.bootstrap(bootstrap_addr).await?;
    }

    // Start RPC server
    let server = RpcServer::new(node);
    server.start().await?;

    Ok(())
}

async fn bootstrap(node: &Node, bootstrap_addr: String) {
    if let Ok(mut stream) = TcpStream::connect(&bootstrap_addr).await {
        let hello = format!("HELLO {} {}\n", node.id, node.addr);
        stream.write_all(hello.as_bytes()).await.unwrap();
    }
}

async fn handle_client(stream: TcpStream, node: Node) {
    let (r, mut w) = stream.into_split();
    let mut reader = BufReader::new(r);
    let mut line = String::new();

    while reader.read_line(&mut line).await.unwrap() > 0 {
        let tokens: Vec<&str> = line.trim().splitn(3, ' ').collect();

        match tokens.get(0) {
            Some(&"HELLO") => {
                if let (Some(peer_id), Some(peer_addr)) = (tokens.get(1), tokens.get(2)) {
                    let mut peers = node.peers.lock().await;
                    let new_peer = PeerInfo {
                        id: peer_id.to_string(),
                        addr: peer_addr.to_string(),
                    };
                    if !peers.iter().any(|p| p.id == new_peer.id) {
                        println!("Discovered peer {} at {}", &peer_id[..8], peer_addr);
                        peers.push(new_peer);
                    }
                }
            }

            Some(&"STORE") => {
                if let (Some(key), Some(value)) = (tokens.get(1), tokens.get(2)) {
                    route_store(&node, key.to_string(), value.to_string()).await;
                    w.write_all(b"STORED\n").await.unwrap();
                }
            }

            Some(&"FIND") => {
                if let Some(key) = tokens.get(1) {
                    match route_find(&node, key.to_string()).await {
                        Some(val) => {
                            let msg = format!("FOUND {}\n", val);
                            w.write_all(msg.as_bytes()).await.unwrap();
                        }
                        None => {
                            w.write_all(b"NOTFOUND\n").await.unwrap();
                        }
                    }
                }
            }

            Some(&"FOUND") => {
                // Passive result handler (optional)
                println!("Response: {}", line.trim());
            }

            _ => {
                w.write_all(b"ERR\n").await.unwrap();
            }
        }

        line.clear();
    }
}

async fn route_store(node: &Node, key: String, value: String) {
    let key_hash = hash(&key);
    let mut closest = node.id.clone();
    let mut closest_dist = xor_distance(&key_hash, &hash(&closest));

    let peers = node.peers.lock().await;
    for peer in peers.iter() {
        let peer_hash = hash(&peer.id);
        let dist = xor_distance(&key_hash, &peer_hash);
        if dist < closest_dist {
            closest = peer.id.clone();
            closest_dist = dist;
        }
    }

    if closest == node.id {
        let mut store = node.store.lock().await;
        store.insert(key_hash, value);
        println!("Stored key locally");
    } else {
        if let Some(peer) = peers.iter().find(|p| p.id == closest) {
            if let Ok(mut stream) = TcpStream::connect(&peer.addr).await {
                let msg = format!("STORE {} {}\n", key, value);
                stream.write_all(msg.as_bytes()).await.ok();
            }
        }
    }
}

async fn route_find(node: &Node, key: String) -> Option<String> {
    let key_hash = hash(&key);
    {
        let store = node.store.lock().await;
        if let Some(val) = store.get(&key_hash) {
            return Some(val.clone());
        }
    }

    let peers = node.peers.lock().await;
    let mut closest = node.id.clone();
    let mut closest_dist = xor_distance(&key_hash, &hash(&closest));

    for peer in peers.iter() {
        let dist = xor_distance(&key_hash, &peer.id);
        if dist < closest_dist {
            closest = peer.id.clone();
            closest_dist = dist;
        }
    }

    if closest == node.id {
        None
    } else if let Some(peer) = peers.iter().find(|p| p.id == closest) {
        if let Ok(mut stream) = TcpStream::connect(&peer.addr).await {
            let msg = format!("FIND {}\n", key);
            stream.write_all(msg.as_bytes()).await.ok();
            let mut reader = BufReader::new(stream);
            let mut line = String::new();
            if reader.read_line(&mut line).await.ok()? > 0 {
                if line.starts_with("FOUND") {
                    return line.trim()[6..].parse().ok();
                }
            }
        }
        None
    } else {
        None
    }
}

fn hash(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input);
    hex::encode(hasher.finalize())
}

fn xor_distance(a: &str, b: &str) -> u128 {
    let a = hex::decode(&a[..64]).unwrap_or_default();
    let b = hex::decode(&b[..64]).unwrap_or_default();
    a.iter().zip(b.iter()).fold(0, |acc, (x, y)| (acc << 8) + (x ^ y) as u128)
}

fn random_id() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill(&mut bytes);
    hex::encode(bytes)
}
