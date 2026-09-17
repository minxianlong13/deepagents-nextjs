# Development Guide

## Prerequisites

### Required Software
- **Java 17 SDK** - OpenJDK or Oracle JDK
- **Maven 3.6+** - Build tool and dependency management
- **Docker** - For containerized testing and deployment
- **Git** - Version control
- **IntelliJ IDEA** (recommended) or Eclipse - IDE

### Optional Tools
- **Postman** - API testing
- **DBeaver** - Database client for Oracle
- **Docker Compose** - Local service orchestration

### System Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 8GB, recommended 16GB
- **Disk**: 10GB free space for dependencies and build artifacts

## Local Setup

### 1. Clone Repository
```bash
git clone ssh://git@stash.cvent.net:7999/PA/passkey-addons.git
cd passkey-addons
```

### 2. Environment Configuration
Create the environment file for local development:

```bash
# Create the config directory if it doesn't exist
mkdir -p passkey-addons-service/configs

# Create the environment file
cat > passkey-addons-service/configs/dev.env << EOF
# API Keys (get actual values from Backstage)
LOCAL_API_KEY=your_local_api_key_here

# Database Configuration (for local Oracle instance)
DB_HOST=localhost
DB_PORT=1521
DB_NAME=XEPDB1
DB_USERNAME=passkey_addons
DB_PASSWORD=your_db_password

# Service Configuration
SERVICE_PORT=8080
ADMIN_PORT=8081
LOG_LEVEL=DEBUG
EOF
```

