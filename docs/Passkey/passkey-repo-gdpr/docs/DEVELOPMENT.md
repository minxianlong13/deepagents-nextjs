# Development Guide

## Prerequisites

### Required Software
- **Java 17** - OpenJDK or Oracle JDK
- **Maven 3.6+** - Build tool and dependency management
- **Docker** - For containerized development and testing
- **Git** - Version control
- **IDE** - IntelliJ IDEA, Eclipse, or VS Code with Java extensions

### Development Tools
- **oktaws** - AWS credential management for Cvent developers
- **pnpm** - Package manager for frontend tooling
- **curl** - API testing
- **jq** - JSON processing for API responses

### Access Requirements
- **GitHub Access** - cvent-internal organization membership
- **AWS Access** - For DynamoDB integration (via oktaws)
- **LaunchDarkly Access** - For feature flag SDK key
- **VPN Connection** - For accessing internal Cvent services

## Local Setup

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-gdpr.git
cd passkey-gdpr

# Verify Java version
java -version  # Should be Java 17

# Verify Maven installation
mvn -version   # Should be 3.6+
```

### 2. Maven Configuration
Ensure your Maven settings include Cvent's internal Nexus repository. If not configured, follow the [Maven Setup Guide](https://wiki/display/DEV/Maven+Setup).

**Verify Nexus access:**
```bash
mvn dependency:resolve-sources
```

### 3. Environment Configuration

#### AWS Credentials Setup
```bash
# Install oktaws if not already installed
# Follow: https://wiki.cvent.com/pages/viewpage.action?spaceKey=AWS&title=Oktaws

# Get AWS credentials for DynamoDB access
oktaws

# Verify credentials
aws sts get-caller-identity
```

#### LaunchDarkly Configuration
Create `.env.local` file in the project root:
```bash
# Create environment file
cat > .env.local << EOF
launchDarklySdkKey=<REPLACE_WITH_SHARED_SDK_KEY>
EOF
```

Get the SDK key from [LaunchDarkly Development Environment](https://app.launchdarkly.com/projects/cross-product/settings/environments?env=development):
1. Click the ellipsis (...) next to "Development" environment
2. Select "SDK key"
3. Copy the key to your `.env.local` file

### 4. Database Setup (Optional)
For full local development, you may need access to a development database:
```bash
# Set database environment variables
export DB_HOST=dev-oracle-host.cvent.com
export DB_PORT=1521
export DB_NAME=DEVDB
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
```

## Building the Project

### Standard Build
```bash
# Clean and compile
mvn clean compile

# Run tests and package
mvn clean package

# Build with release profile (recommended)
mvn clean package -Prelease
```

### Build Profiles

#### Release Profile
```bash
# Production-ready build
mvn clean package -Prelease
```

#### Coverage Profile
```bash
# Build with code coverage analysis
mvn clean package -Pcoverage

# View coverage report
open target/site/jacoco/index.html
```

#### Integration Test Profile
```bash
# Run integration tests (requires running service)
mvn clean verify -Prun-it -Denv.IT_ENVIRONMENT=dev
```

## Running the Service

### Local Development Server
```bash
# Navigate to service module
cd passkey-gdpr-service

# Run with development configuration
java -jar target/passkey-gdpr-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
```

### Alternative: Using Maven
```bash
# From project root
mvn exec:java -pl passkey-gdpr-service \
  -Dexec.mainClass="com.cvent.passkeygdpr.PasskeyGdprServiceApplication" \
  -Dexec.args="server passkey-gdpr-service/configs/dev.yaml"
```

### Docker Development
```bash
# Build Docker image
docker build -t passkey-gdpr-dev .

# Run container
docker run -p 8080:8080 -p 8081:8081 \
  -e DB_HOST=host.docker.internal \
  -e LAUNCH_DARKLY_SDK_KEY=your_sdk_key \
  passkey-gdpr-dev
