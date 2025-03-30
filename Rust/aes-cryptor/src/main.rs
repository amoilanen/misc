use std::io::{self, Read, Write};
use clap::{Parser, Subcommand};
use aes_cryptor::aes::{KeySize, Mode};
use aes_cryptor::aes::cipher::{encrypt, decrypt, CipherError};
use hex;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Encrypt data from stdin
    Encrypt {
        /// Passphrase to use for encryption
        #[arg(short, long)]
        passphrase: String,

        /// Key size in bits (128, 192, or 256)
        #[arg(short, long, default_value = "128")]
        key_size: u32,

        /// Encryption mode (ECB or CBC)
        #[arg(short, long, default_value = "CBC")]
        mode: String,

        /// Initialization vector (for CBC mode)
        #[arg(short, long)]
        iv: Option<String>,
    },

    /// Decrypt data from stdin
    Decrypt {
        /// Passphrase to use for decryption
        #[arg(short, long)]
        passphrase: String,

        /// Key size in bits (128, 192, or 256)
        #[arg(short, long, default_value = "128")]
        key_size: u32,

        /// Encryption mode (ECB or CBC)
        #[arg(short, long, default_value = "CBC")]
        mode: String,

        /// Initialization vector (for CBC mode)
        #[arg(short, long)]
        iv: Option<String>,
    },
}

fn main() -> io::Result<()> {
    let cli = Cli::parse();

    // Read input from stdin
    let mut input = Vec::new();
    io::stdin().read_to_end(&mut input)?;

    // Parse key size
    let key_size = match cli.command.key_size() {
        128 => KeySize::Bits128,
        192 => KeySize::Bits192,
        256 => KeySize::Bits256,
        _ => {
            eprintln!("Invalid key size. Must be 128, 192, or 256 bits.");
            return Ok(());
        }
    };

    // Parse mode
    let mode = match cli.command.mode().to_uppercase().as_str() {
        "ECB" => Mode::ECB,
        "CBC" => Mode::CBC,
        _ => {
            eprintln!("Invalid mode. Must be ECB or CBC.");
            return Ok(());
        }
    };

    // Parse IV if provided
    let iv = cli.command.iv().as_ref().map(|iv| {
        match hex::decode(iv) {
            Ok(iv) => iv,
            Err(_) => {
                eprintln!("Invalid IV format. Must be hex-encoded.");
                std::process::exit(1);
            }
        }
    });

    // Generate key from passphrase (using SHA-256)
    let key = {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(cli.command.passphrase().as_bytes());
        let result = hasher.finalize();
        result[..key_size as usize / 8].to_vec()
    };

    match cli.command {
        Commands::Encrypt { .. } => {
            match encrypt(&input, &key, key_size, mode, iv.as_deref()) {
                Ok(ciphertext) => {
                    io::stdout().write_all(&ciphertext)?;
                }
                Err(e) => {
                    eprintln!("Encryption error: {}", e);
                    std::process::exit(1);
                }
            }
        }
        Commands::Decrypt { .. } => {
            match decrypt(&input, &key, key_size, mode, iv.as_deref()) {
                Ok(plaintext) => {
                    io::stdout().write_all(&plaintext)?;
                }
                Err(e) => {
                    eprintln!("Decryption error: {}", e);
                    std::process::exit(1);
                }
            }
        }
    }

    Ok(())
}

// Helper trait to access command fields
trait CommandExt {
    fn key_size(&self) -> u32;
    fn mode(&self) -> &str;
    fn passphrase(&self) -> &str;
    fn iv(&self) -> Option<&String>;
}

impl CommandExt for Commands {
    fn key_size(&self) -> u32 {
        match self {
            Commands::Encrypt { key_size, .. } => *key_size,
            Commands::Decrypt { key_size, .. } => *key_size,
        }
    }

    fn mode(&self) -> &str {
        match self {
            Commands::Encrypt { mode, .. } => mode,
            Commands::Decrypt { mode, .. } => mode,
        }
    }

    fn passphrase(&self) -> &str {
        match self {
            Commands::Encrypt { passphrase, .. } => passphrase,
            Commands::Decrypt { passphrase, .. } => passphrase,
        }
    }

    fn iv(&self) -> Option<&String> {
        match self {
            Commands::Encrypt { iv, .. } => iv.as_ref(),
            Commands::Decrypt { iv, .. } => iv.as_ref(),
        }
    }
} 