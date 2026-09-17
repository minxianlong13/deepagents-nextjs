# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Parent POM**: Cvent Maven Parent 57.4.8

### Key Dependencies

#### Dropwizard Ecosystem
```xml
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
</dependency>
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-auth</artifactId>
</dependency>
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-client</artifactId>
</dependency>
```

#### Authentication & Security
```xml
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>28.4.1</version>
</dependency>
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>28.4.1</version>
</dependency>
```

#### XML Processing
```xml
<dependency>
    <groupId>org.glassfish.jaxb</groupId>
    <artifactId>jaxb-runtime</artifactId>
    <version>4.0.6</version>
</dependency>
```

#### Logging & Monitoring
```xml
<dependency>
    <groupId>com.cvent.passkey-transfer-log</groupId>
    <artifactId>passkey-transfer-log-java-client</artifactId>
    <version>1.10.3</version>
</dependency>
```

#### Testing Framework
```xml
<dependency>
    <groupId>com.intuit.karate</groupId>
    <artifactId>karate-junit5</artifactId>
    <scope>test</scope>
</dependency>
```

## Project Structure

### Multi-Module Maven Architecture
```
passkey-hilton-converter/
├── pom.xml                                    # Parent POM
├── passkey-hilton-converter-api/              # API contracts and models
│   ├── src/main/java/
│   │   └── com/cvent/passkeyhiltonconverter/model/
│   │       ├── hilton/                        # Hilton-specific models
│   │       ├── legacy/                        # Legacy model support
│   │       ├── MessageLog.java                # Audit logging model
│   │       └── Result.java                    # Response wrapper
│   └── pom.xml
├── passkey-hilton-converter-service/          # Main service implementation
│   ├── src/main/java/
│   │   └── com/cvent/passkeyhiltonconverter/
│   │       ├── PasskeyHiltonConverterServiceApplication.java
│   │       ├── PasskeyHiltonConverterServiceConfiguration.java
│   │       ├── resources/                     # JAX-RS resources
│   │       ├── services/                      # Business logic
│   │       ├── clients/                       # External service clients
│   │       ├── model/                         # Service-specific models
│   │       ├── exceptions/                    # Custom exceptions
│   │       └── health/                        # Health checks
│   ├── src/main/resources/
│   │   └── configs/                           # Environment configurations
│   └── pom.xml
├── passkey-hilton-converter-java-client/      # Java client library
├── passkey-hilton-converter-integration-test/ # Karate integration tests
└── Dockerfile                                 # Container definition
```

### Package Organization

#### Resource Layer (`resources/`)
- **PasskeyHiltonConverterResource**: Main API endpoint
- **PasskeyHiltonLoggingResource**: Logging endpoint
- JAX-RS annotations for REST API definition
- Request/response handling and validation

#### Service Layer (`services/`)
- **StayRecordOrchestrator**: Main business logic orchestration
- **HiltonToPasskeyTransformationService**: Core transformation logic
- **CallService**: External service communication
- Business rule implementation and workflow management

#### Client Layer (`clients/`)
- HTTP clients for external service communication
- Connection pooling and retry logic
- Request/response serialization

#### Model Layer (`model/`)
- Configuration classes (`PasskeyAPIConfig`, `PasskeyServiceConfig`)
- Internal data transfer objects
- Validation annotations

## Configuration Management

### Environment-Specific Configuration
Configuration files located in `passkey-hilton-converter-service/configs/`:
- `dev.yaml` - Local development
- `ci.yaml` - Continuous integration
- `alpha.yaml` - Alpha environment
- `ts50.yaml` - Test environment
- `it50.yaml` - Integration test environment
- `pr50.yaml` - Production environment

### Configuration Structure
```yaml
# Example configuration structure
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
    com.cvent.passkeyhiltonconverter: DEBUG
  appenders:
    - type: console
    - type: file
      currentLogFilename: ./logs/application.log

passkeyApi:
  baseUrl: ${PASSKEY_API_BASE_URL}
  username: ${PASSKEY_API_USERNAME}
  password: ${PASSKEY_API_PASSWORD}
  timeout: 30s
  connectionTimeout: 10s

auth:
  baseUrl: ${AUTH_SERVICE_BASE_URL}
  timeout: 5s
```

### Secret Management
Secrets managed through Jenkins parameter store:
- `__STAGING_HILTON_CONVERTER_API_USER_PASSWORD__`
- `__PRODUCTION_HILTON_CONVERTER_API_USER_PASSWORD__`

Environment variables injected at runtime:
- `PASSKEY_API_BASE_URL`
- `PASSKEY_API_USERNAME`
- `PASSKEY_API_PASSWORD`
- `AUTH_SERVICE_BASE_URL`

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
        <skipIntegrationTests>true</skipIntegrationTests>
        <skipITs>true</skipITs>
        <skipLoadTests>true</skipLoadTests>
    </properties>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <checkstyle.skip>true</checkstyle.skip>
        <skipITs>false</skipITs>
        <skipTests>true</skipTests>
        <skipLoadTests>true</skipLoadTests>
    </properties>
</profile>
```

#### Release Profile
```xml
<profile>
    <id>release</id>
    <properties>
        <maven.test.skip>false</maven.test.skip>
        <checkstyle.skip>false</checkstyle.skip>
    </properties>
</profile>
```

### Build Commands
```bash
# Standard build
mvn clean package

# Release build with all checks
mvn clean package -Prelease

# Integration tests only
mvn clean verify -Prun-it -Dkarate.env=dev

