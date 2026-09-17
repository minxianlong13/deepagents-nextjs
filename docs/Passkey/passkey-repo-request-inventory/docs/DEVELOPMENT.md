# Development Guide

## Prerequisites

### Required Software

- **Java 21 SDK**: OpenJDK 21 or Oracle JDK 21
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerization and local testing
- **Git**: Version control
- **IntelliJ IDEA** (recommended) or Eclipse: IDE with Java support

### Cvent-Specific Requirements

- **Cvent VPN**: Access to internal resources and repositories
- **Nexus Access**: Configured Maven settings for Cvent's internal repository
- **GitHub Access**: SSH key configured for `cvent-internal` organization
- **Database Access**: PostgreSQL client for local database connections

### Maven Configuration

Configure Maven to use Cvent's internal Nexus repository by adding to `~/.m2/settings.xml`:

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
          <url>https://nexus.cvent.net/repository/maven-public/</url>
        </repository>
      </repositories>
    </profile>
  </profiles>
  
  <activeProfiles>
    <activeProfile>cvent</activeProfile>
  </activeProfiles>
</settings>
```

## Local Setup

### 1. Clone Repository

```bash
git clone git@github.com:cvent-internal/passkey-request-inventory.git
cd passkey-request-inventory
```

### 2. Database Setup

#### Option A: Local PostgreSQL Installation

```bash
# Install PostgreSQL (macOS with Homebrew)
brew install postgresql
brew services start postgresql

# Create database and user
createdb passkey_inventory_dev
createuser -P passkey_user
# Enter password when prompted

# Grant permissions
psql -d passkey_inventory_dev -c "GRANT ALL PRIVILEGES ON DATABASE passkey_inventory_dev TO passkey_user;"
```

#### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name passkey-postgres \
  -e POSTGRES_DB=passkey_inventory_dev \
  -e POSTGRES_USER=passkey_user \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  -d postgres:13
```

### 3. Environment Configuration

Create local configuration file:

```bash
cp passkey-request-inventory-service/configs/dev.yaml passkey-request-inventory-service/configs/local.yaml
```

Update `local.yaml` with your local database settings:

```yaml
database:
  driverClass: org.postgresql.Driver
  url: jdbc:postgresql://localhost:5432/passkey_inventory_dev
  user: passkey_user
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

logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.requestinventory: DEBUG
    org.hibernate.SQL: DEBUG
```

### 4. Build Project

```bash
# Clean build
mvn clean package

# Build with release profile
mvn clean package -Prelease

# Skip tests for faster build
mvn clean package -DskipTests
```

### 5. Run Application

```bash
cd passkey-request-inventory-service
java -jar target/passkey-request-inventory-service-1.0.0-SNAPSHOT.jar server configs/local.yaml
```

The service will start on:
- **Application**: http://localhost:8080
- **Admin**: http://localhost:8081

## IDE Configuration

### IntelliJ IDEA Setup

#### 1. Import Project

1. Open IntelliJ IDEA
2. Choose "Open or Import"
3. Select the `passkey-request-inventory` directory
4. Choose "Import project from external model" → "Maven"
5. Accept default settings and click "Finish"

#### 2. Run Configuration

Create a new run configuration:

| Setting          | Value                                                                          |
|------------------|--------------------------------------------------------------------------------|
| **Name**         | PasskeyRequestInventoryService                                                 |
| **Main Class**   | `com.cvent.passkey.requestinventory.PasskeyRequestInventoryServiceApplication` |
| **Module**       | `passkey-request-inventory-service`                                           |
| **Arguments**    | `server configs/local.yaml`                                                   |
| **Working Dir**  | `$MODULE_WORKING_DIR$`                                                         |
| **JRE**          | Java 21                                                                        |

#### 3. Code Style

Import Cvent code style settings:
1. Go to File → Settings → Editor → Code Style
2. Import Cvent Java code style configuration
3. Enable "Optimize imports on the fly"
4. Set line separator to Unix (LF)

#### 4. Useful Plugins

- **Lombok**: For annotation processing
- **SonarLint**: Code quality analysis
- **Docker**: Container management
- **Database Navigator**: Database integration

### Eclipse Setup

#### 1. Import Project

1. File → Import → Existing Maven Projects
2. Browse to `passkey-request-inventory` directory
3. Select all modules and import

#### 2. Run Configuration

1. Right-click on `PasskeyRequestInventoryServiceApplication.java`
2. Run As → Java Application
3. Edit run configuration to add program arguments: `server configs/local.yaml`

