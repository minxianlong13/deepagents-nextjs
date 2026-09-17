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
   git clone git@github.com:cvent-internal/passkey-hotel.git
   cd passkey-hotel
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
cd passkey-hotel-service

# Run with dev configuration
java -jar target/passkey-hotel-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml

# Service will start on default port (check dev.yaml for port configuration)
```

### Alternative: Run with Docker

```bash
# Build Docker image
docker build -t passkey-hotel:local .

# Run container
docker run -p 8080:8080 passkey-hotel:local
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
mvn test

# Run tests with coverage report
cd passkey-hotel-service
mvn clean verify jacoco:report -Pcoverage

# If build fails due to coverage, generate report manually
mvn jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests

```bash
# Run all integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run specific test by tag
mvn -Prun-it -Dcucumber.filter.tags="@hotel-crud" -Denv.IT_ENVIRONMENT=dev verify
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
passkey-hotel/
├── passkey-hotel-api/              # OpenAPI specs and API contracts
│   ├── openapi.json                # OpenAPI 3.0 specification
│   └── openapi.yaml                # YAML format
├── passkey-hotel-service/          # Main service implementation
│   ├── src/main/java/
│   │   └── com/cvent/passkey/hotel/
│   │       ├── PasskeyHotelServiceApplication.java  # Entry point
│   │       ├── resources/          # JAX-RS REST endpoints
│   │       ├── services/           # Business logic layer
│   │       ├── config/             # Configuration classes
│   │       ├── exception/          # Exception handlers
│   │       └── health/             # Health checks
│   └── configs/                    # Environment configs (dev.yaml, etc)
├── passkey-hotel-data-access/      # Data access layer
│   ├── src/main/java/
│   │   └── com/cvent/passkey/hotel/dataaccess/
│   │       ├── dao/                # Data Access Objects
│   │       └── mappers/            # MyBatis mappers
│   └── src/main/resources/
│       └── mappers/                # MyBatis XML mappers
├── passkey-hotel-shared/           # Shared utilities
│   └── src/main/java/
│       └── com/cvent/passkey/hotel/shared/
├── passkey-hotel-java-client/      # Client library
│   └── src/main/java/
│       └── com/cvent/passkey/hotel/client/
└── passkey-hotel-integration-test/ # Integration tests
    └── src/test/resources/
        └── features/               # Cucumber feature files
```

### Package Organization

