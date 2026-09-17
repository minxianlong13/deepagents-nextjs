# Development Guide

## Prerequisites

### Required Software

#### Java Development
- **Java 17+**: OpenJDK or Oracle JDK (LTS version)
- **Maven 3.6+**: Build automation and dependency management
- **IDE**: IntelliJ IDEA (recommended) or Eclipse with Java EE support

#### Node.js Development
- **Node.js 18+**: JavaScript runtime for build tools
- **pnpm 8+**: Fast, disk space efficient package manager
- **Nx CLI**: Monorepo build system

#### Development Tools
- **Git**: Version control system
- **Docker**: Container runtime for local services
- **AWS CLI**: Command line interface for AWS services
- **curl**: Command line tool for API testing

#### Optional Tools
- **Postman**: API testing and documentation
- **DBeaver**: Database administration tool
- **AWS SAM CLI**: Local AWS Lambda development

### Installation Commands

#### macOS (using Homebrew)
```bash
# Install Java 17
brew install openjdk@17

# Install Maven
brew install maven

# Install Node.js and pnpm
brew install node
npm install -g pnpm

# Install Nx CLI
pnpm add -g nx

# Install AWS CLI
brew install awscli

# Install Docker
brew install --cask docker
```

#### Ubuntu/Debian
```bash
# Install Java 17
sudo apt update
sudo apt install openjdk-17-jdk

# Install Maven
sudo apt install maven

# Install Node.js and pnpm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Install Nx CLI
pnpm add -g nx

# Install AWS CLI
sudo apt install awscli

# Install Docker
sudo apt install docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-event-data.git
cd passkey-event-data
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Verify Maven installation
mvn --version

# Verify Java installation
java --version
```

### 3. Configure Environment

#### AWS Configuration
```bash
# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (us-east-1)

# Verify AWS configuration
aws sts get-caller-identity
```

#### Environment Variables
Create a `.env.local` file in the project root:

```bash
# Database Configuration
DYNAMODB_REGION=us-east-1
DYNAMODB_TABLE_NAME=dev-passkey-event-requests
DYNAMODB_ENDPOINT=http://localhost:8000

# Authentication
API_KEY=your-development-api-key

# External Services
REGLINK_SERVICE_ENDPOINT=https://dev-reglink.cvent.com

# Application Settings
SERVER_PORT=8080
ADMIN_PORT=8081
LOG_LEVEL=DEBUG
```

### 4. Start Local Services

#### DynamoDB Local
```bash
# Download and start DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Create local table
aws dynamodb create-table \
  --table-name dev-passkey-event-requests \
  --attribute-definitions \
    AttributeName=participantId,AttributeType=N \
    AttributeName=requestId,AttributeType=S \
  --key-schema \
    AttributeName=participantId,KeyType=HASH \
    AttributeName=requestId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

#### Optional: LocalStack (for S3 and other AWS services)
```bash
# Start LocalStack
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -e SERVICES=s3,secretsmanager \
  localstack/localstack

# Create S3 bucket
aws s3 mb s3://dev-passkey-files --endpoint-url http://localhost:4566
```

## Running the Application

### Development Mode

#### Using Maven
```bash
cd packages/passkey-event-data/service
mvn exec:exec
```

#### Using Nx
```bash
# From project root
nx run passkey-event-data-service:serve
```

#### Using IDE
1. Open the project in IntelliJ IDEA
2. Navigate to `PasskeyEventDataApplication.java`
3. Right-click and select "Run PasskeyEventDataApplication"
4. Configure program arguments: `server configs/dev.yaml`

### Verify Application Startup

```bash
# Check health endpoint
curl http://localhost:8080/healthcheck

# Check admin endpoints
curl http://localhost:8081/admin/healthcheck
curl http://localhost:8081/admin/metrics
```

Expected response:
```json
{
  "passkey-event-data-service": {
    "healthy": true
  },
  "deadlocks": {
    "healthy": true
  }
}
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
nx run passkey-event-data-service:test

# Run tests with coverage
nx run passkey-event-data-service:test --coverage

# Run specific test class
mvn test -Dtest=EventRequestsResourceTest -f packages/passkey-event-data/service/pom.xml
```

### Integration Tests

```bash
# Run integration tests
nx run passkey-event-data-service:ci:test

