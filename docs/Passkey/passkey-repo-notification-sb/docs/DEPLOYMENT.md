# Deployment

## Overview

The Passkey Notification Service is deployed using AWS infrastructure with containerized deployment via ECS Fargate. The deployment process is automated through CI/CD pipelines using Jenkins and AWS CDK for infrastructure as code.

## Infrastructure Architecture

### AWS Services Used

- **ECS Fargate**: Container orchestration
- **Application Load Balancer**: Traffic distribution
- **RDS Oracle**: Database service
- **CloudWatch**: Monitoring and logging
- **Route 53**: DNS management
- **VPC**: Network isolation
- **IAM**: Access control

### Network Architecture

```
Internet Gateway
       │
   ┌───▼───┐
   │  ALB  │
   └───┬───┘
       │
   ┌───▼───┐     ┌─────────┐
   │  ECS  │────▶│   RDS   │
   │Fargate│     │ Oracle  │
   └───────┘     └─────────┘
```

## Environment Configuration

### Development Environment

**Infrastructure**:
- **ECS Cluster**: `passkey-dev-cluster`
- **Service**: `passkey-notification-sb-dev`
- **Database**: Development Oracle instance
- **Load Balancer**: Internal ALB

**Configuration**:
```yaml
environmentName: 'dev'
server:
  port: 7000
  servlet:
    context-path: /dev
management:
  server:
    port: 7001
```

**Access**:
- **Service URL**: `https://passkey-notification-sb-dev.internal.cvent.cloud`
- **Health Check**: `https://passkey-notification-sb-dev.internal.cvent.cloud/tasks/ok`

### Staging Environment

**Infrastructure**:
- **ECS Cluster**: `passkey-staging-cluster`
- **Service**: `passkey-notification-sb-staging`
- **Database**: Staging Oracle instance
- **Load Balancer**: Internal ALB with SSL termination

**Configuration**:
```yaml
environmentName: 'staging'
server:
  port: 7000
  servlet:
    context-path: /staging
```

**Access**:
- **Service URL**: `https://passkey-notification-sb-staging.cvent.cloud`
- **Health Check**: `https://passkey-notification-sb-staging.cvent.cloud/tasks/ok`

### Production Environment

**Infrastructure**:
- **ECS Cluster**: `passkey-prod-cluster`
- **Service**: `passkey-notification-sb-prod`
- **Database**: Production Oracle RDS with Multi-AZ
- **Load Balancer**: Internet-facing ALB with SSL
- **Auto Scaling**: Target tracking scaling policy

**Configuration**:
```yaml
environmentName: 'production'
server:
  port: 7000
  servlet:
    context-path: /prod
```

**Access**:
- **Service URL**: `https://passkey-notification-sb.cvent.cloud`
- **Health Check**: `https://passkey-notification-sb.cvent.cloud/tasks/ok`

## AWS CDK Infrastructure

### Stack Structure

```typescript
// Main infrastructure stack
export class PasskeyNotificationSbStack extends Stack {
  constructor(scope: Construct, id: string, props: PasskeyStackProps) {
    super(scope, id, props);
    
    // VPC and networking
    this.createNetworking();
    
    // ECS cluster and service
    this.createEcsService();
    
    // Load balancer
    this.createLoadBalancer();
    
    // Database
    this.createDatabase();
    
    // Monitoring
    this.createMonitoring();
  }
}
```

### ECS Service Configuration

```typescript
private createEcsService(): void {
  const taskDefinition = new TaskDefinition(this, 'TaskDef', {
    family: 'passkey-notification-sb',
    compatibility: Compatibility.FARGATE,
    cpu: '512',
    memoryMiB: '1024',
    networkMode: NetworkMode.AWS_VPC
  });
  
  const container = taskDefinition.addContainer('app', {
    image: ContainerImage.fromRegistry(this.props.imageUri),
    logging: LogDriver.awsLogs({
      streamPrefix: 'passkey-notification-sb',
      logGroup: this.logGroup
    }),
    environment: {
      SPRING_PROFILES_ACTIVE: this.props.environment,
      JAVA_OPTS: '-Xms512m -Xmx1024m'
    },
    secrets: {
      DB_PASSWORD: Secret.fromSecretsManager(this.dbSecret),
      AUTH_CLIENT_SECRET: Secret.fromSecretsManager(this.authSecret)
    }
  });
  
  container.addPortMappings(
    { containerPort: 7000, protocol: Protocol.TCP },
    { containerPort: 7001, protocol: Protocol.TCP }
  );
  
  this.service = new FargateService(this, 'Service', {
    cluster: this.cluster,
    taskDefinition,
    desiredCount: this.props.desiredCount,
    assignPublicIp: false,
    securityGroups: [this.serviceSecurityGroup]
  });
}
```

