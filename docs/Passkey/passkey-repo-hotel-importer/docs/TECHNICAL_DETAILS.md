# Technical Details

## Technology Stack

### Backend Framework
- **Spring Boot 3.x** - Main application framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Data persistence layer
- **Spring WebFlux** - Reactive web framework for external integrations
- **Jersey (JAX-RS)** - REST API implementation

### Language & Runtime
- **Java 17** - Primary programming language
- **Maven 3.8+** - Build tool and dependency management
- **TypeScript 5.9** - Infrastructure and tooling scripts
- **Node.js 18+** - JavaScript runtime for build tools

### Database
- **Oracle Database** - Primary data store
- **JDBC Driver** - Oracle JDBC 8 (ojdbc8)
- **Connection Pooling** - HikariCP (via Spring Boot)

### External Storage
- **AWS S3** - Media asset storage
- **AWS SDK v2** - S3 client integration

### Build & Package Management
- **Maven** - Java dependency management
- **pnpm** - Node.js package manager
- **Nx** - Monorepo build system

## Dependencies

### Core Spring Boot Dependencies

```xml
<!-- Spring Boot Starters -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jersey</artifactId>
</dependency>
```

### Cvent Framework Dependencies

```xml
<!-- Cvent Common Libraries -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-service</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-spring-boot-starter-oauth</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-tracing</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-observability</artifactId>
</dependency>
```

### External Service Clients

```xml
<!-- Passkey Service Clients -->
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-create-hotel-java-client</artifactId>
    <version>1.1.4</version>
</dependency>
<dependency>
    <groupId>com.cvent.passkey-vendor</groupId>
    <artifactId>passkey-vendor-java-client</artifactId>
    <version>1.6.2</version>
</dependency>
<dependency>
    <groupId>com.cvent.booking-supplier-match</groupId>
    <artifactId>booking-supplier-match-api</artifactId>
    <version>1.4.12</version>
</dependency>
```

### Utility Libraries

```xml
<!-- Object Mapping -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.6.3</version>
</dependency>

<!-- Code Generation -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <scope>provided</scope>
</dependency>

<!-- AWS SDK -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.41.15</version>
</dependency>
```

### TypeScript Dependencies

```json
{
  "devDependencies": {
    "@cvent/cdf": "2.5.0",
    "@cvent/cdk-lib": "^1.35.6",
    "@cvent/builder-maven": "^2.3.17",
    "@cvent/builder-docker": "^3.2.0",
    "@cvent/environments": "^1.46.46",
    "aws-cdk": "^2.1007.0",
    "aws-cdk-lib": "^2.178.2",
    "typescript": "5.9.3",
    "nx": "21.4.1"
  }
}
```

## Configuration

### Application Configuration

The service uses YAML-based configuration with environment-specific files:

```yaml
# configs/dev.yaml
server:
  port: 8080

spring:
  application:
    name: passkey-hotel-importer
  datasource:
    url: jdbc:oracle:thin:@//localhost:1521/XEPDB1
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: oracle.jdbc.OracleDriver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.OracleDialect

# AWS Configuration
aws:
  s3:
    bucket: passkey-hotel-media-dev
    region: us-east-1

# External Service URLs
services:
  cvii:
    base-url: https://cvii-dev.cvent.com
  passkey-create-hotel:
    base-url: https://passkey-create-hotel-dev.cvent.com
  passkey-vendor:
    base-url: https://passkey-vendor-dev.cvent.com
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_USERNAME` | Oracle database username | Yes |
| `DB_PASSWORD` | Oracle database password | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 | Yes |
| `OAUTH_CLIENT_ID` | OAuth client identifier | Yes |
| `OAUTH_CLIENT_SECRET` | OAuth client secret | Yes |
| `DATADOG_API_KEY` | DataDog monitoring key | No |

### JVM Configuration

