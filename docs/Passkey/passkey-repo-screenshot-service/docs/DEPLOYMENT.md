# Deployment

## Infrastructure

### Cloud Platform
- **Provider**: Amazon Web Services (AWS)
- **Compute**: Amazon ECS (Elastic Container Service)
- **Container Registry**: Amazon ECR (Elastic Container Registry)
- **Load Balancing**: Application Load Balancer (ALB)
- **Storage**: Amazon S3 for screenshot caching
- **Networking**: VPC with private subnets

### Container Orchestration
- **Platform**: AWS ECS with Fargate
- **Task Definition**: Containerized service deployment
- **Service Discovery**: ECS Service Connect
- **Auto Scaling**: Based on CPU and memory utilization
- **Health Checks**: ELB health checks on `/local/ok` endpoint

### Infrastructure as Code
- **Framework**: AWS CDK (Cloud Development Kit)
- **Language**: TypeScript
- **Location**: `packages/infra/` directory
- **Deployment**: Automated via Jenkins pipeline

## Environments

### Development (Dev)
- **Purpose**: Feature development and testing
- **URL**: `https://dev-screenshot.passkey.com`
- **Resources**: 
  - 1 ECS task (0.5 vCPU, 1GB memory)
  - S3 bucket: `passkey-screenshots-dev`
- **Auto-scaling**: Disabled
- **Monitoring**: Basic CloudWatch metrics

### Staging (Staging)
- **Purpose**: Pre-production testing and validation
- **URL**: `https://staging-screenshot.passkey.com`
- **Resources**:
  - 2 ECS tasks (1 vCPU, 2GB memory each)
  - S3 bucket: `passkey-screenshots-staging`
- **Auto-scaling**: 1-3 tasks based on CPU utilization
- **Monitoring**: Full Datadog integration

### Production (Prod)
- **Purpose**: Live production workloads
- **URL**: `https://screenshot.passkey.com`
- **Resources**:
  - 3-10 ECS tasks (2 vCPU, 4GB memory each)
  - S3 bucket: `passkey-screenshots-prod`
- **Auto-scaling**: 3-10 tasks based on CPU and memory
- **Monitoring**: Full observability stack with alerting

## CI/CD Pipeline

### Jenkins Pipeline
**Location**: `Jenkinsfile` in repository root

**Stages**:
1. **Checkout**: Source code retrieval from Git
2. **Build**: TypeScript compilation and Docker image build
3. **Test**: Unit tests and linting
4. **Security Scan**: Container vulnerability scanning
5. **Push**: Docker image push to ECR
6. **Deploy**: CDK deployment to target environment

**Pipeline Configuration**:
```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'pnpm install'
                sh 'pnpm build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'pnpm test'
                sh 'pnpm lint'
            }
        }
        
        stage('Docker Build') {
            steps {
                sh 'docker build -t passkey-screenshot-service .'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'pnpm deploy'
            }
        }
    }
}
```

### Deployment Triggers
- **Automatic**: Commits to `master` branch trigger production deployment
- **Manual**: Feature branches can be manually deployed to dev/staging
- **Rollback**: Previous versions can be restored via Jenkins

### Build Artifacts
- **Docker Image**: Tagged with commit SHA and version
- **CDK Assets**: Infrastructure templates and configurations
- **Test Reports**: Coverage and test results
- **Security Reports**: Vulnerability scan results

## Configuration Management

### Environment-Specific Configuration

#### Development
```yaml
environment:
  BUCKET_NAME: passkey-screenshots-dev
  DW_ROOT_PATH: /local
  NODE_ENV: development
resources:
  cpu: 512
  memory: 1024
  count: 1
```

#### Staging
```yaml
environment:
  BUCKET_NAME: passkey-screenshots-staging
  DW_ROOT_PATH: /local
  NODE_ENV: production
resources:
  cpu: 1024
  memory: 2048
  count: 2
autoscaling:
  min: 1
  max: 3
  target_cpu: 70
```

#### Production
```yaml
environment:
  BUCKET_NAME: passkey-screenshots-prod
  DW_ROOT_PATH: /local
  NODE_ENV: production
resources:
  cpu: 2048
  memory: 4096
  count: 3
autoscaling:
  min: 3
  max: 10
  target_cpu: 60
  target_memory: 80
```

### Secrets Management
- **AWS Secrets Manager**: For sensitive configuration
- **IAM Roles**: Service-to-service authentication
- **Environment Variables**: Non-sensitive configuration
- **SSL Certificates**: Managed via AWS Certificate Manager

### Feature Flags
- **Framework**: @cvent/feature-flags
- **Configuration**: Environment-based toggles
- **Runtime**: Dynamic feature enabling/disabling

## Octopus Deploy Integration

### Project Configuration
- **Project Name**: passkey-screenshot
- **Deployment Process**: Multi-environment promotion
- **Variables**: Environment-specific configuration
- **Triggers**: Automatic deployment on successful build

