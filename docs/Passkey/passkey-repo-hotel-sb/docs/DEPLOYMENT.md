# Deployment

## Infrastructure

### AWS Architecture

The Passkey Hotel Spring Boot Service is deployed on AWS using a containerized microservices architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Application   │    │   Application   │                │
│  │  Load Balancer  │    │  Load Balancer  │                │
│  │     (ALB)       │    │     (ALB)       │                │
│  └─────────┬───────┘    └─────────┬───────┘                │
│            │                      │                        │
│  ┌─────────▼───────┐    ┌─────────▼───────┐                │
│  │   ECS Cluster   │    │   ECS Cluster   │                │
│  │   (Production)  │    │  (Staging/Dev)  │                │
│  │                 │    │                 │                │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │                │
│  │ │   Service   │ │    │ │   Service   │ │                │
│  │ │   Tasks     │ │    │ │   Tasks     │ │                │
│  │ │ (Containers)│ │    │ │ (Containers)│ │                │
│  │ └─────────────┘ │    │ └─────────────┘ │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 RDS Oracle Database                     │ │
│  │              (Multi-AZ Deployment)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Container Platform

- **Container Orchestration**: Amazon ECS (Elastic Container Service)
- **Container Registry**: Amazon ECR (Elastic Container Registry)
- **Load Balancing**: Application Load Balancer (ALB)
- **Service Discovery**: AWS Cloud Map
- **Networking**: VPC with private subnets

### Database Infrastructure

- **Database**: Amazon RDS Oracle
- **Configuration**: Multi-AZ deployment for high availability
- **Backup**: Automated daily backups with 7-day retention
- **Monitoring**: CloudWatch metrics and performance insights

## Environments

### Development Environment

**Infrastructure**:
- **ECS Cluster**: `passkey-dev-cluster`
- **Service Name**: `passkey-hotel-dev`
- **Instance Type**: t3.medium
- **Desired Count**: 1
- **Database**: `passkey-dev-oracle.cluster-xyz.us-east-1.rds.amazonaws.com`

**Configuration**:
```yaml
# configs/dev.yaml
spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:oracle:thin:@passkey-dev-oracle.cluster-xyz.us-east-1.rds.amazonaws.com:1521:ORCL
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: "*"
```

**Access**:
- **URL**: `https://passkey-hotel-dev.cvent.com`
- **Health Check**: `https://passkey-hotel-dev.cvent.com/actuator/health`

### Staging Environment

**Infrastructure**:
- **ECS Cluster**: `passkey-staging-cluster`
- **Service Name**: `passkey-hotel-staging`
- **Instance Type**: t3.large
- **Desired Count**: 2
- **Database**: `passkey-staging-oracle.cluster-abc.us-east-1.rds.amazonaws.com`

**Configuration**:
```yaml
# configs/staging.yaml
spring:
  profiles:
    active: staging
  datasource:
    url: jdbc:oracle:thin:@passkey-staging-oracle.cluster-abc.us-east-1.rds.amazonaws.com:1521:ORCL
    hikari:
      maximum-pool-size: 15

server:
  port: 8080

logging:
  level:
    com.cvent.passkeyhotelsb: INFO
```

**Access**:
- **URL**: `https://passkey-hotel-staging.cvent.com`
- **Health Check**: `https://passkey-hotel-staging.cvent.com/actuator/health`

### Production Environment

**Infrastructure**:
- **ECS Cluster**: `passkey-prod-cluster`
- **Service Name**: `passkey-hotel-prod`
- **Instance Type**: c5.xlarge
- **Desired Count**: 4 (with auto-scaling)
- **Database**: `passkey-prod-oracle.cluster-def.us-east-1.rds.amazonaws.com`

**Configuration**:
```yaml
# configs/prod.yaml
spring:
  profiles:
    active: prod
  datasource:
    url: jdbc:oracle:thin:@passkey-prod-oracle.cluster-def.us-east-1.rds.amazonaws.com:1521:ORCL
    hikari:
      maximum-pool-size: 25
      minimum-idle: 10

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus

logging:
  level:
    com.cvent.passkeyhotelsb: WARN
    root: ERROR
```

**Access**:
- **URL**: `https://passkey-hotel.cvent.com`
- **Health Check**: `https://passkey-hotel.cvent.com/actuator/health`

## CI/CD Pipeline

### Jenkins Pipeline

The deployment pipeline is managed through Jenkins using the Cvent pipeline utilities:

**Jenkinsfile**:
```groovy
#!/usr/bin/env groovy

@Library('pipeline-utils') _

buildPipeline(
  label: 'ecs-x86-medium',
  packageFilter: 'root-only',
  stablePrereleaseId: true,
  skipCacheBehavior: 'remote-only',
  awsUser: 'cdk',
  ci: [
    lock: 'branch' // allow parallel ci builds across branches
  ],
  trunk: 'master',
  release: [
    branches: ['master']
  ],
  slack: [
    [branches: ['master'], channels: ['passkey-api'], events: ['FAILURE']],
    [branches: ['.*'], channels: ['passkey-api']]
  ],
  mend: [
    slack: 'passkey-api'
  ]
)
```

### Pipeline Stages

1. **Source Code Checkout**
   - Pulls latest code from GitHub
   - Validates branch and commit information

2. **Build & Test**
   - Runs `pnpm install` for dependencies
   - Executes Maven build: `mvn clean compile`
   - Runs unit tests: `mvn test`
   - Generates test reports and coverage

3. **Code Quality**
   - SonarQube analysis for code quality
   - Checkstyle validation
   - Security vulnerability scanning with Mend

