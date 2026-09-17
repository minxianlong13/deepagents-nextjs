# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x (JAX-RS, Jersey, Jetty)
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database 21c
- **Connection Pool**: Tomcat JDBC Pool
- **ORM**: MyBatis 3.11
- **HTTP Client**: Retrofit 2.9.0
- **Testing**: JUnit 5, Mockito, PowerMock
- **Documentation**: OpenAPI 3.0 (Swagger)
- **Containerization**: Docker with OpenJDK 8 Alpine

## Key Dependencies

### Core Framework Dependencies
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-bom</artifactId>
    <version>55.10.0</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

### Authentication & Authorization
```xml
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>27.0.5</version>
</dependency>
```

### Payment Processing
```xml
<dependency>
    <groupId>com.cvent.payment</groupId>
    <artifactId>payment-retrofit-client</artifactId>
    <version>7.0.60</version>
</dependency>
```

### Database Access
```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>21.3.0.0</version>
</dependency>

<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis-guice</artifactId>
    <version>3.11</version>
</dependency>
```

### HTTP Client
```xml
<dependency>
    <groupId>com.squareup.retrofit2</groupId>
    <artifactId>retrofit</artifactId>
    <version>2.9.0</version>
</dependency>
```

### Passkey Common Libraries
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.3</version>
</dependency>
```

## Configuration

### Environment Variables
The service uses environment variables for sensitive configuration:

- `LOCAL_API_KEY` - API key for staging environment
- `LOCAL_ECOMMERCE_API_KEY` - Ecommerce API key for staging
- `DATABASE_URL` - Database connection URL
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password

### Configuration Files

#### dev.yaml (Development)
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
  url: ${DATABASE_URL}
  user: ${DATABASE_USERNAME}
  password: ${DATABASE_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32

logging:
  level: INFO
  loggers:
    com.cvent.passkey.ecommerce: DEBUG
  appenders:
    - type: console
    - type: file
      currentLogFilename: logs/passkey-ecommerce.log
      archivedLogFilenamePattern: logs/passkey-ecommerce-%d.log.gz
```

#### logback.xml (Logging)
```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkey.ecommerce" level="DEBUG"/>
    <logger name="org.apache.http" level="WARN"/>
    <logger name="org.eclipse.jetty" level="WARN"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

## Database Schema

### Core Tables

#### ECOMMERCE_TRANSACTIONS
```sql
CREATE TABLE ECOMMERCE_TRANSACTIONS (
    TRANSACTION_ID VARCHAR2(50) PRIMARY KEY,
    RESERVATION_ID VARCHAR2(50) NOT NULL,
    AMOUNT NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    PAYMENT_METHOD_TYPE VARCHAR2(20),
    CARD_TOKEN VARCHAR2(100),
    GUEST_FIRST_NAME VARCHAR2(100),
    GUEST_LAST_NAME VARCHAR2(100),
    GUEST_EMAIL VARCHAR2(255),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PROCESSED_AT TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### PAYMENT_AUTHORIZATIONS
```sql
CREATE TABLE PAYMENT_AUTHORIZATIONS (
    AUTHORIZATION_ID VARCHAR2(50) PRIMARY KEY,
    TRANSACTION_ID VARCHAR2(50) NOT NULL,
    AMOUNT NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    EXPIRES_AT TIMESTAMP NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TRANSACTION_ID) REFERENCES ECOMMERCE_TRANSACTIONS(TRANSACTION_ID)
);
```

#### PAYMENT_REFUNDS
```sql
CREATE TABLE PAYMENT_REFUNDS (
    REFUND_ID VARCHAR2(50) PRIMARY KEY,
    TRANSACTION_ID VARCHAR2(50) NOT NULL,
    AMOUNT NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    REASON VARCHAR2(50),
    STATUS VARCHAR2(20) NOT NULL,
    PROCESSED_AT TIMESTAMP,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TRANSACTION_ID) REFERENCES ECOMMERCE_TRANSACTIONS(TRANSACTION_ID)
);
```

### Indexes
```sql
CREATE INDEX IDX_TRANSACTIONS_RESERVATION ON ECOMMERCE_TRANSACTIONS(RESERVATION_ID);
CREATE INDEX IDX_TRANSACTIONS_STATUS ON ECOMMERCE_TRANSACTIONS(STATUS);
CREATE INDEX IDX_TRANSACTIONS_CREATED ON ECOMMERCE_TRANSACTIONS(CREATED_AT);
CREATE INDEX IDX_AUTHORIZATIONS_EXPIRES ON PAYMENT_AUTHORIZATIONS(EXPIRES_AT);
CREATE INDEX IDX_REFUNDS_TRANSACTION ON PAYMENT_REFUNDS(TRANSACTION_ID);
```

## Monitoring & Observability

### Health Checks
- **Database Health**: Validates database connectivity
- **External Service Health**: Checks auth-service and payment API
- **Memory Health**: Monitors JVM memory usage
- **Disk Health**: Monitors available disk space

### Metrics
- **Request Metrics**: Request count, response time, error rate
- **Database Metrics**: Connection pool usage, query performance
- **JVM Metrics**: Memory usage, garbage collection, thread count
- **Business Metrics**: Transaction volume, success rate, revenue

### Logging
- **Structured Logging**: JSON format for log aggregation
- **Correlation IDs**: Request tracing across services
- **Security Logging**: Authentication and authorization events
- **Performance Logging**: Slow query and operation logging

### Datadog Integration
```yaml
datadog:
  enabled: true
  apiKey: ${DATADOG_API_KEY}
  tags:
    - service:passkey-ecommerce
    - environment:${ENVIRONMENT}
    - version:${SERVICE_VERSION}
```

## Security Configuration

### TLS/SSL
- **Minimum TLS Version**: TLS 1.2
- **Cipher Suites**: Strong cipher suites only
- **Certificate Management**: Automated certificate rotation

### API Security
- **Authentication**: Bearer token authentication
- **Rate Limiting**: 1000 requests per minute per API key
- **Input Validation**: Comprehensive request validation
- **Output Sanitization**: Response data sanitization

### PCI Compliance
- **Card Data**: Never stored in plain text
- **Tokenization**: All card data is tokenized
- **Audit Logging**: All card-related operations logged
- **Access Control**: Strict access controls on sensitive data

## Performance Tuning

### JVM Configuration
```bash
JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 
           -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapdump.hprof"
```

### Connection Pool Tuning
```yaml
database:
  minSize: 8
  maxSize: 32
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  validationQueryTimeout: 3s
  minIdleTime: 1 minute
  checkConnectionWhileIdle: true
```

### HTTP Client Tuning
```yaml
httpClient:
  timeout: 30s
  connectionTimeout: 5s
  connectionRequestTimeout: 5s
  keepAlive: 60s
  maxConnections: 100
  maxConnectionsPerRoute: 20
```

## Build Configuration

### Maven Profiles
- **default**: Standard build with unit tests
- **release**: Production build with optimizations
- **coverage**: Build with code coverage reporting
- **run-it**: Integration test execution

### Code Quality
- **Checkstyle**: Code style enforcement
- **SpotBugs**: Static analysis for bug detection
- **JaCoCo**: Code coverage measurement
- **SonarQube**: Comprehensive code quality analysis

### Sonar Quality Gate
- **Coverage Threshold**: 80% line coverage
- **Duplication**: <3% code duplication
- **Maintainability**: A rating required
- **Reliability**: A rating required
- **Security**: A rating required