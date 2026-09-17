# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK
- **Maven 3.8+**: Build automation tool
- **Node.js 18+**: For build tooling and package management
- **pnpm**: Package manager (installed via npm)
- **Docker**: Container runtime for local services
- **Git**: Version control
- **IntelliJ IDEA** (recommended) or Eclipse: IDE

### Development Tools
- **ASDF**: Version manager for multiple runtime versions
- **Wildfly 26.1.3.Final**: Application server
- **Oracle Database**: Local development database (or Docker container)
- **Postman**: API testing (for EJB remote interfaces)

### Installation Steps

#### 1. Install ASDF and Runtime Versions
```bash
# Install ASDF
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.13.1
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc
source ~/.bashrc

# Install Java
asdf plugin add java
asdf install java openjdk-17.0.2
asdf global java openjdk-17.0.2

# Install Node.js
asdf plugin add nodejs
asdf install nodejs 18.17.0
asdf global nodejs 18.17.0

# Install Maven
asdf plugin add maven
asdf install maven 3.9.4
asdf global maven 3.9.4
```

#### 2. Install pnpm
```bash
npm install -g pnpm
```

#### 3. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-commerce.git
cd passkey-commerce
```

## Local Setup

### Initial Setup Script
Run the provided setup script to configure your local development environment:

```bash
scripts/setup.sh
```

This script will:
- Download and configure Wildfly
- Set up default development configuration
- Create management user (admin/admin)
- Configure datasources and security domains

### Manual Setup (Alternative)

#### 1. Download and Configure Wildfly
```bash
# Download Wildfly
wget https://download.jboss.org/wildfly/26.1.3.Final/wildfly-26.1.3.Final.tar.gz
tar -xzf wildfly-26.1.3.Final.tar.gz
mv wildfly-26.1.3.Final wildfly

# Create management user
./wildfly/bin/add-user.sh
# Username: admin
# Password: admin
# Groups: (leave empty)
```

#### 2. Configure Database
```bash
# Start Oracle database container (for local development)
docker run -d \
  --name oracle-dev \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  container-registry.oracle.com/database/express:21.3.0-xe

# Wait for database to start (check logs)
docker logs -f oracle-dev
```

#### 3. Install Dependencies
```bash
# Install Node.js dependencies
pnpm install

# Download Maven dependencies
mvn dependency:resolve
```

## IntelliJ IDEA Setup

### Project Configuration
1. **Open Project**: File → Open → Select `passkey-commerce` directory
2. **Project SDK**: File → Project Structure → Project → SDK: Java 17
3. **Maven Integration**: Enable auto-import for Maven projects

### Wildfly Server Configuration
1. **Add Server**: Run → Edit Configurations → Add → JBoss Server → Local
2. **Server Settings**:
   - **JBoss Home**: Point to your `wildfly/` directory
   - **JRE**: Java 17
   - **Port Offset**: 100 (to avoid conflicts)

3. **Startup Configuration**:
   - **Run Configuration**: Add VM options and startup script options
   - **Startup Script Options**: `--debug -c passkey-standalone-full-dev.xml`
   - **Debug Configuration**: Same options as run configuration

4. **Deployment**:
   - **Artifacts**: Add `group-commerce-ear:ear exploded`
   - **Deploy Path**: `/`

### VM Options for Development
```
-Xms1024m
-Xmx2048m
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m
-Djboss.socket.binding.port-offset=100
-Djava.net.preferIPv4Stack=true
```

## Running Tests

### Unit Tests
```bash
# Run all tests
pnpm run test:java
# or
mvn test

# Run specific test class
mvn test -Dtest=PaymentProcessorTest

# Run tests with coverage
mvn test jacoco:report
```

### Integration Tests
```bash
# Run integration tests (requires running Wildfly)
mvn verify -Pintegration-tests
```

### SonarQube Analysis
```bash
# Run SonarQube analysis
pnpm run test:sonar
# or
mvn sonar:sonar -Dsonar.host.url=https://sonar.core.cvent.org
```

## Code Structure

### Package Organization
```
src/main/java/
├── com/passkey/
│   ├── core/                    # Core domain models and utilities
│   │   ├── business/           # Business objects
│   │   ├── dao/                # Data access objects
│   │   ├── datavo/             # Data value objects
│   │   ├── model/              # Domain entities
│   │   └── util/               # Utility classes
│   ├── pbb/                    # Payment Black Box integration
│   │   ├── PBBConnectorAuthorizeNetEJB.java
│   │   └── PBBConnectorStripeEJB.java
│   ├── ecommercescheduler/     # Scheduled processing
│   │   └── business/
│   │       └── ecommerceprocessor/
│   │           └── EcommerceProcessor.java
│   └── util/                   # General utilities
└── com/lanyon/                 # Legacy namespace
    └── passkey/
        └── core2/
            └── Constants.java
