# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK 17 or Oracle JDK 17
- **Maven 3.6+**: Build tool for Java projects
- **Node.js 18+**: Required for monorepo tooling
- **pnpm**: Package manager for Node.js dependencies
- **Docker**: For local database and containerization
- **Git**: Version control
- **IntelliJ IDEA** (recommended) or VS Code

### Optional Tools
- **Oracle SQL Developer**: Database management
- **Postman**: API testing
- **Docker Compose**: Multi-container orchestration
- **asdf**: Version manager for multiple runtime versions

## Local Setup

### 1. Environment Setup

#### Install asdf and Required Versions
```bash
# Install asdf (if not already installed)
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.13.1

# Add to shell profile
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc
echo '. ~/.asdf/completions/asdf.bash' >> ~/.bashrc

# Install plugins
asdf plugin add java
asdf plugin add nodejs
asdf plugin add maven

# Install versions (from .tool-versions file)
asdf install
```

#### Verify Installation
```bash
java --version    # Should show Java 17
mvn --version     # Should show Maven 3.6+
node --version    # Should show Node 18+
pnpm --version    # Should show pnpm latest
```

### 2. Repository Setup

#### Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-admin-sb.git
cd passkey-admin-sb
```

#### Install Dependencies
```bash
# Install Node.js dependencies for monorepo tooling
pnpm install

# Navigate to service directory
cd packages/passkey-admin-service/service

# Install Maven dependencies
mvn dependency:resolve
```

### 3. Database Setup

#### Option A: Local Oracle Database (Docker)
```bash
# Create docker-compose.yml for Oracle
cat > docker-compose.yml << EOF
version: '3.8'
services:
  oracle-db:
    image: container-registry.oracle.com/database/express:21.3.0-xe
    environment:
      - ORACLE_PWD=password123
      - ORACLE_CHARACTERSET=AL32UTF8
    ports:
      - "1521:1521"
      - "5500:5500"
    volumes:
      - oracle-data:/opt/oracle/oradata
    shm_size: 1g

volumes:
  oracle-data:
EOF

# Start Oracle database
docker-compose up -d oracle-db

# Wait for database to be ready (may take 2-3 minutes)
docker-compose logs -f oracle-db
```

#### Option B: Connect to Shared Development Database
```bash
# Update configs/dev.yaml with shared database connection
spring:
  datasource:
    url: jdbc:oracle:thin:@dev-oracle.cvent.org:1521:DEVDB
    username: passkey_admin_dev
    password: ${DEV_DB_PASSWORD}
```

### 4. Configuration Setup

#### Create Local Configuration
```bash
# Copy template configuration
cp configs/template.yaml configs/local.yaml

# Edit local configuration
cat > configs/local.yaml << EOF
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521:XE
    username: system
    password: password123
    
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: validate
      
logging:
  level:
    com.cvent.passkeyadminservice: DEBUG
    org.springframework.security: DEBUG
    org.springframework.web: DEBUG

management:
  endpoints:
    web:
      exposure:
        include: "*"
EOF
```

#### Set Environment Variables
```bash
# Create .env file for local development
cat > .env << EOF
SPRING_PROFILES_ACTIVE=local
DATABASE_URL=jdbc:oracle:thin:@localhost:1521:XE
DATABASE_USERNAME=system
DATABASE_PASSWORD=password123
OAUTH_CLIENT_ID=local-client-id
OAUTH_CLIENT_SECRET=local-client-secret
EOF

# Source environment variables
source .env
```

## Running the Service

### Method 1: Maven Spring Boot Plugin
```bash
cd packages/passkey-admin-service/service

# Run with local configuration
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=configs/local.yaml"

