# Development Guide

## Prerequisites

### Required Software

- **Java 17+**: OpenJDK or Oracle JDK
- **Maven 3.8+**: Build and dependency management
- **Node.js 18+**: Build tooling and package management
- **pnpm 8+**: Package manager (faster than npm)
- **Docker**: Container runtime for local services
- **Git**: Version control
- **AWS CLI**: AWS service interaction

### Recommended Tools

- **IntelliJ IDEA**: IDE with Spring Boot support
- **Visual Studio Code**: Lightweight editor with extensions
- **Postman**: API testing and development
- **DBeaver**: Database client for Oracle connections
- **AWS CLI**: Command-line interface for AWS services

### Tool Installation

**Using asdf (recommended)**:
```bash
# Install asdf
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.13.1

# Add to shell profile
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc
echo '. ~/.asdf/completions/asdf.bash' >> ~/.bashrc

# Install plugins
asdf plugin add java
asdf plugin add maven
asdf plugin add nodejs
asdf plugin add pnpm

# Install versions from .tool-versions
asdf install
```

**Manual Installation**:
```bash
# Java 17
sudo apt-get install openjdk-17-jdk  # Ubuntu/Debian
brew install openjdk@17              # macOS

# Maven
sudo apt-get install maven           # Ubuntu/Debian
brew install maven                   # macOS

# Node.js and pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm env use --global 18
```

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-inbound-service.git
cd passkey-inbound-service
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Install Java dependencies
cd packages/passkey-inbound
mvn clean install -DskipTests
```

### 3. Start LocalStack

LocalStack provides local AWS services for development:

```bash
# Start LocalStack with Docker
docker run --rm -it \
  -p 4566:4566 \
  -e SERVICES=sqs,dynamodb,s3,lambda \
  -e DEBUG=1 \
  -v $(pwd)/localstack:/etc/localstack/init/ready.d \
  localstack/localstack
```

**LocalStack Initialization Script** (`localstack/init.sh`):
```bash
#!/bin/bash

# Create SQS queues
awslocal sqs create-queue --queue-name passkey-inbound-external-data-load-local
awslocal sqs create-queue --queue-name passkey-inbound-passkey-payloads-local.fifo --attributes FifoQueue=true
awslocal sqs create-queue --queue-name passkey-inbound-ohip-connections-local
awslocal sqs create-queue --queue-name passkey-inbound-ohip-business-events-local.fifo --attributes FifoQueue=true
awslocal sqs create-queue --queue-name passkey-inbound-result-message-local

# Create DynamoDB table
awslocal dynamodb create-table \
  --table-name inbound-configs-local \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Create S3 bucket
awslocal s3 mb s3://passkey-inbound-logs-local
```

### 4. Configure Environment

**Environment Variables** (`.env` file):
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566

# SQS Queues
ExternalDataLoadSqsName=http://localhost:4566/000000000000/passkey-inbound-external-data-load-local
InboundPasskeyPayloadsSqsName=http://localhost:4566/000000000000/passkey-inbound-passkey-payloads-local.fifo
OhipConnectionsSqsName=http://localhost:4566/000000000000/passkey-inbound-ohip-connections-local
PasskeyInboundOhipBusinessEventsSqsName=http://localhost:4566/000000000000/passkey-inbound-ohip-business-events-local.fifo
PasskeyInboundOhipBusinessEventsDelayedSqsName=http://localhost:4566/000000000000/passkey-inbound-ohip-business-events-delayed-local.fifo
ResultMessageSqsName=http://localhost:4566/000000000000/passkey-inbound-result-message-local

# DynamoDB
InboundConfigsDynamoDbName=inbound-configs-local

# S3
INT_LOGS_BUCKET=passkey-inbound-logs-local

# Application
ENV=local
LOCAL_API_KEY=local-development-key
SPRING_PROFILES_ACTIVE=local
```

### 5. Start the Service

**Using Maven**:
```bash
cd packages/passkey-inbound/service
mvn spring-boot:run
```

**Using IDE**:
- Import the project as a Maven project
- Set main class: `com.cvent.passkeyinbound.InboundServiceSpringBootApplication`
- Set VM options: `-Dspring.profiles.active=local`
- Set environment variables from `.env` file

**Using Docker**:
```bash
# Build image
docker build -t passkey-inbound-service .

# Run container
docker run -p 8080:8080 \
  --env-file .env \
  passkey-inbound-service
```

