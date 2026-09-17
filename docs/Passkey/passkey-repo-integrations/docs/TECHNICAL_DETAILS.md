# Technical Details

## Technology Stack

### Core Framework
- **Language**: Java 17 (LTS)
- **Application Server**: Wildfly (JBoss EAP)
- **Build Tool**: Maven 3.6+
- **Package Manager**: pnpm (for Node.js tooling)
- **Monorepo Tool**: Nx (for build orchestration)

### Java Enterprise Technologies
- **JAX-RS**: RESTful web services (Jersey implementation)
- **EJB 3.2**: Enterprise Java Beans for business logic
- **JPA 2.2**: Java Persistence API for data access
- **CDI 2.0**: Contexts and Dependency Injection
- **Bean Validation**: JSR-303 validation framework

### Development Tools
- **Version Manager**: asdf (for Java, Node.js versions)
- **Code Quality**: SonarQube integration
- **Dependency Management**: Renovate for automated updates
- **Change Management**: Changesets for version control

## Dependencies

### Core Java Dependencies
```xml
<!-- Enterprise APIs -->
<dependency>
    <groupId>javax.enterprise</groupId>
    <artifactId>cdi-api</artifactId>
    <version>2.0</version>
</dependency>

<dependency>
    <groupId>javax.ws.rs</groupId>
    <artifactId>javax.ws.rs-api</artifactId>
    <version>2.1.1</version>
</dependency>

<dependency>
    <groupId>javax.ejb</groupId>
    <artifactId>javax.ejb-api</artifactId>
    <version>3.2.2</version>
</dependency>

<!-- JSON Processing -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.2</version>
</dependency>

<!-- HTTP Client -->
<dependency>
    <groupId>org.apache.httpcomponents</groupId>
    <artifactId>httpclient</artifactId>
    <version>4.5.14</version>
</dependency>

<!-- Logging -->
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-core</artifactId>
    <version>2.20.0</version>
</dependency>
```

### External Service Integrations
- **LaunchDarkly SDK**: Feature flag management
- **Datadog APM**: Application performance monitoring
- **AWS SDK**: Cloud service integrations
- **Cvent Authentication**: Internal auth service client
- **Payment Gateway SDKs**: PBB and other payment processors

### Development Dependencies
```json
{
  "devDependencies": {
    "@nx/workspace": "^17.0.0",
    "@changesets/cli": "^2.26.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.0",
    "typescript": "^5.2.0"
  }
}
```

## Configuration

### Environment Variables

#### Database Configuration
```properties
# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=passkey_integrations
DB_USERNAME=passkey_user
DB_PASSWORD=${DB_PASSWORD}
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
```

#### Service URLs
```properties
# Internal Services
AUTH_SERVICE_URL=https://auth.passkey.com
VENDOR_SERVICE_URL=https://vendor.passkey.com
TRANSFER_LOG_SERVICE_URL=https://transfer-log.passkey.com
EVENT_SERVICE_URL=https://events.passkey.com

# External Services
AMADEUS_API_URL=https://api.amadeus.com
PBB_GATEWAY_URL=https://gateway.pbb.com
LAUNCHDARKLY_SDK_KEY=${LD_SDK_KEY}
```

#### Application Settings
```properties
# Server Configuration
SERVER_PORT=8080
CONTEXT_PATH=/passkey-integrations
MAX_THREADS=200
CONNECTION_TIMEOUT=60000

# Feature Flags
FEATURE_FLAGS_ENABLED=true
LOCAL_FEATURE_FLAGS=false

# Email Configuration
SMTP_HOST=smtp.cvent.com
SMTP_PORT=587
SMTP_USERNAME=${SMTP_USER}
SMTP_PASSWORD=${SMTP_PASS}
```

### Configuration Files

#### Maven Configuration (pom.xml)
```xml
<properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <wildfly.version>27.0.1.Final</wildfly.version>
    <jackson.version>2.15.2</jackson.version>
</properties>
```

#### Logging Configuration (log4j2.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN">
    <Appenders>
        <Console name="Console" target="SYSTEM_OUT">
            <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </Console>
        <File name="FileAppender" fileName="logs/passkey-integrations.log">
            <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </File>
    </Appenders>
    <Loggers>
        <Logger name="com.passkey" level="DEBUG"/>
        <Root level="INFO">
            <AppenderRef ref="Console"/>
            <AppenderRef ref="FileAppender"/>
        </Root>
    </Loggers>
