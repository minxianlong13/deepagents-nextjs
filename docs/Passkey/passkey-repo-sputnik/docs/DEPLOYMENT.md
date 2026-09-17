# Deployment

## Infrastructure

Passkey Sputnik is deployed on AWS using a serverless architecture with the following key components:

- **AWS Lambda**: Serverless compute for all business logic
- **AWS API Gateway**: REST API endpoints and request routing
- **AWS Step Functions**: Workflow orchestration for complex transfers
- **AWS DynamoDB**: NoSQL database for transfer state and scheduling
- **AWS SQS**: Message queuing for asynchronous processing
- **AWS EventBridge**: Event-driven communication between services
- **AWS CloudWatch**: Monitoring, logging, and alerting
- **AWS Systems Manager**: Parameter and secrets management

## Environments

### Development (dev)
- **Purpose**: Development and testing environment
- **AWS Account**: `123456789012` (Development)
- **Region**: `us-east-1`
- **API Endpoint**: `https://api-dev.passkey.com/sputnik`
- **Monitoring**: Basic CloudWatch metrics
- **Data Retention**: 7 days for logs, 30 days for data
- **Auto-scaling**: Minimal Lambda concurrency limits

### Staging (staging)
- **Purpose**: Pre-production testing and validation
- **AWS Account**: `234567890123` (Staging)
- **Region**: `us-east-1`
- **API Endpoint**: `https://api-staging.passkey.com/sputnik`
- **Monitoring**: Full monitoring with DataDog integration
- **Data Retention**: 30 days for logs, 90 days for data
- **Auto-scaling**: Production-like scaling configuration

### Production (prod)
- **Purpose**: Live production environment
- **AWS Account**: `345678901234` (Production)
- **Region**: `us-east-1` (Primary), `us-west-2` (DR)
- **API Endpoint**: `https://api.passkey.com/sputnik`
- **Monitoring**: Comprehensive monitoring and alerting
- **Data Retention**: 90 days for logs, 7 years for audit data
- **Auto-scaling**: Full auto-scaling with reserved capacity

## CI/CD Pipeline

### Jenkins Pipeline
The deployment pipeline is managed through Jenkins with the following stages:

#### 1. Source Control
- **Repository**: `git@github.com:cvent-internal/passkey-sputnik.git`
- **Branches**: 
  - `master`: Production deployments
  - `development`: Development deployments
  - Feature branches: CI validation only

#### 2. Build Stage
```groovy
stage('Build') {
    steps {
        sh 'pnpm install'
        sh 'pnpm build'
        sh 'pnpm test'
        sh 'pnpm lint'
    }
}
```

#### 3. Security Scanning
- **Checkmarx SAST**: Static application security testing
- **Team Path**: `CxServer\\SAST\\Cvent\\Passkey`
- **Preset**: `100011`
- **Branch**: `master` (sync mode disabled)

#### 4. Quality Gates
- **SonarQube**: Code quality and coverage analysis
- **Coverage Threshold**: 80% minimum
- **Quality Gate**: Must pass before deployment
- **Project Key**: `passkey-sputnik`

#### 5. Package & Publish
```groovy
stage('Package') {
    steps {
        sh 'pnpm ci:build'
        sh 'cdk-cvent synth'
    }
}
```

#### 6. Deploy to Environments
- **Development**: Automatic deployment on `development` branch
- **Staging**: Manual approval required
- **Production**: Manual approval + change management process

### Octopus Deploy Integration
- **Project**: `passkey-sputnik`
- **Deployment Process**: Multi-step deployment with rollback capability
- **Variables**: Environment-specific configuration
- **Channels**: Separate channels for each environment
- **Retention Policy**: Keep 10 releases per environment

## Configuration Management

### Environment-Specific Configuration

#### Development
```yaml
environment: development
logLevel: debug
lambdaMemory: 512
apiGatewayThrottling:
  burstLimit: 100
  rateLimit: 50
dynamodbBillingMode: PAY_PER_REQUEST
```

#### Staging
```yaml
environment: staging
logLevel: info
lambdaMemory: 1024
apiGatewayThrottling:
  burstLimit: 500
  rateLimit: 250
dynamodbBillingMode: PAY_PER_REQUEST
```

#### Production
```yaml
environment: production
logLevel: warn
lambdaMemory: 1024
apiGatewayThrottling:
  burstLimit: 2000
  rateLimit: 1000
dynamodbBillingMode: PAY_PER_REQUEST
provisionedConcurrency: 10
```

### Secrets Management
All sensitive configuration is stored in AWS Systems Manager Parameter Store:

```bash
# Development
/passkey-sputnik/dev/API_KEY
/passkey-sputnik/dev/ENCRYPTION_DECRYPTION_KEY
/passkey-sputnik/dev/ENCRYPTION_SECRET_KEY
/passkey-sputnik/dev/EXPERIMENTS_API_KEY
/passkey-sputnik/dev/PAYMENTS_PROXY_JWT_SECRET

# Production
/passkey-sputnik/prod/API_KEY
/passkey-sputnik/prod/ENCRYPTION_DECRYPTION_KEY
/passkey-sputnik/prod/ENCRYPTION_SECRET_KEY
/passkey-sputnik/prod/EXPERIMENTS_API_KEY
/passkey-sputnik/prod/PAYMENTS_PROXY_JWT_SECRET
```

