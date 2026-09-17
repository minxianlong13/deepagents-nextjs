# API Reference

## Base URL
`https://passkey-authentication-service.{environment}.cvent.org`

## Authentication

All endpoints require API key authentication with appropriate roles:
- **Header**: `Authorization: Bearer {api-key}`
- **Roles**: Specific roles required per endpoint (documented below)

## Endpoints

### JWT Management

#### GET /passkey-authentication/v1/jwt/{jwtString}
**Description**: Verify JWT token and extract payload

**Authentication**: API Key with `JWT_GET` role

**Path Parameters**:
- `jwtString` (string, required) - The JWT token to validate and decode

**Response**:
```json
{
  "userId": "12345",
  "email": "user@example.com",
  "roles": ["USER", "ADMIN"],
  "exp": 1640995200,
  "iat": 1640908800
}
```

**Status Codes**:
- 200: Success - JWT validated and payload returned
- 400: Bad Request - Invalid JWT format
- 401: Unauthorized - Invalid API key or insufficient permissions
- 403: Forbidden - JWT signature validation failed

**Example**:
```bash
curl -X GET \
  "https://passkey-authentication-service.dev.cvent.org/passkey-authentication/v1/jwt/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Authorization: Bearer your-api-key"
```

#### POST /passkey-authentication/v1/jwt
**Description**: Create JWT token from payload

**Authentication**: API Key with `JWT_CREATE` role

**Request Body**:
```json
{
  "userId": "12345",
  "email": "user@example.com",
  "roles": ["USER"],
  "customClaims": {
    "department": "engineering"
  }
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSJ9.signature"
}
```

**Status Codes**:
- 200: Success - JWT token created
- 400: Bad Request - Invalid payload format
- 401: Unauthorized - Invalid API key or insufficient permissions

### Session Management

#### POST /passkey-authentication/v1/sessions
**Description**: Create a new user session

**Authentication**: API Key with appropriate session management role

