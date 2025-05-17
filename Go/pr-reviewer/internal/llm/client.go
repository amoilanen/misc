package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/amoilanen/pr-reviewer/internal/types"
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
	ResolveThread     Action = "resolve_thread"
	ReplyInThread     Action = "reply_in_thread"
)

type ActionRequestedByLLM struct {
	Action Action         `json:"action"`
	Params map[string]any `json:"params"`
}

type ResponseToLLM struct {
	Type    string `json:"type"`
	Content any    `json:"content"`
	Error   string `json:"error,omitempty"`
}

type Client struct {
	provider        Provider
	apiKey          string
	model           string
	client          *http.Client
	BaseURL         string
	onReadFile      func(path string) (string, error)
	onListFiles     func(dir string) ([]string, error)
	onSearchFiles   func(pattern string, path string) ([]string, error)
	onResolveThread func(owner, repo string, prNumber int, threadID int64) error
	onReplyToThread func(owner, repo string, prNumber int, threadID int64, body string) error
	onComment       func(owner, repo string, prNumber int, path string, line int, content string) error
}

type ReviewComment struct {
	Path    string `json:"path"`
	Line    int    `json:"line"`
	Content string `json:"content"`
}

type Message struct {
	Role    string `json:"from"`
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
	onResolveThread func(owner, repo string, prNumber int, threadID int64) error,
	onReplyToThread func(owner, repo string, prNumber int, threadID int64, body string) error,
	onComment func(owner, repo string, prNumber int, path string, line int, content string) error,
) {
	c.onReadFile = onReadFile
	c.onListFiles = onListFiles
	c.onSearchFiles = onSearchFiles
	c.onResolveThread = onResolveThread
	c.onReplyToThread = onReplyToThread
	c.onComment = onComment
}

func (c *Client) ReviewCode(ctx context.Context, diff string, additionalContext map[string]string, existingComments []types.PRComment, owner, repo string, prNumber int) ([]ReviewComment, error) {
	messages := []Message{
		{
			Role: "system",
			Content: `You are a code reviewer. You can:
1. Review code changes and provide comments
2. Request to read specific files for more context
3. List files in a directory
4. Search for files matching a pattern
5. Finish review
6. Resolve existing comment threads
7. Reply to existing comment threads

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
  params: { "pattern": "search pattern", "path": "path to recursively search from" }
- finish_review: Finish review of the PR, no more comments to add
- resolve_thread: Resolve an existing comment thread
  params: { "thread_id": "comment thread ID" }
- reply_in_thread: Reply to an existing comment thread
  params: { "thread_id": "comment thread ID", "content": "reply text" }

To provide a review comment, use the comment action.
To request more context, use read_file, list_files, or search_files actions.
To finish the review use the finish_review action.
To resolve or reply to existing comment threads, use resolve_thread or reply_in_thread actions.`,
		},
		{
			Role:    "user",
			Content: buildPrompt(diff, additionalContext, existingComments),
		},
	}

	comments := []ReviewComment{}

	for {
		llmActionRaw, err := c.getLLMResponse(ctx, messages)
		if err != nil {
			return nil, fmt.Errorf("failed to get LLM response: %w", err)
		}

		var llmAction ActionRequestedByLLM
		if err := json.Unmarshal([]byte(llmActionRaw), &llmAction); err != nil {
			return nil, fmt.Errorf("failed to parse LLM request: %w", err)
		}

		llmResponse, err := c.handleAction(llmAction, owner, repo, prNumber)
		if err != nil {
			return nil, fmt.Errorf("failed to handle LLM request: %w", err)
		}

		messages = append(messages, Message{
			Role:    "assistant",
			Content: llmActionRaw,
		})
		messages = append(messages, Message{
			Role:    "user",
			Content: fmt.Sprintf("Output of previous LLM action: %s", llmResponse),
		})

		if llmAction.Action == FinishReview {
			break
		}
	}

	return comments, nil
}

