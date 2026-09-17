# Deployment

## Infrastructure

### AWS Architecture

The Passkey Room List Manager is deployed on AWS using a containerized architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │  Application    │    │   Database      │
│   (CDN)         │◄──►│  Load Balancer  │◄──►│   (RDS Oracle)  │
│                 │    │   (ALB)         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌─────────────────┐
                    │   ECS Cluster   │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │   RLM App   │ │
                    │ │ Container   │ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │   RLM App   │ │
                    │ │ Container   │ │
                    │ └─────────────┘ │
                    └─────────────────┘
```

### Core Infrastructure Components

- **ECS Cluster**: Container orchestration for application instances
- **Application Load Balancer**: Traffic distribution and SSL termination
- **RDS Oracle**: Managed database service
- **CloudFront**: CDN for static assets and caching
- **Route 53**: DNS management
- **VPC**: Network isolation and security
- **IAM**: Identity and access management
- **CloudWatch**: Monitoring and logging
- **Systems Manager**: Configuration management

## Environments

### Development Environment

**URL**: `https://dev-rlm.passkey.com`

**Configuration**:
- **Compute**: 1 ECS task (2 vCPU, 4GB RAM)
- **Database**: RDS Oracle t3.medium (2 vCPU, 4GB RAM)
- **Load Balancer**: Application Load Balancer (dev tier)
- **Auto Scaling**: Disabled
- **Monitoring**: Basic CloudWatch metrics

**Access**:
- Direct login available at `/devLogin.jsp`
- Default event ID can be pre-configured
- Debug logging enabled
- Hot deployment supported

**Database**:
```
Host: dev-rlm-db.cluster-xyz.us-east-1.rds.amazonaws.com
Port: 1521
Database: ORCL
Schema: RLM_DEV
```

### Staging Environment

**URL**: `https://staging-rlm.passkey.com`

**Configuration**:
- **Compute**: 2 ECS tasks (4 vCPU, 8GB RAM each)
- **Database**: RDS Oracle t3.large (2 vCPU, 8GB RAM)
- **Load Balancer**: Application Load Balancer with health checks
- **Auto Scaling**: Min 2, Max 4 tasks
- **Monitoring**: Enhanced CloudWatch metrics

**Purpose**:
- Pre-production testing
- Performance validation
- Integration testing with other services
- User acceptance testing

### Production Environment

**URL**: `https://rlm.passkey.com`

**Configuration**:
- **Compute**: 4-8 ECS tasks (8 vCPU, 16GB RAM each)
- **Database**: RDS Oracle r5.xlarge (4 vCPU, 32GB RAM) with Multi-AZ
- **Load Balancer**: Application Load Balancer with WAF
- **Auto Scaling**: Min 4, Max 12 tasks based on CPU/memory
- **Monitoring**: Full observability stack with Datadog

**High Availability**:
- Multi-AZ deployment
- Automated failover
- Read replicas for reporting
- Cross-region backup

## CI/CD Pipeline

### Jenkins Pipeline

**Pipeline Location**: [Jenkins Job](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PAS)/job/passkey-rlm)

#### Pipeline Stages

1. **Source Checkout**
   ```groovy
   stage('Checkout') {
       steps {
           checkout scm
           sh 'git submodule update --init --recursive'
       }
   }
   ```

2. **Build & Test**
   ```groovy
   stage('Build') {
       steps {
           sh 'pnpm install'
           sh 'nx affected --target=build --base=origin/master'
           sh 'nx affected --target=test --base=origin/master'
       }
   }
   ```

3. **Security Scanning**
   ```groovy
   stage('Security Scan') {
       steps {
           sh 'nx affected --target=security-scan --base=origin/master'
           publishHTML([
               allowMissing: false,
               alwaysLinkToLastBuild: true,
               keepAll: true,
               reportDir: 'security-reports',
               reportFiles: 'index.html',
               reportName: 'Security Report'
           ])
       }
   }
   ```

4. **Docker Build**
   ```groovy
   stage('Docker Build') {
       steps {
           script {
               def image = docker.build("passkey-rlm:${env.BUILD_NUMBER}")
               docker.withRegistry('https://your-registry.com', 'registry-credentials') {
                   image.push()
                   image.push('latest')
               }
           }
       }
   }
   ```

