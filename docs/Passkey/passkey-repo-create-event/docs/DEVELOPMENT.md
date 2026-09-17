# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK 17 or Oracle JDK 17
- **Maven 3.6+**: Apache Maven for build management
- **Docker**: For containerization and local testing
- **Git**: Version control system
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Development Tools
- **Postman/Insomnia**: API testing
- **Docker Desktop**: Container management
- **Kubernetes CLI (kubectl)**: For local Kubernetes development
- **Datadog Agent**: Local metrics collection (optional)

### Access Requirements
- **Cvent VPN**: Access to internal services and repositories
- **Maven Repository**: Access to Cvent's internal Nexus repository
- **GitHub Access**: Read access to cvent-internal organization
- **Service Registry**: Access to Cvent's service registry

## Local Setup

### 1. Repository Setup

#### Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-create-event.git
cd passkey-create-event
```

#### Configure Maven
Ensure your `~/.m2/settings.xml` includes Cvent's repository configuration:

```xml
<settings>
  <servers>
    <server>
      <id>cvent-nexus</id>
      <username>your-username</username>
      <password>your-password</password>
    </server>
  </servers>
  
  <profiles>
    <profile>
      <id>cvent</id>
      <repositories>
        <repository>
          <id>cvent-nexus</id>
          <url>https://nexus.core.cvent.org/repository/maven-public/</url>
        </repository>
      </repositories>
    </profile>
  </profiles>
  
  <activeProfiles>
    <activeProfile>cvent</activeProfile>
  </activeProfiles>
</settings>
```

### 2. Build the Project

#### Full Build
```bash
# Clean and build all modules
mvn clean install

# Build with release profile (recommended for local testing)
mvn clean package -Prelease
```

#### Module-Specific Build
```bash
# Build only the service module
mvn clean package -pl passkey-create-event-service -am

# Build API and client modules
mvn clean package -pl passkey-create-event-api,passkey-create-event-java-client -am
```

### 3. IDE Configuration

#### IntelliJ IDEA Setup

##### Import Project
1. Open IntelliJ IDEA
2. File → Open → Select the project root directory
3. Choose "Import as Maven project"
4. Wait for dependency resolution

##### Run Configuration
Create a new Application run configuration:

| Property | Value |
|----------|-------|
| **Main Class** | `com.cvent.passkey.createevent.PasskeyCreateEventServiceApplication` |
| **Program Arguments** | `server passkey-create-event-service/configs/dev.yaml` |
| **VM Options** | `-Dlogback.configurationFile=passkey-create-event-service/configs/dev.logback.xml` |
| **Working Directory** | `$MODULE_WORKING_DIR$` |
| **Use Classpath of Module** | `passkey-create-event-service` |
| **JRE** | Java 17 |

##### Code Style
Import Cvent's code style configuration:
1. File → Settings → Editor → Code Style
2. Import Scheme → IntelliJ IDEA code style XML
3. Select `cvent-java-style.xml` (if available in the repository)

#### Eclipse Setup
1. File → Import → Existing Maven Projects
2. Select the project root directory
3. Import all modules
4. Configure Java Build Path to use Java 17

### 4. Local Development Environment

#### Environment Configuration
Create a local development configuration file:

```yaml
# passkey-create-event-service/configs/local.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.createevent: DEBUG
    com.cvent.auth: INFO
    org.eclipse.jetty: INFO

# External service URLs (point to dev environment)
externalServices:
  businessTextService:
    baseUrl: "https://passkey-business-text-service.dev.cvent.org"
    timeout: 30s
    retryAttempts: 3
  
  eventHousingService:
    baseUrl: "https://passkey-event-housing-service.dev.cvent.org"
    timeout: 30s
    retryAttempts: 3
  
  eventService:
    baseUrl: "https://passkey-event-service.dev.cvent.org"
    timeout: 30s
    retryAttempts: 3
  
  inventoryService:
    baseUrl: "https://passkey-inventory-service.dev.cvent.org"
    timeout: 30s
    retryAttempts: 3

# Authentication configuration
auth:
  apiKeyValidation:
    enabled: false  # Disable for local development
    
# Metrics (optional for local development)
metrics:
  reporters: []
```

## Running the Service

### 1. Local Execution

#### Command Line
```bash
cd passkey-create-event-service

# Run with development configuration
java -jar target/passkey-create-event-service-2.1.13-SNAPSHOT.jar server configs/dev.yaml

# Run with local configuration
java -jar target/passkey-create-event-service-2.1.13-SNAPSHOT.jar server configs/local.yaml