### Deployment Steps
1. **Pre-deployment**: Health check and capacity verification
2. **Blue-Green Deployment**: Zero-downtime deployment strategy
3. **Health Verification**: Post-deployment health checks
4. **Traffic Switching**: Gradual traffic migration
5. **Rollback**: Automatic rollback on health check failures

### Environment Promotion
```
Development → Staging → Production
```

### Deployment Variables
```yaml
# Octopus Variables
Project.S3.BucketName: "#{Environment.S3.BucketName}"
Project.ECS.TaskCount: "#{Environment.ECS.TaskCount}"
Project.ECS.CPU: "#{Environment.ECS.CPU}"
Project.ECS.Memory: "#{Environment.ECS.Memory}"
```

## Monitoring & Alerting

### CloudWatch Metrics
- **ECS Metrics**: CPU, memory, task count
- **ALB Metrics**: Request count, latency, error rate
- **Custom Metrics**: Screenshot success rate, cache hit ratio

### Datadog Integration
- **APM**: Application performance monitoring
- **Infrastructure**: Container and host metrics
- **Logs**: Centralized log aggregation
- **Alerts**: Threshold-based alerting

### Key Alerts
- **High Error Rate**: >5% error rate for 5 minutes
- **High Latency**: >30s average response time
- **Resource Utilization**: >80% CPU or memory for 10 minutes
- **Service Unavailable**: Health check failures

### Dashboards
- **Service Overview**: Key metrics and health status
- **Performance**: Response times and throughput
- **Errors**: Error rates and failure analysis
- **Infrastructure**: Resource utilization and scaling

## Rollback Procedures

### Automatic Rollback
- **Health Check Failures**: Automatic rollback after 3 consecutive failures
- **Error Rate Threshold**: Rollback if error rate exceeds 10%
- **Performance Degradation**: Rollback if latency increases by 200%

### Manual Rollback
1. **Identify Issue**: Determine need for rollback
2. **Access Jenkins**: Navigate to deployment pipeline
3. **Select Version**: Choose previous stable version
4. **Execute Rollback**: Trigger rollback deployment
5. **Verify Health**: Confirm service restoration
6. **Communicate**: Notify stakeholders of rollback

### Rollback Commands
```bash
# Via Jenkins
# Navigate to job → Build with Parameters → Select previous version

# Via CDK (emergency)
cd packages/infra
cdk deploy --parameters version=<previous-version>

# Via Octopus Deploy
# Navigate to project → Deployments → Redeploy previous release
```

### Recovery Time Objectives
- **Automatic Rollback**: 2-3 minutes
- **Manual Rollback**: 5-10 minutes
- **Full Recovery**: 10-15 minutes including verification

## Security Configuration

### Network Security
- **VPC**: Private subnets for ECS tasks
- **Security Groups**: Restrictive inbound/outbound rules
- **ALB**: Public-facing with SSL termination
- **WAF**: Web Application Firewall for DDoS protection

### Container Security
- **Base Image**: Minimal attack surface
- **Non-root User**: Container runs as node user
- **Read-only Filesystem**: Where possible
- **Resource Limits**: CPU and memory constraints

### Access Control
- **IAM Roles**: Least privilege access
- **S3 Bucket Policy**: Restricted access to service role
- **ECR Permissions**: Pull-only access for ECS
- **Secrets Access**: Limited to required secrets only

### SSL/TLS Configuration
- **Certificate**: AWS Certificate Manager
- **Protocol**: TLS 1.2 minimum
- **Cipher Suites**: Strong encryption only
- **HSTS**: HTTP Strict Transport Security enabled

## Disaster Recovery

### Backup Strategy
- **S3 Screenshots**: Cross-region replication enabled
- **Configuration**: Version controlled in Git
- **Infrastructure**: Reproducible via CDK

### Recovery Procedures
1. **Service Failure**: Auto-scaling and health checks handle most issues
2. **Region Failure**: Manual failover to backup region
3. **Data Loss**: S3 cross-region replication provides backup
4. **Complete Rebuild**: CDK can recreate entire infrastructure

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 15 minutes
- **Recovery Point Objective (RPO)**: 1 hour (screenshot cache)
- **Availability Target**: 99.9% uptime

## Cost Optimization

### Resource Sizing
- **Right-sizing**: Regular review of CPU/memory utilization
- **Auto-scaling**: Automatic scaling based on demand
- **Spot Instances**: Where appropriate for non-critical workloads

### Storage Optimization
- **S3 Lifecycle**: Transition old screenshots to cheaper storage classes
- **Compression**: Image optimization to reduce storage costs
- **Cleanup**: Automated cleanup of unused screenshots

### Monitoring Costs
- **AWS Cost Explorer**: Regular cost analysis
- **Budget Alerts**: Notifications for cost overruns
- **Resource Tagging**: Cost allocation by environment/team