# Deployment

## Infrastructure

### Container Platform
- **Runtime**: Docker containers
- **Orchestration**: Kubernetes (EKS)
- **Base Image**: `docker.cvent.net/cvent-jre:11.0.1.13`
- **Registry**: Cvent Docker Registry
- **Networking**: AWS VPC with private subnets

### AWS Services
- **Compute**: Amazon EKS (Elastic Kubernetes Service)
- **Database**: Amazon RDS for Oracle
- **Load Balancing**: Application Load Balancer (ALB)
- **DNS**: Route 53
- **Monitoring**: CloudWatch, X-Ray
- **Secrets**: AWS Secrets Manager
- **Storage**: EBS volumes for persistent storage

## Environments

### Development (dev)
- **Purpose**: Development and testing
- **URL**: `https://passkey-business-text-dev.cvent.com`
- **Database**: Oracle RDS (dev instance)
- **Resources**: 
  - CPU: 0.5 cores
  - Memory: 1GB
  - Replicas: 1
- **Configuration**: `configs/dev.yaml`
- **Logging Level**: DEBUG

### Staging (staging)
- **Purpose**: Pre-production testing and validation
- **URL**: `https://passkey-business-text-staging.cvent.com`
- **Database**: Oracle RDS (staging instance)
- **Resources**:
  - CPU: 1 core
  - Memory: 2GB
  - Replicas: 2
- **Configuration**: `configs/staging.yaml`
- **Logging Level**: INFO

### Production (prod)
- **Purpose**: Live production environment
- **URL**: `https://passkey-business-text.cvent.com`
- **Database**: Oracle RDS (production cluster)
- **Resources**:
  - CPU: 2 cores
  - Memory: 4GB
  - Replicas: 3 (minimum)
- **Configuration**: `configs/prod.yaml`
- **Logging Level**: WARN
- **High Availability**: Multi-AZ deployment

## CI/CD Pipeline

### Jenkins Pipeline
**Location**: `https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-business-text`

#### Pipeline Stages

1. **Checkout**
   - Clone repository from GitHub
   - Checkout specific branch/tag

2. **Build**
   ```bash
   mvn clean compile -Prelease
   ```

3. **Unit Tests**
   ```bash
   mvn test -Pcoverage
   ```

4. **Code Quality**
   ```bash
   mvn checkstyle:check
   mvn sonar:sonar
   ```

5. **Package**
   ```bash
   mvn package -Prelease -DskipTests
   ```

6. **Docker Build**
   ```bash
   docker build -t passkey-business-text:${BUILD_NUMBER} .
   docker tag passkey-business-text:${BUILD_NUMBER} docker.cvent.net/passkey-business-text:${BUILD_NUMBER}
   ```

7. **Integration Tests**
   ```bash
   mvn verify -Prun-it -Dkarate.env=dev
   ```

8. **Docker Push**
   ```bash
   docker push docker.cvent.net/passkey-business-text:${BUILD_NUMBER}
   ```

9. **Deploy to Dev**
   - Automatic deployment to development environment
   - Smoke tests execution

10. **Deploy to Staging**
    - Manual approval required
    - Full regression test suite

11. **Deploy to Production**
    - Manual approval required
    - Blue-green deployment strategy
    - Rollback capability

### Jenkinsfile Configuration
```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.cvent.net'
        SERVICE_NAME = 'passkey-business-text'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean compile -Prelease'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'mvn test -Pcoverage'
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
                            publishCoverage adapters: [jacocoAdapter('**/target/site/jacoco/jacoco.xml')]
                        }
                    }
                }
                
                stage('Code Quality') {
                    steps {
                        sh 'mvn checkstyle:check'
                        sh 'mvn sonar:sonar'
                    }
                }
            }
        }
        
        stage('Package') {
            steps {
                sh 'mvn package -Prelease -DskipTests'
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("${SERVICE_NAME}:${BUILD_NUMBER}")
                    image.tag("${DOCKER_REGISTRY}/${SERVICE_NAME}:${BUILD_NUMBER}")
                    image.tag("${DOCKER_REGISTRY}/${SERVICE_NAME}:latest")
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'mvn verify -Prun-it -Dkarate.env=dev'
            }
        }
        
        stage('Deploy') {
            parallel {
                stage('Deploy to Dev') {
                    steps {
                        deployToEnvironment('dev')
                    }
                }
                
                stage('Deploy to Staging') {
                    when {
                        branch 'master'
                    }
                    steps {
                        input message: 'Deploy to staging?'
                        deployToEnvironment('staging')
                    }
                }
                
                stage('Deploy to Production') {
                    when {
                        tag pattern: 'v\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
                    }
                    steps {
                        input message: 'Deploy to production?'
                        deployToEnvironment('prod')
                    }
                }
            }
        }
    }
}
```

