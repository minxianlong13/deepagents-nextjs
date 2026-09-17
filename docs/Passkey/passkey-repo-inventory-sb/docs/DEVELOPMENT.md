# Development Guide

## Prerequisites

### Required Software
- **Java 17+**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **pnpm**: Package manager for monorepo management
- **Docker**: Container runtime for local services
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Optional Tools
- **Docker Compose**: For local service orchestration
- **Postman**: API testing and development
- **DBeaver**: Database client for Oracle
- **AWS CLI**: For cloud resource management

### Environment Setup
```bash
# Verify Java version
java -version

# Verify Maven version
mvn -version

# Install pnpm (if not already installed)
npm install -g pnpm

# Verify Docker
docker --version
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-inventory-sb.git
cd passkey-inventory-sb
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies for monorepo management
pnpm install

# Install Maven dependencies
cd packages/passkey-inventory
mvn clean install
```

### 3. Database Setup

#### Option A: Local Oracle Database (Docker)
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

#### Option B: Connect to Development Database
Update `packages/passkey-inventory/service/configs/dev.yaml`:
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@//dev-oracle.cvent.org:1521/XEPDB1
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

### 4. Configuration
Create local environment variables:
```bash
# Create .env file in service directory
cd packages/passkey-inventory/service
cat > .env << EOF
DB_USERNAME=your_username
DB_PASSWORD=your_password
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
EOF
```

### 5. Run the Application

#### Using Maven
```bash
cd packages/passkey-inventory/service
mvn spring-boot:run
```

#### Using CDF (Cvent Development Framework)
```bash
# From repository root
pnpm run ci:setup
```

#### Using Docker
```bash
# Build Docker image
docker build -t passkey-inventory .

# Run container
docker run -p 8080:8080 \
  --env-file .env \
  passkey-inventory
```

### 6. Verify Installation
```bash
# Check health endpoint
curl http://localhost:8080/actuator/health

# Test API endpoint (requires OAuth token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/passkey-inventory/v1/entity/test-id
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=PasskeyInventoryServiceTest

# Run tests with coverage
mvn test jacoco:report
```

### Integration Tests
```bash
# Run integration tests
mvn verify -Prun-it

# Run specific integration test
mvn verify -Prun-it -Dit.test=BlockControllerIT
```

### Test Coverage
```bash
# Generate coverage report
mvn clean test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

## Code Structure

### Package Organization
```
com.cvent.passkeyinventory/
├── PasskeyInventoryApplication.java    # Main application class
├── PasskeyInventoryConfiguration.java  # Application configuration
├── auth/                              # Authentication components
├── config/                            # Configuration classes
├── controllers/                       # REST controllers
│   ├── BlockController.java
│   └── PasskeyInventoryController.java
├── dao/                              # Data access objects
├── health/                           # Health check components
├── service/                          # Service interfaces
│   ├── BlockService.java
│   ├── PasskeyInventoryService.java
│   └── impl/                         # Service implementations
└── services/                         # Additional services
    └── UsersService.java
```

### Model Module Structure
```
com.cvent.passkeyinventory.model/
├── BlockInfo.java                    # Block information model
├── BlockInfoResponse.java            # Response wrapper
└── GetBlocksRequest.java             # Request model
```

## Coding Standards

### Java Code Style
- **Formatting**: Follow Google Java Style Guide
- **Naming**: Use descriptive names for classes, methods, and variables
- **Comments**: JavaDoc for public APIs, inline comments for complex logic
- **Imports**: Organize imports, avoid wildcard imports

### Example Code Style
```java
/**
 * Service for managing hotel room blocks in the passkey inventory system.
 * 
 * @author Development Team
 * @since 1.0.0
 */
@Service
public class BlockServiceImpl implements BlockService {
    
    private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    
    private final BlockDao blockDao;
    
    public BlockServiceImpl(BlockDao blockDao) {
        this.blockDao = blockDao;
    }
    
    @Override
    public List<BlockInfo> getBlocksById(List<String> blockIds, String localeId) {
        LOG.info("Retrieving blocks for IDs: {} with locale: {}", blockIds, localeId);
        
        if (blockIds == null || blockIds.isEmpty()) {
            throw new IllegalArgumentException("Block IDs cannot be null or empty");
        }
        
        return blockDao.findBlocksByIds(blockIds, localeId);
    }
}
```

### Configuration Standards
- **YAML Format**: Use YAML for configuration files
- **Environment Variables**: Use environment variables for sensitive data
- **Profiles**: Use Spring profiles for environment-specific configuration

### Testing Standards
- **Test Naming**: Use descriptive test method names
- **Test Structure**: Arrange-Act-Assert pattern
- **Mocking**: Use Mockito for unit test mocking
- **Test Data**: Use builders or factories for test data creation

```java
@ExtendWith(MockitoExtension.class)
class BlockServiceImplTest {
    
    @Mock
    private BlockDao blockDao;
    
    @InjectMocks
    private BlockServiceImpl blockService;
    
