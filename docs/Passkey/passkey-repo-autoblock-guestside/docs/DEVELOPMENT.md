# Development Guide

## Prerequisites

### Required Software

#### Java Development Kit
- **Version**: Java 17 (OpenJDK or Oracle JDK)
- **Installation**: 
  ```bash
  # Using SDKMAN (recommended)
  curl -s "https://get.sdkman.io" | bash
  sdk install java 17.0.2-open
  
  # Using Homebrew (macOS)
  brew install openjdk@17
  
  # Verify installation
  java -version
  javac -version
  ```

#### Apache Maven
- **Version**: Maven 3.6 or higher
- **Installation**:
  ```bash
  # Using SDKMAN
  sdk install maven 3.8.6
  
  # Using Homebrew (macOS)
  brew install maven
  
  # Verify installation
  mvn -version
  ```

#### Docker (Optional)
- **Version**: Docker 20.10 or higher
- **Installation**: Download from [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Verification**: `docker --version`

### Development Tools

#### Recommended IDEs
- **IntelliJ IDEA**: Ultimate or Community Edition
- **Eclipse**: With Maven integration
- **Visual Studio Code**: With Java Extension Pack
- **NetBeans**: Built-in Maven support

#### IDE Configuration

##### IntelliJ IDEA Setup
1. **Import Project**: File → Open → Select `pom.xml`
2. **SDK Configuration**: File → Project Structure → Project → SDK: Java 17
3. **Code Style**: Import `checkstyle.xml` from project root
4. **Plugins**: Install Lombok plugin if using Lombok annotations

##### Eclipse Setup
1. **Import Project**: File → Import → Existing Maven Projects
2. **Java Build Path**: Configure Java 17 as project JRE
3. **Code Formatter**: Import Eclipse formatter configuration
4. **Maven Integration**: Ensure m2e plugin is installed

## Local Setup

### Environment Configuration

#### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-autoblock-guestside.git
cd passkey-autoblock-guestside
```

#### 2. Configure Maven Settings
Ensure access to Cvent's internal Nexus repository:

```xml
<!-- ~/.m2/settings.xml -->
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

#### 3. Set Environment Variables
Create a local environment configuration:

```bash
# .env (for local development)
export AUTH_SERVICE_URL=http://localhost:9001
export HOTEL_SERVICE_URL=http://localhost:9002
export EVENT_SERVICE_URL=http://localhost:9003
export INVENTORY_SERVICE_URL=http://localhost:9004
export AUTOBLOCK_DATA_SERVICE_URL=http://localhost:9005
export BUSINESS_TEXT_SERVICE_URL=http://localhost:9006
export LOG_LEVEL=DEBUG
export RATE_LIMIT_ENABLED=false
```

#### 4. Local Configuration File
Create or modify `passkey-autoblock-guestside-service/configs/local.yaml`:

```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
      bindHost: localhost
  adminConnectors:
    - type: http
      port: 8081
      bindHost: localhost

# Service client configurations for local development
autoblockGuestside:
  hotelService:
    baseUrl: "http://localhost:9002"
    timeout: 30s
    retries: 3
    
  eventService:
    baseUrl: "http://localhost:9003"
    timeout: 30s
    retries: 3

# Disable authentication for local development
auth:
  enabled: false

# Enable debug logging
logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.autoblockguestside: DEBUG
    com.cvent.auth: INFO
    org.eclipse.jetty: INFO
```

### Building the Project

#### Full Build
```bash
# Clean and compile all modules
mvn clean compile

# Run tests and package
mvn package

# Build with release profile (optimized)
mvn package -Prelease
```

#### Module-Specific Builds
```bash
# Build only the service module
cd passkey-autoblock-guestside-service
mvn package

# Build only the API module
cd passkey-autoblock-guestside-api
mvn package
```

#### Skip Tests (for faster builds)
```bash
mvn package -DskipTests
```

## Running the Service

### Local Development Server

#### Standard Startup
```bash
cd passkey-autoblock-guestside-service
java -jar target/passkey-autoblock-guestside-service-1.1.10-SNAPSHOT.jar server configs/local.yaml
```

#### Debug Mode
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-autoblock-guestside-service-1.1.10-SNAPSHOT.jar \
     server configs/local.yaml
```

#### With Environment Variables
```bash
# Load environment variables
source .env

# Start service
java -jar target/passkey-autoblock-guestside-service-1.1.10-SNAPSHOT.jar server configs/local.yaml
```

### Docker Development

#### Build Docker Image
```bash
# Build the application first
mvn package -Prelease

# Build Docker image
docker build -t passkey-autoblock-guestside:local .
```

#### Run with Docker
```bash
docker run -p 8080:8080 -p 8081:8081 \
  -e AUTH_SERVICE_URL=http://host.docker.internal:9001 \
  -e HOTEL_SERVICE_URL=http://host.docker.internal:9002 \
  passkey-autoblock-guestside:local
```

#### Docker Compose (with dependencies)
```yaml
# docker-compose.yml
version: '3.8'
services:
  autoblock-guestside:
    build: .
    ports:
      - "8080:8080"
      - "8081:8081"
    environment:
      - AUTH_SERVICE_URL=http://auth-service:8080
      - HOTEL_SERVICE_URL=http://hotel-service:8080
    depends_on:
      - auth-service
      - hotel-service
      
  # Mock services for development
  auth-service:
    image: mockserver/mockserver:latest
    ports:
      - "9001:1080"
      
  hotel-service:
    image: mockserver/mockserver:latest
    ports:
      - "9002:1080"
```

### Service Verification

#### Health Check
```bash
# Check service health
curl http://localhost:8081/healthcheck

# Expected response
{
  "deadlocks": {
    "healthy": true
  },
  "diskSpace": {
    "healthy": true,
    "freeBytes": 123456789,
    "threshold": 1073741824
  }
}
```

#### API Testing
```bash
# Test main endpoint
curl http://localhost:8080/

# Test with parameters
curl "http://localhost:8080/?surveyId=test123&eventId=event456"

# Test admin endpoints
curl http://localhost:8081/metrics
curl http://localhost:8081/threads
```

## Running Tests

### Unit Tests

#### Run All Tests
```bash
mvn test
```

#### Run Specific Test Class
```bash
mvn test -Dtest=AutoblockGuestsideResourceTest
```

#### Run Tests with Coverage
```bash
mvn test -Pcoverage
# View coverage report at target/site/jacoco/index.html
```

### Integration Tests

#### Local Integration Tests
```bash
# Run integration tests against local environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=local verify
```

#### Development Environment Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
```

#### Test Configuration
Integration tests use environment-specific configuration:

```yaml
# passkey-autoblock-guestside-integration-test/src/test/resources/local.yaml
testEnvironment:
  baseUrl: "http://localhost:8080"
  adminUrl: "http://localhost:8081"
  timeout: 30s
  
testData:
  validSurveyId: "test-survey-123"
  validEventId: "test-event-456"
  validHotelId: "test-hotel-789"
```

### Test Data Management

#### Mock Data Setup
```java
// Example test data setup
@BeforeEach
void setUp() {
    // Setup mock responses for service dependencies
    mockHotelService.stubFor(get(urlEqualTo("/hotels/test-hotel-789"))
        .willReturn(aResponse()
            .withStatus(200)
            .withHeader("Content-Type", "application/json")
            .withBody(loadTestData("hotel-response.json"))));
}
```

#### Test Utilities
```java
// Common test utilities
public class TestDataLoader {
    public static String loadTestData(String filename) {
        // Load test data from resources
    }
    
    public static SurveyRequestMetaData createTestSurvey() {
        // Create test survey data
    }
}
```

## Code Structure

### Package Organization

```
com.cvent.passkey.autoblockguestside/
├── resources/              # JAX-RS resources (controllers)
│   ├── AccessResource.java
│   ├── AdminResource.java
│   ├── AutoblockGuestsideResource.java
│   └── views/              # Nucleus view classes
├── services/               # Business logic services
│   └── AutoBlockGuestSideSiteService.java
├── utils/                  # Utility classes
│   ├── AccessTokenProcessorUtil.java
│   ├── AccessTokenProcessorAdminUtil.java
│   └── RefreshTokenClientContainer.java
├── mappers/                # Exception mappers
│   ├── AccessExceptionMapper.java
│   ├── RuntimeExceptionMapper.java
│   ├── TooManyRequestsExceptionMapper.java
│   ├── UnauthorizedExceptionMapper.java
│   └── WizardConfigurationExceptionMapper.java
├── PasskeyAutoblockGuestsideServiceApplication.java
├── PasskeyAutoblockGuestsideServiceConfiguration.java
└── PasskeyAutoblockGuestsideServiceClientConfiguration.java
```

### Coding Standards

#### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: 120 characters maximum
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Imports**: Organize imports, no wildcard imports
- **Comments**: JavaDoc for public methods and classes

#### Checkstyle Configuration
The project uses Checkstyle for code quality enforcement:

```bash
# Run checkstyle validation
mvn checkstyle:check

# Generate checkstyle report
mvn checkstyle:checkstyle
# View report at target/site/checkstyle.html
```

#### Code Formatting
```xml
<!-- Maven Checkstyle Plugin Configuration -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.1.2</version>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
        <encoding>UTF-8</encoding>
        <consoleOutput>true</consoleOutput>
        <failsOnError>true</failsOnError>
    </configuration>
</plugin>
```

### Best Practices

#### Resource Classes
```java
@Path("/api/v1/surveys")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SurveyResource {
    
    @GET
    @Path("/{surveyId}")
    @Timed(name = "getSurvey")
    public Response getSurvey(@PathParam("surveyId") String surveyId) {
        // Implementation
    }
}
```

#### Service Classes
```java
@Singleton
public class SurveyService {
    
    private final HotelServiceClient hotelClient;
    private final EventServiceClient eventClient;
    
    @Inject
    public SurveyService(HotelServiceClient hotelClient, 
                        EventServiceClient eventClient) {
        this.hotelClient = hotelClient;
        this.eventClient = eventClient;
    }
    
    public SurveyData getSurveyData(String surveyId) {
        // Business logic implementation
    }
}
```

#### Exception Handling
```java
@Provider
public class ServiceExceptionMapper implements ExceptionMapper<ServiceException> {
    
    @Override
    public Response toResponse(ServiceException exception) {
        return Response.status(exception.getStatusCode())
                .entity(new ErrorResponse(exception.getMessage()))
                .build();
    }
}
```

## Common Development Tasks

### Adding a New Endpoint

1. **Define API Model** (in `-api` module):
```java
public class NewFeatureRequest {
    private String parameter;
    // getters/setters
}
```

2. **Create Resource Method**:
```java
@POST
@Path("/new-feature")
public Response newFeature(NewFeatureRequest request) {
    // Implementation
}
```

3. **Add Business Logic**:
```java
public class NewFeatureService {
    public NewFeatureResponse processRequest(NewFeatureRequest request) {
        // Business logic
    }
}
```

4. **Write Tests**:
```java
@Test
void testNewFeature() {
    // Test implementation
}
```

### Adding Service Dependencies

1. **Add Maven Dependency**:
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>new-service-java-client</artifactId>
    <version>1.0.0</version>
</dependency>
```

2. **Configure Client**:
```yaml
# In configuration file
autoblockGuestside:
  newService:
    baseUrl: "${NEW_SERVICE_URL}"
    timeout: 30s
```

3. **Inject Client**:
```java
@Inject
private NewServiceClient newServiceClient;
```

### Debugging Tips

#### Common Issues
- **Port Conflicts**: Ensure ports 8080/8081 are available
- **Maven Dependencies**: Clear local repository if build fails
- **Service Dependencies**: Use mock services for local development
- **Configuration**: Verify environment variables and config files

#### Debugging Tools
- **JVM Debug Port**: 5005 (configured in debug startup)
- **Admin Interface**: http://localhost:8081 for metrics and health
- **Log Files**: Check console output and log files
- **Profiling**: Use JProfiler or similar tools for performance analysis

#### Log Analysis
```bash
# Filter logs by level
grep "ERROR" logs/application.log

# Search for specific patterns
grep "surveyId.*123" logs/application.log

# Monitor logs in real-time
tail -f logs/application.log
```

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Access to Cvent's internal Nexus repository

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-autoblock-guestside.git
   cd passkey-autoblock-guestside
   ```

2. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-autoblock-guestside-service
   java -jar target/passkey-autoblock-guestside-service-1.1.10-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Access the service**:
   - Main application: `http://localhost:8080`
   - Admin interface: `http://localhost:8081`
   - API documentation: `http://localhost:8081/api-docs`

### Running Tests

```bash
# Unit tests
mvn test

# Integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Code coverage
mvn package -Pcoverage
# View coverage report at target/site/jacoco/index.html
```

## Support


- **Team**: metre-stick
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
- **Lifecycle**: Production

## Links


- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-autoblock-guestside-service)
- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-autoblock-guestside)
- [Wiki Documentation](https://wiki.cvent.com/display/DEV/Passkey+Resdesk%3A+Auto-block+Survey+Website+creation+with+Site+Designer)
