# Deployment

## Infrastructure

The Passkey Integration Service is deployed on AWS using a containerized architecture with the following components:

### AWS Services
- **Amazon ECS (Elastic Container Service)**: Container orchestration
- **Application Load Balancer (ALB)**: Traffic distribution and SSL termination
- **Amazon RDS for Oracle**: Managed database service
- **AWS CloudWatch**: Monitoring and logging
- **AWS Systems Manager Parameter Store**: Configuration management
- **AWS IAM**: Identity and access management
- **Amazon VPC**: Network isolation and security

### Container Platform
- **Docker**: Application containerization
- **Amazon ECR**: Container image registry
- **ECS Fargate**: Serverless container compute

## Environments

### Development Environment
- **URL**: `https://passkey-integration-dev.cvent.com`
- **Infrastructure**: 
  - ECS Service: 1-2 tasks
  - CPU: 0.5 vCPU per task
  - Memory: 1 GB per task
  - Database: RDS Oracle (db.t3.micro)
- **Configuration**: 
  - Debug logging enabled
  - Extended health check intervals
  - Development OAuth endpoints
- **Deployment**: Automatic on merge to `develop` branch

### Staging Environment
- **URL**: `https://passkey-integration-staging.cvent.com`
- **Infrastructure**:
  - ECS Service: 2-3 tasks
  - CPU: 1 vCPU per task
  - Memory: 2 GB per task
  - Database: RDS Oracle (db.t3.small)
- **Configuration**:
  - Info level logging
  - Production-like OAuth configuration
  - Performance monitoring enabled
- **Deployment**: Manual promotion from development

### Production Environment
- **URL**: `https://passkey-integration.cvent.com`
- **Infrastructure**:
  - ECS Service: 3-5 tasks (auto-scaling)
  - CPU: 2 vCPU per task
  - Memory: 4 GB per task
  - Database: RDS Oracle (db.r5.large) with Multi-AZ
- **Configuration**:
  - Warn level logging
  - Production OAuth endpoints
  - Full monitoring and alerting
- **Deployment**: Manual promotion with approval process

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The service uses a Jenkins-based CI/CD pipeline defined in the `Jenkinsfile`:

```groovy
buildPipeline(
  label: 'ecs-x86-medium',
  packageFilter: 'root-only',
  stablePrereleaseId: true,
  skipCacheBehavior: 'remote-only',
  awsUser: 'cdk',
  enableNxVerifyDeploy: true,
  ci: [
    lock: 'branch' // allow parallel ci builds across branches
  ],
  ignoreFiles: [
    'docs/**',
    '*.md',
    'mkdocs.yaml',
    'renovate.json',
    'CODEOWNERS',
    'catalog-info.yaml',
  ],
  trunk: 'master',
  release: [
    branches: ['master']
  ],
  slack: [
    [branches: ['master'], channels: ['#passkey-api'], events: ['FAILURE']],
    [branches: ['.*'], channels: ['#passkey-api']]
  ]
)
```

### Pipeline Stages

1. **Source Checkout**: Clone repository and checkout specific branch
2. **Build**: Compile Java code and run unit tests
3. **Test**: Execute integration tests and generate coverage reports
4. **Quality Gate**: SonarQube analysis and quality checks
5. **Package**: Build Docker image and push to ECR
6. **Deploy**: Deploy to target environment using AWS CDK
7. **Verify**: Run smoke tests against deployed service
8. **Notify**: Send deployment notifications to Slack

### Build Triggers

- **Automatic**: Triggered on push to any branch
- **Scheduled**: Nightly builds for dependency updates
- **Manual**: Can be triggered manually for hotfixes

## AWS CDK Infrastructure

### Infrastructure as Code

The service infrastructure is defined using AWS CDK in TypeScript:

