# Deployment

## Infrastructure

### Cloud Platform
- **Provider**: Amazon Web Services (AWS)
- **Container Orchestration**: Amazon ECS (Elastic Container Service)
- **Load Balancing**: Application Load Balancer (ALB)
- **Service Discovery**: AWS Cloud Map
- **Networking**: VPC with private/public subnets

### Database Infrastructure
- **Primary Database**: Amazon RDS Oracle 19c
- **High Availability**: Multi-AZ deployment
- **Backup Strategy**: Automated daily backups with 7-day retention
- **Read Replicas**: Available for read-heavy workloads
- **Connection Pooling**: HikariCP with connection limits

### Container Infrastructure
- **Base Image**: Cvent-approved OpenJDK 17 Alpine
- **Registry**: Amazon ECR (Elastic Container Registry)
- **Build Strategy**: Multi-stage Docker builds
- **Security Scanning**: Automated vulnerability scanning
- **Image Tagging**: Semantic versioning with Git SHA

## Environments

### Development Environment
- **Purpose**: Feature development and initial testing
- **Infrastructure**: 
  - ECS Service: 1-2 tasks, t3.medium instances
  - Database: db.t3.micro RDS instance
  - Load Balancer: Shared ALB with path-based routing
- **Configuration**:
  - Debug logging enabled
  - Relaxed security policies
  - Mock external service integrations
  - Hot reload capabilities
- **Access**: VPN required, internal DNS
- **URL**: `https://passkey-event-dev.cvent-internal.com`

### Staging Environment
- **Purpose**: Pre-production testing and validation
- **Infrastructure**:
  - ECS Service: 2-3 tasks, t3.large instances
  - Database: db.t3.small RDS instance with read replica
  - Load Balancer: Dedicated ALB with SSL termination
- **Configuration**:
  - Production-like settings
  - Full security enforcement
  - Real external service integrations
  - Performance monitoring enabled
- **Access**: VPN required, staging domain
- **URL**: `https://passkey-event-staging.cvent.com`

### Production Environment
- **Purpose**: Live customer-facing service
- **Infrastructure**:
  - ECS Service: 5-10 tasks (auto-scaling), c5.xlarge instances
  - Database: db.r5.large RDS instance with Multi-AZ
  - Load Balancer: Dedicated ALB with WAF protection
  - CDN: CloudFront for static content
- **Configuration**:
  - Optimized for performance and reliability
  - Strict security policies
  - Comprehensive monitoring and alerting
  - Automated scaling policies
- **Access**: Public internet, production domain
- **URL**: `https://api.cvent.com/passkey-event`

## CI/CD Pipeline

### Pipeline Overview
The deployment pipeline is managed through Jenkins with the following stages:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │───▶│    Build    │───▶│    Test     │───▶│   Deploy    │
│   Control   │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                    │                  │                  │
      ▼                    ▼                  ▼                  ▼
• Git commit         • Maven build      • Unit tests      • Dev deploy
• Branch push        • Docker build     • Integration     • Staging deploy
• Pull request       • Security scan    • E2E tests       • Prod deploy
• Tag creation       • Quality gates    • Performance     • Rollback
```

### Build Stage
```groovy
// Jenkinsfile excerpt
stage('Build') {
    steps {
        sh 'pnpm install'
        sh 'pnpm build'
        sh 'docker build -t passkey-event:${BUILD_NUMBER} .'
        sh 'docker tag passkey-event:${BUILD_NUMBER} ${ECR_REPO}:${BUILD_NUMBER}'
    }
}
```

### Test Stage
```groovy
stage('Test') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'mvn test'
                publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
            }
        }
        stage('Integration Tests') {
            steps {
                sh 'mvn verify -Pintegration-tests'
            }
        }
        stage('Security Scan') {
            steps {
                sh 'docker run --rm -v $(pwd):/app clair-scanner:latest'
            }
        }
    }
}
```

### Deployment Stage
```groovy
stage('Deploy') {
    when {
        anyOf {
            branch 'development'
            branch 'master'
        }
    }
    steps {
        script {
            if (env.BRANCH_NAME == 'development') {
                deployToEnvironment('dev')
            } else if (env.BRANCH_NAME == 'master') {
                deployToEnvironment('staging')
                input message: 'Deploy to production?', ok: 'Deploy'
                deployToEnvironment('prod')
            }
        }
    }
}
```

### Deployment Triggers
- **Development**: Automatic on push to `development` branch
- **Staging**: Automatic on push to `master` branch
- **Production**: Manual approval required after staging validation
- **Hotfix**: Fast-track deployment for critical fixes

## Configuration Management

### Environment Variables
```bash
# Application Configuration
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC"

# Database Configuration
DB_HOST=passkey-event-prod.cluster-xyz.us-east-1.rds.amazonaws.com
DB_PORT=1521
DB_NAME=PASSKEY
DB_USERNAME_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789:secret:db-username
DB_PASSWORD_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789:secret:db-password

# External Service Configuration
CVENT_AUTH_URL=https://auth.cvent.com
OAUTH_CLIENT_ID_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789:secret:oauth-client-id
OAUTH_CLIENT_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789:secret:oauth-client-secret

# Monitoring Configuration
DATADOG_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789:secret:datadog-api-key
NEW_RELIC_LICENSE_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789:secret:newrelic-license
```

### AWS Parameter Store
```bash
# Application parameters
/passkey-event/prod/app/log-level=WARN
/passkey-event/prod/app/max-connections=100
/passkey-event/prod/app/timeout=30000

