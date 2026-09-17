# Development Guide

## Prerequisites

### Required Software
- **Java 21**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool and dependency management
- **Docker**: For containerized development and testing
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Development Tools
- **Postman/Insomnia**: API testing
- **DynamoDB Local**: Local database for development
- **AWS CLI**: For AWS service interaction
- **Datadog Agent**: Local monitoring (optional)

### Environment Setup
```bash
# Install Java 21 (using SDKMAN)
curl -s "https://get.sdkman.io" | bash
sdk install java 21.0.1-open

# Install Maven
sdk install maven 3.9.6

# Verify installations
java -version
mvn -version
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-delphifdc.git
cd passkey-delphifdc
```

### 2. Configure Environment
Create local configuration file:
```bash
cp passkey-delphifdc-service/configs/dev.yaml.template passkey-delphifdc-service/configs/local.yaml
```

Edit `local.yaml` with your local settings:
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  region: us-east-1
  endpoint: http://localhost:8000  # DynamoDB Local

auth:
  endpoint: https://auth-service.dev.cvent.com
  apiKey: ${API_KEY}

defaultEnvironment: local
defaultPkUser: developer

externalServices:
  amadeusIntegration:
    endpoint: https://amadeus-integration.dev.cvent.com
  eventHousing:
    endpoint: https://passkey-event-housing.dev.cvent.com
  csnIbkConfigSku:
    endpoint: https://csn-ibk-config-sku.dev.cvent.com
```

### 3. Set Up Local Database
```bash
# Start DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Create tables (run in separate terminal)
aws dynamodb create-table \
    --table-name passkey-delphifdc-notifications-local \
    --attribute-definitions \
        AttributeName=notificationId,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
    --key-schema \
        AttributeName=notificationId,KeyType=HASH \
        AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000

# Create other required tables
./scripts/create-local-tables.sh
```

### 4. Build Project
```bash
# Clean build
mvn clean compile

# Build with tests
mvn clean package

# Build for release (skip tests)
mvn clean package -Prelease
```

### 5. Run Application
```bash
cd passkey-delphifdc-service

# Run with local configuration
java -jar target/passkey-delphifdc-service-1.8.2-SNAPSHOT.jar server configs/local.yaml

# Run with debug mode
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-delphifdc-service-1.8.2-SNAPSHOT.jar server configs/local.yaml
```

### 6. Verify Setup
```bash
# Health check
curl http://localhost:8080/health

# Admin endpoints
curl http://localhost:8081/metrics
curl http://localhost:8081/healthcheck
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=PasskeyDelphifdcResourceTest

# Run with coverage
mvn test -Pcoverage
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Dkarate.env=dev verify

# Run integration tests against local environment
mvn -Prun-it -Dkarate.env=local verify

# Run specific integration test
mvn -Prun-it -Dkarate.env=dev test -Dtest=NotificationIntegrationTest
```

### Test Configuration
For IntelliJ IDEA integration tests:
```
VM options: -Dkarate.env=dev -Dkarate.config.dir=test_configs
Working directory: $MODULE_WORKING_DIR$
```

## Code Structure

### Package Organization
```
com.cvent.passkeydelphifdc/
├── auth/                    # Authentication and authorization
│   ├── AuthService.java
│   └── Authorization.java
├── clients/                 # External service clients
│   └── AmadeusIntegrationClient.java
├── configuration/           # Configuration classes
│   └── MultiEnvConfig.java
├── dataaccess/             # Data access layer
│   └── UserDetailesDataAccess.java
├── exceptions/             # Custom exceptions and mappers
│   ├── DelphifdcException.java
│   └── DelphifdcExceptionMapper.java
├── health/                 # Health check implementations
│   └── PasskeyDelphifdcHealthCheck.java
├── mapper/                 # MyBatis mappers
│   └── UserDetailsMapper.java
├── model/                  # Data models (in API module)
│   ├── NotificationRequest.java
│   └── EventDetail.java
├── resources/              # REST endpoints
│   ├── PasskeyDelphifdcResource.java
│   ├── CallbackResource.java
│   └── emulation/
│       └── EmulationResource.java
├── services/               # Business logic services
│   ├── NotificationProcessor.java
│   ├── ProcessingService.java
│   ├── AmadeusService.java
│   └── dynamodb/
│       ├── NotificationDynamoDBService.java
│       ├── TaskDynamoDBService.java
│       ├── LogDynamoDBService.java
│       └── ErrorDynamoDBService.java
└── util/                   # Utility classes
    ├── ClientUtil.java
    └── ClientJacksonResolver.java
