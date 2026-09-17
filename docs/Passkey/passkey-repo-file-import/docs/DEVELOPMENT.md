# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK 17+
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerized builds and local testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code with Java extensions

### Development Tools
- **ASDF**: Version manager (optional, see `.tool-versions`)
- **Node.js 18+**: For frontend tooling and documentation
- **pnpm**: Package manager for Node.js dependencies

### Cvent-Specific Setup
- **Maven Configuration**: Access to Cvent's internal Nexus repository
- **VPN Access**: Required for accessing internal services
- **API Keys**: Development API keys for service integration

## Local Setup

### 1. Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-file-import.git
cd passkey-file-import
```

### 2. Environment Setup
```bash
# Using ASDF (recommended)
asdf install

# Or manually install Java 17 and Maven 3.6+
# Verify versions
java -version
mvn -version
```

### 3. Maven Configuration
Ensure your `~/.m2/settings.xml` includes Cvent's Nexus repository:
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
          <url>https://nexus.cvent.com/repository/maven-public/</url>
        </repository>
      </repositories>
    </profile>
  </profiles>
  <activeProfiles>
    <activeProfile>cvent</activeProfile>
  </activeProfiles>
</settings>
```

### 4. Build Project
```bash
# Full build with tests
mvn clean package

# Quick build without tests
mvn clean package -DskipTests

# Build with release profile
mvn clean package -Prelease
```

### 5. IDE Setup

#### IntelliJ IDEA
1. Import as Maven project
2. Set Project SDK to Java 17
3. Enable annotation processing
4. Install recommended plugins:
   - Maven Helper
   - SonarLint
   - CheckStyle-IDEA

#### VS Code
1. Install Java Extension Pack
2. Open project folder
3. Configure Java runtime in settings
4. Install recommended extensions:
   - Extension Pack for Java
   - SonarLint
   - Maven for Java

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=PasskeyFileImportResourceTest

# Run tests with coverage
mvn test -Pcoverage
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run integration tests with specific configuration
mvn -Prun-it -Denv.IT_ENVIRONMENT=alpha verify
```

### Load Tests
```bash
# Run load tests
mvn -Prun-load verify

# Or use the convenience script
./build-load.sh
```

### Code Coverage
```bash
# Generate coverage report
mvn jacoco:report -Pcoverage

# View report
open target/site/jacoco/index.html
```

## Code Structure

### Module Organization
```
passkey-file-import/
├── passkey-file-import-api/           # API definitions and OpenAPI specs
├── passkey-file-import-service/       # Main service implementation
├── passkey-file-import-java-client/   # Generated Java client
├── passkey-file-import-integration-test/ # Integration tests
├── passkey-file-import-load-test/     # Load tests
├── docs/                              # Documentation
└── pom.xml                           # Parent POM
```

### Service Package Structure
```
com.cvent.passkeyfileimport/
├── PasskeyFileImportServiceApplication.java    # Main application class
├── PasskeyFileImportServiceConfiguration.java  # Configuration
├── resources/                                  # REST endpoints
│   ├── PasskeyFileImportResource.java
│   └── OpenApiResource.java
├── services/                                   # Business logic
│   └── PasskeyFileImportService.java
├── clients/                                    # External service clients
├── exceptions/                                 # Custom exceptions
└── health/                                     # Health checks
```

### Key Design Patterns
- **Resource Pattern**: JAX-RS resources for REST endpoints
- **Service Layer**: Business logic separation
- **Client Pattern**: External service integration
- **Builder Pattern**: Immutable object construction
- **Configuration Pattern**: Environment-specific settings

## Coding Standards

### Java Code Style
- **Checkstyle**: Enforced via Maven plugin
- **Line Length**: 120 characters maximum
- **Indentation**: 4 spaces (no tabs)
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Imports**: No wildcard imports, organize imports

### Code Quality Rules
```xml
<!-- Checkstyle configuration -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
        <encoding>UTF-8</encoding>
        <consoleOutput>true</consoleOutput>
        <failsOnError>true</failsOnError>
    </configuration>
</plugin>
```

### Documentation Standards
- **JavaDoc**: Required for public methods and classes
- **OpenAPI**: All REST endpoints must be documented
- **README**: Keep module READMEs up to date
- **ADRs**: Document architectural decisions in `docs/` directory

## Common Tasks

### Adding a New Endpoint

1. **Define in Resource Class**:
```java
@POST
@Path("/new-endpoint")
@Operation(summary = "Description of the endpoint")
@ApiResponse(responseCode = "200", description = "Success response")
public Response newEndpoint(@NotNull RequestModel request) {
    // Implementation
    return Response.ok(response).build();
}
```

2. **Add Business Logic in Service**:
```java
public ResponseModel processNewRequest(RequestModel request) {
    // Business logic implementation
    return responseModel;
}
```

3. **Update OpenAPI Documentation**:
```bash
# Regenerate OpenAPI specs
mvn clean compile
```

4. **Add Tests**:
```java
@Test
public void testNewEndpoint() {
    // Test implementation
}
```

### Adding External Service Integration

1. **Create Client Interface**:
```java
public interface NewServiceClient {
    Response callExternalService(RequestData data);
}
```

2. **Implement Client**:
```java
public class NewServiceClientImpl implements NewServiceClient {
    // HTTP client implementation
}
```

3. **Add Configuration**:
```java
@JsonProperty
private NewServiceClientConfiguration newServiceClient;
```

4. **Register in Application**:
```java
// In PasskeyFileImportServiceApplication
NewServiceClient client = new NewServiceClientImpl(configuration.getNewServiceClient());
```

### Updating Dependencies

1. **Check for Updates**:
```bash
mvn versions:display-dependency-updates
```

2. **Update Parent POM Version**:
```xml
<parent>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>NEW_VERSION</version>
</parent>
```

3. **Update Specific Dependencies**:
```xml
<properties>
    <dependency.version>NEW_VERSION</dependency.version>
