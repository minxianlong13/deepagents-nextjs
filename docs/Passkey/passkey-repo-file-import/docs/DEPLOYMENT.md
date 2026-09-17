# Deployment

## Infrastructure

### Container Platform
- **Platform**: Docker containers on Cvent's internal container orchestration
- **Base Image**: `docker.cvent.net/cvent-jre:11.0.4.11`
- **Build Image**: `docker.cvent.net/maven:cvent-maven`
- **Registry**: Cvent internal Docker registry

### Container Configuration
```dockerfile
FROM docker.cvent.net/maven:cvent-maven as builder
WORKDIR /usr/src/app
COPY . .
RUN mvn clean package -Prelease

FROM docker.cvent.net/cvent-jre:11.0.4.11
ENV SERVICE "passkey-file-import-service"
WORKDIR /usr/src
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" ./
CMD [ "java", "-jar", "passkey-file-import-service-1.0.0-SNAPSHOT.jar", "server", "configs/dev.yaml" ]
```

### Resource Requirements
- **CPU**: 1-2 vCPU per instance
- **Memory**: 1-2 GB RAM per instance
- **Storage**: Minimal (stateless service)
- **Network**: HTTP/HTTPS traffic on ports 8080/8081

## Environments

### Development (dev)
- **Purpose**: Development and feature testing
- **URL**: `https://dev.cvent.com/dev/passkey-file-import`
- **Configuration**: `configs/dev.yaml`
- **Features**:
  - OpenAPI documentation available
  - Debug logging enabled
  - Relaxed security for testing
  - Integration with dev environment services

### Alpha (alpha)
- **Purpose**: Integration testing and QA validation
- **URL**: `https://alpha.cvent.com/alpha/passkey-file-import`
- **Configuration**: `configs/alpha.yaml`
- **Features**:
  - Production-like configuration
  - Full integration testing
  - Performance monitoring
  - Automated testing pipelines

### Test/Staging (ts50)
- **Purpose**: Pre-production validation and customer testing
- **URL**: `https://ts50.cvent.com/ts50/passkey-file-import`
- **Configuration**: `configs/ts50.yaml`
- **Features**:
  - Production configuration
  - Customer acceptance testing
  - Load testing validation
  - Final deployment verification

### Production (pr50)
- **Purpose**: Live production environment
- **URL**: `https://pr50.cvent.com/pr50/passkey-file-import`
- **Configuration**: `configs/pr50.yaml`
- **Features**:
  - High availability deployment
  - Full monitoring and alerting
  - Performance optimization
  - Security hardening

## CI/CD Pipeline

### Jenkins Pipeline
- **Location**: https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-file-import
- **Trigger**: Git push to master branch
- **Stages**: Build → Test → Security Scan → Deploy

### Pipeline Stages

#### 1. Build Stage
```groovy
stage('Build') {
    steps {
        sh 'mvn clean compile'
    }
}
```

#### 2. Test Stage
```groovy
stage('Test') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'mvn test'
            }
        }
        stage('Integration Tests') {
            steps {
                sh 'mvn -Prun-it verify'
            }
        }
    }
}
```

#### 3. Security Scan
```groovy
stage('Security') {
    steps {
        // WhiteSource security scanning
        sh 'mvn whitesource:update'
    }
}
```

#### 4. Package Stage
```groovy
stage('Package') {
    steps {
        sh 'mvn package -Prelease'
        sh 'docker build -t passkey-file-import:${BUILD_NUMBER} .'
    }
}
```

#### 5. Deploy Stage
```groovy
stage('Deploy') {
    when {
        branch 'master'
    }
    steps {
        script {
            deployToEnvironment('dev')
            if (env.BRANCH_NAME == 'master') {
                deployToEnvironment('alpha')
            }
        }
    }
}
```

### Deployment Scripts
- **Build Script**: `build-it.sh` - Builds and packages the service
- **Load Test Script**: `build-load.sh` - Executes load tests
- **Swagger Script**: `swagger.sh` - Serves API documentation locally

## Configuration Management

### Environment-Specific Configurations

#### Development Configuration (`configs/dev.yaml`)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080

logging:
  level: DEBUG
  
clients:
  reservationService:
    baseUrl: "https://dev-passkey-reservation.cvent.com"
  resdeskService:
    baseUrl: "https://dev-resdesk.cvent.com"
```

#### Production Configuration (`configs/pr50.yaml`)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  requestLog:
    appenders:
      - type: file
        currentLogFilename: /var/log/passkey-file-import/requests.log

logging:
  level: INFO
  appenders:
    - type: file
      currentLogFilename: /var/log/passkey-file-import/application.log

clients:
  reservationService:
    baseUrl: "https://passkey-reservation.cvent.com"
    timeout: 30s
  resdeskService:
    baseUrl: "https://resdesk.cvent.com"
    timeout: 30s
```

