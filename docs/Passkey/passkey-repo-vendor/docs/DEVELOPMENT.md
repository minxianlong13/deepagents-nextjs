# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerized development and testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Optional Tools
- **Docker Compose**: Local development environment
- **Postman/Insomnia**: API testing
- **DBeaver/pgAdmin**: Database management
- **Karate**: Integration testing (included in project)

### Environment Setup
```bash
# Verify Java version
java -version
# Should show Java 21

# Verify Maven version
mvn -version
# Should show Maven 3.6+

# Verify Docker
docker --version
docker-compose --version
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-vendor.git
cd passkey-vendor
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

### 3. Build Project
```bash
# Clean build
mvn clean package

# Build with release profile
mvn clean package -Prelease

# Skip tests for faster build
mvn clean package -DskipTests
```

### 4. Database Setup
```bash
# Start local PostgreSQL with Docker
docker run --name passkey-vendor-db \
  -e POSTGRES_DB=passkey_vendor_dev \
  -e POSTGRES_USER=passkey_user \
  -e POSTGRES_PASSWORD=passkey_pass \
  -p 5432:5432 \
  -d postgres:13

# Run database migrations (if using Flyway)
mvn flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/passkey_vendor_dev
```

### 5. Configuration
Create or modify `passkey-vendor-service/configs/dev.yaml`:
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: org.postgresql.Driver
  url: jdbc:postgresql://localhost:5432/passkey_vendor_dev
  user: passkey_user
  password: passkey_pass
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
  minSize: 2
  maxSize: 8

logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.vendor: DEBUG
    org.hibernate.SQL: DEBUG
  appenders:
    - type: console

# Mock auth service for local development
auth:
  serviceUrl: http://localhost:9090/auth
  timeout: 30s
  mockMode: true
```

### 6. Run Service Locally
```bash
cd passkey-vendor-service

# Run with development configuration
java -jar target/passkey-vendor-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml

# Or use Maven exec plugin
mvn exec:java -Dexec.mainClass="com.cvent.passkey.vendor.PasskeyVendorServiceApplication" \
  -Dexec.args="server configs/dev.yaml"
```

### 7. Verify Setup
```bash
# Health check
curl http://localhost:8080/healthcheck

# Admin metrics
curl http://localhost:8081/metrics

# Test API endpoint
curl -H "Authorization: Bearer test-api-key" \
  http://localhost:8080/passkey-vendor/v1/vendors
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=VendorServiceTest

# Run with coverage
mvn test jacoco:report -Pcoverage

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests
```bash
# Run all integration tests
mvn verify -Prun-it -Dkarate.env=dev

# Run specific feature
mvn verify -Prun-it -Dkarate.env=dev -Dkarate.options="--tags @vendor-system"

# Run with specific environment
mvn verify -Prun-it -Dkarate.env=ts50
```

### Test Configuration
Integration tests use Karate DSL. Configuration files are in:
- `passkey-vendor-integration-test/src/test/resources/karate-config-{env}.js`

Example test execution:
```bash
# Run specific feature file locally
cd passkey-vendor-integration-test
mvn test -Dtest=PasskeyVendorKarateTestIT#runFeatureLocally
```

## Code Structure

### Module Organization
```
passkey-vendor/
├── passkey-vendor-api/              # API contracts and models
│   ├── src/main/java/
│   │   └── com/cvent/passkey/vendor/model/
│   └── src/main/resources/api/      # RAML specifications
├── passkey-vendor-service/          # Main service implementation
│   ├── src/main/java/
│   │   └── com/cvent/passkey/vendor/
│   │       ├── resources/           # JAX-RS endpoints
│   │       ├── services/            # Business logic
│   │       └── PasskeyVendorServiceApplication.java
│   └── configs/                     # Environment configurations
├── passkey-vendor-data-access/      # Data layer
│   ├── src/main/java/
│   │   └── com/cvent/passkey/vendor/
│   │       ├── dao/                 # Data access objects
│   │       ├── entity/              # Database entities
│   │       └── mapper/              # MyBatis mappers
│   └── src/main/resources/
│       └── com/cvent/passkey/vendor/mapper/  # SQL mappings
├── passkey-vendor-java-client/      # Client library
└── passkey-vendor-integration-test/ # Integration tests
    └── src/test/java/com/cvent/passkey/vendor/
