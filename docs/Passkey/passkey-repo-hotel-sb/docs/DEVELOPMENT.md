# Development Guide

## Prerequisites

### Required Software

- **Java 17+**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool for Java modules
- **pnpm 8+**: Package manager for build tooling
- **Docker**: For containerization and local services
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Optional Tools

- **Oracle SQL Developer**: Database management
- **Postman**: API testing
- **Docker Compose**: Local service orchestration
- **AWS CLI**: For cloud resource management

### Environment Setup

**Java Installation**:
```bash
# Using SDKMAN (recommended)
curl -s "https://get.sdkman.io" | bash
sdk install java 17.0.2-open
sdk use java 17.0.2-open

# Verify installation
java -version
javac -version
```

**Maven Installation**:
```bash
# Using SDKMAN
sdk install maven 3.9.4

# Verify installation
mvn -version
```

**pnpm Installation**:
```bash
# Using npm
npm install -g pnpm

# Verify installation
pnpm --version
```

## Local Setup

### Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-hotel-sb.git
cd passkey-hotel-sb
```

### Install Dependencies

```bash
# Install Node.js dependencies for build tooling
pnpm install

# Install Maven dependencies
cd packages/passkey-hotel-sb
mvn clean install
```

### Database Setup

**Option 1: Local Oracle Database**

```bash
# Using Docker
docker run -d \
  --name oracle-local \
  -p 1521:1521 \
  -p 5500:5500 \
  -e ORACLE_PWD=password123 \
  -e ORACLE_CHARACTERSET=AL32UTF8 \
  container-registry.oracle.com/database/express:21.3.0-xe

# Wait for database to start (check logs)
docker logs -f oracle-local
```

**Option 2: H2 In-Memory Database (for testing)**

```yaml
# Add to application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  h2:
    console:
      enabled: true
      path: /h2-console
```

### Configuration

**Create Local Configuration**:

```bash
# Copy development configuration
cp packages/passkey-hotel-sb/service/configs/dev.yaml packages/passkey-hotel-sb/service/configs/local.yaml
```

**Edit local.yaml**:
```yaml
spring:
  profiles:
    active: local
  datasource:
    url: jdbc:oracle:thin:@localhost:1521:XE
    username: system
    password: password123
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      maximum-pool-size: 5
      minimum-idle: 1

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: "*"
  endpoint:
    health:
      show-details: always

logging:
  level:
    com.cvent.passkeyhotelsb: DEBUG
    org.springframework.web: DEBUG
    org.mybatis: DEBUG

# Disable OAuth for local development
cvent:
  oauth:
    enabled: false
```

### Environment Variables

**Create .env file**:
```bash
# Database
DB_USERNAME=system
DB_PASSWORD=password123
DB_URL=jdbc:oracle:thin:@localhost:1521:XE

# OAuth (if enabled)
OAUTH_CLIENT_ID=local-client
OAUTH_CLIENT_SECRET=local-secret
OAUTH_TOKEN_URI=https://auth-dev.cvent.com/oauth/token

# Monitoring (optional for local)
DATADOG_API_KEY=your-api-key
DATADOG_APP_KEY=your-app-key
```

## Running the Application

### Start the Service

**Using Maven**:
```bash
cd packages/passkey-hotel-sb/service
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=configs/local.yaml"
```

**Using Java**:
```bash
cd packages/passkey-hotel-sb/service
mvn clean package
java -jar target/passkey-hotel-2.4.3.jar --spring.config.location=configs/local.yaml
```

**Using IDE**:
1. Import project into IntelliJ IDEA
2. Set main class: `com.cvent.passkeyhotelsb.PasskeyHotelSbApplication`
3. Set program arguments: `--spring.config.location=configs/local.yaml`
4. Set working directory: `packages/passkey-hotel-sb/service`
5. Run the application

### Verify Service

**Health Check**:
```bash
curl http://localhost:8080/actuator/health
```

**Expected Response**:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP"
    },
    "diskSpace": {
      "status": "UP"
    }
  }
}
```

**API Test**:
```bash
curl -X GET "http://localhost:8080/passkey-hotel/v1/events/1/hotels/1/attendee-types/1/ecommerce-rules" \
  -H "Accept: application/json"
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
mvn test

# Run tests for specific module
cd packages/passkey-hotel-sb/service
mvn test

# Run specific test class
mvn test -Dtest=EventControllerTest

# Run with coverage
mvn test jacoco:report
```

### Integration Tests

```bash
# Run integration tests
mvn verify -Prun-it

# Run specific integration test
mvn test -Dtest=PasskeyHotelSbApplicationIT
```

### Test Configuration

**application-test.yml**:
```yaml
spring:
  profiles:
    active: test
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true

logging:
  level:
    com.cvent.passkeyhotelsb: DEBUG
    org.springframework.test: DEBUG
    org.springframework.transaction: DEBUG
```

