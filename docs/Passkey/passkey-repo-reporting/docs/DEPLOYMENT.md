# Deployment

## Infrastructure

### Cloud Platform
- **Provider**: Amazon Web Services (AWS)
- **Container Orchestration**: Kubernetes (EKS)
- **Service Mesh**: Istio (inferred from Cvent infrastructure)
- **Load Balancing**: AWS Application Load Balancer (ALB)
- **DNS**: Route 53
- **CDN**: CloudFront (for static assets)

### Compute Resources
- **Instance Type**: t3.medium (typical for microservices)
- **CPU**: 2 vCPUs
- **Memory**: 4 GB RAM
- **Storage**: 20 GB EBS gp3
- **Auto Scaling**: Horizontal Pod Autoscaler (HPA)

### Database Infrastructure
- **Primary Database**: Amazon RDS PostgreSQL
- **Instance Class**: db.r5.large (production)
- **Multi-AZ**: Enabled for high availability
- **Backup Retention**: 7 days
- **Encryption**: At rest and in transit

### Caching Infrastructure
- **Cache Provider**: Amazon ElastiCache for Redis
- **Instance Type**: cache.r6g.large
- **Cluster Mode**: Enabled
- **Backup**: Daily snapshots
- **TTL**: Configurable per cache key

## Environments

### Development Environment
- **URL**: `https://api-dev.cvent.com/passkey-reporting/v1/`
- **Namespace**: `passkey-dev`
- **Replicas**: 1
- **Resources**:
  - CPU Request: 100m
  - CPU Limit: 500m
  - Memory Request: 256Mi
  - Memory Limit: 1Gi
- **Database**: Shared development RDS instance
- **Cache**: Shared Redis cluster
- **Monitoring**: Basic health checks and logs

### Staging Environment
- **URL**: `https://api-staging.cvent.com/passkey-reporting/v1/`
- **Namespace**: `passkey-staging`
- **Replicas**: 2
- **Resources**:
  - CPU Request: 200m
  - CPU Limit: 1000m
  - Memory Request: 512Mi
  - Memory Limit: 2Gi
- **Database**: Dedicated staging RDS instance
- **Cache**: Dedicated Redis cluster
- **Monitoring**: Full observability stack

### Production Environment
- **URL**: `https://api.cvent.com/passkey-reporting/v1/`
- **Namespace**: `passkey-prod`
- **Replicas**: 3 (minimum)
- **Resources**:
  - CPU Request: 500m
  - CPU Limit: 2000m
  - Memory Request: 1Gi
  - Memory Limit: 4Gi
- **Database**: Multi-AZ RDS with read replicas
- **Cache**: Redis cluster with failover
- **Monitoring**: Comprehensive monitoring and alerting

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The service uses Jenkins for continuous integration and deployment:

**Pipeline Location**: `https://ci-jenkins.core.cvent.org/job/passkey/job/passkey-reporting/`

