# Simple DHT Implementation

A simple implementation of a Kademlia Distributed Hash Table (DHT) in Rust. This implementation provides a basic DHT with the following features:

- Node discovery and routing
- Key-value storage
- Bootstrap mechanism
- RPC-based communication

## Building

To build the project, you need Rust and Cargo installed. Then run:

```bash
cargo build --release
```

## Running

To run a DHT node:

```bash
cargo run --release -- <port> [bootstrap_addr]
```

Where:
- `<port>` is the port number to listen on
- `[bootstrap_addr]` is an optional bootstrap node address in the format `ip:port`

### Examples

Start a bootstrap node:
```bash
cargo run --release -- 4000
```

Start a node that bootstraps from the first node:
```bash
cargo run --release -- 4001 127.0.0.1:4000
```

### Test Scenario with 3 Nodes

Here's a complete test scenario using 3 nodes running locally:

1. Start the bootstrap node:
```bash
cargo run --release -- 4000
```

2. Start the second node that bootstraps from the first node:
```bash
cargo run --release -- 4001 127.0.0.1:4000
```

3. Start the third node that bootstraps from the first node:
```bash
cargo run --release -- 4002 127.0.0.1:4000
```

4. Using the DHT:
   - Store a value: Use the `store` command on any node
   - Retrieve a value: Use the `find_value` command on any node
   - Search for nodes: Use the `find_node` command on any node

The nodes will automatically discover each other and maintain the DHT network.

### DHT Commands

Once your nodes are running, you can interact with them using the following commands. The DHT uses a TCP-based RPC protocol where each command is sent as a JSON message followed by a newline. Keys can be provided in two ways:

1. As 32-byte hex strings (64 hex characters)
2. As regular strings that will be automatically hashed to 32 bytes using SHA-256

Here are examples of both approaches:

1. Store a value:
```bash
# Using a string key (will be hashed)
echo '{"Store": ["my-key", "my-value"]}' | nc localhost 4000
```

2. Retrieve a value:
```bash
# Using a string key (will be hashed)
echo '{"FindValue": "my-key"}' | nc localhost 4000
```

3. Find nodes:
```bash
# Using a string key (will be hashed)
echo '{"FindNode": "target-key"}' | nc localhost 4000
```

Note: The DHT uses 256-bit (32-byte) keys internally. When using string keys, they are automatically hashed using SHA-256 to generate the internal 32-byte key. Values are stored as byte arrays.

### Example Workflow

Here's a complete example of storing and retrieving data using string keys:

1. Store a value on node 1 (port 4000):
```bash
echo '{"Store": ["test-key", "Hello DHT!"]}' | nc localhost 4000
```

2. Retrieve the value from node 2 (port 4001):
```bash
echo '{"FindValue": "test-key"}' | nc localhost 4001
```

The value should be found even though it was stored on a different node, demonstrating the distributed nature of the DHT.

## Testing

Run the test suite:

```bash
cargo test
```

## Implementation Details

The implementation follows the Kademlia protocol with the following parameters:
- K (bucket size) = 20
- α (concurrency parameter) = 3
- Key size = 256 bits

### Components

- `Node`: Main DHT node implementation
- `RoutingTable`: Kademlia routing table with bucket management
- `Storage`: Key-value storage with TTL support
- `RPC`: Network communication layer

### Protocol

The DHT uses a simple RPC protocol for communication between nodes:

1. `Ping`: Check if a node is alive
2. `FindNode`: Find nodes closest to a given ID
3. `Store`: Store a key-value pair
4. `FindValue`: Retrieve a value for a given key

## License

MIT