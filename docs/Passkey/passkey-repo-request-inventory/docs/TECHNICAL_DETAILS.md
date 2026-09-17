# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Application Server**: Embedded Jetty (via Dropwizard)
- **Packaging**: Executable JAR with embedded server

### Database
- **Primary Database**: PostgreSQL
- **Connection Pooling**: HikariCP (via Dropwizard)
- **Transaction Management**: Custom TransactionManager with proxy pattern
- **Migration**: Liquibase (assumed based on Cvent patterns)

### Authentication & Security
- **Authentication**: Cvent Auth Service integration
- **Authorization**: API Key-based with Authority annotations
- **Security Framework**: Cvent Auth Dropwizard Bundle
- **Policy Type**: API service policy

### Observability
- **Logging**: SLF4J with Logback
- **Metrics**: Dropwizard Metrics
- **Health Checks**: Dropwizard Health Checks
- **Monitoring**: Datadog integration
- **Tracing**: Log context with correlation IDs

## Dependencies

### Core Dependencies (from pom.xml analysis)

```xml
<!-- Parent POM -->
<parent>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>57.4.9</version>
</parent>

<!-- Auth Service Integration -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>28.4.1</version>
</dependency>
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>28.4.1</version>
</dependency>
```

### Key Framework Dependencies
- **Dropwizard Core**: Web framework and embedded server
- **Jackson**: JSON serialization/deserialization
- **Jersey**: JAX-RS implementation for REST APIs
- **Hibernate Validator**: Bean validation
- **Guava**: Google core libraries for Java

### Cvent-Specific Dependencies
- **Cvent Application Framework**: Base application structure
- **Cvent Observability**: Logging and monitoring utilities
- **Cvent Security**: Authentication and authorization
- **Cvent Pangaea**: Multi-environment support utilities

### Testing Dependencies
- **JUnit 5**: Unit testing framework
- **Mockito**: Mocking framework
- **Karate**: API integration testing
- **TestContainers**: Database testing (likely)

## Configuration

### Environment Configuration Files

The service uses YAML-based configuration with environment-specific files:

```
passkey-request-inventory-service/configs/
├── dev.yaml          # Development environment
├── staging.yaml      # Staging environment
├── prod.yaml         # Production environment
└── local.yaml        # Local development
```

### Configuration Structure

```yaml
# Database Configuration
database:
  driverClass: org.postgresql.Driver
  url: jdbc:postgresql://localhost:5432/passkey_inventory
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
  minSize: 8
  maxSize: 32

# Server Configuration
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

# Logging Configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkey.requestinventory: DEBUG
  appenders:
    - type: console
      threshold: INFO
      target: stdout
```

### Environment Variables

Key environment variables used by the service:

- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `AUTH_SERVICE_URL`: Auth service endpoint
- `LOG_LEVEL`: Application log level
- `ENVIRONMENT`: Deployment environment identifier

### Hogan Template Integration

Configuration managed through Hogan templates:
- **Template Directory**: `passkey-request-inventory-service/configs`
- **Template Processing**: Environment-specific value injection
- **Secret Management**: Secure handling of sensitive configuration

## Database Schema

### Core Tables (Inferred from DAO classes)

#### request_inventory
- Primary table for inventory allocation records
- Stores reservation-to-inventory mappings
- Managed by `RequestInventoryDao`

#### allocation_records
- Detailed allocation information
- Tracks individual room allocations
- Managed by `AllocationRecordDao`

#### inventory_acquisition
- Records of inventory acquisition operations
- Audit trail for inventory changes
- Managed by `InventoryAcquisitionDao`

#### inventory_updates
- Log of inventory update operations
- Change tracking and history
- Managed by `InventoryUpdateDao`

#### locks
- Active inventory locks
- Temporary holds on inventory
- Managed by `LockDao`

#### web_info
- Additional web-related information
- Supplementary data for operations
- Managed by `WebInfoDao`

### Connection Management

```java
// Transaction Manager Configuration
TransactionManager tx = DB_CONFIGURER.createTransactionManager(
    config.getDatabaseConfig(), 
    environment
);

// Proxy-based Transaction Management
var service = tx.createProxy(new ServiceImplementation(dao));
```

## Build Configuration

### Maven Profiles

```xml
<!-- Default Profile -->
<profile>
    <id>default</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <modules>
        <module>passkey-request-inventory-api</module>
        <module>passkey-request-inventory-java-client</module>
        <module>passkey-request-inventory-data-access</module>
        <module>passkey-request-inventory-service</module>
        <module>passkey-request-inventory-integration-test</module>
        <module>passkey-request-inventory-load-test</module>
    </modules>
</profile>

<!-- Integration Test Profile -->
<profile>
    <id>run-it</id>
    <properties>
        <skipIntegrationTests>false</skipIntegrationTests>
    </properties>
</profile>

<!-- Load Test Profile -->
<profile>
    <id>run-load</id>
    <properties>
        <skipLoadTests>false</skipLoadTests>
    </properties>
</profile>
```