### Database Configuration

```typescript
private createDatabase(): void {
  this.database = new DatabaseInstance(this, 'Database', {
    engine: DatabaseInstanceEngine.oracleEe({
      version: OracleEngineVersion.VER_19_0_0_0_2020_04_R1
    }),
    instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
    vpc: this.vpc,
    vpcSubnets: {
      subnetType: SubnetType.PRIVATE_WITH_NAT
    },
    multiAz: this.props.environment === 'production',
    storageEncrypted: true,
    backupRetention: Duration.days(7),
    deletionProtection: this.props.environment === 'production',
    credentials: Credentials.fromSecret(this.dbSecret)
  });
}
```

## Container Configuration

### Dockerfile

```dockerfile
FROM openjdk:17-jre-slim

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy application jar
COPY target/passkey-notification-sb-*.jar app.jar

# Copy configuration files
COPY configs/ configs/

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:7001/tasks/ok || exit 1

# Expose ports
EXPOSE 7000 7001

# JVM options
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Start application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### Docker Compose (Local Development)

```yaml
version: '3.8'
services:
  passkey-notification-sb:
    build: .
    ports:
      - "7000:7000"
      - "7001:7001"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - DB_HOST=oracle-db
      - DB_PORT=1521
      - DB_NAME=ORCL
    depends_on:
      - oracle-db
    volumes:
      - ./configs:/app/configs
  
  oracle-db:
    image: container-registry.oracle.com/database/express:21.3.0-xe
    ports:
      - "1521:1521"
    environment:
      - ORACLE_PWD=oracle
      - ORACLE_CHARACTERSET=AL32UTF8
    volumes:
      - oracle-data:/opt/oracle/oradata
      
volumes:
  oracle-data:
```

## CI/CD Pipeline

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'passkey-notification-sb'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'pnpm install'
                sh 'nx build passkey-notification-sb-service'
            }
        }
        
        stage('Test') {
            steps {
                sh 'nx test passkey-notification-sb-service'
                sh 'nx run passkey-notification-sb-service:ci:test'
            }
            post {
                always {
                    publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
                    publishCoverage adapters: [jacocoAdapter('**/target/site/jacoco/jacoco.xml')]
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("${ECR_REPOSITORY}:${IMAGE_TAG}", 
                                           "./packages/passkey-notification-sb/service")
                    
                    // Push to ECR
                    docker.withRegistry("https://${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com", 
                                      "ecr:${AWS_REGION}:aws-credentials") {
                        image.push()
                        image.push("latest")
                    }
                }
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                sh 'nx run passkey-notification-sb-infra:deploy --environment=dev'
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                sh 'nx run passkey-notification-sb-infra:deploy --environment=staging'
            }
        }
        
        stage('Deploy to Production') {
            when {
                tag pattern: "v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP"
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                sh 'nx run passkey-notification-sb-infra:deploy --environment=production'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### Deployment Scripts

#### Deploy Script

```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
IMAGE_TAG=${2:-latest}

echo "Deploying to $ENVIRONMENT with image tag $IMAGE_TAG"

# Update ECS service
aws ecs update-service \
    --cluster "passkey-$ENVIRONMENT-cluster" \
    --service "passkey-notification-sb-$ENVIRONMENT" \
    --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster "passkey-$ENVIRONMENT-cluster" \
    --services "passkey-notification-sb-$ENVIRONMENT"

echo "Deployment completed successfully"
```

#### Rollback Script

```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
PREVIOUS_TASK_DEFINITION=${2}

echo "Rolling back $ENVIRONMENT to task definition $PREVIOUS_TASK_DEFINITION"

# Update service to previous task definition
aws ecs update-service \
    --cluster "passkey-$ENVIRONMENT-cluster" \
    --service "passkey-notification-sb-$ENVIRONMENT" \
    --task-definition "$PREVIOUS_TASK_DEFINITION"

# Wait for rollback to complete
aws ecs wait services-stable \
    --cluster "passkey-$ENVIRONMENT-cluster" \
    --services "passkey-notification-sb-$ENVIRONMENT"

