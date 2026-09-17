# Deployment

## Infrastructure

### AWS Services
- **Compute**: Amazon ECS (Elastic Container Service) with Fargate
- **Load Balancing**: Application Load Balancer (ALB)
- **Database**: Amazon RDS (Oracle) + Amazon DynamoDB
- **Messaging**: Amazon SQS + Amazon EventBridge
- **Storage**: Amazon S3 (for artifacts and logs)
- **Monitoring**: Amazon CloudWatch + AWS X-Ray
- **Security**: AWS IAM + AWS Secrets Manager
- **DNS**: Amazon Route 53

### Container Platform
- **Container Runtime**: Docker
- **Orchestration**: Amazon ECS with Fargate
- **Service Discovery**: AWS Cloud Map
- **Auto Scaling**: ECS Service Auto Scaling

### Infrastructure as Code
- **Primary Tool**: AWS CDK (TypeScript)
- **Location**: `packages/infra/` and `packages/eb-sqs-consumer/`
- **Deployment**: Automated via Jenkins pipeline

## Environments

### Development (dev)
- **Purpose**: Development and feature testing
- **Infrastructure**:
  - ECS Service: 1 task, 0.5 vCPU, 1GB memory
  - RDS: db.t3.micro (single AZ)
  - DynamoDB: On-demand billing
  - SQS: Standard queues
- **Access**: Internal development network
- **Data**: Synthetic test data
- **Monitoring**: Basic CloudWatch metrics

### Staging (staging)
- **Purpose**: Pre-production testing and validation
- **Infrastructure**:
  - ECS Service: 2 tasks, 1 vCPU, 2GB memory each
  - RDS: db.t3.small (multi-AZ for testing)
  - DynamoDB: Provisioned throughput (low capacity)
  - SQS: Standard queues with DLQ
- **Access**: Internal staging network + select external partners
- **Data**: Anonymized production-like data
- **Monitoring**: Full CloudWatch + basic alerting

### Production (prod)
- **Purpose**: Live customer-facing service
- **Infrastructure**:
  - ECS Service: 4-10 tasks (auto-scaling), 2 vCPU, 4GB memory each
  - RDS: db.r5.xlarge (multi-AZ, read replicas)
  - DynamoDB: Provisioned throughput with auto-scaling
  - SQS: FIFO queues with DLQ and encryption
- **Access**: Public internet via ALB + CloudFront
- **Data**: Live customer data
- **Monitoring**: Comprehensive monitoring, alerting, and dashboards

### Production Regions
- **Primary**: us-east-1 (N. Virginia)
- **Secondary**: us-west-2 (Oregon) - Disaster recovery
- **Europe**: eu-west-1 (Ireland) - European customers

## CI/CD Pipeline

### Jenkins Pipeline Overview
```groovy
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Java') {
            steps {
                sh 'mvn clean compile -f packages/service/pom.xml'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'mvn test -f packages/service/pom.xml'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'pnpm test --filter=it'
                    }
                }
            }
        }
        
        stage('Package') {
            steps {
                sh 'mvn package -Prelease -f packages/service/pom.xml'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("passkey-notifications:${env.BUILD_NUMBER}")
                    docker.withRegistry('https://your-registry.com') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Dev') {
            when { branch 'develop' }
            steps {
                sh 'pnpm cdk deploy --app "packages/infra/cdk.out" --require-approval never'
            }
        }
        
        stage('Deploy to Staging') {
            when { branch 'master' }
            steps {
                sh 'pnpm cdk deploy --app "packages/infra/cdk.out" --context env=staging'
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
                sh 'pnpm cdk deploy --app "packages/infra/cdk.out" --context env=prod'
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
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### Build Artifacts
- **Java JAR**: Shaded JAR with all dependencies (`passkey-notifications-{version}.jar`)
- **Docker Image**: Multi-stage Docker image with optimized layers
- **Configuration Bundle**: Environment-specific configuration files
- **CDK Assets**: Infrastructure deployment artifacts

### Deployment Process
1. **Code Commit**: Developer pushes code to feature branch
2. **Feature Build**: Jenkins builds and tests feature branch
3. **Pull Request**: Code review and approval process
4. **Merge to Develop**: Automatic deployment to dev environment
5. **Staging Deployment**: Manual promotion to staging environment
6. **Production Deployment**: Approval-gated deployment to production

## Configuration Management

### Environment-Specific Configuration
```yaml
# Base configuration (application.yaml)
server:
  applicationConnectors:
    - type: http
      port: ${PORT:-8080}

# Environment overrides (dev.yaml, staging.yaml, prod.yaml)
database:
  url: ${DATABASE_URL}
  user: ${DATABASE_USER}
  password: ${DATABASE_PASSWORD}

