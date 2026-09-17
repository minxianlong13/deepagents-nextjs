# Domain Model

## Glossary

### Authorization
A payment authorization is the process of verifying that a customer's payment method (credit card, bank account, etc.) has sufficient funds and is valid for a transaction. The funds are reserved but not yet captured.

### Capture
The process of actually collecting the authorized funds from the customer's payment method. This typically happens after goods are shipped or services are delivered.

### Commerce Charge
A financial transaction processed through the Passkey Commerce system, originating from legacy applications and requiring payment processing.

### EJB (Enterprise JavaBean)
A server-side software component that encapsulates business logic in a distributed application. In Passkey Commerce, EJBs handle payment processing operations.

### Merchant Account
A type of bank account that allows businesses to accept payments via credit cards or other electronic payment methods. Different merchant accounts support different payment gateways.

### Payment Black Box (PBB)
Cvent's shared payment processing service that provides a unified interface to multiple payment gateways and handles PCI compliance requirements.

### Refund
The process of returning money to a customer for a previously completed transaction. Can be full or partial refunds.

### Transaction
A complete payment operation including authorization, capture, and any subsequent refunds or adjustments.

## Core Entities

### Payment Transaction
**Description**: Represents a complete payment operation from initiation to completion.

**Attributes**:
- `transactionId`: String - Unique identifier for the transaction
- `orderId`: String - Business order identifier
- `amount`: BigDecimal - Transaction amount
- `currency`: String - Currency code (USD, EUR, etc.)
- `status`: TransactionStatus - Current transaction state
- `merchantAccountId`: String - Associated merchant account
- `paymentMethod`: PaymentMethod - Payment method details
- `createdDate`: Date - Transaction creation timestamp
- `lastModifiedDate`: Date - Last update timestamp

**Relationships**:
- One-to-many with TransactionEvents
- Many-to-one with MerchantAccount
- One-to-many with RefundTransactions

### Merchant Account
**Description**: Configuration for payment processing through specific gateways.

**Attributes**:
- `merchantAccountId`: String - Unique merchant account identifier
- `accountType`: MerchantAccountType - Type (AUTHORIZE_NET, STRIPE, CPS)
- `gatewayConfiguration`: Map<String, String> - Gateway-specific settings
- `isActive`: Boolean - Account status
- `supportedOperations`: Set<PaymentOperation> - Supported operations

**Relationships**:
- One-to-many with PaymentTransactions
- Many-to-one with PaymentGateway

### Payment Method
**Description**: Customer payment information (tokenized for security).

**Attributes**:
- `paymentMethodId`: String - Unique identifier
- `type`: PaymentMethodType - Card, bank account, etc.
- `token`: String - Tokenized payment information
- `lastFourDigits`: String - Last four digits for display
- `expirationDate`: String - Expiration date (for cards)
- `billingAddress`: Address - Billing address information

**Relationships**:
- One-to-many with PaymentTransactions

### Transaction Event
**Description**: Audit trail of transaction state changes and operations.

**Attributes**:
- `eventId`: String - Unique event identifier
- `transactionId`: String - Associated transaction
- `eventType`: EventType - Type of event (AUTH, CAPTURE, REFUND, etc.)
- `eventDate`: Date - When the event occurred
- `amount`: BigDecimal - Amount involved in the event
- `status`: EventStatus - Success, failure, pending
- `gatewayResponse`: String - Raw gateway response
- `errorCode`: String - Error code if applicable
- `errorMessage`: String - Error description

**Relationships**:
- Many-to-one with PaymentTransaction

### Scheduled Transaction
**Description**: Transactions queued for automated processing by the scheduler.

**Attributes**:
- `scheduledTransactionId`: String - Unique identifier
- `originalTransactionId`: String - Reference to original transaction
- `operationType`: ScheduledOperationType - CAPTURE or REFUND
- `scheduledDate`: Date - When to process
- `amount`: BigDecimal - Amount to process
- `attempts`: Integer - Number of processing attempts
- `maxAttempts`: Integer - Maximum retry attempts
- `status`: ScheduledStatus - PENDING, PROCESSING, COMPLETED, FAILED

**Relationships**:
- Many-to-one with PaymentTransaction

### Event
**Description**: Business event associated with commerce transactions (from legacy systems).

**Attributes**:
- `eventId`: String - Unique event identifier
- `eventName`: String - Event name/title
- `eventDate`: Date - Event date
- `location`: String - Event location
- `organizerId`: String - Event organizer identifier

**Relationships**:
- One-to-many with PaymentTransactions (for event-related payments)

### Bed
**Description**: Hotel accommodation details for hospitality-related transactions.

