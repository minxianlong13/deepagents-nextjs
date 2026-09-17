# Development

## Development Environment Setup

### Prerequisites

#### Required Software

- **Java 17+** (OpenJDK or Oracle JDK)
- **Maven 3.8+** for Java build management
- **Node.js 18+** for build tools and workspace management
- **pnpm 8+** for package management
- **Docker** for local containerization
- **Git** for version control

#### Optional Tools

- **IntelliJ IDEA** or **VS Code** for development
- **Postman** or **Insomnia** for API testing
- **Oracle SQL Developer** for database management
- **AWS CLI** for cloud resource management

### Initial Setup

#### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-notification-sb.git
cd passkey-notification-sb
```

#### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Verify NX workspace
nx --version
```

#### 3. Environment Configuration

Create local environment configuration:

```bash
# Copy development config
cp packages/passkey-notification-sb/service/configs/dev.yaml \
   packages/passkey-notification-sb/service/configs/local.yaml
```

Edit `local.yaml` for your environment:

```yaml
server:
  port: 7000
  servlet:
    context-path: /local

spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521:XE
    username: your_username
    password: your_password

cvent:
  auth:
    application:
      client-id: '12025'
      client-secret: 'your_local_secret'
    server:
      url: 'https://auth-service-web.us-east-1.sn.cvent-development.cvent.cloud/sg50/auth/'
```

## Local Development

### Running the Service

#### Option 1: Maven (Recommended for Java development)

```bash
cd packages/passkey-notification-sb/service
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=configs/local.yaml"
```

#### Option 2: NX Workspace

```bash
# Build the service
nx build passkey-notification-sb-service

# Run the service
nx serve passkey-notification-sb-service
```

#### Option 3: Docker Compose

```bash
# Start all services including database
docker-compose up -d

# View logs
docker-compose logs -f passkey-notification-sb
```

### Verification

Once running, verify the service:

```bash
# Health check
curl http://localhost:7001/tasks/ok

# API test
curl -X GET "http://localhost:7000/local/passkey-notification-sb/v1/entity/test-123" \
  -H "Authorization: Bearer your-test-token"
```

## Development Workflow

### Branch Strategy

```
main (production)
├── develop (integration)
│   ├── feature/PKN-123-add-validation
│   ├── feature/PKN-124-improve-logging
│   └── bugfix/PKN-125-fix-auth-issue
└── hotfix/PKN-126-critical-fix
```

### Feature Development

#### 1. Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/PKN-123-add-validation
```

#### 2. Development Cycle

```bash
# Make changes
# Run tests
nx test passkey-notification-sb-service

# Run linting
nx lint passkey-notification-sb-service

# Format code
nx format:write

# Build
nx build passkey-notification-sb-service
```

#### 3. Commit Changes

```bash
git add .
git commit -m "PKN-123: Add input validation for entity creation

- Add @Valid annotation to controller
- Implement custom validation rules
- Add validation error handling
- Update tests for validation scenarios"
```

#### 4. Push and Create PR

```bash
git push origin feature/PKN-123-add-validation
# Create pull request via GitHub UI
```

## Code Standards

### Java Code Style

#### Formatting

Use Cvent's standard formatting rules:

```xml
<!-- .editorconfig -->
[*.java]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

#### Naming Conventions

```java
// Classes: PascalCase
public class PasskeyNotificationSbService {
    
    // Constants: UPPER_SNAKE_CASE
    private static final int DEFAULT_COMPLEX_VALUE = 5;
    
    // Variables: camelCase
    private final EntityRepository entityRepository;
    
    // Methods: camelCase
    public ResponseEntity createEntity(Entity entity) {
        // Implementation
    }
}
```

#### Documentation

