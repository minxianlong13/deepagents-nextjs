# Development Guide

## Prerequisites

Before setting up the Passkey Addons Portal for local development, ensure you have the following tools installed:

### Required Software
- **Java 17**: OpenJDK 17 LTS (managed via ASDF recommended)
- **Maven**: 3.6+ for Java build management
- **pnpm**: 8+ for workspace and dependency management
- **Docker**: For containerized services and database setup
- **Git**: Version control system
- **ASDF**: Version manager for multiple runtime versions (recommended)

### Development Tools
- **IntelliJ IDEA**: Recommended IDE with Spring and Java EE support
- **VS Code**: Alternative editor with Java extensions
- **Postman**: API testing and development
- **DBeaver**: Database administration and query tool

### Access Requirements
- **GitHub Access**: Repository access to `cvent-internal/passkey-addons-ng`
- **Hogan Configs**: Access to `hogan-configs` repository for environment configuration
- **VPN Access**: Cvent internal network access for database connections
- **Octopus Deploy**: Access for deployment monitoring (optional for development)

## Local Setup

### 1. Environment Setup

#### Install ASDF and Required Plugins
```bash
# Install ASDF (macOS)
brew install asdf

# Add ASDF to shell profile
echo -e "\n. $(brew --prefix asdf)/libexec/asdf.sh" >> ~/.zshrc
source ~/.zshrc

# Install Java plugin
asdf plugin add java

# Install Java 17
asdf install java openjdk-17.0.2
asdf global java openjdk-17.0.2

# Verify installation
java -version
```

#### Install pnpm
```bash
# Install pnpm globally
npm install -g pnpm@latest

# Verify installation
pnpm --version
```

### 2. Repository Setup

#### Clone Repository
```bash
# Clone the main repository
git clone https://github.com/cvent-internal/passkey-addons-ng.git
cd passkey-addons-ng

# Clone hogan-configs (required for configuration)
cd ..
git clone https://github.com/cvent-internal/hogan-configs.git
cd passkey-addons-ng
```

#### Install Dependencies
```bash
# Install workspace dependencies
pnpm install

# Verify workspace setup
pnpm list --depth=0
```

### 3. WildFly Setup

#### Automated Setup
```bash
# Run the setup script (downloads and configures WildFly)
scripts/setup.sh
```

This script will:
- Download WildFly 26.1.3.Final
- Extract to `wildfly/` directory
- Configure management user (admin/admin)
- Set up development configuration
- Create necessary directories

#### Manual Setup (if automated setup fails)
```bash
# Download WildFly
wget https://github.com/wildfly/wildfly/releases/download/26.1.3.Final/wildfly-26.1.3.Final.tar.gz

# Extract to project directory
tar -xzf wildfly-26.1.3.Final.tar.gz
mv wildfly-26.1.3.Final wildfly

# Add management user
wildfly/bin/add-user.sh
# Username: admin
# Password: admin
# Groups: (leave empty)
```

### 4. Database Setup

#### Option A: Local Oracle XE (Recommended)
```bash
# Pull Oracle XE Docker image
docker pull container-registry.oracle.com/database/express:21.3.0-xe

# Run Oracle XE container
docker run -d \
  --name oracle-xe \
  -p 1521:1521 \
  -p 5500:5500 \
  -e ORACLE_PWD=password \
  -e ORACLE_CHARACTERSET=AL32UTF8 \
  container-registry.oracle.com/database/express:21.3.0-xe

# Wait for database to start (check logs)
docker logs -f oracle-xe
```

#### Option B: H2 Database (Testing)
```bash
# H2 is included in dependencies, no additional setup required
# Configuration will be updated automatically for H2 mode
```

