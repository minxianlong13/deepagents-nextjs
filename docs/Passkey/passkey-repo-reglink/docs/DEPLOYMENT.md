# Deployment

## Infrastructure

### Cloud Platform
- **Provider**: Amazon Web Services (AWS)
- **Orchestration**: Kubernetes (EKS - Elastic Kubernetes Service)
- **Container Registry**: Amazon ECR (Elastic Container Registry)
- **Load Balancing**: AWS Application Load Balancer (ALB)
- **DNS**: Amazon Route 53

### Kubernetes Architecture
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-reglink-service
  namespace: passkey
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-reglink-service
  template:
    metadata:
      labels:
        app: passkey-reglink-service
        version: v1.16.1
    spec:
      containers:
      - name: passkey-reglink-service
        image: cvent/passkey-reglink-service:1.16.1
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: admin
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## Environments

### Development (dev)
- **Purpose**: Local development and initial testing
- **URL**: `https://passkey-reglink-service.dev.cvent.com`
- **Replicas**: 1
- **Resources**: 
  - Memory: 512Mi request, 1Gi limit
  - CPU: 100m request, 250m limit
- **Database**: Shared development instances
- **Monitoring**: Basic logging and metrics
- **Authentication**: Relaxed for development ease

### Alpha Testing (alpha)
- **Purpose**: Integration testing and feature validation
- **URL**: `https://passkey-reglink-service.alpha.cvent.com`
- **Replicas**: 2
- **Resources**:
  - Memory: 512Mi request, 1Gi limit
  - CPU: 250m request, 500m limit
- **Database**: Dedicated alpha instances
- **Monitoring**: Full monitoring stack enabled
- **Authentication**: Production-like authentication

### Pre-Production (pr50)
- **Purpose**: Production readiness validation and load testing
- **URL**: `https://passkey-reglink-service.pr50.cvent.com`
- **Replicas**: 3
- **Resources**:
  - Memory: 1Gi request, 2Gi limit
  - CPU: 500m request, 1000m limit
- **Database**: Production-equivalent instances
- **Monitoring**: Full production monitoring
- **Authentication**: Production authentication

### Production (prod)
- **Purpose**: Live production environment
- **URL**: `https://passkey-reglink-service.prod.cvent.com`
- **Replicas**: 5 (with auto-scaling)
- **Resources**:
  - Memory: 1Gi request, 2Gi limit
  - CPU: 500m request, 1000m limit
- **Database**: High-availability production instances
- **Monitoring**: Comprehensive monitoring and alerting
- **Authentication**: Full production security

## CI/CD Pipeline

### Jenkins Pipeline
**Location**: [Jenkins Job](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-reglink)

### Pipeline Stages

#### 1. Source Code Checkout
```groovy
stage('Checkout') {
    steps {
        checkout scm
        script {
            env.GIT_COMMIT_SHORT = sh(
                script: "git rev-parse --short HEAD",
                returnStdout: true
            ).trim()
        }
    }
}
```

#### 2. Build & Test
```groovy
stage('Build & Test') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'mvn clean test -Pcoverage'
                publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
                publishCoverage adapters: [jacocoAdapter('**/target/site/jacoco/jacoco.xml')]
            }
        }
        stage('Static Analysis') {
            steps {
                sh 'mvn checkstyle:check spotbugs:check'
                recordIssues enabledForFailure: true, tools: [
                    checkStyle(),
                    spotBugs()
                ]
            }
        }
    }
}
```

#### 3. Package
```groovy
stage('Package') {
    steps {
        sh 'mvn package -Prelease -DskipTests'
        archiveArtifacts artifacts: '**/target/*.jar', fingerprint: true
    }
}
```

#### 4. Docker Build
```groovy
stage('Docker Build') {
    steps {
        script {
            def image = docker.build("cvent/passkey-reglink-service:${env.GIT_COMMIT_SHORT}")
            docker.withRegistry('https://ecr.amazonaws.com/cvent', 'ecr-credentials') {
                image.push()
                image.push('latest')
            }
        }
    }
}
```

#### 5. Deploy to Environments
```groovy
stage('Deploy') {
    parallel {
        stage('Deploy to Dev') {
            when { branch 'develop' }
            steps {
                sh 'kubectl apply -f k8s/dev/ --namespace=passkey-dev'
                sh 'kubectl rollout status deployment/passkey-reglink-service -n passkey-dev'
            }
        }
        stage('Deploy to Alpha') {
            when { branch 'master' }
            steps {
                sh 'kubectl apply -f k8s/alpha/ --namespace=passkey-alpha'
                sh 'kubectl rollout status deployment/passkey-reglink-service -n passkey-alpha'
            }
        }
    }
}
```

#### 6. Integration Tests
```groovy
stage('Integration Tests') {
    when { anyOf { branch 'develop'; branch 'master' } }
    steps {
        sh 'mvn verify -Prun-it -Dkarate.env=${BRANCH_NAME == "master" ? "alpha" : "dev"}'
        publishTestResults testResultsPattern: '**/target/karate-reports/*.xml'
    }
}
```

### Deployment Triggers
- **Automatic**: Commits to `develop` → dev environment
- **Automatic**: Commits to `master` → alpha environment
- **Manual**: Promotion to pr50 environment (via Jenkins job)
- **Manual**: Promotion to production (via Jenkins job with approvals)

## Configuration Management

### Kubernetes ConfigMaps
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: passkey-reglink-config
  namespace: passkey
