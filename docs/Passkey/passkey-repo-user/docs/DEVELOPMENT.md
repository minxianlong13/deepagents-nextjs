# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build and dependency management
- **Docker**: Container runtime for local services
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Optional Tools
- **Postman**: API testing and development
- **DBeaver**: Database client for Oracle
- **Docker Compose**: Multi-container orchestration
- **ASDF**: Version manager for Java and Maven

### Version Management with ASDF
```bash
# Install ASDF
git clone https://github.com/asdf-vm/asdf.git ~/.asdf

# Add plugins
asdf plugin add java
asdf plugin add maven

# Install versions (from .tool-versions file)
asdf install

# Set global versions
asdf global java openjdk-17.0.2
asdf global maven 3.8.6
```

## Local Setup

### 1. Clone Repository
```bash
git clone ssh://git@stash.cvent.net:7999/pa/passkey-user.git
cd passkey-user
```

### 2. Environment Configuration
```bash
# Copy environment template
cp passkey-user-service/configs/dev.yaml.template passkey-user-service/configs/dev.yaml

# Edit configuration with your local settings
vim passkey-user-service/configs/dev.yaml
```

### 3. Database Setup

#### Option A: Local Oracle Database (Docker)
```bash
# Start Oracle XE container
docker run -d \
  --name oracle-xe \
  -p 1521:1521 \
  -p 5500:5500 \
  -e ORACLE_PWD=oracle123 \
  -e ORACLE_CHARACTERSET=AL32UTF8 \
  oracle/database:18.4.0-xe

# Wait for database to be ready (check logs)
docker logs -f oracle-xe

# Connect and create schema
sqlplus sys/oracle123@localhost:1521/XE as sysdba
CREATE USER passkey_user IDENTIFIED BY dev_password;
GRANT CONNECT, RESOURCE, DBA TO passkey_user;
```

#### Option B: Connect to Development Database
```yaml
# Update dev.yaml with dev database connection
database:
  url: jdbc:oracle:thin:@dev-oracle.cvent.org:1521:DEVDB
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
```

### 4. Build Project
```bash
# Clean build
mvn clean compile

# Run tests
mvn test

# Package application
mvn package -Prelease
```

### 5. Run Service Locally
```bash
cd passkey-user-service

# Run with dev configuration
java -jar target/passkey-user-service-0.6.15-SNAPSHOT.jar server configs/dev.yaml

# Alternative: Run with Maven
mvn exec:java -Dexec.mainClass="com.cvent.passkeyuser.PasskeyUserServiceApplication" -Dexec.args="server configs/dev.yaml"
```

### 6. Verify Setup
```bash
# Health check
curl http://localhost:8081/healthcheck

# API test
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:8080/passkey-user/v1/user-details/12345

# Swagger UI
open http://localhost:8080/swagger
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=UserDetailsServiceTest

# Run with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run specific feature
mvn -Prun-it -Dtest=PasskeyUserKarateTestIT#testUserDetails verify

# Run with custom environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=local -Dkarate.env=local verify
```

### Load Tests
```bash
# Run load tests
mvn -Prun-load verify

# Run with custom parameters
mvn -Prun-load -Dload.users=50 -Dload.duration=300 verify
```

## Code Structure

### Package Organization
```
com.cvent.passkeyuser/
├── resources/              # JAX-RS REST endpoints
│   ├── UserDetailsResource.java
│   ├── PasskeyUserFavouritesResource.java
│   └── PasskeyUserPreferencesResource.java
├── services/               # Business logic layer
│   ├── UserDetailsService.java
│   └── FavoritesService.java
├── model/                  # API models (in passkey-user-api)
│   ├── UserDetails.java
│   └── UpdateUserDetailsRequest.java
├── dataaccess/            # Data access layer (in passkey-user-data-access)
│   └── UserDetailsDataAccess.java
└── client/                # Java client (in passkey-user-java-client)
    └── PasskeyUserDetailsClient.java
```

