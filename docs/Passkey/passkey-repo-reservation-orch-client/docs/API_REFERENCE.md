# API Reference

## Base URL

The client library connects to the Reservation Orchestrator API at configurable base URLs:
- **Alpha Environment**: `https://housing-api-alpha.passkey.com/bookings/`
- **Production Environment**: `https://housing-api.passkey.com/bookings/`

## Authentication

All API calls require authentication via API key in the Authorization header:
```
Authorization: API_KEY <your-api-key>
```

## ReservationClient

The primary client for single reservation operations.

### Constructor

```java
ReservationClient(String baseUrl)
```

**Parameters**:
- `baseUrl` - Base URL of the Reservation Orchestrator API

### create()

Creates a new reservation asynchronously.

```java
ReservationOperation create(String authHeader, Reservation reservation)
```

**Parameters**:
- `authHeader` - Authorization header with API key
- `reservation` - Reservation object to create

**Returns**: `ReservationOperation` for monitoring the creation process

**Example**:
```java
ReservationClient client = new ReservationClient("https://housing-api-alpha.passkey.com/bookings/");
Reservation reservation = Reservation.builder()
    .hotelId("hotel123")
    .checkIn(LocalDate.of(2024, 6, 1))
    .checkOut(LocalDate.of(2024, 6, 3))
    .guest(guest)
    .room(room)
    .build();

ReservationOperation operation = client.create("API_KEY xxx", reservation);
ReservationProcessResult result = operation.monitor();
```

### modify()

Modifies an existing reservation.

```java
ReservationOperation modify(String authHeader, Reservation reservation)
```

**Parameters**:
- `authHeader` - Authorization header with API key
- `reservation` - Modified reservation object

**Returns**: `ReservationOperation` for monitoring the modification process

### cancel()

Cancels an existing reservation.

```java
ReservationOperation cancel(String authHeader, CancelRequest cancelRequest)
```

**Parameters**:
- `authHeader` - Authorization header with API key
- `cancelRequest` - Cancellation request details

**Returns**: `ReservationOperation` for monitoring the cancellation process

### get()

Retrieves a reservation by ID.

```java
Reservation get(String authHeader, String reservationId)
```

**Parameters**:
- `authHeader` - Authorization header with API key
- `reservationId` - Unique identifier of the reservation

**Returns**: `Reservation` object

## BatchReservationClient

Client for bulk reservation operations.

### Constructor

```java
BatchReservationClient(String baseUrl)
```

### createBatch()

Creates a new batch for bulk operations.

```java
Batch createBatch(String authHeader)
```

**Parameters**:
- `authHeader` - Authorization header with API key

**Returns**: `Batch` object for adding operations

### Batch Operations

#### create()

Adds a create operation to the batch.

```java
void create(Reservation reservation, String clientReferenceId)
```

**Parameters**:
- `reservation` - Reservation to create
- `clientReferenceId` - Unique client-provided identifier for tracking

#### modify()

Adds a modify operation to the batch.

```java
void modify(Reservation reservation, String clientReferenceId)
```

#### cancel()

Adds a cancel operation to the batch.

```java
void cancel(Reservation reservation, String clientReferenceId)
```

#### submit()

Submits all operations in the batch for processing.

```java
void submit()
```

#### monitor()

Monitors the batch until completion.

```java
BatchStatus monitor()
```

**Returns**: `BatchStatus` with overall batch results

**Example**:
```java
BatchReservationClient client = new BatchReservationClient("https://housing-api-alpha.passkey.com/bookings/");
Batch batch = client.createBatch("API_KEY xxx");

// Add operations
batch.create(reservation1, "ref-001");
batch.modify(reservation2, "ref-002");
batch.cancel(reservation3, "ref-003");

// Submit and monitor
batch.submit();
BatchStatus status = batch.monitor();

if (status.getStatus() == BatchStatus.ProcessStatus.SUCCESS) {
    // Process results
    for (BatchOperationResult result : status.getResults()) {
        System.out.println("Operation " + result.getClientReferenceId() + ": " + result.getStatus());
    }
}
```

## CommerceClient

Client for payment and commerce operations.