# Feature flags
/passkey-event/prod/features/flip-to-enabled=true
/passkey-event/prod/features/marketing-items-v2=false
/passkey-event/prod/features/enhanced-consent=true
```

### Secrets Management
- **AWS Secrets Manager**: Database credentials, API keys, certificates
- **Rotation Policy**: Automatic rotation every 90 days
- **Access Control**: IAM roles with least privilege principle
- **Encryption**: AES-256 encryption at rest and in transit

## Container Configuration

### Dockerfile
```dockerfile
# Multi-stage build
FROM maven:3.8-openjdk-17-slim AS builder
WORKDIR /app
COPY pom.xml .
COPY packages/passkey-event-sb/service/pom.xml packages/passkey-event-sb/service/
RUN mvn dependency:go-offline

COPY . .
RUN mvn clean package -DskipTests

FROM openjdk:17-jre-alpine
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser
    
WORKDIR /app
COPY --from=builder /app/packages/passkey-event-sb/service/target/passkey-event-*.jar app.jar
COPY --from=builder /app/packages/passkey-event-sb/service/configs/ configs/

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### ECS Task Definition
```json
{
  "family": "passkey-event-prod",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789:role/passkey-event-task-role",
  "containerDefinitions": [
    {
      "name": "passkey-event",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/passkey-event:latest",
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
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/passkey-event",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
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
  ]
}
```

## Auto Scaling Configuration

### ECS Service Auto Scaling
```json
{
  "serviceArn": "arn:aws:ecs:us-east-1:123456789:service/passkey-event-prod",
  "scalableDimension": "ecs:service:DesiredCount",
  "minCapacity": 2,
  "maxCapacity": 20,
  "targetTrackingScalingPolicies": [
    {
      "targetValue": 70.0,
      "scaleOutCooldown": 300,
      "scaleInCooldown": 300,
      "metricType": "ECSServiceAverageCPUUtilization"
    },
    {
      "targetValue": 80.0,
      "scaleOutCooldown": 300,
      "scaleInCooldown": 300,
      "metricType": "ECSServiceAverageMemoryUtilization"
    }
  ]
}
```

### Application-Level Scaling
- **Connection Pool**: Dynamic sizing based on load
- **Thread Pool**: Configurable thread pool for async operations
- **Circuit Breakers**: Prevent cascade failures
- **Rate Limiting**: Protect against traffic spikes

## Monitoring & Alerting

### CloudWatch Metrics
- **Application Metrics**: Request count, response time, error rate
- **Infrastructure Metrics**: CPU, memory, network, disk usage
- **Database Metrics**: Connection count, query performance, deadlocks
- **Custom Metrics**: Business-specific KPIs

### Alerting Rules
```yaml
# CloudWatch Alarms
HighErrorRate:
  MetricName: ErrorRate
  Threshold: 5
  ComparisonOperator: GreaterThanThreshold
  EvaluationPeriods: 2
  Actions:
    - SNS: arn:aws:sns:us-east-1:123456789:passkey-alerts

HighResponseTime:
  MetricName: ResponseTime
  Threshold: 2000
  ComparisonOperator: GreaterThanThreshold
  EvaluationPeriods: 3
  Actions:
    - SNS: arn:aws:sns:us-east-1:123456789:passkey-alerts

DatabaseConnectionFailure:
  MetricName: DatabaseConnections
  Threshold: 1
  ComparisonOperator: LessThanThreshold
  EvaluationPeriods: 1
  Actions:
    - SNS: arn:aws:sns:us-east-1:123456789:passkey-critical-alerts
```

### Log Aggregation
- **CloudWatch Logs**: Centralized log collection
- **Log Groups**: Environment-specific log separation
- **Log Retention**: 30 days for dev, 90 days for prod
- **Log Analysis**: CloudWatch Insights for log querying

## Rollback Procedures

### Automated Rollback
```bash
# ECS service rollback to previous task definition
aws ecs update-service \
  --cluster passkey-event-prod \
  --service passkey-event \
  --task-definition passkey-event-prod:PREVIOUS_REVISION

# Database rollback (if schema changes)
flyway repair -url=jdbc:oracle:thin:@prod-db:1521:PASSKEY
flyway undo -url=jdbc:oracle:thin:@prod-db:1521:PASSKEY
```

### Manual Rollback Steps
1. **Identify Issue**: Monitor alerts and logs
2. **Stop Traffic**: Update load balancer to maintenance page
3. **Rollback Application**: Deploy previous known-good version
4. **Rollback Database**: Apply database rollback scripts if needed
5. **Verify Health**: Run health checks and smoke tests
6. **Resume Traffic**: Remove maintenance page
7. **Post-Incident**: Document and analyze root cause

### Blue-Green Deployment
```bash
# Deploy to green environment
aws ecs create-service --service-name passkey-event-green

# Switch traffic gradually
aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TARGET_GROUP

# Monitor and rollback if needed
aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$BLUE_TARGET_GROUP
```

## Security Considerations

### Network Security
- **VPC**: Private subnets for application and database
- **Security Groups**: Restrictive inbound/outbound rules
- **WAF**: Web Application Firewall for production
- **SSL/TLS**: End-to-end encryption with valid certificates

### Application Security
- **Authentication**: OAuth 2.0 with JWT tokens
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection**: Parameterized queries and ORM protection

### Compliance
- **SOC 2**: Security controls and audit requirements
- **GDPR**: Data privacy and consent management
- **PCI DSS**: Payment card data protection (if applicable)
- **Audit Logging**: Comprehensive audit trail for compliance

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with point-in-time recovery
- **Application**: Container images stored in multiple regions
- **Configuration**: Infrastructure as Code in version control
- **Secrets**: Cross-region replication of secrets

### Recovery Procedures
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Multi-Region**: Standby environment in secondary region
- **Failover**: Automated DNS failover with health checks