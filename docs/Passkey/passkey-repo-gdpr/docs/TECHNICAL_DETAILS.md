# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Parent POM**: Cvent Maven Parent 52.1.0
- **Database**: Oracle Database (via JDBC)
- **ORM**: MyBatis
- **Container**: Docker with OpenJDK 8 Alpine
- **Package Manager**: pnpm (for frontend tooling)

## Key Dependencies

### Core Framework Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>52.1.0</version>
</dependency>

<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>27.1.1</version>
</dependency>

<!-- Database -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>23.6.0.24.10</version>
</dependency>
```

### Cvent Internal Dependencies
```xml
<!-- GDPR Masking Service -->
<dependency>
    <groupId>com.cvent.gdpr-mask</groupId>
    <artifactId>gdpr-mask-java-client</artifactId>
    <version>3.1.32</version>
</dependency>

<!-- Passkey Common Libraries -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.7</version>
</dependency>

<!-- Mono Java Utilities -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>mono-java</artifactId>
    <version>52.1.0</version>
</dependency>
```

### API Documentation
```xml
<!-- OpenAPI/Swagger -->
<dependency>
    <groupId>io.swagger.core.v3</groupId>
    <artifactId>swagger-jaxrs2-jakarta</artifactId>
    <version>2.2.28</version>
</dependency>

<!-- Jakarta Annotations -->
<dependency>
    <groupId>jakarta.annotation</groupId>
    <artifactId>jakarta.annotation-api</artifactId>
    <version>3.0.0</version>
</dependency>
```

### Feature Management
```xml
<!-- LaunchDarkly -->
<dependency>
    <groupId>com.launchdarkly</groupId>
    <artifactId>launchdarkly-java-server-sdk</artifactId>
    <version>7.9.0</version>
</dependency>
```

## Configuration

### Environment Variables

#### Required for Local Development
```bash
# AWS Credentials (for DynamoDB access)
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_SESSION_TOKEN=<your-session-token>

# LaunchDarkly
LAUNCH_DARKLY_SDK_KEY=<sdk-key>

# Database Connection
DB_HOST=<database-host>
DB_PORT=<database-port>
DB_NAME=<database-name>
DB_USERNAME=<username>
DB_PASSWORD=<password>
```

#### Optional Configuration
```bash
# Service Configuration
SERVICE_PORT=8080
ADMIN_PORT=8081
LOG_LEVEL=INFO

# External Service URLs
GDPR_MASK_SERVICE_URL=<mask-service-url>
AUTH_SERVICE_URL=<auth-service-url>

# Performance Tuning
MAX_THREADS=200
CONNECTION_POOL_SIZE=10
BATCH_SIZE_LIMIT=10000
```

### Configuration Files

#### Development Configuration (`configs/dev.yaml`)
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
  url: jdbc:oracle:thin:@${DB_HOST}:${DB_PORT}:${DB_NAME}
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32

logging:
  level: INFO
  loggers:
    com.cvent.passkeygdpr: DEBUG
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC

gdprMaskService:
  url: ${GDPR_MASK_SERVICE_URL}
  timeout: 30s
  retries: 3

authService:
  url: ${AUTH_SERVICE_URL}
  timeout: 10s

launchDarkly:
  sdkKey: ${LAUNCH_DARKLY_SDK_KEY}
  offline: false
```

### Feature Flags (LaunchDarkly)

#### Available Feature Flags
- `enable-batch-processing` - Enable/disable batch obfuscation functionality
- `enable-audit-logging` - Control audit logging verbosity
- `enable-async-processing` - Use asynchronous processing for large requests
- `gdpr-mask-service-integration` - Enable external GDPR mask service
- `rate-limiting-enabled` - Enable API rate limiting
- `enhanced-validation` - Enable enhanced request validation

## Database Schema

### Primary Tables

#### GDPR_REQUESTS
```sql
CREATE TABLE GDPR_REQUESTS (
    REQUEST_ID VARCHAR2(255) PRIMARY KEY,
    ENTITY_ID VARCHAR2(255) NOT NULL,
    ENTITY_TYPE VARCHAR2(50) NOT NULL,
    STATUS VARCHAR2(50) NOT NULL,
    REASON VARCHAR2(100) NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    COMPLETED_AT TIMESTAMP,
    REQUESTED_BY VARCHAR2(255) NOT NULL,
    BATCH_ID VARCHAR2(255),
    METADATA CLOB
);
```

#### BATCH_REQUESTS
```sql
CREATE TABLE BATCH_REQUESTS (
    BATCH_ID VARCHAR2(255) PRIMARY KEY,
    TOTAL_ENTITIES NUMBER(10) NOT NULL,
    PROCESSED_ENTITIES NUMBER(10) DEFAULT 0,
    FAILED_ENTITIES NUMBER(10) DEFAULT 0,
    STATUS VARCHAR2(50) NOT NULL,
    PRIORITY VARCHAR2(20) DEFAULT 'NORMAL',
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    STARTED_AT TIMESTAMP,
    COMPLETED_AT TIMESTAMP,
    CREATED_BY VARCHAR2(255) NOT NULL
);
```

#### OBFUSCATION_RESULTS
```sql
CREATE TABLE OBFUSCATION_RESULTS (
    RESULT_ID VARCHAR2(255) PRIMARY KEY,
    REQUEST_ID VARCHAR2(255) NOT NULL,
    FIELD_NAME VARCHAR2(255) NOT NULL,
    OBFUSCATION_METHOD VARCHAR2(50) NOT NULL,
    PROCESSED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    SUCCESS NUMBER(1) DEFAULT 1,
    ERROR_MESSAGE VARCHAR2(4000),
    FOREIGN KEY (REQUEST_ID) REFERENCES GDPR_REQUESTS(REQUEST_ID)
);
```

