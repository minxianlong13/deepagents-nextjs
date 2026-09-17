# Development Guide

## Prerequisites

### Required Software
- **Java 25** - OpenJDK or Oracle JDK
- **Maven 3.6+** - Build tool
- **Git** - Version control
- **Docker** - Container runtime (optional)
- **IDE** - IntelliJ IDEA, Eclipse, or VS Code

### Recommended Tools
- **Postman** - API testing
- **curl** - Command-line HTTP client
- **jq** - JSON processor for response parsing
- **Docker Compose** - Multi-container orchestration

### Version Management
Use `.tool-versions` file with asdf for consistent tooling:
```bash
# Install asdf
git clone https://github.com/asdf-vm/asdf.git ~/.asdf

# Install plugins
asdf plugin add java
asdf plugin add maven

# Install versions from .tool-versions
asdf install
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-vendor-mock.git
cd passkey-vendor-mock
```

### 2. Build Project
```bash
# Clean build with all dependencies
mvn clean package -Prelease

# Quick build (skip tests)
mvn clean package -DskipTests -Prelease

# Build specific module
cd passkey-vendor-mock-service
mvn clean package
```

### 3. Run Locally
```bash
# Method 1: Direct JAR execution
cd passkey-vendor-mock-service
java -jar target/passkey-vendor-mock-service-1.17.3-SNAPSHOT.jar server configs/dev.yaml

# Method 2: Maven exec plugin
mvn exec:java -Dexec.mainClass="com.cvent.passkeyvendormock.PasskeyVendorMockServiceApplication" -Dexec.args="server configs/dev.yaml"

# Method 3: Using build script
./build-it.sh
```

### 4. Verify Installation
```bash
# Health check
curl http://localhost:7000/health

# Admin interface
curl http://localhost:7001/healthcheck

# Test endpoint
curl -X POST http://localhost:7000/v1/sync/marriott \
  -H "Content-Type: application/xml" \
  -d '<reservation><guest><firstName>RESPONSE success</firstName></guest></reservation>'
```

### 5. Docker Setup (Alternative)
```bash
# Build Docker image
docker build -t passkey-vendor-mock .

# Run container
docker run -p 7000:7000 -p 7001:7001 passkey-vendor-mock

# Using Docker Compose
docker-compose up -d
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=PasskeyVendorMockResourceTest

# Run with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests
```bash
# Run Karate integration tests
mvn verify -Pit

# Run specific feature
mvn test -Dtest=VendorMockTest -Dkarate.options="--tags @smoke"

# Run with specific environment
mvn verify -Pit -Dkarate.env=dev
```

### Load Tests
```bash
# Run load tests (tagged)
mvn test -Dgroups=load

# Custom load test
mvn test -Dtest=LoadTest -Dload.threads=50 -Dload.duration=300
```

### Test Configuration
```yaml
# test-config.yaml
server:
  applicationConnectors:
    - type: 'http'
      port: 0  # Random port for testing
  adminConnectors:
    - type: 'http'
      port: 0  # Random port for testing

logging:
  level: WARN  # Reduce log noise during tests
```

## Code Structure

### Package Organization
```
com.cvent.passkeyvendormock/
├── PasskeyVendorMockServiceApplication.java    # Main application class
├── PasskeyVendorMockServiceConfiguration.java # Configuration class
├── callback/                                   # Callback message handling
│   ├── CallbackStorage.java
│   └── CallbackResource.java
├── config/                                     # Configuration classes
│   ├── AsyncTransferConfiguration.java
│   └── EnvironmentConfiguration.java
├── constants/                                  # Application constants
│   └── ResponseConstants.java
├── derbysoft/                                  # DerbySoft-specific logic
│   ├── DerbySoftService.java
│   └── DerbySoftModels.java
├── exception/                                  # Custom exceptions
│   ├── VendorSystemException.java
│   └── GlobalExceptionMapper.java
├── filter/                                     # HTTP filters
│   └── RequestLoggingFilter.java
├── health/                                     # Health checks
│   └── BasicHealthCheck.java
├── model/                                      # Domain models
│   ├── Reservation.java
│   ├── Guest.java
│   └── MockResponse.java
├── ohip/                                       # OHIP-specific logic
│   ├── OhipService.java
│   └── OhipModels.java
├── resources/                                  # JAX-RS endpoints
│   ├── AmadeusResource.java
│   ├── HiltonResource.java
│   ├── OhipHotelReservationResource.java
│   └── [20+ other vendor resources]
├── service/                                    # Business logic
│   ├── MockResponseService.java
│   ├── TemplateService.java
│   └── DelayService.java
└── utils/                                      # Utility classes
    ├── XmlUtils.java
    ├── DateUtils.java
    └── ResponseBuilder.java
