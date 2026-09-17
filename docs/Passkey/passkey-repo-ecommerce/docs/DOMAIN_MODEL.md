# Domain Model

## Glossary

### Authorization
A hold placed on funds in a payment method without actually capturing the money. Authorizations typically expire after 7 days if not captured.

### Bridge Service
A service that provides compatibility between different system architectures, in this case converting asynchronous PBB operations to synchronous legacy API calls.

### Capture
The process of actually collecting funds from a previously authorized payment method.

### Commerce
The legacy Cvent commerce system that handles hotel reservation transactions and integrates with various payment processors.

### Ecommerce Transaction
A complete payment transaction including authorization, capture, and any subsequent refunds or voids related to hotel reservations.

### Legacy System
Older Cvent systems that require synchronous API interactions and cannot be easily modified to work with modern asynchronous architectures.

### PBB (Passkey Business Backend)
The modern asynchronous backend system that handles core Passkey business logic and operations.

### Payment Gateway
The external service (Cvent Payment API) that processes actual payment transactions with credit card processors and banks.

### Reservation
A hotel booking made through the Passkey system that may require payment processing.

### Transaction
A single payment operation (authorization, capture, refund, or void) with a unique identifier and status.

### Void
The cancellation of a previously authorized payment before it has been captured.

## Core Entities

### Transaction
**Description**: Represents a payment transaction within the ecommerce system

**Attributes**:
- `transactionId`: String - Unique identifier for the transaction
- `reservationId`: String - Associated hotel reservation ID
- `amount`: MonetaryAmount - Transaction amount and currency
- `status`: TransactionStatus - Current transaction state
- `paymentMethod`: PaymentMethod - Payment method used
- `createdAt`: DateTime - Transaction creation timestamp
- `processedAt`: DateTime - Transaction processing timestamp
- `guestInfo`: GuestInfo - Guest information for the transaction

**Relationships**:
- One-to-many with Refund entities
- Many-to-one with Reservation entity

### MonetaryAmount
**Description**: Represents a monetary value with currency

**Attributes**:
- `value`: BigDecimal - Monetary amount
- `currency`: String - ISO 4217 currency code (e.g., "USD", "EUR")

### PaymentMethod
**Description**: Represents a method of payment

**Attributes**:
- `type`: PaymentMethodType - Type of payment (CREDIT_CARD, DEBIT_CARD, etc.)
- `cardToken`: String - Tokenized card information
- `last4`: String - Last 4 digits of card number
- `expiryMonth`: Integer - Card expiration month
- `expiryYear`: Integer - Card expiration year
- `billingAddress`: Address - Billing address information

### GuestInfo
**Description**: Information about the guest making the payment

**Attributes**:
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Guest's email address
- `phone`: String - Guest's phone number

### Address
**Description**: Physical address information

**Attributes**:
- `street`: String - Street address
- `city`: String - City name
- `state`: String - State or province
- `zipCode`: String - Postal code
- `country`: String - ISO 3166 country code

### Authorization
**Description**: A payment authorization that holds funds without capturing them

**Attributes**:
- `authorizationId`: String - Unique authorization identifier
- `transactionId`: String - Associated transaction ID
- `amount`: MonetaryAmount - Authorized amount
- `status`: AuthorizationStatus - Authorization state
- `expiresAt`: DateTime - Authorization expiration time
- `createdAt`: DateTime - Authorization creation time

### Refund
**Description**: A refund of a previously captured payment

**Attributes**:
- `refundId`: String - Unique refund identifier
- `transactionId`: String - Original transaction ID
- `amount`: MonetaryAmount - Refund amount
- `reason`: RefundReason - Reason for refund
- `status`: RefundStatus - Refund processing status
- `processedAt`: DateTime - Refund processing time

**Relationships**:
- Many-to-one with Transaction entity

### AdminOperation
**Description**: Administrative operations performed on the service

**Attributes**:
- `operationId`: String - Unique operation identifier
- `type`: AdminOperationType - Type of admin operation
- `performedBy`: String - User who performed the operation
- `performedAt`: DateTime - Operation timestamp
- `parameters`: Map<String, Object> - Operation parameters
- `result`: String - Operation result or status

## Enumerations

### TransactionStatus
- `PENDING` - Transaction is being processed
- `AUTHORIZED` - Payment has been authorized
- `CAPTURED` - Payment has been captured
- `COMPLETED` - Transaction is fully complete
- `FAILED` - Transaction failed
- `CANCELLED` - Transaction was cancelled
- `REFUNDED` - Transaction has been refunded

### PaymentMethodType
- `CREDIT_CARD` - Credit card payment
- `DEBIT_CARD` - Debit card payment
- `BANK_TRANSFER` - Bank transfer payment
- `DIGITAL_WALLET` - Digital wallet payment

### AuthorizationStatus
- `PENDING` - Authorization in progress
- `AUTHORIZED` - Authorization successful
- `EXPIRED` - Authorization has expired
- `VOIDED` - Authorization was voided
- `CAPTURED` - Authorization was captured
- `FAILED` - Authorization failed

### RefundStatus
- `PENDING` - Refund is being processed
- `PROCESSED` - Refund has been processed
- `FAILED` - Refund failed
- `CANCELLED` - Refund was cancelled

### RefundReason
- `GUEST_CANCELLATION` - Guest cancelled reservation
- `HOTEL_CANCELLATION` - Hotel cancelled reservation
- `DUPLICATE_CHARGE` - Duplicate payment was made
- `FRAUD_PREVENTION` - Refund due to fraud concerns
- `SYSTEM_ERROR` - Refund due to system error

### AdminOperationType
- `CACHE_CLEAR` - Clear service caches
- `CONFIG_RELOAD` - Reload configuration
- `HEALTH_CHECK` - Perform health check
- `DATA_MIGRATION` - Perform data migration
- `MAINTENANCE_MODE` - Toggle maintenance mode

## Business Rules

### Payment Processing Rules
1. **Authorization Expiry**: Authorizations expire after 7 days if not captured
2. **Partial Captures**: Captures can be for less than the authorized amount
3. **Refund Limits**: Refunds cannot exceed the original captured amount
4. **Currency Consistency**: All operations on a transaction must use the same currency

### Transaction State Rules
1. **State Transitions**: Transactions follow a specific state machine
2. **Immutable History**: Transaction history cannot be modified once created
3. **Audit Trail**: All transaction changes are logged for compliance

### Security Rules
1. **PCI Compliance**: Credit card data is tokenized and never stored in plain text
2. **Authentication**: All API calls require valid authentication
3. **Authorization**: Admin operations require elevated permissions
4. **Audit Logging**: All sensitive operations are logged

### Integration Rules
1. **Idempotency**: Payment operations are idempotent using request IDs
2. **Timeout Handling**: External service calls have configurable timeouts
3. **Retry Logic**: Failed operations are retried with exponential backoff
4. **Circuit Breakers**: External service failures trigger circuit breakers

### Data Consistency Rules
1. **Transaction Integrity**: Database transactions ensure data consistency
2. **Eventual Consistency**: Some operations may be eventually consistent
3. **Compensation**: Failed operations trigger compensating transactions
4. **Reconciliation**: Daily reconciliation processes verify data integrity