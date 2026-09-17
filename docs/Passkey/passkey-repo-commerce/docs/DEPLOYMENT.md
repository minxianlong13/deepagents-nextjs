# Deployment

## Infrastructure

### Platform Architecture
- **Cloud Provider**: AWS (Amazon Web Services)
- **Container Platform**: Kubernetes/OpenShift
- **Application Server**: Wildfly 26.1.3.Final
- **Database**: Oracle Database (managed service)
- **Load Balancer**: AWS Application Load Balancer
- **Service Mesh**: Istio (for service-to-service communication)

### Network Architecture
```
Internet → ALB → Kubernetes Ingress → Service → Pod (Wildfly + App)
                                                    ↓
                                              Oracle Database
```

## Environments

### Development Environment
- **URL**: `https://passkey-commerce-dev.core.cvent.org`
- **Port**: 8180 (8080 + offset 100)
- **Database**: Development Oracle instance
- **Resources**: 
  - CPU: 1 core
  - Memory: 2GB
  - Storage: 10GB
- **Replicas**: 1
- **Purpose**: Feature development and initial testing

### Staging Environment
- **URL**: `https://passkey-commerce-staging.core.cvent.org`
- **Port**: 8180
- **Database**: Staging Oracle instance (production-like data)
- **Resources**:
  - CPU: 2 cores
  - Memory: 4GB
  - Storage: 20GB
- **Replicas**: 2
- **Purpose**: Pre-production validation and integration testing

### Production Environment
- **URL**: `https://passkey-commerce.core.cvent.org`
- **Port**: 8180
- **Database**: Production Oracle cluster
- **Resources**:
  - CPU: 4 cores
  - Memory: 8GB
  - Storage: 50GB
- **Replicas**: 3 (minimum for high availability)
- **Purpose**: Live commerce processing

## CI/CD Pipeline

### Jenkins Pipeline Configuration
```groovy
buildPipeline([
    ci: [
        lock: 'branch'
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
1. **Source Checkout**: Clone repository from GitHub
2. **Dependency Resolution**: Download Maven and npm dependencies
3. **Compilation**: Compile Java source code
4. **Unit Testing**: Run JUnit tests with coverage
5. **Static Analysis**: SonarQube code quality analysis
6. **Security Scan**: Checkmarx security vulnerability scan
7. **Package**: Create EAR file for deployment
8. **Docker Build**: Create container image
9. **Push to Registry**: Push image to container registry
10. **Deploy**: Deploy to target environment

### Deployment Automation
```bash
#!/bin/bash
# pipeline/publish.sh

set -e

# Build and package application
pnpm run build

# Create Docker image
docker build -t passkey-commerce:${BUILD_NUMBER} .

# Push to registry
docker push cvent-registry/passkey-commerce:${BUILD_NUMBER}

# Deploy via Octopus
octo create-release \
  --project="commerce" \
  --version="${BUILD_NUMBER}" \
  --packageversion="${BUILD_NUMBER}" \
  --deployto="${ENVIRONMENT}"
```

## Configuration Management

### Environment-Specific Configuration
Configuration is managed through Hogan templates that generate environment-specific files:

```bash
# Generate configuration for specific environment
scripts/configure.sh <environment>
```

### Configuration Files Generated
- `wildfly/standalone/configuration/passkey-standalone-full-<env>.xml`
- `wildfly/standalone/configuration/<env>.properties`

### Hogan Template Example
```xml
<!-- Template: configs/wildfly-config.template.xml -->
<datasource jndi-name="java:jboss/datasources/LiveDS" pool-name="LiveDS">
    <connection-url>{{DB.LIVEDS.URL}}</connection-url>
    <driver>oracle</driver>
    <security>
        <user-name>{{DB.LIVEDS.USERNAME}}</user-name>
        <password>{{DB.LIVEDS.PASSWORD}}</password>
    </security>
</datasource>
```

### Secret Management
Secrets are managed through Octopus Deploy variables and Kubernetes secrets:

```yaml
# Kubernetes Secret
apiVersion: v1
kind: Secret
metadata:
  name: commerce-secrets
type: Opaque
data:
  db-password: <base64-encoded-password>
  ejb-security-realm: <base64-encoded-realm>
```

## Container Configuration

### Dockerfile
```dockerfile
FROM registry.redhat.io/ubi8/openjdk-17:latest

# Install Wildfly
ENV WILDFLY_VERSION=26.1.3.Final
RUN curl -O https://download.jboss.org/wildfly/${WILDFLY_VERSION}/wildfly-${WILDFLY_VERSION}.tar.gz \
    && tar -xzf wildfly-${WILDFLY_VERSION}.tar.gz \
    && mv wildfly-${WILDFLY_VERSION} /opt/wildfly \
    && rm wildfly-${WILDFLY_VERSION}.tar.gz

# Copy application
COPY group-commerce-ear/target/group-commerce-ear-*.ear /opt/wildfly/standalone/deployments/

# Copy configuration
COPY configs/wildfly-config.xml /opt/wildfly/standalone/configuration/standalone.xml

# Expose ports
EXPOSE 8080 9990

