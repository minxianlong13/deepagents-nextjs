# Deployment

## Infrastructure

The Passkey Permission Service is deployed on Cvent's cloud infrastructure using containerized deployments with the following components:

### Container Platform
- **Orchestration**: Kubernetes clusters managed by Cvent's platform team
- **Container Runtime**: Docker containers running OpenJDK 17
- **Service Mesh**: Istio for service-to-service communication and security
- **Load Balancing**: Application Load Balancers (ALB) with health check integration

### Cloud Provider
- **Primary**: Amazon Web Services (AWS)
- **Regions**: Multi-region deployment for high availability
- **Availability Zones**: Distributed across multiple AZs for fault tolerance

### Database Infrastructure
- **Database**: Oracle Database Enterprise Edition
- **High Availability**: Oracle RAC (Real Application Clusters)
- **Backup**: Automated daily backups with point-in-time recovery
- **Connection Pooling**: HikariCP for efficient database connections

## Environments

### Development (dev)
- **Purpose**: Active development and feature testing
- **URL**: `https://dev-api.cvent.com/passkey-permission/v1`
- **Database**: Shared development Oracle instance
- **Monitoring**: Basic logging and health checks
- **Deployment**: Automatic deployment on merge to `develop` branch
- **Resources**: 
  - CPU: 0.5 cores
  - Memory: 1GB
  - Replicas: 1

### Alpha (alpha)
- **Purpose**: Pre-production testing and validation
- **URL**: `https://alpha-api.cvent.com/passkey-permission/v1`
- **Database**: Dedicated alpha Oracle instance with production-like data
- **Monitoring**: Full monitoring stack with alerts
- **Deployment**: Manual deployment after development validation
- **Resources**:
  - CPU: 1 core
  - Memory: 2GB
  - Replicas: 2

### Test Environment (ts50)
- **Purpose**: Integration testing and QA validation
- **URL**: `https://ts50-api.cvent.com/passkey-permission/v1`
- **Database**: Isolated test Oracle instance
- **Monitoring**: Full monitoring with test-specific dashboards
- **Deployment**: Triggered by QA team for testing cycles
- **Resources**:
  - CPU: 1 core
  - Memory: 2GB
  - Replicas: 2

### Production (pr50)
- **Purpose**: Live production environment serving customer traffic
- **URL**: `https://api.cvent.com/passkey-permission/v1`
- **Database**: Production Oracle RAC cluster
- **Monitoring**: Comprehensive monitoring, alerting, and SLA tracking
- **Deployment**: Controlled production deployment with approval gates
- **Resources**:
  - CPU: 2 cores
  - Memory: 4GB
  - Replicas: 3 (minimum), auto-scaling up to 10

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The service uses Jenkins for continuous integration and deployment:

**Pipeline Location**: `https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-permission`

### Build Stages

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
        
        stage('Unit Tests') {
            steps {
                sh 'mvn test'
            }
            post {
                always {
                    publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
                    publishCoverage adapters: [jacocoAdapter('**/target/site/jacoco/jacoco.xml')]
                }
            }
        }
        
        stage('Package') {
            steps {
                sh 'mvn package -Prelease -DskipTests'
            }
        }
        
        stage('Integration Tests') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'master'
                }
            }
            steps {
                sh 'mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify'
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("cvent/passkey-permission:${env.BUILD_NUMBER}")
                    docker.withRegistry('https://registry.cvent.com', 'docker-registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Dev') {
            when { branch 'develop' }
            steps {
                sh 'kubectl apply -f k8s/dev/ --namespace=passkey-dev'
            }
        }
        
        stage('Deploy to Alpha') {
            when { 
                branch 'master'
                input {
                    message "Deploy to Alpha?"
                    ok "Deploy"
                }
            }
            steps {
                sh 'kubectl apply -f k8s/alpha/ --namespace=passkey-alpha'
            }
        }
        
        stage('Deploy to Production') {
            when { 
                tag pattern: "v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP"
                input {
                    message "Deploy to Production?"
                    ok "Deploy"
                    submitterParameter: 'APPROVER'
                }
            }
            steps {
                sh 'kubectl apply -f k8s/production/ --namespace=passkey-production'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}, cherry-pickers@cvent.com"
            )
        }
    }
}
```

### Deployment Triggers

- **Development**: Automatic deployment on merge to `develop` branch
- **Alpha**: Manual trigger after successful development deployment
- **Production**: Manual trigger on tagged releases with approval gate

### Build Artifacts

1. **JAR File**: `passkey-permission-service-{version}.jar`
2. **Docker Image**: `cvent/passkey-permission:{version}`
3. **Kubernetes Manifests**: Environment-specific YAML files
4. **Test Reports**: Unit test and integration test results
5. **Coverage Reports**: Code coverage analysis

## Configuration Management

### Hogan Templates

Configuration is managed using Hogan templates stored in the repository:

```yaml
# Template: passkey-permission-service/configs/template.yaml
server:
  applicationConnectors:
    - type: http
      port: {{service.port}}
  adminConnectors:
    - type: http
      port: {{service.adminPort}}

database:
  url: {{database.url}}
  user: {{database.user}}
  password: {{database.password}}
  
