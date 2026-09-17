# Deployment

## Infrastructure

The Passkey Addons Service is deployed on Cvent's cloud infrastructure using containerized deployment with Docker and orchestrated through Jenkins CI/CD pipelines.

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│  Service Mesh   │────│   Application   │
│    (HAProxy)    │    │   (Consul)      │    │   Instances     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                               ┌─────────────────┐
                                               │  Oracle Database│
                                               │    Cluster      │
                                               └─────────────────┘
```

### Container Platform
- **Container Runtime**: Docker
- **Base Image**: OpenJDK 8 Alpine Linux
- **Registry**: docker.cvent.net
- **Orchestration**: Cvent's internal container platform

### Service Discovery
- **Service Mesh**: Consul for service discovery
- **Health Checks**: Integrated with Consul health checking
- **Load Balancing**: HAProxy with dynamic configuration

## Environments

### Development
- **URL**: `https://passkey-addons-service-dev.core.cvent.org`
- **Purpose**: Development and feature testing
- **Database**: Development Oracle instance
- **Deployment**: Automatic on merge to `develop` branch
- **Resources**: 
  - CPU: 1 core
  - Memory: 2GB
  - Instances: 1

### Staging
- **URL**: `https://passkey-addons-service-staging.core.cvent.org`
- **Purpose**: Pre-production testing and validation
- **Database**: Staging Oracle instance (production-like data)
- **Deployment**: Manual promotion from development
- **Resources**:
  - CPU: 2 cores
  - Memory: 4GB
  - Instances: 2

### Production
- **URL**: `https://passkey-addons-service.core.cvent.org`
- **Purpose**: Live production environment
- **Database**: Production Oracle cluster with read replicas
- **Deployment**: Manual promotion with approval process
- **Resources**:
  - CPU: 4 cores
  - Memory: 8GB
  - Instances: 4 (with auto-scaling)

## CI/CD Pipeline

### Jenkins Pipeline
The service uses a Jenkins-based CI/CD pipeline defined in `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package -Prelease'
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
                        sh 'mvn -Prun-it verify'
                    }
                }
            }
        }
        
        stage('Quality Gates') {
            steps {
                sh 'mvn sonar:sonar'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t passkey-addons:${BUILD_NUMBER} .'
            }
        }
        
        stage('Deploy to Dev') {
            when { branch 'develop' }
            steps {
                sh './deploy.sh dev'
            }
        }
    }
}
```

### Build Process
1. **Source Code Checkout**: Jenkins pulls latest code from Stash
2. **Dependency Resolution**: Maven downloads dependencies
3. **Compilation**: Java source code compiled
4. **Unit Testing**: JUnit tests executed
5. **Integration Testing**: Karate tests run against test environment
6. **Code Quality Analysis**: SonarQube analysis performed
7. **Docker Image Build**: Application packaged into Docker image
8. **Image Registry Push**: Docker image pushed to registry
9. **Deployment**: Service deployed to target environment

### Deployment Scripts

#### build.sh
```bash
#!/bin/bash
# Main build script
mvn clean package -Prelease
docker build -t passkey-addons:latest .
```

#### deploy.sh
```bash
#!/bin/bash
ENV=$1
echo "Deploying to $ENV environment"

# Deploy using Cvent's deployment tools
cvent-deploy --service=passkey-addons-service \
             --environment=$ENV \
             --image=passkey-addons:${BUILD_NUMBER}
```

#### dropkick.sh
```bash
#!/bin/bash
# Deployment automation script
./build.sh
./deploy.sh $1
```

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through environment-specific YAML files:

```
configs/
├── dev.yaml          # Development configuration
├── staging.yaml      # Staging configuration
├── prod.yaml         # Production configuration
├── dev.logback.xml   # Development logging
├── staging.logback.xml
└── prod.logback.xml
```

### Secret Management
- **API Keys**: Stored in Cvent's secret management system
- **Database Credentials**: Injected via environment variables
- **Certificates**: Managed through Cvent's PKI infrastructure

### Configuration Template (Hogan)
The service uses Hogan templates for configuration management:
- Templates stored in `configs/` directory
- Environment-specific values injected at deployment time
- Secrets resolved from secure storage

## Database Deployment

### Schema Management
- **Migration Tool**: Flyway for database migrations
- **Version Control**: SQL scripts versioned with application code
- **Rollback Strategy**: Automated rollback scripts for each migration

