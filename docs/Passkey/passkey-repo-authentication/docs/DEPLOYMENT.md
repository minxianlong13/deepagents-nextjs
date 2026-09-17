# Deployment

## Infrastructure

The Passkey Authentication Service is deployed on Cvent's AWS-based infrastructure using containerized deployment with Docker and orchestrated through Cvent's internal deployment platform.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (ALB)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Container Orchestration                        │
│         (ECS/Kubernetes - Environment Specific)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│            Service Instances (Docker Containers)           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Instance  │  │   Instance  │  │   Instance  │        │
│  │      1      │  │      2      │  │      3      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Oracle Database (RDS)                       │
│              (Multi-AZ for High Availability)              │
└─────────────────────────────────────────────────────────────┘
```

## Environments

### Development (dev)
- **Purpose**: Development and testing
- **URL**: `https://passkey-authentication-service.dev.cvent.org`
- **Instances**: 2 containers
- **Resources**: 
  - CPU: 0.5 vCPU per container
  - Memory: 1GB per container
- **Database**: Shared development Oracle instance
- **Monitoring**: Basic monitoring with Datadog
- **Deployment**: Automatic on merge to `develop` branch

### Staging (staging)
- **Purpose**: Pre-production testing and validation
- **URL**: `https://passkey-authentication-service.staging.cvent.org`
- **Instances**: 3 containers
- **Resources**:
  - CPU: 1 vCPU per container
  - Memory: 2GB per container
- **Database**: Dedicated staging Oracle instance
- **Monitoring**: Full monitoring with alerts
- **Deployment**: Manual promotion from development

### Production (prod)
- **Purpose**: Live production environment
- **URL**: `https://passkey-authentication-service.prod.cvent.org`
- **Instances**: 6 containers (across multiple AZs)
- **Resources**:
  - CPU: 2 vCPU per container
  - Memory: 4GB per container
- **Database**: Production Oracle RDS with Multi-AZ
- **Monitoring**: Comprehensive monitoring with PagerDuty integration
- **Deployment**: Manual promotion with approval process

## CI/CD Pipeline

### Jenkins Pipeline

The service uses Jenkins for continuous integration and deployment:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package -Prelease'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'mvn test'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'mvn verify -Prun-it -Denv.IT_ENVIRONMENT=dev'
                    }
                }
            }
        }
        
        stage('Code Quality') {
            steps {
                sh 'mvn sonar:sonar'
            }
        }
        
        stage('Docker Build') {
            steps {
                sh 'docker build -t passkey-authentication:${BUILD_NUMBER} .'
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                sh './deploy.sh dev ${BUILD_NUMBER}'
            }
        }
    }
}
```

### Build Artifacts

- **JAR File**: `passkey-authentication-service-{version}.jar`
- **Docker Image**: `docker.cvent.net/passkey-authentication:{version}`
- **Configuration**: Environment-specific configuration files
- **Health Check**: Built-in health check endpoints

### Deployment Scripts

#### build-it.sh
```bash
#!/bin/bash
# Local development build script
mvn clean package -Prelease
docker build -t passkey-authentication:local .
```

#### build-release.sh
```bash
#!/bin/bash
# Release build script for CI/CD
VERSION=${1:-latest}
mvn clean package -Prelease
docker build -t docker.cvent.net/passkey-authentication:${VERSION} .
docker push docker.cvent.net/passkey-authentication:${VERSION}
```

#### dropkick.sh
```bash
#!/bin/bash
# Deployment script using Cvent's deployment tools
ENVIRONMENT=${1:-dev}
VERSION=${2:-latest}

echo "Deploying passkey-authentication:${VERSION} to ${ENVIRONMENT}"
cvent-deploy --service=passkey-authentication \
             --environment=${ENVIRONMENT} \
             --version=${VERSION} \
             --config-template=hogan-templates
```

## Configuration Management

### Hogan Templates

Configuration is managed through Cvent's Hogan templating system:

```yaml
# hogan-templates/passkey-authentication-service/configs/base.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: oracle.jdbc.OracleDriver
  url: "{{database.url}}"
  user: "{{database.username}}"
  password: "{{database.password}}"
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: "{{database.minSize}}"
  maxSize: "{{database.maxSize}}"

jwt:
  secret: "{{jwt.secret}}"
  fallbackSecret: "{{jwt.fallbackSecret}}"
  tokenExpiration: "{{jwt.tokenExpiration}}"

authService:
  url: "{{authService.url}}"
  timeout: "{{authService.timeout}}"

logging:
  level: "{{logging.level}}"
