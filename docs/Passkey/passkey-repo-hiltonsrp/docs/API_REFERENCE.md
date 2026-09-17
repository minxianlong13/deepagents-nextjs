# API Reference

## Base URL

**Development**: `http://localhost:8080`  
**Production**: `https://passkey-hiltonsrp-service.core.cvent.org`

## Authentication

The service uses internal Cvent authentication mechanisms. External API calls to Hilton use OAuth 2.0 client credentials flow.

## Endpoints

### Health Check

#### GET /health
**Description**: Standard Dropwizard health check endpoint

**Response**:
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "healthy": true
    },
    "hilton-api": {
      "healthy": true
    }
  }
}
```

**Status Codes**:
- 200: Service is healthy
- 503: Service is unhealthy

### SRP Operations

#### POST /hilton-srp/sync
**Description**: Manually trigger SRP mapping synchronization with Hilton

**Request Body**:
```json
{
  "eventCodes": ["EVENT001", "EVENT002"],
  "forceSync": false
}
```

**Response**:
```json
{
  "syncId": "sync-12345",
  "status": "initiated",
  "eventCodesProcessed": 2,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 202: Sync initiated successfully
- 400: Invalid request parameters
- 500: Internal server error

#### GET /hilton-srp/sync/{syncId}
**Description**: Get status of a specific sync operation

**Path Parameters**:
- `syncId` - Unique identifier for the sync operation

**Response**:
```json
{
  "syncId": "sync-12345",
  "status": "completed",
  "eventCodesProcessed": 2,
  "successCount": 2,
  "errorCount": 0,
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": "2024-01-15T10:32:15Z",
  "errors": []
}
```

**Status Codes**:
- 200: Sync status retrieved successfully
- 404: Sync ID not found

### Reservation Management

#### POST /passkey-hilton-srp/reservations
**Description**: Process inbound reservations from Hilton

**Request Body**:
```json
{
  "reservations": [
    {
      "reservationId": "RES123456",
      "eventCode": "EVENT001",
      "guestName": "John Doe",
      "checkInDate": "2024-02-01",
      "checkOutDate": "2024-02-03",
      "roomType": "STANDARD",
      "rate": 150.00,
      "currency": "USD"
    }
  ]
}
```

**Response**:
```json
{
  "processedCount": 1,
  "successCount": 1,
  "errorCount": 0,
  "reservationResults": [
    {
      "reservationId": "RES123456",
      "status": "processed",
      "passkeyReservationId": "PKR789012"
    }
  ]
}
```

**Status Codes**:
- 200: Reservations processed successfully
- 400: Invalid reservation data
- 422: Business validation errors

#### GET /passkey-hilton-srp/reservations/{eventCode}
**Description**: Retrieve reservations for a specific event code

**Path Parameters**:
- `eventCode` - Event code to retrieve reservations for

**Query Parameters**:
- `startDate` - Filter reservations from this date (ISO 8601)
- `endDate` - Filter reservations to this date (ISO 8601)
- `status` - Filter by reservation status (CONFIRMED, CANCELLED, MODIFIED)

**Response**:
```json
{
  "eventCode": "EVENT001",
  "reservations": [
    {
      "reservationId": "RES123456",
      "guestName": "John Doe",
      "checkInDate": "2024-02-01",
      "checkOutDate": "2024-02-03",
      "status": "CONFIRMED",
      "lastModified": "2024-01-15T10:30:00Z"
    }
  ],
  "totalCount": 1
}
```

**Status Codes**:
- 200: Reservations retrieved successfully
- 404: Event code not found

### Configuration and Monitoring

#### GET /admin/metrics
**Description**: Dropwizard metrics endpoint

**Response**: Standard Dropwizard metrics in JSON format

#### GET /admin/ping
**Description**: Simple ping endpoint for monitoring

**Response**: `pong`

#### GET /admin/threads
**Description**: Thread dump for debugging

**Response**: Thread dump information

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid event code format",
    "details": {
      "field": "eventCode",
      "rejectedValue": "INVALID"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Rate Limiting

- Internal endpoints: No rate limiting
- Hilton API calls: Respects Hilton's rate limits (configured per environment)

## Webhooks

The service can be configured to receive webhooks from Hilton for real-time reservation updates:

#### POST /webhooks/hilton/reservations
**Description**: Webhook endpoint for Hilton reservation updates

**Headers**:
- `X-Hilton-Signature`: HMAC signature for request validation

**Request Body**: Hilton-specific reservation update payload

**Response**:
```json
{
  "status": "received",
  "timestamp": "2024-01-15T10:30:00Z"
}
```