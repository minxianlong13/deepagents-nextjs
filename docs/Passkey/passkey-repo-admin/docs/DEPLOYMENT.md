# Deployment

## Infrastructure

### Cloud Platform
- **AWS**: Primary cloud infrastructure provider
- **CDK (Cloud Development Kit)**: Infrastructure as Code using TypeScript
- **Container-based Deployment**: Docker containers orchestrated through AWS services

### AWS Services Used
- **ECS (Elastic Container Service)**: Container orchestration and management
- **ALB (Application Load Balancer)**: Load balancing and SSL termination
- **CloudFront**: CDN for static asset delivery and global distribution
- **Route 53**: DNS management and health checks
- **ECR (Elastic Container Registry)**: Docker image storage and management
- **CloudWatch**: Monitoring, logging, and alerting
- **Systems Manager**: Parameter store for configuration management
- **Secrets Manager**: Secure storage of sensitive configuration

### Container Configuration
```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environments

### Development Environment
- **Purpose**: Feature development and initial testing
- **URL**: `https://passkey-admin-dev.cvent.com`
- **Deployment**: Automatic on push to `development` branch
- **Configuration**:
  - Debug logging enabled
  - Feature flags for experimental features
  - Mock external services for testing
  - Relaxed security policies for development

### Staging Environment
- **Purpose**: Pre-production testing and validation
- **URL**: `https://passkey-admin-staging.cvent.com`
- **Deployment**: Manual promotion from development
- **Configuration**:
  - Production-like configuration
  - Full integration with backend services
  - Performance testing enabled
  - Security scanning and validation

### Production Environment
- **Purpose**: Live application serving end users
- **URL**: `https://passkey-admin.cvent.com`
- **Deployment**: Manual promotion with approval process
- **Configuration**:
  - High availability with multiple AZs
  - Auto-scaling based on demand
  - Full monitoring and alerting
  - Strict security policies

### Sandbox Environment
- **Purpose**: Individual developer testing and experimentation
- **URL**: Dynamic URLs per developer
- **Deployment**: On-demand via `pnpm deploy:sandbox`
- **Configuration**:
  - Isolated resources per developer
  - Temporary infrastructure (auto-cleanup)
  - Full feature flag control
  - Development-optimized settings

## CI/CD Pipeline

### Jenkins Pipeline Configuration
The deployment pipeline is managed through Jenkins with the following stages:

#### Build Stage
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

#### Security Scanning
```groovy
stage('Security Scan') {
  steps {
    sh 'pnpm audit'
    sh 'sonar-cvent scan'
    sh 'whitesource scan'
  }
}
```

#### Container Build
```groovy
stage('Container Build') {
  steps {
    sh 'docker build -t passkey-admin:${BUILD_NUMBER} .'
    sh 'docker push ${ECR_REGISTRY}/passkey-admin:${BUILD_NUMBER}'
  }
}
```

#### Deployment
```groovy
stage('Deploy') {
  steps {
    sh 'nx deploy --environment=${ENVIRONMENT}'
  }
}
```

### Pipeline Triggers
- **Development**: Automatic on push to `development` branch
- **Master**: Automatic on push to `master` branch (deploys to staging)
- **Release**: Manual trigger for production deployment
- **Hotfix**: Expedited pipeline for critical fixes

### Approval Process
Production deployments require:
1. **Code Review**: Minimum 2 approvals from team members
2. **Security Review**: Automated security scanning passes
3. **QA Approval**: Manual testing validation in staging
4. **Product Owner Approval**: Business stakeholder sign-off

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through AWS Systems Manager Parameter Store:

```typescript
// Development
/passkey-admin/dev/api-key
/passkey-admin/dev/graphql-endpoint
/passkey-admin/dev/launchdarkly-key

// Production
/passkey-admin/prod/api-key
/passkey-admin/prod/graphql-endpoint
/passkey-admin/prod/launchdarkly-key
```

### Secrets Management
Sensitive configuration stored in AWS Secrets Manager:

```json
{
  "name": "passkey-admin/prod/secrets",
  "value": {
    "sessionSecret": "encrypted-session-key",
    "datadogApiKey": "datadog-api-key",
    "authServiceKey": "auth-service-private-key"
  }
}
```

