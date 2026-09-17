# Development Guide

## Prerequisites

### Required Software

- **Java 17+** - OpenJDK or Oracle JDK
- **Maven 3.8+** - Build tool for Java components
- **Node.js 18+** - JavaScript runtime for build tools
- **pnpm 8+** - Package manager for Node.js dependencies
- **Docker** - For local database and service containers
- **Git** - Version control

### Development Tools (Recommended)

- **IntelliJ IDEA** - Primary IDE with Spring Boot support
- **VS Code** - Alternative IDE with Java extensions
- **Postman** - API testing and development
- **DBeaver** - Database management and querying

### Environment Setup

1. **Install Java 17**
   ```bash
   # Using SDKMAN (recommended)
   curl -s "https://get.sdkman.io" | bash
   sdk install java 17.0.8-oracle
   sdk use java 17.0.8-oracle
   ```

2. **Install Node.js and pnpm**
   ```bash
   # Using Node Version Manager
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   npm install -g pnpm@8
   ```

3. **Install Docker**
   - Follow instructions at https://docs.docker.com/get-docker/

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-hotel-importer.git
cd passkey-hotel-importer
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Install Maven dependencies (done automatically during build)
cd packages/passkey-hotel-importer/service
mvn dependency:resolve
```

### 3. Database Setup

#### Option A: Docker Database (Recommended)

```bash
# Start Oracle database container
docker run -d \
  --name oracle-db \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  -e ORACLE_DATABASE=XEPDB1 \
  gvenzl/oracle-xe:21-slim

# Wait for database to be ready (check logs)
docker logs -f oracle-db
```

#### Option B: Local Oracle Installation

1. Install Oracle Database XE
2. Create database user and schema
3. Update connection details in `configs/dev.yaml`

### 4. Environment Configuration

Create local environment file:

```bash
# Copy example configuration
cp packages/passkey-hotel-importer/service/configs/dev.yaml.example \
   packages/passkey-hotel-importer/service/configs/dev.yaml

# Edit configuration with your local settings
vim packages/passkey-hotel-importer/service/configs/dev.yaml
```

Example `dev.yaml`:
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:oracle:thin:@//localhost:1521/XEPDB1
    username: system
    password: password
    driver-class-name: oracle.jdbc.OracleDriver

# Mock external services for local development
services:
  cvii:
    base-url: http://localhost:8081
  passkey-create-hotel:
    base-url: http://localhost:8082
```

### 5. Run Database Migrations

```bash
cd packages/passkey-hotel-importer/service
mvn flyway:migrate
```

## Running the Application

### Development Mode

```bash
# From service directory
cd packages/passkey-hotel-importer/service
mvn spring-boot:run

# Or using pnpm from root
pnpm nx run passkey-hotel-importer-service:serve
```

### Debug Mode

```bash
# Run with debug port 5005
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

### Using IDE

1. **IntelliJ IDEA**
   - Import as Maven project
   - Run `HotelImporterApplication.java`
   - Set VM options: `-Dspring.config.location=configs/dev.yaml`

2. **VS Code**
   - Install Java Extension Pack
   - Open workspace file
   - Use "Run and Debug" configuration

## Running Tests

### Unit Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=HotelDataImportControllerTest

# Run with coverage
mvn test jacoco:report
```

### Integration Tests

```bash
# Run integration tests
mvn verify -Prun-it

# Or using pnpm
pnpm nx run passkey-hotel-importer-service:ci:test
```

### Test Configuration

Integration tests use Testcontainers for database:

```java
@Testcontainers
@SpringBootTest
class HotelImporterIntegrationTest {
    
    @Container
    static OracleContainer oracle = new OracleContainer("gvenzl/oracle-xe:21-slim")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");
}
```

## Code Structure

### Package Organization

```
com.cvent.passkey.hotelimporter/
├── HotelImporterApplication.java     # Main application class
├── controllers/                      # REST endpoints
│   ├── HotelDataImportController.java
│   ├── admin/                       # Admin endpoints
│   └── model/                       # Request/response DTOs
├── strategies/                       # Import strategy implementations
│   ├── ImportStrategy.java          # Strategy interface
│   ├── ImportStrategyFactory.java   # Strategy factory
│   └── choice/                      # Choice Hotels implementation
├── clients/                         # External service clients
│   ├── CviiClient.java             # CVII integration
│   └── PasskeyClient.java          # Passkey service clients
├── entities/                        # JPA entities
│   ├── Hotel.java
│   ├── Room.java
│   └── ProviderMapping.java
├── repositories/                    # Data access layer
│   ├── HotelRepository.java
│   └── RoomRepository.java
├── configs/                         # Configuration classes
│   ├── WebSecurityConfig.java
│   └── DatabaseConfig.java
├── model/                          # Domain models and DTOs
├── exceptions/                     # Custom exceptions
└── media/                         # Media processing utilities
```

### Naming Conventions

