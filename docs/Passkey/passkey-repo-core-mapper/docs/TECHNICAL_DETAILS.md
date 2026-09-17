# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21 (OpenJDK)
- **Build Tool**: Apache Maven 3.9+
- **Package Management**: Maven Central + Cvent Nexus Repository

### Web Layer
- **REST Framework**: JAX-RS (Jersey implementation)
- **JSON Processing**: Jackson 2.15+
- **Validation**: Hibernate Validator
- **HTTP Client**: Apache HttpClient 5.x

### Authentication & Security
- **Authentication**: Cvent Auth Service integration
- **Authorization**: JWT token validation
- **Security Framework**: Dropwizard Auth Bundle
- **Policy Engine**: Cvent Application Policy

### Observability & Monitoring
- **APM**: Datadog APM integration
- **Logging**: SLF4J with Logback
- **Metrics**: Dropwizard Metrics + Datadog
- **Health Checks**: Dropwizard Health Checks
- **Tracing**: Distributed tracing with correlation IDs

### Testing
- **Unit Testing**: JUnit 5
- **Integration Testing**: Karate Framework
- **Mocking**: Mockito
- **Test Containers**: Docker-based integration tests

## Dependencies

### Core Passkey Dependencies
```xml
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>28.4.1</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey-addons</groupId>
    <artifactId>passkey-addons-java-client</artifactId>
    <version>1.1.2</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-java-client</artifactId>
    <version>1.0.123</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey-payment</groupId>
    <artifactId>passkey-payment-api</artifactId>
    <version>1.1.2</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-reservation-orch-client</artifactId>
    <version>1.11.19</version>
</dependency>
```

### External Dependencies
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>57.4.8</version>
</dependency>

<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>4.0.x</version>
</dependency>

<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.x</version>
</dependency>
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SERVICE_PORT` | HTTP service port | 8080 | No |
| `ADMIN_PORT` | Admin interface port | 8081 | No |
| `AUTH_SERVICE_URL` | Auth service endpoint | - | Yes |
| `PASSKEY_HOTEL_SERVICE_URL` | Hotel service endpoint | - | Yes |
| `PASSKEY_ADDONS_SERVICE_URL` | Addons service endpoint | - | Yes |
| `PAYMENTS_WALLET_SERVICE_URL` | Payment service endpoint | - | Yes |
| `LOG_LEVEL` | Logging level | INFO | No |
| `DATADOG_API_KEY` | Datadog API key | - | No |
| `DATADOG_SERVICE_NAME` | Service name for Datadog | passkey-core-mapper-service | No |

### Configuration Files

#### Application Configuration (YAML)
```yaml
# configs/dev.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

logging:
  level: INFO
  loggers:
    com.cvent.passkeycoremapper: DEBUG
    org.apache.http: WARN
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC
      target: stdout

auth:
  serviceUrl: ${AUTH_SERVICE_URL}
  timeout: 30s
  connectionTimeout: 10s

clients:
  passkeyHotelService:
    url: ${PASSKEY_HOTEL_SERVICE_URL}
    timeout: 30s
    connectionPool:
      maxConnections: 50
      maxConnectionsPerRoute: 10
  
  passkeyAddonsService:
    url: ${PASSKEY_ADDONS_SERVICE_URL}
    timeout: 30s
    
  paymentsWalletService:
    url: ${PAYMENTS_WALLET_SERVICE_URL}
    timeout: 30s

datadog:
  apiKey: ${DATADOG_API_KEY}
  serviceName: ${DATADOG_SERVICE_NAME}
  environment: ${ENVIRONMENT}
```

#### Maven Configuration
```xml
<properties>
    <revision>1.16.1-SNAPSHOT</revision>
    <java.version>21</java.version>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    
    <!-- Dependency versions -->
    <auth-service.version>28.4.1</auth-service.version>
    <passkey-addons.version>1.1.2</passkey-addons.version>
    <passkey-hotel.version>1.0.123</passkey-hotel.version>
    <passkey-payment.version>1.1.2</passkey-payment.version>
</properties>
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
    <properties>
        <skipITs>true</skipITs>
        <skipLoadTests>true</skipLoadTests>
    </properties>
    <modules>
        <module>passkey-core-mapper-api</module>
        <module>passkey-core-mapper-java-client</module>
        <module>passkey-core-mapper-service</module>
        <module>passkey-core-mapper-integration-test</module>
    </modules>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <checkstyle.skip>true</checkstyle.skip>
        <skipIntegrationTests>false</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-core-mapper-api</module>
        <module>passkey-core-mapper-java-client</module>
        <module>passkey-core-mapper-integration-test</module>
    </modules>
</profile>
```

#### Release Profile
```xml
<profile>
    <id>release</id>
    <properties>
        <skipTests>false</skipTests>
        <skipITs>false</skipITs>
    </properties>
</profile>
```

### Build Commands

```bash
# Standard build
mvn clean package

# Release build with all tests
mvn clean package -Prelease

