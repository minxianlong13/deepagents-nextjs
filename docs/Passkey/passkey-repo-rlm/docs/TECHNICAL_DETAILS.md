# Technical Details

## Technology Stack

### Backend Technologies
- **Framework**: Jakarta EE 8 on WildFly 26.1.3
- **Language**: Java 17
- **Build Tool**: Maven 3.8+
- **Application Server**: WildFly 26.1.3.Final
- **Database**: Oracle Database 19c
- **ORM**: JPA 2.2 with Hibernate
- **Web Services**: JAX-RS 2.1
- **Enterprise Beans**: EJB 3.2
- **Security**: Jakarta Security API

### Frontend Technologies
- **Framework**: Next.js 12.3.5
- **Language**: TypeScript 4.9.4
- **Runtime**: Node.js 18+
- **Package Manager**: pnpm 8+
- **Build System**: Nx 19.5.3 (monorepo)
- **UI Library**: React 18.3.1
- **Styling**: CSS Modules, Emotion

### Development Tools
- **Version Control**: Git
- **CI/CD**: Jenkins
- **Code Quality**: SonarQube
- **Testing**: JUnit 5, Jest, Mockito
- **Containerization**: Docker
- **Infrastructure**: AWS CDK

## Dependencies

### Core Java Dependencies

```xml
<!-- Jakarta EE Platform -->
<dependency>
    <groupId>jakarta.platform</groupId>
    <artifactId>jakarta.jakartaee-api</artifactId>
    <version>8.0.0</version>
</dependency>

<!-- WildFly BOM -->
<dependency>
    <groupId>org.wildfly.bom</groupId>
    <artifactId>wildfly-jakartaee8-with-tools</artifactId>
    <version>26.1.3.Final</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>

<!-- Database -->
<dependency>
    <groupId>com.oracle.ojdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>19.3.0.0</version>
</dependency>

<!-- Logging -->
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-slf4j2-impl</artifactId>
    <version>2.22.1</version>
</dependency>

<!-- JSON Processing -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.13.5</version>
</dependency>

<!-- Passkey Integration -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-authentication-java-client</artifactId>
    <version>1.0.75</version>
</dependency>

<!-- Utilities -->
<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.18.0</version>
</dependency>

<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <version>2.10.0</version>
</dependency>
```

### TypeScript Dependencies

```json
{
  "dependencies": {
    "@cvent/nextjs": "1.4.25",
    "@cvent/auth-client": "^4.0.0",
    "@cvent/logging": "1.0.40",
    "@cvent/fetch": "1.0.31",
    "next": "^12.3.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@emotion/react": "^11.9.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/node": "^16.18.11",
    "typescript": "^4.9.4",
    "@cvent/eslint-config": "1.0.33",
    "@cvent/prettier-config": "1.0.29"
  }
}
```

## Configuration

### Environment Variables

#### Application Configuration
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=1521
DB_NAME=ORCL
DB_USERNAME=rlm_user
DB_PASSWORD=${DB_PASSWORD}

# Authentication Service
AUTH_SERVICE_URL=https://auth.passkey.com
AUTH_SERVICE_CLIENT_ID=${AUTH_CLIENT_ID}
AUTH_SERVICE_CLIENT_SECRET=${AUTH_CLIENT_SECRET}

# ClamAV Configuration
CLAMAV_HOST=clamav.passkey.com
CLAMAV_PORT=3310

# Rate Limiting
MAX_CONCURRENT_PROCESSES=3
MAX_ROWS_PER_BATCH=1000
REQUESTS_PER_MINUTE=60

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=xlsx,csv
UPLOAD_TEMP_DIR=/tmp/rlm-uploads

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

#### WildFly Configuration
```xml
<!-- passkey-standalone-full-dev.xml -->
<subsystem xmlns="urn:jboss:domain:datasources:6.0">
    <datasources>
        <datasource jndi-name="java:jboss/datasources/RLMDataSource" 
                   pool-name="RLMDataSource">
            <connection-url>jdbc:oracle:thin:@${DB_HOST}:${DB_PORT}:${DB_NAME}</connection-url>
            <driver>oracle</driver>
            <security>
                <user-name>${DB_USERNAME}</user-name>
                <password>${DB_PASSWORD}</password>
            </security>
        </datasource>
    </datasources>
</subsystem>
```

### Application Properties

