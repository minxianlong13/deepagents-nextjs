# Deployment

## Infrastructure Overview

The Passkey Inventory Spring Boot service is deployed on AWS using a containerized approach with ECS (Elastic Container Service) and managed through Infrastructure as Code (IaC) using AWS CDK.

## Environments

### Development Environment
- **URL**: `https://passkey-inventory-dev.core.cvent.org`
- **Purpose**: Development and testing
- **Database**: Oracle development instance
- **Monitoring**: Basic logging and health checks
- **Auto-scaling**: Minimal (1-2 instances)

### Staging Environment
- **URL**: `https://passkey-inventory-staging.core.cvent.org`
- **Purpose**: Pre-production testing and validation
- **Database**: Oracle staging instance (production-like data)
- **Monitoring**: Full monitoring suite
- **Auto-scaling**: Production-like scaling (2-4 instances)

### Production Environment
- **URL**: `https://passkey-inventory.core.cvent.org`
- **Purpose**: Live production workloads
- **Database**: Oracle production cluster
- **Monitoring**: Full observability stack
- **Auto-scaling**: Dynamic scaling (2-10 instances)

## AWS Infrastructure

### Compute Resources
- **Service**: AWS ECS (Elastic Container Service)
- **Launch Type**: Fargate (serverless containers)
- **CPU**: 1 vCPU (2048 CPU units)
- **Memory**: 2 GB RAM
- **Network**: VPC with private subnets

### Load Balancing
- **Type**: Application Load Balancer (ALB)
- **Health Check**: `/actuator/health`
- **SSL/TLS**: AWS Certificate Manager certificates
- **Routing**: Path-based routing for API versions

### Database
- **Type**: Oracle RDS (Relational Database Service)
- **Instance Class**: db.r5.large (production)
- **Multi-AZ**: Enabled for high availability
- **Backup**: Automated daily backups with 7-day retention
- **Encryption**: At-rest and in-transit encryption enabled

### Networking
- **VPC**: Dedicated Virtual Private Cloud
- **Subnets**: Private subnets for application, public for load balancer
- **Security Groups**: Restrictive ingress/egress rules
- **NAT Gateway**: For outbound internet access from private subnets

## Container Configuration

### Dockerfile
```dockerfile
FROM openjdk:17-jre-slim

# Create application user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy application JAR
COPY target/passkey-inventory-*.jar app.jar

# Copy configuration files
COPY configs/ configs/

# Change ownership to application user
RUN chown -R appuser:appuser /app

# Switch to application user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Run application
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.config.location=configs/"]
```

### Container Resources
- **CPU Limit**: 1 vCPU
- **Memory Limit**: 2 GB
- **Memory Reservation**: 1 GB
- **Health Check**: Spring Boot Actuator endpoint

## CI/CD Pipeline

### Jenkins Pipeline
The deployment pipeline is defined in the `Jenkinsfile` and uses Cvent's standard pipeline utilities:

```groovy
buildPipeline(
  label: 'ecs-x86-medium',
  packageFilter: 'root-only',
  stablePrereleaseId: true,
  skipCacheBehavior: 'remote-only',
  enableNxVerifyDeploy: true,
  awsUser: 'cdk'
)
```

### Pipeline Stages

1. **Source**: Code checkout from GitHub
2. **Build**: Maven build and test execution
3. **Package**: Docker image creation
4. **Security Scan**: Container vulnerability scanning
5. **Deploy to Dev**: Automatic deployment to development
6. **Integration Tests**: Automated API testing
7. **Deploy to Staging**: Manual approval required
8. **Deploy to Production**: Manual approval required

### Build Configuration
- **Build Agent**: ECS x86 medium instance
- **Package Filter**: Root-only (monorepo optimization)
- **Nx Integration**: Enabled for efficient builds
- **AWS User**: CDK service account for deployments

## Infrastructure as Code (CDK)

### CDK Configuration
The infrastructure is defined using AWS CDK (Cloud Development Kit) with TypeScript:

```typescript
// cdk.json
{
  "app": "npx tsx infra/app.ts",
  "requireApproval": "never",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

### Stack Components
- **Application Stack**: ECS service, task definition, load balancer
- **Database Stack**: RDS instance, security groups, parameter groups
- **Monitoring Stack**: CloudWatch dashboards, alarms, log groups
- **Security Stack**: IAM roles, security groups, certificates

### CDK Deployment Commands
```bash
# Deploy to development
cdk deploy PasskeyInventoryDev

# Deploy to staging
cdk deploy PasskeyInventoryStaging

