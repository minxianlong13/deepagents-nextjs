# API Reference

## Base URL
`https://{environment}.cvent.com/{env}/passkey-file-import/v1/rezhub-reservation-fileimport`

Where:
- `{environment}` is the deployment environment (dev, alpha, ts50, pr50, etc.)
- `{env}` is the environment path segment

## Authentication
All endpoints require API Key authentication:
- **Type**: API Key
- **Header**: `Authorization: Bearer {api-key}`
- **Scheme**: `api_key`

## Endpoints

### POST /import/{schemaName}

**Description**: Initiates the import process by notifying the service of the number of records to be imported. The service responds with the preferred batch size for data transmission.

**Path Parameters**:
- `schemaName` (string, required) - The name of the import schema to use

**Request Body**:
```json
{
  "totalCount": 1500
}
```

**Response**:
```json
{
  "batchSize": 100
}
```

**Status Codes**:
- 200: Success - Returns import strategy with batch size
- 400: Bad Request - Invalid schema name or request format
- 401: Unauthorized - Invalid or missing API key
- 500: Internal Server Error

**Example**:
```bash
curl -X POST \
  "https://dev.cvent.com/dev/passkey-file-import/v1/rezhub-reservation-fileimport/import/rezhub-reservation" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"totalCount": 1500}'
```

---

### POST /importData/{schemaName}

**Description**: Processes the actual import data sent from the file import service. Validates reservation data, maps external confirmation numbers to Passkey acknowledgment numbers, and processes reservations through RezHub.

**Path Parameters**:
- `schemaName` (string, required) - The name of the import schema being used

**Request Body**:
```json
{
  "accountMappingId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "rows": [
    {
      "row": 1,
      "columns": [
        {
          "name": "ackNumber",
          "value": "ACK123456"
        },
        {
          "name": "externalConfirmationNumber",
          "value": "EXT789012"
        }
      ]
    },
    {
      "row": 2,
      "columns": [
        {
          "name": "ackNumber",
          "value": "ACK654321"
        },
        {
          "name": "externalConfirmationNumber",
          "value": "EXT210987"
        }
      ]
    }
  ]
}
```

**Response**:
```json
{
  "status": [
    {
      "row": 1,
      "status": "SUCCESS"
    },
    {
      "row": 2,
      "status": "SKIPPED"
    }
  ]
}
```

**Status Values**:
- `SUCCESS`: Record was successfully processed
- `SKIPPED`: Record was skipped (invalid ACK, missing data, or duplicate)
- `FAILED`: Record processing failed due to an error

**Status Codes**:
- 200: Success - Returns processing status for each row
- 400: Bad Request - Invalid request format or data
- 401: Unauthorized - Invalid or missing API key
- 500: Internal Server Error

**Example**:
```bash
curl -X POST \
  "https://dev.cvent.com/dev/passkey-file-import/v1/rezhub-reservation-fileimport/importData/rezhub-reservation" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d @import-data.json
```

---

### POST /schemas/{schemaName}

**Description**: Retrieves the import schema definition, including required and optional fields with their validation rules. This schema is used by the file import UI to present mapping options to users.

**Path Parameters**:
- `schemaName` (string, required) - The name of the schema to retrieve

**Query Parameters**:
- `locale` (string, required) - The locale for field descriptions (e.g., "en-US")

**Request Body**:
```json
{
  "accountId": "12345",
  "userId": "67890"
}
```

**Response**:
```json
{
  "requiredFields": [
    {
      "name": "ackNumber",
      "description": "Passkey Acknowledgment Number - The unique identifier for the reservation in Passkey system",
      "validator": {
        "type": "string",
        "nullable": false
      }
    },
    {
      "name": "externalConfirmationNumber",
      "description": "External Confirmation Number - The confirmation number from the external system (2-40 characters)",
      "validator": {
        "type": "string",
        "nullable": false,
        "min": 2,
        "max": 40
      }
    }
  ],
  "optionalFields": [],
  "importKeyFields": [
    "ackNumber",
    "externalConfirmationNumber"
  ]
}
```

**Field Descriptions**:
- `ackNumber`: Passkey Acknowledgment Number - The unique identifier for the reservation in Passkey system
- `externalConfirmationNumber`: External Confirmation Number - The confirmation number from the external system (2-40 characters)

**Status Codes**:
- 200: Success - Returns schema definition
- 400: Bad Request - Invalid schema name or locale
- 401: Unauthorized - Invalid or missing API key
- 404: Not Found - Schema not found
- 500: Internal Server Error

**Example**:
```bash
curl -X POST \
  "https://dev.cvent.com/dev/passkey-file-import/v1/rezhub-reservation-fileimport/schemas/rezhub-reservation?locale=en-US" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"accountId": "12345", "userId": "67890"}'
```

## Data Models

### ImportDataStrategyRequest
```json
{
  "totalCount": "integer - Total number of records to import"
}
```

### ImportDataStrategyResponse
```json
{
  "batchSize": "integer - Preferred batch size for data transmission"
}
```

### ImportDataRequest
```json
{
  "accountMappingId": "string (UUID) - Account mapping identifier",
  "userId": "string (UUID) - User identifier",
  "rows": [
    {
      "row": "integer - Row number",
      "columns": [
        {
          "name": "string - Column name",
          "value": "any - Column value"
        }
      ]
    }
  ]
}
```

### ImportDataResponse
```json
{
  "status": [
    {
      "row": "integer - Row number",
      "status": "string - SUCCESS|SKIPPED|FAILED"
    }
  ]
}
```

### ImportSchemaRequest
```json
{
  "accountId": "string - Account identifier",
  "userId": "string - User identifier"
}
```

### ImportSchema
```json
{
  "requiredFields": [
    {
      "name": "string - Field name",
      "description": "string - Field description",
      "validator": {
        "type": "string - Field type",
        "nullable": "boolean - Whether field can be null",
        "min": "integer - Minimum length (optional)",
        "max": "integer - Maximum length (optional)"
      }
    }
  ],
  "optionalFields": [],
  "importKeyFields": ["string - List of key field names"]
}
```

## Error Responses

All endpoints may return the following error format:

```json
{
  "code": 400,
  "message": "Validation failed",
  "details": "Specific error details"
}
```

Common error scenarios:
- **400 Bad Request**: Invalid input data, missing required fields, or validation failures
- **401 Unauthorized**: Missing or invalid API key
- **404 Not Found**: Requested schema or resource not found
- **500 Internal Server Error**: Service unavailable or internal processing error

## Rate Limiting

The service implements standard rate limiting:
- **Limit**: 1000 requests per minute per API key
- **Headers**: Rate limit information included in response headers
- **Exceeded**: Returns 429 Too Many Requests when limit exceeded

## OpenAPI Specification

The complete OpenAPI specification is available at:
- **JSON**: `/{env}/passkey-file-import/openapi.json`
- **YAML**: `/{env}/passkey-file-import/openapi.yaml`

Use these endpoints to generate client SDKs or import into API testing tools.