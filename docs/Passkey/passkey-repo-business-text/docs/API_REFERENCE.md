# API Reference

## Base URL
`/passkey-business-text/v1`

## Authentication
All endpoints require API key authentication using the `Authorization` header.

```
Authorization: Bearer <api-key>
```

## Business Text Endpoints

### POST /business-text
**Description**: Saves a single business text entry

**Request Body**:
```json
{
  "userId": 12345,
  "businessTextId": "hotel.room.type.standard",
  "locale": "en_US",
  "valueSmall": "Standard Room",
  "valueLarge": "A comfortable standard room with all basic amenities"
}
```

**Response**:
- **204 No Content**: Successfully saved
- **400 Bad Request**: Invalid request data
- **500 Internal Server Error**: Server error

**Example**:
```bash
curl -X POST \
  /passkey-business-text/v1/business-text \
  -H 'Authorization: Bearer <api-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": 12345,
    "businessTextId": "hotel.room.type.standard",
    "locale": "en_US",
    "valueSmall": "Standard Room",
    "valueLarge": "A comfortable standard room with all basic amenities"
  }'
```

### POST /business-text/bulk-save
**Description**: Saves multiple business text entries in bulk

**Request Body**:
```json
[
  {
    "userId": 12345,
    "businessTextId": "hotel.room.type.standard",
    "locale": "en_US",
    "valueSmall": "Standard Room",
    "valueLarge": "A comfortable standard room with all basic amenities"
  },
  {
    "userId": 12345,
    "businessTextId": "hotel.room.type.deluxe",
    "locale": "en_US",
    "valueSmall": "Deluxe Room",
    "valueLarge": "A luxurious deluxe room with premium amenities"
  }
]
```

**Response**:
- **204 No Content**: Successfully saved
- **400 Bad Request**: Invalid request data
- **500 Internal Server Error**: Server error

### GET /business-text
**Description**: Retrieves a single business text entry

**Query Parameters**:
- `businessTextId` (required): The business text identifier
- `localeId` (optional): The locale identifier (e.g., "en_US")

**Response**:
```json
[
  {
    "userId": 12345,
    "businessTextId": "hotel.room.type.standard",
    "locale": "en_US",
    "valueSmall": "Standard Room",
    "valueLarge": "A comfortable standard room with all basic amenities"
  }
]
```

**Status Codes**:
- **200 OK**: Success
- **400 Bad Request**: Invalid parameters
- **404 Not Found**: Business text not found
- **500 Internal Server Error**: Server error

**Example**:
```bash
curl -X GET \
  '/passkey-business-text/v1/business-text?businessTextId=hotel.room.type.standard&localeId=en_US' \
  -H 'Authorization: Bearer <api-key>'
```

### POST /business-text/bulk
**Description**: Retrieves multiple business text entries by IDs

**Query Parameters**:
- `localeId` (optional): The locale identifier

**Request Body**:
```json
[
  "hotel.room.type.standard",
  "hotel.room.type.deluxe",
  "hotel.amenity.wifi"
]
```

**Response**:
```json
[
  {
    "userId": 12345,
    "businessTextId": "hotel.room.type.standard",
    "locale": "en_US",
    "valueSmall": "Standard Room",
    "valueLarge": "A comfortable standard room with all basic amenities"
  },
  {
    "userId": 12345,
    "businessTextId": "hotel.room.type.deluxe",
    "locale": "en_US",
    "valueSmall": "Deluxe Room",
    "valueLarge": "A luxurious deluxe room with premium amenities"
  }
]
```

**Status Codes**:
- **200 OK**: Success
- **400 Bad Request**: Invalid request
- **500 Internal Server Error**: Server error

### DELETE /business-text/{businessTextId}
**Description**: Removes a business text entry by ID

**Path Parameters**:
- `businessTextId` (required): The business text identifier

**Query Parameters**:
- `locale` (required): Locale in format "xx_XX" (e.g., "en_US")

**Response**:
- **204 No Content**: Successfully deleted
- **400 Bad Request**: Invalid parameters
- **404 Not Found**: Business text not found
- **500 Internal Server Error**: Server error

**Example**:
```bash
curl -X DELETE \
  '/passkey-business-text/v1/business-text/hotel.room.type.standard?locale=en_US' \
  -H 'Authorization: Bearer <api-key>'
```

### POST /business-text/business-text-id
**Description**: Generates a unique business text ID based on business elements

**Request Body**:
```json
{
  "elementType": "HOTEL_ROOM_TYPE",
  "elements": [
    {
      "type": "HOTEL",
      "id": "hotel123"
    },
    {
      "type": "ROOM_TYPE",
      "id": "standard"
    }
  ]
}
```

