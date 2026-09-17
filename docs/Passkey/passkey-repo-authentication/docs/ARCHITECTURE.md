# Architecture

## System Overview

The Passkey Authentication Service is built using a multi-module Maven architecture with Dropwizard framework. It follows a layered architecture pattern with clear separation of concerns between API, service, and data access layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    External Clients                         │
│  (Passkey Services, Frontend Apps, Admin Tools)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 API Layer (JAX-RS)                         │
│  JwtResource │ SessionHandleResource │ SSOIDPResource      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Service Layer                                │
│  JwtService │ SessionService │ AuthenticationService        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Data Access Layer                              │
│         Repository Pattern │ Database Access               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Dependencies                          │
│  Auth Service │ Identity Mapping │ Login Service │ Oracle  │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service follows a standard multi-module Maven structure:

### passkey-authentication-api
- **Purpose**: Defines public API contracts and data models
- **Location**: `passkey-authentication-api/`
- **Key Components**: Request/Response DTOs, API interfaces

### passkey-authentication-service
- **Purpose**: Main service implementation with REST endpoints
- **Location**: `passkey-authentication-service/`
- **Key Components**: 
  - JAX-RS Resources (REST endpoints)
  - Service layer implementations
  - Application configuration
  - Main application class

### passkey-authentication-data-access
- **Purpose**: Database access layer and repository implementations
- **Location**: `passkey-authentication-data-access/`
- **Key Components**: 
  - Repository interfaces and implementations
  - Database entity mappings
  - Data access utilities

### passkey-authentication-shared
- **Purpose**: Shared utilities and common code
- **Location**: `passkey-authentication-shared/`
- **Key Components**: Common utilities, constants, shared models

### passkey-authentication-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-authentication-java-client/`
- **Key Components**: Client interfaces, HTTP clients, client configurations

### passkey-authentication-integration-test
- **Purpose**: Integration tests using Karate framework
- **Location**: `passkey-authentication-integration-test/`
- **Key Components**: Karate feature files, test configurations

## Core Components

### JWT Management
- **JwtResource**: REST endpoints for JWT operations
- **JwtService**: Business logic for JWT creation and validation
- **Purpose**: Secure token generation and validation for service-to-service communication

### Session Management
- **SessionHandleResource**: REST endpoints for session operations
- **AdminSessionHandleResource**: Administrative session management
- **Purpose**: Manage user sessions across Passkey services

### Authentication Resources
- **PasskeyAuthenticationResource**: Main authentication endpoints
- **AdminAuthenticationResource**: Administrative authentication flows
- **Purpose**: Handle user authentication and authorization

### SSO Integration
- **SSOIDPResource**: Single Sign-On identity provider integration
- **Purpose**: Enable SSO with external identity providers

### Event Handling
- **EventBridgeHandleResource**: AWS EventBridge integration
- **Purpose**: Handle authentication-related events

### User Management
- **MyCventResource**: Integration with Cvent's user system
- **LoginLinkResource**: Secure login link generation
- **Purpose**: User account management and secure access

## Data Flow

### Authentication Flow
1. **User Request**: Client sends authentication request
2. **Validation**: Service validates credentials with Auth Service
3. **Token Generation**: JWT token created with user claims
4. **Session Creation**: User session established
5. **Response**: Token and session information returned

### JWT Validation Flow
1. **Token Received**: Service receives JWT for validation
2. **Signature Verification**: Token signature validated
3. **Claims Extraction**: User claims extracted from token
4. **Authorization Check**: User permissions verified
5. **Access Granted**: Request processed if authorized

### SSO Flow
1. **SSO Request**: User initiates SSO login
2. **IDP Redirect**: User redirected to identity provider
3. **Authentication**: User authenticates with IDP
4. **Token Exchange**: IDP token exchanged for Passkey token
5. **Session Establishment**: Passkey session created

## Design Patterns

### Repository Pattern
- Abstracts data access logic
- Provides clean separation between business logic and data persistence
- Enables easy testing with mock implementations

### Service Layer Pattern
- Encapsulates business logic
- Provides transaction boundaries
- Enables reusability across different endpoints

### Dependency Injection
- Uses Dropwizard's built-in DI container
- Promotes loose coupling between components
- Facilitates testing and configuration management

### Resource Pattern (JAX-RS)
- RESTful API design
- Clear separation of HTTP concerns
- Standardized error handling and response formatting

## Security Architecture

### Authentication Methods
- **API Key Authentication**: For service-to-service communication
- **JWT Token Authentication**: For user session management
- **SSO Integration**: For external identity provider authentication

### Authorization Model
- Role-based access control (RBAC)
- Fine-grained permissions per endpoint
- Integration with Cvent's central authorization system

### Security Measures
- Token encryption and signing
- Secure session management
- Input validation and sanitization
- Audit logging for security events

## Integration Points

### Internal Services
- **Auth Service**: Core authentication and authorization
- **Identity Mapping Service**: User identity resolution
- **Login Service**: Cvent login functionality
- **Experiments Service**: Feature flag management

### External Systems
- **Oracle Database**: User and session data persistence
- **AWS EventBridge**: Event-driven architecture integration
- **Identity Providers**: SSO integration points

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables horizontal scaling
- Load balancing across multiple instances
- Database connection pooling for efficient resource usage

### Caching Strategy
- JWT validation caching to reduce Auth Service calls
- Session data caching for improved performance
- Configuration caching to minimize database queries

### Performance Optimization
- Asynchronous processing for non-critical operations
- Connection pooling for external service calls
- Efficient database query patterns