# Technical Details

## Technology Stack

### Core Framework
- **Spring Boot**: 3.x (latest stable)
- **Java**: 17 (LTS)
- **Maven**: 3.8+ for build management
- **Spring Framework**: 6.x

### Dependencies

#### Cvent-Specific Libraries
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-service</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-pangaea</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-oauth</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-tracing</artifactId>
</dependency>
```

#### Database & ORM
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>spring-boot-mybatis</artifactId>
</dependency>
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
</dependency>
<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc8</artifactId>
</dependency>
```

#### Immutables & Code Generation
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
```

## Application Configuration

### Main Application Class

```java
@SpringBootApplication(proxyBeanMethods = false)
public class PasskeyNotificationSbApplication {
    public static final String APPLICATION_NAME = "passkey-notification-sb";
    
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(PasskeyNotificationSbApplication.class);
        ObservabilityStartupTracer.addListeners(app);
        app.run(args);
    }
    
    @Bean
    WebServerFactoryCustomizer<TomcatServletWebServerFactory> accessLogsCustomizer() {
        return factory -> {
            LogbackValve logbackValve = new LogbackValve();
            logbackValve.setFilename("logback-access.xml");
            logbackValve.setAsyncSupported(true);
            factory.addContextValves(logbackValve);
        };
    }
}
```

### Configuration Properties

#### Server Configuration
```yaml
server:
  port: 7000
  max-http-request-header-size: 16KB
  servlet:
    context-path: /dev
  tomcat:
    keep-alive-timeout: 61s
    max-http-response-header-size: 16KB
    threads:
      max: 40
    accesslog:
      enabled: true
```

#### Management Configuration
```yaml
management:
  server:
    port: 7001
  metrics:
    enable:
      all: false
      tomcat: true
      jdbc: true
    tags:
      env: local
  endpoints:
    web:
      base-path: /tasks
      exposure:
        include: ok, config
```

#### Database Configuration
```yaml
spring:
  datasource:
    driver-class-name: oracle.jdbc.OracleDriver
    url: jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=host)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=SERVICE)))
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      minimum-idle: 1
      maximum-pool-size: 5
      connection-timeout: 30000
      idle-timeout: 600000
      test-while-idle: true
      transaction-isolation: TRANSACTION_READ_COMMITTED
      lazy-initialization: true
```

## Security Implementation

### OAuth2 Configuration

```yaml
cvent:
  auth:
    application:
      client-id: '12025'
      client-secret: '${AUTH_CLIENT_SECRET}'
      scopes: []
    server:
      url: 'https://auth-service-web.us-east-1.sn.cvent-development.cvent.cloud/sg50/auth/'
```

### Authorization Annotations

```java
@PostMapping()
@CventAuthorization(scopes = {"ADMIN"})
ResponseEntity<com.cvent.api.models.platform.ResponseEntity> addEntity(
    @Valid @RequestBody Entity requestEntity) {
    // Implementation
}

@GetMapping("/{id}")
@CventAuthorization(scopes = {"READ_ONLY"})
com.cvent.api.models.platform.ResponseEntity getEntity(@PathVariable String id) {
    // Implementation
}
```

## Build Configuration

### Maven Configuration

#### Parent POM Structure
```xml
<parent>
    <groupId>com.cvent.passkeynotificationsb</groupId>
    <artifactId>passkey-notification-sb-parent</artifactId>
    <version>0.3.2</version>
    <relativePath>../parent</relativePath>
</parent>
```

#### Module Structure
```xml
<modules>
    <module>parent</module>
    <module>java-client</module>
    <module>service</module>
    <module>it</module>
</modules>
```

#### Build Plugins
```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <arguments>
            <argument>--spring.config.location=configs/dev.yaml</argument>
        </arguments>
    </configuration>
</plugin>
```

### NX Workspace Integration

#### Package.json Scripts
```json
{
  "scripts": {
    "build": "nx affected $(getBaseForNxAffected) --target=build",
    "test": "nx affected $(getBaseForNxAffected) --target=test",
    "lint": "nx affected $(getBaseForNxAffected) --target=lint",
    "format": "nx affected $(getBaseForNxAffected) --target=format"
  }
}
```

#### Project Configuration
```json
{
  "name": "passkey-notification-sb-service",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@cvent/builder-maven:build"
    },
    "test": {
      "executor": "@cvent/builder-maven:test"
    }
  }
}
```

## Database Integration

### Connection Pool Configuration

```java
@Configuration
public class DatabaseConfiguration {
    
    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariConfig hikariConfig() {
        return new HikariConfig();
    }
    