## Code Structure

### Package Organization

```
com.cvent.passkeyhotelsb/
├── PasskeyHotelSbApplication.java      # Main application class
├── PasskeyHotelSbConfiguration.java    # Application configuration
├── auth/                               # Authentication components
│   └── SecurityConfiguration.java
├── config/                             # Configuration classes
│   ├── DatabaseConfiguration.java
│   └── CacheConfiguration.java
├── controllers/                        # REST controllers
│   └── EventController.java
├── service/                           # Business logic services
│   └── ECommerceRuleService.java
├── dao/                               # Data access layer
│   ├── mappers/                       # MyBatis mappers
│   └── entities/                      # Database entities
├── converter/                         # Data converters
│   └── ECommerceRuleConverter.java
├── health/                            # Health check components
│   └── DatabaseHealthIndicator.java
└── legacy/                            # Legacy system integration
    └── LegacyServiceAdapter.java
```

### Naming Conventions

**Classes**:
- Controllers: `*Controller` (e.g., `EventController`)
- Services: `*Service` (e.g., `ECommerceRuleService`)
- DAOs: `*Mapper` (e.g., `ECommerceRuleMapper`)
- DTOs: `*Request`, `*Response` (e.g., `ECommerceRulesResponse`)
- Entities: Plain nouns (e.g., `ECommerceRule`)

**Methods**:
- REST endpoints: HTTP verb + noun (e.g., `getECommerceRules`)
- Service methods: Business action (e.g., `calculatePricing`)
- DAO methods: Data operation (e.g., `findByEventAndHotel`)

**Variables**:
- Use camelCase
- Be descriptive (e.g., `attendeeTypeId` not `atId`)
- Constants in UPPER_SNAKE_CASE

## Coding Standards

### Code Style

**Checkstyle Configuration**:
```xml
<!-- checkstyle.xml -->
<module name="Checker">
    <module name="TreeWalker">
        <module name="Indentation">
            <property name="basicOffset" value="2"/>
            <property name="braceAdjustment" value="0"/>
            <property name="caseIndent" value="2"/>
        </module>
        <module name="LineLength">
            <property name="max" value="120"/>
        </module>
        <module name="MethodLength">
            <property name="max" value="50"/>
        </module>
    </module>
</module>
```

**Code Formatting**:
```bash
# Format code using Maven
mvn spotless:apply

# Check formatting
mvn spotless:check
```

### Documentation Standards

**JavaDoc Requirements**:
```java
/**
 * Retrieves e-commerce rules for a specific event, hotel, and attendee type.
 *
 * @param eventId the unique identifier of the event
 * @param hotelId the unique identifier of the hotel
 * @param attendeeTypeId the unique identifier of the attendee type
 * @param locale the locale for localized content (optional)
 * @return the e-commerce rules for the specified parameters
 * @throws ResourceNotFoundException if the specified combination is not found
 */
public ECommerceRules getECommerceRules(Long eventId, Long hotelId, 
                                       Long attendeeTypeId, String locale) {
    // Implementation
}
```

## Common Development Tasks

### Adding a New REST Endpoint

1. **Create Controller Method**:
```java
@RestController
@RequestMapping("/passkey-hotel/v1")
public class HotelController {
    
    @GetMapping("/hotels/{hotelId}")
    public ResponseEntity<Hotel> getHotel(@PathVariable Long hotelId) {
        Hotel hotel = hotelService.findById(hotelId);
        return ResponseEntity.ok(hotel);
    }
}
```

2. **Create Service Method**:
```java
@Service
public class HotelService {
    
    private final HotelMapper hotelMapper;
    
    public Hotel findById(Long hotelId) {
        return hotelMapper.findById(hotelId);
    }
}
```

3. **Create MyBatis Mapper**:
```java
@Mapper
public interface HotelMapper {
    Hotel findById(@Param("hotelId") Long hotelId);
}
```

4. **Create SQL Mapping**:
```xml
<mapper namespace="com.cvent.passkeyhotelsb.dao.mappers.HotelMapper">
    <select id="findById" resultType="Hotel">
        SELECT hotel_id, name, address, phone
        FROM hotels
        WHERE hotel_id = #{hotelId}
    </select>
</mapper>
```

### Adding Database Migration

1. **Create Migration File**:
```sql
-- V1.1__Add_hotel_amenities_table.sql
CREATE TABLE hotel_amenities (
    id NUMBER(19) PRIMARY KEY,
    hotel_id NUMBER(19) NOT NULL,
    amenity_name VARCHAR2(100) NOT NULL,
    description VARCHAR2(500),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hotel_amenities_hotel 
        FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);

CREATE INDEX idx_hotel_amenities_hotel ON hotel_amenities(hotel_id);
```

