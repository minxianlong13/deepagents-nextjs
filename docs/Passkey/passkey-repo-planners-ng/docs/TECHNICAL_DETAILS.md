# Technical Details

## Technology Stack

### Backend Framework
- **Spring Framework**: 5.3.34
  - Spring MVC for web layer
  - Spring Security for authentication/authorization
  - Spring JDBC for data access
  - Spring AOP for cross-cutting concerns

### Application Server
- **WildFly**: 26.1.3.Final
  - Jakarta EE 8 platform
  - Full-featured application server
  - Clustering and high availability support

### Programming Language
- **Java**: 17 (LTS)
  - Modern Java features and performance improvements
  - Enhanced security and memory management
  - Improved garbage collection

### Build Tools
- **Maven**: 3.x for Java build management
- **pnpm**: For frontend dependency management
- **Changesets**: For version management and releases

### Frontend Technologies
- **JSP**: JavaServer Pages for dynamic content
- **Apache Tiles**: 3.0.8 for page composition and templating
- **JavaScript**: Client-side interactivity
- **CSS**: Styling and responsive design
- **jQuery**: DOM manipulation and AJAX

### Database
- **Oracle Database**: Primary data storage
- **Connection Pooling**: C3P0 0.9.5.4 for efficient database connections
- **JDBC**: Oracle JDBC driver 19.3.0.0

### Security
- **Spring Security**: 5.8.16 for comprehensive security
- **OWASP Encoder**: 1.3.1 for XSS prevention
- **ClamAV**: 0.3 for malware scanning
- **SSL/TLS**: Encrypted communication

---

## Key Dependencies

### Core Dependencies

```xml
<!-- Spring Framework -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
    <version>5.3.34</version>
</dependency>

<!-- Spring Security -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-web</artifactId>
    <version>5.8.16</version>
</dependency>

<!-- Jakarta EE -->
<dependency>
    <groupId>jakarta.platform</groupId>
    <artifactId>jakarta.jakartaee-bom</artifactId>
    <version>8.0.0</version>
</dependency>
```

### External Service Clients

```xml
<!-- Passkey Authentication -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-authentication-java-client</artifactId>
    <version>1.0.117</version>
</dependency>

<!-- Passkey Services -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-planners-java-client</artifactId>
    <version>1.0.64</version>
</dependency>

<!-- Auth Service -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-java-client</artifactId>
    <version>10.0.10</version>
</dependency>
```

### Utility Libraries

```xml
<!-- Apache Commons -->
<dependency>
    <groupId>commons-fileupload</groupId>
    <artifactId>commons-fileupload</artifactId>
    <version>1.6.0</version>
</dependency>

<!-- Apache POI for Excel -->
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.4.1</version>
</dependency>

<!-- Jackson for JSON -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.17.3</version>
</dependency>
```

### AWS Integration

```xml
<!-- AWS SDK -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.31.59</version>
</dependency>
```

---

## Configuration

### Application Configuration

The application uses multiple configuration sources:

1. **Environment-specific properties**: Managed through Hogan-configs
2. **Spring configuration**: XML-based Spring context configuration
3. **WildFly configuration**: Server-specific settings in standalone XML
4. **Maven properties**: Build-time configuration in pom.xml

### Key Configuration Files

- `src/main/resources/applicationContext.xml`: Spring application context
- `src/main/resources/spring-security.xml`: Security configuration
- `src/main/resources/plannerPortal.properties`: Application properties
- `wildfly/standalone/configuration/passkey-standalone-full-{env}.xml`: WildFly configuration

### Environment Variables

```bash
# Database Configuration
DB_HOST=database.example.com
DB_PORT=1521
DB_NAME=passkey
DB_USERNAME=planner_user
DB_PASSWORD=${DB.LIVEDS.PASSWORD}

# External Services
AUTH_SERVICE_URL=https://auth.passkey.com
REPORTING_SERVICE_URL=https://reporting.passkey.com

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=passkey-planner-files

# Application Settings
SESSION_TIMEOUT=1800
MAX_FILE_SIZE=10485760
MALWARE_SCAN_ENABLED=true
```

### Security Configuration

```xml
<!-- Spring Security Configuration -->
<security:http auto-config="true" use-expressions="true">
    <security:intercept-url pattern="/login" access="permitAll"/>
    <security:intercept-url pattern="/health" access="permitAll"/>
    <security:intercept-url pattern="/admin/**" access="hasRole('ADMIN')"/>
    <security:intercept-url pattern="/**" access="isAuthenticated()"/>
    
    <security:form-login login-page="/login"
                        default-target-url="/portal/dashboard"
                        authentication-failure-url="/login?error=true"/>
    
    <security:logout logout-success-url="/login?logout=true"/>
    
    <security:session-management session-fixation-protection="migrateSession">
        <security:concurrency-control max-sessions="1" 
                                    expired-url="/login?expired=true"/>
    </security:session-management>
</security:http>
```

---

## Database Schema

### Primary Tables

