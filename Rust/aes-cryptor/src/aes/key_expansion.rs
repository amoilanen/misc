//! AES key expansion implementation
//! Based on FIPS 197 Section 5.2

use crate::aes::{Block, KeySize};
use crate::aes::tables::{SBOX, RCON};

/// Rotates a 32-bit word left by 8 bits
fn rot_word(word: u32) -> u32 {
    (word << 8) | (word >> 24)
}

/// Applies S-box to each byte of a 32-bit word
fn sub_word(word: u32) -> u32 {
    let mut result = 0u32;
    for i in 0..4 {
        let byte = ((word >> (24 - 8 * i)) & 0xFF) as u8;
        result |= (SBOX[byte as usize] as u32) << (24 - 8 * i);
    }
    result
}

/// Expands the cipher key into round keys
pub fn key_expansion(key: &[u8], key_size: KeySize) -> Vec<Block> {
    let nk = match key_size {
        KeySize::Bits128 => 4,
        KeySize::Bits192 => 6,
        KeySize::Bits256 => 8,
    };

    let number_of_rounds = match key_size {
        KeySize::Bits128 => 10,
        KeySize::Bits192 => 12,
        KeySize::Bits256 => 14,
    };

    // Calculate total number of words needed
    let total_words = match key_size {
        KeySize::Bits128 => 4 * (number_of_rounds + 1),  // 4 * (10 + 1) = 44
        KeySize::Bits192 => 6 * (number_of_rounds + 1),  // 6 * (12 + 1) = 78
        KeySize::Bits256 => 8 * (number_of_rounds + 1),  // 8 * (14 + 1) = 120
    };

    let mut w = vec![0u32; total_words];

    // Copy the initial key into the first nk words
    for i in 0..nk {
        w[i] = ((key[4 * i] as u32) << 24) |
               ((key[4 * i + 1] as u32) << 16) |
               ((key[4 * i + 2] as u32) << 8) |
               (key[4 * i + 3] as u32);
    }

    // Generate the remaining words
    for i in nk..total_words {
        let mut temp = w[i - 1];
        if i % nk == 0 {
            temp = sub_word(rot_word(temp)) ^ RCON[(i / nk - 1) % 10];
        } else if nk > 6 && i % nk == 4 {
            temp = sub_word(temp);
        }
        w[i] = w[i - nk] ^ temp;
    }

    // Convert words into round keys
    let mut round_keys = Vec::with_capacity(number_of_rounds + 1);
    for i in 0..=number_of_rounds {
        let mut block = [[0u8; 4]; 4];
        for j in 0..4 {
            let word = w[nk * i + j];
            block[0][j] = ((word >> 24) & 0xFF) as u8;
            block[1][j] = ((word >> 16) & 0xFF) as u8;
            block[2][j] = ((word >> 8) & 0xFF) as u8;
            block[3][j] = (word & 0xFF) as u8;
        }
        // For AES-192 and AES-256, we need to include additional words
        let mut extra_words = Vec::new();
        if key_size == KeySize::Bits192 {
            // For AES-192, include 2 more words
            for j in 4..6 {
                let word = w[nk * i + j];
                extra_words.push(((word >> 24) & 0xFF) as u8);
                extra_words.push(((word >> 16) & 0xFF) as u8);
                extra_words.push(((word >> 8) & 0xFF) as u8);
                extra_words.push((word & 0xFF) as u8);
            }
        } else if key_size == KeySize::Bits256 {
            // For AES-256, include 4 more words
            for j in 4..8 {
                let word = w[nk * i + j];
                extra_words.push(((word >> 24) & 0xFF) as u8);
                extra_words.push(((word >> 16) & 0xFF) as u8);
                extra_words.push(((word >> 8) & 0xFF) as u8);
                extra_words.push((word & 0xFF) as u8);
            }
        }
        round_keys.push(Block { state: block, size: key.len(), extra_words });
    }

    round_keys
}

#[cfg(test)]
mod tests {
    use super::*;
    use hex;

    #[test]
    fn test_key_expansion_128() {
        // Test vector from FIPS 197 Appendix A.1
        let key = hex::decode("2b7e151628aed2a6abf7158809cf4f3c").unwrap();
        let round_keys = key_expansion(&key, KeySize::Bits128);

        // Verify first round key
        let expected = hex::decode("2b7e151628aed2a6abf7158809cf4f3c").unwrap();
        assert_eq!(round_keys[0].to_bytes(), expected.as_slice());

        // Verify second round key
        let expected = hex::decode("a0fafe1788542cb123a339392a6c7605").unwrap();
        assert_eq!(round_keys[1].to_bytes(), expected.as_slice());
    }

    #[test]
    fn test_key_expansion_192() {
        // Test vector from FIPS 197 Appendix A.2
        let key = hex::decode("8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b").unwrap();
        let round_keys = key_expansion(&key, KeySize::Bits192);

        // Verify first round key
        let expected = hex::decode("8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b").unwrap();
        assert_eq!(round_keys[0].to_bytes(), expected.as_slice());

        // Verify second round key
        let expected = hex::decode("fe0c91f72402f5a5ec12068e6c827f6b0e7a95b95c56fec2").unwrap();
        assert_eq!(round_keys[1].to_bytes(), expected.as_slice());
    }

    #[test]
    fn test_key_expansion_256() {
        // Test vector from FIPS 197 Appendix A.3
        let key = hex::decode("603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4").unwrap();
        let round_keys = key_expansion(&key, KeySize::Bits256);

        // Verify first round key
        let expected = hex::decode("603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4").unwrap();
        assert_eq!(round_keys[0].to_bytes(), expected.as_slice());

        // Verify second round key
        let expected = hex::decode("9ba354118e6925afa51a8b5f2067fcdea8b09c1a93d194cdbe49846eb75d5b9a").unwrap();
        assert_eq!(round_keys[1].to_bytes(), expected.as_slice());
    }
} 