```

### Module Dependencies
```
passkey-delphifdc-service
├── depends on: passkey-delphifdc-api
├── depends on: passkey-delphifdc-data-access
├── depends on: passkey-delphifdc-shared
└── depends on: passkey-delphifdc-java-client

passkey-delphifdc-data-access
├── depends on: passkey-delphifdc-api
└── depends on: passkey-delphifdc-shared

passkey-delphifdc-java-client
└── depends on: passkey-delphifdc-api
```

## Coding Standards

### Java Code Style
- **Formatting**: Follow Google Java Style Guide
- **Line Length**: Maximum 120 characters
- **Indentation**: 4 spaces (no tabs)
- **Imports**: Organize imports, remove unused
- **Naming**: CamelCase for classes, camelCase for methods/variables

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

### Documentation Standards
- **JavaDoc**: Required for all public methods and classes
- **Comments**: Explain complex business logic
- **README**: Update for significant changes
- **API Documentation**: Keep OpenAPI spec current

### Example Code Style
```java
/**
 * Processes event notifications from Amadeus Delphi FDC system.
 * 
 * @param eventRequests List of notification requests to process
 * @return Processing result with status and count
 * @throws DelphifdcException if processing fails
 */
@POST
@Path("/events")
public Response notifyEvent(
        @Authority(methods = {AuthMethod.API_KEY}) GrantedAPIKey grantedAPIKey,
        @Context UriInfo uriInfo,
        @Valid @NotNull List<NotificationRequest> eventRequests) throws Exception {
    
    // Validate input
    if (eventRequests == null || eventRequests.isEmpty()) {
        throw new DelphifdcException("Event requests cannot be empty", 
                                   HttpStatus.BAD_REQUEST_400, 
                                   LogLevel.ERROR);
    }
    
    // Process notifications
    logRequest(eventRequests);
    notificationRequestService.saveNotificationRequests(eventRequests);
    
    return Response.ok().build();
}
```

## Common Development Tasks

### Adding a New Endpoint

1. **Define the endpoint in Resource class**:
```java
@POST
@Path("/new-endpoint")
public Response newEndpoint(@Valid RequestModel request) {
    // Implementation
    return Response.ok(result).build();
}
```

2. **Add request/response models** in API module:
```java
public class RequestModel {
    @NotNull
    private String requiredField;
    
    // Getters and setters
}
```

3. **Implement business logic** in Service class:
```java
public class NewService {
    public ResultModel processRequest(RequestModel request) {
        // Business logic
        return result;
    }
}
```

4. **Add integration test**:
```gherkin
Feature: New Endpoint
  Scenario: Successful request processing
    Given a valid request
    When I call the new endpoint
    Then I should receive a success response
```

### Adding a New DynamoDB Table

1. **Create table schema**:
```java
@DynamoDbBean
public class NewEntity {
    private String id;
    private String data;
    private Instant createdAt;
    
    @DynamoDbPartitionKey
    public String getId() { return id; }
    
    @DynamoDbSortKey
    public Instant getCreatedAt() { return createdAt; }
}
```

2. **Implement service class**:
```java
public class NewDynamoDBService {
    private final DynamoDbClient dynamoDbClient;
    private final DynamoDbTable<NewEntity> table;
    
    public void save(NewEntity entity) {
        table.putItem(entity);
    }
    
    public Optional<NewEntity> findById(String id) {
        return Optional.ofNullable(table.getItem(Key.builder().partitionValue(id).build()));
    }
}
```

3. **Add table creation script**:
```bash
aws dynamodb create-table \
    --table-name passkey-delphifdc-new-table-${ENV} \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=createdAt,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
        AttributeName=createdAt,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST
```

### Adding External Service Integration

1. **Define client interface**:
```java
public interface NewServiceClient {
    @GET
    @Path("/data/{id}")
    Response getData(@PathParam("id") String id);
}
```

2. **Create provider class**:
```java
public class NewServiceProvider {
    private final NewServiceClient client;
    private final ClientUtil clientUtil;
    
