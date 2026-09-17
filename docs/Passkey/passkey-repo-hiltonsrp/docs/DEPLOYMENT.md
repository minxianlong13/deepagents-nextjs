# Deployment

## Infrastructure

The Passkey Hilton SRP Service is deployed on Cvent's Kubernetes infrastructure using a containerized approach with Docker.

### Container Platform
- **Orchestration**: Kubernetes
- **Container Runtime**: Docker
- **Base Image**: OpenJDK 21 Alpine
- **Registry**: Cvent's internal Docker registry

### AWS Services
- **Compute**: EKS (Elastic Kubernetes Service)
- **Secrets**: AWS Parameter Store
- **Monitoring**: CloudWatch integration via Datadog
- **Load Balancing**: Application Load Balancer (ALB)

## Environments

### Development
- **Namespace**: `passkey-dev`
- **Replicas**: 1
- **Resources**:
  - CPU: 500m request, 1000m limit
  - Memory: 512Mi request, 1Gi limit
- **Database**: Shared development PostgreSQL instance
- **External APIs**: Hilton staging environment
- **URL**: `https://passkey-hiltonsrp-service-dev.core.cvent.org`

### Staging
- **Namespace**: `passkey-staging`
- **Replicas**: 2
- **Resources**:
  - CPU: 1000m request, 2000m limit
  - Memory: 1Gi request, 2Gi limit
- **Database**: Dedicated staging PostgreSQL instance
- **External APIs**: Hilton staging environment
- **URL**: `https://passkey-hiltonsrp-service-staging.core.cvent.org`

### Production
- **Namespace**: `passkey-prod`
- **Replicas**: 3 (with anti-affinity rules)
- **Resources**:
  - CPU: 2000m request, 4000m limit
  - Memory: 2Gi request, 4Gi limit
- **Database**: High-availability PostgreSQL cluster
- **External APIs**: Hilton production environment
- **URL**: `https://passkey-hiltonsrp-service.core.cvent.org`

## CI/CD Pipeline

### Jenkins Pipeline
The service uses a Jenkins-based CI/CD pipeline defined in `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Test') {
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
        
        stage('Package') {
            steps {
                sh 'mvn package -Prelease'
            }
        }
        
        stage('Docker Build') {
            steps {
                sh 'docker build -t passkey-hiltonsrp-service:${BUILD_NUMBER} .'
            }
        }
        
        stage('Deploy to Dev') {
            when { branch 'develop' }
            steps {
                sh './deploy.sh dev ${BUILD_NUMBER}'
            }
        }
        
        stage('Deploy to Staging') {
            when { branch 'master' }
            steps {
                sh './deploy.sh staging ${BUILD_NUMBER}'
            }
        }
        
        stage('Deploy to Production') {
            when { tag pattern: "v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP" }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh './deploy.sh prod ${BUILD_NUMBER}'
            }
        }
    }
}
```

### Build Process
1. **Source Code Checkout**: Code is pulled from GitHub
2. **Dependency Resolution**: Maven downloads dependencies from Nexus
3. **Compilation**: Java source code is compiled
4. **Unit Testing**: JUnit tests are executed
5. **Integration Testing**: End-to-end tests run against dev environment
6. **Packaging**: JAR file is created with all dependencies
7. **Docker Image Build**: Container image is built and tagged
8. **Image Push**: Docker image is pushed to registry
9. **Deployment**: Kubernetes manifests are applied

### Deployment Scripts

#### `deploy.sh`
```bash
#!/bin/bash
ENVIRONMENT=$1
BUILD_NUMBER=$2

echo "Deploying to $ENVIRONMENT with build $BUILD_NUMBER"

# Update Kubernetes manifests
sed -i "s/{{BUILD_NUMBER}}/$BUILD_NUMBER/g" k8s/$ENVIRONMENT/deployment.yaml

# Apply Kubernetes manifests
kubectl apply -f k8s/$ENVIRONMENT/ --namespace=passkey-$ENVIRONMENT

# Wait for rollout to complete
kubectl rollout status deployment/passkey-hiltonsrp-service --namespace=passkey-$ENVIRONMENT

echo "Deployment to $ENVIRONMENT completed successfully"
```

## Configuration Management

### Kubernetes ConfigMaps
Environment-specific configuration is managed through Kubernetes ConfigMaps:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: passkey-hiltonsrp-config
  namespace: passkey-prod
data:
  application.yaml: |
    server:
      applicationConnectors:
        - type: http
          port: 8080
    hiltonIntegration:
      baseUrl: https://api.hilton.com
      timeout: 30s
    logging:
      level: INFO
```

### Secrets Management
Sensitive configuration is managed through Kubernetes Secrets, populated from AWS Parameter Store:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: passkey-hiltonsrp-secrets
  namespace: passkey-prod
type: Opaque
data:
  hilton-client-id: <base64-encoded-value>
  hilton-client-secret: <base64-encoded-value>
```

### Environment-Specific Overrides
Each environment has its own configuration directory:
```
k8s/
├── dev/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── staging/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
└── prod/
    ├── deployment.yaml
    ├── service.yaml
    ├── configmap.yaml
    └── hpa.yaml
```

## Rollback Procedures

### Automatic Rollback
Kubernetes deployment includes readiness and liveness probes that trigger automatic rollback on failure:

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 30
  failureThreshold: 3
```

### Manual Rollback
To manually rollback to a previous version:

```bash
# View deployment history
kubectl rollout history deployment/passkey-hiltonsrp-service -n passkey-prod

# Rollback to previous version
kubectl rollout undo deployment/passkey-hiltonsrp-service -n passkey-prod

# Rollback to specific revision
kubectl rollout undo deployment/passkey-hiltonsrp-service --to-revision=2 -n passkey-prod
```

### Database Rollback
Database changes are managed through Flyway migrations:

```bash
# Rollback database to specific version
flyway -url=jdbc:postgresql://db-host:5432/passkey -user=username -password=password migrate -target=1.2.0
```

## Monitoring and Alerting

### Health Checks
- **Kubernetes Probes**: Readiness and liveness probes
- **Application Health**: Dropwizard health checks
- **External Dependencies**: Hilton API and Auth Service connectivity

### Metrics Collection
- **Application Metrics**: Exported to Datadog via StatsD
- **Infrastructure Metrics**: Kubernetes metrics via Datadog agent
- **Custom Business Metrics**: Sync operation success rates, reservation processing times

### Alerting Rules
- **High Error Rate**: >5% error rate for 5 minutes
- **High Response Time**: >2s average response time for 5 minutes
- **Failed Sync Operations**: Any sync operation failure
- **External API Failures**: Hilton API error rate >10%

### Log Aggregation
- **Collection**: Logs collected via Datadog agent
- **Retention**: 30 days for application logs
- **Indexing**: Structured logging with correlation IDs
- **Alerting**: Log-based alerts for ERROR level messages

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with 30-day retention
- **Configuration**: All configuration stored in version control
- **Secrets**: Backed up in AWS Parameter Store with cross-region replication

### Recovery Procedures
1. **Service Recovery**: Redeploy from last known good image
2. **Database Recovery**: Restore from most recent backup
3. **Configuration Recovery**: Apply configuration from version control
4. **Secrets Recovery**: Retrieve from AWS Parameter Store

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 30 minutes
- **Recovery Point Objective (RPO)**: 1 hour
- **Data Loss Tolerance**: Minimal (sync operations can be re-run)