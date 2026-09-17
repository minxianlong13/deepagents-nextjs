# Development Guide

## Prerequisites

Before setting up the development environment, ensure you have the following installed:

### Required Software
- **Java 17**: OpenJDK 17 or Oracle JDK 17
- **Maven 3.6+**: For building and dependency management
- **Docker**: For containerization and local services
- **Git**: For version control
- **IDE**: IntelliJ IDEA, Eclipse, or NetBeans (NetBeans configuration included)

### Optional Tools
- **Postman**: For API testing
- **Docker Compose**: For local service orchestration
- **kubectl**: For Kubernetes development
- **Node.js 18+**: For frontend development tools (pnpm, documentation generation)

### Environment Setup

1. **Java Configuration**:
   ```bash
   # Verify Java version
   java -version
   # Should show Java 17
   
   # Set JAVA_HOME if needed
   export JAVA_HOME=/path/to/java17
   ```

2. **Maven Configuration**:
   Ensure your Maven settings include Cvent's internal Nexus repository. Follow the [Maven Installation and Setup guide](https://wiki.cvent.com/display/DEV/Maven+Installation+and+Setup).

3. **Docker Setup**:
   ```bash
   # Verify Docker installation
   docker --version
   docker-compose --version
   ```

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-permission.git
cd passkey-permission
```

### 2. Build Project

```bash
# Clean build with all modules
mvn clean package -Prelease

# Build without running tests (faster for initial setup)
mvn clean package -Prelease -DskipTests
```

### 3. IDE Configuration

#### IntelliJ IDEA
1. Open the project root directory
2. Import as Maven project
3. Set Project SDK to Java 17
4. Enable annotation processing for Dropwizard
5. Install recommended plugins:
   - Maven Helper
   - SonarLint
   - CheckStyle-IDEA

#### NetBeans
The project includes `nb-configuration.xml` with pre-configured settings:
- Java platform: JDK 17
- Maven goals and profiles
- Code formatting rules

#### Eclipse
1. Import as "Existing Maven Projects"
2. Set compiler compliance level to 17
3. Configure code formatter with project settings

### 4. Database Setup

For local development, you can use either:

#### Option A: Local Oracle Database (Recommended for full testing)
```bash
# Using Docker
docker run -d \
  --name oracle-local \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  -e ORACLE_DATABASE=XEPDB1 \
  container-registry.oracle.com/database/express:latest
```

#### Option B: H2 In-Memory Database (Quick development)
Update `dev.yaml` configuration:
```yaml
database:
  driverClass: org.h2.Driver
  url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
  user: sa
  password: ""
```

### 5. Configuration

Create local configuration file:
```bash
cp passkey-permission-service/configs/dev.yaml passkey-permission-service/configs/local.yaml
```

Update `local.yaml` with your local settings:
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  url: jdbc:oracle:thin:@localhost:1521:XEPDB1
  user: passkey_dev
  password: password

authService:
  baseUrl: https://dev-auth.cvent.com
  apiKey: your-dev-api-key

logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.permission: DEBUG
```

### 6. Run Application

```bash
cd passkey-permission-service

# Run with local configuration
java -jar target/passkey-permission-service-1.1.6-SNAPSHOT.jar server configs/local.yaml

# Or run with dev configuration
java -jar target/passkey-permission-service-1.1.6-SNAPSHOT.jar server configs/dev.yaml
```

### 7. Verify Setup

Test the service is running:
```bash
# Health check
curl http://localhost:8081/healthcheck

# API test (requires valid API key)
curl -H "Authorization: ApiKey YOUR_API_KEY" \
  "http://localhost:8080/passkey-permission/v1/permissions?userId=12345"

# OpenAPI documentation
curl http://localhost:8080/dev/passkey-permission/openapi.json
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-permission-service

# Run specific test class
mvn test -Dtest=PermissionServiceTest

# Run with coverage report
mvn test jacoco:report -Pcoverage
open target/site/jacoco/index.html
```

### Integration Tests

```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run integration tests against local environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=local verify

# Run specific integration test
mvn -Prun-it -Dit.test=PasskeyPermissionResourceIT verify
```

### Load Tests

```bash
# Run load tests
mvn -Prun-load verify

# Run load tests with custom parameters
mvn -Prun-load -Dload.users=50 -Dload.duration=300 verify
```