</properties>
```

4. **Test Changes**:
```bash
mvn clean verify -Prun-it
```

### Database Schema Changes
*Note: This service is stateless and doesn't maintain its own database*

For external service schema changes:
1. Update client models to match new schemas
2. Add backward compatibility handling
3. Update integration tests
4. Coordinate with external service teams

## Debugging

### Local Debugging

#### IntelliJ IDEA
1. Create run configuration:
   - Main class: `com.cvent.passkeyfileimport.PasskeyFileImportServiceApplication`
   - Program arguments: `server configs/dev.yaml`
   - VM options: `-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005`

2. Set breakpoints in code
3. Run in debug mode

#### Command Line Debugging
```bash
# Build the service
mvn clean package -Prelease

# Run with debug options
cd passkey-file-import-service
java -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=5005 \
     -jar target/passkey-file-import-service-*.jar server configs/dev.yaml
```

### Remote Debugging
```bash
# Connect to remote service (if debug port is exposed)
# In IDE, create remote debug configuration pointing to:
# Host: service-host
# Port: 5005
```

### Logging Configuration
```yaml
# Increase log level for debugging
logging:
  level: DEBUG
  loggers:
    com.cvent.passkeyfileimport: TRACE
    org.apache.http: DEBUG  # For HTTP client debugging
```

## Testing Strategies

### Unit Testing
- **Framework**: JUnit 5 + Mockito
- **Coverage Target**: 80% line coverage minimum
- **Mocking**: Mock external dependencies
- **Test Data**: Use builders for test data creation

```java
@ExtendWith(MockitoExtension.class)
class PasskeyFileImportServiceTest {
    
    @Mock
    private PasskeyReservationClientV2 reservationClient;
    
    @Mock
    private ResdeskClient resdeskClient;
    
    @InjectMocks
    private PasskeyFileImportService service;
    
    @Test
    void shouldProcessValidReservation() {
        // Test implementation
    }
}
```

### Integration Testing
- **Framework**: JUnit 5 + TestContainers
- **Environment**: Uses real external services in dev/alpha
- **Data Setup**: Create test data before tests
- **Cleanup**: Clean up test data after tests

### Contract Testing
- **Consumer Tests**: Verify client contracts with external services
- **Provider Tests**: Verify service contracts with consumers
- **Tools**: Pact or similar contract testing frameworks

## Performance Optimization

### Profiling
```bash
# Run with profiling
java -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=profile.jfr \
     -jar target/passkey-file-import-service-*.jar server configs/dev.yaml

# Analyze with JProfiler or similar tools
```

### Memory Optimization
- **Batch Processing**: Process imports in configurable batches
- **Stream Processing**: Use streams for large data sets
- **Connection Pooling**: Configure HTTP client connection pools
- **Garbage Collection**: Tune GC settings for workload

### Monitoring During Development
```bash
# Monitor application metrics
curl http://localhost:8081/metrics

# Check health status
curl http://localhost:8081/healthcheck

# View thread dump
curl http://localhost:8081/threads
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Maven cache
rm -rf ~/.m2/repository/com/cvent

# Rebuild with clean slate
mvn clean install -U
```

#### Test Failures
```bash
# Run tests with verbose output
mvn test -X

# Run single test with debugging
mvn test -Dtest=TestClass#testMethod -Dmaven.surefire.debug
```

#### Service Startup Issues
```bash
# Check configuration
java -jar target/passkey-file-import-service-*.jar check configs/dev.yaml

# Validate configuration syntax
yamllint configs/dev.yaml
```

### Log Analysis
```bash
# Follow application logs
tail -f logs/application.log

# Search for errors
grep -i error logs/application.log

# Filter by request ID
grep "request-id-123" logs/application.log
```

### External Service Issues
```bash
# Test external service connectivity
curl -v https://dev-passkey-reservation.cvent.com/health

# Check DNS resolution
nslookup dev-passkey-reservation.cvent.com

# Test with different environments
curl -v https://alpha-passkey-reservation.cvent.com/health
```

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for containerized deployment)

### Build Locally
```bash
mvn package -Prelease
```

### Run Locally
```bash
cd passkey-file-import-service
java -jar target/passkey-file-import-service-1.0.46-SNAPSHOT.jar server configs/dev.yaml
```

### Run Tests
```bash
# Unit tests
mvn test

# Integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Code coverage
mvn package -Pcoverage
```

## API Documentation


The service exposes OpenAPI documentation at:
- JSON: `/{env}/passkey-file-import/openapi.json`
- YAML: `/{env}/passkey-file-import/openapi.yaml`

Use the provided `swagger.sh` script to serve documentation locally:
```bash
./swagger.sh
# Access at http://localhost
```

## Environment Links


- **Backstage Service**: https://backstage.core.cvent.org/catalog/default/component/passkey-file-import-service
- **Backstage API**: https://backstage.core.cvent.org/catalog/default/api/passkey-file-import-api
- **Datadog**: https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-file-import-service
- **Jenkins**: https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-file-import

## Support


- **Owner**: cherry-pickers team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
- **Created by**: stsova@cvent.com
