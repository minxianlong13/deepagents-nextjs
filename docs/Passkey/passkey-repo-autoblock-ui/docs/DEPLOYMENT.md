# Deployment

## Infrastructure

### AWS Architecture
The Passkey Autoblock UI applications are deployed on AWS using a modern serverless architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        CloudFront CDN                       │
├─────────────────────────────────────────────────────────────┤
│  S3 Static Hosting    │  Lambda@Edge    │  Route 53 DNS    │
│  (React Apps)         │  (Routing)      │  (Domain)        │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   API Gateway     │
                    │  (GraphQL APIs)   │
                    └───────────────────┘
```

### Core AWS Services
- **S3**: Static website hosting for React applications
- **CloudFront**: Global CDN for fast content delivery
- **Lambda@Edge**: Dynamic routing and request processing
- **Route 53**: DNS management and domain routing
- **API Gateway**: GraphQL API endpoint management
- **AWS CDK**: Infrastructure as Code for provisioning

### CDK Infrastructure
Each application has its own CDK stack:
- `cdk/passkey-autoblock-guestside-site-cdk/` - Guestside site infrastructure
- `cdk/passkey-autoblock-site-editor-cdk/` - Site editor infrastructure

## Environments

### Development Environment
- **URL**: `https://dev-autoblock.passkey.com`
- **Purpose**: Feature development and testing
- **Deployment**: Automatic on feature branch merges
- **Data**: Synthetic test data and mock services
- **Monitoring**: Basic logging and error tracking

**Configuration**:
```yaml
environment: development
api_endpoint: https://api-dev.passkey.com/graphql
cdn_domain: dev-autoblock.passkey.com
cache_ttl: 300  # 5 minutes
debug_mode: true
```

### Staging Environment
- **URL**: `https://staging-autoblock.passkey.com`
- **Purpose**: Pre-production testing and QA validation
- **Deployment**: Manual promotion from development
- **Data**: Production-like data with anonymization
- **Monitoring**: Full observability stack

**Configuration**:
```yaml
environment: staging
api_endpoint: https://api-staging.passkey.com/graphql
cdn_domain: staging-autoblock.passkey.com
cache_ttl: 900  # 15 minutes
debug_mode: false
```

### Production Environment
- **URL**: `https://autoblock.passkey.com`
- **Purpose**: Live customer-facing applications
- **Deployment**: Manual promotion with approval gates
- **Data**: Live production data
- **Monitoring**: Comprehensive monitoring and alerting

**Configuration**:
```yaml
environment: production
api_endpoint: https://api.passkey.com/graphql
cdn_domain: autoblock.passkey.com
cache_ttl: 3600  # 1 hour
debug_mode: false
```

## CI/CD Pipeline

### Jenkins Pipeline Overview
```groovy
// Jenkinsfile
@Library('pipeline-utils') _

buildPipeline(
  label: 'ecs-x86-large',
  trunk: 'master',
  awsUser: 'cdk',
  builds: [
    [branch: 'master', tag: 'alpha']
  ],
  slack: [
    [branch: '^(master|development)$', 
     channel: 'passkey-ui-builds', 
     events: ['START', 'SUCCESS', 'FAILURE']]
  ]
)
```

### Pipeline Stages

#### 1. Source Control
- **Trigger**: Git push to master branch
- **Actions**: 
  - Checkout source code
  - Validate branch permissions
  - Check for required files

#### 2. Build & Test
```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run linting
pnpm lint

# Run unit tests
pnpm test --coverage

# Build applications
pnpm build
```

#### 3. Security Scanning
- **SAST**: Static code analysis with SonarQube
- **Dependency Check**: Vulnerability scanning with npm audit
- **License Compliance**: License compatibility verification

#### 4. Artifact Creation
```bash
# Create deployment artifacts
pnpm changeset-cvent release:version

# Package applications
tar -czf guestside-site.tar.gz apps/passkey-autoblock-guestside-site/dist/
tar -czf site-editor.tar.gz apps/passkey-autoblock-site-editor/dist/
tar -czf widgets.tar.gz pkgs/passkey-autoblock-widgets/lib/
```

#### 5. Infrastructure Deployment
```bash
# Deploy CDK stacks
cd cdk/passkey-autoblock-guestside-site-cdk
cdk deploy --require-approval never

cd ../passkey-autoblock-site-editor-cdk
cdk deploy --require-approval never
```

#### 6. Application Deployment
- **S3 Upload**: Deploy static assets to S3 buckets
- **CloudFront Invalidation**: Clear CDN cache
- **Health Checks**: Verify deployment success

### Deployment Automation

