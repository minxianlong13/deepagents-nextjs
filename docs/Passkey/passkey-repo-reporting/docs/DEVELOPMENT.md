# Development Guide

## Prerequisites

### Required Software

- **Java 21**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerization and local testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Optional Tools

- **Postman**: API testing and development
- **Redis CLI**: Cache debugging and management
- **PostgreSQL Client**: Database access and debugging
- **kubectl**: Kubernetes cluster interaction

### Environment Setup

1. **Install Java 21**:
   ```bash
   # Using SDKMAN (recommended)
   curl -s "https://get.sdkman.io" | bash
   sdk install java 21.0.1-open
   sdk use java 21.0.1-open
   
   # Verify installation
   java -version
   ```

2. **Install Maven**:
   ```bash
   # Using SDKMAN
   sdk install maven 3.9.5
   
   # Or download from Apache Maven website
   # Verify installation
   mvn -version
   ```

3. **Configure Maven for Cvent Nexus**:
   ```xml
   <!-- ~/.m2/settings.xml -->
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

## Local Setup

### Clone Repository

```bash
git clone git@github.com:cvent-internal/passkey-reporting.git
cd passkey-reporting
```

### Build Project

```bash
# Clean build with all modules
mvn clean install

# Build for release (skip docs and sources)
mvn clean install -Prelease

# Build specific module
mvn clean install -pl passkey-reporting-service
```

### Database Setup

#### Option 1: Docker PostgreSQL

```bash
# Start PostgreSQL container
docker run --name passkey-reporting-db \
  -e POSTGRES_DB=passkey_reporting \
  -e POSTGRES_USER=passkey_user \
  -e POSTGRES_PASSWORD=passkey_pass \
  -p 5432:5432 \
  -d postgres:13

# Create schema (if needed)
docker exec -it passkey-reporting-db psql -U passkey_user -d passkey_reporting -f /path/to/schema.sql
```

#### Option 2: Local PostgreSQL Installation

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database and user
createdb passkey_reporting
createuser -P passkey_user  # Enter password when prompted
```

### Cache Setup

#### Docker Redis

```bash
# Start Redis container
docker run --name passkey-reporting-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# Test connection
docker exec -it passkey-reporting-redis redis-cli ping
```

### Configuration

Create local development configuration:

```yaml
# passkey-reporting-service/configs/local.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: org.postgresql.Driver
  url: jdbc:postgresql://localhost:5432/passkey_reporting
  user: passkey_user
  password: passkey_pass
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
  minSize: 2
  maxSize: 8

authService:
  baseUrl: https://auth-dev.cvent.com
  timeout: 30s

cache:
  redis:
    host: localhost
    port: 6379
    timeout: 5s

logging:
  level: DEBUG
  loggers:
    com.cvent.passkeyreporting: DEBUG
    org.hibernate.SQL: DEBUG
  appenders:
    - type: console
      threshold: DEBUG
```

## Running the Service

### Command Line

```bash
# Navigate to service module
cd passkey-reporting-service

# Run with local configuration
java -jar target/passkey-reporting-service-1.31.1-SNAPSHOT.jar server configs/local.yaml

# Run with development configuration
java -jar target/passkey-reporting-service-1.31.1-SNAPSHOT.jar server configs/dev.yaml
```

### IntelliJ IDEA Configuration

1. **Create Run Configuration**:
   - **Main Class**: `com.cvent.passkeyreporting.PasskeyReportingServiceApplication`
   - **Program Arguments**: `server configs/local.yaml`
   - **Working Directory**: `$MODULE_WORKING_DIR$/passkey-reporting-service`
   - **Use Classpath of Module**: `passkey-reporting-service`
   - **JRE**: Java 21

2. **Environment Variables** (if needed):
   ```
   DB_USER=passkey_user
   DB_PASSWORD=passkey_pass
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

### Docker Development

```bash
# Build Docker image
docker build -t passkey-reporting-dev .

