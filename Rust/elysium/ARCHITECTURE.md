# Elysium Blockchain Architecture

This document provides a comprehensive overview of the Elysium blockchain architecture, system design, and component interactions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Core Components](#core-components)
4. [Data Structures](#data-structures)
5. [Network Architecture](#network-architecture)
6. [State Management](#state-management)
7. [Consensus Mechanism](#consensus-mechanism)
8. [Transaction Flow](#transaction-flow)
9. [Block Lifecycle](#block-lifecycle)
10. [Component Interactions](#component-interactions)

## System Overview

Elysium is a decentralized blockchain platform built in Rust, designed for simplicity and performance. The system follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  (DApps, Wallets, Tools using SDK or RPC)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐            ┌────▼─────┐
    │   SDK   │            │   RPC    │
    │ Client  │            │  Server  │
    └────┬────┘            └────┬──────┘
         │                     │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │   Node Layer        │
         │  (P2P, Mining)      │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   Core Layer        │
         │ (Blockchain Logic)  │
         └─────────────────────┘
```

## Architecture Layers

### 1. Application Layer

The topmost layer where end-user applications interact with the blockchain:
- **DApps**: Decentralized applications
- **Wallets**: User wallet applications
- **Tools**: Development and management tools

**Interfaces:**
- SDK (Rust library)
- JSON-RPC API (HTTP)

### 2. Interface Layer

Provides standardized interfaces for application interaction:

#### SDK (`elysium-sdk`)
- High-level Rust API
- Transaction creation and signing
- Account management
- Async/await support
- Type-safe interfaces

#### RPC Server (`elysium-client`)
- JSON-RPC 2.0 compliant
- HTTP-based API
- Standard blockchain queries
- Transaction submission

### 3. Node Layer (`elysium-node`)

The blockchain node implementation:

#### Node (`node.rs`)
- Manages blockchain state
- Coordinates mining
- Handles block synchronization
- Maintains pending transaction pool

#### Network (`network.rs`)
- P2P communication
- Block propagation
- Transaction broadcasting
- Peer discovery and management

#### Miner (`miner.rs`)
- Continuous block mining
- Configurable mining intervals
- Automatic transaction inclusion

### 4. Core Layer (`elysium-core`)

The foundational blockchain logic:

#### Blockchain (`blockchain.rs`)
- State management
- Transaction validation
- Block validation
- Account management

#### Block (`block.rs`)
- Block structure
- Block header
- Mining algorithm
- Block validation

#### Transaction (`transaction.rs`)
- Transaction structure
- Signing and verification
- Transaction hashing

#### Account (`account.rs`)
- Address generation
- Key pair management
- Account state

## Core Components

### Blockchain State

The blockchain maintains several key data structures:

```rust
pub struct Blockchain {
    pub blocks: Vec<Block>,                    // Chain of blocks
    pub accounts: HashMap<Address, Account>,   // Account state
    pub pending_transactions: Vec<Transaction>, // Mempool
    pub difficulty: u64,                       // Mining difficulty
}
```

**State Management:**
- **Blocks**: Immutable chain of validated blocks
- **Accounts**: Mutable account state (balance, nonce)
- **Pending Transactions**: Unconfirmed transactions awaiting inclusion
- **Difficulty**: Current mining difficulty level

### Block Structure

```rust
pub struct Block {
    pub header: BlockHeader,
    pub transactions: Vec<Transaction>,
}

pub struct BlockHeader {
    pub number: u64,              // Block height
    pub parent_hash: String,      // Previous block hash
    pub transactions_root: String, // Merkle root of transactions
    pub state_root: String,        // State root (future use)
    pub timestamp: u64,            // Unix timestamp
    pub nonce: u64,                // Mining nonce
    pub difficulty: u64,           // Difficulty target
}
```

**Block Properties:**
- **Immutable**: Once added, blocks cannot be modified
- **Linked**: Each block references its parent via hash
- **Validated**: All blocks must pass validation before acceptance
- **Ordered**: Blocks form a sequential chain

### Transaction Structure

```rust
pub struct Transaction {
    pub from: Address,           // Sender address
    pub to: Address,             // Receiver address
    pub amount: u64,             // Transfer amount
    pub nonce: u64,              // Transaction sequence number
    pub transaction_type: TransactionType,
    pub signature: String,       // Ed25519 signature
    pub public_key: String,      // Public key for verification
}
```

**Transaction Properties:**
- **Signed**: Cryptographically signed by sender
- **Unique**: Nonce ensures uniqueness per account
- **Atomic**: Either fully executed or rejected
- **Immutable**: Cannot be modified after creation

### Account Structure

```rust
pub struct Account {
    pub address: Address,  // Account address (derived from public key)
    pub balance: u64,      // Account balance
    pub nonce: u64,        // Transaction counter
}
```

**Account Properties:**
- **Address**: Derived from public key via SHA-256 hash
- **Balance**: Current token balance
- **Nonce**: Sequential transaction counter (prevents replay attacks)

## Data Structures

### Address Generation

Addresses are derived from Ed25519 public keys:

```
Public Key (32 bytes)
    ↓ SHA-256
Hash (32 bytes)
    ↓ Hex Encode
Address (64 hex characters)
```

### Transaction Signing

Transactions are signed using Ed25519:

```
Transaction Data (from, to, amount, nonce)
    ↓ Serialize
Bytes
    ↓ Ed25519 Sign
Signature
    ↓ Hex Encode
Signature String
```

### Block Hashing

Block headers are hashed using SHA-256:

```
Block Header (JSON)
    ↓ Serialize
Bytes
    ↓ SHA-256
Hash (32 bytes)
    ↓ Hex Encode
Block Hash (64 hex characters)
```

### Transactions Root

Merkle root of transactions:

```
Transaction Hashes
    ↓ Concatenate
Combined String
    ↓ SHA-256
Transactions Root
```

## Network Architecture

### P2P Communication

Nodes communicate via TCP connections:

```
Node A                    Node B
  │                         │
  │─── New Block ──────────>│
  │<── New Block ───────────│
  │                         │
  │─── New Transaction ────>│
  │<── New Transaction ─────│
  │                         │
  │─── Request Blocks ─────>│
  │<── Blocks ──────────────│
```

**Message Types:**
- `NewBlock`: Broadcast newly mined blocks
- `NewTransaction`: Broadcast new transactions
- `RequestBlocks`: Request blocks for synchronization
- `Blocks`: Response with requested blocks
- `Ping/Pong`: Keep-alive messages

### Node Types

1. **Mining Nodes**: Participate in block creation
2. **Full Nodes**: Validate and store full blockchain
3. **Light Nodes**: Store headers only (future)

## State Management

### Account State

Account state is stored in a HashMap:

```rust
HashMap<Address, Account>
```

**State Updates:**
- Created when first transaction received
- Updated atomically with block application
- Balance and nonce updated together

### Block State

Blocks are stored sequentially:

```rust
Vec<Block>
```

**State Properties:**
- Append-only (immutable history)
- Sequential access
- Full chain validation

### Pending Transactions

Unconfirmed transactions stored in mempool:

```rust
Vec<Transaction>
```

**Mempool Properties:**
- First-in-first-out ordering
- Validated before addition
- Removed when included in block

## Consensus Mechanism

### Proof of Work (PoW)

Elysium uses a simplified Proof of Work consensus:

**Mining Process:**
1. Collect pending transactions
2. Create block header
3. Increment nonce
4. Calculate block hash
5. Check if hash meets difficulty
6. Repeat until difficulty met

**Difficulty:**
- Number of leading zero bytes required
- Configurable per node
- Adjustable for network stability

**Validation:**
- All nodes validate blocks independently
- Invalid blocks are rejected
- Longest valid chain wins

## Transaction Flow

### 1. Transaction Creation

```
User Application
    ↓ Create Transaction
    ↓ Sign with Private Key
Signed Transaction
    ↓ Submit via SDK/RPC
Node
```

### 2. Transaction Validation

```
Node receives Transaction
    ↓ Validate Signature
    ↓ Check Balance
    ↓ Check Nonce
    ↓ Check Duplicates
Valid Transaction → Mempool
Invalid Transaction → Rejected
```

### 3. Block Mining

```
Miner
    ↓ Collect Pending Transactions
    ↓ Create Block
    ↓ Mine Block (PoW)
    ↓ Validate Block
Mined Block
    ↓ Broadcast to Network
Other Nodes
```

### 4. Block Validation

```
Node receives Block
    ↓ Validate Difficulty
    ↓ Validate Transactions Root
    ↓ Validate All Transactions
    ↓ Check Parent Hash
    ↓ Check Block Number
Valid Block → Add to Chain
Invalid Block → Reject
```

### 5. State Update

```
Valid Block Added
    ↓ Apply Transactions
    ↓ Update Account Balances
    ↓ Update Account Nonces
    ↓ Remove from Mempool
Updated State
```

## Block Lifecycle

### Block Creation

1. **Collect Transactions**: Gather pending transactions
2. **Create Header**: Initialize block header
3. **Add Transactions**: Include transactions in block
4. **Calculate Root**: Compute transactions root
5. **Mine**: Find nonce meeting difficulty
6. **Validate**: Verify block validity

### Block Propagation

1. **Broadcast**: Send to connected peers
2. **Receive**: Nodes receive block
3. **Validate**: Each node validates independently
4. **Accept/Reject**: Based on validation result
5. **Propagate**: Forward to other peers

### Block Finalization

1. **Added to Chain**: Block becomes part of chain
2. **State Applied**: Transactions executed
3. **Mempool Updated**: Transactions removed
4. **Chain Extended**: Blockchain height increases

## Component Interactions

### SDK → RPC Server

```
SDK Client
    ↓ HTTP Request
    ↓ JSON-RPC
RPC Server
    ↓ Process Request
    ↓ Query Node
Node
    ↓ Return Result
RPC Server
    ↓ JSON Response
SDK Client
```

### Node → Core

```
Node
    ↓ Add Transaction
Core Blockchain
    ↓ Validate
    ↓ Add to Mempool
Node
    ↓ Mine Block
Core Blockchain
    ↓ Create Block
    ↓ Mine
    ↓ Validate
Node
    ↓ Broadcast Block
```

### Network → Node

```
Network Layer
    ↓ Receive Message
    ↓ Parse Message
Node
    ↓ Process Block/Transaction
Core Blockchain
    ↓ Validate
    ↓ Update State
Node
    ↓ Response
Network Layer
```

## Security Architecture

### Cryptographic Security

- **Ed25519 Signatures**: Fast, secure digital signatures
- **SHA-256 Hashing**: Cryptographically secure hashing
- **Public Key Verification**: Address matches public key

### Validation Layers

1. **Transaction Validation**: Signature, balance, nonce
2. **Block Validation**: Difficulty, transactions, structure
3. **Chain Validation**: Parent hash, sequence, state

### Attack Prevention

- **Replay Attacks**: Nonce-based prevention
- **Double Spending**: Balance and nonce checks
- **Invalid Blocks**: Comprehensive validation
- **Duplicate Transactions**: Hash-based detection

## Performance Considerations

### State Storage

- **In-Memory**: Fast access for active state
- **HashMap**: O(1) account lookups
- **Vector**: Sequential block access

### Mining Performance

- **CPU Mining**: Suitable for testing
- **Difficulty Tuning**: Adjustable for network speed
- **Parallel Mining**: Future enhancement

### Network Performance

- **TCP Connections**: Reliable communication
- **Message Serialization**: JSON for compatibility
- **Broadcast Optimization**: Future enhancement

## Future Enhancements

### Planned Features

1. **Persistent Storage**: Database backend
2. **Advanced Networking**: libp2p integration
3. **Smart Contracts**: EVM-compatible runtime
4. **State Pruning**: Reduce storage requirements
5. **Light Clients**: Header-only synchronization
6. **Transaction Fees**: Spam prevention
7. **Difficulty Adjustment**: Automatic tuning

### Scalability Improvements

1. **Sharding**: Partition state across shards
2. **Layer 2**: Off-chain transaction processing
3. **State Channels**: Fast off-chain transactions
4. **Optimized Storage**: Compressed block storage

## Conclusion

The Elysium blockchain architecture is designed for:
- **Simplicity**: Clear, understandable design
- **Security**: Multiple validation layers
- **Performance**: Efficient data structures
- **Extensibility**: Modular, composable components

The architecture follows best practices while maintaining the 80/20 principle - focusing on essential features that provide maximum value.

