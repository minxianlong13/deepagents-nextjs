# API Reference

## Base URL

The service is deployed with environment-specific API Gateway URLs:
- **Development**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/alpha/`
- **Staging**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/beta/`
- **Production**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/`

## Authentication

All API endpoints require proper authentication through:
- AWS IAM roles for service-to-service communication
- API Gateway authentication for external clients
- Bearer tokens for user-initiated requests

## REST API Endpoints

### POST /v1/autoblockautoprovision

**Description**: Initiates the autoblock autoprovision workflow for hotel room inventory management.

**Path Parameters**: None

**Query Parameters**: None

**Request Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer {token}` (if required)

**Request Body**:
```json
{
  "eventId": "string",
  "hotelId": "string",
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-17",
  "roomTypeId": "string",
  "blockSize": 50,
  "priority": "HIGH|MEDIUM|LOW",
  "autoProvision": true,
  "campaignId": "string",
  "requestedBy": "string",
  "metadata": {
    "source": "string",
    "correlationId": "string",
    "additionalProperties": {}
  }
}
```

**Request Body Parameters**:
- `eventId` (required): Unique identifier for the event requiring room blocks
- `hotelId` (required): Unique identifier for the target hotel
- `checkInDate` (required): Check-in date in YYYY-MM-DD format
- `checkOutDate` (required): Check-out date in YYYY-MM-DD format
- `roomTypeId` (required): Identifier for the specific room type
- `blockSize` (required): Number of rooms to provision in the block
- `priority` (optional): Priority level for processing (default: MEDIUM)
- `autoProvision` (optional): Whether to use automatic provisioning rules (default: true)
- `campaignId` (optional): Associated smart campaign identifier
- `requestedBy` (required): User or system initiating the request
- `metadata` (optional): Additional context and tracking information

**Response**:
```json
{
  "executionId": "string",
  "status": "STARTED|RUNNING|SUCCEEDED|FAILED",
  "message": "string",
  "timestamp": "2024-01-15T10:30:00Z",
  "trackingUrl": "string",
  "websocketUrl": "string"
}
```

**Response Parameters**:
- `executionId`: Unique identifier for the workflow execution
- `status`: Current status of the provisioning workflow
- `message`: Human-readable status message
- `timestamp`: ISO 8601 timestamp of the response
- `trackingUrl`: URL for tracking execution progress
- `websocketUrl`: WebSocket URL for real-time updates

**Status Codes**:
- `200`: Success - Workflow initiated successfully
- `400`: Bad Request - Invalid input parameters
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `409`: Conflict - Duplicate request or conflicting operation
- `500`: Internal Server Error - System error occurred

**Example Request**:
```bash
curl -X POST https://api.example.com/v1/autoblockautoprovision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "eventId": "evt_123456",
    "hotelId": "hotel_789",
    "checkInDate": "2024-03-15",
    "checkOutDate": "2024-03-17",
    "roomTypeId": "room_type_456",
    "blockSize": 25,
    "priority": "HIGH",
    "requestedBy": "user@example.com"
  }'
```

**Example Response**:
```json
{
  "executionId": "exec_abc123def456",
  "status": "STARTED",
  "message": "Autoblock autoprovision workflow initiated successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "trackingUrl": "https://console.aws.amazon.com/states/home?region=us-east-1#/executions/details/exec_abc123def456",
  "websocketUrl": "wss://websocket-api.example.com/prod"
}
```

## WebSocket API

### Connection Endpoint

**URL**: `wss://{websocket-api-id}.execute-api.us-east-1.amazonaws.com/{stage}`

**Description**: Establishes a WebSocket connection for real-time updates on provisioning workflow status.

### Connection Authentication

WebSocket connections require authentication through:
- Query parameter: `?token={auth-token}`
- Connection header: `Authorization: Bearer {token}`

### Message Types

#### Status Update Message
```json
{
  "type": "STATUS_UPDATE",
  "executionId": "string",
  "status": "RUNNING|SUCCEEDED|FAILED|TIMED_OUT",
  "step": "string",
  "progress": {
    "current": 3,
    "total": 10,
    "percentage": 30
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "details": {
    "message": "string",
    "data": {}
  }
}
```

#### Error Message
```json
{
  "type": "ERROR",
  "executionId": "string",
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Completion Message
```json
{
  "type": "COMPLETION",
  "executionId": "string",
  "status": "SUCCEEDED|FAILED",
  "result": {
    "blocksCreated": 5,
    "roomsProvisioned": 125,
    "totalCost": 15000.00,
    "summary": "string"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Client Actions

#### Subscribe to Execution
```json
{
  "action": "SUBSCRIBE",
  "executionId": "string"
}
```

#### Unsubscribe from Execution
```json
{
  "action": "UNSUBSCRIBE",
  "executionId": "string"
}
```

#### Heartbeat
```json
{
  "action": "PING"
}
```

**Response**:
```json
{
  "action": "PONG",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Step Functions Integration

### Execution Tracking

**GET** `/v1/executions/{executionId}/status`

**Description**: Retrieves the current status of a workflow execution.

**Path Parameters**:
- `executionId`: The unique execution identifier

**Response**:
```json
{
  "executionId": "string",
  "status": "RUNNING|SUCCEEDED|FAILED|TIMED_OUT|ABORTED",
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": "2024-01-15T10:45:00Z",
  "input": {},
  "output": {},
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

### Execution History

**GET** `/v1/executions/{executionId}/history`

**Description**: Retrieves the execution history and step details.

**Response**:
```json
{
  "executionId": "string",
  "events": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "type": "ExecutionStarted|TaskStateEntered|TaskStateExited|ExecutionSucceeded",
      "details": {},
      "stepName": "string"
    }
  ]
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {},
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "string"
  }
}
```

### Common Error Codes
- `INVALID_INPUT`: Request validation failed
- `AUTHENTICATION_FAILED`: Invalid or missing authentication
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `CONFLICT`: Operation conflicts with current state
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: System error occurred
- `SERVICE_UNAVAILABLE`: External service unavailable
- `TIMEOUT`: Operation timed out

## Rate Limiting

- **API Gateway**: 1000 requests per second per API key
- **WebSocket**: 100 connections per client
- **Step Functions**: 2000 executions per second per account

## Monitoring and Observability

### Health Check

**GET** `/health`

**Description**: Service health check endpoint.

**Response**:
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "2.4.5",
  "dependencies": {
    "dynamodb": "healthy",
    "stepfunctions": "healthy",
    "external_services": "healthy"
  }
}
```

### Metrics Endpoint

**GET** `/metrics`

**Description**: Prometheus-compatible metrics endpoint.

**Response**: Prometheus format metrics including:
- Request counts and latencies
- Workflow execution statistics
- Error rates and types
- Resource utilization metrics