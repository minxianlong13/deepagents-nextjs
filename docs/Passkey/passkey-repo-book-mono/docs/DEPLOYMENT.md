# Deployment

## Infrastructure

### AWS Architecture

The Passkey Book Mono application is deployed on AWS using a containerized architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │  Application    │    │   RDS/Aurora    │
│      (CDN)      │    │  Load Balancer  │    │   (Database)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      S3         │    │      ECS        │    │     Redis       │
│  (Static Assets)│    │   (Containers)  │    │    (Cache)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core AWS Services

#### Compute & Containers
- **Amazon ECS (Fargate)**: Serverless container orchestration
- **Application Load Balancer**: Traffic distribution and SSL termination
- **Auto Scaling Groups**: Automatic scaling based on demand

#### Storage & Content Delivery
- **Amazon S3**: Static asset storage and backup
- **CloudFront CDN**: Global content delivery and caching
- **Elastic File System**: Shared storage for containers (if needed)

#### Database & Caching
- **Amazon RDS/Aurora**: Relational database for persistent data
- **ElastiCache (Redis)**: Session storage and application caching
- **DynamoDB**: NoSQL storage for configuration and feature flags

#### Networking & Security
- **VPC**: Isolated network environment
- **Security Groups**: Firewall rules for services
- **WAF**: Web application firewall protection
- **Route 53**: DNS management and health checks

#### Monitoring & Logging
- **CloudWatch**: Metrics, logs, and alerting
- **X-Ray**: Distributed tracing
- **Systems Manager**: Parameter store for configuration

## Environments

### Development Environment
- **URL**: `https://dev-passkey-book-ui.cvent.com`
- **Purpose**: Feature development and integration testing
- **Characteristics**:
  - Automatic deployment from feature branches
  - Debug logging enabled
  - Feature flags for experimental features
  - Reduced resource allocation
  - Integration with development backend services

**Infrastructure**:
- ECS Service: 1-2 tasks
- Instance Type: t3.small
- Database: db.t3.micro (single AZ)
- Cache: cache.t3.micro

### Staging Environment
- **URL**: `https://staging-passkey-book-ui.cvent.com`
- **Purpose**: Pre-production testing and validation
- **Characteristics**:
  - Production-like configuration
  - Performance testing
  - User acceptance testing
  - Security scanning
  - Load testing capabilities

**Infrastructure**:
- ECS Service: 2-4 tasks
- Instance Type: t3.medium
- Database: db.t3.small (multi-AZ)
- Cache: cache.t3.small

### Production Environment
- **URL**: `https://passkey-book-ui.cvent.com`
- **Purpose**: Live customer-facing application
- **Characteristics**:
  - High availability and fault tolerance
  - Auto-scaling based on traffic
  - Comprehensive monitoring and alerting
  - Disaster recovery capabilities
  - Security hardening

**Infrastructure**:
- ECS Service: 4-20 tasks (auto-scaling)
- Instance Type: c5.large or larger
- Database: db.r5.xlarge (multi-AZ with read replicas)
- Cache: cache.r5.large (cluster mode)

## CI/CD Pipeline

### Jenkins Pipeline Overview

The deployment pipeline is defined in the `Jenkinsfile` and uses Cvent's standard pipeline utilities:

```groovy
buildPipeline(
  label: 'ecs-x86-medium',
  packageFilter: 'root-only',
  stablePrereleaseId: true,
  skipCacheBehavior: 'remote-only',
  awsUser: 'cdk',
  trunk: 'master'
)
```

### Pipeline Stages

#### 1. Source & Build
```bash
# Checkout source code
git checkout <branch>

# Install dependencies
pnpm install

# Build application
nx build

# Run unit tests
nx test

# Lint code
nx lint
```

#### 2. Security & Quality
```bash
# Security scanning with Mend (formerly WhiteSource)
mend scan

# Code quality analysis with SonarQube
sonar-scanner

# Vulnerability scanning
npm audit

# License compliance check
license-checker
```

#### 3. Integration Testing
```bash
# Start test environment
docker-compose up -d

# Run integration tests
nx test:integration

# Run E2E tests with Playwright
nx e2e

# Generate test reports
nx run report
```

#### 4. Build & Package
```bash
# Build Docker image
docker build -t passkey-book-ui:${BUILD_NUMBER} .

# Tag image for registry
docker tag passkey-book-ui:${BUILD_NUMBER} ${ECR_REGISTRY}/passkey-book-ui:${BUILD_NUMBER}

# Push to ECR
docker push ${ECR_REGISTRY}/passkey-book-ui:${BUILD_NUMBER}
```

#### 5. Infrastructure Deployment
```bash
# Synthesize CDK templates
nx cdk synth

# Deploy infrastructure changes
nx cdk deploy --require-approval never

# Update ECS service with new image
aws ecs update-service --service passkey-book-ui --task-definition passkey-book-ui:${BUILD_NUMBER}
```

#### 6. Application Deployment
```bash
# Deploy to staging
nx deploy:staging

# Run smoke tests
nx test:smoke

# Deploy to production (manual approval required)
nx deploy:production

# Verify deployment
nx test:health-check
```

### Deployment Strategies

#### Blue-Green Deployment
- Maintains two identical production environments
- New version deployed to inactive environment
- Traffic switched after validation
- Instant rollback capability

#### Rolling Deployment
- Gradual replacement of instances
- Zero-downtime deployment
- Configurable deployment speed
- Automatic rollback on health check failures

#### Canary Deployment
- Small percentage of traffic to new version
- Gradual traffic increase based on metrics
- Feature flag integration for controlled rollout
- Automatic rollback on error rate increase

## Configuration Management

### Environment-Specific Configuration

#### Development
```yaml
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
FEATURE_FLAGS_ENABLED=true
CACHE_TTL=60
DATABASE_POOL_SIZE=5
```