# Run with debug logging
java -Dlogback.configurationFile=configs/dev.logback.xml \
     -jar target/passkey-create-event-service-2.1.13-SNAPSHOT.jar \
     server configs/local.yaml
```

#### IDE Execution
Use the run configuration created in the IDE setup section.

### 2. Docker Execution

#### Build Docker Image
```bash
# Build the Docker image
docker build -t passkey-create-event-service:local .

# Run the container
docker run -p 8080:8080 -p 8081:8081 \
  -e ENVIRONMENT=dev \
  passkey-create-event-service:local
```

#### Docker Compose (Optional)
Create a `docker-compose.yml` for local development:

```yaml
version: '3.8'
services:
  passkey-create-event-service:
    build: .
    ports:
      - "8080:8080"
      - "8081:8081"
    environment:
      - ENVIRONMENT=dev
    volumes:
      - ./passkey-create-event-service/configs:/usr/src/configs
```

### 3. Verify Service is Running

#### Health Check
```bash
# Check service health
curl http://localhost:8081/healthcheck

# Expected response: {"status":"UP"}
```

#### Admin Interface
Visit `http://localhost:8081` in your browser to access:
- Health checks
- Metrics
- Configuration
- Thread dumps

## Running Tests

### Unit Tests

#### All Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

#### Specific Test Classes
```bash
# Run specific test class
mvn test -Dtest=CreateEventResourceTest

# Run specific test method
mvn test -Dtest=CreateEventResourceTest#testCreateDefaultEvent
```

### Integration Tests

#### Setup Integration Tests
Integration tests use the Karate framework and require the service to be running.

#### Run All Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev -Dspotbugs.skip=true verify

# Run integration tests against local service
mvn -Prun-it -Denv.IT_ENVIRONMENT=local -Dspotbugs.skip=true verify
```

#### Run Specific Integration Tests
```bash
# Run specific test by tag
mvn -Prun-it -Dkarate.tags="@create-default-event" -Denv.IT_ENVIRONMENT=dev verify

# Run specific feature file
mvn -Prun-it -Dkarate.options="--tags @create-bundle-event" -Denv.IT_ENVIRONMENT=dev verify
```

#### IntelliJ Integration Test Setup
1. Install the Karate plugin
2. Right-click on a feature file
3. Select "Run Feature"
4. Add VM options: `-Dkarate.env=dev -Dkarate.config.dir=test_configs`

### Test Configuration

#### Karate Configuration
```javascript
// karate-config.js
function fn() {
  var env = karate.env || 'dev';
  var config = {
    baseUrl: 'https://passkey-create-event-service.' + env + '.cvent.org',
    apiKey: 'test-api-key-' + env
  };
  
  if (env === 'local') {
    config.baseUrl = 'http://localhost:8080';
    config.apiKey = 'local-test-key';
  }
  
  return config;
}
```

## Code Structure

### Package Organization

```
com.cvent.passkey.createevent/
├── resources/                    # JAX-RS REST endpoints
│   ├── CreateEventResource.java
│   ├── CancelEventResource.java
│   ├── AdminResource.java
│   └── AffiliateResource.java
├── services/                     # Business logic services
│   ├── CreateEventService.java
│   ├── CreateBundleEventService.java
│   ├── CreateCopyEventService.java
│   └── CancelEventService.java
├── automation/                   # Automation and workflow logic
├── exceptions/                   # Custom exception classes
├── health/                       # Health check implementations
├── initContext/                  # Initialization context
├── logging/                      # Logging utilities
├── util/                         # Utility classes
└── validation/                   # Validation logic
```

### Module Dependencies

```
passkey-create-event-service
├── passkey-create-event-api      # API contracts and models
├── passkey-create-event-shared   # Shared utilities
└── passkey-create-event-data-access  # Data access layer

passkey-create-event-java-client  # Client library (independent)

passkey-create-event-integration-test  # Integration tests
├── passkey-create-event-api
└── passkey-create-event-java-client
```

## Coding Standards

### Java Code Style

#### Naming Conventions
- **Classes**: PascalCase (e.g., `CreateEventService`)
- **Methods**: camelCase (e.g., `createDefaultEvent`)
- **Variables**: camelCase (e.g., `eventDetails`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Packages**: lowercase with dots (e.g., `com.cvent.passkey.createevent`)

#### Code Formatting
```java
// Class structure
public class CreateEventService {
    private static final Logger logger = LoggerFactory.getLogger(CreateEventService.class);
    
    private final ExternalServiceClient externalServiceClient;
    
