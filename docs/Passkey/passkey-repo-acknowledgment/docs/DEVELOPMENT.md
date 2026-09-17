# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerization and local testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code with Java extensions

### Optional Tools
- **Postman**: API testing
- **DBeaver**: Database client for Oracle
- **kubectl**: Kubernetes CLI for deployment testing

### Environment Setup

#### Java Installation
```bash
# Using SDKMAN (recommended)
curl -s "https://get.sdkman.io" | bash
sdk install java 17.0.2-open
sdk use java 17.0.2-open

# Verify installation
java -version
javac -version
```

#### Maven Setup
```bash
# Download and install Maven
wget https://archive.apache.org/dist/maven/maven-3/3.8.6/binaries/apache-maven-3.8.6-bin.tar.gz
tar -xzf apache-maven-3.8.6-bin.tar.gz
export PATH=$PATH:/path/to/maven/bin

# Configure Cvent Nexus repository
cp .m2/settings.xml ~/.m2/settings.xml
```

#### Maven Settings for Cvent Nexus (`~/.m2/settings.xml`)
```xml
<settings>
  <servers>
    <server>
      <id>cvent-nexus</id>
      <username>${env.NEXUS_USERNAME}</username>
      <password>${env.NEXUS_PASSWORD}</password>
    </server>
  </servers>
  
  <mirrors>
    <mirror>
      <id>cvent-nexus</id>
      <mirrorOf>*</mirrorOf>
      <url>https://nexus.cvent.com/repository/maven-public/</url>
    </mirror>
  </mirrors>
</settings>
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-acknowledgment.git
cd passkey-acknowledgment
```

### 2. Build Project
```bash
# Full build with all modules
mvn clean package

# Quick build (skip tests)
mvn clean package -DskipTests

# Release build (production-ready)
mvn clean package -Prelease
```

### 3. Database Setup

#### Local Oracle Database (Docker)
```bash
# Start Oracle database container
docker run -d \
  --name oracle-db \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  -e ORACLE_DATABASE=XEPDB1 \
  gvenzl/oracle-xe:21-slim

# Wait for database to start (check logs)
docker logs -f oracle-db
```

#### Database Schema Setup
```sql
-- Connect to database and create schema
sqlplus system/password@localhost:1521/XEPDB1

-- Create user and grant permissions
CREATE USER passkey_ack IDENTIFIED BY password;
GRANT CONNECT, RESOURCE TO passkey_ack;
GRANT CREATE SESSION TO passkey_ack;

-- Create tables (run schema scripts)
@passkey-acknowledgment-data-access/src/main/resources/db/schema.sql
```

### 4. Configuration

#### Development Configuration (`passkey-acknowledgment-service/configs/dev.yaml`)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: oracle.jdbc.OracleDriver
  url: jdbc:oracle:thin:@localhost:1521:XEPDB1
  user: passkey_ack
  password: password
  maxWaitForConnection: 1s
  validationQuery: "SELECT 1 FROM DUAL"
  minSize: 2
  maxSize: 8

logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.acknowledgment: DEBUG
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC
```

### 5. Run Application
```bash
cd passkey-acknowledgment-service

# Run with development configuration
java -jar target/passkey-acknowledgment-service-1.0.73-SNAPSHOT.jar server configs/dev.yaml

# Run with specific JVM options
java -Xmx2g -Dlogback.configurationFile=configs/dev.logback.xml \
  -jar target/passkey-acknowledgment-service-1.0.73-SNAPSHOT.jar \
  server configs/dev.yaml
```

### 6. Verify Setup
```bash
# Health check
curl http://localhost:8081/healthcheck

# Application info
curl http://localhost:8081/info

# OpenAPI documentation
curl http://localhost:8080/dev/passkey-acknowledgment/openapi.json
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=AcknowledgementServiceTest

# Run tests with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run integration tests with specific configuration
mvn -Prun-it -Dkarate.env=dev -Dkarate.config.dir=test_configs verify