# Run with Docker Compose
cat > docker-compose.yml << EOF
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
      - "8081:8081"
    environment:
      - DB_USER=passkey_user
      - DB_PASSWORD=passkey_pass
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=passkey_reporting
      - POSTGRES_USER=passkey_user
      - POSTGRES_PASSWORD=passkey_pass
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
EOF

docker-compose up
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-reporting-service

# Run specific test class
mvn test -Dtest=BookingsReportResourceTest

# Run with coverage
mvn test -Pcoverage
```

### Integration Tests

```bash
# Run integration tests (requires running service)
mvn verify -Prun-it -Dkarate.env=dev

# Run specific integration test
mvn test -Dtest=BookingsReportIT -Dkarate.env=local

# Run with custom configuration
mvn verify -Prun-it -Dkarate.env=local -Dkarate.config.dir=test_configs
```

### Service Tests

```bash
# Run Postman/Newman tests
cd passkey-reporting-service-test
./newman.sh local

# Run with verbose output
./newman.sh local verbose
```

### Test Configuration

Create local test configuration:

```javascript
// passkey-reporting-integration-test/src/test/resources/karate-config.js
function fn() {
  var env = karate.env || 'local';
  var config = {
    baseUrl: 'http://localhost:8080',
    apiKey: 'test-api-key-12345'
  };
  
  if (env === 'dev') {
    config.baseUrl = 'https://api-dev.cvent.com';
    config.apiKey = karate.properties['dev.api.key'];
  }
  
  return config;
}
```

## Code Structure

### Package Organization

```
com.cvent.passkeyreporting/
├── PasskeyReportingServiceApplication.java    # Main application class
├── ReportingServiceConstants.java             # Application constants
├── cache/                                     # Caching components
│   ├── CacheConfiguration.java
│   └── CacheManager.java
├── configuration/                             # Configuration classes
│   ├── ServiceConfiguration.java
│   └── DatabaseConfiguration.java
├── exception/                                 # Custom exceptions
│   ├── ValidationException.java
│   └── ReportingException.java
├── exceptionmapper/                          # JAX-RS exception mappers
│   ├── ValidationExceptionMapper.java
│   └── GeneralExceptionMapper.java
├── health/                                   # Health check implementations
│   ├── DatabaseHealthCheck.java
│   └── CacheHealthCheck.java
├── resources/                                # REST endpoints (JAX-RS)
│   ├── BookingsReportResource.java
│   ├── EventsReportResource.java
│   ├── RevenueReportResource.java
│   └── ...
├── service/                                  # Business logic layer
│   ├── ReservationsReportService.java
│   ├── ValidationService.java
│   └── ...
└── util/                                     # Utility classes
    ├── LocalDateWrapper.java
    ├── MetadataUtil.java
    └── ...
```

### Module Dependencies

```
passkey-reporting-service
├── depends on: passkey-reporting-api          # API contracts
├── depends on: passkey-reporting-data-access  # Data layer
├── depends on: passkey-reporting-shared       # Shared utilities
└── depends on: external libraries
```

## Coding Standards

### Java Code Style

- **Formatting**: Follow Google Java Style Guide
- **Naming**: Use descriptive names for classes, methods, and variables
- **Documentation**: JavaDoc for public APIs
- **Null Safety**: Use Optional where appropriate
- **Exception Handling**: Specific exceptions with meaningful messages

### Example Code Style

```java
/**
 * Service for generating booking reports.
 */
