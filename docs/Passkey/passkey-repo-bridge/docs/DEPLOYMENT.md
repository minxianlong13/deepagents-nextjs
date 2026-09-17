# Deployment

## Infrastructure

The Passkey Bridge Service is deployed on AWS infrastructure using containerized deployments with Docker and orchestrated through Kubernetes.

### AWS Services
- **EKS (Elastic Kubernetes Service)**: Container orchestration
- **RDS PostgreSQL**: Primary database
- **ElastiCache Redis**: Caching layer (if applicable)
- **Application Load Balancer**: Traffic distribution
- **Route 53**: DNS management
- **CloudWatch**: Monitoring and logging
- **Secrets Manager**: Secure configuration storage

## Environments

### Development (dev)
- **URL**: `https://passkey-bridge-service.dev.cvent.com`
- **Database**: Development RDS instance
- **Replicas**: 1
- **Resources**: 
  - CPU: 0.5 cores
  - Memory: 1GB
- **Purpose**: Feature development and testing

### Staging (staging)
- **URL**: `https://passkey-bridge-service.staging.cvent.com`
- **Database**: Staging RDS instance with production-like data
- **Replicas**: 2
- **Resources**:
  - CPU: 1 core
  - Memory: 2GB
- **Purpose**: Pre-production testing and validation

### Production (prod)
- **URL**: `https://passkey-bridge-service.prod.cvent.com`
- **Database**: Production RDS with Multi-AZ deployment
- **Replicas**: 3+ (auto-scaling enabled)
- **Resources**:
  - CPU: 2 cores
  - Memory: 4GB
- **Purpose**: Live production traffic

## CI/CD Pipeline

### Jenkins Pipeline
The service uses Jenkins for continuous integration and deployment:

**Pipeline Stages**:
1. **Checkout**: Pull source code from GitHub
2. **Build**: Maven build with unit tests
3. **Test**: Run integration tests with Karate
4. **Quality Gate**: SonarQube analysis and quality checks
5. **Package**: Build Docker image
6. **Security Scan**: Container vulnerability scanning
7. **Deploy to Dev**: Automatic deployment to development
8. **Deploy to Staging**: Manual approval required
9. **Deploy to Production**: Manual approval with additional checks

**Pipeline Configuration**:
```groovy
// Jenkinsfile (simplified)
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package -Prelease'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn verify -Prun-it'
            }
        }
        
        stage('Docker Build') {
            steps {
                sh 'docker build -t passkey-bridge-service:${BUILD_NUMBER} .'
            }
        }
        
        stage('Deploy') {
            steps {
                sh './deploy.sh ${ENVIRONMENT}'
            }
        }
    }
}
```

### Deployment Scripts
- `build.sh`: Local build script
- `build-release.sh`: Release build with optimizations
- `dropkick.sh`: Deployment orchestration
- `dropkick_docker.sh`: Docker-based deployment
- `jenkins.sh`: Jenkins-specific build steps

## Configuration Management

### Environment-Specific Configurations
Configurations are managed through Kubernetes ConfigMaps and Secrets:

```yaml
# ConfigMap example
apiVersion: v1
kind: ConfigMap
metadata:
  name: passkey-bridge-config
data:
  application.yaml: |
    server:
      port: 8080
    database:
      url: ${DATABASE_URL}
    auth:
      serviceUrl: ${AUTH_SERVICE_URL}
```

### Secret Management
Sensitive data is stored in AWS Secrets Manager and injected as environment variables:

```yaml
# Secret example
apiVersion: v1
kind: Secret
metadata:
  name: passkey-bridge-secrets
type: Opaque
data:
  database-password: <base64-encoded-password>
  api-key: <base64-encoded-api-key>
```

### Hogan Templates
Configuration templates are managed through Hogan:
- **Directory**: `passkey-bridge-service/configs`
- **Templates**: Environment-specific YAML configurations
- **Variables**: Injected at deployment time

## Kubernetes Deployment

### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-bridge-service
  labels:
    app: passkey-bridge-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-bridge-service
  template:
    metadata:
      labels:
        app: passkey-bridge-service
    spec:
      containers:
      - name: passkey-bridge-service
        image: passkey-bridge-service:latest
        ports:
        - containerPort: 8080
        - containerPort: 8081
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: passkey-bridge-secrets
              key: database-url
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

### Service Configuration
```yaml
apiVersion: v1
kind: Service
metadata:
  name: passkey-bridge-service
spec:
  selector:
    app: passkey-bridge-service
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: admin
    port: 8081
    targetPort: 8081
  type: ClusterIP
```

## Monitoring and Alerting

### Health Checks
- **Application Health**: `/healthcheck` endpoint
- **Database Connectivity**: Database connection validation
- **Dependency Health**: Auth service connectivity check

### Monitoring Setup
- **Datadog Agent**: Deployed as DaemonSet for metrics collection
- **APM Tracing**: Automatic instrumentation for request tracing
- **Log Aggregation**: Centralized logging through Datadog

### Alerting Rules
- High error rate (>5% for 5 minutes)
- High response time (>2s average for 5 minutes)
- Database connection failures
- Memory usage >80%
- CPU usage >80%

## Rollback Procedures

### Automatic Rollback
- Health check failures trigger automatic rollback
- Deployment rollback within 5 minutes of detection

### Manual Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/passkey-bridge-service

# Rollback to specific revision
kubectl rollout undo deployment/passkey-bridge-service --to-revision=2

# Check rollout status
kubectl rollout status deployment/passkey-bridge-service
```

### Database Rollback
- Database migrations are versioned
- Rollback scripts available for each migration
- Database backups taken before major deployments

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with 30-day retention
- **Configuration**: Version controlled in Git
- **Application State**: Stateless design minimizes recovery complexity

### Recovery Procedures
1. **Service Recovery**: Redeploy from last known good image
2. **Database Recovery**: Restore from latest backup
3. **Configuration Recovery**: Deploy from Git repository
4. **Validation**: Run smoke tests to verify functionality

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 30 minutes
- **Recovery Point Objective (RPO)**: 1 hour
- **Availability Target**: 99.9% uptime

## Security Considerations

### Network Security
- Private subnets for application and database tiers
- Security groups restricting access to necessary ports
- WAF protection for external endpoints

### Container Security
- Base images scanned for vulnerabilities
- Non-root user execution
- Read-only root filesystem where possible
- Resource limits to prevent resource exhaustion

### Secrets Management
- No secrets in container images or code
- Secrets rotation policies
- Least privilege access principles