**Request Body**:
```json
{
  "userId": "12345",
  "sessionData": {
    "loginTime": "2024-01-01T10:00:00Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response**:
```json
{
  "sessionId": "sess_abc123",
  "expiresAt": "2024-01-01T18:00:00Z",
  "token": "session-jwt-token"
}
```

#### GET /passkey-authentication/v1/sessions/{sessionId}
**Description**: Retrieve session information

**Path Parameters**:
- `sessionId` (string, required) - The session identifier

**Response**:
```json
{
  "sessionId": "sess_abc123",
  "userId": "12345",
  "createdAt": "2024-01-01T10:00:00Z",
  "expiresAt": "2024-01-01T18:00:00Z",
  "isActive": true
}
```

#### DELETE /passkey-authentication/v1/sessions/{sessionId}
**Description**: Terminate a user session

**Path Parameters**:
- `sessionId` (string, required) - The session identifier to terminate

**Status Codes**:
- 204: No Content - Session successfully terminated
- 404: Not Found - Session not found

### Authentication

#### POST /passkey-authentication/v1/authenticate
**Description**: Authenticate user and create session

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "password123",
  "clientInfo": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response**:
```json
{
  "success": true,
  "userId": "12345",
  "sessionId": "sess_abc123",
  "token": "jwt-token",
  "expiresAt": "2024-01-01T18:00:00Z"
}
```

**Status Codes**:
- 200: Success - User authenticated
- 401: Unauthorized - Invalid credentials
- 429: Too Many Requests - Rate limit exceeded

### SSO Integration

#### GET /passkey-authentication/v1/sso/idp/{providerId}/login
**Description**: Initiate SSO login with identity provider

**Path Parameters**:
- `providerId` (string, required) - Identity provider identifier

**Query Parameters**:
- `redirectUrl` (string, optional) - URL to redirect after successful authentication

**Response**:
```json
{
  "loginUrl": "https://idp.example.com/auth?client_id=...",
  "state": "random-state-value"
}
```

#### POST /passkey-authentication/v1/sso/idp/{providerId}/callback
**Description**: Handle SSO callback from identity provider

**Path Parameters**:
- `providerId` (string, required) - Identity provider identifier

**Request Body**:
```json
{
  "code": "authorization-code",
  "state": "random-state-value"
}
```

**Response**:
```json
{
  "success": true,
  "userId": "12345",
  "sessionId": "sess_abc123",
  "token": "jwt-token",
  "redirectUrl": "https://app.example.com/dashboard"
}
```

### Admin Operations

#### POST /passkey-authentication/v1/admin/users
**Description**: Create user for testing purposes (admin only)

**Authentication**: API Key with admin privileges

**Request Body**:
```json
{
  "email": "testuser@example.com",
  "firstName": "Test",
  "lastName": "User",
  "roles": ["USER"]
}
```

**Response**:
```json
{
  "userId": "12345",
  "email": "testuser@example.com",
  "created": true
}
```

#### DELETE /passkey-authentication/v1/admin/users/{userId}
**Description**: Delete test user (admin only)

**Path Parameters**:
- `userId` (string, required) - User identifier to delete

**Status Codes**:
- 204: No Content - User successfully deleted
- 404: Not Found - User not found

### Login Links

#### POST /passkey-authentication/v1/login-links
**Description**: Generate secure login link for user

**Request Body**:
```json
{
  "userId": "12345",
  "expiresIn": 3600,
  "redirectUrl": "https://app.example.com/dashboard"
}
```

**Response**:
```json
{
  "loginLink": "https://passkey-authentication-service.dev.cvent.org/login?token=secure-token",
  "expiresAt": "2024-01-01T11:00:00Z"
}
```

#### GET /passkey-authentication/v1/login
**Description**: Process login link and authenticate user

**Query Parameters**:
- `token` (string, required) - Secure login token

**Response**: HTTP redirect to configured redirect URL with session established

### MyCvent Integration

#### GET /passkey-authentication/v1/mycvent/user/{userId}
**Description**: Retrieve user information from MyCvent system

**Path Parameters**:
- `userId` (string, required) - User identifier

**Response**:
```json
{
  "userId": "12345",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "accountId": "acc_789",
  "permissions": ["READ_EVENTS", "MANAGE_REGISTRATIONS"]
}
```

### Event Bridge Integration

#### POST /passkey-authentication/v1/events/handle
**Description**: Handle authentication events from AWS EventBridge

**Request Body**:
```json
{
  "eventType": "USER_LOGIN",
  "userId": "12345",
  "timestamp": "2024-01-01T10:00:00Z",
  "metadata": {
    "ipAddress": "192.168.1.1",
    "source": "web-app"
  }
}
```

**Response**:
```json
{
  "processed": true,
  "eventId": "evt_abc123"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided JWT token is invalid or expired",
    "details": {
      "timestamp": "2024-01-01T10:00:00Z",
      "path": "/passkey-authentication/v1/jwt/invalid-token"
    }
  }
}
```

### Common Error Codes

- `INVALID_TOKEN`: JWT token is invalid or expired
- `INSUFFICIENT_PERMISSIONS`: API key lacks required permissions
- `USER_NOT_FOUND`: Requested user does not exist
- `SESSION_EXPIRED`: User session has expired
- `RATE_LIMIT_EXCEEDED`: Too many requests from client
- `VALIDATION_ERROR`: Request payload validation failed
- `INTERNAL_ERROR`: Unexpected server error

## Rate Limiting

- **Default Limit**: 1000 requests per minute per API key
- **Burst Limit**: 100 requests per 10 seconds
- **Headers**: Rate limit information included in response headers
  - `X-RateLimit-Limit`: Total requests allowed per window
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

## Versioning

- **Current Version**: v1
- **Version Header**: `Accept: application/vnd.cvent.passkey-auth.v1+json`
- **Backward Compatibility**: Maintained for at least 12 months after new version release