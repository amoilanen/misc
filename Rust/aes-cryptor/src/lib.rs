//! AES Cryptor - A pure Rust implementation of the AES block cipher
//! 
//! This crate provides a command-line utility and library for AES encryption and decryption.
//! The implementation follows the FIPS 197 specification and includes support for:
//! 
//! - AES-128, AES-192, and AES-256
//! - ECB and CBC modes of operation
//! - Passphrase-based key derivation
//! - Standard input/output streaming
//! 
//! # Examples
//! 
//! ```rust
//! use aes_cryptor::aes::{KeySize, Mode};
//! use aes_cryptor::aes::cipher::{encrypt, decrypt};
//! 
//! let key = &hex::decode("2b7e151628aed2a6abf7158809cf4f3c").unwrap();
//! let data = b"Hello, World!";
//! 
//! // Encrypt
//! let ciphertext = encrypt(data, key, KeySize::Bits128, Mode::CBC, None);
//! 
//! // Decrypt
//! let plaintext = decrypt(&ciphertext, key, KeySize::Bits128, Mode::CBC, None);
//! 
//! assert_eq!(data.to_vec(), plaintext);
//! ```

pub mod aes; 