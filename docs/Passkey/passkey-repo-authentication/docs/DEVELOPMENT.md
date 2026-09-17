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
- **DBeaver**: Database client for Oracle
- **Docker Compose**: Multi-container development environment

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
   
   # Or download from https://maven.apache.org/
   ```

3. **Configure Maven for Cvent Nexus**:
   ```xml
   <!-- ~/.m2/settings.xml -->
   <settings>
     <servers>
       <server>
         <id>cvent-nexus</id>
         <username>your-username</username>
         <password>your-password</password>
       </server>
     </servers>
     <mirrors>
       <mirror>
         <id>cvent-nexus</id>
         <mirrorOf>*</mirrorOf>
         <url>https://nexus.cvent.net/repository/maven-public/</url>
       </mirror>
     </mirrors>
   </settings>
   ```

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-authentication.git
cd passkey-authentication
```

### 2. Build Project

```bash
# Clean build
mvn clean package

# Skip tests for faster build
mvn clean package -DskipTests

# Build with release profile
mvn clean package -Prelease
```

### 3. Database Setup

#### Option A: Local Oracle Database
```bash
# Using Docker
docker run -d \
  --name oracle-db \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  container-registry.oracle.com/database/express:21.3.0-xe

# Create schema
sqlplus sys/password@localhost:1521/XE as sysdba
CREATE USER passkey_dev IDENTIFIED BY password;
GRANT CONNECT, RESOURCE TO passkey_dev;
```

#### Option B: Connect to Development Database
Update `passkey-authentication-service/configs/dev.yaml`:
```yaml
database:
  url: jdbc:oracle:thin:@dev-db.cvent.net:1521:PASSKEY
  user: your-dev-username
  password: your-dev-password
```

### 4. Configuration

Create local configuration file:
```bash
cp passkey-authentication-service/configs/dev.yaml \
   passkey-authentication-service/configs/local.yaml
```

Update `local.yaml` with your local settings:
```yaml
database:
  url: jdbc:oracle:thin:@localhost:1521:XE
  user: passkey_dev
  password: password

jwt:
  secret: local-development-secret-key-change-in-production
  
authService:
  url: https://auth-service.dev.cvent.org
  
logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.authentication: DEBUG
```

## Running the Service

### Command Line

```bash
cd passkey-authentication-service

# Run with local configuration
java -jar target/passkey-authentication-service-*.jar server configs/local.yaml

# Run with development configuration
java -jar target/passkey-authentication-service-*.jar server configs/dev.yaml

# Run with debug logging
java -jar -Dlogback.configurationFile=configs/dev.logback.xml \
     target/passkey-authentication-service-*.jar server configs/local.yaml
```

### IntelliJ IDEA Configuration

1. **Create Run Configuration**:
   - Main Class: `com.cvent.passkey.authentication.PasskeyAuthenticationServiceApplication`
   - Program Arguments: `server passkey-authentication-service/configs/local.yaml`
   - VM Options: `-Dlogback.configurationFile=passkey-authentication-service/configs/dev.logback.xml`
   - Working Directory: `$PROJECT_DIR$`
   - Use Classpath of Module: `passkey-authentication-service`

2. **Enable Hot Reload**:
   - Install JRebel plugin (optional)
   - Enable "Build project automatically"
   - Use "Update classes and resources" for faster development

### Docker Development

```bash
# Build Docker image
docker build -t passkey-authentication:dev .

# Run with Docker
docker run -p 8080:8080 -p 8081:8081 \
  -e DB_HOST=host.docker.internal \
  -e DB_USERNAME=passkey_dev \
  -e DB_PASSWORD=password \
  passkey-authentication:dev
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=JwtServiceTest

# Run tests with coverage
mvn test jacoco:report -Pcoverage

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests

```bash
# Run integration tests against dev environment
mvn verify -Prun-it -Denv.IT_ENVIRONMENT=dev -Dkarate.config.dir=test_configs

# Run specific feature
mvn verify -Prun-it -Dkarate.options="--tags @jwt" -Denv.IT_ENVIRONMENT=dev