```

### Environment-Specific Values

#### dev.properties
```properties
database.url=jdbc:oracle:thin:@dev-db.cvent.net:1521:PASSKEY
database.username=passkey_dev
database.minSize=8
database.maxSize=32
jwt.tokenExpiration=PT24H
authService.url=https://auth-service.dev.cvent.org
logging.level=DEBUG
```

#### prod.properties
```properties
database.url=jdbc:oracle:thin:@prod-db.cvent.net:1521:PASSKEY
database.username=passkey_prod
database.minSize=16
database.maxSize=64
jwt.tokenExpiration=PT8H
authService.url=https://auth-service.prod.cvent.org
logging.level=WARN
```

## Container Configuration

### Dockerfile
```dockerfile
FROM docker.cvent.net/maven as builder

ENV PACKAGE "passkey-authentication"
WORKDIR /usr/src/app

# Copy POM files for dependency resolution
COPY pom.xml .
COPY "${PACKAGE}-api/pom.xml" "${PACKAGE}-api/"
COPY "${PACKAGE}-service/pom.xml" "${PACKAGE}-service/"

# Download dependencies
RUN mvn clean package --fail-never

# Copy source and build
COPY . .
RUN mvn clean package -Prelease

# Runtime image
FROM openjdk:8-jre-alpine

ENV SERVICE "passkey-authentication-service"
WORKDIR /usr/src

# Copy artifacts
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./service.jar
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/healthcheck || exit 1

# Run service
CMD ["java", "-jar", "-Dlogback.configurationFile=configs/dev.logback.xml", \
     "service.jar", "server", "configs/dev.yaml"]
```

### Resource Limits

```yaml
# Kubernetes deployment configuration
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

## Monitoring & Alerting

### Health Checks

The service provides multiple health check endpoints:

- **Application Health**: `GET /healthcheck`
- **Database Health**: `GET /healthcheck/database`
- **Dependencies Health**: `GET /healthcheck/dependencies`

### Metrics Collection

- **Datadog Integration**: Automatic metrics collection and dashboards
- **Custom Metrics**: Authentication rates, error rates, response times
- **JVM Metrics**: Memory usage, garbage collection, thread pools

### Alerting Rules

#### Critical Alerts (PagerDuty)
- Service down (no healthy instances)
- Database connection failures
- High error rate (>5% for 5 minutes)
- Response time degradation (>2s p95 for 10 minutes)

#### Warning Alerts (Slack)
- Memory usage >80%
- CPU usage >70%
- Database connection pool exhaustion
- JWT validation failures

### Log Aggregation

- **Centralized Logging**: All logs sent to Cvent's ELK stack
- **Structured Logging**: JSON format for easy parsing
- **Log Retention**: 30 days for application logs, 1 year for audit logs

## Rollback Procedures

### Automatic Rollback

The deployment system includes automatic rollback triggers:

1. **Health Check Failures**: If health checks fail for 5 minutes
2. **High Error Rate**: If error rate exceeds 10% for 3 minutes
3. **Memory Leaks**: If memory usage increases continuously

### Manual Rollback

```bash
# Rollback to previous version
./dropkick.sh prod rollback

# Rollback to specific version
./dropkick.sh prod deploy --version=1.2.0
```

### Rollback Verification

1. **Health Checks**: Verify all health checks pass
2. **Smoke Tests**: Run basic functionality tests
3. **Monitoring**: Check metrics and error rates
4. **User Impact**: Verify no user-facing issues

## Database Migration

### Migration Strategy

Database changes are managed through Flyway migrations:

```sql
-- V1.2.1__Add_session_metadata.sql
ALTER TABLE SESSIONS ADD (
    METADATA CLOB,
    DEVICE_TYPE VARCHAR2(50),
    LOCATION VARCHAR2(100)
);

CREATE INDEX IDX_SESSIONS_DEVICE_TYPE ON SESSIONS(DEVICE_TYPE);
```

### Migration Deployment

1. **Pre-deployment**: Run migrations in maintenance window
2. **Validation**: Verify schema changes are successful
3. **Application Deployment**: Deploy new application version
4. **Post-deployment**: Verify application functionality

## Disaster Recovery

### Backup Strategy

- **Database Backups**: Automated daily backups with 30-day retention
- **Configuration Backups**: Version-controlled configuration files
- **Container Images**: Immutable container images stored in registry

### Recovery Procedures

1. **Service Recovery**: Redeploy from last known good version
2. **Database Recovery**: Restore from most recent backup
3. **Configuration Recovery**: Restore from version control
4. **Validation**: Run full test suite to verify functionality

### RTO/RPO Targets

- **Recovery Time Objective (RTO)**: 30 minutes
- **Recovery Point Objective (RPO)**: 1 hour
- **Data Loss Tolerance**: Maximum 1 hour of data loss acceptable