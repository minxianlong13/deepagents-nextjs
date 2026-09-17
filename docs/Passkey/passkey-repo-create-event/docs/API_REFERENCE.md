# API Reference

## Base URL

The Passkey Create Event Service is accessible at:
```
https://passkey-create-event-service.{environment}.cvent.org
```

Where `{environment}` is one of:
- `dev` - Development environment
- `staging` - Staging environment  
- `prod` - Production environment

## Authentication

All endpoints require API Key authentication using the `Authorization` header:

```http
Authorization: Bearer {api-key}
```

The service integrates with Cvent's auth service for API key validation and authorization.

## Content Type

All endpoints consume and produce JSON:
```http
Content-Type: application/json
Accept: application/json
```

## Endpoints

### Event Creation

#### POST /passkey-create-event/v1

**Description**: Creates a default Passkey event

**Authentication**: Required (API Key)

**Query Parameters**:
- `environment` (optional) - Target environment for the event

**Request Body**:
```json
{
  "eventName": "Annual Conference 2024",
  "eventDescription": "Annual company conference",
  "startDate": "2024-06-15T09:00:00Z",
  "endDate": "2024-06-17T17:00:00Z",
  "location": {
    "city": "Las Vegas",
    "state": "NV",
    "country": "US"
  },
  "organizationId": 12345,
  "contactInfo": {
    "primaryContact": "john.doe@company.com",
    "phone": "+1-555-123-4567"
  }
}
```

**Response**:
- **202 Accepted**: Event creation initiated successfully
  ```http
  HTTP/1.1 202 Accepted
  Location: https://passkey-event-service.prod.cvent.org/events/789123
  ```

- **400 Bad Request**: Invalid request data
  ```json
  {
    "error": "VALIDATION_ERROR",
    "message": "Invalid event data provided",
    "details": [
      {
        "field": "startDate",
        "message": "Start date cannot be in the past"
      }
    ]
  }
  ```

#### POST /passkey-create-event/v1/gml

**Description**: Creates a GML (Group Meeting List) Passkey event

**Authentication**: Required (API Key)

**Query Parameters**:
- `environment` (optional) - Target environment for the event

**Request Body**:
```json
{
  "gmlId": "GML-2024-001",
  "eventName": "Corporate Retreat",
  "gmlSpecificData": {
    "groupCode": "CORP2024",
    "specialRequirements": ["ADA accessible", "Kosher meals"]
  },
  "startDate": "2024-08-10T14:00:00Z",
  "endDate": "2024-08-12T12:00:00Z",
  "attendeeCount": 150
}
```

**Response**:
- **202 Accepted**: GML event creation initiated
  ```http
  HTTP/1.1 202 Accepted
  Location: https://passkey-event-service.prod.cvent.org/events/789124
  ```

- **400 Bad Request**: Invalid GML data

#### POST /passkey-create-event/v1/bundle/{bundleId}

**Description**: Creates an event based on a predefined bundle template

**Authentication**: Required (API Key)

**Path Parameters**:
- `bundleId` (required) - ID of the bundle template to use

**Request Body**:
```json
{
  "eventName": "Trade Show 2024",
  "customizations": {
    "branding": {
      "primaryColor": "#FF6B35",
      "logo": "https://cdn.company.com/logo.png"
    },
    "features": {
      "enableWaitlist": true,
      "allowGroupBookings": true
    }
  },
  "startDate": "2024-09-20T08:00:00Z",
  "endDate": "2024-09-22T18:00:00Z"
}
```

**Response**:
- **202 Accepted**: Bundle event creation initiated
- **400 Bad Request**: Invalid bundle ID or customization data
- **404 Not Found**: Bundle template not found

#### POST /passkey-create-event/v1/copy/{sourceEventId}

**Description**: Creates a new event by copying an existing event

**Authentication**: Required (API Key)

**Path Parameters**:
- `sourceEventId` (required) - ID of the source event to copy

**Request Body**:
```json
{
  "eventName": "Annual Conference 2025",
  "startDate": "2025-06-15T09:00:00Z",
  "endDate": "2025-06-17T17:00:00Z",
  "modifications": {
    "location": {
      "city": "Chicago",
      "state": "IL",
      "country": "US"
    },
    "capacity": 500
  }
}
```

**Response**:
- **202 Accepted**: Event copy initiated
- **400 Bad Request**: Invalid source event ID or modification data
- **404 Not Found**: Source event not found
- **403 Forbidden**: Insufficient permissions to copy the source event

### Event Cancellation

#### DELETE /passkey-create-event/v1/{eventId}

**Description**: Cancels an existing Passkey event

**Authentication**: Required (API Key)

