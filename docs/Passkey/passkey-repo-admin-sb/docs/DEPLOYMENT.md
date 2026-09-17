# Deployment

## Infrastructure

The Passkey Admin Service is deployed on AWS infrastructure using a containerized approach with ECS (Elastic Container Service) and managed through Octopus Deploy for deployment orchestration.

### AWS Architecture
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
│  │   (CT50/PR50)   │    │   (CT50/PR50)   │                │
│  │                 │    │                 │                │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │                │
│  │ │   Service   │ │    │ │   Service   │ │                │
│  │ │  Instance   │ │    │ │  Instance   │ │                │
│  │ └─────────────┘ │    │ └─────────────┘ │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                Oracle RDS Database                      ││
│  │              (Multi-AZ Deployment)                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Infrastructure Components
- **ECS Clusters**: Containerized service deployment
- **Application Load Balancer**: Traffic distribution and SSL termination
- **Oracle RDS**: Managed database service with Multi-AZ deployment
- **CloudWatch**: Logging and monitoring
- **IAM Roles**: Service authentication and authorization
- **VPC**: Network isolation and security groups

## Environments

### Development (Local)
- **Purpose**: Local development and testing
- **Database**: Local Oracle XE or Docker container
- **Configuration**: `configs/dev.yaml`
- **Access**: `http://localhost:8080`
- **Features**: Debug logging, hot reload, test data

### CT50 (Customer Testing)
- **Purpose**: Customer acceptance testing and validation
- **Infrastructure**: AWS ECS with dedicated resources
- **Database**: Shared Oracle RDS instance (non-production)
- **Configuration**: `configs/ct50.properties`
- **Access**: Internal Cvent network only
- **Features**: Production-like environment with test data

### PR50 (Production)
- **Purpose**: Live production environment
- **Infrastructure**: AWS ECS with high availability
- **Database**: Dedicated Oracle RDS with Multi-AZ
- **Configuration**: `configs/pr50.properties`
- **Access**: Public internet with authentication
- **Features**: Full monitoring, alerting, and backup

### Environment Configuration Matrix
| Feature | Development | CT50 | PR50 |
|---------|-------------|------|------|
| Database | Local/Docker | Shared RDS | Dedicated RDS |
| Logging Level | DEBUG | INFO | WARN |
| Health Checks | Basic | Full | Full |
| Monitoring | Local only | CloudWatch | CloudWatch + Datadog |
| SSL/TLS | Optional | Required | Required |
| Backup | None | Daily | Hourly |
| Scaling | Single instance | 2 instances | 3+ instances |

## CI/CD Pipeline

### Jenkins Pipeline Configuration
The service uses a Jenkins-based CI/CD pipeline defined in the `Jenkinsfile`:

```groovy
buildPipeline(
  label: 'ecs-x86-medium',
  packageFilter: 'root-only',
  stablePrereleaseId: true,
  awsUser: 'cdk',
  ci: [
    lock: 'branch' // allow parallel ci builds across branches
  ],
  trunk: 'master',
  release: [
    branches: ['master']
  ],
  builds: [
    [ branch: 'master', environments: 'alpha' ]
  ],
  publish: [
    [ branches: ['master'] ]
  ],
  slack: [
    [branches: ['master'], channels: ['passkey-maurya-alerts'], events: ['FAILURE']],
    [branches: ['.*'], channels: ['passkey-maurya-alerts']]
  ]
)
```

### Pipeline Stages

#### 1. Source Code Checkout
- Checkout from GitHub repository
- Validate branch and commit information
- Set up build environment

#### 2. Build and Test
```bash
# Install dependencies
pnpm install

# Run linting
pnpm lint

# Execute unit tests
pnpm test

# Build Java service
cd packages/passkey-admin-service/service
mvn clean compile

# Run integration tests
cd ../it
pnpm test:it
```

#### 3. Code Quality Analysis
- **SonarQube Analysis**: Code quality and security scanning
- **Checkstyle**: Code style validation
- **SpotBugs**: Static analysis for bug detection
- **JaCoCo**: Code coverage reporting

#### 4. Package and Build
```bash
# Maven package
mvn clean package -P release

# Docker image build
docker build -t passkey-admin-service:${BUILD_NUMBER} .

# Push to container registry
docker push ${ECR_REGISTRY}/passkey-admin-service:${BUILD_NUMBER}
```

#### 5. Deployment
- **Alpha Environment**: Automatic deployment for master branch
- **CT50 Environment**: Manual approval required
- **PR50 Environment**: Manual approval with additional validations

### Deployment Automation

#### Octopus Deploy Integration
The service is deployed using Octopus Deploy with the following configuration:

**Project**: `passkey-admin-service-springboot`
**Deployment Process**:
1. **Variable Substitution**: Environment-specific configuration
2. **Database Migration**: Schema updates and data migrations
3. **Service Deployment**: ECS service update with new container image
4. **Health Check Validation**: Verify service health after deployment
5. **Smoke Tests**: Basic functionality validation
6. **Rollback Capability**: Automatic rollback on failure

