# AES Cryptor

A command-line utility for AES encryption and decryption implemented from scratch in Rust. This tool provides a simple interface for encrypting and decrypting data using the AES block cipher algorithm.

## Features

- Pure Rust implementation of AES-128, AES-192, and AES-256
- Command-line interface for easy use
- Support for passphrase-based key derivation
- Standard input/output streaming
- Comprehensive test coverage
- Well-documented implementation with references to the AES specification

## Installation

```bash
cargo install --path .
```

## Usage

### Basic Usage

Encrypt data from stdin:
```bash
echo "Hello, World!" | aes-cryptor encrypt --passphrase "my-secret-key"
```

Decrypt data from stdin:
```bash
echo "encrypted-data" | aes-cryptor decrypt --passphrase "my-secret-key"
```

### Advanced Options

- `--key-size`: Specify AES key size (128, 192, or 256 bits)
- `--mode`: Choose encryption mode (CBC, ECB)
- `--iv`: Specify initialization vector (for CBC mode)

## Implementation Details

This implementation follows the AES specification as described in [FIPS 197](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf). The implementation includes:

1. Key expansion
2. SubBytes transformation
3. ShiftRows transformation
4. MixColumns transformation
5. AddRoundKey operation

## Testing

The project includes comprehensive tests in the `tests` directory. To run the tests:

```bash
cargo test
```

Test scenarios are documented in the `testing/README.md` file.

## Security Considerations

- This is an educational implementation and should not be used for production security-critical applications
- The implementation follows the AES specification but may not be optimized for performance
- Always use strong passphrases and keep them secure
- Consider using established cryptographic libraries for production use

## License

MIT License - see LICENSE file for details 