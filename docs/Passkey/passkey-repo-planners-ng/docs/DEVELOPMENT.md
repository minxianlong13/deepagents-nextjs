# Development Guide

## Prerequisites

Before setting up the local development environment, ensure you have the following tools installed:

### Required Tools

- **ASDF**: Version manager for multiple runtime versions
  - [Installation Guide](https://wiki.cvent.com/x/8wCNC)
- **Java 17**: LTS version managed through ASDF
- **Maven 3.x**: Build automation tool
  - [Installation Guide](https://wiki.cvent.com/x/0Cgj)
- **Docker**: Container platform for local services
- **pnpm**: Fast, disk space efficient package manager
- **Git**: Version control system

### Optional Tools

- **oktaws**: AWS credential management (for S3 integration)
  - Required for planner summary email functionality
  - Requires core-passkey-dev tile in Okta
- **IntelliJ IDEA**: Recommended IDE for Java development
- **Postman**: API testing and development

### External Dependencies

- **hogan-configs**: Configuration management repository
  - Should be cloned adjacent to the project directory
  - Used for environment-specific configuration generation

---

## Local Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-planners-ng.git
cd passkey-planners-ng

# Install Node.js and Java versions
asdf install

# Install dependencies
pnpm install
```

### 2. Initial Configuration

Run the setup script to configure WildFly and the development environment:

```bash
scripts/setup.sh
```

This script will:
- Download and configure WildFly server
- Set up the default development environment
- Create management user (admin/admin)
- Configure datasources and security

### 3. Network Configuration

#### Port Forwarding (macOS)

To run on standard HTTP/HTTPS ports, configure port forwarding:

```bash
# Create port forwarding rules
sudo pfctl -evf scripts/wildfly.pfanchors
```

The `scripts/wildfly.pfanchors` file contains:
```
rdr pass inet proto tcp from any to any port 80 -> 127.0.0.1 port 8080
rdr pass on lo0 inet proto tcp from any to any port 80 -> 127.0.0.1 port 8080
rdr pass inet proto tcp from any to any port 443 -> 127.0.0.1 port 8443
rdr pass on lo0 inet proto tcp from any to any port 443 -> 127.0.0.1 port 8443
```

**Note**: These settings must be reinstalled after each system restart.

#### Hosts File Configuration

Add the development domain to your hosts file:

```bash
# Edit /etc/hosts
sudo nano /etc/hosts

# Add this line:
127.0.0.1    localhost dev-planners.passkey.com

# For Mac users experiencing JMS issues, also add your machine name:
127.0.0.1    localhost C02X7DPGJG5J dev-planners.passkey.com
```

### 4. Environment Configuration

Generate configuration for additional environments:

```bash
# Configure staging environment
scripts/configure.sh staging

# Configure production environment (for reference)
scripts/configure.sh production
```

This creates environment-specific WildFly configuration files and updates AWS credential integration.

---

## Development Workflow

### Building the Application

```bash
# Clean build
mvn clean compile

# Build with tests
mvn clean verify

# Build without tests (faster for development)
mvn clean package -Dmaven.test.skip=true

# Build with specific version
pnpm run build
```

### Deploying Locally

```bash
# Deploy to local WildFly
scripts/deploy.sh

# Or manually copy WAR file
cp target/plannerPortal.war wildfly/standalone/deployments/
```

### Running the Application

1. **Start WildFly Server**:
   ```bash
   # From wildfly/bin directory
   ./standalone.sh -c passkey-standalone-full-dev.xml
   ```

2. **Access the Application**:
   - URL: https://dev-planners.passkey.com/
   - **Important**: Use HTTPS, not HTTP
   - Accept the self-signed certificate warning

3. **Bypass Chrome Security Warning**:
   - If Chrome shows "Your connection is not private"
   - Type `thisisunsafe` while the page has focus
   - This bypasses the self-signed certificate warning

### Hot Deployment

WildFly supports hot deployment for rapid development:

```bash
# Touch the deployment file to trigger redeployment
touch wildfly/standalone/deployments/plannerPortal.war.dodeploy

# Or use Maven for automatic redeployment
mvn compile war:war
cp target/plannerPortal.war wildfly/standalone/deployments/
```

---

## IDE Setup

### IntelliJ IDEA Configuration

1. **Import Project**:
   - Open IntelliJ IDEA
   - Import existing Maven project
   - Select the root `pom.xml` file

2. **JBoss/WildFly Server Configuration**:
   - Go to Run/Debug Configurations
   - Add new JBoss Server configuration
   - Point to your `wildfly/` directory

3. **Server Settings**:
   - **JRE**: Java 17
   - **Startup Script**: Uncheck "use default" and add:
     ```
     -c passkey-standalone-full-dev.xml
     ```
   - **Debug Configuration**: Add the same startup options

4. **Deployment Configuration**:
   - Add artifact: `plannerPortal:war`
   - Application context: `/`

### VS Code Configuration

For developers preferring VS Code:

```json
// .vscode/settings.json
{
    "java.home": "/path/to/java17",
    "maven.executable.path": "/path/to/maven/bin/mvn",
    "java.configuration.updateBuildConfiguration": "automatic"
}
```

---

## Running Tests

### Unit Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=EventControllerTest

# Run tests with coverage
mvn clean verify
```

### Integration Tests

```bash
# Run integration tests
mvn verify -Pintegration-tests

# Run with specific profile
mvn verify -Pdev
```

### Test Configuration

For IntelliJ users experiencing Java 9+ security issues:

1. Go to Run/Debug Configurations
2. Select JUnit template
3. Add VM parameter:
   ```
   --add-opens java.base/java.lang=ALL-UNNAMED
   ```

This resolves `java.lang.reflect.InaccessibleObjectException` errors.

---

## Code Structure

### Package Organization

```
src/main/java/com/passkey/
├── core/                    # Core utilities and configuration
│   ├── config/             # Configuration classes
│   ├── security/           # Security utilities
│   └── util/               # Common utilities
├── portal/                 # Main application code
│   ├── web/                # Web layer
│   │   ├── controller/     # Spring MVC controllers
│   │   ├── filter/         # Servlet filters
│   │   └── interceptor/    # Request interceptors
│   ├── service/            # Business logic layer
│   ├── dao/                # Data access layer
│   ├── model/              # Domain models and DTOs
│   └── validator/          # Input validation
└── sonar/                  # SonarQube configuration
```

### Frontend Structure

```
src/main/webapp/
├── WEB-INF/
│   ├── jsp/                # JSP view templates
│   ├── tiles/              # Apache Tiles definitions
│   └── web.xml             # Web application configuration
├── css/                    # Stylesheets
├── js/                     # JavaScript files
├── images/                 # Static images
└── resources/              # Other static resources
```

---

## Coding Standards

### Java Code Style

- **Indentation**: 4 spaces (no tabs)
- **Line Length**: Maximum 120 characters
- **Naming**: CamelCase for classes, camelCase for methods/variables
- **Comments**: JavaDoc for public methods and classes

### Example Controller

```java
@Controller
@RequestMapping("/events")
public class EventController {
    
    private static final Logger logger = LoggerFactory.getLogger(EventController.class);
    
    @Autowired
    private EventService eventService;
    
    /**
     * Displays the event listing page.
     *
     * @param model Spring MVC model
     * @return view name
     */
    @GetMapping
    public String listEvents(Model model) {
        try {
            List<Event> events = eventService.findAllEvents();
            model.addAttribute("events", events);
            return "events/list";
        } catch (Exception e) {
            logger.error("Error loading events", e);
            model.addAttribute("error", "Unable to load events");
            return "error";
        }
    }
}
```

### JavaScript Code Style

- **Indentation**: 2 spaces
- **Semicolons**: Always use semicolons
- **Quotes**: Single quotes for strings
- **Functions**: Use function declarations for named functions

### CSS Code Style

- **Indentation**: 2 spaces
- **Properties**: One property per line
- **Selectors**: Use meaningful class names
- **Organization**: Group related styles together

---

## Common Development Tasks

### Adding a New Controller

1. **Create Controller Class**:
   ```java
   @Controller
   @RequestMapping("/new-feature")
   public class NewFeatureController {
       // Implementation
   }
   ```

2. **Create Service Layer**:
   ```java
   @Service
   public class NewFeatureService {
       // Business logic
   }
   ```

3. **Create JSP Views**:
   ```jsp
   <%@ page contentType="text/html;charset=UTF-8" language="java" %>
   <%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
   
   <tiles:insertDefinition name="defaultTemplate">
       <tiles:putAttribute name="body">
           <!-- Content here -->
       </tiles:putAttribute>
   </tiles:insertDefinition>
   ```

4. **Add URL Mappings**:
   Update `web.xml` or Spring configuration as needed.

### Adding Database Changes

1. **Create Migration Script**:
   ```sql
   -- V005__Add_New_Feature_Table.sql
   CREATE TABLE new_feature (
       id VARCHAR2(50) PRIMARY KEY,
       name VARCHAR2(255) NOT NULL,
       created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Update DAO Layer**:
   ```java
   @Repository
   public class NewFeatureDao {
       @Autowired
       private JdbcTemplate jdbcTemplate;
       
       public List<NewFeature> findAll() {
           // Implementation
       }
   }
   ```

### Adding External Service Integration

1. **Add Client Dependency**:
   ```xml
   <dependency>
       <groupId>com.cvent.external</groupId>
       <artifactId>external-service-client</artifactId>
       <version>1.0.0</version>
   </dependency>
   ```

2. **Configure Client Bean**:
   ```xml
   <bean id="externalServiceClient" 
         class="com.cvent.external.ExternalServiceClient">
       <property name="baseUrl" value="${external.service.url}"/>
       <property name="apiKey" value="${external.service.key}"/>
   </bean>
   ```

3. **Use in Service Layer**:
   ```java
   @Service
   public class IntegrationService {
       @Autowired
       private ExternalServiceClient externalClient;
       
       public void callExternalService() {
           // Implementation
       }
   }
   ```

---

## Troubleshooting

### Common Issues

#### 1. EhCache RMI Connection Issues

**Error**: `Cannot resolve reference to bean 'ehcache'`

**Solution**: Add your machine hostname to `/etc/hosts`:
```bash
127.0.0.1    localhost your-machine-name dev-planners.passkey.com
```

#### 2. Java Reflection Errors

**Error**: `java.lang.reflect.InaccessibleObjectException`

**Solution**: Add JVM argument to WildFly `standalone.sh`:
```bash
DEFAULT_MODULAR_JVM_OPTIONS="$DEFAULT_MODULAR_JVM_OPTIONS --add-opens java.base/sun.util.locale=ALL-UNNAMED"
```

#### 3. SSL Certificate Issues

**Error**: Chrome blocks self-signed certificate

**Solution**: Type `thisisunsafe` on the Chrome warning page

#### 4. Port Already in Use

**Error**: `Address already in use: bind`

**Solution**: 
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

#### 5. Maven Build Failures

**Error**: Dependencies not found

**Solution**:
```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Rebuild
mvn clean install
```

### Debug Configuration

#### Enable Debug Logging

Add to `logback.xml`:
```xml
<logger name="com.passkey" level="DEBUG"/>
<logger name="org.springframework.web" level="DEBUG"/>
```

#### Remote Debugging

Add to WildFly startup:
```bash
./standalone.sh -c passkey-standalone-full-dev.xml --debug
```

Connect debugger to port 8787.

### Performance Profiling

#### JVM Profiling

Add JVM options:
```bash
-XX:+FlightRecorder
-XX:StartFlightRecording=duration=60s,filename=profile.jfr
```

#### Database Query Logging

Enable in Spring configuration:
```xml
<property name="showSql" value="true"/>
<property name="formatSql" value="true"/>
```

---

## Git Workflow

### Branch Strategy

- **master**: Production-ready code
- **development**: Integration branch for features
- **feature/**: Feature development branches
- **hotfix/**: Critical production fixes
- **release/**: Release preparation branches

### Commit Guidelines

```bash
# Format: type(scope): description
git commit -m "feat(events): add event creation wizard"
git commit -m "fix(auth): resolve session timeout issue"
git commit -m "docs(api): update endpoint documentation"
```

### Pull Request Process

1. Create feature branch from `development`
2. Implement changes with tests
3. Update documentation if needed
4. Create pull request to `development`
5. Code review and approval required
6. Merge after CI/CD passes

---

## Local Testing

### Manual Testing Checklist

- [ ] Application starts without errors
- [ ] Login functionality works
- [ ] Event creation and editing
- [ ] Reservation management
- [ ] Report generation
- [ ] File upload with malware scanning
- [ ] Session timeout handling
- [ ] Error page display

### Test Data Setup

```sql
-- Insert test data
INSERT INTO events (event_id, event_name, start_date, end_date, location, planner_id)
VALUES ('test-001', 'Test Conference', SYSDATE + 30, SYSDATE + 33, 'Test City', 'test-planner');

INSERT INTO hotels (hotel_id, hotel_name, city, state, is_active)
VALUES ('hotel-001', 'Test Hotel', 'Test City', 'Test State', 1);
```

### Environment Validation

```bash
# Check Java version
java -version

# Check Maven version
mvn -version

# Check WildFly status
curl -k https://dev-planners.passkey.com/health

# Check database connectivity
sqlplus username/password@localhost:1521/xe
```

## Additional Resources

## Technology Stack


- **Backend**: Java 17 with Spring Framework 5.3.34
- **Application Server**: WildFly 26.1.3.Final
- **Frontend**: JSP with Apache Tiles, JavaScript, CSS
- **Build System**: Maven with pnpm for frontend assets
- **Database**: Oracle with connection pooling
- **Security**: Spring Security 5.8.16 with OWASP encoding
- **Testing**: JUnit with Mockito and PowerMock
- **Monitoring**: Integrated with Datadog and SonarQube

## Quick Start


### Prerequisites

- Java 17 (via ASDF)
- Maven 3.x
- Docker
- pnpm
- Hogan-configs repository
- oktaws (for AWS integration)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-planners-ng.git
   cd passkey-planners-ng
   ```

2. **Run initial setup**:
   ```bash
   scripts/setup.sh
   ```

3. **Configure port forwarding** (macOS):
   ```bash
   sudo pfctl -evf scripts/wildfly.pfanchors
   ```

4. **Update hosts file**:
   ```bash
   echo "127.0.0.1 dev-planners.passkey.com" | sudo tee -a /etc/hosts
   ```

5. **Deploy the application**:
   ```bash
   scripts/deploy.sh
   ```

6. **Access the application**:
   Navigate to https://dev-planners.passkey.com/

## Links


- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PAS)/job/passkey-planners-ng)
- [Octopus Deployment](https://octo.core.cvent.org/app#/Spaces-1/projects/planner-portal/deployments)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-planner-portal)
- [SonarQube Analysis](https://sonar.core.cvent.org)
- [Bluecumber Tests](https://qe-jenkins.core.cvent.org/job/Passkey_Bluecumber) (tags: `@planner-portal`)

## Team


**Owner**: cherry-pickers team

**Business Unit**: Hospitality  
**Platform**: Passkey  
**Product**: Passkey for Planners Housing
