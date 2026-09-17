# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK 17 or later
- **Maven 3.8+**: Build tool and dependency management
- **Docker**: For local database and service dependencies
- **Git**: Version control
- **IDE**: IntelliJ IDEA (recommended) or Eclipse

### Optional Tools
- **Postman**: API testing and development
- **DBeaver**: Database client for Oracle
- **Newman**: Command-line Postman collection runner
- **AWS CLI**: For deployment and AWS resource management

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-reservation.git
cd passkey-reservation
```

### 2. Environment Configuration

#### Create Development Environment File
Create `passkey-reservation-service/configs/dev.env`:
```bash
# API Keys (obtain from team leads)
LOCAL_API_KEY=your-development-api-key
LOCAL_ECOMMERCE_API_KEY=your-ecommerce-api-key

# Database Configuration
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XEPDB1
DB_USER=passkey_reservation
DB_PASSWORD=dev_password

# External Service URLs
AUTH_SERVICE_URL=https://auth-service.staging.cvent.org
EVENT_SERVICE_URL=https://passkey-event-service.staging.cvent.org
INVENTORY_SERVICE_URL=https://passkey-inventory-service.staging.cvent.org
PAYMENTS_SERVICE_URL=https://payments-wallet-service.staging.cvent.org
```

#### Integration Test Configuration
Create `passkey-reservation-integration-test/test_configs/dev.properties`:
```properties
apiKey=your-development-api-key
ecommerceApiKey=your-ecommerce-api-key
baseUrl=http://localhost:8080
```

### 3. Database Setup

#### Using Docker (Recommended)
```bash
# Start Oracle database container
docker run -d \
  --name oracle-dev \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=dev_password \
  -e ORACLE_DATABASE=XEPDB1 \
  container-registry.oracle.com/database/express:21.3.0-xe

# Wait for database to be ready (check logs)
docker logs -f oracle-dev

# Create application user and schema
docker exec -it oracle-dev sqlplus sys/dev_password@XEPDB1 as sysdba
```

#### Database Schema Setup
```sql
-- Create application user
CREATE USER passkey_reservation IDENTIFIED BY dev_password;
GRANT CONNECT, RESOURCE TO passkey_reservation;
GRANT CREATE SESSION TO passkey_reservation;
GRANT UNLIMITED TABLESPACE TO passkey_reservation;

-- Run Flyway migrations
exit
```

### 4. Build Project
```bash
# Clean build with tests
mvn clean package

# Skip tests for faster build
mvn clean package -DskipTests

# Build with release profile
mvn clean package -Prelease
```

### 5. Run Application
```bash
# Using Maven
mvn exec:java -pl passkey-reservation-service \
  -Dexec.mainClass="com.cvent.passkey.reservation.PasskeyReservationServiceApplication" \
  -Dexec.args="server passkey-reservation-service/configs/dev.yaml"

# Using Java directly
java -jar passkey-reservation-service/target/passkey-reservation-service-*.jar \
  server passkey-reservation-service/configs/dev.yaml
```

## IDE Configuration

### IntelliJ IDEA Setup

#### Run Configuration
1. **Create New Application Configuration**:
   - **Name**: Passkey Reservation Service
   - **Main Class**: `com.cvent.passkey.reservation.PasskeyReservationServiceApplication`
   - **Program Arguments**: `server passkey-reservation-service/configs/dev.yaml`
   - **Working Directory**: `$PROJECT_DIR$`
   - **Environment Variables**: Load from `passkey-reservation-service/configs/dev.env`
   - **Use Classpath of Module**: `passkey-reservation-service`

#### Code Style Configuration
1. **Import Code Style**: Use Cvent Java code style (available in team resources)
2. **Enable Checkstyle**: Install Checkstyle plugin and configure with project rules
3. **Configure Inspections**: Enable all Java inspections with project-specific rules

#### Useful Plugins
- **Lombok**: For annotation processing
- **MapStruct Support**: For mapping code generation
- **SonarLint**: Real-time code quality feedback
- **Database Navigator**: Oracle database integration

### Eclipse Setup

#### Project Import
1. **Import Maven Project**: File → Import → Existing Maven Projects
2. **Select Root Directory**: Choose cloned repository directory
3. **Import All Modules**: Select all passkey-reservation modules

#### Run Configuration
1. **Create Java Application**:
   - **Project**: passkey-reservation-service
   - **Main Class**: `com.cvent.passkey.reservation.PasskeyReservationServiceApplication`
   - **Arguments**: `server passkey-reservation-service/configs/dev.yaml`

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-reservation-service

# Run specific test class
mvn test -Dtest=ReservationServiceTest

# Run with coverage
mvn test jacoco:report
```