#### CDK Infrastructure as Code
Infrastructure is managed using AWS CDK (Cloud Development Kit):

```typescript
// packages/passkey-admin-service/infra/
export class PasskeyAdminServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'PasskeyAdminCluster');

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');
    
    // Container Definition
    taskDefinition.addContainer('passkey-admin-service', {
      image: ecs.ContainerImage.fromRegistry('passkey-admin-service:latest'),
      memoryLimitMiB: 1024,
      cpu: 512,
      environment: {
        SPRING_PROFILES_ACTIVE: 'production'
      },
      secrets: {
        DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret)
      }
    });

    // ECS Service
    new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 3
    });
  }
}
```

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through a combination of:
- **Base Configuration**: `configs/template.yaml`
- **Environment Overrides**: `configs/{environment}.properties`
- **Environment Variables**: Runtime configuration
- **AWS Secrets Manager**: Sensitive configuration values

### Configuration Hierarchy
1. **Default Values**: Defined in `application.yml`
2. **Environment Files**: Override defaults per environment
3. **Environment Variables**: Override file-based configuration
4. **Command Line Arguments**: Highest priority overrides

### Secrets Management
```yaml
# Example configuration with secrets
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD} # From AWS Secrets Manager

oauth:
  client-id: ${OAUTH_CLIENT_ID}
  client-secret: ${OAUTH_CLIENT_SECRET} # From AWS Secrets Manager
```

### Configuration Validation
- **Startup Validation**: Configuration validation on application startup
- **Health Checks**: Configuration-dependent health indicators
- **Environment Verification**: Automated checks for required configuration

## Monitoring and Alerting

### Application Monitoring
- **Datadog APM**: Application performance monitoring
- **CloudWatch Metrics**: AWS infrastructure metrics
- **Custom Metrics**: Business-specific metrics via Micrometer
- **Log Aggregation**: Centralized logging with structured JSON format

### Health Monitoring
```yaml
# Health check endpoints
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true
```

### Alerting Configuration
**Slack Integration**:
- **Channel**: `#passkey-maurya-alerts`
- **Failure Alerts**: Deployment failures, service health issues
- **Success Notifications**: Successful deployments to production

**Datadog Alerts**:
- **Error Rate**: Alert when error rate exceeds 5%
- **Response Time**: Alert when 95th percentile exceeds 2 seconds
- **Database Connectivity**: Alert on database connection failures
- **Memory Usage**: Alert when memory usage exceeds 80%

### Log Management
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "logger": "com.cvent.passkeyadminservice.controllers.PasskeyContactController",
  "message": "createContact() request environment PR50",
  "mdc": {
    "correlationId": "abc123-def456",
    "userId": "user-789",
    "environment": "PR50"
  }
}
```

## Rollback Procedures

### Automatic Rollback Triggers
- **Health Check Failures**: Service fails health checks after deployment
- **Error Rate Spike**: Error rate exceeds threshold within 10 minutes
- **Performance Degradation**: Response time increases significantly
- **Database Connection Issues**: Unable to connect to database

### Manual Rollback Process
1. **Identify Issue**: Determine the need for rollback
2. **Access Octopus Deploy**: Navigate to deployment dashboard
3. **Select Previous Release**: Choose last known good deployment
4. **Execute Rollback**: Deploy previous version
5. **Verify Health**: Confirm service health after rollback
6. **Notify Team**: Update team on rollback completion

### Rollback Validation
```bash
# Health check validation
curl -f http://service-url/actuator/health

# Functional validation
curl -f -H "Authorization: Bearer $TOKEN" \
  http://service-url/passkey-admin/v1/email-types

# Database connectivity check
curl -f http://service-url/actuator/health/db
```

### Database Rollback Considerations
- **Schema Changes**: Backward-compatible migrations preferred
- **Data Migrations**: Reversible data transformations
- **Backup Strategy**: Point-in-time recovery capability
- **Rollback Testing**: Regular testing of rollback procedures

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated daily backups with 30-day retention
- **Configuration Backups**: Version-controlled configuration files
- **Container Images**: Tagged and stored in ECR with retention policy
- **Infrastructure Code**: Version-controlled CDK templates

### Recovery Procedures
1. **Service Recovery**: Redeploy from last known good container image
2. **Database Recovery**: Restore from automated backup or point-in-time
3. **Configuration Recovery**: Deploy from version-controlled configuration
4. **Infrastructure Recovery**: Rebuild using CDK templates

### Recovery Time Objectives (RTO)
- **Service Restart**: < 5 minutes
- **Full Service Recovery**: < 30 minutes
- **Database Recovery**: < 2 hours
- **Complete Infrastructure Rebuild**: < 4 hours

### Recovery Point Objectives (RPO)
- **Application Data**: < 1 hour (database backup frequency)
- **Configuration Changes**: < 1 minute (version control)
- **Infrastructure Changes**: < 1 minute (version control)