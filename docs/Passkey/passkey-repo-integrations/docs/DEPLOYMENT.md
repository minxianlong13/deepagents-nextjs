# Deployment

## Infrastructure

### Cloud Platform
- **Provider**: Amazon Web Services (AWS)
- **Container Orchestration**: Amazon ECS (Elastic Container Service)
- **Load Balancer**: Application Load Balancer (ALB)
- **Service Discovery**: AWS Cloud Map
- **Container Registry**: Amazon ECR (Elastic Container Registry)

### Network Architecture
```
Internet Gateway
       ↓
Application Load Balancer
       ↓
┌─────────────────┬─────────────────┐
│   Passkey API   │  Passkey GL     │
│   Service       │  Service        │
└─────────────────┴─────────────────┘
       ↓                 ↓
┌─────────────────────────────────────┐
│         Shared Services             │
│  (Database, Cache, Messaging)       │
└─────────────────────────────────────┘
```

### Database Infrastructure
- **Primary Database**: Amazon RDS PostgreSQL (Multi-AZ)
- **Read Replicas**: Cross-region read replicas for disaster recovery
- **Backup Strategy**: Automated daily backups with 30-day retention
- **Connection Pooling**: PgBouncer for connection management

## Environments

### Development Environment
- **Purpose**: Local development and initial testing
- **Infrastructure**: 
  - Single ECS task per service
  - Shared RDS instance (db.t3.micro)
  - Basic monitoring setup
- **Access**: VPN required for database access
- **Deployment**: Automatic on merge to `develop` branch
- **URL**: 
  - API: `https://api-dev.passkey.com`
  - GL: `https://gl-dev.passkey.com`

### Alpha Environment  
- **Purpose**: Early feature testing and integration validation
- **Infrastructure**:
  - 2 ECS tasks per service
  - Dedicated RDS instance (db.t3.small)
  - Enhanced monitoring and alerting
- **Access**: Internal teams and selected partners
- **Deployment**: Manual promotion from development
- **URL**:
  - API: `https://api-alpha.passkey.com`
  - GL: `https://gl-alpha.passkey.com`

### Staging Environment (ts50)
- **Purpose**: Pre-production testing and performance validation
- **Infrastructure**:
  - 3 ECS tasks per service
  - Production-like RDS setup (db.r5.large)
  - Full monitoring and alerting suite
  - Load testing capabilities
- **Access**: QA teams, stakeholders, and integration partners
- **Deployment**: Automated on release candidate creation
- **URL**:
  - API: `https://api-staging.passkey.com`
  - GL: `https://gl-staging.passkey.com`

### Load Testing Environment (sg50)
- **Purpose**: Performance and scalability testing
- **Infrastructure**:
  - Auto-scaling ECS services (2-10 tasks)
  - High-performance RDS instance (db.r5.xlarge)
  - Dedicated load testing tools
- **Access**: Performance testing team
- **Deployment**: On-demand for load testing scenarios

### UAT Environment (ct50)
- **Purpose**: User acceptance testing and final validation
- **Infrastructure**:
  - Production-equivalent setup
  - Isolated from other environments
  - Full security and compliance controls
- **Access**: Business users and acceptance testing teams
- **Deployment**: Manual deployment of release candidates

### Production Environment (pr50/pr51)
- **Purpose**: Live production workloads
- **Infrastructure**:
  - Multi-AZ deployment across 2 regions
  - Auto-scaling ECS services (5-20 tasks per service)
  - High-availability RDS cluster (db.r5.2xlarge)
  - Full disaster recovery setup
- **Access**: Restricted to operations team
- **Deployment**: Blue-green deployment strategy
- **URLs**:
  - API: `https://api.passkey.com`
  - GL: `https://gl.passkey.com`

## CI/CD Pipeline

### Jenkins Pipeline Configuration
```groovy
pipeline {
    agent any
    
    environment {
        AWS_REGION = 'us-east-1'
        ECR_REGISTRY = '123456789012.dkr.ecr.us-east-1.amazonaws.com'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
                publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar'
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('API Image') {
                    steps {
                        sh '''
                            docker build -f packages/passkey-api/app/Dockerfile \
                                -t ${ECR_REGISTRY}/passkey-api:${IMAGE_TAG} .
                        '''
                    }
                }
                stage('GL Image') {
                    steps {
                        sh '''
                            docker build -f packages/passkey-gl/app/Dockerfile \
                                -t ${ECR_REGISTRY}/passkey-gl:${IMAGE_TAG} .
                        '''
                    }
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    
                    docker push ${ECR_REGISTRY}/passkey-api:${IMAGE_TAG}
                    docker push ${ECR_REGISTRY}/passkey-gl:${IMAGE_TAG}
                '''
            }
        }
        
        stage('Deploy to Development') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    aws ecs update-service \
                        --cluster passkey-dev \
                        --service passkey-api-dev \
                        --force-new-deployment
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### Octopus Deploy Integration
- **Project Structure**: Separate projects for API and GL services
- **Release Management**: Automated release creation from Jenkins
- **Environment Promotion**: Manual approval gates for production
- **Variable Management**: Environment-specific configuration
- **Deployment Patterns**: Blue-green and rolling deployments

## Configuration Management

### Environment-Specific Configuration
```yaml
# Development
api:
  database:
    host: dev-db.passkey.com
    pool_size: 10
  external_services:
    amadeus_url: https://test.api.amadeus.com
    launchdarkly_key: sdk-dev-12345

