# Deployment

## Infrastructure Overview

The Passkey Event Data Service is deployed on Amazon Web Services (AWS) using a containerized architecture with Infrastructure as Code (IaC) principles. The deployment leverages AWS CDK (Cloud Development Kit) for infrastructure provisioning and management.

## Cloud Architecture

```
Internet Gateway
       │
   ┌───▼───┐
   │  ALB  │ (Application Load Balancer)
   └───┬───┘
       │
┌──────▼──────┐
│   ECS       │ (Elastic Container Service)
│   Service   │
└──────┬──────┘
       │
┌──────▼──────┐     ┌─────────────┐     ┌─────────────┐
│   ECS       │────▶│  DynamoDB   │     │     S3      │
│   Tasks     │     │   Tables    │     │   Buckets   │
└─────────────┘     └─────────────┘     └─────────────┘
       │
┌──────▼──────┐
│  CloudWatch │ (Monitoring & Logging)
│   Logs      │
└─────────────┘
```

## Environments

### Development Environment

**Purpose**: Development and testing environment for feature development

**Infrastructure**:
- **Region**: us-east-1
- **VPC**: Shared development VPC
- **ECS Cluster**: dev-passkey-cluster
- **Load Balancer**: dev-passkey-event-data-alb
- **Domain**: `dev-passkey-event-data.cvent.com`

**Resources**:
- **ECS Service**: 1-2 tasks
- **Task CPU**: 512 CPU units (0.5 vCPU)
- **Task Memory**: 1024 MB (1 GB)
- **DynamoDB**: On-demand billing mode
- **Auto Scaling**: Disabled

**Configuration**:
```yaml
environment: dev
logLevel: DEBUG
dynamoDBConfig:
  tableName: dev-passkey-event-requests
  region: us-east-1
reglinkService:
  endpoint: https://dev-reglink.cvent.com
```

### Staging Environment

**Purpose**: Pre-production testing and validation environment

**Infrastructure**:
- **Region**: us-east-1
- **VPC**: Shared staging VPC
- **ECS Cluster**: staging-passkey-cluster
- **Load Balancer**: staging-passkey-event-data-alb
- **Domain**: `staging-passkey-event-data.cvent.com`

**Resources**:
- **ECS Service**: 2-4 tasks
- **Task CPU**: 1024 CPU units (1 vCPU)
- **Task Memory**: 2048 MB (2 GB)
- **DynamoDB**: Provisioned throughput (5 RCU/WCU)
- **Auto Scaling**: Enabled (2-4 tasks)

**Configuration**:
```yaml
environment: staging
logLevel: INFO
dynamoDBConfig:
  tableName: staging-passkey-event-requests
  region: us-east-1
reglinkService:
  endpoint: https://staging-reglink.cvent.com
```

### Production Environment

**Purpose**: Live production environment serving customer traffic

**Infrastructure**:
- **Region**: us-east-1 (primary), us-west-2 (DR)
- **VPC**: Production VPC with multiple AZs
- **ECS Cluster**: prod-passkey-cluster
- **Load Balancer**: prod-passkey-event-data-alb
- **Domain**: `passkey-event-data.cvent.com`

**Resources**:
- **ECS Service**: 4-10 tasks
- **Task CPU**: 2048 CPU units (2 vCPU)
- **Task Memory**: 4096 MB (4 GB)
- **DynamoDB**: Provisioned throughput (100 RCU/WCU)
- **Auto Scaling**: Enabled (4-10 tasks)

**Configuration**:
```yaml
environment: prod
logLevel: INFO
dynamoDBConfig:
  tableName: prod-passkey-event-requests
  region: us-east-1
reglinkService:
  endpoint: https://reglink.cvent.com
```

## CI/CD Pipeline

### Pipeline Overview

The deployment pipeline is implemented using Jenkins with multiple stages for building, testing, and deploying the application.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │───▶│    Build    │───▶│    Test     │───▶│   Deploy    │
│  (GitHub)   │    │  (Maven)    │    │  (JUnit)    │    │   (CDK)     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Jenkins Pipeline Stages

#### 1. Source Code Checkout
```groovy
stage('Checkout') {
    steps {
        checkout scm
        sh 'git submodule update --init --recursive'
    }
}
```

#### 2. Build Application
```groovy
stage('Build') {
    steps {
        sh 'pnpm install'
        sh 'nx run passkey-event-data-service:build'
    }
}
```

#### 3. Run Tests
```groovy
stage('Test') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'nx run passkey-event-data-service:test'
            }
        }
        stage('Integration Tests') {
            steps {
                sh 'nx run passkey-event-data-service:ci:test'
            }
        }
    }
}
```

#### 4. Code Quality Analysis
```groovy
stage('SonarQube Analysis') {
    steps {
        sh 'nx run passkey-event-data-service:sonar'
    }
}
```

#### 5. Build Docker Image
```groovy
stage('Docker Build') {
    steps {
        sh 'nx run passkey-event-data-service:docker:build'
        sh 'docker tag passkey-event-data:latest ${ECR_REGISTRY}/passkey-event-data:${BUILD_NUMBER}'
    }
}
```

