# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 2.x
- **Language**: Java 17
- **Build Tool**: Apache Maven 3.6+
- **Packaging**: JAR with embedded Jetty server

### Web Technologies
- **JAX-RS**: RESTful web services (Jersey implementation)
- **Nucleus Views**: Server-side HTML rendering
- **Jackson**: JSON serialization/deserialization
- **Jetty**: Embedded web server

### Authentication & Security
- **Auth Service**: Cvent's centralized authentication
- **JWT**: JSON Web Tokens for stateless authentication
- **OAuth 2.0**: Authorization framework
- **Rate Limiting**: Built-in request throttling

### Monitoring & Observability
- **Metrics**: Dropwizard Metrics
- **Health Checks**: Built-in health monitoring
- **Logging**: SLF4J with Logback
- **Distributed Tracing**: Integration ready

## Dependencies

### Core Dependencies (from pom.xml)

#### Cvent Platform Dependencies
```xml
<!-- Cvent Maven Parent -->
<parent>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>55.9.4</version>
</parent>

<!-- Passkey Common Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.0.18</version>
</dependency>
```

#### Authentication Dependencies
```xml
<!-- Auth Service Integration -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>21.0.0</version>
</dependency>

<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>21.0.0</version>
</dependency>
```

#### Passkey Service Clients
```xml
<!-- Event Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-event-java-client</artifactId>
    <version>1.10.0</version>
</dependency>

<!-- Hotel Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-java-client</artifactId>
    <version>1.0.34</version>
</dependency>

<!-- Autoblock Data Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-autoblock-data-java-client</artifactId>
    <version>1.0.78</version>
</dependency>

<!-- Business Text Service -->
<dependency>
    <groupId>com.cvent.passkey-business-text</groupId>
    <artifactId>passkey-business-text-java-client</artifactId>
    <version>1.0.9</version>
</dependency>

<!-- Inventory Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-inventory-java-client</artifactId>
    <version>1.0.27</version>
</dependency>

<!-- Room Type Data Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-room-type-data-java-client</artifactId>
    <version>1.0.6</version>
</dependency>

<!-- SmartCamp Configuration Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-smartcamp-cfg-data-java-client</artifactId>
    <version>1.0.18</version>
</dependency>
```

#### UI Dependencies
```xml
<!-- Nucleus Asset Views -->
<dependency>
    <groupId>com.cvent.nucleus</groupId>
    <artifactId>nucleus-asset-views</artifactId>
    <version>6.0.60</version>
</dependency>
```

#### Testing Dependencies
```xml
<!-- Mockito for unit testing -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>3.4.0</version>
    <scope>test</scope>
</dependency>
```

## Configuration

### Application Configuration Structure

The service uses YAML configuration files with environment-specific overrides:

```yaml
# Base configuration structure
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

# Service-specific configuration
autoblockGuestside:
  # Service client configurations
  hotelService:
    baseUrl: ${HOTEL_SERVICE_URL}
    timeout: 30s
    retries: 3
  
  eventService:
    baseUrl: ${EVENT_SERVICE_URL}
    timeout: 30s
    retries: 3
  
  inventoryService:
    baseUrl: ${INVENTORY_SERVICE_URL}
    timeout: 30s
    retries: 3

# Authentication configuration
auth:
  serviceUrl: ${AUTH_SERVICE_URL}
  clientId: ${AUTH_CLIENT_ID}
  clientSecret: ${AUTH_CLIENT_SECRET}
  tokenValidationCache:
    maximumSize: 1000
    expireAfterWrite: 5m

# Rate limiting configuration
rateLimiting:
  enabled: true
  defaultLimit: 100
  windowSize: 1m
  endpoints:
    "/survey/submit": 10
    "/admin/*": 1000

# Caching configuration
caching:
  surveyData:
    maximumSize: 500
    expireAfterWrite: 5m
  hotelInfo:
    maximumSize: 1000
    expireAfterWrite: 15m
  eventDetails:
    maximumSize: 1000
    expireAfterWrite: 10m

# Logging configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkey.autoblockguestside: DEBUG
    com.cvent.auth: INFO
  appenders:
    - type: console
      threshold: INFO
      target: stdout
    - type: file
      threshold: DEBUG
      currentLogFilename: logs/application.log
      archivedLogFilenamePattern: logs/application-%d.log.gz
      archivedFileCount: 7
```

