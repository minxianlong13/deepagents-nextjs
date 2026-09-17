# Technical Details

## Technology Stack

### Core Technologies
- **Language**: Java 17
- **Application Server**: WildFly 16.0.0.Final
- **Framework**: Java EE 7
- **Build Tool**: Maven 3.x
- **Package Manager**: pnpm (for tooling)
- **Database**: Oracle Database
- **ORM**: Hibernate 5.3.28.Final

### Frontend Technologies
- **Web Framework**: JSP/Servlets
- **JavaScript**: ES5/ES6
- **CSS**: Custom stylesheets
- **UI Components**: Custom components for call center interface

### Security & Scanning
- **Malware Scanner**: ClamAV integration
- **XSS Protection**: OWASP AntiSamy 1.6.8
- **Authentication**: Integration with Passkey Auth Service
- **SSL/TLS**: HTTPS encryption for all communications

## Key Dependencies

### Core Java Dependencies
```xml
<!-- Java EE API -->
<dependency>
    <groupId>javax</groupId>
    <artifactId>javaee-api</artifactId>
    <version>7.0</version>
</dependency>

<!-- Spring Framework -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.3.38</version>
</dependency>

<!-- Jackson JSON Processing -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.16.1</version>
</dependency>

<!-- Hibernate ORM -->
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-core</artifactId>
    <version>5.3.28.Final</version>
</dependency>
```

### Passkey Service Dependencies
```xml
<!-- Passkey Authentication -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-auth</artifactId>
    <version>1.0.124</version>
</dependency>

<!-- Passkey Acknowledgment -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-acknowledgment-java-client</artifactId>
    <version>1.0.50</version>
</dependency>

<!-- Autoblock Data API -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-autoblock-data-api</artifactId>
    <version>1.0.70</version>
</dependency>

<!-- Hotel API -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-api</artifactId>
    <version>1.0.123</version>
</dependency>
```

### Security Dependencies
```xml
<!-- OWASP AntiSamy for XSS Protection -->
<dependency>
    <groupId>org.owasp.antisamy</groupId>
    <artifactId>antisamy</artifactId>
    <version>1.6.8</version>
</dependency>

<!-- ClamAV for Malware Scanning -->
<dependency>
    <groupId>org.jenkins-ci.plugins</groupId>
    <artifactId>clamav</artifactId>
    <version>0.3</version>
</dependency>
```

### Testing Dependencies
```xml
<!-- JUnit -->
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.12</version>
</dependency>

<!-- PowerMock -->
<dependency>
    <groupId>org.powermock</groupId>
    <artifactId>powermock-module-junit4</artifactId>
    <version>2.0.9</version>
</dependency>

<!-- Hamcrest -->
<dependency>
    <groupId>org.hamcrest</groupId>
    <artifactId>hamcrest-all</artifactId>
    <version>1.3</version>
</dependency>
```

## Configuration Management

### Environment Configuration
Configuration is managed through Hogan templates that generate environment-specific files:

#### Configuration Files Generated
- `passkey-standalone-full-<environment>.xml` - WildFly server configuration
- `passkey_<environment>.properties` - Application properties
- `passkeyenc_<environment>.properties` - Encrypted properties
- `resdesk_<environment>.properties` - Resdesk-specific properties

#### Configuration Script
```bash
# Generate configuration for specific environment
scripts/configure.sh <environment>
```

### Database Configuration
```xml
<!-- Oracle JDBC Driver -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>19.3.0.0</version>
</dependency>
```

#### Connection Pool Settings
- **Initial Pool Size**: 10 connections
- **Maximum Pool Size**: 50 connections
- **Connection Timeout**: 30 seconds
- **Idle Timeout**: 300 seconds

### JVM Configuration
```bash
# Memory Settings
-Xms2g -Xmx4g
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m

# Garbage Collection
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200

# Monitoring
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/opt/wildfly/logs/
```

## Build Configuration

### Maven Build Profiles
```xml
<!-- Development Profile -->
<profile>
    <id>dev</id>
    <properties>
        <environment>dev</environment>
        <skip.tests>false</skip.tests>
    </properties>
</profile>

<!-- Production Profile -->
<profile>
    <id>prod</id>
    <properties>
        <environment>prod</environment>
        <skip.tests>true</skip.tests>
    </properties>
</profile>
```

