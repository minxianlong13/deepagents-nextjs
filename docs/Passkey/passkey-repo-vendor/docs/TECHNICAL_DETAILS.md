# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 21
- **Build Tool**: Maven 3.6+
- **Parent POM**: Cvent Maven Parent 57.4.8

### Web Layer
- **REST Framework**: JAX-RS (Jersey implementation)
- **JSON Processing**: Jackson 2.x
- **API Documentation**: RAML 1.0
- **Authentication**: Cvent Auth Service integration
- **Validation**: Jakarta Bean Validation

### Data Layer
- **ORM**: MyBatis 3.x
- **Database**: PostgreSQL (inferred from typical Cvent stack)
- **Connection Pooling**: HikariCP (via Dropwizard)
- **Migrations**: Flyway (typical for Cvent services)

### Observability & Monitoring
- **Metrics**: Dropwizard Metrics
- **Logging**: SLF4J with Logback
- **APM**: Datadog integration
- **Health Checks**: Dropwizard health checks

### Testing
- **Unit Testing**: JUnit 5
- **Integration Testing**: Karate DSL
- **Test Coverage**: JaCoCo
- **Mocking**: Mockito

### Containerization
- **Runtime**: Docker containers
- **Base Image**: Cvent JRE 11.0.4.11
- **Registry**: docker.cvent.net

## Dependencies

### Core Dependencies (from pom.xml)

#### Cvent Internal Libraries
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.12</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey-transfer-log</groupId>
    <artifactId>passkey-transfer-log-java-client</artifactId>
    <version>1.10.3</version>
</dependency>

<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>28.4.1</version>
</dependency>

<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
    <version>28.4.1</version>
</dependency>
```

#### External Libraries
- **Immutables**: Code generation for immutable objects
- **Jackson**: JSON serialization/deserialization
- **Jakarta Validation**: Bean validation
- **SLF4J**: Logging facade
- **Apache Commons Lang**: Utility functions

### Development Dependencies
- **Maven Surefire**: Unit test execution
- **Maven Failsafe**: Integration test execution
- **JaCoCo**: Code coverage reporting
- **Checkstyle**: Code style enforcement
- **SpotBugs**: Static code analysis

## Configuration

### Environment Configuration Files
The service uses YAML configuration files located in `passkey-vendor-service/configs/`:

- `dev.yaml`: Development environment
- `test.yaml`: Testing environment  
- `staging.yaml`: Staging environment
- `production.yaml`: Production environment

### Configuration Structure
```yaml
# Server configuration
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

# Database configuration
database:
  driverClass: org.postgresql.Driver
  url: jdbc:postgresql://localhost:5432/passkey_vendor
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
  minSize: 8
  maxSize: 32

# Logging configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkey.vendor: DEBUG
  appenders:
    - type: console
    - type: file
      currentLogFilename: ./logs/passkey-vendor-service.log
      archivedLogFilenamePattern: ./logs/passkey-vendor-service-%d.log.gz

# Auth service configuration
auth:
  serviceUrl: ${AUTH_SERVICE_URL}
  timeout: 30s
  
# Metrics configuration
metrics:
  reporters:
    - type: datadog
      host: ${DATADOG_HOST}
      tags:
        - service:passkey-vendor-service
        - environment:${ENVIRONMENT}
