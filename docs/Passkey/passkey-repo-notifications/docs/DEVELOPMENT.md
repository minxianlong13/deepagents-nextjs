# Development Guide

## Prerequisites

### Required Software
- **Java 17+** - OpenJDK or Oracle JDK
- **Maven 3.8+** - Build tool for Java components
- **Node.js 18+** - Runtime for TypeScript components
- **pnpm 8.x** - Package manager (preferred over npm/yarn)
- **Docker 20.10+** - For containerization and local services
- **Git 2.30+** - Version control
- **IDE**: IntelliJ IDEA (recommended) or VS Code

### Optional Tools
- **AWS CLI 2.x** - For AWS resource management
- **Oracle SQL Developer** - Database management
- **Postman** - API testing
- **Docker Compose** - Local service orchestration

### Environment Setup
```bash
# Install Java 17 (using SDKMAN)
curl -s "https://get.sdkman.io" | bash
sdk install java 17.0.7-oracle

# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install pnpm
npm install -g pnpm@8

# Verify installations
java -version
mvn -version
node -version
pnpm -version
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-notifications.git
cd passkey-notifications
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Install Java dependencies
mvn clean compile
```

### 3. Local Database Setup
```bash
# Start local Oracle database using Docker
docker run -d \
  --name oracle-local \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  -e ORACLE_DATABASE=XEPDB1 \
  gvenzl/oracle-xe:21-slim

# Wait for database to be ready
docker logs -f oracle-local

# Run database migrations
mvn flyway:migrate -f packages/service/pom.xml
```

### 4. Local AWS Services (LocalStack)
```bash
# Start LocalStack for AWS services
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -e SERVICES=dynamodb,sqs,events \
  -e DEBUG=1 \
  localstack/localstack:latest

# Create local DynamoDB tables
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name passkey-notifications-autoblock-local \
  --attribute-definitions \
    AttributeName=userId,AttributeType=N \
    AttributeName=requestId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=requestId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Create SQS queues
aws --endpoint-url=http://localhost:4566 sqs create-queue \
  --queue-name passkey-autoblock-events-local
```

### 5. Configuration
```bash
# Copy example configuration
cp packages/service/configs/dev.yaml.example packages/service/configs/local.yaml

# Edit local configuration
vim packages/service/configs/local.yaml
```

Example local configuration:
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: oracle.jdbc.OracleDriver
  url: jdbc:oracle:thin:@localhost:1521:XEPDB1
  user: system
  password: password
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 2
  maxSize: 8

dynamoDbConfiguration:
  region: us-east-1
  endpoint: http://localhost:4566

awsCredentialsConfig:
  region: us-east-1
  accessKey: test
  secretKey: test

autoblockNotificationSqs:
  queueName: passkey-autoblock-events-local
  pollDelaySeconds: 1
  pollingWaitSeconds: 5
  maxNumberOfMessages: 5
  threadPoolSize: 2

logging:
  level: DEBUG
  loggers:
    com.cvent.passkeynotifications: DEBUG
    org.apache.ibatis: DEBUG
```

## Running the Service

### Development Mode
```bash
# Run the main service
mvn exec:exec -f packages/service/pom.xml

# Or with specific configuration
mvn exec:exec -f packages/service/pom.xml -Dexec.args="server packages/service/configs/local.yaml"

# Run with hot reload (using spring-boot-devtools equivalent)
mvn compile exec:exec -f packages/service/pom.xml
```

### Using Docker
```bash
# Build Docker image
docker build -t passkey-notifications:local .

# Run container
docker run -p 8080:8080 -p 8081:8081 \
  -e DATABASE_URL=jdbc:oracle:thin:@host.docker.internal:1521:XEPDB1 \
  -e DATABASE_USER=system \
  -e DATABASE_PASSWORD=password \
  passkey-notifications:local
