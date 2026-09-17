# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Parent POM**: Cvent Maven Parent 57.4.9
- **Database**: PostgreSQL (via Cvent's data infrastructure)
- **HTTP Client**: Jersey Client (JAX-RS)
- **JSON Processing**: Jackson
- **Logging**: Logback with SLF4J
- **Metrics**: Dropwizard Metrics
- **Testing**: JUnit 5, Mockito, WireMock

## Dependencies

### Core Dependencies
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.12</version>
</dependency>

<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>28.4.1</version>
</dependency>

<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-core</artifactId>
    <version>28.4.1</version>
</dependency>
```

### Dropwizard Stack
- `dropwizard-core`: Core framework functionality
- `dropwizard-jersey`: JAX-RS REST framework
- `dropwizard-jackson`: JSON serialization/deserialization
- `dropwizard-validation`: Bean validation
- `dropwizard-metrics`: Application metrics
- `dropwizard-health`: Health check framework

### HTTP and Integration
- `jersey-client`: HTTP client for external API calls
- `jackson-datatype-jsr310`: Java 8 time API support
- `jackson-dataformat-yaml`: YAML configuration support

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ENVIRONMENT` | Deployment environment (dev/staging/prod) | Yes | - |
| `LOG_LEVEL` | Logging level | No | INFO |
| `HILTON_API_BASE_URL` | Base URL for Hilton APIs | Yes | - |
| `AUTH_SERVICE_URL` | Auth service endpoint | Yes | - |
| `SYNC_SCHEDULE_CRON` | Cron expression for sync schedule | No | `0 0 * * * ?` |

### Configuration Files

#### Development (`configs/dev.yaml`)
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

logging:
  level: DEBUG
  loggers:
    com.cvent.passkeyhiltonsrp: DEBUG
    org.apache.http: INFO

hiltonIntegration:
  baseUrl: https://api-staging.hilton.com
  timeout: 30s
  retryAttempts: 3
  
authService:
  baseUrl: http://localhost:9090
  timeout: 10s
```

#### Production (`configs/prod.yaml`)
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
  appenders:
    - type: console
      logFormat: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n"

hiltonIntegration:
  baseUrl: https://api.hilton.com
  timeout: 30s
  retryAttempts: 3
  
metrics:
  reporters:
    - type: datadog
      host: localhost
      port: 8125
```

### Secrets Management

Secrets are managed through AWS Parameter Store with the following naming convention:

#### Staging Environment
- `__STAGING_HILTON_INTEGRATION_CLIENT_ID__`: OAuth client ID
- `__STAGING_HILTON_INTEGRATION_CLIENT_SECRET__`: OAuth client secret

#### Production Environment
- `__PRODUCTION_HILTON_INTEGRATION_CLIENT_ID__`: OAuth client ID
- `__PRODUCTION_HILTON_INTEGRATION_CLIENT_SECRET__`: OAuth client secret

## Database Schema

### Tables

#### `hilton_srp_mappings`
```sql
CREATE TABLE hilton_srp_mappings (
    id BIGSERIAL PRIMARY KEY,
    event_code VARCHAR(50) NOT NULL,
    hilton_rate_plan_id VARCHAR(100) NOT NULL,
    property_code VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(event_code, property_code, start_date)
);
```

#### `hilton_reservations`
```sql
CREATE TABLE hilton_reservations (
    id BIGSERIAL PRIMARY KEY,
    reservation_id VARCHAR(50) UNIQUE NOT NULL,
    passkey_reservation_id VARCHAR(50),
    event_code VARCHAR(50) NOT NULL,
    guest_name VARCHAR(200) NOT NULL,
    guest_email VARCHAR(255),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_type VARCHAR(50),
    rate DECIMAL(10,2),
    currency VARCHAR(3),
    status VARCHAR(20) NOT NULL,
    confirmation_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `sync_operations`
```sql
CREATE TABLE sync_operations (
    id BIGSERIAL PRIMARY KEY,
    sync_id VARCHAR(50) UNIQUE NOT NULL,
    operation_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    event_codes TEXT[], -- PostgreSQL array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Monitoring & Logging

### Metrics
- **JVM Metrics**: Memory usage, garbage collection, thread pools
- **HTTP Metrics**: Request rates, response times, error rates
- **Business Metrics**: Sync operation success/failure rates, reservation processing times
- **External API Metrics**: Hilton API response times and error rates

### Health Checks
- **Database Connectivity**: Validates database connection pool
- **Hilton API Connectivity**: Tests authentication and basic API access
- **Auth Service Connectivity**: Validates auth service availability

### Logging Configuration
```yaml
logging:
  level: INFO
  loggers:
    com.cvent.passkeyhiltonsrp: DEBUG
    com.cvent.passkeyhiltonsrp.clients: INFO
    org.apache.http.wire: WARN
    org.hibernate.SQL: WARN
  appenders:
    - type: console
      logFormat: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n"
    - type: file
      currentLogFilename: logs/application.log
      archivedLogFilenamePattern: logs/application-%d{yyyy-MM-dd}.log.gz
      archivedFileCount: 30
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
    <modules>
        <module>passkey-hiltonsrp-api</module>
        <module>passkey-hiltonsrp-data-access</module>
        <module>passkey-hiltonsrp-java-client</module>
        <module>passkey-hiltonsrp-service</module>
        <module>passkey-hiltonsrp-integration-test</module>
    </modules>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <skipIntegrationTests>false</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-hiltonsrp-api</module>
        <module>passkey-hiltonsrp-java-client</module>
        <module>passkey-hiltonsrp-integration-test</module>
    </modules>
</profile>
```

### Code Coverage
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <excludes>
            <exclude>com/cvent/passkeyhiltonsrp/PasskeyHiltonSRPService*.class</exclude>
        </excludes>
    </configuration>
</plugin>
```

## Performance Considerations

### Connection Pooling
- HTTP client connection pool: 20 connections max
- Database connection pool: 10 connections (HikariCP)
- Connection timeout: 30 seconds
- Read timeout: 60 seconds

### Caching
- OAuth tokens cached until expiration
- SRP mappings cached for 5 minutes
- Configuration values cached at startup

### Async Processing
- Reservation processing uses async patterns where possible
- Bulk operations are batched to improve performance
- Circuit breaker pattern prevents cascade failures

## Security

### API Security
- All external API calls use HTTPS
- OAuth 2.0 client credentials flow for Hilton APIs
- Request/response logging excludes sensitive data
- API keys and secrets stored in AWS Parameter Store

### Data Protection
- Guest PII is masked in application logs
- Database connections use SSL/TLS
- Secrets are encrypted at rest and in transit
- Regular security scanning via WhiteSource