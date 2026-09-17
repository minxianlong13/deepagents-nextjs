# Deployment

## Infrastructure

### Container Platform
- **Platform**: Amazon ECS (Elastic Container Service)
- **Container Runtime**: Docker
- **Base Image**: `docker.cvent.net/cvent-jre:11.0.4.11`
- **Registry**: Cvent Docker Registry (`docker.cvent.net`)

### AWS Services
- **Compute**: ECS Fargate tasks
- **Load Balancing**: Application Load Balancer (ALB)
- **Service Discovery**: AWS Cloud Map
- **Networking**: VPC with private subnets
- **Security**: IAM roles and security groups

### Infrastructure as Code
- **Tool**: Hogan Templates
- **Configuration Directory**: `passkey-core-mapper-service/configs`
- **Template Management**: Centralized configuration management
- **Environment-specific**: Separate configs per environment

## Environments

### Development (Alpha)
- **Environment Code**: `alpha`
- **Branch**: `development`
- **URL**: `https://passkey-core-mapper-service.alpha.cvent.net`
- **Purpose**: Feature development and initial testing
- **Auto-deploy**: Yes, on development branch commits
- **Resources**: 
  - CPU: 0.5 vCPU
  - Memory: 1 GB
  - Instances: 1

### Test Environment (TS50)
- **Environment Code**: `ts50`
- **Branch**: `master`
- **URL**: `https://passkey-core-mapper-service.ts50.cvent.net`
- **Purpose**: Integration testing and QA validation
- **Auto-deploy**: Yes, on master branch commits
- **Resources**:
  - CPU: 1 vCPU
  - Memory: 2 GB
  - Instances: 2

### Integration Environment (IT50)
- **Environment Code**: `it50`
- **Branch**: `master`
- **URL**: `https://passkey-core-mapper-service.it50.cvent.net`
- **Purpose**: End-to-end integration testing
- **Auto-deploy**: Yes, on master branch commits
- **Resources**:
  - CPU: 1 vCPU
  - Memory: 2 GB
  - Instances: 2

### Staging Environment (SG50)
- **Environment Code**: `sg50`
- **Branch**: `master`
- **URL**: `https://passkey-core-mapper-service.sg50.cvent.net`
- **Purpose**: Pre-production validation and performance testing
- **Auto-deploy**: Yes, on master branch commits
- **Resources**:
  - CPU: 2 vCPU
  - Memory: 4 GB
  - Instances: 3

### Production Environment (PR50)
- **Environment Code**: `pr50`
- **Branch**: `master` (manual promotion)
- **URL**: `https://passkey-core-mapper-service.pr50.cvent.net`
- **Purpose**: Live production traffic
- **Auto-deploy**: No, manual promotion required
- **Resources**:
  - CPU: 4 vCPU
  - Memory: 8 GB
  - Instances: 5+ (auto-scaling enabled)

## CI/CD Pipeline

### Jenkins Pipeline
- **Pipeline File**: `Jenkinsfile`
- **Pipeline Type**: Dropwizard Pipeline (Cvent standard)
- **Executor**: `ecs-x86-medium`
- **Pipeline Library**: `pipeline-utils`

### Build Stages

#### 1. Source Code Checkout
```groovy
// Automatic checkout from GitHub
// Branch-specific triggers configured
```

#### 2. Build and Test
```bash
# Maven build with tests
mvn clean package -Prelease

# Code quality checks
mvn checkstyle:check
mvn spotbugs:check
```

#### 3. Security Scanning
- **Checkmarx**: Static application security testing (SAST)
- **WhiteSource**: Dependency vulnerability scanning
- **Branch**: `master` only

#### 4. Docker Image Build
```dockerfile
FROM docker.cvent.net/maven:cvent-maven as builder
WORKDIR /usr/src/app
COPY . .
RUN mvn clean package -Prelease

FROM docker.cvent.net/cvent-jre:11.0.4.11
ENV SERVICE "passkey-core-mapper-service"
WORKDIR /usr/src
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" ./
CMD ["java", "-jar", "passkey-core-mapper-service-1.0.0-SNAPSHOT.jar", "server", "configs/dev.yaml"]
```

#### 5. Integration Testing
```bash
# Karate integration tests
mvn -Prun-it -Dkarate.env=dev verify
```

#### 6. Deployment
- **Alpha**: Automatic on `development` branch
- **Test Environments**: Automatic on `master` branch
- **Production**: Manual promotion required

### Branch Strategy

#### Development Branch
- **Purpose**: Feature development
- **Deployment**: Alpha environment only
- **Protection**: None
- **Merge**: Pull request to master

#### Master Branch
- **Purpose**: Release candidate
- **Deployment**: All non-production environments
- **Protection**: Required pull request reviews
- **Merge**: Squash and merge from development

#### Release Tags
- **Format**: `v{major}.{minor}.{patch}`
- **Example**: `v1.16.1`
- **Trigger**: Manual tag creation
- **Action**: Production deployment candidate

## Configuration Management

### Hogan Templates
Configuration files are managed through Hogan templates system:

```yaml
# Template structure
passkey-core-mapper-service/
├── configs/
│   ├── alpha.yaml
│   ├── ts50.yaml
│   ├── it50.yaml
│   ├── sg50.yaml
│   └── pr50.yaml
```

### Environment-Specific Configuration

#### Alpha Environment
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
      
