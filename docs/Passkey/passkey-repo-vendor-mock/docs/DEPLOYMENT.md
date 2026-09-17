# Deployment

## Infrastructure

### Container Platform
The service is deployed on **AWS ECS (Elastic Container Service)** using Docker containers with the following infrastructure components:

- **Container Orchestration**: AWS ECS with Fargate
- **Load Balancing**: Application Load Balancer (ALB)
- **Service Discovery**: AWS Cloud Map
- **Networking**: VPC with private subnets
- **Security**: IAM roles and security groups

### AWS Services
- **ECS Fargate**: Serverless container hosting
- **ALB**: HTTP/HTTPS load balancing
- **CloudWatch**: Logging and monitoring
- **Parameter Store**: Configuration management
- **ECR**: Container image registry
- **Route 53**: DNS management

## Environments

### Development (dev)
- **Purpose**: Local development and testing
- **Infrastructure**: Local Docker containers
- **Configuration**: `configs/dev.yaml`
- **Ports**: 7000 (app), 7001 (admin)
- **Database**: In-memory only
- **Monitoring**: Local metrics only

**Access**:
- Application: `http://localhost:7000`
- Admin: `http://localhost:7001`
- Health Check: `http://localhost:7000/health`

### Alpha (alpha)
- **Purpose**: Early integration testing
- **Infrastructure**: AWS ECS Fargate
- **Configuration**: `configs/alpha.properties`
- **Scaling**: 1-2 tasks
- **Resources**: 0.5 vCPU, 1GB RAM

**Access**:
- Application: `https://passkey-vendor-mock-alpha.cvent.net`
- Admin: `https://passkey-vendor-mock-alpha.cvent.net:7001`

### Test Environment (ts50)
- **Purpose**: QA testing and validation
- **Infrastructure**: AWS ECS Fargate
- **Configuration**: `configs/ts50.properties`
- **Scaling**: 2-4 tasks
- **Resources**: 1 vCPU, 2GB RAM

**Access**:
- Application: `https://passkey-vendor-mock-ts50.cvent.net`
- Admin: `https://passkey-vendor-mock-ts50.cvent.net:7001`

### Integration Testing (it50)
- **Purpose**: Integration test automation
- **Infrastructure**: AWS ECS Fargate
- **Configuration**: `configs/it50.properties`
- **Scaling**: 2-4 tasks
- **Resources**: 1 vCPU, 2GB RAM

**Access**:
- Application: `https://passkey-vendor-mock-it50.cvent.net`
- Admin: `https://passkey-vendor-mock-it50.cvent.net:7001`

### Staging (sg50)
- **Purpose**: Pre-production validation
- **Infrastructure**: AWS ECS Fargate
- **Configuration**: `configs/sg50.properties`
- **Scaling**: 2-6 tasks
- **Resources**: 1 vCPU, 2GB RAM
- **High Availability**: Multi-AZ deployment

**Access**:
- Application: `https://passkey-vendor-mock-sg50.cvent.net`
- Admin: `https://passkey-vendor-mock-sg50.cvent.net:7001`

### Production (pr50)
- **Purpose**: Production workloads
- **Infrastructure**: AWS ECS Fargate
- **Configuration**: `configs/pr50.properties`
- **Scaling**: 4-10 tasks (auto-scaling enabled)
- **Resources**: 2 vCPU, 4GB RAM
- **High Availability**: Multi-AZ deployment
- **Monitoring**: Full Datadog APM and alerting

**Access**:
- Application: `https://passkey-vendor-mock.cvent.net`
- Admin: `https://passkey-vendor-mock.cvent.net:7001`

### Production Secondary (pr51)
- **Purpose**: Production backup/DR
- **Infrastructure**: AWS ECS Fargate
- **Configuration**: `configs/pr51.properties`
- **Scaling**: 2-6 tasks
- **Resources**: 2 vCPU, 4GB RAM

## CI/CD Pipeline

### Jenkins Pipeline Configuration
The deployment pipeline is defined in `Jenkinsfile` using the Cvent Dropwizard pipeline library:

```groovy
dropwizardPipeline([
  label: 'ecs-x86-medium',
  changesets: true,
  
  release: [
    branch: 'master'
  ],
  
  checkmarx: [
    branch: 'master',
    syncMode: false,
    teamPath: 'CxServer\\SAST\\Cvent\\Passkey',
    presetValue: '100011'
  ],
  
  ci: [
    builds: [
      [ branch: '.*', environments: 'ci' ]
    ]
  ],
  
  builds: [
    [ branch: 'development', environments: 'alpha' ],
    [ branch: 'master', environments: ['ts50', 'it50', 'sg50'] ]
  ]
])
```

### Pipeline Stages

#### 1. Source Control
- **Trigger**: Git push to monitored branches
- **Repository**: `https://github.com/cvent-internal/passkey-vendor-mock`
- **Branches**: 
  - `master` → Production environments
  - `development` → Alpha environment
  - `PR-*` → CI validation

#### 2. Build Stage
```bash
# Maven build with release profile
mvn clean package -Prelease

# Artifacts generated:
# - passkey-vendor-mock-service-{version}.jar
# - passkey-vendor-mock-service-{version}-configs.tar.gz
```

#### 3. Test Stage
```bash
# Unit tests
mvn test

# Integration tests (Karate)
mvn verify -Pit

# Code coverage (JaCoCo)
mvn jacoco:report
```

#### 4. Security Scanning
- **Checkmarx SAST**: Static application security testing
- **Dependency Check**: Vulnerability scanning
- **Container Scanning**: Docker image security analysis

#### 5. Docker Build
```dockerfile
# Multi-stage build
FROM docker.cvent.net/maven:cvent-maven as builder
WORKDIR /usr/src/app
COPY . .
RUN mvn clean package -Prelease

FROM docker.cvent.net/cvent-jre:11.0.4.11
ENV SERVICE "passkey-vendor-mock-service"
WORKDIR /usr/src
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" ./
CMD ["java", "-jar", "passkey-vendor-mock-service-1.0.0-SNAPSHOT.jar", "server", "configs/dev.yaml"]
```

#### 6. Image Registry
- **Registry**: AWS ECR (Elastic Container Registry)
- **Tagging Strategy**:
  - `latest` - Latest master build
  - `{version}` - Semantic version
  - `{branch}-{build}` - Branch-specific builds

#### 7. Deployment
- **Tool**: Cvent's internal deployment system
- **Strategy**: Blue-green deployment
- **Health Checks**: Automated health verification
- **Rollback**: Automatic rollback on health check failure

### Branch Strategy

#### Master Branch
- **Environments**: ts50, it50, sg50, pr50
- **Deployment**: Automatic on successful build
- **Approval**: Required for production (pr50)

#### Development Branch
- **Environments**: alpha
- **Deployment**: Automatic on successful build
- **Purpose**: Early integration testing

#### Feature Branches
- **Environments**: CI only
- **Deployment**: Build and test validation
- **Merge**: Requires PR approval

#### Pull Requests
- **Validation**: Full CI pipeline
- **Notifications**: Slack notifications to team
- **Approval**: Required before merge

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through a combination of:
1. **Base Configuration**: `template.yaml`
2. **Environment Properties**: `{env}.properties`
3. **Runtime Parameters**: AWS Parameter Store
4. **Environment Variables**: Container-level configuration

### Configuration Hierarchy
```
1. Environment Variables (highest priority)
2. AWS Parameter Store
3. Environment Properties Files
4. Base YAML Configuration (lowest priority)
```

### Hogan Templates
Configuration templates are managed through Hogan:
- **Directory**: `passkey-vendor-mock-service/configs`
- **Template Processing**: Automatic parameter substitution
- **Secrets Management**: Secure parameter handling

### Parameter Examples
```yaml
# Base configuration (template.yaml)
asyncTransfer:
  integrationApi:
    endpoint: "${integration.api.endpoint}"
  agilysysUser:
    userName: "${agilysys.username}"
    password: "${agilysys.password}"

# Environment-specific (pr50.properties)
integration.api.endpoint=https://passkey-integration-pr50.cvent.net/
agilysys.username=passkey-integrations.service-pr50.agilysys-user
agilysys.password=passkey-integrations.service-pr50.agilysys-password
```