### 6. Verify Setup

**Health Check**:
```bash
curl http://localhost:8080/actuator/health
```

**Expected Response**:
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "sqs": {"status": "UP"},
    "dynamodb": {"status": "UP"}
  }
}
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=EventControllerTest

# Run tests with coverage
mvn test jacoco:report
```

### Integration Tests

```bash
# Run integration tests
mvn verify -P run-it

# Run specific integration test
mvn verify -P run-it -Dit.test=EventProcessingIT
```

### End-to-End Tests

```bash
# Start all services
docker-compose up -d

# Run E2E tests
pnpm test:e2e

# Cleanup
docker-compose down
```

## Code Structure

### Package Organization

```
com.cvent.passkeyinbound/
├── controllers/           # REST and GraphQL controllers
│   ├── EventController.java
│   ├── GmlController.java
│   └── GraphQlSubscriptionController.java
├── services/             # Business logic services
│   ├── impl/            # Service implementations
│   └── interfaces/      # Service interfaces
├── dao/                 # Data access objects
│   ├── dynamo/         # DynamoDB DAOs
│   └── mybatis/        # MyBatis mappers
├── model/              # Domain models and DTOs
│   ├── dynamo/        # DynamoDB entities
│   ├── ohip/          # OHIP-specific models
│   └── dto/           # Data transfer objects
├── config/             # Spring configuration
│   ├── SecurityConfig.java
│   ├── AwsConfig.java
│   └── WebConfig.java
├── ohip/              # OHIP-specific services
│   └── services/      # OHIP service implementations
└── util/              # Utility classes
    ├── Constants.java
    └── DateUtils.java
```

### Naming Conventions

**Classes**:
- Controllers: `*Controller` (e.g., `EventController`)
- Services: `*Service` or `*ServiceImpl` (e.g., `AdminService`)
- DAOs: `*Dao` (e.g., `InboundConfigsDao`)
- Models: Descriptive names (e.g., `BusinessEvent`, `HotelConfig`)
- DTOs: `*Dto` or `*Request`/`*Response` (e.g., `EventDto`)

**Methods**:
- Use camelCase
- Start with verb (get, create, update, delete, process)
- Be descriptive: `processBusinessEvent()` vs `process()`

**Variables**:
- Use camelCase
- Avoid abbreviations: `vendorSystemId` vs `vsId`
- Use meaningful names: `hotelConfiguration` vs `config`

## Coding Standards

### Code Style

The project uses standard Java conventions with some Cvent-specific guidelines:

**Formatting**:
- Indentation: 4 spaces (no tabs)
- Line length: 120 characters
- Braces: K&R style (opening brace on same line)

**Imports**:
- Group imports: java.*, javax.*, org.*, com.*, static imports
- No wildcard imports (except for static imports in tests)
- Remove unused imports

**Comments**:
- Use JavaDoc for public methods and classes
- Inline comments for complex business logic
- TODO comments should include ticket numbers

### Example Code Style

```java
/**
 * Processes business events from vendor systems.
 * 
 * @param vendorSystemId the vendor system identifier
 * @param businessEvent the event to process
 * @return processing result
 * @throws ValidationException if event validation fails
 */
@PostMapping("/ohip/{vsId}/events")
@CventAuthorization(scopes = {"ADMIN"})
public ResponseEntity<EventProcessingResult> processBusinessEvent(
        @PathVariable("vsId") Long vendorSystemId,
        @RequestBody @Valid BusinessEvent businessEvent) {
    
    // Validate vendor system exists and is active
    if (!vendorSystemService.isActive(vendorSystemId)) {
        throw new ValidationException("Vendor system is not active: " + vendorSystemId);
    }
    
    // Get hotel configuration for event processing
    List<HotelConfig> hotelConfigs = inboundConfigsDao.getVendorSystemHotelConfigs(vendorSystemId);
    
    // Process the event asynchronously
    EventProcessingResult result = ohipBusinessEventSqsService.sendMessageToQueue(
        businessEvent.getNewEvent(), 
        createSubscriptionManagement(vendorSystemId), 
        hotelConfigs
    );
    
    return ResponseEntity.ok(result);
}
```

### Lombok Usage

Use Lombok annotations to reduce boilerplate code:

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessEvent {
    private String eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private Long vendorSystemId;
    private String hotelId;
    private Object data;
}
```