```

### Package Structure
```
com.cvent.passkey.vendor/
├── model/                          # Domain models (API module)
├── resources/                      # REST endpoints (Service module)
│   ├── PasskeyVendorResource.java
│   ├── PasskeyVendorResourceV2.java
│   └── PasskeyMessageTypeResource.java
├── services/                       # Business logic (Service module)
│   ├── VendorService.java
│   └── MessageTypeService.java
├── dao/                           # Data access (Data Access module)
├── entity/                        # Database entities (Data Access module)
└── mapper/                        # MyBatis mappers (Data Access module)
```

## Coding Standards

### Java Code Style
- **Formatting**: Follow Google Java Style Guide
- **Naming**: Use descriptive names for classes, methods, and variables
- **Documentation**: JavaDoc for public APIs
- **Immutability**: Prefer immutable objects using Immutables library

### Code Quality Tools
```bash
# Run Checkstyle
mvn checkstyle:check

# Run SpotBugs
mvn spotbugs:check

# Run all quality checks
mvn verify -Pquality
```

### Example Code Patterns

#### Resource Class
```java
@Path("/passkey-vendor/v1")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@EnableLogContext
public class PasskeyVendorResource {
    
    private static final Logger LOG = LoggerFactory.getLogger(PasskeyVendorResource.class);
    private final VendorService vendorService;
    
    public PasskeyVendorResource(VendorService vendorService) {
        this.vendorService = vendorService;
    }
    
    @GET
    @Path("/vendors")
    public List<Vendor> findVendors(
            @Authority(methods = {AuthMethod.API_KEY}) GrantedAPIKey apiKey,
            @BeanParam ImmutableVendorSearchCriteria criteria) {
        LOG.debug("Finding vendors with criteria: {}", criteria);
        return vendorService.findVendors(criteria);
    }
}
```

#### Service Class
```java
@Component
public class VendorService {
    
    private static final Logger LOG = LoggerFactory.getLogger(VendorService.class);
    private final VendorDAO vendorDAO;
    
    public VendorService(VendorDAO vendorDAO) {
        this.vendorDAO = vendorDAO;
    }
    
    public List<Vendor> findVendors(VendorSearchCriteria criteria) {
        validateCriteria(criteria);
        return vendorDAO.findVendors(criteria);
    }
    
