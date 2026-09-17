# API Reference

## Base URL
`https://api.passkey.com/sputnik` (Production)
`https://api-dev.passkey.com/sputnik` (Development)

## Authentication

All API endpoints require authentication using one of the following methods:
- **API Key**: Include `Authorization` header with API key
- **JWT Token**: Include `Authorization` header with Bearer token

## Endpoints

### POST /v1/reservation-transfer
**Description**: Initiates a single reservation transfer to a vendor system

**Headers**:
- `Authorization`: API key or JWT token
- `Content-Type`: application/json

**Request Body**:
```json
{
  "reservationId": "string",
  "eventId": "number",
  "hotelId": "number",
  "vendorType": "amadeus|derbysoft|hilton|ohip|shiji",
  "transferType": "create|update|cancel",
  "scheduledDate": "ISO 8601 date string (optional)",
  "priority": "high|normal|low"
}
```

**Response**:
```json
{
  "transferId": "string",
  "status": "success|pending|failed",
  "message": "string",
  "vendorConfirmationId": "string (optional)"
}
```

**Status Codes**:
- 200: Transfer initiated successfully
- 400: Invalid request parameters
- 401: Unauthorized
- 500: Internal server error

---

### POST /v1/bulk-transfer
**Description**: Initiates bulk reservation transfers for multiple reservations

**Headers**:
- `Authorization`: API key or JWT token
- `Content-Type`: application/json

**Request Body**:
```json
{
  "eventId": "number",
  "hotelId": "number",
  "vendorType": "amadeus|derbysoft|hilton|ohip|shiji",
  "transferType": "create|update|cancel",
  "reservations": [
    {
      "reservationId": "string",
      "priority": "high|normal|low"
    }
  ],
  "scheduledDate": "ISO 8601 date string (optional)"
}
```

**Response**:
```json
{
  "bulkTransferId": "string",
  "status": "accepted",
  "totalReservations": "number",
  "message": "Bulk transfer initiated"
}
```

**Status Codes**:
- 202: Bulk transfer accepted for processing
- 400: Invalid request parameters
- 401: Unauthorized
- 500: Internal server error

---

### POST /v1/block-transfer
**Description**: Initiates a block transfer for room inventory

**Headers**:
- `Authorization`: API key or JWT token
- `Content-Type`: application/json

**Request Body**:
```json
{
  "eventId": "number",
  "hotelId": "number",
  "vendorType": "amadeus|derbysoft|hilton|ohip|shiji",
  "blockDetails": {
    "blockId": "string",
    "roomType": "string",
    "quantity": "number",
    "startDate": "ISO 8601 date string",
    "endDate": "ISO 8601 date string"
  }
}
```

**Response**:
```json
{
  "blockTransferId": "string",
  "status": "success|pending|failed",
  "message": "string",
  "vendorBlockId": "string (optional)"
}
```

**Status Codes**:
- 200: Block transfer initiated successfully
- 400: Invalid request parameters
- 401: Unauthorized
- 500: Internal server error

---

### GET /v1/scheduled-reservation-transfers/event/{eventId}
**Description**: Retrieves scheduled transfers for a specific event

**Path Parameters**:
- `eventId` - Event identifier (number)

**Query Parameters**:
- `hotelId` - Filter by hotel ID (optional)
- `status` - Filter by transfer status (optional)
- `limit` - Maximum number of results (default: 100)
- `offset` - Pagination offset (default: 0)

