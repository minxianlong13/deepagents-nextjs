# Technical Details

## Technology Stack

### Backend Framework
- **Java**: OpenJDK 17 (LTS)
- **Spring Framework**: 5.3.39
  - Spring MVC for web layer
  - Spring Security 5.8.16 for authentication/authorization
  - Spring JDBC for data access
  - Spring AOP for cross-cutting concerns
- **Application Server**: WildFly 26.1.3.Final (Jakarta EE 8)
- **Build Tool**: Apache Maven 3.6+

### Frontend Technologies
- **Template Engine**: JSP (Jakarta Server Pages)
- **Layout Framework**: Apache Tiles 3.0.8
- **JavaScript**: Vanilla JavaScript with jQuery
- **CSS Framework**: Custom CSS with responsive design
- **JSTL**: Jakarta Standard Tag Library for JSP

### Database and Persistence
- **Primary Database**: Oracle Database 19c
- **JDBC Driver**: Oracle OJDBC8 (19.3.0.0)
- **Connection Pooling**: C3P0 (0.10.1) and Commons DBCP (1.4)
- **Caching**: EhCache 2.6.0 for application-level caching
- **Data Access**: Spring JDBC Template with DAO pattern

### Development and Build Tools
- **Package Manager**: pnpm 8+ (for workspace management)
- **Version Control**: Git with conventional commits
- **Code Quality**: SonarQube integration
- **Testing**: JUnit 5.8.1 with Mockito 5.3.1
- **Code Coverage**: JaCoCo 0.8.8

## Dependencies

### Core Spring Dependencies
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
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
    <version>5.8.16</version>
</dependency>
```

### Jakarta EE Dependencies
```xml
<dependency>
    <groupId>jakarta.servlet</groupId>
    <artifactId>jakarta.servlet-api</artifactId>
    <version>4.0.4</version>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>jakarta.servlet.jsp</groupId>
    <artifactId>jakarta.servlet.jsp-api</artifactId>
    <version>2.3.6</version>
    <scope>provided</scope>
</dependency>
```

### Database Dependencies
```xml
<dependency>
    <groupId>com.oracle.ojdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>19.3.0.0</version>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>commons-dbcp</groupId>
    <artifactId>commons-dbcp</artifactId>
    <version>1.4</version>
</dependency>
```

### Utility Libraries
```xml
<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.13.0</version>
</dependency>
<dependency>
    <groupId>commons-codec</groupId>
    <artifactId>commons-codec</artifactId>
    <version>1.15</version>
</dependency>
<dependency>
    <groupId>org.apache.velocity</groupId>
    <artifactId>velocity</artifactId>
    <version>1.7</version>
</dependency>
```

### Passkey Integration
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-authentication-java-client</artifactId>
    <version>1.0.81</version>
</dependency>
```

## Configuration

### Application Properties
**Location**: `src/main/resources/addon.properties`

```properties
# Application Information
addon.version=PROJECT_VERSION
addon.environment=ENVIRONMENT
addon.url=https://dev-book.passkey.com

# Database Configuration
addon.jdbc.driver=oracle.jdbc.OracleDriver
addon.jdbc.url=jdbc:oracle:thin:@localhost:1521:XE
addon.jdbc.username=addon_user
addon.jdbc.password=${DB.LIVEDS.PASSWORD}

# Business Intelligence Database
bi.addon.jdbc.driver=oracle.jdbc.OracleDriver
bi.addon.jdbc.url=jdbc:oracle:thin:@bi-host:1521:BIDS
bi.addon.jdbc.username=bi_user
bi.addon.jdbc.password=${DB.BIDS.PASSWORD}

# Email Configuration
mail.smtp.host=smtp.cvent.com
mail.smtp.port=587
mail.smtp.username=addon-portal
mail.smtp.password=${MAIL.SMTP.PASSWORD}
mail.smtp.auth=true
mail.smtp.starttls.enable=true

# Cache Configuration
ehcache.config.location=classpath:ehcache.xml
ehcache.disk.store.path=/tmp/addon-cache

# Security Configuration
security.session.timeout=1800
security.csrf.enabled=true
security.remember.me.key=addon-portal-remember-me

# Logging Configuration
logging.level.com.passkey.addon=INFO
logging.level.org.springframework.security=DEBUG
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
```