func (c *Client) handleAction(action ActionRequestedByLLM, owner, repo string, prNumber int) (ResponseToLLM, error) {
	switch action.Action {
	case ActionComment:
		if c.onComment == nil {
			return ResponseToLLM{Type: "error", Error: "comment callback not set"}, nil
		}
		path, _ := action.Params["path"].(string)
		line, _ := action.Params["line"].(float64)
		content, _ := action.Params["content"].(string)
		err := c.onComment(owner, repo, prNumber, path, int(line), content)
		if err != nil {
			return ResponseToLLM{Type: "error", Error: err.Error()}, nil
		}
		return ResponseToLLM{
			Type: "comment",
			Content: ReviewComment{
				Path:    path,
				Line:    int(line),
				Content: content,
			},
		}, nil

	case ActionReadFile:
		if c.onReadFile == nil {
			return ResponseToLLM{Type: "error", Error: "read_file callback not set"}, nil
		}
		path, _ := action.Params["path"].(string)
		content, err := c.onReadFile(path)
		if err != nil {
			return ResponseToLLM{Type: "error", Error: err.Error()}, nil
		}
		return ResponseToLLM{Type: "file_content", Content: content}, nil

	case ActionListFiles:
		if c.onListFiles == nil {
			return ResponseToLLM{Type: "error", Error: "list_files callback not set"}, nil
		}
		dir, _ := action.Params["dir"].(string)
		files, err := c.onListFiles(dir)
		if err != nil {
			return ResponseToLLM{Type: "error", Error: err.Error()}, nil
		}
		return ResponseToLLM{Type: "file_list", Content: files}, nil

	case ActionSearchFiles:
		if c.onSearchFiles == nil {
			return ResponseToLLM{Type: "error", Error: "search_files callback not set"}, nil
		}
		pattern, _ := action.Params["pattern"].(string)
		path, _ := action.Params["path"].(string)
		files, err := c.onSearchFiles(pattern, path)
		if err != nil {
			return ResponseToLLM{Type: "error", Error: err.Error()}, nil
		}
		return ResponseToLLM{Type: "file_list", Content: files}, nil

	case ResolveThread:
		if c.onResolveThread == nil {
			return ResponseToLLM{Type: "error", Error: "resolve_thread callback not set"}, nil
		}
		threadID, _ := action.Params["thread_id"].(float64)
		err := c.onResolveThread(owner, repo, prNumber, int64(threadID))
		if err != nil {
			return ResponseToLLM{Type: "error", Error: err.Error()}, nil
		}
		return ResponseToLLM{Type: "thread_resolved", Content: nil}, nil

	case ReplyInThread:
		if c.onReplyToThread == nil {
			return ResponseToLLM{Type: "error", Error: "reply_in_thread callback not set"}, nil
		}
		threadID, _ := action.Params["thread_id"].(float64)
		content, _ := action.Params["content"].(string)
		err := c.onReplyToThread(owner, repo, prNumber, int64(threadID), content)
		if err != nil {
			return ResponseToLLM{Type: "error", Error: err.Error()}, nil
		}
		return ResponseToLLM{Type: "thread_reply", Content: nil}, nil

	default:
		return ResponseToLLM{Type: "error", Error: "unknown action"}, nil
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

func buildPrompt(diff string, additionalContext map[string]string, existingComments []types.PRComment) string {
	var sb strings.Builder
	sb.WriteString("Please review the following code changes:\n\n")
	sb.WriteString(diff)
	sb.WriteString("\n\nAdditional context:\n")
	for path, content := range additionalContext {
		sb.WriteString(fmt.Sprintf("\nFile: %s\n%s\n", path, content))
	}

	if len(existingComments) > 0 {
		sb.WriteString("\nExisting comments:\n")
		for _, comment := range existingComments {
			sb.WriteString(fmt.Sprintf("\nThread ID: %d\nFile: %s\nLine: %d\nComment: %s\n",
				comment.ThreadID, comment.Path, comment.Line, comment.Body))
		}
	}

	return sb.String()
}
