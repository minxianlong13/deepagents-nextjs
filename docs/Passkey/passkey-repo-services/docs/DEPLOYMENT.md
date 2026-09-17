# Deployment

## Infrastructure

### Deployment Platform
- **Primary Platform**: Linux-based servers (likely CentOS/RHEL)
- **Deployment Tool**: Octo (Cvent's deployment orchestration system)
- **Process Management**: Unix cron for service scheduling
- **User Context**: Services run under dedicated `passkey` system user
- **File System**: Shared file system for logs and configuration

### Server Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Server                        │
├─────────────────────────────────────────────────────────────┤
│  /opt/PasskeyServices/                                      │
│  ├── GMLService/                                            │
│  │   ├── GMLService.jar                                     │
│  │   ├── GMLService.sh                                      │
│  │   └── configs/                                           │
│  ├── ExchangeRates/                                         │
│  ├── Nor1Processor/                                         │
│  └── [other services...]                                    │
├─────────────────────────────────────────────────────────────┤
│  /services/passkey/{environment}/services/logs/json/        │
│  ├── GMLService.log                                         │
│  ├── ExchangeRates.log                                      │
│  └── [service logs...]                                      │
├─────────────────────────────────────────────────────────────┤
│  Cron Configuration                                         │
│  └── /var/spool/cron/passkey                               │
└─────────────────────────────────────────────────────────────┘
```

## Environments

### Development Environment
- **Purpose**: Local development and initial testing
- **Deployment**: Manual deployment for development
- **Database**: Development database instances
- **External APIs**: Mock services or development endpoints
- **Logging**: Console and local file logging
- **Monitoring**: Basic logging without centralized monitoring

**Configuration**:
```bash
ENVIRONMENT=dev
LOG_DIR=/tmp/passkey-services/logs
DB_HOST=localhost
API_ENDPOINTS=dev-api.example.com
```

### Alpha Environment (Pre-Production)
- **Purpose**: Integration testing and quality assurance
- **Deployment**: Automated deployment via Jenkins/Octo
- **Database**: Alpha database with production-like data
- **External APIs**: Alpha/staging endpoints
- **Logging**: Centralized logging to `/services/passkey/pre-prod/alpha/services/logs/json`
- **Monitoring**: Full monitoring and alerting enabled

**Configuration**:
```bash
ENVIRONMENT=alpha
LOG_DIR=/services/passkey/pre-prod/alpha/services/logs/json
DB_HOST=alpha-db.cvent.org
API_ENDPOINTS=alpha-api.cvent.org
```

**Cron Schedule** (Alpha):
```bash
# More frequent execution for testing
*/5 * * * * /opt/PasskeyServices/GMLService/GMLService.sh
0 */6 * * * /opt/PasskeyServices/ExchangeRates/ExchangeRates.sh
0 8 * * * /opt/PasskeyServices/Nor1Processor/Nor1Processor.sh
```

### Beta Environment (User Acceptance Testing)
- **Purpose**: User acceptance testing and final validation
- **Deployment**: Automated deployment with approval gates
- **Database**: Beta database with sanitized production data
- **External APIs**: Production-like endpoints
- **Logging**: Production-level logging configuration
- **Monitoring**: Full production monitoring setup

**Configuration**:
```bash
ENVIRONMENT=beta
LOG_DIR=/services/passkey/pre-prod/beta/services/logs/json
DB_HOST=beta-db.cvent.org
API_ENDPOINTS=beta-api.cvent.org
```

### Production Environment
- **Purpose**: Live production workloads
- **Deployment**: Automated deployment with strict approval process
- **Database**: Production database clusters
- **External APIs**: Production endpoints
- **Logging**: Production logging with retention policies
- **Monitoring**: Comprehensive monitoring, alerting, and dashboards

**Configuration**:
```bash
ENVIRONMENT=prod
LOG_DIR=/services/passkey/prod/services/logs/json
DB_HOST=prod-db.cvent.org
API_ENDPOINTS=api.cvent.org
```

**Production Cron Schedule**:
```bash
# Production schedule from services_crontab
*/1 * * * * /opt/PasskeyServices/GMLService/GMLService.sh &
0 9 1 * * /opt/PasskeyServices/ExchangeRates/ExchangeRates.sh &
0 6 2 * * /opt/PasskeyServices/WebBillingReportService/WebBillingReportService.sh >/dev/null 2>&1 &
50 20 * * * /opt/PasskeyServices/RocheReportService/RocheReportService.sh >/dev/null 2>&1 &
0 6 * * * /opt/PasskeyServices/Nor1Processor/Nor1Processor.sh &
```

## CI/CD Pipeline

### Jenkins Pipeline Configuration
The deployment process is managed through Jenkins with the following stages:

#### 1. Source Code Management
```groovy
// Jenkinsfile (simplified)
pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
    }
}
```

#### 2. Build Stage
```bash
# Build all services
pnpm install
pnpm build

# Individual service builds
mvn -f packages/app/GMLService/pom.xml clean package -Dmaven.compiler.release=11
mvn -f packages/app/ExchangeRates/pom.xml clean package -Dmaven.compiler.release=11
# ... other services
```

#### 3. Quality Gates
```bash
# SonarQube analysis for each service
pnpm test:sonar

# Individual service analysis
mvn -f packages/app/GMLService/pom.xml sonar:sonar -Dsonar.host.url=https://sonar.core.cvent.org
```

#### 4. Artifact Creation
- JAR files packaged for each service
- Shell scripts and configuration files bundled
- Version information embedded in artifacts

#### 5. Deployment Orchestration
```bash
# Octo deployment
pipeline/publish.sh

# DORA metrics collection
pipeline/run_dora.sh
```

### Deployment Scripts

#### Octo Deployment Script
```bash
#!/bin/bash
# pipeline/publish.sh

