# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Parent POM**: Cvent Maven Parent 57.4.8

### Web Layer
- **REST Framework**: JAX-RS (Jersey implementation)
- **JSON Processing**: Jackson
- **Validation**: Jakarta Bean Validation
- **Authentication**: Cvent Auth Service integration

### Database
- **Database**: Oracle Database
- **JDBC Driver**: Oracle JDBC 23.8.0.25.04
- **Connection Pooling**: HikariCP (via Dropwizard)
- **Transaction Management**: Dropwizard managed transactions

### Testing
- **Unit Testing**: JUnit 5
- **Integration Testing**: Karate Framework
- **Test Coverage**: JaCoCo
- **Mocking**: Mockito

### Monitoring & Observability
- **Metrics**: Dropwizard Metrics
- **APM**: Datadog APM integration
- **Logging**: SLF4J with Logback
- **Health Checks**: Dropwizard Health Checks

## Dependencies

### Core Dependencies (from pom.xml)

```xml
<dependencies>
    <!-- Cvent Auth Service -->
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
    
    <!-- Oracle Database -->
    <dependency>
        <groupId>com.oracle.database.jdbc</groupId>
        <artifactId>ojdbc8</artifactId>
        <version>23.8.0.25.04</version>
    </dependency>
    
    <!-- Passkey Common Libraries -->
    <dependency>
        <groupId>com.cvent.passkey</groupId>
        <artifactId>passkey-microservices-common</artifactId>
        <version>1.4.12</version>
    </dependency>
    
    <!-- Passkey Notifications -->
    <dependency>
        <groupId>com.cvent.passkeynotifications</groupId>
        <artifactId>passkey-notifications-model</artifactId>
        <version>0.10.12</version>
    </dependency>
</dependencies>
```

### Build Profiles

#### Default Profile
- Builds all modules except integration tests
- Runs unit tests
- Generates code coverage reports

#### Release Profile (`-Prelease`)
- Optimized build for production deployment
- Includes all quality checks
- Generates deployment artifacts

#### Coverage Profile (`-Pcoverage`)
- Enables JaCoCo code coverage
- Generates detailed coverage reports
- Enforces coverage thresholds

#### Integration Test Profile (`-Prun-it`)
- Runs Karate integration tests
- Skips unit tests for faster execution
- Supports environment-specific test execution

## Configuration

### Application Configuration Structure

```yaml
# Example dev.yaml configuration
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: oracle.jdbc.OracleDriver
  url: jdbc:oracle:thin:@//localhost:1521/XE
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32
  checkConnectionWhileIdle: false

logging:
  level: INFO
  loggers:
    com.cvent.passkeytransferlog: DEBUG
  appenders:
    - type: console
      threshold: INFO
      target: stdout
    - type: file
      threshold: DEBUG
      currentLogFilename: ./logs/passkey-transfer-log.log
      archivedLogFilenamePattern: ./logs/passkey-transfer-log-%d.log.gz
      archivedFileCount: 5

authService:
  baseUrl: ${AUTH_SERVICE_URL}
  connectTimeout: 5s
  readTimeout: 30s

metrics:
  reporters:
    - type: datadog
      host: ${DATADOG_HOST}
      tags:
        - service:passkey-transfer-log-service
        - environment:${ENVIRONMENT}
```

### Environment Variables

#### Required Environment Variables
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `AUTH_SERVICE_URL`: Auth service endpoint URL
- `DATADOG_HOST`: Datadog metrics host
- `ENVIRONMENT`: Deployment environment (dev, staging, prod)

#### Optional Environment Variables
- `LOG_LEVEL`: Override default logging level
- `MAX_DB_CONNECTIONS`: Override database connection pool size
- `API_TIMEOUT`: Override API timeout settings

## Database Schema

### Core Tables

#### TRANSFER_STATES
```sql
CREATE TABLE TRANSFER_STATES (
    RESERVATION_ID NUMBER(19) NOT NULL,
    RES_ACK_NUMBER VARCHAR2(50),
    TRANSFER_STATE VARCHAR2(20) NOT NULL,
    TRANSFER_RESULT VARCHAR2(20),
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LAST_MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    EXTENDED_INFO CLOB,
    PRIMARY KEY (RESERVATION_ID)
);
```

#### FOLIO_TRANSFER_STATES
```sql
CREATE TABLE FOLIO_TRANSFER_STATES (
    RESERVATION_ID NUMBER(19) NOT NULL,
    SUFFIX VARCHAR2(10) NOT NULL,
    FOLIO_ACK_NUMBER VARCHAR2(50),
    TRANSFER_STATE VARCHAR2(20) NOT NULL,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LAST_MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (RESERVATION_ID, SUFFIX)
);
```

#### TRANSFER_HISTORY
```sql
CREATE TABLE TRANSFER_HISTORY (
    HISTORY_ID NUMBER(19) NOT NULL,
    RESERVATION_ID NUMBER(19) NOT NULL,
    ACTION VARCHAR2(50) NOT NULL,
    TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    USER_ID VARCHAR2(100),
    DETAILS CLOB,
    PREVIOUS_STATE VARCHAR2(20),
    NEW_STATE VARCHAR2(20),
    PRIMARY KEY (HISTORY_ID)
);
```

