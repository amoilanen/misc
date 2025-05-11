package github

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"

	"github.com/google/go-github/v57/github"
	"golang.org/x/oauth2"
)

// Client wraps the GitHub client with additional functionality
type Client struct {
	client *github.Client
	ctx    context.Context
}

// NewClient creates a new GitHub client
func NewClient(token string) *Client {
	ctx := context.Background()
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)
	return &Client{
		client: client,
		ctx:    ctx,
	}
}

// GetPullRequestDiffs fetches the diffs for a pull request
func (c *Client) GetPullRequestDiffs(owner, repo string, prNumber int) (string, error) {
	pr, _, err := c.client.PullRequests.Get(c.ctx, owner, repo, prNumber)
	if err != nil {
		return "", fmt.Errorf("failed to get PR: %w", err)
	}

	// Get the diff URL
	diffURL := fmt.Sprintf("https://github.com/%s/%s/pull/%d.diff", owner, repo, prNumber)
	resp, err := c.client.Client().Get(diffURL)
	if err != nil {
		return "", fmt.Errorf("failed to get diff: %w", err)
	}
	defer resp.Body.Close()

	diff, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read diff: %w", err)
	}

	return string(diff), nil
}

// CloneRepository clones a repository to a temporary directory
func (c *Client) CloneRepository(owner, repo, branch string) (string, error) {
	// Create a temporary directory
	tmpDir, err := os.MkdirTemp("", "pr-reviewer-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}

	// Clone the repository
	cloneURL := fmt.Sprintf("https://github.com/%s/%s.git", owner, repo)
	cmd := exec.Command("git", "clone", "-b", branch, cloneURL, tmpDir)
	if err := cmd.Run(); err != nil {
		os.RemoveAll(tmpDir)
		return "", fmt.Errorf("failed to clone repository: %w", err)
	}

	return tmpDir, nil
}

// CreateReviewComment creates a review comment on a pull request
func (c *Client) CreateReviewComment(owner, repo string, prNumber int, body string, path string, line int) error {
	comment := &github.PullRequestComment{
		Body:     &body,
		Path:     &path,
		Position: &line,
	}

	_, _, err := c.client.PullRequests.CreateComment(c.ctx, owner, repo, prNumber, comment)
	if err != nil {
		return fmt.Errorf("failed to create review comment: %w", err)
	}

	return nil
}

// GetFileContent retrieves the content of a file from the repository
func (c *Client) GetFileContent(owner, repo, path, ref string) (string, error) {
	content, _, _, err := c.client.Repositories.GetContents(c.ctx, owner, repo, path, &github.RepositoryContentGetOptions{Ref: ref})
	if err != nil {
		return "", fmt.Errorf("failed to get file content: %w", err)
	}

	decoded, err := content.GetContent()
	if err != nil {
		return "", fmt.Errorf("failed to decode file content: %w", err)
	}

	return decoded, nil
}
