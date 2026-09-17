# Deployment

## Infrastructure

### Cloud Platform
The Passkey Transfer Log Service is deployed on **AWS** infrastructure within Cvent's private cloud environment.

### Architecture Components
- **Compute**: AWS EC2 instances or ECS containers
- **Load Balancing**: Application Load Balancer (ALB)
- **Database**: Oracle Database (RDS or self-managed)
- **Monitoring**: Datadog APM and logging
- **Service Discovery**: Cvent's internal service registry

### Network Configuration
- **VPC**: Deployed within Cvent's private VPC
- **Security Groups**: Restricted access to necessary ports only
- **Subnets**: Multi-AZ deployment for high availability

## Environments

### Development Environment
- **Purpose**: Local development and initial testing
- **URL**: `https://dev.passkey-transfer-log-service.cvent.com`
- **Database**: Development Oracle instance
- **Configuration**: `configs/dev.yaml`
- **Features**:
  - Debug logging enabled
  - Relaxed security for testing
  - Mock external service integrations
  - Frequent deployments from feature branches

### Staging Environment
- **Purpose**: Pre-production testing and validation
- **URL**: `https://staging.passkey-transfer-log-service.cvent.com`
- **Database**: Staging Oracle instance with production-like data
- **Configuration**: `configs/staging.yaml`
- **Features**:
  - Production-like configuration
  - Full integration testing
  - Performance testing
  - User acceptance testing

### Production Environment
- **Purpose**: Live production service
- **URL**: `https://prod.passkey-transfer-log-service.cvent.com`
- **Database**: Production Oracle cluster
- **Configuration**: `configs/prod.yaml`
- **Features**:
  - High availability setup
  - Auto-scaling enabled
  - Full monitoring and alerting
  - Disaster recovery capabilities

## CI/CD Pipeline

### Jenkins Pipeline
**Pipeline URL**: [Jenkins Job](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-transfer-log)

### Pipeline Stages

#### 1. Source Code Checkout
```groovy
stage('Checkout') {
    steps {
        checkout scm
        sh 'git clean -fdx'
    }
}
```

#### 2. Build and Test
```groovy
stage('Build') {
    steps {
        sh 'mvn clean package -Prelease'
        sh 'mvn jacoco:report -Pcoverage'
    }
    post {
        always {
            publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
            publishCoverage adapters: [jacocoAdapter('**/target/site/jacoco/jacoco.xml')]
        }
    }
}
```

#### 3. Integration Tests
```groovy
stage('Integration Tests') {
    steps {
        sh 'mvn -Prun-it -Dkarate.env=ci verify'
    }
    post {
        always {
            publishTestResults testResultsPattern: '**/target/karate-reports/*.xml'
        }
    }
}
```

#### 4. Security Scanning
```groovy
stage('Security Scan') {
    steps {
        sh 'mvn org.owasp:dependency-check-maven:check'
        publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'target/dependency-check-report',
            reportFiles: 'dependency-check-report.html',
            reportName: 'OWASP Dependency Check Report'
        ])
    }
}
```

#### 5. Docker Image Build
```groovy
stage('Docker Build') {
    steps {
        script {
            def image = docker.build("cvent/passkey-transfer-log-service:${env.BUILD_NUMBER}")
            docker.withRegistry('https://registry.cvent.com', 'docker-registry-credentials') {
                image.push()
                image.push('latest')
            }
        }
    }
}
```

#### 6. Deployment
```groovy
stage('Deploy') {
    when {
        branch 'master'
    }
    steps {
        script {
            // Deploy to staging first
            sh 'kubectl apply -f k8s/staging/ --namespace=passkey-staging'
            
            // Wait for health check
            sh 'kubectl wait --for=condition=ready pod -l app=passkey-transfer-log-service --timeout=300s --namespace=passkey-staging'
            
            // Run smoke tests
            sh 'mvn -Psmoke-test -Dkarate.env=staging verify'
            
            // Deploy to production after approval
            input message: 'Deploy to production?', ok: 'Deploy'
            sh 'kubectl apply -f k8s/production/ --namespace=passkey-production'
        }
    }
}
```

### Build Triggers
- **Automatic**: Triggered on push to `master` branch
- **Manual**: Can be triggered manually for any branch
- **Scheduled**: Nightly builds for dependency updates

## Configuration Management

### Environment-Specific Configuration

#### Development Configuration (`configs/dev.yaml`)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080

database:
  url: jdbc:oracle:thin:@//dev-oracle.cvent.com:1521/DEVDB
  user: ${DEV_DB_USER}
  password: ${DEV_DB_PASSWORD}
  maxSize: 10

logging:
  level: DEBUG
  
authService:
  baseUrl: https://dev-auth.cvent.com
