package llm

import (
	"context"
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/amoilanen/pr-reviewer/internal/types"
	"github.com/stretchr/testify/assert"
)

func TestNewClient(t *testing.T) {
	client := NewClient(ProviderGemini, "test-key", "gemini-pro")
	assert.NotNil(t, client)
	assert.Equal(t, ProviderGemini, client.provider)
	assert.Equal(t, "test-key", client.apiKey)
	assert.Equal(t, "gemini-pro", client.model)
	assert.NotNil(t, client.client)
}

func TestReviewCode(t *testing.T) {
	tests := []struct {
		name             string
		provider         Provider
		diff             string
		context          map[string]string
		existingComments []types.PRComment
		owner            string
		repo             string
		prNumber         int
		expectedError    bool
		expectedResult   []ReviewComment
	}{
		{
			name:     "Gemini review",
			provider: ProviderGemini,
			diff:     "test diff",
			context: map[string]string{
				"test.go": "test content",
			},
			existingComments: []types.PRComment{},
			owner:            "test-owner",
			repo:             "test-repo",
			prNumber:         1,
			expectedError:    false,
			expectedResult:   []ReviewComment{},
		},
		{
			name:     "OpenRouter review",
			provider: ProviderOpenRouter,
			diff:     "test diff",
			context: map[string]string{
				"test.go": "test content",
			},
			existingComments: []types.PRComment{},
			owner:            "test-owner",
			repo:             "test-repo",
			prNumber:         1,
			expectedError:    false,
			expectedResult:   []ReviewComment{},
		},
		{
			name:             "Invalid provider",
			provider:         "invalid",
			diff:             "test diff",
			context:          map[string]string{},
			existingComments: []types.PRComment{},
			owner:            "test-owner",
			repo:             "test-repo",
			prNumber:         1,
			expectedError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			requestCount := 0
			// Create a test server
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// Send mock response based on provider
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)

				requestCount++
				switch tt.provider {
				case ProviderOpenRouter:
					if requestCount == 1 {
						w.Write([]byte(`{
							"choices": [{
								"message": {
									"content": "{\"action\":\"comment\",\"params\":{\"path\":\"test.go\",\"line\":10,\"content\":\"Consider adding error handling here\"}}"
								}
							}]
						}`))
					} else {
						w.Write([]byte(`{
							"choices": [{
								"message": {
									"content": "{\"action\":\"finish_review\",\"params\":{}}"
								}
							}]
						}`))
					}
				case ProviderGemini:
					if requestCount == 1 {
						w.Write([]byte(`{
							"candidates": [{
								"content": {
									"parts": [{
										"text": "{\"action\":\"comment\",\"params\":{\"path\":\"test.go\",\"line\":10,\"content\":\"Consider adding error handling here\"}}"
									}]
								}
							}]
						}`))
					} else {
						w.Write([]byte(`{
							"candidates": [{
								"content": {
									"parts": [{
										"text": "{\"action\":\"finish_review\",\"params\":{}}"
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
				func(pattern string, path string) ([]string, error) { return []string{"test.go"}, nil },
				func(owner string, repo string, prNumber int, threadID int64) error { return nil },
				func(owner string, repo string, prNumber int, threadID int64, body string) error { return nil },
				func(owner string, repo string, prNumber int, path string, line int, content string) error { return nil },
			)

			comments, err := client.ReviewCode(context.Background(), tt.diff, tt.context, tt.existingComments, tt.owner, tt.repo, tt.prNumber)

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
	existingComments := []types.PRComment{
		{
			ThreadID: 1,
			Path:     "test.go",
			Line:     10,
			Body:     "Test comment",
		},
	}

	prompt := buildPrompt(diff, context, existingComments)

	// Check that all expected substrings are present
	expectedSubstrings := []string{
		"Please review the following code changes:",
		"test diff",
		"Additional context:",
		"File: test.go\ntest content",
		"File: main.go\nmain content",
		"Existing comments:",
		"Thread ID: 1",
		"File: test.go",
		"Line: 10",
		"Comment: Test comment",
	}
	for _, substr := range expectedSubstrings {
		assert.Contains(t, prompt, substr)
	}
}

func TestHandleAction(t *testing.T) {
	client := NewClient(ProviderGemini, "test-key", "gemini-pro")

	tests := []struct {
		name            string
		request         ActionRequestedByLLM
		onReadFile      func(path string) (string, error)
		onListFiles     func(dir string) ([]string, error)
		onSearchFiles   func(pattern string, path string) ([]string, error)
		onResolveThread func(owner, repo string, prNumber int, threadID int64) error
		onReplyToThread func(owner, repo string, prNumber int, threadID int64, body string) error
		onComment       func(owner, repo string, prNumber int, path string, line int, content string) error
		expectedType    string
		expectedError   bool
		expectedResult  any
	}{
		{
			name: "Comment action",
			request: ActionRequestedByLLM{
				Action: ActionComment,
				Params: map[string]any{
					"path":    "test.go",
					"line":    10.0,
					"content": "test comment",
				},
			},
			onComment: func(owner, repo string, prNumber int, path string, line int, content string) error {
				return nil
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
			request: ActionRequestedByLLM{
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
			request: ActionRequestedByLLM{
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
			request: ActionRequestedByLLM{
				Action: ActionSearchFiles,
				Params: map[string]any{
					"pattern": "*.go",
					"path":    ".",
				},
			},
			onSearchFiles: func(pattern string, path string) ([]string, error) {
				return []string{"test.go"}, nil
			},
			expectedType:   "file_list",
			expectedResult: []string{"test.go"},
		},
		{
			name: "Resolve thread action",
			request: ActionRequestedByLLM{
				Action: ResolveThread,
				Params: map[string]any{
					"thread_id": 1.0,
				},
			},
			onResolveThread: func(owner, repo string, prNumber int, threadID int64) error {
				return nil
			},
			expectedType:   "thread_resolved",
			expectedResult: nil,
		},
		{
			name: "Reply in thread action",
			request: ActionRequestedByLLM{
				Action: ReplyInThread,
				Params: map[string]any{
					"thread_id": 1.0,
					"content":   "test reply",
				},
			},
			onReplyToThread: func(owner, repo string, prNumber int, threadID int64, body string) error {
				return nil
			},
			expectedType:   "thread_reply",
			expectedResult: nil,
		},
		{
			name: "Unknown action",
			request: ActionRequestedByLLM{
				Action: "unknown",
			},
			expectedType:  "error",
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client.SetCallbacks(
				tt.onReadFile,
				tt.onListFiles,
				tt.onSearchFiles,
				tt.onResolveThread,
				tt.onReplyToThread,
				tt.onComment,
			)
			response, err := client.handleAction(tt.request, "test-owner", "test-repo", 1)

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
