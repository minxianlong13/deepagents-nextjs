# Deployment

## Infrastructure

### Container Platform
- **Base Image**: OpenJDK 8 Alpine Linux
- **Container Registry**: docker.cvent.net
- **Orchestration**: Kubernetes (assumed based on Cvent infrastructure)
- **Service Mesh**: Istio (typical for Cvent microservices)

### Cloud Provider
- **Primary**: Amazon Web Services (AWS)
- **Regions**: Multi-region deployment for high availability
- **Compute**: EKS (Elastic Kubernetes Service)
- **Storage**: EBS volumes for persistent data

### Database Infrastructure
- **Primary Database**: Oracle Database (on-premises or RDS)
- **NoSQL**: Amazon DynamoDB (for batch processing state)
- **Connection Pooling**: HikariCP via Dropwizard
- **Backup Strategy**: Automated daily backups with point-in-time recovery

## Environments

### Development (dev)
- **Purpose**: Active development and feature testing
- **URL**: `https://api.cvent.com/dev/passkey-gdpr`
- **Database**: Shared development Oracle instance
- **Resources**: 
  - CPU: 0.5 cores
  - Memory: 1GB
  - Replicas: 1
- **Features**: All feature flags enabled for testing
- **Data**: Synthetic test data only

### Alpha Testing (alpha)
- **Purpose**: Pre-production testing with limited real data
- **URL**: `https://api.cvent.com/alpha/passkey-gdpr`
- **Database**: Dedicated alpha Oracle instance
- **Resources**:
  - CPU: 1 core
  - Memory: 2GB
  - Replicas: 2
- **Features**: Production feature flag configuration
- **Data**: Subset of production data (anonymized)

### Test Environment (ts50)
- **Purpose**: Integration testing and QA validation
- **URL**: `https://api.cvent.com/ts50/passkey-gdpr`
- **Database**: Dedicated test Oracle instance
- **Resources**:
  - CPU: 1 core
  - Memory: 2GB
  - Replicas: 2
- **Features**: Mirror of production configuration
- **Data**: Full dataset copy (anonymized)

### Production (pr50)
- **Purpose**: Live production environment
- **URL**: `https://api.cvent.com/pr50/passkey-gdpr`
- **Database**: Production Oracle cluster
- **Resources**:
  - CPU: 2 cores
  - Memory: 4GB
  - Replicas: 3 (minimum)
- **Features**: Stable feature flag configuration
- **Data**: Live production data
- **SLA**: 99.9% uptime, <500ms response time

## CI/CD Pipeline

### Jenkins Pipeline Configuration

#### Pipeline Stages
```groovy
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'mvn test'
                    }
                    post {
                        always {
                            junit 'target/surefire-reports/*.xml'
                        }
                    }
                }
                
                stage('Code Quality') {
                    steps {
                        sh 'mvn sonar:sonar'
                    }
                }
            }
        }
        
        stage('Package') {
            steps {
                sh 'mvn package -Prelease'
            }
        }
        
        stage('Docker Build') {
            steps {
                sh 'docker build -t passkey-gdpr:${BUILD_NUMBER} .'
                sh 'docker tag passkey-gdpr:${BUILD_NUMBER} docker.cvent.net/passkey-gdpr:${BUILD_NUMBER}'
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image passkey-gdpr:${BUILD_NUMBER}'
            }
        }
        
        stage('Push Image') {
            steps {
                sh 'docker push docker.cvent.net/passkey-gdpr:${BUILD_NUMBER}'
            }
        }
        
        stage('Deploy to Dev') {
            steps {
                sh './deploy.sh dev ${BUILD_NUMBER}'
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify'
            }
        }
        
        stage('Deploy to Alpha') {
            when {
                branch 'master'
            }
            steps {
                sh './deploy.sh alpha ${BUILD_NUMBER}'
            }
        }
    }
    
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'Code Coverage Report'
            ])
        }
        
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### Deployment Scripts

#### Build Script (`build.sh`)
```bash
#!/bin/bash
set -e

echo "Building passkey-gdpr service..."

# Clean and build
mvn clean package -Prelease -DskipTests

# Build Docker image
docker build -t passkey-gdpr:latest .

echo "Build completed successfully"
```

#### Release Script (`build-release.sh`)
```bash
#!/bin/bash
set -e

VERSION=${1:-$(mvn help:evaluate -Dexpression=project.version -q -DforceStdout)}

echo "Building release version: $VERSION"

# Build with release profile
mvn clean package -Prelease

# Tag Docker image
docker build -t passkey-gdpr:$VERSION .
docker tag passkey-gdpr:$VERSION docker.cvent.net/passkey-gdpr:$VERSION
docker tag passkey-gdpr:$VERSION docker.cvent.net/passkey-gdpr:latest

# Push to registry
docker push docker.cvent.net/passkey-gdpr:$VERSION
docker push docker.cvent.net/passkey-gdpr:latest

echo "Release $VERSION built and pushed successfully"
```

### Deployment Configuration

#### Kubernetes Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-gdpr-service
  namespace: passkey
  labels:
    app: passkey-gdpr-service
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-gdpr-service
  template:
    metadata:
      labels:
        app: passkey-gdpr-service
        version: v1
    spec:
      containers:
      - name: passkey-gdpr-service
        image: docker.cvent.net/passkey-gdpr:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: admin
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: passkey-gdpr-secrets
              key: db-host
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: passkey-gdpr-secrets
              key: db-username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: passkey-gdpr-secrets
              key: db-password
        - name: LAUNCH_DARKLY_SDK_KEY
          valueFrom:
            secretKeyRef:
              name: passkey-gdpr-secrets
              key: launchdarkly-sdk-key
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
        volumeMounts:
        - name: config-volume
          mountPath: /usr/src/configs
      volumes:
      - name: config-volume
        configMap:
          name: passkey-gdpr-config
```

