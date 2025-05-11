package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// Provider represents an LLM provider
type Provider string

const (
	ProviderOpenAI     Provider = "openai"
	ProviderAnthropic  Provider = "anthropic"
	ProviderGemini     Provider = "gemini"
	ProviderOpenRouter Provider = "openrouter"
)

// Action represents an action that the LLM can request
type Action string

const (
	ActionComment     Action = "comment"      // Add a review comment
	ActionReadFile    Action = "read_file"    // Request to read a specific file
	ActionListFiles   Action = "list_files"   // Request to list files in a directory
	ActionSearchFiles Action = "search_files" // Search for files matching a pattern
)

// LLMRequest represents a request from the LLM
type LLMRequest struct {
	Action Action         `json:"action"`
	Params map[string]any `json:"params"`
}

// LLMResponse represents a response to the LLM
type LLMResponse struct {
	Type    string `json:"type"`
	Content any    `json:"content"`
	Error   string `json:"error,omitempty"`
}

// Client represents an LLM client
type Client struct {
	provider Provider
	apiKey   string
	model    string
	client   *http.Client
	BaseURL  string // Optional: override for testing
	// Callback functions for handling LLM requests
	onReadFile    func(path string) (string, error)
	onListFiles   func(dir string) ([]string, error)
	onSearchFiles func(pattern string) ([]string, error)
}

// ReviewComment represents a comment from the LLM
type ReviewComment struct {
	Path    string `json:"path"`
	Line    int    `json:"line"`
	Content string `json:"content"`
}

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest represents a chat completion request
type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

