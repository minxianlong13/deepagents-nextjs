# Technical Details

## Technology Stack

- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Database**: Oracle Database
- **ORM**: Spring Data JPA + MyBatis
- **Security**: Spring Security with OAuth 2.0
- **Testing**: JUnit 5, Spring Boot Test
- **Containerization**: Docker
- **Monorepo Management**: pnpm + Nx

## Dependencies

### Core Spring Boot Dependencies
```xml
<!-- Spring Boot Starter -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-service</artifactId>
</dependency>

<!-- Spring Boot Actuator for monitoring -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- Spring Data JPA -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

### Database and Persistence
```xml
<!-- Oracle JDBC Driver -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- MyBatis Integration -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-mybatis</artifactId>
</dependency>
```

### Security and Authentication
```xml
<!-- Cvent OAuth Integration -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-oauth</artifactId>
</dependency>

<!-- Login Service Client -->
<dependency>
    <groupId>com.cvent.login</groupId>
    <artifactId>login-java-client</artifactId>
</dependency>
```

### Utilities and Code Generation
```xml
<!-- Lombok for boilerplate reduction -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <scope>provided</scope>
</dependency>

<!-- Immutables for immutable objects -->
<dependency>
    <groupId>com.cvent.immutables</groupId>
    <artifactId>immutables-cvent</artifactId>
</dependency>

<!-- MapStruct for object mapping -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
```

### Observability and Monitoring
```xml
<!-- Cvent Common Tracing -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-tracing</artifactId>
</dependency>

<!-- Pangaea Common Utilities -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-pangaea</artifactId>
</dependency>
```

### Testing Dependencies
```xml
<!-- Spring Boot Test Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- Spring Security Test -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- Jackson YAML for test configurations -->
<dependency>
    <groupId>com.fasterxml.jackson.dataformat</groupId>
    <artifactId>jackson-dataformat-yaml</artifactId>
    <scope>test</scope>
</dependency>
```

## Configuration

### Application Configuration
The service uses YAML-based configuration with environment-specific overrides:

**Base Configuration** (`configs/template.yaml`):
```yaml
server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: passkey-admin-service
  
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: oracle.jdbc.OracleDriver
    
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.Oracle12cDialect
        format_sql: true

