# Development Guide

## Prerequisites

### Required Software
- **Java**: OpenJDK 17 or higher
  ```bash
  # Verify installation
  java -version
  # Should show: openjdk version "17.0.x" or higher
  ```

- **Maven**: 3.8+ for Java builds
  ```bash
  # Verify installation
  mvn -version
  # Should show: Apache Maven 3.8.x or higher
  ```

- **Node.js**: 18+ for build tooling and monorepo management
  ```bash
  # Verify installation
  node --version
  # Should show: v18.x.x or higher
  ```

- **pnpm**: Package manager for monorepo
  ```bash
  # Install pnpm globally
  npm install -g pnpm
  
  # Verify installation
  pnpm --version
  ```

- **Docker**: For containerized development and testing
  ```bash
  # Verify installation
  docker --version
  docker-compose --version
  ```

### Development Tools
- **IDE**: IntelliJ IDEA (recommended) or Eclipse with Spring Tools
- **Database Client**: DBeaver, SQL Developer, or similar for Oracle
- **API Testing**: Postman, Insomnia, or curl
- **Git**: Version control (configured with SSH keys)

### Access Requirements
- **VPN**: Cvent VPN access for internal services
- **GitHub**: Access to cvent-internal organization
- **AWS**: Development account access (optional for local development)
- **Database**: Development database credentials

## Local Setup

### 1. Clone Repository
```bash
# Clone the repository
git clone git@github.com:cvent-internal/passkey-event-sb.git
cd passkey-event-sb

# Verify repository structure
ls -la
# Should show: packages/, pnpm-workspace.yaml, package.json, etc.
```

### 2. Install Dependencies
```bash
# Install all dependencies (both npm and Maven)
pnpm install

# This will:
# - Install npm dependencies for build tooling
# - Download Maven dependencies for Java modules
# - Set up pre-commit hooks
# - Configure development environment
```

### 3. Database Setup

#### Option A: Local Oracle Database (Recommended for full development)
```bash
# Using Docker Compose for local Oracle
docker-compose -f docker/docker-compose.dev.yml up -d oracle

# Wait for database to be ready (may take 2-3 minutes)
docker logs -f passkey-event-oracle

# Run database migrations
cd packages/passkey-event-sb/service
mvn flyway:migrate -Dspring.profiles.active=dev
```

#### Option B: Connect to Development Database
```bash
# Copy example configuration
cp packages/passkey-event-sb/service/configs/dev.yaml.example \
   packages/passkey-event-sb/service/configs/dev.yaml

# Edit dev.yaml with development database credentials
# Contact team for development database access details
```

### 4. Configuration Setup
```bash
# Copy environment configuration
cp .env.example .env

# Edit .env file with your local settings
# Most defaults should work for local development
```

### 5. Build Project
```bash
# Build all modules
pnpm build

# This will:
# - Compile Java code
# - Run code generation (MapStruct, Lombok)
# - Package JAR files
# - Run basic validation
```

### 6. Run Application
```bash
# Option 1: Using pnpm script (recommended)
pnpm run-local

# Option 2: Using Maven directly
cd packages/passkey-event-sb/service
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Option 3: Using Docker
docker-compose -f docker/docker-compose.dev.yml up passkey-event
```

### 7. Verify Setup
```bash
# Check application health
curl http://localhost:8080/actuator/health

# Expected response:
# {"status":"UP","components":{"db":{"status":"UP"}}}

# Test API endpoint
curl -H "Authorization: Bearer test-token" \
     http://localhost:8080/passkey-event/v5/events/1
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Run tests for specific module
cd packages/passkey-event-sb/service
mvn test

# Run tests with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests
```bash
# Run integration tests (requires test database)
pnpm ci:test

# Run specific integration test
cd packages/passkey-event-sb/service
mvn verify -Dtest=PasskeyEventControllerIntegrationTest
```

### End-to-End Tests
```bash
# Start application in test mode
pnpm run-local --profile=test