# Staging  
api:
  database:
    host: staging-db.passkey.com
    pool_size: 20
  external_services:
    amadeus_url: https://test.api.amadeus.com
    launchdarkly_key: sdk-staging-67890

# Production
api:
  database:
    host: prod-db.passkey.com
    pool_size: 50
  external_services:
    amadeus_url: https://api.amadeus.com
    launchdarkly_key: sdk-prod-abcdef
```

### Secret Management
- **AWS Secrets Manager**: Database credentials, API keys
- **Parameter Store**: Non-sensitive configuration values
- **IAM Roles**: Service-to-service authentication
- **Encryption**: All secrets encrypted at rest and in transit

### Configuration Injection
```dockerfile
# Environment variable injection
ENV DB_HOST=${DB_HOST}
ENV DB_PASSWORD_SECRET_ARN=${DB_PASSWORD_SECRET_ARN}
ENV LAUNCHDARKLY_SDK_KEY=${LAUNCHDARKLY_SDK_KEY}

# Runtime secret resolution
ENTRYPOINT ["/opt/scripts/start-with-secrets.sh"]
```

## Deployment Strategies

### Blue-Green Deployment
```bash
#!/bin/bash
# Blue-green deployment script

CLUSTER_NAME="passkey-prod"
SERVICE_NAME="passkey-api"
NEW_TASK_DEFINITION="passkey-api:${BUILD_NUMBER}"

# Update service with new task definition
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $NEW_TASK_DEFINITION

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME

# Verify health checks
./scripts/verify-deployment.sh $SERVICE_NAME

if [ $? -eq 0 ]; then
    echo "Deployment successful"
    # Update load balancer target group
    ./scripts/switch-traffic.sh $SERVICE_NAME
else
    echo "Deployment failed, rolling back"
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $PREVIOUS_TASK_DEFINITION
fi
```

### Rolling Deployment
- **Strategy**: Gradual replacement of instances
- **Health Checks**: ELB health checks ensure traffic routing
- **Rollback**: Automatic rollback on health check failures
- **Zero Downtime**: Maintained through proper health check configuration

## Monitoring and Alerting

### CloudWatch Metrics
```yaml
# Custom metrics configuration
metrics:
  - name: "ReservationCreated"
    namespace: "Passkey/API"
    dimensions:
      - name: "Environment"
        value: "${ENVIRONMENT}"
      - name: "Service"
        value: "passkey-api"
  
  - name: "TransferProcessingTime"
    namespace: "Passkey/GL"
    unit: "Milliseconds"
```

### Alerting Rules
```yaml
# CloudWatch Alarms
alarms:
  - name: "HighErrorRate"
    metric: "ErrorRate"
    threshold: 5
    comparison: "GreaterThanThreshold"
    evaluation_periods: 2
    actions:
      - "arn:aws:sns:us-east-1:123456789012:passkey-alerts"
  
  - name: "HighLatency"
    metric: "ResponseTime"
    threshold: 2000
    comparison: "GreaterThanThreshold"
    evaluation_periods: 3
```

### Health Check Configuration
```yaml
# ECS Health Check
health_check:
  command: ["CMD-SHELL", "curl -f http://localhost:8080/health/ready || exit 1"]
  interval: 30
  timeout: 5
  retries: 3
  start_period: 60

# Load Balancer Health Check
target_group:
  health_check:
    path: "/health/live"
    port: 8080
    protocol: "HTTP"
    healthy_threshold: 2
    unhealthy_threshold: 3
    timeout: 5
    interval: 30
```

## Rollback Procedures

### Automatic Rollback Triggers
- Health check failures exceeding threshold
- Error rate above 5% for 5 minutes
- Response time above 5 seconds for 3 minutes
- Memory usage above 90% for 10 minutes

### Manual Rollback Process
```bash
#!/bin/bash
# Manual rollback script

CLUSTER_NAME="passkey-prod"
SERVICE_NAME=$1
PREVIOUS_VERSION=$2

echo "Rolling back $SERVICE_NAME to version $PREVIOUS_VERSION"

# Update service to previous task definition
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition "$SERVICE_NAME:$PREVIOUS_VERSION"

# Wait for rollback to complete
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME

echo "Rollback completed successfully"

# Notify team
aws sns publish \
    --topic-arn "arn:aws:sns:us-east-1:123456789012:passkey-alerts" \
    --message "Rollback completed for $SERVICE_NAME to version $PREVIOUS_VERSION"
```

### Rollback Verification
1. **Health Checks**: Verify all instances pass health checks
2. **Functional Tests**: Run smoke tests against rolled-back version
3. **Monitoring**: Check metrics return to normal levels
4. **User Impact**: Verify no user-facing issues
5. **Documentation**: Update incident log with rollback details

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with cross-region replication
- **Configuration**: Version-controlled infrastructure as code
- **Container Images**: Multi-region ECR replication
- **Logs**: Centralized logging with long-term retention

### Recovery Procedures
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Failover Process**: Automated DNS failover to secondary region
4. **Data Recovery**: Point-in-time recovery from backups
5. **Service Restoration**: Automated infrastructure provisioning

### Business Continuity
- **Multi-Region Deployment**: Active-passive setup across regions
- **Data Synchronization**: Real-time replication for critical data
- **Communication Plan**: Stakeholder notification procedures
- **Testing Schedule**: Quarterly disaster recovery drills