```

### Service Endpoints
- **Application**: http://localhost:8080
- **Admin/Health**: http://localhost:8081
- **Health Check**: http://localhost:8081/health
- **Metrics**: http://localhost:8081/metrics

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test -f packages/service/pom.xml

# Run specific test class
mvn test -f packages/service/pom.xml -Dtest=PasskeyNotificationsServiceTest

# Run with coverage
mvn test jacoco:report -f packages/service/pom.xml
```

### Integration Tests
```bash
# Run integration tests (requires local services)
pnpm test --filter=it

# Run specific integration test
pnpm test --filter=it -- --testNamePattern="AutoBlock"
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

### Test Configuration
```yaml
# test-config.yaml
database:
  url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
  driverClass: org.h2.Driver
  user: sa
  password: ""

dynamoDbConfiguration:
  endpoint: http://localhost:4566
  region: us-east-1
```

## Code Structure

### Package Organization
```
packages/service/src/main/java/com/cvent/passkeynotifications/
├── PasskeyNotificationsServiceApplication.java    # Main application class
├── PasskeyNotificationsServiceConfiguration.java  # Configuration class
├── config/                                        # Configuration beans
├── configuration/                                 # Dropwizard configuration
├── exception/                                     # Exception classes and mappers
├── health/                                        # Health check implementations
├── helpers/                                       # Utility helper classes
├── resources/                                     # JAX-RS REST endpoints
│   ├── PasskeyNotificationsResource.java         # V1 API endpoints
│   ├── PasskeyNotificationsResourceV2.java       # V2 API endpoints
│   ├── AdminPasskeyNotificationsResource.java    # Admin endpoints
│   └── NotificationsEventPubResource.java        # Event publishing endpoints
├── services/                                      # Business logic layer
│   ├── PasskeyNotificationsService.java          # Core notification service
│   ├── PasskeyNotificationsServiceV2.java        # V2 service implementation
│   └── AdminPasskeyNotificationsService.java     # Admin service
├── sqs/                                          # SQS event processors
│   ├── AutoBlockRequestEventProcessor.java       # Auto-block event handler
│   └── ReservationTransferProcessor.java         # Reservation transfer handler
└── util/                                         # Utility classes
```

### TypeScript Structure
```
packages/
├── eb-sqs-consumer/                              # EventBridge SQS consumer
│   ├── lib/                                      # CDK constructs
│   └── bin/                                      # CDK apps
├── infra/                                        # Infrastructure definitions
│   ├── lib/                                      # CDK stacks
│   └── bin/                                      # Deployment scripts
└── it/                                           # Integration tests
    ├── src/                                      # Test source code
    └── fixtures/                                 # Test data
```

## Coding Standards

### Java Code Style
- **Formatting**: Google Java Style Guide
- **Line Length**: 120 characters
- **Indentation**: 2 spaces
- **Imports**: Organize imports, no wildcard imports
- **Naming**: CamelCase for classes, camelCase for methods/variables

### Code Quality Tools
```xml
<!-- Maven plugins for code quality -->
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
</plugin>

<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
</plugin>

<plugin>
    <groupId>org.sonarsource.scanner.maven</groupId>
    <artifactId>sonar-maven-plugin</artifactId>
