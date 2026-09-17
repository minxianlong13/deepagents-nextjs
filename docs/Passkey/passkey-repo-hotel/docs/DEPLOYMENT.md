# Passkey Hotel Service - Deployment Guide

## Containerization

### Dockerfile Analysis
The service uses a multi-stage Docker build:

#### Build Stage
- **Base Image**: `docker.cvent.net/maven`
- **Build Process**:
  1. Copy POM files for dependency resolution
  2. Run Maven dependency download (fail-never for caching)
  3. Copy source code
  4. Build with `release` profile
  5. Skip source and javadoc generation for faster builds

#### Runtime Stage
- **Base Image**: `openjdk:8-jre-alpine`
- **Artifacts**:
  - Service JAR: `passkey-hotel-service-*.jar`
  - Configuration files: `passkey-hotel-service-*-configs`
- **Default Command**: 
  ```bash
  java -jar -Dlogback.configurationFile=configs/dev.logback.xml service.jar server configs/dev.yaml
  ```

## CI/CD Pipeline

### Jenkins Pipeline
The service uses Cvent's `dropwizardPipeline` with the following configuration:

#### Branch Strategy
- **Development Branch**: `development`
- **Release Branch**: `master`
- **Feature Branches**: `.*` (all branches)

#### Build Stages

##### Continuous Integration
- **Development**: CI environment with SonarQube analysis
- **All Branches**: CI environment builds

##### Deployment Environments
- **Development Branch**: 
  - Alpha environment deployment
- **Master Branch**: 
  - TS50 (Test)
  - IT50 (Integration Test)  
  - SG50 (Staging)

#### Quality Gates
- **Changesets**: Enabled for version management
- **SonarQube**: Code quality analysis on snapshots and development builds
- **Checkmarx**: Security scanning on master and development branches
  - Team ID: `56fff0f3-468b-4984-8211-65e516926eaa`
  - Preset: `100011`
  - Sync Mode: Enabled

#### Notifications
- **Slack Integration**:
  - Channel: `#passkey-api`
  - Events: START, SUCCESS, FAILURE
  - Branches: development, master

#### Scheduled Testing
- **TS50 Environment**:
  - Schedule: Weekly on Tuesday at 1:00 AM
  - Tags: `~@ignore` (exclude ignored tests)
  - Notifications: `#passkey-ci-results`
- **PR50 Environment**:
  - Schedule: Weekly on Friday at 3:00 AM  
  - Tags: `@canary` (canary tests only)
  - Notifications: `#passkey-api-pvt-results`

## Build Scripts

### Core Build Scripts
- **`build.sh`**: Basic build script
- **`build-it.sh`**: Integration test build
- **`build-release.sh`**: Release build
- **`build-newman.sh`**: Newman/Postman test execution

### Deployment Scripts
- **`dropkick.sh`**: Standard deployment
- **`dropkick_docker.sh`**: Docker-based deployment
- **`jenkins.sh`**: Jenkins-specific build operations

### Utility Scripts
- **`swagger.sh`**: OpenAPI/Swagger documentation generation

## Maven Profiles

### Default Profile
- **Modules**: All modules except integration tests
- **Integration Tests**: Skipped (`skipIntegrationTests=true`)

### Release Profile (`release`)
- **Shaded JAR**: Creates fat JAR with all dependencies
- **Assembly**: Packages configuration files
- **Transformers**: 
  - Service resource transformation
  - Manifest with main class and build number
  - Spring handlers/schemas merging

### Coverage Profile (`coverage`)
- **JaCoCo**: Code coverage analysis and reporting
- **Modules**: Service module only
- **Exclusions**: Application and configuration classes

### Integration Test Profile (`run-it`)
- **Checkstyle**: Disabled for faster execution
- **Integration Tests**: Enabled
- **Additional Modules**: Integration test, API, and Java client

## Configuration Management

### Environment-Specific Configs
- **Development**: `configs/dev.yaml`, `configs/dev.logback.xml`
- **Template Directory**: `passkey-hotel-service/configs`
- **Hogan Templates**: Integrated for configuration templating

### Configuration Assembly
- **Assembly Descriptor**: `src/main/assemblies/configs.xml`
- **Output**: Separate configuration archive
- **Deployment**: Extracted alongside service JAR

## Service Registry Integration

### Backstage Integration
- **Component Type**: Service
- **Lifecycle**: Production
- **TechDocs**: Auto-generated from repository
- **External Relationships**: Datadog monitoring

### Links & Documentation
- **Datadog Dashboard**: Environment-specific service monitoring
- **Jenkins**: CI/CD pipeline access
- **Wiki**: Confluence documentation
- **API Documentation**: Auto-generated OpenAPI specs

## Deployment Environments

### Environment Progression
1. **CI**: Continuous integration testing
2. **Alpha**: Development environment
3. **TS50**: Test environment
4. **IT50**: Integration test environment
5. **SG50**: Staging environment
6. **PR50**: Production environment (canary testing)

### Environment Configuration
- **Service Discovery**: Integrated with Cvent's service registry
- **Load Balancing**: Environment-specific load balancer configuration
- **Database**: Oracle database with environment-specific connection strings
- **Authentication**: Auth service integration per environment

## Monitoring & Alerting

### Datadog Integration
- **Service Monitoring**: Automatic service discovery
- **Environment Filtering**: Per-environment dashboards
- **Custom Metrics**: Dropwizard metrics integration

### Health Checks
- **Dropwizard Health Checks**: Built-in health monitoring
- **Database Connectivity**: Oracle connection health
- **Dependency Health**: Auth service connectivity

## Security Considerations

### Container Security
- **Base Image**: Minimal Alpine Linux
- **Non-root User**: Service runs as non-root
- **Dependency Scanning**: WhiteSource integration

### Code Security
- **Static Analysis**: Checkmarx SAST scanning
- **Dependency Vulnerabilities**: Automated scanning
- **Authentication**: Integrated with Cvent auth service

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Maven dependency resolution
2. **Container Issues**: Verify base image availability
3. **Configuration**: Ensure environment-specific configs are present
4. **Database**: Verify Oracle connectivity and credentials

### Logs & Debugging
- **Log Format**: JSON structured logging
- **Log Location**: Container stdout/stderr
- **Debug Mode**: Available via configuration
- **Datadog Logs**: Centralized log aggregation