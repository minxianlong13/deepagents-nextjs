# Deployment

## Infrastructure

### Cloud Platform
- **Provider**: AWS (Amazon Web Services)
- **Container Orchestration**: Kubernetes
- **Service Mesh**: Istio (likely, based on Cvent patterns)
- **Load Balancer**: AWS Application Load Balancer (ALB)
- **DNS**: Route 53

### Container Registry
- **Registry**: Cvent Docker Registry (`docker.cvent.net`)
- **Base Images**: Cvent-maintained JRE images with security patches
- **Image Scanning**: Automated vulnerability scanning

## Environments

### Development Environment
- **URL**: `https://passkey-request-inventory-service-dev.core.cvent.org`
- **Purpose**: Development and feature testing
- **Database**: Development PostgreSQL instance
- **Scaling**: Single instance, auto-scaling disabled
- **Monitoring**: Basic monitoring and logging
- **Configuration**: `configs/dev.yaml`

### Staging Environment
- **URL**: `https://passkey-request-inventory-service-staging.core.cvent.org`
- **Purpose**: Pre-production testing and validation
- **Database**: Staging PostgreSQL with production-like data
- **Scaling**: 2-3 instances, limited auto-scaling
- **Monitoring**: Full monitoring and alerting
- **Configuration**: `configs/staging.yaml`

### Production Environment
- **URL**: `https://passkey-request-inventory-service.core.cvent.org`
- **Purpose**: Live production traffic
- **Database**: Production PostgreSQL cluster with high availability
- **Scaling**: 5+ instances, full auto-scaling enabled
- **Monitoring**: Comprehensive monitoring, alerting, and SLA tracking
- **Configuration**: `configs/prod.yaml`

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The service uses Jenkins for continuous integration and deployment:

```groovy
// Jenkinsfile structure (inferred from file presence)
pipeline {
    agent any
    
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
                        sh 'mvn verify -Prun-it -Dkarate.env=dev'
                    }
                }
            }
        }
        
        stage('Code Quality') {
            steps {
                sh 'mvn sonar:sonar'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t passkey-request-inventory-service:${BUILD_NUMBER} .'
            }
        }
        
        stage('Deploy to Dev') {
            steps {
                // Kubernetes deployment
            }
        }
    }
}
```

### Pipeline Stages

1. **Source Code Checkout**: Pull latest code from GitHub
2. **Build**: Maven compilation and packaging
3. **Unit Testing**: Run JUnit tests with coverage
4. **Integration Testing**: Execute Karate API tests
5. **Code Quality**: SonarQube analysis and quality gates
6. **Security Scanning**: WhiteSource vulnerability scanning
7. **Docker Build**: Create container image
8. **Registry Push**: Push image to Cvent Docker registry
9. **Deployment**: Deploy to target environment

### Build Scripts

#### build-it.sh
```bash
#!/bin/bash
# Standard build script
mvn clean package -Prelease
```

#### build-load.sh
```bash
#!/bin/bash
# Load test build
mvn clean verify -Prun-load
```

#### dropkick.sh
```bash
#!/bin/bash
# Deployment script
# Handles environment-specific deployments
```

#### dropkick_docker.sh
```bash
#!/bin/bash
# Docker-based deployment
# Manages container deployments to Kubernetes
```

## Configuration Management

### Hogan Templates

Configuration is managed through Hogan template system:

```yaml
# Template structure in configs/ directory
configs/
├── dev.yaml.hogan          # Development template
├── staging.yaml.hogan      # Staging template
├── prod.yaml.hogan         # Production template
└── local.yaml              # Local development (no template)
```

### Environment-Specific Values

```yaml
# Example template with environment variables
database:
  url: jdbc:postgresql://{{DB_HOST}}:{{DB_PORT}}/{{DB_NAME}}
  user: {{DB_USER}}
  password: {{DB_PASSWORD}}

auth:
  serviceUrl: {{AUTH_SERVICE_URL}}
  
logging:
  level: {{LOG_LEVEL}}
```

### Secret Management