authService:
  baseUrl: {{authService.baseUrl}}
  apiKey: {{authService.apiKey}}
```

### Environment-Specific Values

Values are injected based on deployment environment:

```yaml
# dev.yaml
service:
  port: 8080
  adminPort: 8081
database:
  url: "jdbc:oracle:thin:@dev-oracle.cvent.com:1521:DEVDB"
  user: "passkey_dev"
  password: "${DB_PASSWORD}"
authService:
  baseUrl: "https://dev-auth.cvent.com"
  apiKey: "${AUTH_API_KEY}"

# production.yaml  
service:
  port: 8080
  adminPort: 8081
database:
  url: "jdbc:oracle:thin:@prod-oracle-cluster.cvent.com:1521:PRODDB"
  user: "passkey_prod"
  password: "${DB_PASSWORD}"
authService:
  baseUrl: "https://auth.cvent.com"
  apiKey: "${AUTH_API_KEY}"
```

### Secret Management

Sensitive configuration values are managed through Kubernetes secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: passkey-permission-secrets
  namespace: passkey-production
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  AUTH_API_KEY: <base64-encoded-api-key>
```

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-permission-service
  namespace: passkey-production
  labels:
    app: passkey-permission-service
    version: v1.1.6
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-permission-service
  template:
    metadata:
      labels:
        app: passkey-permission-service
        version: v1.1.6
    spec:
      containers:
      - name: passkey-permission-service
        image: cvent/passkey-permission:1.1.6
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: admin
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: passkey-permission-secrets
              key: DB_PASSWORD
        - name: AUTH_API_KEY
          valueFrom:
            secretKeyRef:
              name: passkey-permission-secrets
              key: AUTH_API_KEY
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
          mountPath: /app/configs
      volumes:
      - name: config-volume
        configMap:
          name: passkey-permission-config
```

### Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: passkey-permission-service
  namespace: passkey-production
spec:
  selector:
    app: passkey-permission-service
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: admin
    port: 8081
    targetPort: 8081
  type: ClusterIP
```

### Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: passkey-permission-ingress
  namespace: passkey-production
  annotations:
    kubernetes.io/ingress.class: "alb"
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/healthcheck-path: /healthcheck
spec:
  rules:
  - host: api.cvent.com
    http:
      paths:
      - path: /passkey-permission
        pathType: Prefix
        backend:
          service:
            name: passkey-permission-service
            port:
              number: 80
```

## Monitoring and Alerting

### Datadog Integration

The service is monitored using Datadog with the following dashboards and alerts:

**Dashboard**: https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-permission-service

### Key Metrics Monitored

1. **Application Metrics**:
   - Request rate and response times
   - Error rates by endpoint
   - JVM memory and garbage collection
   - Thread pool utilization

2. **Infrastructure Metrics**:
   - CPU and memory usage
   - Network I/O
   - Disk usage
   - Container health

3. **Business Metrics**:
   - Permission evaluation times
   - Cache hit/miss ratios
   - Authentication success rates
   - Navigation generation performance

### Alert Configuration

```yaml
# High error rate alert
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: critical
    service: passkey-permission-service
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors per second"

# High response time alert  
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: warning
    service: passkey-permission-service
  annotations:
    summary: "High response time detected"
    description: "95th percentile response time is {{ $value }} seconds"

# Database connection alert
- alert: DatabaseConnectionIssue
  expr: database_connections_active / database_connections_max > 0.8
  for: 1m
  labels:
    severity: warning
    service: passkey-permission-service
  annotations:
    summary: "Database connection pool nearly exhausted"
    description: "{{ $value }}% of database connections in use"
```

## Rollback Procedures

### Automated Rollback

Kubernetes deployment supports automated rollback to previous versions:

```bash
# Check rollout status
kubectl rollout status deployment/passkey-permission-service -n passkey-production

# Rollback to previous version
kubectl rollout undo deployment/passkey-permission-service -n passkey-production

# Rollback to specific revision
kubectl rollout undo deployment/passkey-permission-service --to-revision=2 -n passkey-production
```

### Manual Rollback Steps

1. **Identify Issue**: Monitor alerts and logs to confirm deployment issue
2. **Stop Traffic**: Update load balancer to stop routing traffic to new version
3. **Rollback Deployment**: Use kubectl to rollback to previous stable version
4. **Verify Health**: Confirm service health checks pass
5. **Restore Traffic**: Gradually restore traffic to rolled-back version
6. **Investigate**: Analyze logs and metrics to determine root cause

### Rollback Validation

```bash
# Verify deployment rollback
kubectl get pods -n passkey-production -l app=passkey-permission-service

# Check service health
curl -f https://api.cvent.com/passkey-permission/v1/healthcheck

# Validate functionality
curl -H "Authorization: ApiKey ${API_KEY}" \
  "https://api.cvent.com/passkey-permission/v1/permissions?userId=12345"
```

### Emergency Procedures

For critical production issues:

1. **Immediate Response**: Page on-call engineer via PagerDuty
2. **Communication**: Update status page and notify stakeholders
3. **Rollback Decision**: Engineering manager approval for production rollback
4. **Post-Incident**: Conduct post-mortem and update runbooks