#### Core Configuration (`rlm.properties`)
```properties
# Application Settings
app.name=Passkey Room List Manager
app.version=2.0
app.environment=${ENVIRONMENT:dev}

# Rate Limiting
rate.limit.max.concurrent.processes=${MAX_CONCURRENT_PROCESSES:3}
rate.limit.max.rows.per.batch=${MAX_ROWS_PER_BATCH:1000}
rate.limit.requests.per.minute=${REQUESTS_PER_MINUTE:60}

# File Processing
file.upload.max.size=${MAX_FILE_SIZE:10485760}
file.upload.allowed.types=${ALLOWED_FILE_TYPES:xlsx,csv}
file.upload.temp.dir=${UPLOAD_TEMP_DIR:/tmp/rlm-uploads}

# External Services
auth.service.url=${AUTH_SERVICE_URL}
clamav.host=${CLAMAV_HOST}
clamav.port=${CLAMAV_PORT:3310}

# Feature Flags
feature.modification.flow.enabled=true
feature.real.time.updates.enabled=true
feature.malware.scanning.enabled=true
```

## Database Schema

### Core Tables

#### Events Table
```sql
CREATE TABLE events (
    event_id VARCHAR2(50) PRIMARY KEY,
    event_name VARCHAR2(255) NOT NULL,
    hotel_id VARCHAR2(50) NOT NULL,
    hotel_name VARCHAR2(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    organization_id VARCHAR2(50) NOT NULL,
    status VARCHAR2(20) DEFAULT 'ACTIVE',
    rlm_enabled NUMBER(1) DEFAULT 1,
    modification_enabled NUMBER(1) DEFAULT 0,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Room Blocks Table
```sql
CREATE TABLE room_blocks (
    block_id VARCHAR2(50) PRIMARY KEY,
    event_id VARCHAR2(50) NOT NULL,
    room_type_code VARCHAR2(20) NOT NULL,
    room_type_name VARCHAR2(100) NOT NULL,
    total_rooms NUMBER(5) NOT NULL,
    available_rooms NUMBER(5) NOT NULL,
    rate NUMBER(10,2) NOT NULL,
    currency VARCHAR2(3) DEFAULT 'USD',
    block_start_date DATE NOT NULL,
    block_end_date DATE NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);
