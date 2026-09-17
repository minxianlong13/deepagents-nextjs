# Deployment

## Infrastructure

The Passkey Call Center service is deployed on AWS using the Cvent Development Framework (CDF) with the following architecture:

- **Container Platform**: AWS ECS with Fargate
- **Load Balancer**: Application Load Balancer (ALB)
- **CDN**: CloudFront for static assets
- **DNS**: Route 53 for domain management
- **Secrets**: AWS Secrets Manager and Parameter Store
- **Monitoring**: CloudWatch + Datadog integration

## Environments

### Development
- **URL**: `https://passkey-call-center-dev.cvent.com`
- **Purpose**: Feature development and testing
- **Auto-deploy**: Enabled on `master` branch
- **Resources**: Minimal scaling for cost optimization
- **Data**: Staging Elasticsearch cluster

### Staging
- **URL**: `https://passkey-call-center-staging.cvent.com`
- **Purpose**: Pre-production testing and validation
- **Deploy**: Manual promotion from development
- **Resources**: Production-like scaling
- **Data**: Staging Elasticsearch cluster with production-like data

### Production
- **URL**: `https://passkey-call-center.cvent.com`
- **Purpose**: Live customer-facing application
- **Deploy**: Manual promotion with approval gates
- **Resources**: Auto-scaling based on demand
- **Data**: Production Elasticsearch cluster

## CI/CD Pipeline

### Jenkins Pipeline
Location: [Jenkins Job](https://ci-jenkins.core.cvent.org/job/passkey-cdk/job/passkey-call-center/)

#### Build Stages
1. **Checkout**: Pull latest code from GitHub
2. **Install**: `pnpm install` with dependency caching
3. **Lint**: ESLint and Prettier checks
4. **Test**: Unit tests with Jest
5. **Build**: Next.js production build
6. **Security Scan**: SonarQube analysis
7. **Docker Build**: Multi-stage Docker image
8. **Push**: Push to ECR registry

#### Deployment Stages
1. **Infrastructure**: Deploy CDK stack changes
2. **Database Migration**: Run any schema updates
3. **Application Deploy**: Rolling deployment to ECS
4. **Health Check**: Verify deployment success
5. **Integration Tests**: Run E2E test suite
6. **Notification**: Slack notification to team

### Deployment Commands

```bash
# Deploy to sandbox (development)
pnpm deploy:sandbox

# Build and test
pnpm ci:setup
pnpm ci:test

# Manual deployment steps
nx deploy:development
nx deploy:staging  
nx deploy:production
```

## Configuration Management

### Environment-Specific Configuration

Configuration is managed through AWS Parameter Store and Secrets Manager:

#### Parameter Store (`/passkey-call-center/{env}/`)
- `NODE_ENV`: Environment identifier
- `LOG_LEVEL`: Logging verbosity
- `RESDESK_URL`: Legacy system integration URL
- `LAUNCHDARKLY_PROJECT_SDK_KEY`: Feature flag SDK key

#### Secrets Manager
- `elasticsearch-credentials`: ES username/password
- `redis-connection`: Redis connection string
- `api-keys`: Service-to-service authentication keys
- `datadog-api-key`: Monitoring integration key

### Configuration Loading
1. Application starts and loads base configuration
2. Environment-specific overrides from Parameter Store
3. Sensitive values from Secrets Manager
4. Runtime feature flags from LaunchDarkly

## Container Configuration

### Dockerfile
Multi-stage build optimized for production:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage  
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "server.js"]
```

### ECS Task Definition
- **CPU**: 512 units (0.5 vCPU)
- **Memory**: 1024 MB
- **Health Check**: `/health` endpoint
- **Logging**: CloudWatch with structured JSON
- **Secrets**: Injected as environment variables

## Scaling Configuration

### Auto Scaling
- **Target CPU**: 70% utilization
- **Min Capacity**: 2 tasks (production), 1 task (dev/staging)
- **Max Capacity**: 10 tasks (production), 3 tasks (dev/staging)
- **Scale Out**: Add task when CPU > 70% for 2 minutes
- **Scale In**: Remove task when CPU < 30% for 5 minutes

### Load Balancer
- **Health Check**: `/health` endpoint every 30 seconds
- **Healthy Threshold**: 2 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures
- **Timeout**: 5 seconds
- **Deregistration Delay**: 30 seconds

## Database Deployment

### Elasticsearch
- **Cluster**: Managed by Platform team
- **Index Management**: Automated via index templates
- **Schema Changes**: Backward-compatible migrations
- **Backup**: Daily snapshots with 30-day retention

### Redis
- **Service**: AWS ElastiCache
- **Configuration**: Cluster mode disabled
- **Persistence**: Disabled (cache only)
- **Backup**: Not required for cache data

## Monitoring & Alerting

### Health Checks
- **Application**: `/health` endpoint
- **Dependencies**: Elasticsearch and Redis connectivity
- **Authentication**: Auth service availability

### Alerts
- **High Error Rate**: > 5% 4xx/5xx responses
- **High Latency**: P95 > 2 seconds
- **Low Availability**: < 99% uptime
- **Resource Usage**: CPU > 80% or Memory > 90%

### Dashboards
- [Datadog Service Dashboard](https://cvent.datadoghq.com/apm/services/passkey-call-center)
- [Datadog Logs](https://cvent.datadoghq.com/logs?query=service%3Apasskey-call-center)
- CloudWatch metrics and alarms

## Rollback Procedures

### Automatic Rollback
- Failed health checks trigger automatic rollback
- ECS maintains previous task definition for quick revert
- Load balancer stops routing to unhealthy tasks

### Manual Rollback Steps
1. **Identify Issue**: Check logs and metrics
2. **Stop Deployment**: Cancel ongoing deployment if active
3. **Revert Code**: 
   ```bash
   # Via Octopus Deploy
   # Navigate to previous successful release
   # Click "Re-deploy" button
   ```
4. **Verify Health**: Confirm application is responding
5. **Notify Team**: Update incident channel
6. **Post-Mortem**: Schedule review meeting

### Emergency Procedures
- **Incident Response**: Page on-call engineer
- **Communication**: Update status page
- **Escalation**: Involve platform team if infrastructure issue
- **Documentation**: Record all actions taken

## Security Considerations

### Network Security
- **VPC**: Private subnets for application tier
- **Security Groups**: Restrictive ingress/egress rules
- **WAF**: Web Application Firewall on CloudFront
- **TLS**: End-to-end encryption with valid certificates

### Access Control
- **IAM Roles**: Least privilege principle
- **Service Accounts**: Dedicated roles for each service
- **Secrets Rotation**: Automated rotation for database credentials
- **Audit Logging**: All deployment actions logged

### Compliance
- **SOC 2**: Infrastructure meets compliance requirements
- **Data Residency**: All data stored in approved regions
- **Encryption**: Data encrypted at rest and in transit
- **Backup**: Secure backup procedures with encryption

## Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check ECS service events
aws ecs describe-services --cluster passkey-call-center --services passkey-call-center

# Check task logs
aws logs get-log-events --log-group-name /ecs/passkey-call-center
```

#### Performance Issues
- Check Datadog APM for slow queries
- Review Elasticsearch query performance
- Monitor Redis hit rates
- Analyze CloudWatch metrics

#### Configuration Issues
- Verify Parameter Store values
- Check Secrets Manager access
- Validate LaunchDarkly connectivity
- Test authentication service integration

### Support Contacts
- **Primary Team**: Steakholders (`#passkey-steak-holders`)
- **Platform Support**: (`#tech-dev-framework`)
- **Infrastructure**: (`#platform-team`)
- **Security**: (`#security-team`)