```sql
-- Events table
CREATE TABLE events (
    event_id VARCHAR2(50) PRIMARY KEY,
    event_name VARCHAR2(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR2(255),
    expected_attendees NUMBER,
    status VARCHAR2(20) DEFAULT 'ACTIVE',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    planner_id VARCHAR2(50) NOT NULL
);

-- Reservations table
CREATE TABLE reservations (
    reservation_id VARCHAR2(50) PRIMARY KEY,
    event_id VARCHAR2(50) NOT NULL,
    hotel_id VARCHAR2(50) NOT NULL,
    room_type VARCHAR2(50),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_count NUMBER NOT NULL,
    rate NUMBER(10,2),
    status VARCHAR2(20) DEFAULT 'PENDING',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- Hotels table
CREATE TABLE hotels (
    hotel_id VARCHAR2(50) PRIMARY KEY,
    hotel_name VARCHAR2(255) NOT NULL,
    address VARCHAR2(500),
    city VARCHAR2(100),
    state VARCHAR2(50),
    country VARCHAR2(50),
    phone VARCHAR2(20),
    star_rating NUMBER(1),
    is_active NUMBER(1) DEFAULT 1
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_events_planner ON events(planner_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_reservations_event ON reservations(event_id);
CREATE INDEX idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
```

---

## Caching Strategy

### EhCache Configuration

```xml
<ehcache xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="ehcache.xsd">
    
    <!-- Default cache configuration -->
    <defaultCache maxElementsInMemory="1000"
                  eternal="false"
                  timeToIdleSeconds="300"
                  timeToLiveSeconds="600"
                  overflowToDisk="false"/>
    
    <!-- Hotel data cache -->
    <cache name="hotelCache"
           maxElementsInMemory="500"
           eternal="false"
           timeToIdleSeconds="1800"
           timeToLiveSeconds="3600"/>
    
    <!-- User session cache -->
    <cache name="userCache"
           maxElementsInMemory="1000"
           eternal="false"
           timeToIdleSeconds="900"
           timeToLiveSeconds="1800"/>
</ehcache>
```

### Cache Usage Patterns

- **Hotel Data**: Cached for 1 hour due to infrequent changes
- **User Sessions**: Cached for 30 minutes with idle timeout
- **Report Data**: Cached for 15 minutes for frequently accessed reports
- **Configuration**: Cached until application restart

---

## Logging Configuration

### SLF4J with Logback

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/planner-portal.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/planner-portal.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.passkey" level="DEBUG"/>
    <logger name="org.springframework.security" level="INFO"/>
    <logger name="org.springframework.web" level="INFO"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

---

## Performance Optimization

### Connection Pooling

```xml
<!-- C3P0 Configuration -->
<bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">
    <property name="driverClass" value="oracle.jdbc.OracleDriver"/>
    <property name="jdbcUrl" value="${database.url}"/>
    <property name="user" value="${database.username}"/>
    <property name="password" value="${database.password}"/>
    
    <!-- Pool sizing -->
    <property name="minPoolSize" value="5"/>
    <property name="maxPoolSize" value="20"/>
    <property name="initialPoolSize" value="5"/>
    
    <!-- Connection management -->
    <property name="maxIdleTime" value="1800"/>
    <property name="idleConnectionTestPeriod" value="300"/>
    <property name="testConnectionOnCheckout" value="true"/>
    <property name="preferredTestQuery" value="SELECT 1 FROM DUAL"/>
</bean>
```

### JVM Tuning

```bash
# WildFly JVM Options
-Xms2g
-Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+UseStringDeduplication
-XX:+OptimizeStringConcat
```

---

## Monitoring and Observability

### Health Check Endpoints

```java
@RequestMapping("/health")
public class HealthCheckController {
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", Instant.now());
        status.put("version", getClass().getPackage().getImplementationVersion());
        
        // Check database connectivity
        status.put("database", checkDatabaseHealth());
        
        // Check external services
        status.put("externalServices", checkExternalServices());
        
        return ResponseEntity.ok(status);
    }
}
```

### Metrics Collection

- **Application Metrics**: Response times, error rates, throughput
- **JVM Metrics**: Memory usage, garbage collection, thread counts
- **Database Metrics**: Connection pool usage, query performance
- **Business Metrics**: Event creation rates, reservation volumes

### Datadog Integration

```java
// Custom metrics
@Component
public class MetricsService {
    
    private final StatsDClient statsd;
    
    public void recordEventCreation() {
        statsd.increment("planner.events.created");
    }
    
    public void recordReservationTime(long duration) {
        statsd.recordExecutionTime("planner.reservation.duration", duration);
    }
}
```

---

## Testing Configuration

### Test Dependencies

```xml
<!-- JUnit -->
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
</dependency>

<!-- Mockito -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>4.2.0</version>
    <scope>test</scope>
</dependency>

<!-- Spring Test -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-test</artifactId>
    <scope>test</scope>
</dependency>
```

### Test Configuration

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath:test-applicationContext.xml"})
@WebAppConfiguration
public class BaseControllerTest {
    
    @Autowired
    protected WebApplicationContext wac;
    
    protected MockMvc mockMvc;
    
    @Before
    public void setup() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.wac).build();
    }
}
```

---

## Build Configuration

### Maven Profiles

```xml
<profiles>
    <profile>
        <id>development</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <environment>dev</environment>
            <log.level>DEBUG</log.level>
        </properties>
    </profile>
    
    <profile>
        <id>production</id>
        <properties>
            <environment>prod</environment>
            <log.level>INFO</log.level>
        </properties>
    </profile>
</profiles>
```

### Build Plugins

```xml
<!-- Compiler Plugin -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.13.0</version>
    <configuration>
        <release>17</release>
        <encoding>UTF-8</encoding>
    </configuration>
</plugin>

<!-- Surefire Plugin for Tests -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.5.2</version>
    <configuration>
        <reuseForks>true</reuseForks>
    </configuration>
</plugin>

<!-- JaCoCo for Coverage -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
</plugin>
```