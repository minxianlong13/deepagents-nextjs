# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x (JAX-RS, Jersey, Jetty)
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database (JDBC)
- **Container**: Docker with OpenJDK 8 Alpine
- **Testing**: JUnit 5, Karate (integration tests)
- **Documentation**: OpenAPI 3.0 (Swagger)

## Dependencies

### Core Framework Dependencies
```xml
<!-- Dropwizard Framework -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-bom</artifactId>
    <version>43.0.5</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>

<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>15.2.2</version>
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

<!-- Connection Pooling -->
<dependency>
    <groupId>org.apache.tomcat</groupId>
    <artifactId>tomcat-jdbc</artifactId>
    <version>10.1.45</version>
</dependency>
```

### HTTP Client Dependencies
```xml
<!-- Retrofit for HTTP clients -->
<dependency>
    <groupId>com.squareup.retrofit2</groupId>
    <artifactId>retrofit</artifactId>
    <version>2.9.0</version>
</dependency>
```

### Testing Dependencies
```xml
<!-- JUnit 5 -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-engine</artifactId>
    <version>5.8.1</version>
    <scope>test</scope>
</dependency>

<!-- Karate Integration Testing -->
<dependency>
    <groupId>com.intuit.karate</groupId>
    <artifactId>karate-junit5</artifactId>
    <version>1.4.1.RC3</version>
</dependency>

<!-- PowerMock for advanced mocking -->
<dependency>
    <groupId>org.powermock</groupId>
    <artifactId>powermock-api-mockito2</artifactId>
    <version>2.0.9</version>
</dependency>
```

### Documentation Dependencies
```xml
<!-- OpenAPI/Swagger -->
<dependency>
    <groupId>io.swagger.core.v3</groupId>
    <artifactId>swagger-jaxrs2-jakarta</artifactId>
    <version>2.2.9</version>
</dependency>
```

### Internal Cvent Dependencies
```xml
<!-- Passkey Common Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.1</version>
</dependency>

<!-- Business Text Service Client -->
<dependency>
    <groupId>com.cvent.passkey-business-text</groupId>
    <artifactId>passkey-business-text-java-client</artifactId>
    <version>1.2.6</version>
</dependency>
```

## Configuration

### Environment Variables
The service uses environment variables for sensitive configuration:

```bash
# API Keys (not committed to source control)
LOCAL_API_KEY=<api-key-for-local-development>

# Database Configuration
DB_HOST=<database-host>
DB_PORT=<database-port>
DB_NAME=<database-name>
DB_USERNAME=<database-username>
DB_PASSWORD=<database-password>

# Service Configuration
SERVICE_PORT=8080
ADMIN_PORT=8081
```

### Configuration Files
- `configs/dev.yaml` - Development environment configuration
- `configs/staging.yaml` - Staging environment configuration  
- `configs/prod.yaml` - Production environment configuration
- `configs/dev.logback.xml` - Logging configuration

### Sample Configuration (dev.yaml)
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
    com.cvent.passkey.addons: DEBUG
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC

auth:
  apiKey: ${LOCAL_API_KEY}
  
swagger:
  resourcePackage: com.cvent.passkey.addons.resources
