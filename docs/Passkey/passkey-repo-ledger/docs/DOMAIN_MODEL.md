# Domain Model

## Glossary

### Balance
The current financial standing of an account holder, representing the net amount of funds available or owed. Balances can be positive (credit) or negative (debit) depending on the account type and transaction history.

### Card Association
The payment network that processes credit card transactions (e.g., Visa, MasterCard, American Express, Discover). Each association has specific rules and processing requirements.

### Credit Card Verification
The process of validating credit card information including card number format, expiry date, CVV code, and billing address without actually processing a payment transaction.

### Ledger Operation
A fundamental accounting entry that records a financial transaction related to room block commitments, deposits, and hotel reservation payments, including debits and credits that affect account balances. All operations must balance according to double-entry bookkeeping principles.

### Owner
An entity that holds a balance or account within the system. Owners can be organizational entities, properties, merchants, or other business entities that participate in financial transactions.

### PBB (Pay By Bank)
A payment method that allows customers to pay directly from their bank account without using a credit card, typically through ACH transfers or bank-to-bank transfers.

### SBG (Subblock Group)
A collection of hotel room inventory that is managed as a single unit for pricing and availability purposes. Credit card operations for SBGs may have special handling requirements.

### Transaction
A complete financial exchange that may consist of multiple operations, representing the movement of funds from one party to another through various payment methods.

### Wallet Token
A secure representation of payment information stored in a digital wallet system, allowing for payment processing without exposing sensitive card details.

## Core Entities

### Balance
**Description**: Represents the financial position of an account owner

**Attributes**:
- `ownerId`: String - Unique identifier for the balance owner
- `ownerType`: OwnerType - Type of entity (ORGANIZATIONAL_ENTITY, PROPERTY, MERCHANT)
- `amount`: BigDecimal - Current balance amount
- `currency`: String - Currency code (ISO 4217)
- `lastUpdated`: DateTime - Timestamp of last balance modification
- `version`: Long - Optimistic locking version for concurrent updates

**Relationships**:
- Related to multiple Operations that affect the balance
- Associated with an Owner entity

### Operation
**Description**: Individual ledger entry representing a financial transaction component

**Attributes**:
- `operationId`: String - Unique identifier for the operation
- `operationType`: OperationType - Type of operation (DEBIT, CREDIT, HOLD, RELEASE)
- `amount`: BigDecimal - Transaction amount
- `currency`: String - Currency code
- `ownerId`: String - Account owner identifier
- `ownerType`: OwnerType - Type of owner (ORGANIZATIONAL_ENTITY, PROPERTY, MERCHANT)
- `status`: OperationStatus - Current status (PENDING, COMPLETED, FAILED, CANCELLED)
- `timestamp`: DateTime - When the operation was created
- `description`: String - Human-readable description
- `referenceId`: String - External reference identifier
- `transactionId`: String - Parent transaction identifier

**Relationships**:
- Belongs to a Transaction
- Affects a Balance
- May have related Operations (e.g., authorization and capture)

### Transaction
**Description**: Complete financial exchange encompassing one or more operations

**Attributes**:
- `transactionId`: String - Unique transaction identifier
- `totalAmount`: BigDecimal - Total transaction amount
- `currency`: String - Transaction currency
- `status`: TransactionStatus - Overall transaction status
- `timestamp`: DateTime - Transaction initiation time
- `completedAt`: DateTime - Transaction completion time
- `paymentMethod`: PaymentMethod - Method used for payment
- `merchantId`: String - Merchant identifier (payment processing configuration for events)
- `authorizationCode`: String - Payment processor authorization code

**Relationships**:
- Contains multiple Operations
- Associated with PaymentMethod
- Linked to external payment processor records

### CreditCard
**Description**: Credit card payment instrument information

**Attributes**:
- `cardId`: String - Unique card identifier
- `cardNumber`: String - Encrypted card number
- `expiryMonth`: Integer - Card expiration month
- `expiryYear`: Integer - Card expiration year
- `cardAssociation`: CardAssociation - Card network (VISA, MASTERCARD, etc.)
- `cardType`: CardType - Type of card (CREDIT, DEBIT, PREPAID)
- `lastFourDigits`: String - Last four digits for display
- `isActive`: Boolean - Whether card is active
- `createdAt`: DateTime - Card registration timestamp

**Relationships**:
- Used in Transactions
- Associated with CardVerificationResponse
- May have multiple WalletTokens

### CardVerificationResponse
**Description**: Result of credit card verification process

