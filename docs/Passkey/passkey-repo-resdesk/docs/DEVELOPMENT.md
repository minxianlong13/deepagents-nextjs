# Development Guide

## Prerequisites

### Required Software
- **Java 17**: OpenJDK or Oracle JDK
- **Maven 3.6+**: Build tool for Java components
- **Node.js 18+**: For build tooling and scripts
- **pnpm 8+**: Package manager for Node.js dependencies
- **Docker**: For containerization and local services
- **Git**: Version control

### Development Tools
- **ASDF**: Version manager for multiple runtime versions
- **IntelliJ IDEA**: Recommended IDE (Ultimate Edition preferred)
- **Eclipse**: Alternative IDE with Maven support
- **Postman**: API testing and development
- **DBeaver**: Database client for Oracle

### Required Repositories
Clone these repositories in neighboring directories:
- **passkey-legacy**: Core Passkey libraries
- **hogan-configs**: Configuration templates

```bash
# Directory structure
parent-directory/
├── passkey-resdesk/
├── passkey-legacy/
└── hogan-configs/
```

## Local Setup

### 1. Install ASDF and Tools
```bash
# Install ASDF
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.11.3

# Add to shell profile
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc
echo '. ~/.asdf/completions/asdf.bash' >> ~/.bashrc

# Install plugins
asdf plugin add java
asdf plugin add maven
asdf plugin add nodejs
asdf plugin add pnpm

# Install versions (from .tool-versions file)
asdf install
```

### 2. Build Dependencies
```bash
# Build passkey-legacy first
cd ../passkey-legacy
mvn clean install

# Return to resdesk directory
cd ../passkey-resdesk
```

### 3. Initial Setup
```bash
# Run setup script to configure WildFly
scripts/setup.sh

# Install Node.js dependencies
pnpm install
```

### 4. Configure Port Forwarding (macOS)
```bash
# Create port forwarding rules
sudo pfctl -evf scripts/wildfly.pfanchors

# Add to /etc/hosts
echo "127.0.0.1    localhost dev-manage.passkey.com" | sudo tee -a /etc/hosts
```

### 5. Configure Environment
```bash
# Generate development configuration
scripts/configure.sh dev

# Verify configuration files are created
ls wildfly/standalone/configuration/passkey-standalone-full-dev.xml
ls wildfly/modules/system/layers/base/config/main/passkey_dev.properties
```

## Running the Application

### Standard Deployment
```bash
# Build and deploy application
scripts/deploy.sh

# Start WildFly (if not already running)
wildfly/bin/standalone.sh -c passkey-standalone-full-dev.xml
```

### HotSwap Development (Recommended)
For faster development iteration with automatic code reloading:

#### 1. Configure IntelliJ for HotSwap
1. Open **Run/Debug Configurations**
2. Under **Deployments** tab:
   - Add `group-resdesk:ear exploded` artifact
   - Ensure `Build 'group-resdesk:ear exploded' artifact` is in **Before launch**
3. Under **Server** tab:
   - Set **On 'Update' action** to `Update classes and resources`
   - Set **On frame deactivation** to `Update classes and resources`

#### 2. Prepare for HotSwap
```bash
# Clean build
mvn clean

# Reload Maven projects in IntelliJ
# (Click the refresh icon in Maven tool window)

# Verify target directory only has application.xml
ls packages/app/ear/target/
```

#### 3. Run with HotSwap
1. Start the application using IntelliJ's Run/Debug buttons
2. Make code changes
3. Changes should be automatically deployed within 30 seconds
4. **Important**: Do NOT run `scripts/deploy.sh` when using HotSwap

### Accessing the Application
- **URL**: `https://dev-manage.passkey.com`
- **Management Console**: `https://dev-manage.passkey.com:9993`
  - Username: `admin`
  - Password: `admin`

**Note**: Chrome may show security warnings for self-signed certificates. Type `thisisunsafe` to bypass.

## Running Tests

### Java Tests
```bash
# Run all tests
pnpm run test:java

# Run tests with Maven directly
mvn test

# Run specific test class
mvn test -Dtest=ReservationServiceTest

# Run tests with coverage
mvn clean verify -Pcoverage
```

### Integration Tests
```bash
# Run full test suite including integration tests
pnpm run test

# Run SonarQube analysis
pnpm run test:sonar
```

### Test Configuration
- **Unit Tests**: Located in `src/test/java` directories
- **Test Resources**: Configuration files in `src/test/resources`
- **Coverage Reports**: Generated in `target/site/jacoco/`
- **Test Results**: XML reports in `target/surefire-reports/`

## Code Structure

### Module Organization
```
packages/app/
├── core/                    # Shared domain models and utilities
│   ├── src/main/java/      # Core Java classes
│   └── src/test/java/      # Core unit tests
├── ejb/                     # Business logic layer
│   ├── src/main/java/      # EJB session beans and services
│   └── src/test/java/      # EJB unit tests
├── web/                     # Web presentation layer
│   ├── src/main/java/      # Servlets and web components
│   ├── src/main/webapp/    # JSP pages and web resources
│   └── src/test/java/      # Web layer tests
├── ear/                     # Enterprise Application Archive
│   └── src/main/application/ # EAR deployment descriptor
└── malware-scanner/         # Malware scanning module
    └── src/main/java/      # ClamAV integration
```

