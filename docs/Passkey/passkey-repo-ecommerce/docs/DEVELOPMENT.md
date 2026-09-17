# Development Guide

## Prerequisites

### Required Software
- **Java 17** - OpenJDK or Oracle JDK
- **Maven 3.6+** - Build tool
- **Docker** - For containerized development
- **Git** - Version control
- **IntelliJ IDEA** (recommended) or Eclipse

### Optional Tools
- **Oracle SQL Developer** - Database management
- **Postman** - API testing
- **Docker Compose** - Local service orchestration

### System Requirements
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Disk**: 10GB free space
- **Network**: Access to Cvent internal networks (VPN required)

## Local Setup

### 1. Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-ecommerce.git
cd passkey-ecommerce
```

### 2. Environment Configuration
Create the environment file for local development:

```bash
# Create local environment file
touch passkey-ecommerce-service/configs/dev.env
```

Add the following content to `dev.env`:
```bash
# API Keys (get from Backstage)
LOCAL_API_KEY=your_staging_api_key_here
LOCAL_ECOMMERCE_API_KEY=your_ecommerce_staging_api_key_here

# Database Configuration
DATABASE_URL=jdbc:oracle:thin:@dev-oracle.cvent.net:1521:DEVDB
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password

# Optional: Datadog (for local monitoring)
DATADOG_API_KEY=your_datadog_api_key
```

### 3. Database Setup
Ensure you have access to the development Oracle database:

```sql
-- Test database connectivity
SELECT 1 FROM DUAL;

-- Verify required tables exist
SELECT table_name FROM user_tables 
WHERE table_name IN ('ECOMMERCE_TRANSACTIONS', 'PAYMENT_AUTHORIZATIONS', 'PAYMENT_REFUNDS');
```

### 4. Build Project
```bash
# Clean build with all modules
mvn clean package -Prelease

# Build without integration tests (faster)
mvn clean package -DskipITs=true
```

### 5. IntelliJ IDEA Configuration

#### Import Project
1. Open IntelliJ IDEA
2. File → Open → Select `passkey-ecommerce` directory
3. Import as Maven project
4. Wait for dependency resolution

#### Run Configuration
Create a new Application run configuration:

| Setting | Value |
|---------|-------|
| **Name** | Passkey Ecommerce Service |
| **Main Class** | `com.cvent.passkey.ecommerce.PasskeyEcommerceServiceApplication` |
| **Program Arguments** | `server passkey-ecommerce-service/configs/dev.yaml` |
| **Working Directory** | `$MODULE_WORKING_DIR$` |
| **Use Classpath of Module** | `passkey-ecommerce-service` |
| **JRE** | Java 17 |
| **Environment Variables** | Load from `passkey-ecommerce-service/configs/dev.env` |

#### VM Options (Optional)
```
-Xms1g
-Xmx2g
-XX:+UseG1GC
-Dlogback.configurationFile=passkey-ecommerce-service/configs/dev.logback.xml
```

## Running the Service

### Local Development Server
```bash
# Run with Maven
mvn exec:java -Dexec.mainClass="com.cvent.passkey.ecommerce.PasskeyEcommerceServiceApplication" \
  -Dexec.args="server passkey-ecommerce-service/configs/dev.yaml" \
  -pl passkey-ecommerce-service

# Or run the JAR directly
java -jar passkey-ecommerce-service/target/passkey-ecommerce-service-*.jar \
  server passkey-ecommerce-service/configs/dev.yaml
```

### Docker Development
```bash
# Build Docker image
docker build -t passkey-ecommerce:dev .

# Run with Docker
docker run -p 8080:8080 -p 8081:8081 \
  --env-file passkey-ecommerce-service/configs/dev.env \
  passkey-ecommerce:dev
```

### Service Endpoints
Once running, the service will be available at:
- **Application**: http://localhost:8080
- **Admin**: http://localhost:8081
- **Health Check**: http://localhost:8081/health
- **Metrics**: http://localhost:8081/metrics

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-ecommerce-service

# Run specific test class
mvn test -Dtest=PaymentServiceTest

# Run with coverage
mvn test jacoco:report -Pcoverage
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run integration tests with custom endpoint
mvn -Prun-it -Dservice.endpoint=http://localhost:8080 verify
```

### Test Coverage Report
```bash
# Generate coverage report
mvn clean verify jacoco:report -Pcoverage

# Open coverage report
open target/site/jacoco/index.html
```

## Code Structure

### Module Organization
```
passkey-ecommerce/
├── passkey-ecommerce-api/          # API contracts and OpenAPI specs
├── passkey-ecommerce-service/      # Main service implementation
│   ├── src/main/java/
│   │   └── com/cvent/passkey/ecommerce/
│   │       ├── PasskeyEcommerceServiceApplication.java
│   │       ├── resources/          # JAX-RS REST endpoints
│   │       ├── service/           # Business logic services
│   │       ├── clients/           # External service clients
│   │       └── health/            # Health check implementations
│   └── configs/                   # Configuration files
├── passkey-ecommerce-data-access/ # Database access layer
├── passkey-ecommerce-shared/      # Common utilities
├── passkey-ecommerce-java-client/ # Client library
└── passkey-ecommerce-integration-test/ # Integration tests
```

### Package Structure
```
com.cvent.passkey.ecommerce/
├── resources/              # REST endpoints
│   ├── AdminResource.java
│   ├── OrchestratedEcommerceResource.java
│   └── PaymentGateResource.java
├── service/               # Business logic
│   ├── PaymentService.java
│   ├── TransactionService.java
│   └── AdminService.java
├── clients/               # External clients
│   ├── PaymentGatewayClient.java
│   └── AuthServiceClient.java
├── health/                # Health checks
├── exceptions/            # Custom exceptions
└── utils/                 # Utility classes
```

