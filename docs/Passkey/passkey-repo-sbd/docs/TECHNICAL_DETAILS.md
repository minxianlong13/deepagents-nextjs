# Technical Details

## Technology Stack

### Backend Technologies
- **Framework**: Java EE with EJB 3.x
- **Application Server**: WildFly (JBoss)
- **Language**: Java 17
- **Build Tool**: Maven 3.8+
- **Dependency Injection**: CDI (Contexts and Dependency Injection)
- **Web Services**: JAX-RS for REST APIs
- **Data Access**: JPA/Hibernate
- **Security**: JAAS (Java Authentication and Authorization Service)

### Frontend Technologies
- **Framework**: Next.js 12.3.6
- **Language**: TypeScript 5.5.3
- **UI Library**: React 18.3.1
- **State Management**: React Context + Hooks
- **GraphQL Client**: Apollo Client 3.13.9
- **Styling**: Emotion React 11.14.0
- **Build Tool**: pnpm 8.x
- **Monorepo Tool**: Nx 20.7.0

### Infrastructure & DevOps
- **Containerization**: Docker
- **Container Registry**: AWS ECR
- **Orchestration**: AWS ECS/Fargate
- **CI/CD**: Jenkins
- **Infrastructure as Code**: AWS CDK (TypeScript)
- **Monitoring**: Datadog APM
- **Log Management**: Datadog Logs

## Dependencies

### Java Dependencies (Maven)

#### Core Framework Dependencies
```xml
<dependencies>
    <!-- Java EE API -->
    <dependency>
        <groupId>javax</groupId>
        <artifactId>javaee-api</artifactId>
        <version>8.0</version>
    </dependency>
    
    <!-- WildFly BOM -->
    <dependency>
        <groupId>org.wildfly.bom</groupId>
        <artifactId>wildfly-jakartaee8-with-tools</artifactId>
        <version>26.1.3.Final</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
    
    <!-- Hibernate ORM -->
    <dependency>
        <groupId>org.hibernate</groupId>
        <artifactId>hibernate-core</artifactId>
        <version>5.6.15.Final</version>
    </dependency>
    
    <!-- Jackson for JSON processing -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.15.2</version>
    </dependency>
</dependencies>
```

#### Cvent-Specific Dependencies
```xml
<!-- Cvent Framework Libraries -->
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-framework-core</artifactId>
    <version>2.1.5</version>
</dependency>

<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-auth-client</artifactId>
    <version>4.0.0</version>
</dependency>

<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>cvent-logging</artifactId>
    <version>1.0.40</version>
</dependency>
```

### Node.js Dependencies (package.json)

#### Core Framework Dependencies
```json
{
  "dependencies": {
    "next": "^12.3.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "5.5.3",
    "@apollo/client": "^3.13.9",
    "@emotion/react": "^11.14.0",
    "graphql": "15.8.0"
  }
}
```

#### Cvent-Specific Dependencies
```json
{
  "devDependencies": {
    "@cvent/apollo-client": "1.6.0",
    "@cvent/apollo-server": "^1.1.32",
    "@cvent/app-config": "1.1.20",
    "@cvent/auth-client": "^4.0.0",
    "@cvent/cdf": "1.68.22",
    "@cvent/eslint-config": "2.0.21",
    "@cvent/framework-scripts": "1.5.71",
    "@cvent/logging": "1.0.40",
    "@cvent/nextjs": "^1.5.8"
  }
}
```

## Configuration

### Environment Variables

#### Application Configuration
```bash
# Application Settings
APP_NAME=passkey-sbd
APP_VERSION=1.0.0
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=passkey_sbd
DB_USERNAME=sbd_user
DB_PASSWORD=${DB_PASSWORD}
DB_POOL_SIZE=20

# Authentication
AUTH_SERVICE_URL=https://auth.passkey.com
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=3600

# External Services
COMMERCE_SERVICE_URL=https://commerce.passkey.com
REPORTING_SERVICE_URL=https://reporting.passkey.com
GL_SERVICE_URL=https://gl.passkey.com

# Monitoring
DATADOG_API_KEY=${DATADOG_API_KEY}
DATADOG_SERVICE_NAME=passkey-sbd
DATADOG_ENV=${ENVIRONMENT}

# Feature Flags
FEATURE_GRAPHQL_ENABLED=true
FEATURE_REALTIME_UPDATES=true
FEATURE_MALWARE_SCANNING=true
```

