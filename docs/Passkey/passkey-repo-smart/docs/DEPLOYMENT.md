# Deployment

## Infrastructure

### Application Server
- **Platform**: WildFly 16.0.0.Final
- **Java Runtime**: OpenJDK 17
- **Deployment Type**: EAR (Enterprise Archive)
- **Container**: Docker containers in Kubernetes
- **Load Balancing**: Internal service mesh routing

### Database
- **Database**: Oracle Database
- **Connection**: JNDI datasource configuration
- **High Availability**: Oracle RAC cluster
- **Backup**: Automated daily backups with point-in-time recovery

### Networking
- **Service Mesh**: Internal Cvent service mesh
- **Load Balancer**: Internal load balancing for high availability
- **DNS**: Internal DNS resolution for service discovery
- **Security**: TLS encryption for all inter-service communication

## Environments

### Development (dev)
- **Purpose**: Local development and initial testing
- **Infrastructure**: Local WildFly server
- **Database**: Shared development Oracle instance
- **Configuration**: `passkey-standalone-full-dev.xml`
- **Access**: Local development machines
- **Monitoring**: Basic logging to local files

**Deployment Process**:
```bash
# Local development deployment
scripts/setup.sh
scripts/configure.sh dev
scripts/deploy.sh
```

### Alpha (alpha)
- **Purpose**: Integration testing and QA validation
- **Infrastructure**: Kubernetes cluster in alpha environment
- **Database**: Alpha Oracle database instance
- **Configuration**: `passkey-standalone-full-alpha.xml`
- **Access**: Internal Cvent network
- **Monitoring**: Datadog integration enabled

**Key Features**:
- Automated deployment via Jenkins
- Integration with other Passkey services
- Full monitoring and alerting
- Performance testing capabilities

### Production (prod)
- **Purpose**: Live customer-facing service
- **Infrastructure**: Production Kubernetes cluster
- **Database**: Production Oracle RAC cluster
- **Configuration**: `passkey-standalone-full-prod.xml`
- **Access**: Restricted to production operations team
- **Monitoring**: Full Datadog monitoring with alerting

**Key Features**:
- High availability with multiple replicas
- Automated failover and recovery
- Comprehensive monitoring and alerting
- Disaster recovery capabilities

## CI/CD Pipeline

### Jenkins Pipeline

#### Build Stage
```groovy
stage('Build') {
    steps {
        sh 'pnpm install'
        sh 'pnpm run build'
    }
}
```

#### Test Stage
```groovy
stage('Test') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'pnpm run test:java'
            }
        }
        stage('Coverage') {
            steps {
                sh 'pnpm run test:jacoco'
            }
        }
        stage('Security Scan') {
            steps {
                // Checkmarx security scanning
                checkmarx()
            }
        }
    }
}
```

#### Quality Gate
```groovy
stage('Quality Gate') {
    steps {
        sh 'pnpm run test:sonar'
        sonarQube()
    }
}
```

#### Publish Stage
```groovy
stage('Publish') {
    when {
        anyOf {
            branch 'master'
            branch 'development'
            branch 'release/*'
            branch 'hotfix/*'
        }
    }
    steps {
        sh 'pnpm run release:publish'
    }
}
```

### Octopus Deploy

#### Deployment Process
1. **Package Retrieval**: Download EAR artifact from Jenkins
2. **Configuration Substitution**: Apply environment-specific configurations
3. **Database Migration**: Run any required database schema updates
4. **Service Deployment**: Deploy to WildFly application server
5. **Health Check**: Verify service health and connectivity
6. **Smoke Tests**: Run basic functionality tests

#### Deployment Variables
- Environment-specific configuration values
- Database connection strings
- Service endpoint URLs
- Monitoring and logging configuration

## Configuration Management

### Hogan Templates

Configuration templates are processed for each environment using Hogan:

#### Template Processing
```bash
# Generate environment-specific configurations
scripts/configure.sh <environment>
```

#### Template Variables
- Database connection parameters
- SMTP server configuration
- Service integration endpoints
- Monitoring and logging settings

### Secrets Management

#### Octopus Variables
Sensitive configuration values are managed through Octopus Deploy:
- `#{DB.LIVEDS.PASSWORD}` - Database password
- `#{SMTP.PASSWORD}` - SMTP authentication password
- `#{DATADOG.API.KEY}` - Datadog API key
- `#{AUTH.SERVICE.TOKEN}` - Service authentication token

#### Local Development Secrets
For local development, secrets can be placed in:
```
scripts/secrets/<environment>.properties
```

Example `scripts/secrets/dev.properties`:
```properties
DB.LIVEDS.PASSWORD=dev_password
SMTP.PASSWORD=smtp_password
DATADOG.API.KEY=dev_api_key
```

## Rollback Procedures

### Automated Rollback
Octopus Deploy provides automated rollback capabilities:

1. **Identify Issue**: Monitoring alerts or manual detection
2. **Initiate Rollback**: Use Octopus Deploy dashboard
3. **Previous Version**: Automatically deploys previous known-good version
4. **Verification**: Health checks confirm successful rollback
5. **Notification**: Team notified of rollback completion

### Manual Rollback Steps

#### Emergency Rollback
```bash
# 1. Stop current application
/opt/wildfly/bin/jboss-cli.sh --connect --command="undeploy group-smart-all.ear"

# 2. Deploy previous version
/opt/wildfly/bin/jboss-cli.sh --connect --command="deploy /opt/deployments/previous/group-smart-all.ear"

# 3. Verify deployment
curl -f http://localhost:8080/health || echo "Health check failed"

# 4. Check logs
tail -f /opt/wildfly/standalone/log/server.log
```

#### Database Rollback
If database changes are involved:
```sql
-- Restore from backup if schema changes
-- Or run rollback scripts for data-only changes
```

### Rollback Verification

#### Health Checks
- Service responds to health check endpoints
- Database connectivity confirmed
- External service integrations working
- Email sending functionality operational

#### Smoke Tests
- Execute test campaign
- Verify email delivery
- Check monitoring metrics
- Validate log output

## Monitoring & Alerting

### Deployment Monitoring

#### Key Metrics
- Deployment success/failure rate
- Deployment duration
- Service startup time
- Health check response time

#### Alerts
- Deployment failure notifications
- Service health degradation
- Database connectivity issues
- External service integration failures

### Post-Deployment Validation

#### Automated Checks
- Health endpoint verification
- Database connection testing
- SMTP server connectivity
- Service integration validation

#### Manual Verification
- Campaign execution testing
- Email delivery confirmation
- Monitoring dashboard review
- Log analysis for errors

## Disaster Recovery

### Backup Strategy
- **Database**: Daily full backups with transaction log backups
- **Configuration**: Version-controlled configuration templates
- **Application**: Artifact repository with version history
- **Monitoring**: Backup of monitoring configurations and dashboards

### Recovery Procedures
1. **Assess Impact**: Determine scope of outage or data loss
2. **Restore Database**: Restore from most recent backup
3. **Redeploy Application**: Deploy known-good version
4. **Verify Functionality**: Run comprehensive tests
5. **Resume Operations**: Gradually restore traffic

### Business Continuity
- **Failover**: Automatic failover to backup systems
- **Communication**: Incident response communication plan
- **Recovery Time**: Target RTO of 4 hours, RPO of 1 hour
- **Testing**: Regular disaster recovery testing