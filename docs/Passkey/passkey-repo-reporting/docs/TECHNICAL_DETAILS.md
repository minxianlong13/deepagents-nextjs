# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Application Server**: Embedded Jetty (via Dropwizard)
- **Database**: PostgreSQL (inferred from typical Cvent stack)
- **Caching**: Redis
- **Authentication**: Cvent Auth Service integration
- **Containerization**: Docker
- **Base Image**: OpenJDK 8 Alpine (legacy, should be updated to Java 21)

## Dependencies

### Core Framework Dependencies

```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
</dependency>

<!-- Cvent Auth Service Integration -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>16.0.2</version>
</dependency>
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>16.0.2</version>
</dependency>

<!-- Passkey Common Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.2</version>
</dependency>
```

### Observability Dependencies

```xml
<!-- Cvent Observability Stack -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-observability</artifactId>
    <version>57.4.0</version>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-observability</artifactId>
    <version>57.4.0</version>
</dependency>
```

### Testing Dependencies

```xml
<!-- Unit Testing -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-unit-tests</artifactId>
    <version>57.4.0</version>
    <scope>test</scope>
</dependency>

<!-- Integration Testing -->
<dependency>
    <groupId>com.intuit.karate</groupId>
    <artifactId>karate-junit5</artifactId>
    <scope>test</scope>
</dependency>
```

### Security Dependencies

```xml
<!-- Security Vulnerability Fixes -->
<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.14.0</version> <!-- Override to fix CVE-2024-47554 -->
</dependency>
```

## Configuration

### Environment Configuration Files

The service uses YAML configuration files located in `passkey-reporting-service/configs/`:

- `dev.yaml` - Development environment
- `staging.yaml` - Staging environment  
- `prod.yaml` - Production environment

### Configuration Structure

```yaml
# Server Configuration
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

# Database Configuration
database:
  driverClass: org.postgresql.Driver
  url: jdbc:postgresql://localhost:5432/passkey_reporting
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
  minSize: 8
  maxSize: 32

# Auth Service Configuration
authService:
  baseUrl: ${AUTH_SERVICE_URL}
  timeout: 30s
  connectionTimeout: 10s

# Cache Configuration
cache:
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    timeout: 5s
    maxConnections: 20

# Logging Configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkeyreporting: DEBUG
    org.hibernate.SQL: DEBUG
  appenders:
    - type: console
      threshold: INFO
      target: stdout
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_USER` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `AUTH_SERVICE_URL` | Auth service base URL | Yes |
| `REDIS_HOST` | Redis cache host | Yes |
| `REDIS_PORT` | Redis cache port | Yes |
| `LOG_LEVEL` | Application log level | No |

## Database Schema

### Core Tables

```sql
-- Participants (Hotels and Organizers)
CREATE TABLE participants (
    participant_id BIGSERIAL PRIMARY KEY,
    participant_type VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE events (
    event_id VARCHAR(50) PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    organizer_id BIGINT REFERENCES participants(participant_id),
    event_category VARCHAR(50) NOT NULL,
    event_start_date DATE NOT NULL,
    event_end_date DATE NOT NULL,
    total_attendees INTEGER,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE bookings (
    booking_id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) REFERENCES events(event_id),
    hotel_id BIGINT REFERENCES participants(participant_id),
    guest_name VARCHAR(255) NOT NULL,
    confirmation_number VARCHAR(100),
    booking_date DATE NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_nights INTEGER NOT NULL,
    reservation_method VARCHAR(20) NOT NULL,
    room_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue
CREATE TABLE revenue (
    revenue_id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) REFERENCES bookings(booking_id),
    room_revenue DECIMAL(10,2) NOT NULL,
    tax_revenue DECIMAL(10,2) DEFAULT 0,
    fee_revenue DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    revenue_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
-- Performance Indexes
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_start_date ON events(event_start_date);
CREATE INDEX idx_revenue_booking_id ON revenue(booking_id);
CREATE INDEX idx_revenue_date ON revenue(revenue_date);

-- Composite Indexes for Reporting
CREATE INDEX idx_bookings_date_range ON bookings(booking_date, check_in_date);
CREATE INDEX idx_bookings_participant_date ON bookings(hotel_id, booking_date);
CREATE INDEX idx_events_category_date ON events(event_category, event_start_date);
```

## Build Configuration

### Maven Profiles

```xml
<!-- Release Profile -->
<profile>
    <id>release</id>
    <properties>
        <maven.source.skip>true</maven.source.skip>
        <maven.javadoc.skip>true</maven.javadoc.skip>
    </properties>
</profile>

<!-- Integration Test Profile -->
<profile>
    <id>run-it</id>
    <properties>
        <skipIntegrationTests>false</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-reporting-integration-test</module>
    </modules>
</profile>

<!-- Coverage Profile -->
<profile>
    <id>coverage</id>
    <build>
        <plugins>
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</profile>
```

### Build Commands

