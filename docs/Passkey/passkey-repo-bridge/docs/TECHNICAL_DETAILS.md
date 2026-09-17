# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Database**: PostgreSQL (inferred from typical Cvent stack)
- **Authentication**: Cvent Auth Service
- **Testing**: JUnit 5, Karate for integration tests
- **Containerization**: Docker

## Dependencies

### Core Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
</dependency>

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

<!-- Validation -->
<dependency>
    <groupId>jakarta.validation</groupId>
    <artifactId>jakarta.validation-api</artifactId>
</dependency>

<!-- JSON Processing -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>

<!-- Immutable Objects -->
<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
</dependency>
```

### Testing Dependencies
```xml
<!-- Unit Testing -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>

<!-- Integration Testing -->
<dependency>
    <groupId>com.intuit.karate</groupId>
    <artifactId>karate-junit5</artifactId>
    <scope>test</scope>
</dependency>

<!-- Mocking -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>test</scope>
</dependency>
```

## Configuration

### Environment Variables
- `DATABASE_URL`: Database connection string
- `DATABASE_USERNAME`: Database username
- `DATABASE_PASSWORD`: Database password
- `AUTH_SERVICE_URL`: Auth service endpoint
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARN, ERROR)
- `SERVER_PORT`: HTTP server port (default: 8080)
- `ADMIN_PORT`: Admin interface port (default: 8081)

### Configuration Files
- `configs/dev.yaml`: Development environment configuration
- `configs/staging.yaml`: Staging environment configuration
- `configs/prod.yaml`: Production environment configuration

### Sample Configuration Structure
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
  url: ${DATABASE_URL}
  user: ${DATABASE_USERNAME}
  password: ${DATABASE_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
  minSize: 8
  maxSize: 32

auth:
  serviceUrl: ${AUTH_SERVICE_URL}
  timeout: 5s

logging:
  level: ${LOG_LEVEL:-INFO}
  appenders:
    - type: console
      threshold: INFO
      target: stdout
    - type: file
      threshold: INFO
      currentLogFilename: logs/passkey-bridge-service.log
      archivedLogFilenamePattern: logs/passkey-bridge-service-%d.log.gz
      archivedFileCount: 7
```

## Database Schema

### Tables
- `registrations`: Core registration data
- `reg_associations`: Registration-reservation associations
- `audit_log`: Change tracking and audit trail

### Key Indexes
- `idx_registrations_reg_number`: Unique index on registration number
- `idx_registrations_event_id`: Index on event ID for reporting
- `idx_associations_reg_number`: Index on registration number
- `idx_associations_conf_number`: Index on confirmation number

## Build Configuration

### Maven Profiles
- **default**: Standard build with unit tests
- **release**: Production build with optimizations
- **coverage**: Build with code coverage reporting
- **run-it**: Integration test execution

### Build Commands
```bash
# Standard build
mvn clean package

# Release build
mvn clean package -Prelease

# With code coverage
mvn clean package -Pcoverage

# Integration tests
mvn clean verify -Prun-it -Dkarate.env=dev
```

## Monitoring & Logging

### Application Performance Monitoring
- **Datadog APM**: Distributed tracing and performance monitoring
- **Custom Metrics**: Business metrics for registration counts and API usage
- **Health Checks**: Built-in Dropwizard health checks

### Logging Configuration
- **Structured Logging**: JSON format for log aggregation
- **Log Context**: Request correlation IDs for tracing
- **Log Levels**: Configurable per environment
- **Log Rotation**: Daily rotation with 7-day retention

### Key Metrics
- Registration creation rate
- Association success rate
- API response times
- Database connection pool usage
- Error rates by endpoint

## Security

### Authentication
- API key-based authentication via Auth Service
- JWT token validation for internal service calls
- Request signing for sensitive operations

### Data Protection
- Credit card number masking in logs and responses
- PII data encryption at rest
- Secure configuration management

### Network Security
- HTTPS only for all external communication
- Internal service mesh for service-to-service communication
- Network segmentation and firewall rules

## Performance Considerations

### Database Optimization
- Connection pooling with HikariCP
- Query optimization and proper indexing
- Read replicas for reporting queries

### Caching Strategy
- Application-level caching for frequently accessed data
- Redis for distributed caching (if implemented)
- HTTP caching headers for appropriate endpoints

### Scalability
- Stateless service design for horizontal scaling
- Database connection pool sizing
- Async processing for non-critical operations

## Code Quality

### Static Analysis
- SonarQube integration for code quality metrics
- Checkstyle for code formatting standards
- SpotBugs for bug detection

### Test Coverage
- Minimum 80% code coverage requirement
- Unit tests for all business logic
- Integration tests for API endpoints
- Contract testing with consumer services

### Code Standards
- Google Java Style Guide
- Immutable objects where possible
- Comprehensive JavaDoc documentation
- Dependency injection best practices