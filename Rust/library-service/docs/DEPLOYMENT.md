# Deployment Guide

This guide covers deploying the Library Service to both local Kubernetes (kind) and AWS.

## Table of Contents

1. [Local Deployment with Kind](#local-deployment-with-kind)
2. [AWS Deployment](#aws-deployment)
3. [Troubleshooting](#troubleshooting)

## Local Deployment with Kind

Kind (Kubernetes in Docker) allows you to run a full Kubernetes cluster locally for testing.

### Prerequisites

- Docker installed and running
- kubectl installed
- kind installed ([installation guide](https://kind.sigs.k8s.io/docs/user/quick-start/#installation))

### Step 1: Create Kind Cluster

```bash
kind create cluster --name library-service
```

Verify the cluster is running:
```bash
kubectl cluster-info --context kind-library-service
```

### Step 2: Build Docker Image

Build the Docker image:
```bash
docker build -t library-service:latest .
```

Load the image into kind:
```bash
kind load docker-image library-service:latest --name library-service
```

### Step 3: Deploy Dependencies

Deploy in order:

1. **Namespace**:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **PostgreSQL**:
   ```bash
   kubectl apply -f k8s/postgres-deployment.yaml
   ```
   
   Wait for PostgreSQL to be ready:
   ```bash
   kubectl wait --for=condition=ready pod -l app=postgres -n library-service --timeout=120s
   ```

3. **Kafka and Zookeeper**:
   ```bash
   kubectl apply -f k8s/kafka-deployment.yaml
   ```
   
   Wait for Kafka to be ready:
   ```bash
   kubectl wait --for=condition=ready pod -l app=kafka -n library-service --timeout=120s
   ```

### Step 4: Deploy Application

1. **ConfigMap**:
   ```bash
   kubectl apply -f k8s/configmap.yaml
   ```

2. **Application**:
   ```bash
   kubectl apply -f k8s/app-deployment.yaml
   ```

3. **Ingress** (optional, for external access):
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

### Step 5: Verify Deployment

Check pod status:
```bash
kubectl get pods -n library-service
```

Check service:
```bash
kubectl get svc -n library-service
```

View logs:
```bash
kubectl logs -f deployment/library-service -n library-service
```

### Step 6: Access the Service

#### Port Forwarding (Recommended for Testing)

Forward port 3000:
```bash
kubectl port-forward -n library-service svc/library-service 3000:80
```

Then access:
```bash
curl http://localhost:3000/health
```

#### Using Ingress

If you've deployed the ingress, add to `/etc/hosts`:
```
127.0.0.1 library-service.local
```

Then access:
```bash
curl http://library-service.local/health
```

### Step 7: Test the Deployment

Run integration tests against the deployed service:
```bash
# Set up port forwarding first
kubectl port-forward -n library-service svc/library-service 3000:80 &

# Run tests
export DATABASE_URL="postgresql://library_user:library_pass@localhost:5432/library_db"
# Note: You'll need to port-forward PostgreSQL as well for tests
kubectl port-forward -n library-service svc/postgres-service 5432:5432 &
```

### Cleanup

To remove everything:
```bash
kubectl delete namespace library-service
kind delete cluster --name library-service
```

## AWS Deployment

### Prerequisites

- AWS CLI configured
- kubectl configured for EKS (or use AWS Console)
- Docker image pushed to ECR (or Docker Hub)

### Step 1: Push Docker Image to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name library-service --region us-east-1

# Tag and push image
docker tag library-service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/library-service:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/library-service:latest
```

### Step 2: Set Up EKS Cluster

Create EKS cluster:
```bash
eksctl create cluster \
  --name library-service-cluster \
  --region us-east-1 \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3
```

### Step 3: Update Kubernetes Manifests

Update `k8s/app-deployment.yaml` to use your ECR image:
```yaml
image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/library-service:latest
imagePullPolicy: Always
```

Update `k8s/configmap.yaml` with production values:
- Database URL pointing to RDS instance
- Kafka brokers pointing to MSK cluster
- Other production configuration

### Step 4: Set Up RDS PostgreSQL

Create RDS PostgreSQL instance:
```bash
aws rds create-db-instance \
  --db-instance-identifier library-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username library_user \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <sg-id> \
  --db-subnet-group-name <subnet-group>
```

Update ConfigMap with RDS endpoint.

### Step 5: Set Up MSK Kafka

Create MSK cluster:
```bash
aws kafka create-cluster \
  --cluster-name library-kafka \
  --broker-node-group-info file://broker-info.json \
  --kafka-version "2.8.1" \
  --number-of-broker-nodes 2
```

Update ConfigMap with MSK bootstrap servers.

### Step 6: Deploy to EKS

Apply all manifests:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/app-deployment.yaml
# Skip postgres and kafka if using managed services
```

### Step 7: Set Up Load Balancer

Create LoadBalancer service or use ALB Ingress Controller:
```bash
kubectl apply -f k8s/ingress.yaml
```

### Step 8: Configure Auto-Scaling

Create HorizontalPodAutoscaler:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: library-service-hpa
  namespace: library-service
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: library-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Troubleshooting

### Pods Not Starting

Check pod status:
```bash
kubectl describe pod <pod-name> -n library-service
```

Check logs:
```bash
kubectl logs <pod-name> -n library-service
```

### Database Connection Issues

Verify database is accessible:
```bash
kubectl exec -it <postgres-pod> -n library-service -- psql -U library_user -d library_db
```

Check ConfigMap:
```bash
kubectl get configmap library-service-config -n library-service -o yaml
```

### Kafka Connection Issues

Check Kafka pods:
```bash
kubectl get pods -l app=kafka -n library-service
```

Test Kafka connectivity:
```bash
kubectl exec -it <kafka-pod> -n library-service -- kafka-topics --list --bootstrap-server localhost:9092
```

### Image Pull Errors

For kind, ensure image is loaded:
```bash
kind load docker-image library-service:latest --name library-service
```

For EKS, ensure:
- Image is in ECR
- EKS nodes have IAM role with ECR read permissions
- ImagePullPolicy is set correctly

### Health Check Failures

Check health endpoint:
```bash
kubectl exec -it <pod-name> -n library-service -- curl http://localhost:3000/health
```

Adjust liveness/readiness probe delays if startup takes longer.

## Monitoring and Observability

### View Logs

```bash
# All pods
kubectl logs -f -l app=library-service -n library-service

# Specific pod
kubectl logs -f <pod-name> -n library-service
```

### Metrics

The service exposes standard HTTP metrics. Consider integrating with Prometheus and Grafana for production monitoring.

### Health Checks

The `/health` endpoint can be used for health checks and load balancer health probes.

