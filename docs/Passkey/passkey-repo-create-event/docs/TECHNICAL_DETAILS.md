# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 17
- **Build Tool**: Apache Maven 3.6+
- **Packaging**: JAR with embedded Jetty server
- **Architecture**: Multi-module Maven project

### Web Layer
- **REST Framework**: JAX-RS (Jersey implementation)
- **JSON Processing**: Jackson 2.x
- **Validation**: Jakarta Bean Validation (Hibernate Validator)
- **HTTP Server**: Embedded Jetty
- **Content Types**: JSON (primary), XML (legacy support)

### Security & Authentication
- **Authentication**: Cvent Auth Service integration
- **Authorization**: Role-based access control (RBAC)
- **API Security**: API Key authentication
- **Transport Security**: HTTPS/TLS 1.2+

### Observability & Monitoring
- **Metrics**: Dropwizard Metrics + Cvent Observability
- **Logging**: SLF4J with Logback
- **Health Checks**: Dropwizard Health Checks
- **Tracing**: Distributed tracing support
- **APM**: Datadog integration

## Dependencies

### Core Dependencies

```xml
<!-- Cvent Platform -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-bom</artifactId>
    <version>53.1.0</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>

<!-- Dropwizard Framework -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-dropwizard</artifactId>
    <version>53.1.0</version>
</dependency>

<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>16.0.2</version>
</dependency>

<!-- Observability -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-observability</artifactId>
    <version>53.1.0</version>
</dependency>
```

### Passkey Service Clients

```xml
<!-- Business Text Service -->
<dependency>
    <groupId>com.cvent.passkey-business-text</groupId>
    <artifactId>passkey-business-text-java-client</artifactId>
    <version>1.0.37</version>
</dependency>

<!-- Event Housing Service -->
<dependency>
    <groupId>com.cvent.passkey-event-housing</groupId>
    <artifactId>passkey-event-housing-java-client</artifactId>
    <version>1.4.4</version>
</dependency>

<!-- Event Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-event-java-client</artifactId>
    <version>1.3.1</version>
</dependency>

<!-- Inventory Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-inventory-java-client</artifactId>
    <version>1.3.14</version>
</dependency>

<!-- Smart Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-smartcamp-cfg-data-java-client</artifactId>
    <version>1.5.0</version>
</dependency>
```

### Utility Dependencies

```xml
<!-- Common Utilities -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.2</version>
</dependency>

<!-- Experiments Framework -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>experiments</artifactId>
    <version>8.3.0</version>
</dependency>

<!-- HTTP Client -->
<dependency>
    <groupId>com.squareup.retrofit</groupId>
    <artifactId>retrofit</artifactId>
    <version>1.9.0</version>
</dependency>
```

## Configuration

### Application Configuration

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
    com.cvent.passkey.createevent: DEBUG
    com.cvent.auth: INFO
  appenders:
    - type: console
      threshold: INFO
      target: stdout
      logFormat: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n"

# Authentication Configuration
auth:
  apiKeyValidation:
    enabled: true
    cacheSize: 1000
    cacheTtl: 300s

# External Service Configuration
externalServices:
  businessTextService:
    baseUrl: "https://passkey-business-text-service.${environment}.cvent.org"
    timeout: 30s
    retryAttempts: 3
  
  eventHousingService:
    baseUrl: "https://passkey-event-housing-service.${environment}.cvent.org"
    timeout: 30s
    retryAttempts: 3
  
  eventService:
    baseUrl: "https://passkey-event-service.${environment}.cvent.org"
    timeout: 30s
    retryAttempts: 3
  
  inventoryService:
    baseUrl: "https://passkey-inventory-service.${environment}.cvent.org"
    timeout: 30s
    retryAttempts: 3

# Metrics Configuration
metrics:
  reporters:
    - type: datadog
      host: localhost
      port: 8125
      prefix: passkey.create.event
      frequency: 30s

# Health Check Configuration
healthChecks:
  deadlockHealthCheck:
    enabled: true
  diskSpaceHealthCheck:
    enabled: true
    threshold: 99%
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Deployment environment (dev/staging/prod) | dev | Yes |
| `SERVICE_PORT` | HTTP service port | 8080 | No |
| `ADMIN_PORT` | Admin interface port | 8081 | No |
| `LOG_LEVEL` | Logging level | INFO | No |
| `AUTH_SERVICE_URL` | Auth service base URL | - | Yes |
| `DATADOG_AGENT_HOST` | Datadog agent hostname | localhost | No |
| `DATADOG_AGENT_PORT` | Datadog agent port | 8125 | No |

### Configuration Classes

#### PasskeyCreateEventServiceConfiguration
```java
public class PasskeyCreateEventServiceConfiguration extends Configuration {
    @Valid
    @NotNull
    @JsonProperty("auth")
    private AuthConfiguration authConfiguration;
    
    @Valid
    @NotNull
    @JsonProperty("externalServices")
    private ExternalServicesConfiguration externalServicesConfiguration;
    
    @Valid
    @JsonProperty("metrics")
    private MetricsConfiguration metricsConfiguration;
    
    // Getters and setters...
}
```

## Build Configuration

### Maven Configuration

The project uses a multi-module Maven structure with the following key configurations:

