.PHONY: help build run test clean docker-build docker-up docker-down migrate

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the project
	cargo build --release

run: ## Run the service
	cargo run

test: ## Run tests
	cargo test

test-integration: ## Run integration tests (requires database)
	docker-compose up -d
	sleep 5
	cargo test --test integration_test -- --ignored
	docker-compose down

clean: ## Clean build artifacts
	cargo clean

docker-build: ## Build Docker image
	docker build -t library-service:latest .

docker-up: ## Start dependencies with docker-compose
	docker-compose up -d

docker-down: ## Stop docker-compose services
	docker-compose down

docker-logs: ## View docker-compose logs
	docker-compose logs -f

migrate: ## Run database migrations manually
	cargo install sqlx-cli --features postgres
	sqlx migrate run

fmt: ## Format code
	cargo fmt

clippy: ## Run clippy linter
	cargo clippy -- -D warnings

check: fmt clippy test ## Run format, lint, and tests

kind-create: ## Create kind cluster
	kind create cluster --name library-service

kind-load: ## Load Docker image into kind
	kind load docker-image library-service:latest --name library-service

kind-deploy: ## Deploy to kind (requires image to be loaded)
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/postgres-deployment.yaml
	kubectl wait --for=condition=ready pod -l app=postgres -n library-service --timeout=120s
	kubectl apply -f k8s/kafka-deployment.yaml
	kubectl wait --for=condition=ready pod -l app=kafka -n library-service --timeout=120s
	kubectl apply -f k8s/configmap.yaml
	kubectl apply -f k8s/app-deployment.yaml
	kubectl apply -f k8s/ingress.yaml

kind-delete: ## Delete kind cluster
	kind delete cluster --name library-service

kind-logs: ## View application logs in kind
	kubectl logs -f deployment/library-service -n library-service

kind-port-forward: ## Port forward service from kind
	kubectl port-forward -n library-service svc/library-service 3000:80

