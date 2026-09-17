# Development Guide

## Prerequisites

Before you can run the Passkey Payment Service locally, ensure you have the following installed:

- **Java 17** - OpenJDK or Oracle JDK
- **Maven 3.6+** - Build tool
- **Docker** - For containerization and local dependencies
- **Git** - Version control
- **IntelliJ IDEA** or **Eclipse** - Recommended IDEs
- **Oracle Database** - Local instance or Docker container

### Java Installation
```bash
# Using SDKMAN (recommended)
curl -s "https://get.sdkman.io" | bash
sdk install java 17.0.2-open

# Verify installation
java -version
javac -version
```

### Maven Installation
```bash
# Using SDKMAN
sdk install maven 3.8.6

# Verify installation
mvn -version
```

### Docker Installation
Follow the official Docker installation guide for your operating system:
- [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
- [Docker Engine for Linux](https://docs.docker.com/engine/install/)

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/cvent-internal/passkey-payment.git
cd passkey-payment
```

### 2. Set Up Environment Variables
Create the environment file for local development:

```bash
# Create the dev environment file
touch passkey-payment-service/configs/dev.env
```

Add the following content to `passkey-payment-service/configs/dev.env`:
```bash
# Database Configuration
DB_USER=passkey_payment_user
DB_PASSWORD=your_db_password
DB_URL=jdbc:oracle:thin:@//localhost:1521/XEPDB1

# API Keys (get these from Backstage)
LOCAL_API_KEY=your_api_key_here
LOCAL_ECOMMERCE_API_KEY=your_ecommerce_api_key_here
PBB_API_KEY=your_pbb_api_key_here

# Service URLs
AUTH_SERVICE_URL=https://auth-service.dev.cvent.org
PAYMENTS_WALLET_URL=https://payments-wallet.ecommerce-us-dev.cvent.org
PASSKEY_EVENT_URL=https://passkey-event-service.dev.cvent.org
PASSKEY_HOTEL_URL=https://passkey-hotel-service.dev.cvent.org
PBB_SERVICE_URL=https://pbb-service.dev.cvent.org
```

**Note**: The `dev.env` file is ignored by Git for security reasons. Contact the team (#passkey-steak-holders) to get the actual API key values.

### 3. Set Up Local Database

#### Option A: Docker Oracle Database
```bash
# Pull and run Oracle Database Express Edition
docker run -d \
  --name oracle-xe \
  -p 1521:1521 \
  -p 5500:5500 \
  -e ORACLE_PWD=oracle_password \
  container-registry.oracle.com/database/express:21.3.0-xe

# Wait for database to start (this may take several minutes)
docker logs -f oracle-xe

# Connect to database and create user
docker exec -it oracle-xe sqlplus sys/oracle_password@XEPDB1 as sysdba

# Create user and grant permissions
CREATE USER passkey_payment_user IDENTIFIED BY your_db_password;
GRANT CONNECT, RESOURCE, DBA TO passkey_payment_user;
GRANT UNLIMITED TABLESPACE TO passkey_payment_user;
```

#### Option B: Local Oracle Installation
If you have Oracle Database installed locally, create the user and schema:
```sql
-- Connect as SYSDBA
sqlplus sys/password@localhost:1521/XEPDB1 as sysdba

-- Create user
CREATE USER passkey_payment_user IDENTIFIED BY your_db_password;
GRANT CONNECT, RESOURCE, DBA TO passkey_payment_user;
GRANT UNLIMITED TABLESPACE TO passkey_payment_user;
```

### 4. Initialize Database Schema
```bash
# Run database migration scripts (if available)
# Or manually create tables using the schema in TECHNICAL_DETAILS.md

# Connect to database as the service user
sqlplus passkey_payment_user/your_db_password@localhost:1521/XEPDB1

-- Create tables (see TECHNICAL_DETAILS.md for complete schema)
-- Example:
CREATE TABLE PAYMENTS (
    PAYMENT_ID VARCHAR2(36) PRIMARY KEY,
    RESERVATION_ID VARCHAR2(36) NOT NULL,
    -- ... other columns
);
```

### 5. Build the Project
```bash
# Clean and build all modules
mvn clean package -Prelease

# This will:
# - Compile all Java code
# - Run unit tests
# - Generate JAR files
# - Create the executable service JAR
```

### 6. Run the Service
```bash
# Method 1: Using Maven
mvn exec:java -pl passkey-payment-service -Dexec.mainClass="com.cvent.passkey.payment.PasskeyPaymentServiceApplication" -Dexec.args="server passkey-payment-service/configs/dev.yaml"

# Method 2: Using Java directly
java -jar passkey-payment-service/target/passkey-payment-service-*.jar server passkey-payment-service/configs/dev.yaml

# Method 3: Using the build script
./build-it.sh
```

### 7. Verify the Service is Running
```bash
# Check health endpoint
curl http://localhost:8081/healthcheck

# Check admin endpoints
curl http://localhost:8081/metrics
curl http://localhost:8081/ping

# Test API endpoint (requires valid JWT token)
curl -H "Authorization: Bearer <your-jwt-token>" http://localhost:8080/v1/payments/health
```

## IDE Configuration

### IntelliJ IDEA Setup

#### 1. Import Project
- Open IntelliJ IDEA
- Select "Open or Import"
- Navigate to the cloned repository
- Select the root `pom.xml` file
- Choose "Open as Project"

#### 2. Configure Run Configuration
Create a new Application run configuration:

| Setting | Value |
|---------|-------|
| **Name** | Passkey Payment Service |
| **Main Class** | `com.cvent.passkey.payment.PasskeyPaymentServiceApplication` |
| **Program Arguments** | `server passkey-payment-service/configs/dev.yaml` |
| **Working Directory** | `$PROJECT_DIR$` |
| **Use Classpath of Module** | `passkey-payment-service` |
| **JRE** | Java 17 |

#### 3. Environment Variables
In the run configuration, add environment variables:
- Click "Environment Variables" button
- Add variables from your `dev.env` file

#### 4. Enable Annotation Processing
- Go to File → Settings → Build, Execution, Deployment → Compiler → Annotation Processors
- Check "Enable annotation processing"
- This is required for MapStruct code generation

### Eclipse Setup

#### 1. Import Maven Project
- File → Import → Existing Maven Projects
- Browse to the cloned repository
- Select all modules and import

#### 2. Configure Run Configuration
- Right-click on `PasskeyPaymentServiceApplication.java`
- Run As → Java Application
- Edit the run configuration to add program arguments: `server passkey-payment-service/configs/dev.yaml`

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl passkey-payment-service

# Run specific test class
mvn test -Dtest=PaymentServiceTest

# Run with coverage report
mvn test jacoco:report -Pcoverage
```

### Integration Tests
```bash
# Run integration tests against dev environment
mvn verify -Prun-it -Denv.IT_ENVIRONMENT=dev

# Run integration tests against local environment
mvn verify -Prun-it -Denv.IT_ENVIRONMENT=local
```

### Load Tests
```bash
# Run load tests
mvn verify -Prun-load -Denv.LOAD_TEST_ENVIRONMENT=dev
```

### Test Coverage Report
```bash
# Generate coverage report
mvn jacoco:report -Pcoverage

# Open coverage report
open target/site/jacoco/index.html
```

## Code Structure

### Package Organization
```
com.cvent.passkey.payment/
├── resources/              # JAX-RS REST endpoints
│   ├── PasskeyPaymentsResource.java
│   ├── PasskeyPricingResource.java
│   ├── PasskeyWalletResource.java
│   └── AdminResource.java
├── services/               # Business logic layer
│   ├── PaymentService.java
│   ├── PricingService.java
│   └── WalletService.java
├── dataaccess/            # Data access layer
│   ├── PaymentDAO.java
│   ├── RateDAO.java
│   └── AdminDataAccess.java
├── model/                 # Data models and DTOs
│   ├── request/
│   ├── response/
│   └── entities/
├── client/                # External service clients
│   ├── AuthServiceClient.java
│   ├── WalletServiceClient.java
│   └── EventServiceClient.java
├── config/                # Configuration classes
│   └── PasskeyPaymentServiceConfiguration.java
└── PasskeyPaymentServiceApplication.java  # Main application class
```

### Module Dependencies
```
passkey-payment-service
├── depends on: passkey-payment-api
├── depends on: passkey-payment-data-access
├── depends on: passkey-payment-shared
└── depends on: external libraries

passkey-payment-java-client
├── depends on: passkey-payment-api
└── depends on: passkey-payment-shared

passkey-payment-integration-test
├── depends on: passkey-payment-java-client
└── depends on: passkey-payment-service (test scope)
```

## Coding Standards

### Java Code Style
The project follows Google Java Style Guide with some Cvent-specific modifications:

- **Indentation**: 4 spaces (not tabs)
- **Line Length**: 120 characters maximum
- **Imports**: No wildcard imports, organize imports alphabetically
- **Braces**: Always use braces for if/else/for/while statements
- **Naming**: Use camelCase for variables and methods, PascalCase for classes

### Code Formatting
```bash
# Format code using Maven plugin
mvn spotless:apply

# Check code formatting
mvn spotless:check
```

### Checkstyle Validation
```bash
# Run checkstyle validation
mvn checkstyle:check

# Generate checkstyle report
mvn checkstyle:checkstyle
```

### SonarQube Analysis
```bash
# Run SonarQube analysis locally
mvn sonar:sonar -Dsonar.host.url=https://sonar.core.cvent.org -Dsonar.login=<your-token>
```

## Common Development Tasks

### Adding a New API Endpoint

#### 1. Define the API Contract
Add request/response models to `passkey-payment-api` module:
```java
// passkey-payment-api/src/main/java/com/cvent/passkey/payment/model/request/
public class NewFeatureRequest {
    @NotNull
    private String requiredField;
    
    // getters and setters
}

// passkey-payment-api/src/main/java/com/cvent/passkey/payment/model/response/
public class NewFeatureResponse {
    private String result;
    
    // getters and setters
}
```

#### 2. Create the Resource Class
Add the JAX-RS resource in `passkey-payment-service`:
```java
@Path("/v1/new-feature")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NewFeatureResource {
    
    private final NewFeatureService service;
    
    public NewFeatureResource(NewFeatureService service) {
        this.service = service;
    }
    
    @POST
    @Timed
    @ExceptionMetered
    public Response createNewFeature(@Valid NewFeatureRequest request) {
        NewFeatureResponse response = service.processRequest(request);
        return Response.ok(response).build();
    }
}
```

#### 3. Implement the Service Layer
```java
public class NewFeatureService {
    
    private final NewFeatureDAO dao;
    
    public NewFeatureService(NewFeatureDAO dao) {
        this.dao = dao;
    }
    
    public NewFeatureResponse processRequest(NewFeatureRequest request) {
        // Business logic implementation
        return new NewFeatureResponse();
    }
}
```

#### 4. Register the Resource
Add the resource to the application class:
```java
@Override
public void run(PasskeyPaymentServiceConfiguration configuration, Environment environment) {
    // ... existing code
    
    environment.jersey().register(new NewFeatureResource(newFeatureService));
}
```

### Adding Database Migrations

#### 1. Create Migration Script
```sql
-- migrations/V1.1__add_new_feature_table.sql
CREATE TABLE NEW_FEATURE (
    ID VARCHAR2(36) PRIMARY KEY,
    NAME VARCHAR2(100) NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_NEW_FEATURE_NAME ON NEW_FEATURE(NAME);
```

#### 2. Update DAO Layer
```java
public class NewFeatureDAO {
    
    private final Jdbi jdbi;
    
    public NewFeatureDAO(Jdbi jdbi) {
        this.jdbi = jdbi;
    }
    
    public void insert(NewFeature feature) {
        jdbi.useHandle(handle -> 
            handle.createUpdate("INSERT INTO NEW_FEATURE (ID, NAME) VALUES (:id, :name)")
                  .bind("id", feature.getId())
                  .bind("name", feature.getName())
                  .execute()
        );
    }
}
```

### Adding External Service Integration

#### 1. Create Client Interface
```java
public interface ExternalServiceClient {
    ExternalServiceResponse callExternalService(ExternalServiceRequest request);
}
```

#### 2. Implement Client
```java
@Component
public class ExternalServiceClientImpl implements ExternalServiceClient {
    
    private final Client httpClient;
    private final String baseUrl;
    
    public ExternalServiceClientImpl(Client httpClient, String baseUrl) {
        this.httpClient = httpClient;
        this.baseUrl = baseUrl;
    }
    
    @Override
    public ExternalServiceResponse callExternalService(ExternalServiceRequest request) {
        return httpClient.target(baseUrl)
                        .path("/api/endpoint")
                        .request(MediaType.APPLICATION_JSON)
                        .post(Entity.json(request), ExternalServiceResponse.class);
    }
}
```

#### 3. Configure Client in Application
```java
@Override
public void run(PasskeyPaymentServiceConfiguration configuration, Environment environment) {
    Client httpClient = new JerseyClientBuilder(environment)
        .using(configuration.getHttpClientConfiguration())
        .build("external-service-client");
    
    ExternalServiceClient client = new ExternalServiceClientImpl(
        httpClient, 
        configuration.getExternalServiceUrl()
    );
}
```

## Debugging

### Local Debugging
1. Set breakpoints in your IDE
2. Run the service in debug mode
3. Use the IDE's debugging tools to step through code

### Remote Debugging
```bash
# Add JVM arguments for remote debugging
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar passkey-payment-service/target/passkey-payment-service-*.jar \
     server passkey-payment-service/configs/dev.yaml
```

### Logging Configuration for Debugging
```yaml
# Add to dev.yaml for verbose logging
logging:
  level: DEBUG
  loggers:
    com.cvent.passkey.payment: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
    com.cvent.passkey.payment.resources: TRACE
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if Oracle database is running
docker ps | grep oracle

# Check database logs
docker logs oracle-xe

# Test database connection
sqlplus passkey_payment_user/your_db_password@localhost:1521/XEPDB1
```

#### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

#### Maven Build Issues
```bash
# Clean and rebuild
mvn clean install -U

# Skip tests if needed
mvn clean install -DskipTests

# Clear local repository cache
rm -rf ~/.m2/repository/com/cvent/passkey-payment
```

#### Missing API Keys
- Contact the team in #passkey-steak-holders Slack channel
- Check Backstage for API key management
- Ensure you have access to the required environments

### Getting Help

#### Team Communication
- **Primary Team**: Steakholders (#passkey-steak-holders)
- **Secondary Team**: Cherrypickers (#passkey-cherrypickers)

#### Documentation Resources
- [Wiki Documentation](https://wiki.cvent.com/pages/viewpage.action?spaceKey=PASKY&title=Passkey+Payment+Service+Design+Document)
- [API Documentation](https://passkey-payment-service.dev.cvent.org/openapi.json)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=dev&selectedService=passkey-payment-service)

#### Code Review Process
1. Create feature branch from `master`
2. Make changes and commit with descriptive messages
3. Push branch and create pull request
4. Request review from team members
5. Address feedback and merge when approved

#### Contributing Guidelines
- Follow the existing code style and patterns
- Write unit tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep commits focused and atomic

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Docker (for local development)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cvent-internal/passkey-payment.git
   cd passkey-payment
   ```

2. **Set up environment variables**
   Create `passkey-payment-service/configs/dev.env`:
   ```bash
   LOCAL_API_KEY=your_api_key_here
   LOCAL_ECOMMERCE_API_KEY=your_ecommerce_api_key_here
   ```

3. **Build the project**
   ```bash
   mvn package -Prelease
   ```

4. **Run the service**
   ```bash
   java -jar passkey-payment-service/target/passkey-payment-service-*.jar server passkey-payment-service/configs/dev.yaml
   ```

5. **Access the service**
   - Service: http://localhost:8080
   - Admin: http://localhost:8081
   - Health Check: http://localhost:8081/healthcheck

## Service Information


- **Repository**: [cvent-internal/passkey-payment](https://github.com/cvent-internal/passkey-payment)
- **Language**: Java 17
- **Framework**: Dropwizard
- **Build Tool**: Maven
- **Current Version**: 1.1.3-SNAPSHOT

## Team Ownership


| Role      | Team          | Slack Channel            |
|-----------|---------------|--------------------------| 
| Primary   | Steakholders  | `#passkey-steak-holders` |
| Secondary | Cherrypickers | `#passkey-cherrypickers` |

## Useful Links


- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/passkey/job/passkey-payment/)
- [Sonar Quality Gate](https://sonar.core.cvent.org/dashboard?id=com.cvent.passkey-payment%3Apasskey-payment-parent)
- [Admin Portal](https://admin.core.cvent.org/serviceid/51ad2f0e-3de6-4b61-b219-ffbb890515ab)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-payment-service)
- [Wiki Documentation](https://wiki.cvent.com/pages/viewpage.action?spaceKey=PASKY&title=Passkey+Payment+Service+Design+Document)

## Documentation Structure


- [Architecture](ARCHITECTURE.md) - System architecture and design patterns
- [API Reference](API_REFERENCE.md) - Complete API documentation
- [Domain Model](DOMAIN_MODEL.md) - Business domain and data models
- [Technical Details](TECHNICAL_DETAILS.md) - Technology stack and dependencies
- [Deployment](DEPLOYMENT.md) - Deployment and infrastructure guide
- [Development](DEVELOPMENT.md) - Local development and contribution guide