# Run integration tests with Maven profile
mvn test -Prun-it -f packages/passkey-event-data/pom.xml
```

### Load Tests

```bash
# Run performance tests (if available)
nx run passkey-event-data-service:load-test
```

## Code Structure

### Project Layout

```
passkey-event-data/
├── packages/
│   ├── passkey-event-data/
│   │   ├── parent/                 # Parent POM configuration
│   │   ├── model/                  # Data models and DTOs
│   │   │   └── src/main/java/com/cvent/passkeyeventdata/model/
│   │   ├── java-client/            # Client library
│   │   ├── service/                # Main service implementation
│   │   │   ├── src/main/java/com/cvent/passkeyeventdata/
│   │   │   │   ├── PasskeyEventDataApplication.java
│   │   │   │   ├── PasskeyEventDataConfiguration.java
│   │   │   │   ├── resources/      # REST endpoints
│   │   │   │   ├── services/       # Business logic
│   │   │   │   ├── repository/     # Data access layer
│   │   │   │   ├── clients/        # External service clients
│   │   │   │   ├── exceptions/     # Custom exceptions
│   │   │   │   └── health/         # Health checks
│   │   │   ├── configs/            # Configuration files
│   │   │   └── src/test/           # Unit tests
│   │   ├── it/                     # Integration tests
│   │   └── infra/                  # Infrastructure as Code
│   └── passkey-event-request-workflow/  # Workflow service
├── scripts/                        # Build and utility scripts
├── package.json                    # Root package configuration
├── pnpm-workspace.yaml            # Workspace configuration
└── nx.json                        # Nx build configuration
```

### Package Organization

#### Resources Layer (`resources/`)
- **Purpose**: Handle HTTP requests and responses
- **Pattern**: One resource class per domain entity
- **Example**: `EventRequestsResource.java`

#### Services Layer (`services/`)
- **Purpose**: Implement business logic and orchestration
- **Pattern**: Service interfaces with implementation classes
- **Example**: `EventRequestsService.java`

#### Repository Layer (`repository/`)
- **Purpose**: Abstract data access operations
- **Pattern**: Repository interfaces with technology-specific implementations
- **Example**: `EventRequestDataAccess.java`

#### Model Layer (`model/`)
- **Purpose**: Define data structures and DTOs
- **Pattern**: Immutable value objects using Immutables library
- **Example**: `EventRequest.java`, `RoomListEventRequest.java`

## Coding Standards

### Java Code Style

#### Naming Conventions
- **Classes**: PascalCase (e.g., `EventRequestsService`)
- **Methods**: camelCase (e.g., `getEventRequest`)
- **Variables**: camelCase (e.g., `participantId`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `APPLICATION_NAME`)

#### Code Formatting
```java
// Use Cvent's standard formatting
public class EventRequestsService {
    
    private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    
    private final EventRequestDataAccess dataAccess;
    
    public EventRequestsService(EventRequestDataAccess dataAccess) {
        this.dataAccess = dataAccess;
    }
    
    public EventRequest getEventRequest(Long participantId, String fileId, RequestType requestType) {
        LOG.info("Fetching event request for participant: {} and file: {}", participantId, fileId);
        
        return dataAccess.getEventRequest(participantId, fileId, requestType)
                .orElseThrow(() -> new EventNotFoundException());
    }
}
```

#### Documentation
```java
/**
 * Retrieves an event request for the specified participant and file.
 *
 * @param participantId The ID of the participant who owns the request
 * @param fileId The unique identifier of the file
 * @param requestType The type of request (ROOM_LIST, GML)
 * @return The event request if found
 * @throws EventNotFoundException if the request is not found
 */
public EventRequest getEventRequest(Long participantId, String fileId, RequestType requestType) {
    // Implementation
}
```

### TypeScript Code Style (for Infrastructure)

#### Naming Conventions
- **Classes**: PascalCase (e.g., `PasskeyEventDataStack`)
- **Methods**: camelCase (e.g., `createEcsService`)
- **Variables**: camelCase (e.g., `taskDefinition`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PORT`)

