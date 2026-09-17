# Technical Details

## Technology Stack

### Framework and Runtime
- **Framework**: Spring Boot 2.x
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Package Manager**: pnpm (for monorepo management)
- **Application Server**: Embedded Tomcat (via Spring Boot)
- **JVM**: OpenJDK 17

### Core Dependencies
- **Spring Boot Starter Web**: RESTful web services
- **Spring Boot Starter Security**: Authentication and authorization
- **Spring Boot Starter Actuator**: Health checks and monitoring
- **Spring Boot Starter Test**: Testing framework
- **MyBatis Spring Boot Starter**: Database ORM
- **Oracle JDBC Driver**: Database connectivity

### Cvent-Specific Libraries
- **cvent-spring-boot-starter-service**: Cvent service framework
- **cvent-spring-boot-starter-oauth**: OAuth integration
- **cvent-spring-boot-starter-logcontext**: Logging context management
- **common-pangaea**: Cvent common utilities
- **common-tracing**: Distributed tracing
- **common-observability**: Monitoring and metrics

### Database
- **Primary Database**: Oracle Database 19c
- **ORM**: MyBatis 3.x
- **Connection Pooling**: HikariCP (default with Spring Boot)
- **Migration Tool**: Flyway (for schema migrations)

### Development Tools
- **Code Generation**: Immutables library for immutable objects
- **Mapping**: MapStruct for object mapping
- **Code Quality**: Checkstyle, SonarQube
- **Testing**: JUnit 5, Mockito, Spring Boot Test

## Dependencies

### Core Spring Boot Dependencies
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
</dependency>
```

### Cvent Framework Dependencies
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-service</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-oauth</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-observability</artifactId>
</dependency>
```

### Database Dependencies
```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>spring-boot-mybatis</artifactId>
</dependency>
```

### Utility Dependencies
```xml
<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
</dependency>
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <scope>provided</scope>
</dependency>
```

### Internal Service Dependencies
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-reservation-service</artifactId>
    <classifier>lib</classifier>
</dependency>
<dependency>
    <groupId>com.cvent.passkey-payment</groupId>
    <artifactId>passkey-payment-service</artifactId>
    <classifier>lib</classifier>
</dependency>
<dependency>
    <groupId>com.cvent.passkey-addons</groupId>
    <artifactId>passkey-addons-service</artifactId>
    <classifier>lib</classifier>
</dependency>
```

## Configuration

### Application Configuration
The service uses YAML-based configuration with environment-specific overrides:

**Base Configuration** (`application.yml`):
```yaml
server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: passkey-reservation-sb
  datasource:
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