```bash
# Production JVM settings
JAVA_OPTS="-Xms512m -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

## Database Schema

### Key Tables

#### HOTELS
```sql
CREATE TABLE hotels (
    id VARCHAR2(36) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    address_line1 VARCHAR2(255),
    address_line2 VARCHAR2(255),
    city VARCHAR2(100),
    state VARCHAR2(50),
    postal_code VARCHAR2(20),
    country VARCHAR2(50),
    phone_number VARCHAR2(50),
    email_address VARCHAR2(255),
    star_rating NUMBER(1),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ROOMS
```sql
CREATE TABLE rooms (
    id VARCHAR2(36) PRIMARY KEY,
    hotel_id VARCHAR2(36) NOT NULL,
    room_type VARCHAR2(100) NOT NULL,
    name VARCHAR2(255),
    max_occupancy NUMBER(2),
    bed_configuration VARCHAR2(255),
    size_sqft NUMBER(5),
    base_rate NUMBER(10,2),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);
```

#### PROVIDER_MAPPINGS
```sql
CREATE TABLE provider_mappings (
    id VARCHAR2(36) PRIMARY KEY,
    entity_id VARCHAR2(36) NOT NULL,
    entity_type VARCHAR2(50) NOT NULL,
    provider_code VARCHAR2(50) NOT NULL,
    external_id VARCHAR2(255) NOT NULL,
    last_sync_date TIMESTAMP,
    is_active NUMBER(1) DEFAULT 1,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider_code, external_id)
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_hotels_name ON hotels(name);
CREATE INDEX idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX idx_provider_mappings_entity ON provider_mappings(entity_id, entity_type);
CREATE INDEX idx_provider_mappings_provider ON provider_mappings(provider_code, external_id);
```

## Monitoring & Logging

### Logging Configuration

```yaml
logging:
  level:
    com.cvent.passkey.hotelimporter: INFO
    org.springframework.web: DEBUG
    org.hibernate.SQL: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

### Metrics Collection

- **Spring Boot Actuator** - Health checks and metrics endpoints
- **Micrometer** - Application metrics collection
- **DataDog Integration** - Custom metrics and traces

### Health Checks

Available at `/actuator/health`:
- Database connectivity
- External service availability
- S3 storage access
- Memory and disk usage

## Build Configuration

### Maven Configuration

```xml
<properties>
    <java.version>17</java.version>
    <spring-boot.version>3.2.0</spring-boot.version>
    <mapstruct.version>1.6.3</mapstruct.version>
    <aws-java-sdk-2.version>2.41.15</aws-java-sdk-2.version>
</properties>

<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <mainClass>com.cvent.passkey.hotelimporter.HotelImporterApplication</mainClass>
            </configuration>
        </plugin>
        
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.mapstruct</groupId>
                        <artifactId>mapstruct-processor</artifactId>
                        <version>${mapstruct.version}</version>
                    </path>
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### Docker Configuration

```dockerfile
FROM openjdk:17-jre-slim

WORKDIR /app

COPY target/passkey-hotel-importer-*.jar app.jar
COPY configs/ configs/

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.config.location=configs/"]
```

## Performance Considerations

### JVM Tuning
- **Heap Size**: 2GB for production workloads
- **Garbage Collector**: G1GC for low-latency requirements
- **GC Pause Target**: 200ms maximum

### Database Optimization
- **Connection Pool**: 20 connections maximum
- **Query Timeout**: 30 seconds
- **Batch Processing**: 100 records per batch

### External Service Timeouts
- **HTTP Client**: 30 second timeout
- **S3 Operations**: 60 second timeout
- **Retry Policy**: 3 attempts with exponential backoff

## Security Configuration

### OAuth Integration
```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .oauth2ResourceServer(oauth2 -> oauth2.jwt())
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().hasRole("ADMIN")
            )
            .build();
    }
}
```

### Data Encryption
- **TLS 1.3** for all external communications
- **Database encryption** at rest
- **S3 encryption** using AWS KMS