# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build and dependency management
- **Docker**: Container runtime for local testing
- **Git**: Version control
- **IntelliJ IDEA** (recommended) or Eclipse: IDE with Java support

### Optional Tools
- **Postman**: API testing
- **DBeaver**: Database client for Oracle
- **Docker Compose**: Multi-container local development

### System Requirements
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: At least 10GB free space
- **Network**: Access to Cvent internal networks and repositories

## Local Setup

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-housing-library.git
cd passkey-housing-library

# Verify Java version
java -version  # Should show Java 17

# Verify Maven installation
mvn -version   # Should show Maven 3.6+
```

### 2. Maven Configuration
Ensure your Maven settings include Cvent's internal Nexus repository:

**~/.m2/settings.xml**:
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

#### Create Development Environment File
**passkey-housing-library-service/configs/dev.env**:
```bash
# API Keys (get from Backstage)
LOCAL_API_KEY=your_local_api_key_here

# Database Configuration
DB_HOST=localhost
DB_PORT=1521
DB_NAME=XE
DB_USERNAME=housing_dev
DB_PASSWORD=dev_password

# AWS Configuration (for local S3 testing)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### Create Integration Test Configuration
**passkey-housing-library-integration-test/test_configs/dev.properties**:
```properties
# API Configuration
apiKey=your_test_api_key
baseUrl=http://localhost:8080
timeout=30000

# Test Data
testOrganizationId=test-org-123
testEventId=test-event-456
```

### 4. Database Setup

#### Option A: Local Oracle Database
```bash
# Pull Oracle XE Docker image
docker pull container-registry.oracle.com/database/express:21.3.0-xe

# Run Oracle XE container
docker run -d \
  --name oracle-xe \
  -p 1521:1521 \
  -p 5500:5500 \
  -e ORACLE_PWD=password \
  -e ORACLE_CHARACTERSET=AL32UTF8 \
  container-registry.oracle.com/database/express:21.3.0-xe

# Wait for database to start (check logs)
docker logs -f oracle-xe
```

#### Option B: Connect to Development Database
Update `dev.yaml` to point to shared development database:
```yaml
database:
  url: jdbc:oracle:thin:@dev-db.cvent.org:1521:DEVDB
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
```

### 5. Build and Run

#### Build the Project
```bash
# Clean build
mvn clean package -Prelease

# Build with tests
mvn clean package

# Build without tests (faster)
mvn clean package -DskipTests
```

#### Run the Service
```bash
cd passkey-housing-library-service

# Run with development configuration
java -jar target/passkey-housing-library-service-1.1.16-SNAPSHOT.jar server configs/dev.yaml

# Or use Maven exec plugin
mvn exec:java -Dexec.mainClass="com.cvent.passkeyhousinglibrary.PasskeyHousingLibraryServiceApplication" -Dexec.args="server configs/dev.yaml"
```

#### Verify Service is Running
```bash
# Health check
curl http://localhost:8081/health

# Basic endpoint test
curl http://localhost:8080/stub

# Admin metrics
curl http://localhost:8081/metrics
```

## IntelliJ IDEA Configuration

### Launch Configuration
Create a new Run Configuration in IntelliJ:

| Property              | Value                                                                     |
|-----------------------|---------------------------------------------------------------------------|
| **Main Class**        | `com.cvent.passkeyhousinglibrary.PasskeyHousingLibraryServiceApplication` |
| **Program Arguments** | `server passkey-housing-library-service/configs/dev.yaml`                |
| **VM Options**        | `-Xmx2g -Dfile.encoding=UTF-8`                                          |
| **Working Directory** | `$PROJECT_DIR$`                                                          |
| **Environment File** | `passkey-housing-library-service/configs/dev.env`                        |
| **Use Classpath**     | `passkey-housing-library-service`                                       |

### Project Settings
1. **Project SDK**: Java 17
2. **Language Level**: 17
3. **Compiler Output**: `target/classes`
4. **Annotation Processing**: Enabled

### Recommended Plugins
- **Maven Helper**: Maven dependency management
- **SonarLint**: Code quality analysis
- **CheckStyle-IDEA**: Code style checking
- **Lombok**: Annotation processing support

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=RoomCategoryResourceTest