```

### Key Design Patterns

#### Resource Pattern (JAX-RS)
```java
@Path("/v1/sync/marriott")
@Produces(MediaType.APPLICATION_XML)
@Consumes(MediaType.APPLICATION_XML)
public class MarriottResource {
    
    @Inject
    private MockResponseService mockResponseService;
    
    @POST
    public Response processReservation(String xmlPayload) {
        return mockResponseService.generateResponse("marriott", xmlPayload);
    }
}
```

#### Service Layer Pattern
```java
@Singleton
public class MockResponseService {
    
    public Response generateResponse(String vendor, String payload) {
        String magicKeyword = extractMagicKeyword(payload);
        ResponseTemplate template = selectTemplate(vendor, magicKeyword);
        return buildResponse(template, payload);
    }
    
    private String extractMagicKeyword(String payload) {
        // Extract magic keywords from payload
    }
}
```

#### Template Method Pattern
```java
public abstract class VendorResponseGenerator {
    
    public final Response generateResponse(String payload) {
        validateInput(payload);
        String keyword = extractKeyword(payload);
        ResponseData data = processRequest(payload);
        return formatResponse(data, keyword);
    }
    
    protected abstract ResponseData processRequest(String payload);
    protected abstract Response formatResponse(ResponseData data, String keyword);
}
```

## Coding Standards

### Java Style Guide
Follow Google Java Style Guide with these additions:

#### Class Structure
```java
public class ExampleClass {
    // 1. Static constants
    private static final String CONSTANT_VALUE = "value";
    
    // 2. Instance fields
    private final DependencyService dependencyService;
    
    // 3. Constructor
    @Inject
    public ExampleClass(DependencyService dependencyService) {
        this.dependencyService = dependencyService;
    }
    
    // 4. Public methods
    public Response publicMethod() { }
    
    // 5. Private methods
    private void privateMethod() { }
}
```

#### Naming Conventions
- **Classes**: PascalCase (`MockResponseService`)
- **Methods**: camelCase (`generateResponse`)
- **Variables**: camelCase (`xmlPayload`)
- **Constants**: UPPER_SNAKE_CASE (`RESPONSE_SUCCESS`)
- **Packages**: lowercase (`com.cvent.passkeyvendormock`)

#### Documentation
```java
/**
 * Generates mock responses for vendor systems based on magic keywords.
 * 
 * @param vendor the vendor system identifier
 * @param payload the request payload containing magic keywords
 * @return HTTP response with appropriate status and content
 * @throws VendorSystemException if vendor is not supported
 */
public Response generateResponse(String vendor, String payload) {
    // Implementation
}
```

### Code Quality Tools

#### Checkstyle Configuration
```xml
<!-- checkstyle.xml -->
<module name="Checker">
    <module name="TreeWalker">
        <module name="LineLength">
            <property name="max" value="120"/>
        </module>
        <module name="Indentation">
            <property name="basicOffset" value="4"/>
        </module>
    </module>
</module>
```

#### SpotBugs Integration
```xml
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <configuration>
        <effort>Max</effort>
        <threshold>Low</threshold>
    </configuration>
</plugin>
```

## Common Development Tasks

### Adding a New Vendor System

#### 1. Create Resource Class
```java
@Path("/v1/sync/newvendor")
@Produces(MediaType.APPLICATION_XML)
@Consumes(MediaType.APPLICATION_XML)
public class NewVendorResource {
    
    @Inject
    private MockResponseService mockResponseService;
    
    @POST
    public Response processReservation(String xmlPayload) {
        return mockResponseService.generateResponse("newvendor", xmlPayload);
    }
}
```

#### 2. Add Response Templates
```xml
<!-- src/main/resources/templates/newvendor-success.xml -->
<NewVendorResponse>
    <Status>Success</Status>
    <ConfirmationNumber>NV${timestamp}</ConfirmationNumber>
    <Message>Reservation processed successfully</Message>
</NewVendorResponse>
```

#### 3. Register Resource
```java
@Override
public void run(PasskeyVendorMockServiceConfiguration configuration,
                Environment environment) {
    environment.jersey().register(new NewVendorResource());
}
```

#### 4. Add Tests
```java
@Test
void testNewVendorSuccess() {
    Response response = resources.target("/v1/sync/newvendor")
        .request()
        .post(Entity.xml("<reservation><guest><firstName>RESPONSE success</firstName></guest></reservation>"));
    
    assertThat(response.getStatus()).isEqualTo(200);
    assertThat(response.readEntity(String.class)).contains("Success");
}
```

### Adding Magic Keywords

#### 1. Define Keyword Constants
```java
public class ResponseConstants {
    public static final String NEW_KEYWORD = "RESPONSE newBehavior";
    public static final String NEW_KEYWORD_PATTERN = "RESPONSE newBehavior(?:=(\\d+))?";
}
```

#### 2. Update Keyword Detection
```java
public class MockResponseService {
    