# Code coverage report
mvn clean package -Pcoverage
mvn jacoco:report -Pcoverage
```

## Code Quality & Analysis

### Static Analysis Tools

#### Checkstyle
- **Configuration**: Cvent standard checkstyle rules
- **Execution**: Runs during compile phase
- **Skip**: `-Dcheckstyle.skip=true`

#### FindBugs/SpotBugs
- **Configuration**: `findbugs-exclude.xml`
- **Exclusions**: Generated code and configuration classes
- **Integration**: Maven plugin execution

#### SonarQube
- **Coverage Exclusions**: 
  - API module classes
  - Java client classes
  - Integration test classes
  - Application and configuration classes
  - Main transformation service (business decision)

```xml
<sonar.coverage.exclusions>
    passkey-hilton-converter-api/**,
    passkey-hilton-converter-java-client/**,
    passkey-hilton-converter-integration-test/**,
    passkey-hilton-converter-service/src/main/java/com/cvent/passkeyhiltonconverter/PasskeyHiltonConverterServiceApplication.java,
    passkey-hilton-converter-service/src/main/java/com/cvent/passkeyhiltonconverter/PasskeyHiltonConverterServiceConfiguration.java,
    passkey-hilton-converter-service/src/main/java/com/cvent/passkeyhiltonconverter/services/HiltonToPasskeyTransformationService.java
</sonar.coverage.exclusions>
```

### Code Coverage
- **Tool**: JaCoCo Maven Plugin
- **Target**: 80% line coverage (excluding specified classes)
- **Reports**: HTML reports generated in `target/site/jacoco/`
- **CI Integration**: Coverage reports sent to SonarQube

## Testing Strategy

### Unit Testing
- **Framework**: JUnit 5
- **Mocking**: Mockito
- **Coverage**: JaCoCo integration
- **Location**: `src/test/java/`

### Integration Testing
- **Framework**: Karate
- **Location**: `passkey-hilton-converter-integration-test/`
- **Features**: API contract testing, end-to-end scenarios
- **Environments**: Environment-specific test configurations

#### Karate Test Structure
```
passkey-hilton-converter-integration-test/
├── src/test/java/
│   └── com/cvent/passkeyhiltonconverter/
│       └── KarateTestIT.java              # Test runner
└── src/test/resources/
    ├── karate-config.js                   # Global configuration
    ├── features/                          # Feature files
    │   ├── converter.feature              # Main API tests
    │   └── logging.feature                # Logging API tests
    └── data/                              # Test data files
```

### Load Testing
- **Framework**: Custom load testing setup
- **Profile**: `skipLoadTests` property controls execution
- **Integration**: Part of CI/CD pipeline for performance validation

## Monitoring & Observability

### Logging Framework
- **Framework**: Logback (via Dropwizard)
- **Format**: JSON structured logging
- **Correlation**: Request correlation IDs
- **Context**: `@EnableLogContext` annotation for automatic context

### Metrics Collection
- **Framework**: Dropwizard Metrics
- **Types**: Counters, timers, gauges, histograms
- **Endpoints**: `/metrics` endpoint for Prometheus scraping
- **Custom Metrics**: Business-specific metrics for transformation operations

### Health Checks
- **Framework**: Dropwizard Health Checks
- **Endpoint**: `/healthcheck`
- **Checks**: Database connectivity, external service availability
- **Custom Checks**: Passkey API connectivity, auth service availability

### External Monitoring
- **APM**: Datadog Application Performance Monitoring
- **Logs**: Centralized logging via Datadog
- **Alerts**: Automated alerting for service health and performance
- **Dashboards**: Real-time monitoring dashboards

## Security Considerations

### Authentication
- **Method**: API Key-based authentication
- **Integration**: Cvent auth-service
- **Validation**: Per-request API key validation
- **Caching**: Short-term caching of validation results

### Data Security
- **In Transit**: HTTPS/TLS encryption for all external communication
- **At Rest**: No persistent data storage (stateless service)
- **Logging**: Sensitive data masking in log outputs
- **Configuration**: Encrypted secrets in parameter store

### Input Validation
- **JSON Schema**: Request payload validation
- **Business Rules**: Domain-specific validation rules
- **Sanitization**: Input sanitization to prevent injection attacks
- **Error Handling**: Secure error messages without sensitive information

## Performance Optimization

### Connection Management
- **HTTP Clients**: Connection pooling for external service calls
- **Timeouts**: Configurable connection and read timeouts
- **Retry Logic**: Exponential backoff for transient failures

### Memory Management
- **JVM Settings**: Optimized heap and garbage collection settings
- **Object Pooling**: Reuse of expensive objects where appropriate
- **Streaming**: Streaming processing for large payloads

### Caching Strategy
- **Configuration**: Application configuration cached at startup
- **API Keys**: Short-term caching of authentication results
- **External Data**: Caching of frequently accessed external data

## Deployment Artifacts

### JAR Packaging
- **Type**: Executable JAR with embedded Jetty
- **Size**: Optimized with dependency management
- **Configuration**: External configuration files packaged separately

### Docker Container
- **Base Image**: `docker.cvent.net/cvent-jre:11.0.4.11`
- **Multi-stage Build**: Separate build and runtime stages
- **Size Optimization**: Minimal runtime dependencies
- **Security**: Non-root user execution

### Configuration Packaging
- **Configs**: Environment-specific configuration files
- **Secrets**: Runtime secret injection
- **Flexibility**: Override capability for deployment-specific settings