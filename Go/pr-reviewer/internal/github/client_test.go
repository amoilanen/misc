package github

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/amoilanen/pr-reviewer/internal/utils"
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

func TestListDirectoryContents(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/repos/test-owner/test-repo/contents/test-dir" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`[
				{"path": "test-dir/file1.txt", "type": "file"},
				{"path": "test-dir/file2.txt", "type": "file"},
				{"path": "test-dir/subdir", "type": "dir"}
			]`))
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

	files, err := client.ListDirectoryContents("test-owner", "test-repo", "test-dir", "main")
	require.NoError(t, err)
	utils.CompareStringSlicesAsSets(t, []string{
		"test-dir/file1.txt",
		"test-dir/file2.txt",
		"test-dir/subdir",
	}, files)
}

func TestSearchFiles(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/repos/test-owner/test-repo/contents/":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`[
				{"path": "file1.go", "type": "file"},
				{"path": "src", "type": "dir"},
				{"path": "test.go", "type": "file"}
			]`))
		case "/repos/test-owner/test-repo/contents/src":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`[
				{"path": "src/main.go", "type": "file"},
				{"path": "src/utils", "type": "dir"},
				{"path": "src/helper.go", "type": "file"}
			]`))
		case "/repos/test-owner/test-repo/contents/src/utils":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`[
				{"path": "src/utils/helper.go", "type": "file"},
				{"path": "src/utils/constants.go", "type": "file"}
			]`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	client := &Client{
		client: github.NewClient(nil),
		ctx:    context.Background(),
	}
	baseURL, err := url.Parse(server.URL + "/")
	require.NoError(t, err)
	client.client.BaseURL = baseURL

	tests := []struct {
		name     string
		path     string
		pattern  string
		expected []string
	}{
		{
			name:    "search for all go files from root",
			path:    "",
			pattern: ".go",
			expected: []string{
				"file1.go",
				"test.go",
				"src/main.go",
				"src/helper.go",
				"src/utils/helper.go",
				"src/utils/constants.go",
			},
		},
		{
			name:    "search for specific file from root",
			path:    "",
			pattern: "helper.go",
			expected: []string{
				"src/helper.go",
				"src/utils/helper.go",
			},
		},
		{
			name:     "search for non-existent pattern from root",
			path:     "",
			pattern:  "nonexistent",
			expected: []string{},
		},
		{
			name:    "search for go files in src directory",
			path:    "src",
			pattern: ".go",
			expected: []string{
				"src/main.go",
				"src/helper.go",
				"src/utils/helper.go",
				"src/utils/constants.go",
			},
		},
		{
			name:    "search for go files in utils directory",
			path:    "src/utils",
			pattern: ".go",
			expected: []string{
				"src/utils/helper.go",
				"src/utils/constants.go",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			files, err := client.SearchFiles("test-owner", "test-repo", tt.path, tt.pattern, "main")
			require.NoError(t, err)
			utils.CompareStringSlicesAsSets(t, tt.expected, files)
		})
	}
}

func TestSearchFilesError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	client := &Client{
		client: github.NewClient(nil),
		ctx:    context.Background(),
	}
	baseURL, err := url.Parse(server.URL + "/")
	require.NoError(t, err)
	client.client.BaseURL = baseURL

	files, err := client.SearchFiles("test-owner", "test-repo", "", "pattern", "main")
	assert.Error(t, err)
	assert.Nil(t, files)
	assert.Contains(t, err.Error(), "failed to get repository contents")
}
