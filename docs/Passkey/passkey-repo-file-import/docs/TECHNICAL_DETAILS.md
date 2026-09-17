# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x (JAX-RS based microservice framework)
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Parent POM**: Cvent Maven Parent 50.8.0
- **Container Runtime**: Docker
- **Base Image**: Cvent JRE 11.0.4.11

## Dependencies

### Core Framework Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>50.8.0</version>
</dependency>

<!-- Mono Java Common Libraries -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>mono-java</artifactId>
    <version>47.2.7</version>
</dependency>
```

### Authentication & Authorization
```xml
<!-- Auth Service Integration -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>13.0.6</version>
</dependency>

<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>13.0.6</version>
</dependency>
```

### File Import Integration
```xml
<!-- File Import Service API -->
<dependency>
    <groupId>com.cvent.file-import</groupId>
    <artifactId>file-import-api</artifactId>
    <version>1.0.19</version>
</dependency>
```

### Passkey Service Clients
```xml
<!-- Passkey Reservation Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-reservation-java-client</artifactId>
    <version>1.0.86</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-reservation-api</artifactId>
    <version>1.0.86</version>
</dependency>

<!-- Passkey Common Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.0</version>
</dependency>
```

### OpenAPI Documentation
```xml
<!-- Swagger/OpenAPI -->
<dependency>
    <groupId>io.swagger.core.v3</groupId>
    <artifactId>swagger-jaxrs2-jakarta</artifactId>
    <version>2.2.27</version>
</dependency>
```

### Validation
```xml
<!-- Hibernate Validator -->
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-validator</artifactId>
    <version>8.0.2.Final</version>
</dependency>
```

## Configuration

### Environment Variables
The service uses YAML-based configuration with environment-specific overrides:

```yaml
# Server Configuration
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

# Logging Configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkeyfileimport: DEBUG
  appenders:
    - type: console
      threshold: INFO
      target: stdout
```

### Client Configurations
External service clients are configured through the `PasskeyFileImportServiceClientConfiguration` class:

```java
@JsonProperty
private PasskeyReservationClientConfiguration reservationClient;

@JsonProperty
private ResdeskClientConfiguration resdeskClient;

@JsonProperty
private AuthConfiguration auth;
```

### Configuration Files
- `configs/dev.yaml` - Development environment
- `configs/alpha.yaml` - Alpha environment  
- `configs/ts50.yaml` - Test environment
- `configs/pr50.yaml` - Production environment

## Build Configuration

### Maven Profiles

#### Default Profile
```bash
mvn clean package
```
- Builds all modules except integration and load tests
- Runs unit tests
- Performs code quality checks

#### Release Profile
```bash
mvn clean package -Prelease
```
- Optimized build for deployment
- Includes all dependencies
- Creates deployable artifacts

#### Coverage Profile
```bash
mvn clean package -Pcoverage
```
- Runs JaCoCo code coverage analysis
- Generates coverage reports
- Enforces coverage thresholds

#### Integration Test Profile
```bash
mvn clean verify -Prun-it -Denv.IT_ENVIRONMENT=dev
```
- Runs integration tests against specified environment
- Requires external service dependencies

#### Load Test Profile
```bash
mvn clean verify -Prun-load
```
- Executes performance and load tests
- Generates performance reports

### Code Quality

#### JaCoCo Coverage
- **Minimum Coverage**: Configured per project requirements
- **Exclusions**: Application classes, configuration classes, generated code
- **Report Location**: `target/site/jacoco/index.html`

#### Checkstyle
- **Configuration**: Cvent standard checkstyle rules
- **Enforcement**: Build fails on violations
- **Skip Option**: `-Dcheckstyle.skip=true`

#### SonarQube Integration
```xml
<sonar.coverage.exclusions>
    src/main/java/com/cvent/passkey/passkeyfileimport/resources/OpenApiResource.java
</sonar.coverage.exclusions>
```

## Database Schema

This service does not maintain its own database. It integrates with external services for data persistence:

### External Data Sources
- **Passkey Reservation Service**: Reservation data and validation
- **Passkey Resdesk**: RezHub reservation processing
- **File Import Service**: Import metadata and status tracking

## Monitoring & Logging

### Logging Framework
- **Framework**: SLF4J with Logback
- **Format**: JSON structured logging
- **Levels**: DEBUG, INFO, WARN, ERROR
- **Appenders**: Console, File (environment-dependent)

### Key Log Events
```java
// Import processing
LOG.info("Record Count {}", request.getTotalCount());

// Reservation validation
LOG.debug("Reservation ID fetching has failed for ACK: {}, with error {}", ackNumber, e);

// Error handling
LOG.error("Failed mapping external numbers to ack numbers", e);
```

### Metrics & Monitoring

#### Datadog Integration
- **Service**: passkey-file-import-service
- **Environment Tags**: dev, alpha, ts50, pr50
- **Custom Metrics**: Import success rates, processing times, error rates
- **Dashboard**: https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-file-import-service

#### Health Checks
- **Endpoint**: `/healthcheck`
- **Dependencies**: External service connectivity checks
- **Status**: UP/DOWN based on critical dependencies

#### Application Metrics
- **Request Rates**: HTTP request throughput
- **Response Times**: API endpoint latency
- **Error Rates**: 4xx/5xx response percentages
- **Business Metrics**: Import success/failure rates

## Security

### Authentication
- **Method**: API Key authentication
- **Header**: `Authorization: Bearer {api-key}`
- **Validation**: Integrated with Cvent auth-service
- **Scope**: Service-to-service communication

### Authorization
- **User Context**: Extracted from API key
- **Resource Access**: User can only access their own reservations
- **Participant Validation**: ACK numbers validated against user ownership

### Data Protection
- **Encryption**: HTTPS/TLS for all communications
- **Sensitive Data**: No persistent storage of sensitive information
- **Audit Logging**: All operations logged for security auditing

## Performance Characteristics

### Throughput
- **Batch Size**: 100 records per batch (configurable)
- **Concurrent Processing**: Thread-safe batch processing
- **Memory Usage**: Optimized for large file imports

### Latency
- **API Response Time**: < 500ms for schema requests
- **Batch Processing**: Variable based on external service response times
- **Retry Logic**: Single retry for failed external calls

### Scalability
- **Horizontal Scaling**: Stateless service design
- **Load Balancing**: Compatible with standard load balancers
- **Resource Requirements**: Minimal memory footprint per request

## Error Handling

### Exception Hierarchy
```java
// Custom exceptions
com.cvent.passkeyfileimport.exceptions.*

// Standard HTTP exceptions
jakarta.ws.rs.WebApplicationException
jakarta.ws.rs.BadRequestException
```

### Retry Strategy
- **External Service Calls**: Single retry on failure
- **Backoff Strategy**: Immediate retry (no delay)
- **Circuit Breaker**: Not implemented (relies on external service resilience)

### Error Response Format
```json
{
  "code": 400,
  "message": "Validation failed",
  "details": "Specific error information"
}
```

## Development Tools

### IDE Support
- **IntelliJ IDEA**: Full support with Maven integration
- **Eclipse**: Compatible with Maven tooling
- **NetBeans**: Native Maven support
- **VS Code**: Java extension pack support

### Local Development
```bash
# Build and run locally
mvn clean package -Prelease
cd passkey-file-import-service
java -jar target/passkey-file-import-service-*.jar server configs/dev.yaml
```

### Testing Tools
- **Unit Tests**: JUnit 5, Mockito
- **Integration Tests**: TestContainers, WireMock
- **Load Tests**: Custom performance testing framework
- **API Testing**: Swagger UI, Postman collections