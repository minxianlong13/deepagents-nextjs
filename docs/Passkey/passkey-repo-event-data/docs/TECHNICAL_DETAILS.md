# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.0.x - Production-ready Java framework for RESTful web services
- **Language**: Java 17 - Long-term support version with modern language features
- **Build Tool**: Maven 3.6+ - Dependency management and build automation
- **Package Manager**: pnpm - Fast, disk space efficient package manager for monorepo management

### Web Layer
- **REST Framework**: JAX-RS (Jersey) - Java API for RESTful web services
- **JSON Processing**: Jackson - High-performance JSON processor
- **Validation**: Jakarta Bean Validation - Input validation and constraint checking
- **Authentication**: Cvent Auth Service integration with JWT tokens

### Data Layer
- **Primary Database**: Amazon DynamoDB - NoSQL database for high-performance data storage
- **Caching**: Built-in NoSQL cache with DynamoDB integration
- **File Storage**: Amazon S3 - Object storage for uploaded files
- **Data Modeling**: Immutables library for immutable value objects

### Infrastructure
- **Cloud Platform**: Amazon Web Services (AWS)
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: AWS ECS (Elastic Container Service)
- **Load Balancing**: Application Load Balancer (ALB)
- **Service Discovery**: AWS Cloud Map

### Development Tools
- **Monorepo Management**: Nx - Build system with computation caching
- **Code Quality**: SonarQube - Static code analysis and quality gates
- **Testing**: JUnit 5, Mockito - Unit and integration testing
- **API Documentation**: OpenAPI/Swagger - API specification and documentation

## Dependencies

### Core Dependencies (from pom.xml)

#### Dropwizard Ecosystem
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-dropwizard</artifactId>
</dependency>
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-json-logging</artifactId>
</dependency>
```

#### AWS SDK
```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>dynamodb</artifactId>
</dependency>
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
</dependency>
```

#### Cvent Platform
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>pangaea</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-reglink-java-client</artifactId>
</dependency>
```

#### Data Modeling
```xml
<dependency>
    <groupId>com.cvent.immutables</groupId>
    <artifactId>immutables-cvent</artifactId>
</dependency>
<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <scope>provided</scope>
</dependency>
```

#### Testing
```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-testing</artifactId>
    <scope>test</scope>
</dependency>
```

### Development Dependencies (from package.json)

#### Build and Development Tools
- `@cvent/builder-maven`: Maven build integration
- `@cvent/builder-docker`: Docker build support
- `@cvent/builder-sonar`: SonarQube integration
- `@cvent/framework-scripts`: Common build scripts
- `nx`: Monorepo build system

#### Code Quality
- `@cvent/eslint-config`: Standardized ESLint configuration
- `@cvent/prettier-config`: Code formatting standards
- `@typescript-eslint/eslint-plugin`: TypeScript-specific linting

#### Infrastructure as Code
- `@cvent/cdk-lib`: AWS CDK constructs
- `@cvent/cdk-applications`: Application-specific CDK patterns
- `aws-cdk`: AWS Cloud Development Kit
- `constructs`: CDK construct library

## Configuration

### Environment Variables

#### Database Configuration
- `DYNAMODB_REGION` - AWS region for DynamoDB
- `DYNAMODB_TABLE_NAME` - Name of the DynamoDB table
- `DYNAMODB_ENDPOINT` - DynamoDB endpoint (for local development)

#### Authentication
- `AUTH_SERVICE_ENDPOINT` - URL of the authentication service
- `API_KEY` - Service-to-service authentication key

#### External Services
- `REGLINK_SERVICE_ENDPOINT` - URL of the reglink service
- `S3_BUCKET_NAME` - S3 bucket for file storage

#### Application Settings
- `SERVER_PORT` - HTTP server port (default: 8080)
- `ADMIN_PORT` - Admin interface port (default: 8081)
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARN, ERROR)

### Configuration Files

#### Service Configuration (`configs/`)
- `dev.yaml` - Development environment settings
- `staging.yaml` - Staging environment settings
- `prod.yaml` - Production environment settings

#### Example Configuration Structure
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

logging:
  level: INFO
  loggers:
    com.cvent.passkeyeventdata: DEBUG
  appenders:
    - type: json-console

dynamoDBConfig:
  tableName: ${DYNAMODB_TABLE_NAME}
  region: ${DYNAMODB_REGION}
  noSqlCacheConfiguration:
    enabled: true
    ttlMinutes: 30

cventAuthenticationConfiguration:
  apiKey: ${API_KEY}

reglinkService:
  endpoint: ${REGLINK_SERVICE_ENDPOINT}
```

## Database Schema

### DynamoDB Table Design

#### Primary Table: `passkey-event-requests`

**Partition Key**: `participantId` (Number)
- Ensures data locality per participant
- Enables efficient queries for participant-specific data

**Sort Key**: `requestId` (String)
- Format: `{requestType}#{identifier}`
- Room List: `ROOM_LIST#fileId`
- GML: `GML#glCode:uuid`

**Attributes**:
```json
{
  "participantId": 12345,
  "requestId": "ROOM_LIST#file-123",
  "requestType": "ROOM_LIST",
  "status": "COMPLETED",
  "eventId": "event-456",
  "eventName": "Annual Conference 2024",
  "requestedBy": "john.doe@example.com",
  "requestedDate": "2024-01-15T10:30:00Z",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-15T10:35:00Z",
  "fileId": "file-123",
  "fileName": "hotel-rooms.xlsx",
  "metadata": {
    "processingTime": 45,
    "roomCount": 150
  },
  "ttl": 1735689000
}
```

