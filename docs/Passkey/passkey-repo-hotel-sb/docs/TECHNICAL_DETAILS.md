# Technical Details

## Technology Stack

- **Framework**: Spring Boot 2.x
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Package Manager**: pnpm (for build tooling)
- **Database**: Oracle Database
- **ORM**: MyBatis 3.x
- **Security**: Spring Security with OAuth 2.0
- **Testing**: JUnit 5, Spring Boot Test
- **Containerization**: Docker
- **Monitoring**: Spring Boot Actuator, Datadog

## Dependencies

### Core Spring Boot Dependencies

```xml
<!-- Spring Boot Starters -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- MyBatis Integration -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>${mybatis-spring-boot.version}</version>
</dependency>
```

### Cvent-Specific Dependencies

```xml
<!-- Cvent Framework Components -->
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
    <artifactId>common-observability</artifactId>
</dependency>

<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-tracing</artifactId>
</dependency>

<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>spring-boot-mybatis</artifactId>
</dependency>
```

### Legacy Service Dependencies

```xml
<!-- Passkey Service Libraries -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-service</artifactId>
    <classifier>lib</classifier>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-housing-library-service</artifactId>
    <classifier>lib</classifier>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-create-hotel-service</artifactId>
    <classifier>lib</classifier>
</dependency>
```

### Database Dependencies

```xml
<!-- Oracle JDBC Driver -->
<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>${ojdbc.version}</version>
</dependency>
```

### Development Dependencies

```xml
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

<!-- Code Generation -->
<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <scope>provided</scope>
</dependency>
```

## Configuration

### Application Configuration

**application.yml** (Base Configuration):
```yaml
spring:
  application:
    name: passkey-hotel
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
  
server:
  port: 8080
  servlet:
    context-path: /

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always

logging:
  level:
    com.cvent.passkeyhotelsb: INFO
    org.springframework.security: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

### Environment-Specific Configuration

**configs/dev.yaml**:
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521:XE
    username: ${DB_USERNAME:passkey_dev}
    password: ${DB_PASSWORD:dev_password}
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000

mybatis:
  mapper-locations: classpath:mybatis/mappers/*.xml
  configuration:
    map-underscore-to-camel-case: true
    default-fetch-size: 100
    default-statement-timeout: 30

cvent:
  oauth:
    enabled: true
    client-id: ${OAUTH_CLIENT_ID}
    client-secret: ${OAUTH_CLIENT_SECRET}
    token-uri: ${OAUTH_TOKEN_URI}
```

### MyBatis Configuration

