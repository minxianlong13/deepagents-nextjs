# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK 21 or later
- **Maven 3.9+**: Build tool and dependency management
- **Docker**: For containerized testing and deployment
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Development Tools
- **ASDF**: Version manager for Java and Maven (recommended)
- **Postman/Insomnia**: API testing
- **Docker Desktop**: Local container management
- **AWS CLI**: For deployment and debugging

### Access Requirements
- **GitHub Access**: cvent-internal organization membership
- **Cvent VPN**: Required for accessing internal services
- **Nexus Repository**: Access to Cvent's Maven repository
- **Auth Service**: Development environment access

## Local Setup

### 1. Environment Setup

#### Install Java 21 with ASDF
```bash
# Install ASDF (if not already installed)
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.13.1

# Add to shell profile
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc
echo '. ~/.asdf/completions/asdf.bash' >> ~/.bashrc

# Install Java plugin
asdf plugin add java

# Install Java 21
asdf install java openjdk-21
asdf global java openjdk-21

# Verify installation
java -version
```

#### Configure Maven
```bash
# Install Maven plugin
asdf plugin add maven

# Install Maven
asdf install maven 3.9.6
asdf global maven 3.9.6

# Verify installation
mvn -version
```

### 2. Repository Setup

#### Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-core-mapper.git
cd passkey-core-mapper
```

#### Configure Maven Settings
Create or update `~/.m2/settings.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0">
    <servers>
        <server>
            <id>cvent-nexus</id>
            <username>${env.NEXUS_USERNAME}</username>
            <password>${env.NEXUS_PASSWORD}</password>
        </server>
    </servers>
    
    <profiles>
        <profile>
            <id>cvent</id>
            <repositories>
                <repository>
                    <id>cvent-nexus</id>
                    <url>https://nexus.cvent.net/repository/maven-public/</url>
                </repository>
            </repositories>
        </profile>
    </profiles>
    
    <activeProfiles>
        <activeProfile>cvent</activeProfile>
    </activeProfiles>
</settings>
```

### 3. Build and Test

#### Initial Build
```bash
# Clean build with all tests
mvn clean package -Prelease

# Quick build (skip tests)
mvn clean package -DskipTests

# Build specific module
mvn clean package -pl passkey-core-mapper-service
```

#### Run Tests
```bash
# Unit tests only
mvn test

# Integration tests
mvn -Prun-it -Dkarate.env=dev verify

# Code coverage
mvn clean package -Pcoverage
mvn jacoco:report -Pcoverage
open target/site/jacoco/index.html
```

### 4. Local Development Server

#### Start the Service
```bash
cd passkey-core-mapper-service

# Run with development configuration
java -jar target/passkey-core-mapper-service-*.jar server configs/dev.yaml

# Run with debug mode
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-core-mapper-service-*.jar server configs/dev.yaml
```

#### Verify Service
```bash
# Health check
curl http://localhost:8080/healthcheck

# Admin interface
open http://localhost:8081

