# Passkey Hotel Service - Architecture Documentation

## Overview

The Passkey Hotel Service is a Java-based microservice built using the Dropwizard framework that provides data and functionality for Passkey hotels within the Cvent ecosystem. It follows a multi-module Maven architecture pattern with clear separation of concerns.

## Project Structure

### Multi-Module Maven Project

This is a multi-module Maven project with the following structure:

```
passkey-hotel/
├── pom.xml (parent POM)
├── passkey-hotel-api/
├── passkey-hotel-data-access/
├── passkey-hotel-shared/
├── passkey-hotel-service/
├── passkey-hotel-java-client/
└── passkey-hotel-integration-test/
```

### Module Breakdown

#### 1. **passkey-hotel-api** 
- **Purpose**: API specification and documentation
- **Contents**: OpenAPI specifications (openapi.json, openapi.yaml)
- **Role**: Defines the REST API contract for external consumers

#### 2. **passkey-hotel-data-access**
- **Purpose**: Data access layer
- **Technology**: MyBatis for database operations
- **Role**: Handles all database interactions and data persistence

#### 3. **passkey-hotel-shared**
- **Purpose**: Shared utilities and common code
- **Role**: Contains reusable components across modules

#### 4. **passkey-hotel-service** (Main Module)
- **Purpose**: Core service implementation
- **Technology**: Dropwizard framework
- **Role**: Main application entry point and business logic

#### 5. **passkey-hotel-java-client**
- **Purpose**: Java client library
- **Role**: Provides programmatic access to the service for other Java applications

#### 6. **passkey-hotel-integration-test**
- **Purpose**: Integration testing
- **Technology**: Cucumber for BDD testing
- **Role**: End-to-end testing of service functionality

## Application Entry Point

**Main Class**: `com.cvent.passkey.hotel.PasskeyHotelServiceApplication`
**Location**: `passkey-hotel-service/src/main/java/com/cvent/passkey/hotel/PasskeyHotelServiceApplication.java`

The application extends `CventApplication<PasskeyHotelServiceConfiguration>` and serves as the main entry point for the Dropwizard service.

## Package Organization

### Core Package Structure
```
com.cvent.passkey.hotel/
├── PasskeyHotelServiceApplication.java (Main application class)
├── PasskeyHotelServiceConfiguration.java (Configuration class)
├── exceptions/ (Custom exception classes and mappers)
├── health/ (Health check implementations)
├── resources/ (REST API endpoints/controllers)
└── services/ (Business logic layer)
```

### Data Access Layer
- **MyBatis Integration**: Uses MyBatis for ORM and database operations
- **Mappers**: Database mappers for different entities (Hotel, Participant, Admin, etc.)
- **Data Access Objects**: Encapsulate database operations

### Service Layer Architecture
- **HotelService**: Core hotel-related business logic
- **ParticipantService**: Participant management
- **AdminService**: Administrative operations
- **OrgService**: Organization-related functionality
- **SpecialRequestsService**: Special requests handling
- **ReservationProcessingService**: Reservation processing logic
- **ImageService**: Image management functionality

### Resource Layer (REST Controllers)
- **PasskeyHotelResource**: Main hotel API endpoints
- **PasskeyHotelResourceV2**: Version 2 of hotel API
- **PasskeyOrgResource**: Organization endpoints
- **PasskeyParticipantResource**: Participant endpoints
- **AdminResource**: Administrative endpoints
- **SpecialRequestsResource**: Special requests endpoints
- **ReservationProcessingResource**: Reservation processing endpoints
- **OpenApiResource**: API documentation endpoint (dev environments only)

## Technology Stack

### Core Technologies
- **Java 17**: Programming language
- **Dropwizard**: Web service framework
- **MyBatis**: ORM framework for database operations
- **Maven**: Build and dependency management
- **Oracle Database**: Primary data store

### Additional Components
- **Cvent Auth**: Authentication and authorization
- **Jersey**: JAX-RS implementation for REST APIs
- **Jackson**: JSON processing
- **Swagger/OpenAPI**: API documentation
- **JaCoCo**: Code coverage reporting
- **Cucumber**: BDD testing framework

## Build Profiles

### Maven Profiles
1. **default**: Standard build with all modules except integration tests
2. **run-it**: Includes integration test module
3. **coverage**: Focuses on code coverage reporting with JaCoCo

## Configuration Management

- **Multi-environment support**: Configured for dev, alpha, ts50, sg50, and production
- **Environment-specific configurations**: Located in `passkey-hotel-service/configs/`
- **Database configuration**: Multi-environment aware data source factories
- **Authentication**: Integrated with Cvent's authentication system

## Deployment Architecture

- **Containerized**: Uses Docker for deployment (Dockerfile present)
- **CI/CD**: Jenkins pipeline integration (Jenkinsfile)
- **Health Checks**: Built-in health monitoring with scheduled checks
- **Monitoring**: Integrated logging and health check endpoints

## API Design

- **RESTful**: Follows REST principles
- **Versioned**: Supports multiple API versions (v1, v2)
- **OpenAPI Documented**: Complete API specification available
- **Environment-aware**: OpenAPI docs only available in lower environments

## Security

- **Authentication**: Cvent Auth integration
- **Authorization**: Role-based access control
- **Exception Handling**: Comprehensive exception mapping for security

## Development Workflow

1. **Local Development**: Maven-based build system
2. **Testing**: Unit tests with coverage reporting, integration tests with Cucumber
3. **Documentation**: Auto-generated API docs
4. **Quality Gates**: Code coverage thresholds enforced

This architecture provides a robust, scalable, and maintainable foundation for the Passkey Hotel Service within the Cvent ecosystem.