## Deployment Process

### Automated Deployment (Development)
1. **Trigger**: Push to `development` branch
2. **Build**: Jenkins builds and tests the application
3. **Deploy**: Automatic deployment to development environment
4. **Verify**: Smoke tests run against deployed endpoints
5. **Notify**: Slack notification to `#passkey-api` channel

### Manual Deployment (Staging/Production)
1. **Preparation**: Create deployment ticket in JIRA
2. **Approval**: Get approval from team lead and product owner
3. **Pre-deployment**: 
   - Verify all tests pass
   - Check quality gates
   - Review security scan results
4. **Deployment**:
   - Deploy to staging first
   - Run integration tests
   - Deploy to production with approval
5. **Post-deployment**:
   - Monitor metrics and logs
   - Run smoke tests
   - Update deployment documentation

### Deployment Commands

#### Local Development
```bash
# Setup local environment
pnpm install
pnpm build

# Deploy to CI environment
pnpm ci:setup

# Teardown CI environment
pnpm ci:teardown
```

#### CDK Deployment
```bash
# Synthesize CloudFormation templates
cdk synth

# Deploy to specific environment
cdk deploy --profile passkey-dev
cdk deploy --profile passkey-staging
cdk deploy --profile passkey-prod

# Diff changes before deployment
cdk diff --profile passkey-prod
```

## Rollback Procedures

### Automatic Rollback Triggers
- **Error Rate**: >5% error rate for 5 minutes
- **Latency**: >2 second average response time
- **Health Check**: API health check failures
- **Custom Metrics**: Transfer failure rate >10%

### Manual Rollback Process
1. **Identify Issue**: Determine the scope and impact
2. **Decision**: Make rollback decision with team lead
3. **Execute Rollback**:
   ```bash
   # Rollback to previous version
   cdk deploy --profile passkey-prod --rollback
   
   # Or deploy specific version
   octopus deploy-release --project=passkey-sputnik --version=1.22.0
   ```
4. **Verify**: Confirm rollback success and service restoration
5. **Communicate**: Notify stakeholders of rollback completion
6. **Post-mortem**: Schedule incident review meeting

### Rollback Verification
- **Health Checks**: All endpoints return 200 status
- **Metrics**: Error rates return to baseline
- **Functionality**: Key transfer operations working
- **Dependencies**: All downstream services accessible

## Blue-Green Deployment

### Strategy
Production deployments use a blue-green strategy to minimize downtime:

1. **Blue Environment**: Current production environment
2. **Green Environment**: New version deployed alongside blue
3. **Testing**: Green environment tested with subset of traffic
4. **Cutover**: Traffic gradually shifted from blue to green
5. **Cleanup**: Blue environment kept for quick rollback

### Traffic Shifting
```yaml
# Initial deployment (0% traffic to green)
trafficShifting:
  blue: 100%
  green: 0%

# Canary deployment (10% traffic to green)
trafficShifting:
  blue: 90%
  green: 10%

# Full deployment (100% traffic to green)
trafficShifting:
  blue: 0%
  green: 100%
```

## Monitoring During Deployment

### Key Metrics to Monitor
- **Lambda Invocations**: Function execution count
- **Error Rate**: Percentage of failed requests
- **Duration**: Average response time
- **Throttles**: Lambda throttling events
- **DynamoDB Metrics**: Read/write capacity utilization
- **API Gateway Metrics**: Request count and latency

### Alerting Thresholds
- **Critical**: Error rate >5%, Latency >5 seconds
- **Warning**: Error rate >2%, Latency >2 seconds
- **Info**: Deployment started/completed notifications

### Dashboard Links
- **DataDog**: [Passkey Sputnik Dashboard](https://cvent.datadoghq.com/dashboard/tet-93n-kdh/passkey-sputnik-transfers)
- **CloudWatch**: AWS Console CloudWatch dashboards
- **Jenkins**: [Build Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-sputnik)

## Disaster Recovery

### Multi-Region Setup
- **Primary Region**: `us-east-1`
- **Secondary Region**: `us-west-2`
- **Data Replication**: DynamoDB Global Tables
- **DNS Failover**: Route 53 health checks

### Recovery Time Objectives
- **RTO**: 4 hours maximum downtime
- **RPO**: 15 minutes maximum data loss
- **MTTR**: 2 hours mean time to recovery

### DR Testing
- **Frequency**: Quarterly disaster recovery drills
- **Scope**: Full service failover to secondary region
- **Validation**: All critical functions tested
- **Documentation**: DR runbook updated after each test

## Compliance and Security

### Change Management
- **CAB Approval**: Required for production changes
- **Documentation**: All changes documented in JIRA
- **Testing**: Comprehensive testing in staging
- **Rollback Plan**: Documented rollback procedures

### Security Scanning
- **SAST**: Static application security testing
- **Dependency Scanning**: Automated vulnerability scanning
- **Container Scanning**: Docker image security analysis
- **Infrastructure Scanning**: CDK template security review

### Audit Trail
- **Deployment Logs**: All deployments logged and retained
- **Access Logs**: Who deployed what and when
- **Change History**: Complete history of infrastructure changes
- **Compliance Reports**: Regular compliance status reports