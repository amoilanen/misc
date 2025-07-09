# Deployment Guide - Invoice Generator Service

This guide provides step-by-step instructions for deploying the Invoice Generator Service to Google Cloud Platform (GCP).

## Prerequisites

- Google Cloud SDK installed and configured
- Docker installed
- kubectl installed
- Access to a GCP project with billing enabled

## Step 1: GCP Project Setup

### 1.1 Create or Select a Project
```bash
# List existing projects
gcloud projects list

# Create a new project (if needed)
gcloud projects create YOUR_PROJECT_ID --name="Invoice Generator Service"

# Set the active project
gcloud config set project YOUR_PROJECT_ID
```

### 1.2 Enable Required APIs
```bash
# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Kubernetes Engine API
gcloud services enable container.googleapis.com

# Enable Cloud Storage API
gcloud services enable storage.googleapis.com

# Enable Cloud Build API (for building Docker images)
gcloud services enable cloudbuild.googleapis.com
```

### 1.3 Create Service Account
```bash
# Create service account for the application
gcloud iam service-accounts create invoice-generator-sa \
  --display-name="Invoice Generator Service Account"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:invoice-generator-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download service account key
gcloud iam service-accounts keys create key.json \
  --iam-account=invoice-generator-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## Step 2: Database Setup

### 2.1 Create Cloud SQL Instance
```bash
# Create PostgreSQL instance
gcloud sql instances create invoice-generator-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_ROOT_PASSWORD

# Create database
gcloud sql databases create invoice_generator \
  --instance=invoice-generator-db

# Create user
gcloud sql users create invoice_user \
  --instance=invoice-generator-db \
  --password=YOUR_DB_PASSWORD
```

### 2.2 Get Connection Information
```bash
# Get connection name
gcloud sql instances describe invoice-generator-db \
  --format="value(connectionName)"

# Get public IP (for testing)
gcloud sql instances describe invoice-generator-db \
  --format="value(ipAddresses[0].ipAddress)"
```

## Step 3: Kafka Setup

### 3.1 Deploy Kafka to GKE (Option 1)
```bash
# Create Kafka namespace
kubectl create namespace kafka

# Install Kafka using Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install kafka bitnami/kafka \
  --namespace kafka \
  --set replicaCount=3 \
  --set zookeeper.replicaCount=3
```

### 3.2 Use Managed Kafka (Option 2 - Recommended)
Consider using Confluent Cloud or other managed Kafka services for production.

## Step 4: Build and Push Docker Image

### 4.1 Configure Docker for GCR
```bash
# Configure Docker to use gcloud as a credential helper
gcloud auth configure-docker
```

### 4.2 Build and Push Image
```bash
# Build the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/invoice-generator-service:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/invoice-generator-service:latest
```

## Step 5: Create GKE Cluster

### 5.1 Create Cluster
```bash
# Create GKE cluster
gcloud container clusters create invoice-generator-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-standard-2 \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10 \
  --enable-autorepair \
  --enable-autoupgrade

# Get credentials
gcloud container clusters get-credentials invoice-generator-cluster \
  --zone=us-central1-a
```

### 5.2 Verify Cluster
```bash
# Check cluster status
kubectl cluster-info

# Check nodes
kubectl get nodes
```

## Step 6: Deploy Application

### 6.1 Create Kubernetes Secrets
```bash
# Create namespace
kubectl create namespace invoice-generator

# Create database secret
kubectl create secret generic invoice-generator-secrets \
  --namespace=invoice-generator \
  --from-literal=database-url="jdbc:postgresql:///invoice_generator?cloudSqlInstance=YOUR_PROJECT_ID:us-central1:invoice-generator-db&socketFactory=com.google.cloud.sql.postgres.SocketFactory" \
  --from-literal=database-username="invoice_user" \
  --from-literal=database-password="YOUR_DB_PASSWORD"

# Create GCP service account key secret
kubectl create secret generic google-cloud-key \
  --namespace=invoice-generator \
  --from-file=key.json=./key.json