### Constructor

```java
CommerceClient(String baseUrl)
```

### processPayment()

Processes payment for a reservation.

```java
PaymentResult processPayment(String authHeader, PaymentRequest paymentRequest)
```

**Parameters**:
- `authHeader` - Authorization header with API key
- `paymentRequest` - Payment processing request

**Returns**: `PaymentResult` with transaction details

### refundPayment()

Processes a refund for a previous payment.

```java
RefundResult refundPayment(String authHeader, RefundRequest refundRequest)
```

## GroupBookingClient

Client for group reservation operations.

### Constructor

```java
GroupBookingClient(String baseUrl)
```

### createGroupBooking()

Creates a new group booking.

```java
GroupBookingOperation createGroupBooking(String authHeader, GroupBookingRequest request)
```

**Parameters**:
- `authHeader` - Authorization header with API key
- `request` - Group booking request details

**Returns**: `GroupBookingOperation` for monitoring

### modifyGroupBooking()

Modifies an existing group booking.

```java
GroupBookingOperation modifyGroupBooking(String authHeader, GroupBookingRequest request)
```

## ApplyGuaranteeTypeClient

Client for guarantee type operations.

### Constructor

```java
ApplyGuaranteeTypeClient(String baseUrl)
```

### applyGuaranteeType()

Applies a guarantee type to a reservation.

```java
GuaranteeResult applyGuaranteeType(String authHeader, GuaranteeRequest request)
```

**Parameters**:
- `authHeader` - Authorization header with API key
- `request` - Guarantee application request

**Returns**: `GuaranteeResult` with application status

## Operation Monitoring

### ReservationOperation

Represents an asynchronous reservation operation.

#### monitor()

Monitors the operation until completion with default timeout.

```java
ReservationProcessResult monitor()
```

#### monitor(Duration timeout)

Monitors with custom timeout.

```java
ReservationProcessResult monitor(Duration timeout)
```

#### getStatus()

Gets current operation status without blocking.

```java
ReservationStatusResponse getStatus()
```

### Status Codes

#### Reservation.ProcessStatus
- `SUCCESS` - Operation completed successfully
- `FAILED` - Operation failed with errors
- `PROCESSING` - Operation still in progress
- `TIMEOUT` - Operation timed out

#### BatchStatus.ProcessStatus
- `SUCCESS` - All operations completed successfully
- `PARTIAL_SUCCESS` - Some operations succeeded, others failed
- `FAILED` - All operations failed
- `PROCESSING` - Batch still processing

## Error Handling

### ReservationErrorException

Thrown when reservation operations encounter errors.

```java
public class ReservationErrorException extends Exception {
    public ReservationErrorResponse getErrorResponse();
    public int getHttpStatusCode();
}
```

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "INVALID_REQUEST",
  "message": "Missing required field: hotelId",
  "details": {
    "field": "hotelId",
    "code": "REQUIRED_FIELD_MISSING"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid API key"
}
```

#### 404 Not Found
```json
{
  "error": "RESERVATION_NOT_FOUND",
  "message": "Reservation with ID 'res123' not found"
}
```

#### 409 Conflict
```json
{
  "error": "RESERVATION_CONFLICT",
  "message": "Reservation has been modified by another process",
  "details": {
    "currentVersion": "v2",
    "requestedVersion": "v1"
  }
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Rate Limit**: 1000 requests per minute per API key
- **Batch Limit**: 100 operations per batch
- **Headers**: Rate limit information returned in response headers
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

## Best Practices

### Connection Management
- Reuse client instances when possible
- Configure appropriate timeouts for your use case
- Implement proper connection pooling for high-volume applications

### Error Handling
- Always handle `ReservationErrorException` for operation failures
- Implement retry logic with exponential backoff for transient errors
- Log error details for debugging and monitoring

### Batch Operations
- Use batch operations for bulk processing to improve performance
- Keep batch sizes reasonable (recommended: 50-100 operations)
- Provide meaningful client reference IDs for result tracking

### Monitoring
- Use operation monitoring for long-running processes
- Set appropriate timeouts based on expected processing time
- Implement proper logging for operation status tracking