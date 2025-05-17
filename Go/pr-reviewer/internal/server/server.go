package server

import (
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/amoilanen/pr-reviewer/internal/config"
	"github.com/amoilanen/pr-reviewer/internal/github"
	"github.com/amoilanen/pr-reviewer/internal/llm"
)

// Server represents the PR reviewer server
type Server struct {
	config *config.Config
	logger *zap.Logger
	gh     *github.Client
	llm    *llm.Client
}

// NewServer creates a new server instance
func NewServer(cfg *config.Config) (*Server, error) {
	logger, err := zap.NewProduction()
	if err != nil {
		return nil, fmt.Errorf("failed to create logger: %w", err)
	}

	gh := github.NewClient(cfg.GitHub.AppID)
	llmClient := llm.NewClient(llm.Provider(cfg.LLM.Provider), cfg.LLM.APIKey, cfg.LLM.Model)

	llmClient.SetCallbacks(
		func(path string) (string, error) {
			repo := cfg.Repositories[0]
			return gh.GetFileContent(repo.Owner, repo.Name, path, repo.Branch)
		},
		func(dir string) ([]string, error) {
			repo := cfg.Repositories[0]
			return gh.ListDirectoryContents(repo.Owner, repo.Name, dir, repo.Branch)
		},
		func(pattern string, path string) ([]string, error) {
			repo := cfg.Repositories[0]
			return gh.SearchFiles(repo.Owner, repo.Name, pattern, path, repo.Branch)
		},
		func(owner, repo string, prNumber int, threadID int64) error {
			return gh.ResolveThread(owner, repo, prNumber, threadID)
		},
		func(owner, repo string, prNumber int, threadID int64, body string) error {
			return gh.ReplyToThread(owner, repo, prNumber, threadID, body)
		},
		func(owner, repo string, prNumber int, path string, line int, content string) error {
			return gh.CreateReviewComment(owner, repo, prNumber, content, path, line)
		},
	)

	return &Server{
		config: cfg,
		logger: logger,
		gh:     gh,
		llm:    llmClient,
	}, nil
}

// Start starts the server
func (s *Server) Start() error {
	r := gin.Default()

	// Webhook endpoint
	r.POST("/webhook", s.handleWebhook)

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	addr := fmt.Sprintf("%s:%d", s.config.Server.Host, s.config.Server.Port)
	return r.Run(addr)
}

// handleWebhook handles GitHub webhook events
func (s *Server) handleWebhook(c *gin.Context) {
	// Verify webhook signature
	signature := c.GetHeader("X-Hub-Signature-256")
	if !verifyWebhookSignature(signature, c.Request.Body, s.config.GitHub.WebhookSecret) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
		return
	}

	// Parse webhook event
	eventType := c.GetHeader("X-GitHub-Event")
	if eventType != "pull_request" {
		c.JSON(http.StatusOK, gin.H{"message": "ignored event type"})
		return
	}

	var payload struct {
		Action      string `json:"action"`
		PullRequest struct {
			Number int `json:"number"`
		} `json:"pull_request"`
		Repository struct {
			Owner struct {
				Login string `json:"login"`
			} `json:"owner"`
			Name string `json:"name"`
		} `json:"repository"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		s.logger.Error("failed to parse webhook payload", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Only process opened and synchronize events
	if payload.Action != "opened" && payload.Action != "synchronize" {
		c.JSON(http.StatusOK, gin.H{"message": "ignored action"})
		return
	}

	// Process the PR in a goroutine
	go s.processPullRequest(c.Request.Context(), payload.Repository.Owner.Login, payload.Repository.Name, payload.PullRequest.Number)

	c.JSON(http.StatusOK, gin.H{"message": "processing PR"})
}

// processPullRequest processes a pull request
func (s *Server) processPullRequest(ctx context.Context, owner, repo string, prNumber int) {
	// Get PR diffs
	diff, err := s.gh.GetPullRequestDiffs(owner, repo, prNumber)
	if err != nil {
		s.logger.Error("failed to get PR diffs",
			zap.String("owner", owner),
			zap.String("repo", repo),
			zap.Int("pr", prNumber),
			zap.Error(err))
		return
	}

	// Get existing comments
	existingComments, err := s.gh.GetPullRequestComments(owner, repo, prNumber)
	if err != nil {
		s.logger.Error("failed to get PR comments",
			zap.String("owner", owner),
			zap.String("repo", repo),
			zap.Int("pr", prNumber),
			zap.Error(err))
		return
	}

	// Get additional context files
	additionalContext := make(map[string]string)
	for _, file := range getContextFiles() {
		content, err := s.gh.GetFileContent(owner, repo, file, "main")
		if err != nil {
			s.logger.Warn("failed to read context file",
				zap.String("file", file),
				zap.Error(err))
			continue
		}
		additionalContext[file] = content
	}

	// Get LLM review
	_, err = s.llm.ReviewCode(ctx, diff, additionalContext, existingComments, owner, repo, prNumber)
	if err != nil {
		s.logger.Error("failed to get LLM review",
			zap.String("owner", owner),
			zap.String("repo", repo),
			zap.Int("pr", prNumber),
			zap.Error(err))
		return
	}
}

// verifyWebhookSignature verifies the GitHub webhook signature
func verifyWebhookSignature(signature string, body io.ReadCloser, secret string) bool {
	// Implementation would go here
	// For now, return true for testing
	return true
}

// getContextFiles returns a list of files to provide as context
func getContextFiles() []string {
	// Return a list of important files to fetch from GitHub
	return []string{
		"README.md",
		"go.mod",
		"go.sum",
	}
}