### Error Handling

**Exception Hierarchy**:
```java
public class PasskeyInboundException extends RuntimeException {
    // Base exception for all service-specific errors
}

public class ValidationException extends PasskeyInboundException {
    // Input validation errors
}

public class ConfigurationException extends PasskeyInboundException {
    // Configuration-related errors
}

public class IntegrationException extends PasskeyInboundException {
    // External service integration errors
}
```

**Global Exception Handler**:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .code("VALIDATION_ERROR")
            .message(ex.getMessage())
            .timestamp(Instant.now())
            .build();
        return ResponseEntity.badRequest().body(error);
    }
}
```

## Testing Guidelines

### Unit Testing

**Test Structure**:
```java
@ExtendWith(MockitoExtension.class)
class EventControllerTest {
    
    @Mock
    private OhipBusinessEventSqsService sqsService;
    
    @Mock
    private InboundConfigsDao configsDao;
    
    @InjectMocks
    private EventController eventController;
    
    @Test
    void shouldProcessBusinessEventSuccessfully() {
        // Given
        Long vendorSystemId = 12345L;
        BusinessEvent event = createTestBusinessEvent();
        List<HotelConfig> configs = createTestConfigs();
        
        when(configsDao.getVendorSystemHotelConfigs(vendorSystemId))
            .thenReturn(configs);
        
        // When
        ResponseEntity<Void> response = eventController.consumeEvent(vendorSystemId, event);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(sqsService).sendMessageToQueue(any(), any(), eq(configs));
    }
}
```

### Integration Testing

**Test Configuration**:
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "spring.profiles.active=test",
    "aws.sqs.external-data-load=http://localhost:4566/000000000000/test-queue"
})
@Testcontainers
class EventProcessingIT {
    
    @Container
    static LocalStackContainer localstack = new LocalStackContainer(DockerImageName.parse("localstack/localstack:latest"))
        .withServices(LocalStackContainer.Service.SQS, LocalStackContainer.Service.DYNAMODB);
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void shouldProcessEventEndToEnd() {
        // Test implementation
    }
}
```

### Test Data

**Test Builders**:
```java
public class TestDataBuilder {
    
    public static BusinessEvent.BusinessEventBuilder businessEvent() {
        return BusinessEvent.builder()
            .eventId("test-event-" + UUID.randomUUID())
            .eventType("RESERVATION_CREATED")
            .timestamp(LocalDateTime.now())
            .vendorSystemId(12345L)
            .hotelId("HTL001")
            .data(Map.of("confirmationNumber", "CNF123"));
    }
    
    public static HotelConfig.HotelConfigBuilder hotelConfig() {
        return HotelConfig.builder()
            .hotelId("HTL001")
            .vendorSystemId(12345L)
            .gmlEnabled(true)
            .inboundReservationEnabled(true);
    }
}
```

## Common Tasks

### Adding a New Endpoint

1. **Create Controller Method**:
```java
@PostMapping("/new-endpoint")
@CventAuthorization(scopes = {"ADMIN"})
public ResponseEntity<ResponseDto> newEndpoint(@RequestBody RequestDto request) {
    // Implementation
}
```

2. **Add Service Method**:
```java
public ResponseDto processNewRequest(RequestDto request) {
    // Business logic
}
```

3. **Add Tests**:
```java
@Test
void shouldHandleNewEndpoint() {
    // Test implementation
}
```

4. **Update API Documentation**:
- Add endpoint to `API_REFERENCE.md`
- Include request/response examples
- Document error codes

### Adding a New Configuration Property

1. **Add to Configuration Class**:
```java
@ConfigurationProperties(prefix = "passkey.inbound")
@Data
public class PasskeyInboundConfig {
    private String newProperty;
}
```

2. **Add to YAML Files**:
```yaml
passkey:
  inbound:
    new-property: ${NEW_PROPERTY:default-value}
```

3. **Add Environment Variable**:
```bash
NEW_PROPERTY=production-value
```

4. **Update Documentation**:
- Add to `TECHNICAL_DETAILS.md`
- Document in deployment guides

### Adding a New Service Integration

1. **Create Client Interface**:
```java
public interface NewServiceClient {
    ResponseDto callNewService(RequestDto request);
}
```

