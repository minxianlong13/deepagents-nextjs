# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x (JAX-RS, Jersey, Jetty)
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database (via JDBC)
- **Authentication**: Cvent Auth Service integration
- **API Documentation**: OpenAPI 3.0 (Swagger)
- **Testing**: JUnit 5, Mockito, Karate (integration tests)
- **Containerization**: Docker
- **Monitoring**: Dropwizard Metrics, Health Checks

## Key Dependencies

### Core Framework Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>55.10.0</version>
</dependency>

<!-- Auth Service Integration -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>16.0.2</version>
</dependency>

<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>16.0.2</version>
</dependency>

<!-- Passkey Common Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.2</version>
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
```

### API Documentation Dependencies
```xml
<!-- OpenAPI/Swagger -->
<dependency>
    <groupId>io.swagger.core.v3</groupId>
    <artifactId>swagger-jaxrs2-jakarta</artifactId>
    <version>2.2.27</version>
</dependency>

<dependency>
    <groupId>org.yaml</groupId>
    <artifactId>snakeyaml</artifactId>
    <version>2.3</version>
</dependency>
```

### Testing Dependencies
```xml
<!-- Unit Testing -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-unit-tests</artifactId>
    <version>55.10.0</version>
</dependency>

<!-- Integration Testing -->
<dependency>
    <groupId>com.intuit.karate</groupId>
    <artifactId>karate-junit5</artifactId>
    <version>1.4.1</version>
</dependency>
```

## Configuration

### Environment Variables

The service uses environment-specific configuration files located in `passkey-permission-service/configs/`:

- `dev.yaml` - Development environment
- `alpha.yaml` - Alpha environment  
- `ts50.yaml` - Test environment
- `pr50.yaml` - Production environment

### Key Configuration Properties

```yaml
# Server Configuration
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

# Database Configuration
database:
  driverClass: oracle.jdbc.OracleDriver
  url: ${DB_URL}
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32

# Auth Service Configuration
authService:
  baseUrl: ${AUTH_SERVICE_URL}
  apiKey: ${AUTH_SERVICE_API_KEY}
  timeout: 30s

# Caching Configuration
cache:
  permissionCacheTtl: 300s
  contextCacheTtl: 600s
  maxCacheSize: 10000

# Logging Configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkey.permission: DEBUG
  appenders:
    - type: console
      threshold: INFO
      target: stdout
