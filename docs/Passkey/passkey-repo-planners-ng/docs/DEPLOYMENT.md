# Deployment

## Infrastructure

The Passkey Planner Portal is deployed on AWS infrastructure using a multi-tier architecture with high availability and scalability considerations.

### AWS Services Used

- **EC2**: Application server instances running WildFly
- **RDS**: Oracle database with Multi-AZ deployment
- **S3**: File storage for uploads and static assets
- **ELB**: Application Load Balancer for traffic distribution
- **CloudWatch**: Monitoring and logging
- **Route 53**: DNS management
- **VPC**: Network isolation and security

### Network Architecture

```
Internet Gateway
       │
   Load Balancer (ELB)
       │
┌──────┴──────┐
│   Public    │
│   Subnet    │
└──────┬──────┘
       │
┌──────┴──────┐
│  Private    │
│  Subnet     │
│ (App Tier)  │
└──────┬──────┘
       │
┌──────┴──────┐
│  Private    │
│  Subnet     │
│ (Data Tier) │
└─────────────┘
```

---

## Environments

### Development Environment

**Purpose**: Local development and initial testing

**Infrastructure**:
- Local WildFly server
- Local Oracle database or H2 for testing
- Mock external services
- File storage on local filesystem

**Configuration**:
- Debug logging enabled
- Hot deployment for rapid development
- Relaxed security for testing
- Mock integrations for external services

**Access**:
- URL: `https://dev-planners.passkey.com/`
- VPN not required for local development
- Direct database access for debugging

---

### Staging Environment

**Purpose**: Pre-production testing and validation

**Infrastructure**:
- 2 EC2 instances (t3.medium)
- RDS Oracle instance (db.t3.medium)
- S3 bucket for file storage
- Application Load Balancer
- CloudWatch monitoring

**Configuration**:
- Production-like settings
- INFO level logging
- Full external service integration
- Performance monitoring enabled

**Access**:
- URL: `https://staging-planners.passkey.com/`
- VPN required for access
- Limited to internal users and QA team

**Deployment Process**:
1. Automated deployment via Octopus Deploy
2. Database migration scripts executed
3. Smoke tests run automatically
4. Manual QA validation required

---

### Production Environment

**Purpose**: Live system serving end users

**Infrastructure**:
- 4 EC2 instances (c5.large) in Auto Scaling Group
- RDS Oracle Multi-AZ (db.r5.xlarge)
- S3 bucket with versioning and encryption
- Application Load Balancer with SSL termination
- CloudWatch with custom dashboards and alarms
- Route 53 for DNS management

**Configuration**:
- WARN level logging for performance
- Full security hardening
- Connection pooling optimized
- Caching enabled for performance

**Access**:
- URL: `https://planners.passkey.com/`
- Public internet access
- SSL/TLS encryption required
- WAF protection enabled

**High Availability**:
- Multi-AZ deployment across 3 availability zones
- Auto Scaling Group maintains minimum 2 instances
- Database failover capability
- S3 cross-region replication for critical files

---

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The deployment pipeline is managed through Jenkins using the `buildPipeline` library:

```groovy
buildPipeline([
    ci: [
        lock: 'branch'  // Prevents concurrent builds
    ],
    release: [
        branches: [ 'master', 'release/.*', 'hotfix/.*' ]
    ],
    publish: [
        [ branches: [ 'development' ] ]
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

1. **Source Checkout**: Code retrieved from GitHub
2. **Dependency Resolution**: Maven and pnpm dependencies downloaded
3. **Compilation**: Java code compiled and frontend assets built
4. **Unit Tests**: JUnit tests executed with coverage reporting
5. **Static Analysis**: SonarQube analysis for code quality
6. **Security Scan**: Checkmarx SAST scanning (master branch)
7. **Package**: WAR file created with version tagging
8. **Artifact Storage**: Build artifacts stored in Nexus repository

### Deployment Stages

1. **Environment Preparation**: Target environment validated
2. **Database Migration**: Schema updates applied if needed
3. **Application Deployment**: WAR file deployed to WildFly
4. **Configuration Update**: Environment-specific configs applied
5. **Health Check**: Application health verified
6. **Smoke Tests**: Basic functionality validated
7. **Notification**: Team notified of deployment status

---

## Octopus Deploy Configuration

### Project Structure

```yaml
Project: planner-portal
Environments:
  - Development
  - Staging  
  - Production

