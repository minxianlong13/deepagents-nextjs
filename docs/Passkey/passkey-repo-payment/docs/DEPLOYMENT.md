# Deployment

## Infrastructure

The Passkey Payment Service is deployed on AWS infrastructure using containerized deployments with Docker and orchestrated through Jenkins CI/CD pipelines.

### AWS Services Used
- **ECS (Elastic Container Service)**: Container orchestration
- **ALB (Application Load Balancer)**: Load balancing and SSL termination
- **RDS Oracle**: Managed database service
- **ECR (Elastic Container Registry)**: Container image storage
- **CloudWatch**: Monitoring and logging
- **Route 53**: DNS management
- **VPC**: Network isolation and security

### Network Architecture
```
Internet Gateway
       │
   ALB (HTTPS)
       │
   Target Groups
       │
   ECS Services
       │
   Private Subnets
       │
   RDS Oracle
```

## Environments

### Development Environment
- **URL**: `https://passkey-payment-service.dev.cvent.org`
- **Purpose**: Development and feature testing
- **Database**: Oracle RDS (dev instance)
- **Resources**: 
  - CPU: 0.5 vCPU
  - Memory: 1 GB
  - Instances: 1
- **Auto-scaling**: Disabled
- **Monitoring**: Basic CloudWatch metrics

### Staging Environment
- **URL**: `https://passkey-payment-service.staging.cvent.org`
- **Purpose**: Integration testing and pre-production validation
- **Database**: Oracle RDS (staging instance)
- **Resources**:
  - CPU: 1 vCPU
  - Memory: 2 GB
  - Instances: 2
- **Auto-scaling**: Enabled (2-4 instances)
- **Monitoring**: Full CloudWatch + Datadog integration

### Production Environment
- **URL**: `https://passkey-payment-service.prod.cvent.org`
- **Purpose**: Live production workloads
- **Database**: Oracle RDS (production cluster)
- **Resources**:
  - CPU: 2 vCPU
  - Memory: 4 GB
  - Instances: 4 (minimum)
- **Auto-scaling**: Enabled (4-12 instances)
- **Monitoring**: Full observability stack
- **Backup**: Automated daily backups with 30-day retention

## CI/CD Pipeline

### Jenkins Pipeline Overview
The service uses a Jenkins-based CI/CD pipeline defined in the `Jenkinsfile` at the repository root.

#### Pipeline Stages

1. **Checkout**
   - Pulls source code from GitHub
   - Validates branch and commit information

2. **Build**
   - Compiles Java code using Maven
   - Runs unit tests
   - Generates code coverage reports

3. **Code Quality**
   - SonarQube analysis
   - Checkstyle validation
   - Security scanning

4. **Package**
   - Creates Docker image
   - Tags with build number and commit SHA
   - Pushes to ECR registry

5. **Deploy to Dev**
   - Automatic deployment to development environment
   - Smoke tests execution
   - Health check validation

6. **Integration Tests**
   - Runs integration test suite
   - API contract validation
   - End-to-end testing

7. **Deploy to Staging**
   - Manual approval required
   - Deployment to staging environment
   - Load testing execution

8. **Deploy to Production**
   - Manual approval required
   - Blue-green deployment strategy
   - Production health validation

### Jenkins Configuration

#### Pipeline Script (Jenkinsfile)
```groovy
pipeline {
    agent any
    
    environment {
        ECR_REGISTRY = '123456789012.dkr.ecr.us-east-1.amazonaws.com'
        IMAGE_NAME = 'passkey-payment-service'
        AWS_REGION = 'us-east-1'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package -Prelease'
            }
            post {
                always {
                    publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
                    publishCoverage adapters: [jacocoAdapter('**/target/site/jacoco/jacoco.xml')]
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("${IMAGE_NAME}:${BUILD_NUMBER}")
                    docker.withRegistry("https://${ECR_REGISTRY}", 'ecr:us-east-1:aws-credentials') {
                        image.push("${BUILD_NUMBER}")
                        image.push("latest")
                    }
                }
            }
        }
        
        stage('Deploy to Dev') {
            steps {
                sh './deploy.sh dev ${BUILD_NUMBER}'
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'mvn verify -Prun-it -Denv.IT_ENVIRONMENT=dev'
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'master'
            }
            steps {
                input message: 'Deploy to Staging?', ok: 'Deploy'
                sh './deploy.sh staging ${BUILD_NUMBER}'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'master'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                sh './deploy.sh production ${BUILD_NUMBER}'
            }
        }
    }
}
```

