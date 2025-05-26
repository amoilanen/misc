use std::env;
use std::net::SocketAddr;
use std::str::FromStr;
use simple_dht::{DhtNode, rpc::RpcServer};

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