## Configuration Management

### Environment-Specific Configuration

#### Development (dev.yaml)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:oracle:thin:@dev-oracle.cvent.com:1521:DEVDB
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxSize: 10

logging:
  level: DEBUG
  
authService:
  url: https://auth-service-dev.cvent.com
```

#### Staging (staging.yaml)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:oracle:thin:@staging-oracle.cvent.com:1521:STAGINGDB
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxSize: 20

logging:
  level: INFO
  
authService:
  url: https://auth-service-staging.cvent.com
```

#### Production (prod.yaml)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:oracle:thin:@prod-oracle.cvent.com:1521:PRODDB
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxSize: 50
  minSize: 10

logging:
  level: WARN
  
authService:
  url: https://auth-service.cvent.com
```

### Secret Management
- **AWS Secrets Manager**: Database credentials, API keys
- **Kubernetes Secrets**: Service-to-service authentication
- **Environment Variables**: Non-sensitive configuration

### Configuration Injection
```yaml
# Kubernetes ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: passkey-business-text-config
data:
  application.yaml: |
    server:
      applicationConnectors:
        - type: http
          port: 8080
    logging:
      level: INFO
```

## Kubernetes Deployment

### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-business-text
  namespace: passkey
  labels:
    app: passkey-business-text
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-business-text
  template:
    metadata:
      labels:
        app: passkey-business-text
        version: v1
    spec:
      containers:
      - name: passkey-business-text
        image: docker.cvent.net/passkey-business-text:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: admin
        env:
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
          name: passkey-business-text-config
```

### Service Manifest
```yaml
apiVersion: v1
kind: Service
metadata:
  name: passkey-business-text-service
  namespace: passkey
spec:
  selector:
    app: passkey-business-text
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
  name: passkey-business-text-ingress
  namespace: passkey
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
  - host: passkey-business-text.cvent.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: passkey-business-text-service
            port:
              number: 80
```

## Rollback Procedures

### Automated Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/passkey-business-text -n passkey

# Rollback to specific revision
kubectl rollout undo deployment/passkey-business-text --to-revision=2 -n passkey

# Check rollout status
kubectl rollout status deployment/passkey-business-text -n passkey
```

### Manual Rollback Steps
1. **Identify Issue**: Monitor alerts, logs, and metrics
2. **Stop Traffic**: Update load balancer to stop routing traffic
3. **Rollback Deployment**: Use kubectl or Jenkins pipeline
4. **Verify Health**: Check health endpoints and metrics
5. **Restore Traffic**: Gradually restore traffic routing
6. **Post-Incident**: Document issue and create improvement plan

### Database Rollback
```sql
-- Example rollback script
-- Restore from backup if schema changes were made
-- Rollback data changes using transaction logs
BEGIN
    -- Rollback specific changes
    DELETE FROM BUSINESS_TEXT WHERE CREATED_DATE > '2024-01-01';
    COMMIT;
END;
```

## Monitoring and Alerting

### Health Checks
- **Liveness Probe**: `/healthcheck` endpoint
- **Readiness Probe**: Service readiness validation
- **Startup Probe**: Initial startup validation

### Metrics Collection
- **Application Metrics**: Dropwizard metrics
- **Infrastructure Metrics**: Kubernetes metrics
- **Custom Metrics**: Business-specific metrics

### Alerting Rules
```yaml
# Example Prometheus alerting rules
groups:
- name: passkey-business-text
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected
      
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High response time detected
```

### Log Aggregation
- **Fluentd**: Log collection and forwarding
- **Elasticsearch**: Log storage and indexing
- **Kibana**: Log visualization and analysis

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Daily automated backups
- **Configuration Backups**: Version-controlled configurations
- **Container Images**: Immutable image storage

### Recovery Procedures
1. **Assess Damage**: Determine scope of outage
2. **Activate DR Plan**: Follow documented procedures
3. **Restore Services**: Deploy from known good state
4. **Validate Functionality**: Run smoke tests
5. **Monitor Recovery**: Watch metrics and logs
6. **Post-Recovery**: Document lessons learned

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Availability Target**: 99.9% uptime