#### Global Secondary Indexes

**GSI-1: Status Index**
- Partition Key: `status` (String)
- Sort Key: `lastModifiedDate` (String)
- Purpose: Query requests by status across all participants

**GSI-2: Event Index**
- Partition Key: `eventId` (String)
- Sort Key: `createdDate` (String)
- Purpose: Query all requests for a specific event

### Cache Configuration

#### NoSQL Cache Settings
```yaml
noSqlCacheConfiguration:
  enabled: true
  ttlMinutes: 30
  maxSize: 1000
  refreshAfterWriteMinutes: 5
```

#### Cache Strategy
- **Read-through**: Cache misses trigger database reads
- **Write-through**: Updates immediately written to cache and database
- **TTL**: 30-minute expiration for cached entries
- **Eviction**: LRU (Least Recently Used) eviction policy

## Build Configuration

### Maven Profiles

#### Default Profile
```xml
<profile>
    <id>default</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <modules>
        <module>parent</module>
        <module>model</module>
        <module>java-client</module>
        <module>service</module>
        <module>it</module>
    </modules>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <skipITs>false</skipITs>
        <skipTests>true</skipTests>
    </properties>
    <modules>
        <module>model</module>
        <module>java-client</module>
        <module>it</module>
    </modules>
</profile>
```

#### Release Profile
```xml
<profile>
    <id>release</id>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <!-- Creates fat JAR with all dependencies -->
            </plugin>
        </plugins>
    </build>
</profile>
```

### Docker Configuration

#### Multi-stage Dockerfile
```dockerfile
# Build stage
FROM maven:3.8-openjdk-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY packages/ packages/
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:17-jre-slim
WORKDIR /app
COPY --from=builder /app/packages/passkey-event-data/service/target/*.jar app.jar
COPY --from=builder /app/packages/passkey-event-data/service/configs/ configs/
EXPOSE 8080 8081
CMD ["java", "-jar", "app.jar", "server", "configs/prod.yaml"]
```

## Monitoring & Logging

### Structured Logging

#### Log Format (JSON)
```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "INFO",
  "logger": "com.cvent.passkeyeventdata.resources.EventRequestsResource",
  "message": "Fetching Event Request for participant ID: 12345 and FileID: file-123",
  "mdc": {
    "requestId": "req-456",
    "participantId": "12345",
    "operation": "getEventRequest"
  }
}
```

#### Log Levels
- **ERROR**: System errors, exceptions, failed operations
- **WARN**: Recoverable errors, deprecated usage, performance issues
- **INFO**: Business operations, request/response logging
- **DEBUG**: Detailed execution flow, variable values

### Health Checks

#### Application Health Check
```java
public class PasskeyEventDataHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check database connectivity
        // Check external service availability
        // Check system resources
        return Result.healthy();
    }
}
```

#### Health Check Endpoints
- `/healthcheck` - Overall application health
- `/admin/healthcheck` - Detailed health information
- `/admin/metrics` - Application metrics

### Metrics Collection

#### Application Metrics
- Request count and response times
- Database operation latencies
- Cache hit/miss ratios
- Error rates by endpoint

#### Business Metrics
- Event requests created per hour
- Processing success/failure rates
- Average processing time by request type
- Participant activity levels

#### Integration with Datadog
```yaml
metrics:
  reporters:
    - type: datadog
      host: ${DATADOG_HOST}
      apiKey: ${DATADOG_API_KEY}
      tags:
        service: passkey-event-data
        environment: ${ENVIRONMENT}
```

## Security

### Authentication & Authorization

#### API Key Authentication
- Service-to-service authentication using API keys
- Integration with Cvent's centralized auth service
- JWT token validation for user requests

#### Request Validation
```java
@Authority(methods = AuthMethod.API_KEY) GrantedAPIKey grantedAPIKey
```

### Data Protection

#### Encryption at Rest
- DynamoDB encryption using AWS KMS
- S3 bucket encryption for uploaded files
- Secrets stored in AWS Secrets Manager

#### Encryption in Transit
- TLS 1.2+ for all HTTP communications
- VPC endpoints for AWS service communication
- Certificate management via AWS Certificate Manager

### Input Validation

#### Bean Validation
```java
@Valid @NotNull @PathParam("participantId") Long participantId
```

#### Custom Validators
- File format validation
- Business rule validation
- Data sanitization

## Performance Optimization

### Database Optimization

#### Query Patterns
- Single-item reads using partition key + sort key
- Query operations using GSI for filtering
- Batch operations for bulk data processing

#### Connection Pooling
```yaml
dynamoDBConfig:
  connectionPool:
    maxConnections: 50
    connectionTimeout: 5000
    requestTimeout: 10000
```

### Caching Strategy

#### Multi-level Caching
1. **Application Cache**: In-memory cache for frequently accessed data
2. **DynamoDB Cache**: Built-in caching at the database level
3. **CDN Cache**: CloudFront for static content

#### Cache Invalidation
- Time-based expiration (TTL)
- Event-driven invalidation on updates
- Manual cache clearing via admin endpoints

### Asynchronous Processing

#### Background Tasks
- File processing operations
- Batch data updates
- Cleanup and maintenance tasks

#### Message Queues
- SQS for reliable message delivery
- Dead letter queues for failed processing
- Retry mechanisms with exponential backoff