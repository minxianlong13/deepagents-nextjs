# Deployment

## Infrastructure

The Passkey Inbound Service is deployed on AWS using a containerized architecture with the following components:

### AWS Services

- **Amazon ECS (Elastic Container Service)**: Container orchestration
- **Application Load Balancer (ALB)**: Traffic distribution and SSL termination
- **Amazon ECR (Elastic Container Registry)**: Container image storage
- **AWS Fargate**: Serverless container compute
- **Amazon VPC**: Network isolation and security
- **AWS CloudFormation/CDK**: Infrastructure as Code

### Supporting Services

- **Amazon SQS**: Message queuing for asynchronous processing
- **Amazon DynamoDB**: Configuration and metadata storage
- **Amazon S3**: File storage and logging
- **AWS Lambda**: Event processing functions
- **Amazon CloudWatch**: Monitoring and logging
- **AWS Secrets Manager**: Secure credential storage

## Environments

### Development Environment

**Infrastructure**:
- **Region**: us-east-1
- **VPC**: passkey-dev-vpc
- **Subnets**: Private subnets across 3 AZs
- **ECS Cluster**: passkey-dev-cluster
- **Service**: passkey-inbound-dev-service

**Configuration**:
- **CPU**: 512 CPU units (0.5 vCPU)
- **Memory**: 1024 MB (1 GB)
- **Desired Count**: 2 instances
- **Auto Scaling**: 2-4 instances based on CPU/memory
- **Health Check**: `/actuator/health`

**Environment Variables**:
```bash
ENV=dev
AWS_REGION=us-east-1
ExternalDataLoadSqsName=passkey-inbound-external-data-load-dev
InboundConfigsDynamoDbName=inbound-configs-dev
SPRING_PROFILES_ACTIVE=dev
LOG_LEVEL=DEBUG
```

**Endpoints**:
- **Service URL**: https://passkey-inbound-dev.cvent.com
- **Health Check**: https://passkey-inbound-dev.cvent.com/actuator/health
- **GraphQL**: https://passkey-inbound-dev.cvent.com/graphql

### Staging Environment

**Infrastructure**:
- **Region**: us-east-1
- **VPC**: passkey-staging-vpc
- **Subnets**: Private subnets across 3 AZs
- **ECS Cluster**: passkey-staging-cluster
- **Service**: passkey-inbound-staging-service

**Configuration**:
- **CPU**: 1024 CPU units (1 vCPU)
- **Memory**: 2048 MB (2 GB)
- **Desired Count**: 3 instances
- **Auto Scaling**: 3-6 instances based on CPU/memory
- **Health Check**: `/actuator/health`

**Environment Variables**:
```bash
ENV=staging
AWS_REGION=us-east-1
ExternalDataLoadSqsName=passkey-inbound-external-data-load-staging
InboundConfigsDynamoDbName=inbound-configs-staging
SPRING_PROFILES_ACTIVE=staging
LOG_LEVEL=INFO
```

**Endpoints**:
- **Service URL**: https://passkey-inbound-staging.cvent.com
- **Health Check**: https://passkey-inbound-staging.cvent.com/actuator/health

### Production Environment

**Infrastructure**:
- **Region**: us-east-1 (primary), us-west-2 (DR)
- **VPC**: passkey-prod-vpc
- **Subnets**: Private subnets across 3 AZs
- **ECS Cluster**: passkey-prod-cluster
- **Service**: passkey-inbound-prod-service

**Configuration**:
- **CPU**: 2048 CPU units (2 vCPU)
- **Memory**: 4096 MB (4 GB)
- **Desired Count**: 6 instances
- **Auto Scaling**: 6-20 instances based on CPU/memory/SQS queue depth
- **Health Check**: `/actuator/health`

**Environment Variables**:
```bash
ENV=production
AWS_REGION=us-east-1
ExternalDataLoadSqsName=passkey-inbound-external-data-load-prod
InboundConfigsDynamoDbName=inbound-configs-prod
SPRING_PROFILES_ACTIVE=production
LOG_LEVEL=WARN
```

**Endpoints**:
- **Service URL**: https://passkey-inbound.cvent.com
- **Health Check**: https://passkey-inbound.cvent.com/actuator/health

## CI/CD Pipeline

### Jenkins Pipeline

The service uses Jenkins for continuous integration and deployment:

