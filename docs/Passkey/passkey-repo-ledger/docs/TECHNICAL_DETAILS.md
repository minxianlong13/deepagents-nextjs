# Technical Details

## Technology Stack

- **Framework**: Dropwizard 2.x
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database 18c+
- **Connection Pool**: HikariCP 3.4.5
- **HTTP Client**: Jersey/JAX-RS
- **JSON Processing**: Jackson
- **Testing**: JUnit 5, Karate (API testing)
- **Containerization**: Docker
- **CI/CD**: Jenkins

## Dependencies

### Core Framework Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>2.x</version>
</dependency>

<!-- Cvent Common Libraries -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-observability</artifactId>
    <version>55.10.0</version>
</dependency>

<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-observability</artifactId>
    <version>55.10.0</version>
</dependency>
```

### Database Dependencies
```xml
<!-- Oracle JDBC Driver -->
<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>18.3.0.0</version>
</dependency>

<!-- Connection Pooling -->
<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
    <version>3.4.5</version>
</dependency>

<!-- Database Utilities -->
<dependency>
    <groupId>commons-dbutils</groupId>
    <artifactId>commons-dbutils</artifactId>
    <version>1.7</version>
</dependency>
```

### Authentication & Authorization
```xml
<!-- Cvent Auth Service Integration -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>21.3.5</version>
</dependency>

<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>21.3.5</version>
</dependency>
```

### Payment Integration Dependencies
```xml
<!-- Cvent Payment Services -->
<dependency>
    <groupId>com.cvent.payment</groupId>
    <artifactId>payment-retrofit-client</artifactId>
    <version>5.0.8</version>
</dependency>

<!-- Wallet Services -->
<dependency>
    <groupId>com.cvent.ecommerce</groupId>
    <artifactId>payments-wallet-java-client</artifactId>
    <version>8.1.34</version>
</dependency>

<!-- WebPayments Validation -->
<dependency>
    <groupId>com.cvent.ecommerce</groupId>
    <artifactId>webpayments-validator-java-client</artifactId>
    <version>2.0.4</version>
</dependency>
```

### AWS SDK Dependencies
```xml
<!-- AWS SDK BOM -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>bom</artifactId>
    <version>2.16.58</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

### Testing Dependencies
```xml
<!-- Unit Testing -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>

<!-- Dropwizard Testing -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-unit-tests</artifactId>
    <version>55.10.0</version>
    <scope>test</scope>
</dependency>

<!-- API Testing -->
<dependency>
    <groupId>com.intuit.karate</groupId>
    <artifactId>karate-junit5</artifactId>
    <scope>test</scope>
</dependency>
```

## Configuration

### Application Configuration Structure
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
  url: jdbc:oracle:thin:@//localhost:1521/XEPDB1
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32
  checkConnectionWhileIdle: false

# External Service Configuration
authService:
  baseUrl: ${AUTH_SERVICE_URL}
  apiKey: ${LOCAL_API_KEY}
  timeout: 30s

ecommerceService:
  baseUrl: ${ECOMMERCE_SERVICE_URL}
  apiKey: ${LOCAL_ECOMMERCE_API_KEY}
  timeout: 30s

# Logging Configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkeyledger: DEBUG
  appenders:
    - type: console
    - type: file
      currentLogFilename: ./logs/passkey-ledger.log
      archivedLogFilenamePattern: ./logs/passkey-ledger-%d.log.gz
      archivedFileCount: 5
```

### Environment Variables
```bash
# Database Configuration
DB_USER=ledger_user
DB_PASSWORD=secure_password
DB_URL=jdbc:oracle:thin:@//db-host:1521/service

# API Keys
LOCAL_API_KEY=your_api_key_here
LOCAL_ECOMMERCE_API_KEY=your_ecommerce_api_key_here

# Service URLs
AUTH_SERVICE_URL=https://auth-service.cvent.org
ECOMMERCE_SERVICE_URL=https://ecommerce-service.cvent.org

# Application Settings
LOG_LEVEL=INFO
SERVER_PORT=8080
ADMIN_PORT=8081
```

## Database Schema

### Core Tables
```sql
-- Balance tracking table
CREATE TABLE LEDGER_BALANCE (
    OWNER_ID VARCHAR2(255) NOT NULL,
    OWNER_TYPE VARCHAR2(50) NOT NULL,
    AMOUNT NUMBER(19,4) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    LAST_UPDATED TIMESTAMP NOT NULL,
    VERSION NUMBER(19) NOT NULL,
    PRIMARY KEY (OWNER_ID, OWNER_TYPE)
);

