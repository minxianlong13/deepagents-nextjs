# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerized development and testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Optional Tools
- **Oracle Database**: For local database development
- **Postman**: API testing and development
- **Docker Compose**: Multi-container development
- **Karate**: API testing framework

### Environment Setup
```bash
# Verify Java installation
java -version
# Should show Java 21

# Verify Maven installation
mvn -version
# Should show Maven 3.6+

# Verify Docker installation
docker --version
docker-compose --version
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-business-text.git
cd passkey-business-text
```

### 2. Configure Maven Settings
Ensure your `~/.m2/settings.xml` includes Cvent's internal repositories:
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

### 3. Build Project
```bash
# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package application
mvn package -Prelease
```

### 4. Database Setup

#### Option A: Local Oracle Database
```bash
# Start Oracle container
docker run -d \
  --name oracle-db \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  oracle/database:18.4.0-xe

# Wait for database to start (check logs)
docker logs -f oracle-db
```

#### Option B: Use Development Database
Update `configs/dev.yaml` with development database credentials:
```yaml
database:
  url: jdbc:oracle:thin:@dev-oracle.cvent.com:1521:DEVDB
  user: ${DB_USER}
  password: ${DB_PASSWORD}
```

### 5. Run Application Locally
```bash
# Set environment variables
export DB_USER=your_db_user
export DB_PASSWORD=your_db_password

# Run the service
cd passkey-business-text-service
java -jar target/passkey-business-text-service-1.3.2-SNAPSHOT.jar server configs/dev.yaml
```

### 6. Verify Installation
```bash
# Check health endpoint
curl http://localhost:8081/healthcheck

# Check application endpoint
curl http://localhost:8080/passkey-business-text/v1/locales \
  -H "Authorization: Bearer your-api-key"
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests with coverage
mvn test -Pcoverage

# Run specific test class
mvn test -Dtest=BusinessTextServiceTest

# Run tests in specific module
mvn test -pl passkey-business-text-service
```

### Integration Tests
```bash
# Run integration tests (requires running service)
mvn verify -Prun-it -Dkarate.env=dev

# Run specific integration test
mvn test -Dtest=BusinessTextIntegrationTest -Prun-it

# Run with custom configuration
mvn verify -Prun-it -Dkarate.env=dev -Dkarate.config.dir=test_configs
```

### Test Coverage Report
```bash
# Generate coverage report
mvn clean install -Pcoverage

# View report
open target/site/jacoco/index.html
```

## Code Structure

### Module Organization
```
passkey-business-text/
├── passkey-business-text-api/          # API contracts and models
│   └── src/main/java/
│       └── com/cvent/passkey/businesstext/model/
├── passkey-business-text-service/      # Main service implementation
│   └── src/main/java/
│       └── com/cvent/passkeybusinesstext/
│           ├── resources/              # REST endpoints
│           ├── services/               # Business logic
│           ├── health/                 # Health checks
│           └── exceptions/             # Exception handling
├── passkey-business-text-data-access/  # Data access layer
│   └── src/main/java/
│       └── com/cvent/passkey/businesstext/dataaccess/
├── passkey-business-text-java-client/  # Java client library
│   └── src/main/java/
│       └── com/cvent/passkeybusinesstext/client/
└── passkey-business-text-integration-test/  # Integration tests
    └── src/test/java/
```

### Package Structure
```
com.cvent.passkeybusinesstext/
├── resources/                  # JAX-RS resources (REST endpoints)
│   ├── BusinessTextResource
│   ├── LocaleResource
│   ├── CountryResource
│   └── CustomBusinessTextResource
├── services/                   # Business logic services
│   ├── BusinessTextService
│   ├── LocaleService
│   └── CountryService
├── health/                     # Health check implementations
├── exceptions/                 # Custom exceptions and mappers
└── PasskeyBusinessTextServiceApplication  # Main application class
```

## Coding Standards

### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: 120 characters maximum
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Imports**: No wildcard imports, organize imports
- **Comments**: JavaDoc for public APIs, inline comments for complex logic

### Code Quality Tools
```bash
# Run Checkstyle
mvn checkstyle:check

# Fix common style issues
mvn checkstyle:checkstyle

# Run SpotBugs
mvn spotbugs:check
```

### Example Code Style
```java
/**
 * Service for managing business text operations.
 */
@Service
public class BusinessTextService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(BusinessTextService.class);
    
    private final BusinessTextDataAccess dataAccess;
    
    public BusinessTextService(BusinessTextDataAccess dataAccess) {
        this.dataAccess = dataAccess;
    }
    
    /**
     * Saves business text entry.
     *
     * @param businessText the business text to save
     * @throws BusinessTextException if save operation fails
     */
    public void saveBusinessText(BusinessText businessText) {
        LOGGER.debug("Saving business text with ID: {}", businessText.getBusinessTextId());
        
        try {
            dataAccess.save(businessText);
            LOGGER.info("Successfully saved business text: {}", businessText.getBusinessTextId());
        } catch (Exception e) {
            LOGGER.error("Failed to save business text: {}", businessText.getBusinessTextId(), e);
            throw new BusinessTextException("Save operation failed", e);
        }
    }
}
```

## Common Development Tasks

### Adding a New Endpoint

1. **Define API Contract** (in `passkey-business-text-api`)
```java
// Add new model class
@Value.Immutable
@JsonSerialize
@JsonDeserialize(as = ImmutableNewModel.class)
@CventApiStyleV2
public interface NewModel {
    String getId();
    String getName();
}
```

