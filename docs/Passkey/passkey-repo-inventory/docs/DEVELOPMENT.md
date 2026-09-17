# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerized development and testing
- **Git**: Version control
- **IntelliJ IDEA** (recommended) or Eclipse: IDE with Java support

### Optional Tools
- **Postman**: API testing and development
- **DBeaver**: Database client for local development
- **Docker Compose**: Multi-container development environment

### System Requirements
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: At least 10GB free space
- **OS**: Windows 10+, macOS 10.14+, or Linux

## Local Setup

### 1. Environment Setup

#### Install Java 21
```bash
# Using SDKMAN (recommended)
curl -s "https://get.sdkman.io" | bash
sdk install java 21.0.1-open

# Verify installation
java -version
javac -version
```

#### Install Maven
```bash
# Using SDKMAN
sdk install maven 3.9.5

# Or download from https://maven.apache.org/download.cgi
# Verify installation
mvn -version
```

#### Configure Maven for Cvent Nexus
Create or update `~/.m2/settings.xml`:
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
          <url>https://nexus.core.cvent.org/repository/maven-public/</url>
        </repository>
      </repositories>
    </profile>
  </profiles>
  
  <activeProfiles>
    <activeProfile>cvent</activeProfile>
  </activeProfiles>
</settings>
```

### 2. Project Setup

#### Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-inventory.git
cd passkey-inventory
```

#### Build Project
```bash
# Clean build with all modules
mvn clean package -Prelease

# Skip tests for faster build
mvn clean package -DskipTests -Prelease

# Build with code coverage
mvn clean package -Pcoverage
```

#### Verify Build
```bash
# Check if JAR was created
ls -la passkey-inventory-service/target/passkey-inventory-service-*.jar
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt-get install postgresql  # Ubuntu

# Start PostgreSQL service
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Ubuntu

# Create database and user
createdb passkey_inventory_dev
createuser -P passkey_user  # Enter password when prompted

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

# Verify connection
docker exec -it passkey-postgres psql -U passkey_user -d passkey_inventory_dev -c "SELECT version();"
```

### 4. Configuration

#### Create Local Configuration
Copy and modify the development configuration:
```bash
cp passkey-inventory-service/configs/dev.yaml passkey-inventory-service/configs/local.yaml
```

Update `local.yaml` with your local settings:
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
  url: jdbc:postgresql://localhost:5432/passkey_inventory_dev
  user: passkey_user
  password: dev_password
  maxWaitForConnection: 1s
  validationQuery: "SELECT 1"
  minSize: 2
  maxSize: 8

logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.inventory: DEBUG
    org.hibernate.SQL: DEBUG
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC

# External service URLs (use dev environment)
externalServices:
  authService: https://auth-service.dev.cvent.org
  businessTextService: https://passkey-business-text.dev.cvent.org
  eventService: https://passkey-event.dev.cvent.org
  hotelService: https://passkey-hotel.dev.cvent.org
  roomTypeDataService: https://passkey-room-type-data.dev.cvent.org
```

## Running the Service

### Command Line
```bash
cd passkey-inventory-service

# Run with local configuration
java -jar target/passkey-inventory-service-1.0.0-SNAPSHOT.jar server configs/local.yaml

# Run with debug logging
java -Dlogback.configurationFile=configs/local.logback.xml \
     -jar target/passkey-inventory-service-1.0.0-SNAPSHOT.jar \
     server configs/local.yaml

# Run with remote debugging
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-inventory-service-1.0.0-SNAPSHOT.jar \
     server configs/local.yaml
```

### IntelliJ IDEA Configuration

#### Create Run Configuration
1. **Run → Edit Configurations**
2. **Add New → Application**
3. **Configuration**:
   - **Name**: Passkey Inventory Service (Local)
   - **SDK**: Java 21 SDK of `passkey-inventory-service` module
   - **Module Classpath**: `passkey-inventory-service`
   - **Main Class**: `com.cvent.passkey.inventory.PasskeyInventoryServiceApplication`
   - **Program Arguments**: `server configs/local.yaml`
   - **Working Directory**: `$MODULE_WORKING_DIR$`

#### Environment Variables
Add these environment variables to your run configuration:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=passkey_inventory_dev
DB_USERNAME=passkey_user
DB_PASSWORD=dev_password
ENVIRONMENT=local
```

