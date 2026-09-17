# Technical Details

## Technology Stack

### Core Framework
- **Spring Boot**: 3.x - Main application framework
- **Spring WebFlux**: Reactive web framework for non-blocking operations
- **Spring GraphQL**: GraphQL integration with subscription support
- **Spring Security**: OAuth 2.0 authentication and authorization
- **Spring Cloud AWS**: AWS service integrations

### Language and Runtime
- **Java**: 17 (LTS) - Primary programming language
- **Maven**: 3.8+ - Build and dependency management
- **Lombok**: Code generation for boilerplate reduction

### Database and Storage
- **DynamoDB**: NoSQL database for configuration and metadata
- **MyBatis**: SQL mapping framework for relational data access
- **Oracle JDBC**: Database connectivity for legacy systems
- **AWS S3**: Object storage for files and logs

### Messaging and Events
- **AWS SQS**: Message queuing for asynchronous processing
- **Spring Cloud AWS SQS**: SQS integration with Spring
- **GraphQL Subscriptions**: Real-time event streaming
- **WebSocket**: Persistent connections for subscriptions

### Development Tools
- **TypeScript**: Build tooling and configuration
- **Node.js**: 18+ - Build environment and tooling
- **pnpm**: Package manager for Node.js dependencies
- **Nx**: Monorepo build system and task orchestration

### Testing
- **JUnit 5**: Unit testing framework
- **Mockito**: Mocking framework for unit tests
- **Spring Boot Test**: Integration testing support
- **TestContainers**: Integration testing with real services

### Monitoring and Observability
- **Spring Actuator**: Health checks and metrics
- **Micrometer**: Metrics collection and export
- **Datadog**: Application performance monitoring
- **AWS CloudWatch**: Log aggregation and monitoring

## Dependencies

### Core Spring Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-graphql</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.awspring.cloud</groupId>
    <artifactId>spring-cloud-aws-starter-sqs</artifactId>
</dependency>
<dependency>
    <groupId>io.awspring.cloud</groupId>
    <artifactId>spring-cloud-aws-starter-s3</artifactId>
</dependency>
```

### AWS SDK Dependencies

```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>dynamodb-enhanced</artifactId>
</dependency>
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>sqs</artifactId>
</dependency>
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3-transfer-manager</artifactId>
</dependency>
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>lambda</artifactId>
</dependency>
```

### Passkey Platform Dependencies

```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-inventory-java-client</artifactId>
    <version>1.9.7</version>
</dependency>
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-reservation-orch-client</artifactId>
    <version>1.11.19</version>
</dependency>
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-event-java-client</artifactId>
    <version>1.13.30</version>
</dependency>
<dependency>
    <groupId>com.cvent.passkey-vendor</groupId>
    <artifactId>passkey-vendor-java-client</artifactId>
    <version>1.6.2</version>
</dependency>
```

### Cvent Platform Dependencies

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
    <artifactId>common-tracing</artifactId>
</dependency>
```

## Configuration

### Application Configuration

The service uses YAML configuration files for different environments:

**Development Configuration** (`configs/dev.yaml`):
```yaml
server:
  port: 8080

spring:
  application:
    name: passkey-inbound-service
  profiles:
    active: dev
  webflux:
    base-path: /passkey-inbound/v1

aws:
  region: us-east-1
  sqs:
    external-data-load: http://localhost:4566/000000000000/passkey-inbound-external-data-load-local
    inbound-payloads: http://localhost:4566/000000000000/passkey-inbound-passkey-payloads-local.fifo
    ohip-business-events: http://localhost:4566/000000000000/passkey-inbound-ohip-business-events-local.fifo
  dynamodb:
    inbound-configs: inbound-configs-alpha
  s3:
    logs-bucket: passkey-inbound-logs-dev

cvent:
  oauth:
    enabled: true
    issuer-uri: https://auth-dev.cvent.com
  tracing:
    enabled: true
    service-name: passkey-inbound-service
```

### Environment Variables

**Required Environment Variables**:
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>

# SQS Queue Names
ExternalDataLoadSqsName=passkey-inbound-external-data-load-${ENV}
InboundPasskeyPayloadsSqsName=passkey-inbound-passkey-payloads-${ENV}.fifo
OhipConnectionsSqsName=passkey-inbound-ohip-connections-${ENV}
PasskeyInboundOhipBusinessEventsSqsName=passkey-inbound-ohip-business-events-${ENV}.fifo
PasskeyInboundOhipBusinessEventsDelayedSqsName=passkey-inbound-ohip-business-events-delayed-${ENV}.fifo
ResultMessageSqsName=passkey-inbound-result-message-${ENV}

# DynamoDB Tables
InboundConfigsDynamoDbName=inbound-configs-${ENV}

# S3 Buckets
INT_LOGS_BUCKET=passkey-inbound-logs-${ENV}

# Application Configuration
ENV=dev|staging|production
LOCAL_API_KEY=<local-development-key>
```

**Optional Environment Variables**:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=passkey_inbound
DB_USERNAME=app_user
DB_PASSWORD=<password>

# Monitoring
DATADOG_API_KEY=<datadog-key>
DATADOG_SERVICE_NAME=passkey-inbound-service

# Feature Flags
FEATURE_GML_ENABLED=true
FEATURE_BATCH_PROCESSING_ENABLED=true
```

