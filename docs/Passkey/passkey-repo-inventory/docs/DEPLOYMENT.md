# Deployment

## Infrastructure

The Passkey Inventory Service is deployed on AWS using containerized infrastructure with the following components:

- **Container Platform**: Amazon ECS (Elastic Container Service)
- **Load Balancer**: Application Load Balancer (ALB)
- **Database**: Amazon RDS (PostgreSQL/MySQL)
- **Service Discovery**: AWS Cloud Map
- **Monitoring**: Amazon CloudWatch + Datadog
- **Secrets Management**: AWS Secrets Manager
- **Container Registry**: Amazon ECR

## Environments

### Development (dev)
- **Purpose**: Local development and initial testing
- **URL**: `https://passkey-inventory-service.dev.cvent.org`
- **Database**: Development RDS instance
- **Resources**: 
  - CPU: 0.5 vCPU
  - Memory: 1 GB
  - Instances: 1
- **Auto-scaling**: Disabled

### Alpha (alpha)
- **Purpose**: Integration testing and feature validation
- **URL**: `https://passkey-inventory-service.alpha.cvent.org`
- **Database**: Shared alpha RDS instance
- **Resources**:
  - CPU: 1 vCPU
  - Memory: 2 GB
  - Instances: 1-2
- **Auto-scaling**: Basic scaling rules

### Test/Staging (ts50)
- **Purpose**: Pre-production testing and validation
- **URL**: `https://passkey-inventory-service.ts50.cvent.org`
- **Database**: Staging RDS instance (production-like)
- **Resources**:
  - CPU: 2 vCPU
  - Memory: 4 GB
  - Instances: 2-4
- **Auto-scaling**: Production-like scaling

### Singapore Staging (sg50)
- **Purpose**: Asia-Pacific region staging
- **URL**: `https://passkey-inventory-service.sg50.cvent.org`
- **Database**: Singapore RDS instance
- **Resources**:
  - CPU: 2 vCPU
  - Memory: 4 GB
  - Instances: 2-4
- **Auto-scaling**: Production-like scaling

### Integration Testing (it50)
- **Purpose**: Automated integration testing
- **URL**: `https://passkey-inventory-service.it50.cvent.org`
- **Database**: Integration test RDS instance
- **Resources**:
  - CPU: 1 vCPU
  - Memory: 2 GB
  - Instances: 1-2
- **Auto-scaling**: Test-specific scaling

### Production (pr50)
- **Purpose**: Live production environment
- **URL**: `https://passkey-inventory-service.pr50.cvent.org`
- **Database**: Production RDS cluster (Multi-AZ)
- **Resources**:
  - CPU: 4 vCPU
  - Memory: 8 GB
  - Instances: 4-12
- **Auto-scaling**: Advanced scaling with multiple metrics

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The deployment pipeline is defined in `Jenkinsfile` and uses the Cvent `dropwizardPipeline` library:

```groovy
dropwizardPipeline([
  label: 'ecs-x86-medium',
  changesets: true,
  
  release: [
    branch: 'master'
  ],
  
  builds: [
    [ branch: 'development', environments: 'alpha' ],
    [ branch: 'master', environments: ['ts50', 'sg50', 'it50'] ]
  ],
  
  scheduledTests: [
    [ branch: 'master', triggers: [
      [environment: 'ts50', cron: '0 4 * * 2', tags: '~@ignore,~@pvt_Karate']
    ]],
    [ branch: 'master', triggers: [
      [environment: 'pr50', cron: '0 4 * * 1-5', tags: '@pvt_Karate']
    ]]
  ]
])
```

### Pipeline Stages

1. **Source Checkout**
   - Checkout code from GitHub
   - Determine branch and trigger type

2. **Build & Test**
   - Maven compile and package
   - Unit test execution
   - Code coverage analysis
   - Static code analysis (Checkmarx)

3. **Docker Build**
   - Build Docker image
   - Tag with build number and commit SHA
   - Push to Amazon ECR

4. **Security Scanning**
   - Container vulnerability scanning
   - Dependency vulnerability check
   - Security policy validation

5. **Deployment**
   - Deploy to target environment(s)
   - Health check validation
   - Smoke tests

6. **Integration Testing**
   - Execute Karate integration tests
   - Performance testing (if configured)
   - End-to-end validation

7. **Notification**
   - Slack notifications to relevant channels
   - Email notifications for failures

### Build Triggers

- **Development Branch**: Automatic deployment to `alpha`
- **Master Branch**: Automatic deployment to `ts50`, `sg50`, `it50`
- **Production**: Manual approval required
- **Pull Requests**: Build and test only (no deployment)

## Configuration Management

### Environment-Specific Configuration

Configuration is managed through environment-specific YAML files and environment variables:

```yaml
# configs/alpha.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:postgresql://alpha-db.cvent.org:5432/passkey_inventory
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  maxSize: 16

# External service URLs
externalServices:
  authService: https://auth-service.alpha.cvent.org
  businessTextService: https://passkey-business-text.alpha.cvent.org
  eventService: https://passkey-event.alpha.cvent.org
  hotelService: https://passkey-hotel.alpha.cvent.org
```

### Secrets Management

Sensitive configuration is stored in AWS Secrets Manager:

```json
{
  "db_username": "inventory_service_user",
  "db_password": "secure_password_here",
  "auth_service_api_key": "api_key_here",
  "datadog_api_key": "datadog_key_here"
}
```

