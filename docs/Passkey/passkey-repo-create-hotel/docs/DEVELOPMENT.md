# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK 17+
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerized development and testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code with Java extensions

### Optional Tools
- **pnpm**: For frontend tooling and documentation generation
- **Node.js 18+**: Required if using pnpm
- **Postman/Insomnia**: API testing
- **DBeaver/SQL Developer**: Database management

### Environment Setup

1. **Install Java 17**:
   ```bash
   # Using SDKMAN (recommended)
   curl -s "https://get.sdkman.io" | bash
   sdk install java 17.0.8-oracle
   sdk use java 17.0.8-oracle
   
   # Verify installation
   java -version
   javac -version
   ```

2. **Install Maven**:
   ```bash
   # Using SDKMAN
   sdk install maven 3.9.4
   
   # Or download from Apache Maven website
   # Verify installation
   mvn -version
   ```

3. **Configure Maven for Cvent**:
   ```xml
   <!-- ~/.m2/settings.xml -->
   <settings>
     <servers>
       <server>
         <id>cvent-nexus</id>
         <username>${env.NEXUS_USERNAME}</username>
         <password>${env.NEXUS_PASSWORD}</password>
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

4. **Install Docker**:
   ```bash
   # Follow Docker installation guide for your OS
   # Verify installation
   docker --version
   docker-compose --version
   ```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-create-hotel.git
cd passkey-create-hotel
```

### 2. Build Project
```bash
# Clean build with all modules
mvn clean package

# Build for release (skips tests for faster build)
mvn clean package -Prelease

# Build specific module
mvn clean package -pl passkey-create-hotel-service -am
```

### 3. Database Setup

#### Option A: Local Oracle Database (Recommended for full development)
```bash
# Start Oracle database container
docker run -d \
  --name oracle-db \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  -e ORACLE_DATABASE=XEPDB1 \
  container-registry.oracle.com/database/express:21.3.0-xe

# Wait for database to start (check logs)
docker logs -f oracle-db

# Create development schema
sqlplus sys/password@localhost:1521/XEPDB1 as sysdba
CREATE USER passkey_dev IDENTIFIED BY dev_password;
GRANT CONNECT, RESOURCE, DBA TO passkey_dev;
```

#### Option B: Use Development Environment Database
```bash
# Set environment variables for dev database
export DATABASE_URL="jdbc:oracle:thin:@//dev-db.cvent.com:1521/passkey"
export DATABASE_USER="passkey_create_hotel_dev"
export DATABASE_PASSWORD="your_dev_password"
```

### 4. Configure Environment Variables
```bash
# Create local environment file
cat > .env << EOF
# Database Configuration
DATABASE_URL=jdbc:oracle:thin:@//localhost:1521/XEPDB1
DATABASE_USER=passkey_dev
DATABASE_PASSWORD=dev_password

# External Services (use dev environment)
PASSKEY_HOTEL_SERVICE_URL=https://dev.cvent.com/passkey-hotel
BUSINESS_TEXT_SERVICE_URL=https://dev.cvent.com/business-text

# Authentication (use dev auth service)
AUTH_SERVICE_URL=https://dev-auth.cvent.com
API_KEY_VALIDATION_URL=https://dev-auth.cvent.com/validate

# Logging
LOG_LEVEL=DEBUG
EOF

# Source environment variables
source .env
```

### 5. Run the Service
```bash
# Navigate to service module
cd passkey-create-hotel-service

# Run with development configuration
java -jar target/passkey-create-hotel-service-*-SNAPSHOT.jar server configs/dev.yaml

# Or use Maven to run
mvn exec:java -Dexec.mainClass="com.cvent.passkey.createhotel.PasskeyCreateHotelServiceApplication" -Dexec.args="server configs/dev.yaml"
```

