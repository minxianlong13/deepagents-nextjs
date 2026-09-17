# API Reference

## Base URL

**Local Development**: `http://localhost:4000/`
**Staging**: `https://api-staging.passkey.com/reservation-saga/`
**Production**: `https://api.passkey.com/reservation-saga/`

## Authentication

All API requests require authentication using API keys:

```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

## Endpoints

### Reservation Management

#### POST /reservations
**Description**: Create a new reservation through the saga orchestration process

**Request Body**:
```json
{
  "guestInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123"
  },
  "reservationDetails": {
    "checkIn": "2024-03-15",
    "checkOut": "2024-03-18",
    "roomType": "standard-king",
    "numberOfGuests": 2,
    "specialRequests": "Late checkout if possible"
  },
  "paymentInfo": {
    "method": "credit_card",
    "token": "tok_1234567890",
    "amount": 45000,
    "currency": "USD"
  },
  "propertyId": "prop_12345",
  "eventId": "evt_67890"
}
```

**Response**:
```json
{
  "requestId": "req_abc123def456",
  "status": "processing",
  "reservationId": "res_789012345",
  "estimatedCompletion": "2024-03-01T10:30:00Z",
  "statusUrl": "/reservations/req_abc123def456/status"
}
```

**Status Codes**:
- 202: Accepted - Request submitted for processing
- 400: Bad Request - Invalid request format
- 401: Unauthorized - Invalid API key
- 422: Unprocessable Entity - Business rule validation failed

#### GET /reservations/{requestId}/status
**Description**: Get the current status of a reservation request

**Path Parameters**:
- `requestId` - The unique request identifier returned from the creation call

**Response**:
```json
{
  "requestId": "req_abc123def456",
  "status": "completed",
  "reservationId": "res_789012345",
  "progress": {
    "currentStep": "payment_processed",
    "completedSteps": [
      "validation",
      "inventory_check",
      "payment_authorization",
      "payment_processed"
    ],
    "totalSteps": 4
  },
  "result": {
    "confirmationNumber": "CNF123456789",
    "totalAmount": 45000,
    "currency": "USD"
  },
  "createdAt": "2024-03-01T10:00:00Z",
  "updatedAt": "2024-03-01T10:30:00Z"
}
```

**Status Codes**:
- 200: Success
- 404: Not Found - Request ID not found
- 401: Unauthorized

#### PUT /reservations/{reservationId}
**Description**: Modify an existing reservation

**Path Parameters**:
- `reservationId` - The reservation identifier

**Request Body**:
```json
{
  "modifications": {
    "checkIn": "2024-03-16",
    "checkOut": "2024-03-19",
    "numberOfGuests": 3,
    "roomType": "standard-queen"
  },
  "reason": "Guest requested date change"
}
```

**Response**:
```json
{
  "requestId": "req_def456ghi789",
  "status": "processing",
  "reservationId": "res_789012345",
  "modifications": {
    "checkIn": "2024-03-16",
    "checkOut": "2024-03-19",
    "numberOfGuests": 3,
    "roomType": "standard-queen"
  },
  "statusUrl": "/reservations/req_def456ghi789/status"
}
```

**Status Codes**:
- 202: Accepted
- 400: Bad Request
- 404: Not Found - Reservation not found
- 422: Unprocessable Entity

#### DELETE /reservations/{reservationId}
**Description**: Cancel an existing reservation

**Path Parameters**:
- `reservationId` - The reservation identifier

**Request Body**:
```json
{
  "reason": "Guest cancellation",
  "refundPolicy": "full_refund"
}
```

**Response**:
```json
{
  "requestId": "req_ghi789jkl012",
  "status": "processing",
  "reservationId": "res_789012345",
  "cancellationPolicy": "full_refund",
  "estimatedRefundAmount": 45000,
  "statusUrl": "/reservations/req_ghi789jkl012/status"
}
```

**Status Codes**:
- 202: Accepted
- 400: Bad Request
- 404: Not Found
- 422: Unprocessable Entity

### Batch Operations

#### POST /batch/reservations
**Description**: Submit multiple reservation requests for batch processing

**Request Body**:
```json
{
  "batchId": "batch_20240301_001",
  "reservations": [
    {
      "externalId": "ext_001",
      "guestInfo": { /* guest details */ },
      "reservationDetails": { /* reservation details */ },
      "paymentInfo": { /* payment details */ }
    },
    {
      "externalId": "ext_002",
      "guestInfo": { /* guest details */ },
      "reservationDetails": { /* reservation details */ },
      "paymentInfo": { /* payment details */ }
    }
  ]
}
```

**Response**:
```json
{
  "batchId": "batch_20240301_001",
  "status": "queued",
  "totalRequests": 2,
  "estimatedCompletion": "2024-03-01T11:00:00Z",
  "statusUrl": "/batch/batch_20240301_001/status"
}
```

#### GET /batch/{batchId}/status
**Description**: Get the status of a batch operation

**Path Parameters**:
- `batchId` - The batch identifier

**Response**:
```json
{
  "batchId": "batch_20240301_001",
  "status": "processing",
  "progress": {
    "total": 2,
    "completed": 1,
    "failed": 0,
    "processing": 1
  },
  "results": [
    {
      "externalId": "ext_001",
      "status": "completed",
      "reservationId": "res_789012345",
      "confirmationNumber": "CNF123456789"
    },
    {
      "externalId": "ext_002",
      "status": "processing",
      "requestId": "req_jkl012mno345"
    }
  ]
}
```

### Health and Monitoring

#### GET /health
**Description**: Service health check endpoint

**Response**:
```json
{
  "status": "healthy",
  "version": "1.2.3",
  "timestamp": "2024-03-01T10:00:00Z",
  "dependencies": {
    "dynamodb": "healthy",
    "stepfunctions": "healthy",
    "sqs": "healthy",
    "payment-service": "healthy",
    "inventory-service": "healthy"
  }
}
```

#### GET /metrics
**Description**: Service metrics for monitoring

**Response**:
```json
{
  "requests": {
    "total": 1250,
    "successful": 1200,
    "failed": 50,
    "successRate": 0.96
  },
  "performance": {
    "averageResponseTime": 250,
    "p95ResponseTime": 500,
    "p99ResponseTime": 1000
  },
  "queues": {
    "createQueue": {
      "messagesVisible": 5,
      "messagesInFlight": 2
    },
    "modifyQueue": {
      "messagesVisible": 1,
      "messagesInFlight": 0
    }
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request format",
    "details": [
      {
        "field": "guestInfo.email",
        "message": "Invalid email format"
      }
    ],
    "requestId": "req_error_123",
    "timestamp": "2024-03-01T10:00:00Z"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `UNAUTHORIZED` | Invalid or missing API key | 401 |
| `RESERVATION_NOT_FOUND` | Reservation does not exist | 404 |
| `INVENTORY_UNAVAILABLE` | Requested room/dates not available | 422 |
| `PAYMENT_FAILED` | Payment processing failed | 422 |
| `BUSINESS_RULE_VIOLATION` | Business logic constraint violated | 422 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |
| `SERVICE_UNAVAILABLE` | Downstream service unavailable | 503 |

## Rate Limiting

API requests are rate limited per API key:
- **Standard**: 100 requests per minute
- **Batch Operations**: 10 requests per minute
- **Status Checks**: 1000 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709294400
```

## Webhooks

### Webhook Configuration
Configure webhook endpoints to receive reservation status updates:

```json
{
  "webhookUrl": "https://your-app.com/webhooks/reservations",
  "events": ["reservation.completed", "reservation.failed", "reservation.cancelled"],
  "secret": "webhook_secret_key"
}
```

### Webhook Payload
```json
{
  "event": "reservation.completed",
  "requestId": "req_abc123def456",
  "reservationId": "res_789012345",
  "timestamp": "2024-03-01T10:30:00Z",
  "data": {
    "confirmationNumber": "CNF123456789",
    "totalAmount": 45000,
    "currency": "USD"
  }
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const PasskeyReservationClient = require('@passkey/reservation-saga-client');

const client = new PasskeyReservationClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.passkey.com/reservation-saga'
});

// Create reservation
const reservation = await client.createReservation({
  guestInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com'
  },
  reservationDetails: {
    checkIn: '2024-03-15',
    checkOut: '2024-03-18',
    roomType: 'standard-king'
  }
});

// Check status
const status = await client.getReservationStatus(reservation.requestId);
```

### cURL Examples
```bash
# Create reservation
curl -X POST https://api.passkey.com/reservation-saga/reservations \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "guestInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "reservationDetails": {
      "checkIn": "2024-03-15",
      "checkOut": "2024-03-18",
      "roomType": "standard-king"
    }
  }'

# Check status
curl -X GET https://api.passkey.com/reservation-saga/reservations/req_abc123def456/status \
  -H "Authorization: Bearer your-api-key"
```