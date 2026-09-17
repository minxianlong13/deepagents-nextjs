# Deployment

## Infrastructure

The passkey-cc-verification service is deployed on AWS using CDK (Cloud Development Kit) infrastructure as code. The service runs as AWS Lambda functions behind an API Gateway.

### AWS Components
- **AWS Lambda**: Serverless functions for credit card verification processing
- **API Gateway**: REST API endpoint management and routing
- **AWS Secrets Manager**: Secure storage of API keys and sensitive configuration
- **CloudWatch**: Logging and monitoring

## Environments

### Development
- **Environment**: `dev`
- **AWS Account**: Development account
- **Purpose**: Feature development and testing
- **Auto-deployment**: Enabled from `development` branch

### CI/Staging
- **Environment**: `ci`
- **AWS Account**: CI/CD account
- **Purpose**: Continuous integration testing
- **Ephemeral**: Yes (automatically cleaned up)

### Production
- **Environment**: `production`
- **AWS Account**: Production account
- **Purpose**: Live credit card verification for PBR surveys
- **Deployment**: Manual approval required

## CI/CD Pipeline

### Jenkins Pipeline
- **Location**: [Jenkins](https://ci-jenkins.core.cvent.org/job/passkey-cdk/job/passkey-cc-verification-cdk/)
- **Pipeline**: Uses `@Library('pipeline-utils')` shared library
- **Branches**:
  - `master`: Production deployments
  - `development`: Auto-deploy to dev environment

### Build Process
1. **Code Quality**: ESLint, Prettier, SonarQube analysis
2. **Security**: Checkmarx SAST scanning
3. **Testing**: Jest unit tests
4. **Build**: TypeScript compilation and CDK synthesis
5. **Deploy**: CDK deployment to target environment

### Pipeline Configuration
```groovy
buildPipeline([
    awsUser: 'cdk',
    checkmarx: [
        branch: 'master',
        teamPath: 'CxServer\\SAST\\Cvent\\Passkey',
        presetValue: '100008'
    ],
    publish: [
        [branches: ['development']]
    ],
    slack: [
        [branches: ['master', 'development'], channels: ['passkey-api']],
        [branches: ['.*'], channels: ['_owner_']]
    ]
])
```

## Configuration Management

### Environment Variables
- `LEDGER_URL`: URL for the passkey-ledger-service integration
- AWS region and account-specific configurations managed by CDK

### Secrets Management
- API keys stored in AWS Secrets Manager
- Retrieved at runtime using the `Secrets.apiKey()` utility
- Encrypted in transit and at rest

### CDK Configuration
- Environment-specific configs in `lib/config/CardVerificationConfig`
- AWS tags applied automatically based on environment
- Resource naming follows Cvent conventions

## Deployment Commands

### Prerequisites
```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build
```

### Deploy to Environment
```bash
# Setup CDK deployment
pnpm run ci:setup

# Deploy changes
cdk-cvent deploy

# Teardown (if needed)
pnpm run ci:teardown
```

### Release Process
```bash
# Version bump
pnpm run release:version

# Publish release
pnpm run release:publish
```

## Monitoring & Alerting

### CloudWatch Logs
- Lambda function logs automatically sent to CloudWatch
- Log groups follow naming convention: `/aws/lambda/{function-name}`
- Retention period configured per environment

### Slack Notifications
- Build status notifications sent to `#passkey-api` channel
- Owner notifications for all branch builds
- Failure alerts include build logs and error details

### Datadog Integration
- Service name: `passkey-cc-verification`
- Metrics and traces collected automatically
- Custom dashboards available in Datadog

## Rollback Procedures

### Immediate Rollback
1. **Identify Issue**: Check CloudWatch logs and Datadog metrics
2. **Stop Traffic**: If critical, disable API Gateway endpoint
3. **Revert Code**: 
   ```bash
   git revert <commit-hash>
   git push origin master
   ```
4. **Redeploy**: Jenkins will automatically trigger deployment

### CDK Stack Rollback
```bash
# List stack events to identify issue
aws cloudformation describe-stack-events --stack-name <stack-name>

# Rollback to previous version
aws cloudformation cancel-update-stack --stack-name <stack-name>
```

### Emergency Procedures
1. **Contact**: Steakholders team via `#passkey-steak-holders`
2. **Escalate**: Meeseeksbox team via `#passkey-meeseeks-box`
3. **Incident**: Follow Cvent incident response procedures

## Security Considerations

### Access Control
- AWS IAM roles with least privilege access
- CDK deployment user has limited permissions
- Secrets access restricted to Lambda execution role

### Network Security
- Lambda functions run in VPC (if configured)
- API Gateway with proper CORS configuration
- HTTPS-only communication with external services

### Compliance
- Checkmarx security scanning on all builds
- SonarQube code quality gates
- Regular dependency vulnerability scanning

## Troubleshooting

### Common Issues
1. **Deployment Failures**: Check CDK synthesis errors in build logs
2. **Lambda Timeouts**: Review CloudWatch metrics and increase timeout if needed
3. **API Gateway Errors**: Verify authorizer configuration and API key setup
4. **Secrets Access**: Ensure Lambda execution role has SecretsManager permissions

### Debug Commands
```bash
# View CDK diff
cdk diff

# Check stack status
aws cloudformation describe-stacks --stack-name <stack-name>

# View Lambda logs
aws logs tail /aws/lambda/<function-name> --follow
```