**Important**: The `dev.env` file is ignored by Git. Get actual API key values from [Backstage API Keys](https://backstage.core.cvent.org/catalog/default/component/passkey-addons-service/api-keys?environment=staging).

### 3. Database Setup (Optional)
For local development, you can either:

#### Option A: Use Development Database
Configure `dev.env` to point to the shared development database (recommended for most development).

#### Option B: Local Oracle Database
If you need a local database instance:

```bash
# Run Oracle XE in Docker
docker run -d \
  --name oracle-xe \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=oracle123 \
  -e ORACLE_DATABASE=XEPDB1 \
  gvenzl/oracle-xe:21-slim

# Wait for database to start (check logs)
docker logs -f oracle-xe

# Create schema (run SQL scripts from passkey-addons-data-access/src/main/resources/db/migration)
```

### 4. Build Project
```bash
# Clean build with all modules
mvn clean package -Prelease

# Skip tests for faster build
mvn clean package -Prelease -DskipTests
```

### 5. Verify Setup
```bash
# Run unit tests
mvn test

# Check if service starts (should fail gracefully without database)
java -jar passkey-addons-service/target/passkey-addons-service-*.jar server passkey-addons-service/configs/dev.yaml
```

## IDE Configuration

### IntelliJ IDEA Setup

#### 1. Import Project
- Open IntelliJ IDEA
- File → Open → Select `passkey-addons` directory
- Choose "Import as Maven project"

#### 2. Configure SDK
- File → Project Structure → Project
- Set Project SDK to Java 17
- Set Project language level to 17

#### 3. Create Run Configuration
- Run → Edit Configurations → Add New → Application
- **Name**: `Passkey Addons Service`
- **SDK**: Java 17 SDK of `passkey-addons-service` module
- **Module Classpath**: `passkey-addons-service`
- **Main Class**: `com.cvent.passkey.addons.PasskeyAddonsServiceApplication`
- **Program Arguments**: `server passkey-addons-service/configs/dev.yaml`
- **Environment Variables**: Load from `passkey-addons-service/configs/dev.env`
- **Working Directory**: `$PROJECT_DIR$`

#### 4. Configure Code Style
- File → Settings → Editor → Code Style → Java
- Import Cvent Java code style (if available)
- Enable "Optimize imports on the fly"

#### 5. Install Recommended Plugins
- **Lombok** - For annotation processing
- **CheckStyle-IDEA** - Code style checking
- **SonarLint** - Code quality analysis
- **Maven Helper** - Maven dependency management

### Eclipse Setup

#### 1. Import Project
- File → Import → Existing Maven Projects
- Select `passkey-addons` directory
- Import all modules

#### 2. Configure JRE
- Right-click project → Properties → Java Build Path
- Set JRE to Java 17

#### 3. Create Run Configuration
- Run → Run Configurations → Java Application → New
- **Project**: `passkey-addons-service`
- **Main Class**: `com.cvent.passkey.addons.PasskeyAddonsServiceApplication`
- **Arguments**: `server passkey-addons-service/configs/dev.yaml`
- **Environment**: Add variables from `dev.env`

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-addons-service

# Run specific test class
mvn test -Dtest=PasskeyAddonsResourceTest

# Run with coverage
mvn clean verify jacoco:report -Pcoverage
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run integration tests against local environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=local verify

# Run specific integration test
mvn -Prun-it -Dtest=MarketableAddonsIT verify
```

### Test Coverage Report
```bash
# Generate coverage report
mvn clean verify jacoco:report -Pcoverage

# Open coverage report
open target/site/jacoco/index.html
```

## Code Structure

### Package Organization
```
com.cvent.passkey.addons/
├── resources/              # REST API endpoints
│   ├── PasskeyAddonsResource.java
│   ├── AdminResource.java
│   └── ReservationProcessingResource.java
├── services/               # Business logic layer
│   ├── AddonsService.java
│   └── impl/
├── model/                  # Data models (in API module)
│   ├── marketable/
│   ├── reservation/
│   └── error/
├── exception/              # Exception handling
├── health/                 # Health checks
└── config/                 # Configuration classes
```

### Module Dependencies
```
passkey-addons-service
├── depends on: passkey-addons-api
├── depends on: passkey-addons-data-access
└── depends on: external libraries

passkey-addons-java-client
├── depends on: passkey-addons-api
└── depends on: retrofit, jackson

passkey-addons-integration-test
├── depends on: passkey-addons-java-client
└── depends on: karate, junit5
```

## Coding Standards

### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: 120 characters maximum
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Imports**: Organize imports, no wildcard imports
- **Comments**: JavaDoc for public APIs, inline comments for complex logic

### Example Code Style
```java
/**
 * Service for managing add-on operations.
 */
@Service
public class AddonsService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(AddonsService.class);
    
    private final AddonsRepository addonsRepository;
    
    public AddonsService(AddonsRepository addonsRepository) {
        this.addonsRepository = addonsRepository;
    }
    
    /**
     * Creates a new marketable add-on.
     *
     * @param request the add-on creation request
     * @return the created add-on
     * @throws ValidationException if the request is invalid
     */
    public MarketableAddon createMarketableAddon(AddonMarketingItemRequest request) {
        LOGGER.debug("Creating marketable add-on: {}", request.getName());
        
        validateRequest(request);
        
        MarketableAddon addon = buildAddonFromRequest(request);
        return addonsRepository.save(addon);
    }
    
    private void validateRequest(AddonMarketingItemRequest request) {
        // Validation logic here
    }
}
```

### Error Handling
```java
// Use specific exception types
throw new SimpleAddonsException(AddonsErrorCodeType.RESERVATION_NOT_FOUND);

// Log errors appropriately
LOGGER.error("Failed to create addon for request: {}", request, exception);

// Return proper HTTP status codes
return Response.status(Response.Status.NOT_FOUND)
    .entity(errorResponse)
    .build();
