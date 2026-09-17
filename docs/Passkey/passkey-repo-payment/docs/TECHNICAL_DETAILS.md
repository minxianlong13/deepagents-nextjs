# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database (via JDBC)
- **Connection Pool**: Tomcat JDBC Pool
- **Web Server**: Embedded Jetty
- **API Framework**: JAX-RS (Jersey)
- **JSON Processing**: Jackson
- **Validation**: Hibernate Validator
- **Testing**: JUnit 5, Mockito
- **Documentation**: OpenAPI 3.0 (Swagger)

## Key Dependencies

### Core Framework Dependencies
```xml
<!-- Dropwizard Core -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>4.0.x</version>
</dependency>

<!-- Dropwizard JDBI -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-jdbi3</artifactId>
    <version>4.0.x</version>
</dependency>

<!-- Dropwizard Auth -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-auth</artifactId>
    <version>4.0.x</version>
</dependency>
```

### Cvent Internal Dependencies
```xml
<!-- Cvent Common Libraries -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-bom</artifactId>
    <version>55.10.0</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>

<!-- Auth Service Integration -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>15.2.2</version>
</dependency>

<!-- Passkey Common Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.1</version>
</dependency>
```

### External Service Clients
```xml
<!-- Passkey Event Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-event-java-client</artifactId>
    <version>1.0.56</version>
</dependency>

<!-- Passkey Hotel Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-java-client</artifactId>
    <version>1.0.42</version>
</dependency>

<!-- Payments Wallet Service -->
<dependency>
    <groupId>com.cvent.ecommerce</groupId>
    <artifactId>payments-wallet-java-client</artifactId>
    <version>8.0.6</version>
</dependency>

<!-- Ecommerce Tokenizer -->
<dependency>
    <groupId>com.cvent.ecommerce-tokenizer</groupId>
    <artifactId>ecommerce-tokenizer-java-client</artifactId>
    <version>1.6.0</version>
</dependency>

<!-- PBB (Payment Black Box) Integration -->
<dependency>
    <groupId>com.cvent.pbb</groupId>
    <artifactId>pbb-java-client</artifactId>
    <version>2.1.0</version>
</dependency>
```

### Database Dependencies
```xml
<!-- Oracle JDBC Driver -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>21.3.0.0</version>
</dependency>

<!-- Tomcat Connection Pool -->
<dependency>
    <groupId>org.apache.tomcat</groupId>
    <artifactId>tomcat-jdbc</artifactId>
    <version>10.1.45</version>
</dependency>
```

### Utility Dependencies
```xml
<!-- MapStruct for Object Mapping -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.4.1.Final</version>
</dependency>

<!-- OpenAPI Documentation -->
<dependency>
    <groupId>io.swagger.core.v3</groupId>
    <artifactId>swagger-jaxrs2-jakarta</artifactId>
    <version>2.2.9</version>
</dependency>

<!-- Hibernate Validator -->
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-validator</artifactId>
    <version>6.1.7.Final</version>
</dependency>
```

## Configuration

### Application Configuration Structure
```yaml
# passkey-payment-service/configs/dev.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

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

logging:
  level: INFO
  loggers:
    com.cvent.passkey.payment: DEBUG
  appenders:
    - type: console
    - type: file
      currentLogFilename: ./logs/passkey-payment-service.log
      archivedLogFilenamePattern: ./logs/passkey-payment-service-%d.log.gz
      archivedFileCount: 5

authService:
  baseUrl: ${AUTH_SERVICE_URL}
  apiKey: ${LOCAL_API_KEY}
  timeout: 5s

paymentsWallet:
  baseUrl: ${PAYMENTS_WALLET_URL}
  apiKey: ${LOCAL_ECOMMERCE_API_KEY}
  timeout: 10s

passkeyEvent:
  baseUrl: ${PASSKEY_EVENT_URL}
  apiKey: ${LOCAL_API_KEY}
  timeout: 5s

passkeyHotel:
  baseUrl: ${PASSKEY_HOTEL_URL}
  apiKey: ${LOCAL_API_KEY}
  timeout: 5s
```

