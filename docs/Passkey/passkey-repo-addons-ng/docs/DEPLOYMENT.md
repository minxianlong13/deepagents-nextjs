# Deployment

## Infrastructure

The Passkey Addons Portal is deployed on Cvent's internal infrastructure using a combination of Jenkins for CI/CD, Octopus Deploy for deployment orchestration, and WildFly application servers running on virtual machines.

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│  WildFly Nodes  │────│  Oracle DB      │
│   (F5/HAProxy)  │    │  (Clustered)    │    │  (RAC Cluster)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Shared NFS    │              │
         │              │   (Logs/Cache)  │              │
         │              └─────────────────┘              │
         │                                               │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Monitoring    │    │   Email Service │    │  Auth Service   │
│   (Datadog)     │    │   (SMTP)        │    │  (Passkey)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Server Specifications

#### Application Servers
- **OS**: Red Hat Enterprise Linux 8
- **CPU**: 4-8 vCPUs per node
- **Memory**: 8-16 GB RAM
- **Storage**: 100 GB SSD (OS + Application)
- **Network**: 1 Gbps internal, load balanced

#### Database Servers
- **Oracle RAC**: 19c Enterprise Edition
- **CPU**: 16+ vCPUs per node
- **Memory**: 32+ GB RAM
- **Storage**: High-performance SAN storage
- **Backup**: Daily automated backups with 30-day retention

## Environments

### Development Environment
- **Purpose**: Local development and initial testing
- **URL**: https://dev-book.passkey.com/addon
- **Infrastructure**: Local WildFly instance
- **Database**: Local Oracle XE or H2 for testing
- **Configuration**: `passkey-standalone-full-dev.xml`
- **Deployment**: Manual via `scripts/deploy.sh`

**Access**:
- Available to all development team members
- Self-signed SSL certificates
- Debug logging enabled
- Hot deployment supported

### Alpha Environment
- **Purpose**: Integration testing and early feature validation
- **URL**: https://alpha-book.passkey.com/addon
- **Infrastructure**: Single WildFly node
- **Database**: Shared Oracle development database
- **Configuration**: `passkey-standalone-full-alpha.xml`
- **Deployment**: Automated via Jenkins on development branch

**Characteristics**:
- Latest development features
- Automated testing execution
- Performance monitoring enabled
- Data refresh from production weekly

### TS50 Environment
- **Purpose**: Quality assurance and user acceptance testing
- **URL**: https://ts50-book.passkey.com/addon
- **Infrastructure**: Load-balanced WildFly cluster (2 nodes)
- **Database**: Dedicated Oracle test database
- **Configuration**: `passkey-standalone-full-ts50.xml`
- **Deployment**: Automated via Jenkins on release branches

**Characteristics**:
- Production-like configuration
- Full test suite execution
- Load testing capabilities
- Staging data with anonymized PII

### Staging Environment
- **Purpose**: Pre-production validation and final testing
- **URL**: https://stg-book.passkey.com/addon
- **Infrastructure**: Production-identical setup
- **Database**: Production data replica (sanitized)
- **Configuration**: `passkey-standalone-full-staging.xml`
- **Deployment**: Manual promotion from TS50

**Characteristics**:
- Identical to production infrastructure
- Production data (anonymized)
- Performance testing
- Final approval gate before production

### Production Environment
- **Purpose**: Live customer-facing application
- **URL**: https://book.passkey.com/addon
- **Infrastructure**: High-availability cluster (4+ nodes)
- **Database**: Oracle RAC with failover
- **Configuration**: `passkey-standalone-full-production.xml`
- **Deployment**: Controlled release via Octopus Deploy

**Characteristics**:
- 99.9% uptime SLA
- 24/7 monitoring and alerting
- Automated failover and recovery
- Blue-green deployment strategy

## CI/CD Pipeline

### Jenkins Pipeline Configuration
**Location**: `Jenkinsfile`

