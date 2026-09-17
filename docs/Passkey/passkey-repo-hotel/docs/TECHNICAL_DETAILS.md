# Passkey Hotel Service - Technical Details

## Overview
The Passkey Hotel Service is a Java-based microservice built using the Dropwizard framework. It provides hotel operations functionality as part of the Cvent Passkey platform.

## Tech Stack

### Core Framework
- **Framework**: Dropwizard (JAX-RS based microservice framework)
- **Language**: Java 17 (Amazon Corretto 17.0.5.8.1)
- **Build Tool**: Maven 3.9.1
- **Package Manager**: pnpm 8.15.9 (for Node.js tooling)
- **Node.js**: 22.12.0 (for build tooling)

### Architecture
- **Pattern**: Multi-module Maven project
- **Modules**:
  - `passkey-hotel-api`: API definitions and OpenAPI specifications
  - `passkey-hotel-service`: Main service implementation
  - `passkey-hotel-data-access`: Database access layer with MyBatis
  - `passkey-hotel-shared`: Shared utilities and models
  - `passkey-hotel-java-client`: Java client library
  - `passkey-hotel-integration-test`: Integration test suite

## Dependencies

### Core Dependencies
- **Dropwizard Framework**:
  - `dropwizard-json-logging`: JSON structured logging
  - `dropwizard-assets`: Static asset serving
  - `dropwizard-http2`: HTTP/2 support
  - `dropwizard-testing`: Testing utilities

### Cvent Internal Dependencies
- **Parent POM**: `com.cvent:maven-parent:50.8.0`
- **Common Libraries**:
  - `common-dropwizard`: Cvent's Dropwizard extensions
  - `common-client`: HTTP client utilities
  - `dropwizard-mybatis`: MyBatis integration
  - `pangaea`: Cvent's data access utilities
- **Passkey Platform**:
  - `passkey-microservices-common:1.4.3`: Shared passkey utilities
- **Authentication**:
  - `auth-service-core:27.0.5`: Cvent authentication integration
- **Mono Java**: `mono-java:47.2.7`: Cvent's Java utilities

### Database
- **Database**: Oracle Database
- **Driver**: `ojdbc8:18.3.0.0`
- **ORM**: MyBatis (via `dropwizard-mybatis`)

### API Documentation
- **OpenAPI**: Swagger Core v3 (`swagger-jaxrs2-jakarta:2.2.27`)
- **Generation**: Automated OpenAPI spec generation during build

### Testing
- **Unit Testing**: JUnit 5 with Mockito
- **Integration Testing**: Cucumber (`cucumber-java:7.20.1`)
- **Test Libraries**:
  - `mockito-core:5.15.2`
  - `mockito-junit-jupiter:5.15.2`
  - `dropwizard-unit-tests`

### Build & Release
- **Changesets**: `@changesets/cli:^2.27.11` for version management
- **Cvent Builder**: `@cvent/builder-changesets:^1.10.0`

## Code Quality & Security
- **Code Coverage**: JaCoCo with coverage reporting
- **Static Analysis**: SonarQube integration
- **Security Scanning**: Checkmarx integration
- **Dependency Scanning**: WhiteSource (Mend) integration

## Runtime Environment
- **Base Image**: OpenJDK 8 Alpine (production)
- **Build Image**: Cvent Maven image
- **Java Runtime**: OpenJDK 8 JRE (containerized)
- **Configuration**: YAML-based configuration with environment-specific configs

## Service Metadata
- **Service Registry ID**: `918ebe8a-101a-4736-bec2-aed8881fb312`
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels
- **Owner Team**: Cherry Pickers
- **Lifecycle**: Production

## API Specifications
- **API Type**: OpenAPI 3.0
- **Format**: JSON and YAML
- **Location**: `passkey-hotel-api/openapi.json`
- **Auto-generation**: Via Swagger Maven plugin during compilation

## External Dependencies
- **Consumes APIs**: 
  - Auth Service (authentication and authorization)
- **Provides APIs**:
  - Passkey Hotel API (hotel operations)

## Monitoring & Observability
- **APM**: Datadog integration
- **Logging**: JSON structured logging via Dropwizard
- **Health Checks**: Dropwizard health checks
- **Metrics**: Dropwizard metrics

## Version Information
- **Current Version**: 1.0.125-SNAPSHOT
- **Versioning Strategy**: Semantic versioning with changesets
- **Release Branch**: master
- **Development Branch**: development