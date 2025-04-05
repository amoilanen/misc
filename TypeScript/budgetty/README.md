# Budgetty - Personal Finance Management Application

A modern web application for managing personal finances, built with NestJS (backend) and React (frontend).

## Features

- User authentication with email/password and Google OAuth
- Event management (income/expenses)
- Category management with automatic categorization rules
- Dashboard with financial overview
- Profile management
- Responsive design for all devices

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Docker and Docker Compose (for local development)
- Google Cloud Platform account (for deployment)
- PostgreSQL database

## Local Development

### 1. Start PostgreSQL Database

1. Start the PostgreSQL database using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Verify the database is running:
   ```bash
   docker ps
   ```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/budgetty
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FRONTEND_URL=http://localhost:5173
   PORT=3001
   NODE_ENV=development
   ```

   To generate a secure JWT_SECRET, you can use:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Run database migrations:
   ```bash
   npm run migration:run
   ```

5. Start the development server:
   ```bash
   npm run start:dev
   ```

The backend will be available at `http://localhost:3001`.

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`.

## Deployment to Google Cloud Platform

### 1. Prerequisites Setup

1. Install and initialize the Google Cloud SDK:
   ```bash
   # Install Google Cloud SDK
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. Enable required APIs:
   ```bash
   gcloud services enable containerregistry.googleapis.com
   gcloud services enable container.googleapis.com
   gcloud services enable compute.googleapis.com
   gcloud services enable cloudresourcemanager.googleapis.com
   ```

3. Create a new project (if not already created):
   ```bash
   gcloud projects create [PROJECT_ID] --name="Budgetty"
   gcloud config set project [PROJECT_ID]
   ```

### 2. Database Setup

1. Create a Cloud SQL instance:
   ```bash
   gcloud sql instances create budgetty-db \
     --database-version=POSTGRES_14 \
     --tier=db-f1-micro \
     --region=us-central1 \
     --root-password=[DB_PASSWORD]
   ```

2. Create a database:
   ```bash
   gcloud sql databases create budgetty --instance=budgetty-db
   ```

3. Create a user:
   ```bash
   gcloud sql users create budgetty \
     --instance=budgetty-db \
     --password=[DB_USER_PASSWORD]
   ```

### 3. Kubernetes Cluster Setup

1. Create a GKE cluster:
   ```bash
   gcloud container clusters create budgetty-cluster \
     --zone=us-central1-a \
     --num-nodes=2 \
     --machine-type=e2-medium
   ```

2. Get credentials:
   ```bash
   gcloud container clusters get-credentials budgetty-cluster --zone=us-central1-a
   ```

### 4. Deploying the Application

1. Build and push Docker images:
   ```bash
   # Build backend image
   cd backend
   docker build -t gcr.io/[PROJECT_ID]/budgetty-backend .
   docker push gcr.io/[PROJECT_ID]/budgetty-backend

   # Build frontend image
   cd ../frontend
   docker build -t gcr.io/[PROJECT_ID]/budgetty-frontend .
   docker push gcr.io/[PROJECT_ID]/budgetty-frontend
   ```

2. Create Kubernetes secrets:
   ```bash
   kubectl create secret generic budgetty-secrets \
     --from-literal=DB_PASSWORD=[DB_PASSWORD] \
     --from-literal=JWT_SECRET=[JWT_SECRET] \
     --from-literal=GOOGLE_CLIENT_ID=[GOOGLE_CLIENT_ID] \
     --from-literal=GOOGLE_CLIENT_SECRET=[GOOGLE_CLIENT_SECRET]
   ```

3. Apply Kubernetes manifests:
   ```bash
   # Update image references in deployment files
   sed -i "s|gcr.io/\[PROJECT_ID\]|gcr.io/[PROJECT_ID]|g" k8s/*.yaml

   # Apply manifests
   kubectl apply -f k8s/
   ```

4. Configure SSL with cert-manager:
   ```bash
   # Install cert-manager
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml

   # Create ClusterIssuer
   kubectl apply -f k8s/cluster-issuer.yaml
   ```

5. Create Ingress:
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

### 5. Monitoring and Maintenance

1. View logs:
   ```bash
   # Backend logs
   kubectl logs -f deployment/budgetty-backend

   # Frontend logs
   kubectl logs -f deployment/budgetty-frontend
   ```

2. Scale deployments:
   ```bash
   kubectl scale deployment budgetty-backend --replicas=2
   kubectl scale deployment budgetty-frontend --replicas=2
   ```

3. Update deployments:
   ```bash
   # After building and pushing new images
   kubectl set image deployment/budgetty-backend \
     budgetty-backend=gcr.io/[PROJECT_ID]/budgetty-backend:latest
   kubectl set image deployment/budgetty-frontend \
     budgetty-frontend=gcr.io/[PROJECT_ID]/budgetty-frontend:latest
   ```

## Troubleshooting

### Local Development

1. Database connection issues:
   - Ensure PostgreSQL is running: `docker ps`
   - Check database logs: `docker logs budgetty-db`
   - Verify connection string in `.env`

2. Backend issues:
   - Check logs: `npm run start:dev`
   - Verify environment variables
   - Check database migrations: `npm run migration:status`

3. Frontend issues:
   - Clear browser cache
   - Check console for errors
   - Verify API URL in `.env`

### GCP Deployment

1. Cluster issues:
   ```bash
   # Check cluster status
   gcloud container clusters describe budgetty-cluster --zone=us-central1-a

   # Check node status
   kubectl get nodes
   ```

2. Pod issues:
   ```bash
   # Check pod status
   kubectl get pods

   # Check pod logs
   kubectl logs [POD_NAME]

   # Check pod events
   kubectl describe pod [POD_NAME]
   ```

3. Database issues:
   ```bash
   # Check database status
   gcloud sql instances describe budgetty-db

   # Check database logs
   gcloud sql instances logs tail budgetty-db
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 