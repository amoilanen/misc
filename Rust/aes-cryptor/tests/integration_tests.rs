use std::fs;
use std::path::Path;
use std::process::{Command, Stdio};
use std::io::{Write, Read};

fn run_command(cmd: &str) -> std::io::Result<Vec<u8>> {
    let output = Command::new("bash")
        .arg("-c")
        .arg(cmd)
        .output()?;
    
    if !output.status.success() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("Command failed: {}", String::from_utf8_lossy(&output.stderr))
        ));
    }
    
    Ok(output.stdout)
}

fn compare_files(path1: &Path, path2: &Path) -> std::io::Result<bool> {
    let mut file1 = fs::File::open(path1)?;
    let mut file2 = fs::File::open(path2)?;
    
    let mut buf1 = Vec::new();
    let mut buf2 = Vec::new();
    
    file1.read_to_end(&mut buf1)?;
    file2.read_to_end(&mut buf2)?;
    
    Ok(buf1 == buf2)
}

#[test]
fn test_basic_encryption_decryption() -> std::io::Result<()> {
    // Test 1: Basic encryption/decryption
    let input = "Hello, World!";
    let passphrase = "test123";
    
    // Encrypt
    let mut encrypt_cmd = Command::new("cargo")
        .arg("run")
        .arg("--")
        .arg("encrypt")
        .arg("-p")
        .arg(passphrase)
        .arg("-k")
        .arg("256")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()?;
        
    encrypt_cmd.stdin.as_mut().unwrap().write_all(input.as_bytes())?;
    let encrypted = encrypt_cmd.wait_with_output()?.stdout;
    
    // Decrypt
    let mut decrypt_cmd = Command::new("cargo")
        .arg("run")
        .arg("--")
        .arg("decrypt")
        .arg("-p")
        .arg(passphrase)
        .arg("-k")
        .arg("256")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()?;
        
    decrypt_cmd.stdin.as_mut().unwrap().write_all(&encrypted)?;
    let decrypted = decrypt_cmd.wait_with_output()?.stdout;
    
    assert_eq!(String::from_utf8_lossy(&decrypted), input);
    Ok(())
}

#[test]
fn test_binary_file_encryption() -> std::io::Result<()> {
    // Test 2: Binary file encryption
    let input_path = Path::new("testing/sample.bin");
    let encrypted_path = Path::new("testing/sample.bin.enc");
    let decrypted_path = Path::new("testing/sample.bin.dec");
    let passphrase = "test123";
    
    // Encrypt
    let mut encrypt_cmd = Command::new("cargo")
        .arg("run")
        .arg("--")
        .arg("encrypt")
        .arg("-p")
        .arg(passphrase)
        .arg("-k")
        .arg("256")
        .stdin(Stdio::from(fs::File::open(input_path)?))
        .stdout(Stdio::from(fs::File::create(encrypted_path)?))
        .spawn()?;
        
    encrypt_cmd.wait()?;
    
    // Decrypt
    let mut decrypt_cmd = Command::new("cargo")
        .arg("run")
        .arg("--")
        .arg("decrypt")
        .arg("-p")
        .arg(passphrase)
        .arg("-k")
        .arg("256")
        .stdin(Stdio::from(fs::File::open(encrypted_path)?))
        .stdout(Stdio::from(fs::File::create(decrypted_path)?))
        .spawn()?;
        
    decrypt_cmd.wait()?;
    
    // Compare original and decrypted files
    assert!(compare_files(input_path, decrypted_path)?);
    
    // Cleanup
    fs::remove_file(encrypted_path)?;
    fs::remove_file(decrypted_path)?;
    Ok(())
}

#[test]
fn test_large_file_encryption() -> std::io::Result<()> {
    // Test 3: Large file encryption
    let input_path = Path::new("testing/large.txt");
    let encrypted_path = Path::new("testing/large.txt.enc");
    let decrypted_path = Path::new("testing/large.txt.dec");
    let passphrase = "test123";
    
    // Encrypt
    let mut encrypt_cmd = Command::new("cargo")
        .arg("run")
        .arg("--")
        .arg("encrypt")
        .arg("-p")
        .arg(passphrase)
        .arg("-k")
        .arg("256")
        .stdin(Stdio::from(fs::File::open(input_path)?))
        .stdout(Stdio::from(fs::File::create(encrypted_path)?))
        .spawn()?;
        
    encrypt_cmd.wait()?;
    
    // Decrypt
    let mut decrypt_cmd = Command::new("cargo")
        .arg("run")
        .arg("--")
        .arg("decrypt")
        .arg("-p")
        .arg(passphrase)
        .arg("-k")
        .arg("256")
        .stdin(Stdio::from(fs::File::open(encrypted_path)?))
        .stdout(Stdio::from(fs::File::create(decrypted_path)?))
        .spawn()?;
        
    decrypt_cmd.wait()?;
    
    // Compare original and decrypted files
    assert!(compare_files(input_path, decrypted_path)?);
    
    // Cleanup
    fs::remove_file(encrypted_path)?;
    fs::remove_file(decrypted_path)?;
    Ok(())
}

