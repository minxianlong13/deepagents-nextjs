# Domain Model

## Glossary

### Authentication
The process of verifying the identity of a user or service attempting to access Passkey resources. This includes validating credentials, tokens, and other identity assertions.

### Authorization
The process of determining what actions an authenticated user or service is permitted to perform within the Passkey ecosystem.

### JWT (JSON Web Token)
A compact, URL-safe means of representing claims to be transferred between two parties. Used for secure information transmission and stateless authentication.

### Session
A temporary interactive information interchange between a user and the Passkey system. Sessions maintain user state across multiple requests.

### SSO (Single Sign-On)
An authentication scheme that allows a user to log in with a single ID and password to access multiple related systems and applications.

### Identity Provider (IDP)
An external system that creates, maintains, and manages identity information for users while providing authentication services to relying party applications.

### API Key
A unique identifier used to authenticate API requests from services or applications to the Passkey Authentication Service.

### Passkey User
An individual who has been granted access to Passkey services and applications within the Cvent ecosystem.

### MyCvent
Cvent's centralized user management and account system that provides user profile information and account-level permissions.

### Login Link
A secure, time-limited URL that allows users to authenticate without entering credentials, typically used for email-based authentication flows.

### Event Bridge
AWS service used for event-driven architecture, enabling the authentication service to publish and consume authentication-related events.

## Core Entities

### User
**Description**: Represents a person who can authenticate and access Passkey services

**Attributes**:
- `userId`: string - Unique identifier for the user
- `email`: string - User's email address (primary identifier)
- `firstName`: string - User's first name
- `lastName`: string - User's last name
- `accountId`: string - Associated Cvent account identifier
- `roles`: array[string] - User's assigned roles
- `permissions`: array[string] - Specific permissions granted to the user
- `isActive`: boolean - Whether the user account is active
- `createdAt`: timestamp - When the user was created
- `lastLoginAt`: timestamp - User's last login time

**Relationships**:
- Has many Sessions
- Belongs to Account (via MyCvent)
- Has many LoginLinks

### Session
**Description**: Represents an active user session within the Passkey ecosystem

**Attributes**:
- `sessionId`: string - Unique session identifier
- `userId`: string - Associated user identifier
- `token`: string - JWT token for the session
- `createdAt`: timestamp - When the session was created
- `expiresAt`: timestamp - When the session expires
- `lastAccessedAt`: timestamp - Last time the session was used
- `ipAddress`: string - IP address of the session
- `userAgent`: string - Browser/client user agent
- `isActive`: boolean - Whether the session is currently active

**Relationships**:
- Belongs to User
- May have associated AuthenticationEvents

### JWT Token
**Description**: Represents a JSON Web Token used for authentication and authorization

**Attributes**:
- `tokenId`: string - Unique token identifier (jti claim)
- `subject`: string - Subject of the token (usually userId)
- `issuer`: string - Token issuer (passkey-authentication-service)
- `audience`: array[string] - Intended token audience
- `issuedAt`: timestamp - When the token was issued
- `expiresAt`: timestamp - When the token expires
- `claims`: object - Additional claims in the token
- `algorithm`: string - Signing algorithm used

**Relationships**:
- Associated with User (via subject)
- May be linked to Session

### API Key
**Description**: Represents an API key used for service-to-service authentication

**Attributes**:
- `keyId`: string - Unique API key identifier
- `serviceName`: string - Name of the service using the key
- `roles`: array[string] - Roles assigned to the API key
- `permissions`: array[string] - Specific permissions granted
- `isActive`: boolean - Whether the key is active
- `createdAt`: timestamp - When the key was created
- `expiresAt`: timestamp - When the key expires (if applicable)
- `lastUsedAt`: timestamp - Last time the key was used

**Relationships**:
- Used by external Services
- Associated with AuthenticationEvents

### Identity Provider
**Description**: Represents an external identity provider for SSO integration

**Attributes**:
- `providerId`: string - Unique provider identifier
- `name`: string - Human-readable provider name
- `type`: string - Provider type (SAML, OAuth2, OpenID Connect)
- `configuration`: object - Provider-specific configuration
- `isActive`: boolean - Whether the provider is active
- `loginUrl`: string - Provider's login endpoint
- `callbackUrl`: string - Callback URL for authentication responses

**Relationships**:
- Associated with SSOSessions
- May have multiple Users authenticated through it

### SSO Session
**Description**: Represents a Single Sign-On session with an external identity provider

**Attributes**:
- `ssoSessionId`: string - Unique SSO session identifier
- `providerId`: string - Associated identity provider
- `externalUserId`: string - User ID from the identity provider
- `state`: string - OAuth state parameter for security
- `createdAt`: timestamp - When the SSO session was initiated
- `completedAt`: timestamp - When authentication was completed
- `status`: string - Session status (PENDING, COMPLETED, FAILED)

