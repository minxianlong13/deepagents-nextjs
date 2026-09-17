# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerization and local testing
- **Git**: Version control
- **IntelliJ IDEA** (recommended) or Eclipse: IDE with Java support

### Development Tools
- **Postman** or **curl**: For API testing
- **pgAdmin** or **DBeaver**: Database administration (optional)
- **Docker Compose**: For local service dependencies

### Access Requirements
- **Cvent VPN**: Required for accessing internal services
- **Nexus Repository Access**: For downloading Cvent internal dependencies
- **GitHub Access**: Read access to cvent-internal organization

## Local Setup

### 1. Repository Setup
```bash
# Clone the repository
git clone git@github.com:cvent-internal/passkey-hiltonsrp.git
cd passkey-hiltonsrp

# Verify Java version
java -version  # Should show Java 21

# Verify Maven configuration
mvn -version
```

### 2. Maven Configuration
Ensure your `~/.m2/settings.xml` includes Cvent's Nexus repository:

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

### 3. Build the Project
```bash
# Clean and compile
mvn clean compile

# Run unit tests
mvn test

# Package the application
mvn package -Prelease
```

### 4. Local Dependencies
Start required local services using Docker Compose:

```bash
# Create docker-compose.yml for local dependencies
cat > docker-compose.yml << EOF
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: passkey_hiltonsrp
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  auth-service-mock:
    image: wiremock/wiremock:latest
    ports:
      - "9090:8080"
    volumes:
      - ./wiremock:/home/wiremock

volumes:
  postgres_data:
EOF

# Start dependencies
docker-compose up -d
```

### 5. Configuration Setup
Create a local development configuration:

```bash
# Copy and modify development config
cp passkey-hiltonsrp-service/configs/dev.yaml passkey-hiltonsrp-service/configs/local.yaml
```

Edit `local.yaml`:
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
  url: jdbc:postgresql://localhost:5432/passkey_hiltonsrp
  user: dev_user
  password: dev_password

hiltonIntegration:
  baseUrl: https://api-staging.hilton.com
  clientId: ${HILTON_CLIENT_ID:-test-client-id}
  clientSecret: ${HILTON_CLIENT_SECRET:-test-client-secret}
  timeout: 30s

authService:
  baseUrl: http://localhost:9090
  timeout: 10s

logging:
  level: DEBUG
  loggers:
    com.cvent.passkeyhiltonsrp: DEBUG
    org.apache.http.wire: INFO
```

## Running the Service

### Command Line
```bash
cd passkey-hiltonsrp-service
java -jar target/passkey-hiltonsrp-service-1.1.1-SNAPSHOT.jar server configs/local.yaml
```

### IntelliJ IDEA Configuration
Create a new Run Configuration:

| Property         | Value                                                           |
|------------------|-----------------------------------------------------------------|
| **Main Class**   | `com.cvent.passkeyhiltonsrp.PasskeyHiltonSRPServiceApplication` |
| **Program Args** | `server configs/local.yaml`                                     |
| **Working Dir**  | `$MODULE_WORKING_DIR$/passkey-hiltonsrp-service`                |
| **Use Classpath**| `passkey-hiltonsrp-service`                                     |
| **JDK**          | Java 21                                                         |

### Environment Variables
Set these environment variables for local development:
```bash
export HILTON_CLIENT_ID=your-test-client-id
export HILTON_CLIENT_SECRET=your-test-client-secret
export LOG_LEVEL=DEBUG
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-hiltonsrp-service

# Run specific test class
mvn test -Dtest=HiltonSRPResourceTest

# Run with coverage
mvn test jacoco:report -Pcoverage
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run integration tests against local environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=local verify
```

### Test Coverage Report
```bash
# Generate coverage report
mvn jacoco:report -Pcoverage

# Open coverage report
open target/site/jacoco/index.html
```

## Code Structure

### Package Organization
```
com.cvent.passkeyhiltonsrp/
├── clients/                 # External API clients
│   ├── HiltonSRPClient.java
│   └── AuthServiceClient.java
├── resources/               # REST endpoints
│   ├── HiltonSRPResource.java
│   └── PasskeyHiltonSRPResource.java
├── services/                # Business logic
│   ├── SyncService.java
│   └── ReservationService.java
├── models/                  # Data models
│   ├── requests/
│   └── responses/
├── config/                  # Configuration classes
│   └── ServiceConfiguration.java
└── PasskeyHiltonSRPServiceApplication.java
```

### Module Dependencies
```
passkey-hiltonsrp-service
├── depends on: passkey-hiltonsrp-api
├── depends on: passkey-hiltonsrp-data-access
└── depends on: passkey-microservices-common

passkey-hiltonsrp-java-client
└── depends on: passkey-hiltonsrp-api

passkey-hiltonsrp-integration-test
├── depends on: passkey-hiltonsrp-api
└── depends on: passkey-hiltonsrp-java-client
```

## Coding Standards

### Java Style Guide
- Follow Google Java Style Guide
- Use 4 spaces for indentation
- Maximum line length: 120 characters
- Use meaningful variable and method names
- Include JavaDoc for public methods

### Code Formatting
```bash
# Format code using Maven plugin
mvn spotless:apply

