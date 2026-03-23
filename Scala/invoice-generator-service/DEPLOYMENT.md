# Deployment Guide

Step-by-step instructions for deploying the Invoice Generator Service to Kubernetes.

## Prerequisites

- Kubernetes cluster (1.24+)
- `kubectl` configured with cluster access
- Docker (or compatible) for building images
- Container registry accessible from the cluster
- PostgreSQL database accessible from the cluster
- Kafka cluster accessible from the cluster
- GCS bucket (or compatible object storage) for PDF storage

## 1. Build the Docker Image

```bash
# Build the image
docker build -t invoice-generator-service:latest .

# Tag for your registry
docker tag invoice-generator-service:latest <registry>/invoice-generator-service:<version>

# Push to registry
docker push <registry>/invoice-generator-service:<version>
```

The Dockerfile uses a multi-stage build:
1. **Builder stage**: Compiles the Scala project into a fat JAR via `sbt assembly`
2. **Runtime stage**: Runs on `eclipse-temurin:17-jre` (minimal JRE image)

## 2. Configure Secrets

Create a Kubernetes Secret with database credentials. Do **not** commit real credentials to version control.

```bash
kubectl create secret generic invoice-generator-secrets \
  --from-literal=APP_DATABASE_URL="jdbc:postgresql://<db-host>:5432/invoice_generator" \
  --from-literal=APP_DATABASE_USERNAME="<username>" \
  --from-literal=APP_DATABASE_PASSWORD="<password>"
```

Alternatively, apply the template from `k8s/config.yaml` after editing the placeholder values:

```bash
kubectl apply -f k8s/config.yaml
```

## 3. Configure the ConfigMap

Edit `k8s/config.yaml` to match your environment:

```yaml
data:
  APP_KAFKA_BOOTSTRAP_SERVERS: "kafka-broker:9092"    # Your Kafka bootstrap servers
  APP_GCP_PROJECT_ID: "your-gcp-project"              # Your GCP project
  APP_GCP_BUCKET_NAME: "your-invoice-bucket"          # Your GCS bucket
  APP_TELEMETRY_ENABLED: "true"                       # Enable if Jaeger is deployed
  APP_TELEMETRY_ENDPOINT: "http://jaeger:4317"        # Your Jaeger OTLP endpoint
```

For production, remove `APP_GCP_ENDPOINT` (the fake-gcs-server endpoint) so the service connects to real GCS.

Apply the ConfigMap:

```bash
kubectl apply -f k8s/config.yaml
```

## 4. Update the Deployment Image

Edit `k8s/deployment.yaml` to reference your container registry:

```yaml
containers:
  - name: invoice-generator-service
    image: <registry>/invoice-generator-service:<version>
```

## 5. Deploy

```bash
# Apply all manifests
kubectl apply -f k8s/

# Verify the deployment
kubectl rollout status deployment/invoice-generator-service

# Check pods are running
kubectl get pods -l app=invoice-generator-service
```

## 6. Verify the Deployment

### Health check

```bash
# Port-forward to test locally
kubectl port-forward svc/invoice-generator-service 8080:80

# Check health
curl http://localhost:8080/api/v1/health
```

Expected response:
```json
{"status": "UP", "message": "Invoice Generator Service is running"}
```

### Check logs

```bash
kubectl logs -l app=invoice-generator-service -f
```

On startup, you should see:
- `Starting Invoice Generator Service`
- Flyway migration output
- `Starting HTTP server on 0.0.0.0:8080`
- `Starting Kafka consumer for topic: invoice-events`

### Swagger UI

Port-forward and open `http://localhost:8080/docs` to browse the API documentation.

## 7. Viewing Traces (Optional)

If telemetry is enabled and Jaeger is deployed:

```bash
kubectl port-forward svc/jaeger 16686:16686
```

Open `http://localhost:16686` and select `invoice-generator-service` from the service dropdown to view traces for invoice processing workflows.

## Resource Configuration

The default resource configuration in `k8s/deployment.yaml`:

| Resource | Request | Limit |
|---|---|---|
| Memory | 512Mi | 1Gi |
| CPU | 250m | 500m |

Adjust based on your workload. The service runs on the JVM, so memory limits should account for heap + metaspace overhead.

## Scaling

The deployment runs 2 replicas by default. Kafka consumer group rebalancing distributes partitions across replicas automatically.

```bash
# Scale replicas
kubectl scale deployment/invoice-generator-service --replicas=3
```

For autoscaling, configure a HorizontalPodAutoscaler based on CPU or custom metrics.

## Database Migrations

Flyway migrations run automatically on application startup. The migration file (`V1__Create_invoices_table.sql`) creates the `invoices` table with required indexes. Subsequent schema changes should follow the Flyway naming convention (`V2__description.sql`, etc.) in `src/main/resources/db/migration/`.

## GCS Bucket Setup

Create the GCS bucket before deployment:

```bash
gsutil mb -p <project-id> -l <region> gs://<bucket-name>/
```

For non-GCP environments, configure `APP_GCP_ENDPOINT` to point to an S3-compatible storage with a GCS adapter.

## Troubleshooting

**Pod fails to start / CrashLoopBackOff:**
- Check logs: `kubectl logs <pod-name>`
- Verify database connectivity and credentials
- Ensure Flyway migrations can reach the database

**No events being processed:**
- Verify Kafka connectivity: check `APP_KAFKA_BOOTSTRAP_SERVERS`
- Ensure the `invoice-events` topic exists
- Check consumer group lag via Kafka monitoring tools

**PDF generation succeeds but download fails:**
- Verify GCS bucket exists and service has write access
- Check `APP_GCP_BUCKET_NAME` and `APP_GCP_PROJECT_ID`
- For non-GCP setups, ensure `APP_GCP_ENDPOINT` points to the correct storage endpoint