data:
  application.yaml: |
    server:
      applicationConnectors:
        - type: http
          port: 8080
    logging:
      level: INFO
    clients:
      bridgeService:
        baseUrl: "https://passkey-bridge-service.${ENV}.cvent.com"
```

### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: passkey-reglink-secrets
  namespace: passkey
type: Opaque
data:
  auth-service-key: <base64-encoded-key>
  database-password: <base64-encoded-password>
```

### Helm Charts
```yaml
# values.yaml
replicaCount: 3
image:
  repository: cvent/passkey-reglink-service
  tag: "1.16.1"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8080
  adminPort: 8081

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
  hosts:
    - host: passkey-reglink-service.prod.cvent.com
      paths: ["/"]

resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### Environment-Specific Configurations

#### Development
```yaml
# k8s/dev/kustomization.yaml
resources:
  - ../base
patchesStrategicMerge:
  - deployment-patch.yaml
configMapGenerator:
  - name: passkey-reglink-config
    files:
      - application.yaml=configs/dev.yaml
```

#### Production
```yaml
# k8s/prod/kustomization.yaml
resources:
  - ../base
patchesStrategicMerge:
  - deployment-patch.yaml
  - hpa-patch.yaml
configMapGenerator:
  - name: passkey-reglink-config
    files:
      - application.yaml=configs/prod.yaml
```

## Monitoring & Alerting

### Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /healthcheck
    port: 8081
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /healthcheck
    port: 8081
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

### Datadog Integration
- **APM**: [Service Dashboard](https://cvent.datadoghq.com/apm/services/passkey-reglink-service/operations)
- **Logs**: [Log Explorer](https://cvent.datadoghq.com/logs?query=env%3Apr50+service%3Apasskey-reglink-service)
- **Metrics**: Custom business metrics and infrastructure metrics
- **Alerts**: Automated alerting for errors, latency, and availability

### Prometheus Metrics
```yaml
# ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: passkey-reglink-service
spec:
  selector:
    matchLabels:
      app: passkey-reglink-service
  endpoints:
  - port: admin
    path: /metrics
    interval: 30s
```

## Rollback Procedures

### Kubernetes Rollback
```bash
# Check rollout history
kubectl rollout history deployment/passkey-reglink-service -n passkey

# Rollback to previous version
kubectl rollout undo deployment/passkey-reglink-service -n passkey

# Rollback to specific revision
kubectl rollout undo deployment/passkey-reglink-service --to-revision=2 -n passkey

# Check rollback status
kubectl rollout status deployment/passkey-reglink-service -n passkey
```

### Blue-Green Deployment
```bash
# Deploy new version to green environment
kubectl apply -f k8s/green/ --namespace=passkey

# Verify green deployment health
kubectl get pods -l version=green -n passkey

# Switch traffic to green
kubectl patch service passkey-reglink-service -p '{"spec":{"selector":{"version":"green"}}}' -n passkey

# Monitor for issues, rollback if needed
kubectl patch service passkey-reglink-service -p '{"spec":{"selector":{"version":"blue"}}}' -n passkey
```

### Database Rollback (if applicable)
```bash
# Backup current state
kubectl exec -it postgres-pod -- pg_dump passkey_reglink > backup.sql

# Restore from previous backup
kubectl exec -i postgres-pod -- psql passkey_reglink < previous_backup.sql
```

## Disaster Recovery

### Backup Strategy
- **Application State**: Stateless application, no backup required
- **Configuration**: Stored in Git repositories
- **Logs**: Retained in Datadog for 30 days
- **Metrics**: Retained in monitoring systems

### Recovery Procedures

#### Complete Environment Rebuild
1. **Infrastructure**: Recreate Kubernetes cluster
2. **Networking**: Restore load balancers and DNS
3. **Application**: Deploy from latest known good image
4. **Configuration**: Apply configurations from Git
5. **Verification**: Run health checks and integration tests

#### Service Recovery
1. **Identify Issue**: Check monitoring dashboards and logs
2. **Isolate Problem**: Determine if issue is service-specific or infrastructure
3. **Apply Fix**: Deploy hotfix or rollback to previous version
4. **Verify Recovery**: Confirm service health and functionality
5. **Post-Mortem**: Document incident and lessons learned

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 15 minutes for service restoration
- **Recovery Point Objective (RPO)**: 0 minutes (stateless service)

## Security Considerations

### Network Security
- **VPC**: Services deployed in private VPC subnets
- **Security Groups**: Restrictive ingress/egress rules
- **TLS**: All external communication encrypted with TLS 1.2+
- **Internal Communication**: Service mesh with mTLS

### Container Security
- **Base Images**: Minimal, regularly updated base images
- **Vulnerability Scanning**: Automated container image scanning
- **Runtime Security**: Container runtime monitoring
- **Secrets Management**: Kubernetes secrets with encryption at rest

### Access Control
- **RBAC**: Kubernetes role-based access control
- **Service Accounts**: Dedicated service accounts with minimal permissions
- **API Authentication**: Bearer token authentication for all endpoints
- **Audit Logging**: Comprehensive audit trail for all operations

## Performance Tuning

### JVM Tuning
```yaml
env:
  - name: JAVA_OPTS
    value: "-Xms1g -Xmx1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### Kubernetes Resource Optimization
```yaml
resources:
  requests:
    memory: "1Gi"      # Guaranteed memory
    cpu: "500m"        # Guaranteed CPU
  limits:
    memory: "2Gi"      # Maximum memory
    cpu: "1000m"       # Maximum CPU
```

### Auto-scaling Configuration
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: passkey-reglink-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: passkey-reglink-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```