# Deploy to target environment
octo deploy --project=passkey-services \
           --environment=${TARGET_ENV} \
           --version=${BUILD_VERSION} \
           --wait-for-deployment

# Verify deployment
octo verify --project=passkey-services \
           --environment=${TARGET_ENV}
```

#### DORA Metrics Collection
```bash
#!/bin/bash
# pipeline/run_dora.sh

# Collect deployment metrics
dora-metrics collect \
  --deployment-id=${BUILD_ID} \
  --environment=${TARGET_ENV} \
  --lead-time=${LEAD_TIME} \
  --deployment-frequency=daily
```

## Configuration Management

### Environment-Specific Configuration

#### Configuration Structure
```
packages/app/{ServiceName}/configs/
├── dev.properties
├── alpha.properties
├── beta.properties
└── prod.properties
```

#### Configuration Deployment Process
1. **Template Processing**: Environment-specific values injected into templates
2. **Encryption**: Sensitive values encrypted using environment-specific keys
3. **Validation**: Configuration syntax and required values validated
4. **Deployment**: Configuration files deployed to target servers
5. **Service Restart**: Services restarted to pick up new configuration

#### Configuration Management Tools
- **Octo Environment Variables**: Centralized environment variable management
- **Encrypted Configuration**: Sensitive data encrypted at rest
- **Configuration Validation**: Automated validation of configuration syntax
- **Rollback Support**: Previous configuration versions maintained for rollback

### Database Configuration
```properties
# Environment-specific database configuration
db.host=${DB_HOST}
db.port=${DB_PORT:5432}
db.name=${DB_NAME}
db.username=${DB_USERNAME}
db.password=${DB_PASSWORD_ENCRYPTED}
db.pool.size=${DB_POOL_SIZE:10}
db.timeout=${DB_TIMEOUT:30000}
```

### External API Configuration
```properties
# External service configuration
nor1.api.endpoint=${NOR1_API_ENDPOINT}
nor1.api.key=${NOR1_API_KEY_ENCRYPTED}
nor1.api.timeout=${NOR1_API_TIMEOUT:30000}

exchange.api.endpoint=${EXCHANGE_API_ENDPOINT}
exchange.api.key=${EXCHANGE_API_KEY_ENCRYPTED}
```

## Rollback Procedures

### Automated Rollback
```bash
# Octo-based rollback to previous version
octo rollback --project=passkey-services \
             --environment=${TARGET_ENV} \
             --to-version=${PREVIOUS_VERSION}
```

### Manual Rollback Steps

#### 1. Service Shutdown
```bash
# Stop all cron jobs
sudo crontab -r -u passkey

# Kill running processes
pkill -f "java.*GMLService"
pkill -f "java.*ExchangeRates"
# ... other services
```

#### 2. Artifact Rollback
```bash
# Backup current version
cp -r /opt/PasskeyServices /opt/PasskeyServices.backup.$(date +%Y%m%d_%H%M%S)

# Restore previous version
cp -r /opt/PasskeyServices.previous/* /opt/PasskeyServices/
```

#### 3. Configuration Rollback
```bash
# Restore previous configuration
cp -r /opt/PasskeyServices/configs.previous/* /opt/PasskeyServices/*/configs/
```

#### 4. Database Rollback (if needed)
```sql
-- Rollback database migrations if schema changes were made
-- This should be coordinated with DBA team
ROLLBACK TO SAVEPOINT pre_deployment;
```

#### 5. Service Restart
```bash
# Restore cron jobs
sudo crontab -u passkey /opt/PasskeyServices/services_crontab

# Verify services are healthy
/opt/PasskeyServices/GMLService/GMLService.sh health
/opt/PasskeyServices/ExchangeRates/ExchangeRates.sh health
```

### Rollback Validation
1. **Health Checks**: Verify all services pass health checks
2. **Log Verification**: Check logs for successful startup
3. **Functional Testing**: Execute basic functional tests
4. **Monitoring**: Verify monitoring systems show healthy status
5. **Stakeholder Notification**: Notify relevant teams of rollback completion

## Monitoring and Alerting

### Deployment Monitoring
- **Deployment Success/Failure**: Jenkins pipeline status
- **Service Health**: Post-deployment health check results
- **Performance Metrics**: Service execution time and resource usage
- **Error Rates**: Service error rates and failure patterns

### Production Monitoring
- **Cron Execution**: Monitor cron job execution and completion
- **Log Analysis**: Automated log analysis for errors and warnings
- **Resource Usage**: CPU, memory, and disk usage monitoring
- **External Dependencies**: Monitor external API availability and response times

### Alerting Configuration
```yaml
# Example alerting rules
alerts:
  - name: ServiceExecutionFailure
    condition: service_exit_code != 0
    severity: critical
    notification: pager_duty
  
  - name: ServiceExecutionDelay
    condition: service_execution_time > 300s
    severity: warning
    notification: slack
  
  - name: LogDirectoryFull
    condition: disk_usage > 90%
    severity: warning
    notification: email
```

## Disaster Recovery

### Backup Strategy
- **Code Repository**: Git-based version control with multiple remotes
- **Configuration Backup**: Daily backup of configuration files
- **Log Archival**: Automated log archival to long-term storage
- **Database Backup**: Regular database backups coordinated with DBA team

### Recovery Procedures
1. **Infrastructure Recovery**: Restore server infrastructure
2. **Code Deployment**: Deploy latest stable version from repository
3. **Configuration Restore**: Restore configuration from backup
4. **Database Recovery**: Coordinate database recovery with DBA team
5. **Service Validation**: Comprehensive testing before resuming operations
6. **Monitoring Restoration**: Restore monitoring and alerting systems