# Or with environment variables
mvn spring-boot:run
```

### Method 2: IntelliJ IDEA
1. **Import Project**: Open the root directory in IntelliJ
2. **Configure Run Configuration**:
   - Main class: `com.cvent.passkeyadminservice.PasskeyAdminServiceApplication`
   - VM options: `-Dspring.config.location=configs/local.yaml`
   - Working directory: `packages/passkey-admin-service/service`
   - Environment variables: Set DATABASE_URL, etc.
3. **Run**: Click the play button or use Ctrl+Shift+F10

### Method 3: Docker
```bash
# Build Docker image
docker build -t passkey-admin-service:local .

# Run container
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=local \
  -e DATABASE_URL=jdbc:oracle:thin:@host.docker.internal:1521:XE \
  -e DATABASE_USERNAME=system \
  -e DATABASE_PASSWORD=password123 \
  passkey-admin-service:local
```

### Verify Service is Running
```bash
# Health check
curl http://localhost:8080/actuator/health

# API test
curl http://localhost:8080/passkey-admin/v1/email-types

# Swagger UI (if enabled)
open http://localhost:8080/swagger-ui.html
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
cd packages/passkey-admin-service/service
mvn test

# Run specific test class
mvn test -Dtest=PasskeyContactServiceTest

# Run with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests
```bash
# Navigate to integration test module
cd packages/passkey-admin-service/it

# Install dependencies
pnpm install

# Run integration tests
pnpm test:it

# Run specific test suite
pnpm test:it -- --grep "Contact API"
```

### Test Configuration
**Unit Test Configuration** (`src/test/resources/application-test.yml`):
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 
    
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true

logging:
  level:
    com.cvent.passkeyadminservice: DEBUG
```

## Code Structure

### Package Organization
```
com.cvent.passkeyadminservice/
├── controllers/          # REST API controllers
│   ├── PasskeyContactController.java
│   ├── AnalyticsController.java
│   ├── GdprController.java
│   └── EmailTypeController.java
├── service/             # Business logic services
│   ├── PasskeyContactService.java
│   └── AnalyticsService.java
├── repositories/        # JPA repositories
│   ├── ContactRepository.java
│   └── UserIdentityRepository.java
├── dao/                # MyBatis data access
│   └── mappers/        # MyBatis mapper interfaces
├── entities/           # JPA entity classes
│   ├── Contact.java
│   ├── UserIdentity.java
│   └── EmailType.java
├── mappers/            # MapStruct object mappers
│   └── ContactMapper.java
├── validators/         # Custom validation logic
│   └── PasskeyContactValidator.java
├── exception/          # Exception handling
│   └── GlobalExceptionHandler.java
├── health/             # Custom health indicators
│   └── DatabaseHealthIndicator.java
├── common/             # Common utilities and constants
├── util/               # Utility classes
└── PasskeyAdminServiceApplication.java
```

### Coding Standards

#### Java Code Style
- **Google Java Style Guide**: Follow Google's Java formatting rules
- **Line Length**: Maximum 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Imports**: Organize imports, no wildcard imports
- **Naming**: CamelCase for methods/variables, PascalCase for classes

#### Code Quality Rules
```java
// Good: Clear method names and proper error handling
@Service
@RequiredArgsConstructor
public class PasskeyContactService {
    
    private final ContactRepository contactRepository;
    private final ContactValidator contactValidator;
    
    public Contact createContact(Contact contact) {
        contactValidator.validate(contact);
        return contactRepository.save(contact);
    }
}

// Good: Proper exception handling
@RestController
@RequestMapping("/passkey-admin/v1")
public class PasskeyContactController {
    