```typescript
// infra/passkey-integration-stack.ts
export class PasskeyIntegrationStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // VPC Configuration
    const vpc = new Vpc(this, 'PasskeyIntegrationVpc', {
      maxAzs: 2,
      natGateways: 1
    });

    // ECS Cluster
    const cluster = new Cluster(this, 'PasskeyIntegrationCluster', {
      vpc,
      containerInsights: true
    });

    // Application Load Balancer
    const alb = new ApplicationLoadBalancer(this, 'PasskeyIntegrationALB', {
      vpc,
      internetFacing: true
    });

    // ECS Service
    const service = new ApplicationLoadBalancedFargateService(this, 'PasskeyIntegrationService', {
      cluster,
      taskImageOptions: {
        image: ContainerImage.fromEcrRepository(repository),
        containerPort: 8080,
        environment: {
          SPRING_PROFILES_ACTIVE: props.environment
        },
        secrets: {
          DATABASE_PASSWORD: Secret.fromSecretsManager(dbSecret)
        }
      },
      memoryLimitMiB: 2048,
      cpu: 1024,
      desiredCount: 2,
      loadBalancer: alb
    });

    // Auto Scaling
    const scaling = service.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80
    });
  }
}
```

### Database Configuration

```typescript
// RDS Oracle Database
const database = new DatabaseInstance(this, 'PasskeyIntegrationDB', {
  engine: DatabaseInstanceEngine.oracleEe({
    version: OracleEngineVersion.VER_19_0_0_0_2020_04_R1
  }),
  instanceType: InstanceType.of(InstanceClass.R5, InstanceSize.LARGE),
  vpc,
  credentials: Credentials.fromGeneratedSecret('admin'),
  multiAz: true,
  storageEncrypted: true,
  backupRetention: Duration.days(7),
  deletionProtection: true
});
```

## Configuration Management

### Environment-Specific Configuration

Configuration is managed through AWS Systems Manager Parameter Store:

#### Development Parameters
```
/passkey-integration/dev/database/url
/passkey-integration/dev/database/username
/passkey-integration/dev/oauth/issuer-uri
/passkey-integration/dev/logging/level
```

#### Production Parameters
```
/passkey-integration/prod/database/url
/passkey-integration/prod/database/username
/passkey-integration/prod/oauth/issuer-uri
/passkey-integration/prod/logging/level
```

### Secrets Management

Sensitive configuration is stored in AWS Secrets Manager:

```json
{
  "database-credentials": {
    "username": "passkey_user",
    "password": "generated-secure-password"
  },
  "oauth-client-secret": "oauth-client-secret-value"
}
```

### Configuration Injection

```yaml
# ECS Task Definition
environment:
  - name: SPRING_PROFILES_ACTIVE
    value: ${ENVIRONMENT}
  - name: DATABASE_URL
    valueFrom: /passkey-integration/${ENVIRONMENT}/database/url
secrets:
  - name: DATABASE_PASSWORD
    valueFrom: arn:aws:secretsmanager:region:account:secret:passkey-integration-db
```

## Monitoring and Alerting

### CloudWatch Metrics

#### Application Metrics
- HTTP request count and latency
- Database connection pool usage
- JVM memory and CPU utilization
- Custom business metrics

#### Infrastructure Metrics
- ECS service CPU and memory utilization
- ALB request count and response times
- RDS database performance metrics
- Network throughput and error rates

### CloudWatch Alarms

```typescript
// High CPU Utilization
new Alarm(this, 'HighCpuAlarm', {
  metric: service.service.metricCpuUtilization(),
  threshold: 80,
  evaluationPeriods: 2,
  treatMissingData: TreatMissingData.NOT_BREACHING
});

// High Memory Utilization
new Alarm(this, 'HighMemoryAlarm', {
  metric: service.service.metricMemoryUtilization(),
  threshold: 85,
  evaluationPeriods: 2
});

// Database Connection Failures
new Alarm(this, 'DatabaseConnectionAlarm', {
  metric: new Metric({
    namespace: 'PasskeyIntegration',
    metricName: 'DatabaseConnectionFailures',
    statistic: 'Sum'
  }),
  threshold: 5,
  evaluationPeriods: 1
});
```

### Log Aggregation

```typescript
// CloudWatch Log Group
const logGroup = new LogGroup(this, 'PasskeyIntegrationLogs', {
  logGroupName: '/aws/ecs/passkey-integration',
  retention: RetentionDays.ONE_MONTH
});

// Log Insights Queries
const errorQuery = new CfnQueryDefinition(this, 'ErrorQuery', {
  name: 'PasskeyIntegration-Errors',
  logGroupNames: [logGroup.logGroupName],
  queryString: `
    fields @timestamp, @message
    | filter @message like /ERROR/
    | sort @timestamp desc
    | limit 100
  `
});
```

## Deployment Procedures

### Standard Deployment

