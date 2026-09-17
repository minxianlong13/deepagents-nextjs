# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerized development and testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code with Java extensions

### Optional Tools
- **asdf**: Version manager for Java and other tools
- **pnpm**: For changeset management
- **Postman/Insomnia**: API testing
- **DBeaver/pgAdmin**: Database management

### Environment Setup
```bash
# Install Java 17 using asdf (recommended)
asdf plugin add java
asdf install java openjdk-17.0.2
asdf global java openjdk-17.0.2

# Verify Java installation
java -version

# Install Maven
asdf plugin add maven
asdf install maven 3.9.0
asdf global maven 3.9.0

# Verify Maven installation
mvn -version
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-planners.git
cd passkey-planners
```

### 2. Configure Maven Settings
Ensure your `~/.m2/settings.xml` includes Cvent's internal Nexus repository:

```xml
<settings>
    <servers>
        <server>
            <id>cvent-nexus</id>
            <username>${nexus.username}</username>
            <password>${nexus.password}</password>
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

### 3. Set Up Local Database
```bash
# Start PostgreSQL using Docker
docker run --name passkey-planners-db \
    -e POSTGRES_DB=passkey_planners_dev \
    -e POSTGRES_USER=dev_user \
    -e POSTGRES_PASSWORD=dev_password \
    -p 5432:5432 \
    -d postgres:13

# Verify database connection
docker exec -it passkey-planners-db psql -U dev_user -d passkey_planners_dev -c "SELECT version();"
```

### 4. Configure Local Environment
Create `passkey-planners-service/configs/local.yaml`:

```yaml
database:
  driverClass: org.postgresql.Driver
  url: jdbc:postgresql://localhost:5432/passkey_planners_dev
  user: dev_user
  password: dev_password
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
  minSize: 2
  maxSize: 8

server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

auth:
  apiKeyValidationUrl: https://auth-dev.cvent.com/validate
  cacheTimeout: 300s

logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.planners: DEBUG
    org.hibernate: INFO
  appenders:
    - type: console
      threshold: DEBUG
      target: stdout
```

### 5. Build Project
```bash
# Clean build
mvn clean compile

# Full build with tests
mvn clean package

# Build without tests (faster for development)
mvn clean package -DskipTests

# Build with release profile
mvn clean package -Prelease
```

## Running the Service

### Local Development
```bash
# Navigate to service module
cd passkey-planners-service

# Run with local configuration
java -jar target/passkey-planners-service-1.0.79-SNAPSHOT.jar server configs/local.yaml

# Alternative: Run with Maven
mvn exec:java -Dexec.mainClass="com.cvent.passkey.planners.PasskeyPlannersServiceApplication" -Dexec.args="server configs/local.yaml"
```

### Using Docker
```bash
# Build Docker image
docker build -t passkey-planners:local .

# Run container
docker run -p 8080:8080 -p 8081:8081 \
    -e DB_HOST=host.docker.internal \
    -e DB_USER=dev_user \
    -e DB_PASSWORD=dev_password \
    passkey-planners:local
```

### Service Endpoints
- **Application**: http://localhost:8080
- **Admin/Health**: http://localhost:8081
- **Health Check**: http://localhost:8081/healthcheck
- **Metrics**: http://localhost:8081/metrics

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=PlannersInfoServiceTest

# Run tests with coverage
mvn test jacoco:report
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run integration tests against local service
mvn -Prun-it -Denv.IT_ENVIRONMENT=local verify
```

### Code Coverage
```bash
# Generate coverage report
mvn clean verify jacoco:report -Pcoverage

# View coverage report
open target/site/jacoco/index.html
```

### Test Categories
- **Unit Tests**: Fast, isolated tests for individual components
- **Integration Tests**: End-to-end tests using Karate framework
- **Contract Tests**: API contract validation
- **Performance Tests**: Load and stress testing

## Code Structure

### Module Organization
```
passkey-planners/
├── passkey-planners-api/           # API models and contracts
│   └── src/main/java/com/cvent/passkey/planners/model/
├── passkey-planners-service/       # Main service implementation
│   ├── src/main/java/com/cvent/passkey/planners/
│   │   ├── resources/              # JAX-RS resources (controllers)
│   │   ├── services/               # Business logic services
│   │   └── exceptions/             # Exception handling
│   └── configs/                    # Configuration files
├── passkey-planners-data-access/   # Database access layer
│   └── src/main/java/com/cvent/passkey/planners/dataaccess/
├── passkey-planners-java-client/   # Client library
│   └── src/main/java/com/cvent/passkey/planners/client/
├── passkey-planners-shared/        # Shared utilities
└── passkey-planners-integration-test/ # Integration tests
    └── src/test/java/com/cvent/passkey/planners/karate/
```