```

### 6.2 Create ConfigMap
```bash
# Create config map
kubectl create configmap invoice-generator-config \
  --namespace=invoice-generator \
  --from-literal=kafka-bootstrap-servers="kafka.kafka.svc.cluster.local:9092" \
  --from-literal=kafka-topic="invoice-events" \
  --from-literal=gcp-project-id="YOUR_PROJECT_ID" \
  --from-literal=gcp-bucket-name="invoice-pdfs"
```

### 6.3 Deploy Application
```bash
# Apply deployment
kubectl apply -f k8s/deployment.yaml -n invoice-generator

# Check deployment status
kubectl get pods -n invoice-generator
kubectl get services -n invoice-generator
```

## Step 7: Configure Ingress

### 7.1 Reserve Static IP
```bash
# Reserve static IP
gcloud compute addresses create invoice-generator-ip \
  --region=us-central1

# Get the IP address
gcloud compute addresses describe invoice-generator-ip \
  --region=us-central1 \
  --format="value(address)"
```

### 7.2 Update Ingress Configuration
Update the `k8s/deployment.yaml` file with your domain name and apply:
```bash
kubectl apply -f k8s/deployment.yaml -n invoice-generator
```

### 7.3 Configure DNS
Point your domain to the reserved static IP address.

## Step 8: Monitoring and Logging

### 8.1 Enable Cloud Monitoring
```bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com

# Enable logging
gcloud services enable logging.googleapis.com
```

### 8.2 Deploy Monitoring Stack
```bash
# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Install Grafana
helm install grafana grafana/grafana \
  --namespace monitoring \
  --set adminPassword=YOUR_GRAFANA_PASSWORD
```

## Step 9: Testing

### 9.1 Health Check
```bash
# Test health endpoint
curl https://your-domain.com/api/v1/health
```

### 9.2 Send Test Event
```bash
# Create test topic
kubectl exec -it kafka-0 -n kafka -- kafka-topics.sh \
  --create \
  --topic invoice-events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# Send test message
kubectl exec -it kafka-0 -n kafka -- kafka-console-producer.sh \
  --topic invoice-events \
  --bootstrap-server localhost:9092
```

## Step 10: Production Considerations

### 10.1 Security
- Use Workload Identity instead of service account keys
- Enable network policies
- Use private GKE cluster
- Configure VPC firewall rules

### 10.2 Scaling
- Configure Horizontal Pod Autoscaler
- Set up cluster autoscaling
- Monitor resource usage

### 10.3 Backup
- Set up automated database backups
- Configure disaster recovery procedures
- Test restore procedures

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   kubectl exec -it deployment/invoice-generator-service -n invoice-generator -- \
     nc -zv YOUR_DB_HOST 5432
   ```

2. **Kafka Connection Issues**
   ```bash
   # Check Kafka connectivity
   kubectl exec -it deployment/invoice-generator-service -n invoice-generator -- \
     nc -zv kafka.kafka.svc.cluster.local 9092
   ```

3. **GCP Storage Issues**
   ```bash
   # Check service account permissions
   gcloud projects get-iam-policy YOUR_PROJECT_ID \
     --flatten="bindings[].members" \
     --filter="bindings.members:invoice-generator-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com"
   ```

### Useful Commands

```bash
# View logs
kubectl logs -f deployment/invoice-generator-service -n invoice-generator

# Port forward for local testing
kubectl port-forward svc/invoice-generator-service 8080:8080 -n invoice-generator

# Access shell
kubectl exec -it deployment/invoice-generator-service -n invoice-generator -- /bin/bash

# Check events
kubectl get events -n invoice-generator --sort-by='.lastTimestamp'
```

## Cost Optimization

1. **Use preemptible nodes for development**
2. **Set up resource quotas**
3. **Monitor and optimize resource requests/limits**
4. **Use committed use discounts for production workloads**

## Support

For issues and questions:
- Check the application logs
- Review GCP Cloud Logging
- Consult the troubleshooting section
- Create an issue in the repository 