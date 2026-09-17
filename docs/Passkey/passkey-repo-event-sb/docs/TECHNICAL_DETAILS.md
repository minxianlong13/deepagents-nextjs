# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **Build Tool**: Maven 3.8+
- **Package Manager**: pnpm (for monorepo tooling)
- **Container Runtime**: Docker

### Database & Persistence
- **Database**: Oracle Database 19c+
- **ORM Framework**: MyBatis 3.0.5
- **Connection Pooling**: HikariCP (via Spring Boot)
- **Migration Tool**: Flyway (implied through CDF)
- **JDBC Driver**: Oracle JDBC 11

### Web & API
- **Web Framework**: Spring Web MVC
- **API Style**: RESTful APIs
- **Serialization**: Jackson (JSON)
- **Validation**: Bean Validation (JSR-303)
- **Documentation**: OpenAPI/Swagger (via CDF)

### Security
- **Authentication**: OAuth 2.0 / JWT
- **Authorization**: Spring Security
- **Integration**: Cvent OAuth Service
- **Method Security**: @PreAuthorize annotations

### Observability & Monitoring
- **Logging**: Logback with JSON formatting
- **Metrics**: Micrometer with Prometheus
- **Tracing**: Cvent Common Tracing
- **Health Checks**: Spring Boot Actuator
- **APM**: Cvent Observability Stack

### Development Tools
- **Code Generation**: MapStruct 1.5.5
- **Lombok**: Code reduction annotations
- **Testing**: JUnit 5, Mockito, Spring Boot Test
- **Code Quality**: Checkstyle, SonarQube
- **IDE Support**: IntelliJ IDEA configurations

## Dependencies

### Core Spring Boot Dependencies
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### Cvent Framework Dependencies
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
    <artifactId>cvent-spring-boot-starter-logcontext</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-observability</artifactId>
</dependency>
```

### Database Dependencies
```xml
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.5</version>
</dependency>
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
</dependency>
```

### Utility Dependencies
```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <scope>provided</scope>
</dependency>
```

## Configuration

### Application Configuration Structure
```yaml
# configs/dev.yaml
server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: passkey-event
  profiles:
    active: dev
  
  datasource:
    url: jdbc:oracle:thin:@//localhost:1521/XEPDB1
    username: ${DB_USERNAME:passkey_user}
    password: ${DB_PASSWORD:password}
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.Oracle12cDialect
        format_sql: true

