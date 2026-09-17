# Deployment

## Infrastructure

### AWS Services
- **Compute**: Amazon ECS (Elastic Container Service)
- **Database**: Amazon DynamoDB
- **Networking**: Application Load Balancer (ALB)
- **Monitoring**: CloudWatch, Datadog
- **Security**: IAM roles and policies
- **Configuration**: AWS Systems Manager Parameter Store

### Container Orchestration
- **Platform**: Amazon ECS with Fargate
- **Service Discovery**: AWS Cloud Map
- **Load Balancing**: Application Load Balancer with health checks
- **Auto Scaling**: Target tracking scaling policies

### Network Architecture
```
Internet Gateway
    ↓
Application Load Balancer
    ↓
ECS Service (Multiple AZs)
    ↓
DynamoDB (Multi-AZ)
```

## Environments

### Development (dev)
- **URL**: `https://passkey-delphifdc-service.dev.cvent.com`
- **ECS Cluster**: `passkey-dev-cluster`
- **Task Definition**: `passkey-delphifdc-service-dev`
- **Desired Count**: 1 instance
- **CPU/Memory**: 0.25 vCPU, 512 MB RAM
- **DynamoDB**: On-demand billing mode
- **Monitoring**: Basic CloudWatch metrics

**Configuration**:
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  region: us-east-1
  endpoint: https://dynamodb.us-east-1.amazonaws.com

auth:
  endpoint: https://auth-service.dev.cvent.com
  
externalServices:
  amadeusIntegration:
    endpoint: https://amadeus-integration.dev.cvent.com
  eventHousing:
    endpoint: https://passkey-event-housing.dev.cvent.com
```

### Staging (staging)
- **URL**: `https://passkey-delphifdc-service.staging.cvent.com`
- **ECS Cluster**: `passkey-staging-cluster`
- **Task Definition**: `passkey-delphifdc-service-staging`
- **Desired Count**: 2 instances
- **CPU/Memory**: 0.5 vCPU, 1024 MB RAM
- **DynamoDB**: Provisioned throughput (5 RCU/WCU)
- **Monitoring**: Enhanced CloudWatch + Datadog

**Load Balancer Configuration**:
- Health check path: `/health`
- Health check interval: 30 seconds
- Healthy threshold: 2 consecutive checks
- Unhealthy threshold: 3 consecutive checks

### Production (prod)
- **URL**: `https://passkey-delphifdc-service.prod.cvent.com`
- **ECS Cluster**: `passkey-prod-cluster`
- **Task Definition**: `passkey-delphifdc-service-prod`
- **Desired Count**: 3 instances (minimum), 10 instances (maximum)
- **CPU/Memory**: 1 vCPU, 2048 MB RAM
- **DynamoDB**: Provisioned throughput with auto-scaling
- **Monitoring**: Full observability stack

**Auto Scaling Configuration**:
```json
{
  "targetTrackingScalingPolicies": [
    {
      "targetValue": 70.0,
      "scaleOutCooldown": 300,
      "scaleInCooldown": 300,
      "metricType": "ECSServiceAverageCPUUtilization"
    },
    {
      "targetValue": 80.0,
      "scaleOutCooldown": 300,
      "scaleInCooldown": 300,
      "metricType": "ECSServiceAverageMemoryUtilization"
    }
  ]
}
```

## CI/CD Pipeline

### Jenkins Pipeline
**Location**: `https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-delphifdc`

### Pipeline Stages

#### 1. Source Code Checkout
```groovy
stage('Checkout') {
    steps {
        checkout scm
        sh 'git clean -fdx'
    }
}
```

#### 2. Build & Test
```groovy
stage('Build') {
    steps {
        sh 'mvn clean compile'
    }
}

stage('Unit Tests') {
    steps {
        sh 'mvn test'
    }
    post {
        always {
            publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
            publishCoverage adapters: [jacocoAdapter('**/target/site/jacoco/jacoco.xml')]
        }
    }
}
```

#### 3. Code Quality
```groovy
stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('SonarQube') {
            sh 'mvn sonar:sonar'
        }
    }
}

stage('Quality Gate') {
    steps {
        timeout(time: 5, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true
        }
    }
}
```

#### 4. Package & Build Image
```groovy
stage('Package') {
    steps {
        sh 'mvn package -Prelease'
    }
}

stage('Docker Build') {
    steps {
        script {
            def image = docker.build("passkey-delphifdc:${env.BUILD_NUMBER}")
            docker.withRegistry('https://docker.cvent.net', 'docker-registry-credentials') {
                image.push()
                image.push('latest')
            }
        }
    }
}
```

#### 5. Integration Tests
```groovy
stage('Integration Tests') {
    steps {
        sh 'mvn -Prun-it -Dkarate.env=dev verify'
    }
    post {
        always {
            publishTestResults testResultsPattern: '**/target/karate-reports/*.xml'
        }
    }
}
```

#### 6. Deployment
```groovy
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
        input message: 'Deploy to Production?', ok: 'Deploy'
        sh './deploy.sh prod'
    }
}
```

