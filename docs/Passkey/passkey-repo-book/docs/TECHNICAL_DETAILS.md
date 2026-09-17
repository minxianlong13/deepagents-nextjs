# Technical Details

## Technology Stack

### Core Framework
- **Spring Framework**: 5.3.39
  - Spring MVC for web layer
  - Spring Security 5.7.14 for authentication/authorization
  - Spring Context for dependency injection
  - Spring Transaction Management
- **Application Server**: Wildfly 16
- **Java Version**: Java 17 (compatible)
- **Build Tool**: Maven 3.6+

### Database & ORM
- **Database**: Oracle Database
- **ORM**: Hibernate 5.3.28.Final
- **Connection Pooling**: Wildfly managed data sources
- **Transaction Management**: JTA transactions

### Frontend Technologies
- **View Technology**: JSP (JavaServer Pages)
- **JavaScript**: jQuery and custom JavaScript
- **CSS**: Custom stylesheets with responsive design
- **Template Engine**: JSP with custom tag libraries

### Development Tools
- **Package Manager**: pnpm (for Node.js tooling)
- **Version Control**: Git
- **CI/CD**: Jenkins
- **Code Quality**: SonarQube
- **Dependency Management**: Maven

## Dependencies

### Core Spring Dependencies
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>5.3.39</version>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
    <version>5.3.39</version>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-web</artifactId>
    <version>5.7.14</version>
</dependency>
```

### Database Dependencies
```xml
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-core</artifactId>
    <version>5.3.28.Final</version>
</dependency>
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-validator</artifactId>
    <version>6.0.15.Final</version>
</dependency>
```

### Cvent Internal Dependencies
```xml
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>6.7.1</version>
</dependency>
<dependency>
    <groupId>com.cvent.messaging</groupId>
    <artifactId>messaging-shared</artifactId>
    <version>2.15.116</version>
</dependency>
<dependency>
    <groupId>com.passkey</groupId>
    <artifactId>passkey-reservation-orch-client</artifactId>
    <version>1.11.18</version>
</dependency>
```

### JSON Processing
```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.16.1</version>
</dependency>
```

### Security & Validation
```xml
<dependency>
    <groupId>javax.validation</groupId>
    <artifactId>validation-api</artifactId>
    <version>2.0.1.Final</version>
</dependency>
<dependency>
    <groupId>org.eclipse.jetty</groupId>
    <artifactId>jetty-server</artifactId>
    <version>9.4.57.v20241219</version>
</dependency>
```

## Configuration

### Environment Variables
- `JAVA_OPTS`: JVM configuration options
- `WILDFLY_HOME`: Wildfly installation directory
- `DATABASE_URL`: Oracle database connection string
- `AUTH_SERVICE_URL`: Authentication service endpoint
- `MESSAGING_SERVICE_URL`: Messaging service endpoint

### Application Properties
```properties
# Database Configuration
database.driver=oracle.jdbc.OracleDriver
database.url=${DATABASE_URL}
database.username=${DB_USERNAME}
database.password=${DB_PASSWORD}

# Authentication Service
auth.service.url=${AUTH_SERVICE_URL}
auth.service.timeout=30000

# Messaging Service
messaging.service.url=${MESSAGING_SERVICE_URL}
messaging.service.api.key=${MESSAGING_API_KEY}

# Session Configuration
session.timeout=1800
session.cookie.secure=true
session.cookie.httpOnly=true
```

### Wildfly Configuration
```xml
<!-- Wildfly standalone.xml configuration -->
<datasource jndi-name="java:jboss/datasources/PasskeyDS" 
            pool-name="PasskeyDS">
    <connection-url>${database.url}</connection-url>
    <driver>oracle</driver>
    <security>
        <user-name>${database.username}</user-name>
        <password>${database.password}</password>
    </security>
</datasource>
```

### Spring Security Configuration
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/public/**").permitAll()
                .anyRequest().authenticated()
            .and()
            .formLogin()
                .loginPage("/login")
                .defaultSuccessUrl("/home")
            .and()
            .logout()
                .logoutSuccessUrl("/login?logout");
        return http.build();
    }
}
```

## Database Schema

### Core Tables
- **GUESTS**: Guest information and profiles
- **RESERVATIONS**: Hotel reservation details
- **PAYERS**: Payment responsible parties
- **CREDIT_CARDS**: Payment card information (encrypted)
- **BLOCKS**: Room block allocations
- **RES_CHARGES**: Detailed billing information
- **BUSINESS_TEXT**: Localized text content
- **AUDIT_LOG**: Change tracking and audit trail

