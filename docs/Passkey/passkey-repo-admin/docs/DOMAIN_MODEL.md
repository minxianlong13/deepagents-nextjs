# Domain Model

## Glossary

### Identity Provider (IDP)
A service that authenticates users and provides identity information to service providers. In the context of Passkey Admin, IDPs are external authentication systems (like corporate SAML providers) that can be configured to allow users to sign in using their existing credentials.

### Single Sign-On (SSO)
An authentication scheme that allows users to log in with a single ID and password to access multiple related systems. Passkey Admin manages SSO configurations for different identity providers.

### SAML (Security Assertion Markup Language)
An XML-based standard for exchanging authentication and authorization data between parties, particularly between an identity provider and a service provider.

### Service Provider (SP)
A system that provides services to users after they have been authenticated by an identity provider. In this context, Passkey services act as service providers.

### Attribute Mapping
The configuration that defines how user attributes from an external identity provider (like email, name, groups) are mapped to corresponding fields in the Passkey system.

### Entity ID
A unique identifier for a SAML entity (either an identity provider or service provider). Used to distinguish between different SAML configurations.

### SSO URL
The endpoint URL where SAML authentication requests are sent to initiate the single sign-on process.

### Certificate
A digital certificate used to verify the authenticity and integrity of SAML assertions exchanged between identity providers and service providers.

### Federation
The process of linking user identities across multiple identity management systems, allowing users to access resources across different domains using a single set of credentials.

### Assertion
A SAML assertion is a package of information that supplies one or more statements made by a SAML authority about a user's authentication status and attributes.

## Core Entities

### IdpConfiguration
**Description**: Represents a configured identity provider that can be used for SSO authentication.

**Attributes**:
- `id`: String - Unique identifier for the IDP configuration
- `name`: String - Human-readable name for the IDP
- `type`: Enum - Type of identity provider (SAML, OIDC, etc.)
- `status`: Enum - Current status (ACTIVE, INACTIVE, PENDING)
- `entityId`: String - SAML entity identifier
- `ssoUrl`: String - Single sign-on endpoint URL
- `certificate`: String - X.509 certificate for SAML validation
- `attributeMapping`: Object - Mapping of IDP attributes to system fields
- `createdAt`: DateTime - When the configuration was created
- `updatedAt`: DateTime - When the configuration was last modified
- `createdBy`: String - User who created the configuration

**Relationships**:
- Has many UserIdpAssignments
- Has many AuditLogs

**Business Rules**:
- Entity ID must be unique across all IDP configurations
- Certificate must be valid X.509 format for SAML IDPs
- Status can only transition from PENDING → ACTIVE → INACTIVE
- Name must be unique within an organization

### User
**Description**: Represents a user in the system who can be authenticated through various identity providers.

**Attributes**:
- `id`: String - Unique user identifier
- `email`: String - Primary email address (unique)
- `firstName`: String - User's first name
- `lastName`: String - User's last name
- `status`: Enum - Account status (ACTIVE, INACTIVE, SUSPENDED)
- `roles`: Array<String> - Assigned roles for authorization
- `permissions`: Array<String> - Specific permissions granted
- `lastLoginAt`: DateTime - Timestamp of last successful login
- `createdAt`: DateTime - Account creation timestamp
- `emailVerified`: Boolean - Whether email has been verified

**Relationships**:
- Has many UserIdpAssignments
- Has many AuditLogs (as actor)
- Belongs to Organization

**Business Rules**:
- Email must be unique across the system
- At least one role must be assigned to active users
- Suspended users cannot authenticate through any IDP
- Email verification required for certain operations

### UserIdpAssignment
**Description**: Links users to specific identity provider configurations, defining which IDPs a user can authenticate through.

**Attributes**:
- `id`: String - Unique assignment identifier
- `userId`: String - Reference to User
- `idpId`: String - Reference to IdpConfiguration
- `externalUserId`: String - User identifier in the external IDP
- `assignedAt`: DateTime - When the assignment was created
- `assignedBy`: String - User who created the assignment
- `status`: Enum - Assignment status (ACTIVE, INACTIVE)

**Relationships**:
- Belongs to User
- Belongs to IdpConfiguration

**Business Rules**:
- A user can be assigned to multiple IDPs
- External user ID must be unique within an IDP
- Assignment can only be created for active IDPs and users

### AuditLog
**Description**: Records all administrative actions performed in the system for compliance and security monitoring.