**Path Parameters**:
- `eventId` (required) - ID of the event to cancel

**Response**:
- **200 OK**: Event cancelled successfully
  ```json
  {
    "message": "Event cancelled successfully",
    "eventId": 789123,
    "cancellationTimestamp": "2024-01-15T10:30:00Z"
  }
  ```

- **404 Not Found**: Event not found
- **403 Forbidden**: Insufficient permissions to cancel the event
- **409 Conflict**: Event cannot be cancelled (e.g., has active bookings)

### Administrative Operations

#### GET /passkey-create-event/v1/admin/health

**Description**: Health check endpoint for service monitoring

**Authentication**: Required (API Key with admin privileges)

**Response**:
- **200 OK**: Service is healthy
  ```json
  {
    "status": "UP",
    "timestamp": "2024-01-15T10:30:00Z",
    "dependencies": {
      "database": "UP",
      "businessTextService": "UP",
      "eventService": "UP",
      "inventoryService": "UP"
    }
  }
  ```

- **503 Service Unavailable**: Service or dependencies are unhealthy

#### GET /passkey-create-event/v1/admin/metrics

**Description**: Service metrics and statistics

**Authentication**: Required (API Key with admin privileges)

**Response**:
- **200 OK**: Metrics data
  ```json
  {
    "eventsCreatedToday": 45,
    "eventsCancelledToday": 3,
    "averageCreationTime": "2.3s",
    "errorRate": "0.02%",
    "uptime": "99.98%"
  }
  ```

### Affiliate Operations

#### POST /passkey-create-event/v1/affiliate/{affiliateId}/events

**Description**: Creates an event for a specific affiliate partner

**Authentication**: Required (API Key with affiliate permissions)

**Path Parameters**:
- `affiliateId` (required) - ID of the affiliate partner

**Request Body**:
```json
{
  "eventName": "Partner Conference 2024",
  "affiliateSpecific": {
    "commissionRate": 0.15,
    "brandingRequirements": {
      "cobranding": true,
      "affiliateLogo": "https://partner.com/logo.png"
    }
  },
  "startDate": "2024-07-10T09:00:00Z",
  "endDate": "2024-07-12T17:00:00Z"
}
```

**Response**:
- **202 Accepted**: Affiliate event creation initiated
- **400 Bad Request**: Invalid affiliate data
- **403 Forbidden**: Insufficient affiliate permissions

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-123456789",
  "details": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_FAILED` | 401 | Invalid or missing API key |
| `AUTHORIZATION_FAILED` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate event) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Rate Limiting

The service implements rate limiting to ensure fair usage:

- **Default Limit**: 100 requests per minute per API key
- **Burst Limit**: 20 requests per 10-second window
- **Headers**: Rate limit information is returned in response headers:
  ```http
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1642248600
  ```

## Request/Response Examples

### Creating a Default Event

**Request**:
```bash
curl -X POST https://passkey-create-event-service.prod.cvent.org/passkey-create-event/v1 \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Tech Summit 2024",
    "eventDescription": "Annual technology summit",
    "startDate": "2024-10-15T09:00:00Z",
    "endDate": "2024-10-17T17:00:00Z",
    "location": {
      "city": "San Francisco",
      "state": "CA",
      "country": "US"
    },
    "organizationId": 12345
  }'
```

**Response**:
```http
HTTP/1.1 202 Accepted
Location: https://passkey-event-service.prod.cvent.org/events/789125
Content-Type: application/json

{
  "message": "Event creation initiated",
  "eventId": 789125,
  "status": "PROCESSING"
}
```

### Cancelling an Event

**Request**:
```bash
curl -X DELETE https://passkey-create-event-service.prod.cvent.org/passkey-create-event/v1/789125 \
  -H "Authorization: Bearer your-api-key"
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Event cancelled successfully",
  "eventId": 789125,
  "cancellationTimestamp": "2024-01-15T10:30:00Z"
}
```

## SDK and Client Libraries

### Java Client

The service provides a Java client library for easy integration:

```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-create-event-java-client</artifactId>
    <version>2.1.13</version>
</dependency>
```

**Usage Example**:
```java
PasskeyCreateEventClient client = PasskeyCreateEventClient.builder()
    .baseUrl("https://passkey-create-event-service.prod.cvent.org")
    .apiKey("your-api-key")
    .build();

DefaultEvent event = DefaultEvent.builder()
    .eventName("My Event")
    .startDate(Instant.parse("2024-06-15T09:00:00Z"))
    .endDate(Instant.parse("2024-06-17T17:00:00Z"))
    .build();

CompletableFuture<URI> result = client.createDefaultEvent(event);
```