## Code Structure

### Package Organization

```
com.cvent.passkey.permission/
├── resources/                    # JAX-RS REST endpoints
│   ├── PasskeyPermissionResource.java
│   └── OpenApiResource.java
├── services/                     # Business logic services
│   ├── PermissionService.java
│   ├── ContextPermissionService.java
│   ├── GlobalNavigationService.java
│   └── context/                  # Context management
│       ├── PermissionContext.java
│       ├── cache/                # Caching implementation
│       └── decorator/            # Context decorators
├── model/                        # Data models (in API module)
│   ├── navigation/
│   ├── role/
│   └── permissions/
├── exceptions/                   # Custom exceptions
├── util/                        # Utility classes
└── health/                      # Health checks
```

### Module Dependencies

```
passkey-permission-service
├── depends on: passkey-permission-api
├── depends on: passkey-permission-data-access
├── depends on: auth-service-api
└── depends on: passkey-microservices-common

passkey-permission-api
├── minimal dependencies
└── shared models and contracts

passkey-permission-data-access
├── depends on: passkey-permission-api
└── database access layer

passkey-permission-java-client
├── depends on: passkey-permission-api
└── client library for consumers
```

## Coding Standards

### Java Code Style

The project follows standard Java conventions with these specifics:

1. **Indentation**: 4 spaces (no tabs)
2. **Line Length**: 120 characters maximum
3. **Naming Conventions**:
   - Classes: PascalCase
   - Methods/Variables: camelCase
   - Constants: UPPER_SNAKE_CASE
   - Packages: lowercase

### Code Quality Tools

#### Checkstyle
```bash
# Run checkstyle validation
mvn checkstyle:check

# Generate checkstyle report
mvn checkstyle:checkstyle
open target/site/checkstyle.html
```

#### SpotBugs
```bash
# Run SpotBugs analysis
mvn spotbugs:check

# Generate SpotBugs report
mvn spotbugs:spotbugs
open target/site/spotbugs.html
```

#### SonarQube
```bash
# Run SonarQube analysis (requires SonarQube server)
mvn sonar:sonar -Dsonar.host.url=http://sonar.cvent.com
```

### Documentation Standards

1. **JavaDoc**: All public classes and methods must have JavaDoc
2. **README Updates**: Update README.md for significant changes
3. **API Documentation**: Update OpenAPI annotations for endpoint changes
4. **Architecture Documentation**: Update architecture docs for structural changes

## Common Development Tasks

### Adding a New Endpoint

1. **Define API Contract** (in `passkey-permission-api`):
   ```java
   // Add request/response models
   public class NewFeatureRequest {
       // Model definition
   }
   
   public class NewFeatureResponse {
       // Model definition
   }
   ```

2. **Implement Service Logic**:
   ```java
   @Service
   public class NewFeatureService {
       public NewFeatureResponse processRequest(NewFeatureRequest request) {
           // Business logic implementation
       }
   }
   ```

3. **Create REST Endpoint**:
   ```java
   @Path("/new-feature")
   public class NewFeatureResource {
       @POST
       @Operation(summary = "Process new feature request")
       public Response processNewFeature(NewFeatureRequest request) {
           // Endpoint implementation
       }
   }
   ```

4. **Add Tests**:
   ```java
   public class NewFeatureServiceTest {
       // Unit tests
   }
   
   public class NewFeatureResourceTest {
       // Resource tests
   }
   ```

5. **Update Documentation**:
   - Add OpenAPI annotations
   - Update API_REFERENCE.md
   - Add integration tests

### Adding a New Permission Context

1. **Update ContextType Enum**:
   ```java
   public enum ContextType {
       USER, EVENT, HOTEL, PARTICIPANT, NEW_CONTEXT
   }
   ```

2. **Create Context Decorator**:
   ```java
   public class NewContextDecorator implements PermissionContextDecorator {
       @Override
       public PermissionContext decorate(PermissionContext context) {
           // Context-specific logic
       }
   }
   ```

3. **Register Decorator**:
   ```java
   // In application configuration
   contextDecorators.put(ContextType.NEW_CONTEXT, new NewContextDecorator());
   ```

4. **Add Tests and Documentation**

### Database Schema Changes

