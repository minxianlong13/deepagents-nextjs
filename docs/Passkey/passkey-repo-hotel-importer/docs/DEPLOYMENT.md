# Deployment

## Infrastructure

The Passkey Hotel Importer is deployed on AWS using containerized infrastructure with the following components:

### AWS Services
- **ECS (Elastic Container Service)** - Container orchestration
- **Application Load Balancer** - Traffic distribution and SSL termination
- **RDS Oracle** - Managed database service
- **S3** - Media asset storage
- **CloudWatch** - Logging and monitoring
- **Route 53** - DNS management
- **AWS CDK** - Infrastructure as Code

### Container Platform
- **Docker** - Application containerization
- **ECR (Elastic Container Registry)** - Container image storage
- **ECS Fargate** - Serverless container compute

## Environments

### Development Environment
- **URL**: `https://passkey-hotel-importer-dev.cvent.com`
- **ECS Cluster**: `passkey-dev-cluster`
- **Database**: `passkey-hotel-importer-dev.cluster-xyz.us-east-1.rds.amazonaws.com`
- **S3 Bucket**: `passkey-hotel-media-dev`
- **Resources**: 
  - CPU: 0.5 vCPU
  - Memory: 1 GB
  - Instances: 1

### Staging Environment
- **URL**: `https://passkey-hotel-importer-staging.cvent.com`
- **ECS Cluster**: `passkey-staging-cluster`
- **Database**: `passkey-hotel-importer-staging.cluster-xyz.us-east-1.rds.amazonaws.com`
- **S3 Bucket**: `passkey-hotel-media-staging`
- **Resources**:
  - CPU: 1 vCPU
  - Memory: 2 GB
  - Instances: 2

### Production Environment
- **URL**: `https://passkey-hotel-importer.cvent.com`
- **ECS Cluster**: `passkey-prod-cluster`
- **Database**: `passkey-hotel-importer-prod.cluster-xyz.us-east-1.rds.amazonaws.com`
- **S3 Bucket**: `passkey-hotel-media-prod`
- **Resources**:
  - CPU: 2 vCPU
  - Memory: 4 GB
  - Instances: 3 (with auto-scaling)

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The deployment pipeline is defined in the `Jenkinsfile` and uses Cvent's standard pipeline library:

```groovy
buildPipeline([
    label: 'ecs-x86-medium',
    packageFilter: 'root-only',
    stablePrereleaseId: true,
    parallelValidate: false,
    enableNxVerifyDeploy: true,
    awsUser: 'cdk'
])
```

### Pipeline Stages

1. **Source Checkout**
   - Clone repository from GitHub
   - Checkout specific branch/tag

2. **Build & Test**
   - Install dependencies with pnpm
   - Run Maven build
   - Execute unit tests
   - Generate test reports

3. **Code Quality**
   - SonarQube analysis
   - Checkmarx security scan
   - Code coverage validation

4. **Package**
   - Build Docker image
   - Tag with build number
   - Push to ECR

5. **Deploy**
   - Deploy to target environment
   - Run health checks
   - Update load balancer targets

6. **Verification**
   - Integration tests
   - Smoke tests
   - Performance validation

### Branch Strategy

- **master** - Production deployments
- **development** - Development environment deployments
- **feature/** - Feature branch builds (no deployment)

## Configuration Management

### Environment-Specific Configuration

Configuration is managed through environment-specific YAML files:

```
configs/
├── dev.yaml      # Development configuration
├── staging.yaml  # Staging configuration
└── prod.yaml     # Production configuration
```

### Secret Management

Sensitive configuration is managed through AWS Systems Manager Parameter Store:

- Database credentials
- OAuth client secrets
- AWS access keys
- External service API keys

### Configuration Deployment

1. Configuration files are packaged with the application
2. Environment variables override file-based configuration
3. Secrets are injected at runtime from Parameter Store

## Container Configuration

### Dockerfile

```dockerfile
FROM openjdk:17-jre-slim

# Install required packages
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create application user
RUN useradd -r -s /bin/false appuser

# Set working directory
WORKDIR /app

# Copy application files
COPY target/passkey-hotel-importer-*.jar app.jar
COPY configs/ configs/

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to application user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### ECS Task Definition

```json
{
  "family": "passkey-hotel-importer",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "passkey-hotel-importer",
      "image": "account.dkr.ecr.us-east-1.amazonaws.com/passkey-hotel-importer:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SPRING_PROFILES_ACTIVE",
          "value": "prod"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:ssm:us-east-1:account:parameter/passkey-hotel-importer/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/passkey-hotel-importer",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Rollback Procedures

### Automated Rollback

The deployment pipeline includes automated rollback triggers:

1. **Health Check Failures** - Automatic rollback if health checks fail
2. **Error Rate Threshold** - Rollback if error rate exceeds 5%
3. **Response Time Degradation** - Rollback if response time increases by 50%

### Manual Rollback

For manual rollback situations:

1. **Identify Previous Version**
   ```bash
   aws ecs list-tasks --cluster passkey-prod-cluster --service-name passkey-hotel-importer
   ```

2. **Update Service**
   ```bash
   aws ecs update-service \
     --cluster passkey-prod-cluster \
     --service passkey-hotel-importer \
     --task-definition passkey-hotel-importer:PREVIOUS_REVISION
   ```

3. **Monitor Rollback**
   ```bash
   aws ecs wait services-stable \
     --cluster passkey-prod-cluster \
     --services passkey-hotel-importer
   ```

### Database Rollback

Database changes are managed through Flyway migrations:

1. **Identify Migration Version**
   ```sql
   SELECT * FROM flyway_schema_history ORDER BY installed_on DESC;
   ```

2. **Rollback Migration** (if supported)
   ```bash
   mvn flyway:undo -Dflyway.target=VERSION
   ```

## Monitoring & Alerting

### Health Checks

- **Application Health**: `/actuator/health`
- **Database Connectivity**: Custom health indicator
- **External Services**: Dependency health checks

### Monitoring Dashboards

- **DataDog Dashboard**: Service metrics and performance
- **CloudWatch Dashboard**: Infrastructure metrics
- **Application Logs**: Centralized logging with search

### Alert Configuration

| Alert | Threshold | Action |
|-------|-----------|--------|
| High Error Rate | >5% for 5 minutes | Page on-call engineer |
| High Response Time | >2s average for 10 minutes | Slack notification |
| Memory Usage | >80% for 15 minutes | Slack notification |
| Database Connection | Connection failures | Page on-call engineer |

## Scaling Configuration

### Auto Scaling

ECS service is configured with auto-scaling based on:

- **CPU Utilization**: Scale out at 70%, scale in at 30%
- **Memory Utilization**: Scale out at 80%, scale in at 40%
- **Request Count**: Scale out at 1000 requests/minute per instance

### Scaling Limits

- **Minimum Instances**: 2 (production), 1 (staging/dev)
- **Maximum Instances**: 10 (production), 3 (staging), 1 (dev)
- **Scale Out Cooldown**: 300 seconds
- **Scale In Cooldown**: 600 seconds

## Disaster Recovery

### Backup Strategy

- **Database**: Automated daily backups with 30-day retention
- **S3 Media**: Cross-region replication to us-west-2
- **Configuration**: Version controlled in Git

### Recovery Procedures

1. **Database Recovery**
   - Restore from RDS automated backup
   - Point-in-time recovery available

2. **Application Recovery**
   - Deploy from known good image
   - Restore configuration from Git

3. **Media Recovery**
   - Restore from S3 cross-region replica
   - Update CDN distribution

### RTO/RPO Targets

- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Data Loss Tolerance**: Minimal (< 15 minutes)