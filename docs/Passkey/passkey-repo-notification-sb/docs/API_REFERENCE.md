# API Reference

## Base URL

- **Development**: `http://localhost:7000/dev`
- **Staging**: `https://passkey-notification-sb.staging.cvent.cloud`
- **Production**: `https://passkey-notification-sb.prod.cvent.cloud`

## Authentication

All API endpoints require OAuth2 Bearer token authentication.

```http
Authorization: Bearer <your-access-token>
```

### Required Scopes

- `ADMIN`: Required for write operations (POST, PUT, DELETE)
- `READ_ONLY`: Required for read operations (GET)

## Entity Management API

### Create Entity

Creates a new entity in the system.

**Endpoint**: `POST /passkey-notification-sb/v1/entity`

**Required Scope**: `ADMIN`

#### Request

**Headers**:
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Body**:
```json
{
  "id": "string",
  "field": "string",
  "anotherField": "string",
  "complexEntity": {
    "complex": 0
  }
}
```

#### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the entity |
| `field` | string | Yes | Primary field value |
| `anotherField` | string | Yes | Secondary field value |
| `complexEntity` | object | Yes | Complex nested entity |
| `complexEntity.complex` | integer | Yes | Complex field value |

#### Response

**Status**: `201 Created`

**Body**:
```json
{
  "id": "string",
  "field": "string",
  "anotherField": "string",
  "complexEntityResponse": {
    "complex": 0
  }
}
```

#### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Entity identifier |
| `field` | string | Primary field value |
| `anotherField` | string | Secondary field value |
| `complexEntityResponse` | object | Complex response entity |
| `complexEntityResponse.complex` | integer | Complex field value |

#### Example

**Request**:
```bash
curl -X POST "http://localhost:7000/dev/passkey-notification-sb/v1/entity" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "id": "entity-123",
    "field": "sample-field",
    "anotherField": "another-sample",
    "complexEntity": {
      "complex": 42
    }
  }'
```

**Response**:
```json
{
  "id": "entity-123",
  "field": "sample-field",
  "anotherField": "another-sample",
  "complexEntityResponse": {
    "complex": 42
  }
}
```

### Get Entity

Retrieves an entity by its ID.

**Endpoint**: `GET /passkey-notification-sb/v1/entity/{id}`

**Required Scope**: `READ_ONLY`

#### Request

**Headers**:
```http
Authorization: Bearer <token>
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Entity identifier |

#### Response

**Status**: `200 OK`

**Body**:
```json
{
  "id": "string",
  "field": "string",
  "anotherField": "string",
  "complexEntityResponse": {
    "complex": 0
  }
}
```

#### Example

**Request**:
```bash
curl -X GET "http://localhost:7000/dev/passkey-notification-sb/v1/entity/entity-123" \
  -H "Authorization: Bearer your-token"
```

**Response**:
```json
{
  "id": "entity-123",
  "field": "field",
  "anotherField": "anotherField",
  "complexEntityResponse": {
    "complex": 5
  }
}
```

## Health & Monitoring API

### Health Check

Returns the health status of the service.

**Endpoint**: `GET /tasks/ok`

**Authentication**: Not required

#### Response

**Status**: `200 OK`

**Body**:
```json
{
  "status": "UP"
}
```

#### Example

**Request**:
```bash
curl -X GET "http://localhost:7001/tasks/ok"
```

### Configuration Info

Returns configuration information about the service.

**Endpoint**: `GET /tasks/config`

**Authentication**: Not required

#### Response

**Status**: `200 OK`

**Body**:
```json
{
  "application": {
    "name": "passkey-notification-sb",
    "version": "0.3.2"
  },
  "environment": "dev"
}
```

## Error Responses

### Standard Error Format

All error responses follow this format:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/passkey-notification-sb/v1/entity"
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| `200` | OK - Request successful |
| `201` | Created - Resource created successfully |
| `400` | Bad Request - Invalid request data |
| `401` | Unauthorized - Missing or invalid authentication |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource not found |
| `500` | Internal Server Error - Server error |

### Common Error Scenarios

#### Authentication Errors

**Status**: `401 Unauthorized`

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "path": "/passkey-notification-sb/v1/entity"
}
```

#### Authorization Errors

**Status**: `403 Forbidden`

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Insufficient scope for this resource",
  "path": "/passkey-notification-sb/v1/entity"
}
```

#### Validation Errors

**Status**: `400 Bad Request`

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for object='entity'. Error count: 1",
  "path": "/passkey-notification-sb/v1/entity"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. Future versions may include:

- Per-user rate limits
- Per-endpoint rate limits
- Burst capacity handling

## API Versioning

The API uses URL path versioning:

- Current version: `v1`
- Future versions will be available at `/v2`, `/v3`, etc.
- Backward compatibility will be maintained for at least one major version

## Request/Response Headers

### Standard Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | OAuth2 Bearer token |
| `Content-Type` | Yes (for POST) | Must be `application/json` |
| `Accept` | No | Defaults to `application/json` |

### Standard Response Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | Always `application/json` |
| `X-Request-ID` | Unique request identifier for tracing |

## SDK and Client Libraries

Currently, the following client libraries are available:

### Java Client

Located in `packages/passkey-notification-sb/java-client/`

```java
// Example usage
PasskeyNotificationClient client = new PasskeyNotificationClient(
    "https://api.example.com", 
    "your-access-token"
);

Entity entity = Entity.builder()
    .withId("entity-123")
    .withField("sample")
    .build();

ResponseEntity response = client.createEntity(entity);
```

## Testing

### Integration Tests

Integration tests are available in the `it` package and can be run with:

```bash
mvn test -Prun-it
```

### API Testing Tools

Recommended tools for API testing:

- **Postman**: Collection available in the repository
- **curl**: Examples provided in this documentation
- **HTTPie**: Alternative command-line tool
- **Insomnia**: REST client with import capabilities

## Support

For API-related questions or issues:

1. Check the integration tests for usage examples
2. Review the service logs for error details
3. Contact the Passkey team for assistance
4. Create an issue in the repository