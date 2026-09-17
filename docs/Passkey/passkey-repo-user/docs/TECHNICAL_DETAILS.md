# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database 18c
- **Container**: Docker
- **Testing**: JUnit 5, Karate, Mockito
- **Documentation**: OpenAPI 3.0 (Swagger)

## Dependencies

### Core Framework Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>4.0.x</version>
</dependency>

<!-- Database Connectivity -->
<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>18.3.0.0</version>
</dependency>

<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>21.0.0</version>
</dependency>
```

### Cvent Internal Dependencies
- **passkey-microservices-common**: `1.0.19` - Shared utilities and configurations
- **auth-service-api**: `21.0.0` - Authentication and authorization
- **extensions-shared**: `7.0.1` - Common extensions and utilities

### Key Third-Party Libraries
- **Immutables**: `2.9.x` - Immutable value objects generation
- **Jackson**: `2.15.x` - JSON serialization/deserialization
- **Swagger**: `2.2.9` - API documentation generation
- **Armeria**: `1.33.4` - HTTP client for service communication
- **Netty**: `4.2.8.Final` - Asynchronous networking
- **Jetty**: `11.0.26` - Embedded web server

## Configuration

### Environment Variables
```yaml
# Database Configuration
DB_HOST: Oracle database hostname
DB_PORT: Database port (default: 1521)
DB_SERVICE_NAME: Oracle service name
DB_USERNAME: Database username
DB_PASSWORD: Database password (encrypted)

# Service Configuration
SERVICE_PORT: HTTP service port (default: 8080)
ADMIN_PORT: Admin interface port (default: 8081)
LOG_LEVEL: Logging level (INFO, DEBUG, WARN, ERROR)

# Authentication
AUTH_SERVICE_URL: Auth service endpoint
API_KEY_VALIDATION_URL: API key validation endpoint

# Monitoring
DATADOG_API_KEY: Datadog monitoring API key
METRICS_ENABLED: Enable metrics collection (true/false)
```

### Configuration Files Structure
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
  url: jdbc:oracle:thin:@${DB_HOST}:${DB_PORT}:${DB_SERVICE_NAME}
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32

logging:
  level: INFO
  loggers:
    com.cvent.passkeyuser: DEBUG
  appenders:
    - type: console
    - type: file
      currentLogFilename: ./logs/passkey-user-service.log
      archivedLogFilenamePattern: ./logs/passkey-user-service-%d.log.gz
      archivedFileCount: 7

auth:
  serviceUrl: ${AUTH_SERVICE_URL}
  validationUrl: ${API_KEY_VALIDATION_URL}
  cacheEnabled: true
  cacheTtl: 300s
```

## Database Schema