# Integration tests only
mvn clean verify -Prun-it -Dkarate.env=dev

# Code coverage report
mvn clean package -Pcoverage
mvn jacoco:report -Pcoverage

# Skip tests for faster builds
mvn clean package -DskipTests

# Build specific module
mvn clean package -pl passkey-core-mapper-service
```

## Database Schema

The service is stateless and does not maintain its own database. It relies on external services for data persistence:

- **Auth Service**: User authentication and authorization data
- **Passkey Hotel Service**: Hotel and property information
- **Passkey Addons Service**: Addon and amenity data
- **Payments Wallet Service**: Payment method and billing data

## API Serialization

### JSON Configuration
```java
// Custom serialization for card types
SimpleModule simpleModule = new SimpleModule();
simpleModule.addSerializer(CardMetadata.CardType.class, new CardTypeSerializer());
simpleModule.addDeserializer(CardMetadata.CardType.class, new CardTypeDeserializer());
environment.getObjectMapper().registerModule(simpleModule);
```

### Date/Time Handling
- **Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.SSSZ)
- **Timezone**: UTC for storage, local timezone for display
- **Serialization**: Jackson JSR310 module for Java 8 time types

### Validation Annotations
```java
@Valid
@NotNull
@Size(min = 1, max = 255)
@Email
@Pattern(regexp = "^[A-Z]{2,3}$") // Country codes
```

## Monitoring & Logging

### Structured Logging
```java
// Log context with correlation IDs
LogContext.put(PasskeyTags.RESERVATION_ID, reservationId);
LogContext.put(PasskeyTags.RESERVATION_CONF_NUMBER, confNumber);

// Structured log messages
LOGGER.info("Mapping reservation {} for vendor {}", 
    reservationId, vendorType);
```

### Health Check Implementation
```java
@Override
public Result check() throws Exception {
    // Check service dependencies
    boolean authServiceHealthy = checkAuthService();
    boolean hotelServiceHealthy = checkHotelService();
    
    if (authServiceHealthy && hotelServiceHealthy) {
        return Result.healthy("All dependencies are healthy");
    } else {
        return Result.unhealthy("One or more dependencies are unhealthy");
    }
}
```

### Metrics Collection
```java
// Custom metrics
@Timed(name = "reservation.mapping.time")
@Metered(name = "reservation.mapping.rate")
@ExceptionMetered(name = "reservation.mapping.exceptions")
public MappingResult mapReservation(Reservation reservation) {
    // Mapping logic
}
```

## Performance Considerations

### Connection Pooling
```yaml
clients:
  connectionPool:
    maxConnections: 50
    maxConnectionsPerRoute: 10
    connectionTimeout: 10s
    socketTimeout: 30s
    connectionRequestTimeout: 5s
```

### Caching Strategy
- **HTTP Client Caching**: Response caching for static data (hotel info, rate codes)
- **JVM Caching**: In-memory caching of mapping rules and validation schemas
- **Cache TTL**: Configurable time-to-live for different data types

### Memory Management
```bash
# JVM tuning parameters
-Xms512m -Xmx2g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/heapdump.hprof
```

## Security Configuration

### Authentication Flow
1. Client includes JWT token in Authorization header
2. Auth bundle validates token with Auth Service
3. Principal extracted and available in resource methods
4. Role-based access control applied per endpoint

### Input Validation
```java
// Request validation
@Valid @NotNull ReservationMappingRequest request

// Field-level validation
@NotBlank
@Size(max = 255)
@Email
private String guestEmail;
```

### Security Headers
```yaml
# Automatically added by Cvent framework
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## Error Handling

### Exception Mapping
```java
@Provider
public class BaseExceptionMapper implements ExceptionMapper<Exception> {
    @Override
    public Response toResponse(Exception exception) {
        // Log exception with correlation ID
        // Return appropriate HTTP status and error message
        // Include request ID for troubleshooting
    }
}
```

### Validation Error Format
```json
{
  "validationErrors": [
    {
      "field": "reservation.guestInfo.email",
      "code": "INVALID_EMAIL_FORMAT",
      "message": "Email address format is invalid"
    }
  ],
  "requestId": "req-12345-67890",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Development Tools

### IDE Configuration
- **IntelliJ IDEA**: Recommended IDE with Maven integration
- **Code Style**: Cvent Java code style configuration
- **Plugins**: Lombok, Maven Helper, SonarLint

### Code Quality
- **Checkstyle**: Enforces coding standards
- **SpotBugs**: Static analysis for bug detection
- **SonarQube**: Code quality and security analysis
- **Jacoco**: Code coverage reporting

### Local Development
```bash
# Run with hot reload (requires IDE integration)
mvn compile exec:java -Dexec.mainClass="com.cvent.passkeycoremapper.PasskeyCoreMapperServiceApplication" -Dexec.args="server configs/dev.yaml"

# Debug mode
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 -jar target/passkey-core-mapper-service-*.jar server configs/dev.yaml
```