# Run specific integration test
mvn -Prun-it -Dtest=AcknowledgmentIT verify
```

### Test Configuration

#### Karate Test Configuration (`passkey-acknowledgment-integration-test/test_configs/karate-config.js`)
```javascript
function fn() {
  var env = karate.env || 'dev';
  var config = {
    baseUrl: 'http://localhost:8080',
    apiKey: 'test-api-key'
  };
  
  if (env === 'dev') {
    config.baseUrl = 'https://api-dev.cvent.com';
  } else if (env === 'staging') {
    config.baseUrl = 'https://api-staging.cvent.com';
  }
  
  return config;
}
```

## Code Structure

### Package Organization
```
com.cvent.passkey.acknowledgment/
├── resources/                    # REST endpoints
│   ├── PasskeyAcknowledgmentResource.java
│   └── OpenApiResource.java
├── service/                      # Business logic
│   └── AcknowledgementService.java
├── model/                        # API models (in api module)
│   ├── AcknowledgementRequest.java
│   ├── MasterAcknowledgementRequest.java
│   └── AcknowledgementResponse.java
├── dataaccess/                   # Data access layer
│   ├── AcknowledgementDao.java
│   └── model/
├── mapper/                       # Object mapping
│   └── AcknowledgementMapper.java
├── health/                       # Health checks
│   └── DatabaseHealthCheck.java
└── exceptionmapper/              # Exception handling
    └── WebApplicationExceptionMapper.java
```

### Module Dependencies
```
passkey-acknowledgment-service
├── depends on: passkey-acknowledgment-api
├── depends on: passkey-acknowledgment-data-access
└── depends on: passkey-microservices-common

passkey-acknowledgment-data-access
└── depends on: passkey-acknowledgment-api

passkey-acknowledgment-java-client
└── depends on: passkey-acknowledgment-api

passkey-acknowledgment-integration-test
├── depends on: passkey-acknowledgment-api
└── depends on: passkey-acknowledgment-java-client
```

## Coding Standards

### Java Code Style
- **Formatting**: Follow Google Java Style Guide
- **Naming**: Use descriptive names for classes, methods, and variables
- **Documentation**: JavaDoc for public APIs
- **Null Safety**: Use Optional for nullable return values

#### Example Code Style
```java
/**
 * Service for processing reservation acknowledgments.
 */
@Singleton
public class AcknowledgementService {
    
    private static final Logger LOG = LoggerFactory.getLogger(AcknowledgementService.class);
    
    private final AcknowledgementDao acknowledgementDao;
    
    @Inject
    public AcknowledgementService(AcknowledgementDao acknowledgementDao) {
        this.acknowledgementDao = requireNonNull(acknowledgementDao, "acknowledgementDao");
    }
    
    /**
     * Sends acknowledgment for a single reservation.
     *
     * @param request the acknowledgment request
     * @return acknowledgment response with tracking information
     * @throws IllegalArgumentException if request is invalid
     */
    public AcknowledgementResponse sendSingleAck(AcknowledgementRequest request) {
        requireNonNull(request, "request cannot be null");
        validateRequest(request);
        
        LOG.info("Processing single acknowledgment for reservation {}", request.getReservationId());
        
        // Implementation...
        
        return new AcknowledgementResponse()
            .setReservationAcknowledgementLogId(logId)
            .setAcknowledgementTaskId(taskId)
            .setAcknowledgementCreatedSystime(System.currentTimeMillis());
    }
}
```

### Testing Standards
- **Unit Tests**: Test individual methods and classes in isolation
- **Integration Tests**: Test complete workflows end-to-end
- **Test Naming**: Use descriptive test method names
- **Assertions**: Use AssertJ for fluent assertions

#### Example Test
```java
@ExtendWith(MockitoExtension.class)
class AcknowledgementServiceTest {
    
    @Mock
    private AcknowledgementDao acknowledgementDao;
    
    @InjectMocks
    private AcknowledgementService acknowledgementService;
    
    @Test
    void sendSingleAck_ValidRequest_ReturnsResponse() {
        // Given
        AcknowledgementRequest request = new AcknowledgementRequest()
            .setReservationId(12345L)
            .setReservationStatus(1L)
            .setSendToPrimary(true);
        
        when(acknowledgementDao.insertAcknowledgement(any())).thenReturn(67890L);
        
        // When
        AcknowledgementResponse response = acknowledgementService.sendSingleAck(request);
        
        // Then
        assertThat(response)
            .isNotNull()
            .satisfies(r -> {
                assertThat(r.getReservationAcknowledgementLogId()).isEqualTo(67890L);
                assertThat(r.getAcknowledgementTaskId()).isPositive();
                assertThat(r.getAcknowledgementCreatedSystime()).isPositive();
            });
        
        verify(acknowledgementDao).insertAcknowledgement(any());
    }
}
```

## Common Tasks

### Adding a New Endpoint

1. **Define API Model** (in `passkey-acknowledgment-api` module):
```java
public class NewAcknowledgementRequest {
    private String newField;
    
