# Development Guide

## Prerequisites

### Required Software
- **Java 17 SDK** - OpenJDK or Oracle JDK
- **Maven 3.6+** - Build and dependency management
- **Docker** - For containerization and local testing
- **Git** - Version control
- **IntelliJ IDEA** (recommended) or Eclipse - IDE

### Development Tools
- **Postman** or **curl** - API testing
- **Oracle SQL Developer** - Database management
- **Docker Compose** - Local service orchestration

### Access Requirements
- **GitHub Access**: Repository access to cvent-internal organization
- **Nexus Repository**: Access to Cvent's internal Maven repository
- **API Keys**: Development environment API keys from Backstage
- **VPN Access**: Required for database and internal service connections

## Local Setup

### 1. Repository Setup
```bash
# Clone the repository
git clone git@github.com:cvent-internal/passkey-ledger.git
cd passkey-ledger

# Verify Java version
java -version  # Should show Java 17

# Verify Maven configuration
mvn -version
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

### 3. Environment Configuration
Create the development environment file:
```bash
# Create environment variables file
touch passkey-ledger-service/configs/dev.env
```

Add the following content to `dev.env`:
```bash
# API Keys (get from Backstage)
LOCAL_API_KEY=your_api_key_here
LOCAL_ECOMMERCE_API_KEY=your_ecommerce_api_key_here

# Database Configuration
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XEPDB1
DB_USER=ledger_dev
DB_PASSWORD=dev_password

# Service URLs
AUTH_SERVICE_URL=https://auth-service.dev.cvent.org
ECOMMERCE_SERVICE_URL=https://ecommerce-service.dev.cvent.org
PAYMENT_SERVICE_URL=https://payment-service.dev.cvent.org

# Logging
LOG_LEVEL=DEBUG
```

### 4. Database Setup
For local development, you can use Docker to run Oracle Database:
```bash
# Start Oracle Database container
docker run -d \
  --name oracle-db \
  -p 1521:1521 \
  -e ORACLE_PWD=oracle123 \
  -e ORACLE_CHARACTERSET=AL32UTF8 \
  container-registry.oracle.com/database/express:latest

# Wait for database to start (check logs)
docker logs -f oracle-db

# Create development schema
sqlplus sys/oracle123@localhost:1521/XEPDB1 as sysdba
CREATE USER ledger_dev IDENTIFIED BY dev_password;
GRANT CONNECT, RESOURCE, DBA TO ledger_dev;
```

### 5. Build and Run
```bash
# Build the project
mvn clean package -Prelease

# Run the service
cd passkey-ledger-service
java -jar target/passkey-ledger-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
```

The service will start on:
- **Application Port**: http://localhost:8080
- **Admin Port**: http://localhost:8081

## IntelliJ IDEA Configuration

### Launch Configuration
Create a new Run Configuration with the following settings:

| Property              | Value                                                     |
|-----------------------|-----------------------------------------------------------|
| **Configuration Type** | Application                                              |
| **SDK**               | Java 17 SDK of `passkey-ledger-service` module          |
| **Module Classpath**  | `passkey-ledger-service`                                 |
| **Main Class**        | `com.cvent.passkeyledger.PasskeyLedgerServiceApplication` |
| **Program Arguments** | `server passkey-ledger-service/configs/dev.yaml`        |
| **Environment File** | `passkey-ledger-service/configs/dev.env`                |
| **Working Directory** | `$PROJECT_DIR$`                                          |

### VM Options
Add the following VM options for optimal development:
```
-Xms1g
-Xmx2g
-XX:+UseG1GC
-Dfile.encoding=UTF-8
-Djava.awt.headless=true
```

### Code Style
Import the Cvent code style configuration:
1. Go to **File → Settings → Editor → Code Style**
2. Import the code style from the project's `.idea/codeStyles/` directory
3. Enable **Reformat code** and **Optimize imports** on commit

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-ledger-service

# Run specific test class
mvn test -Dtest=BalanceResourceTest

# Run with coverage
mvn test jacoco:report -Pcoverage
```

