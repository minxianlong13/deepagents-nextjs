# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerized development and testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA, Eclipse, or NetBeans (any IDE with Maven support)

### Environment Setup
1. **Java Installation**:
   ```bash
   # Verify Java version
   java -version
   # Should show Java 21
   ```

2. **Maven Configuration**:
   - Configure Maven to use Cvent's internal Nexus repository
   - Follow instructions: [Cvent Maven Setup](https://wiki.cvent.com/pages/viewpage.action?pageId=2304208)

3. **Docker Setup**:
   ```bash
   # Verify Docker installation
   docker --version
   docker-compose --version
   ```

### IDE Configuration

#### IntelliJ IDEA
1. **Import Project**: Import as Maven project
2. **Java SDK**: Set Project SDK to Java 21
3. **Code Style**: Import Cvent code style settings
4. **Plugins**: Install recommended plugins:
   - Maven Helper
   - SonarLint
   - Docker

#### Eclipse
1. **Import**: Import as Existing Maven Project
2. **Java Build Path**: Configure Java 21 JRE
3. **Code Formatting**: Import Cvent Eclipse formatter

#### NetBeans
- **Configuration**: `nb-configuration.xml` included in project
- **Auto-configuration**: NetBeans will automatically configure project settings

## Local Setup

### Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-hilton-converter.git
cd passkey-hilton-converter
```

### Build Project
```bash
# Clean build with all checks
mvn clean package -Prelease

# Quick build (skip tests and checks)
mvn clean package -DskipTests -Dcheckstyle.skip=true

# Build specific module
cd passkey-hilton-converter-service
mvn clean package
```

### Run Locally

#### Standard Execution
```bash
# Build the service
mvn clean package -Prelease

# Run the service
cd passkey-hilton-converter-service
java -jar target/passkey-hilton-converter-service-1.7.1-SNAPSHOT.jar server configs/dev.yaml
```

#### Development Mode
```bash
# Run with debug logging
java -Dlogging.level.com.cvent.passkeyhiltonconverter=DEBUG \
     -jar target/passkey-hilton-converter-service-1.7.1-SNAPSHOT.jar \
     server configs/dev.yaml

# Run with JVM debugging
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-hilton-converter-service-1.7.1-SNAPSHOT.jar \
     server configs/dev.yaml
```

#### Docker Development
```bash
# Build Docker image
docker build -t passkey-hilton-converter .

# Run container
docker run -p 8080:8080 -p 8081:8081 passkey-hilton-converter

# Run with environment variables
docker run -p 8080:8080 \
  -e PASSKEY_API_BASE_URL=http://localhost:9090 \
  -e LOG_LEVEL=DEBUG \
  passkey-hilton-converter
```

### Service Endpoints
Once running locally, the service provides:
- **Application**: http://localhost:8080
- **Admin Interface**: http://localhost:8081
- **Health Check**: http://localhost:8081/healthcheck
- **Metrics**: http://localhost:8081/metrics

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests with coverage
mvn test -Pcoverage

# Run specific test class
mvn test -Dtest=StayRecordOrchestratorTest

# Run specific test method
mvn test -Dtest=StayRecordOrchestratorTest#testProcessValidStayRecord
```

### Integration Tests
```bash
# Run all integration tests
mvn verify -Prun-it -Dkarate.env=dev

# Run specific feature file
mvn verify -Prun-it -Dkarate.env=dev -Dkarate.options="--tags @converter"

# Run with specific environment
mvn verify -Prun-it -Dkarate.env=alpha
```

### Running Specific Feature Files
Open `KarateTestIT.java` and modify the `runFeatureLocally()` method:
```java
@Test
void runFeatureLocally() {
    Results results = Runner.path("classpath:features")
        .tags("@converter") // Specify tags to run
        .parallel(1);
    assertEquals(0, results.getFailCount(), results.getErrorMessages());
}
```

### Code Coverage Reports
```bash
# Generate coverage report
mvn clean package -Pcoverage
mvn jacoco:report -Pcoverage

# Open coverage report
open target/site/jacoco/index.html
```

## Code Structure

### Package Organization
```
com.cvent.passkeyhiltonconverter/
├── resources/                          # JAX-RS REST endpoints
│   ├── PasskeyHiltonConverterResource  # Main API endpoint
│   └── PasskeyHiltonLoggingResource    # Logging endpoint
├── services/                           # Business logic layer
│   ├── StayRecordOrchestrator          # Main orchestration service
│   ├── HiltonToPasskeyTransformationService # Core transformation
│   └── CallService                     # External service calls
├── clients/                            # External service clients
│   └── [HTTP clients for external APIs]
├── model/                              # Internal data models
│   ├── PasskeyAPIConfig                # API configuration
│   └── PasskeyServiceConfig            # Service configuration
├── exceptions/                         # Custom exceptions
│   └── [Service-specific exceptions]
└── health/                             # Health check implementations
    └── [Custom health checks]
```

### API Module Structure
```
com.cvent.passkeyhiltonconverter.model/
├── hilton/                             # Hilton-specific models
│   └── PasskeyStayRecord              # Main input model
├── legacy/                             # Legacy model support
│   └── [Legacy transformation models]
├── MessageLog                          # Audit logging model
└── Result                              # Response wrapper model
```

## Coding Standards

### Java Code Style
- **Formatting**: Follow Cvent Java code style guidelines
- **Naming**: Use descriptive names for classes, methods, and variables
- **Documentation**: JavaDoc for public APIs and complex logic
- **Null Safety**: Use Optional where appropriate, avoid null returns

### Example Code Style
```java
/**
 * Orchestrates the processing of Hilton stay records.
 */
public class StayRecordOrchestrator {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(StayRecordOrchestrator.class);
    
    private final HiltonToPasskeyTransformationService transformationService;
    private final CallService callService;
    
    public StayRecordOrchestrator(
            HiltonToPasskeyTransformationService transformationService,
            CallService callService) {
        this.transformationService = requireNonNull(transformationService);
        this.callService = requireNonNull(callService);
    }
    
    /**
     * Processes a list of stay records and returns transformation results.
     *
     * @param stayRecords the stay records to process
     * @return list of processing results
     */
    public List<Result> process(List<PasskeyStayRecord> stayRecords) {
        requireNonNull(stayRecords, "Stay records cannot be null");
        
        return stayRecords.stream()
            .map(this::processStayRecord)
            .collect(toList());
    }
}
```

### REST Resource Guidelines
```java
@Path("/passkey-hilton-converter/v1/stayrecords")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@EnableLogContext
public class PasskeyHiltonConverterResource {
    
    @POST
    public Response apply(
            @Authority(methods = {AuthMethod.API_KEY}) GrantedAPIKey grantedAPIKey,
            @Valid List<PasskeyStayRecord> passkeyStayRecords) {
        
        List<Result> results = stayRecordOrchestrator.process(passkeyStayRecords);
        return Response.ok(results).build();
    }
}
```

## Common Development Tasks

### Adding a New Endpoint

1. **Create Resource Class**:
   ```java
   @Path("/passkey-hilton-converter/v1/newendpoint")
   @Consumes(MediaType.APPLICATION_JSON)
   @Produces(MediaType.APPLICATION_JSON)
   public class NewEndpointResource {
       
       @GET
       public Response getEndpoint() {
           return Response.ok("Hello World").build();
       }
   }
   ```

2. **Register in Application**:
   ```java
   // In PasskeyHiltonConverterServiceApplication.java
   @Override
   public void run(PasskeyHiltonConverterServiceConfiguration configuration, 
                   Environment environment) {
       environment.jersey().register(new NewEndpointResource());
   }
   ```

3. **Add Integration Test**:
   ```gherkin
   # In features/newendpoint.feature
   Feature: New Endpoint
   
   Scenario: Get new endpoint
     Given url baseUrl + '/passkey-hilton-converter/v1/newendpoint'
     When method GET
     Then status 200
     And match response == 'Hello World'
   ```

### Adding Configuration Properties

1. **Update Configuration Class**:
   ```java
   public class PasskeyHiltonConverterServiceConfiguration extends Configuration {
       
       @JsonProperty
       private String newProperty = "default-value";
       
       public String getNewProperty() {
           return newProperty;
       }
   }
   ```

2. **Update Configuration Files**:
   ```yaml
   # In configs/dev.yaml
   newProperty: "development-value"
   ```

3. **Use in Service**:
   ```java
   public class SomeService {
       private final String configValue;
       
       public SomeService(String configValue) {
           this.configValue = configValue;
       }
   }
   ```

### Adding a New Transformation Rule

1. **Update Transformation Service**:
   ```java
   public class HiltonToPasskeyTransformationService {
       
       public String transform(PasskeyStayRecord stayRecord) {
           // Add new transformation logic
           String newField = transformNewField(stayRecord.getNewField());
           // Include in XML generation
       }
       
       private String transformNewField(String input) {
           // Transformation logic
           return processedInput;
       }
   }
   ```

2. **Add Unit Tests**:
   ```java
   @Test
   void testNewFieldTransformation() {
       // Given
       PasskeyStayRecord stayRecord = createStayRecordWithNewField();
       
       // When
       String result = transformationService.transform(stayRecord);
       
       // Then
       assertThat(result).contains("expected-new-field-value");
   }
   ```

3. **Add Integration Test**:
   ```gherkin
   Scenario: Transform stay record with new field
     Given request { "newField": "test-value" }
     When method POST
     Then status 200
     And match response.results[0].passkeyXml contains 'test-value'
   ```

## Debugging

### Local Debugging

#### IDE Debugging
1. **Set Breakpoints**: In your IDE, set breakpoints in the code
2. **Debug Configuration**: Create debug configuration for main class
3. **Run in Debug Mode**: Start application in debug mode

#### Remote Debugging
```bash
# Start service with debug port
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-hilton-converter-service-1.7.1-SNAPSHOT.jar \
     server configs/dev.yaml

# Connect IDE to localhost:5005
```

### Log Analysis

#### Enable Debug Logging
```yaml
# In configs/dev.yaml
logging:
  level: DEBUG
  loggers:
    com.cvent.passkeyhiltonconverter: DEBUG
    org.apache.http: DEBUG  # For HTTP client debugging
```

#### Structured Logging
```java
// Use structured logging with context
LOGGER.info("Processing stay record", 
    kv("reservationId", stayRecord.getReservationId()),
    kv("hotelCode", stayRecord.getHotelCode()));
```

### Common Issues and Solutions

#### Build Issues
```bash
# Clear Maven cache
mvn dependency:purge-local-repository

# Rebuild with clean slate
mvn clean install -U

# Skip problematic checks during development
mvn clean package -DskipTests -Dcheckstyle.skip=true
```

#### Runtime Issues
```bash
# Check service health
curl http://localhost:8081/healthcheck

# Check metrics
curl http://localhost:8081/metrics

# Test API endpoint
curl -X POST http://localhost:8080/passkey-hilton-converter/v1/stayrecords \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key" \
  -d '[{"reservationId": "test"}]'
```

## Contributing

### Development Workflow
1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Implement Changes**: Follow coding standards and add tests
3. **Run Tests**: Ensure all tests pass locally
4. **Commit Changes**: Use descriptive commit messages
5. **Push Branch**: `git push origin feature/new-feature`
6. **Create Pull Request**: Submit PR for code review
7. **Address Feedback**: Make requested changes
8. **Merge**: After approval, merge to development branch

### Code Review Guidelines
- **Test Coverage**: Ensure adequate test coverage for new code
- **Documentation**: Update documentation for API changes
- **Performance**: Consider performance impact of changes
- **Security**: Review for security implications
- **Backward Compatibility**: Maintain API backward compatibility

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

## Troubleshooting

### Common Development Issues

#### Maven Build Failures
- **Issue**: Dependency resolution failures
- **Solution**: Check Nexus repository configuration, clear local repository

#### Test Failures
- **Issue**: Integration tests failing locally
- **Solution**: Ensure external services are available, check test data

#### Docker Build Issues
- **Issue**: Docker build failures
- **Solution**: Check Dockerfile syntax, verify base image availability

#### IDE Configuration
- **Issue**: IDE not recognizing project structure
- **Solution**: Reimport as Maven project, refresh dependencies

### Getting Help
- **Team Channel**: `#passkey-api` Slack channel
- **Documentation**: [Hilton Topics Wiki](https://wiki.cvent.com/display/PASKY/Hilton+Topics)
- **Code Owners**: Check `CODEOWNERS` file for responsible team members
- **Jenkins**: [Build Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-hilton-converter)

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development
```bash
# Build the project
mvn package -Prelease

# Run locally
cd passkey-hilton-converter-service
java -jar target/passkey-hilton-converter-service-1.7.1-SNAPSHOT.jar server configs/dev.yaml

# Run integration tests
mvn -Prun-it -Dkarate.env=dev verify
```

### Docker Deployment
```bash
# Build Docker image
docker build -t passkey-hilton-converter .

# Run container
docker run -p 8080:8080 passkey-hilton-converter
```

## API Endpoints


- **POST** `/passkey-hilton-converter/v1/stayrecords` - Transform Hilton stay records to Passkey format
- **POST** `/passkey-hilton-converter/v1/logging` - Logging and monitoring endpoint

## Support


- **Team**: meeseeksbox
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
- **Wiki**: [Hilton Topics](https://wiki.cvent.com/display/PASKY/Hilton+Topics)
- **Monitoring**: [Datadog APM](https://cvent.datadoghq.com/apm/services/passkey-hilton-converter-service)
