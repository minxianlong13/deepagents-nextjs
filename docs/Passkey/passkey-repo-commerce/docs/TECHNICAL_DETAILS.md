# Technical Details

## Technology Stack

### Core Technologies
- **Framework**: Jakarta EE 8 (Enterprise Java)
- **Language**: Java 17
- **Build Tool**: Maven 3.x
- **Application Server**: Wildfly 26.1.3.Final
- **Database**: Oracle Database
- **Package Manager**: pnpm (for Node.js tooling)

### Enterprise Java Technologies
- **EJB 3.2**: Enterprise JavaBeans for business logic
- **JPA 2.2**: Java Persistence API for data access
- **CDI 2.0**: Contexts and Dependency Injection
- **JTA 1.2**: Java Transaction API for transaction management
- **JNDI**: Java Naming and Directory Interface for resource lookup

### Supporting Technologies
- **Node.js**: Build tooling and package management
- **Docker**: Containerization for deployment
- **Hogan**: Configuration templating system

## Dependencies

### Core Java Dependencies
```xml
<!-- Jakarta EE Platform -->
<dependency>
    <groupId>jakarta.platform</groupId>
    <artifactId>jakarta.jakartaee-api</artifactId>
    <version>8.0.0</version>
</dependency>

<!-- Wildfly BOM -->
<dependency>
    <groupId>org.wildfly.bom</groupId>
    <artifactId>wildfly-jakartaee8-with-tools</artifactId>
    <version>26.1.3.Final</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

### Payment Processing Dependencies
```xml
<!-- Authorize.NET SDK -->
<dependency>
    <groupId>net.authorize</groupId>
    <artifactId>anet-java-sdk</artifactId>
    <version>2.0.6</version>
</dependency>

<!-- Cvent Auth Service -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-service-api</artifactId>
    <version>6.7.1</version>
</dependency>
```

### Database Dependencies
```xml
<!-- Oracle JDBC Driver -->
<dependency>
    <groupId>com.oracle.ojdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>19.3.0.0</version>
</dependency>
```

### Utility Dependencies
```xml
<!-- Jackson JSON Processing -->
<dependency>
    <groupId>com.fasterxml.jackson</groupId>
    <artifactId>jackson-bom</artifactId>
    <version>2.15.0</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>

<!-- Google Guava -->
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>31.1-jre</version>
</dependency>

<!-- Apache Commons -->
<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.15.0</version>
</dependency>
```

### Logging Dependencies
```xml
<!-- SLF4J API -->
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>2.0.11</version>
</dependency>

<!-- Log4j2 Implementation -->
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-bom</artifactId>
    <version>2.20.0</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

### Testing Dependencies
```xml
<!-- JUnit -->
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
</dependency>

<!-- PowerMock -->
<dependency>
    <groupId>org.powermock</groupId>
    <artifactId>powermock-module-junit4</artifactId>
    <version>2.0.9</version>
    <scope>test</scope>
</dependency>
```

## Configuration

### Environment Variables
```bash
# Database Configuration
DB_LIVEDS_PASSWORD=<database_password>
DB_LIVEDS_URL=<database_url>
DB_LIVEDS_USERNAME=<database_username>

# EJB Security
EJB_SECURITY_REALM=<security_realm>

# Application Server
WILDFLY_HOME=/opt/wildfly
JAVA_OPTS="-Xms512m -Xmx2048m"
```

### Wildfly Configuration
```xml
<!-- Datasource Configuration -->
<datasource jndi-name="java:jboss/datasources/LiveDS" pool-name="LiveDS">
    <connection-url>${DB.LIVEDS.URL}</connection-url>
    <driver>oracle</driver>
    <security>
        <user-name>${DB.LIVEDS.USERNAME}</user-name>
        <password>${DB.LIVEDS.PASSWORD}</password>
    </security>
</datasource>

<!-- Security Domain -->
<security-domain name="commerce-security">
    <authentication>
        <login-module code="Database" flag="required">
            <module-option name="dsJndiName" value="java:jboss/datasources/LiveDS"/>
            <module-option name="principalsQuery" value="SELECT password FROM users WHERE username=?"/>
            <module-option name="rolesQuery" value="SELECT role, 'Roles' FROM user_roles WHERE username=?"/>
        </login-module>
    </authentication>
</security-domain>
```

### Application Configuration
```properties
# Commerce Configuration
commerce.scheduler.interval=180000  # 3 minutes in milliseconds
commerce.batch.size=100
commerce.retry.max.attempts=3

# Payment Gateway Configuration
authorize.net.api.url=https://api.authorize.net/xml/v1/request.api
stripe.api.url=https://api.stripe.com/v1
pbb.service.url=https://payment-service.core.cvent.org

# Monitoring Configuration
datadog.service.name=passkey-commerce
datadog.env=${ENVIRONMENT}
```