- **resources/**: JAX-RS REST resource classes (controllers)
- **services/**: Business logic and service layer
- **dataaccess/**: Data access layer with MyBatis
- **config/**: Configuration and dependency injection
- **exception/**: Custom exceptions and error handling
- **health/**: Health check implementations

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
   @JsonSerialize(as = ImmutableHotel.class)
   @JsonDeserialize(as = ImmutableHotel.class)
   public interface Hotel {
       String hotelId();
       String hotelName();
   }
   ```

2. **Resource Classes**: Keep REST resources thin, delegate to services
   ```java
   @Path("/hotels")
   public class PasskeyHotelResource {
       private final HotelService hotelService;
       
       @GET
       @Path("/{id}")
       public Response getHotel(@PathParam("id") String id) {
           return hotelService.getHotel(id);
       }
   }
   ```

3. **Service Layer**: Encapsulate business logic in service classes
   ```java
   public class HotelService {
       private final HotelDAO hotelDAO;
       
       public Hotel getHotel(String hotelId) {
           // Business logic here
       }
   }
   ```

4. **Data Access**: Use MyBatis for database operations
   ```java
   @Mapper
   public interface HotelMapper {
       @Select("SELECT * FROM hotels WHERE hotel_id = #{hotelId}")
       Hotel findById(@Param("hotelId") String hotelId);
   }
   ```

## Common Development Tasks

### Adding a New Endpoint

1. **Define OpenAPI spec** in `passkey-hotel-api/openapi.json`
2. **Create/update Resource class** in `passkey-hotel-service/src/main/java/.../resources/`
3. **Add service method** in appropriate service class
4. **Implement data access** if needed in data-access module
5. **Write unit tests** for service logic
6. **Write integration tests** using Cucumber framework
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
2. **Update MyBatis mappers** in `passkey-hotel-data-access/src/main/resources/mappers/`
3. **Update DAO interfaces** in data-access module
4. **Test locally** against dev database
5. **Update integration tests** to cover new queries

### Debugging Locally

1. **Enable debug logging** in `configs/dev.yaml`:
   ```yaml
   logging:
     level: DEBUG
     loggers:
       com.cvent.passkey.hotel: DEBUG
   ```

2. **Run with debugger** in IDE:
   - Main class: `PasskeyHotelServiceApplication`
   - Program arguments: `server configs/dev.yaml`
   - VM options: `-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005`

3. **Attach remote debugger** to port 5005

## API Documentation

### Viewing OpenAPI Specs

```bash
# Run Swagger UI container
./swagger.sh

# Access at http://localhost
```

### Accessing from Running Service

- Dev: `https://dev.cvent.com/passkey-hotel/openapi.json`
- Alpha: `https://alpha.cvent.com/passkey-hotel/openapi.yaml`

### Updating OpenAPI Specs

1. Edit `passkey-hotel-api/openapi.json` or `openapi.yaml`
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
   - Main class: `com.cvent.passkey.hotel.PasskeyHotelServiceApplication`
   - Program arguments: `server configs/dev.yaml`
   - Working directory: `passkey-hotel-service`

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
git commit -m "[PASKY-123] Add hotel search endpoint"
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
# Monitor: https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-hotel
```

## Additional Resources

- **Wiki**: https://wiki.cvent.com/display/PASKY/Hotel+Microservice
- **Backstage**: https://backstage.core.cvent.org/catalog/default/component/passkey-hotel-service
- **Dropwizard Docs**: https://www.dropwizard.io/
- **MyBatis Docs**: https://mybatis.org/mybatis-3/
- **Cucumber Docs**: https://cucumber.io/docs/cucumber/

## Getting Help

- **Team Slack**: #cherry-pickers
- **Platform Slack**: #passkey-platform
- **Code Reviews**: Tag @cherry-pickers team in PR
- **Incidents**: Follow on-call rotation and escalation procedures

## Additional Resources

## Quick Start


### Prerequisites

- Java 17
- Maven 3.6+
- Docker (for containerized deployment)
- Access to Cvent's internal Nexus repository

### Build the Service

```bash
# Standard build
mvn package

# Build with release profile
mvn package -Prelease
```

### Run Locally

```bash
cd passkey-hotel-service
java -jar target/passkey-hotel-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
```

### Run Integration Tests

```bash
# Run all integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
```

### Check Code Coverage

```bash
cd passkey-hotel-service
mvn clean verify jacoco:report -Pcoverage

# View report
open target/site/jacoco/index.html
```

### Access API Documentation

**Option 1**: Swagger UI (Local)
```bash
./swagger.sh
# Access at http://localhost
```

**Option 2**: Running Service
- Dev: `https://dev.cvent.com/passkey-hotel/openapi.json`
- Alpha: `https://alpha.cvent.com/passkey-hotel/openapi.json`

**Option 3**: Backstage
- Service: https://backstage.core.cvent.org/catalog/default/component/passkey-hotel-service
- API: https://backstage.core.cvent.org/catalog/default/api/passkey-hotel-api

## Monitoring & Operations


- **Datadog Dashboard**: [Production Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-hotel-service)
- **Jenkins Pipeline**: [CI/CD Jobs](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-hotel)
- **Wiki**: [Hotel Microservice Documentation](https://wiki.cvent.com/display/PASKY/Hotel+Microservice)
- **Service Registry ID**: 918ebe8a-101a-4736-bec2-aed8881fb312

## Support


- **Team**: Cherry Pickers
- **Platform**: Passkey for Hotels
- **Business Unit**: Hospitality
- **Created by**: boris.bronstien@cvent.com
