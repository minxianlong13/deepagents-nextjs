# Deployment

## Infrastructure

### Cloud Platform
- **Provider**: Amazon Web Services (AWS)
- **Orchestration**: Kubernetes (EKS)
- **Service Mesh**: Istio
- **Load Balancer**: AWS Application Load Balancer (ALB)
- **DNS**: Route 53

### Container Registry
- **Registry**: Docker Hub (docker.cvent.net)
- **Image Naming**: `docker.cvent.net/passkey-acknowledgment:${VERSION}`
- **Security Scanning**: Enabled for all images

## Environments

### Development Environment
- **Cluster**: `dev-passkey-cluster`
- **Namespace**: `passkey-dev`
- **Replicas**: 2
- **Resources**:
  - CPU: 500m request, 1000m limit
  - Memory: 1Gi request, 2Gi limit
- **Database**: Oracle Dev instance
- **URL**: `https://api-dev.cvent.com/passkey-acknowledgement`

### Staging Environment
- **Cluster**: `staging-passkey-cluster`
- **Namespace**: `passkey-staging`
- **Replicas**: 3
- **Resources**:
  - CPU: 1000m request, 2000m limit
  - Memory: 2Gi request, 4Gi limit
- **Database**: Oracle Staging instance
- **URL**: `https://api-staging.cvent.com/passkey-acknowledgement`

### Production Environment
- **Cluster**: `prod-passkey-cluster`
- **Namespace**: `passkey-prod`
- **Replicas**: 6 (across 3 AZs)
- **Resources**:
  - CPU: 2000m request, 4000m limit
  - Memory: 4Gi request, 8Gi limit
- **Database**: Oracle Production cluster (Multi-AZ)
- **URL**: `https://api.cvent.com/passkey-acknowledgement`

## CI/CD Pipeline

### Jenkins Pipeline Configuration

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.cvent.net'
        SERVICE_NAME = 'passkey-acknowledgment'
        KUBECONFIG = credentials('k8s-config')
    }
    
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
                        sh 'mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify'
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'mvn dependency-check:check'
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/${SERVICE_NAME}:${BUILD_NUMBER}")
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-creds') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Dev') {
            steps {
                sh 'kubectl apply -f k8s/dev/ --namespace=passkey-dev'
                sh 'kubectl set image deployment/passkey-acknowledgment passkey-acknowledgment=${DOCKER_REGISTRY}/${SERVICE_NAME}:${BUILD_NUMBER} --namespace=passkey-dev'
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'master'
            }
            steps {
                sh 'kubectl apply -f k8s/staging/ --namespace=passkey-staging'
                sh 'kubectl set image deployment/passkey-acknowledgment passkey-acknowledgment=${DOCKER_REGISTRY}/${SERVICE_NAME}:${BUILD_NUMBER} --namespace=passkey-staging'
            }
        }
        
        stage('Deploy to Production') {
            when {
                tag pattern: 'v\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                sh 'kubectl apply -f k8s/prod/ --namespace=passkey-prod'
                sh 'kubectl set image deployment/passkey-acknowledgment passkey-acknowledgment=${DOCKER_REGISTRY}/${SERVICE_NAME}:${BUILD_NUMBER} --namespace=passkey-prod'
            }
        }
    }
    
    post {
        always {
            publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'target/site/clover',
                reportFiles: 'index.html',
                reportName: 'Code Coverage Report'
            ])
        }
    }
}
```

### Deployment Scripts

#### Build Script (`build.sh`)
```bash
#!/bin/bash
set -e

echo "Building Passkey Acknowledgment Service..."

# Clean and build
mvn clean package -Prelease

# Run tests
mvn test

echo "Build completed successfully!"
```

#### Docker Build Script (`build-it.sh`)
```bash
#!/bin/bash
set -e

VERSION=${1:-latest}
REGISTRY="docker.cvent.net"
SERVICE="passkey-acknowledgment"

echo "Building Docker image for ${SERVICE}:${VERSION}"

# Build Docker image
docker build -t ${REGISTRY}/${SERVICE}:${VERSION} .

# Push to registry
docker push ${REGISTRY}/${SERVICE}:${VERSION}

