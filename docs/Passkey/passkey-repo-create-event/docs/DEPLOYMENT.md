# Deployment

## Infrastructure

### Container Platform
- **Containerization**: Docker-based deployment
- **Orchestration**: Kubernetes (Cvent's internal platform)
- **Base Image**: OpenJDK 8 JRE Alpine Linux
- **Runtime**: Java 17 (despite base image, runtime is upgraded)
- **Service Mesh**: Istio for service-to-service communication

### Cloud Provider
- **Platform**: AWS (Amazon Web Services)
- **Regions**: Multi-region deployment for high availability
- **Compute**: EKS (Elastic Kubernetes Service)
- **Networking**: VPC with private subnets
- **Load Balancing**: Application Load Balancer (ALB)

### Service Discovery
- **Registry**: Cvent Service Registry
- **Service ID**: `1a85aeff-f470-4742-bcdf-bace6a5f1eca`
- **DNS**: Internal DNS resolution via Kubernetes services
- **Health Checks**: Kubernetes liveness and readiness probes

## Environments

### Development (dev/alpha)
- **Purpose**: Development and feature testing
- **URL**: `https://passkey-create-event-service.dev.cvent.org`
- **Deployment**: Automatic on `development` branch
- **Resources**: 
  - CPU: 0.5 cores
  - Memory: 1GB
  - Replicas: 1
- **Data**: Synthetic test data
- **Monitoring**: Basic monitoring and logging

### Testing/Staging (ts50/sg50/it50)
- **Purpose**: Integration testing and pre-production validation
- **URL**: `https://passkey-create-event-service.ts50.cvent.org`
- **Deployment**: Automatic on `master` branch
- **Resources**:
  - CPU: 1 core
  - Memory: 2GB
  - Replicas: 2
- **Data**: Production-like test data
- **Monitoring**: Full monitoring suite enabled

### Production (pr50)
- **Purpose**: Live production environment
- **URL**: `https://passkey-create-event-service.prod.cvent.org`
- **Deployment**: Manual promotion from staging
- **Resources**:
  - CPU: 2 cores
  - Memory: 4GB
  - Replicas: 3 (minimum)
  - Auto-scaling: Up to 10 replicas based on load
- **Data**: Live production data
- **Monitoring**: Comprehensive monitoring, alerting, and SLA tracking

## CI/CD Pipeline

### Pipeline Overview
The service uses Cvent's standardized Dropwizard pipeline implemented in Jenkins:

```groovy
dropwizardPipeline([
  changesets: true,
  release: [
    branch: 'master'
  ],
  checkmarx: [
    branch: 'master|development',
    syncMode: false,
    teamValue: '56fff0f3-468b-4984-8211-65e516926eaa',
    presetValue: '100011'
  ],
  slack: [
    [ branch: 'development|master', channel: 'passkey-api', events: ['START', 'SUCCESS', 'FAILURE'] ]
  ],
  snapshot: [
    sonar: true
  ],
  builds: [
    [ branch: 'development', environments: 'alpha'],
    [ branch: 'master', environments: ['ts50', 'sg50', 'it50']]
  ],
  scheduledTests: [
    [branch: 'master',
     slack: [ channel: 'passkey-api-pvt-results', events: ['SUCCESS', 'FAILURE']],
     triggers: [
       [ environment: 'pr50', cron: '0 3 * * *', tags: '@pvt_karate' ]
     ]
    ]
  ]
])
```

### Pipeline Stages

#### 1. Source Code Management
- **Repository**: GitHub (cvent-internal/passkey-create-event)
- **Branching Strategy**: GitFlow
  - `master`: Production-ready code
  - `development`: Integration branch for features
  - `feature/*`: Feature development branches
  - `hotfix/*`: Production hotfixes

#### 2. Build Stage
```dockerfile
# Multi-stage Docker build
FROM docker.cvent.net/maven as builder

ENV PACKAGE "passkey-create-event"
WORKDIR /usr/src/app

# Copy POM files for dependency resolution
COPY pom.xml .
COPY "${PACKAGE}-api/pom.xml" "${PACKAGE}-api/"
COPY "${PACKAGE}-service/pom.xml" "${PACKAGE}-service/"

# Build application
RUN mvn clean package \
  --projects ":${PACKAGE}-service" \
  --also-make \
  --activate-profiles release \
  --define maven.source.skip \
  --define maven.javadoc.skip

# Runtime stage
FROM openjdk:8-jre-alpine
ENV SERVICE "passkey-create-event-service"
WORKDIR /usr/src

COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./service.jar
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" .

CMD ["java", "-jar", "-Dlogback.configurationFile=configs/dev.logback.xml", "service.jar", "server", "configs/dev.yaml"]
```

#### 3. Testing Stages
- **Unit Tests**: Maven Surefire plugin
- **Integration Tests**: Karate framework
- **Code Coverage**: JaCoCo with minimum 80% coverage requirement
- **Static Analysis**: SonarQube integration
- **Security Scanning**: Checkmarx SAST scanning

#### 4. Quality Gates
- **Code Coverage**: Minimum 80% line coverage
- **Security**: No high-severity security vulnerabilities
- **Code Quality**: SonarQube quality gate must pass
- **Dependencies**: No known vulnerable dependencies

#### 5. Deployment Stages
- **Development**: Automatic deployment on `development` branch
- **Staging**: Automatic deployment on `master` branch
- **Production**: Manual approval required

### Deployment Automation

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-create-event-service
  namespace: passkey
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-create-event-service
  template:
    metadata:
      labels:
        app: passkey-create-event-service
    spec:
      containers:
      - name: service
        image: docker.cvent.net/passkey-create-event-service:latest
        ports:
        - containerPort: 8080
        - containerPort: 8081
        env:
        - name: ENVIRONMENT
          value: "prod"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /healthcheck
            port: 8081
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /healthcheck
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
```

## Configuration Management

### Environment-Specific Configuration

#### Development Configuration
```yaml
# dev.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

logging:
  level: DEBUG
  
externalServices:
  businessTextService:
    baseUrl: "https://passkey-business-text-service.dev.cvent.org"
  eventService:
    baseUrl: "https://passkey-event-service.dev.cvent.org"
```

#### Production Configuration
```yaml
# prod.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

logging:
  level: INFO
  
externalServices:
  businessTextService:
    baseUrl: "https://passkey-business-text-service.prod.cvent.org"
  eventService:
    baseUrl: "https://passkey-event-service.prod.cvent.org"
```

### Configuration Injection

#### Kubernetes ConfigMaps
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: passkey-create-event-config
  namespace: passkey
data:
  application.yaml: |
    # Environment-specific configuration
    environment: prod
    
    # External service URLs
    services:
      businessText: "https://passkey-business-text-service.prod.cvent.org"
      eventService: "https://passkey-event-service.prod.cvent.org"
```

#### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: passkey-create-event-secrets
  namespace: passkey
type: Opaque
data:
  api-key: <base64-encoded-api-key>
  database-password: <base64-encoded-password>
```

## Monitoring & Alerting

### Health Checks

#### Kubernetes Probes
- **Liveness Probe**: `/healthcheck` endpoint on admin port (8081)
- **Readiness Probe**: `/healthcheck` endpoint with dependency checks
- **Startup Probe**: Initial health check with extended timeout

#### Custom Health Checks
```java
public class ExternalServiceHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check connectivity to dependent services
        boolean businessTextHealthy = checkBusinessTextService();
        boolean eventServiceHealthy = checkEventService();
        
        if (businessTextHealthy && eventServiceHealthy) {
            return Result.healthy("All external services are healthy");
        } else {
            return Result.unhealthy("One or more external services are unhealthy");
        }
    }
}
```

### Metrics & Monitoring

#### Datadog Integration
- **APM**: Application performance monitoring
- **Infrastructure**: Container and host metrics
- **Custom Metrics**: Business-specific metrics
- **Dashboards**: Service-specific monitoring dashboards

#### Key Metrics
- **Request Rate**: Requests per second by endpoint
- **Response Time**: P50, P95, P99 latencies
- **Error Rate**: 4xx and 5xx error percentages
- **Throughput**: Events created/cancelled per minute
- **External Service Latency**: Response times for dependent services

#### Alerting Rules
```yaml
# Example Datadog monitor
- name: "High Error Rate"
  type: "metric alert"
  query: "avg(last_5m):avg:passkey.create.event.errors{*} > 5"
  message: "Error rate is above 5% for passkey-create-event-service"
  tags:
    - "service:passkey-create-event"
    - "team:cherry-pickers"