### Key Relationships
```sql
-- Reservation to Guest (One-to-Many)
ALTER TABLE GUESTS ADD CONSTRAINT FK_GUEST_RESERVATION 
    FOREIGN KEY (reservation_id) REFERENCES RESERVATIONS(id);

-- Reservation to Payer (Many-to-One)
ALTER TABLE RESERVATIONS ADD CONSTRAINT FK_RESERVATION_PAYER 
    FOREIGN KEY (payer_id) REFERENCES PAYERS(id);

-- Payer to Credit Card (One-to-Many)
ALTER TABLE CREDIT_CARDS ADD CONSTRAINT FK_CARD_PAYER 
    FOREIGN KEY (payer_id) REFERENCES PAYERS(id);
```

### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX IDX_RESERVATION_DATES ON RESERVATIONS(check_in_date, check_out_date);
CREATE INDEX IDX_GUEST_EMAIL ON GUESTS(email);
CREATE INDEX IDX_BLOCK_EVENT ON BLOCKS(event_id, start_date, end_date);
CREATE INDEX IDX_CHARGES_RESERVATION ON RES_CHARGES(reservation_id);
```

## Build Configuration

### Maven Parent POM
```xml
<project>
    <groupId>com.passkey</groupId>
    <artifactId>book</artifactId>
    <version>1.3</version>
    <packaging>pom</packaging>
    
    <properties>
        <spring.version>5.3.39</spring.version>
        <hibernate.version>5.3.28.Final</hibernate.version>
        <spring.security.version>5.7.14</spring.security.version>
        <jackson-databind.version>2.16.1</jackson-databind.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
    </properties>
    
    <modules>
        <module>war</module>
        <module>groupmax-core2</module>
        <module>passkey-core</module>
        <module>passkey-dev-core</module>
    </modules>
</project>
```

### WAR Module Build
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-war-plugin</artifactId>
    <version>3.2.3</version>
    <configuration>
        <warName>aws</warName>
        <failOnMissingWebXml>false</failOnMissingWebXml>
    </configuration>
</plugin>
```

## Monitoring & Logging

### Logging Configuration
- **Framework**: SLF4J with Logback
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Log Rotation**: Daily rotation with 30-day retention
- **Structured Logging**: JSON format for production

### Application Metrics
- **Datadog Integration**: Application performance monitoring
- **Custom Metrics**: Business-specific metrics
- **Health Checks**: Application health endpoints
- **JVM Metrics**: Memory, GC, thread monitoring

### Monitoring Endpoints
```
/health - Application health status
/metrics - Application metrics
/info - Application information
/env - Environment properties (secured)
```

## Security Configuration

### Data Encryption
- **Credit Card Data**: AES-256 encryption at rest
- **PII Data**: Encrypted sensitive personal information
- **Database Connections**: TLS encryption in transit
- **Session Data**: Encrypted session storage

### Input Validation
```java
@Valid
@GuestsDates
public class ReservationForm {
    
    @NotNull
    @Email
    private String guestEmail;
    
    @NotNull
    @Size(min = 2, max = 50)
    private String guestName;
    
    @Future
    private Date checkInDate;
    
    @GreaterThan(field = "checkInDate")
    private Date checkOutDate;
}
```

### CSRF Protection
- **Spring Security CSRF**: Enabled for all state-changing operations
- **Token Validation**: CSRF tokens in forms and AJAX requests
- **SameSite Cookies**: Strict SameSite policy for session cookies

## Performance Optimization

### Caching Strategy
- **EhCache**: Application-level caching
- **Database Query Caching**: Hibernate second-level cache
- **Static Resource Caching**: CDN integration for assets
- **Session Caching**: Distributed session storage

### Database Optimization
- **Connection Pooling**: HikariCP for efficient connection management
- **Query Optimization**: Hibernate query analysis and tuning
- **Lazy Loading**: Efficient entity loading strategies
- **Batch Processing**: Bulk operations for data processing

### JVM Tuning
```bash
# Production JVM settings
JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 
           -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/heapdumps/"
```

## Testing Configuration

### Test Dependencies
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-test</artifactId>
    <version>5.3.39</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.powermock</groupId>
    <artifactId>powermock-module-junit4</artifactId>
    <version>2.0.9</version>
    <scope>test</scope>
</dependency>
```

### Code Coverage
- **JaCoCo**: Code coverage analysis
- **Minimum Coverage**: 80% line coverage required
- **Coverage Reports**: Generated during build process
- **SonarQube Integration**: Quality gate enforcement

## Deployment Artifacts

### Build Outputs
- **aws.war**: Main web application archive
- **passkey-core.jar**: Core business logic library
- **groupmax-core2.jar**: Legacy integration library
- **passkey-dev-core.jar**: Development utilities

### Configuration Files
- **dev-standalone-full.xml**: Development Wildfly configuration
- **passkey_template.properties**: Environment-specific properties
- **web.xml**: Web application descriptor
- **applicationContext.xml**: Spring configuration