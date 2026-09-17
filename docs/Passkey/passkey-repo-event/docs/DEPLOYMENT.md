# Passkey Event Service - Deployment Guide

## Container Configuration

### Docker Setup
The service uses a multi-stage Docker build process:

#### Base Images
- **Build Stage**: `docker.cvent.net/maven` - Maven build environment
- **Runtime Stage**: `openjdk:8-jre-alpine` - Lightweight Java runtime

#### Build Process
```dockerfile
# Multi-stage build
FROM docker.cvent.net/maven as builder
ENV PACKAGE "passkey-event"
WORKDIR /usr/src/app

# Dependency resolution
COPY pom.xml .
COPY "${PACKAGE}-api/pom.xml" "${PACKAGE}-api/"
COPY "${PACKAGE}-integration-test/pom.xml" "${PACKAGE}-integration-test/"
COPY "${PACKAGE}-java-client/pom.xml" "${PACKAGE}-java-client/"
COPY "${PACKAGE}-service/pom.xml" "${PACKAGE}-service/"

# Build application
RUN mvn clean package --projects ":${PACKAGE}-service" --also-make --activate-profiles release

# Runtime stage
FROM openjdk:8-jre-alpine
ENV SERVICE "passkey-event-service"
WORKDIR /usr/src
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./service.jar
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" .
```

#### Runtime Configuration
- **Entry Point**: `java -jar service.jar server configs/dev.yaml`
- **Logging**: `configs/dev.logback.xml`
- **Port**: Standard Dropwizard ports (8080 for application, 8081 for admin)

### Development Container
A separate `Dockerfile_dev` exists for development purposes with simplified configuration.

## CI/CD Pipeline

### Jenkins Pipeline
The service uses a Dropwizard-specific Jenkins pipeline with the following configuration:

#### Branch Strategy
- **Development Branch**: Deploys to `alpha` environment
- **Master Branch**: Deploys to `ts50`, `sg50`, `it50` environments

#### Pipeline Features
- **Changesets**: Enabled for version management
- **Security Scanning**: Checkmarx integration on master/development branches
- **Slack Notifications**: 
  - Channel: `passkey-api` for build events
  - Events: START, SUCCESS, FAILURE
- **Sonar Integration**: Code quality analysis on snapshots

#### Scheduled Testing
- **Weekly Tests**: Tuesday 2 AM on ts50 environment
- **Daily PVT Tests**: Monday-Friday 3 AM on pr50 environment
- **Results**: Posted to `passkey-ci-results` and `passkey-api-pvt-results` channels

### Build Scripts
Multiple build scripts are available:

#### Core Build Scripts
- `build.sh` - Basic build script
- `build-it.sh` - Integration test build
- `build-release.sh` - Release build
- `jenkins.sh` - Jenkins-specific build

#### Deployment Scripts
- `dropkick.sh` - Standard deployment
- `dropkick_docker.sh` - Docker-based deployment

## Environment Configuration

### Supported Environments
- **dev** - Development environment
- **alpha** - Alpha testing environment
- **ts50** - Test environment
- **sg50** - Staging environment
- **it50** - Integration environment
- **pr50** - Production environment

### Configuration Management
- **Hogan Templates**: Configuration templates stored in `passkey-event-service/configs`
- **Environment-specific**: Separate YAML configurations per environment
- **Logging**: Environment-specific Logback configurations

## Database Configuration

### Database Technology
- **Primary Database**: Oracle Database
- **JDBC Driver**: Oracle JDBC 8 (ojdbc8)
- **Version**: 18.3.0.0
- **ORM**: MyBatis for SQL mapping
- **JPA**: Apache OpenJPA 3.2.0

### Data Access Pattern
- **Repository Pattern**: Implemented via MyBatis mappers
- **Connection Pooling**: Managed by Dropwizard
- **Transaction Management**: JPA-based transactions

## Monitoring & Health Checks

### Application Monitoring
- **Datadog Integration**: 
  - Service: `passkey-event-service`
  - Environment-specific dashboards
  - URL: `https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-event-service`

### Health Endpoints
Dropwizard provides standard health check endpoints:
- **Application**: `http://localhost:8080/health`
- **Admin**: `http://localhost:8081/healthcheck`
- **Metrics**: `http://localhost:8081/metrics`

### Logging
- **Format**: JSON logging via Dropwizard
- **Configuration**: Environment-specific Logback XML
- **Centralized**: Likely integrated with Cvent's logging infrastructure

## Service Discovery & Registration

### Backstage Integration
- **Service Catalog**: Registered in Backstage service catalog
- **Component Type**: Application
- **System**: passkey-for-hotels
- **Documentation**: Auto-generated TechDocs

### API Documentation
- **OpenAPI Specification**: Auto-generated from annotations
- **Swagger UI**: Available via `swagger.sh` script on port 8888
- **Developer Portal**: Integrated with Cvent's developer portal

## Security Configuration

### Authentication
- **Auth Service Integration**: Cvent's internal auth service (v21.0.0)
- **Dropwizard Bundle**: Auth integration via dropwizard bundle
- **Security Scanning**: Checkmarx integration in CI/CD

### Network Security
- **Internal Network**: Runs within Cvent's internal infrastructure
- **Service-to-Service**: Authenticated via auth service
- **Database**: Secure Oracle connections

## Deployment Commands

### Local Development
```bash
# Build and run locally
mvn package -Prelease
cd passkey-event-service
java -jar target/passkey-event-service-*.jar server configs/dev.yaml
```

### Docker Deployment
```bash
# Build Docker image
docker build -t passkey-event-service .

# Run container
docker run -p 8080:8080 -p 8081:8081 passkey-event-service
```

### Integration Testing
```bash
# Run all integration tests
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify

# Run specific test tags
mvn -Prun-it -Dkarate.tags="@test-label" -Denv.IT_ENVIRONMENT=dev verify
```

## Troubleshooting

### Common Issues
1. **Database Connectivity**: Verify Oracle JDBC configuration
2. **Auth Service**: Check auth service availability and configuration
3. **Port Conflicts**: Ensure ports 8080/8081 are available
4. **Memory**: JVM heap size may need adjustment for production

### Debug Configuration
- **JVM Options**: Add debug flags for troubleshooting
- **Log Levels**: Adjust via Logback configuration
- **Health Checks**: Monitor via admin endpoints

### Support Channels
- **Team**: Cherry Pickers
- **Slack**: `passkey-api` channel
- **Jenkins**: CI/CD pipeline monitoring
- **Datadog**: Application performance monitoring