echo "Rollback completed successfully"
```

## Monitoring & Alerting

### CloudWatch Dashboards

```typescript
private createMonitoring(): void {
  const dashboard = new Dashboard(this, 'Dashboard', {
    dashboardName: `passkey-notification-sb-${this.props.environment}`
  });
  
  // Service metrics
  dashboard.addWidgets(
    new GraphWidget({
      title: 'Request Count',
      left: [this.service.metricCpuUtilization()],
      right: [this.service.metricMemoryUtilization()]
    }),
    
    new GraphWidget({
      title: 'Response Times',
      left: [
        new Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'TargetResponseTime',
          dimensionsMap: {
            LoadBalancer: this.loadBalancer.loadBalancerFullName
          }
        })
      ]
    })
  );
}
```

### Alarms

```typescript
private createAlarms(): void {
  // High CPU alarm
  new Alarm(this, 'HighCpuAlarm', {
    metric: this.service.metricCpuUtilization(),
    threshold: 80,
    evaluationPeriods: 2,
    treatMissingData: TreatMissingData.NOT_BREACHING
  });
  
  // High memory alarm
  new Alarm(this, 'HighMemoryAlarm', {
    metric: this.service.metricMemoryUtilization(),
    threshold: 85,
    evaluationPeriods: 2
  });
  
  // Health check alarm
  new Alarm(this, 'HealthCheckAlarm', {
    metric: new Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'UnHealthyHostCount',
      dimensionsMap: {
        TargetGroup: this.targetGroup.targetGroupFullName
      }
    }),
    threshold: 1,
    evaluationPeriods: 1
  });
}
```

## Security Configuration

### IAM Roles

```typescript
private createIamRoles(): void {
  // ECS task role
  this.taskRole = new Role(this, 'TaskRole', {
    assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    ]
  });
  
  // Add permissions for secrets access
  this.taskRole.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'secretsmanager:GetSecretValue'
    ],
    resources: [
      this.dbSecret.secretArn,
      this.authSecret.secretArn
    ]
  }));
}
```

### Security Groups

```typescript
private createSecurityGroups(): void {
  // Service security group
  this.serviceSecurityGroup = new SecurityGroup(this, 'ServiceSG', {
    vpc: this.vpc,
    description: 'Security group for Passkey Notification Service'
  });
  
  // Allow inbound from ALB
  this.serviceSecurityGroup.addIngressRule(
    this.albSecurityGroup,
    Port.tcp(7000),
    'Allow HTTP from ALB'
  );
  
  // Allow health check from ALB
  this.serviceSecurityGroup.addIngressRule(
    this.albSecurityGroup,
    Port.tcp(7001),
    'Allow health check from ALB'
  );
  
  // Allow outbound to database
  this.serviceSecurityGroup.addEgressRule(
    this.databaseSecurityGroup,
    Port.tcp(1521),
    'Allow Oracle connection'
  );
}
```

## Troubleshooting

### Common Issues

#### Service Won't Start

1. **Check logs**:
   ```bash
   aws logs tail /aws/ecs/passkey-notification-sb --follow
   ```

2. **Verify environment variables**:
   ```bash
   aws ecs describe-services --cluster passkey-dev-cluster --services passkey-notification-sb-dev
   ```

3. **Check database connectivity**:
   ```bash
   aws rds describe-db-instances --db-instance-identifier passkey-notification-sb-dev
   ```

#### High Memory Usage

1. **Check JVM heap settings**:
   ```bash
   # Update task definition with appropriate memory settings
   -Xms512m -Xmx1024m -XX:+HeapDumpOnOutOfMemoryError
   ```

2. **Monitor garbage collection**:
   ```bash
   # Add GC logging
   -XX:+PrintGC -XX:+PrintGCDetails -XX:+PrintGCTimeStamps
   ```

#### Database Connection Issues

1. **Verify security groups**:
   ```bash
   aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx
   ```

2. **Check database status**:
   ```bash
   aws rds describe-db-instances --db-instance-identifier passkey-notification-sb-dev
   ```

3. **Test connectivity**:
   ```bash
   # From ECS task
   telnet database-endpoint 1521
   ```

### Deployment Rollback

```bash
# Get previous task definition
PREVIOUS_TASK_DEF=$(aws ecs list-task-definitions \
  --family-prefix passkey-notification-sb \
  --status ACTIVE \
  --sort DESC \
  --query 'taskDefinitionArns[1]' \
  --output text)

# Rollback service
aws ecs update-service \
  --cluster passkey-dev-cluster \
  --service passkey-notification-sb-dev \
  --task-definition $PREVIOUS_TASK_DEF
```

## Performance Tuning

### ECS Service Scaling

```typescript
// Auto scaling configuration
const scalableTarget = this.service.autoScaleTaskCount({
  minCapacity: 2,
  maxCapacity: 10
});

scalableTarget.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
  scaleInCooldown: Duration.minutes(5),
  scaleOutCooldown: Duration.minutes(2)
});

scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
  targetUtilizationPercent: 80
});
```

### Database Performance

```typescript
// RDS performance insights
this.database = new DatabaseInstance(this, 'Database', {
  // ... other config
  enablePerformanceInsights: true,
  performanceInsightRetention: PerformanceInsightRetention.MONTHS_1,
  monitoringInterval: Duration.seconds(60)
});
```