- **Classes**: PascalCase (e.g., `HotelImportController`)
- **Methods**: camelCase (e.g., `importHotelData`)
- **Variables**: camelCase (e.g., `venueId`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Packages**: lowercase (e.g., `com.cvent.passkey.hotelimporter`)

## Coding Standards

### Code Style

The project uses Cvent's standard code style:

```bash
# Format code
mvn prettier:write

# Check formatting
mvn prettier:check

# Lint code
pnpm nx run passkey-hotel-importer-service:lint
```

### Code Quality

- **Checkstyle**: Enforces coding standards
- **SpotBugs**: Static analysis for bug detection
- **SonarQube**: Code quality and security analysis

### Best Practices

1. **Logging**
   ```java
   private static final Logger LOGGER = LoggerFactory.getLogger(ClassName.class);
   
   // Use structured logging
   LOGGER.info("Importing hotel for venue {} from provider {}", venueId, provider);
   ```

2. **Exception Handling**
   ```java
   try {
       // Business logic
   } catch (SpecificException e) {
       LOGGER.error("Specific error occurred: {}", e.getMessage(), e);
       throw new HotelImporterException("User-friendly message", e);
   }
   ```

3. **Validation**
   ```java
   @Valid
   @RequestBody ImportRequest request
   
   // Use Bean Validation annotations
   @NotNull
   @Size(min = 1, max = 50)
   private String sourceProvider;
   ```

## Common Development Tasks

### Adding a New Provider

1. **Create Strategy Implementation**
   ```java
   @Component
   public class NewProviderStrategy implements ImportStrategy {
       @Override
       public String importHotel(UUID venueId, ImportMapping mapping) {
           // Implementation
       }
   }
   ```

2. **Register in Factory**
   ```java
   @Component
   public class ImportStrategyFactory {
       public Optional<ImportStrategy> getStrategy(Providers from, Providers to) {
           // Add new provider combination
       }
   }
   ```

3. **Add Provider Enum**
   ```java
   public enum Providers {
       CHOICE, PASSKEY, NEW_PROVIDER
   }
   ```

### Adding a New Endpoint

1. **Create Controller Method**
   ```java
   @PostMapping("/v1/venues/{venueId}/new-operation")
   @RolesAllowed("ADMIN")
   public ResponseEntity<ImportResponse> newOperation(
           @PathVariable UUID venueId,
           @Valid @RequestBody NewRequest request) {
       // Implementation
   }
   ```

2. **Add Request/Response Models**
   ```java
   @Data
   @Builder
   public class NewRequest {
       @NotNull
       private String parameter;
   }
   ```

3. **Write Tests**
   ```java
   @Test
   void testNewOperation() {
       // Test implementation
   }
   ```

### Database Schema Changes

1. **Create Migration**
   ```sql
   -- V1.1__Add_new_table.sql
   CREATE TABLE new_table (
       id VARCHAR2(36) PRIMARY KEY,
       name VARCHAR2(255) NOT NULL
   );
   ```

2. **Update Entity**
   ```java
   @Entity
   @Table(name = "new_table")
   public class NewEntity {
       @Id
       private String id;
       
       @Column(name = "name")
       private String name;
   }
   ```

3. **Create Repository**
   ```java
   @Repository
   public interface NewEntityRepository extends JpaRepository<NewEntity, String> {
   }
   ```

## Debugging

### Common Issues

1. **Database Connection**
   - Check Oracle container is running
   - Verify connection string in config
   - Check firewall/network settings

2. **External Service Integration**
   - Use mock services for local development
   - Check service URLs and authentication
   - Review request/response logs

3. **Build Issues**
   - Clear Maven cache: `mvn clean`
   - Reinstall dependencies: `pnpm install --force`
   - Check Java version compatibility

### Debugging Tools

1. **Application Logs**
   ```bash
   tail -f logs/application.log
   ```

2. **Database Queries**
   ```yaml
   logging:
     level:
       org.hibernate.SQL: DEBUG
   ```

3. **HTTP Requests**
   ```yaml
   logging:
     level:
       org.springframework.web.client: DEBUG
   ```

## Performance Testing

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
   http://localhost:8080/v1/venues/test-venue-id/import/hotel

# Using JMeter
jmeter -n -t load-test.jmx -l results.jtl
```

### Profiling

1. **JVM Profiling**
   ```bash
   java -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=profile.jfr -jar app.jar
   ```

2. **Memory Analysis**
   ```bash
   jmap -dump:format=b,file=heap.hprof <pid>
   ```

## Contributing

### Pull Request Process

1. Create feature branch from `development`
2. Make changes following coding standards
3. Write/update tests
4. Run full test suite
5. Create pull request with description
6. Address code review feedback
7. Merge after approval

### Commit Message Format

```
type(scope): description

- feat: new feature
- fix: bug fix
- docs: documentation changes
- style: formatting changes
- refactor: code refactoring
- test: test changes
- chore: maintenance tasks
```

Example:
```
feat(import): add support for new hotel provider

- Implement NewProviderStrategy
- Add provider validation
- Update factory registration
```

## Additional Resources

## Quick Start


### Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 18+ (for TypeScript components)
- pnpm 8+
- Oracle Database access
- AWS S3 access for media storage

### Local Development
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-hotel-importer.git
cd passkey-hotel-importer

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run the service locally
cd packages/passkey-hotel-importer/service
mvn spring-boot:run
```

### Configuration
The service uses environment-specific YAML configuration files located in `configs/`:
- `dev.yaml` - Development environment
- `staging.yaml` - Staging environment  
- `prod.yaml` - Production environment

## API Endpoints


The service exposes REST endpoints for hotel data import operations:

- `POST /v1/venues/{venueId}/import/hotel` - Import hotel data
- `POST /v1/venues/{venueId}/import/rooms` - Import room data
- `POST /v1/venues/{venueId}/import/images` - Import hotel images
- `POST /v1/venues/{venueId}/hotel/assign` - Assign hotel to venue
- `POST /v1/venues/{venueId}/hotel/unassign` - Unassign hotel from venue

All endpoints require ADMIN role authorization.

## Support


- **Team**: Passkey API Team (meeseeksbox)
- **Jenkins**: [CI/CD Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-hotel-importer/)
- **Wiki**: [Passkey Hotel Importer Documentation](https://wiki.cvent.com/display/PASKY/Passkey+Hotel+Importer)
- **Slack**: #passkey-api