# API documentation
open http://localhost:8081/swagger
```

## IDE Configuration

### IntelliJ IDEA Setup

#### Import Project
1. Open IntelliJ IDEA
2. File → Open → Select `passkey-core-mapper` directory
3. Import as Maven project
4. Wait for dependency resolution

#### Configure Code Style
1. File → Settings → Editor → Code Style
2. Import Cvent Java code style configuration
3. Enable "Reformat code" on save

#### Useful Plugins
- **Lombok**: Automatic getter/setter generation
- **Maven Helper**: Enhanced Maven integration
- **SonarLint**: Code quality analysis
- **Docker**: Container management
- **Karate**: Integration test support

#### Run Configurations

##### Service Run Configuration
```
Name: PasskeyCoreMapperService
Main class: com.cvent.passkeycoremapper.PasskeyCoreMapperServiceApplication
Program arguments: server configs/dev.yaml
Working directory: $MODULE_WORKING_DIR$/passkey-core-mapper-service
Use classpath of module: passkey-core-mapper-service
```

##### Debug Configuration
```
Name: PasskeyCoreMapperService (Debug)
Main class: com.cvent.passkeycoremapper.PasskeyCoreMapperServiceApplication
Program arguments: server configs/dev.yaml
VM options: -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005
Working directory: $MODULE_WORKING_DIR$/passkey-core-mapper-service
```

##### Integration Test Configuration
```
Name: Integration Tests
VM options: -Dkarate.env=dev -Dkarate.config.dir=test_configs
Working directory: $MODULE_WORKING_DIR$/passkey-core-mapper-integration-test
Use classpath of module: passkey-core-mapper-integration-test
```

### Eclipse Setup

#### Import Project
1. File → Import → Existing Maven Projects
2. Select `passkey-core-mapper` directory
3. Import all modules

#### Configure Formatter
1. Window → Preferences → Java → Code Style → Formatter
2. Import Cvent Java formatter configuration

## Code Structure

### Package Organization
```
com.cvent.passkeycoremapper/
├── PasskeyCoreMapperServiceApplication.java    # Main application class
├── PasskeyCoreMapperServiceConfiguration.java # Configuration class
├── exceptions/                                 # Exception handling
│   └── mapper/                                # Exception mappers
├── health/                                    # Health check implementations
├── resources/                                 # REST endpoints
│   ├── hilton/                               # Hilton-specific endpoints
│   ├── ohip/                                 # OHIP-specific endpoints
│   └── shiji/                                # Shiji-specific endpoints
└── services/                                 # Business logic
    ├── clients/                              # External service clients
    ├── common/                               # Shared utilities
    ├── hilton/                               # Hilton mapping services
    ├── mappingvalues/                        # Validation services
    ├── ohip/                                 # OHIP mapping services
    ├── shiji/                                # Shiji mapping services
    └── util/                                 # Utility classes
```

### Module Structure
```
passkey-core-mapper/
├── passkey-core-mapper-api/                  # API definitions
├── passkey-core-mapper-service/              # Main service
├── passkey-core-mapper-java-client/          # Client library
└── passkey-core-mapper-integration-test/     # Integration tests
```

## Coding Standards

### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: 120 characters maximum
- **Braces**: Opening brace on same line
- **Imports**: Organize imports, remove unused
- **Naming**: CamelCase for classes, camelCase for methods/variables

### Example Code Style
```java
public class ReservationMapper {
    private static final Logger LOGGER = LoggerFactory.getLogger(ReservationMapper.class);
    
    private final ValidationService validationService;
    
    public ReservationMapper(ValidationService validationService) {
        this.validationService = validationService;
    }
    
    public MappedReservation mapReservation(Reservation reservation, MappingContext context) {
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation cannot be null");
        }
        
        ValidationResult validationResult = validationService.validate(reservation);
        if (!validationResult.isValid()) {
            LOGGER.warn("Validation failed for reservation {}: {}", 
                reservation.getId(), validationResult.getErrors());
            throw new ValidationException("Invalid reservation data");
        }
        
        return MappedReservation.builder()
            .id(reservation.getId())
            .confirmationNumber(reservation.getConfNumber())
            .build();
    }
}
```

### Documentation Standards
- **JavaDoc**: Required for public classes and methods
- **Comments**: Explain complex business logic
- **README**: Update when adding new features
- **API Documentation**: Keep API reference current

## Testing Guidelines

### Unit Testing
```java
@ExtendWith(MockitoExtension.class)
class ReservationMapperTest {
    
    @Mock
    private ValidationService validationService;
    
    @InjectMocks
    private ReservationMapper reservationMapper;
    
    @Test
    void shouldMapValidReservation() {
        // Given
        Reservation reservation = createValidReservation();
        when(validationService.validate(reservation))
            .thenReturn(ValidationResult.valid());
        
        // When
        MappedReservation result = reservationMapper.mapReservation(reservation, context);
        
        // Then
        assertThat(result.getId()).isEqualTo(reservation.getId());
        assertThat(result.getConfirmationNumber()).isEqualTo(reservation.getConfNumber());
    }
    
