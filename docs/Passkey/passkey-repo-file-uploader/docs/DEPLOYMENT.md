# Deployment

## Infrastructure

### AWS Architecture

The Passkey File Uploader is deployed on AWS using a containerized microservices architecture with the following components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   Application    │    │   Backend       │
│   (CDN)         │◄──►│   Load Balancer  │◄──►│   Services      │
│                 │    │   (ALB)          │    │   (ECS/Fargate) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   S3 Bucket     │    │   Route 53       │    │   RDS           │
│   (File Storage)│    │   (DNS)          │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Infrastructure Components

#### Compute
- **ECS Cluster**: Fargate-based container orchestration
- **Task Definitions**: Separate tasks for frontend and backend services
- **Auto Scaling**: CPU and memory-based scaling policies
- **Service Discovery**: AWS Cloud Map for internal service communication

#### Storage
- **S3 Buckets**: 
  - Primary: `passkey-file-uploader-{env}` for uploaded files
  - Backup: `passkey-file-uploader-backup-{env}` for disaster recovery
- **RDS PostgreSQL**: Multi-AZ deployment for high availability
- **EFS**: Shared file system for temporary processing files

#### Networking
- **VPC**: Dedicated Virtual Private Cloud with public/private subnets
- **Security Groups**: Restrictive ingress/egress rules
- **NAT Gateway**: Outbound internet access for private subnets
- **Application Load Balancer**: Layer 7 load balancing with SSL termination

#### Security
- **IAM Roles**: Least privilege access for services
- **KMS**: Encryption key management for S3 and RDS
- **Secrets Manager**: Secure storage of database credentials and API keys
- **WAF**: Web Application Firewall for DDoS and attack protection

## Environments

### Development Environment

**Purpose**: Local development and feature testing

**Infrastructure**:
- **Compute**: Single ECS task per service
- **Database**: RDS t3.micro instance
- **Storage**: Single S3 bucket with lifecycle policies
- **Monitoring**: Basic CloudWatch metrics

**Configuration**:
```yaml
Environment: development
Cluster: passkey-dev
CPU: 256 (0.25 vCPU)
Memory: 512 MB
Min Capacity: 1
Max Capacity: 2
Database: db.t3.micro
```

**Access**:
- **Frontend**: https://passkey-file-uploader.dev.cvent.org
- **Backend API**: https://passkey-file-uploader-sb.dev.cvent.org
- **Database**: Accessible via VPN for debugging

### Staging Environment

**Purpose**: Pre-production testing and integration validation

**Infrastructure**:
- **Compute**: Scaled-down production configuration
- **Database**: RDS t3.small with read replica
- **Storage**: S3 with cross-region replication
- **Monitoring**: Full observability stack

**Configuration**:
```yaml
Environment: staging
Cluster: passkey-staging
CPU: 512 (0.5 vCPU)
Memory: 1024 MB
Min Capacity: 2
Max Capacity: 4
Database: db.t3.small
```

**Access**:
- **Frontend**: https://passkey-file-uploader.staging.cvent.org
- **Backend API**: https://passkey-file-uploader-sb.staging.cvent.org
- **Monitoring**: https://staging-monitoring.cvent.org

### Production Environment

**Purpose**: Live production workloads serving customer traffic

**Infrastructure**:
- **Compute**: Multi-AZ ECS deployment with auto-scaling
- **Database**: RDS r5.large with Multi-AZ and read replicas
- **Storage**: S3 with versioning, lifecycle policies, and cross-region backup
- **Monitoring**: Comprehensive monitoring with alerting

**Configuration**:
```yaml
Environment: production
Cluster: passkey-prod
CPU: 1024 (1 vCPU)
Memory: 2048 MB
Min Capacity: 3
Max Capacity: 10
Database: db.r5.large
```

**Access**:
- **Frontend**: https://passkey-file-uploader.cvent.org
- **Backend API**: https://passkey-file-uploader-sb.cvent.org
- **Monitoring**: https://monitoring.cvent.org

## CI/CD Pipeline

### Pipeline Overview

The deployment pipeline uses Jenkins with Cvent's standardized pipeline utilities:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │    │   Build     │    │   Test      │    │   Deploy    │
│   Control   │───►│   & Package │───►│   & Verify  │───►│   & Release │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Pipeline Stages

#### 1. Source Control
- **Trigger**: Git push to monitored branches
- **Branches**: 
  - `master` → Production deployment
  - `development` → Development deployment
  - Feature branches → CI validation only

