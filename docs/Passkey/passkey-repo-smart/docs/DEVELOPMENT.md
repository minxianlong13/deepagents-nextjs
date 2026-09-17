# Development Guide

## Prerequisites

### Required Software
- **Java 17** - OpenJDK or Oracle JDK
- **Maven 3.6+** - Build tool for Java projects
- **Node.js 18+** - For pnpm package manager
- **pnpm** - Package manager for build orchestration
- **Docker** - For containerized services (optional)
- **Git** - Version control

### Required Repositories
The following repositories must be cloned as sibling directories:

- **passkey-smart** - This repository
- **passkey-core** - Core Passkey functionality (required for build)
- **passkey-legacy** - Legacy Passkey components (required for core)
- **hogan-configs** - Configuration templates (required for configure.sh)

### Directory Structure
```
parent-directory/
├── passkey-smart/          # This repository
├── passkey-core/           # Core components
├── passkey-legacy/         # Legacy components
└── hogan-configs/          # Configuration templates
```

### IDE Setup
- **IntelliJ IDEA** (recommended) or **Eclipse**
- **Java 17 SDK** configured
- **Maven integration** enabled
- **Git integration** configured

## Local Setup

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-smart.git
   cd passkey-smart
   ```

2. **Install Node.js dependencies**:
   ```bash
   pnpm install
   ```

3. **Run initial setup script**:
   ```bash
   scripts/setup.sh
   ```
   This script will:
   - Download and configure WildFly server
   - Set up development environment configuration
   - Configure management user (admin/admin)
   - Install required modules

4. **Configure the application**:
   ```bash
   scripts/configure.sh dev
   ```

### IntelliJ IDEA Configuration

#### Application Server Setup

1. **Open Run/Debug Configurations**:
   - Click "Current File" dropdown → "Edit Configuration"
   - Click "Add new" → "JBoss/WildFly Server" → "Local"

2. **Configure Application Server**:
   - Click "Configure..." next to Application Server dropdown
   - Set JBoss/WildFly Home to `./wildfly/` in your project directory
   - Click "OK"

3. **Server Configuration**:
   - **JRE**: Select Java 17
   - **Port Offset**: 25
   - **VM Options**: Add any required JVM arguments

4. **Startup/Connection Configuration**:
   - **Run Configuration**: Uncheck "use default" for Startup Script
   - Add: `-c passkey-standalone-full-dev.xml`
   - **Debug Configuration**: Same as run configuration

5. **Log Files (Optional)**:
   - Add `server.log` from `wildfly/standalone/log/`
   - Add `smart.log` from `wildfly/standalone/log/`

### Port Forwarding (macOS)

For standard HTTP/HTTPS ports, configure port forwarding:

1. **Create port forwarding rules**:
   ```bash
   # Create pfanchors file
   cat > scripts/wildfly.pfanchors << EOF
   rdr pass inet proto tcp from any to any port 80 -> 127.0.0.1 port 8080
   rdr pass on lo0 inet proto tcp from any to any port 80 -> 127.0.0.1 port 8080
   rdr pass inet proto tcp from any to any port 443 -> 127.0.0.1 port 8443
   rdr pass on lo0 inet proto tcp from any to any port 443 -> 127.0.0.1 port 8443
   EOF
   ```

2. **Apply port forwarding**:
   ```bash
   sudo pfctl -evf scripts/wildfly.pfanchors
   ```
   **Note**: Must be reapplied after system restart

## Running the Application

### Build and Deploy

1. **Build the application**:
   ```bash
   pnpm run build
   ```

2. **Deploy to local WildFly**:
   ```bash
   scripts/deploy.sh
   ```

3. **Access the application**:
   - **Management Console**: http://localhost:9990 (admin/admin)
   - **Application**: http://localhost:8080

### Deploy Script Options

```bash
# Skip building, just deploy existing artifact
scripts/deploy.sh --skip-build

# Skip tests during build (faster, but use carefully)
scripts/deploy.sh --skip-tests

# Show usage information
scripts/deploy.sh --usage
```

## Running Tests

### Test Commands

```bash
# Run all tests
pnpm test

# Run Java tests only
pnpm run test:java

# Run tests with coverage
pnpm run test:jacoco

