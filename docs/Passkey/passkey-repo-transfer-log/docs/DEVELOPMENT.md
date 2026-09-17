# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerization and local testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code with Java extensions

### Database Setup
- **Oracle Database**: Local instance or Docker container
- **Database Client**: SQL Developer, DBeaver, or similar
- **JDBC Driver**: Oracle JDBC driver (included in dependencies)

### Cvent Internal Setup
- **Nexus Repository Access**: Configure Maven settings for Cvent's internal repositories
- **VPN Access**: Required for accessing internal services and databases
- **Auth Service**: Local or development instance for authentication testing

## Local Setup

### 1. Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-transfer-log.git
cd passkey-transfer-log
```

### 2. Configure Maven Settings
Create or update `~/.m2/settings.xml`:
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
#### Option A: Docker Oracle Database
```bash
docker run -d \
  --name oracle-db \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  -e ORACLE_DATABASE=XEPDB1 \
  gvenzl/oracle-xe:21-slim
```

#### Option B: Local Oracle Installation
- Install Oracle Database XE
- Create development database schema
- Configure connection parameters

### 4. Configure Environment Variables
Create `.env` file in project root:
```bash
# Database Configuration
DB_USER=passkey_transfer_log
DB_PASSWORD=dev_password
DB_URL=jdbc:oracle:thin:@localhost:1521:XE

# Auth Service Configuration
AUTH_SERVICE_URL=https://dev-auth.cvent.com

# Logging Configuration
LOG_LEVEL=DEBUG

# Environment
ENVIRONMENT=local
```

### 5. Initialize Database Schema
```bash
# Run database migration scripts
cd database/migrations
sqlplus ${DB_USER}/${DB_PASSWORD}@localhost:1521/XE @create_schema.sql
```

### 6. Build the Project
```bash
# Clean build with all modules
mvn clean package -Prelease

# Build with code coverage
mvn clean package -Pcoverage
```

### 7. Run the Service
```bash
cd passkey-transfer-log-service
java -jar target/passkey-transfer-log-service-1.11.1-SNAPSHOT.jar server configs/dev.yaml
```

### 8. Verify Installation
```bash
# Health check
curl http://localhost:8081/healthcheck

# API test
curl -H "Authorization: Bearer test-api-key" \
     http://localhost:8080/passkey-transfer-log/v1/transfer-state?reservationId=12345
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-transfer-log-service

# Run specific test class
mvn test -Dtest=TransferLogServiceTest

# Run with coverage
mvn test -Pcoverage
```

### Integration Tests
```bash
# Run all integration tests
mvn -Prun-it -Dkarate.env=dev verify

# Run specific feature file
mvn -Prun-it -Dkarate.env=dev -Dkarate.options="--tags @transfer-state" verify

# Run integration tests against local service
mvn -Prun-it -Dkarate.env=local verify
```

### Load Tests
```bash
# Build load test artifacts
./build-load.sh

# Run load tests
mvn -Pload-test -Dkarate.env=dev verify
```

## Code Structure

### Module Organization
```
passkey-transfer-log/
├── passkey-transfer-log-api/           # API contracts and models
│   └── src/main/java/
│       └── com/cvent/passkeytransferlog/
│           ├── model/                  # Data transfer objects
│           └── api/                    # API interfaces
├── passkey-transfer-log-service/       # Main service implementation
│   └── src/main/java/
│       └── com/cvent/passkeytransferlog/
│           ├── resources/              # REST endpoints
│           ├── services/               # Business logic
│           ├── exceptions/             # Custom exceptions
│           └── PasskeyTransferLogApplication.java
├── passkey-transfer-log-data-access/   # Database layer
│   └── src/main/java/
│       └── com/cvent/passkeytransferlog/
│           └── dao/                    # Data access objects
├── passkey-transfer-log-java-client/   # Java client library
│   └── src/main/java/
│       └── com/cvent/passkeytransferlog/
│           └── client/                 # Client implementations
└── passkey-transfer-log-integration-test/ # Integration tests
    └── src/test/
        ├── java/                       # Karate test runners
        └── resources/                  # Feature files