```

## Database Schema

### Core Tables

#### MARKETABLE_ADDONS
```sql
CREATE TABLE MARKETABLE_ADDONS (
    ID VARCHAR2(255) PRIMARY KEY,
    NAME VARCHAR2(500) NOT NULL,
    DESCRIPTION CLOB,
    PRICE NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    BLOCK_ID NUMBER(19),
    HOTEL_ID NUMBER(19),
    EVENT_ID NUMBER(19),
    GUEST_CAN_SELECT_QUANTITY NUMBER(1) DEFAULT 0,
    MAX_QUANTITY_PER_GUEST NUMBER(10),
    MAX_QUANTITY_PER_EVENT_FLAG NUMBER(1) DEFAULT 0,
    MAX_QUANTITY_PER_EVENT NUMBER(10),
    GL_CODE VARCHAR2(50),
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### RESERVATION_ADDONS
```sql
CREATE TABLE RESERVATION_ADDONS (
    ID VARCHAR2(255) PRIMARY KEY,
    ADDON_ID VARCHAR2(255) NOT NULL,
    CONFIRMATION_NUMBER VARCHAR2(100) NOT NULL,
    QUANTITY NUMBER(10) NOT NULL,
    GUEST_ID VARCHAR2(255) NOT NULL,
    GUEST_NAME VARCHAR2(500),
    SPECIAL_REQUESTS CLOB,
    STATUS VARCHAR2(50) NOT NULL,
    UNIT_PRICE NUMBER(10,2) NOT NULL,
    TOTAL_PRICE NUMBER(10,2) NOT NULL,
    CURRENCY VARCHAR2(3) NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_RESERVATION_ADDON_MARKETABLE 
        FOREIGN KEY (ADDON_ID) REFERENCES MARKETABLE_ADDONS(ID)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX IDX_MARKETABLE_ADDONS_HOTEL_EVENT ON MARKETABLE_ADDONS(HOTEL_ID, EVENT_ID);
CREATE INDEX IDX_MARKETABLE_ADDONS_BLOCK ON MARKETABLE_ADDONS(BLOCK_ID);
CREATE INDEX IDX_RESERVATION_ADDONS_CONF_NUM ON RESERVATION_ADDONS(CONFIRMATION_NUMBER);
CREATE INDEX IDX_RESERVATION_ADDONS_GUEST ON RESERVATION_ADDONS(GUEST_ID);
CREATE INDEX IDX_RESERVATION_ADDONS_STATUS ON RESERVATION_ADDONS(STATUS);
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
        <module>passkey-addons-api</module>
        <module>passkey-addons-java-client</module>
        <module>passkey-addons-service</module>
        <module>passkey-addons-integration-test</module>
        <module>passkey-addons-data-access</module>
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
    <modules>
        <module>passkey-addons-integration-test</module>
        <module>passkey-addons-java-client</module>
        <module>passkey-addons-api</module>
    </modules>
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
                <configuration>
                    <excludes>
                        <exclude>com/cvent/passkey/addons/error/**</exclude>
                        <exclude>com/cvent/passkey/addons/model/**</exclude>
                        <exclude>com/cvent/passkey/addons/client/**</exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</profile>
```

## Monitoring & Logging

### Health Checks
Dropwizard provides built-in health checks accessible at:
- `http://localhost:8081/healthcheck`

Custom health checks include:
- Database connectivity
- External service dependencies
- Application-specific health indicators

### Metrics
Available at `http://localhost:8081/metrics`:
- JVM metrics (memory, garbage collection, threads)
- HTTP request metrics (response times, error rates)
- Database connection pool metrics
- Custom business metrics

### Logging Configuration
```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkey.addons" level="DEBUG"/>
    <logger name="org.apache.http" level="WARN"/>
    <logger name="oracle.jdbc" level="WARN"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### Structured Logging
The service uses structured logging with MDC (Mapped Diagnostic Context):
- Request ID tracking
- User context
- Operation context
- Performance metrics

## Security Configuration

### SSL/TLS
- Production deployments use TLS 1.2+
- Certificate management through Cvent infrastructure
- HTTP Strict Transport Security (HSTS) enabled

### API Security
- API key authentication required for all endpoints
- Rate limiting implemented
- Request/response validation
- SQL injection prevention through parameterized queries

### Data Protection
- Sensitive data encrypted at rest
- PII handling compliance
- Audit logging for data access

## Performance Considerations

### Database Optimization
- Connection pooling with optimal pool sizes
- Query optimization and proper indexing
- Read replicas for read-heavy operations
- Database connection monitoring

### Caching Strategy
- Application-level caching for frequently accessed data
- Cache invalidation strategies
- Memory usage monitoring

### Resource Management
- JVM tuning for optimal performance
- Garbage collection optimization
- Thread pool configuration
- Memory leak prevention

## Development Tools

### Code Quality
- Checkstyle for code formatting
- SpotBugs for bug detection
- SonarQube for code quality analysis
- JaCoCo for test coverage

### Build Tools
```bash
# Build project
mvn clean package -Prelease

# Run tests with coverage
mvn clean verify jacoco:report -Pcoverage

# Run integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Generate documentation
mvn site
```

### IDE Configuration
Recommended IntelliJ IDEA settings:
- Java 17 SDK
- Maven integration enabled
- Code style: Cvent Java conventions
- Plugins: Lombok, CheckStyle-IDEA