### 6. Verify Setup
```bash
# Check health endpoint
curl http://localhost:8081/healthcheck

# Check application endpoint
curl http://localhost:8080/passkey-create-hotel/v1/openapi.json

# Test API with sample request
curl -X POST http://localhost:8080/passkey-create-hotel/v1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "name": "Test Hotel",
    "address": {
      "city": "McLean",
      "country": "United States",
      "countryIsoCode": "US",
      "line1": "123 Test St",
      "postalCode": "22102"
    },
    "phoneNumber1": "+1-703-555-0100",
    "faxNumber1": "+1-703-555-0199",
    "language": "en",
    "userId": 12345
  }'
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-create-hotel-service

# Run specific test class
mvn test -Dtest=CreateHotelServiceTest

# Run with coverage
mvn test jacoco:report -Pcoverage

# View coverage report
open passkey-create-hotel-service/target/site/jacoco/index.html
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn verify -Prun-it -Denv.IT_ENVIRONMENT=dev

# Run integration tests with custom environment
mvn verify -Prun-it -Denv.IT_ENVIRONMENT=local -Dtest.base.url=http://localhost:8080

# Run specific integration test
mvn verify -Prun-it -Dit.test=CreateHotelIntegrationTest
```

### Load Testing
```bash
# Run performance tests (requires service to be running)
cd passkey-create-hotel-integration-test
mvn verify -Pperformance-test -Dtest.environment=local
```

## Code Structure

### Package Organization
```
com.cvent.passkey.createhotel/
├── PasskeyCreateHotelServiceApplication.java    # Main application class
├── PasskeyCreateHotelServiceConfiguration.java # Configuration class
├── automation/                                  # Automation-related classes
├── exception/                                   # Custom exceptions
├── exceptionmapper/                            # JAX-RS exception mappers
├── health/                                     # Health check implementations
├── model/                                      # Data models and DTOs
├── resources/                                  # REST endpoints (JAX-RS resources)
│   ├── CreateHotelResource.java               # Main hotel creation endpoint
│   ├── AdminResource.java                     # Administrative endpoints
│   └── OpenApiResource.java                   # API documentation endpoint
└── services/                                   # Business logic services
    ├── CreateHotelService.java                # Core hotel creation logic
    ├── ParticipantService.java               # Participant management
    ├── DeleteHotelService.java               # Hotel deletion logic
    └── AdminService.java                      # Administrative operations
```

### Module Structure
```
passkey-create-hotel/
├── passkey-create-hotel-api/              # API contracts and models
│   ├── src/main/java/                     # Java source code
│   ├── openapi.json                       # OpenAPI specification (JSON)
│   └── openapi.yaml                       # OpenAPI specification (YAML)
├── passkey-create-hotel-service/          # Main service implementation
│   ├── src/main/java/                     # Java source code
│   ├── src/main/resources/                # Configuration files
│   ├── src/test/java/                     # Unit tests
│   └── configs/                           # Environment configurations
├── passkey-create-hotel-data-access/      # Data access layer
│   └── src/main/java/                     # DAO implementations
├── passkey-create-hotel-java-client/      # Java client library
│   └── src/main/java/                     # Client implementation
├── passkey-create-hotel-shared/           # Shared utilities
│   └── src/main/java/                     # Common code
└── passkey-create-hotel-integration-test/ # Integration tests
    └── src/test/java/                     # Integration test suites
```

## Coding Standards

### Java Code Style
- Follow Oracle Java Code Conventions
- Use Cvent's Checkstyle configuration
- Maximum line length: 120 characters
- Use 4 spaces for indentation (no tabs)
- Always use braces for control structures

### Naming Conventions
```java
// Classes: PascalCase
public class CreateHotelService { }

// Methods and variables: camelCase
public Optional<HotelInfo> createHotel(HotelSettings hotelSettings) { }

// Constants: UPPER_SNAKE_CASE
private static final String DEFAULT_LANGUAGE = "en";

// Packages: lowercase with dots
package com.cvent.passkey.createhotel.services;
```

### Documentation Standards
```java
/**
 * Creates a new hotel in the Passkey system.
 * 
 * @param hotelSettings the hotel configuration and settings
 * @return Optional containing HotelInfo if creation successful, empty otherwise
 * @throws ValidationException if hotel settings are invalid
 * @throws ServiceException if external service integration fails
 */
public Optional<HotelInfo> createHotel(HotelSettings hotelSettings) {
    // Implementation
}
```

### Error Handling
```java
// Use specific exceptions
throw new ValidationException("Hotel name cannot be empty");

// Log errors appropriately
logger.error("Failed to create hotel for user {}: {}", userId, e.getMessage(), e);

// Return appropriate HTTP status codes
return Response.status(Response.Status.BAD_REQUEST)
    .entity(errorResponse)
    .build();
```

