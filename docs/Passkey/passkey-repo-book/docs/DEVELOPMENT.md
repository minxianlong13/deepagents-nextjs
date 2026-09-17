# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build and dependency management
- **Wildfly 16**: Application server
- **Oracle Database**: Local instance or connection to dev database
- **Node.js 18+**: For development tooling
- **pnpm**: Package manager for Node.js dependencies
- **Git**: Version control

### Development Tools
- **IDE**: IntelliJ IDEA (recommended) or Eclipse
- **Database Client**: SQL Developer, DBeaver, or similar
- **API Testing**: Postman or curl
- **Browser**: Chrome/Firefox with developer tools

### Environment Setup
```bash
# Install Java 17 (using asdf)
asdf install java openjdk-17.0.2
asdf global java openjdk-17.0.2

# Install Maven
asdf install maven 3.6.3
asdf global maven 3.6.3

# Install Node.js and pnpm
asdf install nodejs 18.17.0
asdf global nodejs 18.17.0
npm install -g pnpm
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-book.git
cd passkey-book
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies for development tooling
pnpm install

# Install Maven dependencies
mvn clean install
```

### 3. Setup Wildfly
```bash
# Download and extract Wildfly 16
wget https://download.jboss.org/wildfly/16.0.0.Final/wildfly-16.0.0.Final.tar.gz
tar -xzf wildfly-16.0.0.Final.tar.gz
export WILDFLY_HOME=/path/to/wildfly-16.0.0.Final

# Run setup script to configure Wildfly
scripts/setup.sh
```

### 4. Database Setup
```bash
# Configure Oracle database connection
# Update configs/dev-standalone-full.xml with your database details

# Run database migrations (if applicable)
scripts/migrate-db.sh
```

### 5. Configure Hosts File
Add the following entry to your `/etc/hosts` file:
```
127.0.0.1    passkey-book-dev.core.cvent.org
```

### 6. IDE Configuration

#### IntelliJ IDEA Setup
1. **Import Project**: Open the root `pom.xml` as a project
2. **JDK Configuration**: Set Project SDK to Java 17
3. **Maven Configuration**: Enable auto-import for Maven projects
4. **Run Configuration**: Create a JBoss/Wildfly run configuration

**VM Options for Run Configuration**:
```
-Djava.net.preferIPv4Stack=true
-Djava.locale.providers=COMPAT,CLDR,SPI
-Djava.util.PropertyResourceBundle.encoding=ISO-8859-1
-Djboss.server.default.config=dev-standalone-full.xml
-Djboss.http.port=80
-Djboss.https.port=443
```

**Startup Script Configuration**:
- Set startup script to end with: `-c dev-standalone-full.xml`
- Configure deployment artifact: `aws:war exploded`

## Running the Application

### Method 1: Using Scripts (Recommended)
```bash
# Start Wildfly in background
$WILDFLY_HOME/bin/standalone.sh -c dev-standalone-full.xml &

# Build and deploy application
scripts/deploy.sh

# Access application
open https://passkey-book-dev.core.cvent.org/event/12345/owner/67890/home
```

### Method 2: Using IDE
1. Start the Wildfly run configuration in IntelliJ
2. Wait for server startup
3. Deploy the `aws:war exploded` artifact
4. Access the application URL

### Method 3: Manual Deployment
```bash
# Build the application
mvn clean package

# Start Wildfly
$WILDFLY_HOME/bin/standalone.sh -c dev-standalone-full.xml

# Deploy WAR file
cp packages/app/war/target/aws.war $WILDFLY_HOME/standalone/deployments/
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
mvn test

# Run tests for specific module
mvn test -pl packages/app/war

# Run specific test class
mvn test -Dtest=GuestServiceTest

# Run tests with coverage
mvn test jacoco:report
```

### Integration Tests
```bash
# Run integration tests (requires running database)
mvn verify -Pintegration-tests

# Run with test database
mvn verify -Pintegration-tests -Dtest.database.url=jdbc:oracle:thin:@localhost:1521:testdb
```

