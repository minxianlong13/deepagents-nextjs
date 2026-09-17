# Technical Details

## Technology Stack

### Core Framework
- **Spring Boot**: 2.x (managed by Cvent parent POM)
- **Java**: 17 (LTS version)
- **Maven**: 3.6+ for build management
- **Spring Framework**: 5.x (included with Spring Boot)

### Web Layer
- **Spring Web MVC**: RESTful web services
- **Embedded Tomcat**: Application server
- **Jackson**: JSON serialization/deserialization
- **Spring Security**: Security framework integration

### Data Layer
- **MyBatis**: SQL mapping framework
- **Oracle JDBC Driver**: 18.3.0.0
- **HikariCP**: Connection pooling (via Spring Boot)
- **Spring Transaction Management**: Declarative transactions

### Security
- **Cvent OAuth Framework**: Authentication and authorization
- **Spring Security OAuth**: OAuth 2.0 integration
- **JWT**: Token-based authentication

### Monitoring & Observability
- **Cvent Observability Framework**: Distributed tracing and metrics
- **Spring Boot Actuator**: Health checks and metrics endpoints
- **Logback**: Logging framework with access logging
- **SLF4J**: Logging facade

### Build & Development Tools
- **Maven**: Build automation and dependency management
- **Checkstyle**: Code style enforcement
- **JaCoCo**: Code coverage analysis
- **Spring Boot Maven Plugin**: Application packaging and running

### Monorepo Tools
- **Nx**: Monorepo build system and task runner
- **pnpm**: Package manager for Node.js dependencies
- **TypeScript**: Infrastructure and tooling code
- **ESLint**: JavaScript/TypeScript linting

## Dependencies

### Core Spring Boot Dependencies

```xml
<!-- Cvent Spring Boot Starter -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-service</artifactId>
</dependency>

<!-- OAuth Integration -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-oauth</artifactId>
</dependency>

<!-- MyBatis Integration -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-mybatis</artifactId>
</dependency>

<!-- Common Utilities -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-pangaea</artifactId>
</dependency>

<!-- Distributed Tracing -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-tracing</artifactId>
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

### Development Dependencies

```xml
<!-- Immutables for Value Objects -->
<dependency>
    <groupId>com.cvent.immutables</groupId>
    <artifactId>immutables-cvent</artifactId>
</dependency>

<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <scope>provided</scope>
</dependency>

<!-- Testing -->
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

## Configuration

### Application Configuration

The service uses YAML-based configuration with environment-specific overrides:

#### Development Configuration (`configs/dev.yaml`)
```yaml
server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: passkey-integration
  profiles:
    active: dev
  
  datasource:
    url: jdbc:oracle:thin:@//localhost:1521/XEPDB1
    username: ${DB_USERNAME:passkey_user}
    password: ${DB_PASSWORD:password}
    driver-class-name: oracle.jdbc.OracleDriver
    
  mybatis:
    mapper-locations: classpath:mappers/*.xml
    type-aliases-package: com.cvent.passkeyintegration.model

logging:
  level:
    com.cvent.passkeyintegration: DEBUG
    org.springframework.security: DEBUG
```

#### Template Configuration (`configs/template.yaml`)
```yaml
server:
  port: ${SERVER_PORT:8080}

spring:
  application:
    name: passkey-integration
    
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: oracle.jdbc.OracleDriver
    
cvent:
  oauth:
    resource-server:
      jwt:
        issuer-uri: ${OAUTH_ISSUER_URI}
        
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SERVER_PORT` | HTTP server port | 8080 | No |
| `DATABASE_URL` | Oracle database connection URL | - | Yes |
| `DATABASE_USERNAME` | Database username | - | Yes |
| `DATABASE_PASSWORD` | Database password | - | Yes |
| `OAUTH_ISSUER_URI` | OAuth issuer URI | - | Yes |
| `LOG_LEVEL` | Application log level | INFO | No |
| `ENVIRONMENT` | Deployment environment | dev | No |

### Spring Profiles

- **dev**: Development environment with debug logging
- **staging**: Staging environment with info logging
- **prod**: Production environment with warn logging
- **test**: Test environment for integration tests

## Database Schema

### Connection Configuration

```yaml
spring:
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    hikari:
      pool-name: PasskeyIntegrationPool
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      max-lifetime: 1200000
      connection-timeout: 20000
      validation-timeout: 5000
      leak-detection-threshold: 60000
```

### MyBatis Configuration

```yaml
mybatis:
  configuration:
    map-underscore-to-camel-case: true
    default-fetch-size: 100
    default-statement-timeout: 30
  mapper-locations: classpath:mappers/*.xml
  type-aliases-package: com.cvent.passkeyintegration.model
```

### Database Tables

The service interacts with the following Oracle database tables:

#### PASSKEY_USERS
```sql
CREATE TABLE PASSKEY_USERS (
    USER_ID VARCHAR2(50) PRIMARY KEY,
    USER_TYPE VARCHAR2(20) NOT NULL,
    STATUS VARCHAR2(20) DEFAULT 'ACTIVE',
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LAST_MODIFIED TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREATED_BY VARCHAR2(50),
    MODIFIED_BY VARCHAR2(50)
);
```

#### INTEGRATION_AUDIT
```sql
CREATE TABLE INTEGRATION_AUDIT (
    AUDIT_ID VARCHAR2(50) PRIMARY KEY,
    USER_ID VARCHAR2(50) NOT NULL,
    OPERATION_TYPE VARCHAR2(50) NOT NULL,
    REQUEST_DATA CLOB,
    RESPONSE_DATA CLOB,
    STATUS VARCHAR2(20) NOT NULL,
    EXECUTION_TIME_MS NUMBER,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_AUDIT_USER FOREIGN KEY (USER_ID) REFERENCES PASSKEY_USERS(USER_ID)
);
```

## Monitoring & Logging

### Application Metrics

The service exposes metrics through Spring Boot Actuator:

- **HTTP Request Metrics**: Request count, duration, status codes
- **Database Metrics**: Connection pool usage, query execution times
- **JVM Metrics**: Memory usage, garbage collection, thread counts
- **Custom Business Metrics**: Integration success rates, user operations

### Health Checks

#### Database Health Check
```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            // Verify database connectivity
            jdbcTemplate.queryForObject("SELECT 1 FROM DUAL", Integer.class);
            return Health.up()
                .withDetail("database", "Oracle")
                .withDetail("status", "Connected")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("database", "Oracle")
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

### Logging Configuration

#### Logback Configuration (`logback-spring.xml`)
```xml
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    
    <springProfile name="dev">
        <logger name="com.cvent.passkeyintegration" level="DEBUG"/>
        <logger name="org.springframework.security" level="DEBUG"/>
    </springProfile>
    
    <springProfile name="prod">
        <logger name="com.cvent.passkeyintegration" level="INFO"/>
        <logger name="org.springframework.security" level="WARN"/>
    </springProfile>
    
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <timestamp/>
                <logLevel/>
                <loggerName/>
                <message/>
                <mdc/>
                <stackTrace/>
            </providers>
        </encoder>
    </appender>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

#### Access Logging
```xml
<!-- logback-access.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.access.encoder.PatternLayoutEncoder">
            <pattern>%h %l %u %t "%r" %s %b "%i{Referer}" "%i{User-Agent}" %D</pattern>
        </encoder>
    </appender>
    
    <appender-ref ref="STDOUT"/>
</configuration>
```

## Security Implementation

### OAuth Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/health", "/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            );
        return http.build();
    }
    
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            // Convert JWT scopes to Spring Security authorities
            Collection<String> scopes = jwt.getClaimAsStringList("scope");
            return scopes.stream()
                .map(scope -> new SimpleGrantedAuthority("SCOPE_" + scope))
                .collect(Collectors.toList());
        });
        return converter;
    }
}
```

### Authorization Annotations

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasAuthority('SCOPE_' + #scope)")
public @interface CventAuthorization {
    String[] scopes() default {};
}
```

## Performance Optimization

### Connection Pooling
- HikariCP for efficient database connection management
- Pool size tuned based on expected concurrent load
- Connection validation and leak detection enabled

### Caching Strategy
- Application-level caching for frequently accessed data
- Redis integration for distributed caching (if needed)
- Cache invalidation strategies for data consistency

### Async Processing
- Spring's `@Async` annotation for non-blocking operations
- CompletableFuture for complex async workflows
- Thread pool configuration for optimal resource usage

## Build Configuration

### Maven Profiles

#### Default Profile
```xml
<profile>
    <id>default</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <modules>
        <module>parent</module>
        <module>java-client</module>
        <module>service</module>
        <module>it</module>
    </modules>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <skipITs>false</skipITs>
        <skipTests>true</skipTests>
    </properties>
    <modules>
        <module>java-client</module>
        <module>it</module>
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
                        <configuration>
                            <excludes>
                                <exclude>com/cvent/passkeyintegration/PasskeyIntegrationApplication.class</exclude>
                            </excludes>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</profile>
```

### Code Quality Tools

#### Checkstyle Configuration
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <configuration>
        <suppressionsLocation>src/main/resources/checkstyle-suppressions.xml</suppressionsLocation>
        <configLocation>cvent-checkstyle.xml</configLocation>
        <encoding>UTF-8</encoding>
        <consoleOutput>true</consoleOutput>
        <failsOnError>true</failsOnError>
    </configuration>
</plugin>
```

#### SonarQube Integration
```properties
# sonar-project.properties
sonar.projectKey=passkey-integration
sonar.projectName=Passkey Integration Service
sonar.sources=src/main/java
sonar.tests=src/test/java
sonar.java.binaries=target/classes
sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
```