## Common Development Tasks

### Adding a New Endpoint

1. **Define the API contract** in `passkey-create-hotel-api`:
   ```java
   // Add to existing resource or create new resource class
   @POST
   @Path("/hotels/{hotelId}/update")
   @Operation(summary = "Update hotel information")
   public Response updateHotel(@PathParam("hotelId") Long hotelId, 
                              @Valid HotelUpdateRequest request);
   ```

2. **Implement the endpoint** in `passkey-create-hotel-service`:
   ```java
   @POST
   @Path("/hotels/{hotelId}/update")
   public Response updateHotel(@PathParam("hotelId") Long hotelId, 
                              @Valid HotelUpdateRequest request) {
       return hotelUpdateService.updateHotel(hotelId, request)
           .map(hotel -> Response.ok(hotel).build())
           .orElse(Response.status(Response.Status.NOT_FOUND).build());
   }
   ```

3. **Add business logic** in service layer:
   ```java
   public Optional<HotelInfo> updateHotel(Long hotelId, HotelUpdateRequest request) {
       // Validation
       // Business logic
       // Data persistence
       // Return result
   }
   ```

4. **Write tests**:
   ```java
   @Test
   public void testUpdateHotel_Success() {
       // Arrange
       // Act
       // Assert
   }
   ```

5. **Update OpenAPI documentation** (auto-generated from annotations)

### Adding a New Service Dependency

1. **Add dependency to pom.xml**:
   ```xml
   <dependency>
       <groupId>com.cvent.passkey</groupId>
       <artifactId>new-service-client</artifactId>
       <version>${new-service.version}</version>
   </dependency>
   ```

2. **Configure the service** in application configuration:
   ```yaml
   externalServices:
     newService:
       baseUrl: ${NEW_SERVICE_URL}
       timeout: 30s
       retries: 3
   ```

3. **Create service client wrapper**:
   ```java
   @Component
   public class NewServiceClient {
       private final NewServiceApi client;
       
       public NewServiceClient(NewServiceConfiguration config) {
           this.client = new NewServiceApiBuilder()
               .baseUrl(config.getBaseUrl())
               .timeout(config.getTimeout())
               .build();
       }
   }
   ```

4. **Add health check**:
   ```java
   public class NewServiceHealthCheck extends HealthCheck {
       @Override
       protected Result check() throws Exception {
           // Health check implementation
       }
   }
   ```

### Database Schema Changes

1. **Create migration script**:
   ```sql
   -- V1.1__Add_new_hotel_field.sql
   ALTER TABLE hotels ADD COLUMN new_field VARCHAR2(255);
   UPDATE hotels SET new_field = 'default_value' WHERE new_field IS NULL;
   ```

2. **Update entity classes**:
   ```java
   @Entity
   @Table(name = "hotels")
   public class Hotel {
       @Column(name = "new_field")
       private String newField;
       
       // Getters and setters
   }
   ```

3. **Update DTOs and API models**:
   ```java
   public class HotelInfo {
       private String newField;
       // Getters and setters
   }
   ```

4. **Test migration**:
   ```bash
   # Test against local database
   mvn flyway:migrate -Dflyway.url=jdbc:oracle:thin:@localhost:1521/XEPDB1
   ```

## Debugging

### Local Debugging

1. **Enable debug mode**:
   ```bash
   java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
        -jar target/passkey-create-hotel-service-*-SNAPSHOT.jar server configs/dev.yaml
   ```

2. **Attach debugger** from IDE (port 5005)

3. **Enable debug logging**:
   ```yaml
   # In configs/dev.yaml
   logging:
     level: DEBUG
     loggers:
       com.cvent.passkey.createhotel: DEBUG
       org.hibernate.SQL: DEBUG
   ```

### Remote Debugging

1. **Check application logs**:
   ```bash
   # For deployed environments
   kubectl logs -l app=passkey-create-hotel -n passkey --tail=100 -f
   ```

2. **Check health status**:
   ```bash
   curl https://dev.cvent.com/passkey-create-hotel/admin/healthcheck
   ```

3. **Monitor metrics**:
   - Datadog dashboard: https://cvent.datadoghq.com/services
   - Application metrics: `/admin/metrics`

### Common Issues

