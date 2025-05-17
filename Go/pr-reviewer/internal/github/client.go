package github

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/amoilanen/pr-reviewer/internal/types"
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

func (c *Client) ListDirectoryContents(owner, repo, path, ref string) ([]string, error) {
	_, contents, _, err := c.client.Repositories.GetContents(c.ctx, owner, repo, path, &github.RepositoryContentGetOptions{Ref: ref})
	if err != nil {
		return nil, fmt.Errorf("failed to get directory contents: %w", err)
	}

	var files []string
	for _, content := range contents {
		files = append(files, content.GetPath())
	}

	return files, nil
}

func (c *Client) SearchFiles(owner, repo, path string, pattern, ref string) ([]string, error) {
	_, contents, _, err := c.client.Repositories.GetContents(c.ctx, owner, repo, path, &github.RepositoryContentGetOptions{Ref: ref})
	if err != nil {
		return nil, fmt.Errorf("failed to get repository contents: %w", err)
	}

	var matchingFiles []string
	for _, content := range contents {
		if content.GetType() == "dir" {
			subFiles, err := c.SearchFiles(owner, repo, content.GetPath(), pattern, ref)
			if err != nil {
				return nil, err
			}
			matchingFiles = append(matchingFiles, subFiles...)
		} else if content.GetType() == "file" {
			if strings.Contains(content.GetPath(), pattern) {
				matchingFiles = append(matchingFiles, content.GetPath())
			}
		}
	}

	return matchingFiles, nil
}

func (c *Client) GetPullRequestComments(owner, repo string, prNumber int) ([]types.PRComment, error) {
	comments, _, err := c.client.PullRequests.ListComments(c.ctx, owner, repo, prNumber, &github.PullRequestListCommentsOptions{
		Sort:      "created",
		Direction: "asc",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get PR comments: %w", err)
	}

	var result []types.PRComment
	for _, comment := range comments {
		result = append(result, types.PRComment{
			ID:        comment.GetID(),
			Body:      comment.GetBody(),
			Path:      comment.GetPath(),
			Line:      comment.GetLine(),
			ThreadID:  comment.GetInReplyTo(),
			InReplyTo: comment.GetInReplyTo(),
		})
	}

	return result, nil
}

func (c *Client) ResolveThread(owner, repo string, prNumber int, threadID int64) error {
	body := "Resolved"
	comment := &github.PullRequestComment{
		Body:      &body,
		InReplyTo: &threadID,
	}

	_, _, err := c.client.PullRequests.CreateComment(c.ctx, owner, repo, prNumber, comment)
	if err != nil {
		return fmt.Errorf("failed to resolve thread: %w", err)
	}

	return nil
}

func (c *Client) ReplyToThread(owner, repo string, prNumber int, threadID int64, body string) error {
	comment := &github.PullRequestComment{
		Body:      &body,
		InReplyTo: &threadID,
	}

	_, _, err := c.client.PullRequests.CreateComment(c.ctx, owner, repo, prNumber, comment)
	if err != nil {
		return fmt.Errorf("failed to reply to thread: %w", err)
	}

	return nil
}