# Run tests in IntelliJ
# 1. Right-click on feature file
# 2. Select "Run Feature"
# 3. Add VM options: -Dkarate.env=dev -Dkarate.config.dir=test_configs
```

### Test Configuration

Create `test_configs/karate-config-dev.js`:
```javascript
function fn() {
  var config = {
    baseUrl: 'http://localhost:8080',
    apiKey: 'your-test-api-key',
    timeout: 30000
  };
  
  return config;
}
```

## Code Structure

### Package Organization

```
com.cvent.passkey.authentication/
├── resources/              # JAX-RS REST endpoints
│   ├── JwtResource.java
│   ├── SessionHandleResource.java
│   └── ...
├── service/               # Business logic layer
│   ├── JwtService.java
│   ├── AuthenticationService.java
│   └── ...
├── dao/                   # Data access layer
│   ├── UserDao.java
│   ├── SessionDao.java
│   └── ...
├── model/                 # Domain models
│   ├── User.java
│   ├── Session.java
│   └── ...
├── config/                # Configuration classes
│   └── PasskeyAuthenticationServiceConfiguration.java
└── PasskeyAuthenticationServiceApplication.java
```

### Module Dependencies

```
passkey-authentication-service
├── depends on: passkey-authentication-api
├── depends on: passkey-authentication-data-access
├── depends on: passkey-authentication-shared
└── provides: REST API endpoints

passkey-authentication-java-client
├── depends on: passkey-authentication-api
└── provides: Java client library

passkey-authentication-integration-test
├── depends on: passkey-authentication-api
└── provides: Integration tests
```

## Coding Standards

### Java Style Guide

- **Formatting**: Use Google Java Style Guide
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Documentation**: JavaDoc for public APIs
- **Imports**: No wildcard imports, organize imports

### Code Quality Tools

```bash
# Run Checkstyle
mvn checkstyle:check

# Run SpotBugs
mvn spotbugs:check

# Run PMD
mvn pmd:check

# Run all quality checks
mvn verify -Pquality
```

### Example Code Style

```java
/**
 * Service for managing JWT tokens.
 */
@Singleton
public class JwtService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(JwtService.class);
    private static final Duration DEFAULT_EXPIRATION = Duration.ofHours(24);
    
    private final JwtConfiguration config;
    private final SecretKey signingKey;
    
    @Inject
    public JwtService(JwtConfiguration config) {
        this.config = requireNonNull(config, "config cannot be null");
        this.signingKey = Keys.hmacShaKeyFor(config.getSecret().getBytes());
    }
    
    /**
     * Creates a JWT token from the given payload.
     *
     * @param payload the claims to include in the token
     * @return the signed JWT token
     * @throws IllegalArgumentException if payload is null or empty
     */
    public String create(Map<String, Object> payload) {
        requireNonNull(payload, "payload cannot be null");
        checkArgument(!payload.isEmpty(), "payload cannot be empty");
        
        Instant now = Instant.now();
        Instant expiration = now.plus(DEFAULT_EXPIRATION);
        
        return Jwts.builder()
            .setClaims(payload)
            .setIssuer("passkey-authentication-service")
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(expiration))
            .signWith(signingKey)
            .compact();
    }
}
```

## Common Development Tasks

### Adding a New Endpoint

1. **Define API Contract** (in `passkey-authentication-api`):
   ```java
   @JsonDeserialize(as = ImmutableCreateUserRequest.class)
   public interface CreateUserRequest {
       String getEmail();
       String getFirstName();
       String getLastName();
   }
   ```

2. **Implement Resource** (in `passkey-authentication-service`):
   ```java
   @Path("/passkey-authentication/v1/users")
   @Consumes(MediaType.APPLICATION_JSON)
   @Produces(MediaType.APPLICATION_JSON)
   public class UserResource {
       
       @POST
       public Response createUser(@Authority(methods = AuthMethod.API_KEY, roles = "USER_CREATE") GrantedAPIKey apiKey,
                                  @Valid CreateUserRequest request) {
           // Implementation
       }
   }
   ```

3. **Add Service Logic**:
   ```java
   @Singleton
   public class UserService {
       public User createUser(CreateUserRequest request) {
           // Business logic
       }
   }
   ```

4. **Write Tests**:
   ```java
   @Test
   public void testCreateUser() {
       // Unit test
   }
   ```

5. **Add Integration Test**:
   ```gherkin
   Feature: User Management
   
   Scenario: Create new user
     Given I have a valid API key with USER_CREATE role
     When I POST to /passkey-authentication/v1/users
     Then the response status should be 201
   ```

### Adding Database Migration

1. **Create Migration File**:
   ```sql
   -- src/main/resources/db/migration/V1.2.2__Add_user_preferences.sql
   ALTER TABLE USERS ADD (
       PREFERENCES CLOB,
       TIMEZONE VARCHAR2(50) DEFAULT 'UTC'
   );
   
   CREATE INDEX IDX_USERS_TIMEZONE ON USERS(TIMEZONE);
   ```

2. **Update Entity**:
   ```java
   @Entity
   @Table(name = "USERS")
   public class User {
       @Column(name = "PREFERENCES")
       private String preferences;
       
       @Column(name = "TIMEZONE")
       private String timezone = "UTC";
   }
   ```

### Debugging Tips

1. **Enable Debug Logging**:
   ```yaml
   logging:
     loggers:
       com.cvent.passkey.authentication: DEBUG
       org.eclipse.jetty: INFO
   ```

2. **Use Health Check Endpoints**:
   ```bash
   # Check service health
   curl http://localhost:8081/healthcheck
   
   # Check specific health checks
   curl http://localhost:8081/healthcheck/database
   ```

3. **Monitor Metrics**:
   ```bash
   # View metrics
   curl http://localhost:8081/metrics
   
   # View specific metric
   curl http://localhost:8081/metrics/jvm.memory.used
   ```

## Contributing

### Git Workflow

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/add-user-preferences
   ```