Deployment Process:
  1. Deploy WAR to WildFly
  2. Update Configuration Files
  3. Run Database Scripts
  4. Restart Application Server
  5. Run Health Checks
  6. Send Notifications
```

### Variable Management

```yaml
# Database Configuration
Variables:
  DB.HOST: "#{Octopus.Environment.Name}-db.passkey.com"
  DB.PORT: "1521"
  DB.NAME: "passkey"
  DB.USERNAME: "planner_#{Octopus.Environment.Name}"
  DB.PASSWORD: "#{DB.LIVEDS.PASSWORD}"  # Encrypted

# Application Settings  
  APP.SESSION.TIMEOUT: "1800"
  APP.MAX.FILE.SIZE: "10485760"
  APP.LOG.LEVEL: "#{Log.Level}"

# External Services
  AUTH.SERVICE.URL: "https://#{Octopus.Environment.Name}-auth.passkey.com"
  REPORTING.SERVICE.URL: "https://#{Octopus.Environment.Name}-reporting.passkey.com"
```

### Deployment Steps

```yaml
Steps:
  - Name: "Stop WildFly Service"
    Type: "PowerShell Script"
    Script: "Stop-Service -Name 'WildFly' -Force"
    
  - Name: "Deploy Application"
    Type: "Deploy Package"
    Package: "plannerPortal.war"
    Target: "/opt/wildfly/standalone/deployments/"
    
  - Name: "Update Configuration"
    Type: "Deploy Package" 
    Package: "configuration"
    Target: "/opt/wildfly/standalone/configuration/"
    Transform: true
    
  - Name: "Run Database Migration"
    Type: "Run Script"
    Script: "database/migrate.sql"
    Connection: "#{DB.CONNECTION.STRING}"
    
  - Name: "Start WildFly Service"
    Type: "PowerShell Script"
    Script: "Start-Service -Name 'WildFly'"
    
  - Name: "Health Check"
    Type: "HTTP Test"
    URL: "#{Application.URL}/health"
    ExpectedCode: "200"
    Timeout: "60"
```

---

## Configuration Management

### Hogan-configs Integration

The application uses Hogan-configs for environment-specific configuration management:

```bash
# Generate configuration for specific environment
scripts/configure.sh staging

# This creates:
# - wildfly/standalone/configuration/passkey-standalone-full-staging.xml
# - Updates standalone.sh with oktaws integration
# - Processes template variables
```

### Template Processing

Configuration templates use Mustache-style variables:

```xml
<!-- Database Configuration -->
<datasource jndi-name="java:jboss/datasources/PasskeyDS">
    <connection-url>jdbc:oracle:thin:@{{DB.HOST}}:{{DB.PORT}}:{{DB.NAME}}</connection-url>
    <driver>oracle</driver>
    <security>
        <user-name>{{DB.USERNAME}}</user-name>
        <password>{{DB.PASSWORD}}</password>
    </security>
</datasource>
```

### Secrets Management

Sensitive configuration values are managed through:

1. **Octopus Variables**: Encrypted storage for passwords and keys
2. **AWS Secrets Manager**: Runtime secret retrieval
3. **Environment Variables**: Injected at deployment time
4. **Local Secrets**: Development-only secrets in `scripts/secrets/`

---

## Database Deployment

### Migration Strategy

Database changes are managed through versioned SQL scripts:

```
database/
├── migrations/
│   ├── V001__Initial_Schema.sql
│   ├── V002__Add_Reservations_Table.sql
│   ├── V003__Add_Indexes.sql
│   └── V004__Update_Constraints.sql
├── rollback/
│   ├── R001__Rollback_Initial.sql
│   └── R002__Rollback_Reservations.sql
└── data/
    ├── reference_data.sql
    └── test_data.sql