# Start Wildfly
CMD ["/opt/wildfly/bin/standalone.sh", "-b", "0.0.0.0", "-bmanagement", "0.0.0.0"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: passkey-commerce
  namespace: passkey
spec:
  replicas: 3
  selector:
    matchLabels:
      app: passkey-commerce
  template:
    metadata:
      labels:
        app: passkey-commerce
    spec:
      containers:
      - name: commerce
        image: cvent-registry/passkey-commerce:latest
        ports:
        - containerPort: 8080
        - containerPort: 9990
        env:
        - name: DB_LIVEDS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: commerce-secrets
              key: db-password
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 9990
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 9990
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Service Configuration
```yaml
apiVersion: v1
kind: Service
metadata:
  name: passkey-commerce-service
  namespace: passkey
spec:
  selector:
    app: passkey-commerce
  ports:
  - name: http
    port: 8080
    targetPort: 8080
  - name: management
    port: 9990
    targetPort: 9990
  type: ClusterIP
```

## Database Deployment

### Database Migration
Database schema changes are managed through Flyway migrations:

```sql
-- V1.0.0__Initial_schema.sql
CREATE TABLE payment_transactions (
    transaction_id VARCHAR2(50) PRIMARY KEY,
    order_id VARCHAR2(100) NOT NULL,
    amount NUMBER(10,2) NOT NULL,
    -- ... other columns
);

-- V1.0.1__Add_indexes.sql
CREATE INDEX idx_payment_trans_status ON payment_transactions(status);
CREATE INDEX idx_payment_trans_date ON payment_transactions(created_date);
```

### Database Connection Configuration
```xml
<!-- Environment-specific datasource -->
<datasource jndi-name="java:jboss/datasources/LiveDS" pool-name="LiveDS">
    <connection-url>${env.DB_LIVEDS_URL}</connection-url>
    <driver>oracle</driver>
    <pool>
        <min-pool-size>10</min-pool-size>
        <max-pool-size>50</max-pool-size>
        <prefill>true</prefill>
    </pool>
    <security>
        <user-name>${env.DB_LIVEDS_USERNAME}</user-name>
        <password>${env.DB_LIVEDS_PASSWORD}</password>
    </security>
    <timeout>
        <idle-timeout-minutes>5</idle-timeout-minutes>
    </timeout>
</datasource>
```

## Monitoring & Health Checks

### Health Check Endpoints
```java
@Path("/health")
@ApplicationScoped
public class HealthCheckResource {
    
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response healthCheck() {
        HealthStatus status = new HealthStatus();
        status.setStatus("UP");
        status.setTimestamp(new Date());
        status.addCheck("database", checkDatabaseConnection());
        status.addCheck("payment-gateway", checkPaymentGateway());
        return Response.ok(status).build();
    }
}
```

### Kubernetes Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 9990
  initialDelaySeconds: 60
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 9990
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Monitoring Integration
```yaml
# Prometheus monitoring
apiVersion: v1
kind: Service
metadata:
  name: passkey-commerce-metrics
  labels:
    app: passkey-commerce
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9990"
    prometheus.io/path: "/metrics"
spec:
  ports:
  - port: 9990
    name: metrics
  selector:
    app: passkey-commerce
```

## Rollback Procedures

### Automated Rollback
```bash
#!/bin/bash
# Rollback to previous version

PREVIOUS_VERSION=$(octo list-releases --project=commerce --take=2 | tail -1)

octo deploy-release \
  --project="commerce" \
  --version="${PREVIOUS_VERSION}" \
  --deployto="${ENVIRONMENT}" \
  --force
```

### Manual Rollback Steps
1. **Identify Issue**: Confirm deployment issue through monitoring
2. **Stop Traffic**: Temporarily route traffic away from affected instances
3. **Rollback Application**: Deploy previous known-good version
4. **Verify Database**: Ensure database state is consistent
5. **Restore Traffic**: Gradually restore traffic to rolled-back instances
6. **Monitor**: Closely monitor system health post-rollback

### Database Rollback
```sql
-- Example rollback script
-- V1.0.2__Rollback_schema_changes.sql

-- Drop new columns if they exist
ALTER TABLE payment_transactions DROP COLUMN IF EXISTS new_column;

-- Restore previous constraints
ALTER TABLE payment_transactions ADD CONSTRAINT old_constraint_name CHECK (amount > 0);
```

## Security Considerations

### Network Security
- **TLS Termination**: SSL/TLS terminated at load balancer
- **Internal Communication**: mTLS for service-to-service communication
- **Network Policies**: Kubernetes network policies restrict pod communication
- **Firewall Rules**: AWS security groups control network access

### Application Security
- **Container Scanning**: Regular vulnerability scans of container images
- **Secret Management**: Secrets stored in Kubernetes secrets or AWS Secrets Manager
- **RBAC**: Role-based access control for Kubernetes resources
- **Security Contexts**: Non-root containers with minimal privileges

### Compliance
- **PCI DSS**: Payment data handled through compliant PBB service
- **SOC 2**: Infrastructure meets SOC 2 Type II requirements
- **Audit Logging**: Comprehensive audit trails for all transactions
- **Data Encryption**: Encryption at rest and in transit

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated daily backups with point-in-time recovery
- **Configuration Backups**: Version-controlled configuration templates
- **Application Artifacts**: Immutable container images in registry

### Recovery Procedures
1. **Assessment**: Evaluate scope and impact of disaster
2. **Communication**: Notify stakeholders and activate incident response
3. **Infrastructure**: Restore infrastructure components
4. **Database**: Restore database from backup
5. **Application**: Deploy application from known-good artifacts
6. **Validation**: Verify system functionality
7. **Traffic Restoration**: Gradually restore production traffic

### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Data Loss Tolerance**: Maximum 1 hour of transaction data