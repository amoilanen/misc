# Elysium Blockchain Algorithms

This document provides detailed explanations of all cryptographic algorithms, consensus mechanisms, and data structures used in the Elysium blockchain.

## Table of Contents

1. [Cryptographic Algorithms](#cryptographic-algorithms)
2. [Consensus Algorithm](#consensus-algorithm)
3. [Hashing Algorithms](#hashing-algorithms)
4. [Address Generation](#address-generation)
5. [Transaction Signing](#transaction-signing)
6. [Block Mining](#block-mining)
7. [Validation Algorithms](#validation-algorithms)
8. [State Management](#state-management)
9. [Network Algorithms](#network-algorithms)

## Cryptographic Algorithms

### Ed25519 Digital Signatures

Elysium uses **Ed25519** for transaction signing and verification.

#### Algorithm Overview

Ed25519 is a modern, high-performance digital signature scheme based on the Ed25519 curve (a twisted Edwards curve equivalent to Curve25519).

**Key Properties:**
- **Fast**: Significantly faster than RSA or ECDSA
- **Secure**: 128-bit security level
- **Small Keys**: 32-byte private keys, 32-byte public keys
- **Deterministic**: Same message always produces same signature (with same key)

#### Key Generation

```rust
// Generate random 32-byte seed
seed = random_bytes(32)

// Derive signing key from seed
signing_key = Ed25519::derive_key(seed)

// Derive public (verifying) key
verifying_key = signing_key.verifying_key()
```

**Security:** Uses cryptographically secure random number generator (OsRng).

#### Signing Process

```
1. Prepare transaction data:
   data = serialize(from, to, amount, nonce)

2. Sign with private key:
   signature = Ed25519::sign(signing_key, data)

3. Encode signature:
   signature_hex = hex_encode(signature)
```

**Algorithm:**
- Uses SHA-512 for hashing
- Produces 64-byte signature
- Deterministic (RFC 8032 compliant)

#### Verification Process

```
1. Decode signature:
   signature = hex_decode(signature_hex)

2. Recover public key from transaction:
   public_key = hex_decode(tx.public_key)

3. Verify signature:
   valid = Ed25519::verify(public_key, data, signature)
```

**Verification Steps:**
1. Decode public key from hex
2. Reconstruct verifying key
3. Verify signature against transaction data
4. Check address matches public key

#### Security Properties

- **Unforgeability**: Cannot create valid signature without private key
- **Non-repudiation**: Signer cannot deny signing
- **Integrity**: Any modification invalidates signature

### SHA-256 Hashing

**SHA-256** is used throughout the system for:
- Block hashing
- Transaction hashing
- Address generation
- Merkle root calculation

#### Algorithm Properties

- **Cryptographic Hash**: One-way function
- **Collision Resistant**: Hard to find two inputs with same hash
- **Deterministic**: Same input always produces same output
- **Avalanche Effect**: Small input changes cause large output changes

#### Usage in Elysium

**Block Hashing:**
```rust
block_header_json = serialize(header)
block_hash = SHA256(block_header_json)
```

**Transaction Hashing:**
```rust
tx_json = serialize(transaction)
tx_hash = SHA256(tx_json)
```

**Address Generation:**
```rust
public_key_bytes = verifying_key.to_bytes()
address_hash = SHA256(public_key_bytes)
address = hex_encode(address_hash)
```

**Transactions Root:**
```rust
tx_hashes = [hash(tx1), hash(tx2), ...]
combined = join(tx_hashes)
transactions_root = SHA256(combined)
```

## Consensus Algorithm

### Proof of Work (PoW)

Elysium implements a simplified Proof of Work consensus mechanism.

#### Algorithm Description

**Goal:** Find a block hash that meets the difficulty requirement.

**Process:**
```
1. Create block with transactions
2. Set nonce = 0
3. Calculate block hash
4. Check if hash meets difficulty
5. If not, increment nonce and repeat
6. If yes, block is mined
```

#### Difficulty Calculation

**Current Implementation:**
```rust
difficulty = number_of_leading_zero_bytes_required

hash_bytes = decode_hex(block_hash)
leading_zeros = count_leading_zero_bytes(hash_bytes)

if leading_zeros >= difficulty:
    block_is_valid
```

**Example:**
- Difficulty = 1: Hash must start with at least 1 zero byte (00...)
- Difficulty = 2: Hash must start with at least 2 zero bytes (0000...)
- Difficulty = 3: Hash must start with at least 3 zero bytes (000000...)

#### Mining Algorithm

```rust
fn mine_block(block: &mut Block) {
    while !block.meets_difficulty() {
        block.header.nonce += 1;
        // Hash is recalculated on each check
    }
}
```

**Time Complexity:** O(2^(8*difficulty)) average case

**Space Complexity:** O(1)

#### Difficulty Adjustment

Currently, difficulty is set manually. Future versions may include:
- Automatic adjustment based on block time
- Network-wide difficulty synchronization
- Target block time (e.g., 10 seconds)

#### Security Properties

- **Work Required**: Miners must perform computational work
- **Verification**: Easy to verify block validity
- **Immutability**: Changing block requires re-mining
- **Sybil Resistance**: Costly to create multiple identities

## Hashing Algorithms

### Block Header Hashing

**Purpose:** Create unique identifier for each block.

**Algorithm:**
```rust
1. Serialize block header to JSON
2. Convert to bytes
3. Apply SHA-256
4. Encode as hex string
```

**Properties:**
- Deterministic: Same header → same hash
- Unique: Different headers → different hashes (with high probability)
- Fast: O(n) where n is header size

### Transaction Hashing

**Purpose:** Create unique identifier for each transaction.

**Algorithm:**
```rust
1. Serialize entire transaction (including signature)
2. Convert to bytes
3. Apply SHA-256
4. Encode as hex string
```

**Important:** Includes signature in hash, so:
- Same transaction data + different signature = different hash
- Enables duplicate detection

### Merkle Root Calculation

**Purpose:** Efficiently verify transaction inclusion in block.

**Algorithm:**
```rust
1. Calculate hash for each transaction
2. Concatenate all hashes
3. Hash the concatenated string
4. Result is transactions root
```

**Current Implementation:** Simple concatenation (not a true Merkle tree)

**Future Enhancement:** Implement binary Merkle tree for O(log n) verification

## Address Generation

### Algorithm

**Step 1: Generate Key Pair**
```rust
signing_key = Ed25519::generate_random()
verifying_key = signing_key.verifying_key()
```

**Step 2: Extract Public Key Bytes**
```rust
public_key_bytes = verifying_key.to_bytes()  // 32 bytes
```

**Step 3: Hash Public Key**
```rust
address_hash = SHA256(public_key_bytes)  // 32 bytes
```

**Step 4: Encode as Hex**
```rust
address = hex_encode(address_hash)  // 64 hex characters
```

### Address Format

- **Length:** 64 hexadecimal characters
- **Display:** Often shown as `0x` + first 16 characters
- **Uniqueness:** Collision probability is negligible

### Address Properties

- **Deterministic:** Same public key always produces same address
- **One-way:** Cannot derive public key from address
- **Collision Resistant:** Extremely unlikely to have duplicate addresses

## Transaction Signing

### Signing Algorithm

**Step 1: Prepare Data**
```rust
data = [
    from_address_bytes,
    to_address_bytes,
    amount_bytes (big-endian u64),
    nonce_bytes (big-endian u64)
]
```

**Step 2: Sign**
```rust
signature = Ed25519::sign(signing_key, data)
```

**Step 3: Store**
```rust
transaction.signature = hex_encode(signature)
transaction.public_key = hex_encode(verifying_key.to_bytes())
```

### Verification Algorithm

**Step 1: Reconstruct Data**
```rust
data = [
    from_address_bytes,
    to_address_bytes,
    amount_bytes,
    nonce_bytes
]
```

**Step 2: Decode Public Key**
```rust
public_key_bytes = hex_decode(transaction.public_key)
verifying_key = Ed25519::from_bytes(public_key_bytes)
```

**Step 3: Decode Signature**
```rust
signature_bytes = hex_decode(transaction.signature)
signature = Ed25519::from_bytes(signature_bytes)
```

**Step 4: Verify**
```rust
is_valid = Ed25519::verify(verifying_key, data, signature)
```

**Step 5: Verify Address**
```rust
expected_address = derive_address(verifying_key)
if expected_address != transaction.from:
    return InvalidAddress
```

## Block Mining

### Mining Process

**Input:** Pending transactions, previous block hash, difficulty

**Algorithm:**
```rust
1. Create new block header:
   - number = previous_block.number + 1
   - parent_hash = hash(previous_block)
   - timestamp = current_time()
   - nonce = 0
   - difficulty = current_difficulty

2. Add transactions to block

3. Calculate transactions root

4. Mine loop:
   while !meets_difficulty(block):
       block.header.nonce += 1
       hash = calculate_hash(block.header)
       if count_leading_zeros(hash) >= difficulty:
           break

5. Return mined block
```

### Mining Performance

**Time Complexity:**
- Best case: O(1) if nonce=0 works
- Average case: O(2^(8*difficulty))
- Worst case: O(2^64) theoretical maximum

**Space Complexity:** O(1)

**Optimization Opportunities:**
- Parallel nonce ranges
- GPU acceleration
- ASIC mining (future)

## Validation Algorithms

### Transaction Validation

**Algorithm:**
```rust
fn validate_transaction(tx: Transaction) -> Result {
    // 1. Amount check
    if tx.amount == 0:
        return Error("Amount must be > 0")
    
    // 2. Self-transfer check
    if tx.from == tx.to:
        return Error("Cannot transfer to self")
    
    // 3. Signature verification
    if !tx.verify():
        return Error("Invalid signature")
    
    // 4. Address verification
    if address_from_public_key(tx.public_key) != tx.from:
        return Error("Address mismatch")
    
    // 5. Balance check
    if get_balance(tx.from) < tx.amount:
        return Error("Insufficient balance")
    
    // 6. Nonce check
    if get_nonce(tx.from) != tx.nonce:
        return Error("Invalid nonce")
    
    // 7. Duplicate check
    if is_duplicate(tx):
        return Error("Duplicate transaction")
    
    return Ok
}
```

**Time Complexity:** O(n) where n is number of recent transactions checked

### Block Validation

**Algorithm:**
```rust
fn validate_block(block: Block) -> Result {
    // 1. Difficulty check
    if !block.meets_difficulty():
        return Error("Difficulty not met")
    
    // 2. Transactions root check
    expected_root = calculate_transactions_root(block.transactions)
    if block.header.transactions_root != expected_root:
        return Error("Invalid transactions root")
    
    // 3. Transaction validation
    for tx in block.transactions:
        if !validate_transaction(tx):
            return Error("Invalid transaction")
    
    // 4. Duplicate transaction check
    if has_duplicates(block.transactions):
        return Error("Duplicate transactions")
    
    return Ok
}
```

**Time Complexity:** O(m*n) where m is transactions per block, n is validation checks

### Chain Validation

**Algorithm:**
```rust
fn validate_chain(blocks: Vec<Block>) -> Result {
    for i in 1..blocks.len():
        current = blocks[i]
        previous = blocks[i-1]
        
        // 1. Parent hash check
        if current.header.parent_hash != hash(previous):
            return Error("Invalid parent hash")
        
        // 2. Block number check
        if current.header.number != previous.header.number + 1:
            return Error("Invalid block number")
        
        // 3. Block validation
        if !validate_block(current):
            return Error("Invalid block")
    
    return Ok
}
```

**Time Complexity:** O(m*n*b) where b is number of blocks

## State Management

### Account State Updates

**Algorithm:**
```rust
fn apply_transaction(tx: Transaction, state: &mut State) {
    // Update sender
    sender = state.accounts.get_or_create(tx.from)
    sender.balance -= tx.amount
    sender.nonce += 1
    
    // Update receiver
    receiver = state.accounts.get_or_create(tx.to)
    receiver.balance += tx.amount
}
```

**Properties:**
- **Atomic:** All updates succeed or fail together
- **Deterministic:** Same transactions → same final state
- **Idempotent:** Applying same transaction twice is prevented by nonce

### State Consistency

**Invariants:**
1. Total supply is constant (no creation/destruction)
2. Nonces are sequential per account
3. Balances are non-negative
4. All transactions are valid

**Verification:**
```rust
fn verify_state_consistency(state: &State) -> bool {
    total_balance = sum(state.accounts.values().balance)
    // Check invariants
    return invariants_hold
}
```

## Network Algorithms

### Block Propagation

**Algorithm:**
```rust
fn broadcast_block(block: Block, peers: Vec<Peer>) {
    message = serialize(NewBlock(block))
    for peer in peers:
        send(peer, message)
}
```

**Properties:**
- **Gossip Protocol:** Simple broadcast
- **No Duplicate Prevention:** Basic implementation
- **Future:** Implement proper gossip with duplicate detection

### Transaction Propagation

**Algorithm:**
```rust
fn broadcast_transaction(tx: Transaction, peers: Vec<Peer>) {
    message = serialize(NewTransaction(tx))
    for peer in peers:
        send(peer, message)
}
```

### Synchronization

**Algorithm:**
```rust
fn synchronize_chain(local_height: u64, peer: Peer) {
    if peer.height > local_height:
        missing_blocks = peer.height - local_height
        request_blocks(peer, local_height + 1, missing_blocks)
        
        for block in received_blocks:
            if validate_block(block):
                add_block(block)
            else:
                disconnect_peer(peer)
                break
}
```

## Performance Characteristics

### Time Complexities

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Address Generation | O(1) | Constant time |
| Transaction Signing | O(1) | Constant time |
| Transaction Verification | O(1) | Constant time |
| Block Hashing | O(1) | Constant time |
| Block Mining | O(2^(8*d)) | Exponential in difficulty |
| Transaction Validation | O(n) | Linear in recent transactions |
| Block Validation | O(m) | Linear in transactions per block |
| State Update | O(1) | Constant per transaction |

### Space Complexities

| Data Structure | Complexity | Notes |
|----------------|-----------|-------|
| Block | O(m) | m = transactions per block |
| Transaction | O(1) | Constant size |
| Account | O(1) | Constant size |
| Blockchain | O(b*m) | b = blocks, m = avg transactions |
| Mempool | O(p) | p = pending transactions |

## Security Analysis

### Cryptographic Security

- **Ed25519:** 128-bit security level
- **SHA-256:** 256-bit security level
- **Key Size:** 256 bits (sufficient for long-term security)

### Attack Resistance

- **Replay Attacks:** Prevented by nonce
- **Double Spending:** Prevented by balance checks
- **Signature Forgery:** Prevented by Ed25519 security
- **Hash Collisions:** Prevented by SHA-256 security

## Conclusion

The Elysium blockchain uses well-established cryptographic algorithms:
- **Ed25519** for signatures (fast, secure)
- **SHA-256** for hashing (standard, secure)
- **Proof of Work** for consensus (simple, proven)

All algorithms are chosen for:
- **Security:** Cryptographically sound
- **Performance:** Efficient implementation
- **Simplicity:** Easy to understand and verify

