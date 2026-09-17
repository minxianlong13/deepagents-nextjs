# Deployment

## Infrastructure

### AWS Architecture
The Passkey Autoblock Autoprovision Service is deployed as a serverless application on AWS using the following services:

- **AWS Step Functions**: Orchestrates complex provisioning workflows
- **AWS Lambda**: Executes individual workflow steps and API handlers
- **Amazon API Gateway**: Provides REST and WebSocket API endpoints
- **Amazon DynamoDB**: Stores application state and execution tracking data
- **Amazon CloudWatch**: Monitoring, logging, and alerting
- **AWS IAM**: Identity and access management
- **Amazon S3**: Stores deployment artifacts and configuration assets

### Regional Deployment
- **Primary Region**: us-east-1 (N. Virginia)
- **Backup Region**: us-west-2 (Oregon) - for disaster recovery
- **Multi-AZ**: All services deployed across multiple Availability Zones

## Environments

### Development (Alpha)
- **Purpose**: Development and feature testing
- **AWS Account**: cvent-development
- **Stage**: alpha
- **API Gateway URL**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/alpha/`
- **Resource Scaling**: Minimal capacity for cost optimization
- **Data Retention**: 7 days for logs, 30 days for execution history
- **Monitoring**: Basic CloudWatch metrics and alarms

**Configuration**:
```bash
# Environment variables
STAGE=alpha
LOG_LEVEL=DEBUG
DYNAMODB_READ_CAPACITY=5
DYNAMODB_WRITE_CAPACITY=5
LAMBDA_MEMORY=512
MAX_CONCURRENT_EXECUTIONS=10
```

### Staging (Beta)
- **Purpose**: Pre-production testing and validation
- **AWS Account**: cvent-staging
- **Stage**: beta
- **API Gateway URL**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/beta/`
- **Resource Scaling**: Production-like capacity for realistic testing
- **Data Retention**: 30 days for logs, 90 days for execution history
- **Monitoring**: Enhanced monitoring with Datadog integration

**Configuration**:
```bash
# Environment variables
STAGE=beta
LOG_LEVEL=INFO
DYNAMODB_READ_CAPACITY=25
DYNAMODB_WRITE_CAPACITY=25
LAMBDA_MEMORY=1024
MAX_CONCURRENT_EXECUTIONS=50
```

### Production (Prod)
- **Purpose**: Live production workloads
- **AWS Account**: cvent-production
- **Stage**: prod
- **API Gateway URL**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/`
- **Resource Scaling**: Auto-scaling enabled with high availability
- **Data Retention**: 90 days for logs, 7 years for audit trails
- **Monitoring**: Full observability stack with alerting and on-call rotation

**Configuration**:
```bash
# Environment variables
STAGE=prod
LOG_LEVEL=WARN
DYNAMODB_READ_CAPACITY=100
DYNAMODB_WRITE_CAPACITY=100
LAMBDA_MEMORY=2048
MAX_CONCURRENT_EXECUTIONS=200
```

## CI/CD Pipeline

### Jenkins Pipeline
The service uses Jenkins for continuous integration and deployment:

**Pipeline URL**: [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-autoblock-autoprovision)

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

#### 2. Dependency Installation
```groovy
stage('Install Dependencies') {
    steps {
        sh 'pnpm -r install --frozen-lockfile'
    }
}
```

#### 3. Code Quality Checks
```groovy
stage('Code Quality') {
    parallel {
        stage('Lint') {
            steps {
                sh 'pnpm -r lint'
            }
        }
        stage('Security Scan') {
            steps {
                sh 'pnpm -r test:sonar'
            }
        }
    }
}
```

#### 4. Build and Test
```groovy
stage('Build and Test') {
    steps {
        sh 'pnpm -r build'
        sh 'pnpm -r test'
        sh 'pnpm -r test:coverage'
    }
    post {
        always {
            publishTestResults testResultsPattern: '**/test-results.xml'
            publishCoverageResults coverageResultsPattern: '**/coverage/lcov.info'
        }
    }
}
```

#### 5. CDK Synthesis
```groovy
stage('CDK Synth') {
    steps {
        sh 'cd packages/passkey-autoblock-autoprovision-cdk'
        sh 'pnpm cdk synth --all'
    }
    post {
        always {
            archiveArtifacts artifacts: '**/cdk.out/**/*', fingerprint: true
        }
    }
}
```

#### 6. Deployment
```groovy
stage('Deploy') {
    when {
        anyOf {
            branch 'master'
            branch 'release/*'
        }
    }
    steps {
        script {
            def environment = env.BRANCH_NAME == 'master' ? 'alpha' : 'beta'
            sh "pnpm cdk deploy --profile cvent-${environment} PasskeyAutoblockAutoprovisionStack-${environment}"
        }
    }
}
```

### Octopus Deploy Integration
Production deployments are managed through Octopus Deploy:

**Octopus URL**: [Octopus Deployment](https://octo.core.cvent.org/app#/Spaces-1/projects/autoblock-autoprovision-cdk/deployments)

#### Deployment Process
1. **Package Creation**: Jenkins creates deployment packages
2. **Artifact Upload**: Packages uploaded to Octopus Deploy
3. **Environment Promotion**: Manual approval for production deployments
4. **Blue-Green Deployment**: Zero-downtime deployment strategy
5. **Health Checks**: Automated post-deployment validation
6. **Rollback Capability**: Automated rollback on failure detection

## Configuration Management

### Environment-Specific Configuration

#### AWS Parameter Store
Sensitive configuration stored in AWS Systems Manager Parameter Store:
```bash
# Development
/passkey-autoblock-autoprovision/alpha/database/connection-string
/passkey-autoblock-autoprovision/alpha/auth/api-key
/passkey-autoblock-autoprovision/alpha/external-services/endpoints

