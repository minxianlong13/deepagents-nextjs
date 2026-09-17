# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Database**: Oracle 18.3.0.0
- **Container**: Docker with OpenJDK 8 Alpine base image
- **Testing**: JUnit, Karate for integration tests
- **Logging**: Logback with structured logging
- **Metrics**: Dropwizard Metrics with Datadog integration

## Dependencies

### Core Framework Dependencies

```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
</dependency>

<!-- JAX-RS for REST APIs -->
<dependency>
    <groupId>jakarta.ws.rs</groupId>
    <artifactId>jakarta.ws.rs-api</artifactId>
</dependency>

<!-- Jackson for JSON processing -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### Cvent Internal Dependencies

```xml
<!-- Cvent Auth Service Integration -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>28.4.1</version>
</dependency>

<!-- Passkey Common Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.12</version>
</dependency>

<!-- Cvent Login Service -->
<dependency>
    <groupId>com.cvent.login</groupId>
    <artifactId>login-java-client</artifactId>
    <version>11.20.1</version>
</dependency>
```

### Database Dependencies

```xml
<!-- Oracle JDBC Driver -->
<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>18.3.0.0</version>
</dependency>

<!-- Connection Pooling -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-db</artifactId>
</dependency>
```

### Security Dependencies

```xml
<!-- JWT Processing -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt</artifactId>
</dependency>

<!-- Encryption/Decryption -->
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk15on</artifactId>
</dependency>
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | localhost | Yes |
| `DB_PORT` | Database port | 1521 | Yes |
| `DB_NAME` | Database name | passkey | Yes |
| `DB_USERNAME` | Database username | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_FALLBACK_SECRET` | Fallback JWT secret for key rotation | - | No |
| `AUTH_SERVICE_URL` | Auth service endpoint | - | Yes |
| `LOGIN_SERVICE_URL` | Login service endpoint | - | Yes |
| `LOG_LEVEL` | Logging level | INFO | No |

### Configuration Files

#### dev.yaml (Development)
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
  url: jdbc:oracle:thin:@${DB_HOST}:${DB_PORT}:${DB_NAME}
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32

logging:
  level: ${LOG_LEVEL:-INFO}
  loggers:
    com.cvent.passkey.authentication: DEBUG
  appenders:
    - type: console
      threshold: ALL
      target: stdout
```

#### prod.yaml (Production)
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
  url: jdbc:oracle:thin:@${DB_HOST}:${DB_PORT}:${DB_NAME}
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 16
  maxSize: 64

logging:
  level: WARN
  loggers:
    com.cvent.passkey.authentication: INFO
  appenders:
    - type: file
      currentLogFilename: /var/log/passkey-authentication.log
      archivedLogFilenamePattern: /var/log/passkey-authentication-%d.log.gz
      archivedFileCount: 30
