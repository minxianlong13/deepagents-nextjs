# API Reference

## Overview

Passkey Commerce exposes its functionality through Enterprise JavaBeans (EJBs) rather than traditional REST APIs. The service provides EJB interfaces for payment processing, commerce operations, and scheduled transaction management.

## EJB Interfaces

### Payment Connector EJBs

#### PBBConnectorAuthorizeNetEJB
**JNDI Name**: `java:global/group-commerce-ear/group-commerce-ejb/PBBConnectorAuthorizeNetEJB`

**Description**: Handles payment processing for Authorize.NET merchant accounts and Cvent Payment Service (CPS).

**Methods**:

##### `authorize(PaymentRequest request)`
**Description**: Authorizes a payment transaction

**Parameters**:
- `request`: PaymentRequest - Payment authorization details

**Returns**: `PaymentResponse` - Authorization result with transaction ID

**Example Usage**:
```java
@EJB
private PBBConnectorAuthorizeNetEJB authorizeNetConnector;

PaymentRequest request = new PaymentRequest();
request.setAmount(new BigDecimal("100.00"));
request.setCardNumber("4111111111111111");
request.setExpirationDate("12/25");

PaymentResponse response = authorizeNetConnector.authorize(request);
```

##### `capture(CaptureRequest request)`
**Description**: Captures a previously authorized payment

**Parameters**:
- `request`: CaptureRequest - Capture transaction details

**Returns**: `CaptureResponse` - Capture result

##### `refund(RefundRequest request)`
**Description**: Processes a refund for a completed transaction

**Parameters**:
- `request`: RefundRequest - Refund transaction details

**Returns**: `RefundResponse` - Refund processing result

#### PBBConnectorStripeEJB
**JNDI Name**: `java:global/group-commerce-ear/group-commerce-ejb/PBBConnectorStripeEJB`

**Description**: Handles payment processing for Stripe merchant accounts.

**Methods**:

##### `processPayment(StripePaymentRequest request)`
**Description**: Processes payment through Stripe gateway

**Parameters**:
- `request`: StripePaymentRequest - Stripe-specific payment details

**Returns**: `StripePaymentResponse` - Stripe payment result

##### `createPaymentIntent(PaymentIntentRequest request)`
**Description**: Creates a Stripe payment intent for client-side processing

**Parameters**:
- `request`: PaymentIntentRequest - Payment intent configuration

**Returns**: `PaymentIntentResponse` - Payment intent details

### E-commerce Scheduler EJB

#### EcommerceProcessor
**JNDI Name**: `java:global/group-commerce-ear/group-commerce-ejb/EcommerceProcessor`

**Description**: Automated processor for handling scheduled commerce operations.

**Methods**:

##### `processScheduledTransactions()`
**Description**: Processes pending captures and refunds (triggered every 3 minutes)

**Parameters**: None

**Returns**: `ProcessingResult` - Summary of processed transactions

**Scheduling**: Automatic via `@Schedule` annotation
```java
@Schedule(minute = "*/3", hour = "*", persistent = false)
public void processScheduledTransactions() {
    // Processing logic
}
```

##### `processPendingCaptures()`
**Description**: Processes pending capture transactions

**Returns**: `List<CaptureResult>` - Results of capture processing

##### `processPendingRefunds()`
**Description**: Processes pending refund transactions

**Returns**: `List<RefundResult>` - Results of refund processing

## Data Transfer Objects

### PaymentRequest
```java
public class PaymentRequest {
    private BigDecimal amount;
    private String cardNumber;
    private String expirationDate;
    private String cvv;
    private String merchantAccountId;
    private String orderId;
    private BillingAddress billingAddress;
    // getters and setters
}
```

### PaymentResponse
```java
public class PaymentResponse {
    private String transactionId;
    private String status;
    private String responseCode;
    private String responseMessage;
    private BigDecimal authorizedAmount;
    private Date transactionDate;
    // getters and setters
}
```

### CaptureRequest
```java
public class CaptureRequest {
    private String originalTransactionId;
    private BigDecimal captureAmount;
    private String merchantAccountId;
    // getters and setters
}
```

