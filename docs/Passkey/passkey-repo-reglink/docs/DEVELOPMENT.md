# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK 21 or later
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerization and local testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Optional Tools
- **Postman/Insomnia**: API testing
- **kubectl**: Kubernetes CLI for deployment testing
- **jq**: JSON processing for API responses
- **curl**: Command-line HTTP client

### Cvent Internal Setup
- **Nexus Access**: Configure Maven to use Cvent's internal Nexus repository
- **VPN Connection**: Required for accessing internal services
- **Cvent GitHub Access**: Access to cvent-internal organization

## Local Setup

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-reglink.git
cd passkey-reglink

# Verify Java version
java -version  # Should show Java 21

# Verify Maven version
mvn -version   # Should show Maven 3.6+
```

### 2. Maven Configuration
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

### 3. Build the Project
```bash
# Clean build with all modules
mvn clean package -Prelease

# Build with code coverage
mvn clean package -Pcoverage

# Skip tests for faster build
mvn clean package -DskipTests
```

### 4. IDE Setup

#### IntelliJ IDEA Configuration
1. **Import Project**: File → Open → Select `pom.xml`
2. **Java SDK**: Set Project SDK to Java 21
3. **Maven Integration**: Enable auto-import for Maven projects
4. **Code Style**: Import Cvent code style settings
5. **Plugins**: Install recommended plugins:
   - Maven Helper
   - SonarLint
   - CheckStyle-IDEA

#### Eclipse Configuration
1. **Import Project**: File → Import → Existing Maven Projects
2. **Java Build Path**: Set to Java 21
3. **Maven Integration**: Ensure M2E plugin is installed
4. **Code Formatting**: Import Cvent formatter settings

## Running the Service

### Local Development Mode
```bash
# Navigate to service module
cd passkey-reglink-service

# Run with development configuration
java -jar target/passkey-reglink-service-1.16.1-SNAPSHOT.jar server configs/dev.yaml

# Alternative: Run with Maven
mvn exec:java -Dexec.mainClass="com.cvent.passkey.reglink.PasskeyReglinkServiceApplication" -Dexec.args="server configs/dev.yaml"
```

### Service Endpoints
Once running, the service will be available at:
- **Main API**: http://localhost:8080
- **Admin Interface**: http://localhost:8081
- **Health Check**: http://localhost:8081/healthcheck
- **Metrics**: http://localhost:8081/metrics

### Docker Development
```bash
# Build Docker image
docker build -t passkey-reglink-service .

# Run container
docker run -p 8080:8080 -p 8081:8081 \
  -v $(pwd)/passkey-reglink-service/configs:/configs \
  passkey-reglink-service server /configs/dev.yaml
```

## Testing

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests with coverage
mvn test -Pcoverage

# Run specific test class
mvn test -Dtest=ReservationServiceTest

# Run specific test method
mvn test -Dtest=ReservationServiceTest#testCreateReservation
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn verify -Prun-it -Dkarate.env=dev -Dkarate.config.dir=test_configs

# Run specific feature file
mvn test -Dtest=PasskeyReglinkKarateTestIT -Dkarate.options="--tags @reservation"

# Run with verbose output
mvn verify -Prun-it -Dkarate.env=dev -Dkarate.options="--tags @smoke" -X
```

### Manual API Testing
```bash
# Health check
curl http://localhost:8081/healthcheck

# Get event availability (requires auth token)
curl -H "Authorization: Bearer <token>" \
     "http://localhost:8080/v1/events/event-123/availability?checkIn=2024-01-15&checkOut=2024-01-17"

# Create reservation (requires auth token)
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"eventId":"event-123","hotelId":"hotel-456","roomTypeId":"room-789","checkIn":"2024-01-15","checkOut":"2024-01-17","guest":{"firstName":"John","lastName":"Doe","email":"john.doe@example.com"}}' \
     http://localhost:8080/v1/reservations
```

## Code Structure

### Module Organization
```
passkey-reglink/
├── passkey-reglink-api/              # API contracts and models
│   └── src/main/java/com/cvent/passkey/reglink/api/
├── passkey-reglink-service/          # Main service implementation
│   ├── src/main/java/com/cvent/passkey/reglink/
│   │   ├── resources/               # JAX-RS REST endpoints
│   │   ├── service/                 # Business logic services
│   │   ├── client/                  # External service clients
│   │   └── exception/               # Exception handling
│   └── configs/                     # Environment configurations
├── passkey-reglink-data-access/      # Data access layer
├── passkey-reglink-shared/           # Shared utilities
├── passkey-reglink-auth/             # Authentication components
├── passkey-reglink-java-client/      # Java client library
└── passkey-reglink-integration-test/ # Integration tests
```

### Package Structure
```
com.cvent.passkey.reglink/
├── resources/                        # REST API endpoints
│   ├── EventResource.java
│   ├── ReservationResource.java
│   └── RoomBlockResource.java
├── service/                          # Business logic
│   ├── ReservationService.java
│   ├── RoomBlockService.java
│   └── EventService.java
├── client/                           # External service integration
│   ├── PasskeyHousingClient.java
│   └── GroupReservationsClient.java
├── model/                            # Data models
│   ├── request/
│   └── response/
└── exception/                        # Exception handling
    ├── ReglinkException.java
    └── mapper/
```

## Coding Standards

### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: 120 characters maximum
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Imports**: Organize imports, no wildcard imports
- **Comments**: Javadoc for public APIs, inline comments for complex logic

