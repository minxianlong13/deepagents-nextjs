# Deployment

## Infrastructure

### AWS Architecture
The Passkey Housing Library Service is deployed on AWS using a containerized architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Load Balancer                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    ECS Fargate Cluster                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Service       │  │   Service       │  │   Service    │ │
│  │   Instance 1    │  │   Instance 2    │  │   Instance N │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    RDS Oracle Database                      │
│                  (Multi-AZ Deployment)                      │
└─────────────────────────────────────────────────────────────┘
```

### Infrastructure Components
- **ECS Fargate**: Serverless container orchestration
- **Application Load Balancer**: Traffic distribution and SSL termination
- **RDS Oracle**: Managed database service with Multi-AZ deployment
- **CloudWatch**: Monitoring and logging
- **Route 53**: DNS management
- **VPC**: Network isolation and security

## Environments

### Development (dev)
- **Purpose**: Development and testing
- **URL**: `https://passkey-housing-library-service.dev.cvent.org`
- **Database**: Single-instance RDS Oracle
- **Scaling**: 1-2 ECS tasks
- **Monitoring**: Basic CloudWatch metrics
- **Deployment**: Automatic on merge to `develop` branch

**Configuration**:
```yaml
environment: dev
replicas: 1
cpu: 512
memory: 1024
database:
  instance_class: db.t3.medium
  multi_az: false
```

### Staging (staging)
- **Purpose**: Pre-production testing and validation
- **URL**: `https://passkey-housing-library-service.staging.cvent.org`
- **Database**: Multi-AZ RDS Oracle
- **Scaling**: 2-4 ECS tasks
- **Monitoring**: Enhanced CloudWatch with custom metrics
- **Deployment**: Manual promotion from development

**Configuration**:
```yaml
environment: staging
replicas: 2
cpu: 1024
memory: 2048
database:
  instance_class: db.t3.large
  multi_az: true
```

### Production (prod)
- **Purpose**: Live production environment
- **URL**: `https://passkey-housing-library-service.prod.cvent.org`
- **Database**: Multi-AZ RDS Oracle with read replicas
- **Scaling**: 4-10 ECS tasks (auto-scaling enabled)
- **Monitoring**: Full observability stack with alerting
- **Deployment**: Manual promotion with approval process

**Configuration**:
```yaml
environment: prod
replicas: 4
cpu: 2048
memory: 4096
database:
  instance_class: db.r5.xlarge
  multi_az: true
  read_replicas: 2
auto_scaling:
  min_capacity: 4
  max_capacity: 10
  target_cpu: 70
```

## CI/CD Pipeline

### Jenkins Pipeline
The service uses Jenkins for continuous integration and deployment:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package -Prelease'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'mvn test'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'mvn verify -Prun-it -Denv.IT_ENVIRONMENT=dev'
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'mvn dependency-check:check'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t passkey-housing-library:${BUILD_NUMBER} .'
                sh 'docker tag passkey-housing-library:${BUILD_NUMBER} ${ECR_REPO}:${BUILD_NUMBER}'
            }
        }
        
        stage('Push to ECR') {
            steps {
                sh 'aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR_REPO}'
                sh 'docker push ${ECR_REPO}:${BUILD_NUMBER}'
            }
        }
        
        stage('Deploy to Dev') {
            when { branch 'develop' }
            steps {
                sh 'aws ecs update-service --cluster dev-cluster --service passkey-housing-library --force-new-deployment'
            }
        }
        
        stage('Deploy to Staging') {
            when { branch 'master' }
            steps {
                input message: 'Deploy to staging?', ok: 'Deploy'
                sh 'aws ecs update-service --cluster staging-cluster --service passkey-housing-library --force-new-deployment'
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
                input message: 'Deploy to production?', ok: 'Deploy', submitterParameter: 'APPROVER'
                sh 'aws ecs update-service --cluster prod-cluster --service passkey-housing-library --force-new-deployment'
            }
        }
    }
    
    post {
        always {
            publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'Code Coverage Report'
            ])
        }
        failure {
            slackSend channel: '#passkey-steak-holders', 
                     color: 'danger', 
                     message: "Build failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
        }
    }
}
```

### Deployment Stages
1. **Source Control**: Code committed to GitHub
2. **Build Trigger**: Jenkins webhook triggered on push
3. **Compilation**: Maven build and package
4. **Testing**: Unit and integration tests
5. **Security Scanning**: Dependency vulnerability check
6. **Docker Build**: Container image creation
7. **Registry Push**: Image pushed to ECR
8. **Deployment**: ECS service update
9. **Health Check**: Service health verification
10. **Notification**: Team notification of deployment status

## Configuration Management

### Hogan Templates
Configuration managed through Hogan template system:

```yaml
# Template: passkey-housing-library-service/configs/template.yaml
server:
  applicationConnectors:
    - type: http
      port: {{service.port}}
  adminConnectors:
    - type: http
      port: {{service.admin_port}}

