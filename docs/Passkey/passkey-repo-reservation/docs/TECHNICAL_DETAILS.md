# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 17 (OpenJDK)
- **Build Tool**: Maven 3.8+
- **Packaging**: Executable JAR with embedded Jetty

### Database
- **Primary Database**: Oracle Database 19c
- **Connection Pool**: HikariCP 3.4.5
- **Database Access**: Apache Commons DbUtils 1.7
- **Migration Tool**: Flyway (via Maven plugin)

### HTTP and REST
- **REST Framework**: JAX-RS (Jersey implementation)
- **HTTP Server**: Embedded Jetty
- **API Documentation**: OpenAPI 3.0 (Swagger)
- **HTTP Client**: Retrofit2 2.9.0

### Validation and Mapping
- **Bean Validation**: Hibernate Validator 6.1.7
- **Object Mapping**: MapStruct 1.6.3
- **JSON Processing**: Jackson (via Dropwizard)

### Observability
- **Metrics**: Dropwizard Metrics
- **Logging**: SLF4J with Logback
- **Health Checks**: Dropwizard Health Checks
- **Monitoring**: Datadog integration

### Testing
- **Unit Testing**: JUnit 5
- **Mocking**: Mockito
- **Integration Testing**: Dropwizard Testing
- **API Testing**: Newman (Postman collections)

## Dependencies

### Core Dependencies
```xml
<!-- Dropwizard Core -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>4.0.x</version>
</dependency>

<!-- Database -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>21.3.0.0</version>
</dependency>

<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
    <version>3.4.5</version>
</dependency>

<!-- HTTP Client -->
<dependency>
    <groupId>com.squareup.retrofit2</groupId>
    <artifactId>retrofit</artifactId>
    <version>2.9.0</version>
</dependency>
```

### Cvent Internal Dependencies
```xml
<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>15.2.2</version>
</dependency>

<!-- Passkey Services -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-event-java-client</artifactId>
    <version>1.0.76</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-java-client</artifactId>
    <version>1.0.42</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-inventory-java-client</artifactId>
    <version>1.0.65</version>
</dependency>

<!-- Payment Services -->
<dependency>
    <groupId>com.cvent.ecommerce</groupId>
    <artifactId>payments-wallet-java-client</artifactId>
    <version>8.0.6</version>
</dependency>
```

## Configuration

### Application Configuration
The service uses YAML configuration files located in `passkey-reservation-service/configs/`:

- `dev.yaml` - Local development configuration
- `staging.yaml` - Staging environment configuration  
- `production.yaml` - Production environment configuration

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
  driverClass: oracle.jdbc.OracleDriver
  url: jdbc:oracle:thin:@${DB_HOST}:${DB_PORT}:${DB_SERVICE}
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  properties:
    charSet: UTF-8
  maxWaitForConnection: 1s
  validationQuery: "SELECT 1 FROM DUAL"
  minSize: 8
  maxSize: 32
  checkConnectionWhileIdle: false

# External Service Configuration
externalServices:
  authService:
    baseUrl: ${AUTH_SERVICE_URL}
    apiKey: ${AUTH_API_KEY}
    timeout: 30s
    
  passkeyEventService:
    baseUrl: ${EVENT_SERVICE_URL}
    apiKey: ${EVENT_API_KEY}
    timeout: 15s
    
  passkeyInventoryService:
    baseUrl: ${INVENTORY_SERVICE_URL}
    apiKey: ${INVENTORY_API_KEY}
    timeout: 10s
    
  paymentsWalletService:
    baseUrl: ${PAYMENTS_SERVICE_URL}
    apiKey: ${PAYMENTS_API_KEY}
    timeout: 30s

# Logging Configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkey: DEBUG
    org.hibernate.SQL: DEBUG
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC
      target: stdout
