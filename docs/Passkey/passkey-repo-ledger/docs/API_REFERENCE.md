# API Reference

## Base URL
`https://passkey-ledger-service.{environment}.cvent.org`

## Authentication
All API endpoints require authentication via API key passed in the request headers:
```
Authorization: Bearer {api_key}
```

## Endpoints

### Balance Operations

#### GET /balance/{ownerId}
**Description**: Retrieves the current balance for a specific owner

**Path Parameters**:
- `ownerId` (string) - Unique identifier for the balance owner

**Query Parameters**:
- `ownerType` (string, optional) - Type of owner (e.g., "ORGANIZATIONAL_ENTITY", "PROPERTY", "MERCHANT")

**Response**:
```json
{
  "ownerId": "string",
  "ownerType": "ORGANIZATIONAL_ENTITY",
  "balance": 150.00,
  "currency": "USD",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 200: Success
- 404: Owner not found
- 401: Unauthorized
- 500: Internal server error

### Credit Card Operations

#### POST /creditcard/process
**Description**: Processes a credit card transaction

**Request Body**:
```json
{
  "cardNumber": "4111111111111111",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "cvv": "123",
  "amount": 100.00,
  "currency": "USD",
  "transactionType": "CHARGE",
  "merchantId": "merchant_123"
}
```

**Note**: `merchantId` refers to the payment processing configuration for events. Events can have a default merchant account.

**Response**:
```json
{
  "transactionId": "txn_abc123",
  "status": "SUCCESS",
  "authorizationCode": "AUTH123",
  "amount": 100.00,
  "currency": "USD",
  "timestamp": "2024-01-15T10:30:00Z",
  "cardAssociation": "VISA"
}
```

**Status Codes**:
- 200: Transaction successful
- 400: Invalid request data
- 402: Payment required/declined
- 401: Unauthorized
- 500: Processing error

#### PATCH /creditcard/{cardId}
**Description**: Updates credit card information

**Path Parameters**:
- `cardId` (string) - Unique identifier for the credit card

**Request Body**:
```json
{
  "expiryMonth": 12,
  "expiryYear": 2026,
  "billingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "VA",
    "zipCode": "12345"
  }
}
```

**Response**:
```json
{
  "cardId": "card_123",
  "status": "UPDATED",
  "lastModified": "2024-01-15T10:30:00Z"
}
```

### Credit Card Verification

#### POST /creditcard/verify
**Description**: Verifies credit card information without processing payment

**Request Body**:
```json
{
  "cardNumber": "4111111111111111",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "cvv": "123"
}
```

**Response**:
```json
{
  "isValid": true,
  "cardAssociation": "VISA",
  "cardType": "CREDIT",
  "issuerCountry": "US",
  "verificationResult": {
    "cvvCheck": "PASS",
    "addressCheck": "PASS"
  }
}
```

### Operation Management

#### POST /operation
**Description**: Creates a new ledger operation

**Request Body**:
```json
{
  "operationType": "DEBIT",
  "amount": 50.00,
  "currency": "USD",
  "ownerId": "owner_123",
  "ownerType": "ORGANIZATIONAL_ENTITY",
  "description": "Room charge",
  "referenceId": "ref_456"
}
```

**Response**:
```json
{
  "operationId": "op_789",
  "status": "COMPLETED",
  "timestamp": "2024-01-15T10:30:00Z",
  "balanceAfter": 100.00
}
```

#### GET /operation/{operationId}
**Description**: Retrieves details of a specific operation

**Path Parameters**:
- `operationId` (string) - Unique identifier for the operation

**Response**:
```json
{
  "operationId": "op_789",
  "operationType": "DEBIT",
  "amount": 50.00,
  "currency": "USD",
  "ownerId": "owner_123",
  "ownerType": "ORGANIZATIONAL_ENTITY",
  "status": "COMPLETED",
  "timestamp": "2024-01-15T10:30:00Z",
  "description": "Room charge",
  "referenceId": "ref_456"
}
```

### Transaction Details

#### GET /transaction/{transactionId}
**Description**: Retrieves comprehensive transaction details

**Path Parameters**:
- `transactionId` (string) - Unique identifier for the transaction

**Response**:
```json
{
  "transactionId": "txn_abc123",
  "amount": 100.00,
  "currency": "USD",
  "status": "COMPLETED",
  "timestamp": "2024-01-15T10:30:00Z",
  "paymentMethod": {
    "type": "CREDIT_CARD",
    "cardAssociation": "VISA",
    "lastFourDigits": "1111"
  },
  "merchant": {
    "merchantId": "merchant_123",
    "name": "Hotel ABC"
  },
  "operations": [
    {
      "operationId": "op_789",
      "type": "DEBIT",
      "amount": 100.00
    }
  ]
}
```

### Subblock Group Credit Card Operations

#### POST /sbg/creditcard
**Description**: Processes credit card operations for Subblock Groups

**Request Body**:
```json
{
  "subblockGroupId": "sbg_123",
  "cardToken": "token_abc",
  "amount": 200.00,
  "currency": "USD",
  "operationType": "AUTHORIZE"
}
```

**Response**:
```json
{
  "transactionId": "txn_sbg_456",
  "status": "AUTHORIZED",
  "authorizationCode": "AUTH456",
  "amount": 200.00,
  "expiresAt": "2024-01-15T11:30:00Z"
}
```

### PBB Callback

#### POST /pbb/callback
**Description**: Handles Pay By Bank callback notifications

**Request Body**:
```json
{
  "transactionId": "pbb_txn_123",
  "status": "COMPLETED",
  "amount": 150.00,
  "currency": "USD",
  "bankReference": "bank_ref_456"
}
```

**Response**:
```json
{
  "acknowledged": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request contains invalid parameters",
    "details": {
      "field": "cardNumber",
      "reason": "Invalid format"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST` - Request validation failed
- `UNAUTHORIZED` - Authentication failed
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `PAYMENT_DECLINED` - Payment was declined
- `INSUFFICIENT_FUNDS` - Not enough balance
- `PROCESSING_ERROR` - Internal processing error
- `SERVICE_UNAVAILABLE` - External service unavailable

## Rate Limiting

API requests are subject to rate limiting:
- **Standard endpoints**: 1000 requests per minute per API key
- **Payment processing**: 100 requests per minute per API key
- **Verification endpoints**: 500 requests per minute per API key

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```

## Webhooks

The service supports webhook notifications for asynchronous events:

### Payment Completion
```json
{
  "event": "payment.completed",
  "transactionId": "txn_abc123",
  "amount": 100.00,
  "status": "SUCCESS",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Balance Update
```json
{
  "event": "balance.updated",
  "ownerId": "owner_123",
  "previousBalance": 50.00,
  "newBalance": 150.00,
  "timestamp": "2024-01-15T10:30:00Z"
}
```