</Configuration>
```

## Database Schema

### Connection Configuration
- **Database**: PostgreSQL 13+
- **Connection Pool**: HikariCP
- **ORM**: JPA/Hibernate
- **Migration**: Flyway (if applicable)

### Key Tables
```sql
-- Hotels
CREATE TABLE hotels (
    hotel_id VARCHAR(50) PRIMARY KEY,
    hotel_name VARCHAR(255) NOT NULL,
    hotel_code VARCHAR(20) UNIQUE,
    address JSONB,
    contact_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations
CREATE TABLE reservations (
    reservation_id VARCHAR(50) PRIMARY KEY,
    confirmation_number VARCHAR(20) UNIQUE NOT NULL,
    hotel_id VARCHAR(50) REFERENCES hotels(hotel_id),
    guest_name VARCHAR(255) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    room_type VARCHAR(50),
    rate DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group Bookings
CREATE TABLE group_bookings (
    group_id VARCHAR(50) PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    hotel_id VARCHAR(50) REFERENCES hotels(hotel_id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_rooms INTEGER NOT NULL,
    blocked_rooms INTEGER DEFAULT 0,
    rate_code VARCHAR(20),
    status VARCHAR(20) DEFAULT 'TENTATIVE',
    contact_info JSONB,
    cutoff_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfers
CREATE TABLE transfers (
    transfer_id VARCHAR(50) PRIMARY KEY,
    source_system VARCHAR(100),
    target_system VARCHAR(100),
    transfer_type VARCHAR(50),
    original_data TEXT,
    transformed_data TEXT,
    status VARCHAR(20) DEFAULT 'RECEIVED',
    errors JSONB,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Monitoring & Logging

### Application Performance Monitoring
- **Datadog APM**: Distributed tracing and performance metrics
- **Custom Metrics**: Business-specific KPIs and counters
- **Health Checks**: Application readiness and liveness probes
- **JVM Metrics**: Memory usage, garbage collection, thread pools

### Logging Strategy
```java
// Structured logging example
@Slf4j
public class ReservationService {
    
    public Reservation createReservation(ReservationRequest request) {
        MDC.put("operation", "createReservation");
        MDC.put("hotelId", request.getHotelId());
        
        log.info("Creating reservation for hotel: {}", request.getHotelId());
        
        try {
            Reservation reservation = processReservation(request);
            log.info("Reservation created successfully: {}", reservation.getId());
            return reservation;
        } catch (Exception e) {
            log.error("Failed to create reservation", e);
            throw e;
        } finally {
            MDC.clear();
        }
    }
}
```

### Log Levels and Categories
- **ERROR**: System errors, exceptions, failed operations
- **WARN**: Deprecated features, configuration issues, retries
- **INFO**: Business events, successful operations, state changes
- **DEBUG**: Detailed execution flow, parameter values
- **TRACE**: Fine-grained debugging information

## Security Configuration

### Authentication & Authorization
```java
// JWT Token Validation
@Provider
@PreMatching
public class AuthenticationFilter implements ContainerRequestFilter {
    
    @Override
    public void filter(ContainerRequestContext requestContext) {
        String authHeader = requestContext.getHeaderString("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            validateJwtToken(token);
        } else {
            throw new NotAuthorizedException("Bearer token required");
        }
    }
}
```

### Data Encryption
- **At Rest**: Database encryption for sensitive fields
- **In Transit**: TLS 1.3 for all HTTP communications
- **PCI Compliance**: Tokenization for payment card data
- **Key Management**: AWS KMS or similar for key rotation

### Security Headers
```java
// Security headers configuration
@Provider
public class SecurityHeadersFilter implements ContainerResponseFilter {
    
    @Override
    public void filter(ContainerRequestContext requestContext, 
                      ContainerResponseContext responseContext) {
        responseContext.getHeaders().add("X-Content-Type-Options", "nosniff");
        responseContext.getHeaders().add("X-Frame-Options", "DENY");
        responseContext.getHeaders().add("X-XSS-Protection", "1; mode=block");
        responseContext.getHeaders().add("Strict-Transport-Security", 
                                       "max-age=31536000; includeSubDomains");
    }
}
```

## Performance Optimization

### Connection Pooling
```xml
<!-- Wildfly datasource configuration -->
<datasource jndi-name="java:jboss/datasources/PasskeyDS" pool-name="PasskeyDS">
    <connection-url>jdbc:postgresql://localhost:5432/passkey</connection-url>
    <driver>postgresql</driver>
    <pool>
        <min-pool-size>10</min-pool-size>
        <max-pool-size>50</max-pool-size>
        <prefill>true</prefill>
    </pool>
    <timeout>
        <idle-timeout-minutes>5</idle-timeout-minutes>
        <query-timeout>300</query-timeout>
    </timeout>
</datasource>
```

### Caching Strategy
```java
// JPA Second-Level Cache
@Entity
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Hotel {
    // Entity implementation
}

// Application-level caching
@Service
public class HotelService {
    
    @Cacheable(value = "hotels", key = "#hotelId")
    public Hotel findById(String hotelId) {
        return hotelRepository.findById(hotelId);
    }
}
```

### Asynchronous Processing
```java
// Async email processing
@Asynchronous
@Stateless
public class EmailService {
    
    public Future<Void> sendConfirmationEmail(String recipient, 
                                            Map<String, Object> data) {
        // Email sending logic
        return new AsyncResult<>(null);
    }
}
```

## Build and Deployment

### Maven Build Profiles
```xml
<profiles>
    <profile>
        <id>development</id>
        <properties>
            <env>dev</env>
            <log.level>DEBUG</log.level>
        </properties>
    </profile>
    <profile>
        <id>production</id>
        <properties>
            <env>prod</env>
            <log.level>INFO</log.level>
        </properties>
    </profile>
</profiles>
```

### Docker Configuration
```dockerfile
FROM registry.redhat.io/ubi8/openjdk-17:latest

COPY target/passkey-api.ear /opt/jboss/wildfly/standalone/deployments/
COPY target/passkey-gl.ear /opt/jboss/wildfly/standalone/deployments/

EXPOSE 8080 9990

CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-b", "0.0.0.0"]
```

### Health Checks
```java
// Application health endpoint
@Path("/health")
public class HealthResource {
    
    @GET
    @Path("/ready")
    public Response readiness() {
        // Check database connectivity, external services
        return Response.ok().build();
    }
    
    @GET
    @Path("/live")
    public Response liveness() {
        // Basic application health check
        return Response.ok().build();
    }
}
```