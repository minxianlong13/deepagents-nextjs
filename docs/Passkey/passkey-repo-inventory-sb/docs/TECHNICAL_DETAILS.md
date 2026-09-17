# Technical Details

## Technology Stack

### Core Framework
- **Spring Boot**: 3.x (latest stable version)
- **Java**: 17+ (LTS version)
- **Maven**: 3.6+ for build management
- **Spring Framework**: 6.x for dependency injection and core features

### Web Layer
- **Spring Web MVC**: RESTful web services
- **Embedded Tomcat**: Application server
- **Jackson**: JSON serialization/deserialization
- **Bean Validation**: Request/response validation

### Data Access
- **MyBatis**: SQL mapping framework
- **Oracle JDBC Driver**: Database connectivity (ojdbc8 18.3.0.0)
- **Spring Transaction Management**: Declarative transaction support
- **Connection Pooling**: HikariCP (via Spring Boot default)

### Security
- **Cvent OAuth**: Custom OAuth integration
- **Spring Security**: Security framework
- **JWT**: Token-based authentication

### Observability & Monitoring
- **SLF4J + Logback**: Logging framework
- **Spring Boot Actuator**: Health checks and metrics
- **Datadog**: Application monitoring and tracing
- **Cvent Observability Tracer**: Custom startup tracing

### Development Tools
- **Immutables**: Code generation for immutable objects
- **MapStruct**: Bean mapping framework
- **JSoup**: HTML parsing (for specific use cases)

## Dependencies

### Core Spring Boot Dependencies
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
    <artifactId>cvent-spring-boot-starter-mybatis</artifactId>
</dependency>
```

### Database Dependencies
```xml
<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>18.3.0.0</version>
</dependency>
```

### Utility Libraries
```xml
<dependency>
    <groupId>com.cvent.immutables</groupId>
    <artifactId>immutables-cvent</artifactId>
</dependency>

<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <scope>provided</scope>
</dependency>

<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.6.3</version>
</dependency>
```

### Testing Dependencies
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

## Build Configuration

### Maven Configuration
- **Parent POM**: Custom Cvent parent for shared configuration
- **Java Version**: 17
- **Maven Compiler Plugin**: 3.14.1 with annotation processing
- **Spring Boot Maven Plugin**: For executable JAR creation
- **Assembly Plugin**: For configuration packaging

### Annotation Processing
```xml
<annotationProcessorPaths>
    <path>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct-processor</artifactId>
        <version>1.6.3</version>
    </path>
</annotationProcessorPaths>
```

### Compiler Arguments
```xml
<compilerArgs>
    <arg>-Amapstruct.defaultComponentModel=spring</arg>
</compilerArgs>
```

## Configuration Management

### Application Configuration Files
- **dev.yaml**: Development environment configuration
- **template.yaml**: Template for environment-specific configurations
- **base-override.yaml**: Common configuration overrides

### Configuration Structure
```yaml
server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: passkey-inventory
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: oracle.jdbc.OracleDriver

mybatis:
  configuration:
    map-underscore-to-camel-case: true
  mapper-locations: classpath:mappers/*.xml

logging:
  level:
    com.cvent.passkeyinventory: INFO
    org.springframework.security: DEBUG
```

### Environment Variables
- `DATABASE_URL`: Oracle database connection string
- `DATABASE_USERNAME`: Database username
- `DATABASE_PASSWORD`: Database password
- `OAUTH_CLIENT_ID`: OAuth client identifier
- `OAUTH_CLIENT_SECRET`: OAuth client secret
- `DATADOG_API_KEY`: Datadog monitoring API key

## Database Schema

### Connection Configuration
- **Database**: Oracle Database
- **Connection Pool**: HikariCP (default Spring Boot configuration)
- **Transaction Management**: Spring's `@Transactional` support
- **SQL Dialect**: Oracle SQL with MyBatis mapping

### MyBatis Configuration
- **Mapper Locations**: `classpath:mappers/*.xml`
- **Configuration**: Camel case mapping enabled
- **Type Handlers**: Custom type handlers for domain objects

### Sample Mapper Configuration
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.cvent.passkeyinventory.dao.BlockDao">
    <select id="getBlocksById" resultType="BlockInfo">
        SELECT 
            block_id as blockId,
            block_name as blockName,
            hotel_id as hotelId,
            start_date as startDate,
            end_date as endDate,
            total_rooms as totalRooms,
            available_rooms as availableRooms
        FROM inventory_blocks 
        WHERE block_id IN 
        <foreach item="id" collection="blockIds" open="(" separator="," close=")">
            #{id}
        </foreach>
        AND locale_id = #{localeId}
    </select>
</mapper>
```

## Security Configuration

### OAuth Integration
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(jwtDecoder()))
            )
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

### Authorization Scopes
- **ADMIN**: Full CRUD operations
- **READ_ONLY**: Read-only access
- **SYSTEM**: Internal system operations

## Monitoring & Logging

### Logging Configuration
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
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### Health Check Configuration
```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        try {
            // Check database connectivity
            return Health.up()
                .withDetail("database", "Oracle")
                .withDetail("status", "Connected")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

### Metrics Collection
- **Application Metrics**: Custom business metrics
- **JVM Metrics**: Memory, GC, thread pool metrics
- **Database Metrics**: Connection pool, query performance
- **HTTP Metrics**: Request/response times, error rates

## Performance Optimization

### Caching Strategy
- **Application-level Caching**: Spring Cache abstraction
- **Database Query Optimization**: Indexed queries, query hints
- **Connection Pooling**: Optimized pool size configuration

### Memory Management
- **JVM Tuning**: Optimized heap size and GC settings
- **Object Pooling**: Reuse of expensive objects
- **Lazy Loading**: Deferred loading of large datasets

### Async Processing
```java
@Async
@Service
public class AsyncInventoryService {
    
    @Async("taskExecutor")
    public CompletableFuture<Void> processInventoryUpdate(InventoryUpdate update) {
        // Asynchronous processing
        return CompletableFuture.completedFuture(null);
    }
}
```

## Code Quality & Standards

### Code Style
- **Checkstyle**: Enforced code formatting rules
- **SpotBugs**: Static analysis for bug detection
- **SonarQube**: Code quality metrics and analysis

### Testing Strategy
- **Unit Tests**: JUnit 5 with Mockito
- **Integration Tests**: Spring Boot Test with TestContainers
- **Contract Tests**: API contract validation
- **Performance Tests**: Load testing with custom tools

### Documentation Standards
- **JavaDoc**: Comprehensive API documentation
- **OpenAPI**: REST API specification
- **Architecture Decision Records**: Technical decision documentation

## Deployment Artifacts

### JAR Structure
```
passkey-inventory-0.0.16.jar
├── BOOT-INF/
│   ├── classes/
│   │   ├── com/cvent/passkeyinventory/
│   │   ├── mappers/
│   │   └── application.yaml
│   └── lib/
│       └── [dependencies]
├── META-INF/
└── org/springframework/boot/loader/
```

### Configuration Assembly
- **configs.zip**: Environment-specific configuration files
- **Dockerfile**: Container image definition
- **docker-compose.yml**: Local development setup

### Health Check Endpoints
- `/actuator/health`: Overall application health
- `/actuator/health/db`: Database connectivity
- `/actuator/metrics`: Application metrics
- `/actuator/info`: Application information