### Test Coverage
```bash
# Generate coverage report
mvn clean test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

## Code Structure

### Package Organization
```
com.passkey.aws/
├── bean/                 # Domain entities and data objects
├── dao/                  # Data access objects
├── service/              # Business logic services
├── web/                  # Web controllers and components
│   ├── controller/       # Spring MVC controllers
│   ├── bean/            # Web-specific beans and forms
│   └── tags/            # Custom JSP tags
├── util/                # Utility classes
├── validator/           # Custom validators
└── model/               # API models and DTOs
```

### Module Dependencies
```
war (Web Application)
├── depends on: passkey-core, groupmax-core2, passkey-dev-core
├── contains: Controllers, JSPs, Web configuration

passkey-core (Core Business Logic)
├── depends on: Spring, Hibernate
├── contains: Services, Entities, DAOs

groupmax-core2 (Legacy Integration)
├── depends on: Legacy libraries
├── contains: Legacy models, Migration utilities

passkey-dev-core (Development Support)
├── depends on: Testing frameworks
├── contains: Test utilities, Mock implementations
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

### Code Quality Rules
```java
// Good: Descriptive method names
public List<Guest> findGuestsByReservationId(Long reservationId) {
    return guestDao.findByReservationId(reservationId);
}

// Good: Proper exception handling
try {
    paymentService.processPayment(paymentRequest);
} catch (PaymentException e) {
    log.error("Payment processing failed for reservation: {}", reservationId, e);
    throw new BookingException("Payment failed", e);
}

// Good: Input validation
@Valid
public ResponseEntity<BookingResponse> createBooking(@RequestBody @Valid BookingRequest request) {
    // Implementation
}
```

### JSP Best Practices
```jsp
<%-- Good: Use JSTL tags instead of scriptlets --%>
<c:forEach items="${guests}" var="guest">
    <div class="guest-info">
        <c:out value="${guest.firstName}" /> <c:out value="${guest.lastName}" />
    </div>
</c:forEach>

<%-- Good: Proper escaping for XSS prevention --%>
<input type="text" value="<c:out value='${guest.email}' />" />

<%-- Good: Use custom tags for reusable components --%>
<passkey:toggleSwitch name="notifications" value="${user.notificationsEnabled}" />
```

## Common Development Tasks

### Adding a New Entity
1. **Create Entity Class**:
```java
@Entity
@Table(name = "NEW_ENTITY")
public class NewEntity extends AuditableEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    // Getters and setters
}
```

2. **Create DAO Interface**:
```java
public interface NewEntityDao {
    NewEntity findById(Long id);
    List<NewEntity> findAll();
    NewEntity save(NewEntity entity);
    void delete(Long id);
}
```

3. **Implement DAO**:
```java
@Repository
public class NewEntityDaoImpl implements NewEntityDao {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    public NewEntity findById(Long id) {
        return entityManager.find(NewEntity.class, id);
    }
    
    // Other implementations
}
```

4. **Create Service**:
```java
@Service
@Transactional
public class NewEntityService {
    
    @Autowired
    private NewEntityDao newEntityDao;
    
    public NewEntity createEntity(NewEntity entity) {
        // Business logic
        return newEntityDao.save(entity);
    }
}
```

### Adding a New Web Endpoint
1. **Create Controller Method**:
```java
@Controller
@RequestMapping("/api/entities")
public class NewEntityController {
    
    @Autowired
    private NewEntityService entityService;
    
    @GetMapping("/{id}")
    public ResponseEntity<NewEntity> getEntity(@PathVariable Long id) {
        NewEntity entity = entityService.findById(id);
        return ResponseEntity.ok(entity);
    }
    
    @PostMapping
    public ResponseEntity<NewEntity> createEntity(@RequestBody @Valid NewEntity entity) {
        NewEntity created = entityService.createEntity(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
```

2. **Create JSP View** (if needed):
```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<html>
<head>
    <title>Entity Details</title>
</head>
<body>
    <h1>Entity: <c:out value="${entity.name}" /></h1>
    <!-- Entity details -->
</body>
</html>
```

### Adding Database Migration
1. **Create Migration Script**:
```sql
-- V1.1__Add_new_entity_table.sql
CREATE TABLE NEW_ENTITY (
    id NUMBER(19) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE NEW_ENTITY_SEQ START WITH 1 INCREMENT BY 1;
```

2. **Run Migration**:
```bash
mvn flyway:migrate
```

## Debugging