```java
/**
 * Service for handling entity-related operations in the Passkey notification system.
 * 
 * <p>This service provides CRUD operations for entities and handles business logic
 * related to entity processing and validation.
 * 
 * @author Passkey Team
 * @since 0.1.0
 */
@Service
public class PasskeyNotificationSbService {
    
    /**
     * Creates a new entity in the system.
     * 
     * @param requestObject the entity request containing the details of the entity to be created
     * @return the created entity with generated response data
     * @throws ValidationException if the request object is invalid
     * @throws DuplicateEntityException if an entity with the same ID already exists
     */
    public ResponseEntity addEntity(Entity requestObject) {
        // Implementation
    }
}
```

### Testing Standards

#### Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class PasskeyNotificationSbServiceTest {
    
    @Mock
    private EntityRepository entityRepository;
    
    @InjectMocks
    private PasskeyNotificationSbService service;
    
    @Test
    @DisplayName("Should create entity successfully with valid input")
    void shouldCreateEntitySuccessfully() {
        // Given
        Entity inputEntity = Entity.builder()
            .withId("test-123")
            .withField("test-field")
            .withAnotherField("test-another")
            .withComplexEntity(ComplexEntity.builder().withComplex(42).build())
            .build();
        
        // When
        ResponseEntity result = service.addEntity(inputEntity);
        
        // Then
        assertThat(result.getId()).isEqualTo("test-123");
        assertThat(result.getField()).isEqualTo("test-field");
        assertThat(result.getComplexEntityResponse().getComplex()).isEqualTo(42);
    }
    
    @Test
    @DisplayName("Should throw validation exception for null entity")
    void shouldThrowValidationExceptionForNullEntity() {
        // When & Then
        assertThatThrownBy(() -> service.addEntity(null))
            .isInstanceOf(ValidationException.class)
            .hasMessage("Entity cannot be null");
    }
}
```

#### Integration Tests

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "classpath:application-test.properties")
class PasskeyNotificationSbIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private TestSecurityConfig testSecurityConfig;
    
    @Test
    @DisplayName("Should create entity via REST API")
    void shouldCreateEntityViaRestApi() {
        // Given
        Entity entity = Entity.builder()
            .withId("integration-test-123")
            .withField("integration-field")
            .withAnotherField("integration-another")
            .withComplexEntity(ComplexEntity.builder().withComplex(99).build())
            .build();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(testSecurityConfig.getTestToken());
        HttpEntity<Entity> request = new HttpEntity<>(entity, headers);
        
        // When
        ResponseEntity<com.cvent.api.models.platform.ResponseEntity> response = 
            restTemplate.postForEntity("/passkey-notification-sb/v1/entity", 
                                     request, 
                                     com.cvent.api.models.platform.ResponseEntity.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getId()).isEqualTo("integration-test-123");
    }
}
```

## Build and Test

### Maven Commands

```bash
# Clean and compile
mvn clean compile

# Run unit tests
mvn test

# Run integration tests
mvn test -Prun-it

# Generate test coverage report
mvn test jacoco:report

# Run all quality checks
mvn verify

# Package application
mvn package

# Skip tests (for quick builds)
mvn package -DskipTests
```

### NX Commands

```bash
# Run specific target for service
nx test passkey-notification-sb-service
nx lint passkey-notification-sb-service
nx build passkey-notification-sb-service

# Run affected projects only
nx affected:test
nx affected:lint
nx affected:build

# Run all projects
nx run-many --target=test --all
nx run-many --target=lint --all

# Generate dependency graph
nx dep-graph
```

### Test Configuration

#### Test Properties

```properties
# application-test.properties
spring.profiles.active=test
spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
logging.level.com.cvent.passkeynotificationsb=DEBUG
logging.level.org.springframework.security=DEBUG

# Disable OAuth for tests
cvent.auth.enabled=false
```

#### Test Security Configuration

```java
@TestConfiguration
public class TestSecurityConfig {
    
    @Bean
    @Primary
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf().disable()
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .build();
    }
    
    public String getTestToken() {
        return "test-token-for-integration-tests";
    }
}
```

## Debugging

### Local Debugging

#### IntelliJ IDEA

1. Create run configuration:
   - **Main class**: `com.cvent.passkeynotificationsb.PasskeyNotificationSbApplication`
   - **VM options**: `-Dspring.config.location=configs/local.yaml`
   - **Program arguments**: `--spring.profiles.active=local`

