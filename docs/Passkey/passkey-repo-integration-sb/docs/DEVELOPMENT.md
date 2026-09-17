# Development Guide

## Prerequisites

### Required Software

- **Java 17**: OpenJDK 17 or Oracle JDK 17
- **Maven 3.6+**: Build automation and dependency management
- **Node.js 18+**: Required for monorepo tooling
- **pnpm**: Package manager for Node.js dependencies
- **Docker**: For containerization and local database setup
- **Git**: Version control

### Optional Tools

- **IntelliJ IDEA**: Recommended IDE with Spring Boot support
- **Visual Studio Code**: Alternative IDE with Java extensions
- **Oracle SQL Developer**: Database management tool
- **Postman**: API testing tool
- **Docker Compose**: Multi-container application management

### Environment Setup

#### Java Installation
```bash
# Using SDKMAN (recommended)
curl -s "https://get.sdkman.io" | bash
sdk install java 17.0.7-oracle
sdk use java 17.0.7-oracle

# Verify installation
java -version
javac -version
```

#### Node.js and pnpm Installation
```bash
# Using Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install pnpm
npm install -g pnpm

# Verify installation
node --version
pnpm --version
```

#### Docker Installation
```bash
# On macOS using Homebrew
brew install docker docker-compose

# On Ubuntu
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-integration-sb.git
cd passkey-integration-sb
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies for monorepo tooling
pnpm install

# Install Maven dependencies
cd packages/passkey-integration
mvn clean install -DskipTests
```

### 3. Database Setup

#### Option A: Docker Oracle Database
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

# Wait for database to be ready (may take 5-10 minutes)
docker-compose logs -f oracle-db
```

#### Option B: Local Oracle Installation
```bash
# Download Oracle Database Express Edition
# Follow Oracle's installation guide for your platform
# Create database user and schema as needed
```

### 4. Database Schema Setup

```bash
# Connect to Oracle database
sqlplus system/password123@localhost:1521/XEPDB1

# Create user and schema
CREATE USER passkey_user IDENTIFIED BY password123;
GRANT CONNECT, RESOURCE, DBA TO passkey_user;

# Create tables (run from SQL files in db/migration)
@packages/passkey-integration/service/src/main/resources/db/migration/V1__Create_Users_Table.sql
```

### 5. Configuration

Create local development configuration:

```bash
# Copy template configuration
cd packages/passkey-integration/service
cp configs/template.yaml configs/local.yaml
```

Edit `configs/local.yaml`:
```yaml
server:
  port: 8080

