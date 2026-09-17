# API Reference

## Base URL

The service is deployed with the following base URLs:

- **Development**: `https://passkey-integration-dev.cvent.com`
- **Staging**: `https://passkey-integration-staging.cvent.com`
- **Production**: `https://passkey-integration.cvent.com`

All API endpoints are prefixed with `/passkey-integration/v1`

## Authentication

All API endpoints require OAuth 2.0 authentication using Cvent's OAuth framework.

### Headers Required
```
Authorization: Bearer <oauth_token>
Content-Type: application/json
```

### OAuth Scopes
- `READ_ONLY`: Required for all GET operations

## Endpoints

### User Operations

#### GET /passkey-integration/v1/user/default

Retrieves the default Passkey user information for hotel integrations.

**Description**: Returns the default user ID that should be used for hotel system integrations when no specific user is provided.

**Authentication**: Required (READ_ONLY scope)

**Request Parameters**: None

**Request Headers**:
```
Authorization: Bearer <oauth_token>
Content-Type: application/json
```

**Response**:
```json
{
  "id": "12345"
}
```

**Response Fields**:
- `id` (string): The default Passkey user ID for integrations

**Status Codes**:
- `200 OK`: Successfully retrieved default user
- `401 Unauthorized`: Invalid or missing OAuth token
- `403 Forbidden`: Insufficient permissions (missing READ_ONLY scope)
- `500 Internal Server Error`: Server error occurred

**Example Request**:
```bash
curl -X GET \
  https://passkey-integration.cvent.com/passkey-integration/v1/user/default \
  -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Example Response**:
```json
{
  "id": "98765"
}
```

## Health Check Endpoints

### GET /health

Basic health check endpoint to verify service availability.

**Description**: Returns the health status of the service.

**Authentication**: Not required

**Response**:
```json
{
  "status": "UP"
}
```

**Status Codes**:
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is unhealthy

### GET /actuator/health

Spring Boot Actuator health endpoint with detailed health information.

**Description**: Provides detailed health information including database connectivity and other dependencies.

**Authentication**: Not required (may be restricted in production)

**Response**:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "Oracle",
        "validationQuery": "SELECT 1 FROM DUAL"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 10737418240,
        "free": 8589934592,
        "threshold": 10485760
      }
    }
  }
}
```

## Error Responses

### Standard Error Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details if available"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/passkey-integration/v1/user/default"
}
```

### Common Error Codes

#### Authentication Errors

**401 Unauthorized**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/passkey-integration/v1/user/default"
}
```

**403 Forbidden**
```json
{
  "error": {
    "code": "INSUFFICIENT_SCOPE",
    "message": "Required scope: READ_ONLY"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/passkey-integration/v1/user/default"
}
```

#### Server Errors

**500 Internal Server Error**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/passkey-integration/v1/user/default"
}
```

**503 Service Unavailable**
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Database connection unavailable"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/passkey-integration/v1/user/default"
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Rate Limit**: 1000 requests per hour per OAuth token
- **Headers**: Rate limit information is returned in response headers
  - `X-RateLimit-Limit`: Maximum requests per hour
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit resets (Unix timestamp)

**Rate Limit Exceeded Response**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later."
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## API Versioning

The API uses URL path versioning:
- Current version: `v1`
- Future versions will be available at `/passkey-integration/v2`, etc.
- Backward compatibility is maintained for at least 12 months after new version release

## SDK and Client Libraries

### Java Client

A Java client library is available in the `java-client` module:

```java
// Example usage
PasskeyIntegrationClient client = new PasskeyIntegrationClient(
    "https://passkey-integration.cvent.com",
    "your-oauth-token"
);

ResponseEntity defaultUser = client.getDefaultUser();
String userId = defaultUser.getId();
```

### HTTP Client Examples

#### cURL
```bash
# Get default user
curl -X GET \
  https://passkey-integration.cvent.com/passkey-integration/v1/user/default \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

#### JavaScript/Node.js
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://passkey-integration.cvent.com',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  }
});

// Get default user
const response = await client.get('/passkey-integration/v1/user/default');
console.log('Default User ID:', response.data.id);
```

#### Python
```python
import requests

headers = {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://passkey-integration.cvent.com/passkey-integration/v1/user/default',
    headers=headers
)

if response.status_code == 200:
    user_data = response.json()
    print(f"Default User ID: {user_data['id']}")
```

## Testing

### Integration Tests

Integration tests are available in the `it` module and can be run against different environments:

```bash
# Run integration tests against development environment
mvn test -Prun-it -Dtest.environment=dev

# Run integration tests against staging environment
mvn test -Prun-it -Dtest.environment=staging
```

### Postman Collection

A Postman collection is available for manual testing and can be imported from the repository's `assets` directory.