echo "Docker image built and pushed successfully!"
```

## Kubernetes Configuration

### Deployment Manifest (`k8s/deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-acknowledgment
  labels:
    app: passkey-acknowledgment
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-acknowledgment
  template:
    metadata:
      labels:
        app: passkey-acknowledgment
        version: v1
    spec:
      containers:
      - name: passkey-acknowledgment
        image: docker.cvent.net/passkey-acknowledgment:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: admin
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: passkey-acknowledgment-secrets
              key: database-url
        - name: DATABASE_USER
          valueFrom:
            secretKeyRef:
              name: passkey-acknowledgment-secrets
              key: database-user
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: passkey-acknowledgment-secrets
              key: database-password
        - name: AUTH_SERVICE_URL
          value: "https://auth-service.cvent.com"
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
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /healthcheck
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service Manifest (`k8s/service.yaml`)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: passkey-acknowledgment-service
  labels:
    app: passkey-acknowledgment
spec:
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  - port: 8081
    targetPort: 8081
    protocol: TCP
    name: admin
  selector:
    app: passkey-acknowledgment
```

### Ingress Configuration (`k8s/ingress.yaml`)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: passkey-acknowledgment-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  rules:
  - host: api.cvent.com
    http:
      paths:
      - path: /passkey-acknowledgement
        pathType: Prefix
        backend:
          service:
            name: passkey-acknowledgment-service
            port:
              number: 80
```

## Configuration Management

### Secrets Management
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: passkey-acknowledgment-secrets
type: Opaque
data:
  database-url: <base64-encoded-url>
  database-user: <base64-encoded-username>
  database-password: <base64-encoded-password>
```

### ConfigMap for Environment-Specific Settings
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: passkey-acknowledgment-config
data:
  log-level: "INFO"
  max-connections: "32"
  timeout-seconds: "30"
```

## Monitoring and Alerting

### Prometheus Metrics
```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: passkey-acknowledgment-metrics
spec:
  selector:
    matchLabels:
      app: passkey-acknowledgment
  endpoints:
  - port: admin
    path: /metrics
    interval: 30s
```

### Datadog Dashboard
- **Service Map**: Visualize service dependencies
- **Performance Metrics**: Response times, throughput, error rates
- **Infrastructure Metrics**: CPU, memory, network usage
- **Business Metrics**: Acknowledgment success rates, processing times

### Alerting Rules
```yaml
# High error rate alert
- alert: PasskeyAcknowledmentHighErrorRate
  expr: rate(http_requests_total{job="passkey-acknowledgment",status=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "High error rate in Passkey Acknowledgment Service"

# High response time alert
- alert: PasskeyAcknowledmentHighLatency
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="passkey-acknowledgment"}[5m])) > 2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High response time in Passkey Acknowledgment Service"
```

## Rollback Procedures

### Automated Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/passkey-acknowledgment --namespace=passkey-prod

# Rollback to specific revision
kubectl rollout undo deployment/passkey-acknowledgment --to-revision=2 --namespace=passkey-prod

# Check rollout status
kubectl rollout status deployment/passkey-acknowledgment --namespace=passkey-prod
```

### Manual Rollback Steps
1. **Identify Issue**: Monitor alerts and logs to confirm the need for rollback
2. **Stop Traffic**: Temporarily route traffic away from affected pods
3. **Execute Rollback**: Use kubectl or Jenkins pipeline to rollback
4. **Verify Health**: Confirm service health checks pass
5. **Restore Traffic**: Gradually restore traffic to rolled-back version
6. **Post-Incident**: Document incident and plan fix for next deployment

### Database Rollback
```sql
-- If database schema changes need rollback
-- Execute rollback scripts in reverse order
-- Example:
ALTER TABLE RESERVATION_ACKNOWLEDGEMENT_LOG DROP COLUMN NEW_COLUMN;
```

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with 30-day retention
- **Configuration**: Version controlled in Git
- **Secrets**: Backed up in secure vault

### Recovery Procedures
1. **Service Recovery**: Redeploy from known good image
2. **Database Recovery**: Restore from backup if needed
3. **Configuration Recovery**: Apply configuration from Git
4. **Validation**: Run health checks and integration tests

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 15 minutes
- **Recovery Point Objective (RPO)**: 1 hour
- **Availability Target**: 99.9% uptime