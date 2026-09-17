# API Reference

## Base URL

The service runs on different environments with the following base URLs:
- **Development**: `https://passkey-hotel-importer-dev.cvent.com`
- **Staging**: `https://passkey-hotel-importer-staging.cvent.com`
- **Production**: `https://passkey-hotel-importer.cvent.com`

## Authentication

All endpoints require OAuth authentication with ADMIN role authorization.

**Headers Required:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Endpoints

### Import Hotel Data

Import complete hotel information from an external provider to Passkey.

**Endpoint:** `POST /v1/venues/{venueId}/import/hotel`

**Path Parameters:**
- `venueId` (UUID, required) - The unique identifier of the venue

**Request Body:**
```json
{
  "sourceProvider": "CHOICE",
  "targetProvider": "PASSKEY",
  "imagesProvider": "CHOICE"
}
```

**Request Fields:**
- `sourceProvider` (string, required) - Source hotel data provider
- `targetProvider` (string, required) - Target system for import
- `imagesProvider` (string, optional) - Provider for hotel images

**Response:**
```json
{
  "ids": {
    "CHOICE": "12345",
    "PASSKEY": "67890"
  },
  "message": "Hotel imported successfully"
}
```

**Status Codes:**
- `200 OK` - Hotel imported successfully
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Venue or provider not found
- `500 Internal Server Error` - Import operation failed
- `207 Multi-Status` - Partial success with warnings

**Example Request:**
```bash
curl -X POST \
  https://passkey-hotel-importer.cvent.com/v1/venues/123e4567-e89b-12d3-a456-426614174000/import/hotel \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceProvider": "CHOICE",
    "targetProvider": "PASSKEY",
    "imagesProvider": "CHOICE"
  }'
```

---

### Import Hotel Rooms

Import room information and configurations for a hotel.

**Endpoint:** `POST /v1/venues/{venueId}/import/rooms`

**Path Parameters:**
- `venueId` (UUID, required) - The unique identifier of the venue

**Request Body:**
```json
{
  "sourceProvider": "CHOICE",
  "targetProvider": "PASSKEY",
  "imagesProvider": "CHOICE"
}
```

**Request Fields:**
- `sourceProvider` (string, required) - Source room data provider
- `targetProvider` (string, required) - Target system for import
- `imagesProvider` (string, optional) - Provider for room images

**Response:**
```json
{
  "ids": {
    "CHOICE": "12345",
    "PASSKEY": "67890"
  },
  "message": "Rooms imported successfully"
}
```

**Status Codes:**
- `200 OK` - Rooms imported successfully
- `400 Bad Request` - Invalid request or validation failure
- `404 Not Found` - Venue or hotel not found
- `500 Internal Server Error` - Import operation failed
- `207 Multi-Status` - Partial success with image import issues

**Example Request:**
```bash
curl -X POST \
  https://passkey-hotel-importer.cvent.com/v1/venues/123e4567-e89b-12d3-a456-426614174000/import/rooms \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceProvider": "CHOICE",
    "targetProvider": "PASSKEY",
    "imagesProvider": "CHOICE"
  }'
```

---

### Import Hotel Images

Import hotel and room images from an external provider.

**Endpoint:** `POST /v1/venues/{venueId}/import/images`

**Path Parameters:**
- `venueId` (UUID, required) - The unique identifier of the venue

**Request Body:**
```json
{
  "imagesProvider": "CHOICE",
  "targetProvider": "PASSKEY"
}
```

**Request Fields:**
- `imagesProvider` (string, required) - Source image provider
- `targetProvider` (string, required) - Target system for import

**Response:**
```json
{
  "ids": {
    "CHOICE": "12345",
    "PASSKEY": "67890"
  },
  "message": "Images imported successfully"
}
```

**Status Codes:**
- `200 OK` - Images imported successfully
- `400 Bad Request` - Invalid request or S3 storage error
- `404 Not Found` - Venue or images not found
- `500 Internal Server Error` - Import operation failed

**Example Request:**
```bash
curl -X POST \
  https://passkey-hotel-importer.cvent.com/v1/venues/123e4567-e89b-12d3-a456-426614174000/import/images \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "imagesProvider": "CHOICE",
    "targetProvider": "PASSKEY"
  }'
```

