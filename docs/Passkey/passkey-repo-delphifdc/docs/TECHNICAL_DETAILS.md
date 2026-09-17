# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x (JAX-RS based microservice framework)
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Database**: Amazon DynamoDB
- **Authentication**: Cvent Auth Service integration
- **Containerization**: Docker with OpenJDK 8 Alpine base image
- **Monitoring**: Datadog APM and logging
- **Testing**: JUnit 5, Karate for integration tests

## Dependencies

### Core Framework Dependencies
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>57.4.9</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.12</version>
</dependency>
```

### Authentication & Security
```xml
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>28.4.2</version>
</dependency>

<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-core</artifactId>
    <version>28.4.2</version>
</dependency>
```

### Data Access & Serialization
```xml
<dependency>
    <groupId>jakarta.xml.ws</groupId>
    <artifactId>jakarta.xml.ws-api</artifactId>
    <version>2.3.3</version>
</dependency>

<dependency>
    <groupId>org.glassfish.jaxb</groupId>
    <artifactId>jaxb-runtime</artifactId>
    <version>4.0.6</version>
</dependency>
```

### AWS SDK
- **DynamoDB**: AWS SDK v2 for DynamoDB operations
- **Region Configuration**: Configurable AWS region support
- **Credentials**: IAM role-based authentication

### External Service Clients
- **Passkey Event Housing Client**: Internal service integration
- **Amadeus Integration Client**: External Amadeus system integration
- **CSN IBK Config SKU Client**: Configuration service integration

## Configuration

### Environment Variables
```yaml
# Application Configuration
APPLICATION_NAME: passkey-delphifdc-service
DEFAULT_ENVIRONMENT: dev
DEFAULT_PK_USER: system

# Database Configuration
DYNAMODB_REGION: us-east-1
DYNAMODB_ENDPOINT: https://dynamodb.us-east-1.amazonaws.com

# Authentication
AUTH_SERVICE_ENDPOINT: https://auth-service.{env}.cvent.com
API_KEY: ${API_KEY}

# External Services
AMADEUS_INTEGRATION_ENDPOINT: https://amadeus-integration.{env}.cvent.com
EVENT_HOUSING_ENDPOINT: https://passkey-event-housing.{env}.cvent.com
CSN_IBK_CONFIG_SKU_ENDPOINT: https://csn-ibk-config-sku.{env}.cvent.com
```

### Configuration Files
- **dev.yaml**: Development environment configuration
- **staging.yaml**: Staging environment configuration
- **prod.yaml**: Production environment configuration
- **dev.logback.xml**: Logging configuration for development

### Multi-Environment Configuration
```java
MultiEnvAware<ConfigurableLazyDataSourceFactory> prodDataSourceFactories =
    config.getMultiEnvConfig().convert((env, conf) -> conf.getDatabaseConfig(),
        new SiloTemplateResolver<>(ConfigurableLazyDataSourceFactory.class,
            environment.getObjectMapper()));
```

## Database Schema

### DynamoDB Tables

#### Notifications Table
- **Table Name**: `passkey-delphifdc-notifications-{environment}`
- **Partition Key**: `notificationId` (String)
- **Sort Key**: `timestamp` (String)
- **Attributes**:
  - `id`: Notification identifier
  - `eventDetail`: Event information (JSON)
  - `status`: Processing status
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp
  - `processingAttempts`: Retry count
- **TTL**: 90 days from creation

#### Tasks Table
- **Table Name**: `passkey-delphifdc-tasks-{environment}`
- **Partition Key**: `taskId` (String)
- **Sort Key**: `createdAt` (String)
- **Attributes**:
  - `taskType`: Type of task
  - `status`: Current status
  - `payload`: Task data (JSON)
  - `scheduledAt`: Scheduled execution time
  - `completedAt`: Completion timestamp
- **TTL**: 7 days from completion

#### Logs Table
- **Table Name**: `passkey-delphifdc-logs-{environment}`
- **Partition Key**: `logId` (String)
- **Sort Key**: `timestamp` (String)
- **Attributes**:
  - `level`: Log level
  - `message`: Log message
  - `correlationId`: Request correlation ID
  - `operation`: Operation being logged
  - `metadata`: Additional context (JSON)
- **TTL**: 30 days from creation

#### Errors Table
- **Table Name**: `passkey-delphifdc-errors-{environment}`
- **Partition Key**: `errorId` (String)
- **Sort Key**: `timestamp` (String)
- **Attributes**:
  - `errorType`: Error classification
  - `errorMessage`: Error description
  - `stackTrace`: Technical details
  - `notificationId`: Associated notification
  - `retryCount`: Number of retries
  - `resolved`: Resolution status
- **TTL**: 180 days from creation

### Database Access Patterns
```java
// MyBatis configuration for relational data
DefaultSqlSessionFactoryProvider.Builder factoryBuilder = 
    new DefaultSqlSessionFactoryProvider.Builder(environment, 
        "passkey-delphifdc-service-prod", prodDataSourceFactories);
factoryBuilder.addMapper(UserDetailsMapper.class);
```

## Monitoring & Logging

### Datadog Integration
```java
// APM Configuration
@EnableLogContext
public class PasskeyDelphifdcResource {
    // Automatic request tracing
}

