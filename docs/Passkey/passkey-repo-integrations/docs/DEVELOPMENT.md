# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK (LTS version)
- **Maven 3.6+**: Build tool and dependency management
- **Node.js 18+**: For frontend tooling and build scripts
- **pnpm 8+**: Package manager for Node.js dependencies
- **Docker**: For containerized development and testing
- **Git**: Version control system

### Development Tools
- **asdf**: Version manager for multiple runtime versions
- **IDE**: IntelliJ IDEA (recommended) or Eclipse with Java EE support
- **Database Client**: pgAdmin, DBeaver, or similar PostgreSQL client
- **API Testing**: Postman, Insomnia, or curl
- **Container Tools**: Docker Desktop or Podman

### Version Management with asdf
```bash
# Install asdf (macOS with Homebrew)
brew install asdf

# Add plugins
asdf plugin add java
asdf plugin add maven
asdf plugin add nodejs
asdf plugin add pnpm

# Install versions (defined in .tool-versions)
asdf install
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-integrations.git
cd passkey-integrations
```

### 2. Install Dependencies
```bash
# Install Java/Maven dependencies
mvn clean install -DskipTests

# Install Node.js dependencies
pnpm install
```

### 3. Database Setup
```bash
# Start PostgreSQL with Docker
docker run --name passkey-db \
  -e POSTGRES_DB=passkey_integrations \
  -e POSTGRES_USER=passkey_user \
  -e POSTGRES_PASSWORD=passkey_pass \
  -p 5432:5432 \
  -d postgres:13

# Run database migrations (if applicable)
mvn flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/passkey_integrations
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.template .env

# Edit environment variables
vim .env
```

Example `.env` file:
```properties
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=passkey_integrations
DB_USERNAME=passkey_user
DB_PASSWORD=passkey_pass

# External Services (use test/mock endpoints)
AUTH_SERVICE_URL=http://localhost:8081
VENDOR_SERVICE_URL=http://localhost:8082
AMADEUS_API_URL=https://test.api.amadeus.com
LAUNCHDARKLY_SDK_KEY=local:feature1,feature2

# Email (use local SMTP or mock)
SMTP_HOST=localhost
SMTP_PORT=1025
```

### 5. Start Local Services
```bash
# Start supporting services with Docker Compose
docker-compose -f docker/docker-compose.dev.yml up -d

# Build and package applications
mvn clean package

# Deploy to local Wildfly (if using embedded server)
mvn wildfly:deploy
```

## Running the Applications

### Development Mode
```bash
# Start API service
cd packages/passkey-api/app
mvn wildfly:run

# Start GL service (in separate terminal)
cd packages/passkey-gl/app
mvn wildfly:run
```

### Using Docker
```bash
# Build Docker images
docker build -f packages/passkey-api/app/Dockerfile -t passkey-api:dev .
docker build -f packages/passkey-gl/app/Dockerfile -t passkey-gl:dev .

# Run containers
docker run -p 8080:8080 --env-file .env passkey-api:dev
docker run -p 8081:8080 --env-file .env passkey-gl:dev
```

### Service URLs
- **Passkey API**: http://localhost:8080/passkey-api
- **Passkey GL**: http://localhost:8081/passkey-gl
- **Health Checks**: 
  - http://localhost:8080/health/ready
  - http://localhost:8081/health/ready

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl packages/passkey-api/app

# Run tests with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests
```bash
# Start test database
docker run --name test-db \
  -e POSTGRES_DB=passkey_test \
  -e POSTGRES_USER=test_user \
  -e POSTGRES_PASSWORD=test_pass \
  -p 5433:5432 \
  -d postgres:13

# Run integration tests
mvn verify -Pintegration-tests

# Run specific integration test
mvn test -Dtest=ReservationIntegrationTest
```

### API Testing
```bash
# Test API endpoints with curl
curl -X GET http://localhost:8080/passkey-api/health/ready

# Test with authentication
curl -X POST http://localhost:8080/passkey-api/reservations \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"hotelId": "HTL123", "guestName": "John Doe"}'
```

## Code Structure

### Package Organization
```
packages/
├── parent/                           # Maven parent POM
├── passkey-api-gl-common/           # Shared library
│   └── core/
│       └── src/main/java/com/passkey/core/
│           ├── business/            # Business logic
│           ├── client/              # External service clients
│           ├── model/               # Data models
│           └── util/                # Utility classes
├── passkey-api/                     # API Service
│   └── app/
│       ├── API-ear/                 # Enterprise Archive
│       ├── API-ejb/                 # Business logic (EJBs)
│       ├── API-war/                 # Web layer (REST endpoints)
│       └── API-wsr/                 # Web service resources
└── passkey-gl/                      # GroupLink Service
    └── app/
        ├── GL-ear/                  # Enterprise Archive
        ├── GL-ejb/                  # Business logic (EJBs)
        └── GL-war/                  # Web layer (REST endpoints)
```