2. **Implement Client**:
```java
@Service
public class NewServiceClientImpl implements NewServiceClient {
    // Implementation using WebClient
}
```

3. **Add Configuration**:
```java
@Bean
public NewServiceClient newServiceClient(WebClient.Builder builder) {
    return new NewServiceClientImpl(builder.build());
}
```

4. **Add Circuit Breaker**:
```java
@CircuitBreaker(name = "new-service")
public ResponseDto callNewService(RequestDto request) {
    // Implementation
}
```

## Debugging

### Local Debugging

**IDE Setup**:
- Set breakpoints in code
- Start application in debug mode
- Use remote debugging for containerized apps

**Remote Debugging**:
```bash
# Add JVM arguments
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005

# Connect IDE to localhost:5005
```

### Log Analysis

**Log Levels**:
```yaml
logging:
  level:
    com.cvent.passkeyinbound: DEBUG
    org.springframework.web: DEBUG
    software.amazon.awssdk: WARN
```

**Structured Logging**:
```java
@Slf4j
public class EventController {
    
    public void processEvent(BusinessEvent event) {
        log.info("Processing event: eventId={}, type={}, vendorSystemId={}", 
            event.getEventId(), event.getEventType(), event.getVendorSystemId());
    }
}
```

### Performance Profiling

**JVM Profiling**:
```bash
# Enable JFR (Java Flight Recorder)
-XX:+FlightRecorder
-XX:StartFlightRecording=duration=60s,filename=profile.jfr

# Analyze with JProfiler or VisualVM
```

**Application Metrics**:
```java
@Component
public class EventMetrics {
    
    private final Counter eventsProcessed = Counter.builder("events.processed")
        .description("Number of events processed")
        .register(Metrics.globalRegistry);
    
    public void recordEventProcessed() {
        eventsProcessed.increment();
    }
}
```

## Troubleshooting

### Common Issues

**LocalStack Connection Issues**:
```bash
# Check LocalStack status
curl http://localhost:4566/health

# Restart LocalStack
docker restart <localstack-container-id>
```

**Maven Build Issues**:
```bash
# Clean and rebuild
mvn clean install -U

# Skip tests if needed
mvn clean install -DskipTests
```

**Spring Boot Startup Issues**:
- Check application.yml syntax
- Verify environment variables
- Check port conflicts (8080)
- Review startup logs for errors

**AWS Service Issues**:
- Verify AWS credentials
- Check service endpoints
- Review IAM permissions
- Check network connectivity

## Additional Resources

## Quick Start


### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+ (for build tools)
- Docker (for local development)
- AWS CLI configured (for deployment)

### Local Development Setup

1. **Install dependencies**:
   ```bash
   asdf install  # Installs tools from .tool-versions
   pnpm install  # Installs Node.js dependencies
   ```

2. **Start LocalStack** (for AWS services):
   ```bash
   docker run --rm -p 4566:4566 localstack/localstack
   ```

3. **Run the service**:
   ```bash
   cd packages/passkey-inbound/service
   mvn spring-boot:run
   ```

4. **Access the service**:
   - REST API: `http://localhost:8080/passkey-inbound/v1`
   - GraphQL: `http://localhost:8080/graphql`
   - Health Check: `http://localhost:8080/actuator/health`

### Build Commands

From project root:

- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Run linting
- `pnpm fix` - Auto-fix linting issues

From service directory:

- `mvn clean install` - Build the service
- `mvn test` - Run unit tests
- `mvn spring-boot:run` - Start the service locally

## Environment Variables


Key environment variables for local development:

```bash
AWS_REGION=us-east-1
ExternalDataLoadSqsName=http://localhost:4566/000000000000/passkey-inbound-external-data-load-local
InboundConfigsDynamoDbName=inbound-configs-alpha
InboundPasskeyPayloadsSqsName=http://localhost:4566/000000000000/passkey-inbound-passkey-payloads-local.fifo
LOCAL_API_KEY=your-local-api-key
ENV=local
```

## Support


- **Team**: Meeseeksbox
- **Slack**: #passkey-api
- **Jenkins**: [CI Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-inbound-service)
- **Octopus**: [Deployments](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-inbound-service/deployments)
- **Datadog**: [Logs](https://cvent.datadoghq.com/logs?query=env%3Apr50+service%3Apasskey-inbound*)
