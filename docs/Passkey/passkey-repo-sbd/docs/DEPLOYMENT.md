# Deployment

## Infrastructure

### AWS Architecture

The Passkey Sub-Block Dashboard is deployed on AWS using a containerized architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   Application   │    │   Database      │
│   (CDN)         │◄──►│   Load Balancer │◄──►│   (RDS)         │
│                 │    │   (ALB)         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   ECS Cluster   │
                       │                 │
                       │ ┌─────────────┐ │
                       │ │   Fargate   │ │
                       │ │   Tasks     │ │
                       │ │             │ │
                       │ │ ┌─────────┐ │ │
                       │ │ │ WildFly │ │ │
                       │ │ │Container│ │ │
                       │ │ └─────────┘ │ │
                       │ └─────────────┘ │
                       └─────────────────┘
```

### Core Infrastructure Components

#### Compute
- **ECS Fargate**: Serverless container platform
- **Task Definition**: Defines container specifications and resource requirements
- **Service**: Manages desired task count and health checks
- **Auto Scaling**: Scales based on CPU/memory utilization and request count

#### Networking
- **VPC**: Isolated network environment
- **Public Subnets**: For load balancers and NAT gateways
- **Private Subnets**: For application containers and databases
- **Security Groups**: Network-level access control
- **Application Load Balancer**: Distributes traffic across container instances

#### Storage & Database
- **RDS PostgreSQL**: Primary database with Multi-AZ deployment
- **ElastiCache Redis**: Session storage and caching
- **S3**: Static asset storage and application artifacts
- **EFS**: Shared file system for configuration files

#### Security
- **IAM Roles**: Service-specific permissions
- **Secrets Manager**: Secure storage of sensitive configuration
- **Certificate Manager**: SSL/TLS certificate management
- **WAF**: Web application firewall protection

## Environments

### Development Environment

**Infrastructure**:
- **Region**: us-east-1
- **VPC**: vpc-dev-passkey-sbd
- **ECS Cluster**: passkey-sbd-dev
- **Database**: passkey-sbd-dev.cluster-xxx.us-east-1.rds.amazonaws.com
- **Load Balancer**: passkey-sbd-dev-alb-xxx.us-east-1.elb.amazonaws.com

**Configuration**:
```yaml
# dev environment
environment: dev
replicas: 1
cpu: 512
memory: 1024
database:
  instance_class: db.t3.micro
  allocated_storage: 20
  backup_retention: 1
auto_scaling:
  min_capacity: 1
  max_capacity: 3
  target_cpu: 70
```

**Access**:
- **URL**: https://dev-rlm.passkey.com/dashboard
- **Database Access**: Via bastion host or VPN
- **Logs**: CloudWatch Logs group `/aws/ecs/passkey-sbd-dev`

### Staging Environment

**Infrastructure**:
- **Region**: us-east-1
- **VPC**: vpc-staging-passkey-sbd
- **ECS Cluster**: passkey-sbd-staging
- **Database**: passkey-sbd-staging.cluster-xxx.us-east-1.rds.amazonaws.com
- **Load Balancer**: passkey-sbd-staging-alb-xxx.us-east-1.elb.amazonaws.com

**Configuration**:
```yaml
# staging environment
environment: staging
replicas: 2
cpu: 1024
memory: 2048
database:
  instance_class: db.t3.small
  allocated_storage: 100
  backup_retention: 7
auto_scaling:
  min_capacity: 2
  max_capacity: 6
  target_cpu: 60
```

**Access**:
- **URL**: https://staging-rlm.passkey.com/dashboard
- **Database Access**: Via bastion host
- **Logs**: CloudWatch Logs group `/aws/ecs/passkey-sbd-staging`

### Production Environment

**Infrastructure**:
- **Region**: us-east-1 (primary), us-west-2 (DR)
- **VPC**: vpc-prod-passkey-sbd
- **ECS Cluster**: passkey-sbd-prod
- **Database**: passkey-sbd-prod.cluster-xxx.us-east-1.rds.amazonaws.com
- **Load Balancer**: passkey-sbd-prod-alb-xxx.us-east-1.elb.amazonaws.com

**Configuration**:
```yaml
# production environment
environment: prod
replicas: 4
cpu: 2048
memory: 4096
database:
  instance_class: db.r5.large
  allocated_storage: 500
  backup_retention: 30
  multi_az: true