# Staging
/passkey-autoblock-autoprovision/beta/database/connection-string
/passkey-autoblock-autoprovision/beta/auth/api-key
/passkey-autoblock-autoprovision/beta/external-services/endpoints

# Production
/passkey-autoblock-autoprovision/prod/database/connection-string
/passkey-autoblock-autoprovision/prod/auth/api-key
/passkey-autoblock-autoprovision/prod/external-services/endpoints
```

#### CDK Context Configuration
Environment-specific CDK context in `cdk.context.json`:
```json
{
  "alpha": {
    "account": "123456789012",
    "region": "us-east-1",
    "vpcId": "vpc-alpha123",
    "subnetIds": ["subnet-alpha1", "subnet-alpha2"]
  },
  "beta": {
    "account": "123456789013",
    "region": "us-east-1",
    "vpcId": "vpc-beta123",
    "subnetIds": ["subnet-beta1", "subnet-beta2"]
  },
  "prod": {
    "account": "123456789014",
    "region": "us-east-1",
    "vpcId": "vpc-prod123",
    "subnetIds": ["subnet-prod1", "subnet-prod2"]
  }
}
```

### Feature Flags
Feature flags managed through AWS AppConfig:
- **Auto-provisioning Rules**: Enable/disable specific provisioning algorithms
- **External Service Integration**: Toggle integration with external services
- **Monitoring Features**: Control monitoring and alerting behavior
- **Performance Optimizations**: Enable/disable performance enhancements

## Deployment Commands

### Manual Deployment

#### Prerequisites
```bash
# Install AWS CLI
aws --version

# Configure AWS credentials
aws configure --profile cvent-development
aws configure --profile cvent-staging
aws configure --profile cvent-production

# Install CDK CLI
npm install -g aws-cdk
cdk --version

# Verify credentials
aws sts get-caller-identity --profile cvent-development
```

#### Development Deployment
```bash
# Navigate to CDK package
cd packages/passkey-autoblock-autoprovision-cdk

# Install dependencies
pnpm install

# Build the project
pnpm build

# Deploy to development
pnpm cdk deploy --profile cvent-development PasskeyAutoblockAutoprovisionStack-alpha

# Verify deployment
aws cloudformation describe-stacks --stack-name PasskeyAutoblockAutoprovisionStack-alpha --profile cvent-development
```

#### Staging Deployment
```bash
# Deploy to staging
pnpm cdk deploy --profile cvent-staging PasskeyAutoblockAutoprovisionStack-beta

# Run smoke tests
pnpm test:smoke --environment=beta
```

#### Production Deployment
```bash
# Production deployments should use Octopus Deploy
# Manual deployment only for emergency situations