    private void validateCriteria(VendorSearchCriteria criteria) {
        if (criteria.toQueryMap().isEmpty()) {
            throw new VendorException(VendorErrorCodeType.NO_CRITERIA);
        }
    }
}
```

#### Immutable Model
```java
@Immutable
@JsonSerialize
@JsonDeserialize(as = ImmutableVendor.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
@CventApiStyleV2
public interface Vendor {
    
    @NotNull
    Long getVendorId();
    
    @NotNull
    String getName();
    
    @Nullable
    String getDescription();
}
```

## Common Development Tasks

### Adding a New Endpoint

1. **Define Model** (in `passkey-vendor-api`):
```java
@Immutable
@JsonSerialize
@JsonDeserialize(as = ImmutableNewModel.class)
@CventApiStyleV2
public interface NewModel {
    @NotNull
    String getId();
    
    @NotNull
    String getName();
}
```

2. **Add Resource Method**:
```java
@GET
@Path("/new-endpoint")
public List<NewModel> getNewModels(
        @Authority(methods = {AuthMethod.API_KEY}) GrantedAPIKey apiKey,
        @QueryParam("filter") String filter) {
    return newModelService.findModels(filter);
}
```

3. **Implement Service Logic**:
```java
public List<NewModel> findModels(String filter) {
    return newModelDAO.findByFilter(filter);
}
```

4. **Add DAO Method**:
```java
@Select("SELECT * FROM new_models WHERE name LIKE #{filter}")
List<NewModel> findByFilter(@Param("filter") String filter);
```

5. **Write Tests**:
```java
@Test
void shouldFindModelsByFilter() {
    // Given
    String filter = "test%";
    
    // When
    List<NewModel> result = newModelService.findModels(filter);
    
    // Then
    assertThat(result).isNotEmpty();
}
```

### Adding Database Migration

1. **Create Migration File** (`src/main/resources/db/migration/`):
```sql
-- V1.2__Add_new_model_table.sql
CREATE TABLE new_models (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_new_models_name ON new_models(name);
```

2. **Run Migration**:
```bash
mvn flyway:migrate
```

### Debugging

#### Local Debugging
1. **IDE Setup**: Configure remote debugging on port 5005
2. **Run with Debug**:
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
  -jar target/passkey-vendor-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
```

#### Log Analysis
```bash
# Tail application logs
tail -f logs/passkey-vendor-service.log

# Search for specific patterns
grep "ERROR" logs/passkey-vendor-service.log

# Monitor metrics endpoint
watch -n 5 'curl -s http://localhost:8081/metrics | grep -E "(requests|errors)"'
```

#### Database Debugging
```sql
-- Check connection status
SELECT * FROM pg_stat_activity WHERE datname = 'passkey_vendor_dev';

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Testing Strategies

### Unit Testing Best Practices
- **Isolation**: Mock external dependencies
- **Coverage**: Aim for >80% code coverage
- **Naming**: Use descriptive test method names
- **Structure**: Follow Given-When-Then pattern

### Integration Testing
- **End-to-End**: Test complete request/response cycles
- **Data Setup**: Use test fixtures and cleanup
- **Environment**: Use dedicated test database
- **Scenarios**: Cover happy path and error cases

### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer test-key" \
  http://localhost:8080/passkey-vendor/v1/vendors

# Memory profiling
java -XX:+PrintGCDetails -XX:+PrintGCTimeStamps \
  -jar target/passkey-vendor-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Maven cache
rm -rf ~/.m2/repository/com/cvent

# Rebuild with clean slate
mvn clean install -U
```

#### Database Connection Issues
```bash
# Check database connectivity
telnet localhost 5432

# Verify credentials
psql -h localhost -U passkey_user -d passkey_vendor_dev
```

#### Service Startup Issues
```bash
# Check port availability
netstat -an | grep 8080

# Verify configuration
java -jar target/passkey-vendor-service-1.0.0-SNAPSHOT.jar check configs/dev.yaml
```

### Getting Help
- **Team Slack**: `#passkey-api`
- **Documentation**: [Wiki](https://wiki.cvent.com/display/PASKY/Vendor+Service)
- **Code Reviews**: Create pull requests for feedback
- **Pair Programming**: Schedule sessions with team members

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development
```bash
# Build the service
mvn package -Prelease

# Run locally
cd passkey-vendor-service
java -jar target/passkey-vendor-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml

# Run integration tests
mvn -Prun-it -Dkarate.env=dev verify
```

### API Access
- **Base URL**: `http://localhost:8080/passkey-vendor/v1`
- **Health Check**: `http://localhost:8080/healthcheck`
- **Metrics**: `http://localhost:8080/metrics`

## Support


- **Team**: Meeseeks Box (owner)
- **Slack**: #passkey-api
- **Wiki**: [Vendor Service Documentation](https://wiki.cvent.com/display/PASKY/Vendor+Service)
- **Monitoring**: [Datadog APM](https://cvent.datadoghq.com/apm/services/passkey-vendor-service)
