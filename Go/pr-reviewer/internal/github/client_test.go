package github

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
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
	// Create a test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/repos/test-owner/test-repo/pulls/1" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"number": 1}`))
			return
		}
		if r.URL.Path == "/test-owner/test-repo/pull/1.diff" || r.URL.Path == "//test-owner/test-repo/pull/1.diff" {
			w.Header().Set("Content-Type", "text/plain")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("test diff content"))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	// Create a client with the test server
	client := &Client{
		client: github.NewClient(nil),
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
	// Create a temporary directory for testing
	tmpDir := t.TempDir()

	// Create a test repository
	repoDir := filepath.Join(tmpDir, "test-repo")
	err := os.MkdirAll(repoDir, 0755)
	require.NoError(t, err)

	// Initialize git repository
	cmd := exec.Command("git", "init")
	cmd.Dir = repoDir
	err = cmd.Run()
	require.NoError(t, err)

	// Create a test file
	testFile := filepath.Join(repoDir, "test.txt")
	err = os.WriteFile(testFile, []byte("test content"), 0644)
	require.NoError(t, err)

	// Add and commit the file
	cmd = exec.Command("git", "add", "test.txt")
	cmd.Dir = repoDir
	err = cmd.Run()
	require.NoError(t, err)

	cmd = exec.Command("git", "commit", "-m", "Initial commit")
	cmd.Dir = repoDir
	err = cmd.Run()
	require.NoError(t, err)

	// Create a client
	client := NewClient("test-token")
	client.client.BaseURL = nil // Reset the BaseURL to use the local repository

	// Test cloning the repository
	cloneDir, err := client.CloneRepository(repoDir, "", "master")
	require.NoError(t, err)
	defer os.RemoveAll(cloneDir)

	// Verify the cloned repository
	clonedFile := filepath.Join(cloneDir, "test.txt")
	content, err := os.ReadFile(clonedFile)
	require.NoError(t, err)
	assert.Equal(t, "test content", string(content))
}

func TestCreateReviewComment(t *testing.T) {
	// Create a test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/repos/test-owner/test-repo/pulls/1/comments" {
			w.WriteHeader(http.StatusCreated)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	// Create a client with the test server
	client := &Client{
		client: github.NewClient(nil),
		ctx:    context.Background(),
	}
	baseURL, err := url.Parse(server.URL + "/")
	require.NoError(t, err)
	client.client.BaseURL = baseURL

	// Test creating a review comment
	err = client.CreateReviewComment("test-owner", "test-repo", 1, "test comment", "test.txt", 1)
	require.NoError(t, err)
}

func TestGetFileContent(t *testing.T) {
	// Create a test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/repos/test-owner/test-repo/contents/test.txt" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"content": "dGVzdCBjb250ZW50", "encoding": "base64"}`))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	// Create a client with the test server
	client := &Client{
		client: github.NewClient(nil),
		ctx:    context.Background(),
	}
	baseURL, err := url.Parse(server.URL + "/")
	require.NoError(t, err)
	client.client.BaseURL = baseURL

	// Test getting file content
	content, err := client.GetFileContent("test-owner", "test-repo", "test.txt", "main")
	require.NoError(t, err)
	assert.Equal(t, "test content", content)
}
