.PHONY: build test run docker-build docker-push terraform-init terraform-plan terraform-apply

# Go related variables
BINARY_NAME=pr-reviewer
MAIN_FILE=cmd/server/main.go

# Docker related variables
DOCKER_IMAGE=pr-reviewer
DOCKER_TAG=latest

# AWS related variables
AWS_REGION=us-west-2
ECR_REPOSITORY=pr-reviewer

# Build the application
build:
	go build -o $(BINARY_NAME) $(MAIN_FILE)

# Run tests
test:
	go test -v ./...

# Run the application
run:
	go run $(MAIN_FILE)

# Build Docker image
docker-build:
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

# Push Docker image to ECR
docker-push:
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com
	docker tag $(DOCKER_IMAGE):$(DOCKER_TAG) $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(ECR_REPOSITORY):$(DOCKER_TAG)
	docker push $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(ECR_REPOSITORY):$(DOCKER_TAG)

# Initialize Terraform
terraform-init:
	cd terraform && terraform init

# Plan Terraform changes
terraform-plan:
	cd terraform && terraform plan

# Apply Terraform changes
terraform-apply:
	cd terraform && terraform apply

# Clean up
clean:
	go clean
	rm -f $(BINARY_NAME)

# Install dependencies
deps:
	go mod download

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Generate mocks for testing
mocks:
	mockgen -source=internal/github/client.go -destination=internal/github/mocks/client_mock.go
	mockgen -source=internal/llm/client.go -destination=internal/llm/mocks/client_mock.go

# Help
help:
	@echo "Available targets:"
	@echo "  build          - Build the application"
	@echo "  test           - Run tests"
	@echo "  run            - Run the application"
	@echo "  docker-build   - Build Docker image"
	@echo "  docker-push    - Push Docker image to ECR"
	@echo "  terraform-init - Initialize Terraform"
	@echo "  terraform-plan - Plan Terraform changes"
	@echo "  terraform-apply - Apply Terraform changes"
	@echo "  clean          - Clean up build artifacts"
	@echo "  deps           - Install dependencies"
	@echo "  fmt            - Format code"
	@echo "  lint           - Lint code"
	@echo "  mocks          - Generate mocks for testing" 