2. **Update Entity**:
```java
public class Hotel {
    private Long hotelId;
    private String name;
    private List<Amenity> amenities;
    // getters and setters
}
```

### Adding Configuration Property

1. **Add to Configuration Class**:
```java
@ConfigurationProperties(prefix = "passkey.hotel")
@Data
public class PasskeyHotelProperties {
    private int maxSearchResults = 100;
    private Duration cacheTimeout = Duration.ofMinutes(10);
}
```

2. **Use in Service**:
```java
@Service
public class HotelSearchService {
    
    private final PasskeyHotelProperties properties;
    
    public List<Hotel> searchHotels(String criteria) {
        // Use properties.getMaxSearchResults()
    }
}
```

## Debugging

### Local Debugging

**IntelliJ IDEA**:
1. Set breakpoints in code
2. Run application in debug mode
3. Use "Debug" configuration with VM options:
   ```
   -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005
   ```

**Remote Debugging**:
```bash
# Start application with debug port
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 \
  -jar target/passkey-hotel-2.4.3.jar
```

### Logging

**Enable Debug Logging**:
```yaml
logging:
  level:
    com.cvent.passkeyhotelsb: DEBUG
    org.springframework.web: DEBUG
    org.mybatis: DEBUG
    org.springframework.security: DEBUG
```

**Custom Logger**:
```java
private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

public void processRequest() {
    LOG.debug("Processing request with parameters: {}", parameters);
    LOG.info("Request processed successfully");
}
```

### Database Debugging

**Enable SQL Logging**:
```yaml
mybatis:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl

logging:
  level:
    org.mybatis: DEBUG
```

**H2 Console** (for testing):
```yaml
spring:
  h2:
    console:
      enabled: true
      path: /h2-console
```

Access at: `http://localhost:8080/h2-console`

## Performance Testing

### Load Testing with JMeter

**Create Test Plan**:
```xml
<!-- passkey-hotel-load-test.jmx -->
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan>
      <elementProp name="TestPlan.arguments" elementType="Arguments" guiclass="ArgumentsPanel">
        <collectionProp name="Arguments.arguments">
          <elementProp name="host" elementType="Argument">
            <stringProp name="Argument.name">host</stringProp>
            <stringProp name="Argument.value">localhost</stringProp>
          </elementProp>
          <elementProp name="port" elementType="Argument">
            <stringProp name="Argument.name">port</stringProp>
            <stringProp name="Argument.value">8080</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
  </hashTree>
</jmeterTestPlan>
```

**Run Load Test**:
```bash
jmeter -n -t passkey-hotel-load-test.jmx -l results.jtl
```

### Profiling

**JProfiler Integration**:
```bash
java -agentpath:/path/to/jprofiler/bin/linux-x64/libjprofilerti.so=port=8849 \
  -jar target/passkey-hotel-2.4.3.jar
```

**JVM Monitoring**:
```bash
# Enable JMX
java -Dcom.sun.management.jmxremote \
  -Dcom.sun.management.jmxremote.port=9999 \
  -Dcom.sun.management.jmxremote.authenticate=false \
  -Dcom.sun.management.jmxremote.ssl=false \
  -jar target/passkey-hotel-2.4.3.jar
```

## Troubleshooting

### Common Issues

**Database Connection Issues**:
```bash
# Check database connectivity
telnet localhost 1521

# Verify JDBC URL format
jdbc:oracle:thin:@hostname:port:service_name
```

**Memory Issues**:
```bash
# Increase heap size
export JAVA_OPTS="-Xmx2g -Xms1g"

# Enable garbage collection logging
export JAVA_OPTS="$JAVA_OPTS -XX:+PrintGC -XX:+PrintGCDetails"
```

**Port Conflicts**:
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Getting Help

- **Slack Channel**: #passkey-api
- **Team**: metre-stick
- **Documentation**: Internal Confluence pages
- **Code Reviews**: GitHub pull requests

## Additional Resources

## Quick Start


### Prerequisites
- Java 17+
- Maven 3.6+
- pnpm (for build tooling)
- Docker (for local development)

### Running Locally

```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-hotel-sb.git
cd passkey-hotel-sb

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run the service locally
cd packages/passkey-hotel-sb/service
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=configs/dev.yaml"
```

### API Access

The service exposes REST APIs at:
- Base URL: `http://localhost:8080/passkey-hotel/v1`
- Health Check: `http://localhost:8080/actuator/health`

## Team & Support


- **Owner**: metre-stick team
- **Platform**: Passkey
- **Product**: Passkey for Hotels
- **Slack**: #passkey-api

## Links


- [GitHub Repository](https://github.com/cvent-internal/passkey-hotel-sb)
- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-hotel-sb/)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-hotel)
- [Octopus Deployment](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-hotel-springboot/deployments)
