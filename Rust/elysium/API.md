# Elysium Blockchain API Reference

Complete API reference for the Elysium blockchain JSON-RPC interface.

## Base URL

Default: `http://localhost:8545`

## Request Format

All requests use JSON-RPC 2.0 format:

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": [...],
  "id": 1
}
```

## Response Format

```json
{
  "jsonrpc": "2.0",
  "result": ...,
  "id": 1
}
```

Error response:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Error message"
  },
  "id": 1
}
```

## Methods

### elysium_getHeight

Get the current blockchain height.

**Parameters:** None

**Returns:** `u64` - Current blockchain height

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_getHeight",
    "params": [],
    "id": 1
  }'
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "result": 42,
  "id": 1
}
```

---

### elysium_getBlockByNumber

Get a block by its block number.

**Parameters:**
- `number` (u64): Block number (0-indexed)

**Returns:** `Block | null` - Block object or null if not found

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_getBlockByNumber",
    "params": [0],
    "id": 1
  }'
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "header": {
      "number": 0,
      "parent_hash": "0000000000000000000000000000000000000000000000000000000000000000",
      "transactions_root": "...",
      "state_root": "...",
      "timestamp": 1234567890,
      "nonce": 12345,
      "difficulty": 1
    },
    "transactions": []
  },
  "id": 1
}
```

---

### elysium_getLatestBlock

Get the latest block in the blockchain.

**Parameters:** None

**Returns:** `Block` - Latest block object

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_getLatestBlock",
    "params": [],
    "id": 1
  }'
```

---

### elysium_getBalance

Get the balance of an account.

**Parameters:**
- `address` (string): Account address (64 hex characters)

**Returns:** `u64` - Account balance

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_getBalance",
    "params": ["a1b2c3d4e5f6..."],
    "id": 1
  }'
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "result": 1000,
  "id": 1
}
```

---

### elysium_getNonce

Get the nonce of an account (number of transactions sent).

**Parameters:**
- `address` (string): Account address (64 hex characters)

**Returns:** `u64` - Account nonce

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_getNonce",
    "params": ["a1b2c3d4e5f6..."],
    "id": 1
  }'
```

---

### elysium_sendTransaction

Send a transaction to the network.

**Parameters:**
- `transaction` (Transaction): Transaction object

**Transaction Object:**
```json
{
  "from": "a1b2c3d4e5f6...",
  "to": "f6e5d4c3b2a1...",
  "amount": 100,
  "nonce": 0,
  "transaction_type": "Transfer",
  "signature": "signature_hex_string"
}
```

**Returns:** `string` - Transaction hash

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_sendTransaction",
    "params": [{
      "from": "a1b2c3d4e5f6...",
      "to": "f6e5d4c3b2a1...",
      "amount": 100,
      "nonce": 0,
      "transaction_type": "Transfer",
      "signature": "..."
    }],
    "id": 1
  }'
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "result": "tx_hash_hex_string",
  "id": 1
}
```

---

### elysium_getPendingTransactions

Get all pending transactions in the mempool.

**Parameters:** None

**Returns:** `Array<Transaction>` - Array of pending transactions

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_getPendingTransactions",
    "params": [],
    "id": 1
  }'
```

---

### elysium_mineBlock

Manually trigger mining of a new block (if mining is enabled).

**Parameters:** None

**Returns:** `Block` - The newly mined block

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_mineBlock",
    "params": [],
    "id": 1
  }'
```

---

## Data Types

### Address

64-character hexadecimal string representing an account address.

Example: `"a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"`

### Block

```json
{
  "header": {
    "number": 0,
    "parent_hash": "hex_string",
    "transactions_root": "hex_string",
    "state_root": "hex_string",
    "timestamp": 1234567890,
    "nonce": 12345,
    "difficulty": 1
  },
  "transactions": [...]
}
```

### Transaction

```json
{
  "from": "address_hex",
  "to": "address_hex",
  "amount": 100,
  "nonce": 0,
  "transaction_type": "Transfer",
  "signature": "signature_hex"
}
```

### TransactionType

- `"Transfer"` - Transfer funds between accounts

## Error Codes

- `-32000` - Server error
- `-32600` - Invalid Request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error

## Rate Limiting

[Add rate limiting information if implemented]

## Authentication

[Add authentication information if implemented]

## WebSocket Support

[Add WebSocket support if implemented]

## Examples

### Complete Transaction Flow

```bash
# 1. Get sender's nonce
NONCE=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_getNonce",
    "params": ["sender_address"],
    "id": 1
  }' | jq -r '.result')

# 2. Create and sign transaction (using SDK or external tool)
# ... transaction creation and signing ...

# 3. Send transaction
TX_HASH=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "elysium_sendTransaction",
    "params": [{
      "from": "sender_address",
      "to": "receiver_address",
      "amount": 100,
      "nonce": '$NONCE',
      "transaction_type": "Transfer",
      "signature": "signature"
    }],
    "id": 1
  }' | jq -r '.result')

echo "Transaction hash: $TX_HASH"

# 4. Wait for block confirmation
# 5. Check balance
```

## SDK Usage

See the SDK documentation for higher-level abstractions:

```rust
use elysium_sdk::ElysiumClient;
use elysium_core::account::KeyPair;

let client = ElysiumClient::new("http://localhost:8545");
let height = client.get_height().await?;
let balance = client.get_balance(&address).await?;
```

