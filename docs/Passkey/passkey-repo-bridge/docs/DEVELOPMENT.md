# Development Guide

## Prerequisites

- **Java 21**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerized development and testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code with Java extensions
- **Access**: Cvent internal Nexus repository access

## Local Setup

### 1. Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-bridge.git
cd passkey-bridge
```

### 2. Configure Maven
Ensure your Maven settings include Cvent's internal Nexus repository. Follow the [Nexus setup guide](https://wiki.cvent.com/pages/viewpage.action?pageId=2304208).

### 3. Build Project
```bash
# Full build with all modules
mvn clean package

# Build for release
mvn clean package -Prelease

# Skip tests for faster build
mvn clean package -DskipTests
```

### 4. Database Setup
```bash
# Start PostgreSQL with Docker
docker run --name passkey-bridge-db \
  -e POSTGRES_DB=passkey_bridge \
  -e POSTGRES_USER=bridge_user \
  -e POSTGRES_PASSWORD=bridge_pass \
  -p 5432:5432 \
  -d postgres:13

# Run database migrations (if applicable)
mvn flyway:migrate -Pdev
```

### 5. Configuration
Create local configuration file:
```bash
cp passkey-bridge-service/configs/dev.yaml passkey-bridge-service/configs/local.yaml
```

Edit `local.yaml` with your local settings:
```yaml
database:
  url: jdbc:postgresql://localhost:5432/passkey_bridge
  user: bridge_user
  password: bridge_pass

auth:
  serviceUrl: https://auth-service.dev.cvent.com
  # Use development API key for local testing
```

## Running the Service

### Start the Service
```bash
cd passkey-bridge-service
java -jar target/passkey-bridge-service-1.7.1-SNAPSHOT.jar server configs/local.yaml
```

### Verify Service is Running
```bash
# Health check
curl http://localhost:8081/healthcheck

# Admin interface
open http://localhost:8081

# API endpoint test
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:8080/registrations/TEST123
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=RegistrationServiceTest

# Run with coverage
mvn test -Pcoverage
open target/site/clover/index.html
```

### Integration Tests
```bash
# Run all integration tests
mvn verify -Prun-it -Dkarate.env=dev

# Run specific feature
mvn verify -Prun-it -Dkarate.env=dev -Dkarate.options="--tags @registration"

# Run locally with IDE
# Open PasskeyBridgeKarateTestIT.java and run runFeatureLocally() method
```

### Test Configuration
Integration tests use Karate framework with feature files:
- `passkey-bridge-integration-test/src/test/java/features/`
- Environment-specific configurations in `karate-config.js`

## Code Structure

### Package Organization
```
com.cvent.passkey.bridge/
├── constants/           # API constants and error codes
├── model/              # Domain models and DTOs
│   ├── registration/   # Registration-related models
│   └── reservation/    # Reservation-related models
├── resources/          # JAX-RS REST endpoints
├── service/            # Business logic layer
├── dao/               # Data access objects
├── configuration/     # Service configuration
└── utils/             # Utility classes
```

### Module Dependencies
```
passkey-bridge-service
├── depends on: passkey-bridge-api
├── depends on: passkey-bridge-data-access
└── depends on: passkey-bridge-shared

passkey-bridge-java-client
├── depends on: passkey-bridge-api
└── depends on: passkey-bridge-shared

passkey-bridge-integration-test
├── depends on: passkey-bridge-api
└── depends on: passkey-bridge-java-client
```

## Coding Standards

### Java Style Guide
- Follow Google Java Style Guide
- Use Checkstyle plugin for enforcement
- 4-space indentation, no tabs
- Line length limit: 120 characters

### Code Quality Rules
- Minimum 80% test coverage
- No SonarQube critical or major issues
- All public methods must have JavaDoc
- Use immutable objects where possible (Immutables library)

### Naming Conventions
- Classes: PascalCase (`RegistrationService`)
- Methods: camelCase (`createRegistration`)
- Constants: UPPER_SNAKE_CASE (`API_VERSION`)
- Packages: lowercase with dots (`com.cvent.passkey.bridge`)

## Common Development Tasks

### Adding a New Endpoint

1. **Define the model** (if needed) in `passkey-bridge-api`:
```java
@Value.Immutable
@JsonSerialize(as = ImmutableNewModel.class)
@JsonDeserialize(as = ImmutableNewModel.class)
public interface NewModel {
    String getId();
    String getName();
}
```

2. **Add the resource method**:
```java
@GET
@Path("/new-endpoint")
public Response getNewData(@Authority(methods = {AuthMethod.API_KEY}) GrantedAPIKey apiKey) {
    // Implementation
    return Response.ok(result).build();
}
```

3. **Implement business logic** in service layer:
```java
@Service
public class NewService {
    public NewModel processNewData() {
        // Business logic
    }
}
```

4. **Add integration test**:
```gherkin
Feature: New Endpoint
  Scenario: Get new data
    Given url baseUrl + '/new-endpoint'
    And header Authorization = 'Bearer ' + apiKey
    When method GET
    Then status 200
