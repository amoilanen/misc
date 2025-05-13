package config

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

type Config struct {
	GitHub       GitHubConfig       `mapstructure:"github"`
	LLM          LLMConfig          `mapstructure:"llm"`
	Repositories []RepositoryConfig `mapstructure:"repositories"`
	Server       ServerConfig       `mapstructure:"server"`
}

type GitHubConfig struct {
	WebhookSecret  string `mapstructure:"webhook_secret"`
	AppID          string `mapstructure:"app_id"`
	PrivateKeyPath string `mapstructure:"private_key_path"`
}

type LLMConfig struct {
	Provider string `mapstructure:"provider"`
	APIKey   string `mapstructure:"api_key"`
	Model    string `mapstructure:"model"`
}

type RepositoryConfig struct {
	Owner  string `mapstructure:"owner"`
	Name   string `mapstructure:"name"`
	Branch string `mapstructure:"branch"`
}

type ServerConfig struct {
	Port int    `mapstructure:"port"`
	Host string `mapstructure:"host"`
}

func LoadConfig(configPath string) (*Config, error) {
	viper.SetConfigFile(configPath)
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	if err := validateConfig(&config); err != nil {
		return nil, err
	}

	return &config, nil
}

func validateConfig(config *Config) error {
	if config.GitHub.WebhookSecret == "" {
		return fmt.Errorf("github webhook secret is required")
	}
	if config.GitHub.AppID == "" {
		return fmt.Errorf("github app ID is required")
	}
	if config.GitHub.PrivateKeyPath == "" {
		return fmt.Errorf("github private key path is required")
	}
	if _, err := os.Stat(config.GitHub.PrivateKeyPath); os.IsNotExist(err) {
		return fmt.Errorf("github private key file does not exist: %s", config.GitHub.PrivateKeyPath)
	}
	if config.LLM.Provider == "" {
		return fmt.Errorf("LLM provider is required")
	}
	if config.LLM.APIKey == "" {
		return fmt.Errorf("LLM API key is required")
	}
	if config.LLM.Model == "" {
		return fmt.Errorf("LLM model is required")
	}
	if len(config.Repositories) == 0 {
		return fmt.Errorf("at least one repository configuration is required")
	}
	return nil
}
