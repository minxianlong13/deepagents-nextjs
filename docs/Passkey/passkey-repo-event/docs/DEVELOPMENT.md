# Development Guide

## Prerequisites

### Required Software

- **Java 17** - Primary development language
- **Maven 3.6+** - Build and dependency management
- **Docker** - For containerized testing and deployment
- **Git** - Version control
- **IDE** - IntelliJ IDEA, Eclipse, or NetBeans (any Maven-compatible IDE)

### Required Access

- Cvent's internal Nexus repository (Maven artifacts)
- GitHub access to cvent-internal organization
- Oracle database access (dev environment)
- VPN connection to Cvent internal network

### Environment Setup

1. **Configure Maven for Cvent Nexus**
   - Follow instructions at: https://wiki/display/DEV/Maven+Setup
   - Ensure `~/.m2/settings.xml` is configured with Nexus credentials

2. **Install Java 17**
   ```bash
   # Using asdf (recommended)
   asdf install java temurin-17.0.x
   asdf global java temurin-17.0.x
   
   # Verify installation
   java -version
   ```

3. **Clone the Repository**
   ```bash
   git clone git@github.com:cvent-internal/passkey-event.git
   cd passkey-event
   ```

## Local Setup

### Build the Project

```bash
# Clean build
mvn clean install

# Build with release profile (skips tests)
mvn package -Prelease

# Build with code coverage
mvn package -Pcoverage
```

### Run the Service Locally

```bash
# Navigate to service module
cd passkey-event-service

# Run with dev configuration
java -jar target/passkey-event-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml

# Service will start on default port (check dev.yaml for port configuration)
```

### Alternative: Run with Docker

```bash
# Build Docker image
docker build -t passkey-event:local .

# Run container
docker run -p 8080:8080 passkey-event:local
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
mvn test

# Run tests with coverage report
mvn clean install -Pcoverage

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests

```bash
# Run all integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run specific test by tag
mvn -Prun-it -Dkarate.tags="@event-crud" -Denv.IT_ENVIRONMENT=dev verify

# Alternative: Run using test runner
mvn test -Dtest=PasskeyEventKarateTestIT#runTests -Dkarate.env=dev -Dkarate.tags="@test-label"
```

### Code Quality Checks

```bash
# Run Checkstyle
mvn checkstyle:check

# Run all quality checks (Checkstyle + tests)
mvn verify
```

## Code Structure

### Module Organization

```
passkey-event/
├── passkey-event-api/              # OpenAPI specs and API contracts
│   └── openapi.json                # OpenAPI 3.0 specification
├── passkey-event-service/          # Main service implementation
│   ├── src/main/java/
│   │   └── com/cvent/passkeyevent/
│   │       ├── PasskeyEventServiceApplication.java  # Entry point
│   │       ├── resources/          # JAX-RS REST endpoints
│   │       ├── services/           # Business logic layer
│   │       ├── config/             # Configuration classes
│   │       ├── exception/          # Exception handlers
│   │       ├── health/             # Health checks
│   │       └── validations/        # Input validation
│   └── configs/                    # Environment configs (dev.yaml, etc)
├── passkey-event-data-access/      # Data access layer
│   ├── src/main/java/
│   │   └── com/cvent/passkeyevent/dataaccess/
│   │       ├── dao/                # Data Access Objects
│   │       └── mappers/            # MyBatis mappers
│   └── src/main/resources/
│       └── mappers/                # MyBatis XML mappers
├── passkey-event-shared/           # Shared utilities
│   └── src/main/java/
│       └── com/cvent/passkeyevent/shared/
├── passkey-event-java-client/      # Client library
│   └── src/main/java/
│       └── com/cvent/passkeyevent/client/
└── passkey-event-integration-test/ # Integration tests
    └── src/test/java/
        └── karate/                 # Karate test scenarios