auto_scaling:
  min_capacity: 4
  max_capacity: 20
  target_cpu: 50
```

**Access**:
- **URL**: https://rlm.passkey.com/dashboard
- **Database Access**: Restricted to application only
- **Logs**: CloudWatch Logs group `/aws/ecs/passkey-sbd-prod`

## CI/CD Pipeline

### Jenkins Pipeline Overview

The deployment pipeline is implemented using Jenkins with the following stages:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Source    │  │    Build    │  │    Test     │  │   Deploy    │
│   Control   │─►│             │─►│             │─►│             │
│             │  │             │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### Pipeline Configuration (Jenkinsfile)

```groovy
pipeline {
    agent any
    
    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = '123456789012.dkr.ecr.us-east-1.amazonaws.com/passkey-sbd'
        ECS_CLUSTER = 'passkey-sbd-${ENVIRONMENT}'
        ECS_SERVICE = 'passkey-sbd-service'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Java') {
            steps {
                sh '''
                    cd packages/app
                    mvn clean compile
                '''
            }
        }
        
        stage('Build Frontend') {
            steps {
                sh '''
                    pnpm install --frozen-lockfile
                    pnpm build
                '''
            }
        }
        
        stage('Test') {
            parallel {
                stage('Java Tests') {
                    steps {
                        sh '''
                            cd packages/app
                            mvn test
                        '''
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'packages/app/target/surefire-reports/*.xml'
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    steps {
                        sh 'pnpm test'
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results.xml'
                        }
                    }
                }
            }
        }
        
        stage('Package') {
            steps {
                sh '''
                    cd packages/app
                    mvn package -DskipTests
                '''
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("${ECR_REPOSITORY}:${BUILD_NUMBER}")
                    docker.withRegistry("https://${ECR_REPOSITORY}", 'ecr:us-east-1:aws-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                deployToEnvironment('dev')
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'master'
            }
            steps {
                deployToEnvironment('staging')
            }
        }
        
        stage('Deploy to Production') {
            when {
                tag pattern: "v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP"
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                deployToEnvironment('prod')
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            slackSend(
                channel: '#passkey-steak-holders',
                color: 'danger',
                message: "Build failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
        success {
            slackSend(
                channel: '#passkey-steak-holders',
                color: 'good',
                message: "Build successful: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
    }
}

def deployToEnvironment(environment) {
    sh """
        aws ecs update-service \
            --cluster ${ECS_CLUSTER.replace('${ENVIRONMENT}', environment)} \
            --service ${ECS_SERVICE} \
            --force-new-deployment \
            --region ${AWS_REGION}
    """
    
    sh """
        aws ecs wait services-stable \
            --cluster ${ECS_CLUSTER.replace('${ENVIRONMENT}', environment)} \
            --services ${ECS_SERVICE} \
            --region ${AWS_REGION}
    """
}
```

### Deployment Triggers

- **Development**: Automatic deployment on push to `develop` branch
- **Staging**: Automatic deployment on push to `master` branch
- **Production**: Manual deployment triggered by Git tags matching `v*.*.*` pattern

## Configuration Management

### Environment-Specific Configuration

Configuration is managed using Hogan templates and AWS Systems Manager Parameter Store:

#### Parameter Store Structure
```
/passkey-sbd/dev/
├── database/host
├── database/username
├── database/password
├── auth-service/url
├── commerce-service/url
├── datadog/api-key
└── feature-flags/graphql-enabled

/passkey-sbd/staging/
├── database/host
├── database/username
├── database/password
└── ...

/passkey-sbd/prod/
├── database/host
├── database/username
├── database/password
└── ...
```

#### Hogan Template Example (configs/application.yml.hogan)
```yaml
server:
  port: 8080
  
database:
  host: {{database.host}}
  port: 5432
  name: passkey_sbd
  username: {{database.username}}
  password: {{database.password}}
  
external-services:
  auth-service:
    url: {{auth-service.url}}
    timeout: 30s
  commerce-service:
    url: {{commerce-service.url}}
    timeout: 30s
    
monitoring:
  datadog:
    api-key: {{datadog.api-key}}
    service-name: passkey-sbd
    environment: {{environment}}
    
feature-flags:
  graphql-enabled: {{feature-flags.graphql-enabled}}
  realtime-updates: {{feature-flags.realtime-updates}}
```

### Secrets Management

Sensitive configuration is stored in AWS Secrets Manager:

```json
{
  "database": {
    "password": "secure-db-password",
    "connection-string": "postgresql://user:pass@host:5432/db"
  },
  "jwt": {
    "secret": "jwt-signing-secret",
    "issuer": "passkey-auth-service"
  },
  "external-apis": {
    "commerce-api-key": "commerce-service-api-key",
    "reporting-api-key": "reporting-service-api-key"
  }
}
```

## Rollback Procedures

### Automated Rollback

ECS services support automatic rollback on deployment failure:

```yaml
# ECS Service Configuration
deploymentConfiguration:
  maximumPercent: 200
  minimumHealthyPercent: 50
  deploymentCircuitBreaker:
    enable: true
    rollback: true
```

### Manual Rollback Steps

#### 1. Identify Previous Stable Version
```bash
# List recent deployments
aws ecs describe-services \
  --cluster passkey-sbd-prod \
  --services passkey-sbd-service \
  --query 'services[0].deployments'

# Get previous task definition
aws ecs describe-task-definition \
  --task-definition passkey-sbd:PREVIOUS_REVISION
```

#### 2. Rollback ECS Service
```bash
# Update service to previous task definition
aws ecs update-service \
  --cluster passkey-sbd-prod \
  --service passkey-sbd-service \
  --task-definition passkey-sbd:PREVIOUS_REVISION

# Wait for deployment to complete
aws ecs wait services-stable \
  --cluster passkey-sbd-prod \
  --services passkey-sbd-service
```

#### 3. Verify Rollback
```bash
# Check service status
aws ecs describe-services \
  --cluster passkey-sbd-prod \
  --services passkey-sbd-service \
  --query 'services[0].deployments[0].status'

# Test application health
curl -f https://rlm.passkey.com/dashboard/health
```

#### 4. Database Rollback (if needed)
```bash
# Restore from automated backup
aws rds restore-db-cluster-to-point-in-time \
  --db-cluster-identifier passkey-sbd-prod-rollback \
  --source-db-cluster-identifier passkey-sbd-prod \
  --restore-to-time 2024-02-15T10:00:00Z

# Update application configuration to use rollback database
# (This requires careful coordination and downtime)
```

### Emergency Procedures

#### Circuit Breaker Activation
```bash
# Disable traffic to problematic service
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/passkey-sbd-prod/1234567890123456 \
  --health-check-path /maintenance

# Enable maintenance mode
aws ssm put-parameter \
  --name "/passkey-sbd/prod/maintenance-mode" \
  --value "true" \
  --overwrite
```

#### Scaling Down for Stability
```bash
# Reduce service capacity
aws ecs update-service \
  --cluster passkey-sbd-prod \
  --service passkey-sbd-service \
  --desired-count 2

# Update auto-scaling limits
aws application-autoscaling put-scaling-policy \
  --policy-name passkey-sbd-scale-down \
  --service-namespace ecs \
  --resource-id service/passkey-sbd-prod/passkey-sbd-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type StepScaling \
  --step-scaling-policy-configuration MinAdjustmentMagnitude=1,AdjustmentType=ChangeInCapacity,Cooldown=300
```

### Monitoring During Deployments

#### Key Metrics to Watch
- **Application Response Time**: < 500ms p95
- **Error Rate**: < 1%
- **CPU Utilization**: < 70%
- **Memory Utilization**: < 80%
- **Database Connections**: < 80% of pool size

#### Automated Alerts
```yaml
# CloudWatch Alarms
alarms:
  - name: HighErrorRate
    metric: ApplicationELB/HTTPCode_Target_5XX_Count
    threshold: 10
    period: 300
    evaluation_periods: 2
    
  - name: HighResponseTime
    metric: ApplicationELB/TargetResponseTime
    threshold: 1.0
    period: 300
    evaluation_periods: 2
    
  - name: DatabaseConnectionsHigh
    metric: AWS/RDS/DatabaseConnections
    threshold: 16
    period: 300
    evaluation_periods: 1
```