```

### Migration Process

1. **Pre-deployment**: Backup current database
2. **Validation**: Check migration script syntax
3. **Execution**: Run migration scripts in order
4. **Verification**: Validate schema changes
5. **Rollback Plan**: Prepare rollback scripts if needed

### Database Environments

```yaml
Development:
  - Single instance Oracle XE
  - Full data refresh weekly
  - Direct developer access

Staging:
  - Production-like Oracle Standard
  - Sanitized production data
  - Limited access for testing

Production:
  - Oracle Enterprise with RAC
  - Multi-AZ deployment
  - Automated backups and monitoring
```

---

## Monitoring and Alerting

### CloudWatch Dashboards

```yaml
Application Dashboard:
  - Response Time (P95, P99)
  - Error Rate (4xx, 5xx)
  - Request Volume
  - Active Users
  - Database Connections

Infrastructure Dashboard:
  - CPU Utilization
  - Memory Usage
  - Disk I/O
  - Network Traffic
  - Load Balancer Health
```

### Alerting Rules

```yaml
Critical Alerts:
  - Application Down (Health Check Failure)
  - High Error Rate (>5% for 5 minutes)
  - Database Connection Failure
  - High Response Time (>2s P95 for 10 minutes)

Warning Alerts:
  - High CPU Usage (>80% for 15 minutes)
  - High Memory Usage (>85% for 10 minutes)
  - Disk Space Low (<20% free)
  - SSL Certificate Expiring (30 days)
```

### Datadog Integration

```yaml
Metrics:
  - Custom application metrics
  - JVM performance metrics
  - Database query performance
  - Business KPIs (events created, reservations made)

Logs:
  - Application logs with structured format
  - Access logs from load balancer
  - Database audit logs
  - Security event logs

Traces:
  - Request tracing across services
  - Database query tracing
  - External service call tracing
```

---

## Rollback Procedures

### Application Rollback

1. **Immediate Rollback**:
   ```bash
   # Via Octopus Deploy
   octopus deploy-release --project="planner-portal" 
                         --environment="production" 
                         --version="previous"
   ```

2. **Manual Rollback**:
   ```bash
   # Stop current version
   sudo systemctl stop wildfly
   
   # Deploy previous WAR
   cp /backup/plannerPortal-previous.war /opt/wildfly/standalone/deployments/
   
   # Restart service
   sudo systemctl start wildfly
   ```

### Database Rollback

1. **Schema Rollback**:
   ```sql
   -- Execute rollback scripts in reverse order
   @rollback/R004__Rollback_Constraints.sql
   @rollback/R003__Rollback_Indexes.sql
   ```

2. **Data Rollback**:
   ```bash
   # Restore from backup
   rman target / <<EOF
   restore database from tag 'PRE_DEPLOYMENT_BACKUP';
   recover database;
   alter database open;
   EOF
   ```

### Rollback Decision Matrix

| Issue Type | Rollback Method | Time to Execute | Risk Level |
|------------|----------------|-----------------|------------|
| Application Bug | Octopus Deploy | 5-10 minutes | Low |
| Configuration Error | Config Update | 2-5 minutes | Low |
| Database Schema Issue | Schema Rollback | 15-30 minutes | Medium |
| Data Corruption | Full DB Restore | 1-2 hours | High |

---

## Security Considerations

### Network Security

- **VPC**: Isolated network environment
- **Security Groups**: Restrictive firewall rules
- **NACLs**: Network-level access control
- **WAF**: Web application firewall protection

### Application Security

- **SSL/TLS**: End-to-end encryption
- **Authentication**: Integration with Passkey Auth Service
- **Authorization**: Role-based access control
- **Input Validation**: Server-side validation for all inputs
- **Output Encoding**: XSS prevention

### Data Security

- **Encryption at Rest**: Database and S3 encryption
- **Encryption in Transit**: SSL for all communications
- **Access Logging**: Audit trail for all data access
- **Data Masking**: Sensitive data protection in non-prod

### Compliance

- **PCI DSS**: Payment card data protection
- **GDPR**: Personal data protection and privacy
- **SOC 2**: Security and availability controls
- **Regular Audits**: Quarterly security assessments