2. **Make Changes and Commit**:
   ```bash
   git add .
   git commit -m "Add user preferences functionality"
   ```

3. **Push and Create PR**:
   ```bash
   git push origin feature/add-user-preferences
   # Create pull request in GitHub
   ```

### Pull Request Guidelines

- **Title**: Clear, descriptive title
- **Description**: Explain what changes were made and why
- **Tests**: Include unit and integration tests
- **Documentation**: Update relevant documentation
- **Code Review**: Address all review comments

### Commit Message Format

```
type(scope): short description

Longer description if needed

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clear Maven cache
   mvn dependency:purge-local-repository
   
   # Rebuild from scratch
   mvn clean install -U
   ```

2. **Database Connection Issues**:
   ```bash
   # Test database connectivity
   telnet db-host 1521
   
   # Check Oracle service status
   lsnrctl status
   ```

3. **Port Conflicts**:
   ```bash
   # Find process using port
   lsof -i :8080
   
   # Kill process
   kill -9 <PID>
   ```

4. **Memory Issues**:
   ```bash
   # Increase JVM memory
   export MAVEN_OPTS="-Xmx2g -XX:MaxPermSize=512m"
   
   # Run with more memory
   java -Xmx2g -jar service.jar server configs/local.yaml
   ```

### Getting Help

- **Team Slack**: `#passkey-meeseeks-box`
- **Documentation**: [Wiki](https://wiki.cvent.com/display/PASKY/Authentication+Microservice)
- **Code Reviews**: Tag `@passkey-team` in pull requests
- **Issues**: Create GitHub issues for bugs or feature requests

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-authentication.git
   cd passkey-authentication
   ```

2. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-authentication-service
   java -jar target/passkey-authentication-service-1.2.1-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Run integration tests**:
   ```bash
   mvn -Prun-it -Denv.IT_ENVIRONMENT=dev -Dkarate.config.dir=test_configs verify
   ```

### IntelliJ Configuration

| Property         | Value                                                                      |
|------------------|----------------------------------------------------------------------------|
| SDK              | Java 21 SDK of `passkey-authentication-service` module                     |
| Module Classpath | `-cp passkey-authentication-service`                                       |
| Main Class       | `com.cvent.passkey.authentication.PasskeyAuthenticationServiceApplication` |
| Arguments        | `server passkey-authentication-service/configs/dev.yaml`                   |

## Service Ownership


| Role      | Team          | Slack Channel                |
|-----------|---------------|------------------------------|
| Primary   | Meeseeksbox   | `#passkey-meeseeks-box`      |
| Secondary | Cherrypickers | `#passkey-cherry-pickers`    |

## Useful Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-authentication)
- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-authentication-service)
- [Admin Portal](https://admin.core.cvent.org/serviceid/1590692d-65aa-4790-bbdc-8cc1020a6a00)
- [Wiki Documentation](https://wiki.cvent.com/display/PASKY/Authentication+Microservice)