@Component
public class BookingsReportService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(BookingsReportService.class);
    
    private final BookingsRepository bookingsRepository;
    private final CacheManager cacheManager;
    
    public BookingsReportService(BookingsRepository bookingsRepository, 
                                CacheManager cacheManager) {
        this.bookingsRepository = Objects.requireNonNull(bookingsRepository);
        this.cacheManager = Objects.requireNonNull(cacheManager);
    }
    
    /**
     * Generates booking report for the specified date range.
     *
     * @param startDate the start date (inclusive)
     * @param endDate the end date (inclusive)
     * @param participantId the participant ID filter
     * @return the booking report data
     * @throws ValidationException if date range is invalid
     */
    public BookingsReportData generateReport(LocalDate startDate, 
                                           LocalDate endDate, 
                                           Long participantId) {
        validateDateRange(startDate, endDate);
        
        final String cacheKey = buildCacheKey(startDate, endDate, participantId);
        return cacheManager.get(cacheKey, () -> {
            LOGGER.debug("Generating booking report for participant {} from {} to {}", 
                        participantId, startDate, endDate);
            return bookingsRepository.findBookings(startDate, endDate, participantId);
        });
    }
    
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new ValidationException("Start date cannot be after end date");
        }
    }
}
```

### REST Resource Style

```java
@Path("/passkey-reporting/v1/bookings")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@EnableLogContext
public class BookingsReportResource {
    
    private final BookingsReportService service;
    
    @GET
    public Response getBookingsReport(
            @Authority(methods = {AuthMethod.API_KEY}) GrantedAPIKey token,
            @QueryParam("startDate") @NotNull LocalDateWrapper startDate,
            @QueryParam("endDate") @NotNull LocalDateWrapper endDate,
            @QueryParam("participantId") Long participantId) {
        
        final BookingsReportData data = service.generateReport(
            startDate.getDate(), 
            endDate.getDate(), 
            participantId
        );
        
        return Response.ok(data).build();
    }
}
```

## Common Development Tasks

### Adding a New Endpoint

1. **Define API Contract** (in `passkey-reporting-api`):
   ```java
   // Add request/response models
   public class NewReportRequest {
       // fields and validation annotations
   }
   
   public class NewReportResponse {
       // response fields
   }
   ```

2. **Create Resource Class**:
   ```java
   @Path("/passkey-reporting/v1/new-report")
   public class NewReportResource {
       @GET
       public Response getNewReport(/* parameters */) {
           // implementation
       }
   }
   ```

3. **Implement Service Logic**:
   ```java
   @Component
   public class NewReportService {
       public NewReportData generateReport(/* parameters */) {
           // business logic
       }
   }
   ```

4. **Register in Application**:
   ```java
   // In PasskeyReportingServiceApplication.java
   @Override
   public void run(ServiceConfiguration configuration, Environment environment) {
       environment.jersey().register(new NewReportResource(newReportService));
   }
   ```

5. **Add Tests**:
   ```java
   public class NewReportResourceTest {
       @Test
       public void testGetNewReport() {
           // unit test implementation
       }
   }
   ```

### Adding Database Queries

1. **Create Repository Interface** (in `passkey-reporting-data-access`):
   ```java
   public interface NewReportRepository {
       List<NewReportData> findReportData(LocalDate startDate, LocalDate endDate);
   }
   ```

2. **Implement Repository**:
   ```java
   @Repository
   public class NewReportRepositoryImpl implements NewReportRepository {
       @Override
       public List<NewReportData> findReportData(LocalDate startDate, LocalDate endDate) {
           // SQL query implementation
       }
   }
   ```

3. **Add Database Migration** (if schema changes needed):
   ```sql
   -- V1.2__add_new_report_table.sql
   CREATE TABLE new_report_data (
       id BIGSERIAL PRIMARY KEY,
       -- other columns
   );
   ```

### Adding Caching

```java
@Service
public class CachedReportService {
    
    @Cacheable(value = "reports", key = "#startDate + '_' + #endDate")
    public ReportData getReport(LocalDate startDate, LocalDate endDate) {
        // expensive operation
    }
    
    @CacheEvict(value = "reports", allEntries = true)
    public void clearCache() {
        // cache invalidation
    }
}
```

### Adding Validation

```java
public class ReportRequest {
    @NotNull
    @JsonProperty
    private LocalDate startDate;
    
