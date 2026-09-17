# Deployment

## Infrastructure

The Passkey Planners Service is deployed on AWS infrastructure using containerized deployment with Docker and orchestrated through Cvent's internal deployment platform.

### AWS Services Used
- **ECS (Elastic Container Service)**: Container orchestration
- **ALB (Application Load Balancer)**: Load balancing and traffic distribution
- **RDS (Relational Database Service)**: PostgreSQL database hosting
- **ElastiCache**: Redis caching layer
- **CloudWatch**: Monitoring and logging
- **Route 53**: DNS management
- **VPC**: Network isolation and security

### Container Configuration
```dockerfile
FROM openjdk:17-jre-slim

# Set working directory
WORKDIR /app

# Copy application JAR
COPY passkey-planners-service/target/passkey-planners-service-*.jar app.jar

# Copy configuration
COPY passkey-planners-service/configs/ configs/

# Expose ports
EXPOSE 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/healthcheck || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar", "server", "configs/production.yaml"]
```

## Environments

### Development Environment
- **Purpose**: Local development and testing
- **Infrastructure**: Local Docker containers
- **Database**: Local PostgreSQL instance
- **Configuration**: `configs/dev.yaml`
- **Access**: http://localhost:8080
- **Admin Port**: http://localhost:8081

**Environment Variables**:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=passkey_planners_dev
DB_USER=dev_user
DB_PASSWORD=dev_password
AUTH_SERVICE_URL=https://auth-dev.cvent.com
LOG_LEVEL=DEBUG
```

### Staging Environment
- **Purpose**: Pre-production testing and validation
- **Infrastructure**: AWS ECS with 2 instances
- **Database**: RDS PostgreSQL (Multi-AZ for testing failover)
- **Configuration**: `configs/staging.yaml`
- **Access**: https://passkey-planners-staging.cvent.com
- **Load Balancer**: ALB with health checks

**Environment Variables**:
```bash
DB_HOST=passkey-planners-staging.cluster-xyz.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=passkey_planners_staging
DB_USER=${STAGING_DB_USER}
DB_PASSWORD=${STAGING_DB_PASSWORD}
AUTH_SERVICE_URL=https://auth-staging.cvent.com
LOG_LEVEL=INFO
DATADOG_API_KEY=${STAGING_DATADOG_KEY}
```

### Production Environment
- **Purpose**: Live production workloads
- **Infrastructure**: AWS ECS with auto-scaling (2-10 instances)
- **Database**: RDS PostgreSQL with Multi-AZ deployment
- **Configuration**: `configs/production.yaml`
- **Access**: https://passkey-planners.cvent.com
- **Load Balancer**: ALB with SSL termination and health checks
- **Caching**: ElastiCache Redis cluster

**Environment Variables**:
```bash
DB_HOST=passkey-planners-prod.cluster-abc.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=passkey_planners_production
DB_USER=${PROD_DB_USER}
DB_PASSWORD=${PROD_DB_PASSWORD}
AUTH_SERVICE_URL=https://auth.cvent.com
LOG_LEVEL=INFO
DATADOG_API_KEY=${PROD_DATADOG_KEY}
REDIS_HOST=passkey-planners-cache.abc123.cache.amazonaws.com
REDIS_PORT=6379
```

## CI/CD Pipeline

### Jenkins Pipeline
**URL**: https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-planners

### Pipeline Stages

#### 1. Source Code Checkout
```groovy
stage('Checkout') {
    steps {
        checkout scm
        sh 'git clean -fdx'
    }
}
```

#### 2. Build and Test
```groovy
stage('Build') {
    steps {
        sh 'mvn clean compile'
    }
}

stage('Unit Tests') {
    steps {
        sh 'mvn test'
    }
    post {
        always {
            publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
            publishCoverage adapters: [jacocoAdapter('**/target/site/jacoco/jacoco.xml')]
        }
    }
}
```

#### 3. Code Quality
```groovy
stage('Code Quality') {
    steps {
        sh 'mvn checkstyle:check'
        sh 'mvn sonar:sonar'
    }
}
```

#### 4. Integration Tests
```groovy
stage('Integration Tests') {
    steps {
        sh 'mvn -Prun-it -Denv.IT_ENVIRONMENT=staging verify'
    }
    post {
        always {
            publishTestResults testResultsPattern: '**/target/failsafe-reports/*.xml'
        }
    }
}
```

#### 5. Package
```groovy
stage('Package') {
    steps {
        sh 'mvn package -Prelease -DskipTests'
        archiveArtifacts artifacts: '**/target/*.jar', fingerprint: true
    }
}
```

#### 6. Docker Build
```groovy
stage('Docker Build') {
    steps {
        script {
            def image = docker.build("cvent/passkey-planners:${env.BUILD_NUMBER}")
            docker.withRegistry('https://registry.cvent.com', 'docker-registry-credentials') {
                image.push()
                image.push('latest')
            }
        }
    }
}
```

#### 7. Deploy to Staging
```groovy
stage('Deploy to Staging') {
    when {
        branch 'master'
    }
    steps {
        sh './deploy.sh staging ${BUILD_NUMBER}'
    }
}
```

#### 8. Deploy to Production
```groovy
stage('Deploy to Production') {
    when {
        branch 'master'
    }
    input {
        message "Deploy to production?"
        ok "Deploy"
    }
    steps {
        sh './deploy.sh production ${BUILD_NUMBER}'
    }
}
```

### Deployment Scripts

#### deploy.sh
```bash
#!/bin/bash
ENVIRONMENT=$1
BUILD_NUMBER=$2