### Environment Variables
```bash
# Database Configuration
DB_USER=passkey_payment_user
DB_PASSWORD=secure_password
DB_URL=jdbc:oracle:thin:@//db-host:1521/servicename

# Service URLs
AUTH_SERVICE_URL=https://auth-service.staging.cvent.org
PAYMENTS_WALLET_URL=https://payments-wallet.ecommerce-us-staging.cvent.org
PASSKEY_EVENT_URL=https://passkey-event-service.staging.cvent.org
PASSKEY_HOTEL_URL=https://passkey-hotel-service.staging.cvent.org

# API Keys
LOCAL_API_KEY=your_api_key_here
LOCAL_ECOMMERCE_API_KEY=your_ecommerce_api_key_here

# Application Settings
LOG_LEVEL=INFO
MAX_DB_CONNECTIONS=32
REQUEST_TIMEOUT=30s
```

## Database Schema

### Core Tables

#### PAYMENTS
```sql
CREATE TABLE PAYMENTS (
    PAYMENT_ID VARCHAR2(36) PRIMARY KEY,
    RESERVATION_ID VARCHAR2(36) NOT NULL,
    GUEST_ID VARCHAR2(36) NOT NULL,
    AMOUNT NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    PAYMENT_METHOD_ID VARCHAR2(36),
    TRANSACTION_ID VARCHAR2(100),
    PAYMENT_TYPE VARCHAR2(20),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PROCESSED_AT TIMESTAMP,
    NOTES VARCHAR2(500)
);

CREATE INDEX IDX_PAYMENTS_RESERVATION ON PAYMENTS(RESERVATION_ID);
CREATE INDEX IDX_PAYMENTS_GUEST ON PAYMENTS(GUEST_ID);
CREATE INDEX IDX_PAYMENTS_STATUS ON PAYMENTS(STATUS);
CREATE INDEX IDX_PAYMENTS_CREATED ON PAYMENTS(CREATED_AT);
```

#### PAYMENT_METHODS
```sql
CREATE TABLE PAYMENT_METHODS (
    PAYMENT_METHOD_ID VARCHAR2(36) PRIMARY KEY,
    GUEST_ID VARCHAR2(36) NOT NULL,
    TOKEN VARCHAR2(100) NOT NULL,
    TYPE VARCHAR2(20) NOT NULL,
    LAST_FOUR VARCHAR2(4),
    EXPIRY_MONTH NUMBER(2),
    EXPIRY_YEAR NUMBER(4),
    CARD_BRAND VARCHAR2(20),
    IS_DEFAULT NUMBER(1) DEFAULT 0,
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_PAYMENT_METHODS_GUEST ON PAYMENT_METHODS(GUEST_ID);
CREATE INDEX IDX_PAYMENT_METHODS_TOKEN ON PAYMENT_METHODS(TOKEN);
```

#### RATES
```sql
CREATE TABLE RATES (
    RATE_ID VARCHAR2(36) PRIMARY KEY,
    HOTEL_ID VARCHAR2(36) NOT NULL,
    ROOM_TYPE_ID VARCHAR2(36) NOT NULL,
    RATE_CODE VARCHAR2(20) NOT NULL,
    RATE_NAME VARCHAR2(100) NOT NULL,
    BASE_RATE NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    EFFECTIVE_DATE DATE NOT NULL,
    EXPIRY_DATE DATE,
    MIN_STAY NUMBER(3) DEFAULT 1,
    MAX_STAY NUMBER(3) DEFAULT 30,
    ADVANCE_BOOKING NUMBER(3) DEFAULT 0,
    IS_REFUNDABLE NUMBER(1) DEFAULT 1,
    CANCELLATION_POLICY VARCHAR2(500)
);

CREATE INDEX IDX_RATES_HOTEL ON RATES(HOTEL_ID);
CREATE INDEX IDX_RATES_ROOM_TYPE ON RATES(ROOM_TYPE_ID);
CREATE INDEX IDX_RATES_CODE ON RATES(RATE_CODE);
CREATE INDEX IDX_RATES_DATES ON RATES(EFFECTIVE_DATE, EXPIRY_DATE);
```

