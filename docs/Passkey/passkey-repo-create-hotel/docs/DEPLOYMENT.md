# Deployment

## Infrastructure

The Passkey Create Hotel Service is deployed on Cvent's cloud infrastructure using a containerized approach with Docker and orchestrated through Jenkins CI/CD pipelines. The service runs on AWS infrastructure with multi-environment support.

### Container Platform
- **Base Image**: `docker.cvent.net/cvent-jre:11.0.1.13`
- **Runtime**: Java 17 JRE
- **Container Registry**: Cvent Internal Docker Registry
- **Orchestration**: Kubernetes (managed by Cvent platform team)

### Load Balancing
- **Load Balancer**: AWS Application Load Balancer (ALB)
- **Health Check Endpoint**: `/admin/healthcheck`
- **Health Check Interval**: 30 seconds
- **Healthy Threshold**: 2 consecutive successful checks
- **Unhealthy Threshold**: 3 consecutive failed checks

## Environments

### Development (dev)
- **Purpose**: Local development and initial testing
- **URL**: `https://dev.cvent.com/passkey-create-hotel`
- **Database**: Oracle development instance
- **Resources**: 
  - CPU: 1 vCPU
  - Memory: 2GB RAM
  - Storage: 20GB
- **Replicas**: 1 instance
- **Auto-scaling**: Disabled
- **Monitoring**: Basic logging and metrics

### Alpha (alpha)
- **Purpose**: Integration testing and feature validation
- **URL**: `https://alpha.cvent.com/passkey-create-hotel`
- **Database**: Oracle alpha instance (shared)
- **Resources**:
  - CPU: 2 vCPU
  - Memory: 4GB RAM
  - Storage: 50GB
- **Replicas**: 2 instances
- **Auto-scaling**: Enabled (2-4 instances)
- **Monitoring**: Full monitoring with Datadog integration
- **Deployment Trigger**: Automatic on `development` branch commits

### Test Stage 50 (ts50)
- **Purpose**: Pre-production testing and validation
- **URL**: `https://ts50.cvent.com/passkey-create-hotel`
- **Database**: Oracle test instance (dedicated)
- **Resources**:
  - CPU: 4 vCPU
  - Memory: 8GB RAM
  - Storage: 100GB
- **Replicas**: 3 instances
- **Auto-scaling**: Enabled (3-6 instances)
- **Monitoring**: Full monitoring with alerting
- **Deployment Trigger**: Automatic on `master` branch commits
- **Load Testing**: Automated performance tests

### Staging 50 (sg50)
- **Purpose**: Production-like environment for final validation
- **URL**: `https://sg50.cvent.com/passkey-create-hotel`
- **Database**: Oracle staging instance (production-like)
- **Resources**:
  - CPU: 8 vCPU
  - Memory: 16GB RAM
  - Storage: 200GB
- **Replicas**: 4 instances
- **Auto-scaling**: Enabled (4-8 instances)
- **Monitoring**: Production-level monitoring and alerting
- **Deployment Trigger**: Automatic on `master` branch commits
- **Validation**: Full regression testing suite

### Production 50 (pr50)
- **Purpose**: Live production environment
- **URL**: `https://pr50.cvent.com/passkey-create-hotel`
- **Database**: Oracle production cluster (high availability)
- **Resources**:
  - CPU: 16 vCPU
  - Memory: 32GB RAM
  - Storage: 500GB
- **Replicas**: 6 instances (minimum)
- **Auto-scaling**: Enabled (6-12 instances)
- **Monitoring**: Comprehensive monitoring, alerting, and on-call rotation
- **Deployment Trigger**: Manual promotion from staging
- **Backup**: Automated daily backups with point-in-time recovery

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The service uses Cvent's standardized Dropwizard pipeline with the following configuration:

```groovy
dropwizardPipeline([
    changesets: true,
    release: [
        branch: 'master'
    ],
    checkmarx: [
        branch: 'master|development',
        syncMode: true,
        teamValue: '56fff0f3-468b-4984-8211-65e516926eaa',
        presetValue: '100011'
    ],
    slack: [
        [branch: 'PR-.*', branch_type: 'SOURCE', channel: '_owner_', events: ['START', 'SUCCESS', 'FAILURE']],
        [branch: 'master|development', channel: 'passkey-api', events: ['START', 'SUCCESS', 'FAILURE']]
    ],
    snapshot: [
        sonar: true
    ],
    builds: [
        [branch: 'development', environments: 'alpha'],
        [branch: 'master', environments: ['ts50', 'sg50']]
    ],
    ci: [
        builds: [
            [branch: '.*', environments: ['ci'], sonar: true, integrationTests: true]
        ]
    ],
    scheduledTests: [
        [branch: 'master', slack: [channel: 'passkey-api-pvt-results', events: ['SUCCESS', 'FAILURE']],
         triggers: [
             [environment: 'pr50', cron: '0 12 * * 5', tags: '@pvt-karate']
         ]],
        [branch: 'master', slack: [channel: 'passkey-ci-results', events: ['SUCCESS', 'FAILURE']],
         triggers: [
             [environment: 'ts50', cron: '0 9 * * 2', tags: '~@ignore']
         ]]
    ]
])
```

### Pipeline Stages

1. **Source Code Checkout**
   - Checkout from GitHub repository
   - Branch-specific triggers (master, development, PR branches)

2. **Build & Test**
   - Maven compilation and packaging
   - Unit test execution
   - Code coverage analysis with JaCoCo
   - SonarQube code quality analysis

3. **Security Scanning**
   - Checkmarx static application security testing (SAST)
   - Dependency vulnerability scanning
   - Container image security scanning

4. **Integration Testing**
   - Environment-specific integration tests
   - API contract testing
   - Database integration validation

5. **Docker Image Build**
   - Multi-stage Docker build
   - Image tagging with build number and Git SHA
   - Push to Cvent Docker registry

6. **Deployment**
   - Environment-specific deployment
   - Health check validation
   - Smoke tests execution

7. **Post-Deployment Validation**
   - Automated regression tests
   - Performance baseline validation
   - Monitoring setup verification

### Build Artifacts

- **JAR File**: `passkey-create-hotel-service-{version}.jar`
- **Docker Image**: `docker.cvent.net/passkey-create-hotel:{tag}`
- **Configuration Bundle**: Environment-specific configuration files
- **Documentation**: Generated API documentation and reports

## Configuration Management

### Environment-Specific Configuration

Configuration is managed through Hogan templates and environment-specific YAML files:

```yaml
# Base configuration template
server:
  type: simple
  applicationContextPath: /
  adminContextPath: /admin
  connector:
    type: http
    port: ${HTTP_PORT:8080}
  adminConnectors:
    - type: http
      port: ${ADMIN_PORT:8081}

database:
  driverClass: oracle.jdbc.OracleDriver
  url: ${DATABASE_URL}
  user: ${DATABASE_USER}
  password: ${DATABASE_PASSWORD}
  maxWaitForConnection: ${DB_MAX_WAIT:1s}
  validationQuery: "SELECT 1 FROM DUAL"
  minSize: ${DB_MIN_SIZE:8}
  maxSize: ${DB_MAX_SIZE:32}

externalServices:
  passkeyHotelService:
    baseUrl: ${PASSKEY_HOTEL_SERVICE_URL}
    timeout: ${HOTEL_SERVICE_TIMEOUT:30s}
  businessTextService:
    baseUrl: ${BUSINESS_TEXT_SERVICE_URL}
    timeout: ${BUSINESS_TEXT_TIMEOUT:30s}

logging:
  level: ${LOG_LEVEL:INFO}
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC
      target: stdout
```

### Secret Management

- **Database Credentials**: Stored in AWS Secrets Manager
- **API Keys**: Managed through Cvent's secret management system
- **Service Certificates**: Auto-rotated through AWS Certificate Manager
- **Environment Variables**: Injected at runtime through Kubernetes secrets

### Configuration Deployment