#### WildFly Configuration
```xml
<!-- standalone-full.xml -->
<subsystem xmlns="urn:jboss:domain:datasources:6.0">
    <datasources>
        <datasource jndi-name="java:jboss/datasources/PasskeySBDDS" 
                   pool-name="PasskeySBDDS">
            <connection-url>jdbc:postgresql://localhost:5432/passkey_sbd</connection-url>
            <driver>postgresql</driver>
            <security>
                <user-name>${env.DB_USERNAME}</user-name>
                <password>${env.DB_PASSWORD}</password>
            </security>
            <pool>
                <min-pool-size>5</min-pool-size>
                <max-pool-size>20</max-pool-size>
            </pool>
        </datasource>
    </datasources>
</subsystem>
```

### Configuration Files

#### Next.js Configuration (next.config.mjs)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: false
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: '/api/graphql'
      }
    ]
  }
}

export default nextConfig
```

#### TypeScript Configuration (tsconfig.json)
```json
{
  "extends": "@cvent/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/utils/*": ["./src/utils/*"]
    },
    "types": ["jest", "node"]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "dist"
  ]
}
```

## Database Schema

### Primary Tables

#### sub_blocks
```sql
CREATE TABLE sub_blocks (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hotel_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    room_count INTEGER NOT NULL,
    available_rooms INTEGER NOT NULL,
    reserved_rooms INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cutoff_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    modified_by VARCHAR(36),
    
    CONSTRAINT fk_sub_blocks_hotel 
        FOREIGN KEY (hotel_id) REFERENCES hotels(id),
    CONSTRAINT fk_sub_blocks_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_sub_blocks_event 
        FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX idx_sub_blocks_hotel_id ON sub_blocks(hotel_id);
CREATE INDEX idx_sub_blocks_organization_id ON sub_blocks(organization_id);
CREATE INDEX idx_sub_blocks_status ON sub_blocks(status);
CREATE INDEX idx_sub_blocks_dates ON sub_blocks(start_date, end_date);
```

#### room_allocations
```sql
CREATE TABLE room_allocations (
    id VARCHAR(36) PRIMARY KEY,
    sub_block_id VARCHAR(36) NOT NULL,
    room_type_id VARCHAR(36) NOT NULL,
    allocated_count INTEGER NOT NULL,
    available_count INTEGER NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    rate_code VARCHAR(50),
    inclusions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_room_allocations_sub_block 
        FOREIGN KEY (sub_block_id) REFERENCES sub_blocks(id),
    CONSTRAINT fk_room_allocations_room_type 
        FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

CREATE INDEX idx_room_allocations_sub_block_id ON room_allocations(sub_block_id);
CREATE INDEX idx_room_allocations_room_type_id ON room_allocations(room_type_id);
```

#### reservations
```sql
CREATE TABLE reservations (
    id VARCHAR(36) PRIMARY KEY,
    sub_block_id VARCHAR(36) NOT NULL,
    room_allocation_id VARCHAR(36) NOT NULL,
    confirmation_number VARCHAR(20) UNIQUE NOT NULL,
    guest_first_name VARCHAR(100) NOT NULL,
    guest_last_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20),
    additional_guests JSONB,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_nights INTEGER NOT NULL,
    room_number VARCHAR(10),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reservations_sub_block 
        FOREIGN KEY (sub_block_id) REFERENCES sub_blocks(id),
    CONSTRAINT fk_reservations_room_allocation 
        FOREIGN KEY (room_allocation_id) REFERENCES room_allocations(id)
);

CREATE INDEX idx_reservations_sub_block_id ON reservations(sub_block_id);
CREATE INDEX idx_reservations_confirmation ON reservations(confirmation_number);
CREATE INDEX idx_reservations_guest_email ON reservations(guest_email);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
```

## Monitoring & Logging

### Application Monitoring

#### Datadog Integration
```java
// Java application monitoring
@Stateless
public class SubBlockService {
    
    @Inject
    private Logger logger;
    
    @Timed(name = "subblock.create", description = "Time to create sub-block")
    @Counted(name = "subblock.create.count", description = "Sub-block creation count")
    public SubBlock createSubBlock(SubBlockRequest request) {
        logger.info("Creating sub-block: {}", request.getName());
        
        try {
            // Business logic
            SubBlock subBlock = processSubBlockCreation(request);
            
            // Custom metrics
            Metrics.counter("subblock.created", 
                "hotel_id", subBlock.getHotelId(),
                "organization_id", subBlock.getOrganizationId())
                .increment();
                
            return subBlock;
        } catch (Exception e) {
            logger.error("Failed to create sub-block", e);
            Metrics.counter("subblock.creation.error").increment();
            throw e;
        }
    }
}
```

#### Frontend Monitoring
```typescript
// React application monitoring
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'passkey-sbd-frontend',
  env: process.env.NODE_ENV,
  version: process.env.NEXT_PUBLIC_APP_VERSION,
  sampleRate: 100,
  trackInteractions: true,
  defaultPrivacyLevel: 'mask-user-input'
});

