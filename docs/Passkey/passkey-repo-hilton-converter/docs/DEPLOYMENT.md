# Deployment

## Infrastructure

### Container Platform
- **Platform**: Docker containers deployed on Cvent's internal infrastructure
- **Base Image**: `docker.cvent.net/cvent-jre:11.0.4.11`
- **Runtime**: Java 21 JRE optimized for containerized environments
- **Orchestration**: Managed through Cvent's deployment infrastructure

### Network Architecture
- **Load Balancing**: Application Load Balancer (ALB) for traffic distribution
- **Service Discovery**: Internal service registry for service-to-service communication
- **Security Groups**: Restricted network access based on environment
- **SSL/TLS**: End-to-end encryption for all external communication

## Environments

### Development (dev)
- **Purpose**: Local development and initial testing
- **URL**: `http://localhost:8080` (local) / Internal dev environment
- **Configuration**: `configs/dev.yaml`
- **Database**: Development database instances
- **Monitoring**: Basic logging and metrics
- **Secrets**: Development-specific credentials

### Continuous Integration (ci)
- **Purpose**: Automated testing and validation
- **URL**: `https://passkey-hilton-converter-service-ci.core.cvent.org`
- **Configuration**: `configs/ci.yaml`
- **Triggers**: Every commit and pull request
- **Testing**: Full test suite including integration tests
- **Deployment**: Automatic deployment on successful builds

### Alpha (alpha)
- **Purpose**: Early integration testing and validation
- **URL**: `https://passkey-hilton-converter-service-alpha.core.cvent.org`
- **Configuration**: `configs/alpha.yaml`
- **Deployment**: Automatic from `development` branch
- **Testing**: Extended integration testing with other services
- **Data**: Synthetic test data and limited real data

### Test Staging (ts50)
- **Purpose**: Pre-production testing and validation
- **URL**: `https://passkey-hilton-converter-service-ts50.core.cvent.org`
- **Configuration**: `configs/ts50.yaml`
- **Deployment**: Automatic from `master` branch
- **Testing**: Full regression testing and performance validation
- **Data**: Production-like data for comprehensive testing

### Integration Testing (it50)
- **Purpose**: Integration testing with production-like environment
- **URL**: `https://passkey-hilton-converter-service-it50.core.cvent.org`
- **Configuration**: `configs/it50.yaml`
- **Deployment**: Automatic from `master` branch
- **Testing**: End-to-end integration testing
- **Monitoring**: Full monitoring and alerting

### Production (pr50)
- **Purpose**: Live production environment
- **URL**: `https://passkey-hilton-converter-service-pr50.core.cvent.org`
- **Configuration**: `configs/pr50.yaml` (production-specific settings)
- **Deployment**: Manual approval required
- **Monitoring**: Full observability stack with alerting
- **High Availability**: Multi-AZ deployment with failover

## CI/CD Pipeline

### Jenkins Pipeline Configuration
**File**: `Jenkinsfile`
**Pipeline Type**: Dropwizard Pipeline (Cvent standard)

#### Pipeline Stages

1. **Source Code Management**
   - **Repository**: `git@github.com:cvent-internal/passkey-hilton-converter.git`
   - **Branches**: `master`, `development`, feature branches
   - **Webhooks**: Automatic triggering on code changes

2. **Build Stage**
   - **Agent**: `ecs-x86-medium`
   - **Commands**: 
     ```bash
     mvn clean package -Prelease
     ```
   - **Artifacts**: JAR files, configuration packages, Docker images

3. **Test Stage**
   - **Unit Tests**: JUnit tests with JaCoCo coverage
   - **Integration Tests**: Karate-based API testing
   - **Code Quality**: Checkstyle, FindBugs, SonarQube analysis
   - **Coverage Threshold**: 80% line coverage requirement

4. **Security Scanning**
   - **Tool**: Checkmarx static analysis
   - **Configuration**:
     - **Team**: `56fff0f3-468b-4984-8211-65e516926eaa`
     - **Preset**: `100011`
     - **Sync Mode**: `true`
   - **Branches**: `master`, `development`