    public CreateEventService(ExternalServiceClient externalServiceClient) {
        this.externalServiceClient = externalServiceClient;
    }
    
    public Optional<URI> createDefaultEvent(DefaultEvent defaultEvent) {
        logger.info("Creating default event: {}", defaultEvent.getEventName());
        
        try {
            // Implementation
            return Optional.of(createdEventUri);
        } catch (Exception e) {
            logger.error("Failed to create event", e);
            return Optional.empty();
        }
    }
}
```

#### Documentation Standards
```java
/**
 * Creates a new Passkey event based on the provided event details.
 * 
 * @param defaultEvent the event details including name, dates, and configuration
 * @return Optional containing the URI of the created event, or empty if creation failed
 * @throws ValidationException if the event data is invalid
 * @throws ServiceException if external service calls fail
 */
public Optional<URI> createDefaultEvent(DefaultEvent defaultEvent) {
    // Implementation
}
```

### REST API Standards

#### Endpoint Design
```java
@Path("passkey-create-event/v1")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class CreateEventResource {
    
    @POST
    @Timed(name = "create-default-event")
    @ExceptionMetered(name = "create-default-event-errors")
    public Response createDefaultEvent(
            @Authority(methods = AuthMethod.API_KEY) GrantedAPIKey apiKey,
            @Valid @NotNull DefaultEvent defaultEvent) {
        // Implementation
    }
}
```

#### Response Standards
```java
// Success response
return Response.status(Response.Status.ACCEPTED)
    .location(eventLocation)
    .build();

// Error response
return Response.status(Response.Status.BAD_REQUEST)
    .entity(ErrorResponse.builder()
        .error("VALIDATION_ERROR")
        .message("Invalid event data")
        .build())
    .build();
```

### Testing Standards

#### Unit Test Structure
```java
@ExtendWith(MockitoExtension.class)
class CreateEventServiceTest {
    
    @Mock
    private ExternalServiceClient mockExternalServiceClient;
    
    @InjectMocks
    private CreateEventService createEventService;
    
    @Test
    void shouldCreateDefaultEventSuccessfully() {
        // Given
        DefaultEvent defaultEvent = DefaultEvent.builder()
            .eventName("Test Event")
            .build();
        
        when(mockExternalServiceClient.createEvent(any()))
            .thenReturn(CompletableFuture.completedFuture(eventUri));
        
        // When
        Optional<URI> result = createEventService.createDefaultEvent(defaultEvent);
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(eventUri);
    }
}
```

#### Integration Test Structure
```gherkin
Feature: Create Default Event

  Background:
    * url baseUrl
    * header Authorization = 'Bearer ' + apiKey

  Scenario: Create a valid default event
    Given path 'passkey-create-event/v1'
    And request
      """
      {
        "eventName": "Test Conference 2024",
        "startDate": "2024-06-15T09:00:00Z",
        "endDate": "2024-06-17T17:00:00Z"
      }
      """
    When method POST
    Then status 202
    And match header Location contains '/events/'
```

## Common Development Tasks

### Adding a New Endpoint

#### 1. Define API Contract
Add request/response models to the API module:

```java
// In passkey-create-event-api module
public class NewEventRequest {
    @NotNull
    private String eventName;
    
    @NotNull
    private LocalDateTime startDate;
    
    // Getters and setters
}
```

#### 2. Implement Resource
Add the endpoint to the appropriate resource class:

```java
@POST
@Path("/new-endpoint")
@Timed(name = "new-endpoint-timer")
@ExceptionMetered(name = "new-endpoint-errors")
public Response newEndpoint(
        @Authority(methods = AuthMethod.API_KEY) GrantedAPIKey apiKey,
        @Valid @NotNull NewEventRequest request) {
    
    return service.processNewRequest(request)
        .map(result -> Response.ok(result).build())
        .orElse(Response.status(Response.Status.BAD_REQUEST).build());
}
```

#### 3. Implement Business Logic
Add service method:

```java
public Optional<NewEventResponse> processNewRequest(NewEventRequest request) {
    logger.info("Processing new request: {}", request.getEventName());
    
    try {
        // Business logic implementation
        return Optional.of(response);
    } catch (Exception e) {
        logger.error("Failed to process request", e);
        return Optional.empty();
    }
}
```

#### 4. Add Tests
Create unit and integration tests for the new functionality.

### Adding External Service Integration

#### 1. Define Client Interface
```java
public interface NewExternalServiceClient {
    CompletableFuture<ExternalServiceResponse> callExternalService(ExternalServiceRequest request);
}
```

#### 2. Implement Client
```java
@Component
public class NewExternalServiceClientImpl implements NewExternalServiceClient {
    
