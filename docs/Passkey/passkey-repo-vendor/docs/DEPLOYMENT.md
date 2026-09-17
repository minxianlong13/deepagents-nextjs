# Deployment

## Infrastructure

### Container Platform
- **Orchestration**: Amazon ECS (Elastic Container Service)
- **Container Registry**: docker.cvent.net
- **Base Images**: Cvent standardized JRE images
- **Networking**: AWS VPC with private subnets

### AWS Services
- **Compute**: ECS Fargate tasks
- **Load Balancing**: Application Load Balancer (ALB)
- **Database**: Amazon RDS PostgreSQL
- **Monitoring**: CloudWatch + Datadog
- **Secrets**: AWS Secrets Manager
- **DNS**: Route 53

### Security
- **Network**: VPC with security groups
- **IAM**: Task-specific IAM roles
- **Encryption**: TLS in transit, encryption at rest
- **Secrets**: AWS Secrets Manager integration

## Environments

### Development (dev)
- **Purpose**: Local development and initial testing
- **Infrastructure**: 
  - Single ECS task (0.5 vCPU, 1GB memory)
  - RDS t3.micro instance
  - Shared development VPC
- **Database**: `passkey-vendor-dev`
- **URL**: `https://dev-api.cvent.com/passkey-vendor`
- **Monitoring**: Basic CloudWatch metrics
- **Retention**: 7 days for logs and metrics

### Testing/Integration (ts50)
- **Purpose**: Integration testing and QA validation
- **Infrastructure**:
  - 2 ECS tasks (1 vCPU, 2GB memory each)
  - RDS t3.small instance with read replica
  - Dedicated testing VPC
- **Database**: `passkey-vendor-ts50`
- **URL**: `https://ts50-api.cvent.com/passkey-vendor`
- **Monitoring**: Enhanced CloudWatch + Datadog
- **Retention**: 30 days for logs and metrics

### Staging (sg50)
- **Purpose**: Pre-production validation and performance testing
- **Infrastructure**:
  - 3 ECS tasks (2 vCPU, 4GB memory each)
  - RDS t3.medium instance with Multi-AZ
  - Production-like VPC configuration
- **Database**: `passkey-vendor-sg50`
- **URL**: `https://sg50-api.cvent.com/passkey-vendor`
- **Monitoring**: Full observability stack
- **Retention**: 90 days for logs and metrics

### Production (pr50)
- **Purpose**: Live production environment
- **Infrastructure**:
  - 5+ ECS tasks (4 vCPU, 8GB memory each)
  - RDS r5.large instance with Multi-AZ and read replicas
  - High-availability VPC across multiple AZs
- **Database**: `passkey-vendor-pr50`
- **URL**: `https://api.cvent.com/passkey-vendor`
- **Monitoring**: Comprehensive monitoring and alerting
- **Retention**: 1 year for logs, 2 years for metrics

## CI/CD Pipeline

### Jenkins Pipeline Configuration
The service uses a Dropwizard pipeline defined in `Jenkinsfile`:

```groovy
dropwizardPipeline([
  changesets: true,
  label: 'ecs-x86-medium',
  
  slack: [
    [branch: 'PR-.*', branch_type: 'SOURCE', channel: '_owner_', events: ['START', 'SUCCESS', 'FAILURE']],
    [branch: 'master', channel: 'passkey-api', events: ['START', 'SUCCESS', 'FAILURE']]
  ],
  
  release: [
    branch: 'master'
  ],
  
  ci: [
    builds: [
      [branch: '.*', environments: 'ci']
    ]
  ],
  
  builds: [
    [branch: 'development', environments: 'alpha'],
    [branch: 'master', environments: ['ts50', 'it50', 'sg50']]
  ]
])
```

### Pipeline Stages

#### 1. Source Code Checkout
- Checkout from GitHub repository
- Validate branch and commit information
- Set up build environment

#### 2. Build and Test
```bash
# Compile and package
mvn clean package -Prelease

# Run unit tests
mvn test

# Generate test reports
mvn jacoco:report -Pcoverage
```

#### 3. Code Quality Analysis
- **Checkmarx**: Security scanning (master branch only)
  - Team Path: `CxServer\\SAST\\Cvent\\Passkey`
  - Preset: `100011`
- **SonarQube**: Code quality analysis
- **Dependency Check**: Vulnerability scanning

#### 4. Docker Image Build
```dockerfile
FROM docker.cvent.net/maven:cvent-maven as builder
WORKDIR /usr/src/app
COPY . .
RUN mvn clean package -Prelease

FROM docker.cvent.net/cvent-jre:11.0.4.11
ENV SERVICE "passkey-vendor-service"
WORKDIR /usr/src
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" ./
CMD ["java", "-jar", "passkey-vendor-service-1.0.0-SNAPSHOT.jar", "server", "configs/dev.yaml"]
```

#### 5. Integration Testing
```bash
# Run Karate integration tests
mvn -Prun-it -Dkarate.env=ts50 verify
```

#### 6. Deployment
- **Development Branch**: Auto-deploy to alpha environment
- **Master Branch**: Auto-deploy to ts50, it50, sg50 environments
- **Production**: Manual approval required