### Code Quality Tools
```bash
# Run Checkstyle
mvn checkstyle:check

# Run SpotBugs
mvn spotbugs:check

# Generate code coverage report
mvn jacoco:report
open target/site/jacoco/index.html
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/add-group-reservations

# Make changes and commit
git add .
git commit -m "feat: add group reservation endpoints"

# Push and create pull request
git push origin feature/add-group-reservations
```

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Common Development Tasks

### Adding a New REST Endpoint

1. **Define API Contract** (in `passkey-reglink-api`)
```java
@Path("/v1/new-endpoint")
public interface NewEndpointApi {
    @GET
    @Path("/{id}")
    Response getById(@PathParam("id") String id);
}
```

2. **Implement Resource** (in `passkey-reglink-service`)
```java
@Path("/v1/new-endpoint")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NewEndpointResource implements NewEndpointApi {
    
    @Inject
    private NewEndpointService service;
    
    @Override
    public Response getById(String id) {
        return Response.ok(service.findById(id)).build();
    }
}
```

3. **Create Service Class**
```java
@Service
public class NewEndpointService {
    public NewEndpointResponse findById(String id) {
        // Business logic implementation
    }
}
```

4. **Add Tests**
```java
public class NewEndpointResourceTest {
    @Test
    public void testGetById() {
        // Test implementation
    }
}
```

### Adding External Service Integration

1. **Create Client Interface**
```java
public interface ExternalServiceClient {
    ExternalServiceResponse callExternalService(ExternalServiceRequest request);
}
```

2. **Implement Client**
```java
@Component
public class ExternalServiceClientImpl implements ExternalServiceClient {
    
    @Inject
    private Client httpClient;
    
    @Override
    public ExternalServiceResponse callExternalService(ExternalServiceRequest request) {
        return httpClient.target(baseUrl)
                        .path("/endpoint")
                        .request()
                        .post(Entity.json(request))
                        .readEntity(ExternalServiceResponse.class);
    }
}
```

3. **Configure Client**
```yaml
# In configs/dev.yaml
clients:
  externalService:
    baseUrl: "https://external-service.dev.cvent.com"
    timeout: 30s
    retries: 3
```

### Debugging Tips

#### Enable Debug Logging
```yaml
# In configs/dev.yaml
logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.reglink: DEBUG
    org.apache.http.wire: DEBUG  # HTTP request/response logging
```

#### Remote Debugging
```bash
# Run with remote debugging enabled
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-reglink-service-1.16.1-SNAPSHOT.jar server configs/dev.yaml
```

#### Memory Analysis
```bash
# Generate heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc
jcmd <pid> GC.dump_heap heap.hprof

# Analyze with Eclipse MAT or VisualVM
```

### Performance Testing

#### Load Testing with JMeter
```bash
# Install JMeter
brew install jmeter  # macOS
# or download from https://jmeter.apache.org/

# Run load test
jmeter -n -t load-test.jmx -l results.jtl
```

#### Profiling with JProfiler
```bash
# Run with JProfiler agent
java -agentpath:/path/to/jprofiler/bin/agent.jar=port=8849 \
     -jar target/passkey-reglink-service-1.16.1-SNAPSHOT.jar server configs/dev.yaml
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

#### Port Conflicts
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <pid>
```

#### Authentication Issues
```bash
# Generate test token (dev environment only)
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}' \
     http://auth-service.dev.cvent.com/token
```

#### External Service Connectivity
```bash
# Test connectivity to external services
curl -v https://passkey-bridge-service.dev.cvent.com/health

# Check DNS resolution
nslookup passkey-bridge-service.dev.cvent.com
```

### Getting Help

1. **Documentation**: Check this guide and API documentation
2. **Team Chat**: Reach out in #passkey-reglink Slack channel
3. **Code Review**: Create draft PR for early feedback
4. **Pair Programming**: Schedule session with team member
5. **Architecture Review**: Discuss design changes with tech lead

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Access to Cvent's internal Nexus repository

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cvent-internal/passkey-reglink.git
   cd passkey-reglink
   ```

2. **Build the project**
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**
   ```bash
   cd passkey-reglink-service
   java -jar target/passkey-reglink-service-1.16.1-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Access API Documentation**
   - API Docs: https://developers.cvent.com/doc/passkey/reglink-api/#1337

### Running Tests

```bash
# Unit tests with coverage
mvn clean install -Pcoverage

# Integration tests
mvn -Prun-it -Dkarate.env=dev -Dkarate.config.dir=test_configs verify
```

## Service Endpoints


The service provides REST endpoints organized by functional areas:

- `/v1/events/*` - Event management and availability
- `/v1/reservations/*` - Individual reservation operations
- `/v1/room-blocks/*` - Room block management
- `/v1/housing-events/*` - Housing event lifecycle
- `/v1/library/*` - Template and reference data
- `/v1/associations/*` - Registration link management
- `/v1/connections/*` - Bridge operations

## Environment Information


- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Planners Housing
- **Lifecycle**: Production
- **Owner**: meeseeksbox team

## Monitoring & Observability


- **APM**: [Datadog APM](https://cvent.datadoghq.com/apm/services/passkey-reglink-service/operations)
- **Logs**: [Datadog Logs](https://cvent.datadoghq.com/logs?query=env%3Apr50+service%3Apasskey-reglink-service)
- **CI/CD**: [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-reglink)

## Getting Help


- Check the [API Documentation](https://developers.cvent.com/doc/passkey/reglink-api/#1337) for endpoint details
- Review integration test examples in the `passkey-reglink-integration-test` module
- Consult the HTTP request examples in the root directory for common use cases
