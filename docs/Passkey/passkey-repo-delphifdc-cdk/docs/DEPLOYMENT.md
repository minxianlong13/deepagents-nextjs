# Deployment

## Infrastructure

### AWS Architecture
The Passkey Delphifdc CDK deploys to AWS using a multi-account, multi-region architecture:

- **Compute**: Amazon ECS for container orchestration
- **Database**: Amazon DynamoDB for NoSQL data storage
- **Identity**: AWS IAM for access control and permissions
- **Encryption**: AWS KMS for encryption key management
- **Monitoring**: AWS CloudWatch (via deployed resources)

### Multi-Account Strategy
- **Account Separation**: Each environment deploys to dedicated AWS accounts
- **Cross-Account Access**: KMS policies enable secure cross-account encryption
- **Resource Isolation**: Complete isolation between environments

### Regional Distribution
- **US East (N. Virginia)**: Primary production regions (pr50, pr51)
- **Asia Pacific (Singapore)**: Singapore production (sg50)
- **Multi-Region**: Test environments distributed across regions

## Environments

### Production Environments

#### pr50 (Primary Production - US East)
- **AWS Account**: Production account
- **Region**: us-east-1
- **Purpose**: Primary production workloads
- **Table Names**: `passkey-dfdc-*-pr50`
- **Deployment**: Automated via Octopus Deploy

#### pr51 (Secondary Production - US East)
- **AWS Account**: Production account
- **Region**: us-east-1
- **Purpose**: Secondary production/disaster recovery
- **Table Names**: `passkey-dfdc-*-pr51`
- **Deployment**: Automated via Octopus Deploy

#### sg50 (Singapore Production)
- **AWS Account**: Production account
- **Region**: ap-southeast-1
- **Purpose**: Asia Pacific production workloads
- **Table Names**: `passkey-dfdc-*-T2` (uses cventEnvironment)
- **Deployment**: Automated via Octopus Deploy

#### ts50 (Test/Staging)
- **AWS Account**: Staging account
- **Region**: us-east-1
- **Purpose**: Pre-production testing and validation
- **Table Names**: `passkey-dfdc-*-T2` (uses cventEnvironment)
- **Deployment**: Automated via Octopus Deploy

### Development Environments

#### alpha (Alpha Testing)
- **AWS Account**: Development account
- **Region**: us-east-1
- **Purpose**: Alpha feature testing
- **Table Names**: `passkey-dfdc-*-alpha`
- **Deployment**: Manual or automated via Jenkins

#### ct50 (Customer Testing)
- **AWS Account**: Development account
- **Region**: us-east-1
- **Purpose**: Customer acceptance testing
- **Table Names**: `passkey-dfdc-*-ct50`
- **Deployment**: Manual or automated

#### it50 (Integration Testing)
- **AWS Account**: Development account
- **Region**: us-east-1
- **Purpose**: Integration and system testing
- **Table Names**: `passkey-dfdc-*-it50`
- **Deployment**: Automated via CI/CD

#### ci (Continuous Integration)
- **AWS Account**: Development account
- **Region**: us-east-1
- **Purpose**: Ephemeral testing during CI builds
- **Table Names**: `passkey-dfdc-*-ci`
- **Deployment**: Automated, auto-cleanup enabled
- **Lifecycle**: Created and destroyed with each CI run

#### cvent-sandbox (Developer Sandbox)
- **AWS Account**: Development account
- **Region**: us-east-1
- **Purpose**: Individual developer testing
- **Table Names**: `passkey-dfdc-*-cvent-sandbox`
- **Deployment**: Manual via developer commands

## CI/CD Pipeline

### Jenkins Pipeline
**URL**: [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-delphifdc-cdk)

#### Pipeline Stages
1. **Checkout**: Source code retrieval from GitHub
2. **Install**: Dependencies installation via pnpm
3. **Build**: TypeScript compilation and CDK synthesis
4. **Test**: Unit tests and code quality checks
5. **Package**: Artifact creation for deployment
6. **Deploy**: Environment-specific deployment via Octopus

#### Pipeline Configuration
**File**: `Jenkinsfile`
```groovy
@Library('cvent-shared-library') _

cventNodePipeline {
    projectName = 'passkey-delphifdc-cdk'
    sonarProjectKey = 'passkey-delphifdc-cdk'
    buildCommand = 'pnpm build'
    testCommand = 'pnpm test'
}
```

### Octopus Deploy
**URL**: [Octopus Deploy](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-delphifdc/deployments)

#### Deployment Process
1. **Artifact Download**: Retrieves build artifacts from Jenkins
2. **Environment Configuration**: Injects environment-specific variables
3. **CDK Deploy**: Executes `cdk-cvent deploy` with appropriate parameters
4. **Verification**: Post-deployment health checks
5. **Notification**: Deployment status notifications

#### Environment Promotion
- **Development → Staging**: Automated after successful testing
- **Staging → Production**: Manual approval required
- **Production Regions**: Coordinated deployment across pr50, pr51, sg50

## Configuration Management

### Environment-Specific Configuration

#### Environment Variables
Each environment receives specific configuration:

```typescript
// Example for pr50 environment
{
  awsEnvironment: {
    account: '123456789012',
    region: 'us-east-1'
  },
  cventEnvironment: 'T2',
  hoganEnvironment: 'pr50'
}
```

#### Table Naming Strategy
```typescript
// Production environments use cventEnvironment
const dbEnvName = ['ts50', 'sg50', 'pr50'].includes(hoganEnvironment) 
  ? cventEnvironment 
  : hoganEnvironment;

// Results in table names like:
// passkey-dfdc-tasks-T2 (for pr50, sg50, ts50)
// passkey-dfdc-tasks-alpha (for alpha)
```

