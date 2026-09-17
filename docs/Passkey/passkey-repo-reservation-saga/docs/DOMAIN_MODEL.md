# Domain Model

## Glossary

### Saga
A distributed transaction pattern that manages long-running business processes across multiple services. In the context of reservations, a saga coordinates the entire reservation lifecycle from initial request through completion or cancellation.

### Orchestrator
The central component that coordinates saga execution by managing the sequence of operations and handling compensation logic when failures occur.

### Compensation
The process of undoing or reversing operations when a saga fails partway through execution, ensuring the system returns to a consistent state.

### Request State
The persistent record of a reservation request's progress through the saga workflow, including current status, completed steps, and any error information.

### Batch Processing
The capability to process multiple reservation requests together as a single unit, improving efficiency for bulk operations.

### Step Function
AWS service used to implement the saga workflow as a state machine, providing visual workflow management and automatic error handling.

### Queue Processor
Lambda functions that consume messages from SQS queues to handle asynchronous reservation operations.

### Audit Transaction
A complete record of all operations performed during a reservation saga, used for compliance, debugging, and business intelligence.

### Third-Party Payment Verification
Integration with external payment processors (like Stripe 3DS) that require callback verification during the payment process.

### Housing Domain
The business domain encompassing room inventory, property management, and accommodation-related services.

## Core Entities

### ReservationRequest
**Description**: Represents a complete reservation request submitted to the saga orchestrator

**Attributes**:
- `requestId`: string - Unique identifier for the request
- `status`: RequestStatus - Current processing status
- `guestInfo`: GuestInformation - Guest details
- `reservationDetails`: ReservationDetails - Booking specifics
- `paymentInfo`: PaymentInformation - Payment details
- `propertyId`: string - Target property identifier
- `eventId`: string - Associated event identifier (optional)
- `createdAt`: Date - Request creation timestamp
- `updatedAt`: Date - Last modification timestamp

**Relationships**:
- Has one ReservationSaga
- Has multiple AuditTransactions
- References Property and Event entities

### ReservationSaga
**Description**: Represents the workflow execution state for a reservation request

**Attributes**:
- `sagaId`: string - Unique saga identifier
- `requestId`: string - Associated request identifier
- `workflowType`: SagaType - Type of saga (CREATE, MODIFY, CANCEL)
- `currentStep`: string - Current workflow step
- `completedSteps`: string[] - List of completed steps
- `failedStep`: string - Step where failure occurred (if any)
- `compensationSteps`: string[] - Compensation actions taken
- `executionArn`: string - Step Function execution ARN
- `startTime`: Date - Saga start timestamp
- `endTime`: Date - Saga completion timestamp

**Relationships**:
- Belongs to ReservationRequest
- Has multiple SagaStepExecution records

### GuestInformation
**Description**: Contains all guest-related information for a reservation

**Attributes**:
- `firstName`: string - Guest first name
- `lastName`: string - Guest last name
- `email`: string - Contact email address
- `phone`: string - Contact phone number
- `address`: Address - Guest address (optional)
- `preferences`: GuestPreferences - Room and service preferences
- `loyaltyNumber`: string - Loyalty program identifier (optional)
- `specialNeeds`: string[] - Accessibility or special requirements

**Relationships**:
- Part of ReservationRequest
- May reference existing GuestProfile

### ReservationDetails
**Description**: Specific details about the accommodation booking

**Attributes**:
- `checkIn`: Date - Check-in date
- `checkOut`: Date - Check-out date
- `roomType`: string - Requested room category
- `numberOfGuests`: number - Total guest count
- `numberOfRooms`: number - Number of rooms requested
- `rateCode`: string - Applied rate code
- `specialRequests`: string - Guest special requests
- `groupCode`: string - Group booking identifier (optional)
- `corporateCode`: string - Corporate rate identifier (optional)

**Relationships**:
- Part of ReservationRequest
- References RoomType and RateCode entities

### PaymentInformation
**Description**: Payment details and processing information

**Attributes**:
- `method`: PaymentMethod - Payment method type
- `token`: string - Tokenized payment information
- `amount`: number - Total amount in cents
- `currency`: string - Currency code (ISO 4217)
- `processorId`: string - Payment processor identifier
- `authorizationCode`: string - Payment authorization code
- `transactionId`: string - Payment transaction identifier
- `billingAddress`: Address - Billing address information

**Relationships**:
- Part of ReservationRequest
- May have multiple PaymentTransaction records

### BatchOperation
**Description**: Represents a bulk processing operation for multiple reservations

**Attributes**:
- `batchId`: string - Unique batch identifier
- `operationType`: BatchType - Type of batch operation
- `totalRequests`: number - Total number of requests in batch
- `completedRequests`: number - Number of completed requests
- `failedRequests`: number - Number of failed requests
- `status`: BatchStatus - Overall batch status
- `submittedAt`: Date - Batch submission timestamp
- `completedAt`: Date - Batch completion timestamp

**Relationships**:
- Contains multiple ReservationRequest records
- Has BatchResult summary

