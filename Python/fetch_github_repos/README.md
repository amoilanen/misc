# GitHub Repository Checkout Script

A Python script that clones all repositories (public and private) from a GitHub account using SSH URLs.

## Prerequisites

1. Python 3.6 or higher
2. Git installed and configured
3. SSH key configured with GitHub ([instructions](https://docs.github.com/en/authentication/connecting-to-github-with-ssh))
4. GitHub Personal Access Token with appropriate scopes

## Installation

Install required dependencies:

```bash
pip install -r requirements.txt
```

## GitHub Token Setup

Create a Personal Access Token at: https://github.com/settings/tokens

Required scopes:
- `repo` (Full control of private repositories)
- `read:org` (optional, for organization repos)

## Usage

### Basic Examples

Clone all repos for the authenticated user:
```bash
./checkout_github_repos.py --token ghp_your_token_here
```

Clone all repos for a specific user:
```bash
./checkout_github_repos.py --token ghp_your_token_here --username octocat
```

Clone to a specific directory:
```bash
./checkout_github_repos.py --token ghp_your_token_here --output-dir ~/repos
```

### Using Environment Variable

Set your token as an environment variable:
```bash
export GITHUB_TOKEN=ghp_your_token_here
./checkout_github_repos.py --username octocat
```

### Dry Run

See what would be cloned without actually cloning:
```bash
./checkout_github_repos.py --token ghp_your_token_here --dry-run
```

## Options

- `--token`, `-t`: GitHub personal access token (required, or use GITHUB_TOKEN env var)
- `--username`, `-u`: GitHub username (optional, defaults to authenticated user)
- `--output-dir`, `-o`: Directory to clone repos into (default: current directory)
- `--dry-run`, `-n`: Show what would be cloned without cloning

## Features

- Clones using SSH URLs for better authentication
- Handles both public and private repositories
- Shows clear indicators for private vs public repos
- Skips already cloned repositories
- Pagination support for accounts with many repos
- Progress feedback and summary statistics
- Error handling and informative messages

## Notes

- Repositories are cloned using SSH URLs (ssh://git@github.com/...)
- Make sure your SSH key is added to your GitHub account
- Existing repositories in the output directory will be skipped
- The script uses the GitHub REST API v3
