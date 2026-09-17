# Technical Details

## Technology Stack

- **Framework**: Java EE with WildFly Application Server
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Application Server**: WildFly 16.0.0.Final
- **Database**: Oracle Database
- **ORM**: Hibernate EntityManager 5.6.15.Final
- **Package Management**: pnpm (for build orchestration)
- **Testing**: JUnit 5, Mockito, PowerMock

## Dependencies

### Core Dependencies

#### Application Framework
```xml
<dependency>
    <groupId>javax</groupId>
    <artifactId>javaee-api</artifactId>
    <version>7.0</version>
    <scope>provided</scope>
</dependency>

<dependency>
    <groupId>org.wildfly</groupId>
    <artifactId>wildfly-system-jmx</artifactId>
    <version>16.0.0.Final</version>
    <scope>provided</scope>
</dependency>
```

#### Database & Persistence
```xml
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-entitymanager</artifactId>
    <version>5.6.15.Final</version>
    <scope>provided</scope>
</dependency>

<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>19.3.0.0</version>
    <scope>provided</scope>
</dependency>
```

#### Logging
```xml
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-slf4j2-impl</artifactId>
    <version>2.24.3</version>
</dependency>

<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>2.0.16</version>
</dependency>
```

### Passkey Service Dependencies

#### Authentication & Authorization
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-authentication-java-client</artifactId>
    <version>1.0.75</version>
</dependency>
```

#### Housing & Inventory
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-housing-library-java-client</artifactId>
    <version>1.0.29</version>
</dependency>

<dependency>
    <groupId>com.cvent.passkey-event-housing</groupId>
    <artifactId>passkey-event-housing-java-client</artifactId>
    <version>1.1.4</version>
</dependency>
```

#### Guest Services
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-autoblock-guestside-java-client</artifactId>
    <version>1.0.7</version>
</dependency>
```

#### Observability
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-observability</artifactId>
    <version>55.9.0</version>
</dependency>
```

### Testing Dependencies
```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-api</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.5.0</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.powermock</groupId>
    <artifactId>powermock-api-mockito2</artifactId>
    <version>2.0.9</version>
    <scope>test</scope>
</dependency>
```

## Configuration

### Environment Variables

#### Database Configuration
- `DB_LIVEDS_URL` - Database connection URL
- `DB_LIVEDS_USERNAME` - Database username
- `DB_LIVEDS_PASSWORD` - Database password
- `DB_LIVEDS_DRIVER` - JDBC driver class

#### Email Service Configuration
- `EMAIL_SERVICE_URL` - Email service endpoint for bulk sending
- `EMAIL_SERVICE_API_KEY` - Email service authentication key

#### Service Integration
- `AUTH_SERVICE_URL` - Authentication service endpoint
- `HOUSING_SERVICE_URL` - Housing library service endpoint
- `AUTOBLOCK_SERVICE_URL` - Autoblock service endpoint

#### Monitoring
- `DATADOG_API_KEY` - Datadog API key for metrics
- `DATADOG_SERVICE_NAME` - Service name in Datadog (passkey-smart)

### Configuration Files

#### WildFly Configuration
- `passkey-standalone-full-dev.xml` - Development environment
- `passkey-standalone-full-alpha.xml` - Alpha environment
- `passkey-standalone-full-prod.xml` - Production environment

#### Application Properties
- `passkey_dev.properties` - Development settings
- `passkeyenc_dev.properties` - Encrypted configuration values
- `resdesk_dev.properties` - Reservation desk integration settings

### Hogan Template Configuration

Configuration templates are managed through Hogan and processed for each environment:

```yaml
# Example template variables
database:
  url: "#{DB.LIVEDS.URL}"
  username: "#{DB.LIVEDS.USERNAME}"
  password: "#{DB.LIVEDS.PASSWORD}"

emailService:
  url: "#{EMAIL.SERVICE.URL}"
  apiKey: "#{EMAIL.SERVICE.API.KEY}"
  
monitoring:
  datadog:
    apiKey: "#{DATADOG.API.KEY}"
```

## Database Schema

### Core Tables

#### SMART_EMAIL_SETUP
- Primary configuration table for email campaigns
- Stores campaign rules, templates, and scheduling information
- Foreign keys to template and SMTP configuration tables

#### EMAIL_TEMPLATE
- Template definitions with HTML and text content
- Version control for template changes
- Variable definitions for personalization

#### CAMPAIGN_EXECUTION
- Historical record of campaign executions
- Performance metrics and status tracking
- Links to individual email delivery records

#### EMAIL_DELIVERY
- Individual email delivery tracking
- SMTP response codes and delivery status
- Retry attempt logging

### Indexes
- Primary keys on all ID columns
- Composite indexes on frequently queried combinations
- Performance indexes on date ranges for reporting

## Monitoring & Logging

### Logging Configuration

#### Log4j2 Configuration
```xml
<Configuration>
    <Appenders>
        <File name="SmartLogFile" fileName="logs/smart.log">
            <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss} [%t] %-5level %logger{36} - %msg%n"/>
        </File>
        <Console name="Console">
            <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </Console>
    </Appenders>
    <Loggers>
        <Logger name="com.lanyon.group.smart" level="INFO"/>
        <Root level="WARN">
            <AppenderRef ref="SmartLogFile"/>
            <AppenderRef ref="Console"/>
        </Root>
    </Loggers>
</Configuration>
```

### Metrics Collection

#### Application Metrics
- Campaign execution count and duration
- Email delivery success/failure rates
- Template processing performance
- Database connection pool status

#### Infrastructure Metrics
- JVM memory usage and garbage collection
- Thread pool utilization
- Database query performance
- SMTP connection status

### Health Checks

#### Service Health Endpoints
- Database connectivity check
- Email service availability
- External service integration status
- Application server health

## Build Configuration

### Maven Build Profiles

#### Default Profile
```bash
mvn clean package
```

#### Coverage Profile
```bash
mvn clean verify -P coverage
```

#### Sonar Analysis
```bash
mvn sonar:sonar -Dsonar.host.url=https://sonar.core.cvent.org
```

### NPM Scripts

#### Build Commands
```json
{
  "build": "mvn -B package -Dmaven.test.skip=true",
  "test": "run-s test:*",
  "test:java": "mvn -B verify",
  "test:jacoco": "mvn org.jacoco:jacoco-maven-plugin:prepare-agent clean verify -P coverage"
}
```

## Performance Considerations

### JVM Tuning
- Heap size configuration for email processing workloads
- Garbage collection optimization for batch operations
- Connection pool sizing for database and email service connections

### Database Optimization
- Query optimization for recipient selection
- Batch processing for large email campaigns
- Connection pooling and timeout configuration

### Email Configuration Optimization
- Concurrent email configuration processing with rate limiting
- Email service connection pooling and reuse
- Retry logic with exponential backoff for service calls