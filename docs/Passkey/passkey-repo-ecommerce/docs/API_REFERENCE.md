# API Reference

## Base URL
`https://passkey-ecommerce-service.core.cvent.org`

## Authentication
All endpoints require API key authentication via the `Authorization` header:
```
Authorization: Bearer <api-key>
```

## Endpoints

### Admin Operations

#### GET /admin/health
**Description**: Health check endpoint for service monitoring

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
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
  "service": "passkey-ecommerce-service",
  "version": "1.0.95",
  "buildTime": "2024-01-15T08:00:00Z"
}
```

#### POST /admin/cache/clear
**Description**: Clear service caches

**Request Body**:
```json
{
  "cacheType": "all"
}
```

**Response**:
```json
{
  "message": "Cache cleared successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Orchestrated Ecommerce Operations

#### POST /orchestrated/payments
**Description**: Process orchestrated payment transactions

**Request Body**:
```json
{
  "reservationId": "res_123456",
  "amount": {
    "value": 150.00,
    "currency": "USD"
  },
  "paymentMethod": {
    "type": "CREDIT_CARD",
    "cardToken": "tok_abc123"
  },
  "guestInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
}
```

**Response**:
```json
{
  "transactionId": "txn_789012",
  "status": "COMPLETED",
  "amount": {
    "value": 150.00,
    "currency": "USD"
  },
  "processedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 200: Payment processed successfully
- 400: Invalid request data
- 402: Payment failed
- 500: Internal processing error

#### GET /orchestrated/payments/{transactionId}
**Description**: Retrieve payment transaction details

**Path Parameters**:
- `transactionId` - Unique transaction identifier

**Response**:
```json
{
  "transactionId": "txn_789012",
  "reservationId": "res_123456",
  "status": "COMPLETED",
  "amount": {
    "value": 150.00,
    "currency": "USD"
  },
  "paymentMethod": {
    "type": "CREDIT_CARD",
    "last4": "1234"
  },
  "createdAt": "2024-01-15T10:25:00Z",
  "processedAt": "2024-01-15T10:30:00Z"
}
```

#### POST /orchestrated/refunds
**Description**: Process payment refunds

**Request Body**:
```json
{
  "transactionId": "txn_789012",
  "amount": {
    "value": 75.00,
    "currency": "USD"
  },
  "reason": "GUEST_CANCELLATION"
}
```

**Response**:
```json
{
  "refundId": "ref_345678",
  "transactionId": "txn_789012",
  "status": "PROCESSED",
  "amount": {
    "value": 75.00,
    "currency": "USD"
  },
  "processedAt": "2024-01-15T11:00:00Z"
}
```

### Payment Gateway Operations

#### POST /payment-gate/authorize
**Description**: Authorize payment without capturing funds

**Request Body**:
```json
{
  "amount": {
    "value": 200.00,
    "currency": "USD"
  },
  "paymentMethod": {
    "type": "CREDIT_CARD",
    "cardNumber": "4111111111111111",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "cvv": "123"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "country": "US"
  }
}
```

**Response**:
```json
{
  "authorizationId": "auth_456789",
  "status": "AUTHORIZED",
  "amount": {
    "value": 200.00,
    "currency": "USD"
  },
  "expiresAt": "2024-01-22T10:30:00Z"
}
```

#### POST /payment-gate/capture
**Description**: Capture previously authorized payment

**Request Body**:
```json
{
  "authorizationId": "auth_456789",
  "amount": {
    "value": 200.00,
    "currency": "USD"
  }
}
```

**Response**:
```json
{
  "captureId": "cap_567890",
  "authorizationId": "auth_456789",
  "status": "CAPTURED",
  "amount": {
    "value": 200.00,
    "currency": "USD"
  },
  "capturedAt": "2024-01-15T10:45:00Z"
}
```

#### POST /payment-gate/void
**Description**: Void an authorized payment

**Request Body**:
```json
{
  "authorizationId": "auth_456789",
  "reason": "GUEST_REQUESTED"
}
```

**Response**:
```json
{
  "voidId": "void_678901",
  "authorizationId": "auth_456789",
  "status": "VOIDED",
  "voidedAt": "2024-01-15T10:50:00Z"
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment processing failed",
    "details": "Insufficient funds",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST` - Malformed request data
- `AUTHENTICATION_FAILED` - Invalid or missing API key
- `PAYMENT_FAILED` - Payment processing error
- `TRANSACTION_NOT_FOUND` - Transaction does not exist
- `INSUFFICIENT_FUNDS` - Payment method has insufficient funds
- `CARD_DECLINED` - Credit card was declined
- `INTERNAL_ERROR` - Unexpected server error

## Rate Limiting

- **Rate Limit**: 1000 requests per minute per API key
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

## Webhooks

The service supports webhook notifications for asynchronous events:

### Payment Completed
```json
{
  "event": "payment.completed",
  "transactionId": "txn_789012",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "amount": {
      "value": 150.00,
      "currency": "USD"
    },
    "status": "COMPLETED"
  }
}
```

### Payment Failed
```json
{
  "event": "payment.failed",
  "transactionId": "txn_789012",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "error": "CARD_DECLINED",
    "message": "Payment was declined by issuer"
  }
}
```