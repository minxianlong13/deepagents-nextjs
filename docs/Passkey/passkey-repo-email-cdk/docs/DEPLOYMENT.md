# Deployment

## Infrastructure

### AWS Cloud Platform
The Passkey Email CDK service is deployed entirely on AWS using a serverless architecture:

- **Compute**: AWS Lambda functions for all business logic
- **Orchestration**: AWS Step Functions for workflow management
- **Storage**: Amazon DynamoDB for persistent data
- **Messaging**: Amazon SQS FIFO queues for reliable message processing
- **Monitoring**: Amazon CloudWatch for metrics, logs, and alarms
- **Security**: AWS IAM for access control and AWS Systems Manager Parameter Store for secrets
- **Networking**: VPC integration for secure communication

### Infrastructure as Code
All infrastructure is defined using AWS CDK (Cloud Development Kit) with TypeScript:
- **CDK Version**: 2.178.2
- **Language**: TypeScript 4.5.4
- **Deployment Tool**: CDK CLI with Cvent extensions

### Resource Organization
Resources are organized into logical CDK stacks:
- **Application Stack**: Main orchestration and configuration
- **DynamoDB Stack**: Database tables and indexes
- **Step Functions Stack**: Workflow definitions and Lambda integrations
- **Queue Stack**: SQS queues and dead letter queues
- **Roles Stack**: IAM roles and policies
- **Automation DynamoDB Stack**: Automation-specific data storage

## Environments

### Sandbox Environment
**Purpose**: Local development and individual testing

**Configuration**:
- **AWS Account**: Developer sandbox accounts
- **Region**: us-east-1
- **Resource Naming**: Includes developer ID and version for isolation
- **Retention**: Manual cleanup required
- **Access**: Individual developer access via oktaws

**Deployment Command**:
```bash
pnpm sandbox:setup
```

**Resource Examples**:
- DynamoDB Table: `passkey-email-cdk-dynamodb-v1.0.0-taskLog`
- SQS Queue: `passkey-email-cdk-queue-v1.0.0.fifo`
- Step Function: `passkey-email-cdk-process-email-event-v1.0.0-stateMachine`

### CI Environment
**Purpose**: Continuous integration testing and automated validation

**Configuration**:
- **AWS Account**: Shared CI account
- **Region**: us-east-1
- **Resource Naming**: Includes branch and build number for isolation
- **Retention**: Automatic cleanup after 1 day (ephemeral resources)
- **Access**: Jenkins service account

**Deployment**:
- Triggered automatically on pull requests
- Runs full test suite before deployment
- Deploys to isolated environment per branch
- Automatically tears down after testing

**Resource Examples**:
- DynamoDB Table: `passkey-email-cdk-dynamodb-ci-branch-123-taskLog`
- SQS Queue: `passkey-email-cdk-queue-ci-branch-123.fifo`
- Step Function: `passkey-email-cdk-process-email-event-ci-branch-123-stateMachine`

### Production Environment
**Purpose**: Live production workloads

**Configuration**:
- **AWS Account**: Production account with strict access controls
- **Region**: us-east-1 (primary), us-west-2 (disaster recovery)
- **Resource Naming**: Environment-specific without version numbers
- **Retention**: Persistent with backup and archival policies
- **Access**: Limited to production deployment service accounts

