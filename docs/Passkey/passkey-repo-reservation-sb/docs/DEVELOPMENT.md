# Development Guide

## Prerequisites

Before you can work on the Passkey Reservation SpringBoot service, ensure you have the following tools installed:

### Required Software
- **Java 17+**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool for Java projects
- **pnpm**: Package manager for monorepo management
- **Docker**: For containerization and local testing
- **Git**: Version control system
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Development Tools
- **Node.js 18+**: Required for pnpm and build tools
- **AWS CLI**: For interacting with AWS services
- **Postman or curl**: For API testing
- **Oracle SQL Developer**: For database management (optional)

### Access Requirements
- **Cvent VPN**: Access to internal networks and services
- **GitHub Access**: Repository access to cvent-internal organization
- **AWS Access**: Development environment access
- **Database Access**: Development database credentials

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/cvent-internal/passkey-reservation-sb.git
cd passkey-reservation-sb
```

### 2. Install Dependencies
```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Environment Configuration
Create local configuration files for development:

**Create `packages/passkey-reservation-sb/service/configs/local.yaml`**:
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521:XE
    username: passkey_dev
    password: dev_password
    hikari:
      maximum-pool-size: 5
      minimum-idle: 2

cvent:
  oauth:
    resource-server:
      jwt:
        issuer-uri: https://dev-oauth.cvent.com
        
logging:
  level:
    com.cvent.passkeyreservationsb: DEBUG
    org.springframework.security: DEBUG
    
management:
  endpoints:
    web:
      exposure:
        include: "*"
```

### 4. Database Setup
For local development, you can use either:

#### Option A: Local Oracle Database
```bash
# Using Docker to run Oracle locally
docker run -d \
  --name oracle-dev \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=dev_password \
  container-registry.oracle.com/database/express:latest
```

#### Option B: Connect to Development Database
Update your local configuration to point to the development database:
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@dev-oracle.cvent.com:1521:DEVDB
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

### 5. Build the Project
```bash
# Build all modules
pnpm build

# Or build specific module
cd packages/passkey-reservation-sb/service
mvn clean compile
```

### 6. Run the Application
```bash
# From the service directory
cd packages/passkey-reservation-sb/service

# Run with local configuration
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=configs/local.yaml"

# Or run with development configuration
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=configs/dev.yaml"
```

The application will start on `http://localhost:8080`

### 7. Verify Installation
Test that the service is running:
```bash
# Health check
curl http://localhost:8080/actuator/health

# API test (requires valid OAuth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/passkey-reservation-sb/v1/reservations/TEST123
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
cd packages/passkey-reservation-sb/service
mvn test

# Run specific test class
mvn test -Dtest=ReservationControllerTest

# Run with coverage
mvn test jacoco:report
```

### Integration Tests
```bash
# Run integration tests (requires database)
mvn verify -P integration

# Run integration tests with test containers
mvn verify -P integration -Dspring.profiles.active=test
```

### End-to-End Tests
```bash
# Run full test suite
pnpm test

# Run specific test categories
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

## Code Structure

### Package Organization
```
com.cvent.passkeyreservationsb/
├── PasskeyReservationSbApplication.java    # Main application class
├── PasskeyReservationSbConfiguration.java  # Configuration beans
├── controllers/                             # REST controllers
│   ├── ReservationController.java
│   ├── LegacyReservationsController.java
│   └── legacy/                             # Legacy compatibility
├── service/                                # Business logic layer
│   ├── ReservationService.java
│   └── impl/                              # Service implementations
├── dao/                                    # Data access objects
│   ├── ReservationDao.java
│   └── impl/                              # DAO implementations
├── mappers/                               # MyBatis mappers
│   ├── ReservationMapper.java
│   └── xml/                               # MyBatis XML configs
├── auth/                                  # Authentication/authorization
│   ├── SecurityConfig.java
│   └── AuthenticationProvider.java
├── health/                                # Health check components
│   └── DatabaseHealthIndicator.java
└── legacy/                                # Legacy system integration
    ├── LegacyReservationService.java
    └── migration/                         # Migration utilities