- name: "High Response Time"
  type: "metric alert"
  query: "avg(last_10m):avg:passkey.create.event.response_time{*} > 2000"
  message: "Response time is above 2 seconds"
```

### Log Management

#### Centralized Logging
- **Platform**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Log Shipping**: Fluentd agents on Kubernetes nodes
- **Log Format**: Structured JSON logging
- **Retention**: 30 days for application logs, 90 days for audit logs

#### Log Correlation
- **Correlation IDs**: Request tracing across services
- **User Context**: User identification in logs
- **Service Context**: Service name, version, environment

## Rollback Procedures

### Automated Rollback
- **Health Check Failures**: Automatic rollback if health checks fail
- **Error Rate Threshold**: Rollback if error rate exceeds 10%
- **Performance Degradation**: Rollback if response time increases by 200%

### Manual Rollback Process

#### 1. Identify Issue
```bash
# Check service health
kubectl get pods -n passkey -l app=passkey-create-event-service

# Check logs for errors
kubectl logs -n passkey -l app=passkey-create-event-service --tail=100
```

#### 2. Rollback Deployment
```bash
# Rollback to previous version
kubectl rollout undo deployment/passkey-create-event-service -n passkey

# Check rollback status
kubectl rollout status deployment/passkey-create-event-service -n passkey
```

#### 3. Verify Rollback
```bash
# Verify pods are running
kubectl get pods -n passkey -l app=passkey-create-event-service