2. Set breakpoints in code
3. Run in debug mode

#### VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Debug Passkey Notification SB",
      "request": "launch",
      "mainClass": "com.cvent.passkeynotificationsb.PasskeyNotificationSbApplication",
      "projectName": "passkey-notification-sb",
      "args": "--spring.profiles.active=local",
      "vmArgs": "-Dspring.config.location=configs/local.yaml"
    }
  ]
}
```

### Remote Debugging

#### Enable Remote Debug

```bash
# Add JVM options for remote debugging
export JAVA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
mvn spring-boot:run
```

#### Connect from IDE

- **Host**: localhost
- **Port**: 5005
- **Attach to remote JVM**

### Logging Configuration

#### Development Logging

```xml
<!-- logback-spring.xml -->
<configuration>
    <springProfile name="local,dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        
        <logger name="com.cvent.passkeynotificationsb" level="DEBUG"/>
        <logger name="org.springframework.web" level="DEBUG"/>
        <logger name="org.springframework.security" level="DEBUG"/>
        <logger name="org.mybatis" level="DEBUG"/>
        
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>
</configuration>
```

## Database Development

### Local Oracle Setup

#### Docker Oracle

```yaml
# docker-compose.yml
version: '3.8'
services:
  oracle-db:
    image: container-registry.oracle.com/database/express:21.3.0-xe
    ports:
      - "1521:1521"
      - "5500:5500"
    environment:
      - ORACLE_PWD=oracle
      - ORACLE_CHARACTERSET=AL32UTF8
    volumes:
      - oracle-data:/opt/oracle/oradata
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  oracle-data:
```

#### Database Schema

```sql
-- scripts/init.sql
CREATE USER passkey_notification IDENTIFIED BY password;
GRANT CONNECT, RESOURCE TO passkey_notification;
GRANT CREATE SESSION TO passkey_notification;

