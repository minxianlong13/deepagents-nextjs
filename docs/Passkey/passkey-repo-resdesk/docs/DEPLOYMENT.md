# Deployment

## Infrastructure

### Application Server
- **Platform**: WildFly 16.0.0.Final
- **Java Version**: OpenJDK 17
- **Operating System**: Linux (CentOS/RHEL)
- **Container**: Docker containers for consistent deployment
- **Orchestration**: Kubernetes for production environments

### Database
- **Primary Database**: Oracle Database 19c
- **Connection Pooling**: HikariCP via WildFly data sources
- **High Availability**: Oracle RAC for production
- **Backup Strategy**: Daily automated backups with point-in-time recovery

### Load Balancing
- **Load Balancer**: AWS Application Load Balancer (ALB)
- **Health Checks**: HTTP health check endpoints
- **SSL Termination**: At load balancer level
- **Session Affinity**: Sticky sessions for stateful operations

## Environments

### Development Environment
- **URL**: `https://dev-manage.passkey.com`
- **Infrastructure**: Single WildFly instance
- **Database**: Shared development Oracle instance
- **Configuration**: Local development settings
- **Deployment**: Manual deployment via scripts
- **Monitoring**: Basic logging and JMX monitoring

**Resources**:
- CPU: 2 cores
- Memory: 4GB RAM
- Storage: 50GB SSD
- Network: Internal network only

### Staging Environment
- **URL**: `https://staging-manage.passkey.com`
- **Infrastructure**: Production-like setup with reduced capacity
- **Database**: Dedicated staging Oracle instance
- **Configuration**: Production-like configuration with test data
- **Deployment**: Automated via Jenkins pipeline
- **Monitoring**: Full monitoring stack with alerts

**Resources**:
- CPU: 4 cores
- Memory: 8GB RAM
- Storage: 100GB SSD
- Network: VPC with controlled access

### Production Environment
- **URL**: `https://manage.passkey.com`
- **Infrastructure**: Clustered WildFly instances behind load balancer
- **Database**: Oracle RAC cluster with failover
- **Configuration**: Production-optimized settings
- **Deployment**: Blue-green deployment strategy
- **Monitoring**: Comprehensive monitoring with Datadog

**Resources**:
- CPU: 8 cores per instance (3 instances)
- Memory: 16GB RAM per instance
- Storage: 500GB SSD per instance
- Network: Multi-AZ deployment with redundancy

## CI/CD Pipeline

### Jenkins Pipeline
The deployment process is automated through Jenkins with the following stages:

#### Build Stage
```groovy
stage('Build') {
    steps {
        sh 'pnpm install'
        sh 'pnpm run build'
        sh 'mvn clean package -Dmaven.test.skip=true'
    }
}
```

#### Test Stage
```groovy
stage('Test') {
    steps {
        sh 'pnpm run test:java'
        sh 'mvn verify'
    }
    post {
        always {
            publishTestResults testResultsPattern: '**/target/surefire-reports/*.xml'
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
        }
    }
}
```

#### Security Scan Stage
```groovy
stage('Security Scan') {
    steps {
        sh 'pnpm run test:sonar'
        // Additional security scanning tools
    }
}
```

#### Package Stage
```groovy
stage('Package') {
    steps {
        sh 'docker build -t passkey-resdesk:${BUILD_NUMBER} .'
        sh 'docker tag passkey-resdesk:${BUILD_NUMBER} passkey-resdesk:latest'
    }
}
```

#### Deploy Stage
```groovy
stage('Deploy') {
    when {
        branch 'master'
    }
    steps {
        script {
            if (env.BRANCH_NAME == 'master') {
                sh 'pnpm run release:publish'
            }
        }
    }
}
```

### Octopus Deploy Integration
- **Project**: resdesk
- **Deployment Process**: Automated deployment to multiple environments
- **Variables**: Environment-specific configuration management
- **Releases**: Versioned releases with rollback capability

### Pipeline Triggers
- **Automatic**: Triggered on commits to master branch
- **Manual**: Can be triggered manually for specific branches
- **Scheduled**: Nightly builds for comprehensive testing
- **Pull Request**: Validation builds for pull requests

## Configuration Management

### Hogan Templates
Configuration is managed through Hogan templates that generate environment-specific files:

```bash
# Generate configuration for environment
scripts/configure.sh production

# Files generated:
# - wildfly/standalone/configuration/passkey-standalone-full-production.xml
# - wildfly/modules/system/layers/base/config/main/passkey_production.properties
# - wildfly/modules/system/layers/base/config/main/passkeyenc_production.properties
# - wildfly/modules/system/layers/base/config/main/resdesk_production.properties
```

### Environment Variables
Key environment variables used in deployment:

```bash
# Database Configuration
DB_HOST=oracle-prod.internal.cvent.com
DB_PORT=1521
DB_SERVICE_NAME=PASSKEY_PROD
DB_USERNAME=resdesk_user
DB_PASSWORD_TOKEN=LiveDS-password-token

# Application Configuration
APP_ENV=production
LOG_LEVEL=INFO
JVM_HEAP_SIZE=4g
THREAD_POOL_SIZE=50

# External Service URLs
AUTH_SERVICE_URL=https://auth.passkey.com
COMMERCE_SERVICE_URL=https://commerce.passkey.com
LEDGER_SERVICE_URL=https://ledger.passkey.com
```

### Secrets Management
- **AWS Parameter Store**: Secure storage for sensitive configuration
- **Token-based**: Configuration references tokens instead of actual values
- **Encryption**: Sensitive data encrypted at rest and in transit
- **Rotation**: Regular rotation of database passwords and API keys

## Deployment Strategies

### Blue-Green Deployment
Production deployments use blue-green strategy for zero-downtime deployments:

1. **Prepare Green Environment**: Deploy new version to green environment
2. **Health Checks**: Verify green environment is healthy
3. **Switch Traffic**: Update load balancer to route traffic to green
4. **Monitor**: Watch metrics and logs for issues
5. **Rollback**: Keep blue environment ready for quick rollback if needed

### Rolling Deployment
For staging environments, rolling deployments are used:

1. **Deploy to First Instance**: Update one instance at a time
2. **Health Check**: Verify instance is healthy before proceeding
3. **Continue Rolling**: Deploy to remaining instances sequentially
4. **Complete**: All instances updated with new version

### Canary Deployment
For high-risk changes, canary deployments route small percentage of traffic:

1. **Deploy Canary**: Deploy to small subset of instances
2. **Route Traffic**: Send 5-10% of traffic to canary instances
3. **Monitor Metrics**: Watch for errors, performance issues
4. **Gradual Increase**: Slowly increase traffic to canary
5. **Full Deployment**: Complete deployment if metrics are good

## Rollback Procedures

### Automatic Rollback
- **Health Check Failures**: Automatic rollback if health checks fail
- **Error Rate Threshold**: Rollback if error rate exceeds 5%
- **Response Time**: Rollback if response time increases by 50%

### Manual Rollback
```bash
# Rollback to previous version
octopus-cli deploy-release --project=resdesk --version=4.1.8 --environment=production

# Rollback database changes (if needed)
liquibase rollback --count=1

# Verify rollback
curl -f https://manage.passkey.com/health
```

### Database Rollback
- **Backup Restoration**: Point-in-time recovery from backups
- **Migration Rollback**: Liquibase rollback for schema changes
- **Data Validation**: Verify data integrity after rollback

## Monitoring and Alerting

### Health Checks
```bash
# Application health endpoint
GET /health

# Response format
{
  "status": "UP",
  "checks": [
    {
      "name": "database",
      "status": "UP",
      "data": {
        "connectionPool": "healthy"
      }
    },
    {
      "name": "externalServices",
      "status": "UP",
      "data": {
        "authService": "healthy",
        "commerceService": "healthy"
      }
    }
  ]
}
```

### Datadog Monitoring
- **Application Metrics**: Response times, error rates, throughput
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Business Metrics**: Reservations created, cancellations, revenue
- **Log Aggregation**: Centralized logging with correlation IDs

### Alerting Rules
- **Critical**: Service down, database unavailable
- **Warning**: High error rate, slow response times
- **Info**: Deployment notifications, capacity warnings

### Incident Response
1. **Alert Received**: On-call engineer notified via PagerDuty
2. **Initial Assessment**: Check dashboards and logs
3. **Escalation**: Involve additional team members if needed
4. **Resolution**: Fix issue or rollback deployment
5. **Post-Mortem**: Document incident and lessons learned

## Security Considerations

### Network Security
- **VPC**: Isolated network environment
- **Security Groups**: Restrictive firewall rules
- **WAF**: Web Application Firewall for protection
- **DDoS Protection**: AWS Shield for DDoS mitigation

### Application Security
- **HTTPS**: All traffic encrypted with TLS 1.2+
- **Authentication**: Integration with Passkey Auth Service
- **Authorization**: Role-based access control
- **Input Validation**: XSS and injection protection

### Compliance
- **PCI DSS**: Payment card data protection
- **SOC 2**: Security and availability controls
- **GDPR**: Data privacy and protection
- **Audit Logging**: Comprehensive audit trails

## Disaster Recovery

### Backup Strategy
- **Database**: Daily full backups, hourly incremental
- **Application**: Versioned deployments in artifact repository
- **Configuration**: Version controlled in Git
- **Logs**: Retained for 90 days in centralized storage

### Recovery Procedures
- **RTO**: Recovery Time Objective of 4 hours
- **RPO**: Recovery Point Objective of 1 hour
- **Failover**: Automated failover to secondary region
- **Testing**: Quarterly disaster recovery testing

### Business Continuity
- **Multi-Region**: Deployment across multiple AWS regions
- **Data Replication**: Real-time database replication
- **Load Balancing**: Traffic routing to healthy regions
- **Communication**: Incident communication procedures