#### GROUP_PAYMENTS
```sql
CREATE TABLE GROUP_PAYMENTS (
    GROUP_PAYMENT_ID VARCHAR2(36) PRIMARY KEY,
    GROUP_ID VARCHAR2(36) NOT NULL,
    TOTAL_AMOUNT NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    PAYMENT_METHOD_ID VARCHAR2(36),
    SPLIT_TYPE VARCHAR2(20) NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PROCESSED_AT TIMESTAMP
);

CREATE INDEX IDX_GROUP_PAYMENTS_GROUP ON GROUP_PAYMENTS(GROUP_ID);
CREATE INDEX IDX_GROUP_PAYMENTS_STATUS ON GROUP_PAYMENTS(STATUS);
```

#### COMMERCE_ORDERS
```sql
CREATE TABLE COMMERCE_ORDERS (
    ORDER_ID VARCHAR2(36) PRIMARY KEY,
    RESERVATION_ID VARCHAR2(36) NOT NULL,
    GUEST_ID VARCHAR2(36) NOT NULL,
    TOTAL_AMOUNT NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    ORDER_TYPE VARCHAR2(20),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONFIRMED_AT TIMESTAMP
);

CREATE INDEX IDX_COMMERCE_ORDERS_RESERVATION ON COMMERCE_ORDERS(RESERVATION_ID);
CREATE INDEX IDX_COMMERCE_ORDERS_GUEST ON COMMERCE_ORDERS(GUEST_ID);
CREATE INDEX IDX_COMMERCE_ORDERS_STATUS ON COMMERCE_ORDERS(STATUS);
```

#### REFUNDS
```sql
CREATE TABLE REFUNDS (
    REFUND_ID VARCHAR2(36) PRIMARY KEY,
    PAYMENT_ID VARCHAR2(36) NOT NULL,
    REFUND_AMOUNT NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    REASON VARCHAR2(200),
    REFUND_TYPE VARCHAR2(20) NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    PROCESSED_AT TIMESTAMP,
    EXTERNAL_REFUND_ID VARCHAR2(100),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_REFUNDS_PAYMENT ON REFUNDS(PAYMENT_ID);
CREATE INDEX IDX_REFUNDS_STATUS ON REFUNDS(STATUS);
```

#### SPLIT_FOLIOS
```sql
CREATE TABLE SPLIT_FOLIOS (
    SPLIT_FOLIO_ID VARCHAR2(36) PRIMARY KEY,
    RESERVATION_ID VARCHAR2(36) NOT NULL,
    TOTAL_AMOUNT NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_SPLIT_FOLIOS_RESERVATION ON SPLIT_FOLIOS(RESERVATION_ID);
CREATE INDEX IDX_SPLIT_FOLIOS_STATUS ON SPLIT_FOLIOS(STATUS);
```

## Build Configuration

### Maven Build Profiles

#### Default Profile
```xml
<profile>
    <id>default</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <properties>
        <skipIntegrationTests>true</skipIntegrationTests>
        <skipLoadTests>true</skipLoadTests>
    </properties>
    <modules>
        <module>passkey-payment-api</module>
        <module>passkey-payment-shared</module>
        <module>passkey-payment-data-access</module>
        <module>passkey-payment-java-client</module>
        <module>passkey-payment-service</module>
        <module>passkey-payment-integration-test</module>
        <module>passkey-payment-load-test</module>
    </modules>
</profile>
```

#### Release Profile
```xml
<profile>
    <id>release</id>
    <properties>
        <skipIntegrationTests>true</skipIntegrationTests>
        <skipLoadTests>true</skipLoadTests>
    </properties>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <configuration>
                    <createDependencyReducedPom>false</createDependencyReducedPom>
                    <transformers>
                        <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                            <mainClass>com.cvent.passkey.payment.PasskeyPaymentServiceApplication</mainClass>
                        </transformer>
                    </transformers>
                </configuration>
            </plugin>
        </plugins>
    </build>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <checkstyle.skip>true</checkstyle.skip>
        <skipIntegrationTests>false</skipIntegrationTests>
        <skipLoadTests>true</skipLoadTests>
    </properties>
    <modules>
        <module>passkey-payment-api</module>
        <module>passkey-payment-java-client</module>
        <module>passkey-payment-integration-test</module>
    </modules>
</profile>
```

### Code Quality Configuration