1. **Create Migration Script**:
   ```sql
   -- V1.2__Add_new_context_table.sql
   CREATE TABLE NEW_CONTEXT_PERMISSIONS (
       ID NUMBER(19) PRIMARY KEY,
       CONTEXT_ID NUMBER(19) NOT NULL,
       PERMISSION_ID VARCHAR2(50) NOT NULL
   );
   ```

2. **Update Data Access Layer**:
   ```java
   public interface NewContextDAO {
       List<Permission> getPermissions(Long contextId);
   }
   ```

3. **Test Migration**:
   - Test on local database
   - Validate with integration tests
   - Document schema changes

### Performance Optimization

1. **Profile Application**:
   ```bash
   # Run with JVM profiling
   java -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=profile.jfr \
     -jar target/passkey-permission-service-*.jar server configs/local.yaml
   ```

2. **Database Query Optimization**:
   - Use EXPLAIN PLAN for slow queries
   - Add appropriate indexes
   - Optimize connection pool settings

3. **Cache Tuning**:
   - Monitor cache hit/miss ratios
   - Adjust cache sizes and TTL values
   - Implement cache warming strategies

## Debugging

### Local Debugging

1. **IDE Debugging**:
   ```bash
   # Run with debug port
   java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-permission-service-*.jar server configs/local.yaml
   ```

2. **Remote Debugging**:
   - Connect IDE to debug port 5005
   - Set breakpoints in service code
   - Step through request processing

### Log Analysis

1. **Enable Debug Logging**:
   ```yaml
   logging:
     level: DEBUG
     loggers:
       com.cvent.passkey.permission: DEBUG
       org.hibernate.SQL: DEBUG
   ```

2. **Structured Logging**:
   ```java
   // Use structured logging with context
   LOGGER.info("Processing permission request", 
       kv("userId", userId),
       kv("contextType", contextType),
       kv("requestId", requestId));
   ```

### Common Issues and Solutions

1. **Database Connection Issues**:
   - Check database URL and credentials
   - Verify network connectivity
   - Review connection pool configuration

2. **Authentication Failures**:
   - Validate API keys in auth service
   - Check token expiration
   - Verify auth service connectivity

3. **Performance Issues**:
   - Monitor JVM memory usage
   - Check database query performance
   - Review cache hit ratios

## Contributing

### Git Workflow

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/new-permission-context
   ```

2. **Make Changes and Commit**:
   ```bash
   git add .
   git commit -m "Add new permission context for organizations"
   ```

3. **Push and Create Pull Request**:
   ```bash
   git push origin feature/new-permission-context
   # Create PR in GitHub
   ```

### Pull Request Guidelines

1. **Code Review Requirements**:
   - At least 2 approvals from cherry-pickers team
   - All CI checks must pass
   - Code coverage must not decrease

2. **PR Description Template**:
   ```markdown
   ## Description
   Brief description of changes
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests pass
   - [ ] Manual testing completed
   
   ## Documentation
   - [ ] API documentation updated
   - [ ] Architecture docs updated if needed
   ```

3. **Merge Strategy**:
   - Squash and merge for feature branches
   - Merge commit for release branches

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for local development)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-permission.git
   cd passkey-permission
   ```

2. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-permission-service
   java -jar target/passkey-permission-service-1.1.6-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Access API Documentation**:
   - OpenAPI JSON: `http://localhost:8080/dev/passkey-permission/openapi.json`
   - OpenAPI YAML: `http://localhost:8080/dev/passkey-permission/openapi.yaml`
   - Swagger UI: Run `./swagger.sh` and access `http://localhost`

### Running Tests

```bash
# Unit tests
mvn test

# Integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Code coverage
mvn package -Pcoverage
open target/site/jacoco/index.html
```

## API Endpoints


- **GET** `/passkey-permission/v1/permissions` - List module privileges for a user
- **GET** `/passkey-permission/v1/permissions/context/{contextType}` - Get context-specific permissions
- **GET** `/passkey-permission/v1/navigations/global` - Get global navigation menu

## Links


- **Backstage**: https://backstage.core.cvent.org/catalog/default/component/passkey-permission-service
- **API Documentation**: https://backstage.core.cvent.org/catalog/default/api/passkey-permission-api
- **Datadog**: https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-permission-service
- **Jenkins**: https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-permission
- **Wiki**: https://wiki.cvent.com/x/5KbwEw

## Team


- **Owner**: cherry-pickers team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
