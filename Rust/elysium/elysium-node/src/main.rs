use clap::Parser;
use elysium_node::{Node, Network, Miner};
use std::net::SocketAddr;
use std::str::FromStr;
use std::time::Duration;
use tracing::{info, error};

#[derive(Parser)]
#[command(name = "elysium-node")]
#[command(about = "Elysium blockchain node")]
struct Args {
    /// Listen address (e.g., 127.0.0.1:8080)
    #[arg(short, long, default_value = "127.0.0.1:8080")]
    listen: String,
    
    /// Mining difficulty
    #[arg(short, long, default_value_t = 1)]
    difficulty: u64,
    
    /// Enable mining
    #[arg(short, long)]
    mine: bool,
    
    /// Mining interval in seconds
    #[arg(long, default_value_t = 5)]
    mining_interval: u64,
    
    /// Peer addresses (comma-separated)
    #[arg(short, long)]
    peers: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    
    let args = Args::parse();
    
    info!("Starting Elysium node...");
    
    // Create node
    let node = Node::new(args.difficulty);
    info!("Node created with difficulty: {}", args.difficulty);
    
    // Create network
    let listen_addr = SocketAddr::from_str(&args.listen)?;
    let mut network = Network::new(listen_addr);
    
    // Add peers
    if let Some(peers_str) = args.peers {
        for peer_str in peers_str.split(',') {
            if let Ok(peer) = SocketAddr::from_str(peer_str.trim()) {
                network.add_peer(peer);
            }
        }
    }
    
    // Start network listener
    let _network_handle = network.listen().await?;
    
    // Start miner if enabled
    if args.mine {
        info!("Starting miner...");
        let miner = Miner::new(node.clone(), Duration::from_secs(args.mining_interval));
        let _miner_handle = miner.start().await?;
    }
    
    info!("Node started successfully. Listening on {}", listen_addr);
    
    // Keep the node running
    tokio::signal::ctrl_c().await?;
    info!("Shutting down...");
    
    Ok(())
}

