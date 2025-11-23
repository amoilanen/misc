use elysium_core::{Blockchain, Transaction, account::KeyPair};
use elysium_sdk::ElysiumClient;

/// Basic usage example
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Elysium Blockchain - Basic Usage Example");
    println!("=========================================\n");
    
    // Create a local blockchain for demonstration
    let mut blockchain = Blockchain::new(1);
    
    // Generate key pairs
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    
    println!("Alice address: {}", alice.address());
    println!("Bob address: {}\n", bob.address());
    
    // Give Alice some initial balance
    let mut alice_account = elysium_core::Account::new(alice.address());
    alice_account.balance = 1000;
    blockchain.accounts.insert(alice.address(), alice_account);
    
    println!("Initial Alice balance: {}", blockchain.get_balance(&alice.address()));
    println!("Initial Bob balance: {}\n", blockchain.get_balance(&bob.address()));
    
    // Create a transaction
    let mut tx = Transaction::new(
        alice.address(),
        bob.address(),
        100,
        0,
    );
    
    // Sign the transaction
    tx.sign(alice.signing_key())?;
    
    println!("Created transaction: {}", tx);
    
    // Add transaction to blockchain
    blockchain.add_transaction(tx.clone())?;
    println!("Transaction added to pending pool\n");
    
    // Mine a block
    println!("Mining block...");
    let block = blockchain.mine_block()?;
    println!("Mined block: {}\n", block);
    
    // Check balances after transaction
    println!("Final Alice balance: {}", blockchain.get_balance(&alice.address()));
    println!("Final Bob balance: {}", blockchain.get_balance(&bob.address()));
    println!("Blockchain height: {}", blockchain.height());
    
    Ok(())
}