**MyBatis Mapper Example**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.cvent.passkeyhotelsb.dao.mappers.ECommerceRuleMapper">
    
    <select id="getECommerceRules" resultType="ECommerceRules">
        SELECT 
            event_id,
            hotel_id,
            attendee_type_id,
            base_rate,
            currency,
            tax_rate,
            cancellation_policy,
            modification_policy
        FROM ecommerce_rules 
        WHERE event_id = #{eventId}
          AND hotel_id = #{hotelId}
          AND attendee_type_id = #{attendeeTypeId}
          AND (locale = #{locale} OR locale IS NULL)
        ORDER BY locale DESC NULLS LAST
    </select>
    
</mapper>
```

## Database Schema

### Core Tables

**ecommerce_rules**:
```sql
CREATE TABLE ecommerce_rules (
    id NUMBER(19) PRIMARY KEY,
    event_id NUMBER(19) NOT NULL,
    hotel_id NUMBER(19) NOT NULL,
    attendee_type_id NUMBER(19) NOT NULL,
    locale VARCHAR2(10),
    base_rate NUMBER(10,2),
    currency VARCHAR2(3),
    tax_rate NUMBER(5,4),
    cancellation_policy VARCHAR2(50),
    modification_policy VARCHAR2(50),
    guarantee_policy VARCHAR2(50),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_ecommerce_rules UNIQUE (event_id, hotel_id, attendee_type_id, locale)
);
```

**booking_policies**:
```sql
CREATE TABLE booking_policies (
    id NUMBER(19) PRIMARY KEY,
    ecommerce_rule_id NUMBER(19) NOT NULL,
    cutoff_date TIMESTAMP,
    minimum_stay NUMBER(3),
    maximum_stay NUMBER(3),
    advance_booking_days NUMBER(5),
    CONSTRAINT fk_booking_policies_rule 
        FOREIGN KEY (ecommerce_rule_id) REFERENCES ecommerce_rules(id)
);
```

**payment_rules**:
```sql
CREATE TABLE payment_rules (
    id NUMBER(19) PRIMARY KEY,
    ecommerce_rule_id NUMBER(19) NOT NULL,
    deposit_required NUMBER(1) DEFAULT 0,
    deposit_amount NUMBER(10,2),
    payment_due_date TIMESTAMP,
    accepted_payment_methods VARCHAR2(500),
    CONSTRAINT fk_payment_rules_rule 
        FOREIGN KEY (ecommerce_rule_id) REFERENCES ecommerce_rules(id)
);
```

**tax_structures** (Two-level hierarchy):
```sql
-- Hotel-level default taxes
CREATE TABLE hotel_tax_structures (
    id NUMBER(19) PRIMARY KEY,
    hotel_id NUMBER(19) NOT NULL,
    tax_name VARCHAR2(100),
    tax_rate NUMBER(5,4),
    tax_type VARCHAR2(20), -- 'PERCENTAGE' or 'FLAT'
    CONSTRAINT fk_hotel_tax_hotel 
        FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);

-- Event-level tax overrides (take precedence)
CREATE TABLE event_tax_structures (
    id NUMBER(19) PRIMARY KEY,
    event_id NUMBER(19) NOT NULL,
    hotel_id NUMBER(19) NOT NULL,
    tax_name VARCHAR2(100),
    tax_rate NUMBER(5,4),
    tax_type VARCHAR2(20),
    CONSTRAINT fk_event_tax_event_hotel 
        FOREIGN KEY (event_id, hotel_id) REFERENCES event_hotels(event_id, hotel_id)
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_ecommerce_rules_event ON ecommerce_rules(event_id);
CREATE INDEX idx_ecommerce_rules_hotel ON ecommerce_rules(hotel_id);
CREATE INDEX idx_ecommerce_rules_attendee ON ecommerce_rules(attendee_type_id);
CREATE INDEX idx_ecommerce_rules_composite ON ecommerce_rules(event_id, hotel_id, attendee_type_id);
```

## Build Configuration

### Maven Parent POM

**parent/pom.xml**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>com.cvent</groupId>
        <artifactId>cvent-spring-boot-parent</artifactId>
        <version>2.7.18</version>
    </parent>
    
    <groupId>com.cvent.passkeyhotelsb</groupId>
    <artifactId>passkey-hotel-parent</artifactId>
    <version>2.4.3</version>
    <packaging>pom</packaging>
    
    <properties>
        <java.version>17</java.version>
        <spring-boot.version>2.7.18</spring-boot.version>
        <mybatis-spring-boot.version>2.3.1</mybatis-spring-boot.version>
        <ojdbc.version>21.7.0.0</ojdbc.version>
    </properties>
    
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.cvent.passkeyhotelsb</groupId>
                <artifactId>passkey-hotel-model</artifactId>
                <version>${project.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

### Build Plugins

```xml
<build>
    <plugins>
        <!-- Spring Boot Plugin -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <version>${spring-boot.version}</version>
            <configuration>
                <arguments>
                    <argument>--spring.config.location=configs/dev.yaml</argument>
                </arguments>
            </configuration>
        </plugin>
        
        <!-- Checkstyle Plugin -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-checkstyle-plugin</artifactId>
            <configuration>
                <suppressionsLocation>src/main/resources/checkstyle-suppressions.xml</suppressionsLocation>
            </configuration>
        </plugin>
        
        <!-- JaCoCo Coverage Plugin -->
        <plugin>
            <groupId>org.jacoco</groupId>
            <artifactId>jacoco-maven-plugin</artifactId>
            <executions>
                <execution>
                    <id>jacoco-check</id>
                    <configuration>
                        <excludes>
                            <exclude>com/cvent/passkeyhotelsb/PasskeyHotelSbApplication.class</exclude>
                        </excludes>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

## Monitoring & Logging

### Observability Configuration

**Datadog Integration**:
```yaml
management:
  metrics:
    export:
      datadog:
        enabled: true
        api-key: ${DATADOG_API_KEY}
        application-key: ${DATADOG_APP_KEY}
        step: 30s
        
cvent:
  observability:
    tracing:
      enabled: true
      service-name: passkey-hotel
      sample-rate: 0.1
```

### Logging Configuration

**logback-spring.xml**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
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
        <file>logs/passkey-hotel.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/passkey-hotel.%d{yyyy-MM-dd}.%i.gz</fileNamePattern>
            <maxFileSize>100MB</maxFileSize>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <timestamp/>
                <logLevel/>
                <loggerName/>
                <message/>
                <mdc/>
            </providers>
        </encoder>
    </appender>
    
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
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
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
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
        converter.setJwtGrantedAuthoritiesConverter(jwt -> 
            // Custom authority extraction logic
            extractAuthorities(jwt)
        );
        return converter;
    }
}
```

## Performance Optimization

### Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
```

### Caching Configuration

```java
@Configuration
@EnableCaching
public class CacheConfiguration {
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(10))
            .recordStats());
        return cacheManager;
    }
}
```

## Testing Configuration

### Test Properties

**application-test.yml**:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  jpa:
    hibernate:
      ddl-auto: create-drop
    
logging:
  level:
    com.cvent.passkeyhotelsb: DEBUG
    org.springframework.test: DEBUG
```

### Integration Test Configuration

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "classpath:application-test.yml")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PasskeyHotelSbApplicationTests {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void contextLoads() {
        // Test application context loads successfully
    }
}
```