#### 6. Deploy Infrastructure
```groovy
stage('Deploy Infrastructure') {
    steps {
        sh 'nx run passkey-event-data-infra:deploy'
    }
}
```

#### 7. Deploy Application
```groovy
stage('Deploy Application') {
    steps {
        sh 'nx run passkey-event-data-service:deploy'
    }
}
```

### Deployment Triggers

#### Automatic Deployments
- **Development**: Triggered on every commit to `develop` branch
- **Staging**: Triggered on every commit to `main` branch
- **Production**: Triggered on creation of release tags (e.g., `v1.2.3`)

#### Manual Deployments
- Production deployments require manual approval
- Rollback deployments can be triggered manually
- Emergency hotfix deployments bypass normal approval process

## Infrastructure as Code

### AWS CDK Configuration

The infrastructure is defined using AWS CDK with TypeScript, located in the `packages/passkey-event-data/infra/` directory.

#### Main Stack Components

```typescript
export class PasskeyEventDataStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // VPC and Networking
    const vpc = this.createVpc();
    
    // ECS Cluster and Service
    const cluster = this.createEcsCluster(vpc);
    const service = this.createEcsService(cluster);
    
    // Load Balancer
    const alb = this.createApplicationLoadBalancer(vpc, service);
    
    // DynamoDB Tables
    const eventRequestsTable = this.createDynamoDbTable();
    
    // IAM Roles and Policies
    const taskRole = this.createTaskRole(eventRequestsTable);
    
    // CloudWatch Monitoring
    this.createMonitoring(service, eventRequestsTable);
  }
}
```

#### DynamoDB Table Definition

```typescript
private createDynamoDbTable(): Table {
  return new Table(this, 'EventRequestsTable', {
    tableName: `${this.environment}-passkey-event-requests`,
    partitionKey: {
      name: 'participantId',
      type: AttributeType.NUMBER
    },
    sortKey: {
      name: 'requestId',
      type: AttributeType.STRING
    },
    billingMode: this.environment === 'prod' 
      ? BillingMode.PROVISIONED 
      : BillingMode.ON_DEMAND,
    readCapacity: this.environment === 'prod' ? 100 : undefined,
    writeCapacity: this.environment === 'prod' ? 100 : undefined,
    pointInTimeRecovery: true,
    encryption: TableEncryption.AWS_MANAGED,
    removalPolicy: RemovalPolicy.RETAIN
  });
}
```

#### ECS Service Definition

```typescript
private createEcsService(cluster: Cluster): FargateService {
  const taskDefinition = new FargateTaskDefinition(this, 'TaskDef', {
    memoryLimitMiB: this.getMemoryLimit(),
    cpu: this.getCpuLimit(),
    taskRole: this.taskRole,
    executionRole: this.executionRole
  });

  const container = taskDefinition.addContainer('app', {
    image: ContainerImage.fromRegistry(this.getImageUri()),
    environment: this.getEnvironmentVariables(),
    logging: LogDrivers.awsLogs({
      streamPrefix: 'passkey-event-data',
      logRetention: RetentionDays.ONE_MONTH
    }),
    healthCheck: {
      command: ['CMD-SHELL', 'curl -f http://localhost:8080/healthcheck || exit 1'],
      interval: Duration.seconds(30),
      timeout: Duration.seconds(5),
      retries: 3
    }
  });

  container.addPortMappings({
    containerPort: 8080,
    protocol: Protocol.TCP
  });

  return new FargateService(this, 'Service', {
    cluster,
    taskDefinition,
    desiredCount: this.getDesiredCount(),
    assignPublicIp: false,
    enableExecuteCommand: true
  });
}
```

### Deployment Commands

#### Deploy Infrastructure
```bash
# Deploy to development
nx run passkey-event-data-infra:deploy --environment=dev

# Deploy to staging
nx run passkey-event-data-infra:deploy --environment=staging

# Deploy to production
nx run passkey-event-data-infra:deploy --environment=prod
```

#### Deploy Application
```bash
# Build and deploy service
nx run passkey-event-data-service:deploy --environment=prod

# Deploy specific version
nx run passkey-event-data-service:deploy --environment=prod --version=1.2.3
```

## Configuration Management

### Environment Variables

Environment-specific configuration is managed through AWS Systems Manager Parameter Store and AWS Secrets Manager.

#### Parameter Store Structure
```
/passkey-event-data/dev/
├── database/table-name
├── database/region
├── reglink/endpoint
├── auth/api-key-name
└── logging/level

/passkey-event-data/staging/
├── database/table-name
├── database/region
├── reglink/endpoint
├── auth/api-key-name
└── logging/level

/passkey-event-data/prod/
├── database/table-name
├── database/region
├── reglink/endpoint
├── auth/api-key-name
└── logging/level
```

#### Secrets Manager
```
passkey-event-data/dev/auth-api-key
passkey-event-data/staging/auth-api-key
passkey-event-data/prod/auth-api-key
```

### Configuration Injection

Configuration values are injected into the ECS task at runtime:

