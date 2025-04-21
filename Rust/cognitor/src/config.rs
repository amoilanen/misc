use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Model {
    pub name: String,
    pub api_url: String,
    pub api_key: Option<String>,
    pub api_key_header: Option<String>,
    pub model_identifier: Option<String>,
    pub request_format: String,
    pub response_json_path: String,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct Config {
    pub models: HashMap<String, Model>,
    pub default_model: Option<String>,
    pub current_model: Option<String>,
}

impl Config {
    pub fn config_path() -> Result<PathBuf> {
        let config_dir = dirs::config_dir()
            .context("Failed to find config directory")?
            .join("cliff");
        Ok(config_dir.join("config.toml"))
    }

    pub fn load() -> Result<Self> {
        let path = Self::config_path()?;
        if !path.exists() {
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)
                    .with_context(|| format!("Failed to create config directory: {:?}", parent))?;
            }
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

    pub fn save(&self) -> Result<()> {
        let path = Self::config_path()?;
        let content = toml::to_string_pretty(self)
            .context("Failed to serialize config")?;
        fs::write(&path, content)
            .with_context(|| format!("Failed to write config file: {:?}", path))?;
        Ok(())
    }

    pub fn get_active_model(&self) -> Option<&Model> {
        self.current_model
            .as_ref()
            .or(self.default_model.as_ref())
            .and_then(|name| self.models.get(name))
    }

    pub fn add_model(&mut self, model: Model) {
        self.models.insert(model.name.clone(), model);
    }

    pub fn set_default_model(&mut self, name: &str) -> Result<()> {
        if self.models.contains_key(name) {
            self.default_model = Some(name.to_string());
            Ok(())
        } else {
            anyhow::bail!("Model '{}' not found in configuration.", name);
        }
    }

    pub fn set_current_model(&mut self, name: &str) -> Result<()> {
        if self.models.contains_key(name) {
            self.current_model = Some(name.to_string());
            Ok(())
        } else {
            anyhow::bail!("Model '{}' not found in configuration.", name);
        }
    }

    pub fn clear_current_model(&mut self) {
        self.current_model = None;
    }

    pub fn delete_model(&mut self, name: &str) -> Result<()> {
        if self.models.contains_key(name) {
            self.models.remove(name);
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

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;

    #[test]
    fn test_serialize_deserialize() -> Result<()> {
        let mut config = Config::default();
        let model = Model {
            name: "test-model".to_string(),
            api_url: "http://localhost:8080".to_string(),
            api_key: Some("test-key".to_string()),
            api_key_header: None,
            model_identifier: Some("gpt-test".to_string()),
            request_format: "test-format".to_string(),
            response_json_path: "$.".to_string(),
        };
        config.add_model(model.clone());
        config.set_default_model("test-model")?;

        let serialized = toml::to_string_pretty(&config)?;
        let deserialized: Config = toml::from_str(&serialized)?;

        assert_eq!(config.default_model, deserialized.default_model);
        assert_eq!(config.models.len(), 1);
        assert_eq!(deserialized.models.len(), 1);
        assert_eq!(config.models.get("test-model").unwrap().api_url, deserialized.models.get("test-model").unwrap().api_url);
        Ok(())
    }

     #[test]
    fn test_get_active_model() -> Result<()> {
        let mut config = Config::default();
        let request_format = r#"{"input": "{{prompt}}"}"#;
        let model1 = Model { name: "model1".to_string(), api_url: "url1".to_string(), api_key: None, api_key_header: None, model_identifier: None, request_format: request_format.to_string(), response_json_path: "$.".to_string() };
        let model2 = Model { name: "model2".to_string(), api_url: "url2".to_string(), api_key: None, api_key_header: None, model_identifier: None, request_format: request_format.to_string(), response_json_path: "$.".to_string() };
        config.add_model(model1.clone());
        config.add_model(model2.clone());

        assert!(config.get_active_model().is_none());

        config.set_default_model("model1")?;
        assert_eq!(config.get_active_model().unwrap().name, "model1");

        config.set_current_model("model2")?;
         assert_eq!(config.get_active_model().unwrap().name, "model2");

        config.clear_current_model();
        assert_eq!(config.get_active_model().unwrap().name, "model1");
        Ok(())
    }

     #[test]
    fn test_set_default_current_model_errors() {
        let mut config = Config::default();
        let request_format = r#"{"input": "{{prompt}}"}"#;
        let model = Model { name: "model1".to_string(), api_url: "url1".to_string(), api_key: None, api_key_header: None, model_identifier: None, request_format: request_format.to_string(), response_json_path: "$.".to_string() };
        config.add_model(model.clone());

        assert!(config.set_default_model("model1").is_ok());
        assert!(config.set_default_model("nonexistent").is_err());

        assert!(config.set_current_model("model1").is_ok());
        assert!(config.set_current_model("nonexistent").is_err());
    }
}
