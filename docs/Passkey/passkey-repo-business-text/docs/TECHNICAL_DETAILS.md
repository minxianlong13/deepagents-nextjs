# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database 18c+
- **Container Runtime**: Docker
- **Base Image**: cvent-jre:11.0.1.13
- **Authentication**: Cvent Auth Service integration
- **API Documentation**: OpenAPI 3.0 (Swagger)
- **Testing**: JUnit 5, Karate (integration tests)
- **Code Quality**: Checkstyle, JaCoCo (coverage)

## Dependencies

### Core Dependencies (from pom.xml)

#### Cvent Internal Dependencies
```xml
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-core</artifactId>
    <version>27.6.6</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.1</version>
</dependency>
```

#### Database Dependencies
```xml
<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>18.3.0.0</version>
</dependency>
```

#### API Documentation
```xml
<dependency>
    <groupId>io.swagger.core.v3</groupId>
    <artifactId>swagger-jaxrs2-jakarta</artifactId>
    <version>2.2.9</version>
</dependency>
```

#### Testing Dependencies
```xml
<dependency>
    <groupId>io.karatelabs</groupId>
    <artifactId>karate-junit5</artifactId>
    <version>1.5.0</version>
</dependency>

<dependency>
    <groupId>com.cvent.automation</groupId>
    <artifactId>karate-utils</artifactId>
    <version>1.5.0</version>
</dependency>
```

### Maven Parent
- **Parent**: `com.cvent:maven-parent:57.3.0`
- **Provides**: Common build configuration, dependency management, plugins

## Configuration

### Environment Variables
- `JAVA_OPTS`: JVM configuration options
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `AUTH_SERVICE_URL`: Auth service endpoint
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARN, ERROR)

### Configuration Files

#### Application Configuration (YAML)
```yaml
# Example dev.yaml structure
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
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32

logging:
  level: INFO
  loggers:
    com.cvent.passkeybusinesstext: DEBUG
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC
```