### Deployment Scripts

#### deploy.sh
```bash
#!/bin/bash
ENVIRONMENT=$1
SERVICE_NAME="passkey-delphifdc-service"
CLUSTER_NAME="passkey-${ENVIRONMENT}-cluster"

# Update ECS service
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME

echo "Deployment to $ENVIRONMENT completed successfully"
```

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through AWS Systems Manager Parameter Store:

```bash
# Development
/passkey-delphifdc/dev/database/region
/passkey-delphifdc/dev/auth/api-key
/passkey-delphifdc/dev/external-services/amadeus/endpoint

# Staging
/passkey-delphifdc/staging/database/region
/passkey-delphifdc/staging/auth/api-key
/passkey-delphifdc/staging/external-services/amadeus/endpoint

# Production
/passkey-delphifdc/prod/database/region
/passkey-delphifdc/prod/auth/api-key
/passkey-delphifdc/prod/external-services/amadeus/endpoint
```

### Secret Management
Sensitive configuration values are stored as SecureString parameters:
- Database credentials
- API keys
- External service authentication tokens
- Encryption keys

### Configuration Injection
```yaml
# ECS Task Definition
{
  "secrets": [
    {
      "name": "API_KEY",
      "valueFrom": "/passkey-delphifdc/${ENVIRONMENT}/auth/api-key"
    },
    {
      "name": "DB_PASSWORD",
      "valueFrom": "/passkey-delphifdc/${ENVIRONMENT}/database/password"
    }
  ]
}
```

## Monitoring & Alerting

### Health Checks
- **Application Health**: `/health` endpoint
- **Deep Health Check**: Validates database connectivity and external service availability
- **Load Balancer Health Check**: HTTP 200 response from `/health`

### CloudWatch Metrics
- **ECS Service Metrics**: CPU, Memory, Task count
- **Application Metrics**: Request count, response time, error rate
- **DynamoDB Metrics**: Read/write capacity, throttling, errors

### Datadog Integration
```yaml
# Datadog Agent Configuration
datadog:
  api_key: ${DD_API_KEY}
  logs_enabled: true
  apm_enabled: true
  tags:
    - env:${ENVIRONMENT}
    - service:passkey-delphifdc-service
    - version:${BUILD_NUMBER}
```

### Alerting Rules
```yaml
# Critical Alerts
- name: "Service Down"
  condition: "avg(last_5m):avg:ecs.service.running{service:passkey-delphifdc-service} < 1"
  
- name: "High Error Rate"
  condition: "avg(last_10m):sum:http.requests{status:5xx} / sum:http.requests{*} > 0.05"

- name: "High Response Time"
  condition: "avg(last_10m):avg:http.response_time{service:passkey-delphifdc-service} > 5000"

# Warning Alerts  
- name: "High CPU Usage"
  condition: "avg(last_15m):avg:ecs.cpu.utilization{service:passkey-delphifdc-service} > 80"

- name: "DynamoDB Throttling"
  condition: "sum(last_5m):aws.dynamodb.throttled_requests{*} > 0"
```

## Rollback Procedures

### Automated Rollback
ECS service deployments include automatic rollback on health check failures:

```json
{
  "deploymentConfiguration": {
    "maximumPercent": 200,
    "minimumHealthyPercent": 50,
    "deploymentCircuitBreaker": {
      "enable": true,
      "rollback": true
    }
  }
}
```

### Manual Rollback
```bash
# Rollback to previous task definition
aws ecs update-service \
    --cluster passkey-prod-cluster \
    --service passkey-delphifdc-service \
    --task-definition passkey-delphifdc-service:PREVIOUS_REVISION

# Rollback using deployment script
./rollback.sh prod PREVIOUS_BUILD_NUMBER
```

### Database Rollback
DynamoDB schema changes require careful planning:
1. **Backward Compatible Changes**: Deploy application first, then schema
2. **Breaking Changes**: Use blue-green deployment strategy
3. **Data Migration**: Implement reversible migration scripts

### Rollback Verification
```bash
# Health check verification
curl -f https://passkey-delphifdc-service.prod.cvent.com/health

# Functional verification
curl -X POST https://passkey-delphifdc-service.prod.cvent.com/api/v1/events \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '[{"id":"test-rollback","eventDetail":{"locationId":"test","resourceId":"test","eventType":"booking_created","timestamp":"2024-01-15T10:30:00Z"}}]'
```

## Security Considerations

### Network Security
- **VPC**: Service deployed in private subnets
- **Security Groups**: Restrictive inbound/outbound rules
- **WAF**: Web Application Firewall for external traffic
- **TLS**: HTTPS/TLS 1.2+ for all communications

### IAM Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/passkey-delphifdc-*"
      ]
    }
  ]
}
```

### Compliance
- **Data Encryption**: At rest and in transit
- **Audit Logging**: All API calls logged
- **Access Control**: Role-based access with least privilege
- **Vulnerability Scanning**: Regular security scans