#### Octo Integration
Deployments are managed through [Octo](https://octo.core.cvent.org/):

1. **Artifact Selection**: Choose version from Jenkins builds
2. **Environment Selection**: Target environment (dev/staging/prod)
3. **Approval Process**: Required approvals for production
4. **Deployment Execution**: Automated deployment with rollback capability

#### Changeset Management
Version management uses Changesets:

```bash
# Create changeset
pnpm changeset

# Version packages
pnpm changeset-cvent release:version

# Publish packages
pnpm release:publish
```

**Required Changeset Entries**:
| Target | Required Packages |
|--------|------------------|
| Guestside Site | `@cvent/passkey-autoblock-guestside-site-cdk`, `@cvent-internal/passkey-autoblock-guestside-site` |
| Site Editor | `@cvent/passkey-autoblock-site-editor-cdk`, `@cvent-internal/passkey-autoblock-site-editor` |
| Widgets | `@cvent-internal/passkey-autoblock-widgets` |

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through environment variables and CDK parameters:

```typescript
// CDK configuration
export interface StackConfig {
  environment: 'dev' | 'staging' | 'prod';
  domainName: string;
  apiEndpoint: string;
  cacheTtl: number;
  debugMode: boolean;
}

const configs: Record<string, StackConfig> = {
  dev: {
    environment: 'dev',
    domainName: 'dev-autoblock.passkey.com',
    apiEndpoint: 'https://api-dev.passkey.com/graphql',
    cacheTtl: 300,
    debugMode: true
  },
  // ... other environments
};
```

### Feature Flags
Feature flags are managed through environment variables:

```javascript
// Feature flag configuration
const featureFlags = {
  ENABLE_MAPS: process.env.ENABLE_MAPS === 'true',
  ENABLE_RECAPTCHA: process.env.ENABLE_RECAPTCHA === 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_NEW_BOOKING_FLOW: process.env.ENABLE_NEW_BOOKING_FLOW === 'true'
};
```

### Secrets Management
Sensitive configuration is stored in AWS Systems Manager Parameter Store:

```bash
# Store secrets
aws ssm put-parameter \
  --name "/passkey/autoblock-ui/datadog-token" \
  --value "secret-token" \
  --type "SecureString"

# Retrieve in application
const datadogToken = await ssm.getParameter({
  Name: '/passkey/autoblock-ui/datadog-token',
  WithDecryption: true
}).promise();
```

## Rollback Procedures

### Automated Rollback
The deployment system supports automatic rollback on failure:

```bash
# Rollback to previous version
octo rollback --project passkey-autoblock-guestside-ui --environment production

# Rollback specific component
octo rollback --project passkey-autoblock-guestside-ui \
              --environment production \
              --component guestside-site
```

### Manual Rollback Steps

#### 1. Identify Issue
- Check monitoring dashboards
- Review error logs in Datadog
- Validate deployment artifacts

#### 2. Rollback Decision
- Assess impact and severity
- Determine rollback scope (full vs. partial)
- Notify stakeholders

#### 3. Execute Rollback
```bash
# 1. Rollback infrastructure (if needed)
cd cdk/passkey-autoblock-guestside-site-cdk
cdk deploy --parameters version=previous-version

# 2. Rollback application code
aws s3 sync s3://backup-bucket/previous-version/ s3://production-bucket/

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890 \
  --paths "/*"
```

#### 4. Verification
- Run health checks
- Verify functionality
- Monitor error rates
- Confirm user experience

#### 5. Post-Rollback
- Document incident
- Schedule fix deployment
- Update monitoring alerts

### Rollback Testing
Regular rollback drills are performed:
- **Monthly**: Staging environment rollback tests
- **Quarterly**: Production rollback simulation
- **Documentation**: Rollback procedures updated and validated

## Monitoring & Alerting

### Deployment Monitoring
- **Build Status**: Jenkins build notifications in Slack
- **Deployment Status**: Octo deployment notifications
- **Health Checks**: Automated post-deployment verification

### Production Monitoring
- **Uptime**: CloudWatch synthetic monitoring
- **Performance**: Core Web Vitals tracking
- **Errors**: Real-time error alerting
- **Business Metrics**: Booking conversion rates

### Alert Configuration
```yaml
# CloudWatch alarms
alarms:
  - name: "High Error Rate"
    metric: "ErrorRate"
    threshold: 5  # 5% error rate
    period: 300   # 5 minutes
    
  - name: "Slow Response Time"
    metric: "ResponseTime"
    threshold: 3000  # 3 seconds
    period: 300
    
  - name: "Low Availability"
    metric: "Availability"
    threshold: 99.5  # 99.5% uptime
    period: 900      # 15 minutes
```

## Disaster Recovery

### Backup Strategy
- **Code**: Git repository with multiple remotes
- **Artifacts**: S3 versioning for deployment packages
- **Configuration**: Infrastructure as Code in version control
- **Data**: Backend service handles data backup

### Recovery Procedures
1. **Service Outage**: Automatic failover to backup regions
2. **Data Corruption**: Restore from backend service backups
3. **Infrastructure Failure**: Redeploy using CDK from version control
4. **Complete Disaster**: Multi-region deployment activation

### Recovery Time Objectives
- **RTO**: 4 hours maximum downtime
- **RPO**: 1 hour maximum data loss
- **MTTR**: 30 minutes mean time to recovery