logging:
  level: DEBUG
  
clients:
  passkeyHotelService:
    url: https://passkey-hotel-service.alpha.cvent.net
  passkeyAddonsService:
    url: https://passkey-addons-service.alpha.cvent.net
```

#### Production Environment
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
      
logging:
  level: INFO
  
clients:
  passkeyHotelService:
    url: https://passkey-hotel-service.pr50.cvent.net
  passkeyAddonsService:
    url: https://passkey-addons-service.pr50.cvent.net
    
# Production-specific settings
datadog:
  enabled: true
  apiKey: ${DATADOG_API_KEY}
```

### Secret Management
- **AWS Secrets Manager**: Database credentials, API keys
- **Environment Variables**: Non-sensitive configuration
- **Hogan Integration**: Automatic secret injection

## Deployment Process

### Automatic Deployment (Non-Production)

1. **Code Commit**: Developer pushes to development/master branch
2. **Pipeline Trigger**: Jenkins pipeline automatically starts
3. **Build & Test**: Code compilation and test execution
4. **Image Build**: Docker image created and pushed to registry
5. **Deployment**: ECS service updated with new image
6. **Health Check**: Deployment verified through health endpoints
7. **Notification**: Slack notification sent to #passkey-api channel

### Manual Production Deployment

1. **Release Preparation**: Create release tag from master branch
2. **Approval Process**: Technical lead approval required
3. **Deployment Window**: Scheduled during maintenance window
4. **Blue-Green Deployment**: Zero-downtime deployment strategy
5. **Monitoring**: Enhanced monitoring during deployment
6. **Rollback Plan**: Immediate rollback capability if issues detected

### Deployment Commands

#### Manual Deployment (Emergency)
```bash
# Build and deploy specific version
jenkins-cli build passkey-core-mapper \
  -p BRANCH=master \
  -p ENVIRONMENT=pr50 \
  -p VERSION=1.16.1

# Deploy specific Docker image
aws ecs update-service \
  --cluster passkey-pr50 \
  --service passkey-core-mapper-service \
  --task-definition passkey-core-mapper-service:123
```

#### Rollback Procedure
```bash
# Rollback to previous version
aws ecs update-service \
  --cluster passkey-pr50 \
  --service passkey-core-mapper-service \
  --task-definition passkey-core-mapper-service:122

# Verify rollback
curl -f https://passkey-core-mapper-service.pr50.cvent.net/healthcheck
```

## Monitoring and Alerting

### Health Checks
- **Application Health**: `/healthcheck` endpoint
- **ECS Health**: Container health monitoring
- **ALB Health**: Load balancer health checks
- **Frequency**: Every 30 seconds

### Datadog Integration
```yaml
# Datadog configuration
datadog:
  serviceName: passkey-core-mapper-service
  environment: ${ENVIRONMENT}
  tags:
    - service:passkey-core-mapper
    - team:meeseeksbox
    - platform:passkey
```

### Alerts Configuration
- **High Error Rate**: >5% error rate for 5 minutes
- **High Latency**: >2s average response time for 5 minutes
- **Service Down**: Health check failures for 2 minutes
- **Memory Usage**: >80% memory utilization for 10 minutes

### Slack Notifications
```groovy
slack: [
    [branch: 'PR-.*', branch_type: 'SOURCE', channel: '_owner_', events: ['START', 'SUCCESS', 'FAILURE']],
    [branch: 'master', channel: 'passkey-api', events: ['START', 'SUCCESS', 'FAILURE']]
]
```

## Scaling Configuration

### Auto Scaling
- **Metric**: CPU utilization and request count
- **Target**: 70% CPU utilization
- **Scale Out**: Add instance when CPU > 70% for 2 minutes
- **Scale In**: Remove instance when CPU < 30% for 5 minutes
- **Min Instances**: 2 (production), 1 (non-production)
- **Max Instances**: 10 (production), 3 (non-production)

### Load Balancing
- **Algorithm**: Round robin
- **Health Check**: HTTP GET /healthcheck
- **Healthy Threshold**: 2 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures
- **Timeout**: 5 seconds
- **Interval**: 30 seconds

## Disaster Recovery

### Backup Strategy
- **Configuration**: Stored in Git repository
- **Application State**: Stateless service, no backup required
- **Dependencies**: External services handle their own backup

### Recovery Procedures

#### Service Failure
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Determine scope and impact
3. **Mitigation**: Auto-scaling or manual intervention
4. **Resolution**: Fix underlying issue
5. **Post-mortem**: Document lessons learned

#### Regional Failure
1. **Failover**: Manual failover to backup region
2. **DNS Update**: Route traffic to backup region
3. **Service Restart**: Deploy service in backup region
4. **Monitoring**: Enhanced monitoring during recovery

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 15 minutes
- **Recovery Point Objective (RPO)**: 0 (stateless service)

## Security

### Network Security
- **VPC**: Private subnets for ECS tasks
- **Security Groups**: Restrictive inbound/outbound rules
- **ALB**: Public-facing with SSL termination
- **Service Mesh**: Encrypted service-to-service communication

### Application Security
- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **Input Validation**: Request validation and sanitization
- **Output Encoding**: Response encoding to prevent XSS

### Compliance
- **SOC 2**: Compliance with SOC 2 Type II requirements
- **PCI DSS**: Payment card data handling compliance
- **GDPR**: Data privacy and protection compliance