- **AWS Secrets Manager**: Production secrets storage
- **Kubernetes Secrets**: Environment-specific secret injection
- **Hogan Integration**: Secure template value resolution
- **Rotation**: Automated secret rotation policies

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-request-inventory-service
  namespace: passkey
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-request-inventory-service
  template:
    metadata:
      labels:
        app: passkey-request-inventory-service
    spec:
      containers:
      - name: service
        image: docker.cvent.net/passkey-request-inventory-service:latest
        ports:
        - containerPort: 8080
        - containerPort: 8081
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: host
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
  name: passkey-request-inventory-service
  namespace: passkey
spec:
  selector:
    app: passkey-request-inventory-service
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
  name: passkey-request-inventory-service
  namespace: passkey
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
spec:
  rules:
  - host: passkey-request-inventory-service.core.cvent.org
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: passkey-request-inventory-service
            port:
              number: 80
```

## Auto-Scaling Configuration

### Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: passkey-request-inventory-service-hpa
  namespace: passkey
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: passkey-request-inventory-service
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

### Scaling Policies

- **Development**: No auto-scaling, single instance
- **Staging**: 2-3 instances, limited scaling
- **Production**: 5-10 instances based on load
- **Scale-up**: Aggressive scaling for traffic spikes
- **Scale-down**: Conservative scaling to maintain availability

## Database Deployment

### PostgreSQL Configuration

```yaml
# Database cluster configuration
database:
  engine: PostgreSQL 13+
  instanceClass: db.r5.xlarge (production)
  multiAZ: true (production)
  backupRetention: 7 days
  encryption: enabled
  
# Connection settings
connection:
  maxConnections: 100
  sharedBuffers: 256MB
  effectiveCacheSize: 1GB
```

### Migration Strategy

1. **Schema Migrations**: Liquibase-managed database changes
2. **Backward Compatibility**: Maintain compatibility during deployments
3. **Blue-Green Deployment**: Zero-downtime database updates
4. **Rollback Plan**: Automated rollback for failed migrations

## Monitoring & Alerting

### Health Checks

```yaml
# Kubernetes health check configuration
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
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Datadog Integration

- **APM Tracing**: Distributed tracing across service calls
- **Custom Metrics**: Business-specific metrics collection
- **Log Aggregation**: Centralized log collection and analysis
- **Alerting**: Automated alerts for SLA violations

### Alert Configuration

```yaml
# Example alert rules
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: High Response Time
    condition: p95_response_time > 2s
    duration: 10m
    severity: warning
    
  - name: Low Availability
    condition: availability < 99.9%
    duration: 1m
    severity: critical
```

## Rollback Procedures

### Automated Rollback

1. **Health Check Failure**: Automatic rollback on failed health checks
2. **Error Rate Threshold**: Rollback when error rates exceed limits
3. **Performance Degradation**: Rollback on response time increases

### Manual Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/passkey-request-inventory-service -n passkey

# Rollback to specific revision
kubectl rollout undo deployment/passkey-request-inventory-service --to-revision=2 -n passkey

# Check rollout status
kubectl rollout status deployment/passkey-request-inventory-service -n passkey
```

### Database Rollback

1. **Schema Rollback**: Liquibase rollback commands
2. **Data Restoration**: Point-in-time recovery from backups
3. **Validation**: Post-rollback data integrity checks

## Disaster Recovery

### Backup Strategy

- **Database Backups**: Automated daily backups with 30-day retention
- **Configuration Backups**: Version-controlled configuration templates
- **Application Artifacts**: Immutable container images in registry

### Recovery Procedures

1. **Service Recovery**: Redeploy from known-good container image
2. **Database Recovery**: Restore from backup with minimal data loss
3. **Configuration Recovery**: Restore from version control
4. **Validation**: Comprehensive testing after recovery

### RTO/RPO Targets

- **Recovery Time Objective (RTO)**: 15 minutes
- **Recovery Point Objective (RPO)**: 1 hour
- **Availability Target**: 99.9% uptime
- **Data Loss Tolerance**: Maximum 1 hour of transactions