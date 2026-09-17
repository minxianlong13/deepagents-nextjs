# API Reference

## Base URL

WebSocket API endpoint varies by environment:
- **Development**: `wss://dev-api.passkey.com/cc-verification`
- **Staging**: `wss://staging-api.passkey.com/cc-verification`
- **Production**: `wss://api.passkey.com/cc-verification`

## Authentication

All WebSocket connections require bearer token authentication passed as a query parameter.

### Connection Parameters
- `bearerToken` (required) - Valid bearer token for authentication
- `contextId` (required) - Context identifier for the verification request
- `userId` (required) - User identifier for the request

## WebSocket Connection

### Connect to WebSocket

**Description**: Establishes a WebSocket connection for real-time credit card verification

**Connection URL**:
```
wss://{api-gateway-url}?bearerToken={token}&contextId={context}&userId={user}
```

**Query Parameters**:
- `bearerToken` - Bearer token for authentication
- `contextId` - Context ID for the verification session
- `userId` - ID of the user requesting verification

**Connection Flow**:
1. Client initiates WebSocket connection with required parameters
2. API Gateway triggers authorizer Lambda
3. Authorizer validates bearer token
4. Connection established if token is valid

**Response**:
```json
{
  "statusCode": 200,
  "body": "{ \"message\": \"Connected\" }"
}
```

**Status Codes**:
- 200: Connection successful
- 401: Unauthorized - Invalid bearer token
- 403: Forbidden - Token validation failed
- 500: Internal server error

## WebSocket Messages

### Credit Card Verification Request

**Description**: Initiates credit card verification process

**Message Type**: `POST` (sent via WebSocket)

**Message Body**:
```json
{
  "action": "verify",
  "contextId": "string",
  "bearerToken": "string", 
  "userId": "string"
}
```

**Parameters**:
- `action` - Always "verify" for verification requests
- `contextId` - Context identifier for the verification
- `bearerToken` - Bearer token for authentication
- `userId` - User ID requesting verification

**Response**:
```json
{
  "statusCode": 200,
  "body": "{ \"message\": \"Connected\" }"
}
```

**Error Response**:
```json
{
  "statusCode": 400,
  "body": "{ \"error\": \"Invalid request parameters\" }"
}
```

## Integration Endpoints

### Passkey Ledger Integration

The service integrates with the Passkey Ledger API for actual credit card processing:

**Endpoint**: `POST {LEDGER_URL}/v1/credit-cards/verify`

**Query Parameters**:
- `connectionId` - WebSocket connection ID

**Headers**:
```
Authorization: API_KEY {api-key}
Content-Type: application/json
```

**Request Body**:
```json
{
  "contextId": "string",
  "bearerToken": "string",
  "userId": "string"
}
```

### Authorization Service Integration

**Endpoint**: `GET {AUTH_URL}/v1/access_token/{token}/verify`

**Headers**:
```
Authorization: API_KEY {api-key}
Content-Type: application/json
```

**Response**:
- Returns token validation result
- `null` response indicates invalid token
- Valid response allows connection

## Error Handling

### Common Error Codes

| Status Code | Description | Resolution |
|-------------|-------------|------------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Verify bearer token |
| 403 | Forbidden | Token validation failed |
| 500 | Internal Server Error | Check service logs |
| 502 | Bad Gateway | Downstream service unavailable |
| 503 | Service Unavailable | Service temporarily down |

### Error Response Format

```json
{
  "statusCode": 400,
  "body": {
    "error": "Error description",
    "message": "Detailed error message",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Rate Limiting

- WebSocket connections are limited per user/IP
- Rate limiting enforced at API Gateway level
- Excessive requests may result in temporary blocks

## Monitoring

### Health Check

WebSocket connection status can be monitored through:
- Connection establishment success/failure
- Message processing latency
- Error rates and types

### Metrics Available

- Connection count
- Message throughput
- Error rates
- Response times
- Token validation success rates

## Example Usage

### JavaScript WebSocket Client

```javascript
const ws = new WebSocket(
  'wss://api.passkey.com/cc-verification?bearerToken=abc123&contextId=ctx456&userId=user789'
);

ws.onopen = function(event) {
  console.log('Connected to credit card verification service');
  
  // Send verification request
  ws.send(JSON.stringify({
    action: 'verify',
    contextId: 'ctx456',
    bearerToken: 'abc123',
    userId: 'user789'
  }));
};

ws.onmessage = function(event) {
  const response = JSON.parse(event.data);
  console.log('Verification response:', response);
};

ws.onerror = function(error) {
  console.error('WebSocket error:', error);
};
```

### cURL Example (Connection Test)

```bash
# Note: cURL doesn't support WebSocket directly
# Use wscat or similar WebSocket client tools

wscat -c "wss://api.passkey.com/cc-verification?bearerToken=abc123&contextId=ctx456&userId=user789"
```