5. **Deploy to Staging**
   ```groovy
   stage('Deploy Staging') {
       when { branch 'master' }
       steps {
           sh 'aws ecs update-service --cluster staging-cluster --service rlm-service --force-new-deployment'
           sh 'scripts/wait-for-deployment.sh staging'
       }
   }
   ```

6. **Integration Tests**
   ```groovy
   stage('Integration Tests') {
       steps {
           sh 'nx run integration-tests:test --env=staging'
       }
   }
   ```

7. **Deploy to Production**
   ```groovy
   stage('Deploy Production') {
       when { 
           allOf {
               branch 'master'
               expression { params.DEPLOY_TO_PROD == true }
           }
       }
       steps {
           input message: 'Deploy to Production?', ok: 'Deploy'
           sh 'aws ecs update-service --cluster prod-cluster --service rlm-service --force-new-deployment'
           sh 'scripts/wait-for-deployment.sh production'
       }
   }
   ```

### Octopus Deploy Integration

**Project**: [Octopus RLM Project](https://octo.core.cvent.org/app#/Spaces-1/projects/rlm/deployments)

#### Deployment Process

1. **Package Validation**
   - Verify Docker image integrity
   - Check configuration templates
   - Validate environment-specific settings

2. **Database Migration**
   - Run Flyway migrations
   - Validate schema changes
   - Backup before changes

3. **Application Deployment**
   - Update ECS service definition
   - Deploy new task definition
   - Monitor deployment progress

4. **Health Checks**
   - Application health endpoint validation
   - Database connectivity check
   - External service integration verification

5. **Smoke Tests**
   - Basic functionality validation
   - Critical path testing
   - Performance baseline check

## Configuration Management

### Environment-Specific Configuration

Configuration is managed through Hogan templates and AWS Systems Manager Parameter Store:

#### Hogan Configuration Templates

**Location**: `packages/app/configs/`

**Template Structure**:
```
configs/
├── application.template.properties
├── database.template.xml
├── logging.template.xml
└── security.template.properties
```

**Example Template** (`application.template.properties`):
```properties
# Database Configuration
db.host={{DB_HOST}}
db.port={{DB_PORT}}
db.name={{DB_NAME}}
db.username={{DB_USERNAME}}
db.password={{DB_PASSWORD}}

# External Services
auth.service.url={{AUTH_SERVICE_URL}}
clamav.host={{CLAMAV_HOST}}
clamav.port={{CLAMAV_PORT}}

# Rate Limiting
rate.limit.max.concurrent={{MAX_CONCURRENT_PROCESSES}}
rate.limit.max.rows.per.batch={{MAX_ROWS_PER_BATCH}}
```

#### Parameter Store Configuration

**Development Parameters**:
```
/rlm/dev/db/host = dev-rlm-db.cluster-xyz.us-east-1.rds.amazonaws.com
/rlm/dev/db/username = rlm_dev_user
/rlm/dev/db/password = [SecureString]
/rlm/dev/auth/service/url = https://dev-auth.passkey.com
/rlm/dev/rate/limit/max/concurrent = 2
```

**Production Parameters**:
```
/rlm/prod/db/host = prod-rlm-db.cluster-abc.us-east-1.rds.amazonaws.com
/rlm/prod/db/username = rlm_prod_user
/rlm/prod/db/password = [SecureString]
/rlm/prod/auth/service/url = https://auth.passkey.com
/rlm/prod/rate/limit/max/concurrent = 8
```

### Configuration Script

**Script**: `scripts/configure.sh`

```bash
#!/bin/bash
ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <environment>"
    exit 1
fi

echo "Configuring environment: $ENVIRONMENT"

# Generate configuration from templates
docker run --rm \
    -v $(pwd)/configs:/templates \
    -v $(pwd)/hogan-configs:/configs \
    -e ENVIRONMENT=$ENVIRONMENT \
    hogan-processor:latest

# Replace Octopus variables with Parameter Store values
if [ -f "scripts/secrets/$ENVIRONMENT.properties" ]; then
    source "scripts/secrets/$ENVIRONMENT.properties"
    
    # Replace variables in generated configs
    for file in wildfly/standalone/configuration/*.xml; do
        sed -i "s/#{DB.PASSWORD}/$DB_PASSWORD/g" "$file"
        sed -i "s/#{AUTH.CLIENT.SECRET}/$AUTH_CLIENT_SECRET/g" "$file"
    done
fi

echo "Configuration complete for $ENVIRONMENT"
```

## Rollback Procedures

### Automated Rollback

#### ECS Service Rollback
```bash
# Get previous task definition
PREVIOUS_TASK_DEF=$(aws ecs describe-services \
    --cluster prod-cluster \
    --services rlm-service \
    --query 'services[0].deployments[1].taskDefinition' \
    --output text)

# Update service to previous version
aws ecs update-service \
    --cluster prod-cluster \
    --service rlm-service \
    --task-definition $PREVIOUS_TASK_DEF

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster prod-cluster \
    --services rlm-service
```

#### Database Rollback
```bash
# Restore from automated backup
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier rlm-prod-rollback \
    --db-snapshot-identifier rlm-prod-pre-deployment-$(date +%Y%m%d)

# Update connection strings to point to rollback instance
aws ssm put-parameter \
    --name "/rlm/prod/db/host" \
    --value "rlm-prod-rollback.cluster-abc.us-east-1.rds.amazonaws.com" \
    --overwrite
```

### Manual Rollback Steps

1. **Identify Issue**
   - Check application health endpoints
   - Review CloudWatch metrics and logs
   - Validate external service connectivity

2. **Stop Traffic**
   - Update load balancer health check to fail
   - Drain existing connections
   - Route traffic to maintenance page

3. **Rollback Application**
   - Deploy previous known-good version
   - Verify deployment success
   - Run smoke tests

4. **Rollback Database** (if needed)
   - Restore from backup
   - Validate data integrity
   - Update connection configuration

5. **Resume Traffic**
   - Update health checks to pass
   - Gradually increase traffic
   - Monitor system stability

### Rollback Validation

#### Health Check Script
```bash
#!/bin/bash
ENVIRONMENT=$1
BASE_URL="https://${ENVIRONMENT}-rlm.passkey.com"

# Check application health
HEALTH_STATUS=$(curl -s "${BASE_URL}/health" | jq -r '.status')
if [ "$HEALTH_STATUS" != "UP" ]; then
    echo "Health check failed: $HEALTH_STATUS"
    exit 1
fi

# Check database connectivity
DB_STATUS=$(curl -s "${BASE_URL}/health" | jq -r '.database.status')
if [ "$DB_STATUS" != "UP" ]; then
    echo "Database check failed: $DB_STATUS"
    exit 1
fi

# Check external services
AUTH_STATUS=$(curl -s "${BASE_URL}/health" | jq -r '.authService.status')
if [ "$AUTH_STATUS" != "UP" ]; then
    echo "Auth service check failed: $AUTH_STATUS"
    exit 1
fi

echo "All health checks passed"
```

## Monitoring and Alerting

### CloudWatch Alarms

#### Application Metrics
```yaml
HighErrorRate:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RLM-HighErrorRate
    MetricName: 4XXError
    Namespace: AWS/ApplicationELB
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 10
    ComparisonOperator: GreaterThanThreshold

HighResponseTime:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RLM-HighResponseTime
    MetricName: TargetResponseTime
    Namespace: AWS/ApplicationELB
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
```

#### Database Metrics
```yaml
DatabaseCPUHigh:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RLM-DB-CPUHigh
    MetricName: CPUUtilization
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80
    ComparisonOperator: GreaterThanThreshold

DatabaseConnectionsHigh:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RLM-DB-ConnectionsHigh
    MetricName: DatabaseConnections
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80
    ComparisonOperator: GreaterThanThreshold
```

### Datadog Integration

#### Custom Metrics
```java
// Application metrics
statsd.increment("rlm.file.upload.count");
statsd.histogram("rlm.file.processing.duration", processingTimeMs);
statsd.gauge("rlm.active.uploads", activeUploads);

// Business metrics
statsd.increment("rlm.reservation.created");
statsd.increment("rlm.reservation.modified");
statsd.increment("rlm.processing.error", "error_type:" + errorType);
```

#### Dashboard Configuration
- **Application Performance**: Response times, throughput, error rates
- **Infrastructure**: CPU, memory, disk usage
- **Business Metrics**: Upload volumes, processing success rates
- **External Dependencies**: Auth service, ClamAV, database health