    @Bean
    public DataSource dataSource() {
        return new HikariDataSource(hikariConfig());
    }
}
```

### MyBatis Configuration

```java
@Configuration
@MapperScan("com.cvent.passkeynotificationsb.dao")
public class MyBatisConfiguration {
    
    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);
        return sessionFactory.getObject();
    }
}
```

## Logging Configuration

### Logback Configuration

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkeynotificationsb" level="INFO"/>
    <logger name="org.springframework" level="WARN"/>
    <logger name="org.mybatis" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### Access Logging

```xml
<configuration>
    <appender name="ACCESS" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/access.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/access.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%h %l %u %t "%r" %s %b "%i{Referer}" "%i{User-Agent}"</pattern>
        </encoder>
    </appender>
    
    <appender-ref ref="ACCESS"/>
</configuration>
```

## Monitoring & Observability

### Metrics Configuration

```java
@Configuration
public class MetricsConfiguration {
    
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config().commonTags(
            "application", "passkey-notification-sb",
            "environment", environmentName
        );
    }
    
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }
}
```

### Health Indicators

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    private final DataSource dataSource;
    
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

## Testing Configuration

### Integration Test Setup

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "classpath:application-test.properties")
public class PasskeyNotificationSbIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @MockBean
    private PasskeyNotificationSbService service;
    
    @Test
    public void testCreateEntity() {
        // Test implementation
    }
}
```

### Test Configuration

```properties
# application-test.properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
logging.level.com.cvent.passkeynotificationsb=DEBUG
```

## Performance Optimization

### Connection Pool Tuning

```yaml
spring:
  datasource:
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
```

### JVM Tuning

```bash
# JVM Options for production
-Xms512m
-Xmx2g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/heapdump.hprof
```

### Tomcat Tuning

```yaml
server:
  tomcat:
    threads:
      max: 200
      min-spare: 10
    connection-timeout: 20000
    max-connections: 8192
    accept-count: 100
```

## Error Handling

### Global Exception Handler

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException e) {
        return ResponseEntity.badRequest()
            .body(ErrorResponse.builder()
                .message(e.getMessage())
                .timestamp(Instant.now())
                .build());
    }
    
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuth(AuthenticationException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse.builder()
                .message("Authentication required")
                .timestamp(Instant.now())
                .build());
    }
}
```

## Deployment Artifacts

### Docker Configuration

```dockerfile
FROM openjdk:17-jre-slim

COPY target/passkey-notification-sb-*.jar app.jar
COPY configs/ /app/configs/

EXPOSE 7000 7001

ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### AWS CDK Infrastructure

```typescript
export class PasskeyNotificationSbStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    
    const service = new EcsService(this, 'Service', {
      cluster: props.cluster,
      taskDefinition: this.createTaskDefinition(),
      desiredCount: 2
    });
  }
  
  private createTaskDefinition(): TaskDefinition {
    const taskDef = new TaskDefinition(this, 'TaskDef', {
      compatibility: Compatibility.FARGATE,
      cpu: '512',
      memoryMiB: '1024'
    });
    
    taskDef.addContainer('app', {
      image: ContainerImage.fromRegistry('passkey-notification-sb:latest'),
      portMappings: [
        { containerPort: 7000, protocol: Protocol.TCP },
        { containerPort: 7001, protocol: Protocol.TCP }
      ]
    });
    
    return taskDef;
  }
}
```

## Development Tools

### IDE Configuration

#### IntelliJ IDEA Settings
- Enable annotation processing for Immutables
- Configure code style according to Cvent standards
- Set up run configurations for local development

#### VS Code Settings
```json
{
  "java.configuration.updateBuildConfiguration": "automatic",
  "java.compile.nullAnalysis.mode": "automatic",
  "spring-boot.ls.problem.application-properties.unknown-property": "ignore"
}
```

### Code Quality Tools

#### Checkstyle Configuration
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
        <suppressionsLocation>src/main/resources/checkstyle-suppressions.xml</suppressionsLocation>
    </configuration>
</plugin>
```

#### SonarQube Integration
```properties
sonar.projectKey=passkey-notification-sb
sonar.sources=src/main/java
sonar.tests=src/test/java
sonar.java.coveragePlugin=jacoco
sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
```