```typescript
environment: {
  ENVIRONMENT: this.environment,
  DYNAMODB_TABLE_NAME: this.eventRequestsTable.tableName,
  DYNAMODB_REGION: this.region,
  REGLINK_SERVICE_ENDPOINT: this.getParameter('reglink/endpoint'),
  LOG_LEVEL: this.getParameter('logging/level')
},
secrets: {
  API_KEY: Secret.fromSecretsManager(this.apiKeySecret)
}
```

## Monitoring and Alerting

### CloudWatch Dashboards

#### Application Dashboard
- Request count and response times
- Error rates by endpoint
- Database operation metrics
- Container resource utilization

#### Infrastructure Dashboard
- ECS service health and scaling metrics
- Load balancer metrics
- DynamoDB performance metrics
- Network and security group metrics

### Alarms and Notifications

#### Critical Alarms
```typescript
// High error rate alarm
new Alarm(this, 'HighErrorRate', {
  metric: service.metricHttpCodeTarget(HttpCodeTarget.TARGET_5XX_COUNT),
  threshold: 10,
  evaluationPeriods: 2,
  treatMissingData: TreatMissingData.NOT_BREACHING
});

// Database throttling alarm
new Alarm(this, 'DynamoDbThrottling', {
  metric: table.metricThrottledRequests(),
  threshold: 1,
  evaluationPeriods: 1
});
```

#### Notification Channels
- **Slack**: Real-time alerts to development team
- **PagerDuty**: Critical production alerts
- **Email**: Summary reports and non-critical notifications

## Rollback Procedures

### Automatic Rollback

ECS services are configured with automatic rollback on deployment failure:

```typescript
deploymentConfiguration: {
  maximumPercent: 200,
  minimumHealthyPercent: 50,
  deploymentCircuitBreaker: {
    enable: true,
    rollback: true
  }
}
```

### Manual Rollback

#### Application Rollback
```bash
# Rollback to previous version
aws ecs update-service \
  --cluster prod-passkey-cluster \
  --service passkey-event-data-service \
  --task-definition passkey-event-data:PREVIOUS_REVISION

# Rollback to specific version
aws ecs update-service \
  --cluster prod-passkey-cluster \
  --service passkey-event-data-service \
  --task-definition passkey-event-data:123
```

#### Infrastructure Rollback
```bash
# Rollback CDK stack
cdk deploy PasskeyEventDataStack \
  --parameters version=previous \
  --require-approval never
```

### Rollback Validation

After rollback, automated tests verify:
1. Service health checks pass
2. Database connectivity restored
3. API endpoints respond correctly
4. External service integrations work
5. Monitoring and logging function properly

## Disaster Recovery

### Backup Strategy

#### Database Backups
- **Point-in-time Recovery**: Enabled on all DynamoDB tables
- **Automated Backups**: Daily backups retained for 35 days
- **Cross-region Replication**: Production data replicated to us-west-2

#### Application Backups
- **Container Images**: Stored in ECR with lifecycle policies
- **Configuration**: Backed up in Parameter Store and Secrets Manager
- **Infrastructure Code**: Version controlled in Git

### Recovery Procedures

#### Regional Failover
1. **DNS Failover**: Route 53 health checks automatically failover to DR region
2. **Database Failover**: DynamoDB Global Tables provide automatic failover
3. **Application Deployment**: CDK stacks deployed in DR region
4. **Monitoring**: CloudWatch dashboards and alarms configured in both regions

#### Recovery Time Objectives (RTO)
- **Development**: 4 hours
- **Staging**: 2 hours  
- **Production**: 1 hour

#### Recovery Point Objectives (RPO)
- **Development**: 24 hours
- **Staging**: 4 hours
- **Production**: 15 minutes

## Security

### Network Security

#### VPC Configuration
- Private subnets for ECS tasks
- Public subnets for load balancers
- NAT gateways for outbound internet access
- VPC endpoints for AWS services

#### Security Groups
```typescript
// ECS security group
const ecsSecurityGroup = new SecurityGroup(this, 'EcsSecurityGroup', {
  vpc,
  description: 'Security group for ECS tasks',
  allowAllOutbound: true
});

ecsSecurityGroup.addIngressRule(
  Peer.securityGroupId(albSecurityGroup.securityGroupId),
  Port.tcp(8080),
  'Allow traffic from ALB'
);

// ALB security group
const albSecurityGroup = new SecurityGroup(this, 'AlbSecurityGroup', {
  vpc,
  description: 'Security group for Application Load Balancer'
});

albSecurityGroup.addIngressRule(
  Peer.anyIpv4(),
  Port.tcp(443),
  'Allow HTTPS traffic'
);
```

### Access Control

#### IAM Roles and Policies
- **Task Role**: Minimal permissions for application operations
- **Execution Role**: Permissions for ECS task execution
- **Deployment Role**: Permissions for CI/CD pipeline

#### API Security
- API key authentication for all endpoints
- Rate limiting to prevent abuse
- Input validation and sanitization
- HTTPS encryption for all communications

### Compliance

#### Data Protection
- Encryption at rest for all data stores
- Encryption in transit for all communications
- Regular security scans and vulnerability assessments
- Compliance with SOC 2 and other relevant standards