    @Test
    void getBlocksById_WithValidIds_ReturnsBlockList() {
        // Arrange
        List<String> blockIds = Arrays.asList("block-1", "block-2");
        String localeId = "en-US";
        List<BlockInfo> expectedBlocks = createTestBlocks();
        
        when(blockDao.findBlocksByIds(blockIds, localeId)).thenReturn(expectedBlocks);
        
        // Act
        List<BlockInfo> result = blockService.getBlocksById(blockIds, localeId);
        
        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).containsExactlyElementsOf(expectedBlocks);
    }
}
```

## Common Development Tasks

### Adding a New REST Endpoint

1. **Create Request/Response Models** (in model module):
```java
@Value.Immutable
@JsonSerialize(as = ImmutableNewRequest.class)
@JsonDeserialize(as = ImmutableNewRequest.class)
public interface NewRequest {
    String getId();
    String getName();
}
```

2. **Add Service Method**:
```java
public interface NewService {
    ResponseEntity processNewRequest(NewRequest request);
}
```

3. **Implement Service**:
```java
@Service
public class NewServiceImpl implements NewService {
    @Override
    public ResponseEntity processNewRequest(NewRequest request) {
        // Implementation
    }
}
```

4. **Create Controller**:
```java
@RestController
@RequestMapping("/passkey-inventory/v1/new")
public class NewController {
    
    @PostMapping
    @CventAuthorization(scopes = {"ADMIN"})
    public ResponseEntity<NewResponse> processRequest(@Valid @RequestBody NewRequest request) {
        return newService.processNewRequest(request);
    }
}
```

### Adding Database Access

1. **Create DAO Interface**:
```java
@Mapper
public interface NewDao {
    List<NewEntity> findByIds(@Param("ids") List<String> ids);
    void insert(NewEntity entity);
}
```

2. **Create MyBatis Mapper XML**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.cvent.passkeyinventory.dao.NewDao">
    <select id="findByIds" resultType="NewEntity">
        SELECT * FROM new_table 
        WHERE id IN 
        <foreach item="id" collection="ids" open="(" separator="," close=")">
            #{id}
        </foreach>
    </select>
</mapper>
```

### Adding Configuration Properties

1. **Create Configuration Class**:
```java
@ConfigurationProperties(prefix = "passkey.inventory")
@Data
public class InventoryProperties {
    private int maxBlockSize = 100;
    private Duration cacheTimeout = Duration.ofMinutes(5);
}
```

2. **Enable Configuration Properties**:
```java
@Configuration
@EnableConfigurationProperties(InventoryProperties.class)
public class AppConfig {
    // Configuration beans
}
```

3. **Add to application.yaml**:
```yaml
passkey:
  inventory:
    max-block-size: 100
    cache-timeout: PT5M
```

## Debugging

### Local Debugging
1. **IDE Debug Configuration**:
   - Main class: `com.cvent.passkeyinventory.PasskeyInventoryApplication`
   - VM options: `-Dspring.profiles.active=dev`
   - Program arguments: `--spring.config.location=configs/dev.yaml`

2. **Remote Debugging**:
```bash
# Start application with debug port
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

### Logging Configuration
```yaml
logging:
  level:
    com.cvent.passkeyinventory: DEBUG
    org.springframework.web: DEBUG
    org.mybatis: DEBUG
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

### Common Issues and Solutions

1. **Database Connection Issues**:
   - Verify database is running
   - Check connection string and credentials
   - Ensure network connectivity

2. **OAuth Authentication Failures**:
   - Verify OAuth client configuration
   - Check token expiration
   - Validate scopes

3. **Build Failures**:
   - Clean and rebuild: `mvn clean install`
   - Check Java version compatibility
   - Verify all dependencies are available

## Performance Testing

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
  http://localhost:8080/passkey-inventory/v1/blocks

# Using curl for simple testing
for i in {1..100}; do
  curl -H "Authorization: Bearer <token>" \
    http://localhost:8080/passkey-inventory/v1/entity/test-$i &
done
wait
```

### Profiling
- **JProfiler**: Commercial profiling tool
- **VisualVM**: Free JVM profiler
- **Spring Boot Actuator**: Built-in metrics and monitoring

## Contributing

### Git Workflow
1. Create feature branch from `master`
2. Make changes and commit with descriptive messages
3. Push branch and create pull request
4. Address code review feedback
5. Merge after approval

### Commit Message Format
```
feat: add new block retrieval endpoint

- Implement POST /blocks endpoint
- Add request/response models
- Include input validation
- Add unit and integration tests

Closes #123
```

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

## Additional Resources

## Quick Start


### Prerequisites
- Java 17+
- Maven 3.6+
- pnpm (for monorepo management)
- Docker (for local development)

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-inventory-sb.git
   cd passkey-inventory-sb
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the project**:
   ```bash
   pnpm build
   ```

4. **Run the service**:
   ```bash
   cd packages/passkey-inventory/service
   mvn spring-boot:run
   ```

The service will start on the default port and be available at `http://localhost:8080`.

### Using CDF (Cvent Development Framework)

For CDF-based local development:
```bash
pnpm run ci:setup
```

Refer to the [CDF documentation](https://framework.docs.cvent.org/docs/getting_started/new_project/run_locally) for detailed setup instructions.

## API Endpoints


- **Base URL**: `/passkey-inventory/v1`
- **Health Check**: `/actuator/health`
- **Entity Operations**: `/passkey-inventory/v1/entity`
- **Block Operations**: `/passkey-inventory/v1/blocks`

## Support


- **Team**: meeseeksbox
- **Slack Channel**: #passkey-api
- **Jenkins**: [passkey-inventory](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-inventory)
- **Backstage**: [Component Details](https://backstage.core.cvent.org/catalog/default/Component/passkey-inventory)

## Troubleshooting


### Common Issues

1. **Build Failures**: Ensure Java 17+ is installed and JAVA_HOME is set correctly
2. **Port Conflicts**: Check if port 8080 is available or configure a different port
3. **Database Connection**: Verify database configuration in `configs/dev.yaml`

For additional help, reach out to the #passkey-api Slack channel.