4. **Package**
   - Builds Spring Boot JAR: `mvn package`
   - Creates Docker image
   - Pushes image to ECR

5. **Deploy to Development**
   - Automatically deploys to dev environment
   - Runs smoke tests
   - Updates service in ECS

6. **Deploy to Staging** (on master branch)
   - Deploys to staging environment
   - Runs integration tests
   - Performance testing

7. **Deploy to Production** (manual approval)
   - Requires manual approval
   - Blue-green deployment strategy
   - Health checks and rollback capability

### Build Commands

**Local Build**:
```bash
# Install dependencies
pnpm install

# Build all modules
pnpm run build

# Run tests
pnpm run test

# Package for deployment
cd packages/passkey-hotel-sb/service
mvn clean package -Prelease
```

**Docker Build**:
```bash
# Build Docker image
docker build -t passkey-hotel-sb:latest .

# Tag for ECR
docker tag passkey-hotel-sb:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/passkey-hotel-sb:latest

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/passkey-hotel-sb:latest
```

## Configuration Management

### Environment Variables

**Required Environment Variables**:
```bash
# Database Configuration
DB_USERNAME=passkey_user
DB_PASSWORD=secure_password
DB_URL=jdbc:oracle:thin:@database-host:1521:ORCL

# OAuth Configuration
OAUTH_CLIENT_ID=passkey-hotel-client
OAUTH_CLIENT_SECRET=oauth_secret
OAUTH_TOKEN_URI=https://auth.cvent.com/oauth/token

# Monitoring
DATADOG_API_KEY=datadog_api_key
DATADOG_APP_KEY=datadog_app_key

# Application Configuration
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
```

### AWS Parameter Store

Sensitive configuration is stored in AWS Systems Manager Parameter Store:

```bash
# Database credentials
/passkey-hotel/prod/db/username
/passkey-hotel/prod/db/password

# OAuth secrets
/passkey-hotel/prod/oauth/client-secret

# API keys
/passkey-hotel/prod/datadog/api-key
```

### Configuration Injection

**ECS Task Definition**:
```json
{
  "family": "passkey-hotel-prod",
  "taskRoleArn": "arn:aws:iam::123456789012:role/PasskeyHotelTaskRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/PasskeyHotelExecutionRole",
  "containerDefinitions": [
    {
      "name": "passkey-hotel",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/passkey-hotel-sb:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SPRING_PROFILES_ACTIVE",
          "value": "prod"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "/passkey-hotel/prod/db/password"
        },
        {
          "name": "OAUTH_CLIENT_SECRET",
          "valueFrom": "/passkey-hotel/prod/oauth/client-secret"
        }
      ]
    }
  ]
}
```

## Monitoring & Alerting

### Health Checks

**ECS Health Check**:
```json
{
  "healthCheck": {
    "command": [
      "CMD-SHELL",
      "curl -f http://localhost:8080/actuator/health || exit 1"
    ],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 60
  }
}
```

**ALB Health Check**:
- **Path**: `/actuator/health`
- **Port**: 8080
- **Protocol**: HTTP
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy Threshold**: 2
- **Unhealthy Threshold**: 5

### Monitoring Dashboards

**Datadog Dashboard**: [Passkey Hotel Service](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-hotel)

**Key Metrics**:
- Request rate and response times
- Error rates and status codes
- Database connection pool metrics
- JVM memory and garbage collection
- Custom business metrics

### Alerting Rules

**Critical Alerts**:
- Service availability < 99%
- Error rate > 5%
- Response time > 2 seconds (95th percentile)
- Database connection failures

**Warning Alerts**:
- Memory usage > 80%
- CPU usage > 70%
- Database connection pool > 80% utilized

## Rollback Procedures

### Automated Rollback

ECS supports automatic rollback on deployment failure:

```bash
# Enable circuit breaker for automatic rollback
aws ecs put-cluster-capacity-providers \
  --cluster passkey-prod-cluster \
  --capacity-providers EC2 \
  --default-capacity-provider-strategy capacityProvider=EC2,weight=1,base=0
```

### Manual Rollback

**Via AWS Console**:
1. Navigate to ECS Console
2. Select the service
3. Click "Update Service"
4. Select previous task definition revision
5. Update service

**Via CLI**:
```bash
# Get current service configuration
aws ecs describe-services --cluster passkey-prod-cluster --services passkey-hotel-prod

# Update to previous task definition
aws ecs update-service \
  --cluster passkey-prod-cluster \
  --service passkey-hotel-prod \
  --task-definition passkey-hotel-prod:123  # Previous revision
```

### Database Rollback

**Schema Changes**:
- Use Flyway migrations for database versioning
- Maintain backward compatibility
- Test rollback procedures in staging

**Data Rollback**:
- Point-in-time recovery available for up to 35 days
- Automated backups taken daily
- Manual snapshots before major deployments

## Disaster Recovery

### Backup Strategy

**Application**:
- Docker images stored in ECR with lifecycle policies
- Source code in GitHub with multiple replicas
- Configuration in AWS Parameter Store with cross-region replication

**Database**:
- Automated daily backups
- Cross-region backup replication
- Point-in-time recovery capability

### Recovery Procedures

**Service Recovery**:
1. Identify failed components
2. Scale up healthy instances
3. Deploy from last known good image
4. Validate service functionality

**Database Recovery**:
1. Assess data loss scope
2. Restore from appropriate backup point
3. Validate data integrity
4. Resume application services

**Full Environment Recovery**:
1. Provision infrastructure using CDK
2. Deploy application from ECR
3. Restore database from backup
4. Update DNS and load balancer configuration
5. Validate end-to-end functionality

### Recovery Time Objectives

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Service Availability Target**: 99.9%