spring:
  application:
    name: passkey-integration
  profiles:
    active: local
    
  datasource:
    url: jdbc:oracle:thin:@//localhost:1521/XEPDB1
    username: passkey_user
    password: password123
    driver-class-name: oracle.jdbc.OracleDriver
    
  mybatis:
    mapper-locations: classpath:mappers/*.xml
    type-aliases-package: com.cvent.passkeyintegration.model
    configuration:
      map-underscore-to-camel-case: true

logging:
  level:
    com.cvent.passkeyintegration: DEBUG
    org.springframework.security: DEBUG
    org.mybatis: DEBUG

# Disable OAuth for local development
cvent:
  oauth:
    enabled: false

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env
  endpoint:
    health:
      show-details: always
```

## Running the Application

### Development Mode

```bash
# Navigate to service directory
cd packages/passkey-integration/service

# Run with Maven Spring Boot plugin
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=configs/local.yaml"

# Or run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### IDE Setup

#### IntelliJ IDEA

1. **Import Project**:
   - File → Open → Select `passkey-integration-sb` directory
   - Choose "Import as Maven project"

2. **Configure Run Configuration**:
   - Run → Edit Configurations
   - Add new "Spring Boot" configuration
   - Main class: `com.cvent.passkeyintegration.PasskeyIntegrationApplication`
   - VM options: `-Dspring.config.location=configs/local.yaml`
   - Working directory: `packages/passkey-integration/service`

3. **Enable Annotation Processing**:
   - File → Settings → Build → Compiler → Annotation Processors
   - Check "Enable annotation processing"

#### Visual Studio Code

1. **Install Extensions**:
   - Extension Pack for Java
   - Spring Boot Extension Pack
   - Maven for Java

2. **Configure Launch**:
   Create `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "java",
         "name": "PasskeyIntegrationApplication",
         "request": "launch",
         "mainClass": "com.cvent.passkeyintegration.PasskeyIntegrationApplication",
         "projectName": "passkey-integration",
         "args": "--spring.config.location=configs/local.yaml",
         "cwd": "${workspaceFolder}/packages/passkey-integration/service"
       }
     ]
   }
   ```

### Verify Installation

```bash
# Check application health
curl http://localhost:8080/health

# Test API endpoint (with OAuth disabled)
curl http://localhost:8080/passkey-integration/v1/user/default

# Check actuator endpoints
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/info
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=UserControllerTest

# Run tests with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests

```bash
# Start test database (if using Docker)
docker-compose up -d oracle-db

# Run integration tests
mvn test -Prun-it

# Run integration tests against specific environment
mvn test -Prun-it -Dtest.environment=dev
```

### Test Configuration

Create test-specific configuration in `src/test/resources/application-test.yaml`:

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
    com.cvent.passkeyintegration: DEBUG
    org.springframework.test: DEBUG
```

## Code Structure

### Package Organization

```
com.cvent.passkeyintegration/
├── PasskeyIntegrationApplication.java     # Main application class
├── PasskeyIntegrationConfiguration.java  # Application configuration
├── auth/                                  # Authentication components
│   ├── AuthenticationProvider.java
│   └── SecurityConfiguration.java
├── config/                               # Configuration classes
│   ├── DatabaseConfiguration.java
│   └── WebConfiguration.java
├── controllers/                          # REST controllers
│   ├── UserController.java
│   └── HealthController.java
├── dao/                                  # Data access objects
│   ├── UserDao.java
│   └── mappers/
│       └── UserMapper.xml
├── health/                               # Health check components
│   └── DatabaseHealthIndicator.java
├── model/                                # Domain models
│   ├── User.java
│   └── ResponseEntity.java
└── service/                              # Business logic
    ├── UsersService.java
    └── UsersServiceImpl.java
```

### Coding Standards

#### Java Code Style

Follow Google Java Style Guide with these modifications:

```java
// Class naming: PascalCase
public class UserController {
    
    // Method naming: camelCase
    public ResponseEntity<User> getDefaultUser() {
        // Implementation
    }
    
    // Constants: UPPER_SNAKE_CASE
    private static final String DEFAULT_USER_TYPE = "SYSTEM";
    
    // Variables: camelCase
    private final UsersService usersService;
}
```

#### Spring Boot Conventions

```java
// Controller annotations
@RestController
@RequestMapping("/passkey-integration/v1/user")
public class UserController {
    
    // Service injection via constructor
    private final UsersService usersService;
    
    public UserController(UsersService usersService) {
        this.usersService = usersService;
    }
    
    // Endpoint mapping
    @GetMapping("/default")
    @CventAuthorization(scopes = {"READ_ONLY"})
    public ResponseEntity<User> getDefaultUser() {
        // Implementation
    }
}
```

#### Database Conventions

```java
// Entity naming matches table names
@Entity
@Table(name = "PASSKEY_USERS")
public class User {
    
    @Id
    @Column(name = "USER_ID")
    private String userId;
    
    @Column(name = "USER_TYPE")
    private String userType;
    
    // Getters and setters
}
```

### MyBatis Mapper Configuration

```xml
<!-- UserMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.cvent.passkeyintegration.dao.UserDao">
    
    <select id="getDefaultUser" resultType="User">
        SELECT USER_ID as userId,
               USER_TYPE as userType,
               STATUS as status
        FROM PASSKEY_USERS
        WHERE USER_TYPE = 'DEFAULT'
        AND STATUS = 'ACTIVE'
    </select>
    
</mapper>
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create Controller Method**:
   ```java
   @GetMapping("/users/{id}")
   @CventAuthorization(scopes = {"READ_ONLY"})
   public ResponseEntity<User> getUser(@PathVariable String id) {
       User user = usersService.getUserById(id);
       return ResponseEntity.ok(user);
   }
   ```

2. **Add Service Method**:
   ```java
   public interface UsersService {
       User getUserById(String id);
   }
   
   @Service
   public class UsersServiceImpl implements UsersService {
       public User getUserById(String id) {
           return userDao.findById(id);
       }
   }
   ```

3. **Add DAO Method**:
   ```java
   public interface UserDao {
       User findById(String id);
   }
   ```

4. **Add MyBatis Mapping**:
   ```xml
   <select id="findById" parameterType="String" resultType="User">
       SELECT * FROM PASSKEY_USERS WHERE USER_ID = #{id}
   </select>
   ```

5. **Write Tests**:
   ```java
   @Test
   public void testGetUser() {
       // Given
       String userId = "test-user-id";
       
       // When
       ResponseEntity<User> response = userController.getUser(userId);
       
       // Then
       assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
       assertThat(response.getBody().getUserId()).isEqualTo(userId);
   }
   ```

### Adding Database Migration

1. **Create Migration File**:
   ```sql
   -- V2__Add_User_Email_Column.sql
   ALTER TABLE PASSKEY_USERS ADD (
       EMAIL VARCHAR2(255),
       EMAIL_VERIFIED NUMBER(1) DEFAULT 0
   );
   
   CREATE INDEX IDX_PASSKEY_USERS_EMAIL ON PASSKEY_USERS(EMAIL);
   ```

2. **Update Entity**:
   ```java
   @Entity
   @Table(name = "PASSKEY_USERS")
   public class User {
       // ... existing fields
       
       @Column(name = "EMAIL")
       private String email;
       
       @Column(name = "EMAIL_VERIFIED")
       private boolean emailVerified;
       
       // Getters and setters
   }
   ```

### Adding Configuration Property

1. **Add to Configuration Class**:
   ```java
   @ConfigurationProperties(prefix = "passkey.integration")
   @Component
   public class PasskeyIntegrationProperties {
       
       private String defaultUserType = "SYSTEM";
       private int maxRetries = 3;
       
       // Getters and setters
   }
   ```

2. **Use in Service**:
   ```java
   @Service
   public class UsersServiceImpl implements UsersService {
       
       private final PasskeyIntegrationProperties properties;
       
       public UsersServiceImpl(PasskeyIntegrationProperties properties) {
           this.properties = properties;
       }
       
       public User getDefaultUser() {
           return userDao.findByType(properties.getDefaultUserType());
       }
   }
   ```

3. **Add to Configuration File**:
   ```yaml
   passkey:
     integration:
       default-user-type: SYSTEM
       max-retries: 3
   ```

## Debugging

### Application Debugging

1. **Enable Debug Logging**:
   ```yaml
   logging:
     level:
       com.cvent.passkeyintegration: DEBUG
       org.springframework.security: DEBUG
       org.mybatis: TRACE
   ```

2. **Use IDE Debugger**:
   - Set breakpoints in your code
   - Run application in debug mode
   - Step through code execution

3. **Remote Debugging**:
   ```bash
   # Run with remote debugging enabled
   mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
   
   # Connect IDE debugger to localhost:5005
   ```

### Database Debugging

1. **Enable SQL Logging**:
   ```yaml
   logging:
     level:
       org.mybatis: DEBUG
   ```

2. **Use Database Tools**:
   ```bash
   # Connect to local Oracle database
   sqlplus passkey_user/password123@localhost:1521/XEPDB1
   
   # Query user data
   SELECT * FROM PASSKEY_USERS;
   ```

### Performance Profiling

1. **JVM Profiling**:
   ```bash
   # Run with JFR (Java Flight Recorder)
   mvn spring-boot:run -Dspring-boot.run.jvmArguments="-XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=profile.jfr"
   ```

2. **Application Metrics**:
   ```bash
   # View metrics endpoint
   curl http://localhost:8080/actuator/metrics
   
   # View specific metric
   curl http://localhost:8080/actuator/metrics/jvm.memory.used
   ```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
telnet localhost 1521

# Verify Oracle service status
docker-compose ps oracle-db

# Check database logs
docker-compose logs oracle-db
```

#### Build Issues
```bash
# Clean and rebuild
mvn clean install -DskipTests

# Clear local repository
rm -rf ~/.m2/repository/com/cvent

# Reimport dependencies
mvn dependency:resolve
```

#### OAuth Issues
```bash
# Disable OAuth for local development
# Add to local.yaml:
cvent:
  oauth:
    enabled: false
```

### Getting Help

- **Team Slack**: #passkey-api
- **Documentation**: Check this documentation and inline code comments
- **Stack Overflow**: Search for Spring Boot and MyBatis issues
- **Cvent Internal**: Cvent Developer Portal and internal documentation

## Additional Resources

## Technology Stack


- **Framework**: Spring Boot 2.x
- **Language**: Java 17
- **Build Tool**: Maven
- **Database**: Oracle Database with MyBatis ORM
- **Authentication**: Cvent OAuth
- **Monitoring**: Cvent Observability Framework
- **Infrastructure**: AWS CDK, Docker
- **CI/CD**: Jenkins with Nx monorepo support

## Quick Start


### Prerequisites

- Java 17 or higher
- Maven 3.6+
- Docker
- Node.js 18+ (for monorepo tooling)
- pnpm package manager

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-integration-sb.git
   cd passkey-integration-sb
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the service**:
   ```bash
   cd packages/passkey-integration/service
   mvn clean compile
   ```

4. **Run locally**:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=configs/dev.yaml"
   ```

5. **Verify the service**:
   ```bash
   curl http://localhost:8080/passkey-integration/v1/user/default
   ```

### Running with Docker

```bash
# Build the Docker image
docker build -t passkey-integration .

# Run the container
docker run -p 8080:8080 passkey-integration
```

## API Endpoints


- **GET** `/passkey-integration/v1/user/default` - Retrieve default user information
- **GET** `/health` - Health check endpoint
- **GET** `/actuator/health` - Spring Boot actuator health endpoint

## Configuration


The service uses YAML-based configuration with environment-specific overrides:
- `configs/dev.yaml` - Development environment
- `configs/template.yaml` - Template configuration
- `configs/base-override.yaml` - Base configuration overrides

## Support


- **Team**: Meeseeksbox
- **Slack Channel**: #passkey-api
- **Jenkins**: [CI/CD Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-integration-sb/)
- **GitHub**: [Repository](https://github.com/cvent-internal/passkey-integration-sb)