```

#### Guests Table
```sql
CREATE TABLE guests (
    guest_id VARCHAR2(50) PRIMARY KEY,
    first_name VARCHAR2(100) NOT NULL,
    last_name VARCHAR2(100) NOT NULL,
    email VARCHAR2(255) NOT NULL,
    phone_number VARCHAR2(20),
    company VARCHAR2(255),
    special_requests CLOB,
    vip_status NUMBER(1) DEFAULT 0,
    loyalty_number VARCHAR2(50),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Reservations Table
```sql
CREATE TABLE reservations (
    reservation_id VARCHAR2(50) PRIMARY KEY,
    confirmation_number VARCHAR2(50) UNIQUE,
    event_id VARCHAR2(50) NOT NULL,
    guest_id VARCHAR2(50) NOT NULL,
    room_type_code VARCHAR2(20) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_nights NUMBER(3) NOT NULL,
    rate NUMBER(10,2) NOT NULL,
    total_amount NUMBER(10,2) NOT NULL,
    status VARCHAR2(20) DEFAULT 'PENDING',
    source VARCHAR2(50) DEFAULT 'RLM',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (guest_id) REFERENCES guests(guest_id)
);
```

#### Upload Sessions Table
```sql
CREATE TABLE upload_sessions (
    upload_id VARCHAR2(50) PRIMARY KEY,
    filename VARCHAR2(255) NOT NULL,
    file_size NUMBER(12) NOT NULL,
    file_type VARCHAR2(10) NOT NULL,
    event_id VARCHAR2(50) NOT NULL,
    uploaded_by VARCHAR2(100) NOT NULL,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR2(20) DEFAULT 'UPLOADED',
    process_type VARCHAR2(20) NOT NULL,
    total_rows NUMBER(8),
    processed_rows NUMBER(8) DEFAULT 0,
    successful_rows NUMBER(8) DEFAULT 0,
    error_rows NUMBER(8) DEFAULT 0,
    start_time TIMESTAMP,
    completion_time TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_reservations_event_id ON reservations(event_id);
CREATE INDEX idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_upload_sessions_event_id ON upload_sessions(event_id);
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX idx_guests_email ON guests(email);
```

## Monitoring & Logging

### Application Logging

#### Log4j2 Configuration (`log4j2.xml`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN">
    <Appenders>
        <Console name="Console" target="SYSTEM_OUT">
            <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </Console>
        
        <RollingFile name="FileAppender" fileName="logs/rlm.log"
                     filePattern="logs/rlm-%d{yyyy-MM-dd}-%i.log.gz">
            <PatternLayout>
                <Pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n</Pattern>
            </PatternLayout>
            <Policies>
                <TimeBasedTriggeringPolicy />
                <SizeBasedTriggeringPolicy size="100 MB"/>
            </Policies>
        </RollingFile>
    </Appenders>
    
    <Loggers>
        <Logger name="com.lanyon.group" level="DEBUG"/>
        <Logger name="com.passkey.rlm" level="DEBUG"/>
        <Logger name="org.hibernate" level="WARN"/>
        <Root level="INFO">
            <AppenderRef ref="Console"/>
            <AppenderRef ref="FileAppender"/>
        </Root>
    </Loggers>
</Configuration>
```

### Metrics and Monitoring

#### Datadog Integration
```java
@Stateless
public class MetricsService {
    
    @Inject
    private StatsDClient statsd;
    
    public void recordFileUpload(String eventId, long fileSize) {
        statsd.increment("rlm.file.upload", 
            "event_id:" + eventId,
            "file_size_mb:" + (fileSize / 1024 / 1024));
    }
    
    public void recordProcessingTime(String uploadId, long durationMs) {
        statsd.histogram("rlm.processing.duration", durationMs,
            "upload_id:" + uploadId);
    }
    
    public void recordError(String errorType, String component) {
        statsd.increment("rlm.error",
            "error_type:" + errorType,
            "component:" + component);
    }
}
```

### Health Checks

#### Application Health Endpoint
```java
@Path("/health")
@Produces(MediaType.APPLICATION_JSON)
public class HealthResource {
    
    @Inject
    private DatabaseHealthCheck dbHealth;
    
    @Inject
    private ExternalServiceHealthCheck serviceHealth;
    
    @GET
    public Response getHealth() {
        HealthStatus status = HealthStatus.builder()
            .database(dbHealth.check())
            .authService(serviceHealth.checkAuthService())
            .clamav(serviceHealth.checkClamAV())
            .build();
            
        return Response.ok(status).build();
    }
}
```

## Performance Optimization

### Database Optimization
- **Connection Pooling**: HikariCP with optimized pool settings
- **Query Optimization**: Indexed queries and prepared statements
- **Batch Processing**: Bulk inserts for large datasets
- **Read Replicas**: Separate read/write database connections

### Caching Strategy
- **Application Cache**: EHCache for frequently accessed data
- **Database Cache**: Oracle result cache for expensive queries
- **CDN**: CloudFront for static assets

### Asynchronous Processing
```java
@Asynchronous
@Stateless
public class FileProcessingService {
    
    public Future<ProcessingResult> processFileAsync(String uploadId) {
        // Long-running file processing
        ProcessingResult result = processFile(uploadId);
        return new AsyncResult<>(result);
    }
}
```

## Security Configuration

### Authentication Integration
```java
@WebFilter("/*")
public class AuthenticationFilter implements Filter {
    
    @Inject
    private PasskeyAuthClient authClient;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String sessionToken = extractSessionToken(httpRequest);
        
        if (authClient.validateSession(sessionToken)) {
            chain.doFilter(request, response);
        } else {
            ((HttpServletResponse) response).sendError(401, "Unauthorized");
        }
    }
}
```

### CSRF Protection
```xml
<!-- web.xml -->
<filter>
    <filter-name>CSRFGuard</filter-name>
    <filter-class>org.owasp.csrfguard.CsrfGuardFilter</filter-class>
</filter>
<filter-mapping>
    <filter-name>CSRFGuard</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```

## Build Configuration

### Maven Build Profiles
```xml
<profiles>
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <environment>dev</environment>
            <log.level>DEBUG</log.level>
        </properties>
    </profile>
    
    <profile>
        <id>prod</id>
        <properties>
            <environment>prod</environment>
            <log.level>INFO</log.level>
        </properties>
    </profile>
</profiles>
```

### Docker Configuration
```dockerfile
FROM openjdk:17-jre-slim

# Install WildFly
RUN wget https://github.com/wildfly/wildfly/releases/download/26.1.3.Final/wildfly-26.1.3.Final.tar.gz \
    && tar -xzf wildfly-26.1.3.Final.tar.gz \
    && mv wildfly-26.1.3.Final /opt/wildfly

# Copy application
COPY target/rlm-all.ear /opt/wildfly/standalone/deployments/

# Copy configuration
COPY docker/standalone.xml /opt/wildfly/standalone/configuration/

EXPOSE 8080 8443 9990

CMD ["/opt/wildfly/bin/standalone.sh", "-b", "0.0.0.0", "-bmanagement", "0.0.0.0"]
```