### Feature Flag Configuration
LaunchDarkly feature flags control feature rollouts:

```typescript
const featureFlags = {
  'new-idp-wizard': {
    development: true,
    staging: true,
    production: false
  },
  'enhanced-audit-logging': {
    development: true,
    staging: true,
    production: true
  }
};
```

## Deployment Scripts

### Infrastructure Deployment
```bash
# Deploy infrastructure changes
cd packages/infra
pnpm cdk deploy --environment=production

# Deploy application
cd packages/app
pnpm deploy --environment=production
```

### Database Migrations
```bash
# Run database migrations (if applicable)
pnpm migrate --environment=production

# Rollback migrations
pnpm migrate:rollback --environment=production
```

### Health Check Validation
```bash
# Validate deployment health
curl -f https://passkey-admin.cvent.com/api/health

# Check application metrics
aws cloudwatch get-metric-statistics \
  --namespace "PasskeyAdmin" \
  --metric-name "HealthCheck" \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 300 \
  --statistics Average
```

## Rollback Procedures

### Application Rollback
```bash
# Rollback to previous version
nx deploy --environment=production --version=previous

# Rollback to specific version
nx deploy --environment=production --version=2.14.0
```

### Infrastructure Rollback
```bash
# Rollback CDK stack changes
cd packages/infra
pnpm cdk deploy --environment=production --rollback
```

### Emergency Rollback
For critical issues requiring immediate rollback:

1. **Immediate Action**: Use AWS Console to revert ECS service to previous task definition
2. **DNS Failover**: Update Route 53 to point to previous environment
3. **Communication**: Notify stakeholders via Slack `#passkey-maurya-alerts`
4. **Post-Incident**: Conduct post-mortem and update procedures

### Rollback Validation
```bash
# Verify rollback success
curl -f https://passkey-admin.cvent.com/api/health

# Check application logs
aws logs tail /aws/ecs/passkey-admin --follow

# Monitor error rates
aws cloudwatch get-metric-statistics \
  --namespace "PasskeyAdmin" \
  --metric-name "ErrorRate" \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Average
```

## Monitoring and Alerting

### Health Monitoring
- **Application Health**: Automated health checks every 30 seconds
- **Dependency Health**: Monitoring of GraphQL API and auth services
- **Performance Metrics**: Response time and throughput monitoring
- **Error Rate Tracking**: Real-time error rate monitoring with thresholds

### Alert Configuration
```yaml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5 minutes"
    channels: ["#passkey-maurya-alerts"]
    
  - name: "High Response Time"
    condition: "avg_response_time > 2000ms"
    duration: "3 minutes"
    channels: ["#passkey-maurya-alerts"]
    
  - name: "Service Unavailable"
    condition: "health_check_failures > 3"
    duration: "1 minute"
    channels: ["#passkey-maurya-alerts", "pager-duty"]
```

### Deployment Notifications
Slack notifications are sent to relevant channels:
- **Development Deployments**: `#passkey-maurya`
- **Production Deployments**: `#passkey-maurya-alerts`
- **Failed Deployments**: `#passkey-maurya-alerts` + email notifications

## Disaster Recovery

### Backup Strategy
- **Application Code**: Git repository with multiple remotes
- **Configuration**: Backed up in AWS Parameter Store with versioning
- **Container Images**: Stored in ECR with lifecycle policies
- **Infrastructure**: CDK code in version control with state management

### Recovery Procedures
1. **Service Restoration**: Deploy from known good container image
2. **Configuration Recovery**: Restore from Parameter Store backup
3. **Infrastructure Recovery**: Redeploy CDK stacks from code
4. **Data Recovery**: Coordinate with backend services for data restoration

### Recovery Time Objectives (RTO)
- **Application Recovery**: 15 minutes
- **Full Service Recovery**: 30 minutes
- **Cross-Region Failover**: 60 minutes

### Recovery Point Objectives (RPO)
- **Configuration Changes**: 5 minutes
- **Application State**: Real-time (stateless application)
- **Audit Logs**: 1 minute (handled by backend services)