awsCredentialsConfig:
  region: ${AWS_REGION}

# Secrets from AWS Secrets Manager
secrets:
  - name: "passkey-notifications/${ENV}/database"
    keys: ["username", "password"]
  - name: "passkey-notifications/${ENV}/api-keys"
    keys: ["passkey-event-api-key", "passkey-hotel-api-key"]
```

### Configuration Sources (Priority Order)
1. **Environment Variables**: Runtime environment variables
2. **AWS Secrets Manager**: Sensitive configuration values
3. **Configuration Files**: Environment-specific YAML files
4. **Default Values**: Application defaults

### Secret Management
```bash
# Store database credentials
aws secretsmanager create-secret \
  --name "passkey-notifications/prod/database" \
  --description "Database credentials for passkey-notifications prod" \
  --secret-string '{"username":"passkey_user","password":"secure_password"}'

# Store API keys
aws secretsmanager create-secret \
  --name "passkey-notifications/prod/api-keys" \
  --description "API keys for external services" \
  --secret-string '{"passkey-event-api-key":"key123","passkey-hotel-api-key":"key456"}'
```

## Rollback Procedures

### Application Rollback
1. **Immediate Rollback** (< 5 minutes):
   ```bash
   # Rollback to previous ECS task definition
   aws ecs update-service \
     --cluster passkey-notifications-prod \
     --service passkey-notifications \
     --task-definition passkey-notifications:PREVIOUS_REVISION
   ```

2. **Database Rollback** (if schema changes):
   ```bash
   # Run rollback migration scripts
   mvn flyway:undo -Dflyway.target=previous_version
   ```

3. **Infrastructure Rollback**:
   ```bash
   # Rollback CDK stack to previous version
   pnpm cdk deploy --app "previous-version/cdk.out" --context env=prod
   ```

### Rollback Decision Matrix
| Issue Type | Rollback Method | Time to Rollback | Risk Level |
|------------|----------------|------------------|------------|
| Application Bug | ECS Task Definition | 2-3 minutes | Low |
| Configuration Error | Environment Variables | 1-2 minutes | Low |
| Database Schema Issue | Migration Rollback | 10-30 minutes | High |
| Infrastructure Issue | CDK Stack Rollback | 15-45 minutes | Medium |

### Rollback Validation
```bash
#!/bin/bash
# rollback-validation.sh

echo "Validating rollback..."

# Check service health
curl -f http://passkey-notifications.prod.cvent.com/health || exit 1

# Check database connectivity
curl -f http://passkey-notifications.prod.cvent.com/admin/health/database || exit 1

# Check SQS processing
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/account/passkey-autoblock-events-prod \
  --attribute-names ApproximateNumberOfMessages

echo "Rollback validation successful"
```

## Blue-Green Deployment

### Strategy Overview
- **Blue Environment**: Current production environment
- **Green Environment**: New version deployment target
- **Traffic Switching**: ALB target group switching
- **Validation**: Automated and manual testing on green environment

### Deployment Steps
1. **Deploy Green Environment**:
   ```bash
   # Deploy new version to green environment
   pnpm cdk deploy --context env=prod --context color=green
   ```

2. **Validate Green Environment**:
   ```bash
   # Run smoke tests against green environment
   ./scripts/smoke-tests.sh --target=green
   ```

3. **Switch Traffic**:
   ```bash
   # Update ALB to route traffic to green environment
   aws elbv2 modify-listener \
     --listener-arn $LISTENER_ARN \
     --default-actions Type=forward,TargetGroupArn=$GREEN_TARGET_GROUP_ARN
   ```

4. **Monitor and Validate**:
   - Monitor error rates and response times
   - Validate business metrics
   - Check for any alerts or issues

5. **Cleanup Blue Environment** (after validation period):
   ```bash
   # Terminate blue environment resources
   pnpm cdk destroy --context env=prod --context color=blue
   ```

## Disaster Recovery

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 15 minutes
- **Availability Target**: 99.9% uptime

### Backup Strategy
- **Database**: Automated RDS snapshots (daily) + transaction log backups (15 min)
- **DynamoDB**: Point-in-time recovery enabled
- **Configuration**: Stored in version control and S3
- **Application Code**: Git repository with multiple remotes

### Disaster Recovery Procedures
1. **Assess Impact**: Determine scope and severity of outage
2. **Activate DR Site**: Deploy to secondary AWS region
3. **Restore Data**: Restore from latest backups
4. **Update DNS**: Route traffic to DR environment
5. **Validate Service**: Comprehensive testing of restored service
6. **Monitor**: Continuous monitoring during DR operation

### DR Testing
- **Monthly**: Automated DR deployment testing
- **Quarterly**: Full DR exercise with data restoration
- **Annually**: Complete disaster simulation with all stakeholders