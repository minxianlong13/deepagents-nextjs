# Deployment

## Infrastructure

The Passkey Event Housing Service is deployed on Cvent's cloud infrastructure using containerized deployment with Docker and orchestrated through Jenkins CI/CD pipelines.

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│  Application    │────│   Couchbase     │
│                 │    │   Instances     │    │   Cluster       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Monitoring    │    │   Auth Service  │    │  External APIs  │
│   (Datadog)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Cloud Platform
- **Provider**: AWS (Amazon Web Services)
- **Container Orchestration**: ECS (Elastic Container Service)
- **Load Balancing**: Application Load Balancer (ALB)
- **Service Discovery**: AWS Service Discovery
- **Networking**: VPC with private subnets

## Environments

### Development Environment
- **URL**: `https://passkey-event-housing-service.dev.cvent.org`
- **Purpose**: Development and feature testing
- **Database**: Couchbase development cluster
- **Monitoring**: Basic monitoring enabled
- **Auto-scaling**: Disabled
- **Instance Count**: 1-2 instances

**Configuration**:
```yaml
environment: dev
server:
  applicationConnectors:
    - type: http
      port: 8080
couchbase:
  connectionString: "couchbase://dev-couchbase.cvent.org"
  bucket: "passkey-event-housing-dev"
logging:
  level: DEBUG
```

### Staging Environment
- **URL**: `https://passkey-event-housing-service.staging.cvent.org`
- **Purpose**: Pre-production testing and validation
- **Database**: Couchbase staging cluster (production-like data)
- **Monitoring**: Full monitoring enabled
- **Auto-scaling**: Limited scaling (2-4 instances)
- **Load Testing**: Performance testing environment

**Configuration**:
```yaml
environment: staging
server:
  applicationConnectors:
    - type: http
      port: 8080
couchbase:
  connectionString: "couchbase://staging-couchbase.cvent.org"
  bucket: "passkey-event-housing-staging"
logging:
  level: INFO
metrics:
  reporters:
    - type: datadog
      frequency: 1 minute
```

### Production Environment
- **URL**: `https://passkey-event-housing-service.cvent.org`
- **Purpose**: Live production service
- **Database**: Couchbase production cluster with replication
- **Monitoring**: Comprehensive monitoring and alerting
- **Auto-scaling**: Full auto-scaling (4-20 instances)
- **High Availability**: Multi-AZ deployment

**Configuration**:
```yaml
environment: production
server:
  applicationConnectors:
    - type: http
      port: 8080
couchbase:
  connectionString: "couchbase://prod-couchbase.cvent.org"
  bucket: "passkey-event-housing-prod"
  connectTimeout: 10s
  kvTimeout: 2500ms
logging:
  level: INFO
metrics:
  reporters:
    - type: datadog
      frequency: 30s
```

## CI/CD Pipeline

### Jenkins Pipeline Overview
The service uses a Jenkins-based CI/CD pipeline defined in the `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
                sh 'mvn -Pcoverage test'
            }
        }
        
        stage('Package') {
            steps {
                sh 'mvn package -Prelease'
            }
        }
        
        stage('Docker Build') {
            steps {
                sh 'docker build -t passkey-event-housing:${BUILD_NUMBER} .'
            }
        }
        
        stage('Deploy to Dev') {
            when { branch 'develop' }
            steps {
                sh './deploy.sh dev'
            }
        }
        
        stage('Deploy to Staging') {
            when { branch 'master' }
            steps {
                sh './deploy.sh staging'
            }
        }
        
        stage('Deploy to Production') {
            when { 
                allOf {
                    branch 'master'
                    expression { params.DEPLOY_TO_PROD == true }
                }
            }
            steps {
                sh './deploy.sh production'
            }
        }
    }
}
```

### Build Process

#### 1. Source Code Checkout
- Code is checked out from the GitHub repository
- Branch-specific builds are triggered automatically

#### 2. Compilation and Testing
```bash
# Compile source code
mvn clean compile

# Run unit tests
mvn test

# Generate code coverage report
mvn -Pcoverage test

# Run integration tests (if enabled)
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
```

#### 3. Quality Gates
- **Code Coverage**: Minimum 80% code coverage required
- **Static Analysis**: SonarQube analysis for code quality
- **Security Scan**: Dependency vulnerability scanning
- **Style Check**: Checkstyle validation

#### 4. Artifact Creation
```bash
# Create deployable JAR
mvn package -Prelease

# Build Docker image
docker build -t passkey-event-housing:${VERSION} .

# Push to container registry
docker push cvent-registry/passkey-event-housing:${VERSION}
```

### Deployment Scripts

#### Build Script (`build.sh`)
```bash
#!/bin/bash
set -e

echo "Building Passkey Event Housing Service..."

# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package application
mvn package -Prelease

echo "Build completed successfully"
```

#### Release Build Script (`build-release.sh`)
```bash
#!/bin/bash
set -e

VERSION=${1:-$(date +%Y%m%d-%H%M%S)}

echo "Building release version: $VERSION"

# Build with release profile
mvn clean package -Prelease -Drevision=$VERSION

# Build Docker image
docker build -t passkey-event-housing:$VERSION .

# Tag and push to registry
docker tag passkey-event-housing:$VERSION cvent-registry/passkey-event-housing:$VERSION
docker push cvent-registry/passkey-event-housing:$VERSION

echo "Release $VERSION built and pushed successfully"
```

