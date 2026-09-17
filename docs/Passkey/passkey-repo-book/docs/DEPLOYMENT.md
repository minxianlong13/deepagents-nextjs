# Deployment

## Infrastructure

### AWS Cloud Infrastructure
The Passkey Book application is deployed on Amazon Web Services (AWS) using a multi-tier architecture:

- **Load Balancers**: Application Load Balancer (ALB) for traffic distribution
- **Compute**: EC2 instances running Wildfly application servers
- **Database**: RDS Oracle instances with Multi-AZ deployment
- **Storage**: S3 for static assets and backups
- **CDN**: CloudFront for static content delivery
- **Monitoring**: CloudWatch for infrastructure monitoring

### Network Architecture
```
Internet Gateway
    ↓
Application Load Balancer (ALB)
    ↓
Private Subnets (Multi-AZ)
    ├── Wildfly EC2 Instances
    ├── RDS Oracle Database
    └── ElastiCache (Session Storage)
```

## Environments

### Development (DEV)
- **URL**: `https://passkey-book-dev.core.cvent.org`
- **Purpose**: Development and feature testing
- **Infrastructure**:
  - 2 EC2 instances (t3.medium)
  - RDS Oracle (db.t3.small)
  - Single AZ deployment
- **Deployment**: Automatic on merge to `develop` branch
- **Data**: Synthetic test data, refreshed weekly

### Quality Assurance (QAI)
- **URL**: `https://passkey-book-qai.core.cvent.org`
- **Purpose**: Integration testing and QA validation
- **Infrastructure**:
  - 2 EC2 instances (t3.large)
  - RDS Oracle (db.t3.medium)
  - Multi-AZ deployment
- **Deployment**: Manual promotion from DEV
- **Data**: Production-like test data, anonymized

### Production (PR50)
- **URL**: `https://passkey-book-pr50.core.cvent.org`
- **Purpose**: Live production environment
- **Infrastructure**:
  - 4 EC2 instances (c5.xlarge)
  - RDS Oracle (db.r5.2xlarge)
  - Multi-AZ with read replicas
  - Auto Scaling Group (2-8 instances)
- **Deployment**: Manual promotion with approval process
- **Data**: Live production data with full backups

## CI/CD Pipeline

### Jenkins Pipeline
The deployment process is managed through Jenkins with the following stages:

#### Build Stage
```groovy
stage('Build') {
    steps {
        sh 'mvn clean compile'
        sh 'mvn test'
        sh 'mvn package'
    }
}
```

#### Quality Gates
```groovy
stage('Quality Analysis') {
    steps {
        sh 'mvn sonar:sonar'
        script {
            def qg = waitForQualityGate()
            if (qg.status != 'OK') {
                error "Pipeline aborted due to quality gate failure: ${qg.status}"
            }
        }
    }
}
```

#### Security Scanning
```groovy
stage('Security Scan') {
    steps {
        sh 'mvn org.owasp:dependency-check-maven:check'
        publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'target/dependency-check-report',
            reportFiles: 'dependency-check-report.html',
            reportName: 'OWASP Dependency Check Report'
        ])
    }
}
```

#### Deployment Stage
```groovy
stage('Deploy') {
    steps {
        script {
            if (env.BRANCH_NAME == 'develop') {
                deployToEnvironment('dev')
            } else if (env.BRANCH_NAME == 'master') {
                input message: 'Deploy to production?', ok: 'Deploy'
                deployToEnvironment('prod')
            }
        }
    }
}
```

### Deployment Process
1. **Code Commit**: Developer pushes code to Git repository
2. **Build Trigger**: Jenkins automatically triggers build pipeline
3. **Compilation**: Maven compiles and packages the application
4. **Testing**: Unit and integration tests are executed
5. **Quality Analysis**: SonarQube analyzes code quality
6. **Security Scan**: OWASP dependency check for vulnerabilities
7. **Artifact Creation**: WAR file and dependencies are packaged
8. **Environment Deployment**: Application is deployed to target environment
9. **Health Check**: Automated health checks verify deployment success
10. **Notification**: Team is notified of deployment status

## Configuration Management

### Environment-Specific Configuration
Configuration is managed using Hogan templates that generate environment-specific property files:

#### Template Structure
```
configs/
├── passkey_template.properties
├── dev-standalone-full.xml.template
├── database.properties.template
└── logging.properties.template
```

#### Hogan Configuration Generation
```bash
# Generate DEV configuration
hogan transform --configs ../../hogan-configs \
                --environments-filter dev \
                --templates configs \
                --templates-filter .*template.*

# Generate PROD configuration
hogan transform --configs ../../hogan-configs \
                --environments-filter prod \
                --templates configs \
                --templates-filter .*template.*
```

### Configuration Properties
```properties
# Database Configuration
database.url={{database.url}}
database.username={{database.username}}
database.password={{database.password}}
database.pool.size={{database.pool.size}}

# External Service URLs
auth.service.url={{auth.service.url}}
messaging.service.url={{messaging.service.url}}
payment.service.url={{payment.service.url}}

# Environment-Specific Settings
environment.name={{environment.name}}
logging.level={{logging.level}}
cache.enabled={{cache.enabled}}
```