### Package Structure
```
com.cvent.passkey.planners/
├── resources/                      # REST endpoints
│   ├── PlannersInfoResource        # Main planner operations
│   ├── PlannersEventsResource      # Event associations
│   ├── AdminPlannersResource       # Admin operations
│   └── OdysseyPlannersResource     # Odyssey integration
├── services/                       # Business logic
│   ├── PlannersInfoService         # Core planner service
│   ├── AdminService                # Admin operations
│   └── PlannersEventsService       # Event associations
├── exceptions/                     # Exception handling
│   ├── PlannersException           # Base exception
│   └── mapper/                     # Exception mappers
└── model/                          # Data models (in API module)
    ├── planners/                   # Planner-related models
    └── error/                      # Error models
```

## Coding Standards

### Java Code Style
- **Formatting**: Follow Google Java Style Guide
- **Line Length**: Maximum 120 characters
- **Indentation**: 2 spaces (no tabs)
- **Imports**: Organize imports, no wildcard imports
- **Naming**: CamelCase for classes, camelCase for methods/variables

### Code Quality Tools
```bash
# Run Checkstyle
mvn checkstyle:check

# Fix common formatting issues
mvn spotless:apply

# Run SpotBugs for bug detection
mvn spotbugs:check
```

### Documentation Standards
- **JavaDoc**: Required for public methods and classes
- **Comments**: Explain complex business logic
- **README**: Keep module READMEs updated
- **API Documentation**: Update when adding/changing endpoints

### Example Code Style
```java
/**
 * Service for managing planner information and operations.
 * 
 * @author Development Team
 */
@Service
public class PlannersInfoService {
  
  private static final Logger LOG = LoggerFactory.getLogger(PlannersInfoService.class);
  
  private final PlannersDataAccess plannersDataAccess;
  
  /**
   * Creates a new planner with the provided information.
   *
   * @param plannersInfo the planner information to create
   * @return the created planner with generated ID
   * @throws PlannersException if creation fails
   */
  public PlannersInfo createPlannersInfo(PlannersInfo plannersInfo) throws PlannersException {
    LOG.debug("Creating planner with email: {}", plannersInfo.getEmailAddress());
    
    validatePlannerInfo(plannersInfo);
    
    try {
      PlannersInfo createdPlanner = plannersDataAccess.createPlanner(plannersInfo);
      LOG.info("Successfully created planner with ID: {}", createdPlanner.getEmailUserId());
      return createdPlanner;
    } catch (DataAccessException e) {
      LOG.error("Failed to create planner", e);
      throw new PlannersException("Failed to create planner", e);
    }
  }
  
  private void validatePlannerInfo(PlannersInfo plannersInfo) throws PlannersException {
    if (plannersInfo.getEmailAddress() == null || plannersInfo.getEmailAddress().trim().isEmpty()) {
      throw new PlannersException("Email address is required");
    }
    // Additional validation logic...
  }
}
```

## Common Development Tasks

### Adding a New Endpoint
1. **Define API Model** (in `passkey-planners-api`):
```java
@JsonDeserialize(builder = ImmutableNewPlannerRequest.Builder.class)
@Value.Immutable
public interface NewPlannerRequest {
  String getEmailAddress();
  String getFirstName();
  String getLastName();
}
```

2. **Add Resource Method** (in `passkey-planners-service`):
```java
@POST
@Path("/new-endpoint")
public Response createNewPlanner(
    @Authority(methods = {AuthMethod.API_KEY}) GrantedAPIKey grantedAPIKey,
    @Valid @NotNull NewPlannerRequest request) {
  
  PlannersInfo result = plannersInfoService.createNewPlanner(request);
  return Response.status(Response.Status.CREATED).entity(result).build();
}
```

3. **Implement Service Logic**:
```java
public PlannersInfo createNewPlanner(NewPlannerRequest request) {
  // Business logic implementation
  return plannersDataAccess.createPlanner(convertToPlannersInfo(request));
}
```

4. **Add Integration Test**:
```gherkin
Feature: New Planner Creation

Scenario: Create planner with new endpoint
  Given I have valid planner data
  When I POST to "/passkey-planners/v1/new-endpoint"
  Then the response status should be 201
  And the response should contain the created planner
```

### Database Schema Changes
1. **Create Migration Script**:
```sql
-- V1.2__add_new_planner_field.sql
ALTER TABLE planners_info 
ADD COLUMN middle_name VARCHAR(100);

CREATE INDEX idx_planners_middle_name ON planners_info(middle_name);
```