### Configuration Templates (Hogan)
- **Template Directory**: `passkey-file-import-service/configs`
- **Template Engine**: Hogan templates for environment-specific values
- **Variables**: Database connections, service URLs, API keys
- **Annotation**: `hogan-templates/directory: passkey-file-import-service/configs`

### Secret Management
- **API Keys**: Managed through Cvent's secret management system
- **Service Credentials**: Injected at runtime via environment variables
- **Database Passwords**: Not applicable (stateless service)
- **Certificates**: Managed by platform infrastructure

## Health Checks & Monitoring

### Health Check Endpoints
```yaml
# Health check configuration
healthChecks:
  - name: "reservation-service"
    type: "http"
    url: "${reservationService.baseUrl}/health"
  - name: "resdesk-service"
    type: "http"
    url: "${resdeskService.baseUrl}/health"
```

### Monitoring Integration

#### Datadog Monitoring
- **Service Name**: passkey-file-import-service
- **Metrics Collection**: Automatic via Datadog agent
- **Custom Metrics**: Business metrics for import success rates
- **Alerting**: Configured for error rates and response times

#### Application Metrics
```java
// Custom metrics examples
@Timed(name = "import.processing.time")
@Metered(name = "import.requests.rate")
@ExceptionMetered(name = "import.errors.rate")
```

### Alerting Rules
- **High Error Rate**: > 5% error rate for 5 minutes
- **High Latency**: > 2 second response time for 5 minutes
- **Service Down**: Health check failures for 2 minutes
- **Memory Usage**: > 80% memory utilization

## Rollback Procedures

### Automated Rollback
```bash
# Jenkins rollback job
jenkins-cli build rollback-passkey-file-import \
  -p ENVIRONMENT=pr50 \
  -p VERSION=previous
```

### Manual Rollback Steps

#### 1. Identify Previous Version
```bash
# Check deployment history
kubectl get deployments passkey-file-import -o yaml | grep image:
```

#### 2. Rollback Deployment
```bash
# Rollback to previous version
kubectl rollout undo deployment/passkey-file-import
```

#### 3. Verify Rollback
```bash
# Check rollback status
kubectl rollout status deployment/passkey-file-import

# Verify health checks
curl https://pr50.cvent.com/pr50/passkey-file-import/healthcheck
```

#### 4. Update Configuration
```bash
# Revert configuration changes if needed
git revert <commit-hash>
```

### Rollback Validation
- **Health Checks**: Verify all health checks pass
- **Integration Tests**: Run smoke tests against rolled-back version
- **Monitoring**: Confirm metrics return to normal levels
- **Functionality**: Test critical import workflows

## Disaster Recovery

### Backup Strategy
- **Code Repository**: Git repository with full history
- **Configuration**: Version controlled in Git
- **No Data Backup**: Stateless service with no persistent data

### Recovery Procedures

#### Service Recovery
1. **Redeploy Service**: Use CI/CD pipeline to redeploy from known good version
2. **Configuration Restore**: Apply configuration from version control
3. **Dependency Check**: Verify external service connectivity
4. **Validation**: Run integration tests to confirm functionality

#### Infrastructure Recovery
1. **Container Recreation**: Rebuild containers from Dockerfile
2. **Network Restoration**: Restore service mesh connectivity
3. **Load Balancer**: Update load balancer configuration
4. **DNS Updates**: Verify DNS resolution for service endpoints

### Recovery Time Objectives
- **RTO (Recovery Time Objective)**: 15 minutes
- **RPO (Recovery Point Objective)**: 0 (no data loss possible)
- **Service Availability**: 99.9% uptime target

## Security Considerations

### Deployment Security
- **Image Scanning**: Container images scanned for vulnerabilities
- **Secret Injection**: Secrets injected at runtime, not baked into images
- **Network Policies**: Restricted network access between services
- **HTTPS Only**: All external communication over HTTPS

### Runtime Security
- **Non-Root User**: Container runs as non-root user
- **Read-Only Filesystem**: Application filesystem mounted read-only
- **Resource Limits**: CPU and memory limits enforced
- **Security Context**: Minimal security context with dropped capabilities

### Compliance
- **SOC 2**: Compliant with SOC 2 Type II requirements
- **GDPR**: No personal data stored or processed
- **PCI DSS**: Not applicable (no payment data handling)
- **Audit Logging**: All operations logged for compliance auditing