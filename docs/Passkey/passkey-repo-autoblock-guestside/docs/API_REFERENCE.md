# API Reference

## Base URL

**Development**: `http://localhost:8080`  
**Production**: `https://passkey-autoblock-guestside-service.cvent.com`

## Authentication

All endpoints require authentication via Cvent's auth-service. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Autoblock Guestside Resource

Base path: `/`

#### GET /

**Description**: Serves the main autoblock guest-side interface

**Authentication**: Required

**Query Parameters**:
- `surveyId` (string, optional) - Survey identifier
- `eventId` (string, optional) - Event identifier  
- `hotelId` (string, optional) - Hotel identifier
- `locale` (string, optional) - Locale for localization (default: en_US)

**Response**: HTML page (Nucleus View)

**Status Codes**:
- 200: Success - Returns rendered HTML page
- 401: Unauthorized - Invalid or missing authentication
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Survey or related entity not found
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Service error

**Example Request**:
```bash
curl -X GET "https://passkey-autoblock-guestside-service.cvent.com/?surveyId=12345&eventId=67890" \
  -H "Authorization: Bearer <access_token>"
```

#### POST /survey/submit

**Description**: Submits autoblock survey responses

**Authentication**: Required

**Request Body**:
```json
{
  "surveyId": "string",
  "eventId": "string", 
  "hotelId": "string",
  "responses": {
    "roomTypeId": "string",
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "guestCount": 2,
    "specialRequests": "string"
  },
  "guestInfo": {
    "firstName": "string",
    "lastName": "string", 
    "email": "string",
    "phone": "string"
  }
}
```

**Response**:
```json
{
  "success": true,
  "confirmationId": "string",
  "message": "Survey submitted successfully"
}
```

**Status Codes**:
- 200: Success - Survey submitted
- 400: Bad Request - Invalid request data
- 401: Unauthorized - Authentication required
- 422: Unprocessable Entity - Validation errors
- 500: Internal Server Error - Processing error

### Access Resource

Base path: `/access`

#### GET /access/validate

**Description**: Validates access token and returns user context

**Authentication**: Required

**Response**:
```json
{
  "valid": true,
  "userId": "string",
  "permissions": ["string"],
  "expiresAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 200: Success - Token is valid
- 401: Unauthorized - Invalid token
- 403: Forbidden - Token expired or insufficient permissions

#### POST /access/refresh

**Description**: Refreshes access token using refresh token

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Response**:
```json
{
  "accessToken": "string",
  "refreshToken": "string", 
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

**Status Codes**:
- 200: Success - New tokens issued
- 400: Bad Request - Invalid refresh token
- 401: Unauthorized - Refresh token expired

### Admin Resource

Base path: `/admin`

#### GET /admin/health

**Description**: Service health check endpoint

**Authentication**: Admin role required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.1.10",
  "dependencies": {
    "auth-service": "healthy",
    "hotel-service": "healthy",
    "event-service": "healthy",
    "inventory-service": "healthy"
  }
}
```

**Status Codes**:
- 200: Success - Service is healthy
- 503: Service Unavailable - Service or dependencies unhealthy

#### GET /admin/metrics

**Description**: Service metrics and statistics

**Authentication**: Admin role required

**Response**:
```json
{
  "requests": {
    "total": 12345,
    "successful": 12000,
    "failed": 345
  },
  "performance": {
    "averageResponseTime": 150,
    "p95ResponseTime": 300,
    "p99ResponseTime": 500
  },
  "errors": {
    "authenticationErrors": 45,
    "validationErrors": 123,
    "serviceErrors": 177
  }
}
```

#### POST /admin/cache/clear

**Description**: Clears service caches

**Authentication**: Admin role required

**Request Body**:
```json
{
  "cacheType": "all|survey|hotel|event"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "clearedCaches": ["survey", "hotel"]
}
```

## Data Models

### SurveyRequestMetaData

```json
{
  "surveyId": "string",
  "eventId": "string",
  "hotelId": "string", 
  "createdAt": "2024-01-15T10:30:00Z",
  "status": "active|inactive|completed",
  "configuration": {
    "allowMultipleRooms": true,
    "requireGuestInfo": true,
    "customFields": ["string"]
  }
}
```

### Guest Information

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "preferences": {
    "roomType": "string",
    "floor": "string", 
    "accessibility": true
  }
}
```

### Survey Response

```json
{
  "roomSelections": [
    {
      "roomTypeId": "string",
      "quantity": 1,
      "checkInDate": "2024-01-15",
      "checkOutDate": "2024-01-17",
      "rate": 199.99,
      "currency": "USD"
    }
  ],
  "guestInfo": "GuestInfo",
  "specialRequests": "string",
  "submittedAt": "2024-01-15T10:30:00Z"
}
```

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "string"
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request data validation failed
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `RATE_LIMIT_EXCEEDED`: Too many requests from client
- `SERVICE_UNAVAILABLE`: Downstream service unavailable
- `INTERNAL_ERROR`: Unexpected server error

## Rate Limiting

The service implements rate limiting to prevent abuse:

- **Guest endpoints**: 100 requests per minute per IP
- **Admin endpoints**: 1000 requests per minute per user
- **Survey submission**: 10 submissions per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Caching

Response caching is implemented for performance:

- **Survey data**: 5 minutes
- **Hotel information**: 15 minutes  
- **Event details**: 10 minutes
- **Static content**: 1 hour

Cache headers indicate freshness:

```
Cache-Control: public, max-age=300
ETag: "abc123"
Last-Modified: Mon, 15 Jan 2024 10:30:00 GMT
```

## CORS Support

Cross-Origin Resource Sharing (CORS) is configured for web client access:

- **Allowed Origins**: Configured per environment
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Authorization, Content-Type, X-Requested-With
- **Credentials**: Supported for authenticated requests

## Webhooks

The service supports webhooks for real-time notifications:

### Survey Completion Webhook

**Trigger**: When a guest completes a survey

**Payload**:
```json
{
  "event": "survey.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "surveyId": "string",
    "eventId": "string",
    "guestId": "string",
    "completedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Configuration**: Webhook URLs configured via admin endpoints or configuration files.