```

### Environment Variables
Required environment variables for different environments:

**Development**:
```bash
LOCAL_API_KEY=<development-api-key>
LOCAL_ECOMMERCE_API_KEY=<ecommerce-dev-api-key>
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XEPDB1
DB_USER=passkey_reservation
DB_PASSWORD=<dev-password>
```

**Production**:
```bash
AUTH_SERVICE_URL=https://auth-service.prod.cvent.org
EVENT_SERVICE_URL=https://passkey-event-service.prod.cvent.org
INVENTORY_SERVICE_URL=https://passkey-inventory-service.prod.cvent.org
PAYMENTS_SERVICE_URL=https://payments-wallet-service.prod.cvent.org
# Additional production-specific variables...
```

## Database Schema

### Core Tables

#### RESERVATIONS
```sql
CREATE TABLE RESERVATIONS (
    RESERVATION_ID VARCHAR2(50) PRIMARY KEY,
    CONFIRMATION_NUMBER VARCHAR2(20) UNIQUE NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    TYPE VARCHAR2(20) NOT NULL,
    EVENT_ID VARCHAR2(50),
    HOTEL_ID VARCHAR2(50) NOT NULL,
    CHECK_IN_DATE DATE NOT NULL,
    CHECK_OUT_DATE DATE NOT NULL,
    TOTAL_AMOUNT NUMBER(10,2),
    CURRENCY VARCHAR2(3) DEFAULT 'USD',
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREATED_BY VARCHAR2(50),
    SPECIAL_REQUESTS CLOB
);
```

#### ATTENDEES
```sql
CREATE TABLE ATTENDEES (
    ATTENDEE_ID VARCHAR2(50) PRIMARY KEY,
    RESERVATION_ID VARCHAR2(50) NOT NULL,
    FIRST_NAME VARCHAR2(100) NOT NULL,
    LAST_NAME VARCHAR2(100) NOT NULL,
    EMAIL VARCHAR2(255),
    PHONE VARCHAR2(20),
    DATE_OF_BIRTH DATE,
    SPECIAL_NEEDS CLOB,
    ROOM_ASSIGNMENT VARCHAR2(50),
    CHECK_IN_STATUS VARCHAR2(20) DEFAULT 'NOT_CHECKED_IN',
    LOYALTY_NUMBER VARCHAR2(50),
    CONSTRAINT FK_ATTENDEE_RESERVATION 
        FOREIGN KEY (RESERVATION_ID) REFERENCES RESERVATIONS(RESERVATION_ID)
);
```

#### ROOMS
```sql
CREATE TABLE ROOMS (
    ROOM_ID VARCHAR2(50) PRIMARY KEY,
    RESERVATION_ID VARCHAR2(50) NOT NULL,
    ROOM_TYPE_ID VARCHAR2(50) NOT NULL,
    ROOM_NUMBER VARCHAR2(10),
    RATE NUMBER(10,2) NOT NULL,
    OCCUPANCY NUMBER(2) DEFAULT 1,
    BED_TYPE VARCHAR2(20),
    SMOKING_PREFERENCE NUMBER(1) DEFAULT 0,
    FLOOR_PREFERENCE VARCHAR2(10),
    CONSTRAINT FK_ROOM_RESERVATION 
        FOREIGN KEY (RESERVATION_ID) REFERENCES RESERVATIONS(RESERVATION_ID)
);
```

#### WAITLISTS
```sql
CREATE TABLE WAITLISTS (
    WAITLIST_ID VARCHAR2(50) PRIMARY KEY,
    EVENT_ID VARCHAR2(50),
    HOTEL_ID VARCHAR2(50) NOT NULL,
    ROOM_TYPE_ID VARCHAR2(50) NOT NULL,
    CHECK_IN_DATE DATE NOT NULL,
    CHECK_OUT_DATE DATE NOT NULL,
    QUANTITY NUMBER(3) DEFAULT 1,
    PRIORITY VARCHAR2(20) DEFAULT 'STANDARD',
    POSITION NUMBER(5),
    STATUS VARCHAR2(20) DEFAULT 'ACTIVE',
    ESTIMATED_AVAILABILITY_DATE DATE,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONTACT_EMAIL VARCHAR2(255) NOT NULL
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX IDX_RESERVATIONS_EVENT_ID ON RESERVATIONS(EVENT_ID);
CREATE INDEX IDX_RESERVATIONS_HOTEL_ID ON RESERVATIONS(HOTEL_ID);
CREATE INDEX IDX_RESERVATIONS_DATES ON RESERVATIONS(CHECK_IN_DATE, CHECK_OUT_DATE);
CREATE INDEX IDX_RESERVATIONS_STATUS ON RESERVATIONS(STATUS);
CREATE INDEX IDX_ATTENDEES_EMAIL ON ATTENDEES(EMAIL);
CREATE INDEX IDX_WAITLISTS_HOTEL_DATES ON WAITLISTS(HOTEL_ID, CHECK_IN_DATE, CHECK_OUT_DATE);
```

## Monitoring & Logging

### Application Metrics
The service exposes metrics via Dropwizard Metrics:

- **HTTP Metrics**: Request rates, response times, error rates
- **Database Metrics**: Connection pool usage, query performance
- **Business Metrics**: Reservation creation rates, cancellation rates
- **JVM Metrics**: Memory usage, garbage collection, thread pools

### Health Checks
Available at `/admin/healthcheck`:

```json
{
  "database": {
    "healthy": true,
    "message": "Database connection successful"
  },
  "authService": {
    "healthy": true,
    "message": "Auth service reachable",
    "responseTime": "45ms"
  },
  "inventoryService": {
    "healthy": true,
    "message": "Inventory service reachable",
    "responseTime": "23ms"
  }
}
```

### Logging Configuration
Structured logging with correlation IDs:

```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "INFO",
  "logger": "com.cvent.passkey.reservation.service.ReservationService",
  "message": "Reservation created successfully",
  "correlationId": "req_123456789",
  "reservationId": "res_987654321",
  "userId": "user_456",
  "duration": 245
}
```

### Error Tracking
Integration with Datadog for error tracking and alerting:

- **Error Rate Monitoring**: Alerts when error rate exceeds 5%
- **Response Time Monitoring**: Alerts when P95 exceeds 2 seconds
- **Database Connection Monitoring**: Alerts on connection pool exhaustion
- **External Service Monitoring**: Alerts on downstream service failures

## Performance Characteristics

### Throughput
- **Peak Load**: 1000 requests/minute
- **Average Response Time**: 150ms (P95: 500ms)
- **Database Connections**: 8-32 concurrent connections
- **Memory Usage**: 512MB-2GB heap

### Caching Strategy
- **Application Cache**: In-memory caching for hotel and event data
- **Database Query Cache**: Oracle result set caching
- **HTTP Response Cache**: ETags for GET endpoints
- **External Service Cache**: 5-minute TTL for reference data

### Scalability
- **Horizontal Scaling**: Stateless design supports multiple instances
- **Load Balancing**: Round-robin distribution across instances
- **Database Scaling**: Read replicas for reporting queries
- **Circuit Breakers**: Fail-fast for external service dependencies

## Security

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication via Auth Service
- **API Keys**: Service-to-service authentication
- **Role-Based Access**: Admin endpoints require elevated privileges
- **Rate Limiting**: Per-API-key request throttling

### Data Protection
- **Encryption at Rest**: Database-level encryption for PII
- **Encryption in Transit**: TLS 1.2+ for all HTTP communications
- **PCI Compliance**: Payment data handled via certified payment service
- **GDPR Compliance**: Data retention and deletion policies

### Security Headers
```yaml
# Security configuration
security:
  headers:
    - name: X-Content-Type-Options
      value: nosniff
    - name: X-Frame-Options
      value: DENY
    - name: X-XSS-Protection
      value: "1; mode=block"
    - name: Strict-Transport-Security
      value: "max-age=31536000; includeSubDomains"
```

## Build and Deployment

### Maven Build Profiles
- **default**: Standard build with unit tests
- **release**: Production build with optimizations
- **coverage**: Build with code coverage reporting
- **run-it**: Integration test execution

### Build Commands
```bash
# Standard build
mvn clean package

# Production build
mvn clean package -Prelease

# With code coverage
mvn clean verify -Pcoverage

# Integration tests
mvn clean verify -Prun-it -Denv.IT_ENVIRONMENT=dev
```

### Docker Configuration
```dockerfile
FROM openjdk:17-jre-slim

WORKDIR /app
COPY target/passkey-reservation-service-*.jar app.jar
COPY configs/ configs/

EXPOSE 8080 8081

ENTRYPOINT ["java", "-jar", "app.jar", "server", "configs/production.yaml"]
```

### Deployment Pipeline
1. **Build**: Maven compilation and testing
2. **Quality Gate**: SonarQube analysis
3. **Security Scan**: Dependency vulnerability check
4. **Docker Build**: Container image creation
5. **Deploy to Staging**: Automated staging deployment
6. **Integration Tests**: End-to-end test execution
7. **Deploy to Production**: Blue-green deployment strategy