2. **Create Resource Class** (in `passkey-business-text-service`)
```java
@Path("/passkey-business-text/v1/new-endpoint")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class NewResource {
    
    @GET
    @SecurityRequirement(name = "apiKey")
    public Response getNewData(
        @Parameter(hidden = true) @Authority(methods = AuthMethod.API_KEY) GrantedAPIKey apiKey
    ) {
        // Implementation
        return Response.ok().build();
    }
}
```

3. **Add Service Logic**
```java
@Service
public class NewService {
    public List<NewModel> getNewData() {
        // Business logic implementation
        return Collections.emptyList();
    }
}
```

4. **Register Resource** (in Application class)
```java
@Override
public void run(PasskeyBusinessTextServiceConfiguration configuration, Environment environment) {
    // Register new resource
    environment.jersey().register(new NewResource(newService));
}
```

### Adding Database Operations

1. **Create Data Access Class**
```java
public class NewDataAccess {
    
    private final Handle handle;
    
    public NewDataAccess(Handle handle) {
        this.handle = handle;
    }
    
    public List<NewModel> findAll() {
        return handle.createQuery("SELECT * FROM new_table")
            .mapToBean(NewModel.class)
            .list();
    }
}
```

2. **Add Database Migration**
```sql
-- Create migration script in resources/db/migration/
CREATE TABLE new_table (
    id VARCHAR2(255) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Writing Tests

#### Unit Test Example
```java
@ExtendWith(MockitoExtension.class)
class BusinessTextServiceTest {
    
    @Mock
    private BusinessTextDataAccess dataAccess;
    
    @InjectMocks
    private BusinessTextService service;
    
    @Test
    void shouldSaveBusinessText() {
        // Given
        BusinessText businessText = ImmutableBusinessText.builder()
            .userId(123L)
            .businessTextId("test.id")
            .locale("en_US")
            .valueSmall("Test")
            .build();
        
        // When
        service.saveBusinessText(businessText);
        
        // Then
        verify(dataAccess).save(businessText);
    }
}
```

#### Integration Test Example (Karate)
```gherkin
Feature: Business Text API

Background:
  * url baseUrl
  * header Authorization = 'Bearer ' + apiKey

Scenario: Create and retrieve business text
  Given path 'passkey-business-text/v1/business-text'
  And request
    """
    {
      "userId": 123,
      "businessTextId": "test.integration",
      "locale": "en_US",
      "valueSmall": "Integration Test"
    }
    """
  When method POST
  Then status 204
  
  Given path 'passkey-business-text/v1/business-text'
  And param businessTextId = 'test.integration'
  And param localeId = 'en_US'
  When method GET
  Then status 200
  And match response[0].valueSmall == 'Integration Test'
```

## Debugging

### Local Debugging
```bash
# Run with debug mode
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
  -jar target/passkey-business-text-service-1.3.2-SNAPSHOT.jar server configs/dev.yaml
```

### IDE Configuration
- **IntelliJ IDEA**: Create remote debug configuration on port 5005
- **Eclipse**: Use Remote Java Application debug configuration
- **VS Code**: Configure Java debug launch configuration

### Logging Configuration
```xml
<!-- Increase logging for debugging -->
<logger name="com.cvent.passkeybusinesstext" level="DEBUG"/>
<logger name="org.hibernate.SQL" level="DEBUG"/>
<logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="TRACE"/>
```

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check database connectivity
telnet dev-oracle.cvent.com 1521

# Verify credentials
sqlplus username/password@dev-oracle.cvent.com:1521/DEVDB
```

#### Build Issues
```bash
# Clean and rebuild
mvn clean install -U

# Skip tests if needed
mvn clean install -DskipTests

# Check dependency conflicts
mvn dependency:tree
```

#### Authentication Issues
```bash
# Verify API key
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:8080/passkey-business-text/v1/locales

# Check auth service connectivity
curl https://auth-service-dev.cvent.com/health
```

## Performance Testing

### Load Testing with JMeter
```xml
<!-- JMeter test plan for business text endpoints -->
<TestPlan>
  <ThreadGroup>
    <numThreads>50</numThreads>
    <rampTime>30</rampTime>
    <duration>300</duration>
  </ThreadGroup>
</TestPlan>
```

### Profiling
```bash
# Run with profiler
java -javaagent:path/to/profiler.jar \
  -jar target/passkey-business-text-service-1.3.2-SNAPSHOT.jar server configs/dev.yaml
```

## Contributing

### Git Workflow
1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Make Changes**: Implement feature with tests
3. **Run Tests**: Ensure all tests pass
4. **Commit Changes**: Use conventional commit messages
5. **Push Branch**: `git push origin feature/new-feature`
6. **Create Pull Request**: Submit for code review
7. **Address Feedback**: Make requested changes
8. **Merge**: After approval, merge to master

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(api): add new business text endpoint`
- `fix(database): resolve connection pool issue`
- `docs(readme): update setup instructions`

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Oracle Database access
- Docker (for containerized deployment)

### Local Development
```bash
# Build the project
mvn package -Prelease

# Run locally
cd passkey-business-text-service
java -jar target/passkey-business-text-service-1.3.2-SNAPSHOT.jar server configs/dev.yaml
```

### Docker
```bash
# Build Docker image
docker build -t passkey-business-text .

# Run container
docker run -p 8080:8080 passkey-business-text
```

## API Endpoints


- **Base URL**: `/passkey-business-text/v1/`
- **Business Text**: `/business-text` - CRUD operations for business text
- **Locales**: `/locales` - Locale management
- **Countries**: `/countries` - Country information
- **Custom Business Text**: `/custom-business-text` - Custom text overrides

## Team


- **Owner**: metre-stick team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels

## Links


- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-business-text-service)
- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-business-text)
- [GitHub Repository](https://github.com/cvent-internal/passkey-business-text)
