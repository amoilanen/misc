use clap::Parser;
use elysium_client::server::RpcServer;
use elysium_node::Node;
use std::net::SocketAddr;
use std::str::FromStr;
use tracing::{info, error};

#[derive(Parser)]
#[command(name = "elysium-client")]
#[command(about = "Elysium blockchain RPC client server")]
struct Args {
    /// RPC server address (e.g., 127.0.0.1:8545)
    #[arg(short, long, default_value = "127.0.0.1:8545")]
    rpc_addr: String,
    
    /// Node address to connect to (e.g., 127.0.0.1:8080)
    #[arg(short, long, default_value = "127.0.0.1:8080")]
    node_addr: String,
    
    /// Mining difficulty
    #[arg(short, long, default_value_t = 1)]
    difficulty: u64,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    
    let args = Args::parse();
    
    info!("Starting Elysium RPC client server...");
    
    // Create node
    let node = Node::new(args.difficulty);
    info!("Node created with difficulty: {}", args.difficulty);
    
    // Create RPC server
    let rpc_addr = SocketAddr::from_str(&args.rpc_addr)?;
    let rpc_server = RpcServer::new(node, rpc_addr)?;
    let _handle = rpc_server.start_async();
    
    info!("RPC server started successfully on {}", rpc_addr);
    
    // Keep the server running
    tokio::signal::ctrl_c().await?;
    info!("Shutting down...");
    
    Ok(())
}