### Spring Configuration
**Location**: `src/main/resources/applicationContext.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:mvc="http://www.springframework.org/schema/mvc"
       xmlns:tx="http://www.springframework.org/schema/tx">

    <!-- Component Scanning -->
    <context:component-scan base-package="com.passkey.addon"/>
    
    <!-- Property Placeholder -->
    <context:property-placeholder location="classpath:addon.properties"/>
    
    <!-- Data Source Configuration -->
    <bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">
        <property name="driverClass" value="${addon.jdbc.driver}"/>
        <property name="jdbcUrl" value="${addon.jdbc.url}"/>
        <property name="user" value="${addon.jdbc.username}"/>
        <property name="password" value="${addon.jdbc.password}"/>
        <property name="minPoolSize" value="5"/>
        <property name="maxPoolSize" value="20"/>
        <property name="acquireIncrement" value="1"/>
        <property name="maxIdleTime" value="300"/>
    </bean>
    
    <!-- Transaction Manager -->
    <bean id="transactionManager" 
          class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <property name="dataSource" ref="dataSource"/>
    </bean>
    
    <!-- Enable Transaction Annotations -->
    <tx:annotation-driven transaction-manager="transactionManager"/>
    
</beans>
```

### WildFly Configuration
**Location**: `wildfly/standalone/configuration/passkey-standalone-full-dev.xml`

Key configuration sections:

```xml
<!-- Data Source Configuration -->
<datasource jndi-name="java:jboss/datasources/AddonDS" 
            pool-name="AddonDS" enabled="true">
    <connection-url>jdbc:oracle:thin:@localhost:1521:XE</connection-url>
    <driver>oracle</driver>
    <security>
        <user-name>addon_user</user-name>
        <password>addon_password</password>
    </security>
    <pool>
        <min-pool-size>5</min-pool-size>
        <max-pool-size>20</max-pool-size>
    </pool>
</datasource>

<!-- Mail Session Configuration -->
<mail-session name="default" jndi-name="java:jboss/mail/Default">
    <smtp-server outbound-socket-binding-ref="mail-smtp">
        <login name="addon-portal" password="${MAIL.SMTP.PASSWORD}"/>
    </smtp-server>
</mail-session>

<!-- Security Domain -->
<security-domain name="addon-security" cache-type="default">
    <authentication>
        <login-module code="Database" flag="required">
            <module-option name="dsJndiName" value="java:jboss/datasources/AddonDS"/>
            <module-option name="principalsQuery" 
                          value="SELECT password FROM users WHERE username=?"/>
            <module-option name="rolesQuery" 
                          value="SELECT role, 'Roles' FROM user_roles WHERE username=?"/>
        </login-module>
    </authentication>
</security-domain>
```

## Database Schema

### Core Tables

#### ADDONS
```sql
CREATE TABLE addons (
    id NUMBER(19) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    description CLOB,
    price NUMBER(10,2),
    currency VARCHAR2(3) DEFAULT 'USD',
    category VARCHAR2(50),
    hotel_id NUMBER(19) NOT NULL,
    is_active NUMBER(1) DEFAULT 1,
    created_date DATE DEFAULT SYSDATE,
    modified_date DATE DEFAULT SYSDATE
);
```

#### ADDON_HISTORY
```sql
CREATE TABLE addon_history (
    id NUMBER(19) PRIMARY KEY,
    addon_id NUMBER(19) NOT NULL,
    reservation_id NUMBER(19) NOT NULL,
    guest_id NUMBER(19),
    history_type VARCHAR2(20) NOT NULL,
    change_date DATE DEFAULT SYSDATE,
    old_value CLOB,
    new_value CLOB,
    reason VARCHAR2(500),
    user_id NUMBER(19),
    CONSTRAINT fk_addon_hist_addon FOREIGN KEY (addon_id) REFERENCES addons(id)
);
```