```

### Module Structure
```
passkey-reservation-sb/
├── parent/                    # Parent POM configuration
├── model/                     # Shared data models
│   └── src/main/java/
│       └── com/cvent/passkeyreservationsb/model/
├── service/                   # Main Spring Boot application
│   ├── src/main/java/         # Application source code
│   ├── src/main/resources/    # Configuration files
│   ├── src/test/java/         # Unit tests
│   └── configs/               # Environment configurations
├── java-client/               # Client library
│   └── src/main/java/
│       └── com/cvent/passkeyreservationsb/client/
├── it/                        # Integration tests
│   └── src/test/java/
└── infra/                     # Infrastructure code
    └── src/main/typescript/   # CDK infrastructure
```

## Coding Standards

### Java Code Style
The project follows Cvent's Java coding standards:

- **Checkstyle**: Enforced via Maven plugin
- **Formatting**: Use IntelliJ IDEA default Java formatting
- **Naming**: CamelCase for classes, camelCase for methods and variables
- **Documentation**: JavaDoc for public APIs

### Code Quality Rules
```xml
<!-- Checkstyle configuration -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
        <encoding>UTF-8</encoding>
        <consoleOutput>true</consoleOutput>
        <failsOnError>true</failsOnError>
    </configuration>
</plugin>
```

### Best Practices
1. **Immutable Objects**: Use Immutables library for data classes
2. **Dependency Injection**: Use constructor injection over field injection
3. **Error Handling**: Use specific exceptions with meaningful messages
4. **Logging**: Use structured logging with correlation IDs
5. **Testing**: Write tests for all public methods and edge cases

## Common Development Tasks

### Adding a New API Endpoint

1. **Create Controller Method**:
```java
@RestController
@RequestMapping("/passkey-reservation-sb/v1/reservations")
public class ReservationController {
    
    @PostMapping
    @CventAuthorization(scopes = {"RESERVATION_WRITE"})
    public ResponseEntity<Reservation> createReservation(
            @RequestBody @Valid CreateReservationRequest request) {
        // Implementation
    }
}
```

2. **Add Service Layer**:
```java
@Service
public class ReservationService {
    
    public Reservation createReservation(CreateReservationRequest request) {
        // Business logic implementation
    }
}
```

3. **Add Data Access**:
```java
@Mapper
public interface ReservationMapper {
    
    @Insert("INSERT INTO reservations ...")
    void insertReservation(Reservation reservation);
}
```

4. **Write Tests**:
```java
@SpringBootTest
class ReservationControllerTest {
    
    @Test
    void shouldCreateReservation() {
        // Test implementation
    }
}
```

### Adding Database Migration

1. **Create Migration Script**:
```sql
-- V1.1__Add_guest_preferences_table.sql
CREATE TABLE guest_preferences (
    id NUMBER PRIMARY KEY,
    confirmation_number VARCHAR2(12) NOT NULL,
    preference_type VARCHAR2(50) NOT NULL,
    preference_value VARCHAR2(255),
    FOREIGN KEY (confirmation_number) REFERENCES reservations(confirmation_number)
);
```

2. **Update Entity Classes**:
```java
@Entity
@Table(name = "guest_preferences")
public class GuestPreference {
    // Entity implementation
}
```

3. **Update Mappers**:
```xml
<!-- Add to ReservationMapper.xml -->
<select id="findPreferences" resultType="GuestPreference">
    SELECT * FROM guest_preferences WHERE confirmation_number = #{confirmationNumber}
</select>
```

### Adding Configuration Property

1. **Add to Configuration Class**:
```java
@ConfigurationProperties(prefix = "passkey.reservation")
@Data
public class ReservationProperties {
    private int maxReservationDays = 30;
    private boolean enableLegacySupport = true;
}
```

2. **Update application.yaml**:
```yaml
passkey:
  reservation:
    max-reservation-days: 30
    enable-legacy-support: true
```

3. **Use in Service**:
```java
@Service
public class ReservationService {
    
