# API Reference

## Base URL
`https://passkey-addons-service.core.cvent.org`

## Authentication
All endpoints require API key authentication using the `Authorization` header:
```
Authorization: Bearer <api-key>
```

## Endpoints

### Marketable Addons

#### GET /{version}/marketable-addons
**Description**: Search and retrieve available add-ons for purchase

**Path Parameters**:
- `version` - API version (`v1` or `v2`)

**Query Parameters**:
- `blockId` - Block identifier (optional)
- `hotelId` - Hotel identifier (optional)
- `eventId` - Event identifier (optional)
- `filterOptions` - Array of filter options (optional)
- `glCodes` - Array of GL codes for filtering (optional)

**Request Example**:
```bash
GET /passkey-addons/v2/marketable-addons?hotelId=12345&eventId=67890
```

**Response**:
```json
[
  {
    "id": "addon-123",
    "name": "Airport Shuttle",
    "description": "Round-trip airport transportation",
    "price": 25.00,
    "currency": "USD",
    "maxQuantityPerGuest": 2,
    "guestCanSelectQuantity": true,
    "isActive": true
  }
]
```

**Status Codes**:
- 200: Success
- 404: No add-ons found
- 401: Unauthorized

#### POST /{version}/marketable-addons
**Description**: Create a new marketable add-on

**Path Parameters**:
- `version` - API version (`v1` or `v2`)

**Request Body**:
```json
{
  "name": "Spa Package",
  "description": "Full day spa access with massage",
  "price": 150.00,
  "currency": "USD",
  "blockId": 12345,
  "hotelId": 67890,
  "eventId": 11111,
  "guestCanSelectQuantity": true,
  "maxQuantityPerGuest": 1,
  "maxQuantityPerEventFlag": true,
  "maxQuantityPerEvent": 50,
  "isActive": true
}
```

