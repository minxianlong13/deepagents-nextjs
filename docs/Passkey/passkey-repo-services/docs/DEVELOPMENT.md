# Development Guide

## Prerequisites

### Required Software
- **Node.js**: Version 18+ (for pnpm and build orchestration)
- **pnpm**: Latest version (package manager)
- **Java**: JDK 11 (for Java service compilation)
- **Maven**: Version 3.6+ (for Java builds)
- **Git**: Version 2.20+ (for version control)
- **Docker**: Optional, for containerized development

### Development Tools
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code with Java extensions
- **Database Client**: pgAdmin, DBeaver, or similar for database access
- **API Testing**: Postman, curl, or similar for API testing
- **Log Viewer**: Any text editor or log analysis tool

### System Requirements
- **Operating System**: macOS, Linux, or Windows with WSL2
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Disk Space**: At least 5GB free space for dependencies and builds
- **Network**: Access to internal Cvent networks for database and API connections

## Local Setup

### 1. Repository Clone
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-services.git
cd passkey-services

# Verify repository structure
ls -la
# Should show: packages/, .changeset/, docs/, etc.
```

### 2. Environment Setup
```bash
# Install Node.js dependencies
pnpm install

# Verify pnpm workspace configuration
pnpm list --depth=0

# Set up environment variables
cp .env.example .env.local  # If available
# Edit .env.local with your local configuration
```

### 3. Java Environment Configuration
```bash
# Verify Java version
java -version
# Should show Java 11

# Verify Maven installation
mvn -version
# Should show Maven 3.6+

# Set JAVA_HOME if not already set
export JAVA_HOME=/path/to/java11
export PATH=$JAVA_HOME/bin:$PATH
```

### 4. Database Setup (Development)
```bash
# Set up local database (example for PostgreSQL)
createdb passkey_dev

# Configure database connection in service configs
# Edit packages/app/{ServiceName}/configs/dev.properties
```

### 5. Build Verification
```bash
# Build all services
pnpm build

# Verify build artifacts
ls packages/app/*/target/
# Should show JAR files for each service
```

## Running Tests

### Unit Tests
```bash
# Run all tests
pnpm test

# Run tests for specific service
mvn -f packages/app/GMLService/pom.xml test

# Run tests with coverage
mvn -f packages/app/GMLService/pom.xml test jacoco:report
```

### Integration Tests
```bash
# Run integration tests (if available)
mvn -f packages/app/GMLService/pom.xml integration-test

# Run with specific profile
mvn -f packages/app/GMLService/pom.xml test -Pintegration
```

### SonarQube Analysis
```bash
# Run SonarQube analysis locally
pnpm test:sonar

# Run for specific service
mvn -f packages/app/GMLService/pom.xml sonar:sonar \
  -Dsonar.host.url=https://sonar.core.cvent.org \
  -Dsonar.login=${SONAR_TOKEN}
```

## Code Structure

### Repository Organization
```
passkey-services/
├── .changeset/                     # Version management
├── docs/                          # Documentation
├── packages/
│   └── app/                       # Main application package
│       ├── package.json           # Build orchestration
│       ├── services_crontab       # Cron configuration
│       ├── GMLService/            # Individual services
│       │   ├── src/
│       │   │   └── main/
│       │   │       ├── java/      # Java source code
│       │   │       └── resources/ # Configuration files
│       │   ├── configs/           # Environment configs
│       │   ├── pom.xml           # Maven configuration
│       │   └── README.MD         # Service documentation
│       ├── ExchangeRates/
│       ├── GLResCRTSService/
│       ├── Nor1Processor/
│       ├── billing-report/
│       ├── roche-report/
│       └── exchange-rates/
├── pipeline/                      # Deployment scripts
├── package.json                   # Root package configuration
├── pnpm-workspace.yaml           # Workspace configuration
└── Jenkinsfile                   # CI/CD pipeline
```

### Java Service Structure
```
{ServiceName}/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/cvent/passkey/{service}/
│   │   │       ├── Application.java      # Main application class
│   │   │       ├── config/              # Configuration classes
│   │   │       ├── service/             # Business logic
│   │   │       ├── model/               # Data models
│   │   │       └── util/                # Utility classes
│   │   └── resources/
│   │       ├── application.properties   # Default configuration
│   │       └── logback.xml             # Logging configuration
│   └── test/
│       └── java/                       # Unit tests
├── configs/                           # Environment-specific configs
│   ├── dev.properties
│   ├── alpha.properties
│   └── prod.properties
├── cronScript/                        # Cron execution scripts
├── pom.xml                           # Maven configuration
└── README.MD                         # Service documentation
```

## Coding Standards

### Java Coding Standards
- **Code Style**: Follow Google Java Style Guide
- **Naming Conventions**: 
  - Classes: PascalCase (e.g., `GuestManagementService`)
  - Methods: camelCase (e.g., `processGuestData`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Documentation**: JavaDoc for public methods and classes
- **Error Handling**: Use specific exceptions, avoid generic Exception catching

### Example Java Code Structure
```java
package com.cvent.passkey.gml;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Main application class for Guest Management Layer service.
 * Processes guest data and maintains guest information synchronization.
 */