```

### Environment Variables
Key environment variables used by the service:

- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `AUTH_SERVICE_URL`: Auth service endpoint
- `DATADOG_HOST`: Datadog metrics endpoint
- `ENVIRONMENT`: Current environment (dev/staging/prod)
- `LOG_LEVEL`: Logging level override

## Database Schema

### Core Tables

#### vendors
```sql
CREATE TABLE vendors (
    vendor_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### vendor_systems
```sql
CREATE TABLE vendor_systems (
    vendor_system_id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),
    name VARCHAR(255) NOT NULL,
    authorized_partner_id BIGINT,
    outbound_transporter_type_id INTEGER,
    outbound_transporter_class VARCHAR(500) NOT NULL,
    outbound_transfer_type_id INTEGER,
    inbound_transfer_type_id INTEGER,
    ari_transfer_type_id INTEGER,
    outbound_batch_size INTEGER,
    outbound_max_retries INTEGER NOT NULL DEFAULT 3,
    outbound_retry_interval INTEGER NOT NULL DEFAULT 300,
    split_folio_group INTEGER,
    contact_email VARCHAR(500),
    timed_out_retry BOOLEAN DEFAULT true,
    unable_to_connect_retry BOOLEAN DEFAULT true,
    transporter_failure_retry BOOLEAN DEFAULT false,
    internal_error_retry BOOLEAN DEFAULT true,
    other_rejections_retry BOOLEAN DEFAULT false,
    gml_enabled BOOLEAN DEFAULT false,
    outbound_reservation_timeout_interval INTEGER NOT NULL DEFAULT 30,
    outbound_suspended BOOLEAN DEFAULT false,
    inbound_suspended BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### hotel_connectors
```sql
CREATE TABLE hotel_connectors (
    hotel_connector_id BIGSERIAL PRIMARY KEY,
    vendor_system_id BIGINT REFERENCES vendor_systems(vendor_system_id),
    hotel_id BIGINT NOT NULL,
    chain_code VARCHAR(50),
    hotel_code VARCHAR(50),
    brand_code VARCHAR(50),
    gl_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### transporter_parameters
```sql
CREATE TABLE transporter_parameters (
    parameter_id BIGSERIAL PRIMARY KEY,
    vendor_system_id BIGINT NOT NULL REFERENCES vendor_systems(vendor_system_id),
    name VARCHAR(255) NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### message_types
```sql
CREATE TABLE message_types (
    message_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### partner_message_types
```sql
CREATE TABLE partner_message_types (
    partner_message_type_id SERIAL PRIMARY KEY,
    partner_id BIGINT NOT NULL,
    message_type_id INTEGER NOT NULL REFERENCES message_types(message_type_id),
    enabled BOOLEAN DEFAULT true,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_vendor_systems_vendor_id ON vendor_systems(vendor_id);
CREATE INDEX idx_hotel_connectors_hotel_id ON hotel_connectors(hotel_id);
CREATE INDEX idx_hotel_connectors_vendor_system_id ON hotel_connectors(vendor_system_id);
CREATE INDEX idx_transporter_parameters_vendor_system_id ON transporter_parameters(vendor_system_id);
CREATE INDEX idx_partner_message_types_partner_id ON partner_message_types(partner_id);

-- Search indexes
CREATE INDEX idx_hotel_connectors_codes ON hotel_connectors(chain_code, hotel_code, brand_code);
CREATE INDEX idx_vendor_systems_name ON vendor_systems(name);
```

## Build Configuration

### Maven Profiles

#### Default Profile
```xml
<profile>
    <id>default</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <properties>
        <skipITs>true</skipITs>
        <skipLoadTests>true</skipLoadTests>
    </properties>
    <modules>
        <module>passkey-vendor-api</module>
        <module>passkey-vendor-data-access</module>
        <module>passkey-vendor-java-client</module>
        <module>passkey-vendor-service</module>
        <module>passkey-vendor-integration-test</module>
    </modules>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <checkstyle.skip>true</checkstyle.skip>
        <skipITs>false</skipITs>
        <skipTests>true</skipTests>
        <skipLoadTests>true</skipLoadTests>
    </properties>
    <modules>
        <module>passkey-vendor-api</module>
        <module>passkey-vendor-java-client</module>
        <module>passkey-vendor-integration-test</module>
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
                        <goals>
                            <goal>prepare-agent</goal>
                        </goals>
                    </execution>
                    <execution>
                        <id>report</id>
                        <phase>test</phase>
                        <goals>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</profile>
```

### Build Commands
```bash
# Standard build
mvn clean package

# Release build
mvn clean package -Prelease

# Build with coverage
mvn clean package -Pcoverage

# Run integration tests
mvn clean verify -Prun-it -Dkarate.env=dev

# Generate coverage report
mvn jacoco:report -Pcoverage
```

## Monitoring & Logging

### Metrics Collection
The service exposes metrics via Dropwizard Metrics:

- **JVM Metrics**: Memory usage, garbage collection, thread pools
- **HTTP Metrics**: Request rates, response times, error rates
- **Database Metrics**: Connection pool usage, query performance
- **Custom Metrics**: Business-specific counters and timers

### Health Checks
Available health checks:
- **Database Connectivity**: Validates database connection
- **Auth Service**: Checks auth service availability
- **Disk Space**: Monitors available disk space
- **Memory Usage**: Tracks JVM memory consumption

### Logging Configuration
- **Format**: JSON structured logging for production
- **Levels**: Configurable per package/class
- **Rotation**: Daily log rotation with compression
- **Correlation IDs**: Request tracing across service boundaries

### Datadog Integration
Metrics are sent to Datadog with tags:
- `service:passkey-vendor-service`
- `environment:{env}`
- `version:{version}`
- `instance:{instance-id}`

## Security

### Authentication
- **API Key Authentication**: Via Authorization header
- **JWT Token Validation**: For service-to-service communication
- **Role-Based Access Control**: Method-level security annotations

### Input Validation
- **Bean Validation**: Jakarta validation annotations
- **SQL Injection Prevention**: Parameterized queries via MyBatis
- **XSS Protection**: Input sanitization and output encoding

### Secrets Management
- **Environment Variables**: For database credentials
- **Encrypted Configuration**: For sensitive transporter parameters
- **Key Rotation**: Support for credential rotation without downtime

## Performance Considerations

### Database Optimization
- **Connection Pooling**: HikariCP with optimized settings
- **Query Optimization**: Indexed columns for common searches
- **Batch Operations**: Bulk insert/update capabilities
- **Read Replicas**: Support for read-only database replicas

### Caching Strategy
- **Application-Level Caching**: In-memory caching for frequently accessed data
- **Database Query Caching**: MyBatis second-level cache
- **HTTP Caching**: ETags and cache headers for appropriate endpoints

### Scalability
- **Stateless Design**: No server-side session state
- **Horizontal Scaling**: Multiple service instances behind load balancer
- **Resource Limits**: Configured memory and CPU limits
- **Circuit Breakers**: Protection against cascading failures

## Development Tools

### Code Quality
- **Checkstyle**: Enforces coding standards
- **SpotBugs**: Static analysis for bug detection
- **SonarQube**: Code quality and security analysis
- **Dependency Check**: Vulnerability scanning

### IDE Support
- **IntelliJ IDEA**: Recommended IDE with project configuration
- **Eclipse**: Alternative IDE support
- **VS Code**: Lightweight editor with Java extensions

### Local Development
- **Docker Compose**: Local development environment
- **Test Containers**: Integration testing with real databases
- **Hot Reload**: Development mode with automatic reloading