### Deployment Scripts

#### Main Deployment Script (deploy.sh)
```bash
#!/bin/bash

ENVIRONMENT=$1
BUILD_NUMBER=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$BUILD_NUMBER" ]; then
    echo "Usage: $0 <environment> <build_number>"
    exit 1
fi

echo "Deploying passkey-payment-service to $ENVIRONMENT with build $BUILD_NUMBER"

# Update ECS service with new image
aws ecs update-service \
    --cluster "passkey-$ENVIRONMENT" \
    --service "passkey-payment-service" \
    --task-definition "passkey-payment-service-$ENVIRONMENT:$BUILD_NUMBER" \
    --region us-east-1

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster "passkey-$ENVIRONMENT" \
    --services "passkey-payment-service" \
    --region us-east-1

# Validate deployment
./validate-deployment.sh $ENVIRONMENT

echo "Deployment to $ENVIRONMENT completed successfully"
```

#### Deployment Validation Script
```bash
#!/bin/bash

ENVIRONMENT=$1
BASE_URL="https://passkey-payment-service.$ENVIRONMENT.cvent.org"

# Health check
echo "Checking health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/healthcheck")

if [ "$HEALTH_STATUS" != "200" ]; then
    echo "Health check failed with status: $HEALTH_STATUS"
    exit 1
fi

# API validation
echo "Validating API endpoints..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TEST_TOKEN" "$BASE_URL/v1/payments/health")

if [ "$API_STATUS" != "200" ]; then
    echo "API validation failed with status: $API_STATUS"
    exit 1
fi

echo "Deployment validation successful"
```

## Configuration Management

### Environment-Specific Configurations

#### Development Configuration (dev.yaml)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:oracle:thin:@//passkey-payment-dev.cluster-xyz.us-east-1.rds.amazonaws.com:1521/PAYPROD
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxSize: 16

authService:
  baseUrl: https://auth-service.dev.cvent.org
  apiKey: ${LOCAL_API_KEY}

logging:
  level: DEBUG
```

#### Staging Configuration (staging.yaml)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:oracle:thin:@//passkey-payment-staging.cluster-xyz.us-east-1.rds.amazonaws.com:1521/PAYPROD
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxSize: 24

authService:
  baseUrl: https://auth-service.staging.cvent.org
  apiKey: ${LOCAL_API_KEY}

logging:
  level: INFO
```

#### Production Configuration (production.yaml)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:oracle:thin:@//passkey-payment-prod.cluster-xyz.us-east-1.rds.amazonaws.com:1521/PAYPROD
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxSize: 32
  validationQuery: SELECT 1 FROM DUAL
  checkConnectionWhileIdle: true

authService:
  baseUrl: https://auth-service.prod.cvent.org
  apiKey: ${LOCAL_API_KEY}

logging:
  level: WARN
  loggers:
    com.cvent.passkey.payment: INFO
```

### Secret Management

#### AWS Systems Manager Parameter Store
```bash
# Database credentials
/passkey-payment/dev/db-user
/passkey-payment/dev/db-password
/passkey-payment/staging/db-user
/passkey-payment/staging/db-password
/passkey-payment/prod/db-user
/passkey-payment/prod/db-password

# API Keys
/passkey-payment/dev/api-key
/passkey-payment/staging/api-key
/passkey-payment/prod/api-key
/passkey-payment/dev/ecommerce-api-key
/passkey-payment/staging/ecommerce-api-key
/passkey-payment/prod/ecommerce-api-key
```

#### ECS Task Definition Environment Variables
```json
{
  "environment": [
    {
      "name": "DB_USER",
      "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/passkey-payment/prod/db-user"
    },
    {
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/passkey-payment/prod/db-password"
    },
    {
      "name": "LOCAL_API_KEY",
      "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/passkey-payment/prod/api-key"
    }
  ]
}
```

## Rollback Procedures

### Automated Rollback
The deployment system supports automated rollback in case of deployment failures:

1. **Health Check Failure**: If health checks fail after deployment, automatic rollback is triggered
2. **Error Rate Threshold**: If error rate exceeds 5% for 5 minutes, rollback is initiated
3. **Response Time Degradation**: If average response time increases by 50%, rollback occurs

### Manual Rollback Process

#### Step 1: Identify Previous Stable Version
```bash
# List recent deployments
aws ecs list-tasks --cluster passkey-prod --service-name passkey-payment-service