    // Getters and setters
}
```

2. **Add Resource Method**:
```java
@POST
@Path("/newEndpoint")
@Operation(summary = "New acknowledgment endpoint")
public AcknowledgementResponse newEndpoint(NewAcknowledgementRequest request) {
    return acknowledgementService.processNewRequest(request);
}
```

3. **Implement Service Logic**:
```java
public AcknowledgementResponse processNewRequest(NewAcknowledgementRequest request) {
    // Business logic implementation
}
```

4. **Add Tests**:
```java
@Test
void newEndpoint_ValidRequest_ReturnsResponse() {
    // Test implementation
}
```

5. **Update OpenAPI Documentation**:
```java
@Operation(
    summary = "New acknowledgment endpoint",
    description = "Detailed description of the new endpoint"
)
@ApiResponse(responseCode = "200", description = "Success")
```

### Database Schema Changes

1. **Create Migration Script**:
```sql
-- V1.1__Add_new_column.sql
ALTER TABLE RESERVATION_ACKNOWLEDGEMENT_LOG 
ADD NEW_COLUMN VARCHAR2(100);

CREATE INDEX IDX_NEW_COLUMN ON RESERVATION_ACKNOWLEDGEMENT_LOG(NEW_COLUMN);
```

2. **Update Entity Model**:
```java
public class AcknowledgementEntity {
    private String newColumn;
    
    // Getters and setters
}
```

3. **Update DAO Methods**:
```java
@SqlUpdate("INSERT INTO RESERVATION_ACKNOWLEDGEMENT_LOG (..., NEW_COLUMN) VALUES (..., :newColumn)")
long insertAcknowledgement(@BindBean AcknowledgementEntity entity);
```

### Adding Configuration Properties

1. **Update Configuration Class**:
```java
public class AcknowledgementConfiguration extends Configuration {
    @JsonProperty
    private String newProperty = "defaultValue";
    
    public String getNewProperty() {
        return newProperty;
    }
}
```

2. **Update YAML Configuration**:
```yaml
# configs/dev.yaml
newProperty: "development-value"
```

3. **Inject in Service**:
```java
@Inject
public AcknowledgementService(AcknowledgementConfiguration config) {
    this.newProperty = config.getNewProperty();
}
```

## Debugging

### Local Debugging
```bash
# Run with debug port
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
  -jar target/passkey-acknowledgment-service-1.0.73-SNAPSHOT.jar \
  server configs/dev.yaml
```

### IDE Configuration
- **IntelliJ**: Create Remote JVM Debug configuration with port 5005
- **Eclipse**: Debug Configurations → Remote Java Application → port 5005
- **VS Code**: Use Java Debug extension with remote debugging

### Logging Configuration
```xml
<!-- logback.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkey.acknowledgment" level="DEBUG"/>
    <logger name="org.jdbi" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

## Performance Testing

### Load Testing with JMeter
```xml
<!-- acknowledgment-load-test.jmx -->
<TestPlan>
    <ThreadGroup>
        <stringProp name="ThreadGroup.num_threads">50</stringProp>
        <stringProp name="ThreadGroup.ramp_time">30</stringProp>
        <stringProp name="ThreadGroup.duration">300</stringProp>
    </ThreadGroup>
</TestPlan>
```

### Profiling
```bash
# Run with JProfiler
java -agentpath:/path/to/jprofiler/bin/linux-x64/libjprofilerti.so=port=8849 \
  -jar target/passkey-acknowledgment-service-1.0.73-SNAPSHOT.jar \
  server configs/dev.yaml

# Run with async-profiler
java -jar async-profiler.jar -e cpu -d 60 -f profile.html <pid>
```

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-acknowledgment.git
   cd passkey-acknowledgment
   ```

2. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-acknowledgment-service
   java -jar target/passkey-acknowledgment-service-1.0.73-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Access API documentation**:
   - OpenAPI JSON: `http://localhost:8080/dev/passkey-acknowledgment/openapi.json`
   - OpenAPI YAML: `http://localhost:8080/dev/passkey-acknowledgment/openapi.yaml`

### Testing

- **Unit Tests**: `mvn test`
- **Integration Tests**: `mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify`
- **Code Coverage**: `mvn package -Pcoverage`

## Links


- **Backstage**: https://backstage.core.cvent.org/catalog/default/component/passkey-acknowledgment-service
- **API Documentation**: https://backstage.core.cvent.org/catalog/default/api/passkey-acknowledgment-api
- **Jenkins**: https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-acknowledgment
- **Datadog**: https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-acknowledgment-service

## Team


- **Owner**: Cherry Pickers team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