mybatis:
  mapper-locations: classpath:mappers/*.xml
  type-aliases-package: com.cvent.passkeyeventsb.dbentities
  configuration:
    map-underscore-to-camel-case: true
    default-fetch-size: 100
    default-statement-timeout: 30

logging:
  level:
    com.cvent.passkeyeventsb: INFO
    org.springframework.security: DEBUG
    org.mybatis: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true
```

### Environment-Specific Configuration
- **Development**: Local database, debug logging, relaxed security
- **Staging**: Staging database, info logging, full security
- **Production**: Production database, warn logging, strict security

### Feature Flags
```yaml
features:
  flip-to-enabled: true
  marketing-items-v2: false
  enhanced-consent-tracking: true
  legacy-api-support: true
```

## Database Schema

### Core Tables

#### EVENTS Table
```sql
CREATE TABLE EVENTS (
    ID NUMBER(19) PRIMARY KEY,
    NAME VARCHAR2(255) NOT NULL,
    DESCRIPTION CLOB,
    START_DATE TIMESTAMP NOT NULL,
    END_DATE TIMESTAMP NOT NULL,
    STATUS VARCHAR2(20) NOT NULL,
    LOCALE VARCHAR2(10) DEFAULT 'en_US',
    TIMEZONE VARCHAR2(50),
    ORGANIZER_ID NUMBER(19),
    VENUE_ID NUMBER(19),
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREATED_BY VARCHAR2(100),
    MODIFIED_BY VARCHAR2(100)
);
```

#### MARKETING_ITEMS Table
```sql
CREATE TABLE MARKETING_ITEMS (
    ID NUMBER(19) PRIMARY KEY,
    EVENT_ID NUMBER(19) NOT NULL,
    HOTEL_ID NUMBER(19),
    TITLE VARCHAR2(100) NOT NULL,
    DESCRIPTION CLOB,
    ITEM_TYPE VARCHAR2(20) NOT NULL,
    PRICE NUMBER(10,2) DEFAULT 0,
    CURRENCY VARCHAR2(3) DEFAULT 'USD',
    AVAILABLE NUMBER(1) DEFAULT 1,
    LOCALE VARCHAR2(10) DEFAULT 'en_US',
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_MARKETING_ITEMS_EVENT 
        FOREIGN KEY (EVENT_ID) REFERENCES EVENTS(ID)
);
```

#### FLIP_TO_SETTINGS Table
```sql
CREATE TABLE FLIP_TO_SETTINGS (
    ID NUMBER(19) PRIMARY KEY,
    EVENT_ID NUMBER(19) NOT NULL,
    SETTING_NAME VARCHAR2(50) NOT NULL,
    SETTING_VALUE VARCHAR2(500),
    DESCRIPTION VARCHAR2(255),
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_FLIP_TO_SETTINGS_EVENT 
        FOREIGN KEY (EVENT_ID) REFERENCES EVENTS(ID),
    CONSTRAINT UK_FLIP_TO_SETTINGS 
        UNIQUE (EVENT_ID, SETTING_NAME)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX IDX_EVENTS_STATUS ON EVENTS(STATUS);
CREATE INDEX IDX_EVENTS_START_DATE ON EVENTS(START_DATE);
CREATE INDEX IDX_MARKETING_ITEMS_EVENT ON MARKETING_ITEMS(EVENT_ID);
CREATE INDEX IDX_MARKETING_ITEMS_HOTEL ON MARKETING_ITEMS(HOTEL_ID);
CREATE INDEX IDX_FLIP_TO_SETTINGS_EVENT ON FLIP_TO_SETTINGS(EVENT_ID);
```

## Build Configuration

### Maven Parent POM
```xml
<parent>
    <groupId>com.cvent.passkeyeventsb</groupId>
    <artifactId>passkey-event-parent</artifactId>
    <version>1.0.0</version>
</parent>

<properties>
    <java.version>17</java.version>
    <spring-boot.version>3.2.0</spring-boot.version>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

### Build Plugins
```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <layout>ZIP</layout>
        <requiresUnpack>
            <dependency>
                <groupId>ch.qos.logback</groupId>
                <artifactId>logback-core</artifactId>
            </dependency>
        </requiresUnpack>
    </configuration>
</plugin>

<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <annotationProcessorPaths>
            <path>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
            </path>
            <path>
                <groupId>org.mapstruct</groupId>
                <artifactId>mapstruct-processor</artifactId>
                <version>1.5.5.Final</version>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

### Code Quality Configuration
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
        <suppressionsLocation>src/main/resources/checkstyle-suppressions.xml</suppressionsLocation>
        <encoding>UTF-8</encoding>
        <consoleOutput>true</consoleOutput>
        <failsOnError>true</failsOnError>
    </configuration>
</plugin>

<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <excludes>
            <exclude>com/cvent/passkeyeventsb/PasskeyEventSbApplication.class</exclude>
            <exclude>com/cvent/passkeyeventsb/model/**</exclude>
        </excludes>
    </configuration>
</plugin>
```

## Monitoring & Logging

### Logging Configuration
```xml
<!-- logback-spring.xml -->
<configuration>
    <springProfile name="!prod">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>
    
    <springProfile name="prod">
        <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
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
        <root level="WARN">
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
</configuration>
```

### Metrics Configuration
```java
@Configuration
public class MetricsConfiguration {
    
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }
    
    @Bean
    public CountedAspect countedAspect(MeterRegistry registry) {
        return new CountedAspect(registry);
    }
}
```

### Health Checks
```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    @Autowired
    private DataSource dataSource;
    
    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(1)) {
                return Health.up()
                    .withDetail("database", "Oracle")
                    .withDetail("status", "Connected")
                    .build();
            }
        } catch (SQLException e) {
            return Health.down()
                .withDetail("database", "Oracle")
                .withDetail("error", e.getMessage())
                .build();
        }
        return Health.down().build();
    }
}
```

## Security Configuration

### OAuth Configuration
```java
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/passkey-event/**").authenticated()
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
            // Convert JWT claims to Spring Security authorities
            return extractAuthorities(jwt);
        });
        return converter;
    }
}
```

## Performance Optimization

### Database Optimization
- Connection pooling with HikariCP
- Query result caching with Redis (when available)
- Batch processing for bulk operations
- Prepared statement caching
- Index optimization for common queries

### Application Optimization
- Lazy loading for optional data
- Pagination for large result sets
- Asynchronous processing for non-critical operations
- Response compression for large payloads
- HTTP caching headers for static content

### JVM Tuning
```bash
# Production JVM settings
-Xms2g -Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/heapdump.hprof
-Dspring.profiles.active=prod
```

## Testing Strategy

### Unit Testing
```java
@ExtendWith(MockitoExtension.class)
class PasskeyEventServiceTest {
    
    @Mock
    private EventRepository eventRepository;
    
    @InjectMocks
    private PasskeyEventService eventService;
    
    @Test
    void shouldReturnEventInfo() {
        // Test implementation
    }
}
```

### Integration Testing
```java
@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class PasskeyEventControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void shouldGetEventInfo() {
        // Integration test implementation
    }
}
```

### Test Configuration
```yaml
# application-test.yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
```