# Run tests with coverage
mvn test jacoco:report -Pcoverage

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests
```bash
# Run all integration tests
mvn verify -Prun-it -Denv.IT_ENVIRONMENT=dev

# Run specific feature
mvn verify -Prun-it -Denv.IT_ENVIRONMENT=dev -Dkarate.options="--tags @room-categories"

# Run single scenario in IntelliJ
# 1. Open .feature file
# 2. Click green arrow next to scenario
# 3. Add VM options: -Dkarate.env=dev -Dkarate.config.dir=test_configs
```

### Load Tests
```bash
# Run load tests
mvn verify -Prun-load -Denv.LOAD_TEST_ENVIRONMENT=dev

# Custom load test parameters
mvn verify -Prun-load -Denv.LOAD_TEST_ENVIRONMENT=dev -Dload.users=50 -Dload.duration=300
```

## Code Structure

### Package Organization
```
com.cvent.passkeyhousinglibrary/
├── resources/              # JAX-RS REST endpoints
│   ├── EventTemplatesResource.java
│   ├── ImagesResource.java
│   ├── ParticipantResource.java
│   ├── RoomCategoryResource.java
│   └── RoomLibraryResource.java
├── services/               # Business logic layer
│   ├── EventTemplateService.java
│   ├── ImageService.java
│   └── RoomService.java
├── providers/              # JAX-RS providers and filters
│   ├── AuthenticationProvider.java
│   └── ExceptionMappers.java
├── health/                 # Health check implementations
│   └── DatabaseHealthCheck.java
├── PasskeyHousingLibraryServiceApplication.java
└── PasskeyHousingLibraryServiceConfiguration.java
```

### Data Access Layer
```
com.cvent.passkeyhousinglibrary/
├── dao/                    # Data Access Objects
│   ├── RoomDao.java
│   ├── EventTemplateDao.java
│   └── ImageDao.java
├── entity/                 # JPA Entities
│   ├── RoomEntity.java
│   ├── BedEntity.java
│   └── EventTemplateEntity.java
└── mapper/                 # Entity-DTO mappers
    ├── RoomMapper.java
    └── EventTemplateMapper.java
```

### API Models
```
com.cvent.passkeyhousinglibrary.model/
├── library/                # Core domain models
│   ├── Room.java
│   ├── Bed.java
│   ├── EventTemplate.java
│   └── ImageResponse.java
├── ParticipantProfileSettingsRequest.java
└── PasskeySettings.java
```

## Coding Standards

### Java Style Guide
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: Maximum 120 characters
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Imports**: No wildcard imports, organize by package

### Code Quality Rules
```java
// Good: Clear method names and proper error handling
public List<Room> getRoomsByOrganization(String organizationId) {
    if (organizationId == null || organizationId.trim().isEmpty()) {
        throw new IllegalArgumentException("Organization ID cannot be null or empty");
    }
    
    try {
        return roomDao.findByOrganizationId(organizationId);
    } catch (DataAccessException e) {
        log.error("Failed to retrieve rooms for organization: {}", organizationId, e);
        throw new ServiceException("Unable to retrieve rooms", e);
    }
}

// Good: Proper validation and documentation
/**
 * Uploads an image to the library with metadata.
 * 
 * @param imageFile The image file to upload
 * @param metadata Optional metadata for the image
 * @return ImageResponse containing the uploaded image details
 * @throws ValidationException if the image file is invalid
 * @throws ServiceException if upload fails
 */
@POST
@Consumes(MediaType.MULTIPART_FORM_DATA)
@Produces(MediaType.APPLICATION_JSON)
public Response uploadImage(@FormDataParam("file") InputStream imageFile,
                          @FormDataParam("metadata") String metadata) {
    // Implementation
}
```

### Testing Standards
```java
// Unit test example
@Test
void shouldReturnRoomsForValidOrganization() {
    // Given
    String organizationId = "org-123";
    List<RoomEntity> mockRooms = Arrays.asList(
        createMockRoom("room-1", "Standard Room"),
        createMockRoom("room-2", "Deluxe Room")
    );
    when(roomDao.findByOrganizationId(organizationId)).thenReturn(mockRooms);
    
    // When
    List<Room> result = roomService.getRoomsByOrganization(organizationId);
    
    // Then
    assertThat(result).hasSize(2);
    assertThat(result.get(0).getName()).isEqualTo("Standard Room");
    verify(roomDao).findByOrganizationId(organizationId);
}

@Test
void shouldThrowExceptionForNullOrganizationId() {
    // When & Then
    assertThatThrownBy(() -> roomService.getRoomsByOrganization(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Organization ID cannot be null or empty");
}
```

