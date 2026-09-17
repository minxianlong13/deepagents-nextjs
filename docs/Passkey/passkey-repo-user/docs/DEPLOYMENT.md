# Deployment

## Infrastructure

The Passkey User Service is deployed on Cvent's internal cloud infrastructure using containerized deployments with Docker and orchestrated through Jenkins CI/CD pipelines.

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│  Service Mesh   │────│   Application   │
│    (F5/HAProxy) │    │   (Consul)      │    │   Instances     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │  Oracle Database│
                                               │    Cluster      │
                                               └─────────────────┘
```

## Environments

### Development (dev)
- **Purpose**: Local development and initial testing
- **URL**: `https://passkey-user-service.dev.cvent.org`
- **Database**: Oracle Dev instance
- **Monitoring**: Basic logging and health checks
- **Auto-deployment**: On feature branch merges

### Alpha (alpha)
- **Purpose**: Integration testing and QA validation
- **URL**: `https://passkey-user-service.alpha.cvent.org`
- **Database**: Oracle Alpha instance with test data
- **Monitoring**: Full monitoring with Datadog
- **Auto-deployment**: On development branch merges
- **Features**: Load testing, integration test execution

### Test/Staging (ts50)
- **Purpose**: Pre-production testing and staging
- **URL**: `https://passkey-user-service.ts50.cvent.org`
- **Database**: Oracle staging instance (production-like data)
- **Monitoring**: Production-level monitoring and alerting
- **Auto-deployment**: On master branch merges
- **Features**: Performance testing, security scanning

### Production (sg50)
- **Purpose**: Live production environment
- **URL**: `https://passkey-user-service.sg50.cvent.org`
- **Database**: Oracle production cluster
- **Monitoring**: Full production monitoring, alerting, and SLA tracking
- **Deployment**: Manual approval required
- **Features**: Blue-green deployment, automatic rollback

## CI/CD Pipeline

### Jenkins Pipeline Configuration
```groovy
dropwizardPipeline([
  slack: [
    [ branch: 'PR-.*', branch_type: 'SOURCE', channel: '_owner_', events: ['START', 'SUCCESS', 'FAILURE']],
    [ branch: 'master', channel: 'passkey-api', events: ['START', 'SUCCESS', 'FAILURE'] ]
  ],

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

  ci: [
    builds: [
      [ branch: '.*', environments: 'ci' ]
    ]
  ],

  builds: [
    [ branch: 'development', environments: 'alpha'],
    [ branch: 'master', environments: ['ts50','sg50'] ]
  ],

  scheduledTests: [
    [ branch: 'master', slack: [channel: 'passkey-ci-results', events: ['SUCCESS', 'FAILURE']], triggers: [
      [ environment: 'ts50', cron: '0 8 * * 2', tags: '~@ignore' ]
    ]],
  ]
])
```

### Pipeline Stages

#### 1. Source Code Management
- Git checkout from Stash/Bitbucket
- Branch-based deployment strategy
- Automatic triggering on commits and PRs

#### 2. Build Stage
```bash
# Maven build with release profile
mvn clean package -Prelease

# Docker image creation
docker build -t passkey-user-service:${BUILD_NUMBER} .

# Image scanning and security validation
docker scan passkey-user-service:${BUILD_NUMBER}
```

#### 3. Testing Stage
```bash
# Unit tests
mvn test

# Integration tests (alpha environment)
mvn -Prun-it -Denv.IT_ENVIRONMENT=alpha verify

# Load tests (ts50 environment)
mvn -Prun-load -Denv.LOAD_TEST_ENVIRONMENT=ts50 verify
```

#### 4. Security Scanning
- **Checkmarx**: Static code analysis for security vulnerabilities
- **Container Scanning**: Docker image vulnerability assessment
- **Dependency Check**: Third-party library security validation

#### 5. Deployment Stage
- Environment-specific configuration injection
- Blue-green deployment for production
- Health check validation post-deployment
- Automatic rollback on failure

## Configuration Management

### Environment-Specific Configurations

#### Development (dev.yaml)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:oracle:thin:@dev-oracle.cvent.org:1521:DEVDB
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  minSize: 2
  maxSize: 8

logging:
  level: DEBUG
  
auth:
  serviceUrl: https://auth-service.dev.cvent.org
  cacheEnabled: false
```

#### Production (sg50.yaml)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:oracle:thin:@prod-oracle-cluster.cvent.org:1521:PRODDB
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  minSize: 16
  maxSize: 64
  validationQuery: SELECT 1 FROM DUAL
  checkConnectionWhileIdle: true

logging:
  level: INFO
  appenders:
    - type: syslog
      host: syslog.cvent.org
      port: 514

auth:
  serviceUrl: https://auth-service.cvent.org
  cacheEnabled: true
  cacheTtl: 300s

metrics:
  reporters:
    - type: datadog
      host: datadog-agent.cvent.org
      port: 8125
      prefix: passkey-user-service
```

