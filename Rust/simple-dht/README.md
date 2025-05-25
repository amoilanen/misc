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