---

### Assign Hotel to Venue

Assign an existing hotel to a venue in Passkey.

**Endpoint:** `POST /v1/venues/{venueId}/hotel/assign`

**Path Parameters:**
- `venueId` (UUID, required) - The unique identifier of the venue

**Request Body:**
```json
{
  "sourceProvider": "CHOICE",
  "targetProvider": "PASSKEY"
}
```

**Request Fields:**
- `sourceProvider` (string, required) - Source hotel provider
- `targetProvider` (string, required) - Target system

**Response:**
```json
{
  "ids": {
    "CHOICE": "12345",
    "PASSKEY": "67890"
  },
  "message": "Hotel assigned successfully"
}
```

**Status Codes:**
- `200 OK` - Hotel assigned successfully
- `400 Bad Request` - Invalid assignment request
- `404 Not Found` - Hotel or venue not found
- `500 Internal Server Error` - Assignment operation failed

**Example Request:**
```bash
curl -X POST \
  https://passkey-hotel-importer.cvent.com/v1/venues/123e4567-e89b-12d3-a456-426614174000/hotel/assign \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceProvider": "CHOICE",
    "targetProvider": "PASSKEY"
  }'
```

---

### Unassign Hotel from Venue

Remove hotel assignment from a venue in Passkey.

**Endpoint:** `POST /v1/venues/{venueId}/hotel/unassign`

**Path Parameters:**
- `venueId` (UUID, required) - The unique identifier of the venue

**Request Body:**
```json
{
  "sourceProvider": "CHOICE",
  "targetProvider": "PASSKEY"
}
```

**Request Fields:**
- `sourceProvider` (string, required) - Source hotel provider
- `targetProvider` (string, required) - Target system

**Response:**
```json
{
  "ids": {
    "CHOICE": "12345",
    "PASSKEY": "67890"
  },
  "message": "Hotel unassigned successfully"
}
```

**Status Codes:**
- `200 OK` - Hotel unassigned successfully
- `400 Bad Request` - Invalid unassignment request
- `404 Not Found` - Hotel or venue not found
- `500 Internal Server Error` - Unassignment operation failed

**Example Request:**
```bash
curl -X POST \
  https://passkey-hotel-importer.cvent.com/v1/venues/123e4567-e89b-12d3-a456-426614174000/hotel/unassign \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceProvider": "CHOICE",
    "targetProvider": "PASSKEY"
  }'
```

## Common Response Models

### ImportResponse
```json
{
  "ids": {
    "PROVIDER_NAME": "external_id"
  },
  "message": "Operation result message"
}
```

### Error Response
```json
{
  "errors": [
    {
      "field": "sourceProvider",
      "message": "Source provider is required"
    }
  ]
}
```

## Supported Providers

### Current Providers
- **CHOICE** - Choice Hotels International
- **PASSKEY** - Passkey platform
- **ICEPORTAL** - Ice Portal integration

### Provider Combinations

| Source | Target | Images | Supported |
|--------|--------|--------|-----------|
| CHOICE | PASSKEY | CHOICE | ✅ |
| ICEPORTAL | PASSKEY | ICEPORTAL | ✅ |

## Rate Limiting

The service implements standard rate limiting:
- **Requests per minute**: 100 per authenticated user
- **Concurrent requests**: 10 per user
- **Bulk operations**: Limited to 50 venues per request

## Error Handling

### Validation Errors
All endpoints validate request parameters and return structured error responses for invalid data.

### Business Logic Errors
- Provider not supported
- Hotel already exists
- Missing required data
- External service unavailable

### System Errors
- Database connection issues
- S3 storage failures
- External API timeouts

## Monitoring

All API calls are monitored with:
- **Request/Response logging**
- **Performance metrics**
- **Error rate tracking**
- **DataDog integration**

## Testing

Use the following test venue ID for development:
- **Test Venue**: `123e4567-e89b-12d3-a456-426614174000`

**Note**: All operations require valid OAuth tokens with ADMIN role permissions.