## Running Tests

### Unit Tests

```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-request-inventory-service

# Run specific test class
mvn test -Dtest=RequestInventoryServiceTest

# Run with coverage
mvn test jacoco:report -Pcoverage
```

### Integration Tests

```bash
# Run integration tests
mvn verify -Prun-it -Dkarate.env=dev -Dkarate.config.dir=test_configs

# Run specific feature
mvn verify -Prun-it -Dkarate.env=dev -Dkarate.config.dir=test_configs -Dtest=RequestInventoryTest
```

#### IntelliJ Integration Test Setup

To run Karate tests in IntelliJ:

1. Right-click on feature file
2. Click "Modify run configuration"
3. Add VM options: `-Dkarate.env=dev -Dkarate.config.dir=test_configs`
4. Save and run

### Load Tests

```bash
# Run load tests
mvn verify -Prun-load

# Custom load test configuration
mvn verify -Prun-load -Dload.users=50 -Dload.duration=300s
```

## Code Structure

### Package Organization

```
com.cvent.passkey.requestinventory/
├── resources/              # REST API endpoints
│   ├── RequestInventoryResource.java
│   ├── BulkRequestInventoryResource.java
│   └── LockInventoryResource.java
├── service/               # Business logic services
│   ├── RequestInventoryService.java
│   ├── BulkRequestInventoryService.java
│   ├── LockInventoryService.java
│   └── validation/        # Validation services
├── dao/                   # Data access objects (in data-access module)
├── model/                 # API models and DTOs (in api module)
├── exception/             # Custom exceptions
├── filter/                # Request filters
├── health/                # Health check implementations
└── util/                  # Utility classes
```

### Naming Conventions