```

### Service Endpoints
Once running, the service will be available at:
- **API**: http://localhost:8080
- **Admin**: http://localhost:8081
- **Health Check**: http://localhost:8081/healthcheck
- **Metrics**: http://localhost:8081/metrics

## Code Structure

### Module Organization
```
passkey-gdpr/
├── passkey-gdpr-api/              # API contracts and DTOs
│   ├── src/main/java/             # Java source files
│   ├── openapi.json               # Generated OpenAPI spec
│   └── openapi.yaml               # Generated OpenAPI spec
├── passkey-gdpr-service/          # Main service implementation
│   ├── src/main/java/com/cvent/passkeygdpr/
│   │   ├── PasskeyGdprServiceApplication.java    # Main class
│   │   ├── PasskeyGdprServiceConfiguration.java  # Configuration
│   │   ├── resources/             # JAX-RS REST endpoints
│   │   ├── services/              # Business logic
│   │   ├── actions/               # Action handlers
│   │   ├── configuration/         # Config classes
│   │   ├── health/                # Health checks
│   │   └── utils/                 # Utility classes
│   └── configs/                   # Environment configurations
├── passkey-gdpr-data-access/      # Database layer
├── passkey-gdpr-shared/           # Common utilities
├── passkey-gdpr-java-client/      # Client library
└── passkey-gdpr-integration-test/ # Integration tests
```

### Package Structure
```java
com.cvent.passkeygdpr
├── resources/          // JAX-RS REST endpoints
│   ├── AdminResource.java
│   ├── PasskeyGdprResource.java
│   ├── BatchObfuscationResource.java
│   └── OpenApiResource.java
├── services/           // Business logic services
├── actions/            // Command/action handlers
├── configuration/      // Configuration classes
├── health/             // Health check implementations
├── exceptionmapper/    // Exception handling
└── utils/              // Utility classes
```

## Testing

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-gdpr-service

# Run specific test class
mvn test -Dtest=PasskeyGdprResourceTest

# Run with coverage
mvn test -Pcoverage
```

### Integration Tests
```bash
# Start the service locally first
cd passkey-gdpr-service
java -jar target/passkey-gdpr-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml

# In another terminal, run integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
```

### API Testing with curl
```bash
# Health check
curl http://localhost:8081/healthcheck

# Get service info
curl http://localhost:8081/admin/info

# Test GDPR endpoint (requires auth token)
curl -X POST http://localhost:8080/gdpr/obfuscate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "entityId": "test-user-123",
    "entityType": "USER",
    "fields": ["email", "firstName"],
    "reason": "GDPR_REQUEST",
    "requestId": "test-req-456"
  }'
```

## Coding Standards

### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: 120 characters maximum
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Imports**: Organize imports, no wildcard imports
- **Comments**: JavaDoc for public APIs, inline comments for complex logic

### Code Quality Tools
```bash
# Run Checkstyle
mvn checkstyle:check

# Run SpotBugs
mvn spotbugs:check

# Run PMD
mvn pmd:check

# Run all quality checks
mvn verify -Pquality
```

### Example Code Style
```java
/**
 * Service for handling GDPR obfuscation requests.
 */
@Service
public class GdprObfuscationService {
    
    private static final Logger logger = LoggerFactory.getLogger(GdprObfuscationService.class);
    
    private final GdprRequestRepository repository;
    private final GdprMaskServiceClient maskServiceClient;
    
    public GdprObfuscationService(GdprRequestRepository repository, 
                                  GdprMaskServiceClient maskServiceClient) {
        this.repository = repository;
        this.maskServiceClient = maskServiceClient;
    }
    
    /**
     * Processes a GDPR obfuscation request.
     *
     * @param request the obfuscation request
     * @return the processing result
     * @throws GdprProcessingException if processing fails
     */
    public ObfuscationResult processRequest(GdprRequest request) throws GdprProcessingException {
        logger.info("Processing GDPR request", 
            kv("requestId", request.getRequestId()),
            kv("entityId", request.getEntityId()));
        
        try {
            // Implementation here
            return result;
        } catch (Exception e) {
            logger.error("Failed to process GDPR request", 
                kv("requestId", request.getRequestId()), e);
            throw new GdprProcessingException("Processing failed", e);
        }
    }
}
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Define the API contract** in `passkey-gdpr-api` module
2. **Create the resource class** in `passkey-gdpr-service/src/main/java/com/cvent/passkeygdpr/resources/`
3. **Implement business logic** in a service class
4. **Add unit tests** for the new functionality
5. **Update OpenAPI documentation** (auto-generated from annotations)
6. **Add integration tests** in the integration test module

### Example: Adding a new endpoint
```java
@Path("/gdpr/export")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DataExportResource {
    
    @POST
    @Operation(summary = "Export user data for GDPR compliance")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Export successful"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public Response exportUserData(@Valid ExportRequest request) {
        // Implementation
        return Response.ok(result).build();
    }
}
```

### Adding Configuration Properties

1. **Add property to configuration class**:
```java
public class PasskeyGdprServiceConfiguration extends Configuration {
    @JsonProperty
    private String newProperty;
    