**Pipeline Configuration** (`Jenkinsfile`):
```groovy
buildPipeline([
    label: 'ecs-x86-medium',
    packageFilter: 'root-only',
    stablePrereleaseId: true,
    enableNxVerifyDeploy: true,
    awsUser: 'cdk',
    ci: [
        lock: 'branch' // allow parallel ci builds across branches
    ],
    publish: [
        [
            branches: ['development']
        ],
    ],
    slack: [
        [ branches: ['master', 'development'], channels: ['passkey-api'] ],
        [ branches: ['.*'], channels: ['_owner_'] ]
    ],
    skipCacheBehavior: 'remote-only'
])
```

### Build Stages

1. **Checkout**: Source code retrieval from GitHub
2. **Build**: Maven build and test execution
3. **Package**: Docker image creation
4. **Security Scan**: Container vulnerability scanning
5. **Push**: Image push to ECR
6. **Deploy**: ECS service update
7. **Verify**: Health check and smoke tests
8. **Notify**: Slack notifications

### Build Commands

**Local Build**:
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Build Docker image
docker build -t passkey-inbound-service .
```

**Maven Build**:
```bash
# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package application
mvn package

# Build with integration tests
mvn verify -P run-it
```

### Docker Configuration

**Dockerfile**:
```dockerfile
FROM openjdk:17-jre-slim

# Create app user
RUN groupadd -r app && useradd -r -g app app

# Set working directory
WORKDIR /app

# Copy application JAR
COPY packages/passkey-inbound/service/target/passkey-inbound-service-*.jar app.jar

# Copy configuration
COPY packages/passkey-inbound/service/configs/ configs/

# Change ownership
RUN chown -R app:app /app

# Switch to app user
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Docker Compose** (for local development):
```yaml
version: '3.8'
services:
  passkey-inbound:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=local
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=test
      - AWS_SECRET_ACCESS_KEY=test
    depends_on:
      - localstack
      
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=sqs,dynamodb,s3,lambda
      - DEBUG=1
    volumes:
      - "./localstack:/etc/localstack/init/ready.d"
```

## Configuration Management

### AWS Systems Manager Parameter Store

**Parameter Hierarchy**:
```
/passkey-inbound/dev/
├── database/
│   ├── host
│   ├── port
│   ├── name
│   └── credentials (SecureString)
├── aws/
│   ├── region
│   └── sqs/
│       ├── external-data-load-queue
│       └── business-events-queue
└── oauth/
    ├── issuer-uri
    └── client-credentials (SecureString)
```

**Parameter Retrieval**:
```java
@Configuration
@ConfigurationProperties(prefix = "passkey.inbound")
public class PasskeyInboundConfig {
    
    @Value("${aws.sqs.external-data-load}")
    private String externalDataLoadQueue;
    
    @Value("${aws.dynamodb.inbound-configs}")
    private String inboundConfigsTable;
    
    // Getters and setters
}
```

### Secrets Management

**AWS Secrets Manager**:
```json
{
  "name": "passkey-inbound/prod/database",
  "description": "Database credentials for production",
  "secretString": {
    "username": "passkey_inbound_user",
    "password": "secure_password_here",
    "host": "prod-db.cluster-xyz.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "dbname": "passkey_inbound"
  }
}
```

**Secret Rotation**:
- Automatic rotation every 90 days
- Zero-downtime rotation using connection pooling
- Notification to team via Slack on rotation events

## Monitoring and Alerting

### CloudWatch Metrics

**Custom Metrics**:
- `PasskeyInbound/EventsProcessed` - Events processed per minute
- `PasskeyInbound/EventsFailedRate` - Failed event processing rate
- `PasskeyInbound/ActiveSubscriptions` - Number of active GraphQL subscriptions
- `PasskeyInbound/ConfigurationUpdates` - Configuration changes per hour

**AWS Metrics**:
- ECS service CPU and memory utilization
- ALB request count and latency
- SQS queue depth and message age
- DynamoDB read/write capacity utilization

### Alarms