### Integration Tests
```bash
# Run all integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run specific feature
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev -Dkarate.options="--tags @balance" verify

# Run from IntelliJ
# 1. Right-click on feature file
# 2. Select "Run Feature"
# 3. Add VM options: -Dkarate.env=dev -Dkarate.config.dir=test_configs
```

### Load Tests
```bash
# Run load tests
mvn -Prun-load verify

# Run with custom parameters
mvn -Prun-load -Dload.users=10 -Dload.duration=60s verify
```

## Code Structure

### Package Organization
```
com.cvent.passkeyledger/
├── PasskeyLedgerServiceApplication.java    # Main application
├── PasskeyLedgerServiceConfiguration.java # Configuration
├── health/                                 # Health checks
├── helpers/                               # Utility classes
├── model/                                 # Domain models
├── resources/                             # REST endpoints
│   ├── BalanceResource.java
│   ├── CreditCardResource.java
│   ├── OperationResource.java
│   └── ...
├── services/                              # Business logic
└── utils/                                 # Common utilities
```

### Module Dependencies
```
passkey-ledger-service
├── depends on: passkey-ledger-api
├── depends on: passkey-ledger-data-access
└── provides: REST API endpoints

passkey-ledger-api
└── provides: Data models and contracts

passkey-ledger-data-access
├── depends on: passkey-ledger-api
└── provides: Database operations

passkey-ledger-java-client
├── depends on: passkey-ledger-api
└── provides: Client library
```

## Coding Standards

### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: 120 characters maximum
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Imports**: Organize imports, no wildcard imports
- **Comments**: JavaDoc for public methods and classes

### Example Code Structure
```java
/**
 * Resource for handling balance operations.
 */
@Path("/balance")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BalanceResource {
    
    private final BalanceService balanceService;
    
    public BalanceResource(BalanceService balanceService) {
        this.balanceService = balanceService;
    }
    
    /**
     * Retrieves balance for the specified owner.
     *
     * @param ownerId the owner identifier
     * @param ownerType the type of owner
     * @return the current balance
     */
    @GET
    @Path("/{ownerId}")
    @Timed(name = "get-balance-timer")
    public Response getBalance(@PathParam("ownerId") String ownerId,
                              @QueryParam("ownerType") String ownerType) {
        // Implementation
    }
}
```

### Error Handling
```java
// Use specific exceptions
throw new BalanceNotFoundException("Balance not found for owner: " + ownerId);

// Log appropriately
logger.warn("Failed to process payment for transaction: {}", transactionId, exception);

// Return proper HTTP status codes
return Response.status(Response.Status.NOT_FOUND)
    .entity(new ErrorResponse("BALANCE_NOT_FOUND", "Balance not found"))
    .build();
```

## Common Development Tasks

### Adding a New Endpoint
1. **Define the API contract** in `passkey-ledger-api`
2. **Create the resource class** in `passkey-ledger-service/resources`
3. **Implement business logic** in service classes
4. **Add data access methods** if needed
5. **Write unit tests** for all layers
6. **Add integration tests** using Karate
7. **Update API documentation**

### Adding a New Dependency
1. **Add to parent POM** dependency management section
2. **Add to specific module POM** dependencies section
3. **Update documentation** if it affects configuration
4. **Run security scan** to check for vulnerabilities

### Database Schema Changes
1. **Create migration script** in `db/migrations/`
2. **Test migration** on local database
3. **Update entity classes** if needed
4. **Add rollback script** for the migration
5. **Document the changes** in CHANGELOG.md

### Adding Configuration Properties
1. **Add to Configuration class** with proper annotations
2. **Update YAML files** with default values
3. **Document in README** if user-configurable
4. **Add validation** if required

## Debugging

### Local Debugging
1. **Set breakpoints** in IntelliJ IDEA
2. **Run in debug mode** using the configured launch configuration
3. **Use remote debugging** for containerized environments:
   ```bash
   java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
        -jar passkey-ledger-service.jar server configs/dev.yaml
   ```