```

### Package Structure
```java
com.cvent.passkeytransferlog/
├── resources/                          # JAX-RS resources
│   ├── PasskeyTransferLogResource.java
│   ├── PasskeyReservationResource.java
│   └── v2/                            # Versioned APIs
├── services/                          # Business logic services
│   ├── TransferLogService.java
│   ├── CombineQueueService.java
│   └── impl/                          # Service implementations
├── dao/                               # Data access layer
│   ├── TransferStateDAO.java
│   └── impl/                          # DAO implementations
├── model/                             # Domain models and DTOs
│   ├── TransferState.java
│   ├── FolioTransferState.java
│   └── requests/                      # Request objects
├── exceptions/                        # Custom exceptions
│   ├── TransferLogException.java
│   └── error/                         # Error codes and handlers
└── config/                           # Configuration classes
    └── PasskeyTransferLogConfiguration.java
```

## Coding Standards

### Java Code Style
- **Formatting**: Follow Google Java Style Guide
- **Naming**: Use descriptive names for classes, methods, and variables
- **Documentation**: JavaDoc for public APIs and complex logic
- **Immutability**: Prefer immutable objects where possible

### Example Code Style
```java
/**
 * Service for managing transfer log operations.
 */
@Singleton
public class TransferLogService {
    
    private static final Logger LOG = LoggerFactory.getLogger(TransferLogService.class);
    
    private final TransferStateDAO transferStateDAO;
    private final TransferHistoryDAO transferHistoryDAO;
    
    @Inject
    public TransferLogService(TransferStateDAO transferStateDAO, 
                             TransferHistoryDAO transferHistoryDAO) {
        this.transferStateDAO = requireNonNull(transferStateDAO, "transferStateDAO");
        this.transferHistoryDAO = requireNonNull(transferHistoryDAO, "transferHistoryDAO");
    }
    
    /**
     * Updates transfer state and creates history entry.
     *
     * @param request the transfer state request
     * @return the updated transfer state
     * @throws TransferLogException if update fails
     */
    @Timed(name = "update-transfer-state")
    public TransferState updateTransferState(TransferStateRequest request) {
        requireNonNull(request, "request cannot be null");
        
        LOG.debug("Updating transfer state for reservation: {}", request.getReservationId());
        
        try {
            TransferState transferState = transferStateDAO.updateTransferState(request);
            createHistoryEntry(transferState, "STATE_UPDATED");
            return transferState;
        } catch (Exception e) {
            LOG.error("Failed to update transfer state for reservation: {}", 
                     request.getReservationId(), e);
            throw new TransferLogException("Failed to update transfer state", e);
        }
    }
}
```

### REST Resource Guidelines
```java
@Path("/passkey-transfer-log/v1")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@EnableLogContext
public class PasskeyTransferLogResource {
    
    /**
     * Get transfer state by criteria.
     */
    @GET
    @Path("/transfer-state")
    @Timed(name = "get-transfer-state")
    public TransferState getTransferState(
            @Authority(methods = { AuthMethod.API_KEY }) GrantedAPIKey grantedAPIKey,
            @BeanParam @Valid TransferStatesSearchCriteria criteria) {
        
        return transferLogService.getTransferState(criteria);
    }
    
    /**
     * Update transfer state.
     */
    @POST
    @Path("/transfer-state")
    @Timed(name = "update-transfer-state")
    public Response updateTransferState(
            @Authority(methods = { AuthMethod.API_KEY }) GrantedAPIKey grantedAPIKey,
            @Valid @NotNull TransferStateRequest request) {
        
        TransferState result = transferLogService.updateTransferState(request);
        return Response.status(Response.Status.CREATED).entity(result).build();
    }
}
```

## Common Development Tasks

### Adding a New REST Endpoint

1. **Define the API contract** in the API module:
```java
// In passkey-transfer-log-api module
public class NewFeatureRequest {
    @JsonProperty
    @NotNull
    private String requiredField;
    
