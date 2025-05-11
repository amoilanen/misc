package config

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadConfig(t *testing.T) {
	// Create a temporary config file
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.yaml")

	// Create a private key file
	privateKeyPath := filepath.Join(tmpDir, "private-key.pem")
	err := os.WriteFile(privateKeyPath, []byte("fake-private-key"), 0600)
	require.NoError(t, err)

	// Write test config
	configContent := `
github:
  webhook_secret: "test-secret"
  app_id: "12345"
  private_key_path: "` + privateKeyPath + `"
llm:
  provider: "openai"
  api_key: "test-api-key"
  model: "gpt-4"
repositories:
  - owner: "test-org"
    name: "test-repo"
    branch: "main"
server:
  port: 8080
  host: "localhost"
`
	err = os.WriteFile(configPath, []byte(configContent), 0644)
	require.NoError(t, err)

	// Test loading config
	config, err := LoadConfig(configPath)
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Verify config values
	assert.Equal(t, "test-secret", config.GitHub.WebhookSecret)
	assert.Equal(t, "12345", config.GitHub.AppID)
	assert.Equal(t, privateKeyPath, config.GitHub.PrivateKeyPath)
	assert.Equal(t, "openai", config.LLM.Provider)
	assert.Equal(t, "test-api-key", config.LLM.APIKey)
	assert.Equal(t, "gpt-4", config.LLM.Model)
	assert.Len(t, config.Repositories, 1)
	assert.Equal(t, "test-org", config.Repositories[0].Owner)
	assert.Equal(t, "test-repo", config.Repositories[0].Name)
	assert.Equal(t, "main", config.Repositories[0].Branch)
	assert.Equal(t, 8080, config.Server.Port)
	assert.Equal(t, "localhost", config.Server.Host)
}

func TestLoadConfigValidation(t *testing.T) {
	tests := []struct {
		name        string
		config      string
		expectError bool
	}{
		{
			name: "valid config",
			config: `
github:
  webhook_secret: "test-secret"
  app_id: "12345"
  private_key_path: "%s"
llm:
  provider: "openai"
  api_key: "test-api-key"
  model: "gpt-4"
repositories:
  - owner: "test-org"
    name: "test-repo"
    branch: "main"
server:
  port: 8080
  host: "localhost"
`,
			expectError: false,
		},
		{
			name: "missing webhook secret",
			config: `
github:
  app_id: "12345"
  private_key_path: "%s"
llm:
  provider: "openai"
  api_key: "test-api-key"
  model: "gpt-4"
repositories:
  - owner: "test-org"
    name: "test-repo"
    branch: "main"
`,
			expectError: true,
		},
		{
			name: "missing LLM provider",
			config: `
github:
  webhook_secret: "test-secret"
  app_id: "12345"
  private_key_path: "%s"
llm:
  api_key: "test-api-key"
  model: "gpt-4"
repositories:
  - owner: "test-org"
    name: "test-repo"
    branch: "main"
`,
			expectError: true,
		},
		{
			name: "missing repositories",
			config: `
github:
  webhook_secret: "test-secret"
  app_id: "12345"
  private_key_path: "%s"
llm:
  provider: "openai"
  api_key: "test-api-key"
  model: "gpt-4"
repositories: []
`,
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create temporary config file
			tmpDir := t.TempDir()
			configPath := filepath.Join(tmpDir, "config.yaml")

			// Create private key file if it's referenced in the config
			privateKeyPath := filepath.Join(tmpDir, "test-key.pem")
			if !tt.expectError {
				err := os.WriteFile(privateKeyPath, []byte("fake-private-key"), 0600)
				require.NoError(t, err)
			}

			// Write config with the full path to the private key
			configContent := fmt.Sprintf(tt.config, privateKeyPath)
			err := os.WriteFile(configPath, []byte(configContent), 0644)
			require.NoError(t, err)

			// Test loading config
			config, err := LoadConfig(configPath)
			if tt.expectError {
				assert.Error(t, err)
				assert.Nil(t, config)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, config)
			}
		})
	}
}
