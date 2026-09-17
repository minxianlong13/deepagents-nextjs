# Technical Details

## Technology Stack

### Framework & Runtime
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21 (OpenJDK)
- **Build Tool**: Apache Maven 3.6+
- **Application Server**: Embedded Jetty (via Dropwizard)
- **Packaging**: Executable JAR with embedded dependencies

### Core Dependencies

#### Dropwizard Ecosystem
- **dropwizard-core**: Core framework functionality
- **dropwizard-jersey**: JAX-RS REST API implementation
- **dropwizard-jackson**: JSON serialization/deserialization
- **dropwizard-validation**: Request validation using Bean Validation
- **dropwizard-metrics**: Application metrics and monitoring
- **dropwizard-health**: Health check framework

#### HTTP Client & Communication
- **Jersey Client**: HTTP client for external service calls
- **Jackson**: JSON processing and data binding
- **Apache HttpClient**: Low-level HTTP communication
- **OkHttp**: Alternative HTTP client for specific integrations

#### Authentication & Security
- **auth-service-core**: Cvent authentication integration
- **auth-service-api**: Authentication API contracts
- **passkey-authentication-client**: Passkey-specific auth client
- **JWT libraries**: Token validation and processing

#### Passkey Ecosystem Clients
- **passkey-microservices-common**: Shared utilities and patterns
- **passkey-bridge-java-client**: Bridge service integration
- **passkey-reservation-orch-client**: Reservation orchestration
- **passkey-reservation-java-client**: Individual reservation service
- **passkey-vendor-java-client**: Vendor service integration
- **passkey-inventory-client**: Inventory management service
- **passkey-ledger-client**: Financial ledger service
- **passkey-payment-client**: Payment processing service
- **passkey-planners-client**: Planner service integration
- **passkey-housing-library-client**: Housing library service
- **passkey-event-java-client**: Event management service
- **passkey-hotel-java-client**: Hotel service integration

#### External Service Clients
- **payments-wallet-java-client**: Payment wallet integration
- **ecommerce-webpayments-validator-client**: Payment validation

#### Utilities & Libraries
- **MapStruct**: Object mapping and transformation
- **api-platform-tracing**: Distributed tracing integration
- **messaging-logging**: Structured logging framework
- **messaging-shared**: Shared messaging utilities

### Development Dependencies

#### Testing Framework
- **JUnit 5**: Unit testing framework
- **Mockito**: Mocking framework for unit tests
- **Karate**: API integration testing
- **TestContainers**: Integration testing with containers
- **WireMock**: HTTP service mocking

#### Code Quality
- **Checkstyle**: Code style enforcement
- **SpotBugs**: Static code analysis
- **JaCoCo**: Code coverage analysis
- **SonarQube**: Code quality metrics

## Configuration Management

### Configuration Structure
The service uses Dropwizard's YAML-based configuration system with environment-specific files:

```
passkey-reglink-service/configs/
├── dev.yaml          # Development environment
├── alpha.yaml        # Alpha testing environment
├── pr50.yaml         # Production-like testing
└── prod.yaml         # Production environment
```

### Key Configuration Sections

#### Server Configuration
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081
```

#### External Service Endpoints
```yaml
clients:
  bridgeService:
    baseUrl: "https://passkey-bridge-service.{env}.cvent.com"
    timeout: 30s
    retries: 3
  reservationService:
    baseUrl: "https://passkey-reservation-service.{env}.cvent.com"
    timeout: 45s
    retries: 2
```

#### Authentication Configuration
```yaml
auth:
  imsEnv: "alpha"
  tokenValidation:
    enabled: true
    cacheTtl: 300s
```

#### Logging Configuration
```yaml
logging:
  level: INFO
  loggers:
    com.cvent.passkey.reglink: DEBUG
    org.apache.http: WARN
  appenders:
    - type: console
      threshold: INFO
      target: stdout