#### COMBINE_QUEUE
```sql
CREATE TABLE COMBINE_QUEUE (
    RES_ACK_NUMBER VARCHAR2(50) NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    PRIORITY NUMBER(3) DEFAULT 1,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PROCESSED_DATE TIMESTAMP,
    RETRY_COUNT NUMBER(3) DEFAULT 0,
    ERROR_MESSAGE CLOB,
    PRIMARY KEY (RES_ACK_NUMBER)
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX IDX_TRANSFER_STATES_ACK_NUM ON TRANSFER_STATES(RES_ACK_NUMBER);
CREATE INDEX IDX_FOLIO_STATES_ACK_NUM ON FOLIO_TRANSFER_STATES(FOLIO_ACK_NUMBER);
CREATE INDEX IDX_TRANSFER_HISTORY_RES_ID ON TRANSFER_HISTORY(RESERVATION_ID);
CREATE INDEX IDX_COMBINE_QUEUE_STATUS ON COMBINE_QUEUE(STATUS, PRIORITY);
```

## Build Configuration

### Maven Configuration

```xml
<properties>
    <maven.compiler.useIncrementalCompilation>false</maven.compiler.useIncrementalCompilation>
    <revision>1.11.1-SNAPSHOT</revision>
    <java.version>21</java.version>
    <passkey-microservices-common.version>1.4.12</passkey-microservices-common.version>
    <passkey-notifications.version>0.10.12</passkey-notifications.version>
    <ojdbc8-version>23.8.0.25.04</ojdbc8-version>
    <auth-service.version>28.4.1</auth-service.version>
    <modules.to.deploy>passkey-transfer-log-service</modules.to.deploy>
    <modules.to.integration-test>passkey-transfer-log-integration-test</modules.to.integration-test>
</properties>
```

### Code Quality Configuration

#### SonarQube Coverage Exclusions
```xml
<sonar.coverage.exclusions>
    passkey-transfer-log-api/**,
    passkey-transfer-log-java-client/**,
    passkey-transfer-log-integration-test/**
</sonar.coverage.exclusions>
```

#### Checkstyle Configuration
- Enforces Cvent coding standards
- Validates code formatting and style
- Integrated into Maven build process

## Monitoring & Logging

### Metrics Collection

#### Dropwizard Metrics
- **Timers**: Request processing times
- **Counters**: Request counts, error counts
- **Gauges**: Database connection pool status
- **Histograms**: Response size distributions

#### Custom Metrics
```java
@Timed(name = "transfer-state-creation")
@Metered(name = "transfer-state-requests")
public TransferState createTransferState(TransferStateRequest request) {
    // Implementation
}
```

### Datadog Integration

#### APM Configuration
```yaml
metrics:
  reporters:
    - type: datadog
      host: ${DATADOG_HOST}
      tags:
        - service:passkey-transfer-log-service
        - environment:${ENVIRONMENT}
        - version:${BUILD_VERSION}
```

#### Custom Dashboards
- Service performance metrics
- Database performance monitoring
- Error rate tracking
- Business metrics (transfer success rates)

### Logging Configuration

#### Structured Logging
```java
@EnableLogContext
public class PasskeyTransferLogResource {
    private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    
    public TransferState getTransferState(TransferStatesSearchCriteria criteria) {
        LOG.debug("Transfer States Search Criteria: {}", criteria.toQueryMap());
        // Implementation
    }
}
```

#### Log Levels
- **ERROR**: System errors, exceptions
- **WARN**: Business rule violations, recoverable errors
- **INFO**: Important business events, service lifecycle
- **DEBUG**: Detailed execution flow, request/response data

## Performance Considerations

### Database Optimization
- Connection pooling with HikariCP
- Prepared statement caching
- Query optimization with proper indexing
- Batch processing for bulk operations

### Caching Strategy
- Application-level caching for frequently accessed data
- Database query result caching
- Configuration caching to reduce database calls

### Concurrency Management
- Thread-safe service implementations
- Database transaction isolation
- Optimistic locking for concurrent updates

## Security Implementation

### Authentication
```java
@Authority(methods = { AuthMethod.API_KEY })
public TransferState getTransferState(
    GrantedAPIKey grantedAPIKey,
    TransferStatesSearchCriteria criteria
) {
    // Authenticated endpoint implementation
}
```

### Data Protection
- Sensitive data encryption at rest
- TLS encryption for data in transit
- API key rotation and management
- Audit logging for security events

### Input Validation
```java
@Valid @NotNull @Body TransferStateRequest transferStateRequest
```

## Deployment Artifacts

### Docker Configuration
```dockerfile
FROM openjdk:21-jre-slim

COPY target/passkey-transfer-log-service-*.jar app.jar
COPY configs/ /app/configs/

EXPOSE 8080 8081

ENTRYPOINT ["java", "-jar", "/app.jar", "server", "/app/configs/prod.yaml"]
```

### Health Checks
- Database connectivity check
- External service dependency checks
- Application-specific health indicators

### Deployment Scripts
- `build-it.sh`: Local build script
- `build-load.sh`: Load testing build script
- Jenkins pipeline for CI/CD automation