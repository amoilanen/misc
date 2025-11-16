use elysium_core::*;
use elysium_core::account::KeyPair;

#[test]
fn test_blockchain_workflow() {
    // Create blockchain
    let mut blockchain = Blockchain::new(1);
    assert_eq!(blockchain.height(), 1); // Genesis block
    
    // Create accounts
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    let charlie = KeyPair::generate();
    
    // Give Alice initial balance
    let mut alice_account = Account::new(alice.address());
    alice_account.balance = 1000;
    blockchain.accounts.insert(alice.address(), alice_account);
    
    // Test initial balances
    assert_eq!(blockchain.get_balance(&alice.address()), 1000);
    assert_eq!(blockchain.get_balance(&bob.address()), 0);
    assert_eq!(blockchain.get_balance(&charlie.address()), 0);
    
    // Create and add transaction
    let mut tx1 = Transaction::new(
        alice.address(),
        bob.address(),
        100,
        0,
    );
    tx1.sign(alice.signing_key()).unwrap();
    blockchain.add_transaction(tx1).unwrap();
    
    // Create another transaction
    let mut tx2 = Transaction::new(
        alice.address(),
        charlie.address(),
        200,
        1,
    );
    tx2.sign(alice.signing_key()).unwrap();
    blockchain.add_transaction(tx2).unwrap();
    
    // Mine block
    let block = blockchain.mine_block().unwrap();
    assert_eq!(block.transactions.len(), 2);
    
    // Verify balances after mining
    assert_eq!(blockchain.get_balance(&alice.address()), 700); // 1000 - 100 - 200
    assert_eq!(blockchain.get_balance(&bob.address()), 100);
    assert_eq!(blockchain.get_balance(&charlie.address()), 200);
    
    // Verify blockchain height
    assert_eq!(blockchain.height(), 2);
}

#[test]
fn test_transaction_validation() {
    let mut blockchain = Blockchain::new(1);
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    
    // Test insufficient balance (unsigned transaction will fail signature check)
    let mut tx = Transaction::new(
        alice.address(),
        bob.address(),
        100,
        0,
    );
    tx.sign(alice.signing_key()).unwrap();
    assert!(blockchain.add_transaction(tx).is_err());
    
    // Give Alice balance
    let mut account = Account::new(alice.address());
    account.balance = 50;
    blockchain.accounts.insert(alice.address(), account);
    
    // Test transaction with insufficient balance
    let mut tx = Transaction::new(
        alice.address(),
        bob.address(),
        100,
        0,
    );
    tx.sign(alice.signing_key()).unwrap();
    assert!(blockchain.add_transaction(tx).is_err());
    
    // Test valid transaction
    let mut tx = Transaction::new(
        alice.address(),
        bob.address(),
        30,
        0,
    );
    tx.sign(alice.signing_key()).unwrap();
    assert!(blockchain.add_transaction(tx).is_ok());
}

#[test]
fn test_nonce_validation() {
    let mut blockchain = Blockchain::new(1);
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    
    // Give Alice balance
    let mut account = Account::new(alice.address());
    account.balance = 1000;
    blockchain.accounts.insert(alice.address(), account);
    
    // First transaction with nonce 0
    let mut tx1 = Transaction::new(
        alice.address(),
        bob.address(),
        100,
        0,
    );
    tx1.sign(alice.signing_key()).unwrap();
    assert!(blockchain.add_transaction(tx1).is_ok());
    
    // Second transaction with nonce 1
    let mut tx2 = Transaction::new(
        alice.address(),
        bob.address(),
        100,
        1,
    );
    tx2.sign(alice.signing_key()).unwrap();
    assert!(blockchain.add_transaction(tx2).is_ok());
    
    // Try transaction with wrong nonce
    let mut tx3 = Transaction::new(
        alice.address(),
        bob.address(),
        100,
        0, // Wrong nonce, should be 2
    );
    tx3.sign(alice.signing_key()).unwrap();
    assert!(blockchain.add_transaction(tx3).is_err());
}

#[test]
fn test_block_validation() {
    let mut blockchain = Blockchain::new(1);
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    
    // Give Alice balance
    let mut account = Account::new(alice.address());
    account.balance = 1000;
    blockchain.accounts.insert(alice.address(), account);
    
    // Add transaction and mine
    let mut tx = Transaction::new(
        alice.address(),
        bob.address(),
        100,
        0,
    );
    tx.sign(alice.signing_key()).unwrap();
    blockchain.add_transaction(tx).unwrap();
    let block1 = blockchain.mine_block().unwrap();
    
    // Try to add invalid block (wrong parent hash)
    let mut invalid_block = Block::new(2, "invalid".to_string(), 1);
    invalid_block.mine();
    assert!(blockchain.add_block(invalid_block).is_err());
    
    // Add valid block
    let mut tx2 = Transaction::new(
        alice.address(),
        bob.address(),
        100,
        1,
    );
    tx2.sign(alice.signing_key()).unwrap();
    blockchain.add_transaction(tx2).unwrap();
    let block2 = blockchain.mine_block().unwrap();
    
    assert_eq!(blockchain.height(), 3);
}

#[test]
fn test_multiple_blocks() {
    let mut blockchain = Blockchain::new(1);
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    
    // Give Alice balance
    let mut account = Account::new(alice.address());
    account.balance = 1000;
    blockchain.accounts.insert(alice.address(), account);
    
    // Mine multiple blocks
    for i in 0..5 {
        let mut tx = Transaction::new(
            alice.address(),
            bob.address(),
            10,
            i,
        );
        tx.sign(alice.signing_key()).unwrap();
        blockchain.add_transaction(tx).unwrap();
        blockchain.mine_block().unwrap();
    }
    
    assert_eq!(blockchain.height(), 6); // Genesis + 5 blocks
    assert_eq!(blockchain.get_balance(&alice.address()), 950); // 1000 - 5*10
    assert_eq!(blockchain.get_balance(&bob.address()), 50);
}