    public DataModel fetchData(String id) {
        Response response = client.getData(id);
        return clientUtil.processResponse(response, DataModel.class);
    }
}
```

3. **Configure in application**:
```java
NewServiceClient newServiceClient = clientUtil.getClient(
    NewServiceClient.class,
    config.getNewService().getEndpoint(),
    auth.getApiKey()
);
```

## Debugging

### Local Debugging
1. **Enable debug mode**:
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar target/passkey-delphifdc-service-1.8.2-SNAPSHOT.jar server configs/local.yaml
```

2. **Configure IDE debugger** to connect to port 5005

3. **Set breakpoints** in your code

### Log Analysis
```bash
# Tail application logs
tail -f logs/application.log

# Search for specific correlation ID
grep "correlation-id-12345" logs/application.log

# Filter by log level
grep "ERROR" logs/application.log | tail -20
```

### Database Debugging
```bash
# Query DynamoDB Local
aws dynamodb scan \
    --table-name passkey-delphifdc-notifications-local \
    --endpoint-url http://localhost:8000

# Query specific item
aws dynamodb get-item \
    --table-name passkey-delphifdc-notifications-local \
    --key '{"notificationId":{"S":"test-123"}}' \
    --endpoint-url http://localhost:8000
```

## Performance Testing

### Load Testing with JMeter
```xml
<!-- JMeter test plan for notification endpoint -->
<TestPlan>
    <ThreadGroup>
        <numThreads>10</numThreads>
        <rampTime>30</rampTime>
        <duration>300</duration>
    </ThreadGroup>
    <HTTPSampler>
        <domain>localhost</domain>
        <port>8080</port>
        <path>/api/v1/events</path>
        <method>POST</method>
    </HTTPSampler>
</TestPlan>
```

### Profiling
```bash
# Run with JProfiler
java -agentpath:/path/to/jprofiler/bin/linux-x64/libjprofilerti.so=port=8849 \
     -jar target/passkey-delphifdc-service-1.8.2-SNAPSHOT.jar server configs/local.yaml

# Run with JVM profiling
java -XX:+FlightRecorder \
     -XX:StartFlightRecording=duration=60s,filename=profile.jfr \
     -jar target/passkey-delphifdc-service-1.8.2-SNAPSHOT.jar server configs/local.yaml
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Maven cache
mvn dependency:purge-local-repository

# Rebuild from scratch
mvn clean install -U
```

#### Connection Issues
```bash
# Test external service connectivity
curl -v https://auth-service.dev.cvent.com/health

# Check DynamoDB Local
curl http://localhost:8000/
```

#### Memory Issues
```bash
# Increase JVM heap size
export MAVEN_OPTS="-Xmx2g -XX:MaxPermSize=512m"

# Run with memory profiling
java -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/tmp/heapdump.hprof \
     -jar target/passkey-delphifdc-service-1.8.2-SNAPSHOT.jar server configs/local.yaml
```

### Getting Help
- **Team Slack**: #passkey-team
- **Documentation**: [Wiki](https://wiki.cvent.com/display/PASKY/Design+of+delphi.fdc)
- **Code Reviews**: Create pull request for review
- **Architecture Questions**: Contact @meeseeksbox team

## Additional Resources

## Quick Start


### Prerequisites
- Java 21
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cvent-internal/passkey-delphifdc.git
   cd passkey-delphifdc
   ```

2. **Build the project**
   ```bash
   mvn package -Prelease
   ```

3. **Run locally**
   ```bash
   cd passkey-delphifdc-service
   java -jar target/passkey-delphifdc-service-1.8.2-SNAPSHOT.jar server configs/dev.yaml
   ```

4. **Run integration tests**
   ```bash
   mvn -Prun-it -Dkarate.env=dev verify
   ```

### Docker Deployment

```bash
docker build -t passkey-delphifdc .
docker run -p 8080:8080 passkey-delphifdc
```

## Links


- [Datadog APM](https://cvent.datadoghq.com/apm/services/passkey-delphifdc-service/operations/servlet.request/resources)
- [Datadog Logs](https://cvent.datadoghq.com/logs?query=env%3Apr50+service%3Apasskey-delphifdc-service)
- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-delphifdc)
- [Design Documentation](https://wiki.cvent.com/display/PASKY/Design+of+delphi.fdc)

## Team


**Owner**: meeseeksbox  
**Business Unit**: Hospitality  
**Platform**: Passkey  
**Product**: Passkey for Hotels