2. **Update Entity Model**:
```java
@Value.Immutable
public interface PlannersInfo {
  Long getEmailUserId();
  String getEmailAddress();
  String getFirstName();
  Optional<String> getMiddleName(); // New field
  String getLastName();
  // ... other fields
}
```

3. **Update Data Access Layer**:
```java
public PlannersInfo createPlanner(PlannersInfo plannersInfo) {
  String sql = """
    INSERT INTO planners_info (email_address, first_name, middle_name, last_name, ...)
    VALUES (?, ?, ?, ?, ...)
    """;
  // Implementation with new field
}
```

### Adding Configuration Properties
1. **Update Configuration Class**:
```java
public class PasskeyPlannersServiceConfiguration extends Configuration {
  @JsonProperty
  private String newConfigProperty;
  
  public String getNewConfigProperty() {
    return newConfigProperty;
  }
}
```

2. **Update Configuration Files**:
```yaml
# In configs/dev.yaml, staging.yaml, production.yaml
newConfigProperty: "development-value"
```

3. **Use in Service**:
```java
@Inject
public PlannersInfoService(PasskeyPlannersServiceConfiguration config) {
  this.configValue = config.getNewConfigProperty();
}
```

## Debugging

### Local Debugging
1. **IDE Setup**: Configure remote debugging on port 5005
2. **Run with Debug**:
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-planners-service-*.jar server configs/local.yaml
```

3. **Attach Debugger**: Connect IDE debugger to localhost:5005

### Log Analysis
```bash
# Follow application logs
tail -f logs/application.log

# Search for specific errors
grep -i "error" logs/application.log

# Filter by log level
grep "DEBUG.*PlannersInfoService" logs/application.log
```

### Database Debugging
```sql
-- Check planner data
SELECT * FROM planners_info WHERE email_address = 'test@example.com';

-- Check event associations
SELECT p.email_address, e.event_id, e.permission_level
FROM planners_info p
JOIN event_planner_associations e ON p.email_user_id = e.email_user_id
WHERE p.email_address = 'test@example.com';

-- Performance analysis
EXPLAIN ANALYZE SELECT * FROM planners_info WHERE company_name LIKE '%Corp%';
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Maven cache
rm -rf ~/.m2/repository/com/cvent/passkey

# Rebuild with clean slate
mvn clean install -U
```

#### Database Connection Issues
```bash
# Check database status
docker ps | grep postgres

# Restart database
docker restart passkey-planners-db

# Check connection
telnet localhost 5432
```

#### Test Failures
```bash
# Run single test with verbose output
mvn test -Dtest=PlannersInfoServiceTest -X

# Skip flaky tests temporarily
mvn test -Dmaven.test.failure.ignore=true
```

#### Memory Issues
```bash
# Increase JVM memory
export MAVEN_OPTS="-Xmx2g -XX:MaxPermSize=512m"

# Run with memory profiling
java -XX:+PrintGCDetails -XX:+PrintGCTimeStamps \
     -jar target/passkey-planners-service-*.jar server configs/local.yaml
```

### Getting Help
- **Team Wiki**: https://wiki.cvent.com/display/PASKY/Planners+Microservice
- **Slack Channel**: #passkey-development
- **Code Reviews**: Create pull request for team review
- **Architecture Questions**: Consult with senior developers or architects

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-planners.git
   cd passkey-planners
   ```

2. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

3. **Run the service locally**:
   ```bash
   cd passkey-planners-service
   java -jar target/passkey-planners-service-1.0.79-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Run integration tests**:
   ```bash
   mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
   ```

### Code Coverage

To check code coverage:
```bash
mvn package -Pcoverage
```

View results at: `target/site/jacoco/index.html`

## API Access


The service provides REST APIs accessible at:
- **Base URL**: `/passkey-planners/v1`
- **API Documentation**: Available through MuleSoft platform or developer portal
- **Health Check**: Standard Dropwizard health endpoints

## Repository Structure


This is a multi-module Maven project with the following modules:
- `passkey-planners-api`: API models and contracts
- `passkey-planners-service`: Main service implementation
- `passkey-planners-data-access`: Database access layer
- `passkey-planners-java-client`: Client library for integration
- `passkey-planners-shared`: Shared utilities
- `passkey-planners-integration-test`: Integration test suite

## Links


- **Datadog**: [Service Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-planners-service)
- **Jenkins**: [CI/CD Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-planners)
- **Wiki**: [Documentation](https://wiki.cvent.com/display/PASKY/Planners+Microservice)

## Team


- **Owner**: Cherry Pickers team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