### Docker Development
```bash
# Build Docker image
docker build -t passkey-inventory:local .

# Run with Docker
docker run -p 8080:8080 -p 8081:8081 \
  -e DB_HOST=host.docker.internal \
  -e DB_USERNAME=passkey_user \
  -e DB_PASSWORD=dev_password \
  passkey-inventory:local
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-inventory-service

# Run specific test class
mvn test -Dtest=InventoryServiceTest

# Run with coverage
mvn test jacoco:report -Pcoverage
```

### Integration Tests
```bash
# Run all integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run specific integration test
mvn -Prun-it -Dkarate.tags="@get_inventory_summary" -Denv.IT_ENVIRONMENT=dev verify

# Run integration tests in IntelliJ
# 1. Right-click on feature file
# 2. Select "Run Feature"
# 3. Add VM options: -Dkarate.env=dev -Dkarate.config.dir=test_configs
```

### Test Coverage Report
```bash
# Generate coverage report
mvn clean verify jacoco:report -Pcoverage

# Open report in browser
open passkey-inventory-service/target/site/jacoco/index.html
```

## Code Structure

### Package Organization
```
com.cvent.passkey.inventory/
├── configuration/          # Dropwizard configuration classes
├── resources/             # REST endpoint implementations
│   ├── v2/               # Version 2 API endpoints
│   └── manage/           # Management/admin endpoints
├── services/             # Business logic services
├── repositories/         # Data access layer (in data-access module)
├── model/               # Domain models and DTOs (in api module)
├── exceptions/          # Custom exception classes
├── helpers/             # Utility and helper classes
└── constants/           # Application constants
```

### Key Components

#### Resources (REST Controllers)
- `PasskeyInventoryResource`: Main inventory operations
- `BlockResource`: Block-specific operations
- `AdminInventoryResource`: Administrative functions
- `EventInventorySummaryResource`: Event summary operations
- `RoomBlockResource`: Room block management

#### Services (Business Logic)
- `InventoryService`: Core inventory management
- `AuthorizationService`: User authorization
- `ValidationService`: Input validation

#### Models (Data Transfer Objects)
- `Inventory`: Core inventory entity
- `InventoryLock`: Inventory locking mechanism
- `RoomTypeInventory`: Room type specific inventory
- `AvailabilityResponse`: Availability query results

## Coding Standards

### Java Code Style
Follow Google Java Style Guide with these modifications:
- **Indentation**: 4 spaces (not 2)
- **Line Length**: 120 characters
- **Import Order**: Static imports first, then regular imports

### Code Formatting
```java
// Good: Proper formatting and naming
public class InventoryService {
    private static final Logger LOGGER = LoggerFactory.getLogger(InventoryService.class);
    
    private final InventoryRepository inventoryRepository;
    
    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }
    
    @Timed(name = "inventory.get.duration")
    public List<Inventory> getInventory(Long blockId, LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        
        return inventoryRepository.findByBlockIdAndDateRange(blockId, startDate, endDate);
    }
    
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new InventoryException(ErrorCode.INVALID_DATE_RANGE, 
                "Start date must be before end date");
        }
    }
}
```

### Documentation Standards
```java
/**
 * Retrieves inventory for a specific block within a date range.
 * 
 * @param blockId the unique identifier for the room block
 * @param startDate the start date for inventory lookup (inclusive)
 * @param endDate the end date for inventory lookup (inclusive)
 * @return list of inventory records matching the criteria
 * @throws InventoryException if the date range is invalid
 * @throws InventoryNotFoundException if no inventory exists for the block
 */
public List<Inventory> getInventory(Long blockId, LocalDate startDate, LocalDate endDate) {
    // Implementation
}
```