### Package Structure
```java
com.lanyon.resdesk.
├── core.                   # Core domain models
│   ├── model.             # Entity classes
│   ├── dto.               # Data transfer objects
│   └── util.              # Utility classes
├── ejb.                    # Business logic
│   ├── service.           # Service layer
│   ├── dao.               # Data access objects
│   └── integration.       # External service integration
└── web.                    # Web layer
    ├── servlet.           # HTTP servlets
    ├── filter.            # Request filters
    └── util.              # Web utilities
```

## Coding Standards

### Java Code Style
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: Maximum 120 characters
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Comments**: JavaDoc for public APIs, inline comments for complex logic

### Code Quality Tools
```bash
# Run Checkstyle
mvn checkstyle:check

# Run PMD
mvn pmd:check

# Run SpotBugs
mvn spotbugs:check
```

### Git Workflow
- **Branch Naming**: `feature/TICKET-123-description`
- **Commit Messages**: Clear, descriptive messages
- **Pull Requests**: Required for all changes to master
- **Code Review**: At least one approval required

## Common Development Tasks

### Adding a New REST Endpoint
1. **Create Service Method** (in EJB module):
```java
@Stateless
public class ReservationService {
    public Reservation findReservation(String id) {
        // Implementation
    }
}
```

2. **Create Servlet** (in Web module):
```java
@WebServlet("/api/reservations/*")
public class ReservationServlet extends HttpServlet {
    @EJB
    private ReservationService reservationService;
    
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        // Implementation
    }
}
```

3. **Add Tests**:
```java
@Test
public void testFindReservation() {
    // Test implementation
}
```

### Adding a New Entity
1. **Create Entity Class** (in Core module):
```java
@Entity
@Table(name = "RESERVATIONS")
public class Reservation {
    @Id
    private String id;
    
    // Other fields and methods
}
```

2. **Create DAO** (in EJB module):
```java
@Stateless
public class ReservationDAO {
    @PersistenceContext
    private EntityManager em;
    
    public Reservation findById(String id) {
        return em.find(Reservation.class, id);
    }
}
```

### Database Changes
1. **Create Migration Script**:
```sql
-- V1.1__Add_reservation_notes_table.sql
CREATE TABLE RESERVATION_NOTES (
    id VARCHAR2(50) PRIMARY KEY,
    reservation_id VARCHAR2(50) NOT NULL,
    content CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Update Entity Mappings**:
```java
@Entity
@Table(name = "RESERVATION_NOTES")
public class ReservationNote {
    // Entity definition
}
```

### Adding Configuration Properties
1. **Add to Properties File**:
```properties
# resdesk_dev.properties
resdesk.feature.newFeature.enabled=true
resdesk.integration.timeout=30000
```

2. **Access in Code**:
```java
@Value("${resdesk.feature.newFeature.enabled:false}")
private boolean newFeatureEnabled;
```

## Debugging

### IntelliJ Debugging
1. **Set Breakpoints**: Click in gutter next to line numbers
2. **Debug Mode**: Use Debug button instead of Run
3. **Remote Debugging**: Configure remote JVM debugging if needed

### Log Analysis
```bash
# View application logs
tail -f wildfly/standalone/log/resdesk.log

# View server logs
tail -f wildfly/standalone/log/server.log

# Search logs for errors
grep -i error wildfly/standalone/log/*.log
```

### Database Debugging
```sql
-- Check reservation data
SELECT * FROM RESERVATIONS WHERE id = 'reservation-123';

-- Check connection pool status
SELECT * FROM V$SESSION WHERE USERNAME = 'RESDESK_USER';
```

## Performance Optimization

### Local Performance Testing
```bash
# Use JMeter for load testing
jmeter -n -t test-plan.jmx -l results.jtl

# Monitor JVM performance
jconsole localhost:9999

# Profile with VisualVM
visualvm --jdkhome $JAVA_HOME
```

### Memory Analysis
```bash
# Generate heap dump
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc
jcmd <pid> GC.dump_heap heap.hprof

# Analyze with Eclipse MAT or VisualVM
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <pid>
```

#### Database Connection Issues
```bash
# Test database connectivity
sqlplus resdesk_user/password@localhost:1521/XEPDB1

# Check WildFly data source
wildfly/bin/jboss-cli.sh --connect --command="/subsystem=datasources:test-connection-in-pool(data-source=PasskeyDS)"
```

#### Build Issues
```bash
# Clean everything
mvn clean
rm -rf target/
rm -rf ~/.m2/repository/com/lanyon/

# Rebuild dependencies
cd ../passkey-legacy && mvn clean install
cd ../passkey-resdesk && mvn clean package
```

#### HotSwap Not Working
1. Verify IntelliJ configuration settings
2. Check that only `application.xml` exists in `ear/target/`
3. Ensure no Maven commands were run after `mvn clean`
4. Restart IntelliJ and try again

### Getting Help
- **Team Chat**: #passkey-resdesk Slack channel
- **Documentation**: Internal wiki and Confluence
- **Code Review**: Create pull request for feedback
- **Architecture Questions**: Consult with senior team members