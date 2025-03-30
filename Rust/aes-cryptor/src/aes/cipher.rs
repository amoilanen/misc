//! AES cipher implementation
//! Based on FIPS 197 Section 5.1

use crate::aes::{Block, KeySize, Mode};
use crate::aes::transformations::*;
use crate::aes::key_expansion::key_expansion;
use crate::aes::BLOCK_SIZE;
use std::error::Error;
use std::fmt;

/// Encrypts a single block using AES
pub fn encrypt_block(block: &mut Block, round_keys: &[Block]) {
    let num_rounds = round_keys.len() - 1;

    // Initial round
    add_round_key(block, &round_keys[0]);

    // Main rounds
    for round in 1..num_rounds {
        sub_bytes(block);
        shift_rows(block);
        mix_columns(block);
        add_round_key(block, &round_keys[round]);
    }

    // Final round
    sub_bytes(block);
    shift_rows(block);
    add_round_key(block, &round_keys[num_rounds]);
}

/// Decrypts a single block using AES
pub fn decrypt_block(block: &mut Block, round_keys: &[Block]) {
    let num_rounds = round_keys.len() - 1;

    // Initial round
    add_round_key(block, &round_keys[num_rounds]);

    // Main rounds
    for round in (1..num_rounds).rev() {
        inv_shift_rows(block);
        inv_sub_bytes(block);
        add_round_key(block, &round_keys[round]);
        inv_mix_columns(block);
    }

    // Final round
    inv_shift_rows(block);
    inv_sub_bytes(block);
    add_round_key(block, &round_keys[0]);
}

#[derive(Debug)]
pub enum CipherError {
    InvalidKeySize,
    InvalidBlockSize,
    InvalidIV,
    InvalidPadding,
}

impl fmt::Display for CipherError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CipherError::InvalidKeySize => write!(f, "Invalid key size"),
            CipherError::InvalidBlockSize => write!(f, "Invalid block size"),
            CipherError::InvalidIV => write!(f, "Invalid IV"),
            CipherError::InvalidPadding => write!(f, "Invalid padding"),
        }
    }
}

impl Error for CipherError {}

/// Encrypts data using AES in the specified mode
pub fn encrypt(data: &[u8], key: &[u8], key_size: KeySize, mode: Mode, iv: Option<&[u8]>) -> Result<Vec<u8>, CipherError> {
    // Validate key size
    let expected_key_size = match key_size {
        KeySize::Bits128 => 16,
        KeySize::Bits192 => 24,
        KeySize::Bits256 => 32,
    };
    if key.len() != expected_key_size {
        return Err(CipherError::InvalidKeySize);
    }

    // Validate IV for CBC mode
    if mode == Mode::CBC {
        if let Some(iv) = iv {
            if iv.len() != BLOCK_SIZE {
                return Err(CipherError::InvalidIV);
            }
        }
    }

    let round_keys = key_expansion(key, key_size);
    let mut result = Vec::with_capacity(data.len() + BLOCK_SIZE);
    let mut prev_block: Option<Block> = None;

    // Add PKCS7 padding
    let padding = BLOCK_SIZE - (data.len() % BLOCK_SIZE);
    let mut padded_data = data.to_vec();
    padded_data.extend(std::iter::repeat(padding as u8).take(padding));

    // Process each block
    for chunk in padded_data.chunks(BLOCK_SIZE) {
        let mut block = Block::new(chunk);

        match mode {
            Mode::ECB => {
                encrypt_block(&mut block, &round_keys);
            }
            Mode::CBC => {
                if let Some(iv) = iv {
                    // XOR with IV for first block
                    for i in 0..4 {
                        for j in 0..4 {
                            block.state[i][j] ^= iv[i * 4 + j];
                        }
                    }
                } else if let Some(prev) = prev_block {
                    // XOR with previous ciphertext block
                    for i in 0..4 {
                        for j in 0..4 {
                            block.state[i][j] ^= prev.state[i][j];
                        }
                    }
                }
                encrypt_block(&mut block, &round_keys);
                prev_block = Some(block.clone());
            }
        }

        result.extend_from_slice(&block.to_bytes());
    }

    Ok(result)
}