# Deploy to production
cdk deploy PasskeyInventoryProd
```

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through environment-specific YAML files:

- **Development**: `configs/dev.yaml`
- **Staging**: `configs/staging.yaml`
- **Production**: `configs/prod.yaml`

### Configuration Deployment
```bash
# Package configurations
mvn assembly:single -Prelease

# Deploy configuration assembly
aws s3 cp target/passkey-inventory-configs.zip s3://cvent-configs/passkey-inventory/
```

### Environment Variables
Sensitive configuration is managed through environment variables:

```yaml
# ECS Task Definition
environment:
  - name: SPRING_PROFILES_ACTIVE
    value: production
  - name: DATABASE_URL
    valueFrom: arn:aws:ssm:region:account:parameter/passkey/db/url
  - name: DATABASE_PASSWORD
    valueFrom: arn:aws:secretsmanager:region:account:secret:passkey-db-password
```

## Monitoring & Alerting

### CloudWatch Integration
- **Log Groups**: Application logs with structured JSON format
- **Metrics**: Custom business metrics and AWS service metrics
- **Dashboards**: Real-time monitoring dashboards
- **Alarms**: Automated alerting for critical issues

### Datadog Integration
- **APM**: Application performance monitoring
- **Infrastructure Monitoring**: Container and host metrics
- **Log Management**: Centralized log aggregation
- **Alerting**: Slack integration for critical alerts

### Health Checks
- **Load Balancer**: HTTP health check on `/actuator/health`
- **ECS**: Container health check with retry logic
- **Database**: Connection pool monitoring
- **External Dependencies**: Downstream service health checks

## Scaling Configuration

### Auto Scaling
```yaml
# ECS Service Auto Scaling
autoScaling:
  minCapacity: 2
  maxCapacity: 10
  targetCpuUtilization: 70
  targetMemoryUtilization: 80
  scaleOutCooldown: 300s
  scaleInCooldown: 600s
```

### Scaling Triggers
- **CPU Utilization**: Scale out at 70%, scale in at 30%
- **Memory Utilization**: Scale out at 80%, scale in at 50%
- **Request Count**: Scale based on requests per second
- **Response Time**: Scale when average response time exceeds threshold

## Security Configuration

### Network Security
- **VPC**: Isolated network environment
- **Security Groups**: Restrictive firewall rules
- **NACLs**: Network-level access control
- **Private Subnets**: Application instances not directly accessible

### Application Security
- **IAM Roles**: Least privilege access principles
- **Secrets Management**: AWS Secrets Manager for sensitive data
- **Encryption**: TLS 1.2+ for all communications
- **OAuth**: Cvent OAuth for API authentication

### Compliance
- **SOC 2**: Compliance monitoring and reporting
- **GDPR**: Data protection and privacy controls
- **PCI DSS**: Payment card industry compliance (where applicable)

## Backup & Recovery

### Database Backups
- **Automated Backups**: Daily automated backups with 7-day retention
- **Manual Snapshots**: On-demand snapshots before major deployments
- **Cross-Region Replication**: Disaster recovery backups in secondary region
- **Point-in-Time Recovery**: Recovery to any point within backup retention

### Application Recovery
- **Blue-Green Deployment**: Zero-downtime deployments
- **Rollback Strategy**: Automated rollback on health check failures
- **Configuration Rollback**: Version-controlled configuration management
- **Database Migration Rollback**: Reversible database schema changes

## Rollback Procedures

### Automatic Rollback
The deployment pipeline includes automatic rollback triggers:
- Health check failures after deployment
- Error rate exceeding threshold (5% for 5 minutes)
- Response time degradation (>2x baseline for 10 minutes)

### Manual Rollback
```bash
# Rollback to previous version
aws ecs update-service \
  --cluster passkey-inventory-prod \
  --service passkey-inventory \
  --task-definition passkey-inventory:PREVIOUS_REVISION

# Rollback database migration (if needed)
mvn flyway:undo -Dspring.profiles.active=production
```

### Rollback Validation
- Health check verification
- Smoke test execution
- Performance baseline validation
- Business functionality verification

## Disaster Recovery

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Service Level Agreement**: 99.9% uptime

### DR Procedures
1. **Assessment**: Determine scope and impact of disaster
2. **Failover**: Switch to secondary AWS region if needed
3. **Data Recovery**: Restore from latest backup
4. **Service Restoration**: Deploy application in DR environment
5. **Validation**: Verify functionality and performance
6. **Communication**: Update stakeholders on status

### DR Testing
- **Quarterly DR Drills**: Full disaster recovery simulation
- **Monthly Backup Testing**: Verify backup integrity
- **Weekly Health Checks**: Validate DR environment readiness