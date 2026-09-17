# Deployment

## Infrastructure

The Passkey Reservation SpringBoot service is deployed on AWS infrastructure using Cvent's standardized deployment platform with container orchestration and infrastructure as code.

### AWS Services
- **Compute**: Amazon ECS (Elastic Container Service) with Fargate
- **Load Balancing**: Application Load Balancer (ALB)
- **Database**: Amazon RDS for Oracle
- **Networking**: VPC with private subnets
- **DNS**: Route 53 for service discovery
- **Monitoring**: CloudWatch for logs and metrics
- **Security**: IAM roles and security groups

### Container Platform
- **Orchestration**: Amazon ECS with Fargate
- **Container Registry**: Amazon ECR
- **Service Mesh**: AWS App Mesh (optional)
- **Auto Scaling**: ECS Service Auto Scaling based on CPU/memory metrics

## Environments

### Development Environment
- **URL**: `https://dev.passkey-reservation-sb.cvent.com`
- **Purpose**: Feature development and initial testing
- **Database**: Shared development Oracle instance
- **Scaling**: Single instance, minimal resources
- **Monitoring**: Basic CloudWatch monitoring
- **Deployment**: Automatic on merge to `development` branch

**Configuration**:
```yaml
Environment: development
Instance Count: 1
CPU: 0.5 vCPU
Memory: 1 GB
Database: dev-oracle.cvent.com
Auto Scaling: Disabled
```

### Staging Environment
- **URL**: `https://staging.passkey-reservation-sb.cvent.com`
- **Purpose**: Pre-production testing and validation
- **Database**: Staging Oracle instance with production-like data
- **Scaling**: 2 instances for high availability testing
- **Monitoring**: Full monitoring and alerting
- **Deployment**: Manual promotion from development

**Configuration**:
```yaml
Environment: staging
Instance Count: 2
CPU: 1 vCPU
Memory: 2 GB
Database: staging-oracle.cvent.com
Auto Scaling: Enabled (2-4 instances)
Load Balancer: Application Load Balancer
```

### Production Environment
- **URL**: `https://api.passkey-reservation-sb.cvent.com`
- **Purpose**: Live production traffic
- **Database**: Production Oracle cluster with read replicas
- **Scaling**: Auto-scaling based on demand (4-20 instances)
- **Monitoring**: Comprehensive monitoring, alerting, and SLA tracking
- **Deployment**: Manual promotion with approval process

**Configuration**:
```yaml
Environment: production
Instance Count: 4-20 (auto-scaling)
CPU: 2 vCPU
Memory: 4 GB
Database: prod-oracle-cluster.cvent.com
Auto Scaling: Enabled with multiple metrics
Load Balancer: Application Load Balancer with WAF
High Availability: Multi-AZ deployment
```

## CI/CD Pipeline

### Jenkins Pipeline
The service uses Jenkins for continuous integration and deployment with the following stages:

```groovy
pipeline {
    agent { label 'ecs-x86-medium' }
    
    stages {
        stage('Build') {
            steps {
                sh 'pnpm install'
                sh 'pnpm build'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'mvn test'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'mvn verify -P integration'
                    }
                }
                stage('Security Scan') {
                    steps {
                        sh 'mend scan'
                    }
                }
            }
        }
        
        stage('Package') {
            steps {
                sh 'mvn package -P release'
                sh 'docker build -t passkey-reservation-sb .'
            }
        }
        
        stage('Deploy to Dev') {
            when { branch 'development' }
            steps {
                sh 'cdk deploy --environment=development'
            }
        }
        
        stage('Deploy to Staging') {
            when { branch 'master' }
            steps {
                input 'Deploy to staging?'
                sh 'cdk deploy --environment=staging'
            }
        }
        
        stage('Deploy to Production') {
            when { branch 'master' }
            steps {
                input 'Deploy to production?'
                sh 'cdk deploy --environment=production'
            }
        }
    }
    
    post {
        failure {
            slackSend channel: '#passkey-steakholders-alerts',
                     message: "Build failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
        }
    }
}
```

### Pipeline Configuration
- **Build Tool**: Maven with pnpm for monorepo management
- **Container Build**: Docker multi-stage builds for optimization
- **Security Scanning**: Mend (formerly WhiteSource) for dependency scanning
- **Code Quality**: SonarQube integration for code analysis
- **Artifact Storage**: Amazon ECR for container images

### Deployment Triggers
- **Development**: Automatic deployment on merge to `development` branch
- **Staging**: Manual promotion from successful development builds
- **Production**: Manual promotion with approval gates and change management

## Configuration Management

### Environment Variables
Configuration is managed through environment-specific variables:

**Development**:
```bash
SPRING_PROFILES_ACTIVE=development
DB_HOST=dev-oracle.cvent.com
DB_PORT=1521
DB_SERVICE=DEVDB
OAUTH_ISSUER_URI=https://dev-oauth.cvent.com
LOG_LEVEL=DEBUG
```

**Staging**:
```bash
SPRING_PROFILES_ACTIVE=staging
DB_HOST=staging-oracle.cvent.com
DB_PORT=1521
DB_SERVICE=STAGINGDB
OAUTH_ISSUER_URI=https://staging-oauth.cvent.com
LOG_LEVEL=INFO
```

