package github

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/google/go-github/v57/github"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewClient(t *testing.T) {
	client := NewClient("test-token")
	assert.NotNil(t, client)
	assert.NotNil(t, client.client)
	assert.NotNil(t, client.ctx)
}

func TestGetPullRequestDiffs(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/test-owner/test-repo/pull/1.diff") {
			w.Header().Set("Content-Type", "text/plain")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("test diff content"))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client := &Client{
		client: github.NewClient(&http.Client{}),
		ctx:    context.Background(),
	}
	baseURL, err := url.Parse(server.URL + "/")
	require.NoError(t, err)
	client.client.BaseURL = baseURL

	// Test getting PR diffs
	diff, err := client.GetPullRequestDiffs("test-owner", "test-repo", 1)
	require.NoError(t, err)
	assert.Equal(t, "test diff content", diff)
}

func TestCloneRepository(t *testing.T) {
	tmpDir := t.TempDir()

	repoDir := filepath.Join(tmpDir, "test-repo")
	err := os.MkdirAll(repoDir, 0755)
	require.NoError(t, err)

	cmd := exec.Command("git", "init")
	cmd.Dir = repoDir
	err = cmd.Run()
	require.NoError(t, err)

	testFile := filepath.Join(repoDir, "test.txt")
	err = os.WriteFile(testFile, []byte("test content"), 0644)
	require.NoError(t, err)

	cmd = exec.Command("git", "add", "test.txt")
	cmd.Dir = repoDir
	err = cmd.Run()
	require.NoError(t, err)

	cmd = exec.Command("git", "commit", "-m", "Initial commit")
	cmd.Dir = repoDir
	err = cmd.Run()
	require.NoError(t, err)

	client := NewClient("test-token")
	client.client.BaseURL = nil // Reset the BaseURL to use the local repository

	cloneDir, err := client.CloneRepository(repoDir, "", "master")
	require.NoError(t, err)
	defer os.RemoveAll(cloneDir)

	clonedFile := filepath.Join(cloneDir, "test.txt")
	content, err := os.ReadFile(clonedFile)
	require.NoError(t, err)
	assert.Equal(t, "test content", string(content))
}

func TestCreateReviewComment(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/repos/test-owner/test-repo/pulls/1/comments" {
			w.WriteHeader(http.StatusCreated)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client := &Client{
		client: github.NewClient(&http.Client{}),
		ctx:    context.Background(),
	}
	baseURL, err := url.Parse(server.URL + "/")
	require.NoError(t, err)
	client.client.BaseURL = baseURL

	err = client.CreateReviewComment("test-owner", "test-repo", 1, "test comment", "test.txt", 1)
	require.NoError(t, err)
}

func TestGetFileContent(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/repos/test-owner/test-repo/contents/test.txt" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"content": "test content" }`))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client := &Client{
		client: github.NewClient(nil),
		ctx:    context.Background(),
	}
	baseURL, err := url.Parse(server.URL + "/")
	require.NoError(t, err)
	client.client.BaseURL = baseURL

	content, err := client.GetFileContent("test-owner", "test-repo", "test.txt", "main")
	require.NoError(t, err)
	assert.Equal(t, "test content", content)
}