# Run E2E tests in another terminal
cd packages/passkey-event-sb/it
mvn verify -Dspring.profiles.active=e2e
```

## Code Structure

### Project Layout
```
passkey-event-sb/
├── packages/
│   └── passkey-event-sb/
│       ├── parent/                 # Maven parent POM
│       ├── model/                  # Shared data models
│       ├── java-client/           # Client library
│       ├── service/               # Main Spring Boot app
│       │   ├── src/
│       │   │   ├── main/
│       │   │   │   ├── java/
│       │   │   │   │   └── com/cvent/passkeyeventsb/
│       │   │   │   │       ├── controllers/    # REST controllers
│       │   │   │   │       ├── service/        # Business logic
│       │   │   │   │       ├── dao/            # Data access
│       │   │   │   │       ├── dbentities/     # Database entities
│       │   │   │   │       ├── mappers/        # MapStruct mappers
│       │   │   │   │       ├── auth/           # Security config
│       │   │   │   │       ├── health/         # Health checks
│       │   │   │   │       └── utils/          # Utilities
│       │   │   │   └── resources/
│       │   │   │       ├── mappers/            # MyBatis XML
│       │   │   │       ├── application.yaml    # Default config
│       │   │   │       └── logback-spring.xml  # Logging config
│       │   │   └── test/                       # Test code
│       │   ├── configs/                        # Environment configs
│       │   └── pom.xml
│       ├── it/                    # Integration tests
│       └── infra/                 # Infrastructure code
├── docs/                          # Documentation
├── docker/                        # Docker configurations
├── .github/                       # GitHub workflows
├── package.json                   # Root package.json
├── pnpm-workspace.yaml           # pnpm workspace config
└── README.md
```

### Package Organization
- **Controllers**: REST API endpoints and request handling
- **Services**: Business logic and orchestration
- **DAO/Repositories**: Data access layer
- **Entities**: Database entity mappings
- **Models**: DTOs and domain objects
- **Mappers**: Object mapping between layers
- **Configuration**: Spring configuration classes
- **Utils**: Shared utility functions

## Coding Standards

### Java Code Style
```java
// Use Lombok for boilerplate reduction
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    private Long id;
    private String name;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}

// Use MapStruct for object mapping
@Mapper(componentModel = "spring")
public interface EventMapper {
    EventDto toDto(Event event);
    Event toEntity(EventDto dto);
}