#### AUDIT_ENTRIES
```sql
CREATE TABLE AUDIT_ENTRIES (
    AUDIT_ID VARCHAR2(255) PRIMARY KEY,
    ENTITY_ID VARCHAR2(255) NOT NULL,
    OPERATION VARCHAR2(50) NOT NULL,
    PERFORMED_BY VARCHAR2(255) NOT NULL,
    PERFORMED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DETAILS CLOB,
    IP_ADDRESS VARCHAR2(45),
    USER_AGENT VARCHAR2(500),
    COMPLIANCE_REASON VARCHAR2(500)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX IDX_GDPR_REQUESTS_ENTITY ON GDPR_REQUESTS(ENTITY_ID);
CREATE INDEX IDX_GDPR_REQUESTS_STATUS ON GDPR_REQUESTS(STATUS);
CREATE INDEX IDX_GDPR_REQUESTS_BATCH ON GDPR_REQUESTS(BATCH_ID);
CREATE INDEX IDX_BATCH_REQUESTS_STATUS ON BATCH_REQUESTS(STATUS);
CREATE INDEX IDX_AUDIT_ENTRIES_ENTITY ON AUDIT_ENTRIES(ENTITY_ID);
CREATE INDEX IDX_AUDIT_ENTRIES_PERFORMED_AT ON AUDIT_ENTRIES(PERFORMED_AT);
```

## Build Configuration

### Maven Profiles

#### Default Profile
```xml
<profile>
    <id>default</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <properties>
        <skipIntegrationTests>true</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-gdpr-api</module>
        <module>passkey-gdpr-data-access</module>
        <module>passkey-gdpr-java-client</module>
        <module>passkey-gdpr-service</module>
        <module>passkey-gdpr-integration-test</module>
        <module>passkey-gdpr-shared</module>
    </modules>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <checkstyle.skip>true</checkstyle.skip>
        <skipIntegrationTests>false</skipIntegrationTests>
    </properties>
</profile>
```

#### Coverage Profile
```xml
<profile>
    <id>coverage</id>
    <build>
        <plugins>
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <executions>
                    <execution>
                        <goals>
                            <goal>prepare-agent</goal>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</profile>
```

### Build Commands

#### Standard Build
```bash
mvn clean package -Prelease
```

#### With Code Coverage
```bash
mvn clean verify -Pcoverage
```

#### Integration Tests
```bash
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
```

## Monitoring & Logging

### Structured Logging
```java
// Example logging configuration
private static final Logger logger = LoggerFactory.getLogger(PasskeyGdprService.class);

// Structured log entry
logger.info("GDPR request processed", 
    kv("requestId", requestId),
    kv("entityId", entityId),
    kv("status", status),
    kv("processingTime", processingTime));
```

### Health Check Configuration
```java
@Override
public void run(PasskeyGdprServiceConfiguration configuration, Environment environment) {
    // Database health check
    environment.healthChecks().register("database", 
        new DatabaseHealthCheck(configuration.getDatabase()));
    
    // External service health check
    environment.healthChecks().register("gdpr-mask-service",
        new GdprMaskServiceHealthCheck(configuration.getGdprMaskService()));
}
```

### Metrics Collection
- **Request Metrics**: Response times, error rates, throughput
- **Business Metrics**: GDPR requests processed, batch completion rates
- **System Metrics**: JVM memory, CPU usage, database connections
- **Custom Metrics**: Obfuscation success rates, queue depths

### Log Correlation
- **Request ID**: Unique identifier for each API request
- **Batch ID**: Identifier for batch operations
- **User ID**: Authenticated user making the request
- **Session ID**: User session identifier

## Security Configuration

### Authentication Integration
```java
@Override
public void run(PasskeyGdprServiceConfiguration configuration, Environment environment) {
    // Auth service integration
    environment.jersey().register(new AuthBundle<>(configuration.getAuthService()));
    
    // CORS configuration
    FilterRegistration.Dynamic cors = environment.servlets()
        .addFilter("CORS", CrossOriginFilter.class);
    cors.setInitParameter(CrossOriginFilter.ALLOWED_ORIGINS_PARAM, "*");
    cors.setInitParameter(CrossOriginFilter.ALLOWED_HEADERS_PARAM, 
        "X-Requested-With,Content-Type,Accept,Origin,Authorization");
    cors.setInitParameter(CrossOriginFilter.ALLOWED_METHODS_PARAM, 
        "OPTIONS,GET,PUT,POST,DELETE,HEAD");
    cors.addMappingForUrlPatterns(EnumSet.allOf(DispatcherType.class), true, "/*");
}
```

### Data Encryption
- **At Rest**: Database-level encryption for sensitive fields
- **In Transit**: TLS 1.2+ for all API communications
- **Application Level**: Sensitive data encrypted before storage

## Performance Optimization

### Connection Pooling
```yaml
database:
  minSize: 8
  maxSize: 32
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  checkConnectionWhileIdle: true
  evictionInterval: 10s
  minIdleTime: 1m
```

### Caching Strategy
- **Application Cache**: In-memory caching for configuration data
- **Database Cache**: Query result caching for frequently accessed data
- **HTTP Cache**: Response caching for static API documentation

### Batch Processing Optimization
- **Parallel Processing**: Multi-threaded batch processing
- **Chunk Processing**: Large batches split into smaller chunks
- **Queue Management**: Priority-based queue processing
- **Resource Limits**: Configurable limits to prevent resource exhaustion