# Check health endpoint
curl -f http://passkey-create-event-service.passkey.svc.cluster.local:8081/healthcheck
```

#### 4. Communication
- Notify stakeholders via Slack (`#passkey-api`)
- Update incident tracking system
- Document rollback reason and resolution

### Rollback Validation

#### Post-Rollback Checks
1. **Service Health**: All health checks passing
2. **Functionality**: Core API endpoints responding correctly
3. **Dependencies**: External service connectivity restored
4. **Metrics**: Error rates and response times normalized
5. **Integration**: Downstream services functioning properly

#### Rollback Testing
```bash
# Test core functionality
curl -X POST https://passkey-create-event-service.prod.cvent.org/passkey-create-event/v1 \
  -H "Authorization: Bearer test-api-key" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "Test Event", "startDate": "2024-06-15T09:00:00Z"}'

# Verify response
# Expected: 202 Accepted with Location header
```

## Disaster Recovery

### Backup Strategy
- **Configuration**: Stored in version control (Git)
- **Application State**: Stateless service, no local data backup needed
- **Dependencies**: External services handle their own backup/recovery

### Recovery Procedures

#### Service Recovery
1. **Redeploy Service**: Use CI/CD pipeline to redeploy last known good version
2. **Scale Up**: Increase replica count if needed for capacity
3. **Verify Dependencies**: Ensure all external services are accessible
4. **Run Health Checks**: Validate service functionality

#### Multi-Region Failover
- **Traffic Routing**: DNS-based failover to alternate regions
- **Data Consistency**: Ensure external services are synchronized
- **Monitoring**: Enhanced monitoring during failover period

### Business Continuity
- **RTO (Recovery Time Objective)**: 15 minutes
- **RPO (Recovery Point Objective)**: Near-zero (stateless service)
- **Communication Plan**: Automated notifications to stakeholders
- **Escalation Procedures**: Clear escalation path for extended outages