# Deployment

## Infrastructure

### Cloud Platform
- **Provider**: Amazon Web Services (AWS)
- **Compute**: Amazon ECS (Elastic Container Service)
- **Container Registry**: Amazon ECR (Elastic Container Registry)
- **Load Balancing**: Application Load Balancer (ALB)
- **Service Discovery**: AWS Cloud Map
- **Networking**: VPC with private/public subnets

### Container Configuration

#### Dockerfile
```dockerfile
FROM openjdk:17-jre-slim

# Set working directory
WORKDIR /app

# Copy application JAR
COPY target/passkey-autoblock-guestside-service-*.jar app.jar

# Copy configuration files
COPY configs/ configs/

# Expose ports
EXPOSE 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/healthcheck || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar", "server", "configs/prod.yaml"]
```

#### Container Resource Limits
```yaml
# ECS Task Definition
resources:
  cpu: 1024      # 1 vCPU
  memory: 2048   # 2 GB RAM
  
limits:
  cpu: 2048      # 2 vCPU max
  memory: 4096   # 4 GB RAM max
```

## Environments

### Development Environment

#### Configuration
- **Cluster**: passkey-dev-cluster
- **Service**: passkey-autoblock-guestside-dev
- **Instances**: 1
- **CPU/Memory**: 512 CPU units / 1024 MB
- **Load Balancer**: Internal ALB
- **Domain**: `passkey-autoblock-guestside-dev.internal.cvent.com`

#### Environment Variables
```bash
ENVIRONMENT=dev
LOG_LEVEL=DEBUG
AUTH_SERVICE_URL=https://auth-service-dev.cvent.com
HOTEL_SERVICE_URL=https://passkey-hotel-dev.cvent.com
EVENT_SERVICE_URL=https://passkey-event-dev.cvent.com
INVENTORY_SERVICE_URL=https://passkey-inventory-dev.cvent.com
AUTOBLOCK_DATA_SERVICE_URL=https://passkey-autoblock-data-dev.cvent.com
BUSINESS_TEXT_SERVICE_URL=https://passkey-business-text-dev.cvent.com
RATE_LIMIT_ENABLED=false
CACHE_TTL=60
```

### Staging Environment

#### Configuration
- **Cluster**: passkey-staging-cluster
- **Service**: passkey-autoblock-guestside-staging
- **Instances**: 2
- **CPU/Memory**: 1024 CPU units / 2048 MB
- **Load Balancer**: Internal ALB with SSL
- **Domain**: `passkey-autoblock-guestside-staging.cvent.com`

#### Environment Variables
```bash
ENVIRONMENT=staging
LOG_LEVEL=INFO
AUTH_SERVICE_URL=https://auth-service-staging.cvent.com
HOTEL_SERVICE_URL=https://passkey-hotel-staging.cvent.com
EVENT_SERVICE_URL=https://passkey-event-staging.cvent.com
INVENTORY_SERVICE_URL=https://passkey-inventory-staging.cvent.com
AUTOBLOCK_DATA_SERVICE_URL=https://passkey-autoblock-data-staging.cvent.com
BUSINESS_TEXT_SERVICE_URL=https://passkey-business-text-staging.cvent.com
RATE_LIMIT_ENABLED=true
CACHE_TTL=300
```

### Production Environment

#### Configuration
- **Cluster**: passkey-prod-cluster
- **Service**: passkey-autoblock-guestside-prod
- **Instances**: 4 (Auto-scaling 2-8)
- **CPU/Memory**: 1024 CPU units / 2048 MB
- **Load Balancer**: Public ALB with SSL/TLS
- **Domain**: `passkey-autoblock-guestside.cvent.com`
- **CDN**: CloudFront distribution for static assets