```

### Hogan Template Configuration

The service uses Hogan templates for configuration management:
- **Template Directory**: `passkey-permission-service/configs`
- **Annotation**: `hogan-templates/directory: passkey-permission-service/configs`

## Database Schema

### Core Tables

#### PERMISSIONS
```sql
CREATE TABLE PERMISSIONS (
    ID VARCHAR2(50) PRIMARY KEY,
    NAME VARCHAR2(100) NOT NULL,
    DESCRIPTION VARCHAR2(500),
    MODULE VARCHAR2(50) NOT NULL,
    CONTEXT_TYPE VARCHAR2(20) NOT NULL,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### USER_PERMISSIONS
```sql
CREATE TABLE USER_PERMISSIONS (
    USER_ID NUMBER(19) NOT NULL,
    PERMISSION_ID VARCHAR2(50) NOT NULL,
    CONTEXT_TYPE VARCHAR2(20) NOT NULL,
    CONTEXT_ID NUMBER(19),
    GRANTED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (USER_ID, PERMISSION_ID, CONTEXT_TYPE, CONTEXT_ID),
    FOREIGN KEY (PERMISSION_ID) REFERENCES PERMISSIONS(ID)
);
```

#### PERMISSION_CONTEXTS
```sql
CREATE TABLE PERMISSION_CONTEXTS (
    ID NUMBER(19) PRIMARY KEY,
    CONTEXT_TYPE VARCHAR2(20) NOT NULL,
    ENTITY_ID NUMBER(19) NOT NULL,
    METADATA CLOB,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX IDX_USER_PERMISSIONS_USER_ID ON USER_PERMISSIONS(USER_ID);
CREATE INDEX IDX_USER_PERMISSIONS_CONTEXT ON USER_PERMISSIONS(CONTEXT_TYPE, CONTEXT_ID);
CREATE INDEX IDX_PERMISSIONS_MODULE ON PERMISSIONS(MODULE);
CREATE INDEX IDX_PERMISSION_CONTEXTS_TYPE_ENTITY ON PERMISSION_CONTEXTS(CONTEXT_TYPE, ENTITY_ID);
```

## Monitoring & Logging

### Health Checks

The service implements several health checks:

```java
// Database connectivity check
public class DatabaseHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Verify database connection
        return Result.healthy("Database connection OK");
    }
}

// Auth service connectivity check  
public class AuthServiceHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Verify auth service connectivity
        return Result.healthy("Auth service connection OK");
    }
}
```

### Metrics

Key metrics exposed by the service:

- **Request Metrics**: Request count, response times, error rates per endpoint
- **Database Metrics**: Connection pool usage, query execution times
- **Cache Metrics**: Hit/miss ratios, cache size, eviction rates
- **Auth Metrics**: Token validation times, auth service response times

### Logging Configuration

```yaml
logging:
  level: INFO
  loggers:
    # Service-specific logging
    com.cvent.passkey.permission: DEBUG
    com.cvent.passkey.permission.services: INFO
    com.cvent.passkey.permission.resources: INFO
    
    # Framework logging
    io.dropwizard: INFO
    org.eclipse.jetty: WARN
    
    # Database logging
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
    
  appenders:
    - type: console
      threshold: INFO
      target: stdout
      layout:
        type: json
        timestampFormat: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
    - type: file
      threshold: DEBUG
      currentLogFilename: ./logs/passkey-permission.log
      archivedLogFilenamePattern: ./logs/passkey-permission-%d{yyyy-MM-dd}.log.gz
      archivedFileCount: 30
```

## Performance Considerations

### Caching Strategy

1. **Permission Caching**: User permissions cached for 5 minutes
2. **Context Caching**: Permission contexts cached for 10 minutes  
3. **Navigation Caching**: Generated navigation menus cached for 15 minutes
4. **Cache Invalidation**: Automatic invalidation on permission changes

### Database Optimization

1. **Connection Pooling**: Configured with 8-32 connections
2. **Query Optimization**: Indexed queries for common access patterns
3. **Prepared Statements**: All queries use prepared statements
4. **Batch Operations**: Bulk operations for permission updates

### API Performance

1. **Response Compression**: GZIP compression enabled
2. **Request Validation**: Early validation to fail fast
3. **Async Processing**: Non-blocking I/O where applicable
4. **Rate Limiting**: 1000 requests/minute per API key

## Security Implementation

### Authentication Integration

```java
@Authority(methods = {AuthMethod.API_KEY})
public Response getPermissions(GrantedAPIKey grantedAPIKey, @QueryParam("userId") long userId) {
    // API key authentication for service calls
}

@Authority(methods = {AuthMethod.BEARER})
public Response getGlobalNavigation(GrantedAccessToken bearerToken, @QueryParam("eventId") Long eventId) {
    // Bearer token authentication for user context
}
```

### Input Validation

- All input parameters validated using JAX-RS validation annotations
- Custom validators for business-specific constraints
- SQL injection prevention through prepared statements
- XSS protection through proper encoding

### Error Handling

```java
// Secure error handling that doesn't leak sensitive information
@ExceptionMapper(Exception.class)
public class SecurityAwareExceptionMapper implements ExceptionMapper<Exception> {
    @Override
    public Response toResponse(Exception exception) {
        // Log full exception details
        LOGGER.error("Service error", exception);
        
        // Return sanitized error response
        return Response.status(500)
            .entity(new ErrorResponse("Internal server error"))
            .build();
    }
}
```

## Build and Deployment

### Maven Profiles

```xml
<!-- Default profile for development -->
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

<!-- Integration test profile -->
<profile>
    <id>run-it</id>
    <properties>
        <skipITs>false</skipITs>
        <skipTests>true</skipTests>
    </properties>
</profile>

<!-- Load test profile -->
<profile>
    <id>run-load</id>
    <properties>
        <skipLoadTests>false</skipLoadTests>
        <skipTests>true</skipTests>
    </properties>
</profile>
```

### Docker Configuration

```dockerfile
FROM openjdk:17-jre-slim

# Create application user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy application JAR
COPY target/passkey-permission-service-*.jar app.jar

# Copy configuration
COPY configs/ /app/configs/

# Set ownership
RUN chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/healthcheck || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar", "server", "/app/configs/production.yaml"]
```

### Environment-Specific Builds

The service supports different build configurations:
- **Development**: Local development with embedded database
- **Integration**: Full integration testing environment
- **Load Testing**: Performance testing configuration
- **Production**: Optimized production build with monitoring