### Testing Standards
```java
@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {
    
    @Mock
    private InventoryRepository inventoryRepository;
    
    @InjectMocks
    private InventoryService inventoryService;
    
    @Test
    @DisplayName("Should return inventory when valid block ID and date range provided")
    void shouldReturnInventoryForValidBlockAndDateRange() {
        // Given
        Long blockId = 12345L;
        LocalDate startDate = LocalDate.of(2024, 3, 15);
        LocalDate endDate = LocalDate.of(2024, 3, 18);
        List<Inventory> expectedInventory = createTestInventory();
        
        when(inventoryRepository.findByBlockIdAndDateRange(blockId, startDate, endDate))
            .thenReturn(expectedInventory);
        
        // When
        List<Inventory> actualInventory = inventoryService.getInventory(blockId, startDate, endDate);
        
        // Then
        assertThat(actualInventory)
            .isNotNull()
            .hasSize(4)
            .containsExactlyElementsOf(expectedInventory);
        
        verify(inventoryRepository).findByBlockIdAndDateRange(blockId, startDate, endDate);
    }
    
    @Test
    @DisplayName("Should throw exception when start date is after end date")
    void shouldThrowExceptionForInvalidDateRange() {
        // Given
        Long blockId = 12345L;
        LocalDate startDate = LocalDate.of(2024, 3, 18);
        LocalDate endDate = LocalDate.of(2024, 3, 15);
        
        // When & Then
        assertThatThrownBy(() -> inventoryService.getInventory(blockId, startDate, endDate))
            .isInstanceOf(InventoryException.class)
            .hasMessage("Start date must be before end date");
        
        verifyNoInteractions(inventoryRepository);
    }
}
```

## Common Tasks

### Adding a New Endpoint
1. **Define API Contract**: Add request/response models to `passkey-inventory-api`
2. **Implement Resource**: Add endpoint method to appropriate resource class
3. **Add Business Logic**: Implement service method if needed
4. **Add Tests**: Unit tests for service, integration tests for endpoint
5. **Update Documentation**: Add endpoint to API documentation

### Adding a New Service Dependency
1. **Add Maven Dependency**: Update `pom.xml` with new dependency
2. **Add Configuration**: Add service URL to configuration files
3. **Create Client**: Implement client interface and configuration
4. **Add Health Check**: Implement health check for the new service
5. **Update Tests**: Mock the new service in tests

### Database Schema Changes
1. **Create Migration Script**: Add SQL migration script
2. **Update Entity Classes**: Modify JPA entities if using ORM
3. **Update Repository**: Add new query methods if needed
4. **Test Migration**: Verify migration works in all environments
5. **Update Documentation**: Document schema changes

### Performance Optimization
1. **Identify Bottleneck**: Use profiling tools and metrics
2. **Add Caching**: Implement appropriate caching strategy
3. **Optimize Queries**: Review and optimize database queries
4. **Add Metrics**: Implement custom metrics for monitoring
5. **Load Test**: Verify improvements under load

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Maven cache
rm -rf ~/.m2/repository/com/cvent/passkey

# Rebuild with clean slate
mvn clean install -U

# Check for dependency conflicts
mvn dependency:tree
```

#### Database Connection Issues
```bash
# Test database connectivity
telnet localhost 5432

# Check database logs
docker logs passkey-postgres

# Verify credentials
psql -h localhost -U passkey_user -d passkey_inventory_dev
```

#### Service Startup Issues
```bash
# Check port availability
lsof -i :8080
lsof -i :8081

# Verify configuration
java -jar target/passkey-inventory-service-*.jar check configs/local.yaml

# Enable debug logging
java -Dlogback.configurationFile=configs/debug.logback.xml -jar ...
```

### Debug Configuration
```xml
<!-- debug.logback.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkey.inventory" level="TRACE"/>
    <logger name="org.hibernate.SQL" level="DEBUG"/>
    <logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="TRACE"/>
    
    <root level="DEBUG">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### Getting Help
- **Team Slack**: `#passkey-meeseeks-box` (primary), `#passkey-metre-stick` (secondary)
- **Documentation**: Check existing documentation in `docs/` folder
- **Code Review**: Create pull request for code review and feedback
- **Architecture Questions**: Consult with senior team members or architects

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cvent-internal/passkey-inventory.git
   cd passkey-inventory
   ```

2. **Build the project**
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**
   ```bash
   cd passkey-inventory-service
   java -jar target/passkey-inventory-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Access the service**
   - Service runs on port configured in `dev.yaml`
   - Health check: `GET /healthcheck`
   - Admin interface: Available on admin port

### Running Tests

```bash
# Unit tests
mvn test

# Integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Code coverage
mvn package -Pcoverage
```

## Service Ownership


| Role      | Team         | Slack Channel             |
|-----------|--------------|---------------------------|
| Primary   | Meeseeksbox  | `#passkey-meeseeks-box`   |
| Secondary | Metrestick   | `#passkey-metre-stick`    |

## Useful Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-inventory)
- [Admin Portal](https://admin.core.cvent.org/serviceid/67220661-db40-4d32-8958-a2ed688e761e)
- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-inventory-service)
- [API Documentation](https://developers-staging.cvent.com/#/applications/1640/api)