```

## Database Schema

### Tables

#### USERS
```sql
CREATE TABLE USERS (
    USER_ID VARCHAR2(36) PRIMARY KEY,
    EMAIL VARCHAR2(255) NOT NULL UNIQUE,
    FIRST_NAME VARCHAR2(100),
    LAST_NAME VARCHAR2(100),
    ACCOUNT_ID VARCHAR2(36),
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### SESSIONS
```sql
CREATE TABLE SESSIONS (
    SESSION_ID VARCHAR2(36) PRIMARY KEY,
    USER_ID VARCHAR2(36) NOT NULL,
    TOKEN CLOB,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    EXPIRES_AT TIMESTAMP NOT NULL,
    LAST_ACCESSED_AT TIMESTAMP,
    IP_ADDRESS VARCHAR2(45),
    USER_AGENT VARCHAR2(500),
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
);
```

#### API_KEYS
```sql
CREATE TABLE API_KEYS (
    KEY_ID VARCHAR2(36) PRIMARY KEY,
    SERVICE_NAME VARCHAR2(100) NOT NULL,
    KEY_HASH VARCHAR2(255) NOT NULL,
    ROLES CLOB,
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    EXPIRES_AT TIMESTAMP,
    LAST_USED_AT TIMESTAMP
);
```

#### AUTHENTICATION_EVENTS
```sql
CREATE TABLE AUTHENTICATION_EVENTS (
    EVENT_ID VARCHAR2(36) PRIMARY KEY,
    EVENT_TYPE VARCHAR2(50) NOT NULL,
    USER_ID VARCHAR2(36),
    SESSION_ID VARCHAR2(36),
    API_KEY_ID VARCHAR2(36),
    TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IP_ADDRESS VARCHAR2(45),
    USER_AGENT VARCHAR2(500),
    SUCCESS NUMBER(1) NOT NULL,
    ERROR_CODE VARCHAR2(50),
    METADATA CLOB
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX IDX_SESSIONS_USER_ID ON SESSIONS(USER_ID);
CREATE INDEX IDX_SESSIONS_EXPIRES_AT ON SESSIONS(EXPIRES_AT);
CREATE INDEX IDX_EVENTS_USER_ID ON AUTHENTICATION_EVENTS(USER_ID);
CREATE INDEX IDX_EVENTS_TIMESTAMP ON AUTHENTICATION_EVENTS(TIMESTAMP);
CREATE INDEX IDX_USERS_EMAIL ON USERS(EMAIL);
```

## Build Configuration

### Maven Profiles

#### Default Profile
- Compiles all modules
- Runs unit tests
- Packages JAR files

#### Release Profile (`-Prelease`)
- Optimized for production builds
- Skips source and javadoc generation
- Includes all dependencies in fat JAR

#### Coverage Profile (`-Pcoverage`)
- Enables JaCoCo code coverage
- Generates coverage reports
- Enforces minimum coverage thresholds

#### Integration Test Profile (`-Prun-it`)
- Runs Karate integration tests
- Requires test environment configuration
- Skips checkstyle validation

### Build Commands

```bash
# Standard build
mvn clean package

# Production build
mvn clean package -Prelease

# Build with coverage
mvn clean package -Pcoverage

# Run integration tests
mvn clean verify -Prun-it -Denv.IT_ENVIRONMENT=dev
```

## Monitoring & Logging

### Metrics

The service exposes metrics through Dropwizard Metrics:

- **JVM Metrics**: Memory usage, garbage collection, thread pools
- **HTTP Metrics**: Request rates, response times, error rates
- **Database Metrics**: Connection pool usage, query performance
- **Custom Metrics**: Authentication success/failure rates, token creation rates

### Health Checks

- **Database Health Check**: Validates database connectivity
- **Auth Service Health Check**: Verifies auth service availability
- **JWT Key Health Check**: Ensures JWT signing keys are available

### Logging Configuration

```xml
<!-- logback.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <timestamp/>
                <logLevel/>
                <loggerName/>
                <message/>
                <mdc/>
                <arguments/>
                <stackTrace/>
            </providers>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkey.authentication" level="INFO"/>
    <logger name="org.eclipse.jetty" level="WARN"/>
    <logger name="oracle.jdbc" level="WARN"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### Log Correlation

- **Request ID**: Unique identifier for each request
- **User ID**: Associated user for authenticated requests
- **Session ID**: Active session identifier
- **Trace ID**: Distributed tracing identifier

## Security Configuration

### JWT Configuration

```java
@JsonProperty
private JwtConfiguration jwt = new JwtConfiguration();

public static class JwtConfiguration {
    @JsonProperty
    private String secret;
    
    @JsonProperty
    private String fallbackSecret;
    
    @JsonProperty
    private Duration tokenExpiration = Duration.ofHours(24);
    
    @JsonProperty
    private String issuer = "passkey-authentication-service";
}
```

### Database Security

- **Connection Encryption**: SSL/TLS encryption for database connections
- **Credential Management**: Database credentials stored in secure configuration
- **Connection Pooling**: Secure connection pool configuration
- **Query Parameterization**: All queries use parameterized statements

### API Security

- **Rate Limiting**: Configurable rate limits per API key
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Configuration**: Proper CORS headers for web clients
- **Security Headers**: Standard security headers in all responses

## Performance Optimization

### Connection Pooling

```yaml
database:
  minSize: 8          # Minimum connections
  maxSize: 32         # Maximum connections
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  validationQueryTimeout: 3s
```

### Caching Strategy

- **JWT Validation Cache**: Cache validated JWT tokens to reduce Auth Service calls
- **User Permission Cache**: Cache user permissions for faster authorization
- **Configuration Cache**: Cache configuration values to minimize database queries

### Async Processing

- **Event Publishing**: Asynchronous publishing of authentication events
- **Audit Logging**: Non-blocking audit log writing
- **Metrics Collection**: Asynchronous metrics aggregation