1. **Pre-deployment Checks**:
   ```bash
   # Verify build status
   curl -s https://ci-jenkins.core.cvent.org/job/passkey-integration-sb/lastBuild/api/json
   
   # Check service health
   curl -s https://passkey-integration-staging.cvent.com/health
   ```

2. **Deployment Execution**:
   ```bash
   # Deploy via Jenkins
   curl -X POST https://ci-jenkins.core.cvent.org/job/passkey-integration-sb/build
   
   # Or deploy via CDK
   cd packages/passkey-integration/infra
   cdk deploy PasskeyIntegrationStack-prod
   ```

3. **Post-deployment Verification**:
   ```bash
   # Health check
   curl -s https://passkey-integration.cvent.com/health
   
   # API functionality test
   curl -H "Authorization: Bearer $TOKEN" \
        https://passkey-integration.cvent.com/passkey-integration/v1/user/default
   ```

### Blue-Green Deployment

For zero-downtime deployments:

1. **Deploy to Green Environment**:
   ```bash
   cdk deploy PasskeyIntegrationStack-prod-green
   ```

2. **Validate Green Environment**:
   ```bash
   # Run integration tests against green environment
   mvn test -Prun-it -Dtest.environment=prod-green
   ```

3. **Switch Traffic**:
   ```bash
   # Update ALB target group to point to green environment
   aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
     --default-actions Type=forward,TargetGroupArn=$GREEN_TARGET_GROUP
   ```

4. **Monitor and Rollback if Needed**:
   ```bash
   # Monitor metrics for 15 minutes
   # If issues detected, rollback:
   aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
     --default-actions Type=forward,TargetGroupArn=$BLUE_TARGET_GROUP
   ```

## Rollback Procedures

### Automatic Rollback

ECS service is configured with automatic rollback on deployment failure:

```typescript
const service = new FargateService(this, 'Service', {
  // ... other configuration
  deploymentConfiguration: {
    maximumPercent: 200,
    minimumHealthyPercent: 50,
    deploymentCircuitBreaker: {
      enable: true,
      rollback: true
    }
  }
});
```

### Manual Rollback

1. **Identify Previous Stable Version**:
   ```bash
   # List recent deployments
   aws ecs describe-services --cluster passkey-integration-cluster \
     --services passkey-integration-service
   ```

2. **Rollback to Previous Version**:
   ```bash
   # Update service to previous task definition
   aws ecs update-service --cluster passkey-integration-cluster \
     --service passkey-integration-service \
     --task-definition passkey-integration:123
   ```

3. **Verify Rollback**:
   ```bash
   # Check service status
   aws ecs describe-services --cluster passkey-integration-cluster \
     --services passkey-integration-service
   
   # Verify application health
   curl -s https://passkey-integration.cvent.com/health
   ```

### Database Rollback

For database schema changes:

1. **Backup Current State**:
   ```sql
   -- Create backup before rollback
   CREATE TABLE PASSKEY_USERS_BACKUP AS SELECT * FROM PASSKEY_USERS;
   ```

2. **Execute Rollback Scripts**:
   ```bash
   # Run rollback migration scripts
   flyway -url=$DATABASE_URL -user=$DB_USER -password=$DB_PASSWORD \
     -locations=filesystem:db/rollback migrate
   ```

3. **Verify Data Integrity**:
   ```sql
   -- Verify critical data
   SELECT COUNT(*) FROM PASSKEY_USERS WHERE STATUS = 'ACTIVE';
   ```

## Security Considerations

### Network Security
- VPC with private subnets for application and database
- Security groups restricting access to necessary ports only
- WAF rules for common attack patterns

### Data Security
- Encryption in transit (TLS 1.2+)
- Encryption at rest for database and logs
- Secrets stored in AWS Secrets Manager

### Access Control
- IAM roles with least privilege principle
- Service-to-service authentication using IAM roles
- Regular access reviews and rotation of credentials

## Disaster Recovery

### Backup Strategy
- Automated daily database backups with 7-day retention
- Cross-region backup replication for critical data
- Application configuration backed up in version control

### Recovery Procedures
1. **Database Recovery**: Restore from RDS automated backup
2. **Application Recovery**: Redeploy from last known good image
3. **Configuration Recovery**: Restore from Parameter Store backup

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Mean Time to Recovery (MTTR)**: 2 hours