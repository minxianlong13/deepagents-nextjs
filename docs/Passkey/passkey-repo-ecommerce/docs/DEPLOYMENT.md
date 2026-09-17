# Deployment

## Infrastructure

The Passkey Ecommerce Service is deployed on Cvent's internal infrastructure using containerized deployment with Docker and orchestrated through Jenkins CI/CD pipelines.

### Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Load          │    │   Application    │    │   Database      │
│   Balancer      │───▶│   Servers        │───▶│   (Oracle)      │
│   (HAProxy)     │    │   (Docker)       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Container Platform
- **Container Runtime**: Docker
- **Base Image**: OpenJDK 8 Alpine Linux
- **Registry**: docker.cvent.net
- **Orchestration**: Custom deployment scripts

## Environments

### Development (dev)
- **URL**: `https://passkey-ecommerce-service-dev.core.cvent.org`
- **Purpose**: Development and feature testing
- **Database**: Oracle development instance
- **Monitoring**: Basic health checks
- **Deployment**: Automatic on merge to develop branch

**Configuration**:
```yaml
environment: dev
server:
  port: 8080
database:
  url: jdbc:oracle:thin:@dev-oracle.cvent.net:1521:DEVDB
logging:
  level: DEBUG
```

### Staging (staging)
- **URL**: `https://passkey-ecommerce-service-staging.core.cvent.org`
- **Purpose**: Pre-production testing and validation
- **Database**: Oracle staging instance (production-like data)
- **Monitoring**: Full monitoring with Datadog
- **Deployment**: Manual promotion from development

**Configuration**:
```yaml
environment: staging
server:
  port: 8080
database:
  url: jdbc:oracle:thin:@staging-oracle.cvent.net:1521:STAGINGDB
logging:
  level: INFO
monitoring:
  datadog:
    enabled: true
```

### Production (prod)
- **URL**: `https://passkey-ecommerce-service.core.cvent.org`
- **Purpose**: Live production traffic
- **Database**: Oracle production cluster
- **Monitoring**: Comprehensive monitoring and alerting
- **Deployment**: Manual promotion with approval process

**Configuration**:
```yaml
environment: prod
server:
  port: 8080
database:
  url: jdbc:oracle:thin:@prod-oracle-cluster.cvent.net:1521:PRODDB
logging:
  level: WARN
monitoring:
  datadog:
    enabled: true
    alerting: true
```

## CI/CD Pipeline

### Jenkins Pipeline
The service uses a Jenkins-based CI/CD pipeline defined in `Jenkinsfile`:

#### Build Stage
```groovy
stage('Build') {
    steps {
        sh 'mvn clean package -Prelease'
        archiveArtifacts artifacts: '**/target/*.jar'
    }
}
```

#### Test Stage
```groovy
stage('Test') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'mvn test'
                publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
            }
        }
        stage('Integration Tests') {
            steps {
                sh 'mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify'
            }
        }
    }
}
```

#### Quality Gate
```groovy
stage('Quality Gate') {
    steps {
        sh 'mvn sonar:sonar'
        waitForQualityGate abortPipeline: true
    }
}
```

#### Docker Build
```groovy
stage('Docker Build') {
    steps {
        script {
            def image = docker.build("passkey-ecommerce:${env.BUILD_NUMBER}")
            docker.withRegistry('https://docker.cvent.net', 'docker-registry-credentials') {
                image.push()
                image.push('latest')
            }
        }
    }
}
```

### Deployment Process

#### Development Deployment
1. **Trigger**: Automatic on merge to `develop` branch
2. **Process**: 
   - Build and test
   - Create Docker image
   - Deploy to development environment
   - Run smoke tests
3. **Rollback**: Automatic on health check failure

#### Staging Deployment
1. **Trigger**: Manual promotion from development
2. **Process**:
   - Promote Docker image from dev
   - Deploy to staging environment
   - Run full integration test suite
   - Performance testing
3. **Approval**: QA team approval required

#### Production Deployment
1. **Trigger**: Manual promotion with approvals
2. **Process**:
   - Change management approval
   - Blue-green deployment strategy
   - Gradual traffic shifting
   - Monitoring and validation
