# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.0
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Package Manager**: pnpm (for frontend tooling)
- **Database**: Oracle Database (via JDBC)
- **Authentication**: Cvent Auth Service
- **API Documentation**: OpenAPI 3.0 with Swagger
- **Testing**: JUnit, Dropwizard Testing Framework
- **Containerization**: Docker
- **CI/CD**: Jenkins with Dropwizard Pipeline

## Dependencies

### Core Framework Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>4.0.0</version>
</dependency>

<!-- Dropwizard Testing -->
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-testing</artifactId>
    <version>4.0.0</version>
    <scope>test</scope>
</dependency>
```

### Cvent Internal Dependencies
```xml
<!-- Cvent Maven Parent -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>50.8.0</version>
</dependency>

<!-- Passkey Microservices Common -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.0</version>
</dependency>

<!-- Auth Service Core -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-core</artifactId>
    <version>13.0.6</version>
</dependency>

<!-- Mono Java (Cvent Common Libraries) -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-unit-tests</artifactId>
    <version>47.2.7</version>
</dependency>
```

### External Service Dependencies
```xml
<!-- Passkey Hotel Service -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-api</artifactId>
    <version>1.0.74</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-java-client</artifactId>
    <version>1.0.74</version>
</dependency>

<!-- Business Text Service -->
<dependency>
    <groupId>com.cvent.passkey-business-text</groupId>
    <artifactId>passkey-business-text-api</artifactId>
    <version>1.0.2</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey-business-text</groupId>
    <artifactId>passkey-business-text-java-client</artifactId>
    <version>1.0.2</version>
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
```

### Validation and Serialization
```xml
<!-- Jackson JSON Processing -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-core</artifactId>
    <version>2.14.1</version>
</dependency>

<!-- Jakarta Validation -->
<dependency>
    <groupId>jakarta.validation</groupId>
    <artifactId>jakarta.validation-api</artifactId>
    <version>3.1.0</version>
</dependency>

<!-- Hibernate Validator -->
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-validator</artifactId>
    <version>8.0.2.Final</version>
</dependency>
```

### OpenAPI Documentation
```xml
<!-- Swagger OpenAPI -->
<dependency>
    <groupId>io.swagger.core.v3</groupId>
    <artifactId>swagger-jaxrs2-jakarta</artifactId>
    <version>2.2.27</version>
</dependency>
```

### Testing Dependencies
```xml
<!-- Retrofit Mock for Testing -->
<dependency>
    <groupId>com.squareup.retrofit2</groupId>
    <artifactId>retrofit-mock</artifactId>
    <version>2.11.0</version>
    <scope>test</scope>
</dependency>

<!-- JaCoCo Code Coverage -->
<dependency>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
</dependency>
```

### Security Dependencies
```xml
<!-- SnakeYAML (Security Override) -->
<dependency>
    <groupId>org.yaml</groupId>
    <artifactId>snakeyaml</artifactId>
    <version>2.3</version>
</dependency>
```

## Configuration

### Environment Variables
```yaml
# Database Configuration
DATABASE_URL: "jdbc:oracle:thin:@//hostname:port/service"
DATABASE_USER: "passkey_create_hotel"
DATABASE_PASSWORD: "${DATABASE_PASSWORD}"

# External Service URLs
PASSKEY_HOTEL_SERVICE_URL: "https://api.cvent.com/passkey-hotel"
BUSINESS_TEXT_SERVICE_URL: "https://api.cvent.com/business-text"

# Authentication
AUTH_SERVICE_URL: "https://auth.cvent.com"
API_KEY_VALIDATION_URL: "https://auth.cvent.com/validate"

# Logging
LOG_LEVEL: "INFO"
LOG_FORMAT: "json"

# Monitoring
DATADOG_API_KEY: "${DATADOG_API_KEY}"
METRICS_ENABLED: "true"
```

### Application Configuration (dev.yaml)
```yaml
server:
  type: simple
  applicationContextPath: /
  adminContextPath: /admin
  connector:
    type: http
    port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: oracle.jdbc.OracleDriver
  url: ${DATABASE_URL}
  user: ${DATABASE_USER}
  password: ${DATABASE_PASSWORD}
  properties:
    charSet: UTF-8
  maxWaitForConnection: 1s
  validationQuery: "SELECT 1 FROM DUAL"
  validationQueryTimeout: 3s
  minSize: 8
  maxSize: 32
  checkConnectionWhileIdle: false
  evictionInterval: 10s
  minIdleTime: 1 minute

logging:
  level: INFO
  loggers:
    com.cvent.passkey.createhotel: DEBUG
    org.hibernate.SQL: DEBUG
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC
      target: stdout
      logFormat: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n"

metrics:
  reporters:
    - type: log
      logger: metrics
      markerName: metrics
      frequency: 1 minute

externalServices:
  passkeyHotelService:
    baseUrl: ${PASSKEY_HOTEL_SERVICE_URL}
    timeout: 30s
    connectionTimeout: 10s
    retries: 3
  businessTextService:
    baseUrl: ${BUSINESS_TEXT_SERVICE_URL}
    timeout: 30s
    connectionTimeout: 10s
    retries: 3