mybatis:
  mapper-locations: classpath:mybatis/mappers/*.xml
  configuration:
    map-underscore-to-camel-case: true
```

**Development Configuration** (`configs/dev.yaml`):
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521:XE
    username: passkey_admin_dev
    password: dev_password
    
  jpa:
    show-sql: true
    
logging:
  level:
    com.cvent.passkeyadminservice: DEBUG
    org.springframework.security: DEBUG
```

### Environment Variables
- `DATABASE_URL`: Oracle database connection URL
- `DATABASE_USERNAME`: Database username
- `DATABASE_PASSWORD`: Database password
- `OAUTH_CLIENT_ID`: OAuth client identifier
- `OAUTH_CLIENT_SECRET`: OAuth client secret
- `SPRING_PROFILES_ACTIVE`: Active Spring profiles

### Maven Configuration
**Parent POM** (`packages/passkey-admin-service/parent/pom.xml`):
- Defines shared dependencies and versions
- Configures build plugins and profiles
- Sets up code quality tools (Checkstyle, SpotBugs)

**Service POM** (`packages/passkey-admin-service/service/pom.xml`):
- Inherits from parent POM
- Defines service-specific dependencies
- Configures Spring Boot Maven plugin
- Sets up assembly for configuration packaging

## Database Schema

### Connection Configuration
- **Connection Pool**: HikariCP (default with Spring Boot)
- **Database**: Oracle 12c+
- **Schema**: Dedicated schema for passkey admin service
- **Migrations**: Managed through separate database migration tools

### Key Tables
```sql
-- Contacts table
CREATE TABLE contacts (
    contact_id NUMBER(19) PRIMARY KEY,
    first_name VARCHAR2(100) NOT NULL,
    last_name VARCHAR2(100) NOT NULL,
    email_address VARCHAR2(255) UNIQUE NOT NULL,
    phone_number VARCHAR2(50),
    company_name VARCHAR2(200),
    job_title VARCHAR2(100),
    contact_status_id NUMBER(19),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR2(100),
    updated_by VARCHAR2(100)
);

-- User identities table
CREATE TABLE user_identities (
    user_identity_id VARCHAR2(100) PRIMARY KEY,
    user_id VARCHAR2(100) NOT NULL,
    email_address VARCHAR2(255) NOT NULL,
    first_name VARCHAR2(100),
    last_name VARCHAR2(100),
    display_name VARCHAR2(200),
    user_type VARCHAR2(50),
    is_active NUMBER(1) DEFAULT 1,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email types table
CREATE TABLE email_types (
    email_type_id NUMBER(19) PRIMARY KEY,
    type_name VARCHAR2(100) UNIQUE NOT NULL,
    description VARCHAR2(500),
    is_active NUMBER(1) DEFAULT 1,
    sort_order NUMBER(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexing Strategy
- Primary keys: Clustered indexes on all primary keys
- Foreign keys: Non-clustered indexes on all foreign key columns
- Email addresses: Unique indexes for email lookup performance
- Composite indexes: For common query patterns (status + date ranges)

## Monitoring & Logging

### Application Logging
**Logback Configuration**:
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
    
    <appender name="ACCESS" class="ch.qos.logback.access.tomcat.LogbackValve">
        <filename>logback-access.xml</filename>
    </appender>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### Health Checks
**Custom Health Indicators**:
```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        // Check database connectivity
        // Validate critical tables exist
        // Return health status
    }
}
```

### Metrics and Monitoring
- **Spring Actuator Endpoints**: `/actuator/health`, `/actuator/metrics`, `/actuator/info`
- **Custom Metrics**: Business-specific metrics using Micrometer
- **Datadog Integration**: Application performance monitoring and alerting
- **Request Tracing**: Correlation IDs for distributed tracing

### Observability Features
```java
@RestController
public class PasskeyContactController {
    
    @PostMapping("/contacts")
    @Timed(name = "contact.creation", description = "Time taken to create contact")
    public ResponseEntity<Object> createContact(@RequestBody Contact contact) {
        // Implementation with automatic timing metrics
    }
}
```

## Build and Packaging

### Maven Build Profiles
- **default**: Standard build with unit tests
- **run-it**: Integration test execution
- **coverage**: Code coverage analysis with JaCoCo
- **release**: Production build with assembly packaging

### Docker Configuration
```dockerfile
FROM openjdk:17-jre-slim

WORKDIR /app

COPY target/passkey-admin-service-*.jar app.jar
COPY configs/ configs/

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.config.location=configs/"]
```

### Assembly Configuration
**Configuration Assembly** (`src/main/assemblies/configs.xml`):
```xml
<assembly>
    <id>configs</id>
    <formats>
        <format>zip</format>
    </formats>
    <fileSets>
        <fileSet>
            <directory>configs</directory>
            <outputDirectory>configs</outputDirectory>
        </fileSet>
    </fileSets>
</assembly>
```

## Code Quality and Standards

### Static Analysis Tools
- **Checkstyle**: Code style enforcement
- **SpotBugs**: Bug pattern detection
- **SonarQube**: Code quality analysis
- **JaCoCo**: Code coverage measurement

### Code Coverage Requirements
- **Minimum Coverage**: 80% line coverage
- **Exclusions**: Entity classes, configuration classes, main application class
- **Branch Coverage**: 70% minimum for complex business logic

### Coding Standards
- **Java Code Style**: Google Java Style Guide
- **Naming Conventions**: CamelCase for methods/variables, PascalCase for classes
- **Documentation**: JavaDoc for public APIs
- **Error Handling**: Consistent exception handling patterns

## Performance Considerations

### Database Optimization
- **Connection Pooling**: HikariCP with optimized pool size
- **Query Optimization**: Indexed queries and efficient JPA mappings
- **Batch Operations**: Bulk insert/update operations where applicable
- **Caching**: Strategic use of Spring Cache for reference data

### Memory Management
- **JVM Tuning**: Optimized heap size and garbage collection settings
- **Object Lifecycle**: Proper resource cleanup and connection management
- **Streaming**: Large result sets processed with streaming APIs

### Scalability Features
- **Stateless Design**: No server-side session state
- **Horizontal Scaling**: Multiple service instances behind load balancer
- **Database Scaling**: Read replicas for query-heavy operations
- **Caching Strategy**: Distributed caching for frequently accessed data