# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21 (OpenJDK)
- **Build Tool**: Apache Maven 3.9+
- **Packaging**: JAR with embedded Jetty server

### Web Layer
- **REST Framework**: JAX-RS (Jersey implementation)
- **JSON Processing**: Jackson 2.x
- **Validation**: Bean Validation (Hibernate Validator)
- **Multipart Support**: Jersey Media Multipart 3.1.10

### Database & Persistence
- **Primary Database**: Couchbase Server
- **Couchbase Client**: Cvent Common Couchbase 9.14.0
- **Dropwizard Integration**: Dropwizard Couchbase 9.14.0
- **Connection Pooling**: Built-in Couchbase connection pooling

### Security & Authentication
- **Authentication Service**: Cvent Auth Service 16.0.2
- **Authorization**: Role-based access control
- **Transport Security**: TLS/HTTPS
- **Token Validation**: JWT token validation

### Observability & Monitoring
- **Metrics**: Dropwizard Metrics
- **Health Checks**: Dropwizard Health Checks
- **Observability**: Cvent Common Observability 57.0.0
- **Dropwizard Observability**: 57.0.0
- **APM**: Datadog integration

### Testing
- **Unit Testing**: JUnit 5
- **Integration Testing**: Karate Framework
- **Test Coverage**: JaCoCo
- **Mocking**: Mockito

### Build & Deployment
- **Containerization**: Docker
- **CI/CD**: Jenkins
- **Artifact Repository**: Cvent Internal Nexus
- **Configuration Management**: YAML-based configuration

## Dependencies

### Core Dependencies

```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>4.0.x</version>
</dependency>

<!-- Cvent Common Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.2</version>
</dependency>

<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>16.0.2</version>
</dependency>

<!-- Database -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-couchbase</artifactId>
    <version>9.14.0</version>
</dependency>

<!-- Observability -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-observability</artifactId>
    <version>57.0.0</version>
</dependency>

<!-- File Upload Support -->
<dependency>
    <groupId>org.glassfish.jersey.media</groupId>
    <artifactId>jersey-media-multipart</artifactId>
    <version>3.1.10</version>
</dependency>
```

### Development Dependencies

```xml
<!-- Testing -->
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>test</scope>
</dependency>

<!-- Integration Testing -->
<dependency>
    <groupId>com.intuit.karate</groupId>
    <artifactId>karate-junit5</artifactId>
    <scope>test</scope>
</dependency>
```

## Configuration

### Application Configuration Structure

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
couchbase:
  connectionString: "couchbase://localhost"
  username: ${COUCHBASE_USERNAME}
  password: ${COUCHBASE_PASSWORD}
  bucket: "passkey-event-housing"
  connectTimeout: 10s
  kvTimeout: 2500ms

# Authentication Configuration
auth:
  serviceUrl: ${AUTH_SERVICE_URL}
  clientId: ${AUTH_CLIENT_ID}
  clientSecret: ${AUTH_CLIENT_SECRET}

# Logging Configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkeyeventhousing: DEBUG
  appenders:
    - type: console
      threshold: INFO
      target: stdout
      logFormat: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n"

# Metrics Configuration
metrics:
  reporters:
    - type: datadog
      host: ${DATADOG_HOST}
      apiKey: ${DATADOG_API_KEY}
      frequency: 1 minute
```

### Environment-Specific Configurations

#### Development (dev.yaml)
```yaml
couchbase:
  connectionString: "couchbase://dev-couchbase.cvent.org"
  bucket: "passkey-event-housing-dev"

auth:
  serviceUrl: "https://auth-service.dev.cvent.org"

logging:
  level: DEBUG
```

#### Production (prod.yaml)
```yaml
couchbase:
  connectionString: "couchbase://prod-couchbase.cvent.org"
  bucket: "passkey-event-housing-prod"
  
auth:
  serviceUrl: "https://auth-service.cvent.org"

logging:
  level: INFO
  
metrics:
  reporters:
    - type: datadog
      frequency: 30s