    // getters, setters, builder
}
```

2. **Implement the service logic**:
```java
// In passkey-transfer-log-service module
public class NewFeatureService {
    public NewFeatureResponse processRequest(NewFeatureRequest request) {
        // Implementation
    }
}
```

3. **Create the REST resource**:
```java
@POST
@Path("/new-feature")
public Response processNewFeature(
        @Authority(methods = { AuthMethod.API_KEY }) GrantedAPIKey grantedAPIKey,
        @Valid @NotNull NewFeatureRequest request) {
    
    NewFeatureResponse response = newFeatureService.processRequest(request);
    return Response.ok(response).build();
}
```

4. **Add integration tests**:
```gherkin
Feature: New Feature API

  Background:
    * url baseUrl
    * header Authorization = 'Bearer ' + apiKey

  Scenario: Process new feature request
    Given path 'passkey-transfer-log/v1/new-feature'
    And request { requiredField: 'test-value' }
    When method POST
    Then status 200
    And match response.result == 'success'
```

### Adding Database Operations

1. **Create DAO interface**:
```java
public interface NewFeatureDAO {
    void saveNewFeature(NewFeature feature);
    Optional<NewFeature> findById(Long id);
    List<NewFeature> findByCriteria(NewFeatureCriteria criteria);
}
```

2. **Implement DAO**:
```java
@Singleton
public class NewFeatureDAOImpl implements NewFeatureDAO {
    
    private final Handle handle;
    
    @Inject
    public NewFeatureDAOImpl(@Named("database") Handle handle) {
        this.handle = handle;
    }
    