#### 2. Build & Package
```groovy
stage('Build') {
    steps {
        // Backend build
        sh 'cd packages/passkey-file-uploader-sb && mvn clean package'
        
        // Frontend build
        sh 'pnpm build'
        
        // Docker image creation
        sh 'docker build -t passkey-file-uploader-sb:${BUILD_NUMBER} .'
        sh 'docker build -t passkey-file-uploader:${BUILD_NUMBER} .'
    }
}
```

#### 3. Test & Verify
```groovy
stage('Test') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'pnpm test'
                sh 'mvn test'
            }
        }
        stage('Integration Tests') {
            steps {
                sh 'pnpm test:it'
                sh 'mvn verify -Prun-it'
            }
        }
        stage('Security Scan') {
            steps {
                sh 'npm audit'
                sh 'mvn dependency-check:check'
            }
        }
    }
}
```

#### 4. Deploy & Release
```groovy
stage('Deploy') {
    when {
        anyOf {
            branch 'master'
            branch 'development'
        }
    }
    steps {
        // Push images to ECR
        sh 'aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR_REGISTRY}'
        sh 'docker tag passkey-file-uploader-sb:${BUILD_NUMBER} ${ECR_REGISTRY}/passkey-file-uploader-sb:${BUILD_NUMBER}'
        sh 'docker push ${ECR_REGISTRY}/passkey-file-uploader-sb:${BUILD_NUMBER}'
        
        // Deploy via CDK
        sh 'cd packages/passkey-file-uploader-sb/infra && cdk deploy --require-approval never'
    }
}
```

### Deployment Configuration

#### Jenkins Pipeline (Jenkinsfile)
```groovy
buildPipeline(
  label: 'ecs-x86-medium',
  packageFilter: 'root-only',
  stablePrereleaseId: true,
  awsUser: 'cdk',
  ci: [
    lock: 'branch'
  ],
  trunk: 'master',
  release: [
    branches: ['master']
  ],
  publish: [
    [branches: ['development']]
  ],
  slack: [
    [branches: ['master', 'development'], 
     channels: ['#passkey-api', '#passkey-steakholders-alerts'], 
     events: ['FAILURE']],
    [branches: ['.*'], channels: ['_owner_']]
  ]
)
```

## Configuration Management

### Environment-Specific Configuration

#### AWS Systems Manager Parameter Store
```bash
# Database Configuration
/passkey-file-uploader/{env}/database/url
/passkey-file-uploader/{env}/database/username
/passkey-file-uploader/{env}/database/password

# S3 Configuration
/passkey-file-uploader/{env}/s3/bucket-name
/passkey-file-uploader/{env}/s3/region

# OAuth Configuration
/passkey-file-uploader/{env}/oauth/client-id
/passkey-file-uploader/{env}/oauth/client-secret
/passkey-file-uploader/{env}/oauth/issuer-uri

# Application Configuration
/passkey-file-uploader/{env}/app/max-file-size
/passkey-file-uploader/{env}/app/malware-scanner-url
```

#### AWS Secrets Manager
```json
{
  "database-credentials": {
    "username": "app_user",
    "password": "generated-secure-password"
  },
  "oauth-secrets": {
    "client-secret": "oauth-client-secret"
  },
  "datadog-keys": {
    "api-key": "datadog-api-key",
    "app-key": "datadog-app-key"
  }
}
```

### Infrastructure as Code (CDK)

#### Main Stack Definition
```typescript
export class PasskeyFileUploaderStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // VPC and Networking
    const vpc = new Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1
    });

    // ECS Cluster
    const cluster = new Cluster(this, 'Cluster', {
      vpc,
      containerInsights: true
    });

    // RDS Database
    const database = new DatabaseInstance(this, 'Database', {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_14
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      vpc,
      multiAz: true,
      backupRetention: Duration.days(7)
    });

    // S3 Bucket
    const bucket = new Bucket(this, 'FileStorage', {
      versioned: true,
      encryption: BucketEncryption.KMS,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: Duration.days(30)
      }]
    });

    // ECS Services
    const backendService = new ApplicationLoadBalancedFargateService(this, 'BackendService', {
      cluster,
      taskImageOptions: {
        image: ContainerImage.fromRegistry('passkey-file-uploader-sb:latest'),
        containerPort: 8080,
        environment: {
          DATABASE_URL: database.instanceEndpoint.socketAddress,
          S3_BUCKET_NAME: bucket.bucketName
        }
      },
      desiredCount: 2,
      cpu: 512,
      memoryLimitMiB: 1024
    });
  }
}
```

