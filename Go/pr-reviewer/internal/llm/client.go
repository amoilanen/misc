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

type Provider string

const (
	ProviderGemini     Provider = "gemini"
	ProviderOpenRouter Provider = "openrouter"
)

type Action string

const (
	ActionComment     Action = "comment"
	ActionReadFile    Action = "read_file"
	ActionListFiles   Action = "list_files"
	ActionSearchFiles Action = "search_files"
	FinishReview      Action = "finish_review"
)

type LLMAction struct {
	Action Action         `json:"action"`
	Params map[string]any `json:"params"`
}

type LLMResponse struct {
	Type    string `json:"type"`
	Content any    `json:"content"`
	Error   string `json:"error,omitempty"`
}

type Client struct {
	provider      Provider
	apiKey        string
	model         string
	client        *http.Client
	BaseURL       string
	onReadFile    func(path string) (string, error)
	onListFiles   func(dir string) ([]string, error)
	onSearchFiles func(pattern string, path string) ([]string, error)
}

type ReviewComment struct {
	Path    string `json:"path"`
	Line    int    `json:"line"`
	Content string `json:"content"`
}

type Message struct {
	From    string `json:"from"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type GeminiRequest struct {
	Contents []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"contents"`
}

func NewClient(provider Provider, apiKey, model string) *Client {
	return &Client{
		provider: provider,
		apiKey:   apiKey,
		model:    model,
		client:   &http.Client{},
	}
}

func (c *Client) SetCallbacks(
	onReadFile func(path string) (string, error),
	onListFiles func(dir string) ([]string, error),
	onSearchFiles func(pattern string, path string) ([]string, error),
) {
	c.onReadFile = onReadFile
	c.onListFiles = onListFiles
	c.onSearchFiles = onSearchFiles
}

func (c *Client) ReviewCode(ctx context.Context, diff string, additionalContext map[string]string) ([]ReviewComment, error) {
	messages := []Message{
		{
			From: "pr-reviewer-agent",
			Content: `You are a code reviewer. You can:
1. Review code changes and provide comments
2. Request to read specific files for more context
3. List files in a directory
4. Search for files matching a pattern
5. Finish review

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
  params: { "pattern": "search pattern", "path": "path to search from" }
- finish_review: Finish review of the PR, no more comments to add

To provide a review comment, use the comment action.
To request more context, use read_file, list_files, or search_files actions.
To finish the review use the finish_review action`,
		},
		{
			From:    "pr-reviewer-agent",
			Content: buildPrompt(diff, additionalContext),
		},
	}

	var comments []ReviewComment
	for {
		llmActionRaw, err := c.getLLMResponse(ctx, messages)
		if err != nil {
			return nil, fmt.Errorf("failed to get LLM response: %w", err)
		}

		var llmAction LLMAction
		if err := json.Unmarshal([]byte(llmActionRaw), &llmAction); err != nil {
			return nil, fmt.Errorf("failed to parse LLM request: %w", err)
		}

		llmResponse, err := c.handleAction(llmAction)
		if err != nil {
			return nil, fmt.Errorf("failed to handle LLM request: %w", err)
		}

		if llmAction.Action == ActionComment {
			comment, ok := llmResponse.Content.(ReviewComment)
			if !ok {
				return nil, fmt.Errorf("invalid comment format")
			}
			comments = append(comments, comment)
		}

		messages = append(messages, Message{
			From:    "LLM",
			Content: llmActionRaw,
		})
		messages = append(messages, Message{
			From:    "pr-reviewer-agent",
			Content: fmt.Sprintf("Output of previous LLM action: %s", llmResponse),
		})

		if llmAction.Action == FinishReview {
			break
		}
	}

	return comments, nil
}

func (c *Client) handleAction(action LLMAction) (LLMResponse, error) {
	switch action.Action {
	case ActionComment:
		path, _ := action.Params["path"].(string)
		line, _ := action.Params["line"].(float64)
		content, _ := action.Params["content"].(string)
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
		path, _ := action.Params["path"].(string)
		content, err := c.onReadFile(path)
		if err != nil {
			return LLMResponse{Type: "error", Error: err.Error()}, nil
		}
		return LLMResponse{Type: "file_content", Content: content}, nil

	case ActionListFiles:
		if c.onListFiles == nil {
			return LLMResponse{Type: "error", Error: "list_files callback not set"}, nil
		}
		dir, _ := action.Params["dir"].(string)
		files, err := c.onListFiles(dir)
		if err != nil {
			return LLMResponse{Type: "error", Error: err.Error()}, nil
		}
		return LLMResponse{Type: "file_list", Content: files}, nil

	case ActionSearchFiles:
		if c.onSearchFiles == nil {
			return LLMResponse{Type: "error", Error: "search_files callback not set"}, nil
		}
		pattern, _ := action.Params["pattern"].(string)
		path, _ := action.Params["path"].(string)
		files, err := c.onSearchFiles(pattern, path)
		if err != nil {
			return LLMResponse{Type: "error", Error: err.Error()}, nil
		}
		return LLMResponse{Type: "file_list", Content: files}, nil

	default:
		return LLMResponse{Type: "error", Error: "unknown action"}, nil
	}
}

func (c *Client) getLLMResponse(ctx context.Context, messages []Message) (string, error) {
	switch c.provider {
	case ProviderGemini:
		return c.getGeminiResponse(ctx, messages)
	case ProviderOpenRouter:
		return c.getOpenRouterResponse(ctx, messages)
	default:
		return "", fmt.Errorf("unsupported provider: %s", c.provider)
	}
}

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

	var parts []struct {
		Text string `json:"text"`
	}
	for _, msg := range messages {
		parts = append(parts, struct {
			Text string `json:"text"`
		}{
			Text: fmt.Sprintf("%s: %s", msg.From, msg.Content),
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