```groovy
buildPipeline([
    ci: [
        lock: 'branch'  // Prevent concurrent builds
    ],
    release: [
        branches: [ 'master', 'release/.*', 'hotfix/.*' ]
    ],
    publish: [
        [ branches: [ 'development' ] ]  // Auto-deploy to Alpha
    ],
    slack: [
        [ branches: ['master', 'development'], channels: ['#passkey-api'] ],
        [ branches: ['.*'], channels: ['_owner_'] ]
    ],
    checkmarx: [
        branch: 'master',
        syncMode: false,
        teamPath: 'CxServer\\SAST\\Cvent\\Passkey',
        presetValue: '100008'
    ]
])
```

### Build Stages

#### 1. Source Code Checkout
- Clone repository from GitHub
- Checkout specific branch/commit
- Initialize workspace

#### 2. Dependency Installation
```bash
# Install pnpm dependencies
pnpm install

# Validate package integrity
pnpm audit
```

#### 3. Code Quality Analysis
```bash
# Run SonarQube analysis
cd packages/app
mvn sonar:sonar -Dsonar.host.url=https://sonar.core.cvent.org
```

#### 4. Unit Testing
```bash
# Execute unit tests with coverage
mvn test -Daddon.build.tag=${BUILD_NUMBER}

# Generate coverage reports
mvn jacoco:report
```

#### 5. Security Scanning
- **Checkmarx SAST**: Static application security testing
- **Dependency Check**: Vulnerability scanning of dependencies
- **WhiteSource**: License compliance and security scanning

#### 6. Build Application
```bash
# Build WAR file
cd packages/app
mvn clean package -Dmaven.test.skip=true -Daddon.build.tag=${BUILD_NUMBER}
```

#### 7. Artifact Publishing
- Upload WAR file to Octopus Deploy
- Tag Docker images (if applicable)
- Update version metadata

### Deployment Automation

#### Octopus Deploy Configuration
**Project**: addon-portal
**URL**: https://octo.core.cvent.org/app#/Spaces-1/projects/addon-portal

**Deployment Process**:
1. **Pre-deployment Checks**
   - Verify target environment health
   - Check database connectivity
   - Validate configuration templates

2. **Application Deployment**
   - Stop WildFly services
   - Backup current deployment
   - Deploy new WAR file
   - Update configuration files
   - Start WildFly services

3. **Post-deployment Validation**
   - Health check verification
   - Smoke test execution
   - Performance baseline check
   - Rollback if validation fails

4. **Notification**
   - Slack notifications to #passkey-api
   - Email notifications to deployment team
   - DORA metrics collection

## Configuration Management

### Environment-Specific Configuration

Configuration files are generated using Hogan templates with environment-specific variables:

#### Template Structure
```
configs/
├── template.xml           # WildFly configuration template
├── template.conf          # Application properties template
└── secrets/
    ├── alpha.properties   # Alpha environment secrets
    ├── ts50.properties    # TS50 environment secrets
    └── staging.properties # Staging environment secrets
```

#### Configuration Generation
```bash
# Generate configuration for specific environment
scripts/configure.sh <environment>

# Example: Generate Alpha configuration
scripts/configure.sh alpha
```

#### Template Variables
```xml
<!-- Database Configuration -->
<property name="addon.jdbc.url" value="#{DB.LIVEDS.URL}" />
<property name="addon.jdbc.username" value="#{DB.LIVEDS.USERNAME}" />
<property name="addon.jdbc.password" value="#{DB.LIVEDS.PASSWORD}" />

<!-- Email Configuration -->
<property name="mail.smtp.host" value="#{MAIL.SMTP.HOST}" />
<property name="mail.smtp.password" value="#{MAIL.SMTP.PASSWORD}" />

<!-- Application URLs -->
<property name="addon.url" value="#{ADDON.BASE.URL}" />
```

### Secrets Management

Sensitive configuration values are managed through Octopus Deploy variables:

#### Variable Categories
- **Database Credentials**: Connection strings, usernames, passwords
- **Email Configuration**: SMTP credentials and settings
- **API Keys**: External service authentication tokens
- **SSL Certificates**: TLS certificates and private keys