#[test]
fn test_different_key_sizes() -> std::io::Result<()> {
    // Test 4: Different key sizes
    let input = "Test with different key sizes";
    let passphrase = "test123";
    let key_sizes = ["128", "192", "256"];
    
    for key_size in key_sizes.iter() {
        // Encrypt
        let mut encrypt_cmd = Command::new("cargo")
            .arg("run")
            .arg("--")
            .arg("encrypt")
            .arg("-p")
            .arg(passphrase)
            .arg("-k")
            .arg(key_size)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?;
            
        encrypt_cmd.stdin.as_mut().unwrap().write_all(input.as_bytes())?;
        let encrypted = encrypt_cmd.wait_with_output()?.stdout;
        
        // Decrypt
        let mut decrypt_cmd = Command::new("cargo")
            .arg("run")
            .arg("--")
            .arg("decrypt")
            .arg("-p")
            .arg(passphrase)
            .arg("-k")
            .arg(key_size)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?;
            
        decrypt_cmd.stdin.as_mut().unwrap().write_all(&encrypted)?;
        let decrypted = decrypt_cmd.wait_with_output()?.stdout;
        
        assert_eq!(String::from_utf8_lossy(&decrypted), input);
    }
    Ok(())
}

#[test]
fn test_different_modes() -> std::io::Result<()> {
    // Test 5: Different modes (ECB vs CBC)
    let input = "Test with different modes";
    let passphrase = "test123";
    let modes = ["ecb", "cbc"];
    
    for mode in modes.iter() {
        // Encrypt
        let mut encrypt_cmd = Command::new("cargo")
            .arg("run")
            .arg("--")
            .arg("encrypt")
            .arg("-p")
            .arg(passphrase)
            .arg("-k")
            .arg("256")
            .arg("-m")
            .arg(mode)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?;
            
        encrypt_cmd.stdin.as_mut().unwrap().write_all(input.as_bytes())?;
        let encrypted = encrypt_cmd.wait_with_output()?.stdout;
        
        // Decrypt
        let mut decrypt_cmd = Command::new("cargo")
            .arg("run")
            .arg("--")
            .arg("decrypt")
            .arg("-p")
            .arg(passphrase)
            .arg("-k")
            .arg("256")
            .arg("-m")
            .arg(mode)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?;
            
        decrypt_cmd.stdin.as_mut().unwrap().write_all(&encrypted)?;
        let decrypted = decrypt_cmd.wait_with_output()?.stdout;
        
        assert_eq!(String::from_utf8_lossy(&decrypted), input);
    }
    Ok(())
}

//TODO: Fix the integration test for correct error handling
//#[test]
fn test_error_handling() -> std::io::Result<()> {
    // Test 6: Error handling
    let input = "Test error handling";
    let passphrase = "test123";
    
    // Test with wrong passphrase
    let mut encrypt_cmd = Command::new("cargo")
        .arg("run")
        .arg("--")
        .arg("encrypt")
        .arg("-p")
        .arg(passphrase)
        .arg("-k")
        .arg("256")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()?;
        
    encrypt_cmd.stdin.as_mut().unwrap().write_all(input.as_bytes())?;
    let encrypted = encrypt_cmd.wait_with_output()?.stdout;
    
    // Try to decrypt with wrong passphrase
    let mut decrypt_cmd = Command::new("cargo")
        .arg("run")
        .arg("--")
        .arg("decrypt")
        .arg("-p")
        .arg("wrongpass")
        .arg("-k")
        .arg("256")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()?;
        
    decrypt_cmd.stdin.as_mut().unwrap().write_all(&encrypted)?;
    let result = decrypt_cmd.wait_with_output()?;
    let decrypted = &result.stdout;
    println!("INTEGRATION TEST error handling: {}", String::from_utf8_lossy(&decrypted));

    // The command should fail with wrong passphrase
    assert!(!result.status.success());
    Ok(())
} 