// Use proper exception handling
@RestController
public class EventController {
    
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEvent(@PathVariable Long id) {
        try {
            Event event = eventService.findById(id);
            return ResponseEntity.ok(event);
        } catch (EventNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}
```

### Code Quality Rules
- **Checkstyle**: Enforced code formatting and style
- **SonarQube**: Code quality and security analysis
- **Test Coverage**: Minimum 80% line coverage required
- **Documentation**: JavaDoc for public APIs
- **Naming**: Clear, descriptive names for classes and methods

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/add-marketing-items-api

# Make changes and commit
git add .
git commit -m "feat: add marketing items API endpoint

- Add GET /events/{id}/marketing-items endpoint
- Implement MarketingItemService
- Add integration tests
- Update API documentation"

# Push and create pull request
git push origin feature/add-marketing-items-api
```

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Common Development Tasks

### Adding a New API Endpoint

1. **Create Controller Method**:
```java
@RestController
@RequestMapping("/passkey-event/v5/events")
public class PasskeyEventController {
    
    @GetMapping("/{eventId}/new-endpoint")
    public ResponseEntity<NewResponse> getNewData(@PathVariable Long eventId) {
        // Implementation
    }
}
```

2. **Add Service Method**:
```java
@Service
public class PasskeyEventService {
    
    public NewResponse getNewData(Long eventId) {
        // Business logic
    }
}
```

3. **Create DAO Method**:
```java
@Repository
public interface NewDataRepository {
    List<NewData> findByEventId(Long eventId);
}
```

4. **Add Tests**:
```java
@Test
void shouldReturnNewData() {
    // Test implementation
}
```

### Adding Database Migration
```sql
-- V1.1.0__Add_new_table.sql
CREATE TABLE NEW_TABLE (
    ID NUMBER(19) PRIMARY KEY,
    EVENT_ID NUMBER(19) NOT NULL,
    NAME VARCHAR2(255),
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_NEW_TABLE_EVENT 
        FOREIGN KEY (EVENT_ID) REFERENCES EVENTS(ID)
);

CREATE INDEX IDX_NEW_TABLE_EVENT ON NEW_TABLE(EVENT_ID);
```

### Adding Configuration Property
```yaml
# application.yaml
passkey:
  event:
    new-feature:
      enabled: true
      timeout: 30000
      max-items: 100
```

```java
@ConfigurationProperties(prefix = "passkey.event.new-feature")
@Data
public class NewFeatureProperties {
    private boolean enabled = true;
    private int timeout = 30000;
    private int maxItems = 100;
}
```

### Debugging Common Issues

#### Application Won't Start
```bash
# Check Java version
java -version

# Check for port conflicts
lsof -i :8080

# Check database connectivity
telnet localhost 1521

# Review application logs
tail -f logs/application.log
```

#### Database Connection Issues
```bash
# Test database connection
sqlplus username/password@localhost:1521/XEPDB1

# Check connection pool settings
# Look for HikariCP logs in application output

# Verify database schema
SELECT table_name FROM user_tables;
```

#### Build Failures
```bash
# Clean and rebuild
mvn clean install

# Check for dependency conflicts
mvn dependency:tree

# Update dependencies
mvn versions:display-dependency-updates
```

## IDE Configuration

### IntelliJ IDEA Setup
1. **Import Project**: Open the root directory as a Maven project
2. **Enable Annotation Processing**: Settings → Build → Compiler → Annotation Processors
3. **Install Plugins**:
   - Lombok Plugin
   - MapStruct Support
   - Spring Boot
   - Database Navigator

4. **Code Style**: Import `.editorconfig` settings
5. **Run Configurations**: 
   - Main class: `com.cvent.passkeyeventsb.PasskeyEventSbApplication`
   - VM options: `-Dspring.profiles.active=dev`
   - Program arguments: `--spring.config.location=configs/dev.yaml`

### VS Code Setup
```json
// .vscode/settings.json
{
  "java.configuration.updateBuildConfiguration": "automatic",
  "java.compile.nullAnalysis.mode": "automatic",
  "spring-boot.ls.problem.application-properties.enabled": true,
  "java.format.settings.url": ".editorconfig"
}
```

## Testing Guidelines

### Unit Test Structure
```java
@ExtendWith(MockitoExtension.class)
class EventServiceTest {
    
    @Mock
    private EventRepository eventRepository;
    
    @Mock
    private EventMapper eventMapper;
    
    @InjectMocks
    private EventService eventService;
    
    @Test
    @DisplayName("Should return event when found")
    void shouldReturnEventWhenFound() {
        // Given
        Long eventId = 1L;
        Event event = Event.builder().id(eventId).name("Test Event").build();
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        
        // When
        Event result = eventService.findById(eventId);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(eventId);
        assertThat(result.getName()).isEqualTo("Test Event");
    }
}
```

### Integration Test Structure
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "classpath:application-test.properties")
class EventControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void shouldGetEventInfo() {
        // Given
        Long eventId = 1L;
        