1. **Hogan Templates**: Stored in `passkey-create-hotel-service/configs/`
2. **Environment Variables**: Defined in Kubernetes deployment manifests
3. **Secret Injection**: Mounted as volumes or environment variables
4. **Configuration Validation**: Automated validation during deployment

## Rollback Procedures

### Automated Rollback

The deployment pipeline includes automated rollback capabilities:

1. **Health Check Failure**: Automatic rollback if health checks fail after deployment
2. **Error Rate Threshold**: Rollback triggered if error rate exceeds 5% for 5 minutes
3. **Performance Degradation**: Rollback if response time increases by 50% for 10 minutes

### Manual Rollback Process

1. **Identify Issue**:
   ```bash
   # Check service health
   kubectl get pods -l app=passkey-create-hotel -n passkey
   
   # Check logs
   kubectl logs -l app=passkey-create-hotel -n passkey --tail=100
   ```

2. **Initiate Rollback**:
   ```bash
   # Rollback to previous deployment
   kubectl rollout undo deployment/passkey-create-hotel -n passkey
   
   # Rollback to specific revision
   kubectl rollout undo deployment/passkey-create-hotel --to-revision=2 -n passkey
   ```

3. **Verify Rollback**:
   ```bash
   # Check rollout status
   kubectl rollout status deployment/passkey-create-hotel -n passkey
   
   # Verify health
   curl -f https://{environment}.cvent.com/passkey-create-hotel/admin/healthcheck
   ```

4. **Post-Rollback Actions**:
   - Notify stakeholders via Slack
   - Update incident tracking system
   - Schedule post-mortem if necessary

### Database Rollback

For database schema changes:

1. **Backward Compatible Changes**: No rollback needed
2. **Breaking Changes**: 
   - Coordinate with DBA team
   - Execute rollback scripts
   - Validate data integrity

### Emergency Rollback

For critical production issues:

1. **Immediate Actions**:
   - Contact on-call engineer
   - Execute emergency rollback procedure
   - Activate incident response team

2. **Communication**:
   - Post in #passkey-api Slack channel
   - Update status page if customer-facing
   - Notify management if business-critical

## Monitoring and Alerting

### Health Monitoring

- **Application Health**: `/admin/healthcheck` endpoint
- **Database Connectivity**: Connection pool monitoring
- **External Dependencies**: Service dependency health checks
- **Resource Utilization**: CPU, memory, and disk usage

### Key Metrics

- **Request Rate**: Requests per second
- **Response Time**: P50, P95, P99 latencies
- **Error Rate**: 4xx and 5xx error percentages
- **Throughput**: Hotel creation rate
- **Database Performance**: Query execution times

### Alerting Rules

```yaml
# High error rate alert
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} for 5 minutes"

# High response time alert
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "High response time detected"
    description: "95th percentile response time is {{ $value }}s"

# Database connection alert
- alert: DatabaseConnectionFailure
  expr: database_connections_active / database_connections_max > 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Database connection pool nearly exhausted"
    description: "{{ $value }}% of database connections in use"
```

### Notification Channels

- **Slack**: #passkey-api channel for team notifications
- **PagerDuty**: Critical alerts for on-call rotation
- **Email**: Management notifications for business-critical issues
- **Datadog**: Centralized monitoring dashboard

## Disaster Recovery

### Backup Strategy

- **Database Backups**: Daily automated backups with 30-day retention
- **Configuration Backups**: Version-controlled in Git repository
- **Application Artifacts**: Stored in artifact repository with versioning

### Recovery Procedures

1. **Service Recovery**:
   - Redeploy from last known good configuration
   - Validate service functionality
   - Restore traffic routing

2. **Database Recovery**:
   - Coordinate with DBA team
   - Restore from backup if necessary
   - Validate data integrity

3. **Full Environment Recovery**:
   - Rebuild infrastructure from Infrastructure as Code
   - Restore application and database
   - Validate end-to-end functionality

### Business Continuity

- **RTO (Recovery Time Objective)**: 4 hours for production
- **RPO (Recovery Point Objective)**: 1 hour for production
- **Failover Strategy**: Multi-region deployment capability
- **Communication Plan**: Stakeholder notification procedures