# Deploy to production (emergency only)
pnpm cdk deploy --profile cvent-production PasskeyAutoblockAutoprovisionStack-prod

# Immediate health check
curl -f https://api-prod.example.com/health
```

### Deployment Verification

#### Health Check Script
```bash
#!/bin/bash
# health-check.sh

ENVIRONMENT=$1
API_URL="https://api-${ENVIRONMENT}.example.com"

echo "Checking health of ${ENVIRONMENT} environment..."

# API Gateway health check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health")
if [ $HTTP_STATUS -eq 200 ]; then
    echo "✅ API Gateway is healthy"
else
    echo "❌ API Gateway health check failed (HTTP ${HTTP_STATUS})"
    exit 1
fi

# Step Functions check
aws stepfunctions list-executions --state-machine-arn "arn:aws:states:us-east-1:account:stateMachine:AutoprovisionOrchestrator" --max-items 1 --profile "cvent-${ENVIRONMENT}"
if [ $? -eq 0 ]; then
    echo "✅ Step Functions is accessible"
else
    echo "❌ Step Functions check failed"
    exit 1
fi

# DynamoDB check
aws dynamodb describe-table --table-name "AutoblockRequests-${ENVIRONMENT}" --profile "cvent-${ENVIRONMENT}" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ DynamoDB is accessible"
else
    echo "❌ DynamoDB check failed"
    exit 1
fi

echo "✅ All health checks passed for ${ENVIRONMENT}"
```

## Rollback Procedures

### Automated Rollback
The deployment pipeline includes automated rollback triggers:
- **Health Check Failures**: Automatic rollback if health checks fail post-deployment
- **Error Rate Threshold**: Rollback if error rate exceeds 5% for 5 minutes
- **Performance Degradation**: Rollback if response time increases by 50%

### Manual Rollback

#### CDK Rollback
```bash
# List recent deployments
aws cloudformation describe-stack-events --stack-name PasskeyAutoblockAutoprovisionStack-prod --profile cvent-production

# Rollback to previous version
pnpm cdk deploy --profile cvent-production PasskeyAutoblockAutoprovisionStack-prod --previous-parameters

# Alternative: Deploy specific version
git checkout <previous-commit-hash>
pnpm build
pnpm cdk deploy --profile cvent-production PasskeyAutoblockAutoprovisionStack-prod
```

#### Octopus Deploy Rollback
1. Navigate to Octopus Deploy dashboard
2. Select the autoblock-autoprovision-cdk project
3. Choose the target environment
4. Click "Deploy Previous Release"
5. Confirm rollback operation
6. Monitor deployment progress
7. Verify rollback success with health checks

### Emergency Procedures

#### Circuit Breaker Activation
```bash
# Disable auto-provisioning temporarily
aws ssm put-parameter --name "/passkey-autoblock-autoprovision/prod/feature-flags/auto-provision-enabled" --value "false" --overwrite --profile cvent-production

# Scale down Lambda concurrency
aws lambda put-provisioned-concurrency-config --function-name AutoprovisionOrchestrator --qualifier LIVE --provisioned-concurrency-config ProvisionedConcurrencyConfig=0 --profile cvent-production
```

#### Service Isolation
```bash
# Remove from load balancer
aws apigateway update-stage --rest-api-id <api-id> --stage-name prod --patch-ops op=replace,path=/throttle/rateLimit,value=0 --profile cvent-production

# Stop Step Function executions
aws stepfunctions stop-execution --execution-arn <execution-arn> --profile cvent-production
```

### Post-Rollback Validation
1. **Health Checks**: Verify all health endpoints return 200 OK
2. **Functional Tests**: Run critical path smoke tests
3. **Performance Monitoring**: Confirm response times are within SLA
4. **Error Rate Monitoring**: Verify error rates return to baseline
5. **Integration Tests**: Validate external service integrations
6. **User Acceptance**: Confirm business functionality is restored

### Incident Response
1. **Immediate Response**: Execute rollback procedures
2. **Communication**: Notify stakeholders via incident management system
3. **Root Cause Analysis**: Investigate deployment failure causes
4. **Documentation**: Update runbooks and procedures
5. **Prevention**: Implement additional safeguards to prevent recurrence