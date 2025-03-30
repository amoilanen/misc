# AES Cryptor Testing

This directory contains test files and scenarios for the AES Cryptor utility.

## Test Files

- `sample.txt`: A simple text file containing "Hello, World!"
- `sample.bin`: A binary file containing random data
- `large.txt`: A large text file (1MB) containing Lorem ipsum text

## Test Scenarios

### 1. Basic Text Encryption/Decryption

```bash
# Encrypt sample.txt using AES-128 in CBC mode
cat sample.txt | aes-cryptor encrypt -p "test123" > sample.txt.enc

# Decrypt the encrypted file
cat sample.txt.enc | aes-cryptor decrypt -p "test123" > sample.txt.dec

# Verify the decrypted content matches the original
diff sample.txt sample.txt.dec
```

### 2. Binary File Encryption/Decryption

```bash
# Encrypt binary file using AES-256 in CBC mode
cat sample.bin | aes-cryptor encrypt -p "test123" -k 256 > sample.bin.enc

# Decrypt the encrypted file
cat sample.bin.enc | aes-cryptor decrypt -p "test123" -k 256 > sample.bin.dec

# Verify the decrypted content matches the original
diff sample.bin sample.bin.dec
```

### 3. ECB Mode Test

```bash
# Encrypt using ECB mode (not recommended for most uses)
cat sample.txt | aes-cryptor encrypt -p "test123" -m ECB > sample.txt.ecb.enc

# Decrypt ECB-encrypted file
cat sample.txt.ecb.enc | aes-cryptor decrypt -p "test123" -m ECB > sample.txt.ecb.dec

# Verify the decrypted content matches the original
diff sample.txt sample.txt.ecb.dec
```

### 4. Custom IV Test

```bash
# Generate a random IV
IV=$(openssl rand -hex 16)

# Encrypt with custom IV
cat sample.txt | aes-cryptor encrypt -p "test123" -i $IV > sample.txt.iv.enc

# Decrypt with the same IV
cat sample.txt.iv.enc | aes-cryptor decrypt -p "test123" -i $IV > sample.txt.iv.dec

# Verify the decrypted content matches the original
diff sample.txt sample.txt.iv.dec
```

### 5. Large File Test

```bash
# Encrypt large file using AES-192
cat large.txt | aes-cryptor encrypt -p "test123" -k 192 > large.txt.enc

# Decrypt large file
cat large.txt.enc | aes-cryptor decrypt -p "test123" -k 192 > large.txt.dec

# Verify the decrypted content matches the original
diff large.txt large.txt.dec
```

## Expected Results

1. All encryption/decryption operations should complete successfully
2. Decrypted files should match their original counterparts exactly
3. The utility should handle both text and binary files correctly
4. Different key sizes (128, 192, 256 bits) should work as expected
5. Both ECB and CBC modes should work, though CBC is recommended for security
6. Custom IVs should work correctly in CBC mode
7. The utility should handle large files efficiently

## Security Considerations

- ECB mode is included for testing but should not be used in production
- Always use strong passphrases
- Keep IVs secure and unique for each encryption operation
- Consider using established cryptographic libraries for production use 