#### Code Formatting
```typescript
export class PasskeyEventDataStack extends Stack {
  private readonly environment: string;
  private readonly vpc: Vpc;
  
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    
    this.environment = props.environment;
    this.vpc = this.createVpc();
    
    const cluster = this.createEcsCluster();
    const service = this.createEcsService(cluster);
  }
  
  private createEcsService(cluster: Cluster): FargateService {
    // Implementation
  }
}
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Define the model** (if needed):
```java
// In model module
@Value.Immutable
@JsonSerialize(as = ImmutableNewRequest.class)
@JsonDeserialize(as = ImmutableNewRequest.class)
public interface NewRequest {
    String getId();
    String getName();
    // Other properties
}
```

2. **Add service method**:
```java
// In EventRequestsService
public NewRequest createNewRequest(Long participantId, NewRequest request) {
    LOG.info("Creating new request for participant: {}", participantId);
    // Business logic
    return dataAccess.saveNewRequest(participantId, request);
}
```

3. **Add repository method**:
```java
// In EventRequestDataAccess
public NewRequest saveNewRequest(Long participantId, NewRequest request) {
    // Data access logic
}
```

4. **Add REST endpoint**:
```java
// In EventRequestsResource
@POST
@Path("/new")
public Response createNewRequest(
    @Authority(methods = AuthMethod.API_KEY) GrantedAPIKey grantedAPIKey,
    @Valid @NotNull @PathParam("participantId") Long participantId,
    @Valid @NotNull NewRequest request
) {
    NewRequest created = eventRequestsService.createNewRequest(participantId, request);
    return Response.created(location).entity(created).build();
}
```

5. **Add tests**:
```java
@Test
void testCreateNewRequest() {
    // Arrange
    NewRequest request = ImmutableNewRequest.builder()
        .id("test-id")
        .name("Test Request")
        .build();
    
    // Act
    Response response = resource.createNewRequest(apiKey, 123L, request);
    
    // Assert
    assertThat(response.getStatus()).isEqualTo(201);
}
```

### Adding Configuration Properties

1. **Add to configuration class**:
```java
// In PasskeyEventDataConfiguration
@JsonProperty
private String newProperty;

public String getNewProperty() {
    return newProperty;
}
```

2. **Add to YAML files**:
```yaml
# In configs/dev.yaml
newProperty: "development-value"
```

3. **Use in application**:
```java
// In application setup
String value = config.getNewProperty();
```

### Adding Database Fields

1. **Update model**:
```java
@Value.Immutable
public interface EventRequest {
    // Existing fields
    
    @Nullable
    String getNewField();
}
```

2. **Update repository**:
```java
// Handle new field in save/load operations
```

3. **Create migration script** (if needed):
```java
// Add migration logic for existing data
```

## Debugging

### Local Debugging

#### IntelliJ IDEA
1. Set breakpoints in your code
2. Run the application in debug mode
3. Use the debugger to step through code execution

#### Remote Debugging
```bash
# Start application with debug options
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
  -jar target/passkey-event-data-service.jar server configs/dev.yaml
```

### Logging

#### Enable Debug Logging
```yaml
# In configs/dev.yaml
logging:
  level: DEBUG
  loggers:
    com.cvent.passkeyeventdata: DEBUG
    org.hibernate.SQL: DEBUG
```

#### View Logs
```bash
# Follow application logs
tail -f logs/application.log

# Search for specific patterns
grep "ERROR" logs/application.log
grep "participantId: 123" logs/application.log
```

### Database Debugging

#### DynamoDB Local Web Shell
```bash
# Access DynamoDB Local web interface
open http://localhost:8000/shell/
```

#### Query Data
```bash
# List all items in table
aws dynamodb scan \
  --table-name dev-passkey-event-requests \
  --endpoint-url http://localhost:8000

# Get specific item
aws dynamodb get-item \
  --table-name dev-passkey-event-requests \
  --key '{"participantId":{"N":"123"},"requestId":{"S":"ROOM_LIST#file-123"}}' \
  --endpoint-url http://localhost:8000
```

## Testing Strategies

### Unit Testing

#### Test Structure
```java
@ExtendWith(MockitoExtension.class)
class EventRequestsServiceTest {
    
    @Mock
    private EventRequestDataAccess dataAccess;
    
    @Mock
    private EventMetadataClient reglinkClient;
    
    @InjectMocks
    private EventRequestsService service;
    