```

### Adding Database Migration
```sql
-- V1.1__Add_new_table.sql
CREATE TABLE new_table (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Adding Configuration Property
1. Add to configuration class:
```java
@JsonProperty
private String newProperty;
```

2. Add to YAML files:
```yaml
newProperty: ${NEW_PROPERTY:defaultValue}
```

3. Use in service:
```java
@Inject
public MyService(MyConfiguration config) {
    this.newProperty = config.getNewProperty();
}
```

## Debugging

### Local Debugging
1. Start service with debug flags:
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-bridge-service-1.7.1-SNAPSHOT.jar server configs/local.yaml
```

2. Connect IDE debugger to port 5005

### Log Analysis
```bash
# Tail application logs
tail -f logs/passkey-bridge-service.log

# Search for specific request
grep "REQUEST_ID" logs/passkey-bridge-service.log

# Filter by log level
grep "ERROR" logs/passkey-bridge-service.log
```

### Database Debugging
```sql
-- Connect to local database
psql -h localhost -U bridge_user -d passkey_bridge

-- Check registration data
SELECT * FROM registrations WHERE reg_number = 'REG123';

-- Check associations
SELECT * FROM reg_associations WHERE registration_number = 'REG123';
```

## IDE Configuration

### IntelliJ IDEA
1. Import as Maven project
2. Install plugins:
   - Checkstyle-IDEA
   - SonarLint
   - Lombok (if used)
3. Configure code style:
   - Import `google-java-format.xml`
   - Enable "Reformat code" on save

### VS Code
1. Install extensions:
   - Extension Pack for Java
   - Checkstyle for Java
   - SonarLint
2. Configure workspace settings in `.vscode/settings.json`

## Troubleshooting

### Common Issues

**Build Failures**:
- Check Maven settings for Nexus access
- Verify Java version (must be 21)
- Clear Maven cache: `mvn dependency:purge-local-repository`

**Service Won't Start**:
- Check database connectivity
- Verify configuration file syntax
- Check port availability (8080, 8081)

**Integration Test Failures**:
- Ensure service is running on correct port
- Check API key validity
- Verify test data setup

**Database Connection Issues**:
- Check PostgreSQL is running
- Verify connection string and credentials
- Check firewall/network connectivity

### Getting Help
- **Team Slack**: #passkey-team
- **Wiki**: [Bridge Service Documentation](https://wiki.cvent.com/display/PASKY/Bridge+Service)
- **Code Reviews**: Create PR and request review from team members
- **Architecture Questions**: Consult with senior team members or architects

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Access to Cvent's internal Nexus repository

### Local Development
```bash
# Build the service
mvn package -Prelease

# Run locally
cd passkey-bridge-service
java -jar target/passkey-bridge-service-1.7.1-SNAPSHOT.jar server configs/dev.yaml

# Run integration tests
mvn -Prun-it -Dkarate.env=dev verify

# Check code coverage
mvn package -Pcoverage
open target/site/clover/index.html
```

## Links


- [Datadog APM](https://cvent.datadoghq.com/apm/services/passkey-bridge-service/operations/servlet.request/resources)
- [Datadog Logs](https://cvent.datadoghq.com/logs?query=env%3Apr50+service%3Apasskey-bridge-service)
- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-bridge)
- [Wiki Documentation](https://wiki.cvent.com/display/PASKY/Bridge+Service)

## Team


**Owner**: meeseeksbox  
**Business Unit**: Hospitality  
**Platform**: Passkey  
**Product**: Passkey for Planners Housing