### Integration Tests
```bash
# Run integration tests (requires running service)
mvn verify -Prun-it -Denv.IT_ENVIRONMENT=dev

# Run specific integration test
mvn verify -Prun-it -Dit.test=ReservationIntegrationTest
```

### API Testing with Postman
```bash
# Install Newman globally
npm install -g newman

# Run Postman collection
newman run postman/PasskeyReservationAPI.postman_collection.json \
  -e postman/dev-environment.json \
  --reporters cli,html \
  --reporter-html-export newman-report.html
```

## Code Structure

### Package Organization
```
com.cvent.passkey.reservation/
├── PasskeyReservationServiceApplication.java    # Main application class
├── PasskeyReservationServiceConfiguration.java # Configuration class
├── resources/                                   # REST endpoints
│   ├── GroupBookingResource.java
│   ├── OrchestratedReservationResource.java
│   ├── ReservationDataResource.java
│   └── AdminReservationResource.java
├── services/                                    # Business logic
│   ├── ReservationService.java
│   ├── GroupBookingService.java
│   └── WaitlistService.java
├── clients/                                     # External service clients
│   ├── PasskeyEventClient.java
│   ├── PasskeyInventoryClient.java
│   └── PaymentsWalletClient.java
├── dao/                                         # Data access objects
│   ├── ReservationDao.java
│   ├── AttendeeDao.java
│   └── WaitlistDao.java
├── model/                                       # Domain models
│   ├── Reservation.java
│   ├── Attendee.java
│   └── GroupBooking.java
├── exceptions/                                  # Custom exceptions
│   ├── ReservationNotFoundException.java
│   └── InventoryUnavailableException.java
└── utils/                                       # Utility classes
    ├── DateUtils.java
    └── ValidationUtils.java
```

