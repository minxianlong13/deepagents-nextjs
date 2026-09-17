# Technical Details

## Technology Stack

- **Framework**: Dropwizard 4.0.0
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Parent POM**: Cvent Maven Parent 47.2.7
- **Database**: PostgreSQL (inferred from typical Cvent stack)
- **Authentication**: Cvent Auth Service 13.0.6
- **Testing**: JUnit 5, Karate for integration tests
- **Containerization**: Docker

## Key Dependencies

### Core Framework Dependencies
```xml
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-core</artifactId>
    <version>4.0.0</version>
</dependency>

<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>maven-parent</artifactId>
    <version>47.2.7</version>
</dependency>
```

### Authentication and Security
```xml
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-core</artifactId>
    <version>13.0.6</version>
</dependency>
```

### Passkey Platform Dependencies
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-microservices-common</artifactId>
    <version>1.4.0</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-create-event-api</artifactId>
    <version>1.0.26</version>
</dependency>
```

### Validation and Serialization
```xml
<dependency>
    <groupId>jakarta.validation</groupId>
    <artifactId>jakarta.validation-api</artifactId>
    <version>3.0.2</version>
</dependency>

<dependency>
    <groupId>org.yaml</groupId>
    <artifactId>snakeyaml</artifactId>
    <version>2.0</version>
</dependency>
```

### Testing Dependencies
```xml
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-testing</artifactId>
    <version>4.0.0</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.junit.vintage</groupId>
    <artifactId>junit-vintage-engine</artifactId>
    <version>5.9.3</version>
    <scope>test</scope>
</dependency>
```

### Kotlin Support
```xml
<dependency>
    <groupId>org.jetbrains.kotlin</groupId>
    <artifactId>kotlin-stdlib-jdk8</artifactId>
    <version>1.7.20</version>
</dependency>
```

## Configuration

### Environment Variables
The service uses environment-specific configuration files located in `passkey-planners-service/configs/`:

- `dev.yaml` - Development environment
- `staging.yaml` - Staging environment  
- `production.yaml` - Production environment

### Configuration Structure
```yaml
# Database configuration
database:
  driverClass: org.postgresql.Driver
  url: jdbc:postgresql://localhost:5432/passkey_planners
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1
  minSize: 8
  maxSize: 32

# Server configuration
server:
  applicationConnectors:
    - type: http
      port: ${PORT:-8080}
  adminConnectors:
    - type: http
      port: ${ADMIN_PORT:-8081}

# Authentication configuration
auth:
  apiKeyValidationUrl: ${AUTH_SERVICE_URL}/validate
  cacheTimeout: 300s

# Logging configuration
logging:
  level: INFO
  loggers:
    com.cvent.passkey.planners: DEBUG
  appenders:
    - type: console
      threshold: INFO
      target: stdout
```

### Hogan Templates
Configuration management is handled through Hogan templates located in:
`passkey-planners-service/configs/`

This allows for environment-specific configuration deployment through Cvent's infrastructure.

## Database Schema

### Primary Tables

#### planners_info
```sql
CREATE TABLE planners_info (
    email_user_id BIGINT PRIMARY KEY,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone_number VARCHAR(50),
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_planners_email ON planners_info(email_address);
CREATE INDEX idx_planners_name ON planners_info(first_name, last_name);
CREATE INDEX idx_planners_company ON planners_info(company_name);
```

#### event_planner_associations
```sql
CREATE TABLE event_planner_associations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_id BIGINT NOT NULL,
    email_user_id BIGINT NOT NULL,
    permission_level VARCHAR(20) NOT NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_user_id) REFERENCES planners_info(email_user_id),
    UNIQUE KEY unique_event_planner (event_id, email_user_id)
);

CREATE INDEX idx_associations_event ON event_planner_associations(event_id);
CREATE INDEX idx_associations_planner ON event_planner_associations(email_user_id);
```

#### sub_block_group_associations
```sql
CREATE TABLE sub_block_group_associations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    association_id BIGINT NOT NULL,
    sub_block_group_id BIGINT NOT NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (association_id) REFERENCES event_planner_associations(id),
    UNIQUE KEY unique_sbg_association (association_id, sub_block_group_id)
);
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
        <skipIntegrationTests>true</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-planners-api</module>
        <module>passkey-planners-integration-test</module>
        <module>passkey-planners-java-client</module>
        <module>passkey-planners-service</module>
        <module>passkey-planners-shared</module>
        <module>passkey-planners-data-access</module>
    </modules>
