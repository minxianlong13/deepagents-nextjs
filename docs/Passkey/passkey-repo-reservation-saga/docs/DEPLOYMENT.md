# Deployment

## Infrastructure

The Passkey Reservation Saga is deployed on AWS using Infrastructure as Code (IaC) with AWS CDK. The service runs across multiple AWS regions with global DynamoDB tables for data replication.

### AWS Services Used
- **AWS Lambda** - Serverless compute for business logic
- **Amazon DynamoDB** - NoSQL database with Global Tables
- **AWS Step Functions** - Workflow orchestration
- **Amazon SQS** - Message queuing
- **Amazon EventBridge** - Event-driven architecture
- **AWS API Gateway** - REST API endpoints
- **Amazon S3** - File storage and CDK assets
- **AWS Systems Manager** - Configuration management
- **AWS CloudWatch** - Monitoring and logging

## Environments

### Development
- **Account**: cvent-sandbox
- **Region**: us-east-1
- **Purpose**: Feature development and testing
- **Stack Naming**: `*-dev-*`
- **Auto-deployment**: CI branches trigger deployment

### Staging
- **Account**: cvent-staging
- **Region**: us-east-1, eu-west-1
- **Purpose**: Pre-production testing and validation
- **Stack Naming**: `*-staging-*`
- **Data**: Anonymized production-like data

### Production
- **Account**: cvent-production
- **Region**: us-east-1 (primary), eu-west-1 (secondary)
- **Purpose**: Live customer traffic
- **Stack Naming**: `*-prod-*`
- **High Availability**: Multi-region deployment

### Ecommerce
- **Account**: cvent-ecommerce
- **Region**: us-east-1
- **Purpose**: Ecommerce-specific workloads
- **Stack Naming**: `*-ecommerce-*`
- **Isolation**: Separate from main production

## CI/CD Pipeline

### Jenkins Pipeline
The deployment pipeline is managed through Jenkins with the following stages:

```groovy
buildPipeline([
    label: 'ecs-x86-xlarge',
    awsUser: 'cdk',
    checkmarx: [
        branch: 'master',
        syncMode: false,
        teamPath: 'CxServer\\SAST\\Cvent\\Passkey',
        presetValue: '100008'
    ],
    ci: [
        lock: 'branch'
    ],
    release: [
        branches: [ 'master', 'release/.*', 'hotfix/.*' ]
    ],
    publish: [
        [ branches: [ 'development' ] ]
    ]
])
```

### Pipeline Stages

#### 1. Build Stage
```bash
# Install dependencies
pnpm -r install

# Lint code
pnpm -r lint

# Build TypeScript
pnpm -r build

# Run tests
pnpm -r test

# Update snapshots (if needed)
pnpm update-snapshots
```

#### 2. Security Scanning
- **Checkmarx SAST** - Static application security testing
- **Dependency scanning** - Vulnerable package detection
- **License compliance** - Open source license validation

#### 3. CDK Synthesis
```bash
# Synthesize CloudFormation templates
cdk synth

# Validate templates
cdk diff
```

#### 4. Deployment
```bash
# Deploy to target environment
cdk deploy --all --require-approval never
```

### Branch Strategy

#### Development Branch
- **Trigger**: Push to `development`
- **Target**: Development environment
- **Auto-deploy**: Yes
- **Approval**: Not required

#### Master Branch
- **Trigger**: Push to `master`
- **Target**: Staging → Production
- **Auto-deploy**: Staging (yes), Production (manual approval)
- **Approval**: Required for production

#### Release Branches
- **Pattern**: `release/*`, `hotfix/*`
- **Target**: Production
- **Auto-deploy**: Manual approval required
- **Validation**: Full test suite + manual QA

## Deployment Process

### Stack Dependencies
Stacks must be deployed in the following order due to cross-stack dependencies:

1. **Global Tables Stack** - DynamoDB Global Tables
2. **Reservation Saga Stack** - Main application stack
3. **Housing Domain Stack** - Domain-specific resources

### Manual Deployment

#### Prerequisites
```bash
# Install AWS CDK CLI
npm install -g aws-cdk

# Configure AWS credentials
oktaws

# Install dependencies
pnpm -r install

# Build project
pnpm -r build
```

#### Deployment Commands
```bash
# Navigate to CDK package
cd packages/passkey-reservation-saga-cdk

# List available stacks
pnpm cdk list

# Deploy specific stack
pnpm cdk deploy <stack-name>

# Deploy all stacks
pnpm cdk deploy --all
```