### Module Dependencies
```
passkey-user-service
├── depends on: passkey-user-api
├── depends on: passkey-user-data-access
└── depends on: auth-service-api

passkey-user-data-access
└── depends on: passkey-user-api

passkey-user-java-client
└── depends on: passkey-user-api

passkey-user-integration-test
├── depends on: passkey-user-api
└── depends on: passkey-user-java-client
```

## Coding Standards

### Java Code Style
- **Formatting**: Google Java Style Guide
- **Line Length**: 120 characters maximum
- **Indentation**: 2 spaces (no tabs)
- **Imports**: Organize and remove unused imports
- **Naming**: CamelCase for classes, camelCase for methods/variables

### Code Quality Tools
```bash
# Checkstyle validation
mvn checkstyle:check

# SpotBugs analysis
mvn spotbugs:check

# PMD analysis
mvn pmd:check

# All quality checks
mvn verify -Pquality-checks
```

### IDE Configuration

#### IntelliJ IDEA Setup
1. **Import Project**: Open as Maven project
2. **Code Style**: Import `google-java-format.xml`
3. **Plugins**: Install Google Java Format plugin
4. **Run Configurations**: 
   ```
   Main Class: com.cvent.passkeyuser.PasskeyUserServiceApplication
   Program Arguments: server configs/dev.yaml
   Working Directory: passkey-user-service
   ```

#### Eclipse Setup
1. **Import**: Import as Existing Maven Project
2. **Formatter**: Import Eclipse Java Google Style
3. **Run Configuration**: Java Application with main class and arguments

## Common Development Tasks

### Adding a New Endpoint

1. **Define API Model** (in `passkey-user-api`):
```java
@Value.Immutable
@JsonSerialize(as = ImmutableNewModel.class)
@JsonDeserialize(as = ImmutableNewModel.class)
@CventApiStyleV2
public interface NewModel {
    String getName();
    Long getId();
}
```

2. **Create Resource Class** (in `passkey-user-service`):
```java
@Path("/passkey-user/v1/new-endpoint")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class NewResource {
    
    @GET
    @Path("/{id}")
    @Operation(summary = "Get new resource")
    public Response getResource(@PathParam("id") Long id) {
        // Implementation
    }
}
```

3. **Add Service Logic**:
```java
public class NewService {
    public NewModel getById(Long id) {
        // Business logic
    }
}
```

4. **Register in Application**:
```java
@Override
public void run(PasskeyUserServiceConfiguration configuration, Environment environment) {
    environment.jersey().register(new NewResource(newService));
}
```

### Adding Database Operations

1. **Create Data Access Class**:
```java
public class NewDataAccess {
    private final Handle handle;
    
    public Optional<NewModel> findById(Long id) {
        return handle.createQuery("SELECT * FROM new_table WHERE id = :id")
                    .bind("id", id)
                    .mapTo(NewModel.class)
                    .findFirst();
    }
}
```

2. **Add Database Migration**:
```sql
-- V1.1__Add_new_table.sql
CREATE TABLE new_table (
    id NUMBER(19) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    created_date DATE DEFAULT SYSDATE
);
```

### Writing Tests

#### Unit Test Example
```java
@ExtendWith(MockitoExtension.class)
class NewServiceTest {
    
    @Mock
    private NewDataAccess dataAccess;
    
    @InjectMocks
    private NewService service;
    
    @Test
    void shouldReturnModelWhenFound() {
        // Given
        Long id = 123L;
        NewModel expected = ImmutableNewModel.builder()
                .id(id)
                .name("Test")
                .build();
        when(dataAccess.findById(id)).thenReturn(Optional.of(expected));
        
        // When
        NewModel result = service.getById(id);
        
        // Then
        assertThat(result).isEqualTo(expected);
    }
}
```

