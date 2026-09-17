# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database 18c+
- **Connection Pool**: Tomcat JDBC Pool
- **Web Server**: Embedded Jetty
- **API Framework**: JAX-RS (Jersey)
- **JSON Processing**: Jackson
- **Authentication**: Cvent Auth Service integration
- **Observability**: Dropwizard Metrics, SLF4J Logging
- **Testing**: JUnit 5, Karate (Integration Tests)
- **Container**: Docker

## Dependencies

### Core Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>55.10.0</version>
</dependency>

<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>16.0.2</version>
</dependency>

<!-- Database -->
<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>18.3.0.0</version>
</dependency>

<!-- AWS SDK -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>bom</artifactId>
    <version>2.31.25</version>
</dependency>

<!-- File Upload -->
<dependency>
    <groupId>org.glassfish.jersey.media</groupId>
    <artifactId>jersey-media-multipart</artifactId>
    <version>3.1.10</version>
</dependency>

<!-- Observability -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-observability</artifactId>
    <version>55.10.0</version>
</dependency>
```

### Key Version Information
- **Java Version**: 17
- **Maven Parent**: 55.10.0
- **Auth Service**: 16.0.2
- **Passkey Microservices Common**: 1.4.5
- **AWS SDK**: 2.31.25
- **Jersey Multipart**: 3.1.10
- **Netty**: 4.1.124.Final
- **Tomcat**: 10.1.45

## Configuration

### Environment Variables
```bash
# API Keys (not committed to source control)
LOCAL_API_KEY=xxx

# Database Configuration
DB_HOST=localhost
DB_PORT=1521
DB_NAME=passkey
DB_USERNAME=housing_user
DB_PASSWORD=secure_password

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Service Configuration
SERVICE_PORT=8080
ADMIN_PORT=8081
```

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
  url: jdbc:oracle:thin:@localhost:1521:XE
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32

auth:
  apiKey: ${LOCAL_API_KEY}
  serviceUrl: https://auth-service.dev.cvent.org

logging:
  level: INFO
  loggers:
    com.cvent.passkeyhousinglibrary: DEBUG
  appenders:
    - type: console
      threshold: ALL
      target: stdout
```

### Hogan Configuration Management
- Configuration templates stored in `passkey-housing-library-service/configs/`
- Environment-specific values injected via Hogan
- Secrets managed through Backstage API Keys

## Database Schema

### Core Tables

