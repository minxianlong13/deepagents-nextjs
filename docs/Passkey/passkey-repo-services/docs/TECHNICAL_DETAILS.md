# Technical Details

## Technology Stack

### Primary Technologies
- **Orchestration Framework**: TypeScript/JavaScript with pnpm workspace
- **Service Language**: Java 11
- **Build Tool**: Maven 3.6+
- **Package Manager**: pnpm (Node.js ecosystem)
- **Version Management**: Changesets (@changesets/cli)
- **Logging**: Log4j (Java services)
- **Scheduling**: Unix cron

### Development Tools
- **CI/CD**: Jenkins Pipeline
- **Code Quality**: SonarQube
- **Documentation**: MkDocs
- **Security Scanning**: WhiteSource
- **Version Control**: Git with conventional commits

## Dependencies

### Root Level Dependencies
```json
{
  "devDependencies": {
    "@changesets/cli": "^2.27.11",
    "@cvent/builder-changesets": "^1.5.1",
    "npm-run-all": "^4.1.5"
  }
}
```

### Java Service Dependencies (Maven)
Common dependencies across Java services:

#### Core Dependencies
- **Java Version**: 11 (compiler release target)
- **Maven Compiler Plugin**: 3.8+
- **Log4j**: 1.2.x (legacy logging framework)
- **JUnit**: For unit testing (when present)

#### Service-Specific Dependencies
Each service maintains its own `pom.xml` with specific dependencies:
- Database drivers (JDBC)
- HTTP client libraries
- JSON processing libraries
- External API client SDKs

### Build Dependencies
```xml
<properties>
    <maven.compiler.release>11</maven.compiler.release>
    <maven.test.skip>true</maven.test.skip>
    <environment>prod</environment>
</properties>
```

## Configuration Management

### Environment Configuration
Services support multiple environments through configuration files:

#### Environment Types
- **Development**: Local development with minimal external dependencies
- **Alpha**: Pre-production testing environment
- **Beta**: User acceptance testing environment
- **Production**: Live production environment

#### Configuration Structure
```
{ServiceName}/
├── configs/
│   ├── dev.properties
│   ├── alpha.properties
│   ├── beta.properties
│   └── prod.properties
└── log4j.properties
```

### Environment Variables
- **LOG_DIR**: Logging directory path (set by deployment system)
- **ENVIRONMENT**: Current environment identifier
- **JAVA_HOME**: Java installation path
- **MAVEN_HOME**: Maven installation path

### Configuration Properties
Common configuration patterns across services:
```properties
# Database Configuration
db.host=${DB_HOST}
db.port=${DB_PORT}
db.name=${DB_NAME}
db.username=${DB_USERNAME}
db.password=${DB_PASSWORD}

# External API Configuration
api.endpoint=${API_ENDPOINT}
api.key=${API_KEY}
api.timeout=30000

# Logging Configuration
log.level=INFO
log.file.path=${LOG_DIR}
```

## Database Schema

### Service-Specific Schemas
Each service typically connects to different database schemas:

#### GMLService Schema
- **Tables**: Guest management related tables
- **Connection**: Dedicated connection pool
- **Transactions**: Service-managed transactions

#### Reservation Services Schema
- **Tables**: Reservation, booking, and inventory tables
- **Relationships**: Foreign key relationships to guest data
- **Indexes**: Optimized for date-range queries

#### Billing Services Schema
- **Tables**: Transaction, billing, and financial data
- **Constraints**: Financial data integrity constraints
- **Audit**: Change tracking for financial records

#### Exchange Rate Schema
- **Tables**: Currency rates and historical data
- **Partitioning**: Date-based partitioning for historical data
- **Indexes**: Currency pair and date indexes

### Connection Management
```java
// Typical connection configuration
DataSource dataSource = new HikariDataSource();
dataSource.setJdbcUrl("jdbc:postgresql://host:port/database");
dataSource.setUsername(username);
dataSource.setPassword(password);
dataSource.setMaximumPoolSize(10);
dataSource.setConnectionTimeout(30000);
```

## Build System

### Maven Build Configuration
Each Java service uses Maven with standardized configuration:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.1</version>
            <configuration>
                <release>11</release>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.sonarsource.scanner.maven</groupId>
            <artifactId>sonar-maven-plugin</artifactId>
            <version>3.9.1.2184</version>
        </plugin>
    </plugins>
