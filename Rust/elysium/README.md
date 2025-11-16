# Elysium Blockchain

A production-ready Ethereum-like blockchain implementation in Rust, focusing on simplicity and speed following the Pareto principle (80% of the result with 20% of the effort).

## Features

- **Core Blockchain**: Block structure, transactions, accounts, and state management
- **Proof of Work**: Mining with configurable difficulty
- **P2P Networking**: Basic peer-to-peer communication for block and transaction propagation
- **JSON-RPC API**: Standard RPC interface for interacting with the blockchain
- **SDK**: Rust SDK for building applications on Elysium
- **Production Ready**: Comprehensive error handling, logging, and testing

## Architecture

The project is organized into four main crates:

- **elysium-core**: Core blockchain data structures and logic
- **elysium-node**: Blockchain node implementation with P2P networking
- **elysium-client**: JSON-RPC server for external access
- **elysium-sdk**: Client SDK for building applications

## Quick Start

### Prerequisites

- Rust 1.70+ (install from [rustup.rs](https://rustup.rs/))
- Cargo (comes with Rust)

### Building

```bash
# Clone the repository
git clone <repository-url>
cd elysium

# Build all crates
cargo build --release

# Run tests
cargo test
```

### Running a Node

#### Start a mining node:

```bash
cargo run --bin elysium-node -- --listen 127.0.0.1:8080 --difficulty 1 --mine --mining-interval 5
```

#### Start a non-mining node:

```bash
cargo run --bin elysium-node -- --listen 127.0.0.1:8081 --difficulty 1
```

#### Connect nodes together:

```bash
# Node 1
cargo run --bin elysium-node -- --listen 127.0.0.1:8080 --difficulty 1 --mine

# Node 2 (connect to node 1)
cargo run --bin elysium-node -- --listen 127.0.0.1:8081 --difficulty 1 --peers 127.0.0.1:8080
```

### Running the RPC Server

```bash
cargo run --bin elysium-client -- --rpc-addr 127.0.0.1:8545 --difficulty 1
```

The RPC server will be available at `http://127.0.0.1:8545`

## Usage Examples

### Using the SDK

```rust
use elysium_sdk::ElysiumClient;
use elysium_core::account::KeyPair;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create client
    let client = ElysiumClient::new("http://127.0.0.1:8545");
    
    // Get blockchain height
    let height = client.get_height().await?;
    println!("Blockchain height: {}", height);
    
    // Create key pairs
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    
    // Get balances
    let alice_balance = client.get_balance(&alice.address()).await?;
    println!("Alice balance: {}", alice_balance);
    
    // Transfer funds (if Alice has balance)
    if alice_balance > 0 {
        let tx_hash = client.transfer(&alice, &bob.address(), 10).await?;
        println!("Transaction sent: {}", tx_hash);
    }
    
    Ok(())
}
```

### Using JSON-RPC Directly

```bash
# Get blockchain height
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"elysium_getHeight","params":[],"id":1}'

# Get balance
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"elysium_getBalance","params":["<address_hex>"],"id":1}'

# Send transaction
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"elysium_sendTransaction",
    "params":[{
      "from": "<from_address>",
      "to": "<to_address>",
      "amount": 100,
      "nonce": 0,
      "transaction_type": "Transfer",
      "signature": "<signature>"
    }],
    "id":1
  }'
```

## API Reference

### RPC Methods

- `elysium_getHeight()` - Get current blockchain height
- `elysium_getBlockByNumber(number: u64)` - Get block by number
- `elysium_getLatestBlock()` - Get the latest block
- `elysium_getBalance(address: String)` - Get account balance
- `elysium_getNonce(address: String)` - Get account nonce
- `elysium_sendTransaction(tx: Transaction)` - Send a transaction
- `elysium_getPendingTransactions()` - Get pending transactions
- `elysium_mineBlock()` - Manually mine a block

## Development

### Running Tests

```bash
# Run all tests
cargo test

# Run tests for a specific crate
cargo test -p elysium-core
cargo test -p elysium-node
cargo test -p elysium-client
cargo test -p elysium-sdk
```

### Code Structure

```
elysium/
├── elysium-core/          # Core blockchain logic
│   ├── src/
│   │   ├── account.rs     # Account and key pair management
│   │   ├── block.rs       # Block structure and mining
│   │   ├── blockchain.rs  # Blockchain state management
│   │   ├── transaction.rs # Transaction handling
│   │   └── error.rs       # Error types
│   └── Cargo.toml
├── elysium-node/          # Node implementation
│   ├── src/
│   │   ├── node.rs        # Node logic
│   │   ├── network.rs     # P2P networking
│   │   ├── miner.rs       # Mining logic
│   │   └── main.rs        # Node binary
│   └── Cargo.toml
├── elysium-client/        # RPC server
│   ├── src/
│   │   ├── rpc.rs         # RPC method definitions
│   │   ├── server.rs      # RPC server implementation
│   │   └── main.rs        # Client binary
│   └── Cargo.toml
├── elysium-sdk/           # SDK for applications
│   ├── src/
│   │   ├── client.rs      # SDK client
│   │   └── error.rs       # SDK errors
│   └── Cargo.toml
└── Cargo.toml             # Workspace configuration
```

## Documentation

Comprehensive documentation is available. See **[DOCS.md](DOCS.md)** for the complete documentation index.

**Quick Links:**
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed system architecture and design (14KB)
- **[ALGORITHMS.md](ALGORITHMS.md)** - Cryptographic algorithms and consensus mechanisms (15KB)
- **[USER_GUIDE.md](USER_GUIDE.md)** - Complete user and developer guide (14KB)
- **[API.md](API.md)** - Complete JSON-RPC API reference
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[SECURITY.md](SECURITY.md)** - Security features and best practices
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide

## Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

[Add your license here]

## Acknowledgments

Built following the Pareto principle - focusing on the essential 20% that delivers 80% of the value for a production blockchain system.