### Feature Flags

Feature flags are managed through configuration:

```yaml
features:
  enableNewInventoryAlgorithm: ${ENABLE_NEW_ALGORITHM:-false}
  enableAdvancedMetrics: ${ENABLE_ADVANCED_METRICS:-true}
  maxConcurrentLocks: ${MAX_CONCURRENT_LOCKS:-100}
```

## Container Configuration

### Dockerfile
```dockerfile
FROM amz_java8:0.1
WORKDIR /opt/java_projects

# Remote debugging port for IntelliJ
EXPOSE 50605

CMD ["java", \
"-agentlib:jdwp=transport=dt_socket,address=50605,suspend=n,server=y", \
"-Dlogback.configurationFile=configs/dev.logback.xml", \
"-jar", "target/passkey-inventory-service-1.0.0-SNAPSHOT.jar", \
"server", "configs/docker.yaml"]
```

### ECS Task Definition
```json
{
  "family": "passkey-inventory-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/passkey-inventory-task-role",
  "containerDefinitions": [
    {
      "name": "passkey-inventory-service",
      "image": "account.dkr.ecr.region.amazonaws.com/passkey-inventory:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        },
        {
          "containerPort": 8081,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:passkey-inventory/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/passkey-inventory-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8081/healthcheck || exit 1"
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

## Auto-Scaling Configuration

### ECS Service Auto-Scaling
```json
{
  "scalingPolicies": [
    {
      "policyName": "cpu-scaling-policy",
      "targetTrackingScalingPolicies": [
        {
          "targetValue": 70.0,
          "predefinedMetricSpecification": {
            "predefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "scaleOutCooldown": 300,
          "scaleInCooldown": 300
        }
      ]
    },
    {
      "policyName": "memory-scaling-policy",
      "targetTrackingScalingPolicies": [
        {
          "targetValue": 80.0,
          "predefinedMetricSpecification": {
            "predefinedMetricType": "ECSServiceAverageMemoryUtilization"
          }
        }
      ]
    }
  ],
  "minCapacity": 2,
  "maxCapacity": 12
}
```

### Custom Metrics Scaling
```json
{
  "customMetricScaling": {
    "metricName": "inventory.request.rate",
    "namespace": "Passkey/Inventory",
    "targetValue": 1000,
    "scaleUpThreshold": 1200,
    "scaleDownThreshold": 800
  }
}
```

## Monitoring & Alerting

### CloudWatch Alarms
```json
{
  "alarms": [
    {
      "alarmName": "PasskeyInventory-HighCPU",
      "metricName": "CPUUtilization",
      "threshold": 80,
      "comparisonOperator": "GreaterThanThreshold",
      "evaluationPeriods": 2,
      "actions": ["arn:aws:sns:region:account:passkey-alerts"]
    },
    {
      "alarmName": "PasskeyInventory-HighErrorRate",
      "metricName": "4XXError",
      "threshold": 10,
      "comparisonOperator": "GreaterThanThreshold",
      "evaluationPeriods": 3
    },
    {
      "alarmName": "PasskeyInventory-DatabaseConnections",
      "metricName": "DatabaseConnectionsActive",
      "threshold": 80,
      "comparisonOperator": "GreaterThanThreshold"
    }
  ]
}
```

### Datadog Integration
```yaml
datadog:
  apiKey: ${DATADOG_API_KEY}
  tags:
    - service:passkey-inventory
    - environment:${ENVIRONMENT}
    - version:${BUILD_NUMBER}
  metrics:
    - inventory.available.rooms
    - inventory.reservation.rate
    - inventory.lock.duration
```

## Rollback Procedures

### Automated Rollback
1. **Health Check Failure**: Automatic rollback if health checks fail
2. **Error Rate Threshold**: Rollback if error rate exceeds 5% for 5 minutes
3. **Performance Degradation**: Rollback if response time increases by 50%

### Manual Rollback Process
1. **Identify Issue**: Determine the need for rollback
2. **Stop Traffic**: Temporarily route traffic away from affected instances
3. **Rollback Deployment**: 
   ```bash
   # Using AWS CLI
   aws ecs update-service \
     --cluster passkey-cluster \
     --service passkey-inventory-service \
     --task-definition passkey-inventory-service:previous-revision
   ```
4. **Verify Rollback**: Confirm service health and functionality
5. **Restore Traffic**: Gradually restore traffic to rolled-back instances
6. **Post-Rollback Analysis**: Investigate and document the issue

### Database Rollback
1. **Schema Changes**: Use database migration rollback scripts
2. **Data Changes**: Restore from point-in-time backup if necessary
3. **Coordination**: Ensure application and database versions are compatible

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with 30-day retention
- **Configuration**: Version-controlled configuration files
- **Container Images**: Immutable images stored in ECR with lifecycle policies

### Recovery Procedures
1. **Service Failure**: Auto-scaling and health checks handle most failures
2. **Database Failure**: RDS Multi-AZ provides automatic failover
3. **Region Failure**: Manual failover to secondary region (if configured)
4. **Complete Disaster**: Restore from backups in alternate region

### Recovery Time Objectives (RTO)
- **Service Instance Failure**: < 5 minutes (auto-scaling)
- **Database Failover**: < 2 minutes (RDS Multi-AZ)
- **Region Failover**: < 30 minutes (manual process)
- **Complete Restore**: < 4 hours (from backups)