```

### Module Structure
```
passkey-commerce/
├── core/                       # Shared components
│   ├── src/main/java/         # Core Java classes
│   └── pom.xml                # Core module POM
├── group-commerce-ejb/        # EJB business logic
│   ├── src/main/java/         # EJB implementations
│   └── pom.xml                # EJB module POM
├── group-commerce-ear/        # Enterprise application
│   ├── src/main/application/  # Application descriptor
│   └── pom.xml                # EAR module POM
└── pom.xml                    # Parent POM
```

## Coding Standards

### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: Maximum 120 characters
- **Naming Conventions**: 
  - Classes: PascalCase
  - Methods/Variables: camelCase
  - Constants: UPPER_SNAKE_CASE
- **Imports**: No wildcard imports, organize imports

### EJB Best Practices
```java
@Stateless
@TransactionManagement(TransactionManagementType.CONTAINER)
public class PaymentProcessorEJB implements PaymentProcessor {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentProcessorEJB.class);
    
    @EJB
    private PaymentGatewayService gatewayService;
    
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public PaymentResponse processPayment(PaymentRequest request) {
        logger.debug("Processing payment for order: {}", request.getOrderId());
        
        try {
            // Business logic here
            return gatewayService.authorize(request);
        } catch (Exception e) {
            logger.error("Payment processing failed for order: {}", request.getOrderId(), e);
            throw new PaymentProcessingException("Payment failed", e);
        }
    }
}
```

### Exception Handling
```java
// Custom business exceptions
public class PaymentProcessingException extends Exception {
    private final String errorCode;
    
    public PaymentProcessingException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public PaymentProcessingException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "UNKNOWN_ERROR";
    }
}

// Usage in EJBs
@TransactionAttribute(TransactionAttributeType.REQUIRED)
public PaymentResponse authorize(PaymentRequest request) throws PaymentProcessingException {
    try {
        validateRequest(request);
        return processAuthorization(request);
    } catch (ValidationException e) {
        throw new PaymentProcessingException("Invalid request", "VALIDATION_ERROR");
    } catch (GatewayException e) {
        throw new PaymentProcessingException("Gateway error", e);
    }
}
```

### Logging Standards
```java
private static final Logger logger = LoggerFactory.getLogger(ClassName.class);

// Log levels
logger.trace("Detailed trace information");
logger.debug("Debug information: {}", variable);
logger.info("Important business event: {}", event);
logger.warn("Warning condition: {}", condition);
logger.error("Error occurred: {}", message, exception);

// Structured logging for transactions
logger.info("Payment processed: orderId={}, amount={}, status={}", 
    orderId, amount, status);
```

## Common Tasks

### Adding a New Payment Gateway

#### 1. Create EJB Interface
```java
@Local
public interface NewGatewayConnector {
    PaymentResponse authorize(PaymentRequest request) throws PaymentProcessingException;
    CaptureResponse capture(CaptureRequest request) throws PaymentProcessingException;
    RefundResponse refund(RefundRequest request) throws PaymentProcessingException;
}
```

#### 2. Implement EJB
```java
@Stateless
@TransactionManagement(TransactionManagementType.CONTAINER)
public class NewGatewayConnectorEJB implements NewGatewayConnector {
    
    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public PaymentResponse authorize(PaymentRequest request) throws PaymentProcessingException {
        // Implementation
    }
}
```

#### 3. Add Configuration
```xml
<!-- In wildfly configuration -->
<resource-adapter id="new-gateway-adapter">
    <module slot="main" id="com.newgateway.connector"/>
    <connection-definitions>
        <connection-definition class-name="com.newgateway.ConnectionFactory"
                             jndi-name="java:/eis/NewGatewayConnectionFactory"/>
    </connection-definitions>
</resource-adapter>
```

### Adding a New Scheduled Task

#### 1. Create Scheduler EJB
```java
@Stateless
public class NewScheduledTaskEJB {
    
    private static final Logger logger = LoggerFactory.getLogger(NewScheduledTaskEJB.class);
    