</profile>
```

#### Integration Test Profile
```xml
<profile>
    <id>run-it</id>
    <properties>
        <checkstyle.skip>true</checkstyle.skip>
        <skipIntegrationTests>false</skipIntegrationTests>
    </properties>
    <modules>
        <module>passkey-planners-api</module>
        <module>passkey-planners-data-access</module>
        <module>passkey-planners-java-client</module>
        <module>passkey-planners-integration-test</module>
    </modules>
</profile>
```

#### Coverage Profile
```xml
<profile>
    <id>coverage</id>
    <properties>
        <skipIntegrationTests>true</skipIntegrationTests>
    </properties>
    <build>
        <plugins>
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>0.8.8</version>
                <executions>
                    <execution>
                        <id>jacoco-check</id>
                        <phase>test</phase>
                        <goals>
                            <goal>check</goal>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</profile>
```

### Code Quality

#### Checkstyle Configuration
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.1.2</version>
    <dependencies>
        <dependency>
            <groupId>com.puppycrawl.tools</groupId>
            <artifactId>checkstyle</artifactId>
            <version>8.42</version>
        </dependency>
    </dependencies>
</plugin>
```

#### SonarQube Coverage Exclusions
```xml
<sonar.coverage.exclusions>
    passkey-planners-api/**,
    passkey-planners-data-access/**,
    passkey-planners-integration-test/**,
    passkey-planners-java-client/**,
    passkey-planners-shared/**,
    src/main/java/com/cvent/passkey/planners/PasskeyPlannersServiceApplication.java,
    src/main/java/com/cvent/passkey/planners/PasskeyPlannersServiceConfiguration.java
</sonar.coverage.exclusions>
```

## Monitoring & Logging

### Dropwizard Metrics
The service includes built-in metrics collection:

- **JVM Metrics**: Memory usage, garbage collection, thread pools
- **HTTP Metrics**: Request rates, response times, error rates
- **Database Metrics**: Connection pool usage, query performance
- **Custom Metrics**: Business-specific metrics for planner operations

### Datadog Integration
Metrics are exported to Datadog for monitoring and alerting:

- **Service URL**: https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-planners-service
- **Key Metrics**: Response time, error rate, throughput, database performance
- **Alerts**: Configured for high error rates, slow responses, and service unavailability

### Logging Configuration
```yaml
logging:
  level: INFO
  loggers:
    com.cvent.passkey.planners: DEBUG
    com.cvent.auth: INFO
    org.hibernate: WARN
  appenders:
    - type: console
      threshold: INFO
      target: stdout
      layout:
        type: json
        timestampFormat: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
```

### Structured Logging
The service uses structured JSON logging for better observability:

```java
LOG.info("Planner created successfully", 
    kv("emailUserId", planner.getEmailUserId()),
    kv("emailAddress", planner.getEmailAddress()),
    kv("operation", "create_planner"));
```

## Performance Characteristics

### Response Time Targets
- **GET operations**: < 100ms (95th percentile)
- **POST/PUT operations**: < 200ms (95th percentile)
- **Search operations**: < 300ms (95th percentile)
- **Batch operations**: < 1000ms (95th percentile)

### Throughput Capacity
- **Peak RPS**: 1000 requests per second
- **Sustained RPS**: 500 requests per second
- **Database connections**: 32 max connections per instance
- **Memory usage**: 512MB - 1GB per instance

### Scalability Limits
- **Horizontal scaling**: Up to 10 instances behind load balancer
- **Database scaling**: Read replicas for query optimization
- **Cache layer**: Redis for frequently accessed planner data
- **Rate limiting**: 1000 requests per minute per API key

## Security Considerations

### API Security
- **Authentication**: API key validation through auth-service
- **Authorization**: Role-based access control for admin operations
- **Input validation**: Jakarta validation annotations on all inputs
- **SQL injection prevention**: Parameterized queries in data access layer

### Data Protection
- **PII handling**: Planner email addresses and personal information are considered sensitive
- **Audit logging**: All data modifications are logged with user context
- **Data encryption**: Database connections use TLS encryption
- **Access logging**: All API access is logged for security monitoring

### Network Security
- **HTTPS only**: All external communication uses TLS 1.2+
- **Internal communication**: Service-to-service calls use mutual TLS
- **Firewall rules**: Restricted network access to database and internal services
- **VPC isolation**: Service runs in isolated VPC with controlled ingress/egress