#### Deployment Script (`dropkick.sh`)
```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
VERSION=${2:-latest}

echo "Deploying to $ENVIRONMENT environment..."

# Update ECS service with new image
aws ecs update-service \
    --cluster passkey-$ENVIRONMENT \
    --service passkey-event-housing-service \
    --task-definition passkey-event-housing-$ENVIRONMENT:$VERSION \
    --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster passkey-$ENVIRONMENT \
    --services passkey-event-housing-service

echo "Deployment to $ENVIRONMENT completed successfully"
```

## Configuration Management

### Environment-Specific Configuration
Configuration files are managed through the Hogan templating system:

#### Template Structure
```
passkey-event-housing-service/configs/
├── dev.yaml
├── staging.yaml
├── prod.yaml
└── templates/
    ├── base.yaml.hogan
    ├── dev.yaml.hogan
    ├── staging.yaml.hogan
    └── prod.yaml.hogan
```

#### Configuration Template Example
```yaml
# base.yaml.hogan
server:
  applicationConnectors:
    - type: http
      port: {{server.port}}
  adminConnectors:
    - type: http
      port: {{server.adminPort}}

couchbase:
  connectionString: "{{couchbase.connectionString}}"
  username: "{{couchbase.username}}"
  password: "{{couchbase.password}}"
  bucket: "{{couchbase.bucket}}"

auth:
  serviceUrl: "{{auth.serviceUrl}}"
  clientId: "{{auth.clientId}}"
  clientSecret: "{{auth.clientSecret}}"
```

### Secret Management
- **AWS Secrets Manager**: Database credentials and API keys
- **Environment Variables**: Non-sensitive configuration
- **Encrypted Configuration**: Sensitive values encrypted at rest

### Configuration Validation
```bash
# Validate configuration before deployment
java -jar passkey-event-housing-service.jar check configs/prod.yaml
```

## Rollback Procedures

### Automated Rollback
The deployment system supports automated rollback in case of deployment failures:

```bash
#!/bin/bash
# rollback.sh

ENVIRONMENT=${1:-staging}
PREVIOUS_VERSION=${2}

echo "Rolling back $ENVIRONMENT to version $PREVIOUS_VERSION"

# Revert to previous task definition
aws ecs update-service \
    --cluster passkey-$ENVIRONMENT \
    --service passkey-event-housing-service \
    --task-definition passkey-event-housing-$ENVIRONMENT:$PREVIOUS_VERSION

# Monitor rollback
aws ecs wait services-stable \
    --cluster passkey-$ENVIRONMENT \
    --services passkey-event-housing-service

echo "Rollback completed successfully"
```

### Manual Rollback Steps
1. **Identify Issue**: Monitor alerts and logs to identify deployment issues
2. **Stop Traffic**: Temporarily route traffic away from affected instances
3. **Revert Deployment**: Use rollback script or manual ECS service update
4. **Verify Health**: Confirm service health checks pass
5. **Restore Traffic**: Gradually restore traffic to rolled-back instances
6. **Post-Incident**: Document incident and improve deployment process

### Rollback Triggers
- **Health Check Failures**: Automatic rollback if health checks fail
- **Error Rate Spike**: Rollback if error rate exceeds threshold
- **Performance Degradation**: Rollback if response times increase significantly
- **Manual Trigger**: Operations team can trigger manual rollback

## Monitoring and Alerting

### Health Monitoring
- **Application Health**: `/admin/health` endpoint monitoring
- **Database Health**: Couchbase cluster monitoring
- **Dependency Health**: Auth service and external API monitoring

### Performance Monitoring
- **Response Times**: P50, P95, P99 response time tracking
- **Throughput**: Requests per second monitoring
- **Error Rates**: 4xx and 5xx error rate tracking
- **Resource Usage**: CPU, memory, and disk usage monitoring

### Alerting Rules
```yaml
# Example Datadog alert configuration
alerts:
  - name: "High Error Rate"
    query: "avg(last_5m):sum:passkey.event.housing.errors{env:production} > 10"
    message: "Error rate is above threshold"
    
  - name: "High Response Time"
    query: "avg(last_5m):avg:passkey.event.housing.response_time{env:production} > 1000"
    message: "Response time is above 1 second"
    
  - name: "Service Down"
    query: "avg(last_2m):avg:passkey.event.housing.health{env:production} < 1"
    message: "Service health check failing"
```

### Deployment Verification
Post-deployment verification includes:
1. **Health Check Validation**: Ensure all health checks pass
2. **Smoke Tests**: Run basic functionality tests
3. **Performance Baseline**: Verify performance metrics are within expected ranges
4. **Integration Tests**: Validate external service integrations
5. **Canary Analysis**: Monitor canary deployment metrics

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated Couchbase backups every 6 hours
- **Configuration Backups**: Version-controlled configuration files
- **Application Artifacts**: Immutable Docker images stored in registry

### Recovery Procedures
1. **Service Recovery**: Redeploy from known good Docker image
2. **Database Recovery**: Restore from most recent backup
3. **Configuration Recovery**: Restore from version control
4. **Full Environment Recovery**: Automated infrastructure provisioning

### Recovery Time Objectives
- **RTO (Recovery Time Objective)**: 30 minutes
- **RPO (Recovery Point Objective)**: 6 hours (database backup frequency)
- **Service Availability**: 99.9% uptime target