    @Schedule(hour = "*/6", minute = "0", persistent = false)
    public void executeScheduledTask() {
        logger.info("Starting scheduled task execution");
        
        try {
            // Task implementation
            processScheduledItems();
            logger.info("Scheduled task completed successfully");
        } catch (Exception e) {
            logger.error("Scheduled task failed", e);
        }
    }
    
    private void processScheduledItems() {
        // Implementation
    }
}
```

### Adding Database Entities

#### 1. Create Entity Class
```java
@Entity
@Table(name = "new_entity")
public class NewEntity {
    
    @Id
    @Column(name = "id")
    private String id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "created_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;
    
    // Constructors, getters, setters
}
```

#### 2. Create DAO
```java
@Stateless
public class NewEntityDAO {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    public NewEntity findById(String id) {
        return entityManager.find(NewEntity.class, id);
    }
    
    public void save(NewEntity entity) {
        entityManager.persist(entity);
    }
    
    public void update(NewEntity entity) {
        entityManager.merge(entity);
    }
}
```

## Debugging

### Local Debugging
1. **Start Wildfly in Debug Mode**: Use IntelliJ's debug configuration
2. **Set Breakpoints**: In your EJB methods
3. **Invoke EJBs**: Through remote client or test cases
4. **Debug Variables**: Inspect transaction state and data

### Remote Debugging
```bash
# Enable remote debugging on server
export JAVA_OPTS="$JAVA_OPTS -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=8787"

# Connect from IntelliJ
# Run → Edit Configurations → Add → Remote JVM Debug
# Host: server-hostname
# Port: 8787
```

### Log Analysis
```bash
# Tail application logs
tail -f wildfly/standalone/log/server.log

# Filter for specific classes
grep "PaymentProcessor" wildfly/standalone/log/server.log

# Search for errors
grep "ERROR" wildfly/standalone/log/server.log | tail -20
```

## Performance Profiling

### JProfiler Integration
1. **Install JProfiler**: Download and install JProfiler
2. **Configure Wildfly**: Add JProfiler agent to startup
3. **Profile Application**: Connect to running Wildfly instance
4. **Analyze Results**: Memory usage, CPU hotspots, thread analysis

### JVM Monitoring
```bash
# Monitor JVM metrics
jstat -gc -t <pid> 5s

# Heap dump analysis
jmap -dump:format=b,file=heap.hprof <pid>

# Thread dump
jstack <pid> > threads.txt
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean and rebuild
mvn clean compile

# Resolve dependency conflicts
mvn dependency:tree
mvn dependency:resolve-sources
```

#### Deployment Issues
```bash
# Check Wildfly logs
tail -f wildfly/standalone/log/server.log

# Verify EAR deployment
ls -la wildfly/standalone/deployments/

# Redeploy application
scripts/deploy.sh
```

#### Database Connection Issues
```bash
# Test database connectivity
telnet localhost 1521

# Check datasource configuration
grep -r "LiveDS" wildfly/standalone/configuration/

# Verify database credentials
sqlplus username/password@localhost:1521/XE
```

### Performance Issues
1. **Enable JMX Monitoring**: Monitor EJB pool usage
2. **Database Query Analysis**: Check slow query logs
3. **Connection Pool Tuning**: Adjust pool sizes
4. **Memory Analysis**: Check for memory leaks

### Getting Help
- **Team Slack**: #passkey-api channel
- **Documentation**: Internal wiki and Confluence
- **Code Reviews**: Create pull requests for feedback
- **Pair Programming**: Schedule sessions with team members

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.x
- Wildfly 26.1.3.Final
- Docker (for local development)
- ASDF (for version management)

### Local Development Setup

1. **Clone and Setup**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-commerce.git
   cd passkey-commerce
   scripts/setup.sh
   ```

2. **Build the Application**:
   ```bash
   pnpm run build
   # or
   mvn clean package
   ```

3. **Deploy to Local Wildfly**:
   ```bash
   scripts/deploy.sh
   ```

4. **Configure Environment**:
   ```bash
   scripts/configure.sh <environment>
   ```

### Running the Service

The service runs on Wildfly with a port offset of 100 (default port 8180) to avoid conflicts with other services.

## Links


- [Commerce Dashboard](https://logs.core.cvent.org/en-US/app/prodsupport/passkey_commerce)
- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PAS)/job/passkey-commerce)
- [Octopus Deployment](https://octo.core.cvent.org/app#/Spaces-1/projects/commerce/deployments)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-commerce)
- [SonarQube Analysis](https://sonar.core.cvent.org)
