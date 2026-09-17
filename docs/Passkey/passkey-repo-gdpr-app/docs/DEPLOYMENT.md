# Deployment

## Infrastructure

### AWS Architecture

The Passkey GDPR App is deployed on Amazon Web Services (AWS) using a serverless architecture with the following components:

#### Core Services
- **AWS Lambda**: Serverless compute for application logic
- **Amazon API Gateway**: HTTP API endpoints and request routing
- **Amazon EventBridge**: Event scheduling and routing
- **AWS Systems Manager Parameter Store**: Configuration and secrets management
- **Amazon CloudWatch**: Monitoring, logging, and alerting
- **AWS CloudFormation**: Infrastructure as Code deployment

#### Supporting Services
- **AWS IAM**: Identity and access management
- **AWS Certificate Manager**: SSL/TLS certificate management
- **AWS X-Ray**: Distributed tracing (optional)
- **Amazon Route 53**: DNS management (if custom domains used)

### Infrastructure as Code (IaC)

The infrastructure is defined using AWS CDK v2 with TypeScript:

```typescript
// Example CDK stack structure
export class PasskeyGdprAppStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Lambda functions
    const gdprLambda = new Function(this, 'GdprLambda', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset('packages/gdpr-lambdas/lib')
    });

    // API Gateway
    const api = new HttpApi(this, 'GdprApi', {
      defaultAuthorizer: new HttpLambdaAuthorizer('Authorizer', authorizerLambda)
    });

    // EventBridge scheduler
    const scheduler = new Rule(this, 'GdprScheduler', {
      schedule: Schedule.cron({ minute: '0', hour: '2' })
    });
  }
}
```

## Environments

### Sandbox Environment
- **Purpose**: Development and testing
- **AWS Account**: aws-cvent-sandbox
- **Region**: us-east-1
- **Domain**: `api-sandbox.cvent.com/passkey-gdpr-app`
- **Deployment**: Automatic on feature branch merges
- **Data**: Test data only, no production data
- **Monitoring**: Basic CloudWatch monitoring

**Configuration**:
```bash
# Environment variables
ENVIRONMENT=sandbox
AWS_REGION=us-east-1
LOG_LEVEL=DEBUG
PARAMETER_STORE_PREFIX=/passkey-gdpr-app/sandbox
```

### Staging Environment
- **Purpose**: Pre-production testing and validation
- **AWS Account**: aws-cvent-staging
- **Region**: us-east-1
- **Domain**: `api-staging.cvent.com/passkey-gdpr-app`
- **Deployment**: Manual promotion from sandbox
- **Data**: Production-like test data
- **Monitoring**: Full monitoring with DataDog integration

**Configuration**:
```bash
# Environment variables
ENVIRONMENT=staging
AWS_REGION=us-east-1
LOG_LEVEL=INFO
PARAMETER_STORE_PREFIX=/passkey-gdpr-app/staging
```

### Production Environment
- **Purpose**: Live production workloads
- **AWS Account**: aws-cvent-production
- **Region**: us-east-1 (primary), us-west-2 (DR)
- **Domain**: `api.cvent.com/passkey-gdpr-app`
- **Deployment**: Manual promotion with approval gates
- **Data**: Live customer data
- **Monitoring**: Comprehensive monitoring, alerting, and on-call rotation

**Configuration**:
```bash
# Environment variables
ENVIRONMENT=production
AWS_REGION=us-east-1
LOG_LEVEL=WARN
PARAMETER_STORE_PREFIX=/passkey-gdpr-app/production
```

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The deployment pipeline is defined in the `Jenkinsfile` using the Cvent pipeline-utils library:

```groovy
@Library('pipeline-utils') _

buildPipeline(
    packageFilter: 'root-only',
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
        branches: ['master']
    ],
    slack: [
        [branches: ['master'], channels: [''], events: ['FAILURE']],
        [branches: ['.*'], channels: ['_owner_'], events: ['FAILURE']]
    ],
    skipCacheBehavior: 'remote-only'
)
```

### Pipeline Stages

#### 1. Source Control
- **Trigger**: Git push to repository
- **Actions**: Checkout code, validate branch policies
- **Artifacts**: Source code, configuration files

#### 2. Build and Test
- **Actions**: 
  - Install dependencies with pnpm
  - Run TypeScript compilation
  - Execute unit tests with Jest
  - Generate test coverage reports
- **Quality Gates**: 
  - Test coverage > 80%
  - No TypeScript compilation errors
  - All unit tests pass

#### 3. Code Quality Analysis
- **SonarQube**: Static code analysis and quality metrics
- **Checkmarx**: Security vulnerability scanning
- **ESLint**: Code style and best practices validation
- **Quality Gates**: 
  - No critical security vulnerabilities
  - Code quality rating A or B
  - Technical debt ratio < 5%

#### 4. Package and Artifact Creation
- **Actions**:
  - Bundle Lambda functions with esbuild
  - Generate CDK CloudFormation templates
  - Create deployment packages
  - Upload artifacts to S3

#### 5. Deployment to Sandbox
- **Trigger**: Automatic on master branch
- **Actions**:
  - Deploy CDK stacks to sandbox account
  - Run smoke tests
  - Validate API endpoints
- **Rollback**: Automatic on deployment failure

#### 6. Integration Testing
- **Actions**:
  - Run integration tests against sandbox
  - Validate GDPR request processing
  - Test scheduler functionality
  - Performance testing

#### 7. Staging Deployment (Manual Gate)
- **Trigger**: Manual approval required
- **Actions**:
  - Deploy to staging environment
  - Run full test suite
  - Performance and load testing
- **Validation**: Manual testing and sign-off