    private ResponseType detectResponseType(String payload) {
        if (payload.contains(ResponseConstants.NEW_KEYWORD)) {
            return ResponseType.NEW_BEHAVIOR;
        }
        // ... other keywords
    }
}
```

#### 3. Implement Behavior
```java
private Response handleNewBehavior(String payload, String vendor) {
    // Extract parameters if needed
    Pattern pattern = Pattern.compile(ResponseConstants.NEW_KEYWORD_PATTERN);
    Matcher matcher = pattern.matcher(payload);
    
    if (matcher.find()) {
        String parameter = matcher.group(1);
        // Use parameter in response generation
    }
    
    return generateCustomResponse(vendor, parameter);
}
```

### Debugging Tips

#### Enable Debug Logging
```yaml
# configs/dev.yaml
logging:
  level: DEBUG
  loggers:
    'com.cvent.passkeyvendormock': DEBUG
    'org.glassfish.jersey.logging.LoggingFeature': DEBUG
```

#### Request/Response Logging
```java
@Override
public void run(PasskeyVendorMockServiceConfiguration configuration,
                Environment environment) {
    environment.jersey().register(new LoggingFeature(
        Logger.getLogger(LoggingFeature.DEFAULT_LOGGER_NAME),
        Level.INFO,
        LoggingFeature.Verbosity.PAYLOAD_ANY,
        8192
    ));
}
```

#### JVM Debugging
```bash
# Enable remote debugging
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
  -jar target/passkey-vendor-mock-service-1.17.3-SNAPSHOT.jar server configs/dev.yaml
```

### Performance Profiling

#### JProfiler Integration
```bash
# Run with JProfiler agent
java -agentpath:/path/to/jprofiler/bin/linux-x64/libjprofilerti.so=port=8849 \
  -jar target/passkey-vendor-mock-service-1.17.3-SNAPSHOT.jar server configs/dev.yaml
```

#### Memory Analysis
```bash
# Generate heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc
jcmd <pid> GC.dump /tmp/heapdump.hprof

# Analyze with Eclipse MAT or VisualVM
```

## IDE Configuration

### IntelliJ IDEA Setup

#### Import Project
1. File → Open → Select `pom.xml`
2. Import as Maven project
3. Wait for dependency resolution

#### Code Style
1. File → Settings → Editor → Code Style
2. Import `google-java-format.xml`
3. Enable "Reformat code" on save

#### Run Configurations
```xml
<!-- .idea/runConfigurations/PasskeyVendorMock.xml -->
<configuration name="PasskeyVendorMock" type="Application">
    <option name="MAIN_CLASS_NAME" value="com.cvent.passkeyvendormock.PasskeyVendorMockServiceApplication"/>
    <option name="PROGRAM_PARAMETERS" value="server configs/dev.yaml"/>
    <option name="WORKING_DIRECTORY" value="$PROJECT_DIR$/passkey-vendor-mock-service"/>
</configuration>
```

### VS Code Setup

#### Extensions
- Extension Pack for Java
- Spring Boot Extension Pack
- XML Tools
- REST Client

#### Settings
```json
{
    "java.configuration.updateBuildConfiguration": "automatic",
    "java.format.settings.url": "https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml",
    "maven.executable.path": "/usr/local/bin/mvn"
}
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :7000

# Kill process
kill -9 <pid>

# Or use different port
java -jar target/passkey-vendor-mock-service-1.17.3-SNAPSHOT.jar server configs/dev.yaml --server.applicationConnectors[0].port=7001
```

#### Maven Build Failures
```bash
# Clear local repository
rm -rf ~/.m2/repository/com/cvent

# Rebuild with clean slate
mvn clean install -U

# Skip tests if needed
mvn clean package -DskipTests
```

#### Memory Issues
```bash
# Increase heap size
export MAVEN_OPTS="-Xmx2g -XX:MaxPermSize=512m"

# Run with increased memory
java -Xmx1g -jar target/passkey-vendor-mock-service-1.17.3-SNAPSHOT.jar server configs/dev.yaml
```

#### Configuration Issues
```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('configs/dev.yaml'))"

# Check property substitution
java -jar target/passkey-vendor-mock-service-1.17.3-SNAPSHOT.jar check configs/dev.yaml
```

### Logging and Monitoring

#### Application Logs
```bash
# Tail application logs
tail -f logs/application.log

# Search for errors
grep -i error logs/application.log