    @Test
    void shouldReturnEventRequestWhenFound() {
        // Given
        Long participantId = 123L;
        String fileId = "file-123";
        EventRequest expected = createTestEventRequest();
        
        when(dataAccess.getEventRequest(participantId, fileId, RequestType.ROOM_LIST))
            .thenReturn(Optional.of(expected));
        
        // When
        EventRequest actual = service.getEventRequest(participantId, fileId, RequestType.ROOM_LIST);
        
        // Then
        assertThat(actual).isEqualTo(expected);
    }
}
```

### Integration Testing

#### Test Configuration
```java
@TestConfiguration
public class TestConfig {
    
    @Bean
    @Primary
    public EventRequestDataAccess testDataAccess() {
        return new InMemoryEventRequestDataAccess();
    }
}
```

#### Test Data Setup
```java
@TestMethodOrder(OrderAnnotation.class)
class EventRequestsResourceIT {
    
    @BeforeEach
    void setUp() {
        // Set up test data
        testDataAccess.saveEventRequest(createTestEventRequest());
    }
    
    @Test
    @Order(1)
    void shouldCreateEventRequest() {
        // Test implementation
    }
}
```

## Performance Optimization

### Profiling

#### JVM Profiling
```bash
# Start with profiling enabled
java -XX:+FlightRecorder \
  -XX:StartFlightRecording=duration=60s,filename=profile.jfr \
  -jar target/passkey-event-data-service.jar server configs/dev.yaml
```

#### Memory Analysis
```bash
# Generate heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc
jcmd <pid> GC.dump_heap heap.hprof
```

### Load Testing

#### Using curl
```bash
# Simple load test
for i in {1..100}; do
  curl -H "Authorization: Bearer test-key" \
    http://localhost:8080/passkey-event-data/v1/participants/123/event-requests &
done
wait
```

#### Using Apache Bench
```bash
# Load test with ab
ab -n 1000 -c 10 \
  -H "Authorization: Bearer test-key" \
  http://localhost:8080/passkey-event-data/v1/participants/123/event-requests
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <pid>
```

#### DynamoDB Connection Issues
```bash
# Verify DynamoDB Local is running
docker ps | grep dynamodb

# Check table exists
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

#### Maven Build Issues
```bash
# Clean and rebuild
mvn clean install -DskipTests

# Update dependencies
mvn dependency:resolve
```

#### Memory Issues
```bash
# Increase JVM memory
export MAVEN_OPTS="-Xmx2g -XX:MaxPermSize=512m"
```

### Getting Help

#### Internal Resources
- **Team Slack**: #metre-stick-team
- **Documentation**: Confluence space for Passkey services
- **Code Reviews**: GitHub pull request process

#### External Resources
- **Dropwizard Documentation**: https://www.dropwizard.io/
- **AWS SDK Documentation**: https://docs.aws.amazon.com/sdk-for-java/
- **DynamoDB Developer Guide**: https://docs.aws.amazon.com/dynamodb/

## Additional Resources

## Quick Start


### Prerequisites

- Java 17+
- Maven 3.6+
- AWS credentials configured
- Access to DynamoDB and other AWS services

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-event-data.git
   cd passkey-event-data
   ```

2. **Build the project**:
   ```bash
   pnpm install
   nx run passkey-event-data-service:build
   ```

3. **Run the service**:
   ```bash
   cd packages/passkey-event-data/service
   mvn exec:exec
   ```

The service will start on the configured port with the development configuration.

### Configuration

The service uses YAML configuration files located in `packages/passkey-event-data/service/configs/`:

- `dev.yaml` - Development environment
- `staging.yaml` - Staging environment  
- `prod.yaml` - Production environment

## API Endpoints


The service exposes REST endpoints under the `/api/v1/` path:

- **Event Requests**: `/api/v1/event-requests/*` - Manage event request data
- **Health Check**: `/healthcheck` - Service health status
- **Admin**: `/admin/*` - Administrative endpoints

For detailed API documentation, see [API_REFERENCE.md](./API_REFERENCE.md).

## Development


For development setup and guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Deployment


For deployment instructions and infrastructure details, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Support


- **Team**: metre-stick
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels

For issues and questions, please contact the metre-stick team or create an issue in the repository.