    @Override
    public void saveNewFeature(NewFeature feature) {
        handle.createUpdate("INSERT INTO new_features (id, name) VALUES (:id, :name)")
              .bind("id", feature.getId())
              .bind("name", feature.getName())
              .execute();
    }
}
```

3. **Add database migration**:
```sql
-- V1.1__Add_new_feature_table.sql
CREATE TABLE new_features (
    id NUMBER(19) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_new_features_name ON new_features(name);
```

### Writing Integration Tests

1. **Create feature file**:
```gherkin
# new-feature.feature
Feature: New Feature Integration Tests

  Background:
    * url baseUrl
    * header Authorization = 'Bearer ' + apiKey
    * def testData = read('classpath:test-data/new-feature-data.json')

  Scenario: Create new feature
    Given path 'passkey-transfer-log/v1/new-feature'
    And request testData.validRequest
    When method POST
    Then status 201
    And match response.id == '#number'
    And match response.name == testData.validRequest.name

  Scenario: Get new feature by ID
    Given path 'passkey-transfer-log/v1/new-feature', response.id
    When method GET
    Then status 200
    And match response.name == testData.validRequest.name
```

2. **Create test data**:
```json
{
  "validRequest": {
    "name": "Test Feature",
    "description": "Test feature description"
  },
  "invalidRequest": {
    "description": "Missing required name field"
  }
}
```

## Debugging

### Local Debugging
1. **IDE Setup**: Configure remote debugging on port 5005
2. **JVM Arguments**: Add `-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005`
3. **Breakpoints**: Set breakpoints in service and resource classes
4. **Log Analysis**: Use structured logging to trace request flow

### Debug Configuration
```yaml
# configs/debug.yaml
logging:
  level: DEBUG
  loggers:
    com.cvent.passkeytransferlog: TRACE
    org.jdbi: DEBUG
    com.cvent.auth: DEBUG
```

### Common Debug Scenarios
```java
// Enable request/response logging
@GET
@Path("/debug/transfer-state")
public TransferState debugGetTransferState(@BeanParam TransferStatesSearchCriteria criteria) {
    LOG.debug("Request criteria: {}", criteria);
    TransferState result = transferLogService.getTransferState(criteria);
    LOG.debug("Response: {}", result);
    return result;
}
```

## Performance Testing

### Local Performance Testing
```bash
# Start service with performance monitoring
java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
     -Xms512m -Xmx2g \
     -jar target/passkey-transfer-log-service-*.jar server configs/dev.yaml

# Run load tests
mvn -Pload-test verify
```

### JVM Tuning
```bash
# Production JVM settings
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+UseStringDeduplication
-XX:+OptimizeStringConcat
-Xms1g -Xmx4g
-XX:MetaspaceSize=256m
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Test database connectivity
sqlplus ${DB_USER}/${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_SERVICE}

# Check connection pool status
curl http://localhost:8081/metrics | grep database
```

#### Authentication Issues
```bash
# Test auth service connectivity
curl -v ${AUTH_SERVICE_URL}/health

# Validate API key
curl -H "Authorization: Bearer ${API_KEY}" \
     ${AUTH_SERVICE_URL}/validate
```

#### Memory Issues
```bash
# Generate heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc
jcmd <pid> GC.dump_heap heap.hprof

# Analyze with Eclipse MAT or VisualVM
```

### Log Analysis
```bash
# Search for errors
grep -i error logs/passkey-transfer-log.log

# Monitor real-time logs
tail -f logs/passkey-transfer-log.log | grep -i "transfer"

# Analyze performance
grep "duration" logs/passkey-transfer-log.log | awk '{print $NF}' | sort -n
```

## Contributing

### Git Workflow
1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Make Changes**: Implement feature with tests
3. **Run Tests**: Ensure all tests pass
4. **Commit Changes**: Use conventional commit messages
5. **Push Branch**: `git push origin feature/new-feature`
6. **Create Pull Request**: Submit PR for review
7. **Address Feedback**: Make requested changes
8. **Merge**: Squash and merge after approval

### Commit Message Format
```
type(scope): description

body (optional)

footer (optional)
```

Examples:
```
feat(api): add new transfer result endpoint

Add v2 transfer result endpoint with enhanced filtering
and pagination support.

Closes #123
```

```
fix(service): handle null pointer in transfer state update

Add null check for extended info field to prevent NPE
when processing transfer state updates.

Fixes #456
```

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New functionality has tests
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Error handling is appropriate

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Oracle Database access
- Cvent internal Nexus repository access

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone git@github.com:cvent-internal/passkey-transfer-log.git
   cd passkey-transfer-log
   ```

2. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

3. **Run the service locally**:
   ```bash
   cd passkey-transfer-log-service
   java -jar target/passkey-transfer-log-service-1.11.1-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Run integration tests**:
   ```bash
   mvn -Prun-it -Dkarate.env=dev verify
   ```

### Health Check

Once running, verify the service is healthy:
```bash
curl http://localhost:8080/healthcheck
```

## API Endpoints


The service provides several REST resource endpoints:

- **Transfer Definitions**: `/transfer-definitions` - Manage transfer settings
- **Reservations**: `/reservations` - Search and manage reservation transfers
- **Transfer Log**: `/transfer-log` - Core transfer logging operations
- **Transfer History**: `/transfer-history` - Historical transfer data
- **Transfer Results**: `/v2/transfer-results` - Transfer result management
- **Mapping Rules**: `/mapping-rules` - Transfer mapping configurations
- **External Reservations**: `/external-reservations` - External reservation data

## Links


- **Repository**: [GitHub](https://github.com/cvent-internal/passkey-transfer-log)
- **CI/CD**: [Jenkins](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-transfer-log)
- **Monitoring**: [Datadog APM](https://cvent.datadoghq.com/apm/services/passkey-transfer-log-service/operations/servlet.request/resources)
- **Logs**: [Datadog Logs](https://cvent.datadoghq.com/logs?query=env%3Apr50+service%3Apasskey-transfer-log-service)
- **Wiki**: [Transfer Log Service Documentation](https://wiki.cvent.com/display/PASKY/Transfer+Log+Service)

## Support


- **Team**: meeseeksbox
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels

For questions or support, please refer to the team's documentation or contact the development team through standard Cvent channels.
