# Technical Details

## Technology Stack

### Backend Service (passkey-file-uploader-sb)
- **Framework**: Spring Boot 3.2.x
- **Language**: Java 17 (OpenJDK)
- **Build Tool**: Maven 3.8+
- **Database**: PostgreSQL (via RDS)
- **Storage**: AWS S3
- **Security**: Spring Security with OAuth 2.0
- **Testing**: JUnit 5, Mockito, TestContainers

### Frontend Application (passkey-file-uploader)
- **Framework**: Next.js 14.x
- **Language**: TypeScript 5.x
- **Build Tool**: pnpm 8.x
- **UI Library**: Cvent Carina Design System
- **Testing**: Jest, React Testing Library, Playwright

### Infrastructure
- **Container Platform**: AWS ECS with Fargate
- **Load Balancer**: Application Load Balancer (ALB)
- **CDN**: AWS CloudFront
- **Monitoring**: Datadog, AWS CloudWatch
- **CI/CD**: Jenkins with Cvent Pipeline Utils

## Dependencies

### Backend Dependencies (Key Libraries)

```xml
<!-- Spring Boot Starters -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.2.x</version>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
    <version>3.2.x</version>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
    <version>3.2.x</version>
</dependency>

<!-- AWS SDK -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.x</version>
</dependency>

<!-- Cvent Libraries -->
<dependency>
    <groupId>com.cvent.springboot</groupId>
    <artifactId>oauth-autoconfigure</artifactId>
    <version>latest</version>
</dependency>

<!-- Immutables for Value Objects -->
<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <version>2.x</version>
</dependency>

<!-- Jackson for JSON Processing -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.x</version>
</dependency>
```

### Frontend Dependencies (Key Libraries)

```json
{
  "dependencies": {
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@cvent/carina": "^2.103.1",
    "@cvent/nextjs": "^2.4.0",
    "@cvent/auth-client": "^5.0.2",
    "@cvent/fetch": "^2.2.6",
    "@cvent/logging": "^2.0.33",
    "typescript": "5.5.3"
  },
  "devDependencies": {
    "@playwright/test": "^1.46.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.17.0",
    "jest": "^29.2.2",
    "eslint": "^8.57.0",
    "@cvent/eslint-config": "2.0.22"
  }
}
```

## Configuration

### Environment Variables

#### Backend Service Configuration

```bash
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/passkey_file_uploader
DATABASE_USERNAME=app_user
DATABASE_PASSWORD=${DATABASE_PASSWORD}

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=passkey-file-uploader-${ENVIRONMENT}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

# OAuth Configuration
OAUTH_ISSUER_URI=https://oauth.cvent.org
OAUTH_CLIENT_ID=passkey-file-uploader
OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}

# Application Configuration
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=${ENVIRONMENT}
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_COM_CVENT=DEBUG

# File Processing Configuration
FILE_MAX_SIZE=104857600  # 100MB in bytes
MALWARE_SCANNER_ENABLED=true
MALWARE_SCANNER_URL=http://passkey-clamav:3310

# Monitoring Configuration
DATADOG_API_KEY=${DATADOG_API_KEY}
DATADOG_SERVICE_NAME=passkey-file-uploader-sb
DATADOG_ENV=${ENVIRONMENT}
```

#### Frontend Application Configuration

```bash
# Next.js Configuration
NEXT_PUBLIC_API_BASE_URL=https://passkey-file-uploader-sb.${ENVIRONMENT}.cvent.org
NEXT_PUBLIC_OAUTH_CLIENT_ID=passkey-file-uploader-frontend
NEXT_PUBLIC_OAUTH_ISSUER=https://oauth.cvent.org

# Feature Flags
NEXT_PUBLIC_ENABLE_DRAG_DROP=true
NEXT_PUBLIC_ENABLE_BULK_UPLOAD=false
NEXT_PUBLIC_MAX_FILE_SIZE=104857600

# Monitoring
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=${DATADOG_CLIENT_TOKEN}
NEXT_PUBLIC_DATADOG_APPLICATION_ID=${DATADOG_APPLICATION_ID}
NEXT_PUBLIC_DATADOG_SITE=datadoghq.com
```

### Application Properties

#### Backend (application.yml)

```yaml
spring:
  application:
    name: passkey-file-uploader-sb
  
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  servlet:
    multipart:
      max-file-size: ${FILE_MAX_SIZE:100MB}
      max-request-size: ${FILE_MAX_SIZE:100MB}
  
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${OAUTH_ISSUER_URI}

server:
  port: ${SERVER_PORT:8080}
  servlet:
    context-path: /

logging:
  level:
    root: ${LOGGING_LEVEL_ROOT:INFO}
    com.cvent: ${LOGGING_LEVEL_COM_CVENT:INFO}
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always

# Custom Application Properties
app:
  file:
    storage:
      s3:
        bucket: ${S3_BUCKET_NAME}
        region: ${AWS_REGION:us-east-1}
    processing:
      malware-scanner:
        enabled: ${MALWARE_SCANNER_ENABLED:true}
        url: ${MALWARE_SCANNER_URL}
        timeout: 30s
```

#### Frontend (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    OAUTH_CLIENT_ID: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

## Database Schema

### Tables

#### upload_records
```sql
CREATE TABLE upload_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UPLOADED',
    application VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('UPLOADED', 'PROCESSING', 'READY', 'ERROR')),
    CONSTRAINT chk_file_size CHECK (file_size > 0)
);

CREATE INDEX idx_upload_records_status ON upload_records(status);
CREATE INDEX idx_upload_records_application ON upload_records(application);
CREATE INDEX idx_upload_records_type ON upload_records(type);
CREATE INDEX idx_upload_records_created_at ON upload_records(created_at);
```