</plugin>
```

### TypeScript Code Style
```json
// .eslintrc.json
{
  "extends": ["@cvent/eslint-config-typescript"],
  "rules": {
    "max-len": ["error", { "code": 120 }],
    "indent": ["error", 2],
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### Code Review Guidelines
1. **Functionality**: Code works as intended
2. **Readability**: Clear and understandable code
3. **Performance**: No obvious performance issues
4. **Security**: No security vulnerabilities
5. **Testing**: Adequate test coverage
6. **Documentation**: Code is properly documented

## Common Tasks

### Adding a New Endpoint
1. **Create Resource Class**:
```java
@Path("/passkey-notifications/v1/new-endpoint")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class NewEndpointResource {
    
    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        // Implementation
        return Response.ok().build();
    }
}
```

2. **Register Resource**:
```java
// In PasskeyNotificationsServiceApplication.java
environment.jersey().register(new NewEndpointResource(service));
```

3. **Add Tests**:
```java
public class NewEndpointResourceTest {
    @Test
    public void testGetById() {
        // Test implementation
    }
}
```

### Adding a New Service Method
1. **Define Interface** (if needed):
```java
public interface NewService {
    Result processRequest(Request request);
}
```

2. **Implement Service**:
```java
public class NewServiceImpl implements NewService {
    @Override
    public Result processRequest(Request request) {
        // Business logic implementation
        return new Result();
    }
}
```

3. **Wire Dependencies**:
```java
// In application setup
NewService newService = new NewServiceImpl(dependencies);
```

### Adding Database Migration
1. **Create Migration File**:
```sql
-- V1.1__Add_new_table.sql
CREATE TABLE NEW_TABLE (
    ID NUMBER(19) PRIMARY KEY,
    NAME VARCHAR2(255) NOT NULL,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Run Migration**:
```bash
mvn flyway:migrate -f packages/service/pom.xml
```

### Adding SQS Event Handler
1. **Create Processor**:
```java
public class NewEventProcessor implements TypedSqsMessageHandler<NewEvent> {
    @Override
    public void handle(NewEvent event) {
        // Process event
    }
}
```

2. **Register Consumer**:
```java
// In application setup
TypedSqsMessageHandler<NewEvent> handler = new NewEventProcessor();
// Configure and start consumer
```

## Debugging

### Local Debugging
```bash
# Run with debug port
mvn exec:exec -f packages/service/pom.xml -Dexec.args="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 server packages/service/configs/local.yaml"
```

### IDE Configuration
- **IntelliJ IDEA**: Create remote debug configuration on port 5005
- **VS Code**: Use Java debug configuration

### Common Issues
1. **Database Connection**: Check Oracle container status and credentials
2. **Port Conflicts**: Ensure ports 8080/8081 are available
3. **AWS Credentials**: Verify LocalStack is running and accessible
4. **Memory Issues**: Increase JVM heap size if needed

### Logging
```java
// Add detailed logging for debugging
private static final Logger LOG = LoggerFactory.getLogger(ClassName.class);

LOG.debug("Processing request: {}", request);
LOG.info("Operation completed successfully");
LOG.error("Error occurred", exception);
```

## Performance Testing

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8080/passkey-notifications/v1/user-notifications/123/count

# Using curl for specific endpoints
curl -X GET "http://localhost:8080/passkey-notifications/v1/user-notifications/123/notifications/AUTO_BLOCK_REQUEST" \
  -H "Authorization: Bearer test-api-key"
```

### Profiling
```bash
# Run with JProfiler agent
mvn exec:exec -f packages/service/pom.xml -Dexec.args="-agentpath:/path/to/jprofiler/bin/linux-x64/libjprofilerti.so=port=8849 server packages/service/configs/local.yaml"
```

## Contributing

### Git Workflow
1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Make Changes**: Implement feature with tests
3. **Commit Changes**: `git commit -m "feat: add new feature"`
4. **Push Branch**: `git push origin feature/new-feature`
5. **Create Pull Request**: Submit PR for review
6. **Address Feedback**: Make requested changes
7. **Merge**: Squash and merge after approval

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Security considerations addressed
- [ ] Performance impact assessed

## Additional Resources

## Quick Start


### Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 18+ (for TypeScript components)
- pnpm (for package management)
- Docker (for local development)

### Local Development
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-notifications.git
cd passkey-notifications

# Install dependencies
pnpm install

# Build the Java service
mvn clean compile -f packages/service/pom.xml

# Run the service locally
mvn exec:exec -f packages/service/pom.xml
```

The service will start on the default Dropwizard port (8080 for application, 8081 for admin).

## API Endpoints


- **GET** `/passkey-notifications/v1/user-notifications/{userId}/notifications/{notificationType}` - Retrieve user notifications
- **GET** `/passkey-notifications/v1/user-notifications/{userId}/count` - Get notification counts
- **GET** `/passkey-notifications/v2/user-notifications/{userId}/notifications/{notificationType}` - V2 notification retrieval
- **POST** `/passkey-notifications/admin/*` - Administrative operations
