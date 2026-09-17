# Technical Details

## Technology Stack

### Backend Framework
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 17
- **Build Tool**: Maven 3.8+
- **Application Server**: Embedded Jetty (via Dropwizard)

### Frontend/Infrastructure
- **Language**: TypeScript 4.9+
- **Runtime**: Node.js 18+
- **Package Manager**: pnpm 8.x
- **Infrastructure**: AWS CDK 2.x

### Databases
- **Primary Database**: Oracle Database (via JDBC)
- **NoSQL Database**: Amazon DynamoDB
- **Connection Pooling**: HikariCP (via Dropwizard)

### Messaging & Events
- **Message Queue**: Amazon SQS
- **Event Bus**: Amazon EventBridge
- **Event Processing**: Custom SQS consumers with typed message handlers

### Authentication & Security
- **Authentication**: Cvent Auth Service (API Key based)
- **Authorization**: Role-based access control
- **Security Framework**: Cvent Security Framework

## Dependencies

### Core Java Dependencies
```xml
<!-- Dropwizard Core -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-dropwizard</artifactId>
</dependency>

<!-- Authentication -->
<dependency>
    <groupId>com.cvent.auth-service</groupId>
    <artifactId>auth-dropwizard-bundle</artifactId>
</dependency>

<!-- Multi-environment support -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>pangaea</artifactId>
</dependency>

<!-- AWS SDK -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>dynamodb</artifactId>
    <version>2.20.0</version>
</dependency>

<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>sqs</artifactId>
</dependency>

<!-- Passkey Services -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-event-java-client</artifactId>
</dependency>

<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-hotel-java-client</artifactId>
</dependency>

<!-- Database -->
<dependency>
    <groupId>com.oracle</groupId>
    <artifactId>ojdbc8</artifactId>
</dependency>

<!-- Utilities -->
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
</dependency>

<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
</dependency>
```

### TypeScript Dependencies
```json
{
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "@aws-cdk/aws-lambda": "^2.100.0",
    "@aws-cdk/aws-sqs": "^2.100.0",
    "@aws-cdk/aws-events": "^2.100.0",
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0"
  }
}
```

## Configuration

### Environment Variables
```bash
# Database Configuration
DB_HOST=oracle-host.cvent.com
DB_PORT=1521
DB_NAME=passkey_db
DB_USERNAME=passkey_user
DB_PASSWORD=${DB_PASSWORD}

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

# DynamoDB Tables
AUTOBLOCK_DYNAMODB_TABLE=passkey-notifications-autoblock-${ENV}
RESERVATION_TRANSFER_DYNAMODB_TABLE=passkey-notifications-transfers-${ENV}

# SQS Queues
AUTOBLOCK_SQS_QUEUE=passkey-autoblock-events-${ENV}
RESERVATION_TRANSFER_SQS_QUEUE=passkey-reservation-transfers-${ENV}

# Service Endpoints
PASSKEY_EVENT_SERVICE_URL=https://passkey-event.${ENV}.cvent.com
PASSKEY_HOTEL_SERVICE_URL=https://passkey-hotel.${ENV}.cvent.com

# Application Configuration
SERVER_PORT=8080
ADMIN_PORT=8081
LOG_LEVEL=INFO
```

### Configuration Files
```yaml
# configs/dev.yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: oracle.jdbc.OracleDriver
  url: jdbc:oracle:thin:@${DB_HOST}:${DB_PORT}:${DB_NAME}
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  minSize: 8
  maxSize: 32

dynamoDbConfiguration:
  region: ${AWS_REGION}
  endpoint: null  # Use default AWS endpoint

awsCredentialsConfig:
  region: ${AWS_REGION}

autoblockNotificationSqs:
  queueName: ${AUTOBLOCK_SQS_QUEUE}
  pollDelaySeconds: 5
  pollingWaitSeconds: 20
  maxNumberOfMessages: 10
  threadPoolSize: 5

reservationTransferSqs:
  queueName: ${RESERVATION_TRANSFER_SQS_QUEUE}
  pollDelaySeconds: 5
  pollingWaitSeconds: 20
  maxNumberOfMessages: 10
  threadPoolSize: 3

logging:
  level: ${LOG_LEVEL}
  loggers:
    com.cvent.passkeynotifications: DEBUG
    org.apache.ibatis: INFO
  appenders:
    - type: console
      threshold: ALL
      timeZone: UTC
      target: stdout
```

## Database Schema

### Oracle Database Tables

#### PASSKEY_ALERTS
```sql
CREATE TABLE PASSKEY_ALERTS (
    ID NUMBER(19) PRIMARY KEY,
    USER_ID NUMBER(19) NOT NULL,
    EVENT_ID NUMBER(19),
    ALERT_TYPE VARCHAR2(50) NOT NULL,
    MESSAGE CLOB,
    SEVERITY VARCHAR2(20) DEFAULT 'MEDIUM',
    ACKNOWLEDGED NUMBER(1) DEFAULT 0,
    CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    EXPIRES_DATE TIMESTAMP,
    METADATA CLOB
);

CREATE INDEX IDX_ALERTS_USER_ID ON PASSKEY_ALERTS(USER_ID);
CREATE INDEX IDX_ALERTS_EVENT_ID ON PASSKEY_ALERTS(EVENT_ID);
CREATE INDEX IDX_ALERTS_TYPE ON PASSKEY_ALERTS(ALERT_TYPE);
CREATE INDEX IDX_ALERTS_CREATED ON PASSKEY_ALERTS(CREATED_DATE);
```

