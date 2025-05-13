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

type Client struct {
	client *github.Client
	ctx    context.Context
}

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

func (c *Client) GetPullRequestDiffs(owner, repo string, prNumber int) (string, error) {
	diffURL := fmt.Sprintf("%s/%s/%s/pull/%d.diff", c.client.BaseURL.String(), owner, repo, prNumber)
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

func (c *Client) CloneRepository(owner, repo, branch string) (string, error) {
	tmpDir, err := os.MkdirTemp("", "pr-reviewer-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}

	var cloneURL string
	if c.client.BaseURL == nil || owner == "" || owner == "." || owner == "/" || owner == repo || len(repo) == 0 || owner == repo {
		// If BaseURL is nil or owner looks like a URL, use owner as the full URL
		cloneURL = owner
	} else if len(owner) > 7 && (owner[:7] == "http://" || owner[:8] == "https://" || owner[:7] == "file://") {
		cloneURL = owner
	} else {
		cloneURL = fmt.Sprintf("%s/%s/%s.git", c.client.BaseURL.String(), owner, repo)
	}

	cmd := exec.Command("git", "clone", "-b", branch, cloneURL, tmpDir)
	if err := cmd.Run(); err != nil {
		os.RemoveAll(tmpDir)
		return "", fmt.Errorf("failed to clone repository: %w", err)
	}

	return tmpDir, nil
}

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