    @Test
    void shouldThrowExceptionForInvalidReservation() {
        // Given
        Reservation reservation = createInvalidReservation();
        when(validationService.validate(reservation))
            .thenReturn(ValidationResult.invalid("Invalid data"));
        
        // When & Then
        assertThatThrownBy(() -> reservationMapper.mapReservation(reservation, context))
            .isInstanceOf(ValidationException.class)
            .hasMessage("Invalid reservation data");
    }
}
```

### Integration Testing with Karate
```gherkin
Feature: Hilton Reservation Mapping

Background:
  * url baseUrl
  * header Authorization = 'Bearer ' + authToken

Scenario: Map valid Hilton reservation
  Given path 'hilton/map-reservation'
  And request
    """
    {
      "reservation": {
        "id": 12345,
        "confNumber": "ABC123",
        "guestInfo": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com"
        }
      }
    }
    """
  When method POST
  Then status 200
  And match response.mappedReservation.reservationId == '12345'
  And match response.validationResults.isValid == true
```

## Common Development Tasks

### Adding a New Vendor

#### 1. Create Vendor-Specific Packages
```bash
mkdir -p passkey-core-mapper-service/src/main/java/com/cvent/passkeycoremapper/resources/newvendor
mkdir -p passkey-core-mapper-service/src/main/java/com/cvent/passkeycoremapper/services/newvendor
```

#### 2. Implement Resource Class
```java
@Path("/newvendor")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PasskeyNewVendorMapperResource {
    
    private final NewVendorService newVendorService;
    
    public PasskeyNewVendorMapperResource(NewVendorService newVendorService) {
        this.newVendorService = newVendorService;
    }
    
    @POST
    @Path("/map-reservation")
    public Response mapReservation(@Valid @NotNull NewVendorMappingRequest request) {
        // Implementation
    }
}
```

#### 3. Implement Service Class
```java
public class NewVendorService {
    
    private final NewVendorMappingValuesValidator validator;
    private final NewVendorMapper mapper;
    
    public NewVendorService(NewVendorMappingValuesValidator validator, 
                           NewVendorMapper mapper) {
        this.validator = validator;
        this.mapper = mapper;
    }
    
    public NewVendorMappingResponse mapReservation(NewVendorMappingRequest request) {
        // Implementation
    }
}
```

#### 4. Register in Application
```java
// In PasskeyCoreMapperServiceApplication.run()
NewVendorService newVendorService = new NewVendorService(
    new NewVendorMappingValuesValidator(),
    NewVendorMapper.INSTANCE
);

environment.jersey().register(new PasskeyNewVendorMapperResource(newVendorService));
```

### Adding a New Endpoint

#### 1. Define Request/Response Models
```java
public class NewEndpointRequest {
    @Valid
    @NotNull
    private Reservation reservation;
    
    // Getters and setters
}

public class NewEndpointResponse {
    private MappedData mappedData;
    private ValidationResult validationResult;
    
    // Getters and setters
}
```

#### 2. Add Resource Method
```java
@POST
@Path("/new-endpoint")
@Timed(name = "new-endpoint.timer")
@Metered(name = "new-endpoint.meter")
public Response newEndpoint(@Valid @NotNull NewEndpointRequest request) {
    try {
        NewEndpointResponse response = service.processNewEndpoint(request);
        return Response.ok(response).build();
    } catch (ValidationException e) {
        return Response.status(422).entity(e.getValidationErrors()).build();
    }
}
```

#### 3. Add Integration Tests
```gherkin
Scenario: Test new endpoint
  Given path 'vendor/new-endpoint'
  And request { /* test data */ }
  When method POST
  Then status 200
  And match response contains { /* expected response */ }
```

### Debugging Common Issues

#### Service Won't Start
```bash
# Check Java version
java -version

# Check Maven configuration
mvn -version

# Verify dependencies
mvn dependency:tree

# Check configuration files
cat passkey-core-mapper-service/configs/dev.yaml
```

#### Integration Tests Failing
```bash
# Run specific test
mvn test -Dtest=SpecificTestClass