## Database Schema

### Core Tables
```sql
-- Payment Transactions
CREATE TABLE payment_transactions (
    transaction_id VARCHAR2(50) PRIMARY KEY,
    order_id VARCHAR2(100) NOT NULL,
    amount NUMBER(10,2) NOT NULL,
    currency VARCHAR2(3) DEFAULT 'USD',
    status VARCHAR2(20) NOT NULL,
    merchant_account_id VARCHAR2(50) NOT NULL,
    payment_method_id VARCHAR2(50),
    created_date DATE DEFAULT SYSDATE,
    last_modified_date DATE DEFAULT SYSDATE
);

-- Transaction Events
CREATE TABLE transaction_events (
    event_id VARCHAR2(50) PRIMARY KEY,
    transaction_id VARCHAR2(50) NOT NULL,
    event_type VARCHAR2(20) NOT NULL,
    event_date DATE DEFAULT SYSDATE,
    amount NUMBER(10,2),
    status VARCHAR2(20) NOT NULL,
    gateway_response CLOB,
    error_code VARCHAR2(10),
    error_message VARCHAR2(500),
    FOREIGN KEY (transaction_id) REFERENCES payment_transactions(transaction_id)
);

-- Merchant Accounts
CREATE TABLE merchant_accounts (
    merchant_account_id VARCHAR2(50) PRIMARY KEY,
    account_type VARCHAR2(20) NOT NULL,
    gateway_configuration CLOB,
    is_active NUMBER(1) DEFAULT 1,
    created_date DATE DEFAULT SYSDATE
);

-- Scheduled Transactions
CREATE TABLE scheduled_transactions (
    scheduled_transaction_id VARCHAR2(50) PRIMARY KEY,
    original_transaction_id VARCHAR2(50) NOT NULL,
    operation_type VARCHAR2(20) NOT NULL,
    scheduled_date DATE NOT NULL,
    amount NUMBER(10,2) NOT NULL,
    attempts NUMBER(3) DEFAULT 0,
    max_attempts NUMBER(3) DEFAULT 3,
    status VARCHAR2(20) DEFAULT 'PENDING',
    FOREIGN KEY (original_transaction_id) REFERENCES payment_transactions(transaction_id)
);
```

### Indexes
```sql
-- Performance Indexes
CREATE INDEX idx_payment_trans_status ON payment_transactions(status);
CREATE INDEX idx_payment_trans_date ON payment_transactions(created_date);
CREATE INDEX idx_transaction_events_trans_id ON transaction_events(transaction_id);
CREATE INDEX idx_scheduled_trans_status ON scheduled_transactions(status);
CREATE INDEX idx_scheduled_trans_date ON scheduled_transactions(scheduled_date);
```

## Build Configuration

### Maven Configuration
```xml
<properties>
    <maven.compiler.release>17</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <jakarta.ee.version>8.0.0</jakarta.ee.version>
    <wildfly.version>26.1.3.Final</wildfly.version>
    <jacoco.version>0.8.10</jacoco.version>
</properties>

<build>
    <plugins>
        <!-- Compiler Plugin -->
        <plugin>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <encoding>UTF-8</encoding>
            </configuration>
        </plugin>
        
        <!-- EJB Plugin -->
        <plugin>
            <artifactId>maven-ejb-plugin</artifactId>
            <version>3.2.1</version>
            <configuration>
                <ejbVersion>3.2</ejbVersion>
            </configuration>
        </plugin>
        
        <!-- EAR Plugin -->
        <plugin>
            <artifactId>maven-ear-plugin</artifactId>
            <version>3.3.0</version>
            <configuration>
                <version>8</version>
                <defaultLibBundleDir>lib</defaultLibBundleDir>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### Node.js Build Scripts
```json
{
  "scripts": {
    "build": "mvn -B package -Dmaven.test.skip=true -Dtaglabel=${npm_package_version}",
    "test": "run-s test:*",
    "test:java": "mvn -B verify -Dtaglabel=${npm_package_version}",
    "test:sonar": "mvn -B sonar:sonar -Dsonar.host.url=https://sonar.core.cvent.org",
    "clean": "mvn -B clean"
  }
}
```

## Monitoring & Logging

### Logging Configuration
```xml
<!-- log4j2.xml -->
<Configuration status="WARN">
    <Appenders>
        <Console name="Console" target="SYSTEM_OUT">
            <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </Console>
        
        <File name="FileAppender" fileName="logs/commerce.log">
            <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </File>
    </Appenders>
    
    <Loggers>
        <Logger name="com.passkey" level="DEBUG"/>
        <Logger name="com.lanyon" level="DEBUG"/>
        <Root level="INFO">
            <AppenderRef ref="Console"/>
            <AppenderRef ref="FileAppender"/>
        </Root>
    </Loggers>