3. **Rollback**: Immediate rollback capability

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through environment-specific YAML files and environment variables:

```
passkey-ecommerce-service/configs/
├── dev.yaml
├── staging.yaml
├── prod.yaml
├── dev.logback.xml
├── staging.logback.xml
└── prod.logback.xml
```

### Secret Management
Sensitive configuration is managed through environment variables:

```bash
# Database credentials
DATABASE_USERNAME=ecommerce_user
DATABASE_PASSWORD=${VAULT_DATABASE_PASSWORD}

# API keys
LOCAL_API_KEY=${VAULT_API_KEY}
LOCAL_ECOMMERCE_API_KEY=${VAULT_ECOMMERCE_API_KEY}

# Monitoring
DATADOG_API_KEY=${VAULT_DATADOG_API_KEY}
```

### Configuration Validation
```yaml
# Configuration validation rules
validation:
  database:
    required: [url, username, password]
    timeout: [1s, 30s]
  server:
    port: [8080, 8090]
  logging:
    level: [DEBUG, INFO, WARN, ERROR]
```

## Monitoring & Alerting

### Health Checks
```yaml
# Health check endpoints
healthChecks:
  - name: database
    url: /admin/health/database
    interval: 30s
    timeout: 5s
  - name: external-services
    url: /admin/health/external
    interval: 60s
    timeout: 10s
```

### Datadog Monitoring
```yaml
datadog:
  metrics:
    - request.count
    - request.duration
    - database.connections
    - jvm.memory.used
  alerts:
    - name: High Error Rate
      condition: error_rate > 5%
      notification: "#passkey-alerts"
    - name: High Response Time
      condition: avg_response_time > 2s
      notification: "#passkey-alerts"
```

### Log Aggregation
```yaml
logging:
  appenders:
    - type: datadog
      apiKey: ${DATADOG_API_KEY}
      tags:
        - service:passkey-ecommerce
        - environment:${ENVIRONMENT}
```

## Rollback Procedures

### Automatic Rollback
Automatic rollback is triggered by:
- Health check failures
- High error rates (>10% for 5 minutes)
- Memory leaks or resource exhaustion
- Database connectivity issues

### Manual Rollback Process
1. **Identify Issue**: Confirm need for rollback
2. **Stop Traffic**: Redirect traffic away from affected instances
3. **Rollback Deployment**: 
   ```bash
   # Rollback to previous version
   kubectl set image deployment/passkey-ecommerce \
     passkey-ecommerce=docker.cvent.net/passkey-ecommerce:${PREVIOUS_VERSION}
   ```
4. **Verify Rollback**: Confirm service health
5. **Resume Traffic**: Gradually restore traffic
6. **Post-Mortem**: Document incident and lessons learned

### Blue-Green Deployment
```yaml
# Blue-Green deployment configuration
deployment:
  strategy: blue-green
  healthCheck:
    path: /admin/health
    timeout: 30s
    retries: 3
  trafficShift:
    initial: 10%
    increment: 25%
    interval: 5m
```

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Daily automated backups with 30-day retention
- **Configuration Backups**: Version controlled in Git
- **Application Artifacts**: Stored in artifact repository

### Recovery Procedures
1. **Service Failure**: Automatic failover to healthy instances
2. **Database Failure**: Failover to standby database
3. **Data Center Failure**: Cross-region failover (RTO: 4 hours, RPO: 1 hour)

### Business Continuity
- **Graceful Degradation**: Service continues with reduced functionality
- **Circuit Breakers**: Prevent cascade failures
- **Fallback Mechanisms**: Alternative payment processing paths

## Security Considerations

### Network Security
- **VPC Isolation**: Service runs in isolated VPC
- **Security Groups**: Restrictive firewall rules
- **TLS Termination**: Load balancer handles TLS termination

### Container Security
- **Base Image Scanning**: Regular vulnerability scanning
- **Runtime Security**: Container runtime monitoring
- **Secrets Management**: No secrets in container images

### Compliance
- **PCI DSS**: Payment card industry compliance
- **SOC 2**: Service organization control compliance
- **Audit Logging**: Comprehensive audit trail