#### Create Database Schema
```sql
-- Connect to Oracle XE as SYSTEM user
sqlplus system/password@localhost:1521/XE

-- Create addon user and schema
CREATE USER addon_user IDENTIFIED BY addon_password;
GRANT CONNECT, RESOURCE, DBA TO addon_user;
GRANT UNLIMITED TABLESPACE TO addon_user;

-- Connect as addon_user and create tables
CONNECT addon_user/addon_password@localhost:1521/XE

-- Run schema creation scripts
@packages/app/src/main/resources/sql/create-schema.sql
@packages/app/src/main/resources/sql/insert-test-data.sql
```

### 5. Network Configuration

#### Port Forwarding (macOS)
```bash
# Create port forwarding rules
sudo pfctl -evf scripts/wildfly.pfanchors

# Verify rules are active
sudo pfctl -s nat
```

#### Hosts File Configuration
```bash
# Add local development domain
echo "127.0.0.1 localhost dev-book.passkey.com" | sudo tee -a /etc/hosts

# Verify entry
cat /etc/hosts | grep dev-book
```

### 6. Environment Configuration

#### Generate Development Configuration
```bash
# Generate development environment configuration
scripts/configure.sh dev

# This creates:
# - wildfly/standalone/configuration/passkey-standalone-full-dev.xml
# - wildfly/standalone/configuration/dev.properties
```

#### Configure Secrets (Optional)
```bash
# Create secrets file for development
mkdir -p scripts/secrets
cat > scripts/secrets/dev.properties << EOF
DB.LIVEDS.PASSWORD=addon_password
DB.BIDS.PASSWORD=bi_password
MAIL.SMTP.PASSWORD=smtp_password
EOF
```

## Running the Application

### 1. Start WildFly Server

#### Using IntelliJ IDEA
1. **Create Run Configuration**:
   - Go to Run → Edit Configurations
   - Add new JBoss Server → Local
   - Point to `wildfly/` directory
   - Set JRE to Java 17

2. **Configure Server Settings**:
   - **Startup Script**: Add `--debug -c passkey-standalone-full-dev.xml`
   - **Debug Script**: Add `--debug -c passkey-standalone-full-dev.xml`
   - **VM Options**: `-Xmx2g -XX:+UseG1GC`

3. **Start Server**: Click Run or Debug button

#### Using Command Line
```bash
# Start WildFly in debug mode
wildfly/bin/standalone.sh --debug -c passkey-standalone-full-dev.xml

# Server will start on:
# - HTTP: http://localhost:8080
# - HTTPS: https://localhost:8443
# - Debug: localhost:8787
```

### 2. Deploy Application

#### Automated Deployment
```bash
# Build and deploy application
scripts/deploy.sh

# This will:
# - Build the WAR file
# - Copy to WildFly deployments directory
# - Wait for deployment completion
```

#### Manual Deployment
```bash
# Build application
cd packages/app
mvn clean package -Dmaven.test.skip=true -Daddon.build.tag=dev

# Copy WAR file
cp target/addon.war ../../wildfly/standalone/deployments/

# Monitor deployment
tail -f wildfly/standalone/log/server.log
```

### 3. Access Application

#### Primary URLs
- **Main Application**: https://dev-book.passkey.com/addon
- **Health Check**: https://dev-book.passkey.com/addon/health
- **WildFly Console**: http://localhost:9990/console

#### SSL Certificate Warnings
- Chrome: Type `thisisunsafe` when certificate warning appears
- Firefox: Click "Advanced" → "Accept Risk and Continue"
- Safari: Click "Show Details" → "Visit this website"

## Development Workflow

### 1. Code Structure

#### Package Organization
```
com.passkey.addon/
├── web/
│   ├── controller/     # Spring MVC controllers
│   ├── bean/          # Web-specific DTOs
│   ├── filter/        # Servlet filters
│   └── interceptor/   # Spring interceptors
├── service/           # Business logic services
│   └── impl/         # Service implementations
├── dao/              # Data access objects
├── repository/       # Repository layer
├── bean/             # Domain models
├── client/           # External service clients
├── security/         # Security configuration
├── scheduler/        # Background tasks
├── util/             # Utility classes
└── common/           # Shared constants
```

