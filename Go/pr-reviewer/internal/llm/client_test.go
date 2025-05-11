package llm

import (
	"context"
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewClient(t *testing.T) {
	client := NewClient(ProviderOpenAI, "test-key", "gpt-4")
	assert.NotNil(t, client)
	assert.Equal(t, ProviderOpenAI, client.provider)
	assert.Equal(t, "test-key", client.apiKey)
	assert.Equal(t, "gpt-4", client.model)
	assert.NotNil(t, client.client)
}

func TestReviewCode(t *testing.T) {
	tests := []struct {
		name           string
		provider       Provider
		diff           string
		context        map[string]string
		expectedError  bool
		expectedResult []ReviewComment
	}{
		{
			name:     "OpenAI review",
			provider: ProviderOpenAI,
			diff:     "test diff",
			context: map[string]string{
				"test.go": "test content",
			},
			expectedError: false,
			expectedResult: []ReviewComment{
				{
					Path:    "test.go",
					Line:    10,
					Content: "Consider adding error handling here",
				},
			},
		},
		{
			name:     "Anthropic review",
			provider: ProviderAnthropic,
			diff:     "test diff",
			context: map[string]string{
				"test.go": "test content",
			},
			expectedError: false,
			expectedResult: []ReviewComment{
				{
					Path:    "test.go",
					Line:    10,
					Content: "Consider adding error handling here",
				},
			},
		},
		{
			name:          "Invalid provider",
			provider:      "invalid",
			diff:          "test diff",
			context:       map[string]string{},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a test server
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// Send mock response based on provider
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)

				// Check if this is the first request
				if r.Header.Get("X-Request-Count") == "" {
					// First request - return a comment
					r.Header.Set("X-Request-Count", "1")
					switch tt.provider {
					case ProviderOpenAI, ProviderOpenRouter:
						w.Write([]byte(`{
							"choices": [{
								"message": {
									"content": "{\"action\":\"comment\",\"params\":{\"path\":\"test.go\",\"line\":10,\"content\":\"Consider adding error handling here\"}}"
								}
							}]
						}`))
					case ProviderAnthropic:
						w.Write([]byte(`{
							"content": [{
								"text": "{\"action\":\"comment\",\"params\":{\"path\":\"test.go\",\"line\":10,\"content\":\"Consider adding error handling here\"}}"
							}]
						}`))
					case ProviderGemini:
						w.Write([]byte(`{
							"candidates": [{
								"content": {
									"parts": [{
										"text": "{\"action\":\"comment\",\"params\":{\"path\":\"test.go\",\"line\":10,\"content\":\"Consider adding error handling here\"}}"
									}]
								}
							}]
						}`))
					}
				} else {
					// Second request - return empty action to end conversation
					switch tt.provider {
					case ProviderOpenAI, ProviderOpenRouter:
						w.Write([]byte(`{
							"choices": [{
								"message": {
									"content": "{\"action\":\"\",\"params\":{}}"
								}
							}]
						}`))
					case ProviderAnthropic:
						w.Write([]byte(`{
							"content": [{
								"text": "{\"action\":\"\",\"params\":{}}"
							}]
						}`))
					case ProviderGemini:
						w.Write([]byte(`{
							"candidates": [{
								"content": {
									"parts": [{
										"text": "{\"action\":\"\",\"params\":{}}"
									}]
								}
							}]
						}`))
					}
				}
			}))
			defer server.Close()

			// Create client with test server URL
			client := NewClient(tt.provider, "test-key", "test-model")
			client.BaseURL = server.URL
			client.client = &http.Client{
				Transport: &http.Transport{
					Proxy: func(_ *http.Request) (*url.URL, error) {
						return url.Parse(server.URL)
					},
					// Disable TLS for test server
					TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
				},
			}

			// Set up callbacks
			client.SetCallbacks(
				func(path string) (string, error) { return "test content", nil },
				func(dir string) ([]string, error) { return []string{"test.go"}, nil },
				func(pattern string) ([]string, error) { return []string{"test.go"}, nil },
			)

			comments, err := client.ReviewCode(context.Background(), tt.diff, tt.context)

			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, comments)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedResult, comments)
			}
		})
	}
}

func TestBuildPrompt(t *testing.T) {
	diff := "test diff"
	context := map[string]string{
		"test.go": "test content",
		"main.go": "main content",
	}

	prompt := buildPrompt(diff, context)

	// Check that all expected substrings are present
	expectedSubstrings := []string{
		"Please review the following code changes:",
		"test diff",
		"Additional context:",
		"File: test.go\ntest content",
		"File: main.go\nmain content",
	}
	for _, substr := range expectedSubstrings {
		assert.Contains(t, prompt, substr)
	}
}

func TestHandleRequest(t *testing.T) {
	client := NewClient(ProviderOpenAI, "test-key", "gpt-4")

	tests := []struct {
		name           string
		request        LLMRequest
		onReadFile     func(path string) (string, error)
		onListFiles    func(dir string) ([]string, error)
		onSearchFiles  func(pattern string) ([]string, error)
		expectedType   string
		expectedError  bool
		expectedResult any
	}{
		{
			name: "Comment action",
			request: LLMRequest{
				Action: ActionComment,
				Params: map[string]any{
					"path":    "test.go",
					"line":    10.0,
					"content": "test comment",
				},
			},
			expectedType: "comment",
			expectedResult: ReviewComment{
				Path:    "test.go",
				Line:    10,
				Content: "test comment",
			},
		},
		{
			name: "Read file action",
			request: LLMRequest{
				Action: ActionReadFile,
				Params: map[string]any{
					"path": "test.go",
				},
			},
			onReadFile: func(path string) (string, error) {
				return "test content", nil
			},
			expectedType:   "file_content",
			expectedResult: "test content",
		},
		{
			name: "List files action",
			request: LLMRequest{
				Action: ActionListFiles,
				Params: map[string]any{
					"dir": "test",
				},
			},
			onListFiles: func(dir string) ([]string, error) {
				return []string{"test.go"}, nil
			},
			expectedType:   "file_list",
			expectedResult: []string{"test.go"},
		},
		{
			name: "Search files action",
			request: LLMRequest{
				Action: ActionSearchFiles,
				Params: map[string]any{
					"pattern": "*.go",
				},
			},
			onSearchFiles: func(pattern string) ([]string, error) {
				return []string{"test.go"}, nil
			},
			expectedType:   "file_list",
			expectedResult: []string{"test.go"},
		},
		{
			name: "Unknown action",
			request: LLMRequest{
				Action: "unknown",
			},
			expectedType:  "error",
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client.SetCallbacks(tt.onReadFile, tt.onListFiles, tt.onSearchFiles)
			response, err := client.handleRequest(tt.request)

			if tt.expectedError {
				assert.Equal(t, "unknown action", response.Error)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedType, response.Type)
				assert.Equal(t, tt.expectedResult, response.Content)
			}
		})
	}
}