#### Integration Test Example (Karate)
```gherkin
Feature: New Endpoint Tests

Background:
  * url baseUrl
  * header Authorization = 'Bearer ' + apiKey

Scenario: Get new resource by ID
  Given path 'new-endpoint', 123
  When method GET
  Then status 200
  And match response.id == 123
  And match response.name == '#string'
```

## Debugging

### Local Debugging
```bash
# Run with debug port
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-user-service-0.6.15-SNAPSHOT.jar server configs/dev.yaml

# Connect debugger to port 5005
```

### Log Configuration for Development
```yaml
logging:
  level: DEBUG
  loggers:
    com.cvent.passkeyuser: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
    com.cvent.auth: INFO
  appenders:
    - type: console
      layout:
        type: pattern
        pattern: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check Oracle listener
lsnrctl status

# Test connection
sqlplus username/password@localhost:1521/XE

# Verify JDBC URL format
jdbc:oracle:thin:@hostname:port:service_name
```

#### Build Issues
```bash
# Clear Maven cache
mvn dependency:purge-local-repository

# Rebuild with clean slate
mvn clean install -U

# Skip tests if needed
mvn clean install -DskipTests
```

#### Port Conflicts
```bash
# Check port usage
netstat -an | grep 8080
lsof -i :8080

# Kill process using port
kill -9 $(lsof -t -i:8080)
```

## Performance Profiling

### JVM Profiling
```bash
# Run with JFR (Java Flight Recorder)
java -XX:+FlightRecorder \
     -XX:StartFlightRecording=duration=60s,filename=profile.jfr \
     -jar target/passkey-user-service-0.6.15-SNAPSHOT.jar server configs/dev.yaml

# Analyze with JMC (Java Mission Control)
jmc profile.jfr
```

### Memory Analysis
```bash
# Generate heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc
jcmd <pid> GC.dump_heap heap.hprof

# Analyze with Eclipse MAT or VisualVM
```

## Contributing Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/new-endpoint

# Make changes and commit
git add .
git commit -m "Add new endpoint for user preferences"

# Push and create pull request
git push origin feature/new-endpoint
```

### Pull Request Process
1. **Create PR** with descriptive title and description
2. **Run Tests** locally before submitting
3. **Code Review** by team members
4. **CI Pipeline** must pass all checks
5. **Merge** after approval and successful builds

### Commit Message Format
```
type(scope): description

- feat: new feature
- fix: bug fix
- docs: documentation changes
- style: formatting changes
- refactor: code refactoring
- test: adding tests
- chore: maintenance tasks

Example: feat(user-details): add endpoint for user preferences
```

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Oracle Database access
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone ssh://git@stash.cvent.net:7999/pa/passkey-user.git
   cd passkey-user
   ```

2. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-user-service
   java -jar target/passkey-user-service-0.6.15-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Access the service**:
   - API Base URL: `http://localhost:8080/passkey-user/v1`
   - Health Check: `http://localhost:8081/healthcheck`
   - Swagger UI: `http://localhost:8080/swagger`

### Running Tests

- **Unit Tests**:
  ```bash
  mvn test
  ```

- **Integration Tests**:
  ```bash
  mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
  ```

## API Documentation


Complete API documentation is available in [Backstage](https://backstage.core.cvent.org/catalog/default/api/passkey-user-api/definition).

## Repository Structure


```
passkey-user/
├── passkey-user-api/              # API models and contracts
├── passkey-user-data-access/      # Data access layer
├── passkey-user-service/          # Main service implementation
├── passkey-user-java-client/      # Java client library
├── passkey-user-integration-test/ # Integration tests
└── passkey-user-load-test/        # Performance tests
```

## Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/passkey/job/passkey-user-service)
- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-user-service)
- [Wiki Documentation](https://wiki.cvent.com/pages/viewpage.action?pageId=473184731#Resdesk/RDK2HomepagesGAPanalysis-Favorites)
- [Backstage Service Catalog](https://backstage.core.cvent.org/catalog/default/component/passkey-user-service)

## Contributing


See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed instructions on how to contribute to this project.