#### Resource Organization
```
src/main/
├── java/             # Java source code
├── resources/        # Configuration files
│   ├── META-INF/     # Manifest and metadata
│   ├── sql/          # Database scripts
│   └── templates/    # Email templates
└── webapp/           # Web resources
    ├── WEB-INF/      # Web configuration
    ├── css/          # Stylesheets
    ├── js/           # JavaScript files
    └── jsp/          # JSP templates
```

### 2. Building and Testing

#### Build Commands
```bash
# Full build with tests
cd packages/app
mvn clean verify

# Quick build (skip tests)
mvn clean package -Dmaven.test.skip=true

# Build with specific profile
mvn clean package -Pdev

# Clean build artifacts
mvn clean
```

#### Testing Commands
```bash
# Run all tests
pnpm run test

# Run only unit tests
mvn test

# Run integration tests
mvn verify

# Run with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

#### Code Quality
```bash
# Run SonarQube analysis locally
mvn sonar:sonar -Dsonar.host.url=http://localhost:9000

# Run Checkstyle
mvn checkstyle:check

# Run SpotBugs
mvn spotbugs:check
```

### 3. Debugging

#### IntelliJ IDEA Debugging
1. **Set Breakpoints**: Click in gutter next to line numbers
2. **Start Debug Mode**: Use Debug configuration for WildFly
3. **Debug Controls**: Step over, step into, step out, resume
4. **Variable Inspection**: Hover over variables or use Variables panel

#### Remote Debugging
```bash
# Connect to remote debug port
# Host: localhost
# Port: 8787
# Debugger mode: Attach to remote JVM
```

#### Logging Configuration
```xml
<!-- Increase logging for specific packages -->
<logger name="com.passkey.addon" level="DEBUG"/>
<logger name="org.springframework.web" level="DEBUG"/>
<logger name="org.springframework.security" level="TRACE"/>
```

### 4. Database Development

#### Database Connections
```properties
# Development database configuration
addon.jdbc.url=jdbc:oracle:thin:@localhost:1521:XE
addon.jdbc.username=addon_user
addon.jdbc.password=addon_password
```

#### Schema Management
```bash
# Apply schema changes
sqlplus addon_user/addon_password@localhost:1521/XE @schema-update.sql

# Generate test data
sqlplus addon_user/addon_password@localhost:1521/XE @test-data.sql

# Backup development data
exp addon_user/addon_password@localhost:1521/XE file=dev-backup.dmp
```

#### Query Development
```sql
-- Use DBeaver or similar tool for query development
-- Connection: Oracle, localhost:1521, XE, addon_user

-- Example: Find recent addon purchases
SELECT a.name, ah.change_date, ah.history_type
FROM addons a
JOIN addon_history ah ON a.id = ah.addon_id
WHERE ah.change_date >= SYSDATE - 7
ORDER BY ah.change_date DESC;
```

## Coding Standards

### Java Code Style

#### Naming Conventions
```java
// Classes: PascalCase
public class AddonService { }

// Methods and variables: camelCase
public void processAddonPurchase() { }
private String confirmationNumber;

// Constants: UPPER_SNAKE_CASE
private static final String DEFAULT_CURRENCY = "USD";

// Packages: lowercase with dots
package com.passkey.addon.service;
```

#### Code Organization
```java
// Class structure order:
public class ExampleService {
    // 1. Static constants
    private static final Logger logger = LoggerFactory.getLogger(ExampleService.class);
    
    // 2. Instance fields
    private final AddonRepository addonRepository;
    
    // 3. Constructors
    public ExampleService(AddonRepository addonRepository) {
        this.addonRepository = addonRepository;
    }
    
    // 4. Public methods
    public void publicMethod() { }
    
    // 5. Private methods
    private void privateMethod() { }
}
```

#### Documentation Standards
```java
/**
 * Processes addon purchases and updates reservation information.
 * 
 * @param addonInfo the addon purchase information
 * @param reservationId the associated reservation ID
 * @return confirmation details for the purchase
 * @throws AddonProcessingException if purchase cannot be completed
 */
