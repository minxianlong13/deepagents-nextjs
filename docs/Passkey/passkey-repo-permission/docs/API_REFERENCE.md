# API Reference

## Base URL

The service is available at different base URLs depending on the environment:
- **Development**: `https://dev-api.cvent.com/passkey-permission/v1`
- **Alpha**: `https://alpha-api.cvent.com/passkey-permission/v1`
- **Production**: `https://api.cvent.com/passkey-permission/v1`

## Authentication

All endpoints require authentication using one of the following methods:

### API Key Authentication
For service-to-service communication:
```
Authorization: ApiKey YOUR_API_KEY
```

### Bearer Token Authentication
For user-context operations:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### GET /permissions

**Description**: Retrieves module privileges for a specific user

**Authentication**: API Key required

**Query Parameters**:
- `userId` (required): `long` - The ID of the user to retrieve permissions for

**Request Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-permission/v1/permissions?userId=12345" \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Response**:
```json
[
  {
    "id": "permission-1",
    "name": "VIEW_EVENTS",
    "description": "Permission to view events",
    "module": "events",
    "context": "user"
  },
  {
    "id": "permission-2", 
    "name": "MANAGE_HOTELS",
    "description": "Permission to manage hotels",
    "module": "hotels",
    "context": "user"
  }
]
```

**Status Codes**:
- `200`: Success - Returns array of Permission objects
- `400`: Bad Request - Missing or invalid userId parameter
- `401`: Unauthorized - Invalid or missing API key
- `404`: Not Found - User not found
- `500`: Internal Server Error

---

### GET /permissions/context/{contextType}

**Description**: Retrieves permissions for a specific context type with additional query parameters

**Authentication**: API Key required

**Path Parameters**:
- `contextType` (required): `string` - The type of context to retrieve permissions for
  - Possible values: `USER`, `EVENT`, `HOTEL`, `PARTICIPANT`

**Query Parameters**:
Context-specific parameters passed via query string. Common parameters include:
- `userId`: User ID for user context
- `eventId`: Event ID for event context  
- `hotelId`: Hotel ID for hotel context
- `participantId`: Participant ID for participant context

**Request Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-permission/v1/permissions/context/EVENT?userId=12345&eventId=67890" \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Response**:
```json
[
  "VIEW_EVENT_DETAILS",
  "EDIT_EVENT_SETTINGS", 
  "MANAGE_EVENT_HOTELS",
  "VIEW_EVENT_REPORTS"
]
```

**Status Codes**:
- `200`: Success - Returns array of permission strings
- `400`: Bad Request - Invalid context type or missing required parameters
- `401`: Unauthorized - Invalid or missing API key
- `404`: Not Found - Context not found
- `500`: Internal Server Error

---

### GET /navigations/global

**Description**: Retrieves the global navigation menu for the authenticated user in Resdesk

**Authentication**: Bearer Token required

**Query Parameters**:
- `eventId` (optional): `long` - Event ID for URL generation context

**Request Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-permission/v1/navigations/global?eventId=67890" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "appSwitcher": {
    "sections": [
      {
        "title": "Events",
        "items": [
          {
            "id": "event-dashboard",
            "title": "Event Dashboard",
            "url": "https://resdesk.cvent.com/events/67890/dashboard",
            "icon": "dashboard",
            "description": "View event overview and metrics"
          },
          {
            "id": "event-hotels",
            "title": "Hotel Management", 
            "url": "https://resdesk.cvent.com/events/67890/hotels",
            "icon": "hotel",
            "description": "Manage event hotels and room blocks"
          }
        ]
      },
      {
        "title": "Reports",
        "items": [
          {
            "id": "booking-reports",
            "title": "Booking Reports",
            "url": "https://resdesk.cvent.com/reports/bookings",
            "icon": "chart",
            "description": "View booking analytics and reports"
          }
        ]
      }
    ]
  },
  "userMetadata": {
    "userId": 12345,
    "userName": "john.doe@example.com",
    "displayName": "John Doe",
    "permissions": ["VIEW_EVENTS", "MANAGE_HOTELS"]
  }
}
```

**Status Codes**:
- `200`: Success - Returns NavigationResponse object
- `401`: Unauthorized - Invalid or missing bearer token
- `500`: Internal Server Error - Error generating navigation

## Data Models

### Permission
```json
{
  "id": "string",
  "name": "string", 
  "description": "string",
  "module": "string",
  "context": "string"
}
```

### NavigationResponse
```json
{
  "appSwitcher": {
    "sections": [AppSwitcherSection]
  },
  "userMetadata": UserMetadata
}
```

### AppSwitcherSection
```json
{
  "title": "string",
  "items": [AppSwitcherItem]
}
```

### AppSwitcherItem
```json
{
  "id": "string",
  "title": "string",
  "url": "string", 
  "icon": "string",
  "description": "string"
}
```

### UserMetadata
```json
{
  "userId": "long",
  "userName": "string",
  "displayName": "string", 
  "permissions": ["string"]
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Common Error Codes

- `INVALID_API_KEY`: The provided API key is invalid or expired
- `MISSING_PARAMETER`: A required parameter is missing from the request
- `INVALID_PARAMETER`: A parameter value is invalid or malformed
- `USER_NOT_FOUND`: The specified user does not exist
- `CONTEXT_NOT_FOUND`: The specified context does not exist
- `PERMISSION_DENIED`: The user does not have permission to access the resource
- `INTERNAL_ERROR`: An internal server error occurred

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Rate Limit**: 1000 requests per minute per API key
- **Headers**: Rate limit information is returned in response headers:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## OpenAPI Specification

The complete OpenAPI specification is available at:
- **JSON Format**: `/{environment}/passkey-permission/openapi.json`
- **YAML Format**: `/{environment}/passkey-permission/openapi.yaml`

Where `{environment}` is one of: `dev`, `alpha`, `ts50` (lower environments only)

## SDK and Client Libraries

### Java Client
A Java client library is available in the `passkey-permission-java-client` module:

```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-permission-java-client</artifactId>
    <version>1.1.6</version>
</dependency>
```

### Usage Example
```java
PasskeyPermissionClient client = new PasskeyPermissionClient(
    "https://api.cvent.com", 
    "your-api-key"
);

List<Permission> permissions = client.getPermissions(12345L);
List<String> contextPermissions = client.getContextPermissions(
    ContextType.EVENT, 
    Map.of("userId", "12345", "eventId", "67890")
);
```