# Passkey Event Service - Architecture Documentation

## Overview
The Passkey Event Service is a Java-based microservice built using the Dropwizard framework that provides passkey event-specific data and functionality. It follows a multi-module Maven project structure with clear separation of concerns.

## Project Structure

### Root Directory Analysis
```
passkey-event/
├── .changeset/                    # Changeset configuration for versioning
├── .gitignore                     # Git ignore rules
├── .npmrc                         # NPM configuration
├── .tool-versions                 # Tool version specifications
├── .whitesource                   # WhiteSource security scanning config
├── CHANGELOG.md                   # Project changelog
├── CODEOWNERS                     # Code ownership definitions
├── Dockerfile                     # Production Docker configuration
├── Dockerfile_dev                 # Development Docker configuration
├── Jenkinsfile                    # Jenkins CI/CD pipeline
├── README.md                      # Project documentation
├── build-*.sh                     # Build scripts
├── catalog-info.yaml              # Backstage service catalog info
├── docs/                          # Documentation directory
├── dropkick*.sh                   # Deployment scripts
├── jenkins.sh                     # Jenkins helper script
├── mkdocs.yaml                    # MkDocs configuration
├── package.json                   # Node.js package configuration
├── pnpm-lock.yaml                 # PNPM lock file
├── pom.xml                        # Root Maven POM
├── pull_request.md                # PR template
├── swagger.sh                     # Swagger UI script
└── [modules]/                     # Maven modules (detailed below)
```

## Maven Multi-Module Structure

### Project Type: Multi-Module Maven Project ✅
- **Parent POM**: `passkey-event-parent`
- **Group ID**: `com.cvent.passkey`
- **Version**: `1.13.36-SNAPSHOT`
- **Java Version**: 17
- **Framework**: Dropwizard (extends CventApplication)

### Module Breakdown

#### 1. **passkey-event-service** (Main Application)
- **Purpose**: Core service implementation and main entry point
- **Type**: Executable JAR
- **Main Class**: `com.cvent.passkeyevent.PasskeyEventServiceApplication`
- **Framework**: Dropwizard with Cvent extensions
- **Key Dependencies**: 
  - Dropwizard Core
  - MyBatis for data access
  - Auth service integration
  - Jersey for REST endpoints

#### 2. **passkey-event-api**
- **Purpose**: API specifications and contracts
- **Contents**: OpenAPI/Swagger specifications
- **Files**: `openapi.json`, `openapi.yaml`
- **Type**: API documentation module

#### 3. **passkey-event-data-access**
- **Purpose**: Data access layer implementation
- **Type**: Library module
- **Responsibilities**: Database interactions, MyBatis mappers, entities

#### 4. **passkey-event-shared**
- **Purpose**: Shared utilities and common code
- **Type**: Library module
- **Responsibilities**: Common models, utilities, constants

#### 5. **passkey-event-java-client**
- **Purpose**: Java client library for consuming the service
- **Type**: Client library
- **Responsibilities**: Service client implementation, DTOs

#### 6. **passkey-event-integration-test**
- **Purpose**: Integration testing suite
- **Type**: Test module
- **Framework**: Karate for API testing
- **Configuration**: `test_configs/` directory

## Application Entry Point

### Main Application Class
```java
com.cvent.passkeyevent.PasskeyEventServiceApplication
```

**Key Characteristics:**
- Extends `CventApplication<PasskeyEventServiceConfiguration>`
- Application Name: `passkey-event-service`
- Uses Dropwizard framework with Cvent-specific extensions
- Implements authentication via `AuthDropwizardBundle`
- Configures MyBatis for database operations
- Registers multiple REST resources and exception mappers

### Startup Command
```bash
java -jar target/passkey-event-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml
```

## Package Organization

### Core Package Structure
```
com.cvent.passkeyevent/
├── PasskeyEventServiceApplication.java    # Main application class
├── PasskeyEventServiceConfiguration.java  # Configuration class
├── config/                                # Configuration classes
├── exception/                             # Custom exceptions
├── exceptionmapper/                       # JAX-RS exception mappers
├── health/                                # Health check implementations
├── resources/                             # REST endpoint resources
├── services/                              # Business logic services
├── util/                                  # Utility classes
└── validations/                           # Validation logic
```

### Data Access Package Structure
```
com.cvent.passkeyevent.dataaccess/
├── [Entity]DataAccess.java               # Data access objects
├── mapper/                               # MyBatis mappers
└── v2/                                   # Version 2 implementations
```

## Technology Stack

### Core Technologies
- **Language**: Java 17
- **Framework**: Dropwizard
- **Database**: Oracle (via MyBatis)
- **Authentication**: Cvent Auth Service
- **API Documentation**: OpenAPI/Swagger
- **Testing**: JUnit, Karate (integration tests)
- **Build Tool**: Maven
- **Containerization**: Docker

### Additional Tools
- **Version Management**: Changesets
- **Package Manager**: PNPM (for Node.js dependencies)
- **CI/CD**: Jenkins
- **Documentation**: MkDocs
- **Security Scanning**: WhiteSource

## Build Profiles

### Default Profile
```xml
<modules>
    <module>passkey-event-shared</module>
    <module>passkey-event-api</module>
    <module>passkey-event-data-access</module>
    <module>passkey-event-java-client</module>
    <module>passkey-event-service</module>
    <module>passkey-event-integration-test</module>
</modules>
```

### Integration Test Profile (`run-it`)
```xml
<modules>
    <module>passkey-event-integration-test</module>
    <module>passkey-event-api</module>
    <module>passkey-event-shared</module>
    <module>passkey-event-java-client</module>
</modules>
```

## Deployment Configuration

### Target Module
- **Deployable Module**: `passkey-event-service`
- **Integration Test Module**: `passkey-event-integration-test`

### Environment Support
- Development environments: `dev`, `alpha`
- Production environments: Configured via multi-environment setup
- Docker support for both development and production

## Key Features

### Service Capabilities
- Event data management
- Block management
- Admin operations
- Credit card processing
- Message handling
- Image management
- Guarantee rules processing
- Queue management
- Permission handling

### API Versioning
- Supports both v1 and v2 API endpoints
- Version-specific resource classes and services

### Security & Monitoring
- Integrated authentication and authorization
- Health checks
- Logging context with request tracing
- Observability tagging

## Development Workflow

### Local Development
```bash
# Build
mvn package -Prelease

# Run locally
cd passkey-event-service
java -jar target/passkey-event-service-1.0.0-SNAPSHOT.jar server configs/dev.yaml

# Integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify
```

### Code Quality
- Checkstyle enforcement
- JaCoCo code coverage
- SonarQube integration
- Automated testing pipeline

This architecture demonstrates a well-structured, enterprise-grade microservice following modern Java development practices with clear separation of concerns and comprehensive testing strategies.