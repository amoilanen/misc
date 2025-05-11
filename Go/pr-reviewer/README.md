# PR Reviewer

An automated GitHub Pull Request reviewer that uses LLM APIs to provide intelligent code reviews.

## Features

- Automated PR review using configurable LLM providers
- GitHub webhook integration for real-time PR monitoring
- Support for multiple repositories
- AWS deployment ready
- Comprehensive test coverage

## Prerequisites

- Go 1.21 or later
- AWS Account (for deployment)
- GitHub Personal Access Token with repo access
- LLM API credentials (OpenAI, Anthropic, etc.)

## Configuration

Create a `config.yaml` file in the project root:

```yaml
github:
  webhook_secret: "your-webhook-secret"
  app_id: "your-github-app-id"
  private_key_path: "path/to/private-key.pem"

llm:
  provider: "openai"  # or "anthropic"
  api_key: "your-api-key"
  model: "gpt-4"  # or other model name

repositories:
  - owner: "organization"
    name: "repo-name"
    branch: "main"

server:
  port: 8080
  host: "0.0.0.0"
```

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/amoilanen/pr-reviewer.git
   cd pr-reviewer
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Run tests:
   ```bash
   go test ./...
   ```

4. Start the server:
   ```bash
   go run cmd/server/main.go
   ```

## Detailed Local Development Setup

### 1. GitHub App Setup

1. Go to your GitHub account settings and navigate to "Developer settings" > "GitHub Apps"
2. Click "New GitHub App" and configure:
   - Name: "PR Reviewer"
   - Homepage URL: `http://localhost:8080`
   - Webhook URL: `http://your-ngrok-url/webhook` (see ngrok setup below)
   - Webhook secret: Generate a secure random string
   - Permissions needed:
     - Repository permissions:
       - Pull requests: Read & Write
       - Contents: Read
       - Metadata: Read
   - Subscribe to events:
     - Pull request
     - Pull request review
3. After creating the app, generate a private key and save it as `private-key.pem`
4. Note down the App ID from the app settings page

### 2. Local Environment Setup

1. Install ngrok for webhook testing:
   ```bash
   # On Linux/macOS
   brew install ngrok  # macOS
   sudo snap install ngrok  # Linux
   ```

2. Start ngrok to create a public URL:
   ```bash
   ngrok http 8080
   ```
   Note the HTTPS URL provided by ngrok (e.g., `https://abc123.ngrok.io`)

3. Create the configuration file:
   ```bash
   cp config.example.yaml config.yaml
   ```

4. Edit `config.yaml` with your settings:
   ```yaml
   github:
     webhook_secret: "your-webhook-secret-from-github-app"
     app_id: "your-github-app-id"
     private_key_path: "./private-key.pem"

   llm:
     provider: "openai"
     api_key: "your-openai-api-key"
     model: "gpt-4"

   repositories:
     - owner: "your-github-username"
       name: "test-repo"
       branch: "main"

   server:
     port: 8080
     host: "0.0.0.0"
   ```

### 3. Testing with GitHub

1. Install the GitHub App:
   - Go to your GitHub App settings
   - Click "Install App"
   - Select the repository you want to test with

2. Create a test repository:
   ```bash
   mkdir test-repo
   cd test-repo
   git init
   echo "# Test Repo" > README.md
   git add README.md
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/test-repo.git
   git push -u origin main
   ```

3. Create a test PR:
   ```bash
   git checkout -b test-pr
   echo "Test change" >> README.md
   git add README.md
   git commit -m "Test PR"
   git push origin test-pr
   ```

4. Create a PR on GitHub:
   - Go to your repository on GitHub
   - Click "Compare & pull request"
   - Create the PR from `test-pr` to `main`

5. Verify the PR review:
   - The PR reviewer should automatically comment on your PR
   - Check the server logs for any errors
   - Verify the webhook is being received (check ngrok inspector)

### Troubleshooting

1. Webhook Issues:
   - Verify ngrok is running and the URL is correct in GitHub App settings
   - Check webhook delivery logs in GitHub App settings
   - Ensure the webhook secret matches in both config and GitHub App

2. Authentication Issues:
   - Verify the private key path is correct
   - Check the App ID matches
   - Ensure the GitHub App has the correct permissions

3. LLM API Issues:
   - Verify your API key is valid
   - Check the model name is correct
   - Ensure you have sufficient API credits

## AWS Deployment

1. Build the application:
   ```bash
   go build -o pr-reviewer cmd/server/main.go
   ```

2. Create an ECS task definition and service using the provided Terraform configuration:
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```

## Testing

The project includes comprehensive test coverage. Run tests with:

```bash
go test -v ./...
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 