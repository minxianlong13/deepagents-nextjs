# Deployment

## Infrastructure

### AWS Architecture
- **Cloud Provider**: Amazon Web Services (AWS)
- **Deployment Model**: Multi-account strategy with environment isolation
- **Infrastructure as Code**: AWS CDK with CloudFormation backend
- **Orchestration**: Octopus Deploy for release management
- **CI/CD**: Jenkins pipeline with automated testing and deployment

### AWS Accounts
- **Production**: `core-passkey-prod` account
- **Staging/Testing**: Environment-specific accounts
- **CI/CD**: Dedicated account for ephemeral testing stacks

### Regions
- **Primary**: `us-east-1` (US East - N. Virginia)
- **Certificate Manager**: Certificates managed in `us-east-1` for global distribution

## Environments

### Production (pr50)
- **Domain**: `https://pbr.passkey.com`
- **AWS Account**: `core-passkey-prod`
- **Region**: `us-east-1`
- **Certificate**: `passkey.com` wildcard certificate
- **Deployment Target**: `pr50`
- **Monitoring**: Full Datadog and CloudWatch monitoring
- **Backup**: Automated CloudFormation stack backups

### Staging (ct50)
- **Domain**: `https://ct50-pbr.passkey.com`
- **AWS Account**: Environment-specific staging account
- **Region**: `us-east-1`
- **Certificate**: Environment-specific certificate
- **Deployment Target**: `ct50`
- **Purpose**: Pre-production testing and validation

### Integration Testing (it50)
- **Domain**: `https://it50-pbr.passkey.com`
- **AWS Account**: Integration testing account
- **Region**: `us-east-1`
- **Certificate**: Environment-specific certificate
- **Deployment Target**: `it50`
- **Purpose**: Integration testing with other Passkey services

### Alpha Testing (alpha)
- **Domain**: `https://alpha-pbr.passkey.com`
- **AWS Account**: Alpha testing account
- **Region**: `us-east-1`
- **Certificate**: Environment-specific certificate
- **Deployment Target**: `alpha`
- **Purpose**: Early feature testing and development

### Additional Environments
- **Singapore (sg50)**: Asia-Pacific region deployment
- **Tokyo (ts50)**: Asia-Pacific region deployment
- **PR51**: Secondary production environment

## CI/CD Pipeline

### Jenkins Pipeline Configuration

**Pipeline File**: `Jenkinsfile`

```groovy
buildPipeline(
    awsUser: 'cdk',
    changesets: true,
    trunk: 'master',
    checkmarx: [
        branch: 'master',
        syncMode: false,
        teamPath: 'CxServer\\SAST\\Cvent\\Passkey',
        presetValue: '100008'
    ],
    release: [
        branches: [ 'master', 'release/.*', 'hotfix/.*' ]
    ],
    publish: [
        [ branches: [ 'development', 'master' ] ]
    ],
    slack: [
        [ branches: ['master', 'development'], channels: ['passkey-api'] ],
        [ branches: ['.*'], channels: ['_owner_'] ]
    ]
)
```

### Pipeline Stages

1. **Source Checkout**: Clone repository from GitHub
2. **Dependency Installation**: `pnpm install` for all packages
3. **Build**: TypeScript compilation and CDK synthesis
4. **Test**: Unit tests and CDK snapshot tests
5. **Security Scan**: Checkmarx SAST scanning
6. **Package**: Create deployment artifacts
7. **Deploy**: Environment-specific deployments via Octopus

### Branch Strategy