### Environment-Specific Configuration

#### Development
```bash
# Deploy to development
cdk deploy ReservationSagaStackDev --context environment=development
```

#### Staging
```bash
# Deploy to staging
cdk deploy ReservationSagaStackStaging --context environment=staging
```

#### Production
```bash
# Deploy to production (requires approval)
cdk deploy ReservationSagaStackProd --context environment=production
```

## Configuration Management

### Environment Variables
Configuration is managed through AWS Systems Manager Parameter Store:

```typescript
// Example parameter paths
/passkey/reservation-saga/dev/api-key
/passkey/reservation-saga/staging/database-url
/passkey/reservation-saga/prod/external-service-endpoint
```

### CDK Context
Environment-specific values are stored in `cdk.context.json`:

```json
{
  "environments": {
    "dev": {
      "account": "123456789012",
      "region": "us-east-1"
    },
    "prod": {
      "account": "987654321098",
      "region": "us-east-1"
    }
  }
}
```

### Feature Flags
Feature toggles are managed through the experiments service:

```typescript
const featureFlag = await experimentsService.getFeature('new-reservation-flow');
```

## Monitoring & Alerting

### DataDog Integration
- **Dashboard**: [Passkey Reservation Dashboard](https://cvent.datadoghq.com/dashboard/yyx-n3a-38c/passkey-reservation-dashboard)
- **Service**: `passkey-reservation-saga`
- **Alerts**: Error rates, latency, throughput

### CloudWatch Alarms
- Lambda function errors
- DynamoDB throttling
- Step Function failures
- SQS queue depth

### Health Checks
- API Gateway health endpoints
- Lambda function warm-up
- Database connectivity checks

## Rollback Procedures

### Automated Rollback
```bash
# Rollback to previous version
cdk deploy --rollback
```

### Manual Rollback
1. Identify the last known good deployment
2. Checkout the corresponding Git commit
3. Deploy the previous version
4. Verify system health

### Database Rollback
- DynamoDB point-in-time recovery
- Global table consistency verification
- Data migration scripts (if schema changes)

## Disaster Recovery

### Multi-Region Setup
- **Primary Region**: us-east-1
- **Secondary Region**: eu-west-1
- **Failover**: Automatic via Route 53 health checks

### Backup Strategy
- **DynamoDB**: Point-in-time recovery enabled
- **S3**: Cross-region replication
- **Lambda**: Code stored in S3 with versioning

### Recovery Procedures
1. Assess impact and scope
2. Activate secondary region
3. Update DNS routing
4. Verify data consistency
5. Monitor system health

## Security Considerations

### Deployment Security
- **IAM Roles**: Least privilege principle
- **Secrets Management**: AWS Secrets Manager
- **Network Security**: VPC deployment
- **Encryption**: At rest and in transit

### Access Control
- **Jenkins**: Role-based access control
- **AWS**: Cross-account role assumption
- **Approval Gates**: Production deployment approval

## Troubleshooting

### Common Issues

#### CDK Deployment Failures
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name <stack-name>

# View CDK diff
cdk diff <stack-name>
```

#### Lambda Function Issues
```bash
# View function logs
aws logs tail /aws/lambda/<function-name> --follow

# Check function configuration
aws lambda get-function --function-name <function-name>
```

#### DynamoDB Issues
```bash
# Check table status
aws dynamodb describe-table --table-name <table-name>

# Monitor metrics
aws cloudwatch get-metric-statistics --namespace AWS/DynamoDB
```

### Support Contacts
- **Primary Team**: Steakholders
- **Secondary Team**: JDivision
- **Slack Channel**: #passkey-api
- **Escalation**: On-call rotation via PagerDuty

## Performance Optimization

### Lambda Optimization
- Function warming strategies
- Memory allocation tuning
- Timeout configuration
- Cold start mitigation

### DynamoDB Optimization
- Partition key design
- GSI optimization
- Read/write capacity planning
- Query pattern optimization

### Step Functions Optimization
- Parallel execution
- Error handling
- Retry strategies
- State machine design

## Cost Management

### Cost Optimization
- Lambda provisioned concurrency
- DynamoDB on-demand vs provisioned
- S3 storage classes
- CloudWatch log retention

### Cost Monitoring
- AWS Cost Explorer
- Resource tagging
- Budget alerts
- Usage reports