#### Root POM Properties
```xml
<properties>
    <java.version>17</java.version>
    <revision>2.1.13-SNAPSHOT</revision>
    <mono-java.version>53.1.0</mono-java.version>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

#### Build Plugins
```xml
<plugins>
    <!-- Compiler Plugin -->
    <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.11.0</version>
        <configuration>
            <source>17</source>
            <target>17</target>
        </configuration>
    </plugin>
    
    <!-- Surefire Plugin (Unit Tests) -->
    <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.0.0</version>
    </plugin>
    
    <!-- Failsafe Plugin (Integration Tests) -->
    <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-failsafe-plugin</artifactId>
        <version>3.0.0</version>
    </plugin>
    
    <!-- JaCoCo Plugin (Code Coverage) -->
    <plugin>
        <groupId>org.jacoco</groupId>
        <artifactId>jacoco-maven-plugin</artifactId>
        <version>0.8.8</version>
        <configuration>
            <excludes>
                <exclude>**/PasskeyCreateEventServiceApplication.class</exclude>
                <exclude>**/PasskeyCreateEventServiceConfiguration.class</exclude>
                <exclude>**/Immutable*.class</exclude>
            </excludes>
        </configuration>
    </plugin>
    
    <!-- Shade Plugin (Fat JAR) -->
    <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-shade-plugin</artifactId>
        <version>3.4.1</version>
        <configuration>
            <createDependencyReducedPom>true</createDependencyReducedPom>
            <transformers>
                <transformer implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
                <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                    <mainClass>com.cvent.passkey.createevent.PasskeyCreateEventServiceApplication</mainClass>
                </transformer>
            </transformers>
        </configuration>
    </plugin>
</plugins>
```

### Build Profiles

#### Default Profile
```xml
<profile>
    <id>default</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <properties>
        <skipIntegrationTests>true</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-create-event-api</module>
        <module>passkey-create-event-shared</module>
        <module>passkey-create-event-data-access</module>
        <module>passkey-create-event-java-client</module>
        <module>passkey-create-event-service</module>
        <module>passkey-create-event-integration-test</module>
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
        <module>passkey-create-event-api</module>
        <module>passkey-create-event-java-client</module>
        <module>passkey-create-event-integration-test</module>
    </modules>
</profile>
```

## Database Schema

### Data Access Layer

The service uses a data access layer for persistence operations:

#### Repository Pattern
```java
public interface EventRepository {
    Optional<Event> findById(Long eventId);
    Event save(Event event);
    void delete(Long eventId);
    List<Event> findByOrganizationId(Long organizationId);
}

@Repository
public class EventRepositoryImpl implements EventRepository {
    // Implementation using appropriate data access technology
}
```

### Entity Relationships

The service manages the following key entity relationships:

- **Event** (1) -> **EventDetails** (1)
- **Event** (1) -> **Participants** (*)
- **Event** (1) -> **Commerce** (1)
- **Event** (1) -> **WebSetup** (1)
- **EventDetails** (1) -> **Address** (1)
- **Commerce** (1) -> **PaymentTypes** (*)

## Monitoring & Logging

### Metrics Collection

The service collects comprehensive metrics using Dropwizard Metrics:

#### Business Metrics
- Event creation rate
- Event cancellation rate
- API response times
- Error rates by endpoint
- External service call latencies

#### System Metrics
- JVM memory usage
- Garbage collection statistics
- Thread pool utilization
- HTTP connection pool metrics

#### Custom Metrics
```java
@Timed(name = "create-event-timer")
@ExceptionMetered(name = "create-event-errors")
public Response createDefaultEvent(DefaultEvent defaultEvent) {
    // Implementation
}
```

### Logging Configuration

#### Structured Logging
```java
@EnableLogContext
public class CreateEventResource {
    private static final Logger logger = LoggerFactory.getLogger(CreateEventResource.class);
    
    public Response createEvent(DefaultEvent event) {
        logger.info("Creating event: eventName={}, organizationId={}", 
                   event.getEventName(), event.getOrganizationId());
        // Implementation
    }
}
```

#### Log Correlation
- Request correlation IDs
- User context propagation
- Distributed tracing integration
- Structured log format (JSON)

### Health Checks

#### Built-in Health Checks
```java
public class ExternalServiceHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check external service connectivity
        return Result.healthy("All external services are accessible");
    }
}
```

#### Custom Health Checks
- Database connectivity
- External service availability
- Cache health
- Disk space monitoring

## Performance Considerations

### Caching Strategy
- API response caching for frequently accessed data
- External service response caching
- Configuration caching
- Cache invalidation strategies

### Connection Pooling
- HTTP client connection pooling
- Database connection pooling
- Configurable pool sizes and timeouts

### Async Processing
- Non-blocking I/O where appropriate
- Async external service calls
- Event-driven processing for long-running operations

### Resource Management
- Proper resource cleanup
- Connection timeout configuration
- Memory usage optimization
- Garbage collection tuning

## Security Considerations

### Input Validation
- Comprehensive request validation
- SQL injection prevention
- XSS protection
- Input sanitization

### Authentication & Authorization
- API key validation
- Role-based access control
- Request signing verification
- Token expiration handling

### Data Protection
- Sensitive data encryption
- PII handling compliance
- Audit logging
- Secure communication (HTTPS)

### Error Handling
- Secure error messages
- Information disclosure prevention
- Proper exception handling
- Security event logging