// GeminiRequest represents a Gemini API request
type GeminiRequest struct {
	Contents []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"contents"`
}

// NewClient creates a new LLM client
func NewClient(provider Provider, apiKey, model string) *Client {
	return &Client{
		provider: provider,
		apiKey:   apiKey,
		model:    model,
		client:   &http.Client{},
	}
}

// SetCallbacks sets the callback functions for handling LLM requests
func (c *Client) SetCallbacks(
	onReadFile func(path string) (string, error),
	onListFiles func(dir string) ([]string, error),
	onSearchFiles func(pattern string) ([]string, error),
) {
	c.onReadFile = onReadFile
	c.onListFiles = onListFiles
	c.onSearchFiles = onSearchFiles
}

// ReviewCode reviews code changes and returns comments
func (c *Client) ReviewCode(ctx context.Context, diff string, additionalContext map[string]string) ([]ReviewComment, error) {
	// Start a conversation with the LLM
	messages := []Message{
		{
			Role: "system",
			Content: `You are a code reviewer. You can:
1. Review code changes and provide comments
2. Request to read specific files for more context
3. List files in a directory
4. Search for files matching a pattern

To request an action, respond with a JSON object in this format:
{
    "action": "action_name",
    "params": {
        // action-specific parameters
    }
}

Available actions:
- comment: Add a review comment
  params: { "path": "file path", "line": line number, "content": "comment text" }
- read_file: Read a specific file
  params: { "path": "file path" }
- list_files: List files in a directory
  params: { "dir": "directory path" }
- search_files: Search for files
  params: { "pattern": "search pattern" }

To provide a review comment, use the comment action.
To request more context, use read_file, list_files, or search_files actions.`,
		},
		{
			Role:    "user",
			Content: buildPrompt(diff, additionalContext),
		},
	}

	// Start the conversation loop
	var comments []ReviewComment
	for {
		// Get response from LLM
		response, err := c.getLLMResponse(ctx, messages)
		if err != nil {
			return nil, fmt.Errorf("failed to get LLM response: %w", err)
		}

		// Parse the response as a request
		var request LLMRequest
		if err := json.Unmarshal([]byte(response), &request); err != nil {
			return nil, fmt.Errorf("failed to parse LLM request: %w", err)
		}

		// Handle the request
		llmResponse, err := c.handleRequest(request)
		if err != nil {
			return nil, fmt.Errorf("failed to handle LLM request: %w", err)
		}

		// If the response is a comment, add it to the list
		if request.Action == ActionComment {
			comment, ok := llmResponse.Content.(ReviewComment)
			if !ok {
				return nil, fmt.Errorf("invalid comment format")
			}
			comments = append(comments, comment)
		}

		// Add the response to the conversation
		messages = append(messages, Message{
			Role:    "assistant",
			Content: response,
		})
		messages = append(messages, Message{
			Role:    "user",
			Content: fmt.Sprintf("Response: %s", llmResponse),
		})

		// If the LLM didn't request any action, we're done
		if request.Action == "" {
			break
		}
	}

	return comments, nil
}

// handleRequest handles an LLM request
func (c *Client) handleRequest(request LLMRequest) (LLMResponse, error) {
	switch request.Action {
	case ActionComment:
		path, _ := request.Params["path"].(string)
		line, _ := request.Params["line"].(float64)
		content, _ := request.Params["content"].(string)
		return LLMResponse{
			Type: "comment",
			Content: ReviewComment{
				Path:    path,
				Line:    int(line),
				Content: content,
			},
		}, nil

	case ActionReadFile:
		if c.onReadFile == nil {
			return LLMResponse{Type: "error", Error: "read_file callback not set"}, nil
		}
		path, _ := request.Params["path"].(string)
		content, err := c.onReadFile(path)
		if err != nil {
			return LLMResponse{Type: "error", Error: err.Error()}, nil
		}
		return LLMResponse{Type: "file_content", Content: content}, nil

	case ActionListFiles:
		if c.onListFiles == nil {
			return LLMResponse{Type: "error", Error: "list_files callback not set"}, nil
		}
		dir, _ := request.Params["dir"].(string)
		files, err := c.onListFiles(dir)
		if err != nil {
			return LLMResponse{Type: "error", Error: err.Error()}, nil
		}
		return LLMResponse{Type: "file_list", Content: files}, nil

	case ActionSearchFiles:
		if c.onSearchFiles == nil {
			return LLMResponse{Type: "error", Error: "search_files callback not set"}, nil
		}
		pattern, _ := request.Params["pattern"].(string)
		files, err := c.onSearchFiles(pattern)
		if err != nil {
			return LLMResponse{Type: "error", Error: err.Error()}, nil
		}
		return LLMResponse{Type: "file_list", Content: files}, nil

	default:
		return LLMResponse{Type: "error", Error: "unknown action"}, nil
	}
}

// getLLMResponse gets a response from the LLM
func (c *Client) getLLMResponse(ctx context.Context, messages []Message) (string, error) {
	switch c.provider {
	case ProviderOpenAI:
		return c.getOpenAIResponse(ctx, messages)
	case ProviderAnthropic:
		return c.getAnthropicResponse(ctx, messages)
	case ProviderGemini:
		return c.getGeminiResponse(ctx, messages)
	case ProviderOpenRouter:
		return c.getOpenRouterResponse(ctx, messages)
	default:
		return "", fmt.Errorf("unsupported provider: %s", c.provider)
	}
}

// getOpenAIResponse gets a response from OpenAI
func (c *Client) getOpenAIResponse(ctx context.Context, messages []Message) (string, error) {
	url := c.BaseURL
	if url == "" {
		url = "https://api.openai.com/v1/chat/completions"
	}
	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	body := ChatRequest{
		Model:    c.model,
		Messages: messages,
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %w", err)
	}

	req.Body = io.NopCloser(bytes.NewBuffer(jsonBody))
	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no response from OpenAI")
	}

	return result.Choices[0].Message.Content, nil
}

// getAnthropicResponse gets a response from Anthropic
func (c *Client) getAnthropicResponse(ctx context.Context, messages []Message) (string, error) {
	url := c.BaseURL
	if url == "" {
		url = "https://api.anthropic.com/v1/messages"
	}
	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("anthropic-version", "2023-06-01")

	// Convert messages to Anthropic format
	var anthropicMessages []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	for _, msg := range messages {
		anthropicMessages = append(anthropicMessages, struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		}{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	body := struct {
		Model    string      `json:"model"`
		Messages interface{} `json:"messages"`
	}{
		Model:    c.model,
		Messages: anthropicMessages,
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %w", err)
	}

	req.Body = io.NopCloser(bytes.NewBuffer(jsonBody))
	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Content) == 0 {
		return "", fmt.Errorf("no response from Anthropic")
	}

	return result.Content[0].Text, nil
}

// getGeminiResponse gets a response from Gemini
func (c *Client) getGeminiResponse(ctx context.Context, messages []Message) (string, error) {
	url := c.BaseURL
	if url == "" {
		url = "https://generativelanguage.googleapis.com/v1beta/models/" + c.model + ":generateContent"
	}
	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("x-goog-api-key", c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	// Convert messages to Gemini format
	var parts []struct {
		Text string `json:"text"`
	}
	for _, msg := range messages {
		parts = append(parts, struct {
			Text string `json:"text"`
		}{
			Text: fmt.Sprintf("%s: %s", msg.Role, msg.Content),
		})
	}

	body := GeminiRequest{
		Contents: []struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		}{
			{
				Parts: parts,
			},
		},
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %w", err)
	}

	req.Body = io.NopCloser(bytes.NewBuffer(jsonBody))
	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response from Gemini")
	}

	return result.Candidates[0].Content.Parts[0].Text, nil
}

// getOpenRouterResponse gets a response from OpenRouter
func (c *Client) getOpenRouterResponse(ctx context.Context, messages []Message) (string, error) {
	url := c.BaseURL
	if url == "" {
		url = "https://openrouter.ai/api/v1/chat/completions"
	}
	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", "https://github.com/amoilanen/pr-reviewer")
	req.Header.Set("X-Title", "PR Reviewer")

	body := ChatRequest{
		Model:    c.model,
		Messages: messages,
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %w", err)
	}

	req.Body = io.NopCloser(bytes.NewBuffer(jsonBody))
	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no response from OpenRouter")
	}

	return result.Choices[0].Message.Content, nil
}

// buildPrompt builds the prompt for the LLM
func buildPrompt(diff string, additionalContext map[string]string) string {
	var sb strings.Builder
	sb.WriteString("Please review the following code changes:\n\n")
	sb.WriteString(diff)
	sb.WriteString("\n\nAdditional context:\n")
	for path, content := range additionalContext {
		sb.WriteString(fmt.Sprintf("\nFile: %s\n%s\n", path, content))
	}
	return sb.String()
}