5. **Docker Build**
   - **Multi-stage Build**: Separate build and runtime containers
   - **Image Tagging**: Git commit SHA and branch-based tags
   - **Registry**: Cvent internal Docker registry

6. **Deployment Stages**
   - **CI Environment**: Every successful build
   - **Alpha Environment**: `development` branch builds
   - **Staging Environments**: `master` branch builds
   - **Production**: Manual approval required

#### Branch Strategy

```yaml
builds:
  - branch: 'development'
    environments: 'alpha'
  - branch: 'master' 
    environments: ['ts50', 'it50']

ci:
  builds:
    - branch: '.*'
      environments: 'ci'
```

### Deployment Automation

#### Automatic Deployments
- **CI**: All branches automatically deploy to CI environment
- **Alpha**: `development` branch automatically deploys
- **Staging**: `master` branch automatically deploys to ts50 and it50

#### Manual Deployments
- **Production**: Requires manual approval through Jenkins
- **Rollback**: Manual rollback capability through deployment pipeline
- **Emergency**: Emergency deployment process for critical fixes

### Release Management

#### Version Strategy
- **Semantic Versioning**: `MAJOR.MINOR.PATCH` format
- **Snapshot Builds**: Development builds use `-SNAPSHOT` suffix
- **Release Tags**: Git tags for production releases
- **Current Version**: `1.7.1-SNAPSHOT`

#### Release Process
1. **Feature Development**: Feature branches merged to `development`
2. **Integration Testing**: `development` branch tested in alpha environment
3. **Release Preparation**: Merge `development` to `master`
4. **Staging Validation**: Automated deployment to staging environments
5. **Production Release**: Manual approval and deployment
6. **Post-Release**: Monitoring and validation

## Configuration Management

### Environment-Specific Configuration

#### Configuration Files
Each environment has dedicated configuration:
- `dev.yaml` - Local development settings
- `ci.yaml` - CI environment settings
- `alpha.yaml` - Alpha environment settings
- `ts50.yaml` - Test staging settings
- `it50.yaml` - Integration test settings
- `pr50.yaml` - Production settings

#### Configuration Structure
```yaml
# Environment-specific overrides
server:
  applicationConnectors:
    - type: http
      port: ${PORT:-8080}

passkeyApi:
  baseUrl: ${PASSKEY_API_BASE_URL}
  username: ${PASSKEY_API_USERNAME}
  password: ${PASSKEY_API_PASSWORD}

logging:
  level: ${LOG_LEVEL:-INFO}
  appenders:
    - type: console
      logFormat: ${LOG_FORMAT:-json}
```

### Secret Management

#### Parameter Store Integration
Secrets managed through Jenkins parameter store:
- **Staging Secrets**: `__STAGING_HILTON_CONVERTER_API_USER_PASSWORD__`
- **Production Secrets**: `__PRODUCTION_HILTON_CONVERTER_API_USER_PASSWORD__`

#### Runtime Injection
Environment variables injected at deployment time:
```bash
export PASSKEY_API_PASSWORD="${HILTON_CONVERTER_API_PASSWORD}"
export AUTH_SERVICE_BASE_URL="${AUTH_SERVICE_URL}"
export LOG_LEVEL="${APPLICATION_LOG_LEVEL}"
```

#### Secret Rotation
- **Automated Rotation**: Secrets rotated on schedule
- **Emergency Rotation**: Manual rotation capability
- **Validation**: Automatic validation of new secrets

## Monitoring and Alerting

### Application Monitoring

#### Health Checks
- **Endpoint**: `/healthcheck`
- **Frequency**: Every 30 seconds
- **Checks**: Database connectivity, external service availability
- **Alerting**: Immediate alerts on health check failures

#### Metrics Collection
- **Endpoint**: `/metrics`
- **Format**: Prometheus metrics format
- **Collection**: Scraped every 15 seconds
- **Retention**: 30 days of metric history

### External Monitoring