**Attributes**:
- `bedId`: String - Unique bed identifier
- `bedType`: String - Type of bed (single, double, queen, king)
- `roomId`: String - Associated room identifier
- `isAvailable`: Boolean - Availability status

**Relationships**:
- Many-to-one with Room
- One-to-many with ReservationTransactions

## Business Rules

### Payment Authorization Rules
1. **Amount Validation**: Transaction amount must be greater than zero and within merchant account limits
2. **Card Validation**: Credit card must pass Luhn algorithm validation
3. **Expiration Check**: Card expiration date must be in the future
4. **Merchant Account**: Must have an active merchant account configured for the payment method type

### Capture Rules
1. **Authorization Required**: Can only capture previously authorized transactions
2. **Amount Limits**: Capture amount cannot exceed authorized amount
3. **Time Limits**: Captures must occur within gateway-specific time windows (typically 7-30 days)
4. **Status Check**: Original transaction must be in AUTHORIZED status

### Refund Rules
1. **Completed Transaction**: Can only refund completed (captured) transactions
2. **Amount Limits**: Refund amount cannot exceed captured amount
3. **Partial Refunds**: Multiple partial refunds allowed up to original amount
4. **Time Limits**: Refunds subject to gateway and card network time limits

### Scheduled Processing Rules
1. **Retry Logic**: Failed transactions are retried up to maximum attempt limit
2. **Batch Processing**: Transactions processed in configurable batch sizes
3. **Priority Ordering**: Transactions processed in chronological order
4. **Error Handling**: Failed transactions are logged and flagged for manual review

## State Transitions

### Payment Transaction States
```
INITIATED → AUTHORIZED → CAPTURED → COMPLETED
    ↓           ↓           ↓
  FAILED    EXPIRED    REFUNDED
                         ↓
                    PARTIALLY_REFUNDED
```

### Scheduled Transaction States
```
PENDING → PROCESSING → COMPLETED
   ↓          ↓
FAILED ← RETRY_PENDING
```

## Data Relationships

### Entity Relationship Overview
```
MerchantAccount (1) ←→ (N) PaymentTransaction
PaymentTransaction (1) ←→ (N) TransactionEvent
PaymentTransaction (1) ←→ (N) ScheduledTransaction
PaymentMethod (1) ←→ (N) PaymentTransaction
Event (1) ←→ (N) PaymentTransaction
```

### Key Foreign Key Relationships
- `PaymentTransaction.merchantAccountId` → `MerchantAccount.merchantAccountId`
- `PaymentTransaction.paymentMethodId` → `PaymentMethod.paymentMethodId`
- `TransactionEvent.transactionId` → `PaymentTransaction.transactionId`
- `ScheduledTransaction.originalTransactionId` → `PaymentTransaction.transactionId`

## Validation Rules

### Data Validation
1. **Required Fields**: All mandatory fields must be present and non-null
2. **Format Validation**: Dates, amounts, and identifiers must follow specified formats
3. **Range Validation**: Amounts must be within acceptable ranges
4. **Reference Integrity**: Foreign key references must exist

### Business Validation
1. **Duplicate Prevention**: Prevent duplicate transactions with same order ID
2. **Concurrent Modification**: Handle concurrent updates to transaction status
3. **Audit Trail**: Maintain complete audit trail for all transaction changes
4. **Compliance**: Ensure PCI DSS compliance for payment data handling

## Integration Constraints

### External System Constraints
1. **Gateway Limits**: Respect payment gateway transaction limits and rate limits
2. **Network Timeouts**: Handle network timeouts and connection failures gracefully
3. **Data Format**: Ensure data formats match external system requirements
4. **Security**: Maintain security standards for data transmission

### Internal System Constraints
1. **Database Constraints**: Respect database schema constraints and indexes
2. **Transaction Boundaries**: Maintain proper transaction boundaries for data consistency
3. **Concurrency**: Handle concurrent access to shared resources
4. **Performance**: Optimize for high-volume transaction processing

## Domain Events

### Payment Events
- `PaymentAuthorized`: Fired when payment is successfully authorized
- `PaymentCaptured`: Fired when authorized payment is captured
- `PaymentRefunded`: Fired when payment is refunded
- `PaymentFailed`: Fired when payment operation fails

### Scheduled Events
- `TransactionScheduled`: Fired when transaction is queued for processing
- `ScheduledProcessingCompleted`: Fired when scheduled processing completes
- `ScheduledProcessingFailed`: Fired when scheduled processing fails

### System Events
- `MerchantAccountConfigured`: Fired when merchant account is configured
- `GatewayConnectionEstablished`: Fired when gateway connection is established
- `SystemHealthCheck`: Periodic system health status events