# Run with debug output
mvn -Prun-it -Dkarate.env=dev -Dkarate.options="--tags @debug" verify

# Check test configuration
cat passkey-core-mapper-integration-test/src/test/resources/karate-config.js
```

#### Authentication Issues
```bash
# Verify auth service connectivity
curl -f https://auth-service.dev.cvent.net/health

# Check JWT token validity
# Use JWT debugger at jwt.io

# Verify service configuration
grep -r "auth" passkey-core-mapper-service/configs/
```

## Performance Optimization

### Profiling
```bash
# Enable JFR profiling
java -XX:+FlightRecorder \
     -XX:StartFlightRecording=duration=60s,filename=profile.jfr \
     -jar target/passkey-core-mapper-service-*.jar server configs/dev.yaml

# Analyze with JProfiler or VisualVM
```

### Memory Analysis
```bash
# Generate heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc
jcmd <pid> GC.dump_heap heap.hprof

# Analyze with Eclipse MAT or JProfiler
```

### Load Testing
```bash
# Use Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
   -T "application/json" \
   -p test-data.json \
   http://localhost:8080/hilton/map-reservation

# Use JMeter for complex scenarios
```

## Troubleshooting

### Common Issues

#### Build Failures
- **Symptom**: Maven build fails with dependency errors
- **Solution**: Clear Maven cache: `rm -rf ~/.m2/repository`
- **Prevention**: Regularly update dependencies

#### Port Conflicts
- **Symptom**: "Port already in use" error
- **Solution**: Kill process using port: `lsof -ti:8080 | xargs kill -9`
- **Prevention**: Use different ports for different services

#### Memory Issues
- **Symptom**: OutOfMemoryError during development
- **Solution**: Increase JVM heap size: `-Xmx4g`
- **Prevention**: Monitor memory usage during development

### Getting Help

#### Internal Resources
- **Slack Channel**: #passkey-api
- **Team**: meeseeksbox
- **Wiki**: [Passkey Development Guide](https://wiki.cvent.com/display/PASSKEY)

#### External Resources
- **Dropwizard Documentation**: https://www.dropwizard.io/
- **JAX-RS Specification**: https://jcp.org/en/jsr/detail?id=370
- **Karate Testing**: https://github.com/karatelabs/karate

#### Code Review Process
1. Create feature branch from `development`
2. Implement changes with tests
3. Create pull request to `development`
4. Address review feedback
5. Merge after approval

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-core-mapper.git
   cd passkey-core-mapper
   ```

2. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-core-mapper-service
   java -jar target/passkey-core-mapper-service-1.16.1-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Run integration tests**:
   ```bash
   mvn -Prun-it -Dkarate.env=dev verify
   ```

### Docker Deployment

```bash
docker build -t passkey-core-mapper .
docker run -p 8080:8080 passkey-core-mapper
```

## API Access


The service provides RESTful endpoints for mapping operations:

- **Base URL**: `http://localhost:8080` (local development)
- **Health Check**: `http://localhost:8080/healthcheck`
- **Admin Portal**: `http://localhost:8081` (includes API documentation)

## Module Structure


The service follows a multi-module Maven architecture:

- **passkey-core-mapper-api**: API definitions and data models
- **passkey-core-mapper-service**: Main service implementation
- **passkey-core-mapper-java-client**: Java client library
- **passkey-core-mapper-integration-test**: Integration test suite

## Technology Stack


- **Framework**: Dropwizard (JAX-RS)
- **Language**: Java 21
- **Build Tool**: Maven
- **Authentication**: Cvent Auth Service
- **Observability**: Datadog APM and logging
- **Testing**: Karate for integration tests

## Support


- **Team**: meeseeksbox
- **Slack Channel**: #passkey-api
- **Jenkins**: [CI/CD Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-core-mapper)
- **Monitoring**: [Datadog APM](https://cvent.datadoghq.com/apm/services/passkey-core-mapper-service/operations/servlet.request/resources)