@Transactional
public AddonConfirmation processAddonPurchase(AddonInfo addonInfo, Long reservationId) {
    // Implementation
}
```

### Spring Framework Patterns

#### Controller Best Practices
```java
@Controller
@RequestMapping("/addons")
@SessionAttributes("searchParams")
public class AddonController {
    
    @Autowired
    private AddonService addonService;
    
    @GetMapping
    public String listAddons(Model model, 
                           @RequestParam(defaultValue = "1") int page) {
        // Implementation
        return "addons/list";
    }
    
    @PostMapping
    public String createAddon(@Valid @ModelAttribute AddonForm form,
                            BindingResult result,
                            RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "addons/form";
        }
        // Process form
        redirectAttributes.addFlashAttribute("message", "Addon created successfully");
        return "redirect:/addons";
    }
}
```

#### Service Layer Patterns
```java
@Service
@Transactional(readOnly = true)
public class AddonServiceImpl implements AddonService {
    
    private final AddonRepository addonRepository;
    private final EmailService emailService;
    
    public AddonServiceImpl(AddonRepository addonRepository, 
                           EmailService emailService) {
        this.addonRepository = addonRepository;
        this.emailService = emailService;
    }
    
    @Override
    @Transactional
    public AddonConfirmation purchaseAddon(AddonPurchaseRequest request) {
        // Validate request
        validatePurchaseRequest(request);
        
        // Process purchase
        Addon addon = addonRepository.findById(request.getAddonId())
            .orElseThrow(() -> new AddonNotFoundException("Addon not found"));
        
        // Create confirmation
        AddonConfirmation confirmation = createConfirmation(addon, request);
        
        // Send notification
        emailService.sendConfirmationEmail(confirmation);
        
        return confirmation;
    }
}
```

### JSP and Frontend Standards

#### JSP Best Practices
```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>

<tiles:insertDefinition name="main-layout">
    <tiles:putAttribute name="title">Addon Management</tiles:putAttribute>
    <tiles:putAttribute name="content">
        <div class="addon-list">
            <c:forEach items="${addons}" var="addon">
                <div class="addon-item">
                    <h3><c:out value="${addon.name}"/></h3>
                    <p><fmt:formatNumber value="${addon.price}" type="currency"/></p>
                </div>
            </c:forEach>
        </div>
    </tiles:putAttribute>
</tiles:insertDefinition>
```

#### CSS Organization
```css
/* Use BEM methodology for CSS classes */
.addon-list { }
.addon-list__item { }
.addon-list__item--featured { }

/* Responsive design patterns */
@media (max-width: 768px) {
    .addon-list {
        flex-direction: column;
    }
}
```

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

2. **Create JSP Views**:
   ```
   src/main/webapp/WEB-INF/jsp/new-feature/
   ├── list.jsp
   ├── form.jsp
   └── detail.jsp
   ```

3. **Add URL Mappings**:
   ```java
   @GetMapping
   public String list() { return "new-feature/list"; }
   ```

4. **Test Controller**:
   ```java
   @WebMvcTest(NewFeatureController.class)
   class NewFeatureControllerTest {
       // Test methods
   }
   ```

### Adding a New Service
1. **Create Service Interface**:
   ```java
   public interface NewService {
       void performOperation();
   }
   ```

2. **Implement Service**:
   ```java
   @Service
   @Transactional(readOnly = true)
   public class NewServiceImpl implements NewService {
       // Implementation
   }
   ```

3. **Add Unit Tests**:
   ```java
   @ExtendWith(MockitoExtension.class)
   class NewServiceImplTest {
       // Test methods
   }
   ```

### Database Schema Changes
1. **Create Migration Script**:
   ```sql
   -- V1.1__Add_new_table.sql
   CREATE TABLE new_table (
       id NUMBER(19) PRIMARY KEY,
       name VARCHAR2(255) NOT NULL
   );
   ```

2. **Update Entity Classes**:
   ```java
   public class NewEntity {
       private Long id;
       private String name;
       // Getters and setters
   }
   ```

3. **Test Migration**:
   ```bash
   # Apply to development database
   sqlplus addon_user/addon_password@localhost:1521/XE @V1.1__Add_new_table.sql
   ```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different port
wildfly/bin/standalone.sh -Djboss.socket.binding.port-offset=100
```