```

## Database Schema

### Couchbase Document Structure

#### Event Housing Document
```json
{
  "type": "event-housing",
  "eventId": "event-12345",
  "housingInfo": {
    "totalRooms": 150,
    "totalReserved": 75,
    "hotels": ["hotel-123", "hotel-456"],
    "groupLinks": ["link-789"]
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T15:45:00Z"
}
```

#### Room Block Document
```json
{
  "type": "room-block",
  "blockId": "block-456",
  "eventId": "event-12345",
  "hotelId": "hotel-123",
  "roomCategoryId": "standard",
  "allocation": {
    "totalQuantity": 50,
    "reservedQuantity": 25,
    "availableQuantity": 25
  },
  "pricing": {
    "rate": 129.99,
    "currency": "USD"
  },
  "dates": {
    "checkIn": "2024-06-15",
    "checkOut": "2024-06-18",
    "cutOff": "2024-06-01"
  },
  "status": "active",
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T15:45:00Z",
    "version": 1
  }
}
```

### Indexing Strategy

#### Primary Indexes
- `eventId` - For event-based queries
- `hotelId` - For hotel-based queries
- `blockId` - For room block lookups
- `type` - For document type filtering

#### Secondary Indexes
- `status` - For filtering active/inactive entities
- `dates.checkIn` - For date range queries
- `createdAt` - For temporal queries
- `eventId + hotelId` - For composite queries

## Monitoring & Logging

### Application Metrics

#### Business Metrics
- Total room blocks created/updated/deleted
- Room reservation rates by event
- Average response times by endpoint
- Error rates by operation type

#### Technical Metrics
- JVM memory usage and garbage collection
- Database connection pool statistics
- HTTP request/response metrics
- Thread pool utilization

#### Custom Metrics
```java
@Timed(name = "room-block-creation-time")
@Metered(name = "room-block-creation-rate")
public RoomBlock createRoomBlock(CreateRoomBlockRequest request) {
    // Implementation
}
```

### Health Checks

#### Database Health Check
```java
public class CouchbaseHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check Couchbase connectivity
        return Result.healthy("Couchbase connection is healthy");
    }
}
```

#### External Service Health Checks
- Auth Service connectivity
- Dependent service availability
- External provider connections

### Logging Configuration

#### Structured Logging
```java
private static final Logger logger = LoggerFactory.getLogger(EventResource.class);

public void processEvent(String eventId) {
    logger.info("Processing event", 
        kv("eventId", eventId),
        kv("operation", "process"),
        kv("timestamp", Instant.now()));
}
```

#### Log Levels
- **ERROR**: System errors, exceptions, failed operations
- **WARN**: Recoverable errors, deprecated usage, performance issues
- **INFO**: Business operations, service lifecycle events
- **DEBUG**: Detailed execution flow, parameter values

## Performance Considerations

### Database Optimization
- **Connection Pooling**: Optimized Couchbase connection pool settings
- **Query Optimization**: Efficient N1QL queries with proper indexing
- **Caching Strategy**: Application-level caching for frequently accessed data
- **Batch Operations**: Bulk operations for improved throughput

### Memory Management
- **JVM Tuning**: Optimized heap size and garbage collection settings
- **Object Pooling**: Reuse of expensive objects where appropriate
- **Memory Monitoring**: Continuous monitoring of memory usage patterns

### Concurrency
- **Thread Pool Configuration**: Optimized thread pools for different operation types
- **Async Processing**: Non-blocking operations where possible
- **Lock-free Algorithms**: Minimize contention in high-throughput scenarios

## Security Configuration

### Transport Security
- **TLS Configuration**: TLS 1.2+ for all external communications
- **Certificate Management**: Automated certificate rotation
- **HSTS Headers**: HTTP Strict Transport Security enabled

### Application Security
- **Input Validation**: Comprehensive validation of all inputs
- **SQL Injection Prevention**: Parameterized queries and prepared statements
- **XSS Protection**: Output encoding and Content Security Policy
- **CSRF Protection**: Cross-Site Request Forgery tokens

### Authentication & Authorization
```java
@RolesAllowed({"ADMIN", "EVENT_MANAGER"})
@Path("/admin")
public class AdminResource {
    // Admin operations
}
```

## Deployment Configuration

### Docker Configuration
```dockerfile
FROM openjdk:21-jre-slim

COPY target/passkey-event-housing-service-*.jar app.jar
COPY configs/ /configs/

EXPOSE 8080 8081

ENTRYPOINT ["java", "-jar", "app.jar", "server", "/configs/prod.yaml"]
```

### Environment Variables
- `COUCHBASE_USERNAME` - Database username
- `COUCHBASE_PASSWORD` - Database password
- `AUTH_SERVICE_URL` - Authentication service endpoint
- `DATADOG_API_KEY` - Monitoring API key
- `LOG_LEVEL` - Application log level

### Resource Requirements
- **CPU**: 2-4 cores recommended
- **Memory**: 2-4 GB heap space
- **Storage**: 10 GB for logs and temporary files
- **Network**: High-bandwidth connection for database operations