# Run Sonar analysis
pnpm run test:sonar
```

### Test Categories

#### Unit Tests
- Located in `packages/app/*/src/test/java/`
- Use JUnit 5 and Mockito
- Focus on individual component testing

#### Integration Tests
- Test service integration points
- Database connectivity tests
- External service integration tests

#### Coverage Requirements
- Line coverage: Configurable (currently 0% minimum)
- Branch coverage: Configurable (currently 0% minimum)
- Instruction coverage: Configurable (currently 0% minimum)

## Code Structure

### Package Organization

```
com.lanyon.group.smart/
├── service/           # Business logic services
├── model/            # Domain models and entities
├── dao/              # Data access objects
├── util/             # Utility classes
├── config/           # Configuration classes
└── integration/      # External service integration
```

### Module Structure

#### Core Module (`packages/app/core/`)
- Shared domain models
- Common utilities
- Configuration classes
- Integration interfaces

#### EJB Module (`packages/app/ejb/`)
- Session beans
- Message-driven beans
- Business logic services
- JMX management beans

#### EAR Module (`packages/app/ear/`)
- Application packaging
- Deployment descriptors
- Module assembly

## Coding Standards

### Java Code Style

#### Naming Conventions
- **Classes**: PascalCase (e.g., `EmailCampaignService`)
- **Methods**: camelCase (e.g., `executeCampaign`)
- **Variables**: camelCase (e.g., `smartEmailSetupId`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)

#### Code Organization
- One public class per file
- Organize imports (remove unused)
- Use meaningful variable and method names
- Add JavaDoc for public APIs

#### Error Handling
```java
// Use specific exceptions
throw new CampaignExecutionException("Campaign not found: " + campaignId);

// Log errors appropriately
log.error("Failed to execute campaign {}: {}", campaignId, e.getMessage(), e);
```

### Testing Standards

#### Unit Test Structure
```java
@ExtendWith(MockitoExtension.class)
class EmailCampaignServiceTest {
    
    @Mock
    private EmailTemplateDao templateDao;
    
    @InjectMocks
    private EmailCampaignService service;
    
    @Test
    void shouldExecuteCampaignSuccessfully() {
        // Given
        String campaignId = "test-campaign";
        
        // When
        CampaignResult result = service.executeCampaign(campaignId);
        
        // Then
        assertThat(result.isSuccess()).isTrue();
    }
}
```

## Common Tasks

### Adding a New Email Campaign Type

1. **Create domain model**:
   ```java
   // In core module
   public class NewCampaignType {
       private String id;
       private String name;
       // getters and setters
   }
   ```

2. **Add service method**:
   ```java
   // In EJB module
   @Stateless
   public class CampaignService {
       public void executeNewCampaignType(String setupId) {
           // Implementation
       }
   }
   ```

3. **Add JMX management**:
   ```java
   @MXBean
   public interface NewCampaignMBean {
       void executeNewCampaign(String setupId);
   }
   ```

4. **Write tests**:
   ```java
   @Test
   void shouldExecuteNewCampaignType() {
       // Test implementation
   }
   ```

### Adding a New Configuration Property

1. **Add to template**:
   ```xml
   <!-- In configs/passkey-standalone-full-dev.xml.template -->
   <property name="new.property" value="#{NEW.PROPERTY.VALUE}"/>
   ```

2. **Add to properties**:
   ```properties
   # In scripts/secrets/dev.properties
   NEW.PROPERTY.VALUE=development_value
   ```

3. **Use in code**:
   ```java
   @Resource(lookup = "java:global/new.property")
   private String newPropertyValue;
   ```

### Debugging Common Issues

#### WildFly Won't Start
- Check port conflicts (8080, 9990)
- Verify Java 17 is being used
- Check standalone configuration file syntax
- Review server.log for errors

#### Deployment Failures
- Verify passkey-core is built and installed
- Check Maven dependencies
- Ensure all required modules are present
- Review deployment logs

#### Database Connection Issues
- Verify Oracle JDBC driver is installed
- Check datasource configuration
- Confirm database credentials
- Test database connectivity

#### Email Configuration Problems
- Verify email service configuration
- Check network connectivity to email service
- Validate email template syntax
- Review email configuration logs

## Development Workflow

### Feature Development

1. **Create feature branch**:
   ```bash
   git checkout -b feature/new-campaign-type
   ```

2. **Implement changes**:
   - Write failing tests first (TDD)
   - Implement feature
   - Ensure tests pass

3. **Test locally**:
   ```bash
   pnpm test
   scripts/deploy.sh
   # Manual testing
   ```

4. **Code review**:
   - Create pull request
   - Address review feedback
   - Ensure CI passes

5. **Merge and deploy**:
   - Merge to development branch
   - Automatic deployment to alpha environment

### Hotfix Process

1. **Create hotfix branch from master**:
   ```bash
   git checkout master
   git checkout -b hotfix/critical-fix
   ```

2. **Implement minimal fix**:
   - Focus on specific issue
   - Minimize scope of changes

3. **Test thoroughly**:
   - Unit tests
   - Integration tests
   - Manual verification

4. **Deploy to production**:
   - Merge to master
   - Tag release
   - Deploy via Octopus

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Maven 3.6+
- WildFly application server
- Docker (optional)
- Access to passkey-core and passkey-legacy repositories

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-smart.git
   cd passkey-smart
   ```

2. **Initial setup**:
   ```bash
   scripts/setup.sh
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Build the application**:
   ```bash
   pnpm run build
   ```

5. **Deploy to local WildFly**:
   ```bash
   scripts/deploy.sh
   ```

6. **Access the application**:
   - Management Console: http://localhost:9990 (admin/admin)
   - Application: http://localhost:8080

### Running Tests

```bash
# Run all tests
pnpm test

# Run Java tests only
pnpm run test:java

# Run with coverage
pnpm run test:jacoco
```

## Support


- **Team**: Cherry Pickers
- **Slack**: #passkey-api
- **Jenkins**: [CI Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PAS)/job/passkey-smart)
- **Monitoring**: [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-smart)