</build>
```

### pnpm Workspace Build
Root level build orchestration:
```json
{
  "scripts": {
    "build": "run-s build:*",
    "build:billing-report": "mvn -f billing-report/pom.xml -B clean package",
    "build:exchange-rates": "mvn -f exchange-rates/pom.xml -B clean package",
    "build:GMLService": "mvn -f GMLService/pom.xml -B clean package"
  }
}
```

### Build Artifacts
- **JAR Files**: Executable JAR files for each service
- **Shell Scripts**: Service execution and health check scripts
- **Configuration Files**: Environment-specific configuration
- **Documentation**: Generated documentation files

## Monitoring & Logging

### Logging Framework
**Log4j Configuration** (typical setup):
```properties
log4j.rootLogger=INFO, FILE, CONSOLE

# File Appender
log4j.appender.FILE=org.apache.log4j.RollingFileAppender
log4j.appender.FILE.File=${LOG_DIR}/${service.name}.log
log4j.appender.FILE.MaxFileSize=10MB
log4j.appender.FILE.MaxBackupIndex=5
log4j.appender.FILE.layout=org.apache.log4j.PatternLayout
log4j.appender.FILE.layout.ConversionPattern=%d{yyyy-MM-dd HH:mm:ss} %-5p %c{1}:%L - %m%n

# Console Appender
log4j.appender.CONSOLE=org.apache.log4j.ConsoleAppender
log4j.appender.CONSOLE.layout=org.apache.log4j.PatternLayout
log4j.appender.CONSOLE.layout.ConversionPattern=%d{HH:mm:ss} %-5p %c{1} - %m%n
```

### Log Structure
**Standard Log Format**:
```
2024-01-15 10:30:00 INFO  GMLService:45 - Processing started for 1500 records
2024-01-15 10:30:15 INFO  GMLService:67 - Database connection established
2024-01-15 10:31:30 INFO  GMLService:89 - Processing completed successfully
2024-01-15 10:31:30 INFO  GMLService:92 - Execution time: 90 seconds
```

### Monitoring Integration
- **Log Directory**: `/services/passkey/{environment}/services/logs/json`
- **Log Format**: JSON structured logs for machine parsing
- **Rotation**: Automatic log rotation to prevent disk space issues
- **Retention**: Environment-specific retention policies

### Health Monitoring
Each service includes health check capabilities:
```bash
# Health check execution
./ServiceName.sh health

# Returns:
# Exit code 0: Healthy
# Exit code 1: Unhealthy
# Exit code 2: Configuration error
```

## Performance Considerations

### Resource Allocation
- **Memory**: Java heap size configured per service
- **CPU**: Single-threaded execution for most services
- **Disk I/O**: Optimized for batch processing patterns
- **Network**: Minimal network usage except for external API calls

### Optimization Strategies
- **Database Connection Pooling**: Reuse connections across operations
- **Batch Processing**: Process records in batches to improve throughput
- **Caching**: Cache frequently accessed configuration and reference data
- **Asynchronous Processing**: Where applicable, use async patterns

### Scalability Patterns
- **Horizontal Scaling**: Deploy services across multiple nodes
- **Load Distribution**: Distribute cron jobs across different servers
- **Database Sharding**: Partition data by date or other criteria
- **Resource Isolation**: Separate resource allocation per service

## Security Implementation

### Authentication & Authorization
- **System User**: Services run under dedicated `passkey` system user
- **File Permissions**: Restricted access to configuration and log files
- **Database Access**: Service-specific database credentials
- **API Keys**: Encrypted storage of external API credentials

### Data Protection
- **Encryption**: Sensitive configuration values encrypted at rest
- **Secure Transmission**: HTTPS for all external API communications
- **Audit Logging**: Security-relevant events logged for audit
- **Access Control**: Role-based access to service management

### Network Security
- **Internal Communication**: Services communicate through internal networks
- **Firewall Rules**: Restricted network access per service requirements
- **Certificate Management**: SSL/TLS certificates for external integrations
- **VPN Access**: Secure access for administrative operations

## Deployment Architecture

### Deployment Units
Each service is deployed as:
- **Executable JAR**: Self-contained Java application
- **Shell Scripts**: Service management and health check scripts
- **Configuration Files**: Environment-specific settings
- **Cron Entries**: Scheduled execution configuration

### Deployment Process
1. **Build Phase**: Maven compilation and packaging
2. **Quality Gates**: SonarQube analysis and approval
3. **Artifact Storage**: JAR files stored in artifact repository
4. **Environment Deployment**: Octo-based deployment to target environment
5. **Configuration Update**: Environment-specific configuration deployment
6. **Service Registration**: Cron job registration and service startup
7. **Health Verification**: Post-deployment health checks

### Rollback Procedures
- **Artifact Rollback**: Revert to previous JAR version
- **Configuration Rollback**: Restore previous configuration files
- **Cron Rollback**: Restore previous cron schedule
- **Database Rollback**: Database migration rollback if needed