**Attributes**:
- `isValid`: Boolean - Overall validation result
- `cardAssociation`: CardAssociation - Detected card network
- `cardType`: CardType - Detected card type
- `issuerCountry`: String - Card issuing country
- `cvvCheck`: VerificationResult - CVV validation result
- `addressCheck`: VerificationResult - Address validation result
- `verificationTimestamp`: DateTime - When verification was performed

**Relationships**:
- Associated with CreditCard verification request
- May trigger Transaction creation

### WalletTokenInfo
**Description**: Secure token representing payment information in wallet systems

**Attributes**:
- `tokenId`: String - Unique token identifier
- `walletType`: WalletType - Type of wallet (APPLE_PAY, GOOGLE_PAY, etc.)
- `tokenStatus`: TokenStatus - Current token status
- `expiryDate`: DateTime - Token expiration
- `lastFourDigits`: String - Last four digits of underlying card
- `deviceId`: String - Associated device identifier

**Relationships**:
- Represents a CreditCard in tokenized form
- Used in secure payment processing

### WalletContextInfo
**Description**: Additional context information for wallet-based payments

**Attributes**:
- `contextId`: String - Unique context identifier
- `deviceType`: String - Type of device used
- `appVersion`: String - Wallet application version
- `merchantCategory`: String - Merchant category code
- `transactionContext`: String - Additional transaction context

**Relationships**:
- Associated with WalletTokenInfo
- Provides context for wallet transactions

## Business Rules

### Balance Management
1. **Balance Consistency**: All balance changes must be recorded through Operations
2. **Currency Consistency**: All operations affecting a balance must use the same currency
3. **Atomic Updates**: Balance updates must be atomic to prevent race conditions
4. **Audit Trail**: Every balance change must maintain a complete audit trail

### Transaction Processing
1. **Double Entry**: Every transaction must have corresponding debit and credit operations
2. **Authorization Before Capture**: Credit card transactions require authorization before capture
3. **Idempotency**: Duplicate transaction requests must be handled idempotently
4. **Timeout Handling**: Pending transactions must have timeout mechanisms

### Credit Card Operations
1. **PCI Compliance**: Credit card data must be handled according to PCI DSS standards
2. **Tokenization**: Sensitive card data should be tokenized when possible
3. **Verification First**: Card verification should precede payment processing
4. **Retry Logic**: Failed transactions may be retried with exponential backoff

### Payment Method Validation
1. **Card Expiry**: Expired cards must be rejected
2. **CVV Validation**: CVV codes must be validated for card-present transactions
3. **Address Verification**: Billing address verification for fraud prevention
4. **Velocity Checks**: Multiple rapid transactions from same source require additional validation

### Subblock Group Rules
1. **Group Authorization**: SBG transactions require group-level authorization
2. **Inventory Linking**: SBG payments must be linked to specific inventory blocks
3. **Cancellation Policies**: SBG cancellations follow specific business rules
4. **Settlement Timing**: SBG settlements may have different timing requirements

### Wallet Integration Rules
1. **Token Validation**: Wallet tokens must be validated before use
2. **Device Binding**: Tokens may be bound to specific devices
3. **Merchant Validation**: Wallet payments require merchant validation
4. **Fallback Handling**: Wallet failures must fallback to alternative payment methods

## Data Relationships

```
Owner (1) ←→ (1..*) Balance
Balance (1) ←→ (1..*) Operation
Transaction (1) ←→ (1..*) Operation
Transaction (1) ←→ (0..1) CreditCard
CreditCard (1) ←→ (0..*) WalletTokenInfo
CreditCard (1) ←→ (0..1) CardVerificationResponse
WalletTokenInfo (1) ←→ (0..1) WalletContextInfo
```

## State Transitions

### Transaction States
- `INITIATED` → `AUTHORIZED` → `CAPTURED` → `COMPLETED`
- `INITIATED` → `FAILED`
- `AUTHORIZED` → `CANCELLED`
- `CAPTURED` → `REFUNDED`

### Operation States
- `PENDING` → `COMPLETED`
- `PENDING` → `FAILED`
- `COMPLETED` → `REVERSED` (for corrections)

### Balance States
- Balances don't have explicit states but are affected by operation state changes
- Balance history is maintained through operation audit trail

## Integration Points

### External Systems
- **Auth Service**: Owner authentication and authorization
- **Payment Processors**: Credit card processing and validation
- **Wallet Services**: Token management and wallet integration
- **Ecommerce Service**: Product and pricing information
- **Notification Service**: Transaction status updates