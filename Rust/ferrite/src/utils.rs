use std::path::PathBuf;
use anyhow::Result;

/// Get the default shell for the current platform
pub fn get_default_shell() -> String {
    if cfg!(target_os = "linux") {
        "/bin/bash".to_string()
    } else if cfg!(target_os = "macos") {
        "/bin/zsh".to_string()
    } else {
        "/bin/sh".to_string()
    }
}

/// Get the default font for the current platform
pub fn get_default_font() -> String {
    if cfg!(target_os = "linux") {
        "Hack".to_string()
    } else if cfg!(target_os = "macos") {
        "Menlo".to_string()
    } else {
        "Monaco".to_string()
    }
}

/// Check if a shell exists and is executable
pub fn shell_exists(shell_path: &str) -> bool {
    std::path::Path::new(shell_path).exists()
}

/// Get available shells on the system
pub fn get_available_shells() -> Vec<String> {
    let mut shells = Vec::new();
    
    let common_shells = [
        "/bin/bash",
        "/bin/zsh",
        "/bin/sh",
        "/bin/fish",
        "/bin/tcsh",
        "/bin/csh",
    ];
    
    for shell in &common_shells {
        if shell_exists(shell) {
            shells.push(shell.to_string());
        }
    }
    
    shells
}

/// Get the user's home directory
pub fn get_home_dir() -> Result<PathBuf> {
    dirs::home_dir()
        .ok_or_else(|| anyhow::anyhow!("Could not determine home directory"))
}

/// Get the configuration directory
pub fn get_config_dir() -> Result<PathBuf> {
    let mut path = dirs::config_dir()
        .ok_or_else(|| anyhow::anyhow!("Could not determine config directory"))?;
    path.push("ferrite");
    Ok(path)
}

/// Create a directory if it doesn't exist
pub fn ensure_dir_exists(path: &PathBuf) -> Result<()> {
    if !path.exists() {
        std::fs::create_dir_all(path)?;
    }
    Ok(())
}

/// Convert bytes to a string, replacing invalid UTF-8 with replacement characters
pub fn bytes_to_string(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).to_string()
}

/// Convert a string to bytes
pub fn string_to_bytes(s: &str) -> Vec<u8> {
    s.as_bytes().to_vec()
}

/// Check if a character is printable ASCII
pub fn is_printable_ascii(c: char) -> bool {
    c.is_ascii() && !c.is_ascii_control()
}

/// Escape special characters for display
pub fn escape_special_chars(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            '\n' => "\\n".to_string(),
            '\r' => "\\r".to_string(),
            '\t' => "\\t".to_string(),
            '\x00'..='\x1f' | '\x7f' => format!("\\x{:02x}", c as u8),
            _ => c.to_string(),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_default_shell() {
        let shell = get_default_shell();
        assert!(!shell.is_empty());
    }

    #[test]
    fn test_get_default_font() {
        let font = get_default_font();
        assert!(!font.is_empty());
    }

    #[test]
    fn test_shell_exists() {
        // This should exist on most Unix-like systems
        assert!(shell_exists("/bin/sh"));
    }

    #[test]
    fn test_bytes_to_string() {
        let bytes = b"Hello, World!";
        let string = bytes_to_string(bytes);
        assert_eq!(string, "Hello, World!");
    }

    #[test]
    fn test_string_to_bytes() {
        let string = "Hello, World!";
        let bytes = string_to_bytes(string);
        assert_eq!(bytes, b"Hello, World!");
    }

    #[test]
    fn test_is_printable_ascii() {
        assert!(is_printable_ascii('a'));
        assert!(is_printable_ascii('A'));
        assert!(is_printable_ascii('1'));
        assert!(is_printable_ascii(' '));
        assert!(!is_printable_ascii('\n'));
        assert!(!is_printable_ascii('\x00'));
    }

    #[test]
    fn test_escape_special_chars() {
        let input = "Hello\nWorld\tTest";
        let escaped = escape_special_chars(input);
        assert_eq!(escaped, "Hello\\nWorld\\tTest");
    }
} 