### Naming Conventions
- **Classes**: PascalCase (e.g., `ReservationService`)
- **Methods**: camelCase (e.g., `createReservation`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RESERVATION_DAYS`)
- **Packages**: lowercase (e.g., `com.cvent.passkey.reservation`)
- **REST Endpoints**: kebab-case (e.g., `/group-bookings`)

## Coding Standards

### Code Quality Rules
1. **Test Coverage**: Minimum 80% line coverage for new code
2. **Cyclomatic Complexity**: Maximum complexity of 10 per method
3. **Method Length**: Maximum 50 lines per method
4. **Class Length**: Maximum 500 lines per class
5. **Documentation**: All public methods must have JavaDoc

### Best Practices

#### Error Handling
```java
@Path("/reservations")
public class ReservationResource {
    
    @GET
    @Path("/{id}")
    public Response getReservation(@PathParam("id") String reservationId) {
        try {
            Reservation reservation = reservationService.findById(reservationId);
            return Response.ok(reservation).build();
        } catch (ReservationNotFoundException e) {
            return Response.status(404)
                .entity(new ErrorResponse("RESERVATION_NOT_FOUND", e.getMessage()))
                .build();
        } catch (Exception e) {
            log.error("Unexpected error retrieving reservation: {}", reservationId, e);
            return Response.status(500)
                .entity(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"))
                .build();
        }
    }
}
```

#### Logging
```java
@Service
public class ReservationService {
    private static final Logger log = LoggerFactory.getLogger(ReservationService.class);
    
    public Reservation createReservation(CreateReservationRequest request) {
        String correlationId = MDC.get("correlationId");
        log.info("Creating reservation for event: {} [correlationId={}]", 
                request.getEventId(), correlationId);
        
        try {
            // Business logic here
            Reservation reservation = processReservation(request);
            
            log.info("Reservation created successfully: {} [correlationId={}]", 
                    reservation.getId(), correlationId);
            return reservation;
        } catch (Exception e) {
            log.error("Failed to create reservation for event: {} [correlationId={}]", 
                    request.getEventId(), correlationId, e);
            throw e;
        }
    }
}
```

#### Validation
```java
@Valid
public class CreateReservationRequest {
    @NotNull(message = "Event ID is required")
    private String eventId;
    
    @NotNull(message = "Hotel ID is required")
    private String hotelId;
    
    @Future(message = "Check-in date must be in the future")
    private LocalDate checkInDate;
    
    @AssertTrue(message = "Check-out date must be after check-in date")
    public boolean isValidDateRange() {
        return checkOutDate != null && checkInDate != null && 
               checkOutDate.isAfter(checkInDate);
    }
}
```

## Common Development Tasks

### Adding a New REST Endpoint

1. **Create Resource Method**:
```java
@Path("/reservations/{id}/notes")
public class ReservationNotesResource {
    
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addNote(@PathParam("id") String reservationId, 
                           @Valid AddNoteRequest request) {
        // Implementation
    }
}
```

2. **Register Resource in Application**:
```java
@Override
public void run(PasskeyReservationServiceConfiguration configuration, Environment environment) {
    environment.jersey().register(new ReservationNotesResource(noteService));
}
```

3. **Add Integration Test**:
```java
@Test
public void testAddReservationNote() {
    given()
        .contentType(ContentType.JSON)
        .body(new AddNoteRequest("Test note"))
    .when()
        .post("/reservations/res_123/notes")
    .then()
        .statusCode(201)
        .body("noteId", notNullValue());
}
```

### Adding Database Migration

1. **Create Migration File**: `src/main/resources/db/migration/V1_5__Add_reservation_notes_table.sql`
```sql
CREATE TABLE RESERVATION_NOTES (
    NOTE_ID VARCHAR2(50) PRIMARY KEY,
    RESERVATION_ID VARCHAR2(50) NOT NULL,
    NOTE_TEXT CLOB NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREATED_BY VARCHAR2(50) NOT NULL,
    CONSTRAINT FK_NOTE_RESERVATION 
        FOREIGN KEY (RESERVATION_ID) REFERENCES RESERVATIONS(RESERVATION_ID)
);

CREATE INDEX IDX_RESERVATION_NOTES_RES_ID ON RESERVATION_NOTES(RESERVATION_ID);
```

2. **Run Migration**:
```bash
mvn flyway:migrate
```

### Adding External Service Client

1. **Define Client Interface**:
```java
public interface NotificationClient {
    @POST("/notifications")
    Call<NotificationResponse> sendNotification(@Body NotificationRequest request);
}
```

2. **Configure Client**:
```java
@Configuration
public class ClientConfiguration {
    
    @Bean
    public NotificationClient notificationClient(ServiceConfiguration config) {
        return new Retrofit.Builder()
            .baseUrl(config.getNotificationService().getBaseUrl())
            .addConverterFactory(JacksonConverterFactory.create())
            .build()
            .create(NotificationClient.class);
    }
}
```

## Debugging

### Local Debugging
1. **Enable Debug Mode**: Add `-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005` to JVM args
2. **Attach Debugger**: Connect IDE debugger to port 5005
3. **Set Breakpoints**: Add breakpoints in service methods

### Remote Debugging
```bash
# Enable remote debugging in staging
java -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=*:5005 \
  -jar passkey-reservation-service.jar server configs/staging.yaml
```

### Log Analysis
```bash
# Follow application logs
tail -f logs/application.log

# Search for specific correlation ID
grep "correlationId=req_123456" logs/application.log

# Filter error logs
grep "ERROR" logs/application.log | tail -20
```

## Performance Testing

### Load Testing with JMeter
1. **Install JMeter**: Download from Apache JMeter website
2. **Create Test Plan**: Use provided JMeter test plans in `performance-tests/`
3. **Run Load Test**:
```bash
jmeter -n -t performance-tests/reservation-load-test.jmx \
  -l results/load-test-results.jtl \
  -e -o results/html-report/
```

### Profiling
```bash
# Run with JProfiler agent
java -agentpath:/path/to/jprofiler/bin/linux-x64/libjprofilerti.so=port=8849 \
  -jar passkey-reservation-service.jar server configs/dev.yaml

# Run with async-profiler
java -jar async-profiler.jar -e cpu -d 60 -f profile.html <pid>
```

## Contributing

### Git Workflow
1. **Create Feature Branch**: `git checkout -b feature/add-reservation-notes`
2. **Make Changes**: Implement feature with tests
3. **Commit Changes**: Use conventional commit messages
4. **Push Branch**: `git push origin feature/add-reservation-notes`
5. **Create Pull Request**: Submit PR for code review
6. **Address Feedback**: Make requested changes
7. **Merge**: Squash and merge after approval

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(reservation): add support for reservation notes`
- `fix(payment): handle payment timeout gracefully`
- `docs(api): update reservation endpoint documentation`

### Code Review Checklist
- [ ] Code follows established patterns and conventions
- [ ] All tests pass and coverage meets requirements
- [ ] API changes are documented
- [ ] Database migrations are backward compatible
- [ ] Error handling is comprehensive
- [ ] Logging is appropriate and structured
- [ ] Performance impact is considered
- [ ] Security implications are reviewed

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
telnet localhost 1521

# Verify database user permissions
sqlplus passkey_reservation/dev_password@XEPDB1

# Check connection pool status
curl http://localhost:8081/metrics | grep database
```

#### External Service Connectivity
```bash
# Test external service endpoints
curl -H "Authorization: Bearer $API_KEY" \
  https://auth-service.staging.cvent.org/health

# Check service discovery
nslookup passkey-inventory-service.staging.cvent.org
```

#### Memory Issues
```bash
# Monitor memory usage
jstat -gc <pid> 5s

# Generate heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc
jmap -dump:format=b,file=heapdump.hprof <pid>
```

### Getting Help
- **Team Slack**: `#passkey-steak-holders`
- **Documentation**: Internal wiki and Confluence pages
- **Code Reviews**: Tag team members for assistance
- **Pair Programming**: Schedule sessions for complex features

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for local development)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-reservation.git
   cd passkey-reservation
   ```

2. **Set up environment variables**:
   Create `passkey-reservation-service/configs/dev.env`:
   ```bash
   LOCAL_API_KEY=<your-api-key>
   LOCAL_ECOMMERCE_API_KEY=<your-ecommerce-api-key>
   ```

3. **Build the project**:
   ```bash
   mvn package -Prelease
   ```

4. **Run the service**:
   ```bash
   java -jar passkey-reservation-service/target/passkey-reservation-service-*.jar server passkey-reservation-service/configs/dev.yaml
   ```

### IntelliJ Configuration

| Property              | Value                                                                |
|-----------------------|----------------------------------------------------------------------|
| SDK                   | Java 17 SDK of `passkey-reservation-service` module                 |
| Module Classpath      | `-cp passkey-reservation-service`                                    |
| Main Class            | `com.cvent.passkey.reservation.PasskeyReservationServiceApplication` |
| Arguments             | `server passkey-reservation-service/configs/dev.yaml`               |
| Environment Variables | `passkey-reservation-service/configs/dev.env`                       |

## Service Ownership


| Role      | Team          | Slack Channel            |
|-----------|---------------|--------------------------|
| Primary   | Steakholders  | `#passkey-steak-holders` |
| Secondary | Cherrypickers | `#passkey-cherrypickers` |

## Useful Links


- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/passkey/job/passkey-reservation/)
- [Sonar Quality Gate](https://sonar.core.cvent.org/dashboard?id=com.cvent.passkey%3Apasskey-reservation-parent)
- [Admin Portal](https://admin.core.cvent.org/serviceid/9992b616-fd36-482f-9768-10762c04fb55)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-reservation-service)
- [API Documentation](./API_REFERENCE.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