**Response**:
```json
{
  "transfers": [
    {
      "transferId": "string",
      "reservationId": "string",
      "hotelId": "number",
      "vendorType": "string",
      "status": "scheduled|processing|completed|failed",
      "scheduledDate": "ISO 8601 date string",
      "createdAt": "ISO 8601 date string"
    }
  ],
  "totalCount": "number",
  "hasMore": "boolean"
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Event not found
- 500: Internal server error

---

### GET /v1/scheduled-reservation-transfers/event/{eventId}/reservation/{reservationId}
**Description**: Retrieves a specific scheduled transfer

**Path Parameters**:
- `eventId` - Event identifier (number)
- `reservationId` - Reservation identifier (string)

**Response**:
```json
{
  "transferId": "string",
  "reservationId": "string",
  "eventId": "number",
  "hotelId": "number",
  "vendorType": "string",
  "transferType": "string",
  "status": "scheduled|processing|completed|failed",
  "scheduledDate": "ISO 8601 date string",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "attempts": "number",
  "lastError": "string (optional)"
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Transfer not found
- 500: Internal server error

---

### DELETE /v1/scheduled-reservation-transfers/event/{eventId}
**Description**: Cancels all scheduled transfers for an event

**Path Parameters**:
- `eventId` - Event identifier (number)

**Response**:
```json
{
  "message": "Scheduled transfers cancelled",
  "cancelledCount": "number"
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Event not found
- 500: Internal server error

---

### DELETE /v1/scheduled-reservation-transfers/event/{eventId}/hotel/{hotelId}
**Description**: Cancels scheduled transfers for a specific hotel within an event

**Path Parameters**:
- `eventId` - Event identifier (number)
- `hotelId` - Hotel identifier (number)

**Response**:
```json
{
  "message": "Scheduled transfers cancelled",
  "cancelledCount": "number"
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Event or hotel not found
- 500: Internal server error

---

### POST /v1/audit/inbound-transfer
**Description**: Audits an inbound transfer from a vendor system

**Headers**:
- `Authorization`: API key or JWT token
- `Content-Type`: application/json

**Request Body**:
```json
{
  "vendorType": "amadeus|derbysoft|hilton|ohip|shiji",
  "vendorTransferId": "string",
  "reservationId": "string",
  "transferData": "object",
  "timestamp": "ISO 8601 date string"
}
```

**Response**:
```json
{
  "auditId": "string",
  "status": "recorded",
  "message": "Transfer audit recorded successfully"
}
```

**Status Codes**:
- 200: Audit recorded successfully
- 400: Invalid request parameters
- 401: Unauthorized
- 500: Internal server error

---

### POST /v1/vendor-authorization
**Description**: Authorizes vendor access for transfer operations

**Headers**:
- `Authorization`: API key or JWT token
- `Content-Type`: application/json

**Request Body**:
```json
{
  "vendorType": "amadeus|derbysoft|hilton|ohip|shiji",
  "credentials": {
    "username": "string",
    "password": "string",
    "endpoint": "string",
    "additionalParams": "object (optional)"
  }
}
```

**Response**:
```json
{
  "authorizationId": "string",
  "status": "authorized|failed",
  "message": "string",
  "expiresAt": "ISO 8601 date string (optional)"
}
```

**Status Codes**:
- 200: Authorization successful
- 400: Invalid credentials
- 401: Unauthorized
- 500: Internal server error

---

### POST /v1/send-result-message
**Description**: Sends transfer result message to vendor (internal use)

**Headers**:
- `Authorization`: API key or JWT token
- `Content-Type`: application/json

**Request Body**:
```json
{
  "transferId": "string",
  "vendorType": "string",
  "result": "success|failure",
  "message": "string",
  "vendorData": "object (optional)"
}
```

**Response**:
```json
{
  "messageId": "string",
  "status": "sent|failed",
  "message": "string"
}
```

**Status Codes**:
- 200: Message sent successfully
- 400: Invalid request parameters
- 401: Unauthorized
- 500: Internal server error

---

### POST /v1/trigger-event/integration-configuration-changed
**Description**: Triggers integration configuration change event (internal use)

**Headers**:
- `Authorization`: API key or JWT token
- `Content-Type`: application/json

**Request Body**:
```json
{
  "eventId": "number",
  "hotelId": "number",
  "vendorType": "string",
  "configurationType": "string",
  "changeDetails": "object"
}
```

**Response**:
```json
{
  "eventPublished": "boolean",
  "eventId": "string",
  "message": "Integration configuration event published"
}
```

**Status Codes**:
- 200: Event published successfully
- 400: Invalid request parameters
- 401: Unauthorized
- 500: Internal server error

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "ackEmailSent": "boolean (optional)",
  "errorCode": "string (optional)",
  "details": "object (optional)"
}
```

## Rate Limiting

- Standard endpoints: 1000 requests per minute per API key
- Bulk operations: 100 requests per minute per API key
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

## Webhooks

The service supports webhook notifications for transfer status updates. Configure webhook endpoints in the vendor configuration to receive real-time updates on transfer progress.

### Webhook Payload Example:
```json
{
  "transferId": "string",
  "reservationId": "string",
  "status": "completed|failed",
  "timestamp": "ISO 8601 date string",
  "vendorResponse": "object (optional)",
  "errorDetails": "object (optional)"
}
```