## Coding Standards

### Java Style Guide
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: 120 characters maximum
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Imports**: No wildcard imports, organize imports
- **Comments**: JavaDoc for public methods and classes

### Code Quality Tools
```bash
# Run Checkstyle
mvn checkstyle:check

# Run SpotBugs
mvn spotbugs:check

# Run all quality checks
mvn verify -Pquality
```

### Example Code Style
```java
/**
 * Service for processing ecommerce transactions.
 */
@Service
public class TransactionService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(TransactionService.class);
    
    private final PaymentGatewayClient paymentClient;
    private final TransactionDao transactionDao;
    
    @Inject
    public TransactionService(PaymentGatewayClient paymentClient, 
                            TransactionDao transactionDao) {
        this.paymentClient = requireNonNull(paymentClient, "paymentClient");
        this.transactionDao = requireNonNull(transactionDao, "transactionDao");
    }
    
    /**
     * Processes a payment transaction.
     *
     * @param request the payment request
     * @return the transaction result
     * @throws PaymentException if payment processing fails
     */
    public TransactionResult processPayment(PaymentRequest request) {
        requireNonNull(request, "request");
        
        LOGGER.info("Processing payment for reservation: {}", request.getReservationId());
        
        try {
            // Implementation here
            return new TransactionResult();
        } catch (Exception e) {
            LOGGER.error("Payment processing failed for reservation: {}", 
                        request.getReservationId(), e);
            throw new PaymentException("Payment processing failed", e);
        }
    }
}
```

## Common Development Tasks

### Adding a New REST Endpoint
1. **Define API Contract**: Update OpenAPI specification
2. **Create Resource Class**: Add JAX-RS resource
3. **Implement Service Logic**: Add business logic
4. **Add Tests**: Unit and integration tests
5. **Update Documentation**: API reference docs

Example:
```java
@Path("/api/v1/transactions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TransactionResource {
    
    @GET
    @Path("/{transactionId}")
    public Response getTransaction(@PathParam("transactionId") String transactionId) {
        // Implementation
    }
}
```

### Adding Database Migration
1. **Create Migration Script**: Add SQL migration file
2. **Update DAO**: Modify data access objects
3. **Update Tests**: Add test data and assertions
4. **Test Migration**: Verify on development database

### Adding External Service Client
1. **Define Interface**: Create client interface
2. **Implement Client**: Use Retrofit for HTTP clients
3. **Add Configuration**: Client configuration properties
4. **Add Health Check**: Monitor client health
5. **Add Tests**: Mock client for testing

## Debugging

### Local Debugging
1. **IntelliJ Debugger**: Set breakpoints and debug normally
2. **Remote Debugging**: Connect to remote JVM
3. **Log Analysis**: Use structured logging for troubleshooting

### Remote Debugging Setup
```bash
# Add JVM arguments for remote debugging
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005
```

### Common Issues

#### Database Connection Issues
```bash
# Test database connectivity
telnet dev-oracle.cvent.net 1521

# Check connection pool status
curl http://localhost:8081/health
```

#### Authentication Issues
```bash
# Verify API key
curl -H "Authorization: Bearer ${LOCAL_API_KEY}" \
  http://localhost:8080/admin/health
```

#### Memory Issues
```bash
# Generate heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.classloader_stats
```

## Performance Testing

### Load Testing
```bash
# Install Apache Bench
brew install httpie

# Simple load test
ab -n 1000 -c 10 http://localhost:8080/admin/health

# More complex testing with custom payload
http POST localhost:8080/api/v1/payments \
  Authorization:"Bearer ${LOCAL_API_KEY}" \
  < test-payload.json
```

### Profiling
```bash
# Enable JFR profiling
-XX:+FlightRecorder 
-XX:StartFlightRecording=duration=60s,filename=profile.jfr

# Analyze with JProfiler or VisualVM
```

## Contributing

### Git Workflow
1. **Create Feature Branch**: `git checkout -b feature/payment-improvements`
2. **Make Changes**: Implement feature with tests
3. **Commit Changes**: Use conventional commit messages
4. **Push Branch**: `git push origin feature/payment-improvements`
5. **Create Pull Request**: Submit for code review
6. **Address Feedback**: Make requested changes
7. **Merge**: Squash and merge to develop

### Commit Message Format
```
type(scope): description

feat(payments): add support for digital wallet payments
fix(auth): resolve token validation issue
docs(api): update payment endpoint documentation
test(integration): add payment failure scenarios
```

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for containerized deployment)

### Local Development
```bash
# Build the service
mvn package -Prelease

# Run locally with IntelliJ configuration:
# Main Class: com.cvent.passkey.ecommerce.PasskeyEcommerceServiceApplication
# Arguments: server passkey-ecommerce-service/configs/dev.yaml
# Environment: passkey-ecommerce-service/configs/dev.env
```

### Environment Variables
Create `passkey-ecommerce-service/configs/dev.env`:
```
LOCAL_API_KEY=<staging-api-key>
LOCAL_ECOMMERCE_API_KEY=<ecommerce-staging-api-key>
```

## Service Ownership


| Role      | Team          | Slack Channel             |
|-----------|---------------|---------------------------|
| Primary   | Steakholders  | `#passkey-steak-holders`  |
| Secondary | Cherrypickers | `#passkey-cherrypickers`  |

## Useful Links


- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-ecommerce/)
- [Sonar Quality Gate](https://sonar.core.cvent.org/dashboard?id=com.cvent.passkey%3Apasskey-ecommerce-parent)
- [Admin Portal](https://admin.core.cvent.org/serviceid/b2f99589-fdea-42ee-b378-ca1408936e5f)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-ecommerce-service)