### Secret Management
- **Hogan Templates**: Configuration template management
- **Vault Integration**: Secure secret storage and rotation
- **Environment Variables**: Runtime configuration injection
- **Encrypted Properties**: Database passwords and API keys

### Configuration Deployment
```bash
# Hogan template directory structure
passkey-user-service/configs/
├── dev.yaml.hogan
├── alpha.yaml.hogan
├── ts50.yaml.hogan
└── sg50.yaml.hogan

# Template processing during deployment
hogan-cli process --template configs/sg50.yaml.hogan --output configs/sg50.yaml
```

## Container Configuration

### Dockerfile
```dockerfile
FROM openjdk:17-jre-slim

# Create application user
RUN groupadd -r passkey && useradd -r -g passkey passkey

# Set working directory
WORKDIR /app

# Copy application JAR
COPY target/passkey-user-service-*.jar app.jar

# Copy configuration files
COPY configs/ configs/

# Set ownership
RUN chown -R passkey:passkey /app

# Switch to application user
USER passkey

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/healthcheck || exit 1

# Expose ports
EXPOSE 8080 8081

# Start application
ENTRYPOINT ["java", "-jar", "app.jar", "server", "configs/production.yaml"]
```

### Docker Compose (Local Development)
```yaml
version: '3.8'
services:
  passkey-user-service:
    build: .
    ports:
      - "8080:8080"
      - "8081:8081"
    environment:
      - DB_HOST=oracle-db
      - DB_USERNAME=passkey_user
      - DB_PASSWORD=dev_password
      - AUTH_SERVICE_URL=http://auth-service:8080
    depends_on:
      - oracle-db
    volumes:
      - ./configs/dev.yaml:/app/configs/production.yaml

  oracle-db:
    image: oracle/database:18.4.0-xe
    ports:
      - "1521:1521"
    environment:
      - ORACLE_PWD=oracle_password
    volumes:
      - oracle_data:/opt/oracle/oradata
```

## Monitoring and Alerting

### Health Checks
```yaml
# Health check endpoints
GET /healthcheck - Overall service health
GET /healthcheck/database - Database connectivity
GET /healthcheck/auth - Auth service connectivity
GET /metrics - Prometheus-compatible metrics
```

### Datadog Integration
```yaml
# Datadog configuration
metrics:
  reporters:
    - type: datadog
      host: ${DATADOG_HOST}
      port: 8125
      prefix: passkey-user-service
      tags:
        - environment:${ENVIRONMENT}
        - service:passkey-user-service
        - version:${BUILD_NUMBER}
```

### Alerting Rules
- **High Error Rate**: >5% error rate for 5 minutes
- **High Response Time**: >2s average response time for 10 minutes
- **Database Connection Issues**: Connection pool exhaustion
- **Memory Usage**: >85% heap utilization for 15 minutes
- **Disk Space**: <10% free disk space

## Rollback Procedures

### Automatic Rollback Triggers
- Health check failures after deployment
- Error rate exceeding 10% within 5 minutes
- Response time degradation >300% from baseline
- Critical dependency failures

### Manual Rollback Process
```bash
# 1. Identify current deployment
kubectl get deployments passkey-user-service

# 2. Rollback to previous version
kubectl rollout undo deployment/passkey-user-service

# 3. Verify rollback success
kubectl rollout status deployment/passkey-user-service

# 4. Update load balancer if needed
# 5. Notify stakeholders via Slack
```

### Blue-Green Deployment
```bash
# 1. Deploy to green environment
deploy-service --environment=sg50-green --version=${NEW_VERSION}

# 2. Run smoke tests
run-smoke-tests --environment=sg50-green

# 3. Switch traffic gradually
update-load-balancer --blue-weight=90 --green-weight=10
update-load-balancer --blue-weight=50 --green-weight=50
update-load-balancer --blue-weight=0 --green-weight=100

# 4. Monitor for issues
monitor-deployment --duration=30m

# 5. Decommission blue environment
decommission-environment --environment=sg50-blue
```

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Daily full backups, hourly incremental
- **Configuration Backups**: Version-controlled in Git
- **Application Artifacts**: Stored in artifact repository
- **Log Retention**: 90 days for production, 30 days for non-production

### Recovery Procedures
1. **Service Outage**: Automatic failover to standby instances
2. **Database Failure**: Restore from latest backup with <4 hour RPO
3. **Data Center Failure**: Failover to secondary data center
4. **Complete System Failure**: Full system restore from backups

### Business Continuity
- **RTO (Recovery Time Objective)**: 2 hours
- **RPO (Recovery Point Objective)**: 4 hours
- **Availability SLA**: 99.9% uptime
- **Maintenance Windows**: Sundays 2-6 AM EST