#### Environment Variables
```bash
ENVIRONMENT=prod
LOG_LEVEL=INFO
AUTH_SERVICE_URL=https://auth-service.cvent.com
HOTEL_SERVICE_URL=https://passkey-hotel.cvent.com
EVENT_SERVICE_URL=https://passkey-event.cvent.com
INVENTORY_SERVICE_URL=https://passkey-inventory.cvent.com
AUTOBLOCK_DATA_SERVICE_URL=https://passkey-autoblock-data.cvent.com
BUSINESS_TEXT_SERVICE_URL=https://passkey-business-text.cvent.com
RATE_LIMIT_ENABLED=true
CACHE_TTL=900
```

#### Auto-scaling Configuration
```yaml
autoScaling:
  minCapacity: 2
  maxCapacity: 8
  targetCPUUtilization: 70
  targetMemoryUtilization: 80
  scaleUpCooldown: 300s
  scaleDownCooldown: 600s
```

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The service uses Jenkins for continuous integration and deployment:

#### Pipeline Stages

1. **Source Checkout**
   - Clone repository from GitHub
   - Checkout specific branch/tag
   - Validate Jenkinsfile syntax

2. **Build & Test**
   ```groovy
   stage('Build & Test') {
       steps {
           sh 'mvn clean compile'
           sh 'mvn test'
           sh 'mvn package -Prelease'
       }
       post {
           always {
               publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
               publishHTML([
                   allowMissing: false,
                   alwaysLinkToLastBuild: true,
                   keepAll: true,
                   reportDir: 'target/site/jacoco',
                   reportFiles: 'index.html',
                   reportName: 'Code Coverage Report'
               ])
           }
       }
   }
   ```

3. **Code Quality**
   ```groovy
   stage('Code Quality') {
       steps {
           sh 'mvn checkstyle:check'
           sh 'mvn jacoco:check -Pcoverage'
       }
   }
   ```

4. **Integration Tests**
   ```groovy
   stage('Integration Tests') {
       steps {
           sh 'mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify'
       }
   }
   ```

5. **Docker Build**
   ```groovy
   stage('Docker Build') {
       steps {
           script {
               def image = docker.build("passkey-autoblock-guestside:${env.BUILD_NUMBER}")
               docker.withRegistry('https://your-ecr-registry', 'ecr-credentials') {
                   image.push()
                   image.push('latest')
               }
           }
       }
   }
   ```

6. **Deploy to Development**
   ```groovy
   stage('Deploy to Dev') {
       when { branch 'develop' }
       steps {
           sh './deploy.sh dev ${BUILD_NUMBER}'
       }
   }
   ```

7. **Deploy to Staging**
   ```groovy
   stage('Deploy to Staging') {
       when { branch 'master' }
       steps {
           sh './deploy.sh staging ${BUILD_NUMBER}'
       }
   }
   ```

8. **Production Deployment**
   ```groovy
   stage('Deploy to Production') {
       when { 
           allOf {
               branch 'master'
               expression { params.DEPLOY_TO_PROD == true }
           }
       }
       steps {
           input message: 'Deploy to Production?', ok: 'Deploy'
           sh './deploy.sh prod ${BUILD_NUMBER}'
       }
   }
   ```

### Deployment Scripts

#### deploy.sh
```bash
#!/bin/bash

ENVIRONMENT=$1
BUILD_NUMBER=$2

echo "Deploying to $ENVIRONMENT environment..."

# Update ECS service with new task definition
aws ecs update-service \
    --cluster passkey-${ENVIRONMENT}-cluster \
    --service passkey-autoblock-guestside-${ENVIRONMENT} \
    --task-definition passkey-autoblock-guestside-${ENVIRONMENT}:${BUILD_NUMBER} \
    --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster passkey-${ENVIRONMENT}-cluster \
    --services passkey-autoblock-guestside-${ENVIRONMENT}

echo "Deployment to $ENVIRONMENT completed successfully"
```

## Configuration Management

### Hogan Templates Integration

The service uses Hogan templates for configuration management:

#### Template Directory Structure
```
passkey-autoblock-guestside-service/configs/
├── templates/
│   ├── dev.yaml.hogan
│   ├── staging.yaml.hogan
│   └── prod.yaml.hogan
└── generated/
    ├── dev.yaml
    ├── staging.yaml
    └── prod.yaml
```