#### Database Connection Issues
```bash
# Test database connectivity
telnet localhost 1521

# Check Oracle XE status
docker logs oracle-xe

# Restart Oracle XE
docker restart oracle-xe
```

#### Memory Issues
```bash
# Increase WildFly memory
export JAVA_OPTS="-Xms1g -Xmx4g -XX:+UseG1GC"
wildfly/bin/standalone.sh
```

#### SSL Certificate Issues
```bash
# Generate new self-signed certificate
keytool -genkey -alias wildfly -keyalg RSA -keystore wildfly.keystore
```

### Debug Logging
```xml
<!-- Enable debug logging for troubleshooting -->
<logger name="com.passkey.addon" level="DEBUG"/>
<logger name="org.springframework.web.servlet.DispatcherServlet" level="DEBUG"/>
<logger name="org.springframework.security" level="DEBUG"/>
<logger name="org.springframework.jdbc" level="DEBUG"/>
```

### Performance Profiling
```bash
# Enable JVM profiling
export JAVA_OPTS="$JAVA_OPTS -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=profile.jfr"

# Analyze with JProfiler or VisualVM
jvisualvm --jdkhome $JAVA_HOME
```

## Additional Resources

## Technology Stack


- **Backend**: Java 17 with Spring Framework 5.3.39
- **Frontend**: JSP with Apache Tiles templating
- **Application Server**: WildFly 26.1.3.Final
- **Database**: Oracle Database with JDBC connectivity
- **Security**: Spring Security 5.8.16
- **Build System**: Maven with pnpm workspace management
- **Deployment**: Octopus Deploy with Jenkins CI/CD

## Quick Start


### Prerequisites

- Java 17 (managed via ASDF)
- Maven 3.6+
- pnpm 8+
- Docker
- Access to hogan-configs repository

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-addons-ng.git
   cd passkey-addons-ng
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Setup WildFly environment**:
   ```bash
   scripts/setup.sh
   ```

4. **Configure port forwarding** (macOS):
   ```bash
   sudo pfctl -evf scripts/wildfly.pfanchors
   ```

5. **Update hosts file**:
   ```bash
   echo "127.0.0.1 localhost dev-book.passkey.com" | sudo tee -a /etc/hosts
   ```

6. **Deploy the application**:
   ```bash
   scripts/deploy.sh
   ```

7. **Access the application**:
   - URL: https://dev-book.passkey.com/addon
   - Note: Accept security warnings for self-signed certificates

### Building and Testing

```bash
# Build the application
cd packages/app
pnpm run build

# Run tests
pnpm run test

# Run SonarQube analysis
pnpm run test:sonar
```

## Environments


| Environment | URL | Purpose |
|-------------|-----|---------|
| **Development** | https://dev-book.passkey.com/addon | Local development |
| **Alpha** | https://alpha-book.passkey.com/addon | Integration testing |
| **TS50** | https://ts50-book.passkey.com/addon | QA testing |
| **Staging** | https://stg-book.passkey.com/addon | Pre-production validation |

## Support


- **Team**: Maurya (Owner)
- **Slack Channel**: #passkey-api
- **Jenkins**: [CI Pipeline](https://ci-jenkins.core.cvent.org/job/Passkey_Apps/job/passkey-addons-ng/)
- **Octopus**: [Deployment Dashboard](https://octo.core.cvent.org/app#/Spaces-1/projects/addon-portal/deployments)
- **Monitoring**: [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=add-on-portal)