/// Decrypts data using AES in the specified mode
pub fn decrypt(data: &[u8], key: &[u8], key_size: KeySize, mode: Mode, iv: Option<&[u8]>) -> Result<Vec<u8>, CipherError> {
    // Validate key size
    let expected_key_size = match key_size {
        KeySize::Bits128 => 16,
        KeySize::Bits192 => 24,
        KeySize::Bits256 => 32,
    };
    if key.len() != expected_key_size {
        return Err(CipherError::InvalidKeySize);
    }

    // Validate input data length
    if data.len() % BLOCK_SIZE != 0 {
        return Err(CipherError::InvalidBlockSize);
    }

    // Validate IV for CBC mode
    if mode == Mode::CBC {
        if let Some(iv) = iv {
            if iv.len() != BLOCK_SIZE {
                return Err(CipherError::InvalidIV);
            }
        }
    }

    let round_keys = key_expansion(key, key_size);
    let mut result = Vec::with_capacity(data.len());
    let mut prev_block: Option<Block> = None;

    // Process each block
    for chunk in data.chunks(BLOCK_SIZE) {
        let block = Block::new(chunk);
        let mut decrypted = block.clone();

        decrypt_block(&mut decrypted, &round_keys);

        match mode {
            Mode::ECB => {
                result.extend_from_slice(&decrypted.to_bytes());
            }
            Mode::CBC => {
                if let Some(iv) = iv {
                    // XOR with IV for first block
                    for i in 0..4 {
                        for j in 0..4 {
                            decrypted.state[i][j] ^= iv[i * 4 + j];
                        }
                    }
                } else if let Some(prev) = prev_block {
                    // XOR with previous ciphertext block
                    for i in 0..4 {
                        for j in 0..4 {
                            decrypted.state[i][j] ^= prev.state[i][j];
                        }
                    }
                }
                result.extend_from_slice(&decrypted.to_bytes());
                prev_block = Some(block);
            }
        }
    }

    // Remove PKCS7 padding
    if let Some(&padding) = result.last() {
        if padding as usize <= BLOCK_SIZE {
            // Validate padding
            if padding as usize > result.len() {
                return Err(CipherError::InvalidPadding);
            }
            // Verify all padding bytes are equal
            for &byte in result.iter().rev().take(padding as usize) {
                if byte != padding {
                    return Err(CipherError::InvalidPadding);
                }
            }
            result.truncate(result.len() - padding as usize);
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use hex;

    #[test]
    fn test_encrypt_decrypt_ecb() {
        // Test vector from FIPS 197 Appendix A.1
        let key = hex::decode("2b7e151628aed2a6abf7158809cf4f3c").unwrap();
        let plaintext = hex::decode("00112233445566778899aabbccddeeff").unwrap();
        
        let ciphertext = encrypt(&plaintext, &key, KeySize::Bits128, Mode::ECB, None).unwrap();
        let decrypted = decrypt(&ciphertext, &key, KeySize::Bits128, Mode::ECB, None).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_encrypt_decrypt_cbc() {
        let key = hex::decode("2b7e151628aed2a6abf7158809cf4f3c").unwrap();
        let iv = hex::decode("000102030405060708090a0b0c0d0e0f").unwrap();
        let plaintext = hex::decode("00112233445566778899aabbccddeeff").unwrap();
        
        let ciphertext = encrypt(&plaintext, &key, KeySize::Bits128, Mode::CBC, Some(&iv)).unwrap();
        let decrypted = decrypt(&ciphertext, &key, KeySize::Bits128, Mode::CBC, Some(&iv)).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_error_handling() {
        let key = hex::decode("2b7e151628aed2a6abf7158809cf4f3c").unwrap();
        let iv = hex::decode("000102030405060708090a0b0c0d0e0f").unwrap();
        let plaintext = hex::decode("00112233445566778899aabbccddeeff").unwrap();

        // Test invalid key size
        let invalid_key = &key[..15];
        assert!(encrypt(&plaintext, invalid_key, KeySize::Bits128, Mode::ECB, None).is_err());

        // Test invalid IV size
        let invalid_iv = &iv[..15];
        assert!(encrypt(&plaintext, &key, KeySize::Bits128, Mode::CBC, Some(invalid_iv)).is_err());

        // Test invalid block size
        let invalid_data = &plaintext[..15];
        assert!(decrypt(invalid_data, &key, KeySize::Bits128, Mode::ECB, None).is_err());

        // Test invalid padding
        let mut invalid_padding = plaintext.clone();
        invalid_padding.push(0x01);
        assert!(decrypt(&invalid_padding, &key, KeySize::Bits128, Mode::ECB, None).is_err());
    }
} 