**Production**:
```bash
SPRING_PROFILES_ACTIVE=production
DB_HOST=prod-oracle-cluster.cvent.com
DB_PORT=1521
DB_SERVICE=PRODDB
OAUTH_ISSUER_URI=https://oauth.cvent.com
LOG_LEVEL=WARN
```

### Secrets Management
Sensitive configuration is managed through AWS Systems Manager Parameter Store:

- **Database Credentials**: Stored as SecureString parameters
- **OAuth Secrets**: JWT signing keys and client secrets
- **API Keys**: Third-party service API keys
- **Certificates**: SSL/TLS certificates for secure communication

### Configuration Files
Environment-specific configuration files are packaged with the application:

```
configs/
├── dev.yaml          # Development configuration
├── staging.yaml      # Staging configuration
└── prod.yaml         # Production configuration
```

## Infrastructure as Code

### AWS CDK
The service infrastructure is defined using AWS CDK (Cloud Development Kit):

```typescript
export class PasskeyReservationSbStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    
    // VPC and networking
    const vpc = new Vpc(this, 'VPC', {
      maxAzs: 3,
      natGateways: 2
    });
    
    // ECS Cluster
    const cluster = new Cluster(this, 'Cluster', {
      vpc: vpc,
      containerInsights: true
    });
    
    // Application Load Balancer
    const alb = new ApplicationLoadBalancer(this, 'ALB', {
      vpc: vpc,
      internetFacing: true
    });
    
    // ECS Service
    const service = new FargateService(this, 'Service', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      assignPublicIp: false
    });
    
    // Auto Scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 20
    });
    
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70
    });
  }
}
```

### Octopus Deploy
Deployment orchestration is managed through Octopus Deploy:

- **Project**: passkey-reservation-springboot
- **Environments**: Development, Staging, Production
- **Deployment Process**: Blue-green deployments with health checks
- **Variables**: Environment-specific configuration variables
- **Approvals**: Required approvals for production deployments

## Monitoring and Alerting

### CloudWatch Metrics
Key metrics monitored in CloudWatch:

- **Application Metrics**:
  - Request count and response times
  - Error rates and HTTP status codes
  - JVM memory and CPU usage
  - Database connection pool metrics

- **Infrastructure Metrics**:
  - ECS service CPU and memory utilization
  - Load balancer request count and latency
  - Database performance metrics
  - Network throughput and errors

### Datadog Integration
Comprehensive monitoring through Datadog:

```yaml
datadog:
  service: passkey-reservation-sb
  env: ${ENVIRONMENT}
  version: ${BUILD_VERSION}
  tags:
    - team:steakholders
    - platform:passkey
    - language:java
```

### Alerting Rules
Critical alerts configured for:

- **High Error Rate**: >5% error rate for 5 minutes
- **High Latency**: >2 second average response time
- **Service Unavailable**: Health check failures
- **Database Issues**: Connection pool exhaustion or query timeouts
- **Memory Issues**: High memory usage or OutOfMemoryError

### Alert Channels
- **Slack**: `#passkey-steakholders-alerts` for immediate notifications
- **Email**: Team distribution list for critical alerts
- **PagerDuty**: On-call rotation for production incidents

## Rollback Procedures

### Automated Rollback
ECS service supports automated rollback on deployment failure:

```yaml
deploymentConfiguration:
  maximumPercent: 200
  minimumHealthyPercent: 50
  deploymentCircuitBreaker:
    enable: true
    rollback: true
```

### Manual Rollback Steps

1. **Identify Issue**: Confirm the need for rollback through monitoring
2. **Stop Traffic**: Temporarily route traffic away from affected instances
3. **Rollback Deployment**: Use Octopus Deploy to rollback to previous version
4. **Verify Health**: Confirm service health after rollback
5. **Restore Traffic**: Gradually restore traffic to rolled-back instances
6. **Post-Incident**: Document incident and plan fix for next deployment

### Database Rollback
Database changes require careful rollback procedures:

1. **Schema Changes**: Use Flyway migration rollback scripts
2. **Data Changes**: Restore from point-in-time backup if necessary
3. **Compatibility**: Ensure application compatibility with rolled-back schema

## Security Considerations

### Network Security
- **VPC**: Private subnets for application instances
- **Security Groups**: Restrictive inbound/outbound rules
- **WAF**: Web Application Firewall for production load balancer
- **TLS**: End-to-end encryption for all communications

### Access Control
- **IAM Roles**: Least privilege access for ECS tasks
- **Service Accounts**: Dedicated service accounts for different environments
- **API Gateway**: Rate limiting and request validation
- **Database Access**: Encrypted connections with certificate validation

### Compliance
- **Audit Logging**: All deployment activities logged
- **Change Management**: Formal change approval process for production
- **Vulnerability Scanning**: Regular security scans of container images
- **Compliance Reports**: SOC 2 and other compliance requirements

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated daily backups with 30-day retention
- **Configuration Backups**: Infrastructure code in version control
- **Container Images**: Immutable images stored in ECR with lifecycle policies

### Recovery Procedures
- **RTO**: Recovery Time Objective of 4 hours
- **RPO**: Recovery Point Objective of 1 hour
- **Multi-Region**: Capability for cross-region failover if needed
- **Data Recovery**: Point-in-time recovery for database

### Business Continuity
- **Load Balancing**: Multi-AZ deployment for high availability
- **Auto Scaling**: Automatic scaling to handle increased load
- **Circuit Breakers**: Graceful degradation during partial outages
- **Monitoring**: 24/7 monitoring with on-call support