```bash
# Standard build
mvn clean install

# Release build (skip docs)
mvn clean install -Prelease

# Build with coverage
mvn clean install -Pcoverage

# Integration tests
mvn clean verify -Prun-it -Dkarate.env=dev

# Docker build
docker build -t passkey-reporting .
```

## Monitoring & Logging

### Health Checks

The service implements several health checks:

```java
// Database connectivity
public class DatabaseHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Verify database connection
        return Result.healthy();
    }
}

// External service dependencies
public class AuthServiceHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Verify auth service connectivity
        return Result.healthy();
    }
}

// Cache availability
public class CacheHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Verify Redis connectivity
        return Result.healthy();
    }
}
```

### Metrics

Dropwizard provides built-in metrics:

- **JVM Metrics**: Memory usage, garbage collection, thread pools
- **HTTP Metrics**: Request rates, response times, error rates
- **Database Metrics**: Connection pool usage, query performance
- **Custom Metrics**: Business-specific metrics for reporting operations

### Logging Configuration

```xml
<!-- Logback Configuration -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <timestamp/>
                <logLevel/>
                <loggerName/>
                <message/>
                <mdc/>
                <arguments/>
                <stackTrace/>
            </providers>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkeyreporting" level="DEBUG"/>
    <logger name="org.hibernate.SQL" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### Observability Integration

- **Datadog**: APM tracing and metrics collection
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Distributed Tracing**: Request tracing across service boundaries
- **Custom Dashboards**: Business metrics and KPI monitoring

## Security Configuration

### Authentication Integration

```java
@EnableLogContext
public class BookingsReportResource {
    @GET
    public Response get(
        @Authority(methods = { 
            AuthMethod.BEARER,  // Deprecated
            AuthMethod.API_KEY  // Preferred
        }) GrantedAPIKey token,
        // ... other parameters
    ) {
        // Authentication handled by Dropwizard bundle
    }
}
```

### Security Headers

```yaml
# Security configuration
server:
  requestLog:
    appenders:
      - type: console
        filterFactories:
          - type: request-log-filter
            excludeHeaders: [authorization, x-api-key]
```

## Performance Optimization

### Connection Pooling

```yaml
database:
  minSize: 8          # Minimum connections
  maxSize: 32         # Maximum connections
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
  checkConnectionWhileIdle: true
  evictionInterval: 10s
```

### Caching Strategy

```java
@Cacheable(value = "bookings-report", key = "#startDate + #endDate + #participantId")
public BookingsReportData getBookingsReport(LocalDate startDate, LocalDate endDate, Long participantId) {
    // Expensive database operation
}
```

### Query Optimization

- Use of prepared statements for all database queries
- Proper indexing on frequently queried columns
- Pagination for large result sets
- Lazy loading for related entities

## Testing Configuration

### Unit Tests

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.0.0</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
        </includes>
    </configuration>
</plugin>
```

### Integration Tests (Karate)

```yaml
# karate-config.js
function fn() {
  var env = karate.env;
  var config = {
    baseUrl: 'http://localhost:8080',
    apiKey: 'test-api-key'
  };
  
  if (env == 'dev') {
    config.baseUrl = 'https://api-dev.cvent.com';
  } else if (env == 'staging') {
    config.baseUrl = 'https://api-staging.cvent.com';
  }
  
  return config;
}
```

### Service Tests (Newman/Postman)

```bash
# Run service tests
cd passkey-reporting-service-test
sh newman.sh dev
```

## Deployment Artifacts

### JAR Structure

```
passkey-reporting-service-1.31.1-SNAPSHOT.jar
├── META-INF/
├── com/cvent/passkeyreporting/
├── configs/
└── lib/ (dependencies)
```

### Docker Image Layers

```dockerfile
# Multi-stage build
FROM docker.cvent.net/maven as builder
# ... build steps

FROM openjdk:8-jre-alpine  # Should be updated to Java 21
WORKDIR /usr/src
COPY --from=builder /usr/src/app/passkey-reporting-service/target/*.jar ./service.jar
COPY --from=builder /usr/src/app/passkey-reporting-service/target/*-configs .
CMD ["java", "-jar", "service.jar", "server", "configs/dev.yaml"]
```

## Code Quality

### SonarQube Configuration

```xml
<properties>
    <sonar.coverage.exclusions>
        passkey-reporting-api/**,
        passkey-reporting-java-client/**,
        passkey-reporting-data-access/**,
        passkey-reporting-integration-test/**,
        passkey-reporting-service-test/**,
        **/PasskeyReportingServiceApplication.java
    </sonar.coverage.exclusions>
</properties>
```

### Checkstyle Integration

- Code style enforcement through Maven plugin
- Custom Cvent checkstyle rules
- Automatic formatting validation in CI/CD

### JaCoCo Coverage

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <excludes>
            <exclude>com/cvent/passkeyreporting/PasskeyReportingServiceApplication.class</exclude>
        </excludes>
    </configuration>
</plugin>
```