- **Classes**: PascalCase (e.g., `RequestInventoryService`)
- **Methods**: camelCase (e.g., `createInventoryAllocation`)
- **Variables**: camelCase (e.g., `reservationId`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_TIMEOUT_MIN`)
- **Packages**: lowercase (e.g., `com.cvent.passkey.requestinventory`)

## Coding Standards

### Code Style Guidelines

1. **Line Length**: Maximum 120 characters
2. **Indentation**: 4 spaces (no tabs)
3. **Braces**: Opening brace on same line
4. **Imports**: Organize imports, remove unused
5. **JavaDoc**: Required for public methods and classes

### Example Code Style

```java
/**
 * Service for managing inventory allocations.
 */
public class RequestInventoryService {
    
    private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    private static final int DEFAULT_TIMEOUT_MIN = 30;
    
    private final RequestInventoryDao dao;
    private final ValidationService validationService;
    
    public RequestInventoryService(RequestInventoryDao dao, ValidationService validationService) {
        this.dao = dao;
        this.validationService = validationService;
    }
    
    /**
     * Creates a new inventory allocation for the specified reservation.
     *
     * @param reservationId the reservation identifier
     * @param request the allocation request details
     * @return the created allocation response
     * @throws ValidationException if the request is invalid
     */
    public InventoryAllocationResponse createInventoryAllocation(long reservationId, 
                                                               InventoryAllocationRequest request) {
        LOG.info("Creating inventory allocation for reservation {}", reservationId);
        
        validationService.validateRequest(request);
        
        // Implementation details...
        
        return response;
    }
}
```

### Error Handling

```java
// Use specific exceptions
throw new ValidationException("Invalid date range: start date must be before end date");

// Log errors appropriately
LOG.error("Failed to allocate inventory for reservation {}: {}", reservationId, e.getMessage(), e);

// Return meaningful error responses
return ErrorResponse.builder()
    .code("INVENTORY_NOT_AVAILABLE")
    .message("Requested inventory is not available for the specified dates")
    .build();
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Define the model** in `passkey-request-inventory-api/src/main/java/com/cvent/passkey/requestinventory/model/`
2. **Add the endpoint** in appropriate resource class
3. **Implement business logic** in service layer
4. **Add data access** if needed in DAO layer
5. **Write unit tests** for all layers
6. **Add integration tests** using Karate
7. **Update API documentation**

### Adding a New Service Method

```java
// 1. Add method to service interface (if exists)
public interface RequestInventoryService {
    InventoryAllocationResponse newMethod(long reservationId, NewRequest request);
}

// 2. Implement in service class
@Override
public InventoryAllocationResponse newMethod(long reservationId, NewRequest request) {
    // Validation
    validationService.validate(request);
    
    // Business logic
    // ...
    
    // Data persistence
    dao.save(entity);
    
    return response;
}

// 3. Add unit tests
@Test
void testNewMethod() {
    // Given
    NewRequest request = new NewRequest();
    
    // When
    InventoryAllocationResponse response = service.newMethod(123L, request);
    
    // Then
    assertThat(response).isNotNull();
    // Additional assertions...
}
```

### Database Schema Changes

1. **Create Liquibase changeset** (if using Liquibase)
2. **Update DAO classes** to handle new schema
3. **Update entity models** if needed
4. **Test migration** on local database
5. **Update integration tests** to use new schema

### Adding Configuration Properties

```yaml
# Add to configs/local.yaml
newFeature:
  enabled: true
  timeout: 30s
  maxRetries: 3
```

```java
// Add to configuration class
public class PasskeyRequestInventoryServiceConfiguration extends Configuration {
    @JsonProperty
    private NewFeatureConfig newFeature = new NewFeatureConfig();
    
    public NewFeatureConfig getNewFeature() {
        return newFeature;
    }
}
```

## Debugging

### Local Debugging

1. **Set breakpoints** in IDE
2. **Run in debug mode** using IDE run configuration
3. **Use remote debugging** for containerized applications:

```bash
# Add JVM debug options
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-request-inventory-service-1.0.0-SNAPSHOT.jar \
     server configs/local.yaml
```

### Logging Configuration

```yaml
# Increase log levels for debugging
logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.requestinventory: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
    com.cvent.auth: DEBUG
```

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
psql -h localhost -U passkey_user -d passkey_inventory_dev

# Verify connection settings in configuration
```

#### Maven Build Issues
```bash
# Clear Maven cache
mvn dependency:purge-local-repository

# Rebuild with clean slate
mvn clean install -U
```

#### Authentication Issues
```bash
# Verify API key configuration
# Check auth service connectivity
# Review authentication logs
```

## Contributing

### Git Workflow

1. **Create feature branch** from `master`
2. **Make changes** following coding standards
3. **Write tests** for new functionality
4. **Run full test suite** before committing
5. **Create pull request** with descriptive title and description
6. **Address review feedback**
7. **Merge after approval**

### Pull Request Guidelines

- **Title**: Clear, descriptive summary of changes
- **Description**: Detailed explanation of what and why
- **Tests**: Include unit and integration tests
- **Documentation**: Update relevant documentation
- **Breaking Changes**: Clearly mark any breaking changes

### Code Review Checklist

- [ ] Code follows established patterns and conventions
- [ ] All tests pass
- [ ] New functionality has appropriate test coverage
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Error handling is appropriate

## Additional Resources

## Quick Start


### Prerequisites

- Java 21 SDK
- Maven 3.6+
- Access to Cvent's internal Nexus repository
- Database connection (configured in environment-specific YAML files)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone git@github.com:cvent-internal/passkey-request-inventory.git
   cd passkey-request-inventory
   ```

2. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-request-inventory-service
   java -jar target/passkey-request-inventory-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Run integration tests**:
   ```bash
   mvn -Prun-it -Dkarate.env=dev -Dkarate.config.dir=test_configs verify
   ```

### IntelliJ IDEA Configuration

| Property         | Value                                                                          |
|------------------|--------------------------------------------------------------------------------|
| SDK              | Java 21 SDK of `passkey-request-inventory-service` module                     |
| Module Classpath | `-cp passkey-request-inventory-service`                                       |
| Main Class       | `com.cvent.passkey.requestinventory.PasskeyRequestInventoryServiceApplication` |
| Arguments        | `server configs/dev.yaml`                                                     |

## API Endpoints


The service exposes REST APIs for:

- **Individual Inventory Operations**: `/api/v1/request-inventory/{reservationId}`
- **Bulk Inventory Operations**: `/api/v1/request-inventory/bulk`
- **Inventory Locking**: `/api/v1/lock-inventory/{reservationId}`

## Service Ownership


| Role      | Team          | Slack Channel             |
|-----------|---------------|---------------------------|
| Primary   | Meeseeksbox   | `#passkey-meeseeks-box`   |
| Secondary | Steakholders  | `#passkey-steak-holders`  |

## Useful Links


- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-request-inventory)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-request-inventory-service)
- [Admin Portal](https://admin.core.cvent.org/serviceid/6e5d7a5d-9d1b-4fdd-9cbf-f65b1a2ea14d)
- [Technical Design Wiki](https://wiki.cvent.com/display/PASKY/Request+Inventory+Service+Tech+Design)

## Version


Current version: 1.2.1-SNAPSHOT