### Pipeline Stages

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
                            publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
                        }
                    }
                }
                
                stage('Integration Tests') {
                    steps {
                        sh 'mvn verify -Prun-it -Dkarate.env=dev'
                    }
                }
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('SonarQube Analysis') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            sh 'mvn sonar:sonar'
                        }
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        sh 'mvn org.owasp:dependency-check-maven:check'
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
                script {
                    def image = docker.build("passkey-reporting:${env.BUILD_NUMBER}")
                    docker.withRegistry('https://docker.cvent.net', 'docker-registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Dev') {
            steps {
                sh 'kubectl apply -f k8s/dev/ --namespace=passkey-dev'
                sh 'kubectl rollout status deployment/passkey-reporting --namespace=passkey-dev'
            }
        }
        
        stage('Service Tests') {
            steps {
                dir('passkey-reporting-service-test') {
                    sh './newman.sh dev'
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'master'
            }
            steps {
                input message: 'Deploy to staging?', ok: 'Deploy'
                sh 'kubectl apply -f k8s/staging/ --namespace=passkey-staging'
                sh 'kubectl rollout status deployment/passkey-reporting --namespace=passkey-staging'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'master'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh 'kubectl apply -f k8s/prod/ --namespace=passkey-prod'
                sh 'kubectl rollout status deployment/passkey-reporting --namespace=passkey-prod'
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
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### Build Triggers

- **Source Control**: Automatic builds on Git push to any branch
- **Pull Requests**: Automatic builds and tests on PR creation/update
- **Scheduled**: Nightly builds for dependency updates
- **Manual**: On-demand builds through Jenkins UI

## Configuration Management

### Kubernetes ConfigMaps

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: passkey-reporting-config
  namespace: passkey-prod
data:
  application.yaml: |
    server:
      applicationConnectors:
        - type: http
          port: 8080
      adminConnectors:
        - type: http
          port: 8081
    
    database:
      url: jdbc:postgresql://passkey-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432/passkey_reporting
      user: ${DB_USER}
      password: ${DB_PASSWORD}
    
    authService:
      baseUrl: https://auth.cvent.com
    
    cache:
      redis:
        host: passkey-redis.abc123.cache.amazonaws.com
        port: 6379
```

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: passkey-reporting-secrets
  namespace: passkey-prod
type: Opaque
data:
  DB_USER: <base64-encoded-username>
  DB_PASSWORD: <base64-encoded-password>
  REDIS_AUTH_TOKEN: <base64-encoded-token>
```

### Environment-Specific Overrides

Each environment has its own configuration overlay:

```
k8s/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── kustomization.yaml
├── dev/
│   ├── kustomization.yaml
│   └── patches/
├── staging/
│   ├── kustomization.yaml
│   └── patches/
└── prod/
    ├── kustomization.yaml
    └── patches/
```

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-reporting
  namespace: passkey-prod
  labels:
    app: passkey-reporting
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-reporting
  template:
    metadata:
      labels:
        app: passkey-reporting
        version: v1
    spec:
      containers:
      - name: passkey-reporting
        image: docker.cvent.net/passkey-reporting:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: admin
        env:
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: passkey-reporting-secrets
              key: DB_USER
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: passkey-reporting-secrets
              key: DB_PASSWORD
        volumeMounts:
        - name: config
          mountPath: /usr/src/configs
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
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
      volumes:
      - name: config
        configMap:
          name: passkey-reporting-config
```

### Service Manifest

```yaml
apiVersion: v1
kind: Service
metadata:
  name: passkey-reporting-service
  namespace: passkey-prod
  labels:
    app: passkey-reporting
spec:
  selector:
    app: passkey-reporting
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
  name: passkey-reporting-ingress
  namespace: passkey-prod
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/healthcheck-path: /healthcheck
spec:
  rules:
  - host: api.cvent.com
    http:
      paths:
      - path: /passkey-reporting
        pathType: Prefix
        backend:
          service:
            name: passkey-reporting-service
            port:
              number: 80
```

## Monitoring and Alerting

### Health Check Endpoints

- **Application Health**: `GET /healthcheck`
- **Admin Interface**: `GET :8081/healthcheck`
- **Metrics**: `GET :8081/metrics`
- **Thread Dump**: `GET :8081/threads`

### Datadog Integration

```yaml
# Datadog annotations for automatic discovery
metadata:
  annotations:
    ad.datadoghq.com/passkey-reporting.check_names: '["http_check"]'
    ad.datadoghq.com/passkey-reporting.init_configs: '[{}]'
    ad.datadoghq.com/passkey-reporting.instances: '[{"name": "passkey-reporting", "url": "http://%%host%%:8081/healthcheck"}]'
```

### Alerting Rules

- **High Error Rate**: > 5% 4xx/5xx responses in 5 minutes
- **High Latency**: > 2 second average response time
- **Low Availability**: < 99% uptime in 15 minutes
- **Database Connection Issues**: Connection pool exhaustion
- **Memory Usage**: > 80% memory utilization
- **CPU Usage**: > 80% CPU utilization

## Rollback Procedures

### Automated Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/passkey-reporting --namespace=passkey-prod

# Rollback to specific revision
kubectl rollout undo deployment/passkey-reporting --to-revision=2 --namespace=passkey-prod

# Check rollout status
kubectl rollout status deployment/passkey-reporting --namespace=passkey-prod
```

### Manual Rollback Steps

1. **Identify Issue**: Monitor alerts and logs to confirm need for rollback
2. **Stop Traffic**: Scale down new deployment or update load balancer
3. **Database Rollback**: If schema changes were made, run rollback scripts
4. **Application Rollback**: Deploy previous known-good version
5. **Verify Health**: Confirm all health checks pass
6. **Restore Traffic**: Gradually restore traffic to rolled-back version
7. **Post-Incident**: Document incident and update procedures

### Rollback Validation

```bash
# Verify deployment
kubectl get pods -l app=passkey-reporting --namespace=passkey-prod

# Check logs
kubectl logs -l app=passkey-reporting --namespace=passkey-prod --tail=100

# Test endpoints
curl -H "Authorization: Bearer $API_KEY" \
  https://api.cvent.com/passkey-reporting/v1/healthcheck
```

## Disaster Recovery

### Backup Strategy

- **Database Backups**: Automated daily backups with 7-day retention
- **Configuration Backups**: Git-based configuration management
- **Application Artifacts**: Docker images stored in registry
- **Secrets**: Encrypted backup of Kubernetes secrets

### Recovery Procedures

1. **Infrastructure Recovery**: Restore Kubernetes cluster and networking
2. **Database Recovery**: Restore from latest backup or point-in-time recovery
3. **Application Deployment**: Deploy from known-good Docker images
4. **Configuration Restore**: Apply configuration from Git repository
5. **Validation**: Run full test suite to verify functionality
6. **Traffic Restoration**: Gradually restore production traffic

### RTO/RPO Targets

- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Availability Target**: 99.9% uptime
- **Data Loss Tolerance**: Maximum 1 hour of data loss

## Security Considerations

### Network Security

- **VPC**: Deployed in private subnets
- **Security Groups**: Restrictive ingress/egress rules
- **TLS**: All communication encrypted in transit
- **WAF**: Web Application Firewall for external traffic

### Container Security

- **Base Images**: Regularly updated and scanned
- **Vulnerability Scanning**: Automated scanning in CI/CD
- **Runtime Security**: Container runtime monitoring
- **Secrets Management**: Kubernetes secrets with encryption at rest

### Access Control

- **RBAC**: Role-based access control for Kubernetes
- **Service Accounts**: Dedicated service accounts with minimal permissions
- **API Authentication**: All API calls require valid authentication
- **Audit Logging**: Comprehensive audit trail for all operations