### Primary Tables
```sql
-- User Details Table
CREATE TABLE PASSKEY_USER_DETAILS (
    USER_ID NUMBER(19) PRIMARY KEY,
    USER_NAME VARCHAR2(255) NOT NULL,
    USER_TYPE_ID NUMBER(10) NOT NULL,
    PARTICIPANT_ID NUMBER(19),
    EMAIL_ADDRESS VARCHAR2(255) NOT NULL,
    USER_STATUS_ID NUMBER(10) NOT NULL,
    LAST_LOGIN DATE,
    LAST_PASSWORD_CHANGE DATE,
    PK_USER_ID NUMBER(19),
    PK_ACTION_ID NUMBER(10),
    PK_TIME_STAMP DATE,
    LAST_ACCEPTED_TERMS DATE,
    LAST_NAME_FORMAT_ENABLED NUMBER(1) DEFAULT 0,
    REPORTING_LEVEL_ID NUMBER(10),
    DATE_FORMAT_ID NUMBER(10),
    TIME_FORMAT_ID NUMBER(10),
    TYPE_EMAIL_NOTIFICATION_ID NUMBER(10),
    CREATED_DATE DATE DEFAULT SYSDATE,
    MODIFIED_DATE DATE DEFAULT SYSDATE
);

-- User Favorites Table
CREATE TABLE PASSKEY_USER_FAVORITES (
    FAVORITE_ID NUMBER(19) PRIMARY KEY,
    USER_ID NUMBER(19) NOT NULL,
    PROPERTY_ID NUMBER(19) NOT NULL,
    PROPERTY_NAME VARCHAR2(500),
    DATE_ADDED DATE DEFAULT SYSDATE,
    NOTES VARCHAR2(500),
    SORT_ORDER NUMBER(10),
    CREATED_DATE DATE DEFAULT SYSDATE,
    CONSTRAINT FK_FAVORITES_USER FOREIGN KEY (USER_ID) 
        REFERENCES PASSKEY_USER_DETAILS(USER_ID)
);

-- User Preferences Table
CREATE TABLE PASSKEY_USER_PREFERENCES (
    USER_ID NUMBER(19) PRIMARY KEY,
    DATE_FORMAT_ID NUMBER(10),
    TIME_FORMAT_ID NUMBER(10),
    TYPE_EMAIL_NOTIFICATION_ID NUMBER(10),
    LAST_NAME_FORMAT_ENABLED NUMBER(1) DEFAULT 0,
    LANGUAGE VARCHAR2(10),
    TIMEZONE VARCHAR2(50),
    CURRENCY VARCHAR2(3),
    MEASUREMENT_UNIT VARCHAR2(20),
    CREATED_DATE DATE DEFAULT SYSDATE,
    MODIFIED_DATE DATE DEFAULT SYSDATE,
    CONSTRAINT FK_PREFERENCES_USER FOREIGN KEY (USER_ID) 
        REFERENCES PASSKEY_USER_DETAILS(USER_ID)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX IDX_USER_DETAILS_EMAIL ON PASSKEY_USER_DETAILS(EMAIL_ADDRESS);
CREATE INDEX IDX_USER_DETAILS_PARTICIPANT ON PASSKEY_USER_DETAILS(PARTICIPANT_ID);
CREATE INDEX IDX_FAVORITES_USER_PROPERTY ON PASSKEY_USER_FAVORITES(USER_ID, PROPERTY_ID);
CREATE INDEX IDX_FAVORITES_PROPERTY ON PASSKEY_USER_FAVORITES(PROPERTY_ID);
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
    <properties>
        <skipITs>true</skipITs>
        <skipLoadTests>true</skipLoadTests>
    </properties>
</profile>

<!-- Integration Testing Profile -->
<profile>
    <id>run-it</id>
    <properties>
        <checkstyle.skip>true</checkstyle.skip>
        <skipITs>false</skipITs>
        <skipTests>true</skipTests>
        <skipLoadTests>true</skipLoadTests>
    </properties>
</profile>

<!-- Load Testing Profile -->
<profile>
    <id>run-load</id>
    <properties>
        <checkstyle.skip>true</checkstyle.skip>
        <skipLoadTests>false</skipLoadTests>
        <skipTests>true</skipTests>
        <skipITs>true</skipITs>
    </properties>
</profile>
```

### Build Commands
```bash
# Clean build
mvn clean compile

# Run unit tests
mvn test

# Package application
mvn package -Prelease

# Run integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run load tests
mvn -Prun-load verify

# Generate documentation
mvn site
```

## Monitoring & Logging

### Metrics Collection
- **Dropwizard Metrics**: Built-in application metrics
- **JVM Metrics**: Memory, GC, thread pool monitoring
- **Database Metrics**: Connection pool, query performance
- **Custom Business Metrics**: User operations, API usage

### Logging Configuration
```yaml
logging:
  level: INFO
  loggers:
    com.cvent.passkeyuser: DEBUG
    com.cvent.auth: INFO
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
  appenders:
    - type: console
      layout:
        type: json
        timestampFormat: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
    - type: file
      currentLogFilename: ./logs/passkey-user-service.log
      layout:
        type: json
```

### Health Checks
```java
// Database Health Check
public class DatabaseHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Verify database connectivity
        // Check critical tables accessibility
        // Validate connection pool status
    }
}

// Auth Service Health Check
public class AuthServiceHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Verify auth service connectivity
        // Test API key validation
        // Check service response time
    }
}
```

## Performance Considerations

### Database Optimization
- Connection pooling with HikariCP
- Query optimization with proper indexing
- Prepared statement caching
- Read/write connection separation

### Caching Strategy
- API key validation caching (5-minute TTL)
- User preference caching
- Property information caching
- Database query result caching

### Scalability Features
- Stateless service design
- Horizontal scaling support
- Load balancer compatibility
- Database connection pooling

## Security Implementation

### Input Validation
```java
// Request validation annotations
@Valid @NotNull @PathParam("userId") Long userId
@Valid UpdateUserDetailsRequest request

// Custom validators
@ValidEmail
@ValidUserId
@ValidPropertyId
```

### Data Protection
- Sensitive data encryption at rest
- TLS 1.3 for data in transit
- API key-based authentication
- Request/response sanitization

### Audit Logging
- All user data modifications logged
- API access logging with correlation IDs
- Security event monitoring
- Compliance reporting capabilities

## Testing Strategy

### Unit Testing
- JUnit 5 for test framework
- Mockito for mocking dependencies
- TestContainers for database testing
- 80%+ code coverage requirement

### Integration Testing
- Karate framework for API testing
- End-to-end workflow validation
- Database integration testing
- External service mocking

### Load Testing
- JMeter-based performance tests
- Concurrent user simulation
- Database performance validation
- Memory and CPU profiling