**Attributes**:
- `id`: String - Unique log entry identifier
- `action`: String - Type of action performed (CREATE, UPDATE, DELETE, LOGIN)
- `resource`: String - Type of resource affected (IDP, USER, ASSIGNMENT)
- `resourceId`: String - Identifier of the affected resource
- `userId`: String - User who performed the action
- `userEmail`: String - Email of the user (for historical reference)
- `timestamp`: DateTime - When the action occurred
- `details`: JSON - Additional context about the action
- `ipAddress`: String - IP address of the user
- `userAgent`: String - Browser/client information
- `sessionId`: String - Session identifier

**Relationships**:
- Belongs to User (actor)
- References various resources (polymorphic)

**Business Rules**:
- All administrative actions must be logged
- Logs are immutable once created
- Retention period of 7 years for compliance
- Sensitive data must be redacted in details

### AttributeMapping
**Description**: Defines how user attributes from an external identity provider are mapped to internal system fields.

**Attributes**:
- `email`: String - IDP attribute name for email address
- `firstName`: String - IDP attribute name for first name
- `lastName`: String - IDP attribute name for last name
- `groups`: String - IDP attribute name for group memberships
- `department`: String - IDP attribute name for department
- `title`: String - IDP attribute name for job title
- `customAttributes`: Map<String, String> - Additional custom mappings

**Business Rules**:
- Email mapping is required for all IDPs
- Attribute names must match IDP schema
- Custom attributes limited to 10 mappings per IDP

### Organization
**Description**: Represents a participant entity that owns hotels or organizes events. Organizations can have sister property relationships — hotels belonging to the same parent organization, enabling centralized management across a hotel chain.

**Attributes**:
- `id`: String - Unique organization identifier (participantId)
- `name`: String - Organization name
- `domain`: String - Primary email domain
- `status`: Enum - Organization status (ACTIVE, SUSPENDED)
- `settings`: JSON - Organization-specific settings
- `createdAt`: DateTime - Creation timestamp

**Relationships**:
- Has many Users
- Has many IdpConfigurations
- Can have sister property relationships with other Organizations

**Business Rules**:
- Domain must be unique across organizations
- Users belong to one organization (participant)
- IDP configurations are scoped to organization (participant level)
- Sister property relationships enable centralized SSO management across hotel chains

## Business Rules

### IDP Configuration Management
1. **Uniqueness**: Entity IDs must be globally unique across all organizations
2. **Certificate Validation**: SAML certificates must be valid X.509 format and not expired
3. **Status Transitions**: IDPs can only transition through valid status states
4. **Testing Required**: New IDP configurations must pass connectivity tests before activation
5. **Participant Scoping**: SSO configurations are managed at the participant (organization) level
6. **Sister Property Support**: Organizations with sister property relationships can share SSO configurations

### User Authentication Flow
1. **Separate Auth System**: Passkey maintains its own authentication system separate from Cvent-wide auth
2. **IDP Selection**: Users can authenticate through any assigned active IDP
3. **Participant Level Config**: SSO is configured at the participant (organization) level
4. **Attribute Processing**: User attributes are updated on each successful authentication
5. **Session Management**: Sessions are tied to the authentication method used
6. **Fallback Authentication**: System maintains local authentication as fallback

### Security and Compliance
1. **Audit Trail**: All administrative actions must be logged with full context
2. **Access Control**: Role-based permissions control access to IDP management functions
3. **Data Retention**: Audit logs retained for 7 years, user data follows data retention policies
4. **Encryption**: All sensitive configuration data encrypted at rest

### Data Synchronization
1. **Attribute Updates**: User attributes synchronized on each login from IDP
2. **Group Mapping**: IDP groups mapped to internal roles based on configuration
3. **Conflict Resolution**: Local changes take precedence over IDP attributes for certain fields
4. **Deactivation Handling**: Users deactivated in IDP are automatically suspended locally

## State Diagrams

### IDP Configuration Lifecycle
```
PENDING → ACTIVE → INACTIVE
    ↓        ↓
  DELETE   SUSPEND
```

### User Account Lifecycle
```
PENDING → ACTIVE ⇄ SUSPENDED → DEACTIVATED
    ↓       ↓
  DELETE  DELETE
```

### Authentication Session States
```
UNAUTHENTICATED → AUTHENTICATING → AUTHENTICATED → EXPIRED
                       ↓               ↓
                    FAILED          LOGOUT
```