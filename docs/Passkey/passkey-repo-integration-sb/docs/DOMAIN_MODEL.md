# Domain Model

## Glossary

### Passkey
A comprehensive event management platform that enables organizations to manage events, registrations, and attendee experiences. Passkey provides tools for event planning, registration management, and integration with various hospitality services.

### Hotel Integration
The process of connecting Passkey's event management system with hotel management systems to facilitate room bookings, availability checks, and guest management for event attendees.

### Default User
A system-defined user account that serves as the fallback identity for hotel integration operations when no specific user context is provided. This ensures consistent behavior across different hotel system integrations.

### OAuth Token
A security token used for authentication and authorization, following the OAuth 2.0 standard. Tokens contain scope information that determines what operations the bearer is authorized to perform.

### Scope
A permission level that defines what operations an OAuth token holder can perform. The service currently supports the READ_ONLY scope for user information retrieval.

### Integration Service
A microservice that acts as a bridge between Passkey's core platform and external systems, providing standardized APIs and handling data transformation between different system formats.

### Hotel Management System (HMS)
External software systems used by hotels to manage reservations, guest information, room inventory, and other hospitality operations. Examples include PMS (Property Management Systems) and CRS (Central Reservation Systems).

### Service Discovery
The mechanism by which services locate and communicate with each other in a distributed system architecture. This service registers itself for discovery by other Passkey components.

### Health Check
Automated monitoring endpoints that report the operational status of the service, including database connectivity and system resource availability.

## Core Entities

### User
**Description**: Represents a user entity within the Passkey system that can be used for hotel integrations.

**Attributes**:
- `id`: String - Unique identifier for the user
- `type`: String - User type (e.g., "default", "system", "customer")
- `status`: String - Current status of the user account
- `createdDate`: DateTime - When the user was created
- `lastModified`: DateTime - When the user was last updated

**Relationships**:
- Associated with hotel bookings and reservations
- Linked to event registrations and attendee records
- Connected to authentication and authorization contexts

**Business Rules**:
- Every hotel integration operation must have an associated user context
- Default user is used when no specific user is provided
- User IDs must be unique across the entire Passkey platform

### Integration Context
**Description**: Represents the context information for a hotel system integration operation.

**Attributes**:
- `userId`: String - The user performing the integration operation
- `hotelSystemId`: String - Identifier for the target hotel system
- `operationType`: String - Type of operation being performed
- `timestamp`: DateTime - When the operation was initiated
- `environment`: String - Environment context (dev, staging, production)

**Relationships**:
- Links to User entity for authentication context
- Associated with specific hotel management systems
- Connected to audit logs and monitoring data

**Business Rules**:
- All integration operations must have a valid context
- Context information is logged for audit purposes
- Environment-specific configurations apply based on context

### Response Entity
**Description**: Standardized response format for API operations.

**Attributes**:
- `id`: String - Primary identifier for the response data
- `status`: String - Operation status indicator
- `metadata`: Map - Additional response metadata
- `timestamp`: DateTime - Response generation time

**Relationships**:
- Used by all API endpoints for consistent response format
- Links to underlying domain entities
- Associated with request tracking and logging

**Business Rules**:
- All API responses must follow the standard entity format
- Response entities include correlation IDs for request tracking
- Metadata includes version and environment information

## Business Rules

### User Management Rules

1. **Default User Assignment**
   - When no specific user is provided in an integration request, the system automatically assigns the default user
   - The default user ID is retrieved from the database and cached for performance
   - Default user must always be available and active

2. **User Authentication**
   - All user operations require valid OAuth authentication
   - OAuth tokens must include appropriate scopes for the requested operation
   - Token validation occurs before any business logic execution

3. **User Context Propagation**
   - User context is maintained throughout the request lifecycle
   - User information is included in all downstream service calls
   - Audit logs capture user context for all operations

### Integration Rules

1. **Hotel System Compatibility**
   - Integration operations must be compatible with target hotel system capabilities
   - Data format transformation occurs based on hotel system requirements
   - Error handling adapts to hotel system-specific error formats

2. **Data Consistency**
   - All integration operations maintain data consistency between Passkey and hotel systems
   - Transactional boundaries ensure atomic operations
   - Rollback mechanisms handle partial failure scenarios

3. **Rate Limiting**
   - Integration operations are subject to rate limiting to prevent system overload
   - Rate limits are applied per OAuth token and per hotel system
   - Graceful degradation occurs when rate limits are exceeded

### Security Rules

1. **Authorization Enforcement**
   - All protected endpoints enforce OAuth scope requirements
   - Scope validation occurs at the controller level
   - Insufficient permissions result in 403 Forbidden responses

2. **Data Protection**
   - Sensitive user information is protected in transit and at rest
   - Audit logs exclude sensitive data elements
   - Data retention policies apply to all stored information

3. **Environment Isolation**
   - Development, staging, and production environments are completely isolated
   - Cross-environment data access is prohibited
   - Environment-specific configurations prevent accidental data mixing

### Monitoring and Observability Rules

1. **Health Monitoring**
   - Service health is continuously monitored through health check endpoints
   - Database connectivity is verified as part of health checks
   - Unhealthy services are automatically removed from load balancer rotation

2. **Logging Standards**
   - All operations generate structured logs with correlation IDs
   - Log levels are configurable per environment
   - Sensitive information is excluded from log output

3. **Metrics Collection**
   - Performance metrics are collected for all API operations
   - Business metrics track integration success rates
   - Alert thresholds trigger notifications for anomalous behavior

## Data Relationships

### Entity Relationship Overview

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    User     │────▶│ Integration     │────▶│ Hotel System    │
│             │     │ Context         │     │                 │
└─────────────┘     └─────────────────┘     └─────────────────┘
       │                      │                       │
       │                      │                       │
       ▼                      ▼                       ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Audit Log   │     │ Response        │     │ Configuration   │
│             │     │ Entity          │     │                 │
└─────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Relationships

1. **User → Integration Context**: One-to-many relationship where a user can have multiple integration contexts
2. **Integration Context → Hotel System**: Many-to-one relationship where multiple contexts can target the same hotel system
3. **User → Audit Log**: One-to-many relationship for tracking user operations
4. **Integration Context → Response Entity**: One-to-one relationship for operation responses

## Domain Events

### User Events
- `UserCreated`: When a new user is created in the system
- `UserUpdated`: When user information is modified
- `UserDeactivated`: When a user account is deactivated

### Integration Events
- `IntegrationRequested`: When a hotel integration operation is initiated
- `IntegrationCompleted`: When an integration operation completes successfully
- `IntegrationFailed`: When an integration operation fails

### System Events
- `ServiceStarted`: When the service starts up
- `ServiceHealthChanged`: When service health status changes
- `ConfigurationUpdated`: When service configuration is modified

## Validation Rules

### Input Validation
- All API inputs are validated against defined schemas
- Required fields must be present and non-empty
- Data types must match expected formats
- String lengths must be within defined limits

### Business Validation
- User IDs must exist in the system before use
- OAuth tokens must be valid and not expired
- Scope requirements must be met for protected operations
- Rate limits must not be exceeded

### Data Integrity
- Database constraints ensure referential integrity
- Unique constraints prevent duplicate entries
- Foreign key relationships maintain data consistency
- Transaction boundaries ensure atomic operations