-- Create tables
CREATE TABLE passkey_notification.entities (
    id VARCHAR2(255) PRIMARY KEY,
    field VARCHAR2(1000) NOT NULL,
    another_field VARCHAR2(1000) NOT NULL,
    complex_value NUMBER(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_entities_created_at ON passkey_notification.entities(created_at);
```

### MyBatis Development

#### Mapper Development

```java
@Mapper
public interface EntityMapper {
    
    @Select("SELECT id, field, another_field, complex_value FROM entities WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "field", column = "field"),
        @Result(property = "anotherField", column = "another_field"),
        @Result(property = "complexEntity.complex", column = "complex_value")
    })
    Entity findById(@Param("id") String id);
    
    @Insert("INSERT INTO entities (id, field, another_field, complex_value) " +
            "VALUES (#{id}, #{field}, #{anotherField}, #{complexEntity.complex})")
    void insert(Entity entity);
}
```

## Performance Testing

### Load Testing

#### JMeter Test Plan

```xml
<!-- passkey-notification-sb-load-test.jmx -->
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan>
      <elementProp name="TestPlan.arguments" elementType="Arguments" guiclass="ArgumentsPanel">
        <collectionProp name="Arguments.arguments">
          <elementProp name="baseUrl" elementType="Argument">
            <stringProp name="Argument.name">baseUrl</stringProp>
            <stringProp name="Argument.value">http://localhost:7000</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    
    <ThreadGroup>
      <stringProp name="ThreadGroup.num_threads">50</stringProp>
      <stringProp name="ThreadGroup.ramp_time">30</stringProp>
      <stringProp name="ThreadGroup.duration">300</stringProp>
      
      <HTTPSamplerProxy>
        <stringProp name="HTTPSampler.domain">${baseUrl}</stringProp>
        <stringProp name="HTTPSampler.path">/local/passkey-notification-sb/v1/entity/test-${__Random(1,1000)}</stringProp>
        <stringProp name="HTTPSampler.method">GET</stringProp>
      </HTTPSamplerProxy>
    </ThreadGroup>
  </hashTree>
</jmeterTestPlan>
```

#### Artillery.js Load Test

```yaml
# load-test.yml
config:
  target: 'http://localhost:7000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Get Entity"
    weight: 70
    flow:
      - get:
          url: "/local/passkey-notification-sb/v1/entity/{{ $randomString() }}"
          headers:
            Authorization: "Bearer test-token"
  
  - name: "Create Entity"
    weight: 30
    flow:
      - post:
          url: "/local/passkey-notification-sb/v1/entity"
          headers:
            Authorization: "Bearer test-token"
            Content-Type: "application/json"
          json:
            id: "{{ $randomString() }}"
            field: "load-test-field"
            anotherField: "load-test-another"
            complexEntity:
              complex: 42
```

## Troubleshooting

### Common Development Issues

#### Port Already in Use

```bash
# Find process using port 7000
lsof -i :7000

# Kill process
kill -9 <PID>

# Or use different port
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=7002"
```

#### Database Connection Issues

```bash
# Test Oracle connection
sqlplus username/password@localhost:1521/XE

# Check if Oracle is running
docker ps | grep oracle

# View Oracle logs
docker logs oracle-db
```

#### Authentication Issues

```bash
# Test auth service connectivity
curl -v https://auth-service-web.us-east-1.sn.cvent-development.cvent.cloud/sg50/auth/health

# Validate token
curl -X POST "https://auth-service-web.us-east-1.sn.cvent-development.cvent.cloud/sg50/auth/validate" \
  -H "Authorization: Bearer your-token"
```

### IDE-Specific Issues

#### IntelliJ IDEA

1. **Annotation Processing**: Enable annotation processing for Immutables
2. **Maven Import**: Reimport Maven projects if dependencies are missing
3. **Code Style**: Import Cvent code style settings

#### VS Code

1. **Java Extension Pack**: Install Java Extension Pack
2. **Spring Boot Extension**: Install Spring Boot Extension Pack
3. **Workspace Settings**: Configure Java home and Maven settings

## Contributing

### Code Review Checklist

- [ ] Code follows Cvent style guidelines
- [ ] All tests pass
- [ ] Code coverage meets minimum threshold (80%)
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Backward compatibility maintained

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

## Additional Resources

## Quick Start


### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+ (for build tools)
- Oracle Database access
- Cvent authentication credentials

### Running Locally

```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-notification-sb.git
cd passkey-notification-sb

# Install dependencies
pnpm install

# Build the service
nx build passkey-notification-sb-service

# Run the service
cd packages/passkey-notification-sb/service
mvn spring-boot:run
```

The service will start on port 7000 with management endpoints on port 7001.

## API Endpoints


### Entity Management

- `POST /dev/passkey-notification-sb/v1/entity` - Create a new entity
- `GET /dev/passkey-notification-sb/v1/entity/{id}` - Retrieve an entity by ID

### Health & Monitoring

- `GET /tasks/ok` - Health check endpoint
- `GET /tasks/config` - Configuration information

## Authentication


All API endpoints require OAuth2 authentication with appropriate scopes:
- `ADMIN` - Required for write operations
- `READ_ONLY` - Required for read operations

## Documentation Structure


- [Architecture](./ARCHITECTURE.md) - System architecture and design patterns
- [API Reference](./API_REFERENCE.md) - Detailed API documentation
- [Domain Model](./DOMAIN_MODEL.md) - Data models and business entities
- [Technical Details](./TECHNICAL_DETAILS.md) - Implementation specifics
- [Deployment](./DEPLOYMENT.md) - Deployment and infrastructure guide
- [Development](./DEVELOPMENT.md) - Development setup and guidelines

## Technology Stack


- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Database**: Oracle Database
- **ORM**: MyBatis
- **Security**: Spring Security with OAuth2
- **Build Tool**: Maven
- **Containerization**: Docker
- **Infrastructure**: AWS CDK
- **Monitoring**: Micrometer, Spring Boot Actuator

## Support


For questions or issues, please contact the Passkey team or create an issue in the repository.