### Migration Process
```sql
-- V1.0.0__Initial_schema.sql
CREATE TABLE MARKETABLE_ADDONS (
    ID VARCHAR2(255) PRIMARY KEY,
    NAME VARCHAR2(500) NOT NULL,
    -- ... other columns
);

-- V1.0.1__Add_indexes.sql
CREATE INDEX IDX_MARKETABLE_ADDONS_HOTEL_EVENT 
ON MARKETABLE_ADDONS(HOTEL_ID, EVENT_ID);
```

### Database Environments
- **Development**: Single Oracle instance
- **Staging**: Oracle cluster with read replica
- **Production**: Oracle RAC cluster with multiple read replicas

## Monitoring and Alerting

### Application Monitoring
- **APM**: Datadog APM for application performance monitoring
- **Metrics**: Custom metrics exposed via Dropwizard metrics
- **Dashboards**: Grafana dashboards for operational visibility

### Infrastructure Monitoring
- **Host Metrics**: CPU, memory, disk, network monitoring
- **Container Metrics**: Docker container resource usage
- **Database Monitoring**: Oracle database performance metrics

### Alerting Rules
```yaml
# Example alerting configuration
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    severity: "critical"
    
  - name: "High Response Time"
    condition: "p95_response_time > 2s"
    duration: "10m"
    severity: "warning"
    
  - name: "Database Connection Pool Exhausted"
    condition: "db_pool_active >= db_pool_max"
    duration: "2m"
    severity: "critical"
```

### Log Aggregation
- **Log Collection**: Fluentd agents collect application logs
- **Log Storage**: Elasticsearch cluster for log storage
- **Log Analysis**: Kibana for log analysis and visualization

## Rollback Procedures

### Application Rollback
1. **Identify Issue**: Monitor alerts and metrics indicate problem
2. **Stop Traffic**: Remove service from load balancer rotation
3. **Rollback Image**: Deploy previous known-good Docker image
4. **Verify Health**: Confirm service health checks pass
5. **Restore Traffic**: Add service back to load balancer
6. **Monitor**: Watch metrics to confirm issue resolution

### Database Rollback
1. **Stop Application**: Prevent new database writes
2. **Execute Rollback Script**: Run prepared rollback SQL
3. **Verify Data Integrity**: Confirm data consistency
4. **Restart Application**: Deploy compatible application version
5. **Validate Functionality**: Run smoke tests

### Automated Rollback
```bash
#!/bin/bash
# rollback.sh - Automated rollback script
PREVIOUS_VERSION=$1

echo "Rolling back to version $PREVIOUS_VERSION"
cvent-deploy --service=passkey-addons-service \
             --environment=prod \
             --image=passkey-addons:$PREVIOUS_VERSION \
             --rollback

# Wait for health checks
sleep 30

# Verify deployment
curl -f https://passkey-addons-service.core.cvent.org/healthcheck
```

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Daily full backups, hourly incremental
- **Configuration Backups**: Version controlled in Git
- **Application Artifacts**: Stored in artifact repository

### Recovery Procedures
1. **Service Outage**: Deploy to alternate data center
2. **Database Failure**: Restore from backup and replay transactions
3. **Complete Disaster**: Full environment rebuild from infrastructure as code

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Service Level Agreement**: 99.9% uptime

## Security Considerations

### Network Security
- **VPC**: Service deployed in private VPC
- **Security Groups**: Restrictive firewall rules
- **TLS**: All communication encrypted in transit

### Application Security
- **Authentication**: API key validation required
- **Authorization**: Role-based access control
- **Input Validation**: All inputs validated and sanitized

### Compliance
- **SOC 2**: Compliance with SOC 2 Type II requirements
- **PCI DSS**: Payment card data handling compliance
- **GDPR**: Personal data protection compliance

## Performance Optimization

### Scaling Strategy
- **Horizontal Scaling**: Auto-scaling based on CPU and memory usage
- **Database Scaling**: Read replicas for read-heavy operations
- **Caching**: Application-level caching for frequently accessed data

### Performance Monitoring
- **Response Times**: P50, P95, P99 response time tracking
- **Throughput**: Requests per second monitoring
- **Error Rates**: Error rate tracking and alerting

### Capacity Planning
- **Load Testing**: Regular load testing to identify bottlenecks
- **Growth Projections**: Capacity planning based on business growth
- **Resource Optimization**: Regular review of resource utilization