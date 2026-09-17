# API Reference

## Base URL
`https://passkey-payment-service.{environment}.cvent.org`

## Authentication
All API endpoints require authentication via Cvent Auth Service JWT tokens.

**Header**: `Authorization: Bearer <jwt_token>`

## Endpoints

### Payment Operations

#### POST /v1/payments
**Description**: Create a new payment for a reservation

**Request Body**:
```json
{
  "reservationId": "string",
  "amount": "number",
  "currency": "string",
  "paymentMethodId": "string",
  "guestId": "string"
}
```

**Response**:
```json
{
  "paymentId": "string",
  "status": "PENDING|COMPLETED|FAILED",
  "amount": "number",
  "currency": "string",
  "transactionId": "string",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 201: Payment created successfully
- 400: Invalid request data
- 401: Unauthorized
- 500: Internal server error

#### GET /v1/payments/{paymentId}
**Description**: Retrieve payment details by ID

**Path Parameters**:
- `paymentId` - Unique payment identifier

**Response**:
```json
{
  "paymentId": "string",
  "reservationId": "string",
  "amount": "number",
  "currency": "string",
  "status": "string",
  "paymentMethod": {
    "id": "string",
    "type": "CREDIT_CARD|BANK_TRANSFER",
    "lastFour": "string"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

**Status Codes**:
- 200: Success
- 404: Payment not found
- 401: Unauthorized

#### PUT /v1/payments/{paymentId}
**Description**: Update payment status or details

**Path Parameters**:
- `paymentId` - Unique payment identifier

**Request Body**:
```json
{
  "status": "COMPLETED|CANCELLED|REFUNDED",
  "refundAmount": "number",
  "notes": "string"
}
```

**Status Codes**:
- 200: Payment updated successfully
- 404: Payment not found
- 400: Invalid update request

### Group Payment Operations

#### POST /v1/group-payments
**Description**: Create a group payment for multiple reservations

**Request Body**:
```json
{
  "groupId": "string",
  "reservationIds": ["string"],
  "totalAmount": "number",
  "currency": "string",
  "paymentMethodId": "string",
  "splitType": "EQUAL|CUSTOM",
  "splits": [
    {
      "reservationId": "string",
      "amount": "number"
    }
  ]
}
```

**Response**:
```json
{
  "groupPaymentId": "string",
  "status": "PENDING|COMPLETED|FAILED",
  "totalAmount": "number",
  "currency": "string",
  "payments": [
    {
      "paymentId": "string",
      "reservationId": "string",
      "amount": "number",
      "status": "string"
    }
  ]
}
```

#### GET /v1/group-payments/{groupPaymentId}
**Description**: Retrieve group payment details

**Path Parameters**:
- `groupPaymentId` - Unique group payment identifier

### Pricing Operations

#### POST /v1/pricing/calculate
**Description**: Calculate pricing for a reservation request

**Request Body**:
```json
{
  "hotelId": "string",
  "roomTypeId": "string",
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-18",
  "numberOfGuests": 2,
  "rateCode": "string",
  "promoCode": "string"
}
```

**Response**:
```json
{
  "baseRate": "number",
  "taxes": "number",
  "fees": "number",
  "discounts": "number",
  "totalAmount": "number",
  "currency": "string",
  "breakdown": [
    {
      "date": "2024-03-15",
      "rate": "number",
      "taxes": "number",
      "fees": "number"
    }
  ]
}
```

**Status Codes**:
- 200: Pricing calculated successfully
- 400: Invalid pricing request
- 404: Hotel or room type not found

#### GET /v1/pricing/rates
**Description**: Get available rates for a hotel

**Query Parameters**:
- `hotelId` - Hotel identifier (required)
- `checkInDate` - Check-in date (required)
- `checkOutDate` - Check-out date (required)
- `roomTypeId` - Room type filter (optional)

**Response**:
```json
{
  "rates": [
    {
      "rateId": "string",
      "rateName": "string",
      "rateCode": "string",
      "baseRate": "number",
      "currency": "string",
      "availability": "AVAILABLE|LIMITED|UNAVAILABLE",
      "restrictions": {
        "minStay": 1,
        "maxStay": 30,
        "advanceBooking": 0
      }
    }
  ]
}
```

### Wallet Operations

#### POST /v1/wallet/payment-methods
**Description**: Add a new payment method to wallet

**Request Body**:
```json
{
  "guestId": "string",
  "paymentMethod": {
    "type": "CREDIT_CARD|BANK_ACCOUNT",
    "cardNumber": "string",
    "expiryMonth": "number",
    "expiryYear": "number",
    "cvv": "string",
    "billingAddress": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string"
    }
  }
}
```

**Response**:
```json
{
  "paymentMethodId": "string",
  "token": "string",
  "type": "CREDIT_CARD",
  "lastFour": "string",
  "expiryMonth": "number",
  "expiryYear": "number",
  "isDefault": "boolean",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 201: Payment method added successfully
- 400: Invalid payment method data
- 401: Unauthorized

#### GET /v1/wallet/payment-methods
**Description**: Get all payment methods for a guest

**Query Parameters**:
- `guestId` - Guest identifier (required)

**Response**:
```json
{
  "paymentMethods": [
    {
      "paymentMethodId": "string",
      "type": "CREDIT_CARD",
      "lastFour": "string",
      "expiryMonth": "number",
      "expiryYear": "number",
      "isDefault": "boolean",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### DELETE /v1/wallet/payment-methods/{paymentMethodId}
**Description**: Remove a payment method from wallet

**Path Parameters**:
- `paymentMethodId` - Payment method identifier

**Status Codes**:
- 204: Payment method removed successfully
- 404: Payment method not found
- 401: Unauthorized

### Commerce Operations

#### POST /v1/commerce/orders
**Description**: Create a commerce order for hotel services

**Request Body**:
```json
{
  "reservationId": "string",
  "items": [
    {
      "itemId": "string",
      "itemType": "ROOM|SERVICE|AMENITY",
      "quantity": "number",
      "unitPrice": "number",
      "description": "string"
    }
  ],
  "totalAmount": "number",
  "currency": "string"
}
```

**Response**:
```json
{
  "orderId": "string",
  "status": "PENDING|CONFIRMED|CANCELLED",
  "totalAmount": "number",
  "currency": "string",
  "items": [
    {
      "itemId": "string",
      "quantity": "number",
      "unitPrice": "number",
      "totalPrice": "number"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET /v1/commerce/orders/{orderId}
**Description**: Retrieve commerce order details

**Path Parameters**:
- `orderId` - Order identifier

### Administrative Operations

#### GET /admin/payments/search
**Description**: Search payments with filters (Admin only)

**Query Parameters**:
- `reservationId` - Filter by reservation ID
- `guestId` - Filter by guest ID
- `status` - Filter by payment status
- `dateFrom` - Start date filter
- `dateTo` - End date filter
- `limit` - Number of results (default: 50, max: 100)
- `offset` - Pagination offset

**Response**:
```json
{
  "payments": [
    {
      "paymentId": "string",
      "reservationId": "string",
      "amount": "number",
      "status": "string",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "totalCount": "number",
  "hasMore": "boolean"
}
```

#### POST /admin/payments/{paymentId}/refund
**Description**: Process a refund for a payment (Admin only)

**Path Parameters**:
- `paymentId` - Payment identifier

**Request Body**:
```json
{
  "refundAmount": "number",
  "reason": "string",
  "refundType": "FULL|PARTIAL"
}
```

**Response**:
```json
{
  "refundId": "string",
  "paymentId": "string",
  "refundAmount": "number",
  "status": "PENDING|COMPLETED|FAILED",
  "reason": "string",
  "processedAt": "2024-01-15T10:30:00Z"
}
```

#### POST /admin/tokenize
**Description**: Tokenize payment information (Admin only)

**Request Body**:
```json
{
  "paymentData": {
    "cardNumber": "string",
    "expiryMonth": "number",
    "expiryYear": "number"
  },
  "tokenizeOnly": "boolean"
}
```

**Response**:
```json
{
  "token": "string",
  "lastFour": "string",
  "cardType": "VISA|MASTERCARD|AMEX",
  "expiryMonth": "number",
  "expiryYear": "number"
}
```

## OpenAPI Specification

The complete OpenAPI specification is available at:
- **Development**: `https://passkey-payment-service.dev.cvent.org/openapi.json`
- **Staging**: `https://passkey-payment-service.staging.cvent.org/openapi.json`

## Rate Limiting

API endpoints are subject to rate limiting:
- **Standard endpoints**: 1000 requests per minute per client
- **Admin endpoints**: 100 requests per minute per client
- **Pricing calculations**: 500 requests per minute per client

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "PAYMENT_NOT_FOUND",
    "message": "Payment with ID 'abc123' not found",
    "details": {
      "paymentId": "abc123",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Common Error Codes
- `INVALID_REQUEST` - Malformed request data
- `PAYMENT_NOT_FOUND` - Payment does not exist
- `INSUFFICIENT_FUNDS` - Payment cannot be processed due to insufficient funds
- `PAYMENT_DECLINED` - Payment was declined by payment processor
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error occurred

## SDK and Client Libraries

### Java Client
```xml
<dependency>
    <groupId>com.cvent.passkey-payment</groupId>
    <artifactId>passkey-payment-java-client</artifactId>
    <version>1.1.3</version>
</dependency>
```

### Usage Example
```java
PasskeyPaymentClient client = PasskeyPaymentClient.builder()
    .baseUrl("https://passkey-payment-service.staging.cvent.org")
    .authToken("your-jwt-token")
    .build();

PaymentRequest request = PaymentRequest.builder()
    .reservationId("res-123")
    .amount(new BigDecimal("299.99"))
    .currency("USD")
    .paymentMethodId("pm-456")
    .build();

PaymentResponse response = client.createPayment(request);
```