### Application Debugging
1. **Enable Debug Mode**: Add `-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005` to JVM options
2. **IDE Debug Configuration**: Create remote debug configuration pointing to port 5005
3. **Set Breakpoints**: Set breakpoints in your IDE
4. **Debug Session**: Start debug session and trigger the code path

### Database Debugging
```sql
-- Enable SQL logging in Hibernate
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE

-- Check database connections
SELECT * FROM V$SESSION WHERE USERNAME = 'PASSKEY_USER';

-- Monitor long-running queries
SELECT sql_text, elapsed_time, executions 
FROM V$SQL 
WHERE elapsed_time > 1000000
ORDER BY elapsed_time DESC;
```

### Web Request Debugging
```java
// Add request logging
@Component
public class RequestLoggingFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        log.info("Request: {} {}", httpRequest.getMethod(), httpRequest.getRequestURI());
        chain.doFilter(request, response);
    }
}
```

## Troubleshooting

### Common Issues

#### Wildfly Won't Start
```bash
# Check if port is already in use
netstat -an | grep :8080

# Check Wildfly logs
tail -f $WILDFLY_HOME/standalone/log/server.log

# Clean deployment directory
rm -rf $WILDFLY_HOME/standalone/deployments/*
```

#### Database Connection Issues
```bash
# Test database connectivity
sqlplus username/password@localhost:1521/XE

# Check connection pool status in Wildfly
$WILDFLY_HOME/bin/jboss-cli.sh --connect
/subsystem=datasources/data-source=PasskeyDS:test-connection-in-pool
```

#### Build Issues
```bash
# Clean and rebuild
mvn clean install -U

# Skip tests if needed
mvn clean install -DskipTests

# Check for dependency conflicts
mvn dependency:tree
```

#### Memory Issues
```bash
# Increase heap size
export MAVEN_OPTS="-Xmx2g"

# Monitor memory usage
jstat -gc -t [PID] 5s
```

### Performance Optimization
- **Database Queries**: Use Hibernate query analysis
- **Memory Usage**: Profile with JProfiler or VisualVM
- **Web Performance**: Use browser developer tools
- **Load Testing**: Use JMeter for performance testing

### Getting Help
- **Team Chat**: Slack #passkey-team channel
- **Documentation**: Internal wiki and Confluence
- **Code Reviews**: Create pull requests for peer review
- **Architecture Questions**: Consult with senior developers

## Additional Resources

## Technology Stack


- **Framework**: Spring Framework 5.3.39 with Spring MVC
- **Application Server**: Wildfly 16
- **Build Tool**: Maven (multi-module project)
- **Database**: Oracle (with Hibernate ORM)
- **Security**: Spring Security 5.7.14
- **Frontend**: JSP, JavaScript, CSS
- **Development Tools**: pnpm workspace for modern tooling

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- Wildfly 16
- Oracle Database
- Node.js (for development tooling)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cvent-internal/passkey-book.git
   cd passkey-book
   ```

2. **Setup Wildfly and dependencies**
   ```bash
   scripts/setup.sh
   ```

3. **Configure local environment**
   - Add `passkey-book-dev.core.cvent.org` to your `/etc/hosts` file pointing to `127.0.0.1`
   - Copy `dev-standalone-full.xml` to your Wildfly configuration directory

4. **Build and deploy**
   ```bash
   # Start Wildfly first, then:
   scripts/deploy.sh
   ```

5. **Access the application**
   - URL: `https://passkey-book-dev.core.cvent.org/event/{eventId}/owner/{ownerId}/home`
   - Note: There's no homepage - you need a specific event URL

## Repository Structure


```
passkey-book/
├── packages/app/           # Main application modules
│   ├── war/               # Web application (WAR)
│   ├── passkey-core/      # Core business logic
│   ├── groupmax-core2/    # Legacy GroupMax integration
│   └── passkey-dev-core/  # Development utilities
├── scripts/               # Setup and deployment scripts
├── docs/                  # Documentation
└── configs/              # Environment configurations
```

## Support


- **Team**: Maurya team
- **Jenkins**: [CI Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PAS)/job/passkey-book)
- **Monitoring**: [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-booking)
- **Wiki**: [Passkey Machine Inventory](https://wiki.cvent.com/display/RD/Passkey+Machine+Inventory)