// Custom tracing
try (TracingSpan tracingSpan = TracingUtil.startRootTrace("notification_processor",
        "NotificationProcessor")) {
    // Processing logic
}
```

### Logging Configuration
```java
// MDC Context for structured logging
MDC.put("amadeus.request", objectMapper.writeValueAsString(eventRequests));
MDC.put("amadeus.locationId", locationId);
MDC.put("amadeus.resourceId", resourceId);
LOG.info("Notification request for locationId = {} and resourceId = {}", 
         locationId, resourceId);
```

### Health Checks
```java
environment.healthChecks().register(this.getName(), 
    new PasskeyDelphifdcHealthCheck());
```

### Metrics Collection
- Request count and response times
- Error rates by endpoint
- External service call metrics
- Background processing metrics
- DynamoDB operation metrics

## Security

### Authentication Methods
- **API Key**: `X-API-Key` header validation
- **JWT Token**: Bearer token validation
- **OAuth**: OAuth 2.0 token validation

### Authorization
```java
@Authority(methods = {
    AuthMethod.API_KEY,
    AuthMethod.JWT,
    AuthMethod.BEARER
}, roles = {"AMADEUS_USER", "delphifdc-notifications:write"})
```

### Data Protection
- Sensitive data masking in logs
- Encrypted communication with external services
- Secure credential management via CSN IBK Config SKU service

## Performance Optimization

### Connection Pooling
```java
// HTTP Client configuration
final Client newClient = ClientBuilder.newClient(new ClientConfig());
newClient.register(ClientJacksonResolver.class);
newClient.register(new JacksonFeature(Jackson.newObjectMapper()));
```

### Asynchronous Processing
```java
// Scheduled background processing
scheduledExecutorService.scheduleWithFixedDelay(() -> {
    FutureTask<Boolean> futureTask = new FutureTask<>(() -> 
        notificationProcessor.accept(tracingSpan), null);
    executorService.execute(futureTask);
    futureTask.get(EXECUTION_TIMEOUT, TimeUnit.MINUTES);
}, RANDOM.nextInt(INITIAL_DELAY_RANDOM_VALUE), DELAY, TimeUnit.MINUTES);
```

### Caching Strategy
- Authentication token caching (1 hour TTL)
- Configuration caching per environment
- Client connection reuse

### Batch Processing
- DynamoDB batch operations for efficiency
- Bulk notification processing
- Optimized query patterns

## Error Handling

### Exception Mapping
```java
// Custom exception mappers
environment.jersey().register(new DelphifdcExceptionMapper());
environment.jersey().register(new PasskeyConstraintViolationExceptionMapper());
environment.jersey().register(new PasskeyJsonProcessingExceptionMapper());
environment.jersey().register(new PasskeyRuntimeExceptionMapper());
```

### Retry Logic
- Exponential backoff for transient failures
- Circuit breaker pattern for external services
- Maximum retry attempts: 3
- Timeout protection: 7 minutes for batch processing

### Error Tracking
```java
// Comprehensive error logging
ErrorDynamoDBService errorDynamoDBService = new ErrorDynamoDBService(
    dynamoDBClient, dynamoDbConfig, defaultEnv);
```

## Build & Deployment

### Maven Profiles
```xml
<profiles>
    <profile>
        <id>release</id>
        <properties>
            <maven.source.skip>true</maven.source.skip>
            <maven.javadoc.skip>true</maven.javadoc.skip>
        </properties>
    </profile>
    <profile>
        <id>coverage</id>
        <properties>
            <skipIntegrationTests>false</skipIntegrationTests>
        </properties>
    </profile>
</profiles>
```

### Docker Configuration
```dockerfile
FROM docker.cvent.net/maven as builder
ENV PACKAGE "passkey-delphifdc"
WORKDIR /usr/src/app

# Multi-stage build for optimization
COPY pom.xml .
COPY "${PACKAGE}-api/pom.xml" "${PACKAGE}-api/"
# ... copy other module POMs

RUN mvn clean package --projects ":${PACKAGE}-service" \
    --also-make --activate-profiles release

FROM openjdk:8-jre-alpine
ENV SERVICE "passkey-delphifdc-service"
WORKDIR /usr/src

COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./service.jar
CMD ["java", "-jar", "-Dlogback.configurationFile=configs/dev.logback.xml", 
     "service.jar", "server", "configs/dev.yaml"]
```

### Code Quality
```xml
<!-- Jacoco coverage configuration -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <excludes>
            <exclude>**/PasskeyDelphifdcService*.*</exclude>
        </excludes>
    </configuration>
</plugin>
```

### SonarQube Integration
```xml
<sonar.coverage.exclusions>
    passkey-delphifdc-service/**/util/**,
    passkey-delphifdc-api/**,
    passkey-delphifdc-java-client/**,
    passkey-delphifdc-data-access/**,
    passkey-delphifdc-shared/**,
    passkey-delphifdc-integration-test/**,
    **/PasskeyDelphifdcService*.*
</sonar.coverage.exclusions>
```