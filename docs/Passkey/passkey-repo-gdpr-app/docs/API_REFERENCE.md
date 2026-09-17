# API Reference

## Base URL

The API is deployed through AWS API Gateway with environment-specific URLs:
- **Sandbox**: `https://api-sandbox.cvent.com/passkey-gdpr-app`
- **Production**: `https://api.cvent.com/passkey-gdpr-app`

## Authentication

All API endpoints require authentication through a Lambda Authorizer that validates requests using AWS Parameter Store secrets.

### Authorization Header
```
Authorization: Bearer <token>
```

## Lambda Functions

### GDPR Lambda Functions (`gdpr-lambdas`)

#### Authorizer Function
**Function**: `authorizer`
**Purpose**: Validates API requests and provides authorization context

**Trigger**: API Gateway requests
**Runtime**: Node.js (TypeScript)

**Authorization Flow**:
1. Extracts authorization token from request headers
2. Validates token against Parameter Store secrets
3. Returns authorization policy for API Gateway
4. Provides context for downstream Lambda functions

**Response Format**:
```json
{
  "principalId": "string",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "execute-api:Invoke",
        "Effect": "Allow|Deny",
        "Resource": "string"
      }
    ]
  },
  "context": {
    "userId": "string",
    "permissions": ["string"]
  }
}
```

#### API Handler Functions
**Location**: `packages/gdpr-lambdas/src/api/`
**Purpose**: Process GDPR-related API requests

**Common Request Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`
- `X-Request-ID: <uuid>` (optional, for tracing)

**Common Response Format**:
```json
{
  "success": boolean,
  "data": object,
  "message": "string",
  "requestId": "string",
  "timestamp": "ISO 8601 string"
}
```

**Error Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": object
  },
  "requestId": "string",
  "timestamp": "ISO 8601 string"
}
```

### Scheduler Lambda Functions (`scheduler-lambda`)

#### Scheduled Task Handler
**Function**: `scheduler-handler`
**Purpose**: Processes scheduled GDPR compliance tasks

**Trigger**: EventBridge scheduled events
**Runtime**: Node.js (TypeScript)

**Event Format**:
```json
{
  "version": "0",
  "id": "string",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "string",
  "time": "ISO 8601 string",
  "region": "string",
  "detail": {
    "taskType": "string",
    "parameters": object
  }
}
```

**Processing Flow**:
1. Receives EventBridge scheduled event
2. Validates event payload and task type
3. Executes appropriate GDPR compliance task
4. Integrates with passkey-gdpr-service for business logic
5. Logs results and metrics to DataDog

## HTTP Status Codes

### Success Codes
- **200 OK**: Request processed successfully
- **201 Created**: Resource created successfully
- **202 Accepted**: Request accepted for processing

### Client Error Codes
- **400 Bad Request**: Invalid request format or parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **422 Unprocessable Entity**: Valid format but semantic errors

### Server Error Codes
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Upstream service error
- **503 Service Unavailable**: Service temporarily unavailable
- **504 Gateway Timeout**: Upstream service timeout

## Rate Limiting

API Gateway implements rate limiting:
- **Burst Limit**: 5000 requests per second
- **Rate Limit**: 2000 requests per second sustained
- **Throttling**: Returns HTTP 429 when limits exceeded

## Request/Response Examples

### Successful API Request
```bash
curl -X GET \
  https://api-sandbox.cvent.com/passkey-gdpr-app/health \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "0.3.0",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "message": "Service is healthy",
  "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response Example
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided authorization token is invalid or expired",
    "details": {
      "tokenExpiry": "2024-01-15T09:30:00Z"
    }
  },
  "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Integration with External Services

### passkey-gdpr-service
The Lambda functions integrate with the passkey-gdpr-service for core business logic:

**Service Endpoint**: Internal service discovery
**Authentication**: Service-to-service authentication via Parameter Store
**Timeout**: 30 seconds for API calls
**Retry Policy**: Exponential backoff with 3 retries

### AWS Parameter Store Integration
Configuration and secrets management:

**Parameter Paths**:
- `/passkey-gdpr-app/{environment}/api-keys`
- `/passkey-gdpr-app/{environment}/service-endpoints`
- `/passkey-gdpr-app/{environment}/feature-flags`

**Access Pattern**:
```typescript
import { ParameterStoreClient } from '@cvent/aws-param-secrets-lambda-ext-ts-client';

const client = new ParameterStoreClient();
const apiKey = await client.getParameter('/passkey-gdpr-app/prod/api-key');
```

## Monitoring and Logging

### Request Tracing
- Each request generates a unique `requestId`
- Distributed tracing via X-Ray (when enabled)
- Correlation IDs for cross-service calls

### Metrics
- Request count and latency
- Error rates by status code
- Lambda function duration and memory usage
- Custom business metrics via DataDog

### Logging Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
  "function": "gdpr-api-handler",
  "message": "Processing GDPR request",
  "metadata": {
    "userId": "user-456",
    "operation": "data-export"
  }
}
```

## Development and Testing

### Local Testing
```bash
# Start local API simulation
pnpm local

# Test endpoints locally
curl http://localhost:3000/health
```

### Integration Testing
- Automated tests run in CI/CD pipeline
- Integration tests against sandbox environment
- Contract testing with passkey-gdpr-service

### API Documentation
- OpenAPI/Swagger specifications (when available)
- Postman collections for manual testing
- Example requests and responses in code comments