# Check code formatting
mvn spotless:check
```

### Static Analysis
```bash
# Run Checkstyle
mvn checkstyle:check

# Run SpotBugs
mvn spotbugs:check

# Run PMD
mvn pmd:check
```

## Common Development Tasks

### Adding a New REST Endpoint

1. **Define the endpoint in a Resource class**:
```java
@Path("/api/v1/hilton-srp")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class HiltonSRPResource {
    
    @POST
    @Path("/new-endpoint")
    public Response newEndpoint(RequestModel request) {
        // Implementation
        return Response.ok(response).build();
    }
}
```

2. **Register the resource in the Application class**:
```java
@Override
public void run(ServiceConfiguration configuration, Environment environment) {
    environment.jersey().register(new HiltonSRPResource());
}
```

3. **Add unit tests**:
```java
@Test
public void testNewEndpoint() {
    // Test implementation
}
```

### Adding a New Configuration Property

1. **Add property to Configuration class**:
```java
public class ServiceConfiguration extends Configuration {
    @JsonProperty
    private String newProperty;
    
    public String getNewProperty() {
        return newProperty;
    }
}
```

2. **Update configuration files**:
```yaml
newProperty: "default-value"
```

3. **Use in service classes**:
```java
@Inject
public MyService(ServiceConfiguration config) {
    this.newProperty = config.getNewProperty();
}
```

### Adding External API Integration

1. **Create client interface**:
```java
public interface ExternalApiClient {
    Response callExternalApi(RequestModel request);
}
```

2. **Implement client**:
```java
@Component
public class ExternalApiClientImpl implements ExternalApiClient {
    // Implementation using Jersey Client
}
```

3. **Add configuration**:
```java
public class ExternalApiConfiguration {
    @JsonProperty
    private String baseUrl;
    
    @JsonProperty
    private Duration timeout;
}
```

### Database Migration

1. **Create migration file**:
```sql
-- V1.2.0__Add_new_table.sql
CREATE TABLE new_table (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. **Update entity classes**:
```java
@Entity
@Table(name = "new_table")
public class NewEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name")
    private String name;
}
```

## Debugging

### Local Debugging
1. Start the service with debug flags:
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-hiltonsrp-service-1.1.1-SNAPSHOT.jar server configs/local.yaml
```

2. Connect IntelliJ debugger to port 5005

### Log Analysis
```bash
# Tail application logs
tail -f logs/application.log

# Search for specific patterns
grep "ERROR" logs/application.log

# Filter by correlation ID
grep "correlation-id-12345" logs/application.log
```

### Health Check Endpoints
```bash
# Check service health
curl http://localhost:8081/health

# Check metrics
curl http://localhost:8081/metrics

# Thread dump
curl http://localhost:8081/threads
```

## Troubleshooting

### Common Issues

#### Maven Build Failures
```bash
# Clear local repository
rm -rf ~/.m2/repository/com/cvent

# Rebuild with clean slate
mvn clean install -U
```

#### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test database connection
psql -h localhost -p 5432 -U dev_user -d passkey_hiltonsrp
```

#### External API Issues
```bash
# Test Hilton API connectivity
curl -H "Authorization: Bearer token" https://api-staging.hilton.com/health

# Check auth service mock
curl http://localhost:9090/__admin/mappings
```

### Performance Profiling
```bash
# Run with JProfiler
java -agentpath:/path/to/jprofiler/bin/linux-x64/libjprofilerti.so=port=8849 \
     -jar target/passkey-hiltonsrp-service-1.1.1-SNAPSHOT.jar server configs/local.yaml

# Run with JVM profiling
java -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=profile.jfr \
     -jar target/passkey-hiltonsrp-service-1.1.1-SNAPSHOT.jar server configs/local.yaml
```

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Access to Cvent's internal Nexus repository

### Running Locally

1. **Build the service**:
   ```bash
   mvn package -Prelease
   ```

2. **Run the service**:
   ```bash
   cd passkey-hiltonsrp-service
   java -jar target/passkey-hiltonsrp-service-1.1.1-SNAPSHOT.jar server configs/dev.yaml
   ```

3. **Run integration tests**:
   ```bash
   mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
   ```

## Service Ownership


| Role      | Team          | Slack Channel            |
|-----------|---------------|--------------------------|
| Primary   | Meeseeksbox   | `#passkey-meeseeks-box`  |
| Secondary | Cherrypickers | `#passkey-cherry-pickers`|

## Useful Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/passkey/job/passkey-hiltonsrp/)
- [Admin Portal](https://admin.core.cvent.org/serviceid/23cedbc4-a0d7-4b10-83ba-5bf303f49ff9)
- [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-hiltonsrp-service)
- [Technical Documentation](./TECHNICAL_DETAILS.md)
- [API Reference](./API_REFERENCE.md)