mybatis:
  mapper-locations: classpath:mybatis/mappers/*.xml
  configuration:
    map-underscore-to-camel-case: true
    default-fetch-size: 100
    default-statement-timeout: 30

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
```

**Environment-Specific Configuration**:
- `configs/dev.yaml` - Development environment
- `configs/staging.yaml` - Staging environment  
- `configs/prod.yaml` - Production environment

### Security Configuration
OAuth 2.0 configuration for Cvent authentication:

```yaml
cvent:
  oauth:
    resource-server:
      jwt:
        issuer-uri: https://oauth.cvent.com
        jwk-set-uri: https://oauth.cvent.com/.well-known/jwks.json
    scopes:
      reservation-read: RESERVATION_READ
```

### Database Configuration
Oracle database connection settings:

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@${DB_HOST}:${DB_PORT}:${DB_SERVICE}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      validation-timeout: 5000
      leak-detection-threshold: 60000
```

### Logging Configuration
Structured logging with correlation IDs:

```xml
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
    
    <logger name="com.cvent.passkeyreservationsb" level="INFO"/>
    <logger name="org.springframework.security" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

## Database Schema

### Primary Tables

**RESERVATIONS**:
```sql
CREATE TABLE RESERVATIONS (
    CONFIRMATION_NUMBER VARCHAR2(12) PRIMARY KEY,
    GUEST_FIRST_NAME VARCHAR2(50) NOT NULL,
    GUEST_LAST_NAME VARCHAR2(50) NOT NULL,
    GUEST_EMAIL VARCHAR2(255) NOT NULL,
    CHECK_IN_DATE DATE NOT NULL,
    CHECK_OUT_DATE DATE NOT NULL,
    HOTEL_ID VARCHAR2(20) NOT NULL,
    ROOM_TYPE_CODE VARCHAR2(10) NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    TOTAL_AMOUNT NUMBER(10,2),
    CURRENCY_CODE VARCHAR2(3),
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREATED_BY VARCHAR2(50),
    MODIFIED_BY VARCHAR2(50)
);
```

**GUEST_PROFILES**:
```sql
CREATE TABLE GUEST_PROFILES (
    CONFIRMATION_NUMBER VARCHAR2(12) PRIMARY KEY,
    PHONE VARCHAR2(20),
    SPECIAL_REQUESTS CLOB,
    LOYALTY_NUMBER VARCHAR2(50),
    SMOKING_PREFERENCE VARCHAR2(20),
    ACCESSIBILITY_NEEDS CLOB,
    FOREIGN KEY (CONFIRMATION_NUMBER) REFERENCES RESERVATIONS(CONFIRMATION_NUMBER)
);
```

**PAYMENT_INFO**:
```sql
CREATE TABLE PAYMENT_INFO (
    CONFIRMATION_NUMBER VARCHAR2(12) PRIMARY KEY,
    PAYMENT_METHOD VARCHAR2(20) NOT NULL,
    LAST_FOUR_DIGITS VARCHAR2(4),
    PAYMENT_STATUS VARCHAR2(20) NOT NULL,
    AUTHORIZATION_CODE VARCHAR2(50),
    TRANSACTION_ID VARCHAR2(100),
    BILLING_ADDRESS_LINE1 VARCHAR2(255),
    BILLING_CITY VARCHAR2(100),
    BILLING_STATE VARCHAR2(50),
    BILLING_POSTAL_CODE VARCHAR2(20),
    BILLING_COUNTRY VARCHAR2(50),
    FOREIGN KEY (CONFIRMATION_NUMBER) REFERENCES RESERVATIONS(CONFIRMATION_NUMBER)
);
```

### Indexes
```sql
CREATE INDEX IDX_RESERVATIONS_HOTEL_DATES ON RESERVATIONS(HOTEL_ID, CHECK_IN_DATE, CHECK_OUT_DATE);
CREATE INDEX IDX_RESERVATIONS_GUEST_EMAIL ON RESERVATIONS(GUEST_EMAIL);
CREATE INDEX IDX_RESERVATIONS_STATUS ON RESERVATIONS(STATUS);
CREATE INDEX IDX_RESERVATIONS_CREATED_DATE ON RESERVATIONS(CREATED_DATE);
```

## Monitoring & Logging

### Application Metrics
Spring Boot Actuator provides comprehensive metrics:

- **JVM Metrics**: Memory usage, garbage collection, thread counts
- **HTTP Metrics**: Request counts, response times, error rates
- **Database Metrics**: Connection pool usage, query performance
- **Custom Metrics**: Business-specific metrics (reservations created, etc.)

### Health Checks
Multiple health indicators monitor system components:

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        // Check database connectivity
        // Return UP or DOWN with details
    }
}
```

### Distributed Tracing
Integration with Cvent's tracing infrastructure:

- **Trace Context**: Automatic trace propagation across service calls
- **Span Creation**: Custom spans for business operations
- **Correlation IDs**: Request correlation across services
- **Performance Monitoring**: End-to-end request timing

### Structured Logging
JSON-formatted logs with contextual information:

```json
{
  "timestamp": "2024-01-29T15:30:00.123Z",
  "level": "INFO",
  "logger": "com.cvent.passkeyreservationsb.service.ReservationService",
  "message": "Reservation retrieved successfully",
  "mdc": {
    "correlationId": "abc-123-def",
    "userId": "user123",
    "confirmationNumber": "ABC123456"
  }
}
```

### Datadog Integration
Comprehensive monitoring through Datadog:

- **APM**: Application performance monitoring
- **Infrastructure**: Server and container metrics
- **Logs**: Centralized log aggregation and analysis
- **Alerts**: Automated alerting on errors and performance issues

## Performance Considerations

### Database Optimization
- **Connection Pooling**: HikariCP with optimized pool settings
- **Query Optimization**: Indexed queries and efficient SQL
- **Caching**: MyBatis second-level caching for frequently accessed data
- **Batch Operations**: Bulk operations for data modifications

### Memory Management
- **Immutable Objects**: Using Immutables library for thread-safe, memory-efficient objects
- **Garbage Collection**: G1GC tuning for low-latency performance
- **Memory Pools**: Proper sizing of heap and non-heap memory

### Caching Strategy
- **Application-Level Caching**: Spring Cache abstraction
- **Database Caching**: MyBatis query result caching
- **HTTP Caching**: Appropriate cache headers for static content

### Async Processing
- **Non-blocking I/O**: Reactive programming patterns where applicable
- **Thread Pools**: Separate thread pools for different operation types
- **Event-driven**: Asynchronous event processing for non-critical operations

## Security Implementation

### Authentication Flow
1. **Token Validation**: JWT token signature verification
2. **Scope Verification**: Required scope validation for endpoints
3. **User Context**: Security context population with user details
4. **Audit Logging**: Security events logged for compliance

### Data Protection
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Encryption at Rest**: Database-level encryption for sensitive data
- **PII Handling**: Proper handling and logging restrictions for personal data
- **Input Validation**: Comprehensive input sanitization and validation

### Security Headers
```yaml
security:
  headers:
    frame-options: DENY
    content-type-options: nosniff
    xss-protection: 1; mode=block
    referrer-policy: strict-origin-when-cross-origin
```

## Build and Packaging

### Maven Configuration
Multi-module Maven project with shared parent POM:

```xml
<properties>
    <java.version>17</java.version>
    <spring-boot.version>2.7.x</spring-boot.version>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
</properties>
```

### Docker Configuration
Optimized Docker image for production deployment:

```dockerfile
FROM openjdk:17-jre-slim
COPY target/passkey-reservation-sb-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### Build Profiles
- **default**: Standard build with unit tests
- **integration**: Includes integration tests
- **coverage**: Code coverage analysis with JaCoCo
- **release**: Production-ready build with optimizations