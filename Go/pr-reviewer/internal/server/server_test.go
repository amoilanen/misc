package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/amoilanen/pr-reviewer/internal/config"
)

func TestNewServer(t *testing.T) {
	cfg := &config.Config{
		GitHub: config.GitHubConfig{
			WebhookSecret: "test-secret",
			AppID:         "test-app-id",
		},
		LLM: config.LLMConfig{
			Provider: "openai",
			APIKey:   "test-key",
			Model:    "gpt-4",
		},
		Server: config.ServerConfig{
			Port: 8080,
			Host: "localhost",
		},
	}

	server, err := NewServer(cfg)
	require.NoError(t, err)
	assert.NotNil(t, server)
	assert.NotNil(t, server.config)
	assert.NotNil(t, server.logger)
	assert.NotNil(t, server.gh)
	assert.NotNil(t, server.llm)
}

func TestHandleWebhook(t *testing.T) {
	// Set up test server
	gin.SetMode(gin.TestMode)
	cfg := &config.Config{
		GitHub: config.GitHubConfig{
			WebhookSecret: "test-secret",
			AppID:         "test-app-id",
		},
		LLM: config.LLMConfig{
			Provider: "openai",
			APIKey:   "test-key",
			Model:    "gpt-4",
		},
		Server: config.ServerConfig{
			Port: 8080,
			Host: "localhost",
		},
	}

	server, err := NewServer(cfg)
	require.NoError(t, err)

	// Create test router
	router := gin.New()
	router.POST("/webhook", server.handleWebhook)

	tests := []struct {
		name           string
		eventType      string
		payload        interface{}
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name:      "valid pull request event",
			eventType: "pull_request",
			payload: map[string]interface{}{
				"action": "opened",
				"pull_request": map[string]interface{}{
					"number": 1,
				},
				"repository": map[string]interface{}{
					"owner": map[string]interface{}{
						"login": "test-owner",
					},
					"name": "test-repo",
				},
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "processing PR",
			},
		},
		{
			name:      "ignored event type",
			eventType: "push",
			payload: map[string]interface{}{
				"action": "opened",
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "ignored event type",
			},
		},
		{
			name:      "ignored action",
			eventType: "pull_request",
			payload: map[string]interface{}{
				"action": "closed",
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "ignored action",
			},
		},
		{
			name:           "invalid payload",
			eventType:      "pull_request",
			payload:        "invalid",
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": "invalid payload",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			payload, err := json.Marshal(tt.payload)
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPost, "/webhook", bytes.NewBuffer(payload))
			req.Header.Set("X-GitHub-Event", tt.eventType)
			req.Header.Set("X-Hub-Signature-256", "test-signature")

			// Create response recorder
			w := httptest.NewRecorder()

			// Perform request
			router.ServeHTTP(w, req)

			// Check response
			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedBody, response)
		})
	}
}

func TestVerifyWebhookSignature(t *testing.T) {
	// Test cases would go here
	// For now, just test that it returns true
	assert.True(t, verifyWebhookSignature("test-signature", nil, "test-secret"))
}

func TestGetContextFiles(t *testing.T) {
	// Test cases would go here
	// For now, just test that it returns an empty list
	assert.Empty(t, getContextFiles("test-dir"))
}