### RefundRequest
```java
public class RefundRequest {
    private String originalTransactionId;
    private BigDecimal refundAmount;
    private String reason;
    private String merchantAccountId;
    // getters and setters
}
```

## EJB Lookup Examples

### Local Interface Lookup
```java
@EJB
private PBBConnectorAuthorizeNetEJB paym entConnector;
```

### JNDI Lookup
```java
InitialContext ctx = new InitialContext();
PBBConnectorAuthorizeNetEJB connector = (PBBConnectorAuthorizeNetEJB) 
    ctx.lookup("java:global/group-commerce-ear/group-commerce-ejb/PBBConnectorAuthorizeNetEJB");
```

### Remote Lookup (from other applications)
```java
Properties props = new Properties();
props.put(Context.INITIAL_CONTEXT_FACTORY, "org.wildfly.naming.client.WildflyInitialContextFactory");
props.put(Context.PROVIDER_URL, "http-remoting://passkey-commerce-dev.core.cvent.org:8180");

InitialContext ctx = new InitialContext(props);
PBBConnectorAuthorizeNetEJB connector = (PBBConnectorAuthorizeNetEJB) 
    ctx.lookup("group-commerce-ear/group-commerce-ejb/PBBConnectorAuthorizeNetEJB!com.passkey.pbb.PBBConnectorAuthorizeNetEJB");
```

## Transaction Management

### Container Managed Transactions (CMT)
All EJBs use container-managed transactions with the following attributes:

- **REQUIRED**: Most business methods require an active transaction
- **REQUIRES_NEW**: Some operations start new transactions
- **SUPPORTS**: Read-only operations support existing transactions

### Transaction Boundaries
```java
@Stateless
@TransactionManagement(TransactionManagementType.CONTAINER)
public class PaymentProcessorEJB {
    
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public PaymentResponse processPayment(PaymentRequest request) {
        // Transaction boundary starts here
        // All database operations are part of this transaction
        // Transaction commits automatically on successful return
    }
}
```

## Error Handling

### Exception Types

#### PaymentProcessingException
```java
public class PaymentProcessingException extends Exception {
    private String errorCode;
    private String errorMessage;
    private String transactionId;
}
```

#### MerchantAccountException
```java
public class MerchantAccountException extends Exception {
    private String merchantAccountId;
    private String configurationError;
}
```

### Error Response Codes

| Code | Description | Action Required |
|------|-------------|-----------------|
| 0000 | Success | None |
| 1001 | Invalid card number | Validate input |
| 1002 | Expired card | Request new card |
| 1003 | Insufficient funds | Contact cardholder |
| 2001 | Merchant account error | Check configuration |
| 3001 | Gateway timeout | Retry operation |
| 9999 | System error | Contact support |

## Security Considerations

### Method-Level Security
```java
@RolesAllowed({"commerce-user", "admin"})
public PaymentResponse processPayment(PaymentRequest request) {
    // Method implementation
}
```

### Sensitive Data Handling
- Credit card numbers are tokenized before processing
- PCI compliance maintained through PBB integration
- Audit logging for all payment operations

## Performance Guidelines

### Connection Pooling
- Database connections are pooled and managed by Wildfly
- Optimal pool size configured per environment

### Batch Processing
- Scheduled operations process transactions in batches
- Configurable batch sizes for optimal performance

### Caching
- Merchant account configurations are cached
- Cache invalidation on configuration updates

## Integration Patterns

### Synchronous Processing
```java
// Direct EJB invocation for immediate processing
PaymentResponse response = paymentConnector.authorize(request);
```

### Asynchronous Processing
```java
// For non-critical operations
@Asynchronous
public Future<ProcessingResult> processLargeTransaction(TransactionBatch batch) {
    // Asynchronous processing
    return new AsyncResult<>(result);
}
```

## Monitoring and Metrics

### JMX Beans
- Payment processing metrics exposed via JMX
- Transaction success/failure rates
- Average processing times

### Health Checks
- EJB container health monitoring
- Database connectivity checks
- External service availability