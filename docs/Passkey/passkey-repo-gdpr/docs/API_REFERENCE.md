# API Reference

## Base URL
`https://api.cvent.com/{environment}/passkey-gdpr`

Where `{environment}` is one of:
- `dev` - Development environment
- `alpha` - Alpha testing environment  
- `ts50` - Test environment
- `pr50` - Production environment

## Authentication

All API endpoints require authentication via JWT tokens provided by the Cvent auth-service.

**Header Required:**
```
Authorization: Bearer <jwt-token>
```

## Endpoints

### Admin Operations

#### GET /admin/health
**Description**: Health check endpoint for service monitoring

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": "healthy",
    "external_services": "healthy"
  }
}
```

**Status Codes**:
- 200: Service is healthy
- 503: Service is unhealthy

#### GET /admin/info
**Description**: Service information and version details

**Response**:
```json
{
  "service": "passkey-gdpr-service",
  "version": "1.2.2-SNAPSHOT",
  "build_time": "2024-01-15T08:00:00Z",
  "environment": "dev"
}
```

**Status Codes**:
- 200: Success

### GDPR Operations

#### POST /gdpr/obfuscate
**Description**: Obfuscate personal data for a specific user or entity

**Request Body**:
```json
{
  "entityId": "user-12345",
  "entityType": "USER",
  "fields": ["email", "firstName", "lastName", "phoneNumber"],
  "reason": "GDPR_REQUEST",
  "requestId": "req-67890"
}
```

**Response**:
```json
{
  "requestId": "req-67890",
  "status": "COMPLETED",
  "processedFields": ["email", "firstName", "lastName", "phoneNumber"],
  "timestamp": "2024-01-15T10:30:00Z",
  "obfuscatedData": {
    "email": "***@***.com",
    "firstName": "***",
    "lastName": "***",
    "phoneNumber": "***-***-****"
  }
}
```

**Status Codes**:
- 200: Obfuscation completed successfully
- 400: Invalid request parameters
- 404: Entity not found
- 500: Internal server error

#### GET /gdpr/status/{requestId}
**Description**: Check the status of a GDPR obfuscation request

**Path Parameters**:
- `requestId` - Unique identifier for the GDPR request

**Response**:
```json
{
  "requestId": "req-67890",
  "status": "IN_PROGRESS",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z",
  "progress": {
    "totalFields": 4,
    "processedFields": 2,
    "percentComplete": 50
  }
}
```

**Status Codes**:
- 200: Status retrieved successfully
- 404: Request ID not found

### Batch Operations

#### POST /batch/obfuscation
**Description**: Initiate batch obfuscation for multiple entities

**Request Body**:
```json
{
  "batchId": "batch-12345",
  "entities": [
    {
      "entityId": "user-001",
      "entityType": "USER",
      "fields": ["email", "firstName"]
    },
    {
      "entityId": "user-002", 
      "entityType": "USER",
      "fields": ["email", "lastName"]
    }
  ],
  "reason": "BULK_GDPR_REQUEST",
  "priority": "NORMAL"
}
```

**Response**:
```json
{
  "batchId": "batch-12345",
  "status": "QUEUED",
  "totalEntities": 2,
  "estimatedCompletionTime": "2024-01-15T11:00:00Z",
  "trackingUrl": "/batch/status/batch-12345"
}
```

**Status Codes**:
- 202: Batch request accepted and queued
- 400: Invalid batch request
- 413: Batch size exceeds limits

#### GET /batch/status/{batchId}
**Description**: Get the status of a batch obfuscation operation

**Path Parameters**:
- `batchId` - Unique identifier for the batch operation

**Query Parameters**:
- `includeDetails` (optional) - Include detailed progress information (default: false)

**Response**:
```json
{
  "batchId": "batch-12345",
  "status": "IN_PROGRESS",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:45:00Z",
  "progress": {
    "totalEntities": 100,
    "processedEntities": 45,
    "failedEntities": 2,
    "percentComplete": 45
  },
  "estimatedCompletionTime": "2024-01-15T11:15:00Z"
}
```

**Status Codes**:
- 200: Status retrieved successfully
- 404: Batch ID not found

#### DELETE /batch/{batchId}
**Description**: Cancel a batch obfuscation operation

**Path Parameters**:
- `batchId` - Unique identifier for the batch operation

**Response**:
```json
{
  "batchId": "batch-12345",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-15T10:50:00Z",
  "message": "Batch operation cancelled successfully"
}
```

**Status Codes**:
- 200: Batch cancelled successfully
- 404: Batch ID not found
- 409: Batch cannot be cancelled (already completed)

### API Documentation

#### GET /openapi.json
**Description**: OpenAPI specification in JSON format

**Response**: OpenAPI 3.0 specification document

**Status Codes**:
- 200: Specification retrieved successfully

#### GET /openapi.yaml
**Description**: OpenAPI specification in YAML format

**Response**: OpenAPI 3.0 specification document

**Status Codes**:
- 200: Specification retrieved successfully

## Data Models

### ObfuscationRequest
```json
{
  "entityId": "string",
  "entityType": "USER|ORGANIZATION|EVENT",
  "fields": ["string"],
  "reason": "GDPR_REQUEST|DATA_RETENTION|PRIVACY_REQUEST",
  "requestId": "string",
  "metadata": {
    "additionalProp1": "string"
  }
}
```

### BatchRequest
```json
{
  "batchId": "string",
  "entities": [
    {
      "entityId": "string",
      "entityType": "string",
      "fields": ["string"]
    }
  ],
  "reason": "string",
  "priority": "LOW|NORMAL|HIGH",
  "metadata": {
    "additionalProp1": "string"
  }
}
```

### Status Response
```json
{
  "requestId": "string",
  "status": "QUEUED|IN_PROGRESS|COMPLETED|FAILED|CANCELLED",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z",
  "progress": {
    "totalItems": 0,
    "processedItems": 0,
    "failedItems": 0,
    "percentComplete": 0
  },
  "errorDetails": {
    "code": "string",
    "message": "string"
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "entityId",
        "message": "Entity ID is required"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-67890"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `ENTITY_NOT_FOUND` - Requested entity does not exist
- `UNAUTHORIZED` - Authentication required or failed
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMITED` - Too many requests
- `SERVICE_UNAVAILABLE` - External service dependency unavailable
- `INTERNAL_ERROR` - Unexpected server error

## Rate Limiting

API requests are subject to rate limiting:
- **Standard endpoints**: 100 requests per minute per client
- **Batch endpoints**: 10 requests per minute per client
- **Admin endpoints**: 50 requests per minute per client

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```