# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Database**: PostgreSQL/MySQL (environment dependent)
- **Authentication**: Cvent Auth Service integration
- **Containerization**: Docker
- **Testing**: JUnit 5, Karate (integration tests)
- **Monitoring**: Dropwizard Metrics, Datadog integration

## Dependencies

### Core Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>4.0.x</version>
</dependency>

<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>28.4.1</version>
</dependency>

<!-- AWS SDK -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>bom</artifactId>
    <version>2.41.14</version>
</dependency>

<!-- Validation -->
<dependency>
    <groupId>org.hibernate.validator</groupId>
    <artifactId>hibernate-validator</artifactId>
    <version>8.0.3.Final</version>
</dependency>
```

### Passkey Service Dependencies
```xml
<!-- Passkey Common Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.12</version>
</dependency>

<!-- Service Clients -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-business-text-java-client</artifactId>
    <version>1.3.1</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-java-client</artifactId>
    <version>1.0.123</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-event-java-client</artifactId>
    <version>1.13.30</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-room-type-data-java-client</artifactId>
    <version>1.2.12</version>
</dependency>
```

## Configuration

### Environment Variables
```yaml
# Database Configuration
DB_HOST: ${DB_HOST:-localhost}
DB_PORT: ${DB_PORT:-5432}
DB_NAME: ${DB_NAME:-passkey_inventory}
DB_USERNAME: ${DB_USERNAME}
DB_PASSWORD: ${DB_PASSWORD}

# Service Configuration
SERVICE_PORT: ${SERVICE_PORT:-8080}
ADMIN_PORT: ${ADMIN_PORT:-8081}

# Authentication
AUTH_SERVICE_URL: ${AUTH_SERVICE_URL}
API_KEY_HEADER: ${API_KEY_HEADER:-X-API-Key}

# External Services
BUSINESS_TEXT_SERVICE_URL: ${BUSINESS_TEXT_SERVICE_URL}
EVENT_SERVICE_URL: ${EVENT_SERVICE_URL}
HOTEL_SERVICE_URL: ${HOTEL_SERVICE_URL}
ROOM_TYPE_DATA_SERVICE_URL: ${ROOM_TYPE_DATA_SERVICE_URL}

# Monitoring
DATADOG_API_KEY: ${DATADOG_API_KEY}
DATADOG_APP_KEY: ${DATADOG_APP_KEY}
```

### Application Configuration (dev.yaml)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: org.postgresql.Driver
  url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: "SELECT 1"
  minSize: 8
  maxSize: 32
  checkConnectionWhileIdle: false

logging:
  level: INFO
  loggers:
    com.cvent.passkey.inventory: DEBUG
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC
      target: stdout

metrics:
  reporters:
    - type: datadog
      host: ${DATADOG_HOST:-localhost}
      port: 8125
      prefix: passkey.inventory
      tags:
        - service:passkey-inventory
        - environment:${ENVIRONMENT:-dev}
```

## Database Schema

### Core Tables

#### inventory
```sql
CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    block_id BIGINT NOT NULL,
    hotel_id BIGINT NOT NULL,
    room_type_id INTEGER NOT NULL,
    inventory_date DATE NOT NULL,
    total_inventory INTEGER NOT NULL DEFAULT 0,
    available_inventory INTEGER NOT NULL DEFAULT 0,
    reserved_inventory INTEGER NOT NULL DEFAULT 0,
    blocked_inventory INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(block_id, hotel_id, room_type_id, inventory_date)
);

CREATE INDEX idx_inventory_block_date ON inventory(block_id, inventory_date);
CREATE INDEX idx_inventory_hotel_room_date ON inventory(hotel_id, room_type_id, inventory_date);
```

#### room_type_inventory
```sql
CREATE TABLE room_type_inventory (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    hotel_id BIGINT NOT NULL,
    room_type_id BIGINT NOT NULL,
    inventory_date DATE NOT NULL,
    total_rooms INTEGER NOT NULL DEFAULT 0,
    available_rooms INTEGER NOT NULL DEFAULT 0,
    blocked_rooms INTEGER NOT NULL DEFAULT 0,
    reserved_rooms INTEGER NOT NULL DEFAULT 0,
    rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, hotel_id, room_type_id, inventory_date)
);

CREATE INDEX idx_room_type_inventory_event ON room_type_inventory(event_id);
CREATE INDEX idx_room_type_inventory_hotel ON room_type_inventory(hotel_id);
```

#### inventory_locks
```sql
CREATE TABLE inventory_locks (
    lock_id VARCHAR(255) PRIMARY KEY,
    block_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    number_of_rooms INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_inventory_locks_block ON inventory_locks(block_id);
CREATE INDEX idx_inventory_locks_expiry ON inventory_locks(expires_at);
```

