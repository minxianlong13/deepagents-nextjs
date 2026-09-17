# API Reference

## Overview

The Passkey Event Bus CDK primarily operates through event-driven communication using AWS EventBridge. This document describes the event schemas, patterns, and integration points.

## Event Bus Configuration

**Event Bus ARN**: Available through the producer stack output
**Event Source**: `passkey-manage-api`
**Notification Channel**: `passkey-api`

## Event Schemas

Events are generated from the Passkey Manage API AsyncAPI specification and follow a consistent structure.

### Base Event Structure

All events follow this base structure:

```json
{
  "version": "0",
  "id": "string",
  "detail-type": "string",
  "source": "passkey-manage-api",
  "account": "string",
  "time": "2024-01-01T00:00:00Z",
  "region": "string",
  "detail": {
    // Event-specific payload
  }
}
```

### Reservation Events

#### Reservation Created
**Event Type**: `reservation.created`
**Description**: Published when a new reservation is created

**Event Detail**:
```json
{
  "reservationId": "string",
  "guestId": "string",
  "hotelId": "string",
  "checkInDate": "2024-01-01",
  "checkOutDate": "2024-01-03",
  "roomType": "string",
  "status": "confirmed",
  "createdAt": "2024-01-01T00:00:00Z",
  "metadata": {
    "source": "string",
    "version": "string"
  }
}
```

#### Reservation Updated
**Event Type**: `reservation.updated`
**Description**: Published when a reservation is modified

**Event Detail**:
```json
{
  "reservationId": "string",
  "changes": {
    "field": "previous_value",
    "field": "new_value"
  },
  "updatedAt": "2024-01-01T00:00:00Z",
  "updatedBy": "string"
}
```

#### Reservation Cancelled
**Event Type**: `reservation.cancelled`
**Description**: Published when a reservation is cancelled

**Event Detail**:
```json
{
  "reservationId": "string",
  "cancellationReason": "string",
  "cancelledAt": "2024-01-01T00:00:00Z",
  "cancelledBy": "string",
  "refundAmount": 0.00
}
```

### Authentication Events

#### User Authenticated
**Event Type**: `auth.user.authenticated`
**Description**: Published when a user successfully authenticates

**Event Detail**:
```json
{
  "userId": "string",
  "sessionId": "string",
  "authMethod": "password|sso|mfa",
  "authenticatedAt": "2024-01-01T00:00:00Z",
  "ipAddress": "string",
  "userAgent": "string"
}
```

#### Authentication Failed
**Event Type**: `auth.user.failed`
**Description**: Published when authentication fails

**Event Detail**:
```json
{
  "userId": "string",
  "failureReason": "invalid_credentials|account_locked|mfa_failed",
  "attemptedAt": "2024-01-01T00:00:00Z",
  "ipAddress": "string",
  "userAgent": "string"
}
```

### Notification Events

#### Notification Requested
**Event Type**: `notification.requested`
**Description**: Published when a notification needs to be sent

**Event Detail**:
```json
{
  "notificationId": "string",
  "type": "email|sms|push",
  "recipient": "string",
  "template": "string",
  "data": {
    // Template-specific data
  },
  "priority": "high|normal|low",
  "scheduledFor": "2024-01-01T00:00:00Z"
}
```

## Event Rules and Routing

### Reservation Consumer Rules
Events are routed to the reservation consumer Lambda based on these patterns:

```json
{
  "source": ["passkey-manage-api"],
  "detail-type": [
    "reservation.created",
    "reservation.updated",
    "reservation.cancelled"
  ]
}
```

### Authentication Publisher Rules
Authentication events are published with these patterns:

```json
{
  "source": ["passkey-auth-service"],
  "detail-type": [
    "auth.user.authenticated",
    "auth.user.failed"
  ]
}
```

### Notification Publisher Rules
Notification events are routed based on:

```json
{
  "source": ["passkey-manage-api"],
  "detail-type": [
    "notification.requested"
  ],
  "detail": {
    "type": ["email", "sms", "push"]
  }
}
```

## Lambda Function Interfaces

### Reservation Consumer Lambda

**Function Name**: `passkey-reservation-consumer`
**Runtime**: Node.js 22.x
**Handler**: `src/index.handler`

**Input Event**: AWS EventBridge event
**Processing**:
1. Validates event schema
2. Extracts reservation data
3. Updates Elasticsearch index
4. Handles errors with DLQ

**Environment Variables**:
- `ELASTICSEARCH_ENDPOINT`: Elasticsearch cluster endpoint
- `ELASTICSEARCH_INDEX`: Target index name
- `LOG_LEVEL`: Logging level (debug|info|warn|error)

## Elasticsearch Integration

### Index Structure

**Index Name Pattern**: `passkey-reservations-{environment}-{date}`
**Document Type**: Reservation data with event metadata

**Document Schema**:
```json
{
  "reservationId": "string",
  "guestId": "string",
  "hotelId": "string",
  "checkInDate": "date",
  "checkOutDate": "date",
  "roomType": "keyword",
  "status": "keyword",
  "createdAt": "date",
  "updatedAt": "date",
  "eventMetadata": {
    "eventId": "string",
    "eventType": "keyword",
    "processedAt": "date",
    "source": "keyword"
  }
}
```

### Search Capabilities

The Elasticsearch integration provides:
- Full-text search on reservation data
- Date range queries for check-in/check-out dates
- Aggregations by hotel, room type, status
- Real-time updates as events are processed

## Error Handling

### Dead Letter Queues
Failed events are sent to DLQs for manual inspection:
- **Reservation Consumer DLQ**: For failed reservation processing
- **Notification Publisher DLQ**: For failed notification events

### Retry Logic
- **Immediate Retry**: 3 attempts with exponential backoff
- **DLQ Processing**: Manual reprocessing of failed events
- **Monitoring**: CloudWatch alarms for high error rates

## Monitoring and Observability

### CloudWatch Metrics
- Event processing rate
- Error rates by event type
- Lambda function duration and memory usage
- Elasticsearch indexing performance

### Distributed Tracing
- AWS X-Ray integration for request tracing
- Correlation IDs for event tracking
- Performance monitoring across services

### Logging
- Structured JSON logging
- Event correlation tracking
- Error context preservation

## Configuration Management

### Environment-Specific Settings
Configuration is managed through Hogan and includes:

```typescript
interface HoganConfig {
  elasticsearch: {
    endpoint: string;
    username: string;
    password: string;
    indexPrefix: string;
  };
  passkeyEndpoints: {
    manageApi: string;
    authService: string;
    notificationService: string;
  };
  aws: {
    region: string;
    account: string;
  };
}
```

### Secret Management
Sensitive configuration is stored in AWS Secrets Manager:
- Database credentials
- API keys
- Service endpoints
- Encryption keys

## Integration Examples

### Publishing Events (TypeScript)
```typescript
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const client = new EventBridgeClient({ region: "us-east-1" });

const event = {
  Source: "passkey-manage-api",
  DetailType: "reservation.created",
  Detail: JSON.stringify({
    reservationId: "res-123",
    guestId: "guest-456",
    hotelId: "hotel-789"
  })
};

await client.send(new PutEventsCommand({
  Entries: [event]
}));
```

### Consuming Events (Lambda Handler)
```typescript
import { EventBridgeEvent } from "aws-lambda";

export const handler = async (event: EventBridgeEvent<string, any>) => {
  const { source, "detail-type": detailType, detail } = event;
  
  switch (detailType) {
    case "reservation.created":
      await processReservationCreated(detail);
      break;
    case "reservation.updated":
      await processReservationUpdated(detail);
      break;
    default:
      console.warn(`Unhandled event type: ${detailType}`);
  }
};
```