## Common Development Tasks

### Adding a New REST Endpoint

1. **Create the endpoint in Resource class**:
```java
@GET
@Path("/new-endpoint")
@Produces(MediaType.APPLICATION_JSON)
public Response getNewData(@QueryParam("param") String param) {
    // Validate parameters
    // Call service layer
    // Return response
}
```

2. **Add service layer method**:
```java
public class NewDataService {
    public List<NewData> getNewData(String param) {
        // Business logic
        return dao.findByParam(param);
    }
}
```

3. **Create integration test**:
```gherkin
Feature: New Data API

Scenario: Get new data successfully
    Given the service is running
    When I send GET request to "/new-endpoint?param=test"
    Then response code should be 200
    And response should contain new data
```

### Adding Database Migration

1. **Create migration script**:
```sql
-- V1.5__Add_new_table.sql
CREATE TABLE NEW_TABLE (
    ID VARCHAR2(255) PRIMARY KEY,
    NAME VARCHAR2(500) NOT NULL,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_NEW_TABLE_NAME ON NEW_TABLE(NAME);
```

2. **Update entity class**:
```java
@Entity
@Table(name = "NEW_TABLE")
public class NewTableEntity {
    @Id
    private String id;
    
    @Column(name = "NAME")
    private String name;
    
    // Getters and setters
}
```

### Debugging Tips

#### Enable Debug Logging
```yaml
# In dev.yaml
logging:
  loggers:
    com.cvent.passkeyhousinglibrary: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

#### Common Issues and Solutions

**Issue**: `ClassNotFoundException` for Oracle driver
```bash
# Solution: Ensure Oracle JDBC driver is in classpath
mvn dependency:tree | grep oracle
```

**Issue**: Database connection timeout
```bash
# Solution: Check database connectivity
telnet db-host 1521
```

**Issue**: Authentication failures
```bash
# Solution: Verify API key in dev.env
curl -H "X-API-Key: your-key" http://localhost:8080/room-categories?organizationId=test
```

## Performance Optimization

### Local Performance Testing
```bash
# Use Apache Bench for simple load testing
ab -n 1000 -c 10 http://localhost:8080/stub

# Use curl for response time testing
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/room-categories?organizationId=test
```

### Profiling
```bash
# Run with JVM profiling
java -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=profile.jfr -jar target/passkey-housing-library-service-1.1.16-SNAPSHOT.jar server configs/dev.yaml
```

## Troubleshooting

### Service Won't Start
1. Check Java version: `java -version`
2. Verify configuration file exists and is valid
3. Check database connectivity
4. Review application logs for specific errors

### Tests Failing
1. Ensure test database is running and accessible
2. Verify test configuration files are present
3. Check for port conflicts (8080, 8081)
4. Review test logs for specific failures

### Integration Issues
1. Verify API keys are correctly configured
2. Check network connectivity to external services
3. Ensure proper authentication headers in requests
4. Review service logs for integration errors

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Oracle Database access
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cvent-internal/passkey-housing-library.git
   cd passkey-housing-library
   ```

2. **Set up environment variables**
   Create `passkey-housing-library-service/configs/dev.env`:
   ```
   LOCAL_API_KEY=your_api_key_here
   ```

3. **Build the project**
   ```bash
   mvn package -Prelease
   ```

4. **Run locally**
   ```bash
   cd passkey-housing-library-service
   java -jar target/passkey-housing-library-service-1.1.16-SNAPSHOT.jar server configs/dev.yaml
   ```

5. **Run integration tests**
   ```bash
   mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
   ```

## Service Information


- **Service ID**: e4dddc2d-d6d0-4e19-9038-0fb279ea3a22
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
- **Owner Team**: Steakholders
- **Secondary Team**: Meeseeksbox

## Useful Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-housing-library)
- [Admin Portal](https://admin.core.cvent.org/serviceid/e4dddc2d-d6d0-4e19-9038-0fb279ea3a22)
- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-housing-library-service)
- [Slack Support](https://cvent.slack.com/channels/passkey-steak-holders)