```

### Package Organization

- **resources/**: JAX-RS REST resource classes (controllers)
- **services/**: Business logic and service layer
- **dataaccess/**: Data access layer with MyBatis
- **config/**: Configuration and dependency injection
- **exception/**: Custom exceptions and error handling
- **health/**: Health check implementations
- **validations/**: Input validation logic

## Coding Standards

### Java Style Guide

- Follow standard Java naming conventions
- Use Checkstyle configuration in project root
- Maximum line length: 120 characters
- Use meaningful variable and method names
- Add JavaDoc for public APIs

### Code Quality Requirements

- **Test Coverage**: Minimum 80% line coverage
- **Checkstyle**: Must pass all checks
- **SonarQube**: No critical or blocker issues
- **Checkmarx**: Security scan must pass

### Best Practices

1. **Immutable Domain Objects**: Use Immutables library for domain models
   ```java
   @Value.Immutable
   @JsonSerialize(as = ImmutableEvent.class)
   @JsonDeserialize(as = ImmutableEvent.class)
   public interface Event {
       String eventId();
       String eventName();
   }
   ```

2. **Resource Classes**: Keep REST resources thin, delegate to services
   ```java
   @Path("/events")
   public class EventResource {
       private final EventService eventService;
       
       @GET
       @Path("/{id}")
       public Response getEvent(@PathParam("id") String id) {
           return eventService.getEvent(id);
       }
   }
   ```

3. **Service Layer**: Encapsulate business logic in service classes
   ```java
   public class EventService {
       private final EventDAO eventDAO;
       
       public Event getEvent(String eventId) {
           // Business logic here
       }
   }
   ```

4. **Data Access**: Use MyBatis for database operations
   ```java
   @Mapper
   public interface EventMapper {
       @Select("SELECT * FROM events WHERE event_id = #{eventId}")
       Event findById(@Param("eventId") String eventId);
   }
   ```

## Common Development Tasks

### Adding a New Endpoint

1. **Define OpenAPI spec** in `passkey-event-api/openapi.json`
2. **Create/update Resource class** in `passkey-event-service/src/main/java/.../resources/`
3. **Add service method** in appropriate service class
4. **Implement data access** if needed in data-access module
5. **Write unit tests** for service logic
6. **Write integration tests** using Karate framework
7. **Update API documentation**

### Adding a New Domain Model

1. **Create interface** in shared module using Immutables
   ```java
   @Value.Immutable
   @JsonSerialize(as = ImmutableNewModel.class)
   @JsonDeserialize(as = ImmutableNewModel.class)
   public interface NewModel {
       String id();
       String name();
   }
   ```

2. **Build project** to generate implementation
   ```bash
   mvn clean compile
   ```

3. **Use generated class** `ImmutableNewModel.builder()...build()`

### Adding Database Changes

1. **Create migration script** (coordinate with DBA team)
2. **Update MyBatis mappers** in `passkey-event-data-access/src/main/resources/mappers/`
3. **Update DAO interfaces** in data-access module
4. **Test locally** against dev database
5. **Update integration tests** to cover new queries

### Debugging Locally

1. **Enable debug logging** in `configs/dev.yaml`:
   ```yaml
   logging:
     level: DEBUG
     loggers:
       com.cvent.passkeyevent: DEBUG
   ```

2. **Run with debugger** in IDE:
   - Main class: `PasskeyEventServiceApplication`
   - Program arguments: `server configs/dev.yaml`
   - VM options: `-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005`

3. **Attach remote debugger** to port 5005

## API Documentation

### Viewing OpenAPI Specs

```bash
# Run Swagger UI container
./swagger.sh

# Access at http://localhost:8888/
# Load spec: http://localhost:8080/openapi.json (if service is running)
```

### Updating OpenAPI Specs

1. Edit `passkey-event-api/openapi.json`
2. Validate spec using Swagger Editor
3. Rebuild project to update generated code
4. Test endpoints match specification

## IDE Configuration

### IntelliJ IDEA

1. **Import Project**: File → Open → Select `pom.xml`
2. **Enable Annotation Processing**: 
   - Settings → Build → Compiler → Annotation Processors
   - Check "Enable annotation processing"
3. **Code Style**: Import Checkstyle config from project root
4. **Run Configuration**:
   - Main class: `com.cvent.passkeyevent.PasskeyEventServiceApplication`
   - Program arguments: `server configs/dev.yaml`
   - Working directory: `passkey-event-service`

### Eclipse

1. **Import Maven Project**: File → Import → Maven → Existing Maven Projects
2. **Enable Annotation Processing**: Project Properties → Java Compiler → Annotation Processing
3. **Install Checkstyle Plugin**: Help → Eclipse Marketplace → Search "Checkstyle"

## Troubleshooting

### Build Issues

**Problem**: Maven can't download dependencies
```bash
# Solution: Check Nexus credentials in ~/.m2/settings.xml
# Verify VPN connection
# Clear local repository cache
rm -rf ~/.m2/repository/com/cvent
mvn clean install
```

**Problem**: Annotation processing errors
```bash
# Solution: Clean and rebuild
mvn clean compile
```

### Runtime Issues

**Problem**: Service won't start - port already in use
```bash
# Solution: Find and kill process using port
lsof -ti:8080 | xargs kill -9
```

**Problem**: Database connection errors
```bash
# Solution: Verify database credentials in configs/dev.yaml
# Check VPN connection
# Verify database is accessible
```

### Test Issues

**Problem**: Integration tests failing
```bash
# Solution: Ensure dev environment is accessible
# Check test data setup
# Verify API keys and credentials
# Run with verbose logging
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev -X verify
```

## Git Workflow

### Branch Strategy

- `master` - Production-ready code
- `dev` - Development branch
- Feature branches: `feature/JIRA-123-description`
- Bugfix branches: `bugfix/JIRA-456-description`

### Commit Guidelines

```bash
# Format: [JIRA-123] Brief description
git commit -m "[PASKY-123] Add event search endpoint"
```

### Pull Request Process

1. Create feature branch from `dev`
2. Make changes and commit
3. Push branch and create PR
4. Ensure CI checks pass (Jenkins)
5. Request review from team members
6. Address review comments
7. Merge to `dev` after approval

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment procedures.

### Quick Deploy to Dev

```bash
# Push to dev branch
git push origin dev

# Jenkins automatically deploys to alpha environment
# Monitor: https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-event
```

## Additional Resources

- **Wiki**: https://wiki.cvent.com/display/PASKY/
- **OpenAPI Guide**: https://wiki.cvent.com/display/PASKY/OpenAPI+Annotations+for+Dropwizard+Services
- **Karate Testing**: https://github.com/karatelabs/karate
- **Dropwizard Docs**: https://www.dropwizard.io/
- **MyBatis Docs**: https://mybatis.org/mybatis-3/

## Getting Help

- **Team Slack**: #cherry-pickers
- **Platform Slack**: #passkey-platform
- **Code Reviews**: Tag @cherry-pickers team in PR
- **Incidents**: Follow on-call rotation and escalation procedures