#### Jacoco Coverage
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <excludes>
            <exclude>com/cvent/passkey/payment/model/**</exclude>
            <exclude>com/cvent/passkey/payment/PasskeyPaymentServiceApplication.class</exclude>
            <exclude>com/cvent/passkey/payment/PasskeyPaymentServiceConfiguration.class</exclude>
            <exclude>com/cvent/passkey/payment/dataaccess/AdminDataAccess.class</exclude>
        </excludes>
    </configuration>
</plugin>
```

#### SonarQube Configuration
```xml
<properties>
    <sonar.coverage.exclusions>
        passkey-payment-api/src/main/java/com/cvent/passkey/payment/model/**,
        passkey-payment-service/src/main/java/com/cvent/passkey/payment/PasskeyPaymentServiceApplication.java,
        passkey-payment-service/src/main/java/com/cvent/passkey/payment/PasskeyPaymentServiceConfiguration.java,
        passkey-payment-data-access/src/main/java/com/cvent/passkey/payment/dataaccess/AdminDataAccess.java
    </sonar.coverage.exclusions>
</properties>
```

## Monitoring & Logging

### Metrics Configuration
```yaml
metrics:
  frequency: 1 minute
  reporters:
    - type: jmx
    - type: slf4j
      logger: metrics
      markerName: metrics
```

### Health Checks
- **Database Health Check**: Validates database connectivity
- **External Service Health Checks**: Monitors dependent services
- **Memory Health Check**: Monitors JVM memory usage
- **Disk Space Health Check**: Monitors available disk space

### Logging Configuration
```yaml
logging:
  level: INFO
  loggers:
    com.cvent.passkey.payment: DEBUG
    com.cvent.passkey.payment.resources: INFO
    com.cvent.passkey.payment.services: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
  appenders:
    - type: console
      threshold: INFO
      target: stdout
      logFormat: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
    - type: file
      threshold: DEBUG
      currentLogFilename: ./logs/passkey-payment-service.log
      archivedLogFilenamePattern: ./logs/passkey-payment-service-%d.log.gz
      archivedFileCount: 7
      maxFileSize: 100MB
```

### Performance Tuning

#### JVM Settings
```bash
# Memory Settings
-Xms2g
-Xmx4g
-XX:NewRatio=3
-XX:SurvivorRatio=8

# Garbage Collection
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16m

# Monitoring
-XX:+PrintGC
-XX:+PrintGCDetails
-XX:+PrintGCTimeStamps
-Xloggc:gc.log
```

#### Database Connection Pool
```yaml
database:
  minSize: 8
  maxSize: 32
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  validationQueryTimeout: 3s
  checkConnectionWhileIdle: true
  checkConnectionOnBorrow: false
  checkConnectionOnReturn: false
  evictionInterval: 10s
  minIdleTime: 1 minute
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
      validateCerts: true
      validatePeers: true
```

### Authentication Configuration
```yaml
authService:
  baseUrl: ${AUTH_SERVICE_URL}
  apiKey: ${LOCAL_API_KEY}
  timeout: 5s
  cacheSize: 1000
  cacheExpiration: 15m
  validateTokens: true
```

## Docker Configuration

### Dockerfile
```dockerfile
FROM openjdk:17-jre-slim

WORKDIR /app

COPY passkey-payment-service/target/passkey-payment-service-*.jar app.jar
COPY passkey-payment-service/configs/ configs/

EXPOSE 8080 8081

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/healthcheck || exit 1

CMD ["java", "-jar", "app.jar", "server", "configs/production.yaml"]
```

### Docker Compose (Development)
```yaml
version: '3.8'
services:
  passkey-payment-service:
    build: .
    ports:
      - "8080:8080"
      - "8081:8081"
    environment:
      - DB_USER=passkey_payment_user
      - DB_PASSWORD=secure_password
      - LOCAL_API_KEY=dev_api_key
    depends_on:
      - oracle-db
    
  oracle-db:
    image: container-registry.oracle.com/database/express:21.3.0-xe
    ports:
      - "1521:1521"
    environment:
      - ORACLE_PWD=oracle_password
    volumes:
      - oracle_data:/opt/oracle/oradata
      
volumes:
  oracle_data:
```