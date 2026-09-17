# Technical Details

## Technology Stack

- **Framework**: Dropwizard 2.x
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database (via JDBC)
- **Authentication**: Cvent Auth Service integration
- **API Documentation**: OpenAPI 3.0 (Swagger)
- **Testing**: JUnit 5, Karate (integration tests)
- **Containerization**: Docker
- **Monitoring**: Datadog integration

## Dependencies

### Core Dependencies

```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>2.x</version>
</dependency>

<!-- Cvent Common Libraries -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>51.0.0</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.7</version>
</dependency>

<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-core</artifactId>
    <version>27.1.0</version>
</dependency>

<!-- Database -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>23.6.0.24.10</version>
</dependency>

<!-- OpenAPI Documentation -->
<dependency>
    <groupId>io.swagger.core.v3</groupId>
    <artifactId>swagger-jaxrs2-jakarta</artifactId>
    <version>2.2.28</version>
</dependency>
```

### Testing Dependencies

```xml
<!-- Unit Testing -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-unit-tests</artifactId>
    <version>51.0.0</version>
    <scope>test</scope>
</dependency>

<!-- Integration Testing -->
<dependency>
    <groupId>com.intuit.karate</groupId>
    <artifactId>karate-junit5</artifactId>
    <scope>test</scope>
</dependency>

<!-- Mock Testing -->
<dependency>
    <groupId>com.squareup.retrofit2</groupId>
    <artifactId>retrofit-mock</artifactId>
    <version>2.11.0</version>
    <scope>test</scope>
</dependency>
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Oracle database connection URL | - | Yes |
| `DATABASE_USER` | Database username | - | Yes |
| `DATABASE_PASSWORD` | Database password | - | Yes |
| `AUTH_SERVICE_URL` | Auth service endpoint URL | - | Yes |
| `LOG_LEVEL` | Application log level | `INFO` | No |
| `SERVER_PORT` | HTTP server port | `8080` | No |
| `ADMIN_PORT` | Admin interface port | `8081` | No |

### Configuration Files

#### Development Configuration (`configs/dev.yaml`)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: oracle.jdbc.OracleDriver
  url: ${DATABASE_URL}
  user: ${DATABASE_USER}
  password: ${DATABASE_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: "SELECT 1 FROM DUAL"
  minSize: 8
  maxSize: 32

logging:
  level: INFO
  loggers:
    com.cvent.passkey.acknowledgment: DEBUG
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC
```