</Configuration>
```

### JMX Monitoring
```java
@ManagedBean
@ApplicationScoped
public class CommerceMetrics {
    
    @ManagedAttribute
    public long getTotalTransactions() {
        return transactionCounter.get();
    }
    
    @ManagedAttribute
    public double getAverageProcessingTime() {
        return averageProcessingTime.get();
    }
    
    @ManagedOperation
    public String getSystemHealth() {
        return healthChecker.checkHealth();
    }
}
```

### Datadog Integration
```java
// Custom metrics
StatsD statsd = new NonBlockingStatsDClient("passkey.commerce", "localhost", 8125);

// Transaction metrics
statsd.incrementCounter("commerce.transaction.count");
statsd.recordGaugeValue("commerce.transaction.amount", amount.doubleValue());
statsd.recordExecutionTime("commerce.processing.time", processingTime);
```

## Security Configuration

### EJB Security
```java
@Stateless
@RolesAllowed({"commerce-user", "admin"})
@SecurityDomain("commerce-security")
public class PaymentProcessorEJB {
    
    @RolesAllowed("admin")
    public void configureGateway(GatewayConfig config) {
        // Admin-only operation
    }
    
    @PermitAll
    public SystemStatus getSystemStatus() {
        // Public operation
    }
}
```

### SSL/TLS Configuration
```xml
<!-- Wildfly SSL Configuration -->
<tls>
    <key-stores>
        <key-store name="commerce-keystore">
            <credential-reference clear-text="keystore-password"/>
            <implementation type="JKS"/>
            <file path="commerce.keystore" relative-to="jboss.server.config.dir"/>
        </key-store>
    </key-stores>
    <key-managers>
        <key-manager name="commerce-key-manager" key-store="commerce-keystore">
            <credential-reference clear-text="key-password"/>
        </key-manager>
    </key-managers>
</tls>
```

## Performance Tuning

### JVM Configuration
```bash
# JVM Memory Settings
JAVA_OPTS="-Xms1024m -Xmx4096m"
JAVA_OPTS="$JAVA_OPTS -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m"

# Garbage Collection
JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# JMX Monitoring
JAVA_OPTS="$JAVA_OPTS -Dcom.sun.management.jmxremote"
JAVA_OPTS="$JAVA_OPTS -Dcom.sun.management.jmxremote.port=9999"
```

### Database Connection Pool
```xml
<datasource jndi-name="java:jboss/datasources/LiveDS" pool-name="LiveDS">
    <connection-url>${DB.LIVEDS.URL}</connection-url>
    <driver>oracle</driver>
    <pool>
        <min-pool-size>10</min-pool-size>
        <max-pool-size>50</max-pool-size>
        <prefill>true</prefill>
    </pool>
    <timeout>
        <idle-timeout-minutes>5</idle-timeout-minutes>
        <query-timeout>30</query-timeout>
    </timeout>
</datasource>
```

### EJB Pool Configuration
```xml
<session-bean>
    <stateless>
        <bean-instance-pool-ref pool-name="slsb-strict-max-pool"/>
    </stateless>
</session-bean>

<pools>
    <bean-instance-pools>
        <strict-max-pool name="slsb-strict-max-pool" 
                        derive-size="from-cpu-count" 
                        instance-acquisition-timeout="5" 
                        instance-acquisition-timeout-unit="MINUTES"/>
    </bean-instance-pools>
</pools>
```

## Code Quality

### SonarQube Configuration
```xml
<properties>
    <sonar.projectKey>passkey-commerce:group-commerce</sonar.projectKey>
    <sonar.projectName>passkey-commerce</sonar.projectName>
    <sonar.host.url>https://sonar.core.cvent.org</sonar.host.url>
</properties>
```

### Jacoco Coverage
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.10</version>
    <configuration>
        <rules>
            <rule>
                <element>BUNDLE</element>
                <limits>
                    <limit>
                        <counter>LINE</counter>
                        <value>COVEREDRATIO</value>
                        <minimum>0.80</minimum>
                    </limit>
                </limits>
            </rule>
        </rules>
    </configuration>
</plugin>
```