# Get task definition revisions
aws ecs describe-service --cluster passkey-prod --services passkey-payment-service
```

#### Step 2: Execute Rollback
```bash
# Rollback to previous version
./rollback.sh production <previous_build_number>

# Example
./rollback.sh production 1234
```

#### Step 3: Validate Rollback
```bash
# Run validation script
./validate-deployment.sh production

# Monitor metrics
./monitor-rollback.sh production
```

### Rollback Script (rollback.sh)
```bash
#!/bin/bash

ENVIRONMENT=$1
BUILD_NUMBER=$2

echo "Rolling back passkey-payment-service in $ENVIRONMENT to build $BUILD_NUMBER"

# Get current task definition
CURRENT_TASK_DEF=$(aws ecs describe-services \
    --cluster "passkey-$ENVIRONMENT" \
    --services "passkey-payment-service" \
    --query 'services[0].taskDefinition' \
    --output text)

echo "Current task definition: $CURRENT_TASK_DEF"

# Update service to previous task definition
aws ecs update-service \
    --cluster "passkey-$ENVIRONMENT" \
    --service "passkey-payment-service" \
    --task-definition "passkey-payment-service-$ENVIRONMENT:$BUILD_NUMBER" \
    --region us-east-1

# Wait for rollback to complete
aws ecs wait services-stable \
    --cluster "passkey-$ENVIRONMENT" \
    --services "passkey-payment-service" \
    --region us-east-1

echo "Rollback completed successfully"
```

## Monitoring and Alerting

### CloudWatch Metrics
- **Application Metrics**: Request count, response time, error rate
- **Infrastructure Metrics**: CPU utilization, memory usage, network I/O
- **Database Metrics**: Connection count, query performance, deadlocks

### Datadog Integration
- **APM Tracing**: Distributed tracing across service calls
- **Custom Metrics**: Business-specific metrics and KPIs
- **Log Aggregation**: Centralized log collection and analysis

### Alert Configuration
```yaml
# High error rate alert
- name: "Passkey Payment Service - High Error Rate"
  condition: "error_rate > 5% for 5 minutes"
  severity: "critical"
  notification: "#passkey-steak-holders"

# High response time alert  
- name: "Passkey Payment Service - High Response Time"
  condition: "avg_response_time > 2000ms for 10 minutes"
  severity: "warning"
  notification: "#passkey-steak-holders"

# Database connection alert
- name: "Passkey Payment Service - Database Connection Issues"
  condition: "db_connection_errors > 10 in 5 minutes"
  severity: "critical"
  notification: "#passkey-steak-holders"
```

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated daily backups with 30-day retention
- **Configuration Backups**: Version-controlled configuration files
- **Code Backups**: Git repository with multiple remotes

### Recovery Procedures

#### Database Recovery
1. Identify backup point for recovery
2. Create new RDS instance from backup
3. Update service configuration to point to new database
4. Validate data integrity
5. Update DNS to redirect traffic

#### Service Recovery
1. Deploy service to alternate AWS region
2. Update load balancer configuration
3. Redirect traffic to backup region
4. Monitor service health and performance

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Data Loss Tolerance**: Maximum 1 hour of transaction data

## Security Considerations

### Network Security
- **VPC Isolation**: Service deployed in private subnets
- **Security Groups**: Restrictive inbound/outbound rules
- **WAF Protection**: Web Application Firewall for API endpoints

### Data Security
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Encryption at Rest**: Database and storage encryption enabled
- **PCI Compliance**: Payment data tokenization and secure handling

### Access Control
- **IAM Roles**: Least privilege access for service accounts
- **API Authentication**: JWT token validation for all endpoints
- **Admin Access**: Multi-factor authentication required