#### RESERVATIONS
```sql
CREATE TABLE reservations (
    id NUMBER(19) PRIMARY KEY,
    confirmation_number VARCHAR2(50) UNIQUE NOT NULL,
    guest_id NUMBER(19) NOT NULL,
    hotel_id NUMBER(19) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_type VARCHAR2(50),
    total_amount NUMBER(10,2),
    status VARCHAR2(20) DEFAULT 'CONFIRMED',
    created_date DATE DEFAULT SYSDATE,
    modified_date DATE DEFAULT SYSDATE
);
```

#### ADDON_TASKS
```sql
CREATE TABLE addon_tasks (
    id NUMBER(19) PRIMARY KEY,
    task_type VARCHAR2(50) NOT NULL,
    addon_id NUMBER(19),
    reservation_id NUMBER(19),
    scheduled_time DATE NOT NULL,
    status VARCHAR2(20) DEFAULT 'PENDING',
    priority NUMBER(3) DEFAULT 5,
    retry_count NUMBER(3) DEFAULT 0,
    last_error CLOB,
    completed_time DATE,
    created_date DATE DEFAULT SYSDATE
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_addon_history_addon_id ON addon_history(addon_id);
CREATE INDEX idx_addon_history_reservation ON addon_history(reservation_id);
CREATE INDEX idx_addon_history_date ON addon_history(change_date);
CREATE INDEX idx_addon_tasks_scheduled ON addon_tasks(scheduled_time, status);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
```

## Monitoring and Logging

### Application Logging
**Framework**: SLF4J with Logback implementation

**Configuration**: `src/main/resources/logback.xml`
```xml
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/var/log/addon-portal/application.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>/var/log/addon-portal/application.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.passkey.addon" level="INFO"/>
    <logger name="org.springframework.security" level="DEBUG"/>
    <logger name="org.springframework.web" level="INFO"/>
    
    <root level="WARN">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

### Performance Monitoring
- **Datadog Integration**: Application metrics and APM
- **JVM Metrics**: Heap usage, GC performance, thread pools
- **Database Metrics**: Connection pool usage, query performance
- **Custom Metrics**: Addon processing rates, error rates

### Health Checks
**Endpoint**: `/addon/health`

**Checks**:
- Database connectivity
- External service availability
- Memory usage thresholds
- Disk space availability

## Security Configuration

### Spring Security Setup
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/health", "/css/**", "/js/**").permitAll()
                .anyRequest().authenticated()
            .and()
            .formLogin()
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard")
            .and()
            .logout()
                .logoutSuccessUrl("/login?logout")
            .and()
            .sessionManagement()
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false);
    }
}
```

### CSRF Protection
- Enabled by default for all state-changing operations
- Token validation on POST, PUT, DELETE requests
- AJAX requests must include CSRF token in headers

### Password Security
- Minimum 8 characters with complexity requirements
- BCrypt hashing with salt
- Account lockout after 5 failed attempts
- Password reset with security questions

## Performance Optimization

### Caching Strategy
**EhCache Configuration**: `src/main/resources/ehcache.xml`
```xml
<ehcache>
    <diskStore path="/tmp/addon-cache"/>
    
    <cache name="hotelCache"
           maxElementsInMemory="1000"
           eternal="false"
           timeToIdleSeconds="300"
           timeToLiveSeconds="600"
           overflowToDisk="true"/>
           
    <cache name="addonCache"
           maxElementsInMemory="5000"
           eternal="false"
           timeToIdleSeconds="600"
           timeToLiveSeconds="1800"
           overflowToDisk="true"/>
</ehcache>
```

### Database Optimization
- Connection pooling with C3P0
- Prepared statement caching
- Query result caching for static data
- Database index optimization for common queries

### JVM Tuning
```bash
# WildFly JVM Options
-Xms2g
-Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/addon-portal/
```