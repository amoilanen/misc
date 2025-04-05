# Deployment Guide

This guide explains how to deploy the Budgetty application to Google Cloud Platform (GCP) using Kubernetes.

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed
- `kubectl` CLI installed
- Docker installed
- Domain name for your application
- SSL certificate (managed by cert-manager)

## GCP Setup

1. Create a new GCP project:
```bash
gcloud projects create budgetty --name="Budgetty"
gcloud config set project budgetty
```

2. Enable required APIs:
```bash
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

3. Create a GKE cluster:
```bash
gcloud container clusters create budgetty-cluster \
  --zone europe-north1 \
  --num-nodes 3 \
  --machine-type e2-standard-2 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 5 \
  --enable-autorepair \
  --enable-autoupgrade
```

4. Get cluster credentials:
```bash
gcloud container clusters get-credentials budgetty-cluster --zone europe-north1
```

## Container Registry Setup

1. Create a container registry:
```bash
gcloud container images create budgetty
```

2. Configure Docker to use GCP credentials:
```bash
gcloud auth configure-docker
```

## Database Setup

1. Create a Cloud SQL instance:
```bash
gcloud sql instances create budgetty-db \
  --database-version=POSTGRES_14 \
  --cpu=1 \
  --memory=3840MB \
  --region=europe-north1 \
  --root-password=your-root-password
```

2. Create the database:
```bash
gcloud sql databases create budgetty --instance=budgetty-db
```

3. Create a database user:
```bash
gcloud sql users create postgres \
  --instance=budgetty-db \
  --password=your-password
```

## Kubernetes Setup

1. Create a namespace:
```bash
kubectl create namespace budgetty
kubectl config set-context --current --namespace=budgetty
```

2. Install cert-manager for SSL:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml
```

3. Create a ClusterIssuer for Let's Encrypt:
```bash
kubectl apply -f k8s/cert-manager/cluster-issuer.yaml
```

4. Create static IP addresses:
```bash
gcloud compute addresses create budgetty-frontend-ip --global
gcloud compute addresses create budgetty-backend-ip --global
```

5. Update DNS records:
```bash
# Get the IP addresses
gcloud compute addresses list

# Update your DNS provider with:
# budgetty.example.com -> budgetty-frontend-ip
# api.budgetty.example.com -> budgetty-backend-ip
```

## Application Deployment

### Frontend Deployment

1. Build and push the frontend image:
```bash
cd frontend
docker build -t gcr.io/budgetty/frontend:latest .
docker push gcr.io/budgetty/frontend:latest
```

2. Deploy the frontend:
```bash
kubectl apply -f k8s/frontend/deployment.yaml
kubectl apply -f k8s/frontend/service.yaml
kubectl apply -f k8s/frontend/ingress.yaml
```

3. Verify frontend deployment:
```bash
kubectl get pods -l app=budgetty-frontend
kubectl get service budgetty-frontend
kubectl get ingress budgetty-frontend
```

### Backend Deployment

1. Build and push the backend image:
```bash
cd backend
docker build -t gcr.io/budgetty/backend:latest .
docker push gcr.io/budgetty/backend:latest
```

2. Create secrets:
```bash
# Edit k8s/backend/secrets.yaml with your values
kubectl apply -f k8s/backend/secrets.yaml
```

3. Deploy the backend:
```bash
kubectl apply -f k8s/backend/deployment.yaml
kubectl apply -f k8s/backend/service.yaml
kubectl apply -f k8s/backend/ingress.yaml
```

## Monitoring and Maintenance

1. View logs:
```bash
# Backend logs
kubectl logs -f deployment/budgetty-backend

# Frontend logs
kubectl logs -f deployment/budgetty-frontend
```

2. Monitor resources:
```bash
kubectl top pods
kubectl top nodes
```

3. Scale the applications:
```bash
# Scale backend
kubectl scale deployment budgetty-backend --replicas=3

# Scale frontend
kubectl scale deployment budgetty-frontend --replicas=3
```

4. Update the application:
```bash
# Build and push new images
docker build -t gcr.io/budgetty/backend:latest ./backend
docker build -t gcr.io/budgetty/frontend:latest ./frontend
docker push gcr.io/budgetty/backend:latest
docker push gcr.io/budgetty/frontend:latest

# Roll out updates
kubectl rollout restart deployment budgetty-backend
kubectl rollout restart deployment budgetty-frontend
```

## Backup and Recovery

1. Backup the database:
```bash
gcloud sql backups create --instance=budgetty-db
```

2. Restore from backup:
```bash
gcloud sql backups restore [BACKUP_ID] \
  --instance=budgetty-db \
  --restore-instance=budgetty-db-restore
```

## Security Considerations

1. Enable Cloud Armor:
```bash
gcloud compute security-policies create budgetty-policy \
  --description="Security policy for Budgetty"
```

2. Configure firewall rules:
```bash
gcloud compute firewall-rules create allow-https \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:443 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=https-server
```

## Cost Optimization

1. Enable node autoscaling:
```bash
gcloud container clusters update budgetty-cluster \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5 \
  --zone=europe-north1
```

2. Set up budget alerts:
```bash
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Budgetty Budget" \
  --budget-amount=100 \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9
```

## Troubleshooting

1. Check pod status:
```bash
kubectl get pods
kubectl describe pod [POD_NAME]
```

2. Check ingress status:
```bash
kubectl describe ingress budgetty-frontend
kubectl describe ingress budgetty-backend
```

3. View container logs:
```bash
kubectl logs -f deployment/budgetty-frontend
kubectl logs -f deployment/budgetty-backend
```

4. Check SSL certificate status:
```bash
kubectl get certificaterequest
kubectl get order.acme.cert-manager.io
``` 