#### Service Configuration
```yaml
apiVersion: v1
kind: Service
metadata:
  name: passkey-gdpr-service
  namespace: passkey
spec:
  selector:
    app: passkey-gdpr-service
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: admin
    port: 8081
    targetPort: 8081
  type: ClusterIP
```

## Configuration Management

### Environment-Specific Configurations

#### ConfigMap for Production
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: passkey-gdpr-config
  namespace: passkey
data:
  production.yaml: |
    server:
      applicationConnectors:
        - type: http
          port: 8080
      adminConnectors:
        - type: http
          port: 8081
    
    database:
      driverClass: oracle.jdbc.OracleDriver
      url: jdbc:oracle:thin:@${DB_HOST}:1521:PROD
      user: ${DB_USERNAME}
      password: ${DB_PASSWORD}
      maxWaitForConnection: 1s
      validationQuery: SELECT 1 FROM DUAL
      minSize: 16
      maxSize: 64
    
    logging:
      level: INFO
      loggers:
        com.cvent.passkeygdpr: INFO
      appenders:
        - type: console
          threshold: INFO
          timeZone: UTC
        - type: file
          currentLogFilename: /var/log/passkey-gdpr/application.log
          archivedLogFilenamePattern: /var/log/passkey-gdpr/application-%d.log.gz
          archivedFileCount: 30
    
    gdprMaskService:
      url: https://gdpr-mask-service.cvent.com
      timeout: 30s
      retries: 3
    
    authService:
      url: https://auth-service.cvent.com
      timeout: 10s
```

### Secrets Management
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: passkey-gdpr-secrets
  namespace: passkey
type: Opaque
data:
  db-host: <base64-encoded-host>
  db-username: <base64-encoded-username>
  db-password: <base64-encoded-password>
  launchdarkly-sdk-key: <base64-encoded-sdk-key>
```

## Monitoring & Alerting

### Health Check Endpoints
- **Application Health**: `GET /healthcheck`
- **Database Health**: `GET /healthcheck/database`
- **External Services**: `GET /healthcheck/dependencies`

### Metrics Collection
- **Prometheus**: Metrics scraping from `/metrics` endpoint
- **Datadog**: APM integration for distributed tracing
- **Custom Metrics**: Business-specific GDPR processing metrics

### Alerting Rules
```yaml
# Example Prometheus alerting rules
groups:
- name: passkey-gdpr-alerts
  rules:
  - alert: PasskeyGdprServiceDown
    expr: up{job="passkey-gdpr-service"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Passkey GDPR Service is down"
      
  - alert: PasskeyGdprHighErrorRate
    expr: rate(http_requests_total{job="passkey-gdpr-service",status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High error rate in Passkey GDPR Service"
      
  - alert: PasskeyGdprHighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="passkey-gdpr-service"}[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High latency in Passkey GDPR Service"
```

## Rollback Procedures

### Automated Rollback
```bash
#!/bin/bash
# rollback.sh - Automated rollback script

ENVIRONMENT=$1
PREVIOUS_VERSION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$PREVIOUS_VERSION" ]; then
    echo "Usage: $0 <environment> <previous_version>"
    exit 1
fi

echo "Rolling back passkey-gdpr-service in $ENVIRONMENT to version $PREVIOUS_VERSION"

# Update deployment with previous image
kubectl set image deployment/passkey-gdpr-service \
    passkey-gdpr-service=docker.cvent.net/passkey-gdpr:$PREVIOUS_VERSION \
    -n passkey

# Wait for rollout to complete
kubectl rollout status deployment/passkey-gdpr-service -n passkey --timeout=300s

# Verify health
kubectl exec -n passkey deployment/passkey-gdpr-service -- \
    curl -f http://localhost:8081/healthcheck

echo "Rollback completed successfully"
```

### Manual Rollback Steps
1. **Identify Issue**: Confirm the need for rollback through monitoring
2. **Get Previous Version**: `kubectl rollout history deployment/passkey-gdpr-service -n passkey`
3. **Execute Rollback**: `kubectl rollout undo deployment/passkey-gdpr-service -n passkey`
4. **Verify Health**: Check health endpoints and monitoring dashboards
5. **Update Load Balancer**: Ensure traffic routing is correct
6. **Notify Stakeholders**: Communicate rollback completion

### Database Rollback Considerations
- **Schema Changes**: Coordinate with DBA for schema rollbacks
- **Data Migration**: Ensure data compatibility with previous version
- **Backup Restoration**: Use point-in-time recovery if necessary
- **Audit Trail**: Maintain audit logs during rollback process

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Daily full backups with hourly transaction log backups
- **Configuration Backups**: Version-controlled configuration files
- **Container Images**: Immutable images stored in multiple registries

### Recovery Procedures
1. **Service Recovery**: Redeploy from known good image
2. **Database Recovery**: Restore from backup with point-in-time recovery
3. **Configuration Recovery**: Apply configuration from version control
4. **Validation**: Run integration tests to verify functionality

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Data Loss Tolerance**: Maximum 1 hour of GDPR processing data