### Build Commands
```bash
# Clean build
mvn clean package

# Build with tests
mvn clean verify

# Build for specific environment
mvn clean package -Dtaglabel=4.1.9 -Denvironment=prod

# Run tests only
mvn test

# Generate test coverage report
mvn clean verify -Pcoverage
```

### Code Quality Tools

#### SonarQube Configuration
```xml
<properties>
    <sonar.projectKey>passkey-resdesk:resdesk-all</sonar.projectKey>
    <sonar.projectName>passkey-resdesk</sonar.projectName>
    <sonar.coverage.exclusions>web/**</sonar.coverage.exclusions>
    <sonar.java.coveragePlugin>jacoco</sonar.java.coveragePlugin>
</properties>
```

#### JaCoCo Coverage
- **Line Coverage**: 0% (currently disabled)
- **Branch Coverage**: 0% (currently disabled)
- **Instruction Coverage**: 0% (currently disabled)

## Database Schema

### Primary Tables
- `RESERVATIONS` - Main reservation data
- `GUESTS` - Guest information
- `HOTELS` - Hotel master data
- `ROOM_TYPES` - Room type definitions
- `RESERVATION_NOTES` - Comments and notes
- `PAYMENT_TRANSACTIONS` - Financial transactions

### Indexes
- Primary keys on all ID columns
- Composite indexes on frequently queried columns
- Foreign key indexes for referential integrity

### Connection Management
- **Data Source**: Configured in WildFly
- **Connection Pool**: HikariCP
- **Transaction Management**: JTA (Java Transaction API)
- **Isolation Level**: READ_COMMITTED

## Logging Configuration

### Log4j2 Configuration
```xml
<Configuration>
    <Appenders>
        <File name="ApplicationLog" fileName="logs/resdesk.log">
            <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss} [%t] %-5level %logger{36} - %msg%n"/>
        </File>
        <File name="ServerLog" fileName="logs/server.log">
            <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss} [%t] %-5level %logger{36} - %msg%n"/>
        </File>
    </Appenders>
    <Loggers>
        <Logger name="com.lanyon" level="DEBUG"/>
        <Root level="INFO">
            <AppenderRef ref="ApplicationLog"/>
        </Root>
    </Loggers>
</Configuration>
```

### Log Levels
- **DEBUG**: Detailed debugging information
- **INFO**: General application flow
- **WARN**: Potentially harmful situations
- **ERROR**: Error events that allow application to continue
- **FATAL**: Severe error events that may abort application

## Monitoring & Observability

### JMX Beans
- Application-specific metrics
- Database connection pool metrics
- Memory and garbage collection metrics
- Thread pool metrics

### Health Checks
- Database connectivity
- External service availability
- Memory usage thresholds
- Disk space monitoring

### Datadog Integration
- Application performance monitoring
- Error tracking and alerting
- Custom business metrics
- Log aggregation and analysis

## Security Configuration

### XSS Protection
```java
// AntiSamy configuration for input sanitization
Policy policy = Policy.getInstance(policyFile);
AntiSamy antiSamy = new AntiSamy();
CleanResults cleanResults = antiSamy.scan(userInput, policy);
```

### File Upload Security
- Malware scanning with ClamAV
- File type validation
- Size limitations
- Quarantine for suspicious files

### Authentication Integration
- Session-based authentication
- Integration with Passkey Auth Service
- Role-based access control
- Automatic session timeout

## Performance Optimization

### Caching Strategy
- Application-level caching for frequently accessed data
- Database query result caching
- Static resource caching
- Session data optimization

### Database Optimization
- Connection pooling
- Query optimization
- Index tuning
- Batch processing for bulk operations

### Memory Management
- Proper object lifecycle management
- Garbage collection tuning
- Memory leak detection
- Resource cleanup patterns

## Development Tools

### IDE Configuration
- IntelliJ IDEA recommended
- Eclipse support available
- Maven integration
- WildFly server integration

### Debugging
- Remote debugging support
- JMX monitoring
- Log analysis tools
- Performance profiling

### Code Style
- Java coding standards
- Checkstyle configuration
- PMD rules
- SpotBugs integration