        // When
        ResponseEntity<Event> response = restTemplate.getForEntity(
            "/passkey-event/v5/events/{id}/event-info", 
            Event.class, 
            eventId
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }
}
```

## Performance Optimization

### Local Performance Testing
```bash
# Start application with profiling
java -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=profile.jfr \
     -jar target/passkey-event-*.jar

# Load testing with Apache Bench
ab -n 1000 -c 10 http://localhost:8080/passkey-event/v5/events/1

# Memory analysis
jmap -histo <pid>
jstack <pid>
```

### Database Query Optimization
```java
// Use pagination for large result sets
@Query("SELECT e FROM Event e WHERE e.status = :status")
Page<Event> findByStatus(@Param("status") EventStatus status, Pageable pageable);

// Use projections for limited data
@Query("SELECT new com.cvent.passkeyeventsb.dto.EventSummary(e.id, e.name, e.status) " +
       "FROM Event e WHERE e.organizerId = :organizerId")
List<EventSummary> findEventSummariesByOrganizer(@Param("organizerId") Long organizerId);
```

## Troubleshooting

### Common Issues and Solutions

#### "Port 8080 already in use"
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different port
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

#### "Database connection failed"
```bash
# Check database is running
docker ps | grep oracle

# Check connection parameters
ping database-host

# Test connection manually
sqlplus username/password@host:port/service
```

#### "Maven build fails"
```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Reinstall dependencies
mvn clean install -U

# Skip tests if needed
mvn clean install -DskipTests
```

### Getting Help

- **Team Slack**: #passkey-cherrypickers
- **Documentation**: Internal Cvent developer portal
- **Code Reviews**: GitHub pull requests
- **Architecture Questions**: Team lead or senior developers
- **Infrastructure Issues**: DevOps team via Slack

### Contributing

1. **Fork and Branch**: Create feature branch from `development`
2. **Code**: Follow coding standards and add tests
3. **Test**: Ensure all tests pass locally
4. **Document**: Update documentation if needed
5. **Pull Request**: Create PR with clear description
6. **Review**: Address feedback from code review
7. **Merge**: Squash and merge after approval

## Additional Resources

## Technology Stack


- **Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **Build Tool**: Maven (multi-module project)
- **Database**: Oracle Database with MyBatis ORM
- **Authentication**: Cvent OAuth integration
- **Observability**: Cvent common observability stack
- **Containerization**: Docker with CDF (Cvent Development Framework)

## Quick Start


### Prerequisites
- Java 17 or higher
- Maven 3.6+
- Node.js 18+ (for build tooling)
- pnpm package manager
- Docker (for containerized deployment)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-event-sb.git
   cd passkey-event-sb
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the project**:
   ```bash
   pnpm build
   ```

4. **Run the service locally**:
   ```bash
   pnpm run-local
   ```
   
   Or alternatively:
   ```bash
   cd packages/passkey-event-sb/service
   mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments="--spring.config.location=configs/dev.yaml"
   ```

The service will start on the default Spring Boot port (8080) and be available at `http://localhost:8080`.

## API Endpoints


The service exposes REST endpoints under the `/passkey-event/v5/events` base path:

- `GET /{id}` - Get event status
- `GET /{eventId}/event-info` - Get comprehensive event information
- `GET /{eventId}/marketing-items` - Get marketing items for an event
- `GET /{eventId}/flip-to-settings` - Get FlipTo settings
- `GET /{eventId}/closed-sbg-attendees` - Get closed SBG attendees
- `GET /{eventId}/merchant-account` - Get merchant account information
- `GET /{eventId}/consents` - Get consent information

## Project Dependencies


- **Cvent Auth Service**: Authentication and authorization
- **Oracle Database**: Primary data storage
- **Cvent Common Libraries**: Shared utilities and frameworks
- **Cvent Observability Stack**: Monitoring and logging

## Development Team


- **Owner**: Cherry Pickers team
- **Platform**: Passkey for Planners Housing
- **Slack Channel**: #passkey-cherrypickers

## Support


For questions, issues, or contributions, please reach out to the Cherry Pickers team via:
- Slack: #passkey-cherrypickers
- GitHub Issues: Create an issue in this repository
- Team Email: Contact through Cvent internal channels