#### Production Configuration (`configs/prod.yaml`)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: oracle.jdbc.OracleDriver
  url: ${DATABASE_URL}
  user: ${DATABASE_USER}
  password: ${DATABASE_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: "SELECT 1 FROM DUAL"
  minSize: 16
  maxSize: 64

logging:
  level: WARN
  loggers:
    com.cvent.passkey.acknowledgment: INFO
  appenders:
    - type: file
      currentLogFilename: /var/log/passkey-acknowledgment.log
      archivedLogFilenamePattern: /var/log/passkey-acknowledgment-%d.log.gz
      archivedFileCount: 30
```

## Database Schema

### Tables

#### RESERVATION_ACKNOWLEDGEMENT_LOG
```sql
CREATE TABLE RESERVATION_ACKNOWLEDGEMENT_LOG (
    ID NUMBER(19) PRIMARY KEY,
    RESERVATION_ID NUMBER(19) NOT NULL,
    MASTER_ACK_NUMBER VARCHAR2(100),
    ACKNOWLEDGEMENT_TYPE VARCHAR2(50) NOT NULL,
    SEND_TO_PRIMARY NUMBER(1) DEFAULT 1,
    SECONDARY_CONTACTS CLOB,
    STATUS VARCHAR2(50) NOT NULL,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREATED_BY VARCHAR2(100),
    MODIFIED_DATE TIMESTAMP,
    MODIFIED_BY VARCHAR2(100)
);

CREATE INDEX IDX_RESACK_RESERVATION_ID ON RESERVATION_ACKNOWLEDGEMENT_LOG(RESERVATION_ID);
CREATE INDEX IDX_RESACK_MASTER_ACK ON RESERVATION_ACKNOWLEDGEMENT_LOG(MASTER_ACK_NUMBER);
CREATE INDEX IDX_RESACK_STATUS ON RESERVATION_ACKNOWLEDGEMENT_LOG(STATUS);
```

#### ACKNOWLEDGEMENT_TASK
```sql
CREATE TABLE ACKNOWLEDGEMENT_TASK (
    ID NUMBER(19) PRIMARY KEY,
    ACKNOWLEDGEMENT_LOG_ID NUMBER(19) NOT NULL,
    TASK_TYPE VARCHAR2(50) NOT NULL,
    STATUS VARCHAR2(50) NOT NULL,
    RETRY_COUNT NUMBER(3) DEFAULT 0,
    MAX_RETRIES NUMBER(3) DEFAULT 3,
    NEXT_RETRY_TIME TIMESTAMP,
    ERROR_MESSAGE CLOB,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    COMPLETED_DATE TIMESTAMP,
    CONSTRAINT FK_ACKTASK_LOG FOREIGN KEY (ACKNOWLEDGEMENT_LOG_ID) 
        REFERENCES RESERVATION_ACKNOWLEDGEMENT_LOG(ID)
);

CREATE INDEX IDX_ACKTASK_STATUS ON ACKNOWLEDGEMENT_TASK(STATUS);
CREATE INDEX IDX_ACKTASK_RETRY ON ACKNOWLEDGEMENT_TASK(NEXT_RETRY_TIME);
```

### Database Connection Pool

- **Driver**: Oracle JDBC Driver (ojdbc8)
- **Connection Pool**: HikariCP (via Dropwizard)
- **Min Pool Size**: 8 (dev), 16 (prod)
- **Max Pool Size**: 32 (dev), 64 (prod)
- **Connection Timeout**: 1 second
- **Validation Query**: `SELECT 1 FROM DUAL`

## Build Configuration

### Maven Profiles

#### Default Profile
```xml
<profile>
    <id>default</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <modules>
        <module>passkey-acknowledgment-api</module>
        <module>passkey-acknowledgment-java-client</module>
        <module>passkey-acknowledgment-data-access</module>
        <module>passkey-acknowledgment-service</module>
        <module>passkey-acknowledgment-integration-test</module>
    </modules>
</profile>
```

#### Release Profile
```xml
<profile>
    <id>release</id>
    <properties>
        <maven.source.skip>true</maven.source.skip>
        <maven.javadoc.skip>true</maven.javadoc.skip>
    </properties>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <skipIntegrationTests>false</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-acknowledgment-api</module>
        <module>passkey-acknowledgment-java-client</module>
        <module>passkey-acknowledgment-integration-test</module>
    </modules>
</profile>
```

### Build Commands

```bash
# Standard build
mvn clean package

# Release build (skip sources and javadoc)
mvn clean package -Prelease

# Build with integration tests
mvn clean verify -Prun-it -Denv.IT_ENVIRONMENT=dev

# Code coverage report
mvn clean package -Pcoverage
mvn clover:clover

# Docker build
docker build -t passkey-acknowledgment:latest .
```

## Monitoring & Logging

### Application Metrics

- **JVM Metrics**: Memory usage, garbage collection, thread pools
- **HTTP Metrics**: Request rates, response times, error rates
- **Database Metrics**: Connection pool usage, query performance
- **Business Metrics**: Acknowledgment success/failure rates

### Health Checks

```java
// Database health check
@Override
public Result check() throws Exception {
    try {
        jdbi.withHandle(handle -> 
            handle.createQuery("SELECT 1 FROM DUAL").mapTo(Integer.class).one()
        );
        return Result.healthy();
    } catch (Exception e) {
        return Result.unhealthy("Database connection failed: " + e.getMessage());
    }
}
```

### Logging Configuration

- **Framework**: Logback (via Dropwizard)
- **Format**: JSON structured logging for production
- **Levels**: DEBUG (dev), INFO (staging), WARN (prod)
- **Appenders**: Console (dev), File with rotation (prod)

### Datadog Integration

```yaml
# Datadog agent configuration
datadog:
  enabled: true
  service: passkey-acknowledgment-service
  env: ${ENVIRONMENT}
  tags:
    - team:cherry-pickers
    - platform:passkey
    - component:acknowledgment
```

## Security Configuration

### SSL/TLS
- **Protocol**: TLS 1.2+
- **Certificates**: Managed by infrastructure team
- **HTTPS Redirect**: Enabled in production

### Input Validation
- **Request Validation**: JAX-RS Bean Validation
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Prevention**: Input sanitization and output encoding

### Secrets Management
- **Database Credentials**: Environment variables
- **API Keys**: Secure configuration management
- **Certificates**: Mounted as volumes in containers

## Performance Tuning

### JVM Settings
```bash
# Production JVM settings
-Xms2g -Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/heapdumps/
```

### Database Optimization
- **Connection Pooling**: Optimized pool sizes per environment
- **Query Optimization**: Indexed columns for frequent queries
- **Batch Processing**: Bulk operations for group acknowledgments

### Caching Strategy
- **Application Cache**: In-memory caching for configuration data
- **Database Cache**: Oracle result cache for frequently accessed data
- **HTTP Cache**: Cache headers for static resources