### Resource Tagging
All resources receive consistent tags:

```typescript
{
  'business-unit': 'hospitality',
  'platform': 'passkey',
  'product': 'passkey-for-hotels',
  'environment': environmentName,
  'cost-center': 'hospitality-passkey'
}
```

## Deployment Commands

### Manual Deployment Commands

#### Sandbox Environment
```bash
# Deploy sandbox environment
pnpm sandbox:setup

# Destroy sandbox environment
pnpm sandbox:teardown

# Build sandbox-specific templates
pnpm sandbox:build
```

#### CI Environment
```bash
# Deploy CI environment
pnpm ci:setup

# Destroy CI environment
pnpm ci:teardown
```

#### Production Deployment
```bash
# Build and synthesize templates
pnpm build

# Deploy to specific environment (via CDK)
cdk-cvent deploy --assembly=cdk.out/passkey-pr50

# Destroy environment (use with caution)
cdk-cvent destroy --assembly=cdk.out/passkey-pr50
```

### Automated Deployment

#### Release Process
```bash
# Version management
pnpm release:version

# Publish release
pnpm release:publish --project passkey-delphifdc
```

#### Environment-Specific Entry Points
Each environment has its own CDK entry point:

```bash
# Available entry points
bin/ci.ts              # CI environment
bin/passkey-alpha.ts   # Alpha environment
bin/passkey-ct50.ts    # Customer testing
bin/passkey-it50.ts    # Integration testing
bin/passkey-pr50.ts    # Primary production
bin/passkey-pr51.ts    # Secondary production
bin/passkey-sg50.ts    # Singapore production
bin/passkey-ts50.ts    # Test/staging
bin/cvent-sandbox.ts   # Developer sandbox
```

## Rollback Procedures

### Stack-Level Rollback
CDK supports independent rollback of each stack:

```bash
# Rollback DynamoDB stack only
aws cloudformation cancel-update-stack --stack-name PasskeyDelphiFDC-DB-pr50

# Rollback Main stack only
aws cloudformation cancel-update-stack --stack-name PasskeyDelphiFDC-Main-pr50
```

### Application-Level Rollback
```bash
# Deploy previous version
cdk-cvent deploy --assembly=cdk.out/previous-version

# Or use Octopus Deploy rollback feature
# Navigate to Octopus → Select previous deployment → Redeploy
```

### Database Recovery
For data-level issues:

```bash
# Point-in-time recovery (via AWS Console or CLI)
aws dynamodb restore-table-to-point-in-time \
  --source-table-name passkey-dfdc-tasks-pr50 \
  --target-table-name passkey-dfdc-tasks-pr50-restored \
  --restore-date-time 2024-01-01T12:00:00Z
```

## Monitoring and Alerting

### Deployment Monitoring
- **Jenkins**: Build and test status monitoring
- **Octopus**: Deployment progress and success/failure tracking
- **AWS CloudFormation**: Stack deployment status and events

### Infrastructure Monitoring
- **AWS CloudWatch**: Automatic monitoring of deployed DynamoDB tables
- **DynamoDB Metrics**: Read/write capacity, throttling, errors
- **IAM Access**: Role assumption and permission usage

### Alerting
- **Jenkins**: Build failure notifications via email/Slack
- **Octopus**: Deployment failure notifications
- **AWS CloudWatch**: Custom alarms for DynamoDB metrics

## Security Considerations

### Deployment Security
- **IAM Roles**: Deployment uses specific IAM roles with minimal permissions
- **Cross-Account**: Secure cross-account access via assumed roles
- **Encryption**: All data encrypted in transit and at rest

### Access Control
- **Deployment Access**: Limited to authorized personnel and systems
- **Environment Isolation**: No cross-environment access permitted
- **Audit Trail**: All deployments logged and tracked

### Secrets Management
- **No Hardcoded Secrets**: All sensitive data managed via AWS Systems Manager
- **Environment Variables**: Injected at deployment time
- **KMS Integration**: Encryption keys managed via AWS KMS

## Troubleshooting

### Common Deployment Issues

#### Stack Dependency Errors
```bash
# Error: Main stack deployed before DynamoDB stack
# Solution: Deploy DynamoDB stack first
cdk-cvent deploy PasskeyDelphiFDC-DB-pr50
cdk-cvent deploy PasskeyDelphiFDC-Main-pr50
```

#### Permission Errors
```bash
# Error: Insufficient permissions for deployment
# Solution: Verify IAM role has necessary CloudFormation permissions
aws sts get-caller-identity
aws iam get-role --role-name deployment-role
```

#### Resource Naming Conflicts
```bash
# Error: Table already exists
# Solution: Check environment naming and existing resources
aws dynamodb list-tables --region us-east-1
```

### Debugging Commands
```bash
# View synthesized CloudFormation templates
cdk-cvent synth

# Compare deployed vs. local changes
cdk-cvent diff

# View stack events
aws cloudformation describe-stack-events --stack-name PasskeyDelphiFDC-DB-pr50
```

## Disaster Recovery

### Backup Strategy
- **Point-in-Time Recovery**: Enabled on all DynamoDB tables
- **Cross-Region**: Manual backup/restore procedures available
- **Infrastructure**: CDK templates serve as infrastructure backup

### Recovery Procedures
1. **Identify Impact**: Determine affected environments and resources
2. **Isolate Issue**: Prevent further damage via access controls
3. **Restore Data**: Use point-in-time recovery for DynamoDB tables
4. **Redeploy Infrastructure**: Use CDK to recreate infrastructure
5. **Validate**: Comprehensive testing before returning to service
6. **Post-Mortem**: Document lessons learned and improve procedures