public class GMLServiceApplication {
    private static final Logger logger = LoggerFactory.getLogger(GMLServiceApplication.class);
    private static final int MAX_RETRY_ATTEMPTS = 3;
    
    public static void main(String[] args) {
        try {
            GMLServiceApplication app = new GMLServiceApplication();
            app.run();
        } catch (Exception e) {
            logger.error("Application failed to start", e);
            System.exit(1);
        }
    }
    
    /**
     * Main application execution method.
     * Processes guest data and updates guest information.
     */
    public void run() {
        logger.info("Starting GML Service processing");
        // Implementation here
        logger.info("GML Service processing completed");
    }
}
```

### TypeScript/JavaScript Standards
- **Code Style**: Prettier with standard configuration
- **Naming Conventions**: camelCase for variables and functions
- **Documentation**: JSDoc for functions and modules
- **Error Handling**: Use proper error types and handling

### Configuration Standards
```properties
# Use descriptive property names
service.database.connection.timeout=30000
service.external.api.retry.attempts=3

# Group related properties
# Database configuration
db.host=localhost
db.port=5432
db.name=passkey_dev

# External API configuration
api.nor1.endpoint=https://api.nor1.com
api.nor1.timeout=30000
```

## Common Development Tasks

### Adding a New Service

#### 1. Create Service Directory
```bash
mkdir packages/app/new-service
cd packages/app/new-service
```

#### 2. Create Maven Configuration
```xml
<!-- pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>new-service</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <maven.compiler.release>11</maven.compiler.release>
    </properties>
    
    <!-- Dependencies and build configuration -->
</project>
```

#### 3. Create Java Application
```java
// src/main/java/com/cvent/passkey/newservice/NewServiceApplication.java
package com.cvent.passkey.newservice;

public class NewServiceApplication {
    public static void main(String[] args) {
        // Service implementation
    }
}
```

#### 4. Add Build Script
```json
// Update packages/app/package.json
{
  "scripts": {
    "build:new-service": "mvn -f new-service/pom.xml -B clean package -Dmaven.compiler.release=11"
  }
}
```

#### 5. Create Service Catalog Entry
```yaml
# new-service/catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: new-service
  title: New Service
  description: Description of the new service
spec:
  type: service
  lifecycle: production
  owner: passkey-team
```

### Adding an Endpoint to Existing Service

#### 1. Create Resource Class (if REST endpoint)
```java
// src/main/java/com/cvent/passkey/service/resource/NewResource.java
@Path("/api/v1/new-endpoint")
public class NewResource {
    
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getNewData() {
        // Implementation
        return Response.ok().build();
    }
}
```

#### 2. Update Configuration
```properties
# Add any new configuration properties
new.endpoint.timeout=30000
new.endpoint.retry.attempts=3
```

#### 3. Add Tests
```java
// src/test/java/com/cvent/passkey/service/resource/NewResourceTest.java
public class NewResourceTest {
    