    @PostMapping("/contacts")
    public ResponseEntity<Contact> createContact(@Valid @RequestBody Contact contact) {
        try {
            Contact created = contactService.createContact(contact);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
```

#### Documentation Standards
```java
/**
 * Service for managing Passkey contacts.
 * 
 * <p>This service provides operations for creating, updating, and retrieving
 * contact information within the Passkey platform. All operations include
 * proper validation and audit logging.
 * 
 * @author Maurya Team
 * @since 1.0.0
 */
@Service
public class PasskeyContactService {
    
    /**
     * Creates a new contact in the system.
     * 
     * @param contact the contact information to create
     * @return the created contact with generated ID
     * @throws ValidationException if contact data is invalid
     * @throws DuplicateEmailException if email already exists
     */
    public Contact createContact(Contact contact) {
        // Implementation
    }
}
```

## Common Development Tasks

### Adding a New REST Endpoint

#### 1. Create Controller Method
```java
@RestController
@RequestMapping("/passkey-admin/v1")
public class PasskeyContactController {
    
    @GetMapping("/contacts/{contactId}")
    public ResponseEntity<Contact> getContact(@PathVariable Long contactId) {
        Contact contact = contactService.getContactById(contactId);
        if (contact == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(contact);
    }
}
```

#### 2. Implement Service Method
```java
@Service
public class PasskeyContactService {
    
    public Contact getContactById(Long contactId) {
        return contactRepository.findById(contactId).orElse(null);
    }
}
```

#### 3. Add Repository Method (if needed)
```java
@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    
    Optional<Contact> findByEmailAddress(String emailAddress);
    
    @Query("SELECT c FROM Contact c WHERE c.contactStatus.isActive = true")
    List<Contact> findActiveContacts();
}
```

#### 4. Write Tests
```java
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PasskeyContactControllerTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void getContact_ExistingId_ReturnsContact() {
        // Given
        Long contactId = 1L;
        
        // When
        ResponseEntity<Contact> response = restTemplate.getForEntity(
            "/passkey-admin/v1/contacts/" + contactId, Contact.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }
}
```

### Adding Database Migration

#### 1. Create Migration Script
```sql
-- V1.1__Add_contact_preferences_table.sql
CREATE TABLE contact_preferences (
    preference_id NUMBER(19) PRIMARY KEY,
    contact_id NUMBER(19) NOT NULL,
    preference_type VARCHAR2(50) NOT NULL,
    preference_value VARCHAR2(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_preferences_contact 
        FOREIGN KEY (contact_id) REFERENCES contacts(contact_id)
);

CREATE INDEX idx_contact_preferences_contact_id 
    ON contact_preferences(contact_id);
```

#### 2. Create JPA Entity
```java
@Entity
@Table(name = "contact_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactPreference {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "contact_pref_seq")
    @SequenceGenerator(name = "contact_pref_seq", sequenceName = "contact_pref_seq")
    @Column(name = "preference_id")
    private Long preferenceId;
    
    @Column(name = "contact_id", nullable = false)
    private Long contactId;
    
    @Column(name = "preference_type", nullable = false)
    private String preferenceType;
    
    @Column(name = "preference_value")
    private String preferenceValue;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id", insertable = false, updatable = false)
    private Contact contact;
}
```

### Debugging Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
docker-compose ps oracle-db

# View database logs
docker-compose logs oracle-db

# Connect to database directly
sqlplus system/password123@localhost:1521/XE
```

#### Application Startup Issues
```bash
# Check for port conflicts
lsof -i :8080

# View detailed startup logs
mvn spring-boot:run -Dlogging.level.org.springframework=DEBUG

# Check configuration
mvn spring-boot:run -Dspring.config.location=configs/local.yaml -Ddebug
```

#### Test Failures
```bash
# Run tests with detailed output
mvn test -Dtest=FailingTest -Dmaven.surefire.debug

# Check test database state
# Add @Sql annotations to set up test data
@Sql("/test-data/contacts.sql")
@Test
void testContactCreation() {
    // Test implementation
}
```

## IDE Configuration

### IntelliJ IDEA Setup

#### 1. Import Project
- File → Open → Select root directory
- Choose "Import project from external model" → Maven
- Select appropriate SDK (Java 17)

#### 2. Configure Code Style
- File → Settings → Editor → Code Style → Java
- Import Google Java Style: https://github.com/google/styleguide/blob/gh-pages/intellij-java-google-style.xml

#### 3. Install Useful Plugins
- **Lombok Plugin**: For @Data, @Builder annotations
- **MapStruct Support**: For MapStruct mapper generation
- **SonarLint**: Real-time code quality feedback
- **CheckStyle-IDEA**: Code style validation

#### 4. Run Configurations
Create run configurations for:
- **Main Application**: Spring Boot application
- **Unit Tests**: JUnit test runner
- **Integration Tests**: Custom test configuration
- **Database**: Oracle database connection

### VS Code Setup

#### 1. Install Extensions
```bash
# Java extensions
code --install-extension vscjava.vscode-java-pack
code --install-extension redhat.java
code --install-extension vscjava.vscode-spring-boot-dashboard

# Additional tools
code --install-extension ms-vscode.vscode-json
code --install-extension redhat.vscode-yaml
```

#### 2. Configure Settings
```json
{
  "java.home": "/path/to/java17",
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "/path/to/java17"
    }
  ],
  "spring-boot.ls.java.home": "/path/to/java17"
}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Port 8080 already in use"
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different port
mvn spring-boot:run -Dserver.port=8081
```

#### Issue: "Database connection timeout"
```bash
# Check Oracle container status
docker-compose ps

# Restart Oracle container
docker-compose restart oracle-db

# Check Oracle logs
docker-compose logs oracle-db
```

#### Issue: "Maven dependencies not resolving"
```bash
# Clear Maven cache
mvn dependency:purge-local-repository

# Reimport dependencies
mvn dependency:resolve

# Force update snapshots
mvn clean install -U
```

#### Issue: "Tests failing with database errors"
```bash
# Check test database configuration
cat src/test/resources/application-test.yml

# Run tests with H2 in-memory database
mvn test -Dspring.profiles.active=test

# Reset test database
mvn clean test
```

### Getting Help

- **Team Slack**: `#passkey-maurya-alerts`
- **Documentation**: Check other documentation files in this directory
- **Cvent Internal Wiki**: Search for Passkey platform documentation
- **Code Reviews**: Create pull requests for code review and feedback

## Additional Resources

## Quick Start


### Prerequisites
- Java 17 or higher
- Maven 3.6+
- Oracle Database access
- Node.js 18+ (for monorepo tooling)
- pnpm package manager

### Local Development Setup

1. **Install tools**:
   ```bash
   asdf install
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Navigate to service directory**:
   ```bash
   cd packages/passkey-admin-service/service
   ```

4. **Run the service**:
   ```bash
   mvn spring-boot:run
   ```

   Or use the provided configuration in IntelliJ IDEA.

### Running Tests

**Unit Tests**:
```bash
pnpm test
```

**Integration Tests**:
```bash
cd packages/passkey-admin-service/it
pnpm test:it
```

## API Access


- **Local Development**: `http://localhost:8080`
- **Base Path**: `/passkey-admin/v1`
- **Health Check**: `/actuator/health`
- **API Documentation**: Available in [Backstage](https://backstage.core.cvent.org/catalog/default/api/passkey-admin-service)

## Environment Configuration


The service supports multiple environments:
- **Development**: `configs/dev.yaml`
- **CT50**: Customer testing environment
- **PR50**: Production environment

## Monitoring and Observability


- **Datadog Logs**: [View Logs](https://cvent.datadoghq.com/logs?query=env%3Apr50+service%3Apasskey-admin-service)
- **Jenkins CI/CD**: [Build Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-admin-sb/)
- **Octopus Deploy**: [Deployment Dashboard](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-admin-service/deployments)

## Support


- **Team**: Maurya team
- **Slack Channel**: `#passkey-maurya-alerts`
- **Platform**: Passkey for Hotels
- **Service Registry ID**: `96ca2392-7aaf-5e38-b9c8-168dd3753a97`
