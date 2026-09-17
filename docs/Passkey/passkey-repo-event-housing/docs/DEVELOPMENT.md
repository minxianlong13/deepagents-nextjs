# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK 21 or Oracle JDK 21
- **Maven 3.9+**: Build and dependency management
- **Docker**: For containerized development and testing
- **Git**: Version control
- **IntelliJ IDEA** (recommended) or Eclipse: IDE with Java support

### Optional Tools
- **Postman**: API testing and development
- **Docker Compose**: Multi-container development environment
- **Couchbase Server**: Local database instance (or use Docker)
- **Node.js 18+**: For frontend tooling (pnpm, changesets)

### Environment Setup

#### Java Installation
```bash
# Using SDKMAN (recommended)
curl -s "https://get.sdkman.io" | bash
sdk install java 21.0.1-open
sdk use java 21.0.1-open

# Verify installation
java -version
javac -version
```

#### Maven Installation
```bash
# Using SDKMAN
sdk install maven 3.9.6

# Or download from Apache Maven website
# Verify installation
mvn -version
```

#### Docker Installation
Follow the official Docker installation guide for your operating system:
- [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/)
- [Docker Engine for Linux](https://docs.docker.com/engine/install/)

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-event-housing.git
cd passkey-event-housing
```

### 2. Configure Maven Settings
Ensure your Maven settings include Cvent's internal repositories:

```xml
<!-- ~/.m2/settings.xml -->
<settings>
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
          <url>https://nexus.cvent.org/repository/maven-public/</url>
        </repository>
      </repositories>
    </profile>
  </profiles>
  
  <activeProfiles>
    <activeProfile>cvent</activeProfile>
  </activeProfiles>
</settings>
```

### 3. Build Project
```bash
# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package application
mvn package
```

### 4. Database Setup

#### Option A: Docker Couchbase
```bash
# Start Couchbase container
docker run -d --name couchbase-dev \
  -p 8091-8096:8091-8096 \
  -p 11210-11211:11210-11211 \
  couchbase:community-7.2.0

# Access Couchbase Console at http://localhost:8091
# Create bucket: passkey-event-housing-dev
```

#### Option B: Local Couchbase Installation
1. Download and install Couchbase Server Community Edition
2. Create a bucket named `passkey-event-housing-dev`
3. Configure connection settings in `dev.yaml`

### 5. Configuration Setup
Create or update the development configuration file:

```yaml
# passkey-event-housing-service/configs/dev.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

couchbase:
  connectionString: "couchbase://localhost"
  username: "Administrator"
  password: "password"
  bucket: "passkey-event-housing-dev"
  connectTimeout: 10s
  kvTimeout: 2500ms

auth:
  serviceUrl: "https://auth-service.dev.cvent.org"
  clientId: "passkey-event-housing-dev"
  clientSecret: "${AUTH_CLIENT_SECRET}"

logging:
  level: DEBUG
  loggers:
    com.cvent.passkeyeventhousing: DEBUG
    org.eclipse.jetty: INFO
  appenders:
    - type: console
      threshold: DEBUG
      target: stdout
      logFormat: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n"
```

## Running the Service

### Command Line
```bash
# Navigate to service module
cd passkey-event-housing-service

# Run with development configuration
java -jar target/passkey-event-housing-service-1.4.6-SNAPSHOT.jar server configs/dev.yaml
```

### IntelliJ IDEA Configuration

#### Run Configuration Setup
1. **Create New Application Configuration**:
   - Main Class: `com.cvent.passkeyeventhousing.PasskeyEventHousingServiceApplication`
   - Program Arguments: `server configs/dev.yaml`
   - Working Directory: `$MODULE_WORKING_DIR$`
   - Use Classpath of Module: `passkey-event-housing-service`

2. **Environment Variables**:
   ```
   AUTH_CLIENT_SECRET=your-dev-secret
   COUCHBASE_USERNAME=Administrator
   COUCHBASE_PASSWORD=password
   ```

3. **VM Options** (optional):
   ```
   -Xmx2g
   -Dfile.encoding=UTF-8
   -Djava.awt.headless=true
   ```

#### Debug Configuration
- Enable debug mode by adding VM option: `-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005`
- Set breakpoints in your IDE
- Attach debugger to port 5005

### Docker Development
```bash
# Build Docker image
docker build -t passkey-event-housing-dev .

# Run with Docker
docker run -p 8080:8080 -p 8081:8081 \
  -e COUCHBASE_USERNAME=Administrator \
  -e COUCHBASE_PASSWORD=password \
  passkey-event-housing-dev
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=EventResourceTest

# Run tests with coverage
mvn test -Pcoverage

# View coverage report
open target/site/clover/index.html
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run specific feature file
mvn -Prun-it -Dkarate.options="--tags @smoke" verify
```

#### Running Integration Tests in IntelliJ
1. **Install Karate Plugin**: File → Settings → Plugins → Search "Karate"
2. **Configure VM Options**:
   ```
   -Dkarate.env=dev
   -Dkarate.config.dir=test_configs
   ```
3. **Run Feature Files**: Right-click on `.feature` files and select "Run"

### Test Configuration
```yaml
# passkey-event-housing-integration-test/test_configs/karate-config-dev.js
function fn() {
  var config = {
    baseUrl: 'http://localhost:8080',
    authToken: 'dev-auth-token'
  };
  
  return config;
}
```

## Code Structure

### Package Organization
```
com.cvent.passkeyeventhousing/
├── PasskeyEventHousingServiceApplication.java    # Main application class
├── PasskeyEventHousingServiceConfiguration.java # Configuration class
├── resources/                                    # REST endpoints
│   ├── EventResource.java
│   ├── BlockResource.java
│   ├── AdminResource.java
│   └── ...
├── service/                                      # Business logic
│   ├── EventService.java
│   ├── BlockService.java
│   └── ...
├── exceptions/                                   # Custom exceptions
├── health/                                       # Health checks
├── pagination/                                   # Pagination utilities
└── util/                                         # Common utilities
```

### Module Dependencies
```
passkey-event-housing-service
├── depends on: passkey-event-housing-api
├── depends on: passkey-event-housing-data-access
├── depends on: passkey-event-housing-shared
└── provides: REST API endpoints

passkey-event-housing-api
├── provides: API contracts and DTOs
└── no dependencies on other modules

passkey-event-housing-data-access
├── depends on: passkey-event-housing-shared
└── provides: Repository interfaces and implementations

passkey-event-housing-java-client
├── depends on: passkey-event-housing-api
└── provides: Java client library
```

## Coding Standards

### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: Maximum 120 characters
- **Naming Conventions**: 
  - Classes: PascalCase
  - Methods/Variables: camelCase
  - Constants: UPPER_SNAKE_CASE
- **Imports**: No wildcard imports, organize imports

### Code Quality Tools

#### Checkstyle Configuration
```xml
<!-- checkstyle.xml -->
<module name="Checker">
  <module name="TreeWalker">
    <module name="Indentation">
      <property name="basicOffset" value="4"/>
    </module>
    <module name="LineLength">
      <property name="max" value="120"/>
    </module>
    <module name="UnusedImports"/>
  </module>
</module>
```

#### Maven Checkstyle Plugin
```bash
# Run checkstyle validation
mvn checkstyle:check

# Generate checkstyle report
mvn checkstyle:checkstyle
```

### Documentation Standards
- **JavaDoc**: All public classes and methods must have JavaDoc
- **Comments**: Explain complex business logic
- **README Updates**: Update documentation for significant changes

```java
/**
 * Creates a new room block for the specified event.
 * 
 * @param eventId the unique identifier for the event
 * @param request the room block creation request
 * @return the created room block
 * @throws ValidationException if the request is invalid
 * @throws EventNotFoundException if the event does not exist
 */
@POST
@Path("/events/{eventId}/blocks")
public Response createRoomBlock(@PathParam("eventId") String eventId,
                               CreateRoomBlockRequest request) {
    // Implementation
}
```

## Common Development Tasks

### Adding a New REST Endpoint

1. **Define API Contract** (in `passkey-event-housing-api`):
```java
// Request/Response DTOs
public class CreateHotelRequest {
    private String name;
    private Address address;
    // getters/setters
}

public class HotelResponse {
    private String hotelId;
    private String name;
    // getters/setters
}
```

2. **Implement Resource** (in `passkey-event-housing-service`):
```java
@Path("/hotels")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class HotelResource {
    
    @POST
    public Response createHotel(@Valid CreateHotelRequest request) {
        // Implementation
        return Response.status(201).entity(response).build();
    }
}
```

3. **Register Resource** (in Application class):
```java
@Override
public void run(PasskeyEventHousingServiceConfiguration configuration,
                Environment environment) {
    environment.jersey().register(new HotelResource());
}
```

### Adding Database Operations

1. **Define Repository Interface**:
```java
public interface HotelRepository {
    Optional<Hotel> findById(String hotelId);
    Hotel save(Hotel hotel);
    List<Hotel> findByEventId(String eventId);
}
```

2. **Implement Repository**:
```java
@Repository
public class CouchbaseHotelRepository implements HotelRepository {
    
    @Override
    public Optional<Hotel> findById(String hotelId) {
        // Couchbase implementation
    }
}
```

### Adding Configuration Properties

1. **Update Configuration Class**:
```java
public class PasskeyEventHousingServiceConfiguration extends Configuration {
    
    @JsonProperty("newFeature")
    private NewFeatureConfiguration newFeature;
    
    // getter/setter
}
```

2. **Update Configuration File**:
```yaml
newFeature:
  enabled: true
  timeout: 30s
```

### Adding Health Checks

```java
public class CustomHealthCheck extends HealthCheck {
    
    @Override
    protected Result check() throws Exception {
        // Check external dependency
        if (isHealthy()) {
            return Result.healthy("Service is healthy");
        } else {
            return Result.unhealthy("Service is unhealthy");
        }
    }
}

// Register in Application class
environment.healthChecks().register("custom", new CustomHealthCheck());
```

## Debugging and Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Maven cache
mvn dependency:purge-local-repository

# Rebuild with clean slate
mvn clean install -U
```

#### Database Connection Issues
- Verify Couchbase is running: `docker ps` or check local installation
- Check connection string in configuration
- Verify bucket exists and credentials are correct

#### Authentication Issues
- Ensure auth service is accessible
- Verify client credentials in configuration
- Check network connectivity to auth service

### Logging Configuration
```yaml
logging:
  level: DEBUG
  loggers:
    com.cvent.passkeyeventhousing: DEBUG
    com.couchbase: INFO
    org.eclipse.jetty: WARN
```

### Performance Profiling
```bash
# Run with JVM profiling
java -XX:+FlightRecorder \
     -XX:StartFlightRecording=duration=60s,filename=profile.jfr \
     -jar target/passkey-event-housing-service.jar server configs/dev.yaml
```

## Git Workflow

### Branch Strategy
- **master**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature development branches
- **hotfix/**: Critical production fixes

### Commit Guidelines
```bash
# Commit message format
<type>(<scope>): <description>

# Examples
feat(api): add hotel creation endpoint
fix(database): resolve connection timeout issue
docs(readme): update setup instructions
```

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Ensure all tests pass and code coverage meets requirements
4. Create pull request with detailed description
5. Address code review feedback
6. Merge after approval

## IDE Configuration

### IntelliJ IDEA Settings
```json
{
  "codeStyleSettings": {
    "indentSize": 4,
    "tabSize": 4,
    "useTabCharacter": false,
    "rightMargin": 120
  },
  "inspectionSettings": {
    "enabledInspections": [
      "UnusedImport",
      "UnusedDeclaration",
      "NullableProblems"
    ]
  }
}
```

### Recommended Plugins
- **Lombok**: Reduces boilerplate code
- **SonarLint**: Code quality analysis
- **Karate**: Integration test support
- **Docker**: Container management
- **Maven Helper**: Dependency analysis

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-event-housing.git
   cd passkey-event-housing
   ```

2. **Build the project**:
   ```bash
   mvn clean package -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-event-housing-service
   java -jar target/passkey-event-housing-service-1.4.6-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Run with Docker**:
   ```bash
   docker build -t passkey-event-housing .
   docker run -p 8080:8080 passkey-event-housing
   ```

### IntelliJ Configuration

| Property         | Value                                                                 |
|------------------|-----------------------------------------------------------------------|
| SDK              | Java 21 SDK of `passkey-event-housing-service` module                |
| Module Classpath | `-cp passkey-event-housing-service`                                   |
| Main Class       | `com.cvent.passkeyeventhousing.PasskeyEventHousingServiceApplication` |
| Arguments        | `server passkey-event-housing-service/configs/dev.yaml`               |

## Service Information


- **Service ID**: `1fac8cc4-6914-4e0b-a594-fe74051b9da7`
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Planners Housing
- **Lifecycle**: Production

## Team Ownership


| Role      | Team        | Slack Channel           |
|-----------|-------------|-------------------------|
| Primary   | Metrestick  | `#passkey-metre-stick`  |
| Secondary | Meeseeksbox | `#passkey-meeseeks-box` |

## Useful Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-event-housing)
- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-event-housing-service)
- [Admin Portal](https://admin.core.cvent.org/serviceid/1fac8cc4-6914-4e0b-a594-fe74051b9da7)
- [Wiki Documentation](https://wiki.cvent.com/display/PASKY/Event+Housing+Service)

## Testing


### Unit Tests
```bash
mvn test
```

### Integration Tests
```bash
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
```

### Code Coverage
```bash
mvn clean install -Pcoverage
# Open target/site/clover/index.html in browser
```

## Build and Deployment


The service uses Maven for build management and Jenkins for CI/CD. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.