**Deployment**:
- Triggered by release branches (master, release/*, hotfix/*)
- Requires approval for production deployment
- Blue-green deployment strategy
- Comprehensive monitoring and rollback procedures

**Resource Examples**:
- DynamoDB Table: `passkey-email-taskLog-production`
- SQS Queue: `passkey-email-queue-production.fifo`
- Step Function: `process-email-event-state-machine-production`

## CI/CD Pipeline

### Jenkins Pipeline Configuration
The service uses a Jenkins-based CI/CD pipeline with the following configuration:

```groovy
buildPipeline(
    awsUser: 'cdk',
    trunk: 'master',
    checkmarx: [
        branch: 'master',
        syncMode: false,
        teamPath: 'CxServer\\SAST\\Cvent\\Passkey',
        presetValue: '100008'
    ],
    ci: [
        lock: 'branch' // allow parallel ci builds across branches
    ],
    release: [
        branches: ['master', 'release/.*', 'hotfix/.*']
    ],
    publish: [
        [branches: ['development', 'master']]
    ],
    slack: [
        [branches: ['master', 'development', 'release/.*', 'hotfix/.*'], channels: ['passkey-api']],
        [branches: ['.*'], channels: ['_owner_']]
    ]
)
```

### Pipeline Stages

#### 1. Source Control
- **Repository**: GitHub (cvent-internal/passkey-email-cdk)
- **Branching Strategy**: GitFlow with master, development, release, and hotfix branches
- **Triggers**: Webhook-based triggers on push and pull request events

#### 2. Build Stage
```bash
# Install dependencies
pnpm install

# Compile TypeScript
pnpm build:ts

# Build CDK assets
pnpm build:cdk

# Run linting
pnpm lint
```

#### 3. Test Stage
```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Generate coverage reports
pnpm test:coverage

# Run security scans
pnpm test:security
```

#### 4. Security Scanning
- **Checkmarx SAST**: Static application security testing
- **Dependency Scanning**: Automated vulnerability scanning of dependencies
- **License Compliance**: Verification of open source license compliance

#### 5. Package Stage
```bash
# Create deployment packages
pnpm build

# Generate CDK synthesis
cdk-cvent synth

# Create deployment artifacts
cdk-cvent package
```

#### 6. Deploy Stage
```bash
# Deploy to CI environment
cdk-cvent deploy --assembly cdk.out/ci

# Run smoke tests
pnpm test:smoke

# Deploy to production (release branches only)
cdk-cvent deploy --assembly cdk.out/production
```

### Deployment Scripts

#### Sandbox Deployment
```json
{
  "sandbox:setup": "cdk-cvent deploy --assembly cdk.out/local",
  "sandbox:teardown": "cdk-cvent destroy --assembly cdk.out/local"
}
```

#### CI Deployment
```json
{
  "ci:setup": "cdk-cvent deploy",
  "ci:teardown": "cdk-cvent destroy"
}
```

#### Production Release
```json
{
  "release:publish": "cdk-cvent release:publish --project passkey-email",
  "release:version": "changeset-cvent release:version"
}
```

## Configuration Management

### Environment-Specific Configuration

#### Local Configuration (`local.ts`)
```typescript
export const localConfig: EmailProps = {
  awsEnvironment: { account: 'sandbox', region: 'us-east-1' },
  cventEnvironment: 'sandbox',
  cventSubEnv: 'local',
  version: process.env.VERSION || 'local',
  // ... other configuration
};
```

#### CI Configuration (`ci.ts`)
```typescript
export const ciConfig: EmailProps = {
  awsEnvironment: { account: 'ci-account', region: 'us-east-1' },
  cventEnvironment: 'ci',
  cventSubEnv: 'testing',
  version: process.env.BUILD_NUMBER || 'ci',
  // ... other configuration
};
```

#### Production Configuration (`production.ts`)
```typescript
export const productionConfig: EmailProps = {
  awsEnvironment: { account: 'prod-account', region: 'us-east-1' },
  cventEnvironment: 'production',
  cventSubEnv: 'prod',
  version: process.env.RELEASE_VERSION,
  // ... other configuration
};
```

### Secret Management
- **API Keys**: Stored in AWS Systems Manager Parameter Store
- **Database Credentials**: Managed by AWS IAM roles
- **External Service Keys**: Encrypted parameters with KMS
- **Environment Variables**: Non-sensitive configuration only

### Parameter Store Structure
```
/passkey-email/
├── api-keys/
│   ├── smart-campaign-api-key
│   ├── event-service-api-key
│   └── experiment-service-api-key
├── endpoints/
│   ├── smart-campaign-endpoint
│   ├── event-service-endpoint
│   └── business-text-endpoint
└── configuration/
    ├── authorized-email-domains
    └── automation-participants
```

## Rollback Procedures

### Automated Rollback
1. **Health Check Failures**: Automatic rollback triggered by CloudWatch alarms
2. **Error Rate Thresholds**: Rollback when error rates exceed 5% for 5 minutes
3. **Performance Degradation**: Rollback when response times exceed SLA thresholds

### Manual Rollback Process

#### Step 1: Identify Issue
```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace "AWS/Lambda" \
  --metric-name "Errors" \
  --dimensions Name=FunctionName,Value=passkey-email-processing

# Check recent deployments
cdk-cvent list-deployments --service passkey-email
```

#### Step 2: Rollback to Previous Version
```bash
# Rollback CDK stack
cdk-cvent rollback --stack-name passkey-email-cdk-production \
  --target-version 1.2.3

# Verify rollback
cdk-cvent diff --stack-name passkey-email-cdk-production
```

#### Step 3: Validate Rollback
```bash
# Run smoke tests
pnpm test:smoke --environment production

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace "PasskeyEmail" \
  --metric-name "SuccessRate"
```

#### Step 4: Communication
- Notify stakeholders via Slack (#passkey-api channel)
- Update incident tracking system
- Document rollback reason and resolution

### Database Rollback Considerations
- **DynamoDB**: Point-in-time recovery available for up to 35 days
- **Schema Changes**: Backward compatibility maintained for smooth rollbacks
- **Data Migration**: Reversible migration scripts for schema changes

### Lambda Function Rollback
- **Versioning**: Each deployment creates a new Lambda version
- **Aliases**: Production alias points to stable version
- **Traffic Shifting**: Gradual traffic shifting for canary deployments

## Monitoring and Alerting

### CloudWatch Alarms

#### Critical Alarms
- **Lambda Errors**: Error rate > 1% for 5 minutes
- **Step Function Failures**: Execution failure rate > 5% for 10 minutes
- **DynamoDB Throttling**: Throttled requests > 0 for 5 minutes
- **SQS Dead Letter Queue**: Messages in DLQ > 0

#### Warning Alarms
- **Lambda Duration**: Average duration > 30 seconds for 10 minutes
- **Memory Utilization**: Memory usage > 80% for 15 minutes
- **Queue Depth**: SQS queue depth > 100 messages for 10 minutes

### Deployment Monitoring

#### Pre-deployment Checks
```bash
# Verify infrastructure
cdk-cvent diff --stack-name passkey-email-cdk-production

# Check dependencies
pnpm audit

# Validate configuration
pnpm validate:config
```

#### Post-deployment Validation
```bash
# Health check
curl -f https://api.passkey.com/health/email-service

# Smoke tests
pnpm test:smoke --environment production

# Metrics validation
aws cloudwatch get-metric-statistics \
  --namespace "PasskeyEmail" \
  --metric-name "DeploymentSuccess"
```

### Incident Response

#### Severity Levels
- **P1 (Critical)**: Service completely down, immediate response required
- **P2 (High)**: Significant functionality impacted, response within 2 hours
- **P3 (Medium)**: Minor functionality impacted, response within 8 hours
- **P4 (Low)**: Cosmetic issues, response within 24 hours

#### Response Procedures
1. **Detection**: Automated alerts or manual reporting
2. **Assessment**: Determine severity and impact
3. **Response**: Immediate mitigation actions
4. **Communication**: Stakeholder notification
5. **Resolution**: Root cause analysis and fix
6. **Post-mortem**: Documentation and process improvement

### Disaster Recovery

#### Backup Strategy
- **DynamoDB**: Point-in-time recovery and on-demand backups
- **Code**: Git repository with multiple remotes
- **Configuration**: Parameter Store with cross-region replication
- **Infrastructure**: CDK templates in version control

#### Recovery Procedures
1. **Assessment**: Determine scope of disaster
2. **Activation**: Activate disaster recovery plan
3. **Recovery**: Deploy to alternate region if necessary
4. **Validation**: Verify service functionality
5. **Failback**: Return to primary region when available

#### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Data Loss Tolerance**: Minimal (< 15 minutes)