**Response**:
```json
{
  "id": "addon-456",
  "name": "Spa Package",
  "description": "Full day spa access with massage",
  "price": 150.00,
  "currency": "USD",
  "maxQuantityPerGuest": 1,
  "guestCanSelectQuantity": true,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 200: Success
- 400: Bad Request (validation errors)
- 401: Unauthorized

**Validation Rules**:
- Either `blockId` OR (`hotelId` AND `eventId`) must be provided
- If `guestCanSelectQuantity` is true, `maxQuantityPerGuest` must be positive
- If `maxQuantityPerEventFlag` is true, `maxQuantityPerEvent` must be positive

### Reservation Addons

#### POST /v2/reservation-addons/{confirmationNumber}
**Description**: Create associations between a reservation and add-ons

**Path Parameters**:
- `confirmationNumber` - Reservation confirmation number

**Request Body**:
```json
[
  {
    "addonId": "addon-123",
    "quantity": 2,
    "guestId": "guest-456",
    "specialRequests": "Extra towels please"
  },
  {
    "addonId": "addon-789",
    "quantity": 1,
    "guestId": "guest-456"
  }
]
```

**Response**:
```json
[
  {
    "id": "reservation-addon-001",
    "addonId": "addon-123",
    "confirmationNumber": "ABC123456",
    "quantity": 2,
    "guestId": "guest-456",
    "specialRequests": "Extra towels please",
    "status": "CONFIRMED",
    "totalPrice": 50.00,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Status Codes**:
- 201: Created
- 404: Reservation not found
- 400: Bad Request
- 401: Unauthorized

#### PUT /v2/reservation-addons/{confirmationNumber}
**Description**: Update associations between a reservation and add-ons

**Path Parameters**:
- `confirmationNumber` - Reservation confirmation number

**Request Body**:
```json
{
  "requestedAddons": [
    {
      "addonId": "addon-123",
      "quantity": 3,
      "guestId": "guest-456",
      "specialRequests": "Updated request"
    }
  ],
  "reason": "Guest requested quantity change"
}
```

**Response**:
```json
[
  {
    "id": "reservation-addon-001",
    "addonId": "addon-123",
    "confirmationNumber": "ABC123456",
    "quantity": 3,
    "guestId": "guest-456",
    "specialRequests": "Updated request",
    "status": "CONFIRMED",
    "totalPrice": 75.00,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
]
```

**Status Codes**:
- 201: Updated
- 404: Reservation not found
- 400: Bad Request
- 401: Unauthorized

#### GET /{version}/reservation-addons/{confirmationNumber}
**Description**: Retrieve add-ons associated with a reservation

**Path Parameters**:
- `version` - API version (`v1` or `v2`)
- `confirmationNumber` - Reservation confirmation number

**Response**:
```json
[
  {
    "id": "reservation-addon-001",
    "addonId": "addon-123",
    "addonName": "Airport Shuttle",
    "confirmationNumber": "ABC123456",
    "quantity": 2,
    "guestId": "guest-456",
    "guestName": "John Doe",
    "specialRequests": "Extra towels please",
    "status": "CONFIRMED",
    "unitPrice": 25.00,
    "totalPrice": 50.00,
    "currency": "USD",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Status Codes**:
- 200: Success
- 404: Reservation not found
- 401: Unauthorized

#### PATCH /{version}/reservation-addons/{confirmationNumber}
**Description**: Cancel all add-ons associated with a reservation

**Path Parameters**:
- `version` - API version (`v1` or `v2`)
- `confirmationNumber` - Reservation confirmation number

**Response**: No content

**Status Codes**:
- 204: Success (No Content)
- 404: Reservation not found
- 401: Unauthorized

## Error Responses

All error responses follow this format:

```json
{
  "httpRequestId": "req-12345",
  "errorCodeType": "RESERVATION_NOT_FOUND",
  "message": "The specified reservation could not be found",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `RESERVATION_NOT_FOUND` | 404 | Reservation with given confirmation number not found |
| `ASSOCIATE_ID_REQUIRED` | 400 | Either blockId or (hotelId + eventId) required |
| `MAX_QUANTITY_PER_GUEST_BLANK` | 400 | maxQuantityPerGuest required when guestCanSelectQuantity is true |
| `MAX_QUANTITY_PER_GUEST_POSITIVE` | 400 | maxQuantityPerGuest should not be set when guestCanSelectQuantity is false |
| `MAX_QUANTITY_PER_EVENT_BLANK` | 400 | maxQuantityPerEvent required when maxQuantityPerEventFlag is true |
| `MAX_QUANTITY_PER_EVENT_POSITIVE` | 400 | maxQuantityPerEvent should not be set when maxQuantityPerEventFlag is false |
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `VALIDATION_ERROR` | 400 | Request validation failed |

## Rate Limiting

The API implements standard rate limiting:
- 1000 requests per minute per API key
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

## Versioning

The API supports multiple versions:
- **v1**: Legacy version (maintained for backward compatibility)
- **v2**: Current version with enhanced features

Version is specified in the URL path. When no version is specified, v2 is used by default.

## OpenAPI Specification

The complete OpenAPI specification is available at:
- Development: `https://passkey-addons-service-dev.core.cvent.org/openapi.json`
- Production: `https://passkey-addons-service.core.cvent.org/openapi.json`

## SDK and Client Libraries

### Java Client
```xml
<dependency>
    <groupId>com.cvent.passkey-addons</groupId>
    <artifactId>passkey-addons-java-client</artifactId>
    <version>1.1.4</version>
</dependency>
```

### Usage Example
```java
PasskeyAddonsClient client = PasskeyAddonsClient.builder()
    .baseUrl("https://passkey-addons-service.core.cvent.org")
    .apiKey("your-api-key")
    .build();

List<MarketableAddon> addons = client.getMarketableAddons(
    MarketableAddonRequest.builder()
        .hotelId(12345L)
        .eventId(67890L)
        .build()
);
```