    @Test
    public void testGetNewData() {
        // Test implementation
    }
}
```

### Modifying Service Configuration

#### 1. Update Configuration Files
```bash
# Edit environment-specific configuration
vim packages/app/GMLService/configs/dev.properties
vim packages/app/GMLService/configs/alpha.properties
vim packages/app/GMLService/configs/prod.properties
```

#### 2. Update Application Code
```java
// Update configuration loading in application
@Value("${new.property:defaultValue}")
private String newProperty;
```

#### 3. Test Configuration Changes
```bash
# Build and test locally
mvn -f packages/app/GMLService/pom.xml clean package
./packages/app/GMLService/run_dev.sh
```

### Debugging Services

#### Local Debugging
```bash
# Run service with debug options
export JAVA_OPTS="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
./packages/app/GMLService/run_dev.sh

# Connect debugger to port 5005
```

#### Log Analysis
```bash
# View service logs
tail -f /tmp/passkey-services/logs/GMLService.log

# Search for specific errors
grep -i "error" /tmp/passkey-services/logs/GMLService.log

# Analyze log patterns
awk '/ERROR/ {print $1, $2, $NF}' /tmp/passkey-services/logs/GMLService.log
```

#### Database Debugging
```sql
-- Check service database connections
SELECT * FROM pg_stat_activity WHERE application_name LIKE '%GMLService%';

-- Monitor service queries
SELECT query, state, query_start FROM pg_stat_activity 
WHERE application_name = 'GMLService';
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test locally
pnpm build
pnpm test

# Commit changes
git add .
git commit -m "feat: add new feature"
```

### 2. Code Review Process
```bash
# Push branch and create PR
git push origin feature/new-feature

# Create pull request in GitHub
# Request review from team members
```

### 3. Version Management
```bash
# Create changeset for version bump
pnpm changeset

# Follow prompts to describe changes
# Commit changeset file
git add .changeset/
git commit -m "chore: add changeset for new feature"
```

### 4. Testing and Validation
```bash
# Run full test suite
pnpm test

# Run SonarQube analysis
pnpm test:sonar

# Verify build passes
pnpm build
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Maven cache
mvn clean

# Rebuild with verbose output
mvn -X clean package

# Check Java version
java -version
```

#### Service Startup Issues
```bash
# Check log files for errors
tail -f packages/app/GMLService/logs/application.log

# Verify configuration
cat packages/app/GMLService/configs/dev.properties

# Check database connectivity
telnet db-host 5432
```

#### Dependency Issues
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for dependency conflicts
pnpm list --depth=0
```

### Getting Help
- **Documentation**: Check service-specific README.MD files
- **Team Chat**: Reach out to Passkey Platform Team
- **Issue Tracking**: Create GitHub issues for bugs or feature requests
- **Code Review**: Request help during code review process

## Additional Resources

## Services Included


1. **GMLService** - Guest Management Layer service (runs every minute)
2. **ExchangeRates** - Currency exchange rate updates (monthly on 1st at 9 AM)
3. **GLResCRTSService** - GL Reservation CRTS processing
4. **Nor1Processor** - Nor1 integration processor (daily at 6 AM)
5. **billing-report** - Web billing report generation (monthly on 2nd at 6 AM)
6. **roche-report** - Roche report service (daily at 8:50 PM)
7. **exchange-rates** - Alternative exchange rate service

## Quick Start


### Prerequisites
- Node.js 18+
- pnpm package manager
- Java 11+
- Maven 3.6+

### Installation
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-services.git
cd passkey-services

# Install dependencies
pnpm install

# Build all services
pnpm build
```

### Running Services Locally
```bash
# Build individual service
pnpm build:GMLService

# Run development version
cd packages/app/GMLService
./run_dev.sh
```

## Support


- **Repository**: [cvent-internal/passkey-services](https://github.com/cvent-internal/passkey-services)
- **Issues**: 41 open issues
- **Team**: Passkey Platform Team
- **CODEOWNERS**: Defined in repository root
