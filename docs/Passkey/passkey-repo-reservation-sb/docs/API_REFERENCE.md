# API Reference

## Base URL

The Passkey Reservation SpringBoot service is accessible at:
```
https://{environment}.passkey-reservation-sb.cvent.com
```

All API endpoints are prefixed with `/passkey-reservation-sb/v1/`

## Authentication

All API endpoints require OAuth 2.0 authentication using Bearer tokens.

**Header Format**:
```
Authorization: Bearer {access_token}
```

**Required Scopes**:
- `RESERVATION_READ` - Required for all read operations

## Endpoints

### Reservations

#### GET /reservations/{confNumber}

Retrieves a reservation by its confirmation number.

**Description**: Fetches detailed reservation information for a given confirmation number. The confirmation number must be alphanumeric.

**URL**: `/passkey-reservation-sb/v1/reservations/{confNumber}`

**Method**: `GET`

**Path Parameters**:
- `confNumber` (string, required) - The reservation confirmation number. Must be alphanumeric characters only.

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Example**:
```bash
curl -X GET \
  "https://api.passkey-reservation-sb.cvent.com/passkey-reservation-sb/v1/reservations/ABC123456" \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json"
```

**Response**:

**Success Response (200 OK)**:
```json
{
  "confirmationNumber": "ABC123456",
  "guestName": "John Doe",
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-18",
  "roomType": "Standard King",
  "hotelId": "HTL001",
  "hotelName": "Downtown Convention Hotel",
  "status": "ACTIVE_CONFIRMED",
  "totalAmount": 450.00,
  "currency": "USD",
  "guestDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567"
  },
  "roomDetails": {
    "roomNumber": "1205",
    "bedType": "King",
    "smokingPreference": "NON_SMOKING",
    "accessibilityFeatures": []
  },
  "paymentInfo": {
    "paymentMethod": "CREDIT_CARD",
    "lastFourDigits": "1234",
    "paymentStatus": "PAID"
  },
  "createdDate": "2024-02-15T10:30:00Z",
  "modifiedDate": "2024-02-16T14:22:00Z"
}
```

**Error Responses**:

**400 Bad Request** - Invalid confirmation number format:
```json
{
  "error": "BAD_REQUEST",
  "message": "Invalid confirmation number format. Must be alphanumeric.",
  "timestamp": "2024-01-29T15:30:00Z"
}
```

**401 Unauthorized** - Missing or invalid authentication:
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required. Please provide a valid Bearer token.",
  "timestamp": "2024-01-29T15:30:00Z"
}
```

**403 Forbidden** - Insufficient permissions:
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions. Required scope: RESERVATION_READ",
  "timestamp": "2024-01-29T15:30:00Z"
}
```

**404 Not Found** - Reservation not found:
```json
{
  "error": "NOT_FOUND",
  "message": "Reservation not found for confirmation number: ABC123456",
  "timestamp": "2024-01-29T15:30:00Z"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred while processing your request.",
  "timestamp": "2024-01-29T15:30:00Z"
}
```

**Status Codes**:
- `200` - Success: Reservation found and returned
- `400` - Bad Request: Invalid confirmation number format
- `401` - Unauthorized: Missing or invalid authentication token
- `403` - Forbidden: Insufficient permissions/scopes
- `404` - Not Found: Reservation does not exist
- `500` - Internal Server Error: Unexpected server error

## Legacy Endpoints

The service also provides legacy compatibility endpoints for systems migrating from the original Passkey reservation service. These endpoints maintain backward compatibility while internally using the modern Spring Boot architecture.

### Legacy Reservation Endpoints

Legacy endpoints are available under the `/legacy/` path prefix and maintain the original API contracts for seamless migration.

**Base Path**: `/passkey-reservation-sb/v1/legacy/`

*Note: Detailed legacy endpoint documentation is available in the migration guide located at `src/main/java/com/cvent/passkeyreservationsb/controllers/migration.md`*

## Health and Monitoring Endpoints

### Health Check

**GET /actuator/health**

Returns the health status of the service.

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

### Readiness Probe

**GET /actuator/health/readiness**

Returns readiness status for Kubernetes deployments.

### Liveness Probe

**GET /actuator/health/liveness**

Returns liveness status for Kubernetes deployments.

## Rate Limiting

The service implements rate limiting to ensure fair usage and system stability:

- **Default Limit**: 1000 requests per minute per client
- **Burst Limit**: 100 requests per 10-second window
- **Rate Limit Headers**: Included in responses when limits are approached

**Rate Limit Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error description",
  "timestamp": "2024-01-29T15:30:00Z",
  "path": "/passkey-reservation-sb/v1/reservations/ABC123",
  "details": {
    "field": "Additional error context when applicable"
  }
}
```

**Common Error Codes**:
- `BAD_REQUEST` - Invalid request format or parameters
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Request/Response Headers

### Standard Request Headers
```
Authorization: Bearer {token}     # Required for authentication
Content-Type: application/json    # Required for POST/PUT requests
Accept: application/json          # Recommended
User-Agent: {client-identifier}   # Recommended for tracking
X-Request-ID: {unique-id}        # Optional, for request tracing
```

### Standard Response Headers
```
Content-Type: application/json
X-Request-ID: {request-id}       # Echoed from request or generated
X-Response-Time: {milliseconds}  # Processing time
Cache-Control: no-cache          # Caching policy
```

## Versioning

The API uses URL path versioning:
- Current version: `v1`
- Future versions will be available as `v2`, `v3`, etc.
- Backward compatibility is maintained for at least 12 months after new version releases

## SDK and Client Libraries

### Java Client

A Java client library is available as part of the project:

```xml
<dependency>
    <groupId>com.cvent.passkeyreservationsb</groupId>
    <artifactId>passkey-reservation-sb-java-client</artifactId>
    <version>0.0.10</version>
</dependency>
```

**Usage Example**:
```java
PasskeyReservationClient client = PasskeyReservationClient.builder()
    .baseUrl("https://api.passkey-reservation-sb.cvent.com")
    .accessToken("your_access_token")
    .build();

Optional<Reservation> reservation = client.getReservation("ABC123456");
```

## Testing

### Test Endpoints

In development and staging environments, additional test endpoints are available:

**GET /test/reservations/sample**
Returns a sample reservation for testing purposes.

**POST /test/reservations/reset**
Resets test data (development environment only).

*Note: Test endpoints are not available in production environments.*