### Log Analysis
```bash
# Tail application logs
tail -f logs/passkey-ledger.log

# Search for specific patterns
grep "ERROR" logs/passkey-ledger.log

# Analyze performance
grep "SLOW_QUERY" logs/passkey-ledger.log | awk '{print $4}' | sort -n
```

### Database Debugging
```sql
-- Check active sessions
SELECT username, status, machine FROM v$session WHERE username = 'LEDGER_DEV';

-- Monitor long-running queries
SELECT sql_text, elapsed_time FROM v$sql WHERE elapsed_time > 1000000;

-- Check locks
SELECT * FROM v$locked_object;
```

## Testing Guidelines

### Unit Test Structure
```java
@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {
    
    @Mock
    private BalanceDAO balanceDAO;
    
    @InjectMocks
    private BalanceService balanceService;
    
    @Test
    void shouldReturnBalanceWhenOwnerExists() {
        // Given
        String ownerId = "owner123";
        Balance expectedBalance = new Balance(ownerId, "ORGANIZATIONAL_ENTITY", BigDecimal.valueOf(100));
        when(balanceDAO.findByOwner(ownerId, "ORGANIZATIONAL_ENTITY")).thenReturn(expectedBalance);
        
        // When
        Balance actualBalance = balanceService.getBalance(ownerId, "ORGANIZATIONAL_ENTITY");
        
        // Then
        assertThat(actualBalance).isEqualTo(expectedBalance);
    }
}
```

### Integration Test Structure
```gherkin
Feature: Balance Management
  
  Background:
    * url baseUrl
    * header Authorization = 'Bearer ' + apiKey
  
  Scenario: Get balance for existing owner
    Given path 'balance', 'owner123'
    And param ownerType = 'ORGANIZATIONAL_ENTITY'
    When method GET
    Then status 200
    And match response.ownerId == 'owner123'
    And match response.balance == '#number'
```

## Contributing

### Pull Request Process
1. **Create feature branch** from `master`
2. **Implement changes** following coding standards
3. **Write/update tests** to maintain coverage
4. **Update documentation** if needed
5. **Run full test suite** locally
6. **Create pull request** with descriptive title and description
7. **Address review feedback** promptly
8. **Squash commits** before merging

### Code Review Checklist
- [ ] Code follows established patterns and standards
- [ ] All tests pass and coverage is maintained
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Error handling is appropriate
- [ ] Logging is adequate but not excessive

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/add-new-endpoint

# Make changes and commit
git add .
git commit -m "Add new balance endpoint with validation"

# Push and create PR
git push origin feature/add-new-endpoint
# Create PR through GitHub UI

# After approval, squash and merge
git checkout master
git pull origin master
git branch -d feature/add-new-endpoint
```

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Access to Cvent's internal Nexus repository
- Required API keys (see Environment Variables section)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone git@github.com:cvent-internal/passkey-ledger.git
   cd passkey-ledger
   ```

2. **Set up environment variables**:
   Create `passkey-ledger-service/configs/dev.env`:
   ```bash
   LOCAL_API_KEY=your_api_key_here
   LOCAL_ECOMMERCE_API_KEY=your_ecommerce_api_key_here
   ```

3. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

4. **Run locally**:
   ```bash
   cd passkey-ledger-service
   java -jar target/passkey-ledger-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
   ```

### Running Tests

- **Unit tests**: `mvn test`
- **Integration tests**: `mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify`
- **Load tests**: `mvn -Prun-load verify`
- **Coverage report**: `mvn jacoco:report -Pcoverage`

## Service Ownership


| Role      | Team          | Slack Channel             |
|-----------|---------------|---------------------------|
| Primary   | Steakholders  | `#passkey-steak-holders`  |
| Secondary | Meeseeksbox   | `#passkey-meeseeks-box`   |

## Useful Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/passkey/job/passkey-ledger/)
- [Admin Portal](https://admin.core.cvent.org/serviceid/6c5bab3d-9bea-4cfa-a715-e97b8317b4f7)
- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-ledger-service)
- [API Keys Management](https://backstage.core.cvent.org/catalog/default/component/passkey-ledger-service/api-keys)