#### Variable Scoping
- **Environment-specific**: Different values per environment
- **Role-specific**: Different values per server role
- **Machine-specific**: Unique values per deployment target

### Configuration Validation

Pre-deployment validation ensures configuration integrity:

```bash
# Validate configuration templates
scripts/validate-config.sh <environment>

# Check for missing variables
grep -r "#{.*}" wildfly/standalone/configuration/

# Verify database connectivity
scripts/test-db-connection.sh <environment>
```

## Rollback Procedures

### Automated Rollback Triggers
- Health check failures post-deployment
- Critical error rate thresholds exceeded
- Database connectivity issues
- Manual rollback initiation

### Rollback Process

#### 1. Immediate Response
```bash
# Stop current deployment
systemctl stop wildfly

# Restore previous version
cp /opt/backups/addon-previous.war /opt/wildfly/standalone/deployments/addon.war

# Restart service
systemctl start wildfly
```

#### 2. Database Rollback (if required)
```sql
-- Restore database from backup
RMAN> RESTORE DATABASE FROM TAG 'PRE_DEPLOYMENT_BACKUP';
RMAN> RECOVER DATABASE;
```

#### 3. Configuration Rollback
```bash
# Restore previous configuration
cp /opt/backups/passkey-standalone-full-production.xml.backup \
   /opt/wildfly/standalone/configuration/passkey-standalone-full-production.xml
```

#### 4. Validation
- Execute health checks
- Verify application functionality
- Monitor error rates and performance
- Confirm user access

### Rollback Testing
- Monthly rollback drills in staging environment
- Automated rollback testing in CI/CD pipeline
- Documentation updates based on lessons learned

## Monitoring and Alerting

### Application Monitoring
**Platform**: Datadog
**Dashboard**: https://cvent.datadoghq.com/services?env=pr50&selectedService=add-on-portal

**Key Metrics**:
- Request rate and response times
- Error rates and exception counts
- JVM memory and garbage collection
- Database connection pool usage
- Addon processing throughput

### Infrastructure Monitoring
- **CPU Usage**: Alert if >80% for 5 minutes
- **Memory Usage**: Alert if >85% for 5 minutes
- **Disk Space**: Alert if >90% usage
- **Network Connectivity**: Alert on connection failures

### Business Metrics
- **Addon Purchase Rate**: Transactions per minute
- **User Session Duration**: Average session length
- **Search Performance**: Query response times
- **Email Delivery Rate**: Notification success rate

### Alert Configuration
```yaml
# High Error Rate Alert
- name: "Addon Portal High Error Rate"
  condition: "error_rate > 5%"
  duration: "5 minutes"
  severity: "critical"
  channels: ["#passkey-api", "pagerduty"]

# Database Connection Alert
- name: "Database Connection Pool Exhausted"
  condition: "db_connections_active >= db_connections_max"
  duration: "2 minutes"
  severity: "critical"
  channels: ["#passkey-api", "pagerduty"]

# Performance Degradation Alert
- name: "Response Time Degradation"
  condition: "avg_response_time > 2000ms"
  duration: "10 minutes"
  severity: "warning"
  channels: ["#passkey-api"]
```

## Disaster Recovery

### Backup Strategy
- **Database**: Daily full backups, hourly incremental
- **Application**: WAR files stored in artifact repository
- **Configuration**: Version controlled in Git
- **Logs**: Centralized logging with 90-day retention

### Recovery Procedures
1. **Assess Impact**: Determine scope of outage
2. **Activate DR Site**: Switch to backup infrastructure
3. **Restore Data**: Apply latest database backup
4. **Deploy Application**: Use last known good version
5. **Validate Functionality**: Execute smoke tests
6. **Update DNS**: Redirect traffic to DR site
7. **Monitor**: Continuous monitoring during recovery

### Recovery Time Objectives
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **MTTR (Mean Time To Recovery)**: 2 hours

### DR Testing
- Quarterly disaster recovery drills
- Annual full-scale DR exercise
- Documentation updates based on test results