## Rollback Procedures

### Automated Rollback Triggers

1. **Health Check Failures**: Automatic rollback if health checks fail for 5 minutes
2. **Error Rate Threshold**: Rollback if error rate exceeds 5% for 2 minutes
3. **Performance Degradation**: Rollback if response time increases by 200% for 3 minutes

### Manual Rollback Process

#### 1. Immediate Rollback (Emergency)
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster passkey-prod \
  --service passkey-file-uploader-sb \
  --task-definition passkey-file-uploader-sb:PREVIOUS_REVISION

# Monitor rollback progress
aws ecs describe-services \
  --cluster passkey-prod \
  --services passkey-file-uploader-sb
```

#### 2. Database Rollback (If Required)
```bash
# Restore from automated backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier passkey-file-uploader-rollback \
  --db-snapshot-identifier passkey-file-uploader-backup-TIMESTAMP

# Update connection strings to point to restored instance
aws ssm put-parameter \
  --name "/passkey-file-uploader/prod/database/url" \
  --value "new-database-endpoint" \
  --overwrite
```

#### 3. S3 Rollback (If Required)
```bash
# Restore files from versioned backup
aws s3api list-object-versions \
  --bucket passkey-file-uploader-prod \
  --prefix "uploads/"

# Restore specific objects if needed
aws s3api restore-object \
  --bucket passkey-file-uploader-prod \
  --key "uploads/file-id" \
  --version-id "version-id"
```

### Rollback Validation

1. **Service Health**: Verify all health checks pass
2. **Functional Testing**: Execute critical path tests
3. **Performance Monitoring**: Confirm metrics return to baseline
4. **User Acceptance**: Validate with stakeholder team

## Monitoring & Alerting

### Infrastructure Monitoring

#### CloudWatch Alarms
```yaml
Alarms:
  - Name: HighCPUUtilization
    MetricName: CPUUtilization
    Threshold: 80
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 2
    
  - Name: HighMemoryUtilization
    MetricName: MemoryUtilization
    Threshold: 85
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 2
    
  - Name: DatabaseConnections
    MetricName: DatabaseConnections
    Threshold: 80
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 1
```

#### Datadog Dashboards
- **Application Performance**: Response times, throughput, error rates
- **Infrastructure Health**: CPU, memory, disk, network metrics
- **Business Metrics**: Upload success rates, file processing times
- **Security Metrics**: Failed authentication attempts, malware detections

### Alerting Configuration

#### Slack Integration
```yaml
Notifications:
  - Channel: "#passkey-steakholders-alerts"
    Events: ["FAILURE", "RECOVERY"]
    Branches: ["master", "development"]
    
  - Channel: "#passkey-api"
    Events: ["DEPLOYMENT", "ROLLBACK"]
    Branches: ["master"]
```

#### PagerDuty Integration
- **Critical Alerts**: Service down, database unavailable
- **Warning Alerts**: High error rates, performance degradation
- **Info Alerts**: Deployment notifications, capacity warnings

## Disaster Recovery

### Backup Strategy

#### Database Backups
- **Automated Backups**: Daily snapshots with 7-day retention
- **Point-in-Time Recovery**: Available for last 7 days
- **Cross-Region Backup**: Weekly snapshots replicated to secondary region

#### File Storage Backups
- **S3 Versioning**: Enabled with lifecycle policies
- **Cross-Region Replication**: Real-time replication to backup region
- **Glacier Archive**: Long-term archival after 90 days

### Recovery Procedures

#### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Data Loss Tolerance**: Maximum 1 hour of data

#### Recovery Steps
1. **Assessment**: Determine scope and impact of disaster
2. **Communication**: Notify stakeholders and customers
3. **Infrastructure**: Restore compute and networking resources
4. **Data**: Restore database and file storage from backups
5. **Validation**: Verify system functionality and data integrity
6. **Monitoring**: Enhanced monitoring during recovery period

### Business Continuity

#### Failover Scenarios
- **Single AZ Failure**: Automatic failover to healthy AZ
- **Regional Failure**: Manual failover to backup region
- **Service Degradation**: Graceful degradation with reduced functionality

#### Communication Plan
- **Internal**: Slack alerts, email notifications, status page updates
- **External**: Customer notifications via support channels
- **Stakeholders**: Executive briefings and regular status updates