use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf; // Removed unused Path import

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Model {
    pub name: String,
    pub api_url: String,
    pub api_key: Option<String>, // API key might be optional depending on the model/service
    pub api_key_header: Option<String>, // e.g., "x-goog-api-key: YOUR_API_KEY" or "Authorization: Bearer $OPENAI_API_KEY"
    // Add other model-specific parameters if needed, e.g., model name for the API call
    pub model_identifier: Option<String>,
    #[serde(default = "default_request_format")]
    pub request_format: Option<String>,
    /// Optional JSONPath to extract the primary response string from the API result
    pub response_json_path: Option<String>,
}

fn default_request_format() -> Option<String> {
    Some("{\"model\": \"{{model}}\", \"prompt\": \"{{prompt}}\"}".to_string())
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct Config {
    #[serde(default)]
    pub models: HashMap<String, Model>,
    pub default_model: Option<String>,
    pub current_model: Option<String>, // Overrides default if set
}

impl Config {
    /// Returns the path to the configuration file.
    pub fn config_path() -> Result<PathBuf> { // Made public
        let config_dir = dirs::config_dir()
            .context("Failed to find config directory")?
            .join("cognitor");
        Ok(config_dir.join("config.toml"))
    }

    /// Loads the configuration from the default path.
    /// Creates the directory and default config if it doesn't exist.
    pub fn load() -> Result<Self> {
        let path = Self::config_path()?;
        if !path.exists() {
            // Create directory if it doesn't exist
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)
                    .with_context(|| format!("Failed to create config directory: {:?}", parent))?;
            }
            // Create a default empty config file
            let default_config = Config::default();
            default_config.save()?;
            Ok(default_config)
        } else {
            let content = fs::read_to_string(&path)
                .with_context(|| format!("Failed to read config file: {:?}", path))?;
            toml::from_str(&content)
                .with_context(|| format!("Failed to parse config file: {:?}", path))
        }
    }

    /// Saves the configuration to the default path.
    pub fn save(&self) -> Result<()> {
        let path = Self::config_path()?;
        let content = toml::to_string_pretty(self)
            .context("Failed to serialize config")?;
        fs::write(&path, content)
            .with_context(|| format!("Failed to write config file: {:?}", path))?;
        Ok(())
    }

    /// Gets the currently active model configuration.
    /// Prefers `current_model`, falls back to `default_model`, then None.
    pub fn get_active_model(&self) -> Option<&Model> {
        self.current_model
            .as_ref()
            .or(self.default_model.as_ref())
            .and_then(|name| self.models.get(name))
    }

     /// Adds or updates a model configuration.
    pub fn add_model(&mut self, model: Model) {
        self.models.insert(model.name.clone(), model);
    }

    /// Sets the default model. Returns error if the model name doesn't exist.
    pub fn set_default_model(&mut self, name: &str) -> Result<()> {
        if self.models.contains_key(name) {
            self.default_model = Some(name.to_string());
            Ok(())
        } else {
            anyhow::bail!("Model '{}' not found in configuration.", name);
        }
    }

     /// Sets the current model for the session. Returns error if the model name doesn't exist.
    pub fn set_current_model(&mut self, name: &str) -> Result<()> {
        if self.models.contains_key(name) {
            self.current_model = Some(name.to_string());
            Ok(())
        } else {
            anyhow::bail!("Model '{}' not found in configuration.", name);
        }
    }

    /// Clears the current model selection.
    pub fn clear_current_model(&mut self) {
        self.current_model = None;
    }

    /// Deletes a model configuration. Returns an error if the model name doesn't exist.
    pub fn delete_model(&mut self, name: &str) -> Result<()> {
        if self.models.contains_key(name) {
            self.models.remove(name);
            // If the deleted model was the default or current model, clear it
            if self.default_model.as_ref() == Some(&name.to_string()) {
                self.default_model = None;
            }
            if self.current_model.as_ref() == Some(&name.to_string()) {
                self.current_model = None;
            }
            Ok(())
        } else {
            anyhow::bail!("Model '{}' not found in configuration.", name);
        }
    }
}

// Basic tests for config loading/saving
#[cfg(test)]
mod tests {
    use super::*;
    // Removed: use tempfile::tempdir;
    // Removed unused helper function set_test_config_path

    #[test]
    fn test_serialize_deserialize() {
        let mut config = Config::default();
        let model = Model {
            name: "test-model".to_string(),
            api_url: "http://localhost:8080".to_string(),
            api_key: Some("test-key".to_string()),
            api_key_header: None,
            model_identifier: Some("gpt-test".to_string()),
            request_format: Some("test-format".to_string()),
            response_json_path: None, // Add the new field
        };
        config.add_model(model.clone());
        config.set_default_model("test-model").unwrap();

        let serialized = toml::to_string_pretty(&config).unwrap();
        let deserialized: Config = toml::from_str(&serialized).unwrap();

        assert_eq!(config.default_model, deserialized.default_model);
        assert_eq!(config.models.len(), 1);
        assert_eq!(deserialized.models.len(), 1);
        assert_eq!(config.models.get("test-model").unwrap().api_url, deserialized.models.get("test-model").unwrap().api_url);
    }

     #[test]
    fn test_get_active_model() {
        let mut config = Config::default();
        let model1 = Model { name: "model1".to_string(), api_url: "url1".to_string(), api_key: None, api_key_header: None, model_identifier: None, request_format: default_request_format(), response_json_path: None }; // Add field
        let model2 = Model { name: "model2".to_string(), api_url: "url2".to_string(), api_key: None, api_key_header: None, model_identifier: None, request_format: default_request_format(), response_json_path: None }; // Add field
        config.add_model(model1.clone());
        config.add_model(model2.clone());

        // No default, no current
        assert!(config.get_active_model().is_none());

        // Default set
        config.set_default_model("model1").unwrap();
        assert_eq!(config.get_active_model().unwrap().name, "model1");

        // Current set (overrides default)
        config.set_current_model("model2").unwrap();
         assert_eq!(config.get_active_model().unwrap().name, "model2");

        // Current cleared, falls back to default
        config.clear_current_model();
        assert_eq!(config.get_active_model().unwrap().name, "model1");
    }

     #[test]
    fn test_set_default_current_model_errors() {
        let mut config = Config::default();
        let model1 = Model { name: "model1".to_string(), api_url: "url1".to_string(), api_key: None, api_key_header: None, model_identifier: None, request_format: default_request_format(), response_json_path: None }; // Add field
        config.add_model(model1.clone());

        assert!(config.set_default_model("model1").is_ok());
        assert!(config.set_default_model("nonexistent").is_err());

        assert!(config.set_current_model("model1").is_ok());
        assert!(config.set_current_model("nonexistent").is_err());
    }
}