// Custom tracking
export const trackSubBlockCreation = (subBlockId: string) => {
  datadogRum.addAction('sub_block_created', {
    sub_block_id: subBlockId,
    timestamp: Date.now()
  });
};
```

### Logging Configuration

#### Logback Configuration (logback.xml)
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
    
    <appender name="DATADOG" class="com.datadoghq.logback.DatadogAppender">
        <apiKey>${DATADOG_API_KEY}</apiKey>
        <hostname>${HOSTNAME}</hostname>
        <service>passkey-sbd</service>
        <env>${ENVIRONMENT}</env>
    </appender>
    
    <logger name="com.cvent.passkey.sbd" level="INFO"/>
    <logger name="org.hibernate.SQL" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="DATADOG"/>
    </root>
</configuration>
```

### Health Checks

#### Application Health Endpoint
```java
@Path("/health")
@ApplicationScoped
public class HealthCheckResource {
    
    @Inject
    private DatabaseHealthCheck databaseCheck;
    
    @Inject
    private ExternalServiceHealthCheck serviceCheck;
    
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response healthCheck() {
        HealthStatus status = new HealthStatus();
        
        // Database connectivity
        status.addCheck("database", databaseCheck.check());
        
        // External service connectivity
        status.addCheck("auth-service", serviceCheck.checkAuthService());
        status.addCheck("commerce-service", serviceCheck.checkCommerceService());
        
        boolean isHealthy = status.isHealthy();
        
        return Response
            .status(isHealthy ? 200 : 503)
            .entity(status)
            .build();
    }
}
```

### Performance Optimization

#### Database Connection Pooling
```xml
<!-- WildFly datasource configuration -->
<pool>
    <min-pool-size>5</min-pool-size>
    <max-pool-size>20</max-pool-size>
    <prefill>true</prefill>
    <use-strict-min>false</use-strict-min>
    <flush-strategy>FailingConnectionOnly</flush-strategy>
</pool>
<timeout>
    <idle-timeout-minutes>15</idle-timeout-minutes>
    <query-timeout>300</query-timeout>
</timeout>
```

#### Caching Strategy
```java
@Stateless
public class HotelService {
    
    @Inject
    @CacheResult(cacheName = "hotels")
    public Hotel getHotel(@CacheKey String hotelId) {
        return hotelRepository.findById(hotelId);
    }
    
    @CacheRemove(cacheName = "hotels")
    public void updateHotel(@CacheKey String hotelId, Hotel hotel) {
        hotelRepository.update(hotel);
    }
}
```