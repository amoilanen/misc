# Elysium Blockchain - Quick Start Guide

Get up and running with Elysium blockchain in 5 minutes.

## Prerequisites

- Rust 1.70+ installed ([rustup.rs](https://rustup.rs/))
- Terminal/Command line access

## Step 1: Build the Project

```bash
cd elysium
cargo build --release
```

This will compile all components:
- `elysium-node` - The blockchain node
- `elysium-client` - The RPC server
- SDK libraries

## Step 2: Start a Node

Open a terminal and start a mining node:

```bash
cargo run --bin elysium-node --release -- \
    --listen 127.0.0.1:8080 \
    --difficulty 1 \
    --mine \
    --mining-interval 5
```

You should see output like:
```
INFO elysium_node: Starting Elysium node...
INFO elysium_node: Node created with difficulty: 1
INFO elysium_node::network: Listening on 127.0.0.1:8080
INFO elysium_node: Starting miner...
INFO elysium_node: Node started successfully. Listening on 127.0.0.1:8080
```

## Step 3: Start the RPC Server

Open another terminal and start the RPC server:

```bash
cargo run --bin elysium-client --release -- \
    --rpc-addr 127.0.0.1:8545 \
    --difficulty 1
```

You should see:
```
INFO elysium_client: Starting Elysium RPC client server...
INFO elysium_client: Node created with difficulty: 1
INFO elysium_client::server: RPC server started on 127.0.0.1:8545
INFO elysium_client: RPC server started successfully on 127.0.0.1:8545
```

## Step 4: Test the API

In a third terminal, test the RPC API:

```bash
# Get blockchain height
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"elysium_getHeight","params":[],"id":1}'
```

Expected response:
```json
{"jsonrpc":"2.0","result":1,"id":1}
```

## Step 5: Run Examples

### Basic Usage Example

```bash
cargo run --example basic_usage --release
```

This demonstrates:
- Creating accounts
- Creating transactions
- Mining blocks
- Checking balances

### SDK Usage Example

Make sure the RPC server is running, then:

```bash
cargo run --example sdk_usage --release
```

This demonstrates:
- Connecting to the RPC server
- Querying balances
- Sending transactions via SDK

## Next Steps

1. **Read the Documentation**
   - [README.md](README.md) - Overview and features
   - [API.md](API.md) - Complete API reference
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide

2. **Explore the Code**
   - `elysium-core/` - Core blockchain logic
   - `elysium-node/` - Node implementation
   - `elysium-client/` - RPC server
   - `elysium-sdk/` - SDK for applications

3. **Run Tests**
   ```bash
   cargo test
   ```

4. **Build Your Application**
   - Use the SDK to interact with the blockchain
   - Create your own transactions
   - Build DApps on Elysium

## Common Issues

### Port Already in Use

If you get an error about ports being in use:

```bash
# Find what's using the port
lsof -i :8080
lsof -i :8545

# Kill the process or use different ports
cargo run --bin elysium-node -- --listen 127.0.0.1:8081 ...
```

### Build Errors

If you encounter build errors:

```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
cargo build --release
```

### RPC Server Not Responding

1. Check if the node is running
2. Check if the RPC server is running
3. Verify the ports are correct
4. Check firewall settings

## Getting Help

- Check the logs: Look for error messages in the terminal output
- Review the documentation
- Check the test files for usage examples
- Open an issue on GitHub

## What's Next?

Now that you have Elysium running:

1. **Create Multiple Nodes**: Connect nodes together to form a network
2. **Send Transactions**: Use the SDK or RPC API to send transactions
3. **Monitor the Chain**: Query blocks, transactions, and balances
4. **Build Applications**: Use the SDK to build your own applications

Happy building! 🚀