#### Staging
```yaml
# .env.staging
NODE_ENV=production
LOG_LEVEL=info
FEATURE_FLAGS_ENABLED=true
CACHE_TTL=300
DATABASE_POOL_SIZE=10
```

#### Production
```yaml
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
FEATURE_FLAGS_ENABLED=true
CACHE_TTL=3600
DATABASE_POOL_SIZE=20
```

### AWS Systems Manager Parameter Store

Sensitive configuration stored in AWS Parameter Store:

```bash
# Database credentials
/passkey-book-ui/prod/database/url
/passkey-book-ui/prod/database/password

# API keys
/passkey-book-ui/prod/launchdarkly/sdk-key
/passkey-book-ui/prod/datadog/api-key

# Authentication secrets
/passkey-book-ui/prod/auth/jwt-secret
/passkey-book-ui/prod/auth/session-secret
```

### Feature Flag Configuration

LaunchDarkly feature flags control application behavior:

```json
{
  "newBookingFlow": {
    "enabled": true,
    "rollout": 100,
    "targeting": {
      "environment": "production"
    }
  },
  "paymentV2": {
    "enabled": false,
    "rollout": 0,
    "targeting": {
      "userSegment": "beta-testers"
    }
  }
}
```

## Monitoring & Alerting

### Application Metrics

#### Key Performance Indicators
- **Response Time**: 95th percentile < 500ms
- **Error Rate**: < 0.1% for critical paths
- **Availability**: > 99.9% uptime
- **Throughput**: Requests per second capacity

#### Custom Metrics
```javascript
// Business metrics
metrics.increment('booking.created')
metrics.histogram('booking.conversion_time', duration)
metrics.gauge('active_users', userCount)

// Technical metrics  
metrics.increment('api.request', { endpoint: '/api/hotels' })
metrics.histogram('database.query_time', queryDuration)
metrics.gauge('memory.usage', memoryUsage)
```

### Alerting Rules

#### Critical Alerts (PagerDuty)
- Application down (health check failures)
- Error rate > 1% for 5 minutes
- Response time > 2 seconds for 5 minutes
- Database connection failures

#### Warning Alerts (Slack)
- Error rate > 0.5% for 10 minutes
- Response time > 1 second for 10 minutes
- Memory usage > 80%
- Disk usage > 85%

### Dashboard Configuration

#### Application Dashboard
- Request volume and response times
- Error rates by endpoint
- Database performance metrics
- Cache hit/miss ratios

#### Infrastructure Dashboard
- ECS service health and scaling
- Load balancer metrics
- Database connections and performance
- CDN cache performance

#### Business Dashboard
- Booking conversion funnel
- User engagement metrics
- Feature flag adoption rates
- Revenue and booking metrics

## Rollback Procedures

### Automatic Rollback Triggers

#### Health Check Failures
```bash
# ECS health check configuration
healthCheck:
  command: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
  interval: 30
  timeout: 5
  retries: 3
  startPeriod: 60
```

#### Error Rate Threshold
- Automatic rollback if error rate > 5% for 2 minutes
- Circuit breaker pattern for external service failures
- Graceful degradation for non-critical features

### Manual Rollback Process

#### 1. Immediate Rollback (Emergency)
```bash
# Rollback to previous ECS task definition
aws ecs update-service \
  --cluster passkey-book-ui \
  --service passkey-book-ui \
  --task-definition passkey-book-ui:PREVIOUS

# Verify rollback
aws ecs describe-services --cluster passkey-book-ui --services passkey-book-ui
```

#### 2. Infrastructure Rollback
```bash
# Rollback CDK stack to previous version
nx cdk deploy --rollback

# Verify infrastructure state
aws cloudformation describe-stacks --stack-name passkey-book-ui
```

#### 3. Database Rollback (if needed)
```bash
# Restore from automated backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier passkey-book-ui-rollback \
  --db-snapshot-identifier passkey-book-ui-snapshot-TIMESTAMP

# Update connection strings
aws ssm put-parameter \
  --name "/passkey-book-ui/prod/database/url" \
  --value "new-connection-string" \
  --overwrite
```

### Rollback Validation

#### Post-Rollback Checks
1. **Health Checks**: Verify all health endpoints return 200
2. **Smoke Tests**: Run critical path tests
3. **Monitoring**: Check error rates and response times
4. **User Impact**: Monitor user-reported issues
5. **Data Integrity**: Verify no data corruption occurred

#### Communication Plan
1. **Internal Notification**: Alert development team via Slack
2. **Status Page**: Update external status page if customer-facing
3. **Post-Mortem**: Schedule incident review meeting
4. **Documentation**: Update runbooks with lessons learned

## Disaster Recovery

### Backup Strategy

#### Database Backups
- Automated daily backups with 30-day retention
- Point-in-time recovery capability
- Cross-region backup replication
- Monthly backup restoration testing

#### Application Backups
- Container images stored in ECR with lifecycle policies
- Infrastructure code versioned in Git
- Configuration backed up to S3
- Secrets backed up in encrypted format

### Recovery Procedures

#### Regional Failover
1. **DNS Failover**: Route 53 health checks redirect traffic
2. **Database Failover**: RDS cross-region read replica promotion
3. **Application Deployment**: Deploy to secondary region
4. **Data Synchronization**: Ensure data consistency across regions

#### Recovery Time Objectives (RTO)
- **Critical Systems**: < 1 hour
- **Non-Critical Systems**: < 4 hours
- **Full System Recovery**: < 8 hours

#### Recovery Point Objectives (RPO)
- **Database**: < 15 minutes (using continuous backup)
- **Application State**: < 5 minutes (using session replication)
- **Configuration**: < 1 minute (using version control)