### Scheduled Testing
- **PVT Tests**: Weekly on Fridays at 11 AM (pr50 environment)
- **Regression Tests**: Weekly on Tuesdays at 8 AM (ts50 environment)
- **Results**: Posted to Slack channels for monitoring

## Configuration Management

### Environment-Specific Configuration

#### Database Configuration
```yaml
# Development
database:
  url: jdbc:postgresql://dev-db.cvent.net:5432/passkey_vendor_dev
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxSize: 8

# Production  
database:
  url: jdbc:postgresql://prod-db.cvent.net:5432/passkey_vendor_prod
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxSize: 32
  readOnlyUrl: jdbc:postgresql://prod-db-ro.cvent.net:5432/passkey_vendor_prod
```

#### Service Configuration
```yaml
# Development
server:
  applicationConnectors:
    - type: http
      port: 8080

# Production
server:
  applicationConnectors:
    - type: http
      port: 8080
  requestLog:
    appenders:
      - type: file
        currentLogFilename: /var/log/passkey-vendor/access.log
```

### Secrets Management
- **Database Credentials**: Stored in AWS Secrets Manager
- **API Keys**: Environment-specific secrets
- **Certificates**: Managed through AWS Certificate Manager
- **Rotation**: Automated credential rotation where possible

### Feature Flags
- **Runtime Configuration**: Dynamic feature toggles
- **Environment-Specific**: Different features enabled per environment
- **Gradual Rollout**: Percentage-based feature activation

## Monitoring and Alerting

### Health Checks
- **Application Health**: `/healthcheck` endpoint
- **Database Connectivity**: Connection pool status
- **Dependency Health**: Auth service availability
- **Resource Usage**: Memory and CPU utilization

### Metrics and Monitoring
- **Application Metrics**: Request rates, response times, error rates
- **Infrastructure Metrics**: CPU, memory, network, disk usage
- **Business Metrics**: Vendor system operations, assignment success rates
- **Database Metrics**: Connection pool usage, query performance

### Alerting Rules
```yaml
# High Error Rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: High error rate detected

# Database Connection Issues
- alert: DatabaseConnectionFailure
  expr: database_connections_active / database_connections_max > 0.9
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: Database connection pool near capacity
```

### Notification Channels
- **Slack**: `#passkey-api` for general alerts
- **PagerDuty**: Critical production issues
- **Email**: Weekly summary reports
- **Datadog**: Dashboard and metric visualization

## Rollback Procedures

### Automated Rollback
1. **Health Check Failure**: Automatic rollback if health checks fail post-deployment
2. **Error Rate Spike**: Rollback triggered by high error rates
3. **Performance Degradation**: Rollback on response time increases

### Manual Rollback Process
1. **Identify Issue**: Confirm the need for rollback through monitoring
2. **Stop Traffic**: Temporarily route traffic away from affected instances
3. **Rollback Deployment**: 
   ```bash
   # Via Jenkins
   - Navigate to deployment job
   - Select previous successful build
   - Click "Deploy to Environment"
   
   # Via AWS CLI (emergency)
   aws ecs update-service --cluster passkey-cluster \
     --service passkey-vendor-service \
     --task-definition passkey-vendor-service:PREVIOUS_REVISION
   ```
4. **Verify Rollback**: Confirm service health and functionality
5. **Restore Traffic**: Gradually restore traffic to rolled-back version
6. **Post-Incident**: Document issue and plan fix for next deployment

### Database Rollback
1. **Schema Changes**: Use Flyway migration rollback scripts
2. **Data Changes**: Restore from point-in-time backup if necessary
3. **Coordination**: Ensure application and database versions are compatible

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with 30-day retention
- **Configuration**: Version-controlled configuration files
- **Application State**: Stateless design minimizes recovery complexity

### Recovery Procedures
1. **Service Failure**: Auto-scaling and health checks handle instance failures
2. **Database Failure**: RDS Multi-AZ provides automatic failover
3. **Region Failure**: Cross-region backup restoration procedures
4. **Complete Disaster**: Full environment recreation from infrastructure as code

### Recovery Time Objectives (RTO)
- **Service Instance**: < 5 minutes (auto-scaling)
- **Database Failover**: < 2 minutes (RDS Multi-AZ)
- **Full Environment**: < 4 hours (manual recreation)

### Recovery Point Objectives (RPO)
- **Database**: < 15 minutes (continuous backup)
- **Configuration**: < 1 hour (version control)
- **Logs**: < 5 minutes (real-time streaming)

## Security Considerations

### Network Security
- **VPC**: Private subnets for application and database tiers
- **Security Groups**: Restrictive inbound/outbound rules
- **NACLs**: Additional network-level access control
- **WAF**: Web Application Firewall for external-facing endpoints

### Application Security
- **Authentication**: API key validation through Auth Service
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **Output Encoding**: XSS prevention measures

### Data Security
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Encryption at Rest**: Database and storage encryption
- **Key Management**: AWS KMS for encryption key management
- **Access Logging**: Comprehensive audit trails

### Compliance
- **SOC 2**: Security and availability controls
- **GDPR**: Data protection and privacy measures
- **PCI DSS**: Payment card industry compliance (where applicable)
- **Regular Audits**: Quarterly security assessments