#### Template Processing
Configuration templates are processed during deployment to inject environment-specific values:

```yaml
# Template: configs/templates/prod.yaml.hogan
server:
  applicationConnectors:
    - type: http
      port: {{SERVER_PORT}}

autoblockGuestside:
  hotelService:
    baseUrl: "{{HOTEL_SERVICE_URL}}"
    timeout: {{SERVICE_TIMEOUT}}
```

### Secret Management

#### AWS Secrets Manager Integration
Sensitive configuration values stored in AWS Secrets Manager:

```json
{
  "auth-service-credentials": {
    "clientId": "passkey-autoblock-guestside",
    "clientSecret": "encrypted-secret-value"
  },
  "database-credentials": {
    "username": "service-user",
    "password": "encrypted-password"
  }
}
```

#### Environment Variable Injection
Secrets injected as environment variables during container startup:

```bash
# ECS Task Definition
environment:
  - name: AUTH_CLIENT_SECRET
    valueFrom: arn:aws:secretsmanager:region:account:secret:auth-service-credentials
```

## Rollback Procedures

### Automated Rollback

#### Health Check Failure Rollback
```bash
#!/bin/bash
# rollback.sh

ENVIRONMENT=$1
PREVIOUS_TASK_DEFINITION=$2

echo "Rolling back $ENVIRONMENT to previous version..."

# Revert to previous task definition
aws ecs update-service \
    --cluster passkey-${ENVIRONMENT}-cluster \
    --service passkey-autoblock-guestside-${ENVIRONMENT} \
    --task-definition $PREVIOUS_TASK_DEFINITION

# Wait for rollback to complete
aws ecs wait services-stable \
    --cluster passkey-${ENVIRONMENT}-cluster \
    --services passkey-autoblock-guestside-${ENVIRONMENT}

echo "Rollback completed"
```

### Manual Rollback Process

1. **Identify Issue**: Monitor alerts and logs to identify deployment issues
2. **Stop Current Deployment**: Cancel ongoing deployment if in progress
3. **Revert Service**: Update ECS service to previous stable task definition
4. **Verify Rollback**: Confirm service health and functionality
5. **Notify Team**: Alert team of rollback and investigation status

### Blue-Green Deployment

For zero-downtime deployments in production:

1. **Blue Environment**: Current production environment
2. **Green Environment**: New version deployed to parallel environment
3. **Traffic Switch**: Load balancer switches traffic to green environment
4. **Validation**: Monitor green environment for issues
5. **Cleanup**: Terminate blue environment after successful validation

## Monitoring & Alerting

### CloudWatch Metrics

#### Application Metrics
- Request count and latency
- Error rates by endpoint
- Service dependency response times
- Cache hit/miss ratios

#### Infrastructure Metrics
- CPU and memory utilization
- Network I/O
- Container health status
- Load balancer metrics

### Alerting Rules

#### Critical Alerts
- Service unavailable (5xx errors > 5%)
- High response time (p95 > 2 seconds)
- Memory usage > 90%
- CPU usage > 85%

#### Warning Alerts
- Error rate > 1%
- Response time degradation
- Cache miss rate > 50%
- Dependency service issues

### Log Aggregation

#### CloudWatch Logs Configuration
```json
{
  "logDriver": "awslogs",
  "options": {
    "awslogs-group": "/ecs/passkey-autoblock-guestside",
    "awslogs-region": "us-east-1",
    "awslogs-stream-prefix": "ecs"
  }
}
```

#### Log Retention
- **Development**: 7 days
- **Staging**: 30 days  
- **Production**: 90 days

## Disaster Recovery

### Backup Strategy
- Configuration backups stored in S3
- Container images retained in ECR
- Database backups (if applicable) automated daily

### Recovery Procedures
1. **Service Failure**: Auto-scaling and health checks handle instance failures
2. **Regional Outage**: Multi-AZ deployment provides regional resilience
3. **Complete Disaster**: Cross-region backup and recovery procedures documented

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 15 minutes
- **Recovery Point Objective (RPO)**: 5 minutes
- **Availability Target**: 99.9% uptime