# Filter by timestamp
grep "2024-01-15" logs/application.log
```

#### JVM Monitoring
```bash
# JVM statistics
jstat -gc <pid> 5s

# Thread dump
jstack <pid> > threaddump.txt

# Memory usage
jmap -histo <pid>
```

## Contributing

### Pull Request Process
1. Create feature branch from `development`
2. Implement changes with tests
3. Run full test suite
4. Submit PR with description
5. Address review feedback
6. Merge after approval

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests cover new functionality
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

### Release Process
1. Update version in `pom.xml`
2. Update `CHANGELOG.md`
3. Create release branch
4. Deploy to staging
5. Validate functionality
6. Merge to master
7. Tag release
8. Deploy to production

## Additional Resources

## Supported Vendor Systems


### Hotel PMS/CRS Systems
- **Amadeus CRS** - Central Reservation System with OAuth2 authentication
- **Agilysys Stay/Versa** - Property Management System
- **Choice Hotels** - Hotel content and reservation management
- **Disney** - Custom reservation transfer system with OAuth2
- **Hilton** - Reservation transfer and DC Reservation endpoints
- **IHG** - InterContinental Hotels Group reservation system
- **Marriott** - Marriott reservation transfer system
- **Opera OXI** - Oracle Hospitality Integration Platform (async)
- **Opera OHIP** - Oracle Hospitality Integration Platform (sync)
- **Maestro PMS** - Property Management System
- **SynXis** - Sabre Hospitality reservation system
- **TravelTripper** - Hotel technology platform

### Specialized Systems
- **DerbySoft** - Group and individual reservation management
- **IcePortal** - Service endpoint integration
- **HMS** - Hotel Management System
- **LMS** - Learning Management System integration
- **SMS-HTNG** - Hotel Technology Next Generation messaging
- **V1-HTNG** - Version 1 HTNG protocol support

## Quick Start


### Prerequisites
- Java 25
- Maven 3.6+
- Docker (optional)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/cvent-internal/passkey-vendor-mock.git
cd passkey-vendor-mock
```

2. **Build the service**
```bash
mvn clean package -Prelease
```

3. **Run locally**
```bash
cd passkey-vendor-mock-service
java -jar target/passkey-vendor-mock-service-1.17.3-SNAPSHOT.jar server configs/dev.yaml
```

4. **Verify service is running**
```bash
curl http://localhost:7000/health
```

The service will be available at:
- **Application**: http://localhost:7000
- **Admin Interface**: http://localhost:7001

### Docker Setup

```bash
# Build Docker image
docker build -t passkey-vendor-mock .

# Run container
docker run -p 7000:7000 -p 7001:7001 passkey-vendor-mock
```

## Magic Keywords System


The service uses magic keywords in request payloads to control response behavior:

| Keyword | Description |
|---------|-------------|
| `RESPONSE success` | Returns successful response |
| `RESPONSE error` | Returns error response with reason |
| `RESPONSE succeedOnRetry` | Fails first call, succeeds on retry |
| `RESPONSE serverError` | Returns 500 status code |
| `RESPONSE clientError` | Returns 400 status code |
| `RESPONSE authError` | Returns 401 status code |
| `RESPONSE delayResult=n` | Delays response by n seconds |
| `RESPONSE noResult` | No result message (async only) |

## Example Usage


### Basic Reservation Transfer
```bash
curl -X POST http://localhost:7000/v1/sync/marriott \
  -H "Content-Type: application/xml" \
  -d '<reservation><guest><firstName>RESPONSE success</firstName></guest></reservation>'
```

### Async Transfer with Delay
```bash
curl -X POST http://localhost:7000/v1/async/opera?partnerId=123&vendorSystemId=456 \
  -H "Content-Type: application/xml" \
  -d '<reservation><guest><lastName>RESPONSE delayResult=5</lastName></guest></reservation>'
```

### OAuth2 Token Request
```bash
curl -X POST http://localhost:7000/v1/amadeus/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=test&client_secret=test"
```

## Environment Configuration


The service supports multiple deployment environments:
- **dev** - Local development
- **alpha** - Alpha testing environment
- **ts50** - Test environment
- **it50** - Integration testing
- **sg50** - Staging environment
- **pr50/pr51** - Production environments

## Health Checks


- **Application Health**: `GET /health`
- **Admin Interface**: `GET :7001/healthcheck`
- **Metrics**: `GET :7001/metrics`

## Support


- **Team**: Passkey API Team (meeseeksbox)
- **Slack**: #passkey-api
- **Jenkins**: [CI Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-vendor-mock)
- **Monitoring**: [Datadog APM](https://cvent.datadoghq.com/apm/services/passkey-vendor-mock-service)