**Critical Alarms**:
```yaml
HighErrorRate:
  MetricName: HTTPCode_Target_5XX_Count
  Threshold: 10
  Period: 300
  EvaluationPeriods: 2
  ComparisonOperator: GreaterThanThreshold
  
HighLatency:
  MetricName: TargetResponseTime
  Threshold: 5.0
  Period: 300
  EvaluationPeriods: 3
  ComparisonOperator: GreaterThanThreshold
  
ServiceDown:
  MetricName: HealthyHostCount
  Threshold: 1
  Period: 60
  EvaluationPeriods: 2
  ComparisonOperator: LessThanThreshold
```

**Warning Alarms**:
- High CPU utilization (>70%)
- High memory utilization (>80%)
- SQS queue depth growing (>1000 messages)
- Failed health checks

### Dashboards

**Operational Dashboard**:
- Service health and availability
- Request volume and latency
- Error rates and types
- Resource utilization

**Business Dashboard**:
- Events processed by type
- Active integrations
- Configuration changes
- Subscription activity

## Rollback Procedures

### Automated Rollback

**ECS Service Rollback**:
```bash
# Get current task definition
CURRENT_TASK_DEF=$(aws ecs describe-services \
  --cluster passkey-prod-cluster \
  --services passkey-inbound-prod-service \
  --query 'services[0].taskDefinition' \
  --output text)

# Get previous task definition
PREVIOUS_TASK_DEF=$(aws ecs list-task-definitions \
  --family-prefix passkey-inbound-service \
  --status ACTIVE \
  --sort DESC \
  --query 'taskDefinitionArns[1]' \
  --output text)

# Update service to previous version
aws ecs update-service \
  --cluster passkey-prod-cluster \
  --service passkey-inbound-prod-service \
  --task-definition $PREVIOUS_TASK_DEF
```

### Manual Rollback Steps

1. **Identify Issue**: Confirm the need for rollback through monitoring
2. **Stop Traffic**: Update ALB to route traffic to healthy instances
3. **Rollback Service**: Deploy previous known-good version
4. **Verify Health**: Confirm service health and functionality
5. **Restore Traffic**: Gradually restore traffic to rolled-back service
6. **Monitor**: Watch metrics and logs for stability
7. **Communicate**: Notify stakeholders of rollback completion

### Database Rollback

**Configuration Rollback**:
```bash
# Backup current configuration
aws dynamodb scan \
  --table-name inbound-configs-prod \
  --output json > config-backup-$(date +%Y%m%d-%H%M%S).json

# Restore from previous backup
aws dynamodb batch-write-item \
  --request-items file://config-restore.json
```

## Disaster Recovery

### Multi-Region Setup

**Primary Region**: us-east-1
**DR Region**: us-west-2

**Replication**:
- DynamoDB Global Tables for configuration data
- S3 Cross-Region Replication for logs and files
- ECR image replication to DR region

**Failover Process**:
1. **Detection**: Automated health checks detect region failure
2. **DNS Update**: Route 53 health checks redirect traffic
3. **Service Activation**: ECS services start in DR region
4. **Data Sync**: Verify data consistency across regions
5. **Monitoring**: Enhanced monitoring during DR operation

**Recovery Time Objective (RTO)**: 15 minutes
**Recovery Point Objective (RPO)**: 5 minutes

### Backup Strategy

**Configuration Backup**:
- Daily DynamoDB table backups
- Point-in-time recovery enabled
- Cross-region backup replication

**Application Backup**:
- Container images stored in ECR with lifecycle policies
- Infrastructure code in version control
- Configuration stored in Parameter Store with versioning

## Security

### Network Security

**VPC Configuration**:
- Private subnets for ECS tasks
- NAT Gateway for outbound internet access
- Security groups with least privilege access
- Network ACLs for additional layer of security

**Security Groups**:
```yaml
ECSSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for ECS tasks
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 8080
        ToPort: 8080
        SourceSecurityGroupId: !Ref ALBSecurityGroup
    SecurityGroupEgress:
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
```

### IAM Roles and Policies

**ECS Task Role**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage"
      ],
      "Resource": "arn:aws:sqs:*:*:passkey-inbound-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/inbound-configs-*"
    }
  ]
}
```

### Compliance

**SOC 2 Type II**: Annual compliance audit
**PCI DSS**: Payment card data security standards
**GDPR**: European data protection regulation compliance
**CCPA**: California consumer privacy act compliance

**Security Scanning**:
- Container vulnerability scanning with Twistlock
- Static code analysis with SonarQube
- Dependency vulnerability scanning
- Infrastructure security scanning with AWS Config