```

#### Production Configuration (`configs/prod.yaml`)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  requestLog:
    appenders:
      - type: file
        currentLogFilename: /var/log/passkey-transfer-log/access.log

database:
  url: jdbc:oracle:thin:@//prod-oracle-cluster.cvent.com:1521/PRODDB
  user: ${PROD_DB_USER}
  password: ${PROD_DB_PASSWORD}
  maxSize: 50
  validationQuery: SELECT 1 FROM DUAL
  checkConnectionWhileIdle: true

logging:
  level: INFO
  appenders:
    - type: file
      currentLogFilename: /var/log/passkey-transfer-log/application.log
      archivedLogFilenamePattern: /var/log/passkey-transfer-log/application-%d.log.gz
      archivedFileCount: 30

authService:
  baseUrl: https://auth.cvent.com
  connectTimeout: 10s
  readTimeout: 30s

metrics:
  reporters:
    - type: datadog
      host: datadog-agent.cvent.com
      tags:
        - service:passkey-transfer-log-service
        - environment:production
```

### Secret Management
- **AWS Secrets Manager**: Database credentials and API keys
- **Kubernetes Secrets**: Service-to-service authentication tokens
- **Environment Variables**: Non-sensitive configuration overrides

### Configuration Validation
```java
@JsonProperty
@NotNull
@Valid
private DataSourceFactory database;

@JsonProperty
@NotNull
private String authServiceBaseUrl;
```

## Kubernetes Deployment

### Deployment Manifest (`k8s/production/deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-transfer-log-service
  namespace: passkey-production
  labels:
    app: passkey-transfer-log-service
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-transfer-log-service
  template:
    metadata:
      labels:
        app: passkey-transfer-log-service
        version: v1
    spec:
      containers:
      - name: passkey-transfer-log-service
        image: cvent/passkey-transfer-log-service:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: admin
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: password
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
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

### Service Manifest (`k8s/production/service.yaml`)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: passkey-transfer-log-service
  namespace: passkey-production
  labels:
    app: passkey-transfer-log-service
spec:
  selector:
    app: passkey-transfer-log-service
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: admin
    port: 8081
    targetPort: 8081
  type: ClusterIP
```

### Ingress Configuration (`k8s/production/ingress.yaml`)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: passkey-transfer-log-service
  namespace: passkey-production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - prod.passkey-transfer-log-service.cvent.com
    secretName: passkey-transfer-log-tls
  rules:
  - host: prod.passkey-transfer-log-service.cvent.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: passkey-transfer-log-service
            port:
              number: 80
```

## Monitoring and Alerting

### Health Checks
- **Application Health**: `/healthcheck` endpoint
- **Database Connectivity**: Automatic database connection validation
- **External Dependencies**: Auth service connectivity check

### Datadog Monitoring
- **APM Traces**: Request tracing and performance monitoring
- **Custom Metrics**: Business metrics and KPIs
- **Log Aggregation**: Centralized logging with structured format
- **Alerting**: Automated alerts for errors and performance issues

### Key Metrics
- **Request Rate**: Requests per second
- **Response Time**: P95, P99 response times
- **Error Rate**: 4xx and 5xx error percentages
- **Database Performance**: Query execution times
- **Transfer Success Rate**: Business-specific metrics

### Alerting Rules
```yaml
# Example Datadog alert configuration
- alert: HighErrorRate
  expr: error_rate > 0.05
  for: 5m
  labels:
    severity: critical
    service: passkey-transfer-log-service
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }}% for the last 5 minutes"

- alert: HighResponseTime
  expr: response_time_p95 > 2000
  for: 10m
  labels:
    severity: warning
    service: passkey-transfer-log-service
  annotations:
    summary: "High response time detected"
    description: "P95 response time is {{ $value }}ms"
```

## Rollback Procedures

### Automated Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/passkey-transfer-log-service --namespace=passkey-production

# Check rollback status
kubectl rollout status deployment/passkey-transfer-log-service --namespace=passkey-production
```

### Manual Rollback Steps
1. **Identify Issue**: Monitor alerts and logs to confirm rollback necessity
2. **Stop Traffic**: Temporarily route traffic away from affected instances
3. **Database Rollback**: If schema changes were made, execute rollback scripts
4. **Application Rollback**: Deploy previous known-good version
5. **Verification**: Run smoke tests to confirm service functionality
6. **Traffic Restoration**: Gradually restore traffic to rolled-back service

### Rollback Validation
```bash
# Health check
curl -f https://prod.passkey-transfer-log-service.cvent.com/healthcheck

# Smoke test
mvn -Psmoke-test -Dkarate.env=production verify
```

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated daily backups with point-in-time recovery
- **Configuration Backups**: Version-controlled configuration files
- **Application Artifacts**: Immutable Docker images stored in registry

### Recovery Procedures
1. **Service Outage**: Auto-scaling and health checks handle instance failures
2. **Database Failure**: Failover to standby database instance
3. **Region Failure**: Cross-region deployment with traffic routing
4. **Complete Disaster**: Restore from backups in alternate region

### Recovery Time Objectives (RTO)
- **Service Instance Failure**: < 5 minutes (auto-recovery)
- **Database Failover**: < 15 minutes
- **Region Failover**: < 30 minutes
- **Complete Disaster Recovery**: < 4 hours

### Recovery Point Objectives (RPO)
- **Database**: < 15 minutes (transaction log shipping)
- **Configuration**: 0 (version controlled)
- **Application State**: < 5 minutes (stateless service)