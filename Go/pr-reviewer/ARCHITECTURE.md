# PR Reviewer Architecture

## Overview

PR Reviewer is a Go-based application that automates the review of GitHub pull requests using various LLM providers. The application listens for GitHub webhook events, analyzes code changes, and provides automated code reviews.

## System Architecture

### Components

1. **Web Server**
   - Built with Gin framework
   - Handles GitHub webhook events
   - Provides health check endpoint
   - Implements webhook signature verification

2. **GitHub Client**
   - Manages GitHub API interactions
   - Fetches PR diffs
   - Clones repositories
   - Creates review comments
   - Retrieves file content for context

3. **LLM Client**
   - Supports multiple LLM providers:
     - OpenAI (GPT models)
     - Anthropic (Claude models)
     - Google (Gemini models)
     - OpenRouter (Unified access to multiple models)
   - Handles API communication
   - Formats prompts for code review
   - Processes LLM responses
   - Provider-specific configurations:
     - OpenAI: Direct API access
     - Anthropic: Direct API access
     - Gemini: Google AI API
     - OpenRouter: Unified API with access to multiple providers

4. **Configuration Management**
   - Uses Viper for configuration
   - Supports YAML configuration files
   - Manages environment variables
   - Validates required settings

### Data Flow

1. **Webhook Reception**
   ```
   GitHub Webhook → Web Server → Signature Verification → Event Processing
   ```

2. **PR Processing**
   ```
   Event Processing → Fetch PR Diffs → Clone Repository → Get Context Files → LLM Review → Post Comments
   ```

3. **LLM Review Flow**
   ```
   Code Changes + Context → Prompt Generation → LLM API Call → Response Parsing → Comment Creation
   ```

## Deployment Architecture

### AWS Infrastructure

1. **ECS Fargate**
   - Containerized application deployment
   - Auto-scaling capabilities
   - Task definition with resource limits

2. **Networking**
   - VPC with public and private subnets
   - NAT Gateway for outbound traffic
   - Security groups for access control

3. **Load Balancing**
   - Application Load Balancer
   - Health checks
   - SSL termination

4. **Security**
   - Secrets Manager for sensitive data
   - IAM roles and policies
   - VPC security groups

5. **Monitoring**
   - CloudWatch Logs
   - Metrics collection
   - Alert configuration

## Configuration

### GitHub Configuration
- Webhook secret for signature verification
- GitHub App ID and private key
- Repository access settings

### LLM Configuration
- Provider selection (OpenAI, Anthropic, Gemini)
- API keys
- Model selection
- Provider-specific settings

### Server Configuration
- Port and host settings
- Logging configuration
- Resource limits

## Security Considerations

1. **Authentication & Authorization**
   - GitHub webhook signature verification
   - LLM API key management
   - AWS IAM roles

2. **Data Protection**
   - Secrets stored in AWS Secrets Manager
   - Private key management
   - Secure API communication

3. **Network Security**
   - VPC isolation
   - Security group rules
   - HTTPS for webhook endpoints

## Scalability

1. **Horizontal Scaling**
   - ECS service auto-scaling
   - Load balancer distribution
   - Stateless application design

2. **Resource Management**
   - Container resource limits
   - Concurrent PR processing
   - Rate limiting for API calls

## Monitoring and Logging

1. **Application Logs**
   - Structured logging with Zap
   - CloudWatch Logs integration
   - Log retention policies

2. **Metrics**
   - PR processing metrics
   - API call statistics
   - Resource utilization

## Error Handling

1. **Graceful Degradation**
   - Retry mechanisms
   - Fallback options
   - Error reporting

2. **Recovery**
   - Automatic restarts
   - State recovery
   - Error notifications

## Development Workflow

1. **Local Development**
   - Go modules for dependency management
   - Docker for containerization
   - Makefile for common tasks

2. **Testing**
   - Unit tests
   - Integration tests
   - Mock implementations

3. **CI/CD**
   - GitHub Actions for CI
   - Terraform for infrastructure
   - Docker image builds

## Future Considerations

1. **Feature Enhancements**
   - Additional LLM providers
   - Custom review rules
   - Review templates

2. **Infrastructure Improvements**
   - Multi-region deployment
   - Enhanced monitoring
   - Backup strategies

3. **Performance Optimizations**
   - Caching mechanisms
   - Batch processing
   - Resource optimization 