#### 8. Production Deployment (Manual Gate)
- **Trigger**: Manual approval with multiple approvers
- **Actions**:
  - Blue/green deployment to production
  - Gradual traffic shifting
  - Health checks and monitoring
- **Rollback**: Manual or automatic based on health metrics

### Deployment Commands

#### Local Development
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Get AWS credentials
oktaws

# Deploy to sandbox
pnpm deploy:sandbox
```

#### CI/CD Environment
```bash
# Build and test
pnpm ci:test

# Setup deployment
pnpm ci:setup

# Deploy (environment-specific)
pnpm deploy:${ENVIRONMENT}

# Teardown (cleanup)
pnpm ci:teardown
```

## Configuration Management

### Environment-Specific Configuration

#### Parameter Store Structure
```
/passkey-gdpr-app/
├── sandbox/
│   ├── api/
│   │   ├── auth-secret
│   │   └── rate-limit
│   ├── database/
│   │   └── connection-string
│   └── services/
│       └── gdpr-service-endpoint
├── staging/
│   └── [same structure as sandbox]
└── production/
    └── [same structure as sandbox]
```

#### Configuration Deployment
```typescript
// CDK configuration deployment
const config = new ParameterStoreConfig(this, 'Config', {
  environment: props.environment,
  parameters: {
    '/api/auth-secret': SecretValue.secretsManager('gdpr-api-secret'),
    '/database/connection-string': props.databaseConnectionString,
    '/services/gdpr-service-endpoint': props.gdprServiceEndpoint
  }
});
```

### Secrets Management

#### AWS Secrets Manager Integration
- Database credentials
- API keys and tokens
- Service-to-service authentication secrets
- Third-party integration credentials

#### Parameter Store Encryption
- All sensitive parameters encrypted with AWS KMS
- Environment-specific KMS keys
- Automatic key rotation policies

### Feature Flags

#### Configuration
```json
{
  "features": {
    "enhanced-logging": {
      "enabled": true,
      "environments": ["sandbox", "staging"]
    },
    "new-gdpr-workflow": {
      "enabled": false,
      "rollout": 0.1
    }
  }
}
```

#### Usage
```typescript
import { FeatureFlags } from '@cvent/feature-flags';

const flags = new FeatureFlags({
  environment: process.env.ENVIRONMENT
});

if (await flags.isEnabled('enhanced-logging')) {
  // Enhanced logging logic
}
```

## Rollback Procedures

### Automated Rollback Triggers
- Health check failures
- Error rate > 5% for 5 minutes
- Response time > 10 seconds for 2 minutes
- Lambda function errors > 10% for 3 minutes

### Manual Rollback Process

#### 1. Immediate Rollback (Emergency)
```bash
# Rollback to previous version
aws cloudformation update-stack \
  --stack-name passkey-gdpr-app-production \
  --use-previous-template \
  --parameters ParameterKey=Version,ParameterValue=previous

# Monitor rollback progress
aws cloudformation describe-stacks \
  --stack-name passkey-gdpr-app-production
```

#### 2. Gradual Rollback
```bash
# Reduce traffic to new version
aws apigatewayv2 update-stage \
  --api-id ${API_ID} \
  --stage-name production \
  --deployment-id ${PREVIOUS_DEPLOYMENT_ID}
```

#### 3. Configuration Rollback
```bash
# Rollback Parameter Store values
aws ssm put-parameter \
  --name "/passkey-gdpr-app/production/api/version" \
  --value "previous-version" \
  --overwrite
```

### Rollback Validation
1. **Health Checks**: Verify all endpoints respond correctly
2. **Functional Tests**: Run critical path tests
3. **Monitoring**: Check metrics return to normal levels
4. **User Impact**: Verify no customer-facing issues

### Post-Rollback Actions
1. **Incident Report**: Document rollback reason and timeline
2. **Root Cause Analysis**: Investigate deployment failure
3. **Process Improvement**: Update deployment procedures
4. **Communication**: Notify stakeholders of resolution

## Monitoring and Alerting

### Health Monitoring
- **Endpoint Health**: API Gateway health checks
- **Lambda Health**: Function execution success rates
- **Dependency Health**: External service connectivity

### Performance Monitoring
- **Response Times**: API endpoint latency
- **Throughput**: Requests per second
- **Resource Usage**: Lambda memory and CPU utilization

### Business Metrics
- **GDPR Requests**: Processing volume and success rates
- **Compliance Tasks**: Scheduler execution metrics
- **Data Processing**: Volume and performance metrics

### Alert Configuration
```yaml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5 minutes"
    severity: "critical"
    
  - name: "High Latency"
    condition: "p95_latency > 10s"
    duration: "2 minutes"
    severity: "warning"
    
  - name: "Lambda Failures"
    condition: "lambda_errors > 10"
    duration: "1 minute"
    severity: "critical"
```

## Disaster Recovery

### Backup Strategy
- **Code**: Git repository with multiple remotes
- **Configuration**: Parameter Store cross-region replication
- **Infrastructure**: CDK templates in version control
- **Monitoring**: CloudWatch logs retention and backup

### Recovery Procedures
1. **Region Failover**: Deploy to secondary AWS region
2. **Data Recovery**: Restore from Parameter Store backups
3. **Service Restoration**: Redeploy infrastructure and applications
4. **Validation**: Comprehensive testing before traffic restoration

### Recovery Time Objectives (RTO)
- **Critical Services**: 1 hour
- **Non-Critical Services**: 4 hours
- **Full Service Restoration**: 8 hours

### Recovery Point Objectives (RPO)
- **Configuration Data**: 15 minutes
- **Application Code**: Real-time (Git)
- **Monitoring Data**: 1 hour