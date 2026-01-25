use serde_json::Value;
use tauri::AppHandle;

#[derive(Debug, Clone, PartialEq)]
pub enum OperationDecision {
    Allow,
    Deny,
}

pub trait BackendPlugin: Send + Sync {
    fn name(&self) -> &str;
    fn on_init(&self, app: &AppHandle) -> Result<(), Box<dyn std::error::Error>>;
    fn on_before_copy(&self, _sources: &[&str], _dest: &str) -> OperationDecision {
        OperationDecision::Allow
    }
    fn on_before_delete(&self, _sources: &[&str]) -> OperationDecision {
        OperationDecision::Allow
    }
    fn on_custom_command(
        &self,
        _command: &str,
        _args: &Value,
    ) -> Option<Value> {
        None
    }
}

pub struct PluginManager {
    plugins: Vec<Box<dyn BackendPlugin>>,
}

impl PluginManager {
    pub fn new() -> Self {
        Self {
            plugins: Vec::new(),
        }
    }

    pub fn register(&mut self, plugin: Box<dyn BackendPlugin>) {
        self.plugins.push(plugin);
    }

    pub fn before_copy(&self, sources: &[&str], dest: &str) -> OperationDecision {
        for plugin in &self.plugins {
            if plugin.on_before_copy(sources, dest) == OperationDecision::Deny {
                return OperationDecision::Deny;
            }
        }
        OperationDecision::Allow
    }

    pub fn before_delete(&self, sources: &[&str]) -> OperationDecision {
        for plugin in &self.plugins {
            if plugin.on_before_delete(sources) == OperationDecision::Deny {
                return OperationDecision::Deny;
            }
        }
        OperationDecision::Allow
    }
}

impl Default for PluginManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestPlugin {
        deny_copy: bool,
    }

    impl BackendPlugin for TestPlugin {
        fn name(&self) -> &str {
            "test-plugin"
        }

        fn on_init(&self, _app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
            Ok(())
        }

        fn on_before_copy(&self, _sources: &[&str], _dest: &str) -> OperationDecision {
            if self.deny_copy {
                OperationDecision::Deny
            } else {
                OperationDecision::Allow
            }
        }
    }

    #[test]
    fn test_plugin_manager_allows_by_default() {
        let manager = PluginManager::new();
        assert_eq!(
            manager.before_copy(&["/tmp/file.txt"], "/tmp/dest"),
            OperationDecision::Allow
        );
    }

    #[test]
    fn test_plugin_manager_denies_when_plugin_denies() {
        let mut manager = PluginManager::new();
        manager.register(Box::new(TestPlugin { deny_copy: true }));
        assert_eq!(
            manager.before_copy(&["/tmp/file.txt"], "/tmp/dest"),
            OperationDecision::Deny
        );
    }

    #[test]
    fn test_plugin_manager_allows_when_plugin_allows() {
        let mut manager = PluginManager::new();
        manager.register(Box::new(TestPlugin { deny_copy: false }));
        assert_eq!(
            manager.before_copy(&["/tmp/file.txt"], "/tmp/dest"),
            OperationDecision::Allow
        );
    }
}