auth:
  apiKeyValidationUrl: ${API_KEY_VALIDATION_URL}
  cacheSize: 1000
  cacheTtl: 300s
```

## Database Schema

### Primary Tables
```sql
-- Hotels table (simplified representation)
CREATE TABLE hotels (
    hotel_id NUMBER(19) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    accommodation_type NUMBER(10),
    star_rating NUMBER(10),
    latitude NUMBER(10,6),
    longitude NUMBER(10,6),
    handicap_accessible NUMBER(1) DEFAULT 0,
    reservation_contact_email VARCHAR2(255),
    pk_timestamp DATE DEFAULT SYSDATE,
    created_after_hotel_cutoff NUMBER(1) DEFAULT 0,
    blank_guest_info NUMBER(1) DEFAULT 0,
    children_affect_rate NUMBER(1) DEFAULT 1,
    suppress_children_count NUMBER(1) DEFAULT 0,
    show_access NUMBER(1) DEFAULT 1,
    enable_gl_addon NUMBER(1) DEFAULT 0,
    enable_transfer_secondary_names NUMBER(1) DEFAULT 0,
    flip_to_enabled NUMBER(1) DEFAULT 0,
    flip_to_guest_code VARCHAR2(50),
    flip_to_landing_code VARCHAR2(50),
    hotel_level_add_val_flag NUMBER(10) DEFAULT 0,
    hotel_level_multi_payment NUMBER(10) DEFAULT 0,
    splitfolio_handling_type_id NUMBER(10) DEFAULT 1,
    reward_placement NUMBER(10) DEFAULT 0,
    hide_fields_on_pi VARCHAR2(500),
    hotel_review_contact VARCHAR2(255),
    first_email_reminder VARCHAR2(255),
    second_email_reminder VARCHAR2(255),
    third_email_reminder VARCHAR2(255),
    hotel_cancel_policy CLOB,
    hotel_child_policy CLOB,
    created_date DATE DEFAULT SYSDATE,
    modified_date DATE DEFAULT SYSDATE
);

-- Hotel addresses table
CREATE TABLE hotel_addresses (
    hotel_id NUMBER(19) PRIMARY KEY,
    city VARCHAR2(100) NOT NULL,
    country VARCHAR2(100) NOT NULL,
    country_iso_code VARCHAR2(2) NOT NULL,
    line1 VARCHAR2(255) NOT NULL,
    line2 VARCHAR2(255),
    postal_code VARCHAR2(20) NOT NULL,
    state VARCHAR2(100),
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);