**Response**:
```json
"hotel.hotel123.roomtype.standard"
```

**Status Codes**:
- **200 OK**: Success
- **400 Bad Request**: Invalid request
- **500 Internal Server Error**: Server error

## Locale Endpoints

### GET /locales
**Description**: Retrieves all supported locales

**Response**:
```json
[
  {
    "id": "en_US",
    "name": "English (United States)",
    "language": "en",
    "country": "US"
  },
  {
    "id": "es_ES",
    "name": "Spanish (Spain)",
    "language": "es",
    "country": "ES"
  }
]
```

**Status Codes**:
- **200 OK**: Success
- **500 Internal Server Error**: Server error

### GET /locales/{localeId}
**Description**: Retrieves a specific locale by ID

**Path Parameters**:
- `localeId` (required): The locale identifier (e.g., "en_US")

**Response**:
```json
{
  "id": "en_US",
  "name": "English (United States)",
  "language": "en",
  "country": "US"
}
```

**Status Codes**:
- **200 OK**: Success
- **404 Not Found**: Locale not found
- **500 Internal Server Error**: Server error

## Country Endpoints

### GET /countries
**Description**: Retrieves all supported countries

**Query Parameters**:
- `localeId` (optional): Filter countries by locale

**Response**:
```json
[
  {
    "code": "US",
    "name": "United States",
    "localizedName": "United States"
  },
  {
    "code": "ES",
    "name": "Spain",
    "localizedName": "España"
  }
]
```

**Status Codes**:
- **200 OK**: Success
- **500 Internal Server Error**: Server error

### GET /countries/{countryCode}
**Description**: Retrieves a specific country by code

**Path Parameters**:
- `countryCode` (required): The country code (e.g., "US")

**Query Parameters**:
- `localeId` (optional): Locale for localized country name

**Response**:
```json
{
  "code": "US",
  "name": "United States",
  "localizedName": "United States"
}
```

**Status Codes**:
- **200 OK**: Success
- **404 Not Found**: Country not found
- **500 Internal Server Error**: Server error

## Custom Business Text Endpoints

### POST /custom-business-text
**Description**: Saves custom business text overrides

**Request Body**:
```json
{
  "userId": 12345,
  "businessTextId": "custom.hotel.welcome.message",
  "locale": "en_US",
  "valueSmall": "Welcome!",
  "valueLarge": "Welcome to our hotel! We hope you enjoy your stay."
}
```

**Response**:
- **204 No Content**: Successfully saved
- **400 Bad Request**: Invalid request data
- **500 Internal Server Error**: Server error

### GET /custom-business-text
**Description**: Retrieves custom business text entries

**Query Parameters**:
- `userId` (required): The user ID
- `businessTextId` (optional): Specific business text ID
- `localeId` (optional): Locale filter

**Response**:
```json
[
  {
    "userId": 12345,
    "businessTextId": "custom.hotel.welcome.message",
    "locale": "en_US",
    "valueSmall": "Welcome!",
    "valueLarge": "Welcome to our hotel! We hope you enjoy your stay."
  }
]
```

**Status Codes**:
- **200 OK**: Success
- **400 Bad Request**: Invalid parameters
- **500 Internal Server Error**: Server error

## OpenAPI Documentation

### GET /openapi.json
**Description**: Returns the OpenAPI specification in JSON format

**Response**: OpenAPI 3.0 specification document

### GET /openapi.yaml
**Description**: Returns the OpenAPI specification in YAML format

**Response**: OpenAPI 3.0 specification document

## Error Responses

All endpoints return consistent error responses:

```json
{
  "errorCodeType": "UNKNOWN",
  "httpRequestId": "uuid-string",
  "message": "Error description",
  "details": "Additional error details"
}
```

## Rate Limiting

The service implements rate limiting through the passkey-rlm service. Clients should handle:
- **429 Too Many Requests**: Rate limit exceeded

## Data Models

### BusinessText
```json
{
  "userId": "number (required)",
  "businessTextId": "string (required)",
  "locale": "string (required)",
  "valueSmall": "string (optional)",
  "valueLarge": "string (optional)"
}
```

### BusinessTextElement
```json
{
  "elementType": "string (required)",
  "elements": [
    {
      "type": "string (required)",
      "id": "string (required)"
    }
  ]
}
```

### Locale
```json
{
  "id": "string",
  "name": "string",
  "language": "string",
  "country": "string"
}
```

### Country
```json
{
  "code": "string",
  "name": "string",
  "localizedName": "string"
}
```