```

### Testing Standards
```java
@Test
void shouldCreateMarketableAddon() {
    // Given
    AddonMarketingItemRequest request = AddonMarketingItemRequest.builder()
        .name("Test Addon")
        .price(BigDecimal.valueOf(25.00))
        .hotelId(12345L)
        .eventId(67890L)
        .build();
    
    // When
    MarketableAddon result = addonsService.createMarketableAddon(request);
    
    // Then
    assertThat(result.getName()).isEqualTo("Test Addon");
    assertThat(result.getPrice()).isEqualTo(BigDecimal.valueOf(25.00));
}
```

## Common Development Tasks

### Adding a New Endpoint

1. **Define the model** (in `passkey-addons-api`):
```java
@JsonDeserialize(builder = ImmutableNewRequest.Builder.class)
@Value.Immutable
public interface NewRequest {
    String getName();
    // other fields...
}
```

2. **Add the endpoint** (in `PasskeyAddonsResource`):
```java
@POST
@Path("/v2/new-endpoint")
@Operation(summary = "Create new resource")
public Response createNewResource(@Valid @NotNull NewRequest request,
        @Authority(methods = { AuthMethod.API_KEY }) GrantedAPIKey token) {
    // Implementation
}
```

3. **Implement business logic** (in `AddonsService`):
```java
public NewResponse createNewResource(NewRequest request) {
    // Business logic implementation
}
```

4. **Add tests**:
```java
@Test
void shouldCreateNewResource() {
    // Test implementation
}
```

### Adding Database Migration

1. **Create migration file**:
```sql
-- V1.2.0__Add_new_table.sql
CREATE TABLE NEW_TABLE (
    ID VARCHAR2(255) PRIMARY KEY,
    NAME VARCHAR2(500) NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Update entity classes** (if using JPA):
```java
@Entity
@Table(name = "NEW_TABLE")
public class NewEntity {
    @Id
    private String id;
    
    @Column(name = "NAME")
    private String name;
    
    // getters/setters
}
```

### Debugging Tips

#### Enable Debug Logging
```yaml
# In dev.yaml
logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.addons: DEBUG
    org.apache.http: DEBUG  # For HTTP client debugging
```

#### Common Issues

**Issue**: Service fails to start with database connection error
**Solution**: Check database configuration in `dev.env` and ensure database is accessible

**Issue**: Tests fail with authentication errors
**Solution**: Verify API key in `dev.env` is valid and has proper permissions

**Issue**: Integration tests fail
**Solution**: Ensure target environment is accessible and service is deployed

#### Useful Debug Commands
```bash
# Check service health
curl http://localhost:8081/healthcheck

# View metrics
curl http://localhost:8081/metrics

# Test API endpoint
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:8080/passkey-addons/v2/marketable-addons

# View application logs
tail -f logs/application.log
```

## Contributing

### Git Workflow
1. Create feature branch from `develop`
2. Make changes and commit with descriptive messages
3. Push branch and create pull request
4. Address code review feedback
5. Merge to `develop` after approval

### Commit Message Format
```
feat: add new marketable addon endpoint

- Implement POST /v2/marketable-addons
- Add validation for addon creation
- Include integration tests

Closes #123
```

### Pull Request Checklist
- [ ] Code follows style guidelines
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Security considerations addressed

### Code Review Guidelines
- Focus on logic, performance, and maintainability
- Suggest improvements, don't just point out problems
- Verify tests cover edge cases
- Check for potential security issues
- Ensure documentation is updated

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone ssh://git@stash.cvent.net:7999/PA/passkey-addons.git
   cd passkey-addons
   ```

2. **Set up environment variables**
   Create `passkey-addons-service/configs/dev.env`:
   ```bash
   # Replace with actual value from Backstage
   LOCAL_API_KEY=your_api_key_here
   ```

3. **Build the project**
   ```bash
   mvn package -Prelease
   ```

4. **Run locally**
   Configure IntelliJ with:
   - **SDK**: Java 17 SDK of `passkey-addons-service` module
   - **Module Classpath**: `-cp passkey-addons-service`
   - **Main Class**: `com.cvent.passkey.addons.PasskeyAddonsServiceApplication`
   - **Arguments**: `server passkey-addons-service/configs/dev.yaml`
   - **Environment Variables**: `passkey-addons-service/configs/dev.env`

### Testing

```bash
# Run unit tests
mvn test

# Run integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Generate coverage report
mvn clean verify jacoco:report -Pcoverage
```

## Service Ownership


| Role      | Team         | Slack Channel            |
|-----------|--------------|--------------------------|
| Primary   | Maurya       | `#passkey-maurya`        |
| Secondary | Steakholders | `#passkey-steak-holders` |

## Useful Links


- [Jenkins](https://ci-jenkins.core.cvent.org/job/passkey/job/passkey-addons/)
- [Sonar](https://sonar.core.cvent.org/dashboard?id=com.cvent.passkey-addons%3Apasskey-addons-parent)
- [Admin Portal](https://admin.core.cvent.org/serviceid/011619b7-4008-48ff-a1dd-cae00f9cf2a5)
- [Datadog](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-addons-service)