    private final ReservationProperties properties;
    
    public ReservationService(ReservationProperties properties) {
        this.properties = properties;
    }
}
```

## Debugging

### Local Debugging
1. **IDE Setup**: Configure IntelliJ IDEA for remote debugging
2. **Debug Mode**: Run application with debug flags:
```bash
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

### Log Analysis
```bash
# View application logs
tail -f logs/application.log

# Filter specific logger
grep "ReservationService" logs/application.log

# View structured logs
jq '.' logs/application.json
```

### Database Debugging
```sql
-- Check reservation data
SELECT * FROM reservations WHERE confirmation_number = 'ABC123';

-- View recent activity
SELECT * FROM reservations WHERE created_date > SYSDATE - 1;

-- Check connection pool status
SELECT * FROM v$session WHERE program LIKE '%java%';
```

## Testing Strategies

### Unit Testing
- **Mock External Dependencies**: Use Mockito for service dependencies
- **Test Business Logic**: Focus on service layer testing
- **Edge Cases**: Test error conditions and boundary values

### Integration Testing
- **Database Integration**: Test with real database connections
- **API Integration**: Test full request/response cycles
- **External Services**: Use WireMock for external service mocking

### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 http://localhost:8080/passkey-reservation-sb/v1/reservations/TEST123

# Memory profiling
java -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -jar target/passkey-reservation-sb.jar
```

## Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Clean and rebuild
mvn clean install

# Skip tests if needed
mvn clean install -DskipTests

# Check dependency conflicts
mvn dependency:tree
```

**Database Connection Issues**:
```bash
# Test database connectivity
telnet dev-oracle.cvent.com 1521

# Check connection pool
curl http://localhost:8080/actuator/metrics/hikaricp.connections
```

**Authentication Issues**:
```bash
# Verify OAuth configuration
curl -v https://dev-oauth.cvent.com/.well-known/openid_configuration

# Test token validation
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/actuator/health
```

### Getting Help

- **Slack Channels**:
  - `#passkey-api` - General API questions
  - `#passkey-steakholders` - Team-specific discussions
  - `#cvent-platform` - Platform and infrastructure questions

- **Documentation**:
  - [Cvent Framework Documentation](https://framework.docs.cvent.org)
  - [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
  - [MyBatis Documentation](https://mybatis.org/mybatis-3/)

- **Team Contacts**:
  - **Tech Lead**: Available in `#passkey-steakholders`
  - **DevOps**: `#platform-support` for infrastructure issues
  - **Security**: `#security` for security-related questions

## Additional Resources

## Quick Start


### Prerequisites
- Java 17+
- Maven 3.6+
- pnpm (for monorepo management)
- Docker (for local development)
- Access to Cvent internal networks and services

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-reservation-sb.git
   cd passkey-reservation-sb
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the project**:
   ```bash
   pnpm build
   ```

4. **Run locally**:
   ```bash
   cd packages/passkey-reservation-sb/service
   mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=configs/dev.yaml"
   ```

### Running with Docker

```bash
# Build the Docker image
docker build -t passkey-reservation-sb .

# Run the container
docker run -p 8080:8080 passkey-reservation-sb
```

## API Endpoints


The service exposes REST endpoints under the base path `/passkey-reservation-sb/v1/`:

- `GET /reservations/{confNumber}` - Retrieve reservation by confirmation number

For detailed API documentation, see [API_REFERENCE.md](./API_REFERENCE.md).

## Team and Support


- **Owner**: Steakholders team
- **Slack Channels**: 
  - `#passkey-api` - General API discussions
  - `#passkey-steakholders-alerts` - Team alerts and notifications
- **Jenkins**: [CI/CD Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-reservation-sb)
- **Octopus Deploy**: passkey-reservation-springboot
- **Datadog Service**: passkey-reservation-sb

## Contributing


This service follows Cvent's standard development practices:

1. Create feature branches from `master`
2. Follow the pull request template
3. Ensure all tests pass
4. Code review required before merging
5. Automated deployment to development environment

For detailed development guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md).
