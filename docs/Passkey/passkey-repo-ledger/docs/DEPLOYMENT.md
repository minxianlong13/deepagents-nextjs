# Deployment

## Infrastructure

### AWS Architecture
The Passkey Ledger Service is deployed on AWS using a containerized microservices architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Load Balancer                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    ECS Fargate Cluster                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Service A     │  │   Service B     │  │  Service C   │ │
│  │  (AZ-1a)        │  │  (AZ-1b)        │  │  (AZ-1c)     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    RDS Oracle Database                      │
│              (Multi-AZ with Read Replicas)                  │
└─────────────────────────────────────────────────────────────┘
```

### Container Platform
- **Container Orchestration**: Amazon ECS with Fargate
- **Service Discovery**: AWS Cloud Map
- **Load Balancing**: Application Load Balancer (ALB)
- **Auto Scaling**: ECS Service Auto Scaling based on CPU/memory metrics

### Database Infrastructure
- **Primary Database**: Amazon RDS Oracle Enterprise Edition
- **High Availability**: Multi-AZ deployment for automatic failover
- **Read Replicas**: Cross-region read replicas for disaster recovery
- **Backup Strategy**: Automated daily backups with 30-day retention

### Networking
- **VPC**: Dedicated Virtual Private Cloud with private subnets
- **Security Groups**: Restrictive ingress/egress rules
- **NAT Gateway**: Outbound internet access for private subnets
- **VPC Endpoints**: Direct access to AWS services without internet routing

## Environments

### Development (dev)
- **Purpose**: Local development and initial testing
- **Infrastructure**: 
  - Single ECS task with minimal resources
  - RDS instance: db.t3.micro
  - No load balancer (direct task access)
- **Configuration**:
  - Debug logging enabled
  - Relaxed security settings
  - Mock external services where possible
- **Access**: VPN required for database access
- **URL**: `https://passkey-ledger-service.dev.cvent.org`

### Staging (staging)
- **Purpose**: Pre-production testing and validation
- **Infrastructure**:
  - 2 ECS tasks across multiple AZs
  - RDS instance: db.t3.small with read replica
  - Application Load Balancer
- **Configuration**:
  - Production-like settings
  - Real external service integrations
  - Performance monitoring enabled
- **Access**: Internal network access only
- **URL**: `https://passkey-ledger-service.staging.cvent.org`

### Production (prod)
- **Purpose**: Live production workloads
- **Infrastructure**:
  - 4+ ECS tasks across 3 AZs
  - RDS instance: db.r5.xlarge with Multi-AZ
  - Multiple read replicas
  - Auto Scaling enabled
- **Configuration**:
  - Optimized performance settings
  - Full monitoring and alerting
  - Enhanced security controls
- **Access**: Highly restricted, audit logged
- **URL**: `https://passkey-ledger-service.prod.cvent.org`

## CI/CD Pipeline

### Jenkins Pipeline Overview
The deployment pipeline is managed through Jenkins with the following stages:

```groovy
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
                        sh 'mvn -Prun-it verify'
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'mvn dependency-check:check'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t passkey-ledger:${BUILD_NUMBER} .'
            }
        }
        
        stage('Deploy to Staging') {
            steps {
                deployToECS('staging', 'passkey-ledger:${BUILD_NUMBER}')
            }
        }
        
        stage('Smoke Tests') {
            steps {
                runSmokeTests('staging')
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'master'
            }
            steps {
                input 'Deploy to Production?'
                deployToECS('production', 'passkey-ledger:${BUILD_NUMBER}')
            }
        }
    }
}
```

### Build Process
1. **Source Code Checkout**: Latest code from GitHub
2. **Dependency Resolution**: Maven downloads dependencies from Nexus
3. **Compilation**: Java source code compilation with Java 17
4. **Unit Testing**: JUnit tests execution with coverage reporting
5. **Integration Testing**: Karate-based API tests against test environment
6. **Security Scanning**: Dependency vulnerability scanning
7. **Artifact Creation**: JAR file and Docker image creation

### Deployment Stages
1. **Staging Deployment**: Automatic deployment on successful build
2. **Smoke Testing**: Basic functionality verification
3. **Production Approval**: Manual approval gate for production deployment
4. **Production Deployment**: Blue-green deployment with health checks
5. **Post-Deployment Verification**: Comprehensive health and functionality checks