-- Operation tracking table
CREATE TABLE LEDGER_OPERATION (
    OPERATION_ID VARCHAR2(255) PRIMARY KEY,
    OPERATION_TYPE VARCHAR2(50) NOT NULL,
    AMOUNT NUMBER(19,4) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    OWNER_ID VARCHAR2(255) NOT NULL,
    OWNER_TYPE VARCHAR2(50) NOT NULL,
    STATUS VARCHAR2(50) NOT NULL,
    CREATED_AT TIMESTAMP NOT NULL,
    COMPLETED_AT TIMESTAMP,
    DESCRIPTION VARCHAR2(500),
    REFERENCE_ID VARCHAR2(255),
    TRANSACTION_ID VARCHAR2(255)
);

-- Transaction tracking table
CREATE TABLE LEDGER_TRANSACTION (
    TRANSACTION_ID VARCHAR2(255) PRIMARY KEY,
    TOTAL_AMOUNT NUMBER(19,4) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    STATUS VARCHAR2(50) NOT NULL,
    CREATED_AT TIMESTAMP NOT NULL,
    COMPLETED_AT TIMESTAMP,
    PAYMENT_METHOD VARCHAR2(100),
    MERCHANT_ID VARCHAR2(255),
    AUTHORIZATION_CODE VARCHAR2(100)
);

-- Credit card information table
CREATE TABLE LEDGER_CREDIT_CARD (
    CARD_ID VARCHAR2(255) PRIMARY KEY,
    CARD_NUMBER_ENCRYPTED CLOB NOT NULL,
    EXPIRY_MONTH NUMBER(2) NOT NULL,
    EXPIRY_YEAR NUMBER(4) NOT NULL,
    CARD_ASSOCIATION VARCHAR2(50) NOT NULL,
    CARD_TYPE VARCHAR2(50) NOT NULL,
    LAST_FOUR_DIGITS VARCHAR2(4) NOT NULL,
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    CREATED_AT TIMESTAMP NOT NULL
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX IDX_BALANCE_OWNER ON LEDGER_BALANCE(OWNER_ID, OWNER_TYPE);
CREATE INDEX IDX_OPERATION_OWNER ON LEDGER_OPERATION(OWNER_ID, OWNER_TYPE);
CREATE INDEX IDX_OPERATION_TRANSACTION ON LEDGER_OPERATION(TRANSACTION_ID);
CREATE INDEX IDX_OPERATION_STATUS ON LEDGER_OPERATION(STATUS, CREATED_AT);
CREATE INDEX IDX_TRANSACTION_STATUS ON LEDGER_TRANSACTION(STATUS, CREATED_AT);
```

## Monitoring & Logging

### Metrics Collection
- **Dropwizard Metrics**: Built-in metrics for JVM, HTTP requests, and database connections
- **Custom Metrics**: Business-specific metrics for transaction processing
- **Health Checks**: Database connectivity, external service availability

### Logging Configuration
- **Structured Logging**: JSON format for log aggregation
- **Log Levels**: Configurable per package
- **Audit Logging**: Separate audit trail for financial operations
- **Performance Logging**: Request/response timing and database query performance

### Observability Integration
```java
// Custom metrics example
@Timed(name = "credit-card-processing-time")
@Metered(name = "credit-card-processing-rate")
public Response processCreditCard(CreditCardRequest request) {
    // Processing logic
}
```

### Health Checks
```java
// Database health check
public class DatabaseHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check database connectivity
        return Result.healthy("Database connection OK");
    }
}

// External service health check
public class PaymentServiceHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check payment service availability
        return Result.healthy("Payment service available");
    }
}
```

## Security Configuration

### SSL/TLS Configuration
```yaml
server:
  applicationConnectors:
    - type: https
      port: 8443
      keyStorePath: /path/to/keystore.jks
      keyStorePassword: ${KEYSTORE_PASSWORD}
      trustStorePath: /path/to/truststore.jks
      trustStorePassword: ${TRUSTSTORE_PASSWORD}
```

### API Security
- **Authentication**: Bearer token authentication
- **Authorization**: Role-based access control
- **Rate Limiting**: Request throttling per API key
- **Input Validation**: Comprehensive request validation

### Data Encryption
- **Database**: Transparent Data Encryption (TDE) for sensitive columns
- **Transit**: HTTPS/TLS for all communications
- **At Rest**: Encrypted storage for configuration files

## Performance Tuning

### JVM Configuration
```bash
# JVM memory settings
-Xms2g -Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+HeapDumpOnOutOfMemoryError

# Monitoring and debugging
-XX:+PrintGCDetails
-XX:+PrintGCTimeStamps
-Dcom.sun.management.jmxremote
```

### Database Optimization
- **Connection Pooling**: HikariCP with optimized settings
- **Query Optimization**: Indexed queries and prepared statements
- **Batch Processing**: Bulk operations for improved throughput
- **Read Replicas**: Read-only queries directed to replicas

### Caching Strategy
- **Application Cache**: In-memory caching for frequently accessed data
- **Database Cache**: Oracle result cache for expensive queries
- **HTTP Cache**: Response caching for idempotent operations