### Spring Profiles

- **local**: Local development with LocalStack
- **dev**: Development environment
- **staging**: Staging environment for testing
- **production**: Production environment
- **test**: Test profile for unit/integration tests

## Database Schema

### DynamoDB Tables

#### inbound-configs Table

**Purpose**: Stores hotel and vendor system configuration

**Schema**:
```json
{
  "TableName": "inbound-configs",
  "KeySchema": [
    {
      "AttributeName": "pk",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "sk",
      "KeyType": "RANGE"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "pk",
      "AttributeType": "S"
    },
    {
      "AttributeName": "sk",
      "AttributeType": "S"
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

**Access Patterns**:
- Get hotel config: `pk = "HOTEL#<hotelId>"`, `sk = "CONFIG#<vendorSystemId>"`
- Get vendor system configs: `pk = "VENDOR#<vendorSystemId>"`, `sk` begins with `"HOTEL#"`
- List all configs: Scan operation (used sparingly)

**Sample Record**:
```json
{
  "pk": "HOTEL#HTL001",
  "sk": "CONFIG#12345",
  "hotelId": "HTL001",
  "vendorSystemId": 12345,
  "gmlEnabled": true,
  "inboundReservationEnabled": true,
  "inventorySyncEnabled": true,
  "eventFilters": ["RESERVATION_CREATED", "RESERVATION_MODIFIED"],
  "mappingCodes": {
    "roomTypes": {
      "STD": "STANDARD",
      "DLX": "DELUXE"
    }
  },
  "lastUpdated": "2024-01-15T10:00:00Z",
  "ttl": 1705392000
}
```

### Oracle Database Schema

**Connection Configuration**:
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@${DB_HOST}:${DB_PORT}:${DB_NAME}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: oracle.jdbc.OracleDriver

mybatis:
  mapper-locations: classpath:mappers/*.xml
  type-aliases-package: com.cvent.passkeyinbound.model
```

## Monitoring & Logging

### Health Checks

**Actuator Endpoints**:
- `/actuator/health` - Overall application health
- `/actuator/health/db` - Database connectivity
- `/actuator/health/sqs` - SQS queue connectivity
- `/actuator/health/dynamodb` - DynamoDB connectivity
- `/actuator/info` - Application information

**Custom Health Indicators**:
```java
@Component
public class PasskeyServicesHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        // Check connectivity to downstream Passkey services
        return Health.up()
            .withDetail("inventory-service", "UP")
            .withDetail("reservation-service", "UP")
            .build();
    }
}
```

### Metrics

**Custom Metrics**:
- `passkey.inbound.events.processed` - Counter of processed events
- `passkey.inbound.events.failed` - Counter of failed events
- `passkey.inbound.subscriptions.active` - Gauge of active subscriptions
- `passkey.inbound.config.updates` - Counter of configuration updates

**JVM Metrics**:
- Memory usage (heap, non-heap)
- Garbage collection statistics
- Thread pool utilization
- CPU usage

### Logging Configuration

**Logback Configuration** (`logback-spring.xml`):
```xml
<configuration>
    <springProfile name="!local">
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
    </springProfile>
    
    <logger name="com.cvent.passkeyinbound" level="INFO"/>
    <logger name="org.springframework.web" level="DEBUG"/>
    <logger name="software.amazon.awssdk" level="WARN"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

**Log Correlation**:
- Request ID tracking across service calls
- User context propagation
- Distributed tracing with correlation IDs

## Security Configuration

### OAuth 2.0 Configuration

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtDecoder(jwtDecoder())
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/actuator/health").permitAll()
                .pathMatchers("/passkey-inbound/v1/**").authenticated()
                .pathMatchers("/graphql").authenticated()
                .anyExchange().denyAll()
            )
            .build();
    }
}
```

### CORS Configuration

```java
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("https://*.cvent.com");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsWebFilter(source);
    }
}
```

## Performance Optimization

### Connection Pooling

**HikariCP Configuration**:
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      max-lifetime: 1200000
      connection-timeout: 20000
```

**HTTP Client Configuration**:
```java
@Configuration
public class HttpClientConfig {
    
    @Bean
    public WebClient webClient() {
        ConnectionProvider provider = ConnectionProvider.builder("custom")
            .maxConnections(100)
            .maxIdleTime(Duration.ofSeconds(20))
            .maxLifeTime(Duration.ofSeconds(60))
            .pendingAcquireTimeout(Duration.ofSeconds(60))
            .build();
            
        HttpClient httpClient = HttpClient.create(provider)
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
            .responseTimeout(Duration.ofSeconds(30));
            
        return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }
}
```

### Caching Strategy

**Configuration Cache**:
```java
@Cacheable(value = "hotel-configs", key = "#hotelId + '_' + #vendorSystemId")
public HotelConfig getHotelConfig(String hotelId, Long vendorSystemId) {
    return inboundConfigsDao.getHotelConfig(hotelId, vendorSystemId);
}
```

**Cache Configuration**:
```yaml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=1000,expireAfterWrite=300s
```

### Async Processing

**Thread Pool Configuration**:
```java
@Configuration
@EnableAsync
public class AsyncConfig {
    
    @Bean(name = "eventProcessingExecutor")
    public Executor eventProcessingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("event-processing-");
        executor.initialize();
        return executor;
    }
}
```