```

### Environment Variables
- `ENV`: Environment identifier (dev, alpha, pr50, prod)
- `SERVICE_PORT`: Override default service port
- `LOG_LEVEL`: Override default logging level
- `AUTH_ENABLED`: Enable/disable authentication (dev only)

## Database Schema

### Data Storage Strategy
The service primarily acts as an orchestration layer and does not maintain significant persistent state. Most data is stored in downstream services with minimal local caching.

### Local Storage (if applicable)
- **Configuration Cache**: Temporary storage for service configurations
- **Session Data**: Short-term session information
- **Audit Logs**: Request/response audit trail

## API Design Patterns

### RESTful Design
- **Resource-based URLs**: `/v1/reservations/{id}`
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Status Codes**: Proper HTTP status code usage
- **Content Negotiation**: JSON as primary format

### Request/Response Patterns
- **Consistent Error Format**: Standardized error response structure
- **Pagination**: Cursor-based pagination for list endpoints
- **Filtering**: Query parameter-based filtering
- **Sorting**: Configurable result ordering

### Validation Strategy
- **Bean Validation**: JSR-303 annotations for request validation
- **Custom Validators**: Business rule validation
- **Error Aggregation**: Multiple validation errors in single response

## Monitoring & Observability

### Metrics Collection
```java
// Dropwizard Metrics integration
@Timed(name = "reservation-creation-time")
@Metered(name = "reservation-creation-rate")
@ExceptionMetered(name = "reservation-creation-errors")
public Response createReservation(CreateReservationRequest request) {
    // Implementation
}
```

### Health Checks
```java
public class ExternalServiceHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check external service connectivity
        return Result.healthy("Service is responding");
    }
}
```

### Distributed Tracing
- **API Platform Tracing**: Request correlation across services
- **Trace Headers**: X-Trace-Id propagation
- **Span Creation**: Automatic span creation for external calls

### Logging Strategy
- **Structured Logging**: JSON-formatted log entries
- **Correlation IDs**: Request tracking across service boundaries
- **Log Levels**: Appropriate log level usage
- **Sensitive Data**: PII masking in logs

## Performance Considerations

### Connection Pooling
```yaml
clients:
  connectionPool:
    maxConnections: 100
    maxConnectionsPerRoute: 20
    connectionTimeout: 5s
    socketTimeout: 30s
    connectionRequestTimeout: 10s
```

### Caching Strategy
- **HTTP Client Caching**: Response caching for static data
- **Configuration Caching**: Service configuration caching
- **Token Caching**: Authentication token caching

### Timeout Configuration
- **Service Calls**: Appropriate timeouts for external services
- **Circuit Breakers**: Fail-fast patterns for unreliable services
- **Retry Logic**: Exponential backoff for transient failures

## Security Implementation

### Authentication Flow
1. **Token Extraction**: Bearer token from Authorization header
2. **Token Validation**: Validate with auth service
3. **User Context**: Extract user information from token
4. **Authorization**: Check permissions for requested operation

### Security Headers
```java
@Override
public void filter(ContainerRequestContext requestContext,
                   ContainerResponseContext responseContext) {
    responseContext.getHeaders().add("X-Content-Type-Options", "nosniff");
    responseContext.getHeaders().add("X-Frame-Options", "DENY");
    responseContext.getHeaders().add("X-XSS-Protection", "1; mode=block");
}
```

### Input Validation
- **Request Validation**: Bean Validation annotations
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Output encoding
- **CSRF Protection**: Token-based CSRF protection

## Build & Deployment

### Maven Build Profiles
```xml
<profiles>
    <profile>
        <id>release</id>
        <!-- Production build configuration -->
    </profile>
    <profile>
        <id>coverage</id>
        <!-- Code coverage analysis -->
    </profile>
    <profile>
        <id>run-it</id>
        <!-- Integration test execution -->
    </profile>
</profiles>
```

### Docker Configuration
```dockerfile
FROM openjdk:21-jre-slim
COPY target/passkey-reglink-service-*.jar app.jar
EXPOSE 8080 8081
ENTRYPOINT ["java", "-jar", "/app.jar", "server", "/config.yaml"]
```

### Build Commands
```bash
# Standard build
mvn clean package -Prelease

# With code coverage
mvn clean package -Pcoverage

# Integration tests
mvn clean verify -Prun-it -Dkarate.env=dev
```

## Error Handling

### Exception Hierarchy
```java
public class ReglinkException extends RuntimeException {
    private final String errorCode;
    private final Map<String, Object> details;
}

public class ReservationNotFoundException extends ReglinkException {
    public ReservationNotFoundException(String reservationId) {
        super("RESERVATION_NOT_FOUND", "Reservation not found: " + reservationId);
    }
}
```

### Exception Mappers
```java
@Provider
public class ReglinkExceptionMapper implements ExceptionMapper<ReglinkException> {
    @Override
    public Response toResponse(ReglinkException exception) {
        return Response.status(exception.getHttpStatus())
                      .entity(createErrorResponse(exception))
                      .build();
    }
}
```

## Testing Strategy

### Unit Testing
- **Coverage Target**: 80% line coverage minimum
- **Mock Strategy**: Mock external dependencies
- **Test Organization**: Test classes mirror source structure

### Integration Testing
- **Karate Framework**: API-level integration tests
- **Test Environments**: Dedicated test environments
- **Data Management**: Test data setup and cleanup

### Contract Testing
- **API Contracts**: OpenAPI specification validation
- **Client Contracts**: Consumer-driven contract testing
- **Backward Compatibility**: API versioning strategy

## Deployment Architecture

### Container Orchestration
- **Kubernetes**: Container orchestration platform
- **Docker**: Containerization technology
- **Helm Charts**: Kubernetes deployment templates

### Service Discovery
- **Kubernetes Services**: Internal service discovery
- **External DNS**: External service resolution
- **Load Balancing**: Kubernetes ingress controllers

### Configuration Management
- **ConfigMaps**: Kubernetes configuration management
- **Secrets**: Sensitive configuration data
- **Environment Variables**: Runtime configuration