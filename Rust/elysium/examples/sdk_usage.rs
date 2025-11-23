use elysium_sdk::ElysiumClient;
use elysium_core::account::KeyPair;

/// SDK usage example (requires running RPC server)
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Elysium SDK Usage Example");
    println!("=========================\n");
    
    // Connect to RPC server
    let client = ElysiumClient::new("http://127.0.0.1:8545");
    
    // Get blockchain height
    match client.get_height().await {
        Ok(height) => println!("Blockchain height: {}", height),
        Err(e) => {
            println!("Error connecting to RPC server: {}", e);
            println!("Make sure the RPC server is running on http://127.0.0.1:8545");
            return Ok(());
        }
    }
    
    // Create key pairs
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    
    println!("\nAlice address: {}", alice.address());
    println!("Bob address: {}", bob.address());
    
    // Get balances
    let alice_balance = client.get_balance(&alice.address()).await?;
    let bob_balance = client.get_balance(&bob.address()).await?;
    
    println!("\nAlice balance: {}", alice_balance);
    println!("Bob balance: {}", bob_balance);
    
    // Get nonces
    let alice_nonce = client.get_nonce(&alice.address()).await?;
    println!("Alice nonce: {}", alice_nonce);
    
    // Transfer funds (if Alice has balance)
    if alice_balance > 0 {
        println!("\nTransferring 10 tokens from Alice to Bob...");
        let tx_hash = client.transfer(&alice, &bob.address(), 10).await?;
        println!("Transaction hash: {}", tx_hash);
        
        // Wait a bit for block to be mined
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        
        // Check balances again
        let alice_balance_after = client.get_balance(&alice.address()).await?;
        let bob_balance_after = client.get_balance(&bob.address()).await?;
        
        println!("\nAfter transaction:");
        println!("Alice balance: {}", alice_balance_after);
        println!("Bob balance: {}", bob_balance_after);
    } else {
        println!("\nAlice has no balance to transfer");
    }
    
    // Get latest block
    let latest_block = client.get_latest_block().await?;
    println!("\nLatest block: {}", latest_block);
    
    // Get pending transactions
    let pending = client.get_pending_transactions().await?;
    println!("Pending transactions: {}", pending.len());
    
    Ok(())
}