- **master**: Production releases
- **development**: Development integration
- **release/***: Release preparation branches
- **hotfix/***: Emergency production fixes
- **feature/***: Feature development branches

## Configuration Management

### Hogan Integration

**Configuration Source**: Cvent Hogan configuration service

**Configuration Path**: `passkey-pbr-survey-wrapper`

**Required Configuration**:
```json
{
  "endpoint": {
    "internal": "https://backend-service-url"
  },
  "custom-domain": "environment-specific-domain"
}
```

### Environment-Specific Configuration

Each environment has dedicated configuration:
- Service endpoint URLs
- Custom domain names
- SSL certificate identifiers
- AWS account and region settings

### Configuration Validation

```typescript
// Configuration validation in Application.build()
if (!hoganConfig) {
  throw Error('Could not resolve hogan config for deploymentTarget ' + props.deploymentTarget);
}
```

## Deployment Procedures

### Automated Deployment (Recommended)

**Via Jenkins Pipeline**:
1. Push changes to appropriate branch
2. Jenkins automatically triggers pipeline
3. Pipeline runs tests and builds artifacts
4. Octopus Deploy handles environment-specific deployment
5. Slack notifications sent to `#passkey-api` channel

### Manual Deployment

**Prerequisites**:
```bash
# Install required tools
asdf install

# Install dependencies
pnpm install

# Build project
pnpm build
```

**Environment Deployment**:
```bash
# Deploy to specific environment
cdk deploy --app "npx ts-node bin/passkey-pr50.ts"

# Deploy with specific profile
cdk deploy --profile passkey-prod --app "npx ts-node bin/passkey-pr50.ts"
```

**CI Environment Deployment**:
```bash
# Deploy ephemeral CI stack
pnpm ci:setup

# Teardown CI stack
pnpm ci:teardown
```

### Sandbox Deployment

**Local Development Testing**:
```bash
# Deploy to sandbox environment
pnpm sandbox:setup

# Run tests against sandbox
pnpm test

# Cleanup sandbox
pnpm sandbox:teardown
```

## Rollback Procedures

### CloudFormation Stack Rollback

**Automatic Rollback**:
- CloudFormation automatically rolls back on deployment failure
- Previous stack state is restored
- DNS routing remains unchanged during rollback

**Manual Rollback**:
```bash
# Rollback to previous stack version
aws cloudformation cancel-update-stack --stack-name PasskeyPbrStack-pr50-{version}

# Deploy previous version
cdk deploy --app "npx ts-node bin/passkey-pr50.ts" --version {previous-version}
```

### Octopus Deploy Rollback

1. Access Octopus Deploy dashboard
2. Navigate to passkey-pbr project
3. Select environment to rollback
4. Choose previous successful deployment
5. Execute rollback deployment

### Emergency Rollback

**DNS-Level Rollback**:
- Update Route 53 records to point to previous environment
- Immediate traffic redirection
- Use for critical production issues

**Service-Level Rollback**:
- Deploy previous CDK version
- Update Hogan configuration if needed
- Verify service functionality

## Monitoring Deployment Health

### Deployment Verification

**Automated Checks**:
```bash
# Verify API Gateway endpoint
curl -I https://pbr.passkey.com/survey

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name PasskeyPbrStack-pr50-{version}
```

**Manual Verification**:
1. Verify custom domain resolves correctly
2. Test survey endpoint functionality
3. Check CloudWatch metrics for errors
4. Validate SSL certificate

### Post-Deployment Monitoring

**CloudWatch Alarms**:
- API Gateway 4XX/5XX error rates
- Request latency thresholds
- Request count anomalies

**Datadog Monitoring**:
- Service health dashboard
- APM trace analysis
- Error rate trending

### Deployment Notifications

**Slack Integration**:
- Success/failure notifications to `#passkey-api`
- Owner notifications for all branches
- Deployment status updates

**Email Notifications**:
- Critical deployment failures
- Production deployment confirmations
- Security scan results

## Security Considerations

### Deployment Security

**Access Control**:
- Jenkins service account with minimal required permissions
- Environment-specific AWS roles
- MFA required for manual deployments

**Secret Management**:
- No secrets stored in code repository
- Configuration retrieved from Hogan at deployment time
- SSL certificates managed through AWS Certificate Manager

### Network Security

**API Gateway Security**:
- Regional endpoints for better security
- TLS 1.2 minimum encryption
- No public API keys or authentication tokens

**Infrastructure Security**:
- Private VPC deployment where applicable
- Security groups restrict access to necessary ports
- CloudTrail logging for all API calls

## Troubleshooting Deployments

### Common Issues

**Configuration Errors**:
```bash
# Check Hogan configuration
curl -H "Authorization: Bearer {token}" https://hogan-api/config/{environment}

# Validate CDK synthesis
cdk synth --app "npx ts-node bin/passkey-pr50.ts"
```

**Certificate Issues**:
```bash
# Verify certificate exists
aws acm describe-certificate --certificate-arn {certificate-arn}

# Check certificate validation
aws acm list-certificates --certificate-statuses ISSUED
```

**Stack Deployment Failures**:
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name {stack-name}

# View stack resources
aws cloudformation describe-stack-resources --stack-name {stack-name}
```

### Support Contacts

- **Team**: Cherry Pickers team
- **Slack Channel**: `#passkey-api`
- **On-Call**: Passkey on-call rotation
- **Documentation**: Backstage service catalog