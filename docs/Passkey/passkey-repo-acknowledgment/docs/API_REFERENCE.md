# API Reference

## Base URL
`https://api.cvent.com/passkey-acknowledgement/v1/acknowledgement`

## Authentication

All endpoints require authentication using one of the following methods:

- **API Key**: Include `X-API-Key` header with valid API key
- **Bearer Token**: Include `Authorization: Bearer <token>` header

## Endpoints

### POST /singleReservationAcknowledgement

**Description**: Send acknowledgment for a single hotel reservation

**Request Body**:
```json
{
  "reservationId": 12345,
  "reservationStatus": 1,
  "sendToPrimary": true,
  "secondaryContactEmailList": "guest2@example.com,guest3@example.com",
  "checkSenAckPreference": true,
  "requiredTag": "CONFIRMATION"
}
```

**Request Parameters**:
- `reservationId` (integer, required): Unique identifier for the reservation
- `reservationStatus` (integer, required): Current status of the reservation
- `sendToPrimary` (boolean, optional): Whether to send acknowledgment to primary contact
- `secondaryContactEmailList` (string, optional): Comma-separated list of secondary email addresses
- `checkSenAckPreference` (boolean, optional): Whether to validate acknowledgment preferences
- `requiredTag` (string, optional): Tag required for acknowledgment processing

**Response**:
```json
{
  "reservationAcknowledgementLogId": 67890,
  "acknowledgementTaskId": 11111,
  "acknowledgementCreatedSystime": 1640995200000
}
```

**Response Fields**:
- `reservationAcknowledgementLogId` (integer): Unique ID for the acknowledgment log entry
- `acknowledgementTaskId` (integer): ID of the background task processing the acknowledgment
- `acknowledgementCreatedSystime` (integer): Unix timestamp when acknowledgment was created

**Status Codes**:
- `200`: Acknowledgment successfully queued
- `400`: Invalid request parameters
- `401`: Authentication failed
- `403`: Insufficient permissions
- `500`: Internal server error

**Example cURL**:
```bash
curl -X POST \
  https://api.cvent.com/passkey-acknowledgement/v1/acknowledgement/singleReservationAcknowledgement \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: your-api-key' \
  -d '{
    "reservationId": 12345,
    "reservationStatus": 1,
    "sendToPrimary": true,
    "checkSenAckPreference": true
  }'
```

### POST /multiReservationAcknowledgement

**Description**: Send acknowledgment for multiple reservations (group booking)

**Request Body**:
```json
{
  "masterAckNumber": "GRP-2024-001",
  "sendToPrimary": true,
  "secondaryContactEmailList": "organizer@company.com,assistant@company.com",
  "sendSingleAcks": false
}
```

**Request Parameters**:
- `masterAckNumber` (string, required): Master acknowledgment number for the group
- `sendToPrimary` (boolean, optional): Whether to send acknowledgment to primary contact
- `secondaryContactEmailList` (string, optional): Comma-separated list of secondary email addresses
- `sendSingleAcks` (boolean, optional): Whether to also send individual acknowledgments for each reservation

**Response**:
```json
{
  "reservationAcknowledgementLogId": 67891,
  "acknowledgementTaskId": 11112,
  "acknowledgementCreatedSystime": 1640995260000
}
```

**Response Fields**:
- `reservationAcknowledgementLogId` (integer): Unique ID for the master acknowledgment log entry
- `acknowledgementTaskId` (integer): ID of the background task processing the group acknowledgment
- `acknowledgementCreatedSystime` (integer): Unix timestamp when acknowledgment was created

**Status Codes**:
- `200`: Group acknowledgment successfully queued
- `400`: Invalid request parameters
- `401`: Authentication failed
- `403`: Insufficient permissions
- `500`: Internal server error

**Example cURL**:
```bash
curl -X POST \
  https://api.cvent.com/passkey-acknowledgement/v1/acknowledgement/multiReservationAcknowledgement \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: your-api-key' \
  -d '{
    "masterAckNumber": "GRP-2024-001",
    "sendToPrimary": true,
    "sendSingleAcks": false
  }'
```

## Error Responses

All endpoints return consistent error responses in the following format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Reservation ID is required",
    "details": {
      "field": "reservationId",
      "reason": "missing_required_field"
    }
  }
}
```

### Common Error Codes

- `INVALID_REQUEST`: Request parameters are invalid or missing
- `AUTHENTICATION_FAILED`: API key or bearer token is invalid
- `AUTHORIZATION_FAILED`: Insufficient permissions for the operation
- `RESERVATION_NOT_FOUND`: Specified reservation does not exist
- `PREFERENCE_CHECK_FAILED`: Acknowledgment preferences prevent sending
- `INTERNAL_ERROR`: Unexpected server error occurred

## Rate Limiting

- **Rate Limit**: 1000 requests per minute per API key
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when rate limit resets

## Webhooks

The service supports webhook notifications for acknowledgment status updates:

### Webhook Events

- `acknowledgment.sent`: Acknowledgment successfully delivered
- `acknowledgment.failed`: Acknowledgment delivery failed
- `acknowledgment.bounced`: Email bounced back

### Webhook Payload

```json
{
  "event": "acknowledgment.sent",
  "timestamp": 1640995320000,
  "data": {
    "acknowledgmentId": 67890,
    "reservationId": 12345,
    "status": "delivered",
    "recipient": "guest@example.com"
  }
}
```

## SDK and Client Libraries

### Java Client

```xml
<dependency>
  <groupId>com.cvent.passkey</groupId>
  <artifactId>passkey-acknowledgment-java-client</artifactId>
  <version>1.0.73</version>
</dependency>
```

**Usage Example**:
```java
PasskeyAcknowledgmentClient client = new PasskeyAcknowledgmentClient(
    "https://api.cvent.com", 
    "your-api-key"
);

AcknowledgementRequest request = new AcknowledgementRequest()
    .setReservationId(12345L)
    .setReservationStatus(1L)
    .setSendToPrimary(true);

AcknowledgementResponse response = client.sendSingleAck(request);
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- **JSON**: `/passkey-acknowledgement/v1/openapi.json`
- **YAML**: `/passkey-acknowledgement/v1/openapi.yaml`

## Testing

### Postman Collection

A Postman collection with example requests is available in the repository:
`/docs/postman/passkey-acknowledgment.postman_collection.json`

### Test Environment

- **Base URL**: `https://api-dev.cvent.com/passkey-acknowledgement/v1/acknowledgement`
- **Test API Key**: Contact the Cherry Pickers team for test credentials