-- Accepted credit cards table
CREATE TABLE hotel_accepted_credit_cards (
    hotel_id NUMBER(19),
    accepted_credit_card_id NUMBER(10),
    PRIMARY KEY (hotel_id, accepted_credit_card_id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);

-- Group booking settings table
CREATE TABLE hotel_group_booking_settings (
    hotel_id NUMBER(19) PRIMARY KEY,
    enabled NUMBER(1) DEFAULT 0,
    threshold NUMBER(10) DEFAULT 10,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);

-- Room block transfer configuration table
CREATE TABLE hotel_room_block_transfer_config (
    hotel_id NUMBER(19) PRIMARY KEY,
    transfer_approach VARCHAR2(20) DEFAULT 'TRANSIENT',
    provider_name VARCHAR2(255),
    provider_id NUMBER(10),
    vendor_id NUMBER(19),
    vendor_system_id NUMBER(19),
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);

-- Rewards programs association table
CREATE TABLE hotel_rewards_programs (
    hotel_id NUMBER(19),
    reward_program_id NUMBER(19),
    active NUMBER(1) DEFAULT 1,
    allow_override_gl_code NUMBER(1) DEFAULT 0,
    gl_code VARCHAR2(50),
    PRIMARY KEY (hotel_id, reward_program_id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_hotels_user_id ON hotels(user_id);
CREATE INDEX idx_hotels_accommodation_type ON hotels(accommodation_type);
CREATE INDEX idx_hotels_created_date ON hotels(created_date);
CREATE INDEX idx_hotel_addresses_country ON hotel_addresses(country_iso_code);
CREATE INDEX idx_hotel_addresses_city ON hotel_addresses(city);
```

## Build Configuration

### Maven Profiles
```xml
<!-- Default Profile -->
<profile>
    <id>default</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <properties>
        <skipIntegrationTests>true</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-create-hotel-api</module>
        <module>passkey-create-hotel-shared</module>
        <module>passkey-create-hotel-data-access</module>
        <module>passkey-create-hotel-java-client</module>
        <module>passkey-create-hotel-service</module>
        <module>passkey-create-hotel-integration-test</module>
    </modules>
</profile>

<!-- Integration Test Profile -->
<profile>
    <id>run-it</id>
    <properties>
        <checkstyle.skip>true</checkstyle.skip>
        <skipIntegrationTests>false</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-create-hotel-api</module>
        <module>passkey-create-hotel-java-client</module>
        <module>passkey-create-hotel-integration-test</module>
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
                <configuration>
                    <excludes>
                        <exclude>com/cvent/passkey/createhotel/PasskeyCreateHotelServiceApplication.class</exclude>
                        <exclude>com/cvent/passkey/createhotel/PasskeyCreateHotelServiceConfiguration.class</exclude>
                    </excludes>
                </configuration>
                <executions>
                    <execution>
                        <id>jacoco-check</id>
                        <phase>test</phase>
                        <goals>
                            <goal>check</goal>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
    <modules>
        <module>passkey-create-hotel-service</module>
    </modules>
</profile>
```

### Build Commands
```bash
# Standard build
mvn clean package

# Release build
mvn clean package -Prelease

# Build with tests
mvn clean verify

# Integration tests
mvn clean verify -Prun-it -Denv.IT_ENVIRONMENT=dev

# Code coverage
mvn clean verify -Pcoverage

# Skip tests
mvn clean package -DskipTests

# Build specific module
mvn clean package -pl passkey-create-hotel-service -am
```

## Monitoring & Logging

### Logging Configuration
```xml
<!-- logback.xml -->
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

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/passkey-create-hotel.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/passkey-create-hotel.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
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

    <logger name="com.cvent.passkey.createhotel" level="DEBUG"/>
    <logger name="org.hibernate.SQL" level="DEBUG"/>
    <logger name="com.cvent.auth" level="INFO"/>

    <root level="INFO">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

### Metrics Configuration
```java
// Custom metrics in service classes
@Timed(name = "hotel-creation-time", description = "Time taken to create a hotel")
@Metered(name = "hotel-creation-rate", description = "Rate of hotel creation requests")
@ExceptionMetered(name = "hotel-creation-exceptions", description = "Rate of exceptions during hotel creation")
public Optional<HotelInfo> createHotel(HotelSettings hotelSettings) {
    // Implementation
}
```

### Health Checks
```java
// Database health check
public class DatabaseHealthCheck extends HealthCheck {
    private final Database database;

    @Override
    protected Result check() throws Exception {
        if (database.isConnected()) {
            return Result.healthy("Database connection is healthy");
        } else {
            return Result.unhealthy("Cannot connect to database");
        }
    }
}

// External service health check
public class ExternalServiceHealthCheck extends HealthCheck {
    private final PasskeyHotelClient hotelClient;

    @Override
    protected Result check() throws Exception {
        try {
            hotelClient.healthCheck();
            return Result.healthy("Passkey Hotel Service is reachable");
        } catch (Exception e) {
            return Result.unhealthy("Cannot reach Passkey Hotel Service: " + e.getMessage());
        }
    }
}
```

## Security Configuration

### API Key Validation
```java
@Authority(methods = { AuthMethod.API_KEY }, roles = {})
public class CreateHotelResource {
    // Endpoint implementations with API key authentication
}
```

### CORS Configuration
```yaml
# CORS settings in application configuration
cors:
  allowedOrigins: 
    - "https://app.cvent.com"
    - "https://admin.cvent.com"
  allowedMethods: 
    - GET
    - POST
    - PUT
    - DELETE
    - OPTIONS
  allowedHeaders: 
    - "Content-Type"
    - "Authorization"
    - "X-Requested-With"
  exposedHeaders: 
    - "X-Request-ID"
  allowCredentials: true
  maxAge: 3600
```

## Performance Tuning

### JVM Configuration
```bash
# Production JVM settings
JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication"
```

### Connection Pool Settings
```yaml
database:
  minSize: 8
  maxSize: 32
  maxWaitForConnection: 1s
  validationQuery: "SELECT 1 FROM DUAL"
  validationQueryTimeout: 3s
  checkConnectionWhileIdle: false
  evictionInterval: 10s
  minIdleTime: 1 minute
```

### HTTP Client Configuration
```yaml
externalServices:
  passkeyHotelService:
    timeout: 30s
    connectionTimeout: 10s
    retries: 3
    connectionPoolSize: 20
    keepAlive: 60s
```

## Code Quality

### SonarQube Configuration
```xml
<properties>
    <sonar.coverage.exclusions>
        passkey-create-hotel-api/**,
        passkey-create-hotel-data-access/**,
        passkey-create-hotel-integration-test/**,
        passkey-create-hotel-java-client/**,
        passkey-create-hotel-shared/**,
        src/main/java/com/cvent/passkey/createhotel/resources/OpenApiResource.java,
        src/main/java/com/cvent/passkey/createhotel/PasskeyCreateHotelServiceApplication.java,
        src/main/java/com/cvent/passkey/createhotel/PasskeyCreateHotelServiceConfiguration.java
    </sonar.coverage.exclusions>
</properties>
```

### Checkstyle Configuration
- Follows Cvent Java coding standards
- Enforced during Maven build process
- Can be skipped for integration test profile