### Build Commands

```bash
# Standard build
mvn clean package

# Release build
mvn clean package -Prelease

# With integration tests
mvn clean verify -Prun-it -Dkarate.env=dev

# With load tests
mvn clean verify -Prun-load

# Code coverage
mvn clean package -Pcoverage
mvn jacoco:report -Pcoverage
```

## Code Quality & Coverage

### SonarQube Configuration

```xml
<sonar.coverage.exclusions>
    passkey-request-inventory-api/**,
    passkey-request-inventory-java-client/**,
    passkey-request-inventory-data-access/**,
    passkey-request-inventory-load-test/**,
    passkey-request-inventory-integration-test/**,
    passkey-request-inventory-service/src/main/java/com/cvent/passkey/requestinventory/PasskeyRequestInventoryServiceApplication.java
</sonar.coverage.exclusions>
```

### JaCoCo Configuration

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <excludes>
            <exclude>com/cvent/passkey/requestinventory/PasskeyRequestInventoryServiceApplication.class</exclude>
        </excludes>
    </configuration>
</plugin>
```

## Containerization

### Docker Configuration

```dockerfile
# Multi-stage build
FROM docker.cvent.net/maven:cvent-maven as builder
WORKDIR /usr/src/app
COPY . .
RUN mvn clean package -Prelease

# Runtime image
FROM docker.cvent.net/cvent-jre:11.0.4.11
ENV SERVICE "passkey-request-inventory-service"
WORKDIR /usr/src

# Copy artifacts
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" ./

# Start command
CMD ["java", "-jar", "passkey-request-inventory-service-1.0.0-SNAPSHOT.jar", "server", "configs/dev.yaml"]
```

### Container Features
- **Multi-stage build**: Separate build and runtime environments
- **Cvent base images**: Standardized JRE with security patches
- **Configuration copying**: Environment-specific configs included
- **Optimized layers**: Efficient Docker layer caching

## Monitoring & Logging

### Structured Logging

```java
// Log Context Configuration
LogContextFeature feature = new LogContextFeature();
feature.registerGlobal(LogContextConfig.builder()
    .putPath("reservationId", PasskeyTags.RESERVATION_ID)
    .putPath("sessionKey", Tag.passkey().custom("session_key"))
    .putHandler(InventoryAllocationRequest.class, (obj) -> {
        InventoryAllocationRequest req = (InventoryAllocationRequest) obj;
        LogContext.put(Tag.passkey().custom("session_key"), req.getSessionKey());
        LogContext.put(PasskeyTags.BLOCK_ID, req.getBlockId());
    })
    .build()
);
```

### Health Check Implementation

```java
public class PasskeyRequestInventoryHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Database connectivity check
        // External service availability check
        // Application-specific health validation
        return Result.healthy();
    }
}
```

### Metrics Collection

- **Application Metrics**: Request rates, response times, error rates
- **Business Metrics**: Allocation success rates, lock utilization
- **System Metrics**: JVM memory, garbage collection, thread pools
- **Database Metrics**: Connection pool usage, query performance

## Performance Considerations

### Connection Pooling

```yaml
database:
  minSize: 8          # Minimum connections
  maxSize: 32         # Maximum connections
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
```

### Transaction Management
- **Proxy Pattern**: Automatic transaction wrapping
- **Connection Reuse**: Efficient database connection utilization
- **Rollback Support**: Automatic rollback on exceptions

### Caching Strategy
- **Application-level caching**: Frequently accessed configuration
- **Database query optimization**: Indexed queries and prepared statements
- **Connection pooling**: Reuse of database connections

## Security Configuration

### API Security
```java
@Authority(methods = {AuthMethod.API_KEY})
public InventoryAllocationResponse create(
    @PathParam("reservationId") long reservationId,
    @NotNull InventoryAllocationRequest request,
    GrantedAPIKey apiKey
) {
    // Method implementation
}
```

### Application Policy
```java
@Override
public CventApplicationPolicy getApplicationPolicy() {
    return new CventApplicationPolicy(CventApplicationPolicyType.Api);
}
```

### Security Features
- **API Key Authentication**: All endpoints require valid API keys
- **Request Filtering**: Authentication and authorization filters
- **Secure Configuration**: Encrypted sensitive configuration values
- **Audit Logging**: All operations logged for security compliance