database:
  url: {{database.url}}
  user: {{database.username}}
  password: {{database.password}}
  maxSize: {{database.max_connections}}

auth:
  apiKey: {{secrets.api_key}}
  serviceUrl: {{auth.service_url}}
```

### Environment-Specific Values
```yaml
# dev.yaml
service:
  port: 8080
  admin_port: 8081
database:
  url: jdbc:oracle:thin:@dev-db:1521:XE
  username: housing_dev
  max_connections: 16
auth:
  service_url: https://auth-service.dev.cvent.org

# prod.yaml
service:
  port: 8080
  admin_port: 8081
database:
  url: jdbc:oracle:thin:@prod-db:1521:PROD
  username: housing_prod
  max_connections: 32
auth:
  service_url: https://auth-service.prod.cvent.org
```

### Secret Management
- **API Keys**: Stored in Backstage and injected via environment variables
- **Database Passwords**: AWS Secrets Manager integration
- **SSL Certificates**: AWS Certificate Manager
- **Service Tokens**: Kubernetes secrets or AWS Parameter Store

## Monitoring & Alerting

### CloudWatch Metrics
```yaml
custom_metrics:
  - name: "RoomCategoryRequests"
    namespace: "PasskeyHousingLibrary"
    dimensions:
      - name: "Environment"
        value: "${environment}"
  
  - name: "ImageUploadLatency"
    namespace: "PasskeyHousingLibrary"
    unit: "Milliseconds"
```

### Datadog Integration
```yaml
datadog:
  api_key: ${DD_API_KEY}
  tags:
    - service:passkey-housing-library
    - environment:${environment}
    - team:steakholders
  metrics:
    - jvm.memory.used
    - jvm.gc.time
    - http.request.duration
    - database.connection.active
```

### Alerting Rules
```yaml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    severity: "critical"
    channels: ["#passkey-steak-holders", "pagerduty"]
  
  - name: "High Response Time"
    condition: "p95_response_time > 2s"
    duration: "10m"
    severity: "warning"
    channels: ["#passkey-steak-holders"]
  
  - name: "Database Connection Pool Exhaustion"
    condition: "db_connections_active > 90%"
    duration: "2m"
    severity: "critical"
    channels: ["#passkey-steak-holders", "pagerduty"]
```

## Rollback Procedures

### Automatic Rollback
ECS service configured with automatic rollback on failed health checks:

```yaml
deployment_configuration:
  maximum_percent: 200
  minimum_healthy_percent: 50
  deployment_circuit_breaker:
    enable: true
    rollback: true
```

### Manual Rollback Steps

#### 1. Identify Previous Version
```bash
# List recent deployments
aws ecs describe-services --cluster prod-cluster --services passkey-housing-library

# Get task definition revisions
aws ecs list-task-definitions --family-prefix passkey-housing-library --sort DESC
```

#### 2. Rollback Service
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster prod-cluster \
  --service passkey-housing-library \
  --task-definition passkey-housing-library:PREVIOUS_REVISION
```

#### 3. Verify Rollback
```bash
# Check service status
aws ecs describe-services --cluster prod-cluster --services passkey-housing-library

# Monitor health checks
curl -f https://passkey-housing-library-service.prod.cvent.org/health
```

#### 4. Database Rollback (if needed)
```sql
-- Rollback database migrations if necessary
-- This should be rare and carefully planned
ROLLBACK TO SAVEPOINT before_deployment;
```

### Emergency Procedures

#### Circuit Breaker Activation
```bash
# Temporarily disable service
aws ecs update-service \
  --cluster prod-cluster \
  --service passkey-housing-library \
  --desired-count 0
```

#### Traffic Diversion
```bash
# Update load balancer to redirect traffic
aws elbv2 modify-rule \
  --rule-arn arn:aws:elasticloadbalancing:... \
  --actions Type=fixed-response,FixedResponseConfig='{StatusCode=503,ContentType=text/plain,MessageBody=Service Temporarily Unavailable}'
```

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with 30-day retention
- **Configuration**: Version controlled in Git
- **Container Images**: Stored in ECR with lifecycle policies

### Recovery Procedures
1. **Database Recovery**: Restore from RDS automated backup
2. **Service Recovery**: Deploy from known good container image
3. **Configuration Recovery**: Restore from Git repository
4. **Data Validation**: Run integrity checks post-recovery

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 30 minutes
- **Recovery Point Objective (RPO)**: 1 hour
- **Availability Target**: 99.9% uptime