#### Datadog Integration
- **APM**: Application Performance Monitoring
  - **URL**: [Datadog APM Dashboard](https://cvent.datadoghq.com/apm/services/passkey-hilton-converter-service/operations/servlet.request/resources)
  - **Metrics**: Response times, error rates, throughput
  - **Traces**: Distributed tracing across service calls

- **Log Aggregation**:
  - **URL**: [Datadog Logs](https://cvent.datadoghq.com/logs?query=env%3Apr50+service%3Apasskey-hilton-converter-service)
  - **Structured Logging**: JSON format with correlation IDs
  - **Log Levels**: Configurable per environment

#### Alerting Rules
- **High Error Rate**: >5% error rate for 5 minutes
- **High Response Time**: >2 second average response time
- **Service Unavailable**: Health check failures
- **Memory Usage**: >80% memory utilization
- **CPU Usage**: >80% CPU utilization for 10 minutes

### Slack Integration

#### Notification Channels
- **Development**: `_owner_` channel for PR notifications
- **Team Channel**: `passkey-api` for build and deployment notifications
- **CI Results**: `passkey-ci-results` for scheduled test results
- **PVT Results**: `passkey-api-pvt-results` for production validation tests

#### Notification Events
```yaml
slack:
  - branch: 'PR-.*'
    branch_type: 'SOURCE'
    channel: '_owner_'
    events: ['START', 'SUCCESS', 'FAILURE']
  - branch: 'master|development'
    channel: 'passkey-api'
    events: ['START', 'SUCCESS', 'FAILURE']
```

## Scheduled Testing

### Automated Test Execution

#### Staging Environment Tests
- **Environment**: ts50
- **Schedule**: `0 1 * * 2` (1 AM every Tuesday)
- **Tags**: `~@ignore` (all tests except ignored)
- **Notifications**: `passkey-ci-results` Slack channel

#### Production Validation Tests
- **Environment**: pr50
- **Schedule**: `0 3 * * 1-5` (3 AM Monday-Friday)
- **Tags**: `@pvt_Karate` (production validation tests)
- **Notifications**: `passkey-api-pvt-results` Slack channel

```yaml
scheduledTests:
  - branch: 'master'
    slack:
      channel: 'passkey-ci-results'
      events: ['SUCCESS', 'FAILURE']
    triggers:
      - environment: 'ts50'
        cron: '0 1 * * 2'
        tags: '~@ignore'
  - branch: 'master'
    slack:
      channel: 'passkey-api-pvt-results'
      events: ['SUCCESS', 'FAILURE']
    triggers:
      - environment: 'pr50'
        cron: '0 3 * * 1-5'
        tags: '@pvt_Karate'
```

## Rollback Procedures

### Automated Rollback
- **Trigger**: Health check failures or critical alerts
- **Process**: Automatic revert to previous stable version
- **Validation**: Health checks confirm successful rollback

### Manual Rollback
1. **Identify Issue**: Determine need for rollback
2. **Access Jenkins**: Navigate to deployment pipeline
3. **Select Version**: Choose previous stable version
4. **Execute Rollback**: Deploy previous version
5. **Validate**: Confirm service health and functionality
6. **Communicate**: Notify team of rollback completion

### Emergency Procedures
- **Immediate Response**: Stop traffic to affected instances
- **Quick Rollback**: Deploy last known good version
- **Investigation**: Parallel investigation of root cause
- **Communication**: Incident response communication plan

## Disaster Recovery

### Backup Strategy
- **Configuration**: Version-controlled configuration files
- **Secrets**: Backed up in secure parameter store
- **Application Code**: Git repository with full history

### Recovery Procedures
1. **Infrastructure Recovery**: Rebuild infrastructure from code
2. **Application Deployment**: Deploy from Git repository
3. **Configuration Restoration**: Apply environment-specific configs
4. **Secret Restoration**: Restore secrets from parameter store
5. **Validation**: Full system validation and testing

### Recovery Time Objectives
- **RTO (Recovery Time Objective)**: 30 minutes
- **RPO (Recovery Point Objective)**: 0 (no data loss - stateless service)
- **MTTR (Mean Time To Recovery)**: 15 minutes average