## Monitoring & Alerting

### Health Checks
```bash
# Application health
curl https://passkey-vendor-mock.cvent.net/health

# Admin health check
curl https://passkey-vendor-mock.cvent.net:7001/healthcheck

# Detailed metrics
curl https://passkey-vendor-mock.cvent.net:7001/metrics
```

### Datadog Integration
- **APM**: Application performance monitoring
- **Logs**: Centralized log aggregation
- **Metrics**: Custom business metrics
- **Alerts**: Automated alerting on errors/performance

### Key Metrics
- **Request Rate**: Requests per second
- **Response Time**: P50, P95, P99 latencies
- **Error Rate**: 4xx/5xx error percentages
- **Throughput**: Successful requests per minute
- **JVM Metrics**: Memory, GC, thread usage

### Alerting Rules
```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 2m
  annotations:
    summary: "High error rate detected"

# High response time
- alert: HighLatency
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1.0
  for: 5m
  annotations:
    summary: "High response time detected"
```

### Slack Notifications
```groovy
slack: [
  [ branch: 'PR-.*', branch_type: 'SOURCE', channel: '_owner_', events: ['START', 'SUCCESS', 'FAILURE']],
  [ branch: 'development|master', channel: 'passkey-api', events: ['START', 'SUCCESS', 'FAILURE']]
]
```

## Rollback Procedures

### Automatic Rollback
- **Health Check Failure**: Automatic rollback within 5 minutes
- **Error Rate Threshold**: Rollback if error rate > 10%
- **Response Time Threshold**: Rollback if P95 > 5 seconds

### Manual Rollback
```bash
# Via Jenkins
1. Navigate to deployment job
2. Select "Rollback" option
3. Choose previous stable version
4. Confirm rollback

# Via AWS Console
1. Access ECS service
2. Update service with previous task definition
3. Monitor deployment progress
```

### Rollback Validation
1. **Health Checks**: Verify service health
2. **Smoke Tests**: Run basic functionality tests
3. **Monitoring**: Confirm metrics return to normal
4. **Notification**: Alert team of rollback completion

## Scaling Configuration

### Auto Scaling
```yaml
# ECS Service Auto Scaling
MinCapacity: 2
MaxCapacity: 10
TargetCPUUtilization: 70%
TargetMemoryUtilization: 80%
ScaleOutCooldown: 300s
ScaleInCooldown: 600s
```

### Manual Scaling
```bash
# Increase capacity
aws ecs update-service \
  --cluster passkey-cluster \
  --service passkey-vendor-mock-service \
  --desired-count 6

# Decrease capacity
aws ecs update-service \
  --cluster passkey-cluster \
  --service passkey-vendor-mock-service \
  --desired-count 2
```

## Disaster Recovery

### Backup Strategy
- **Configuration**: Stored in Git repository
- **Container Images**: Replicated across regions
- **Deployment Scripts**: Version controlled

### Recovery Procedures
1. **Service Failure**: Auto-restart via ECS
2. **AZ Failure**: Traffic routed to healthy AZs
3. **Region Failure**: Manual failover to secondary region
4. **Complete Rebuild**: Deploy from Git repository

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 15 minutes
- **Recovery Point Objective (RPO)**: 0 (stateless service)

## Security

### Network Security
- **VPC**: Private subnets for containers
- **Security Groups**: Restrictive ingress/egress rules
- **ALB**: SSL termination and WAF protection

### Container Security
- **Base Images**: Regularly updated Cvent images
- **Vulnerability Scanning**: Automated image scanning
- **Runtime Security**: Read-only file systems

### Access Control
- **IAM Roles**: Least privilege access
- **Service Accounts**: Dedicated service identities
- **API Access**: Internal network only (testing service)

### Compliance
- **SOC 2**: Compliance monitoring
- **Security Scanning**: Regular vulnerability assessments
- **Audit Logging**: Comprehensive access logging