### Environment Variables

#### Required Environment Variables
- `AUTH_SERVICE_URL`: Authentication service endpoint
- `AUTH_CLIENT_ID`: OAuth client identifier
- `AUTH_CLIENT_SECRET`: OAuth client secret
- `HOTEL_SERVICE_URL`: Hotel service endpoint
- `EVENT_SERVICE_URL`: Event service endpoint
- `INVENTORY_SERVICE_URL`: Inventory service endpoint
- `AUTOBLOCK_DATA_SERVICE_URL`: Autoblock data service endpoint
- `BUSINESS_TEXT_SERVICE_URL`: Business text service endpoint

#### Optional Environment Variables
- `LOG_LEVEL`: Logging level (default: INFO)
- `SERVER_PORT`: HTTP server port (default: 8080)
- `ADMIN_PORT`: Admin server port (default: 8081)
- `RATE_LIMIT_ENABLED`: Enable rate limiting (default: true)
- `CACHE_ENABLED`: Enable caching (default: true)

### Configuration Management

#### Development Environment
```yaml
# configs/dev.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
      bindHost: localhost

autoblockGuestside:
  hotelService:
    baseUrl: "http://localhost:8082"
  eventService:
    baseUrl: "http://localhost:8083"

logging:
  level: DEBUG
```

#### Production Environment
```yaml
# configs/prod.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
      bindHost: 0.0.0.0

autoblockGuestside:
  hotelService:
    baseUrl: "${HOTEL_SERVICE_URL}"
  eventService:
    baseUrl: "${EVENT_SERVICE_URL}"

logging:
  level: INFO
```

## Database Schema

The service is primarily stateless and does not maintain its own database. However, it interacts with data from multiple backend services:

### External Data Sources

#### Hotel Service Data
- Hotel properties and amenities
- Room types and configurations
- Pricing and availability

#### Event Service Data
- Event details and schedules
- Attendee information
- Group booking parameters

#### Inventory Service Data
- Real-time room availability
- Rate information
- Booking constraints

#### Autoblock Data Service
- Survey configurations
- Response tracking
- Booking history

## Monitoring & Logging

### Metrics Collection

#### Application Metrics
- Request count and response times
- Error rates by endpoint
- Cache hit/miss ratios
- Service client response times

#### Business Metrics
- Survey completion rates
- Booking conversion rates
- User engagement metrics
- Error categorization

#### System Metrics
- JVM memory usage
- Garbage collection statistics
- Thread pool utilization
- Connection pool metrics

### Health Checks

#### Service Health Checks
```java
// Built-in health checks
- Database connectivity (if applicable)
- External service availability
- Cache system status
- Authentication service connectivity
```

#### Custom Health Checks
- Survey service availability
- Hotel data freshness
- Event data synchronization
- Rate limiting system status

### Logging Configuration

#### Log Levels
- **ERROR**: System errors and exceptions
- **WARN**: Degraded performance or recoverable issues
- **INFO**: Normal operation events
- **DEBUG**: Detailed debugging information

#### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "logger": "com.cvent.passkey.autoblockguestside.resources.AutoblockGuestsideResource",
  "message": "Survey request processed",
  "requestId": "abc-123-def",
  "userId": "user123",
  "surveyId": "survey456",
  "duration": 150
}
```

### Performance Optimization

#### Connection Pooling
- HTTP client connection pools for service calls
- Configurable pool sizes per service
- Connection timeout and retry policies

#### Caching Strategy
- In-memory caching for frequently accessed data
- Cache invalidation based on data freshness
- Distributed caching for multi-instance deployments

#### Asynchronous Processing
- Non-blocking I/O for service calls
- Async processing for non-critical operations
- Thread pool management for concurrent requests

## Security Configuration

### Authentication Integration
- JWT token validation
- Token refresh mechanisms
- Session management
- CORS configuration

### Rate Limiting
- Per-IP rate limiting
- Per-user rate limiting
- Endpoint-specific limits
- Graceful degradation

### Input Validation
- Request parameter validation
- JSON schema validation
- SQL injection prevention
- XSS protection

### Audit Logging
- All authentication attempts
- Administrative operations
- Data access patterns
- Security violations