echo "Deploying passkey-planners to $ENVIRONMENT with build $BUILD_NUMBER"

# Update ECS service with new image
aws ecs update-service \
    --cluster passkey-$ENVIRONMENT \
    --service passkey-planners \
    --task-definition passkey-planners-$ENVIRONMENT:$BUILD_NUMBER \
    --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster passkey-$ENVIRONMENT \
    --services passkey-planners

echo "Deployment completed successfully"
```

## Configuration Management

### Hogan Templates
Configuration files are managed through Hogan templates in the `passkey-planners-service/configs/` directory:

```yaml
# Template: production.yaml.hogan
database:
  url: jdbc:postgresql://{{database.host}}:{{database.port}}/{{database.name}}
  user: {{database.user}}
  password: {{database.password}}

server:
  applicationConnectors:
    - type: http
      port: {{server.port}}

auth:
  apiKeyValidationUrl: {{auth.service.url}}/validate

datadog:
  apiKey: {{datadog.api.key}}
  environment: {{environment.name}}
```

### Environment-Specific Values
Values are injected during deployment based on the target environment:

**Staging**:
```json
{
  "database": {
    "host": "passkey-planners-staging.cluster-xyz.us-east-1.rds.amazonaws.com",
    "port": "5432",
    "name": "passkey_planners_staging",
    "user": "${STAGING_DB_USER}",
    "password": "${STAGING_DB_PASSWORD}"
  },
  "server": {
    "port": "8080"
  },
  "environment": {
    "name": "staging"
  }
}
```

## Health Checks and Monitoring

### Application Health Checks
```yaml
# Dropwizard health check configuration
healthChecks:
  - name: database
    type: database
    validationQuery: SELECT 1
  - name: auth-service
    type: http
    url: ${AUTH_SERVICE_URL}/health
  - name: disk-space
    type: diskSpace
    threshold: 90%
```

### Load Balancer Health Checks
```json
{
  "healthCheckPath": "/healthcheck",
  "healthCheckIntervalSeconds": 30,
  "healthCheckTimeoutSeconds": 10,
  "healthyThresholdCount": 2,
  "unhealthyThresholdCount": 3,
  "matcher": {
    "httpCode": "200"
  }
}
```

### Monitoring Alerts
**Datadog Alerts**:
- High error rate (>5% for 5 minutes)
- Slow response time (>500ms 95th percentile for 10 minutes)
- Service unavailability (health check failures)
- Database connection pool exhaustion
- Memory usage >80% for 15 minutes

## Rollback Procedures

### Automated Rollback
```bash
#!/bin/bash
# rollback.sh
ENVIRONMENT=$1
PREVIOUS_BUILD=$2

echo "Rolling back passkey-planners in $ENVIRONMENT to build $PREVIOUS_BUILD"

# Get previous task definition
PREVIOUS_TASK_DEF=$(aws ecs describe-task-definition \
    --task-definition passkey-planners-$ENVIRONMENT:$PREVIOUS_BUILD \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

# Update service to use previous task definition
aws ecs update-service \
    --cluster passkey-$ENVIRONMENT \
    --service passkey-planners \
    --task-definition $PREVIOUS_TASK_DEF \
    --force-new-deployment

# Wait for rollback to complete
aws ecs wait services-stable \
    --cluster passkey-$ENVIRONMENT \
    --services passkey-planners

echo "Rollback completed successfully"
```

### Manual Rollback Steps
1. **Identify Issue**: Monitor alerts and logs to confirm need for rollback
2. **Get Previous Version**: Identify last known good build number
3. **Execute Rollback**: Run rollback script with previous build number
4. **Verify Health**: Confirm service health checks pass
5. **Monitor**: Watch metrics and logs for stability
6. **Communicate**: Notify stakeholders of rollback completion

### Database Rollback
For database schema changes:
1. **Schema Versioning**: Use Flyway or Liquibase for versioned migrations
2. **Backward Compatibility**: Ensure new code works with old schema
3. **Data Migration**: Plan for data rollback if needed
4. **Testing**: Test rollback procedures in staging environment

### Emergency Procedures
**Service Outage**:
1. Check load balancer health
2. Verify database connectivity
3. Review recent deployments
4. Execute rollback if deployment-related
5. Scale up instances if capacity issue
6. Engage on-call engineer if needed

**Database Issues**:
1. Check RDS metrics and logs
2. Verify connection pool settings
3. Consider read replica failover
4. Contact DBA team for assistance
5. Implement circuit breaker if needed

## Blue-Green Deployment

For zero-downtime deployments:

### Blue-Green Setup
```bash
# Create green environment
aws ecs create-service \
    --cluster passkey-production \
    --service-name passkey-planners-green \
    --task-definition passkey-planners-production:$NEW_BUILD \
    --desired-count 2

# Wait for green to be healthy
aws ecs wait services-stable \
    --cluster passkey-production \
    --services passkey-planners-green

# Switch traffic to green
aws elbv2 modify-target-group \
    --target-group-arn $TARGET_GROUP_ARN \
    --targets Id=passkey-planners-green

# Verify green is receiving traffic
# Monitor for 10 minutes

# Terminate blue environment
aws ecs update-service \
    --cluster passkey-production \
    --service passkey-planners-blue \
    --desired-count 0
```

This deployment strategy ensures zero downtime and provides an easy rollback path by switching traffic back to the blue environment if issues are detected.