### Key Directories
- **src/main/java**: Java source code
- **src/main/resources**: Configuration files, templates
- **src/test/java**: Unit and integration tests
- **src/test/resources**: Test configuration and data
- **target/**: Build output and generated files

### Naming Conventions
- **Classes**: PascalCase (e.g., `ReservationService`)
- **Methods**: camelCase (e.g., `createReservation`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Packages**: lowercase with dots (e.g., `com.passkey.api.service`)

## Coding Standards

### Java Code Style
```java
// Class structure example
@Stateless
@Path("/reservations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReservationResource {
    
    @Inject
    private ReservationService reservationService;
    
    @POST
    public Response createReservation(@Valid ReservationRequest request) {
        try {
            Reservation reservation = reservationService.createReservation(request);
            return Response.status(Response.Status.CREATED)
                          .entity(reservation)
                          .build();
        } catch (ValidationException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                          .entity(new ErrorResponse(e.getMessage()))
                          .build();
        }
    }
}
```

### Error Handling
```java
// Custom exception hierarchy
public class PasskeyException extends Exception {
    private final String errorCode;
    
    public PasskeyException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}

public class ReservationNotFoundException extends PasskeyException {
    public ReservationNotFoundException(String reservationId) {
        super("RESERVATION_NOT_FOUND", 
              "Reservation not found: " + reservationId);
    }
}
```

### Logging Standards
```java
@Slf4j
public class ReservationService {
    
    public Reservation createReservation(ReservationRequest request) {
        log.info("Creating reservation for hotel: {}", request.getHotelId());
        
        try {
            // Business logic
            Reservation reservation = processReservation(request);
            
            log.info("Reservation created successfully: {}", 
                    reservation.getReservationId());
            return reservation;
            
        } catch (Exception e) {
            log.error("Failed to create reservation for hotel: {}", 
                     request.getHotelId(), e);
            throw new ReservationCreationException(e.getMessage());
        }
    }
}
```

### Validation
```java
// Bean validation example
public class ReservationRequest {
    
    @NotNull(message = "Hotel ID is required")
    @Size(min = 1, max = 50, message = "Hotel ID must be 1-50 characters")
    private String hotelId;
    
    @NotNull(message = "Guest name is required")
    @Size(min = 1, max = 255, message = "Guest name must be 1-255 characters")
    private String guestName;
    
    @NotNull(message = "Check-in date is required")
    @Future(message = "Check-in date must be in the future")
    private LocalDate checkIn;
    
    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOut;
    
    @AssertTrue(message = "Check-out must be after check-in")
    public boolean isValidDateRange() {
        return checkOut != null && checkIn != null && 
               checkOut.isAfter(checkIn);
    }
}
```

## Common Development Tasks

### Adding a New REST Endpoint
1. **Create Request/Response Models**:
```java
// Request model
public class CreateGroupRequest {
    @NotNull
    private String groupName;
    @NotNull
    private String hotelId;
    // getters/setters
}

// Response model
public class GroupResponse {
    private String groupId;
    private String groupName;
    private String status;
    // getters/setters
}
```

2. **Implement Business Logic**:
```java
@Stateless
public class GroupService {
    
    @Inject
    private GroupRepository groupRepository;
    
    public Group createGroup(CreateGroupRequest request) {
        Group group = new Group();
        group.setGroupName(request.getGroupName());
        group.setHotelId(request.getHotelId());
        group.setStatus(GroupStatus.TENTATIVE);
        
        return groupRepository.save(group);
    }
}
```

3. **Create REST Resource**:
```java
@Stateless
@Path("/groups")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GroupResource {
    
    @Inject
    private GroupService groupService;
    
    @POST
    public Response createGroup(@Valid CreateGroupRequest request) {
        Group group = groupService.createGroup(request);
        GroupResponse response = mapToResponse(group);
        return Response.status(Response.Status.CREATED)
                      .entity(response)
                      .build();
    }
}
```

### Adding External Service Integration
1. **Create Client Interface**:
```java
public interface VendorServiceClient {
    VendorResponse sendReservation(ReservationData data);
    boolean validateVendor(String vendorId);
}
```

2. **Implement Client**:
```java
@ApplicationScoped
public class VendorServiceClientImpl implements VendorServiceClient {
    
    @Inject
    @ConfigProperty(name = "vendor.service.url")
    private String vendorServiceUrl;
    
    public VendorResponse sendReservation(ReservationData data) {
        // HTTP client implementation
    }
}
```

### Database Schema Changes
1. **Create Migration Script**:
```sql
-- V1.1__Add_group_bookings_table.sql
CREATE TABLE group_bookings (
    group_id VARCHAR(50) PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    hotel_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_group_bookings_hotel_id ON group_bookings(hotel_id);
```

2. **Update Entity Classes**:
```java
@Entity
@Table(name = "group_bookings")
public class GroupBooking {
    
    @Id
    @Column(name = "group_id")
    private String groupId;
    
    @Column(name = "group_name", nullable = false)
    private String groupName;
    
    @Column(name = "hotel_id", nullable = false)
    private String hotelId;
    
    // getters/setters
}
```

## Debugging and Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check Java version
java -version

# Verify Maven dependencies
mvn dependency:tree

# Check for port conflicts
lsof -i :8080

# Review application logs
tail -f logs/server.log
```

#### Database Connection Issues
```bash
# Test database connectivity
psql -h localhost -p 5432 -U passkey_user -d passkey_integrations

# Check connection pool status
# (via JMX or application metrics)

# Verify database schema
\dt  # List tables in psql
```

#### External Service Integration Problems
```bash
# Test external service connectivity
curl -v https://test.api.amadeus.com/health

# Check authentication tokens
# Verify token expiration and refresh logic

# Review service client logs
grep "VendorServiceClient" logs/application.log
```

### Debugging Tools
- **JVM Debugging**: Enable remote debugging with `-agentlib:jdwp`
- **Profiling**: Use JProfiler or VisualVM for performance analysis
- **Database Debugging**: Enable SQL logging in Hibernate
- **HTTP Debugging**: Use Wireshark or Charles Proxy for network analysis

### Performance Monitoring
```java
// Add custom metrics
@Timed(name = "reservation_creation_time", 
       description = "Time taken to create a reservation")
public Reservation createReservation(ReservationRequest request) {
    // Implementation
}

// Monitor database queries
@Entity
@NamedQuery(name = "Reservation.findByHotel",
           query = "SELECT r FROM Reservation r WHERE r.hotelId = :hotelId")
public class Reservation {
    // Entity definition
}
```

## Git Workflow

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature development branches
- **hotfix/**: Critical production fixes
- **release/**: Release preparation branches

### Commit Guidelines
```bash
# Commit message format
<type>(<scope>): <subject>

# Examples
feat(api): add group booking endpoint
fix(gl): resolve transfer processing issue
docs(readme): update setup instructions
test(service): add unit tests for reservation service
```

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run full test suite locally
4. Create pull request with description
5. Address code review feedback
6. Merge after approval and CI success

## IDE Configuration

### IntelliJ IDEA Setup
1. **Import Project**: Open as Maven project
2. **SDK Configuration**: Set Project SDK to Java 17
3. **Code Style**: Import `.editorconfig` settings
4. **Plugins**: Install SonarLint, CheckStyle
5. **Run Configurations**: Create configurations for each service

### Eclipse Setup
1. **Import**: Import as Existing Maven Projects
2. **JRE**: Configure Java 17 as project JRE
3. **Server**: Add Wildfly server runtime
4. **Formatting**: Import code formatting rules
5. **Validation**: Enable Bean Validation support

### VS Code Setup (Alternative)
```json
// .vscode/settings.json
{
    "java.configuration.runtimes": [
        {
            "name": "JavaSE-17",
            "path": "/path/to/java17"
        }
    ],
    "java.compile.nullAnalysis.mode": "automatic",
    "maven.executable.path": "/path/to/maven/bin/mvn"
}
```

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development Setup

1. **Install dependencies using asdf:**
   ```bash
   asdf install
   ```

2. **Build the applications:**
   ```bash
   mvn clean package
   ```

3. **Run locally:**
   - API Service: Available on configured port
   - GroupLink Service: Available on configured port

### Docker Deployment
Refer to [docker/readme.md](../../docker/readme.md) for containerized deployment instructions.

## Architecture Components


### Passkey API Service
- **Purpose**: Handles inbound API requests for hotel integrations
- **Technology**: Java 17, Wildfly, JAX-RS
- **Key Features**: Amadeus integration, vendor API management

### Passkey GroupLink (GL) Service  
- **Purpose**: Manages group booking workflows and hotel communications
- **Technology**: Java 17, Wildfly, JAX-RS
- **Key Features**: Transfer processing, email handling, callback management

### Shared Common Library
- **Purpose**: Shared utilities and models between API and GL services
- **Components**: Authentication clients, business logic, data models

## Environment Support


The service supports multiple deployment environments:
- **Development**: Local development with mock services
- **Alpha**: Early testing environment
- **Staging (ts50)**: Pre-production testing
- **Load Testing (sg50)**: Performance testing
- **UAT (ct50)**: User acceptance testing
- **Production (pr50/pr51)**: Live production environments

## Documentation Structure


- [Architecture](./ARCHITECTURE.md) - System design and component relationships
- [API Reference](./API_REFERENCE.md) - REST endpoint documentation
- [Domain Model](./DOMAIN_MODEL.md) - Business concepts and data models
- [Technical Details](./TECHNICAL_DETAILS.md) - Technology stack and dependencies
- [Deployment](./DEPLOYMENT.md) - Infrastructure and deployment procedures
- [Development](./DEVELOPMENT.md) - Local development setup and guidelines

## Support and Monitoring


- **Datadog APM**: Application performance monitoring
- **Datadog Logs**: Centralized logging and analysis
- **Jenkins CI/CD**: Automated build and deployment pipeline
- **Octopus Deploy**: Deployment orchestration
- **SonarQube**: Code quality analysis

## Team and Ownership


- **Owner**: meeseeksbox team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