### AuditTransaction
**Description**: Immutable record of all operations performed during saga execution

**Attributes**:
- `transactionId`: string - Unique transaction identifier
- `requestId`: string - Associated request identifier
- `operation`: string - Operation performed
- `service`: string - Target service name
- `requestPayload`: object - Request data sent
- `responsePayload`: object - Response data received
- `status`: TransactionStatus - Operation result status
- `duration`: number - Operation duration in milliseconds
- `timestamp`: Date - Operation timestamp
- `errorDetails`: ErrorInfo - Error information (if failed)

**Relationships**:
- Belongs to ReservationRequest
- References external service operations

### Property
**Description**: Hotel or accommodation property information

**Attributes**:
- `propertyId`: string - Unique property identifier
- `name`: string - Property name
- `address`: Address - Property location
- `timezone`: string - Property timezone
- `currency`: string - Default currency
- `policies`: PropertyPolicies - Cancellation and other policies
- `amenities`: string[] - Available amenities
- `roomTypes`: RoomType[] - Available room categories

**Relationships**:
- Referenced by ReservationRequest
- Has multiple RoomType entities

### Event
**Description**: Special event or conference associated with reservations

**Attributes**:
- `eventId`: string - Unique event identifier
- `name`: string - Event name
- `startDate`: Date - Event start date
- `endDate`: Date - Event end date
- `propertyId`: string - Host property identifier
- `organizerId`: string - Event organizer identifier
- `roomBlock`: RoomBlock - Reserved room inventory
- `specialRates`: Rate[] - Event-specific rates

**Relationships**:
- Referenced by ReservationRequest
- Belongs to Property
- Has RoomBlock allocation

## Business Rules

### Reservation Creation Rules
1. **Availability Check**: Room must be available for requested dates
2. **Rate Validation**: Applied rate must be valid for dates and guest type
3. **Payment Authorization**: Payment must be successfully authorized before confirmation
4. **Guest Validation**: Guest information must meet property requirements
5. **Inventory Allocation**: Room inventory must be allocated atomically
6. **Compliance Check**: Reservation must pass regulatory compliance validation

### Modification Rules
1. **Modification Window**: Changes allowed only within policy timeframe
2. **Availability Recheck**: New dates/rooms must be available
3. **Rate Recalculation**: Pricing must be recalculated for changes
4. **Payment Adjustment**: Additional charges or refunds processed as needed
5. **Inventory Reallocation**: Original inventory released, new inventory allocated

### Cancellation Rules
1. **Cancellation Policy**: Must comply with property cancellation terms
2. **Refund Calculation**: Refund amount calculated based on policy and timing
3. **Inventory Release**: Room inventory returned to available pool
4. **Payment Reversal**: Authorized payments reversed according to policy
5. **Notification Requirements**: Cancellation notifications sent to all parties

### Saga Execution Rules
1. **Atomicity**: All operations within a saga must complete or be compensated
2. **Idempotency**: Saga steps must be safely retryable
3. **Timeout Handling**: Long-running operations must have timeout limits
4. **Error Recovery**: Failed steps must trigger appropriate compensation
5. **State Persistence**: Saga state must be persisted at each step

### Data Consistency Rules
1. **Eventual Consistency**: System accepts eventual consistency for performance
2. **Compensation Logic**: All operations must have corresponding compensation
3. **Audit Trail**: All state changes must be logged for compliance
4. **Conflict Resolution**: Concurrent modifications handled with optimistic locking
5. **Data Validation**: All data must pass validation before persistence

## State Transitions

### Request Status Flow
```
SUBMITTED → VALIDATING → PROCESSING → COMPLETED
    ↓           ↓            ↓           ↑
  FAILED ← FAILED ← COMPENSATING ← FAILED
```

### Saga Execution Flow
```
INITIATED → STEP_1 → STEP_2 → ... → STEP_N → COMPLETED
    ↓          ↓        ↓              ↓         ↑
FAILED → COMPENSATING → COMPENSATING → COMPENSATED
```

### Payment Status Flow
```
PENDING → AUTHORIZED → CAPTURED → SETTLED
    ↓         ↓          ↓         ↑
FAILED → DECLINED → REFUNDED → VOIDED
```

## Integration Patterns

### Service Communication
- **Synchronous**: Direct HTTP calls for immediate responses
- **Asynchronous**: SQS messages for batch and background processing
- **Event-Driven**: CloudWatch Events for status notifications
- **Callback**: Webhook endpoints for third-party integrations

### Data Synchronization
- **Master Data**: Property and rate information synchronized from upstream
- **Transactional Data**: Reservation state maintained locally with audit trail
- **Reference Data**: Guest profiles cached with TTL expiration
- **Configuration Data**: Feature flags and business rules updated dynamically

### Error Handling Patterns
- **Circuit Breaker**: Prevent cascade failures from downstream services
- **Retry Logic**: Exponential backoff for transient failures
- **Dead Letter Queue**: Failed messages routed for manual investigation
- **Compensation**: Automatic rollback of completed operations on saga failure