#### processing_logs
```sql
CREATE TABLE processing_logs (
    id BIGSERIAL PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES upload_records(id) ON DELETE CASCADE,
    step VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT chk_processing_status CHECK (status IN ('STARTED', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_processing_logs_upload_id ON processing_logs(upload_id);
CREATE INDEX idx_processing_logs_step ON processing_logs(step);
```

#### alternate_versions
```sql
CREATE TABLE alternate_versions (
    id BIGSERIAL PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES upload_records(id) ON DELETE CASCADE,
    version_type VARCHAR(50) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(upload_id, version_type)
);

CREATE INDEX idx_alternate_versions_upload_id ON alternate_versions(upload_id);
```

### Migrations

Database migrations are managed using Flyway:

```sql
-- V1__Initial_schema.sql
-- V2__Add_processing_logs.sql
-- V3__Add_alternate_versions.sql
-- V4__Add_indexes.sql
```

## Monitoring & Logging

### Application Metrics

#### Custom Metrics (Micrometer)

```java
@Component
public class FileUploadMetrics {
    private final Counter uploadCounter;
    private final Timer uploadTimer;
    private final Gauge processingGauge;
    
    public FileUploadMetrics(MeterRegistry meterRegistry) {
        this.uploadCounter = Counter.builder("file.uploads.total")
            .description("Total number of file uploads")
            .tag("status", "success")
            .register(meterRegistry);
            
        this.uploadTimer = Timer.builder("file.upload.duration")
            .description("File upload processing time")
            .register(meterRegistry);
            
        this.processingGauge = Gauge.builder("file.processing.active")
            .description("Number of files currently being processed")
            .register(meterRegistry, this, FileUploadMetrics::getActiveProcessingCount);
    }
}
```

#### Health Checks

```java
@Component
public class FileUploadHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        try {
            // Check S3 connectivity
            s3Client.headBucket(HeadBucketRequest.builder()
                .bucket(bucketName)
                .build());
                
            // Check database connectivity
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            
            return Health.up()
                .withDetail("s3", "accessible")
                .withDetail("database", "accessible")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

### Logging Configuration

#### Structured Logging (Logback)

```xml
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
    
    <logger name="com.cvent.passkeyfileuploader" level="DEBUG"/>
    <logger name="org.springframework.security" level="DEBUG"/>
    <logger name="org.springframework.web" level="INFO"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

#### Log Correlation

```java
@Component
public class CorrelationIdFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        String correlationId = UUID.randomUUID().toString();
        MDC.put("correlationId", correlationId);
        
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

### Performance Monitoring

#### Database Performance

- **Connection Pooling**: HikariCP with optimized settings
- **Query Monitoring**: Slow query logging enabled
- **Index Usage**: Regular analysis of query execution plans
- **Connection Metrics**: Pool utilization and wait times tracked

#### S3 Performance

- **Transfer Acceleration**: Enabled for faster uploads
- **Multipart Uploads**: Used for files > 5MB
- **Connection Pooling**: AWS SDK connection pooling configured
- **Retry Logic**: Exponential backoff for failed operations

#### JVM Monitoring

```yaml
management:
  metrics:
    export:
      datadog:
        enabled: true
        api-key: ${DATADOG_API_KEY}
        step: 30s
    tags:
      service: passkey-file-uploader-sb
      environment: ${ENVIRONMENT}
```

## Security Implementation

### Input Validation

```java
@RestController
@Validated
public class FileUploadController {
    
    @PostMapping
    public ResponseEntity<UploadMetadata> uploadFile(
            @RequestPart @Valid MultipartFile file,
            @RequestPart @Valid FileMetadata metadata) {
        
        // File validation
        validateFileSize(file);
        validateFileType(file);
        validateFileName(file.getOriginalFilename());
        
        // Metadata validation
        validateMetadata(metadata);
        
        return ResponseEntity.ok(uploadService.uploadFile(file, metadata));
    }
    
    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > maxFileSize) {
            throw new FileTooLargeException("File size exceeds limit");
        }
    }
}
```

### Content Security

```java
@Service
public class MalwareScanningService {
    
    public ScanResult scanFile(InputStream fileContent) {
        try (ClamAVClient clamAV = new ClamAVClient(clamAVHost, clamAVPort)) {
            byte[] reply = clamAV.scan(fileContent);
            return parseScanResult(reply);
        } catch (Exception e) {
            log.error("Malware scanning failed", e);
            throw new ScanningException("Unable to scan file for malware");
        }
    }
}
```

### Data Encryption

- **At Rest**: S3 server-side encryption with KMS
- **In Transit**: TLS 1.3 for all HTTP communications
- **Database**: Encrypted RDS instance with encryption at rest
- **Secrets**: AWS Secrets Manager for sensitive configuration

## Build & Deployment

### Maven Build Configuration

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <image>
                    <name>passkey-file-uploader-sb:${project.version}</name>
                </image>
            </configuration>
        </plugin>
        
        <plugin>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-maven-plugin</artifactId>
            <configuration>
                <url>${DATABASE_URL}</url>
                <user>${DATABASE_USERNAME}</user>
                <password>${DATABASE_PASSWORD}</password>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### Docker Configuration

```dockerfile
FROM openjdk:17-jre-slim

WORKDIR /app

COPY target/passkey-file-uploader-sb-*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Environment-Specific Configurations

- **Development**: LocalStack for AWS services, H2 database
- **Staging**: AWS services with reduced capacity, shared resources
- **Production**: Full AWS infrastructure with high availability