### Docker Image Build
```dockerfile
# Multi-stage build for optimized image size
FROM docker.cvent.net/maven:cvent-maven as builder
WORKDIR /usr/src/app
COPY . .
RUN mvn clean package -Prelease

FROM docker.cvent.net/cvent-jre:11.0.4.11
ENV SERVICE "passkey-ledger-service"
WORKDIR /usr/src
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" ./
CMD ["java", "-jar", "passkey-ledger-service-1.0.0-SNAPSHOT.jar", "server", "configs/dev.yaml"]
```

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through a combination of:
- **Base Configuration**: Common settings in `application.yaml`
- **Environment Overrides**: Environment-specific YAML files
- **Environment Variables**: Sensitive data and environment-specific values
- **AWS Parameter Store**: Encrypted configuration parameters

### Configuration Hierarchy
```
1. Default application.yaml
2. Environment-specific YAML (dev.yaml, staging.yaml, prod.yaml)
3. Environment variables
4. AWS Parameter Store values
5. Command-line arguments
```

### Secret Management
- **API Keys**: Stored in AWS Parameter Store with encryption
- **Database Credentials**: AWS Secrets Manager with automatic rotation
- **SSL Certificates**: AWS Certificate Manager
- **Service-to-Service Authentication**: IAM roles and policies

### Configuration Templates (Hogan)
```yaml
# Hogan template for environment-specific configuration
database:
  url: "{{database.url}}"
  user: "{{database.user}}"
  password: "{{database.password}}"

authService:
  baseUrl: "{{auth.service.url}}"
  apiKey: "{{auth.service.apiKey}}"
```

## Deployment Procedures

### Standard Deployment
1. **Pre-Deployment Checklist**:
   - Verify all tests pass
   - Check dependency vulnerabilities
   - Validate configuration changes
   - Ensure database migrations are ready

2. **Deployment Execution**:
   ```bash
   # Trigger Jenkins pipeline
   curl -X POST "https://jenkins.cvent.org/job/passkey-ledger/build"
   
   # Monitor deployment progress
   kubectl get pods -n passkey-ledger
   
   # Verify service health
   curl https://passkey-ledger-service.staging.cvent.org/health
   ```

3. **Post-Deployment Verification**:
   - Health check endpoints
   - Smoke test execution
   - Performance metrics validation
   - Log analysis for errors

### Emergency Deployment
For critical hotfixes:
1. **Fast-Track Pipeline**: Bypass non-critical stages
2. **Direct Production Deployment**: Skip staging for urgent fixes
3. **Immediate Rollback Plan**: Prepared rollback procedure
4. **Enhanced Monitoring**: Increased alerting during emergency deployment

### Blue-Green Deployment
```bash
# Deploy to green environment
aws ecs update-service --cluster passkey-ledger-prod \
  --service passkey-ledger-green \
  --task-definition passkey-ledger:latest

# Health check green environment
./scripts/health-check.sh green

# Switch traffic to green
aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TG_ARN

# Monitor and validate
./scripts/validate-deployment.sh

# Scale down blue environment
aws ecs update-service --cluster passkey-ledger-prod \
  --service passkey-ledger-blue \
  --desired-count 0
```

## Rollback Procedures

### Automatic Rollback Triggers
- Health check failures exceeding threshold
- Error rate above 5% for 5 minutes
- Response time degradation beyond acceptable limits
- Database connection failures

### Manual Rollback Process
1. **Immediate Rollback**:
   ```bash
   # Revert to previous task definition
   aws ecs update-service --cluster passkey-ledger-prod \
     --service passkey-ledger \
     --task-definition passkey-ledger:previous
   
   # Monitor rollback progress
   aws ecs describe-services --cluster passkey-ledger-prod \
     --services passkey-ledger
   ```

2. **Database Rollback** (if required):
   ```bash
   # Execute rollback scripts
   ./scripts/db-rollback.sh --version previous
   
   # Verify data integrity
   ./scripts/verify-db-state.sh
   ```

3. **Configuration Rollback**:
   ```bash
   # Revert configuration changes
   git revert $COMMIT_HASH
   
   # Redeploy with previous configuration
   ./scripts/deploy.sh --config-only
   ```

### Rollback Validation
- Service health verification
- Database integrity checks
- External service connectivity
- Performance metrics validation
- User acceptance testing

## Monitoring and Alerting

### Key Metrics
- **Application Metrics**: Request rate, response time, error rate
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Database Metrics**: Connection count, query performance, lock waits
- **Business Metrics**: Transaction volume, payment success rate

### Alert Thresholds
- **Critical**: Service unavailable, database down, error rate > 10%
- **Warning**: High response time, resource utilization > 80%
- **Info**: Deployment events, configuration changes

### Incident Response
1. **Alert Reception**: PagerDuty notification to on-call engineer
2. **Initial Assessment**: Determine severity and impact
3. **Escalation**: Involve additional team members if needed
4. **Resolution**: Implement fix or rollback
5. **Post-Incident**: Root cause analysis and documentation