    private final RetrofitClient retrofitClient;
    
    @Override
    public CompletableFuture<ExternalServiceResponse> callExternalService(ExternalServiceRequest request) {
        return retrofitClient.callService(request);
    }
}
```

#### 3. Configure Client
Add configuration in the service configuration class and wire up in the application class.

### Debugging Tips

#### Common Issues

##### 1. Service Won't Start
```bash
# Check Java version
java -version

# Check Maven dependencies
mvn dependency:tree

# Check configuration
cat passkey-create-event-service/configs/dev.yaml
```

##### 2. External Service Connectivity
```bash
# Test external service connectivity
curl -f https://passkey-business-text-service.dev.cvent.org/health

# Check DNS resolution
nslookup passkey-business-text-service.dev.cvent.org
```

##### 3. Authentication Issues
- Verify API key configuration
- Check auth service connectivity
- Validate request headers

#### Logging Configuration
```xml
<!-- logback.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkey.createevent" level="DEBUG"/>
    <logger name="com.cvent.auth" level="INFO"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

## Contributing

### Development Workflow

#### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Make changes and commit
git add .
git commit -m "Add new feature: description"

# Push branch
git push origin feature/new-feature-name
```

#### 2. Pull Request Process
1. Create pull request from feature branch to `development`
2. Ensure all tests pass
3. Request code review from team members
4. Address review feedback
5. Merge after approval

#### 3. Code Review Guidelines
- **Functionality**: Does the code work as intended?
- **Testing**: Are there adequate tests?
- **Performance**: Are there any performance concerns?
- **Security**: Are there any security vulnerabilities?
- **Maintainability**: Is the code readable and maintainable?

### Getting Help

#### Team Communication
- **Slack Channel**: `#passkey-cherry-pickers`
- **Team Lead**: Contact team lead for architectural decisions
- **Code Reviews**: Tag team members for review

#### Documentation
- **API Documentation**: Available in this repository
- **Cvent Wiki**: Internal documentation and guidelines
- **Confluence**: Team-specific documentation

#### Troubleshooting
1. Check existing documentation
2. Search team Slack channel history
3. Ask in team channel
4. Create GitHub issue for bugs
5. Escalate to team lead if needed

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Access to Cvent's internal Maven repository

### Running Locally
```bash
# Build the service
mvn package -Prelease

# Run the service
cd passkey-create-event-service
java -jar target/passkey-create-event-service-2.1.13-SNAPSHOT.jar server configs/dev.yaml
```

### Running Tests
```bash
# Unit tests
mvn test

# Integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev -Dspotbugs.skip=true verify

# Code coverage
mvn package -Pcoverage
```

## Service Information


| Property | Value |
|----------|-------|
| **Service Name** | passkey-create-event-service |
| **Version** | 2.1.13-SNAPSHOT |
| **Java Version** | 17 |
| **Framework** | Dropwizard |
| **Build Tool** | Maven |
| **Business Unit** | Hospitality |
| **Platform** | Passkey |
| **Product** | Passkey for Hotels |

## Service Ownership


| Role | Team | Slack Channel |
|------|------|---------------|
| Primary | Cherry Pickers | `#passkey-cherry-pickers` |
| Secondary | Meeseeksbox | `#passkey-meeseeks-box` |
| Secondary | Metrestick | `#passkey-metre-stick` |

## Useful Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-create-event)
- [Admin Portal](https://admin.core.cvent.org/serviceid/1a85aeff-f470-4742-bcdf-bace6a5f1eca)
- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-create-event-service)
- [Service Registry](https://service-registry.core.cvent.org/services/1a85aeff-f470-4742-bcdf-bace6a5f1eca)

## Documentation Structure


- [Architecture](ARCHITECTURE.md) - System architecture and design patterns
- [API Reference](API_REFERENCE.md) - REST endpoints and API documentation
- [Domain Model](DOMAIN_MODEL.md) - Business domain concepts and entities
- [Technical Details](TECHNICAL_DETAILS.md) - Technology stack and dependencies
- [Deployment](DEPLOYMENT.md) - Deployment and infrastructure information
- [Development](DEVELOPMENT.md) - Local development setup and guidelines

## Getting Help


For questions or support:
1. Check the documentation in this repository
2. Reach out to the Cherry Pickers team via `#passkey-cherry-pickers`
3. Create an issue in the repository for bugs or feature requests
4. Consult the [Passkey Platform Documentation](https://wiki.cvent.com/passkey) for broader context
