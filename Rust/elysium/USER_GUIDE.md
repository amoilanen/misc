# Elysium Blockchain User Guide

Comprehensive guide for users, developers, and operators of the Elysium blockchain.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Concepts](#core-concepts)
4. [Account Management](#account-management)
5. [Creating Transactions](#creating-transactions)
6. [Running a Node](#running-a-node)
7. [Using the SDK](#using-the-sdk)
8. [Using the RPC API](#using-the-rpc-api)
9. [Mining Blocks](#mining-blocks)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Introduction

Elysium is a blockchain platform that enables secure, decentralized transactions. This guide will help you understand and use the Elysium blockchain effectively.

### What is Elysium?

Elysium is:
- A **blockchain**: A distributed ledger of transactions
- **Decentralized**: No single point of control
- **Secure**: Cryptographically protected transactions
- **Open**: Anyone can participate

### Key Features

- **Fast Transactions**: Quick confirmation times
- **Low Fees**: Efficient transaction processing
- **Secure**: Ed25519 signatures and SHA-256 hashing
- **Developer Friendly**: Comprehensive SDK and API

## Getting Started

### Installation

**Prerequisites:**
- Rust 1.70+ ([Install Rust](https://rustup.rs/))
- Network connectivity (for P2P)

**Build from Source:**
```bash
git clone <repository-url>
cd elysium
cargo build --release
```

**Verify Installation:**
```bash
cargo test
```

### Quick Start

1. **Start a Node:**
```bash
cargo run --bin elysium-node -- --listen 127.0.0.1:8080 --difficulty 1 --mine
```

2. **Start RPC Server:**
```bash
cargo run --bin elysium-client -- --rpc-addr 127.0.0.1:8545
```

3. **Test Connection:**
```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"elysium_getHeight","params":[],"id":1}'
```

## Core Concepts

### Blockchain

A **blockchain** is a chain of blocks, where each block contains transactions. Once added, blocks cannot be modified.

**Properties:**
- **Immutable**: History cannot be changed
- **Distributed**: Copies exist on multiple nodes
- **Consensus**: All nodes agree on valid blocks

### Blocks

A **block** is a collection of transactions that have been validated and added to the chain.

**Block Contents:**
- Block number (height)
- Previous block hash
- Transactions
- Mining proof (nonce)
- Timestamp

### Transactions

A **transaction** represents a transfer of value from one account to another.

**Transaction Contents:**
- From address (sender)
- To address (receiver)
- Amount
- Nonce (sequence number)
- Signature (cryptographic proof)

### Accounts

An **account** represents a user's identity on the blockchain.

**Account Properties:**
- **Address**: Unique identifier (derived from public key)
- **Balance**: Current token balance
- **Nonce**: Transaction counter (prevents replay attacks)

### Addresses

An **address** is a unique identifier for an account, derived from a public key.

**Format:**
- 64 hexadecimal characters
- Often displayed as `0x` + first 16 characters
- Example: `0xa1b2c3d4e5f67890...`

## Account Management

### Creating an Account

**Using Rust SDK:**
```rust
use elysium_core::account::KeyPair;

// Generate new key pair
let keypair = KeyPair::generate();

// Get address
let address = keypair.address();
println!("Address: {}", address);
```

**Key Components:**
- **Private Key**: Keep secret! Used to sign transactions
- **Public Key**: Can be shared, used for verification
- **Address**: Derived from public key, used as account identifier

### Securing Your Account

**Critical Security Rules:**

1. **Never Share Private Keys**
   - Private keys give full control
   - Anyone with your private key can spend your funds

2. **Backup Your Keys**
   - Store securely (encrypted, offline)
   - Multiple backups in different locations

3. **Use Hardware Wallets** (when available)
   - Most secure option
   - Private keys never leave device

4. **Verify Addresses**
   - Always double-check recipient addresses
   - One typo = lost funds

### Checking Account Balance

**Using SDK:**
```rust
use elysium_sdk::ElysiumClient;

let client = ElysiumClient::new("http://127.0.0.1:8545");
let balance = client.get_balance(&address).await?;
println!("Balance: {}", balance);
```

**Using RPC:**
```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"elysium_getBalance",
    "params":["<address_hex>"],
    "id":1
  }'
```

### Checking Account Nonce

**Using SDK:**
```rust
let nonce = client.get_nonce(&address).await?;
println!("Next nonce: {}", nonce);
```

**Why Nonce Matters:**
- Must be sequential (0, 1, 2, ...)
- Prevents replay attacks
- Must match current account nonce

## Creating Transactions

### Basic Transaction

**Using SDK:**
```rust
use elysium_core::{Transaction, account::KeyPair};
use elysium_sdk::ElysiumClient;

// Create client
let client = ElysiumClient::new("http://127.0.0.1:8545");

// Get sender and receiver
let sender = KeyPair::generate();
let receiver = KeyPair::generate();

// Get current nonce
let nonce = client.get_nonce(&sender.address()).await?;

// Create transaction
let mut tx = Transaction::new(
    sender.address(),
    receiver.address(),
    100,  // amount
    nonce,
);

// Sign transaction
tx.sign(sender.signing_key())?;

// Send transaction
let tx_hash = client.send_transaction(&tx).await?;
println!("Transaction hash: {}", tx_hash);
```

### Transaction Validation

Before sending, transactions are validated:

1. **Signature**: Must be valid Ed25519 signature
2. **Balance**: Sender must have sufficient balance
3. **Nonce**: Must match account's current nonce
4. **Amount**: Must be greater than 0
5. **Self-transfer**: Cannot send to self
6. **Duplicates**: Cannot replay same transaction

### Transaction Lifecycle

1. **Creation**: User creates and signs transaction
2. **Submission**: Transaction sent to node
3. **Validation**: Node validates transaction
4. **Mempool**: Added to pending transactions
5. **Mining**: Included in next block
6. **Confirmation**: Block added to chain
7. **Finality**: Transaction is permanent

### Transaction Fees

Currently, Elysium does not implement transaction fees. Future versions may include:
- Gas fees for computation
- Priority fees for faster inclusion
- Fee market mechanisms

## Running a Node

### Node Types

**1. Mining Node**
- Participates in block creation
- Requires computational resources
- Earns block rewards (if implemented)

**2. Full Node**
- Validates all blocks
- Stores full blockchain
- Serves RPC requests

**3. Light Node** (Future)
- Stores headers only
- Requests full data when needed

### Starting a Mining Node

```bash
cargo run --bin elysium-node --release -- \
    --listen 0.0.0.0:8080 \
    --difficulty 2 \
    --mine \
    --mining-interval 10
```

**Parameters:**
- `--listen`: Address to listen on
- `--difficulty`: Mining difficulty (higher = harder)
- `--mine`: Enable mining
- `--mining-interval`: Seconds between mining attempts

### Starting a Full Node

```bash
cargo run --bin elysium-node --release -- \
    --listen 0.0.0.0:8080 \
    --difficulty 2
```

**Without `--mine`**: Node validates but doesn't mine

### Connecting Nodes

**Node 1 (Bootstrap):**
```bash
cargo run --bin elysium-node -- --listen 127.0.0.1:8080 --difficulty 1 --mine
```

**Node 2 (Connect to Node 1):**
```bash
cargo run --bin elysium-node -- \
    --listen 127.0.0.1:8081 \
    --difficulty 1 \
    --peers 127.0.0.1:8080
```

**Multiple Peers:**
```bash
--peers 127.0.0.1:8080,127.0.0.1:8082,127.0.0.1:8083
```

### Node Configuration

**Difficulty Selection:**
- **Low (1-2)**: Testing, fast blocks
- **Medium (3-4)**: Small networks
- **High (5+)**: Large networks, slower blocks

**Network Configuration:**
- **Local**: `127.0.0.1` for testing
- **LAN**: `0.0.0.0` for local network
- **Public**: Configure firewall and router

## Using the SDK

### Installation

Add to `Cargo.toml`:
```toml
[dependencies]
elysium-sdk = { path = "../elysium-sdk" }
tokio = { version = "1.0", features = ["full"] }
```

### Basic Usage

```rust
use elysium_sdk::ElysiumClient;
use elysium_core::account::KeyPair;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create client
    let client = ElysiumClient::new("http://127.0.0.1:8545");
    
    // Get blockchain height
    let height = client.get_height().await?;
    println!("Height: {}", height);
    
    // Create accounts
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    
    // Get balances
    let alice_balance = client.get_balance(&alice.address()).await?;
    let bob_balance = client.get_balance(&bob.address()).await?;
    
    println!("Alice: {}, Bob: {}", alice_balance, bob_balance);
    
    // Transfer funds
    if alice_balance > 0 {
        let tx_hash = client.transfer(&alice, &bob.address(), 10).await?;
        println!("Transfer: {}", tx_hash);
    }
    
    Ok(())
}
```

### Advanced SDK Usage

**Error Handling:**
```rust
match client.get_balance(&address).await {
    Ok(balance) => println!("Balance: {}", balance),
    Err(e) => eprintln!("Error: {}", e),
}
```

**Batch Operations:**
```rust
// Get multiple balances
let addresses = vec![addr1, addr2, addr3];
for addr in addresses {
    let balance = client.get_balance(&addr).await?;
    println!("{}: {}", addr, balance);
}
```

## Using the RPC API

### JSON-RPC Format

All RPC calls use JSON-RPC 2.0:

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": [...],
  "id": 1
}
```

### Available Methods

**Get Blockchain Height:**
```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"elysium_getHeight","params":[],"id":1}'
```

**Get Balance:**
```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"elysium_getBalance",
    "params":["<64_char_hex_address>"],
    "id":1
  }'
```

**Get Latest Block:**
```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"elysium_getLatestBlock","params":[],"id":1}'
```

**Send Transaction:**
```bash
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
      "signature": "<signature>",
      "public_key": "<public_key>"
    }],
    "id":1
  }'
```

### Error Responses

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Error description"
  },
  "id": 1
}
```

## Mining Blocks

### Understanding Mining

**Mining** is the process of creating new blocks by solving a cryptographic puzzle.

**Process:**
1. Collect pending transactions
2. Create block header
3. Try different nonce values
4. Find nonce that meets difficulty
5. Broadcast block to network

### Mining Configuration

**Difficulty:**
- Lower = easier = faster blocks
- Higher = harder = slower blocks
- Adjust based on network speed

**Mining Interval:**
- How often to attempt mining
- Lower = more frequent attempts
- Higher = less CPU usage

### Mining Rewards

Currently, Elysium does not implement block rewards. Future versions may include:
- Fixed reward per block
- Transaction fees
- Staking rewards

## Best Practices

### Security Best Practices

1. **Protect Private Keys**
   - Never share or expose
   - Use secure storage
   - Consider hardware wallets

2. **Verify Transactions**
   - Always check recipient addresses
   - Verify amounts before sending
   - Wait for confirmations

3. **Secure Node Operation**
   - Use firewalls
   - Keep software updated
   - Monitor for suspicious activity

### Development Best Practices

1. **Error Handling**
   - Always handle errors
   - Provide meaningful messages
   - Log important events

2. **Transaction Management**
   - Check nonce before creating transactions
   - Handle insufficient balance errors
   - Implement retry logic

3. **Testing**
   - Test with small amounts first
   - Use test networks
   - Verify all edge cases

### Performance Best Practices

1. **Node Performance**
   - Use appropriate difficulty
   - Monitor resource usage
   - Optimize network connections

2. **Application Performance**
   - Batch operations when possible
   - Cache frequently accessed data
   - Use async/await properly

## Troubleshooting

### Common Issues

**Node Won't Start:**
- Check port availability
- Verify permissions
- Check firewall settings

**Transactions Failing:**
- Verify signature
- Check balance
- Verify nonce
- Check network connectivity

**Blocks Not Mining:**
- Verify difficulty setting
- Check CPU resources
- Ensure transactions in mempool

**RPC Not Responding:**
- Verify RPC server is running
- Check port and address
- Verify firewall rules

### Debugging

**Enable Logging:**
```bash
RUST_LOG=debug cargo run --bin elysium-node
```

**Check Node Status:**
```bash
curl http://127.0.0.1:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"elysium_getHeight","params":[],"id":1}'
```

**View Node Logs:**
- Check terminal output
- Look for error messages
- Monitor network activity

### Getting Help

1. **Check Documentation**
   - README.md
   - API.md
   - ARCHITECTURE.md
   - ALGORITHMS.md

2. **Review Examples**
   - examples/basic_usage.rs
   - examples/sdk_usage.rs

3. **Check Tests**
   - Integration tests
   - Unit tests

4. **Community Support**
   - GitHub Issues
   - Documentation
   - Code examples

## Conclusion

This guide covers the essential aspects of using the Elysium blockchain. For more detailed information, refer to:
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [ALGORITHMS.md](ALGORITHMS.md) - Algorithm details
- [API.md](API.md) - Complete API reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment

Happy building on Elysium! 🚀