**Relationships**:
- Belongs to IdentityProvider
- May result in User Session

### Login Link
**Description**: Represents a secure login link for passwordless authentication

**Attributes**:
- `linkId`: string - Unique link identifier
- `userId`: string - Associated user identifier
- `token`: string - Secure token for the link
- `createdAt`: timestamp - When the link was created
- `expiresAt`: timestamp - When the link expires
- `usedAt`: timestamp - When the link was used (if applicable)
- `redirectUrl`: string - URL to redirect after successful login
- `isUsed`: boolean - Whether the link has been used

**Relationships**:
- Belongs to User
- May result in Session creation

### Authentication Event
**Description**: Represents an authentication-related event for auditing and monitoring

**Attributes**:
- `eventId`: string - Unique event identifier
- `eventType`: string - Type of event (LOGIN, LOGOUT, TOKEN_CREATED, etc.)
- `userId`: string - Associated user (if applicable)
- `sessionId`: string - Associated session (if applicable)
- `timestamp`: timestamp - When the event occurred
- `ipAddress`: string - IP address of the request
- `userAgent`: string - Client user agent
- `success`: boolean - Whether the operation was successful
- `errorCode`: string - Error code (if failed)
- `metadata`: object - Additional event-specific data

**Relationships**:
- May be associated with User
- May be associated with Session
- May be associated with APIKey

## Business Rules

### Authentication Rules

1. **Password Policy**: Users must have strong passwords meeting minimum complexity requirements
2. **Session Timeout**: Sessions expire after 8 hours of inactivity
3. **Token Expiration**: JWT tokens have a maximum lifetime of 24 hours
4. **Failed Login Attempts**: Account locked after 5 consecutive failed login attempts
5. **API Key Rotation**: API keys should be rotated every 90 days

### Authorization Rules

1. **Role-Based Access**: Users can only access resources permitted by their assigned roles
2. **Permission Inheritance**: Users inherit permissions from their roles
3. **Account-Level Permissions**: Some permissions are granted at the account level through MyCvent
4. **Service-Specific Roles**: Different Passkey services may have specific role requirements

### Session Management Rules

1. **Single Active Session**: Users can have multiple active sessions across different devices
2. **Session Invalidation**: Sessions are invalidated when user password changes
3. **Concurrent Session Limit**: Maximum of 10 concurrent sessions per user
4. **Session Extension**: Sessions can be extended through active use

### SSO Integration Rules

1. **Provider Validation**: Only configured and active identity providers are accepted
2. **User Mapping**: External users must be mapped to internal Passkey users
3. **Attribute Mapping**: User attributes from IDP are mapped to Passkey user fields
4. **Fallback Authentication**: Local authentication available if SSO fails

### Token Management Rules

1. **Token Signing**: All JWT tokens must be signed with current signing key
2. **Token Validation**: Tokens validated against both current and previous signing keys
3. **Claim Validation**: Required claims must be present and valid
4. **Audience Validation**: Tokens must be intended for the requesting service

### Data Retention Rules

1. **Session Data**: Session data retained for 30 days after expiration
2. **Authentication Events**: Events retained for 1 year for audit purposes
3. **Login Links**: Expired login links purged after 7 days
4. **Token Blacklist**: Revoked tokens maintained in blacklist until expiration

## Domain Relationships

```
User (1) ←→ (N) Session
User (1) ←→ (N) LoginLink
User (1) ←→ (N) AuthenticationEvent
Session (1) ←→ (N) AuthenticationEvent
IdentityProvider (1) ←→ (N) SSOSession
SSOSession (1) ←→ (1) Session
APIKey (1) ←→ (N) AuthenticationEvent
```

## State Transitions

### Session Lifecycle
1. **CREATED** → Session established after successful authentication
2. **ACTIVE** → Session being actively used
3. **IDLE** → Session inactive but not expired
4. **EXPIRED** → Session exceeded timeout period
5. **TERMINATED** → Session explicitly ended by user or system

### SSO Session Lifecycle
1. **INITIATED** → SSO login process started
2. **REDIRECTED** → User redirected to identity provider
3. **AUTHENTICATED** → User authenticated with IDP
4. **COMPLETED** → SSO process completed successfully
5. **FAILED** → SSO process failed or was cancelled

### Login Link Lifecycle
1. **CREATED** → Login link generated
2. **SENT** → Link delivered to user (email, etc.)
3. **ACCESSED** → User clicked the link
4. **USED** → Link successfully used for authentication
5. **EXPIRED** → Link exceeded expiration time