    @NotNull
    @JsonProperty
    private LocalDate endDate;
    
    @Valid
    @JsonProperty
    private ParticipantFilter participantFilter;
    
    // Custom validation
    @AssertTrue(message = "Start date must be before end date")
    public boolean isValidDateRange() {
        return startDate == null || endDate == null || !startDate.isAfter(endDate);
    }
}
```

## Debugging

### Local Debugging

1. **Enable Debug Logging**:
   ```yaml
   logging:
     level: DEBUG
     loggers:
       com.cvent.passkeyreporting: DEBUG
       org.hibernate.SQL: DEBUG
   ```

2. **Use IDE Debugger**:
   - Set breakpoints in IntelliJ IDEA
   - Run in debug mode
   - Step through code execution

3. **Remote Debugging**:
   ```bash
   java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-reporting-service-*.jar server configs/local.yaml
   ```

### Database Debugging

```bash
# Connect to local database
psql -h localhost -U passkey_user -d passkey_reporting

# View query logs
tail -f /usr/local/var/log/postgresql.log

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM bookings WHERE booking_date BETWEEN '2024-01-01' AND '2024-01-31';
```

### Cache Debugging

```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# View cache keys
KEYS passkey:*

# Get cache value
GET passkey:bookings:2024-01-01:2024-01-31:12345

# Clear cache
FLUSHDB
```

## Contributing

### Git Workflow

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/new-report-endpoint
   ```

2. **Make Changes and Commit**:
   ```bash
   git add .
   git commit -m "Add new report endpoint for revenue analytics"
   ```

3. **Push and Create Pull Request**:
   ```bash
   git push origin feature/new-report-endpoint
   # Create PR through GitHub UI
   ```

### Code Review Process

1. **Self Review**: Review your own changes before submitting
2. **Automated Checks**: Ensure all CI checks pass
3. **Peer Review**: At least one team member must approve
4. **Integration Tests**: All tests must pass
5. **Merge**: Squash and merge to main branch

### Release Process

1. **Version Bump**: Update version in `pom.xml`
2. **Changelog**: Update `CHANGELOG.md` with changes
3. **Tag Release**: Create Git tag for version
4. **Deploy**: Follow deployment procedures
5. **Verify**: Confirm deployment in all environments

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Java version (must be 21)
   - Verify Maven settings for Nexus access
   - Clear Maven cache: `mvn dependency:purge-local-repository`

2. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check connection parameters in configuration
   - Test connection manually with psql

3. **Cache Connection Issues**:
   - Verify Redis is running
   - Check Redis configuration
   - Test with redis-cli

4. **Authentication Issues**:
   - Verify Auth Service is accessible
   - Check API key validity
   - Review authentication configuration

### Getting Help

- **Team Slack**: `#passkey-maurya` (primary), `#passkey-meeseeks-box` (secondary)
- **Documentation**: Check existing documentation in `docs/` folder
- **Code Examples**: Look at existing similar endpoints
- **Stack Overflow**: Search for Dropwizard and JAX-RS questions

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Docker (optional)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone git@github.com:cvent-internal/passkey-reporting.git
   cd passkey-reporting
   ```

2. **Build the project**:
   ```bash
   mvn install -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-reporting-service
   java -jar target/passkey-reporting-service-1.31.1-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Access the service**:
   - Service runs on the port specified in `dev.yaml`
   - Health check: `GET /healthcheck`
   - API documentation available through Mulesoft platform

### Docker Setup

```bash
docker build -t passkey-reporting .
docker run -p 8080:8080 passkey-reporting
```

## Useful Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/passkey/job/passkey-reporting/)
- [Admin Portal](https://admin.core.cvent.org/serviceid/62beef08-9aa5-41b8-9aa6-ef24c294b4f0)
- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-reporting-service)
- [API Documentation](https://anypoint.mulesoft.com/login/#/signin)