    public String getNewProperty() {
        return newProperty;
    }
}
```

2. **Update configuration files** in `configs/` directory
3. **Use in service classes** via dependency injection

### Database Schema Changes

1. **Create migration script** (coordinate with DBA)
2. **Update entity classes** in data-access module
3. **Update MyBatis mappers** if needed
4. **Test with local database**
5. **Update integration tests**

## Debugging

### Local Debugging
```bash
# Run with debug port enabled
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
  -jar target/passkey-gdpr-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
```

### IDE Configuration
- **IntelliJ IDEA**: Create remote debug configuration pointing to localhost:5005
- **Eclipse**: Use Remote Java Application debug configuration
- **VS Code**: Configure launch.json for remote debugging

### Logging Configuration
```yaml
# Increase log level for debugging
logging:
  level: DEBUG
  loggers:
    com.cvent.passkeygdpr: DEBUG
    org.apache.http: DEBUG  # For HTTP client debugging
```

### Common Issues and Solutions

#### Build Issues
```bash
# Clear Maven cache
mvn dependency:purge-local-repository

# Force update dependencies
mvn clean install -U

# Skip tests if needed
mvn clean package -DskipTests
```

#### Database Connection Issues
```bash
# Test database connectivity
telnet $DB_HOST $DB_PORT

# Check credentials
echo "SELECT 1 FROM DUAL;" | sqlplus $DB_USERNAME/$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
```

#### Docker Issues
```bash
# Clean Docker environment
docker system prune -a

# Check container logs
docker logs <container-id>

# Interactive debugging
docker run -it --entrypoint /bin/sh passkey-gdpr-dev
```

## Contributing

### Git Workflow
1. **Create feature branch**: `git checkout -b feature/your-feature-name`
2. **Make changes** and commit with descriptive messages
3. **Push branch**: `git push origin feature/your-feature-name`
4. **Create pull request** in GitHub
5. **Address review feedback**
6. **Merge after approval**

### Commit Message Format
```
type(scope): brief description

Longer description if needed

Fixes #issue-number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Checklist
- [ ] Code follows style guidelines
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Security considerations addressed

## Getting Help

### Internal Resources
- **Team**: cherry-pickers team
- **Slack**: #passkey-gdpr-dev
- **Wiki**: [Passkey GDPR Documentation](https://wiki.cvent.com/passkey-gdpr)
- **Backstage**: [Service Page](https://backstage.core.cvent.org/catalog/default/component/passkey-gdpr-service)

### External Resources
- **Dropwizard Documentation**: https://www.dropwizard.io/
- **Maven Documentation**: https://maven.apache.org/guides/
- **Java 17 Documentation**: https://docs.oracle.com/en/java/javase/17/

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for containerized deployment)
- AWS credentials (for DynamoDB access)
- LaunchDarkly SDK key

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cvent-internal/passkey-gdpr.git
   cd passkey-gdpr
   ```

2. **Build the service**
   ```bash
   mvn package -Prelease
   ```

3. **Set up AWS credentials** (for batch obfuscation)
   ```bash
   oktaws
   ```

4. **Configure LaunchDarkly** (create `.env.local` in packages/app)
   ```
   launchDarklySdkKey=<YOUR_SDK_KEY>
   ```

5. **Run the service**
   ```bash
   cd passkey-gdpr-service
   java -jar target/passkey-gdpr-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
   ```

### API Documentation
- **OpenAPI Spec**: Available at `/{env}/passkey-gdpr/openapi.{yaml|json}`
- **Swagger UI**: Run `./swagger.sh` and access at http://localhost

## Service Information


- **Owner**: cherry-pickers team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
- **Lifecycle**: Production
- **Technology**: Java 17, Dropwizard, Maven

## Links


- [Backstage Service](https://backstage.core.cvent.org/catalog/default/component/passkey-gdpr-service)
- [API Documentation](https://backstage.core.cvent.org/catalog/default/api/passkey-gdpr-api)
- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-gdpr)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-gdpr-service)

## Getting Help


For questions or support, contact the cherry-pickers team or refer to the [DEVELOPMENT.md](./DEVELOPMENT.md) guide for detailed development instructions.