#### ROOMS
```sql
CREATE TABLE ROOMS (
    ID VARCHAR2(255) PRIMARY KEY,
    NAME VARCHAR2(500) NOT NULL,
    ROOM_TYPE VARCHAR2(100) NOT NULL,
    DESCRIPTION CLOB,
    MAX_OCCUPANCY NUMBER(3) NOT NULL,
    ORGANIZATION_ID VARCHAR2(255) NOT NULL,
    ACTIVE NUMBER(1) DEFAULT 1,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ROOM_BEDS
```sql
CREATE TABLE ROOM_BEDS (
    ID VARCHAR2(255) PRIMARY KEY,
    ROOM_ID VARCHAR2(255) NOT NULL,
    BED_TYPE VARCHAR2(100) NOT NULL,
    BED_COUNT NUMBER(2) NOT NULL,
    CONSTRAINT FK_ROOM_BEDS_ROOM FOREIGN KEY (ROOM_ID) REFERENCES ROOMS(ID)
);
```

#### EVENT_TEMPLATES
```sql
CREATE TABLE EVENT_TEMPLATES (
    ID VARCHAR2(255) PRIMARY KEY,
    NAME VARCHAR2(500) NOT NULL,
    EVENT_SUB_TYPE VARCHAR2(100) NOT NULL,
    DESCRIPTION CLOB,
    ORGANIZATION_ID VARCHAR2(255) NOT NULL,
    CONFIGURATION CLOB,
    ACTIVE NUMBER(1) DEFAULT 1,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### IMAGES
```sql
CREATE TABLE IMAGES (
    ID VARCHAR2(255) PRIMARY KEY,
    URL VARCHAR2(1000) NOT NULL,
    TITLE VARCHAR2(500),
    DESCRIPTION CLOB,
    TAGS VARCHAR2(2000),
    CONTENT_TYPE VARCHAR2(100),
    FILE_SIZE NUMBER(12),
    ORGANIZATION_ID VARCHAR2(255) NOT NULL,
    UPLOADED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX IDX_ROOMS_ORG_ID ON ROOMS(ORGANIZATION_ID);
CREATE INDEX IDX_ROOMS_TYPE ON ROOMS(ROOM_TYPE);
CREATE INDEX IDX_ROOMS_ACTIVE ON ROOMS(ACTIVE);
CREATE INDEX IDX_EVENT_TEMPLATES_ORG ON EVENT_TEMPLATES(ORGANIZATION_ID);
CREATE INDEX IDX_IMAGES_ORG ON IMAGES(ORGANIZATION_ID);
```

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
        <module>passkey-housing-library-api</module>
        <module>passkey-housing-library-java-client</module>
        <module>passkey-housing-library-data-access</module>
        <module>passkey-housing-library-service</module>
        <module>passkey-housing-library-integration-test</module>
        <module>passkey-housing-library-load-test</module>
    </modules>
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
        <module>passkey-housing-library-api</module>
        <module>passkey-housing-library-java-client</module>
        <module>passkey-housing-library-integration-test</module>
    </modules>
</profile>
```

### Build Commands
```bash
# Standard build
mvn clean package

# Release build
mvn clean package -Prelease

# Integration tests
mvn clean verify -Prun-it -Denv.IT_ENVIRONMENT=dev

# Load tests
mvn clean verify -Prun-load

# Code coverage
mvn clean package -Pcoverage
mvn jacoco:report -Pcoverage
```

## Monitoring & Logging

### Metrics
- **Dropwizard Metrics**: Built-in application metrics
- **Custom Metrics**: Business-specific measurements
- **JVM Metrics**: Memory, GC, thread pool monitoring
- **Database Metrics**: Connection pool, query performance

### Health Checks
```java
// Database health check
public class DatabaseHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Verify database connectivity
        return Result.healthy("Database connection OK");
    }
}

// External service health check
public class AuthServiceHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Verify auth service connectivity
        return Result.healthy("Auth service OK");
    }
}
```

### Logging Configuration
```yaml
logging:
  level: INFO
  loggers:
    com.cvent.passkeyhousinglibrary: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
  appenders:
    - type: console
      threshold: ALL
      target: stdout
      layout:
        type: json
        timestampFormat: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
```

### Observability Integration
- **Datadog**: Application performance monitoring
- **Structured Logging**: JSON format for log aggregation
- **Request Tracing**: Correlation IDs for distributed tracing
- **Error Tracking**: Automatic error reporting and alerting

## Security

### Authentication Integration
```java
@Path("/room-categories")
@Produces(MediaType.APPLICATION_JSON)
public class RoomCategoryResource {
    
    @GET
    @RequiresAuthentication
    public Response getRoomCategories(@Auth User user, 
                                    @QueryParam("organizationId") String orgId) {
        // Verify user has access to organization
        authService.validateOrganizationAccess(user, orgId);
        // Process request
    }
}
```

### Data Validation
```java
public class RoomCategoryRequest {
    @NotNull
    @Size(min = 1, max = 500)
    private String name;
    
    @Min(1)
    @Max(20)
    private Integer maxOccupancy;
    
    @Valid
    private List<@NotNull String> amenities;
}
```

## Performance Considerations

### Database Optimization
- Connection pooling with Tomcat JDBC
- Query optimization with proper indexing
- Lazy loading for large datasets
- Pagination for list endpoints

### Caching Strategy
- Application-level caching for frequently accessed data
- Database query result caching
- Static resource caching

### File Upload Optimization
- Streaming upload for large files
- Asynchronous processing for image operations
- CDN integration for image delivery

## Testing Strategy

### Unit Tests
- JUnit 5 for service layer testing
- Mockito for dependency mocking
- Test coverage reporting with JaCoCo

### Integration Tests
- Karate framework for API testing
- Database integration testing
- External service mocking

### Load Testing
- Performance benchmarking
- Scalability testing
- Resource utilization monitoring