#### Logging Configuration (Logback)
```xml
<!-- configs/dev.logback.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkeybusinesstext" level="DEBUG"/>
    <logger name="org.hibernate.SQL" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

## Database Schema

### Core Tables

#### BUSINESS_TEXT
```sql
CREATE TABLE BUSINESS_TEXT (
    USER_ID NUMBER(19) NOT NULL,
    BUSINESS_TEXT_ID VARCHAR2(255) NOT NULL,
    LOCALE VARCHAR2(10) NOT NULL,
    VALUE_SMALL VARCHAR2(255),
    VALUE_LARGE CLOB,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_BUSINESS_TEXT PRIMARY KEY (USER_ID, BUSINESS_TEXT_ID, LOCALE)
);
```

#### LOCALES
```sql
CREATE TABLE LOCALES (
    LOCALE_ID VARCHAR2(10) NOT NULL,
    LOCALE_NAME VARCHAR2(100) NOT NULL,
    LANGUAGE_CODE VARCHAR2(2) NOT NULL,
    COUNTRY_CODE VARCHAR2(2) NOT NULL,
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    CONSTRAINT PK_LOCALES PRIMARY KEY (LOCALE_ID)
);
```

#### COUNTRIES
```sql
CREATE TABLE COUNTRIES (
    COUNTRY_CODE VARCHAR2(2) NOT NULL,
    COUNTRY_NAME VARCHAR2(100) NOT NULL,
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    CONSTRAINT PK_COUNTRIES PRIMARY KEY (COUNTRY_CODE)
);
```

#### CUSTOM_BUSINESS_TEXT
```sql
CREATE TABLE CUSTOM_BUSINESS_TEXT (
    USER_ID NUMBER(19) NOT NULL,
    BUSINESS_TEXT_ID VARCHAR2(255) NOT NULL,
    LOCALE VARCHAR2(10) NOT NULL,
    VALUE_SMALL VARCHAR2(255),
    VALUE_LARGE CLOB,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_CUSTOM_BUSINESS_TEXT PRIMARY KEY (USER_ID, BUSINESS_TEXT_ID, LOCALE)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX IDX_BUSINESS_TEXT_ID ON BUSINESS_TEXT(BUSINESS_TEXT_ID);
CREATE INDEX IDX_BUSINESS_TEXT_LOCALE ON BUSINESS_TEXT(LOCALE);
CREATE INDEX IDX_BUSINESS_TEXT_USER ON BUSINESS_TEXT(USER_ID);

CREATE INDEX IDX_CUSTOM_TEXT_ID ON CUSTOM_BUSINESS_TEXT(BUSINESS_TEXT_ID);
CREATE INDEX IDX_CUSTOM_TEXT_LOCALE ON CUSTOM_BUSINESS_TEXT(LOCALE);
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
        <module>passkey-business-text-api</module>
        <module>passkey-business-text-data-access</module>
        <module>passkey-business-text-java-client</module>
        <module>passkey-business-text-service</module>
        <module>passkey-business-text-integration-test</module>
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

### Code Quality

#### Checkstyle Configuration
- **Version**: 8.42
- **Rules**: Cvent coding standards
- **Exclusions**: Generated code, configuration classes

#### JaCoCo Coverage
- **Minimum Coverage**: 80%
- **Exclusions**: 
  - Application main class
  - Configuration classes
  - Generated Immutable classes
  - OpenAPI resource

### SonarQube Integration
```xml
<sonar.coverage.exclusions>
    src/main/java/com/cvent/passkey/businesstext/model/**,
    src/main/java/com/cvent/passkeybusinesstext/client/PasskeyBusinessTextClientConfiguration.java,
    src/main/java/com/cvent/passkeybusinesstext/client/PasskeyBusinessTextClientFactory.java,
    src/main/java/com/cvent/passkeybusinesstext/PasskeyBusinessTextServiceApplication.java,
    src/main/java/com/cvent/passkeybusinesstext/PasskeyBusinessTextServiceConfiguration.java
</sonar.coverage.exclusions>
```

## Monitoring & Logging

### Health Checks
```java
@Override
protected Result check() throws Exception {
    // Database connectivity check
    // Dependency service checks
    // Memory usage validation
    return Result.healthy("Service is operational");
}
```

### Metrics Collection
- **Request Metrics**: Response times, throughput, error rates
- **Database Metrics**: Connection pool usage, query performance
- **JVM Metrics**: Memory usage, garbage collection, thread pools
- **Business Metrics**: Business text operations, locale usage

### Logging Strategy
- **Structured Logging**: JSON format for log aggregation
- **Log Levels**: DEBUG for development, INFO for production
- **Request Tracing**: Correlation IDs for request tracking
- **Error Logging**: Stack traces for debugging
- **Performance Logging**: Slow query detection

### Observability Tools
- **Datadog**: Application performance monitoring
- **Splunk**: Log aggregation and analysis
- **Grafana**: Custom dashboards and alerting
- **Prometheus**: Metrics collection and alerting

## Security

### Authentication
- **API Key Authentication**: Required for all endpoints
- **Auth Service Integration**: Centralized authentication
- **Token Validation**: JWT token validation
- **Rate Limiting**: Protection against abuse

### Data Protection
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: HTTPS/TLS
- **Input Validation**: Bean Validation annotations
- **SQL Injection Prevention**: Parameterized queries

### Security Headers
```yaml
# Security configuration
server:
  requestLog:
    appenders:
      - type: console
        filterFactories:
          - type: request-log-filter
            excludeHeaders: [authorization, cookie]
```

## Performance Optimization

### Database Optimization
- **Connection Pooling**: HikariCP configuration
- **Query Optimization**: Indexed queries, query plans
- **Batch Operations**: Bulk insert/update operations
- **Read Replicas**: Read-only database replicas (future)

### Caching Strategy
- **Application Cache**: In-memory caching for frequently accessed data
- **Database Cache**: Oracle result cache
- **CDN**: Content delivery network for static resources
- **Redis**: Distributed caching (future enhancement)

### JVM Tuning
```bash
# JVM options for production
-Xms2g -Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/heapdump
```

## Development Tools

### IDE Configuration
- **IntelliJ IDEA**: Recommended IDE
- **Eclipse**: Alternative IDE support
- **VS Code**: Lightweight development option

### Code Generation
- **Immutables**: Automatic immutable class generation
- **OpenAPI Generator**: Client SDK generation
- **Maven Plugins**: Code generation during build

### Testing Tools
- **JUnit 5**: Unit testing framework
- **Mockito**: Mocking framework
- **Karate**: API testing framework
- **TestContainers**: Integration testing with containers

### Build Tools
- **Maven**: Primary build tool
- **Docker**: Containerization
- **Jenkins**: CI/CD pipeline
- **Nexus**: Artifact repository