#### reservations
```sql
CREATE TABLE reservations (
    reservation_id BIGSERIAL PRIMARY KEY,
    block_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    number_of_rooms INTEGER NOT NULL,
    room_type_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total_cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reservations_block ON reservations(block_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_dates ON reservations(arrival_date, departure_date);
```

## Monitoring & Logging

### Metrics Collection
- **Dropwizard Metrics**: Built-in application metrics
- **Custom Metrics**: Business-specific metrics (inventory levels, reservation rates)
- **JVM Metrics**: Memory usage, garbage collection, thread pools
- **Database Metrics**: Connection pool usage, query performance

### Key Performance Indicators
```java
// Custom metrics examples
@Timed(name = "inventory.request.duration")
@Metered(name = "inventory.request.rate")
public Response requestInventory(...) {
    // Implementation
}

@Gauge(name = "inventory.available.rooms")
public int getAvailableRooms() {
    return inventoryService.getTotalAvailableRooms();
}
```

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
    
    <logger name="com.cvent.passkey.inventory" level="DEBUG"/>
    <logger name="org.hibernate.SQL" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### Health Checks
```java
public class DatabaseHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check database connectivity
        return database.isConnected() ? 
            Result.healthy("Database connection OK") :
            Result.unhealthy("Database connection failed");
    }
}

public class ExternalServiceHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check external service dependencies
        return allServicesHealthy() ?
            Result.healthy("All external services OK") :
            Result.unhealthy("One or more external services unavailable");
    }
}
```

## Performance Optimization

### Database Optimization
- **Connection Pooling**: HikariCP for efficient connection management
- **Query Optimization**: Proper indexing and query tuning
- **Prepared Statements**: Prevent SQL injection and improve performance
- **Batch Operations**: Bulk inserts/updates for better throughput

### Caching Strategy
```java
@Cacheable(value = "inventory", key = "#blockId + '_' + #date")
public List<Inventory> getInventoryForBlock(Long blockId, LocalDate date) {
    // Database query
}

@CacheEvict(value = "inventory", key = "#blockId + '_' + #date")
public void updateInventory(Long blockId, LocalDate date, Inventory inventory) {
    // Update operation
}
```

### Pagination Implementation
```java
public class PaginationHelper {
    public static String buildLimitOffset(int limit, int offset) {
        return String.format("LIMIT %d OFFSET %d", 
            Math.min(limit, MAX_LIMIT), 
            Math.max(offset, 0));
    }
}
```

## Security Implementation

### Input Validation
```java
@Valid
@NotNull
public class InventoryRequest {
    @NotNull
    @Positive
    private Long blockId;
    
    @NotNull
    @FutureOrPresent
    private LocalDate arrivalDate;
    
    @NotNull
    @Future
    private LocalDate departureDate;
    
    @Min(1)
    @Max(50)
    private Integer numberOfRooms;
}
```

### SQL Injection Prevention
```java
// Using parameterized queries
String sql = "SELECT * FROM inventory WHERE block_id = ? AND inventory_date = ?";
PreparedStatement stmt = connection.prepareStatement(sql);
stmt.setLong(1, blockId);
stmt.setDate(2, Date.valueOf(inventoryDate));
```

### Authentication Integration
```java
@Authority(methods = {AuthMethod.BEARER, AuthMethod.API_KEY})
public Response getInventory(GrantedAPIKey grantedAPIKey, ...) {
    // Extract user context from auth
    Map<String, Object> metadata = grantedAPIKey.getAuthorization().getMetadata();
    Long userId = ((Number) metadata.get("userId")).longValue();
    
    // Process request with user context
}
```

## Error Handling

### Exception Hierarchy
```java
public class InventoryException extends RuntimeException {
    private final String errorCode;
    private final String errorType;
    
    public InventoryException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}

public class InventoryNotFoundException extends InventoryException {
    public InventoryNotFoundException(Long blockId) {
        super("INVENTORY_NOT_FOUND", "Inventory not found for block: " + blockId);
    }
}
```

### Global Exception Handling
```java
@Provider
public class InventoryExceptionMapper implements ExceptionMapper<InventoryException> {
    @Override
    public Response toResponse(InventoryException exception) {
        ErrorResponse error = ErrorResponse.builder()
            .code(exception.getErrorCode())
            .message(exception.getMessage())
            .timestamp(Instant.now())
            .build();
            
        return Response.status(Response.Status.BAD_REQUEST)
            .entity(error)
            .build();
    }
}
```