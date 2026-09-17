# Passkey Event Service - Technical Details

## Overview
The Passkey Event Service is a Java-based microservice that manages event entities and their derivatives (participants, event web info, event details) within the Cvent Passkey platform for hotels.

## Tech Stack

### Core Framework
- **Java 17** (Corretto 17.0.5.8.1)
- **Dropwizard** - RESTful web service framework
- **Maven 3.9.1** - Build and dependency management

### Key Dependencies

#### Web Framework & API
- **Dropwizard Core** - Main web framework
- **Dropwizard HTTP/2** - HTTP/2 support
- **Dropwizard JSON Logging** - Structured logging
- **Dropwizard Assets** - Static asset serving
- **JAX-RS** - REST API implementation
- **Swagger/OpenAPI 3** (v2.2.28) - API documentation

#### Data Access & Persistence
- **MyBatis** - SQL mapping framework
- **Oracle JDBC 8** (v18.3.0.0) - Database connectivity
- **Apache OpenJPA** (v3.2.0) - JPA implementation
- **Cvent Pangaea** - Internal data access utilities

#### Authentication & Security
- **Cvent Auth Service** (v21.0.0) - Authentication and authorization
- **Auth Dropwizard Bundle** - Integration with Dropwizard

#### Utilities & Libraries
- **MapStruct** (v1.6.3) - Bean mapping
- **Immutables** - Immutable object generation
- **JSoup** (v1.18.3) - HTML parsing
- **Apache Velocity** (v2.3) - Template engine
- **Passkey Microservices Common** (v1.4.2) - Shared utilities

#### Testing
- **JUnit 5** (Jupiter) - Unit testing framework
- **Mockito** (v2.28.2) - Mocking framework
- **PowerMock** (v2.0.9) - Advanced mocking
- **Dropwizard Testing** - Integration testing support
- **Karate** - API testing framework

### Build Tools & Package Management
- **Maven** - Primary build tool
- **pnpm 6.32.22** - Node.js package management
- **Changesets** - Version management and changelog generation

## Architecture

### Module Structure
The project follows a multi-module Maven structure:

1. **passkey-event-parent** - Root POM with shared configuration
2. **passkey-event-api** - API definitions and contracts
3. **passkey-event-service** - Main service implementation
4. **passkey-event-data-access** - Database access layer
5. **passkey-event-shared** - Shared utilities and models
6. **passkey-event-java-client** - Java client library
7. **passkey-event-integration-test** - Integration tests

### Service Characteristics
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
- **Owner**: Cherry Pickers team
- **Lifecycle**: Production
- **Service Registry ID**: d7193c62-e081-4f5c-827f-479cded7354f

### API Dependencies
- **Consumes**: Auth Service API
- **Provides**: Passkey Event API
- **Depends On**: Passkey Book component

## Code Quality & Standards

### Static Analysis
- **Checkstyle** (v8.42) - Code style enforcement
- **SonarQube** - Code quality analysis with coverage exclusions
- **Checkmarx** - Security scanning
- **WhiteSource** - Dependency vulnerability scanning

### Coverage Configuration
- **JaCoCo** - Code coverage with specific exclusions for:
  - Configuration classes
  - Entity classes
  - Handler classes
  - Mapper classes
  - Utility classes
  - Application bootstrap classes

### Build Profiles
- **default** - Standard build with all modules
- **run-it** - Integration testing profile
- **release** - Production build with shaded JAR
- **coverage** - Code coverage analysis

## Development Environment

### Runtime Versions
- Java: Corretto 17.0.5.8.1
- Maven: 3.9.1
- Node.js: 16.14.2
- pnpm: 6.32.22

### IDE Support
- Compatible with IntelliJ IDEA, Eclipse, NetBeans
- Maven-based project structure
- OpenAPI specification generation

### Local Development
```bash
# Build
mvn package -Prelease

# Run locally
cd passkey-event-service
java -jar target/passkey-event-service-*.jar server configs/dev.yaml

# Integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Code coverage
mvn clean install -Pcoverage
```

## Monitoring & Observability

### External Integrations
- **Datadog** - Application monitoring and metrics
- **Backstage** - Service catalog and documentation
- **Jenkins** - CI/CD pipeline monitoring

### Documentation
- **TechDocs** - Backstage integration for documentation
- **OpenAPI** - Auto-generated API documentation
- **MkDocs** - Documentation site generation