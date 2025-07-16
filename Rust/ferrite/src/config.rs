use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;
use anyhow::Result;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub name: String,
    pub background: [u8; 3],
    pub foreground: [u8; 3],
    pub cursor: [u8; 3],
    pub selection: [u8; 3],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Font {
    pub family: String,
    pub size: f32,
    pub bold: bool,
    pub italic: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shortcuts {
    pub new_tab: String,
    pub close_tab: String,
    pub next_tab: String,
    pub prev_tab: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub shell: String,
    pub theme: Theme,
    pub font: Font,
    pub shortcuts: Shortcuts,
    pub tab_count: usize,
}

impl Default for Config {
    fn default() -> Self {
        let default_shell = if cfg!(target_os = "linux") {
            "/bin/bash".to_string()
        } else if cfg!(target_os = "macos") {
            "/bin/zsh".to_string()
        } else {
            "/bin/sh".to_string()
        };

        let default_font = if cfg!(target_os = "linux") {
            "Hack".to_string()
        } else if cfg!(target_os = "macos") {
            "Menlo".to_string()
        } else {
            "Monaco".to_string()
        };

        Self {
            shell: default_shell,
            theme: Theme {
                name: "Default".to_string(),
                background: [255, 255, 255], // White
                foreground: [0, 0, 0],       // Black
                cursor: [0, 0, 0],           // Black
                selection: [200, 200, 200],  // Light gray
            },
            font: Font {
                family: default_font,
                size: 10.0,
                bold: false,
                italic: false,
            },
            shortcuts: Shortcuts {
                new_tab: "Ctrl+Shift+T".to_string(),
                close_tab: "Ctrl+Shift+W".to_string(),
                next_tab: "Shift+Right".to_string(),
                prev_tab: "Shift+Left".to_string(),
            },
            tab_count: 1,
        }
    }
}

impl Config {
    pub fn load() -> Result<Self> {
        let config_path = Self::config_path()?;
        
        if config_path.exists() {
            let content = fs::read_to_string(&config_path)?;
            let config: Config = toml::from_str(&content)?;
            info!("Loaded configuration from {:?}", config_path);
            Ok(config)
        } else {
            let config = Config::default();
            config.save()?;
            Ok(config)
        }
    }

    pub fn save(&self) -> Result<()> {
        let config_path = Self::config_path()?;
        
        // Ensure config directory exists
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        
        let content = toml::to_string_pretty(self)?;
        fs::write(&config_path, content)?;
        info!("Saved configuration to {:?}", config_path);
        Ok(())
    }

    fn config_path() -> Result<PathBuf> {
        let mut path = dirs::config_dir()
            .ok_or_else(|| anyhow::anyhow!("Could not find config directory"))?;
        path.push("ferrite");
        path.push("config.toml");
        Ok(path)
    }

    pub fn get_theme(&self) -> &Theme {
        &self.theme
    }

    pub fn get_font(&self) -> &Font {
        &self.font
    }

    pub fn get_shell(&self) -> &str {
        &self.shell
    }

    pub fn get_shortcuts(&self) -> &Shortcuts {
        &self.shortcuts
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_config_default() {
        let config = Config::default();
        assert!(!config.shell.is_empty());
        assert!(!config.font.family.is_empty());
        assert!(config.font.size > 0.0);
    }

    #[test]
    fn test_config_serialization() {
        let config = Config::default();
        let serialized = toml::to_string(&config).unwrap();
        let deserialized: Config = toml::from_str(&serialized).unwrap();
        
        assert_eq!(config.shell, deserialized.shell);
        assert_eq!(config.font.family, deserialized.font.family);
        assert_eq!(config.font.size, deserialized.font.size);
    }
} 