### Secret Management
- **AWS Secrets Manager**: Database credentials and API keys
- **Environment Variables**: Non-sensitive configuration
- **Encrypted Properties**: Sensitive configuration encrypted at rest
- **Rotation Policy**: Secrets rotated every 90 days

## Deployment Scripts

### Setup Script
```bash
#!/bin/bash
# scripts/setup.sh

echo "Setting up Passkey Book development environment..."

# Install Oracle JDBC driver
./oracle-wildfly-module.sh $WILDFLY_HOME

# Copy configuration files
cp configs/dev-standalone-full.xml $WILDFLY_HOME/standalone/configuration/

# Set up database
echo "Database setup complete"

# Install Node.js dependencies
pnpm install

echo "Setup complete!"
```

### Deployment Script
```bash
#!/bin/bash
# scripts/deploy.sh

echo "Deploying Passkey Book application..."

# Build application
mvn clean package -DskipTests

# Stop Wildfly (if running)
$WILDFLY_HOME/bin/jboss-cli.sh --connect --command=:shutdown

# Deploy WAR file
cp packages/app/war/target/aws.war $WILDFLY_HOME/standalone/deployments/

# Start Wildfly
$WILDFLY_HOME/bin/standalone.sh -c dev-standalone-full.xml &

# Wait for deployment
sleep 30

# Health check
curl -f http://localhost:8080/health || exit 1

echo "Deployment complete!"
```

### Database Migration
```bash
#!/bin/bash
# scripts/migrate-db.sh

echo "Running database migrations..."

# Run Flyway migrations
mvn flyway:migrate -Dflyway.url=$DATABASE_URL \
                   -Dflyway.user=$DB_USERNAME \
                   -Dflyway.password=$DB_PASSWORD

echo "Database migration complete!"
```

## Monitoring & Health Checks

### Application Health Checks
```java
@RestController
public class HealthController {
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", Instant.now().toString());
        status.put("version", getClass().getPackage().getImplementationVersion());
        return ResponseEntity.ok(status);
    }
}
```

### Load Balancer Health Check
- **Endpoint**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy Threshold**: 2 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures

### Database Health Check
```sql
-- Simple database connectivity check
SELECT 1 FROM DUAL;

-- Application-specific health check
SELECT COUNT(*) FROM RESERVATIONS WHERE created_date > SYSDATE - 1;
```

## Rollback Procedures

### Automated Rollback
```bash
#!/bin/bash
# scripts/rollback.sh

PREVIOUS_VERSION=$1

echo "Rolling back to version: $PREVIOUS_VERSION"

# Stop current application
$WILDFLY_HOME/bin/jboss-cli.sh --connect --command=:shutdown

# Deploy previous version
cp deployments/aws-$PREVIOUS_VERSION.war $WILDFLY_HOME/standalone/deployments/aws.war

# Start application
$WILDFLY_HOME/bin/standalone.sh -c dev-standalone-full.xml &

# Verify rollback
sleep 30
curl -f http://localhost:8080/health || exit 1

echo "Rollback complete!"
```

### Database Rollback
```sql
-- Rollback database changes if needed
-- This should be coordinated with application rollback

-- Example: Rollback schema changes
ALTER TABLE RESERVATIONS DROP COLUMN new_column;

-- Example: Rollback data changes
UPDATE RESERVATIONS SET status = 'CONFIRMED' 
WHERE status = 'NEW_STATUS' AND modified_date > SYSDATE - 1;
```

### Manual Rollback Process
1. **Identify Issue**: Determine the need for rollback
2. **Stop Traffic**: Remove instances from load balancer
3. **Database Rollback**: Execute database rollback scripts if needed
4. **Application Rollback**: Deploy previous application version
5. **Verification**: Verify application functionality
6. **Traffic Restoration**: Add instances back to load balancer
7. **Monitoring**: Monitor application performance post-rollback
8. **Incident Report**: Document rollback reason and resolution

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Daily automated backups with 30-day retention
- **Application Backups**: WAR files stored in S3 with versioning
- **Configuration Backups**: Configuration files backed up with each deployment

### Recovery Procedures
1. **Database Recovery**: Restore from RDS automated backup or snapshot
2. **Application Recovery**: Deploy from S3-stored WAR files
3. **Configuration Recovery**: Restore configuration from backup
4. **DNS Failover**: Route traffic to disaster recovery environment
5. **Data Synchronization**: Sync any data changes since backup

### Recovery Time Objectives (RTO)
- **Database Recovery**: 4 hours
- **Application Recovery**: 2 hours
- **Full Service Recovery**: 6 hours

### Recovery Point Objectives (RPO)
- **Database**: 1 hour (based on backup frequency)
- **Application**: 0 (stateless application)
- **Configuration**: 24 hours (daily backup)