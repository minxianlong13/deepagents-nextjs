# API Reference

## Base URL
`https://passkey-delphifdc-service.{environment}.cvent.com`

## Authentication

All endpoints require authentication using one of the following methods:
- **API Key**: `X-API-Key` header
- **JWT Token**: `Authorization: Bearer {token}` header
- **Bearer Token**: `Authorization: Bearer {token}` header

### Required Roles
- `AMADEUS_USER`: For Amadeus system integration
- `delphifdc-notifications:write`: For notification submission

## Endpoints

### POST /api/v1/events
**Description**: Receives event notifications from Amadeus Delphi FDC system

**Authentication**: Required (API Key, JWT, or Bearer)  
**Roles**: `AMADEUS_USER`, `delphifdc-notifications:write`

**Request Body**:
```json
[
  {
    "id": "string",
    "eventDetail": {
      "locationId": "string",
      "resourceId": "string",
      "eventType": "string",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "additionalData": {
      "bookingReference": "string",
      "guestCount": 0,
      "eventDate": "2024-01-20"
    }
  }
]
```

**Request Parameters**:
- `id` (required): Unique identifier for the notification
- `eventDetail` (required): Event-specific information
  - `locationId` (required): Hotel/venue location identifier
  - `resourceId` (required): Resource identifier (room, space, etc.)
  - `eventType` (required): Type of event (booking, cancellation, modification)
  - `timestamp` (required): Event occurrence timestamp
- `additionalData` (optional): Additional event metadata

**Response**:
```json
{
  "status": "success"
}
```

**Status Codes**:
- `200`: Success - Notifications received and queued for processing
- `400`: Bad Request - Invalid request format or missing required fields
- `401`: Unauthorized - Invalid or missing authentication
- `403`: Forbidden - Insufficient permissions
- `500`: Internal Server Error - Service processing error

**Example Request**:
```bash
curl -X POST \
  https://passkey-delphifdc-service.dev.cvent.com/api/v1/events \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: your-api-key' \
  -d '[
    {
      "id": "evt-12345",
      "eventDetail": {
        "locationId": "hotel-001",
        "resourceId": "room-101",
        "eventType": "booking_created",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "additionalData": {
        "bookingReference": "BK-789",
        "guestCount": 2,
        "eventDate": "2024-01-20"
      }
    }
  ]'
```

### POST /api/v1/notifications/process
**Description**: Manually triggers processing of notifications for a specific preCode

**Authentication**: Required (API Key only)  
**Roles**: Internal service access

**Query Parameters**:
- `preCode` (optional): Specific preCode to process. If omitted, processes all pending notifications

**Response**:
```json
{
  "processedCount": 5,
  "status": "completed",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Status Codes**:
- `200`: Success - Processing completed
- `401`: Unauthorized - Invalid API key
- `500`: Internal Server Error - Processing failed

**Example Request**:
```bash
curl -X POST \
  'https://passkey-delphifdc-service.dev.cvent.com/api/v1/notifications/process?preCode=ABC123' \
  -H 'X-API-Key: your-api-key'
```

### POST /api/v1/callback
**Description**: Internal callback endpoint for notification processing status updates

**Authentication**: Internal service access only

**Request Body**:
```json
{
  "notificationId": "string",
  "status": "string",
  "processingResult": {
    "success": true,
    "errorMessage": "string",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Response**:
```json
{
  "acknowledged": true
}
```

### GET /api/v1/emulation/trigger
**Description**: Emulation endpoint for testing notification processing (development/testing only)

**Authentication**: Internal service access

**Query Parameters**:
- `count` (optional): Number of test notifications to generate (default: 1)
- `locationId` (optional): Specific location ID for test data

**Response**:
```json
{
  "generatedNotifications": 3,
  "status": "triggered"
}
```

## Data Models

### NotificationRequest
```json
{
  "id": "string",
  "eventDetail": {
    "locationId": "string",
    "resourceId": "string",
    "eventType": "string",
    "timestamp": "string (ISO 8601)",
    "preCode": "string",
    "bookingId": "string"
  },
  "guestInformation": {
    "primaryGuest": {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string"
    },
    "guestCount": 0,
    "specialRequests": ["string"]
  },
  "bookingDetails": {
    "checkInDate": "string (YYYY-MM-DD)",
    "checkOutDate": "string (YYYY-MM-DD)",
    "roomType": "string",
    "rateCode": "string",
    "totalAmount": 0.00,
    "currency": "string"
  },
  "metadata": {
    "source": "string",
    "version": "string",
    "correlationId": "string"
  }
}
```

### EventDetail
```json
{
  "locationId": "string",
  "resourceId": "string",
  "eventType": "string",
  "timestamp": "string (ISO 8601)",
  "preCode": "string",
  "bookingId": "string",
  "eventCategory": "string",
  "priority": "string"
}
```

### Error Response
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string",
    "timestamp": "string (ISO 8601)",
    "correlationId": "string"
  }
}
```

## Event Types

### Supported Event Types
- `booking_created`: New booking created in Amadeus
- `booking_modified`: Existing booking updated
- `booking_cancelled`: Booking cancelled
- `guest_checkin`: Guest check-in event
- `guest_checkout`: Guest check-out event
- `room_assignment`: Room assignment change
- `rate_change`: Rate modification
- `special_request`: Special request added/modified

### Event Categories
- `reservation`: Reservation-related events
- `guest_service`: Guest service events
- `inventory`: Inventory management events
- `billing`: Billing and payment events

## Rate Limiting

- **Rate Limit**: 1000 requests per minute per API key
- **Burst Limit**: 100 requests per 10-second window
- **Headers**: Rate limit information included in response headers
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Window reset time (Unix timestamp)

## Error Handling

### Common Error Codes
- `INVALID_REQUEST`: Malformed request body or parameters
- `MISSING_REQUIRED_FIELD`: Required field not provided
- `AUTHENTICATION_FAILED`: Invalid or expired authentication
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `PROCESSING_ERROR`: Internal processing failure
- `EXTERNAL_SERVICE_ERROR`: External service integration failure

### Retry Logic
- **Transient Errors**: Automatic retry with exponential backoff
- **Permanent Errors**: No retry, immediate failure response
- **Timeout**: 30-second request timeout
- **Circuit Breaker**: Automatic failover for external service failures

## Monitoring

### Health Check
- **Endpoint**: `/health`
- **Method**: GET
- **Response**: Service health status and dependencies

### Metrics
- Request count and response times
- Error rates by endpoint and error type
- External service call metrics
- Background processing metrics

### Logging
- All requests logged with correlation IDs
- Structured logging in JSON format
- Log levels: ERROR, WARN, INFO, DEBUG
- Sensitive data automatically masked