#### NOTIFICATION_AUDIT
```sql
CREATE TABLE NOTIFICATION_AUDIT (
    ID NUMBER(19) PRIMARY KEY,
    NOTIFICATION_ID VARCHAR2(255) NOT NULL,
    USER_ID NUMBER(19) NOT NULL,
    ACTION VARCHAR2(50) NOT NULL,
    OLD_STATUS VARCHAR2(20),
    NEW_STATUS VARCHAR2(20),
    TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    SOURCE VARCHAR2(100)
);

CREATE INDEX IDX_AUDIT_NOTIFICATION ON NOTIFICATION_AUDIT(NOTIFICATION_ID);
CREATE INDEX IDX_AUDIT_USER ON NOTIFICATION_AUDIT(USER_ID);
```

### DynamoDB Tables

#### AutoBlock Notifications Table
```json
{
  "TableName": "passkey-notifications-autoblock-{env}",
  "KeySchema": [
    {
      "AttributeName": "userId",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "requestId",
      "KeyType": "RANGE"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "userId",
      "AttributeType": "N"
    },
    {
      "AttributeName": "requestId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "eventId",
      "AttributeType": "N"
    },
    {
      "AttributeName": "timestamp",
      "AttributeType": "S"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "EventIdIndex",
      "KeySchema": [
        {
          "AttributeName": "eventId",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "timestamp",
          "KeyType": "RANGE"
        }
      ]
    }
  ]
}
```

#### Reservation Transfer Notifications Table
```json
{
  "TableName": "passkey-notifications-transfers-{env}",
  "KeySchema": [
    {
      "AttributeName": "userId",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "transferId",
      "KeyType": "RANGE"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "userId",
      "AttributeType": "N"
    },
    {
      "AttributeName": "transferId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "eventId",
      "AttributeType": "N"
    }
  ]
}
```

## Monitoring & Logging

### Health Checks
```java
public class PasskeyNotificationsHealthCheck extends HealthCheck {
    @Override
    protected Result check() throws Exception {
        // Check database connectivity
        // Check DynamoDB connectivity
        // Check SQS queue accessibility
        // Check dependent service availability
        return Result.healthy("All systems operational");
    }
}
```

### Metrics Collection
- **Dropwizard Metrics**: Built-in metrics for JVM, HTTP requests, database connections
- **Custom Metrics**: Notification processing rates, queue depths, error rates
- **AWS CloudWatch**: Infrastructure metrics and custom application metrics

### Logging Configuration
```xml
<!-- logback.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <timestamp/>
                <logLevel/>
                <loggerName/>
                <message/>
                <mdc/>
                <arguments/>
                <stackTrace/>
            </providers>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkeynotifications" level="DEBUG"/>
    <logger name="org.apache.ibatis" level="INFO"/>
    <logger name="com.zaxxer.hikari" level="INFO"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### Distributed Tracing
- **Correlation IDs**: Unique request identifiers for tracking across services
- **MDC (Mapped Diagnostic Context)**: Contextual information in logs
- **Request/Response Logging**: Detailed API interaction logs

## Performance Optimization

### Connection Pooling
```yaml
database:
  minSize: 8          # Minimum connections
  maxSize: 32         # Maximum connections
  maxWaitForConnection: 1s
  validationQuery: SELECT 1 FROM DUAL
  checkConnectionWhileIdle: true
  evictionInterval: 10s
```

### Caching Strategy
- **In-Memory Caching**: Frequently accessed notification counts
- **Cache Invalidation**: Event-driven cache updates
- **TTL Configuration**: Time-based cache expiration

### Async Processing
```java
// Thread pool for notification processing
private static final ExecutorService EXECUTOR_SERVICE = 
    Executors.newFixedThreadPool(10);

// Async notification processing
CompletableFuture.supplyAsync(() -> {
    return processNotifications(userId);
}, EXECUTOR_SERVICE);
```

### Database Optimization
- **Connection Pooling**: Optimized pool sizes for different environments
- **Query Optimization**: Indexed queries and prepared statements
- **Batch Operations**: Bulk inserts and updates for efficiency

## Security Considerations

### API Security
- **Authentication**: API key validation on all endpoints
- **Authorization**: Role-based access control
- **Rate Limiting**: Prevents API abuse and DoS attacks

### Data Security
- **Encryption at Rest**: DynamoDB and RDS encryption enabled
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Credential Management**: AWS Secrets Manager for sensitive data

### Input Validation
```java
@Valid @NotNull @PathParam("userId") Long userId,
@Valid @Nullable @QueryParam("eventId") Long eventId
```

### Audit Logging
- All administrative actions logged
- User access patterns monitored
- Security events tracked and alerted