1. **Database Connection Issues**:
   ```bash
   # Check database connectivity
   telnet db-host 1521
   
   # Verify credentials
   sqlplus username/password@host:port/service
   ```

2. **External Service Issues**:
   ```bash
   # Test external service connectivity
   curl -v https://external-service.cvent.com/health
   
   # Check service configuration
   grep -r "external-service" configs/
   ```

3. **Memory Issues**:
   ```bash
   # Monitor memory usage
   jstat -gc -t <pid> 5s
   
   # Generate heap dump
   jcmd <pid> GC.run_finalization
   jcmd <pid> VM.gc
   ```

## IDE Configuration

### IntelliJ IDEA

1. **Import Project**:
   - File → Open → Select `pom.xml`
   - Import as Maven project

2. **Configure Code Style**:
   - File → Settings → Editor → Code Style → Java
   - Import Cvent code style configuration

3. **Configure Run Configuration**:
   - Run → Edit Configurations → Add New → Application
   - Main class: `com.cvent.passkey.createhotel.PasskeyCreateHotelServiceApplication`
   - Program arguments: `server configs/dev.yaml`
   - Working directory: `passkey-create-hotel-service`

4. **Enable Annotation Processing**:
   - File → Settings → Build → Compiler → Annotation Processors
   - Enable annotation processing

### VS Code

1. **Install Extensions**:
   - Extension Pack for Java
   - Spring Boot Extension Pack
   - Maven for Java

2. **Configure Workspace**:
   ```json
   // .vscode/settings.json
   {
     "java.configuration.updateBuildConfiguration": "automatic",
     "java.compile.nullAnalysis.mode": "automatic",
     "maven.executable.path": "/path/to/maven/bin/mvn"
   }
   ```

3. **Configure Launch**:
   ```json
   // .vscode/launch.json
   {
     "type": "java",
     "name": "Launch PasskeyCreateHotelService",
     "request": "launch",
     "mainClass": "com.cvent.passkey.createhotel.PasskeyCreateHotelServiceApplication",
     "args": ["server", "configs/dev.yaml"],
     "cwd": "${workspaceFolder}/passkey-create-hotel-service"
   }
   ```

## Contributing

### Git Workflow

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/add-hotel-validation
   ```

2. **Make Changes and Commit**:
   ```bash
   git add .
   git commit -m "Add comprehensive hotel validation logic"
   ```

3. **Push and Create Pull Request**:
   ```bash
   git push origin feature/add-hotel-validation
   # Create PR through GitHub interface
   ```

4. **Code Review Process**:
   - Automated checks (build, tests, security scan)
   - Peer review by team members
   - Address feedback and update PR

5. **Merge to Development**:
   - Squash and merge to development branch
   - Automatic deployment to alpha environment

### Pull Request Guidelines

- **Title**: Clear, descriptive title
- **Description**: Explain what changes were made and why
- **Testing**: Include test results and validation steps
- **Documentation**: Update relevant documentation
- **Breaking Changes**: Clearly mark any breaking changes

### Code Review Checklist

- [ ] Code follows established patterns and conventions
- [ ] Adequate test coverage (unit and integration tests)
- [ ] Error handling is appropriate
- [ ] Security considerations addressed
- [ ] Performance impact considered
- [ ] Documentation updated
- [ ] API changes are backward compatible

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-create-hotel.git
   cd passkey-create-hotel
   ```

2. **Build the service**:
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**:
   ```bash
   cd passkey-create-hotel-service
   java -jar target/passkey-create-hotel-service-{version}-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Access API documentation**:
   - OpenAPI JSON: `http://localhost:8080/{env}/passkey-create-hotel/openapi.json`
   - OpenAPI YAML: `http://localhost:8080/{env}/passkey-create-hotel/openapi.yaml`

### Running Tests

- **Unit Tests**: `mvn test`
- **Integration Tests**: `mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify`
- **Code Coverage**: `mvn package -Pcoverage`

## Links


- [Backstage Service](https://backstage.core.cvent.org/catalog/default/component/passkey-create-hotel-service)
- [API Documentation](https://backstage.core.cvent.org/catalog/default/api/passkey-create-hotel-api)
- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-create-hotel)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-create-hotel-service)
- [Wiki Documentation](https://wiki.cvent.com/display/PASKY/Create+Hotel+Microservice)
