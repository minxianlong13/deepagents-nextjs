# Domain Model

## Glossary

### Payment
A financial transaction associated with a hotel reservation, representing money transfer from guest to hotel for accommodation or services.

### Reservation
A booking record for hotel accommodation, containing guest information, room details, dates, and associated payments.

### Wallet
A secure storage mechanism for guest payment methods, enabling quick and secure payment processing for future transactions.

### Rate
The pricing structure for hotel rooms, including base rates, taxes, fees, and applicable discounts or promotions.

### Tokenization
The process of replacing sensitive payment data with non-sensitive tokens that can be safely stored and transmitted.

### Group Payment
A payment mechanism that allows splitting costs across multiple reservations or guests within a single transaction.

### Commerce Order
An order for additional hotel services, amenities, or products beyond basic accommodation.

### Payment Method
A specific way to pay (credit card, bank account, etc.) that has been registered and tokenized in the system.

### Split Folio
Multiple payment methods for a single reservation, allowing guests to pay using different payment sources for the same booking.

### Merchant Account
Event-specific payment processing configuration that includes CVV2 collection settings, billing address verification requirements, and authorize-before-reservation options. Events can have a default merchant account with PBB (Payment Black Box) integration.

### Refund
A reversal of a previous payment, returning money to the guest's original payment method.

## Core Entities

### Payment
**Description**: Represents a financial transaction for hotel services

**Attributes**:
- `paymentId`: String - Unique identifier for the payment
- `reservationId`: String - Associated reservation identifier
- `guestId`: String - Guest who made the payment
- `amount`: BigDecimal - Payment amount
- `currency`: String - Currency code (ISO 4217)
- `status`: PaymentStatus - Current payment state
- `paymentMethodId`: String - Reference to payment method used
- `transactionId`: String - External payment processor transaction ID
- `paymentType`: PaymentType - Type of payment (DEPOSIT, FULL, BALANCE)
- `createdAt`: DateTime - Payment creation timestamp
- `updatedAt`: DateTime - Last modification timestamp
- `processedAt`: DateTime - When payment was processed
- `notes`: String - Additional payment notes

**Relationships**:
- Belongs to one Reservation
- Belongs to one Guest
- Uses one Payment Method
- May have multiple Refunds

### Reservation
**Description**: A hotel booking record containing accommodation details

**Attributes**:
- `reservationId`: String - Unique reservation identifier
- `hotelId`: String - Hotel where reservation is made
- `guestId`: String - Primary guest identifier
- `roomTypeId`: String - Type of room reserved
- `checkInDate`: LocalDate - Arrival date
- `checkOutDate`: LocalDate - Departure date
- `numberOfGuests`: Integer - Total guest count
- `totalAmount`: BigDecimal - Total reservation cost
- `currency`: String - Currency for pricing
- `status`: ReservationStatus - Current reservation state
- `rateCode`: String - Applied rate code
- `promoCode`: String - Applied promotional code
- `createdAt`: DateTime - Reservation creation time

**Relationships**:
- Has many Payments
- Belongs to one Hotel
- Belongs to one Guest
- May have one Group Payment
- May have multiple Commerce Orders

### PaymentMethod
**Description**: A tokenized payment instrument stored in guest wallet

**Attributes**:
- `paymentMethodId`: String - Unique identifier
- `guestId`: String - Owner of the payment method
- `token`: String - Tokenized payment data
- `type`: PaymentMethodType - Type of payment method
- `lastFour`: String - Last four digits for display
- `expiryMonth`: Integer - Card expiry month (if applicable)
- `expiryYear`: Integer - Card expiry year (if applicable)
- `cardBrand`: String - Card brand (VISA, MASTERCARD, etc.)
- `isDefault`: Boolean - Whether this is the default payment method
- `billingAddress`: Address - Associated billing address
- `createdAt`: DateTime - When payment method was added
- `isActive`: Boolean - Whether payment method is active

**Relationships**:
- Belongs to one Guest
- Used by many Payments

### Rate
**Description**: Pricing information for hotel rooms

**Attributes**:
- `rateId`: String - Unique rate identifier
- `hotelId`: String - Associated hotel
- `roomTypeId`: String - Associated room type
- `rateCode`: String - Rate code identifier
- `rateName`: String - Display name for rate
- `baseRate`: BigDecimal - Base room rate
- `currency`: String - Rate currency
- `effectiveDate`: LocalDate - When rate becomes effective
- `expiryDate`: LocalDate - When rate expires
- `minStay`: Integer - Minimum stay requirement
- `maxStay`: Integer - Maximum stay allowed
- `advanceBooking`: Integer - Advance booking requirement in days
- `isRefundable`: Boolean - Whether bookings are refundable
- `cancellationPolicy`: String - Cancellation terms

**Relationships**:
- Belongs to one Hotel
- Belongs to one Room Type
- Used in many Pricing Calculations

### GroupPayment
**Description**: A payment that covers multiple reservations

**Attributes**:
- `groupPaymentId`: String - Unique identifier
- `groupId`: String - Group identifier
- `totalAmount`: BigDecimal - Total payment amount
- `currency`: String - Payment currency
- `paymentMethodId`: String - Payment method used
- `splitType`: SplitType - How payment is divided
- `status`: PaymentStatus - Current status
- `createdAt`: DateTime - Creation timestamp
- `processedAt`: DateTime - Processing timestamp

**Relationships**:
- Has many Payments (individual reservation payments)
- Uses one Payment Method
- Has many Payment Splits

### CommerceOrder
**Description**: An order for additional hotel services or amenities

**Attributes**:
- `orderId`: String - Unique order identifier
- `reservationId`: String - Associated reservation
- `guestId`: String - Guest placing the order
- `totalAmount`: BigDecimal - Total order amount
- `currency`: String - Order currency
- `status`: OrderStatus - Current order status
- `orderType`: OrderType - Type of order
- `createdAt`: DateTime - Order creation time
- `confirmedAt`: DateTime - Order confirmation time

**Relationships**:
- Belongs to one Reservation
- Belongs to one Guest
- Has many Order Items
- May have one Payment

### Refund
**Description**: A reversal of a previous payment

**Attributes**:
- `refundId`: String - Unique refund identifier
- `paymentId`: String - Original payment being refunded
- `refundAmount`: BigDecimal - Amount being refunded
- `currency`: String - Refund currency
- `reason`: String - Reason for refund
- `refundType`: RefundType - Full or partial refund
- `status`: RefundStatus - Current refund status
- `processedAt`: DateTime - When refund was processed
- `externalRefundId`: String - External processor refund ID

**Relationships**:
- Belongs to one Payment

### SplitFolio
**Description**: Multiple payment methods applied to a single reservation

**Attributes**:
- `splitFolioId`: String - Unique identifier
- `reservationId`: String - Associated reservation
- `totalAmount`: BigDecimal - Total reservation amount
- `currency`: String - Currency for all payments
- `status`: SplitFolioStatus - Current status
- `createdAt`: DateTime - Creation timestamp

**Relationships**:
- Belongs to one Reservation
- Has many Split Folio Payments

## Enumerations

### PaymentStatus
- `PENDING` - Payment initiated but not processed
- `PROCESSING` - Payment being processed
- `COMPLETED` - Payment successfully processed
- `FAILED` - Payment processing failed
- `CANCELLED` - Payment was cancelled
- `REFUNDED` - Payment has been refunded

### PaymentType
- `DEPOSIT` - Partial payment to secure reservation
- `FULL` - Complete payment for reservation
- `BALANCE` - Remaining balance payment
- `ADDITIONAL` - Payment for additional services

### PaymentMethodType
- `CREDIT_CARD` - Credit or debit card
- `BANK_ACCOUNT` - Bank account transfer
- `DIGITAL_WALLET` - Digital wallet (PayPal, Apple Pay, etc.)
- `CORPORATE_CARD` - Corporate credit card

### ReservationStatus
- `PENDING` - Reservation created but not confirmed
- `CONFIRMED` - Reservation confirmed and guaranteed
- `CHECKED_IN` - Guest has checked in
- `CHECKED_OUT` - Guest has checked out
- `CANCELLED` - Reservation was cancelled
- `NO_SHOW` - Guest did not arrive

### SplitType
- `EQUAL` - Split payment equally among reservations
- `CUSTOM` - Custom split amounts specified
- `PERCENTAGE` - Split by percentage

### OrderStatus
- `PENDING` - Order placed but not confirmed
- `CONFIRMED` - Order confirmed by hotel
- `FULFILLED` - Order completed/delivered
- `CANCELLED` - Order was cancelled

### RefundType
- `FULL` - Complete refund of payment
- `PARTIAL` - Partial refund of payment

### RefundStatus
- `PENDING` - Refund initiated but not processed
- `PROCESSING` - Refund being processed
- `COMPLETED` - Refund successfully processed
- `FAILED` - Refund processing failed

### SplitFolioStatus
- `PENDING` - Split folio created but payments not processed
- `PARTIAL` - Some payments completed
- `COMPLETED` - All payments processed successfully
- `FAILED` - One or more payments failed

## Business Rules

### Payment Processing Rules
1. **Payment Authorization**: All payments must be authorized before processing
2. **Currency Consistency**: Payment currency must match reservation currency
3. **Amount Validation**: Payment amount cannot exceed reservation total
4. **Payment Method Validation**: Payment method must be active and not expired
5. **Duplicate Prevention**: Prevent duplicate payments for the same reservation

### Pricing Calculation Rules
1. **Rate Availability**: Rates must be available for requested dates
2. **Minimum Stay**: Reservation must meet minimum stay requirements
3. **Advance Booking**: Reservation must meet advance booking requirements
4. **Tax Calculation**: Taxes calculated based on hotel location and guest residency
5. **Discount Application**: Discounts applied in order of precedence

### Wallet Management Rules
1. **Tokenization Required**: All payment methods must be tokenized before storage
2. **PCI Compliance**: No raw payment data stored in system
3. **Expiry Validation**: Expired payment methods cannot be used for new payments
4. **Default Payment Method**: Each guest can have only one default payment method
5. **Inactive Methods**: Inactive payment methods cannot be used for transactions

### Group Payment Rules
1. **Reservation Validation**: All reservations in group must exist and be valid
2. **Currency Consistency**: All reservations must use same currency
3. **Split Validation**: Custom splits must sum to total payment amount
4. **Authorization**: Group payment requires authorization from group organizer
5. **Individual Tracking**: Each reservation gets individual payment record

### Refund Processing Rules
1. **Original Payment**: Refunds can only be processed against completed payments
2. **Refund Limits**: Refund amount cannot exceed original payment amount
3. **Time Limits**: Refunds subject to hotel cancellation policy time limits
4. **Method Consistency**: Refunds processed to original payment method when possible
5. **Partial Refunds**: Multiple partial refunds allowed up to original amount

### Commerce Order Rules
1. **Reservation Association**: Orders must be associated with valid reservation
2. **Guest Authorization**: Only reservation guest or authorized users can place orders
3. **Availability Validation**: Ordered items must be available for reservation dates
4. **Payment Required**: Orders require payment before confirmation
5. **Modification Limits**: Order modifications subject to hotel policies

### Split Folio Rules
1. **Payment Method Validation**: All payment methods must be valid and active
2. **Amount Reconciliation**: Sum of split payments must equal reservation total
3. **Currency Consistency**: All payment methods must use same currency as reservation
4. **Guarantee Plan Compliance**: Split folio must comply with event's guarantee plan requirements
5. **Processing Order**: Payments processed in order specified by guest

## Data Relationships

```
Guest
├── PaymentMethods (1:N)
├── Reservations (1:N)
└── Payments (1:N)

Reservation
├── Payments (1:N)
├── CommerceOrders (1:N)
└── GroupPayment (N:1)

Payment
├── PaymentMethod (N:1)
├── Refunds (1:N)
└── Reservation (N:1)

GroupPayment
├── Payments (1:N)
└── PaymentSplits (1:N)

CommerceOrder
├── OrderItems (1:N)
└── Payment (1:1)

Hotel
├── Rates (1:N)
└── Reservations (1:N)

Rate
├── Hotel (N:1)
└── RoomType (N:1)
```

## Domain Events

### Payment Events
- `PaymentCreated` - New payment initiated
- `PaymentCompleted` - Payment successfully processed
- `PaymentFailed` - Payment processing failed
- `PaymentRefunded` - Payment refund processed

### Reservation Events
- `ReservationPaymentReceived` - Payment received for reservation
- `ReservationFullyPaid` - Reservation payment completed
- `ReservationPaymentOverdue` - Payment deadline passed

### Wallet Events
- `PaymentMethodAdded` - New payment method added to wallet
- `PaymentMethodRemoved` - Payment method removed from wallet
- `PaymentMethodExpired` - Payment method expired

### Commerce Events
- `OrderCreated` - New commerce order placed
- `OrderConfirmed` - Order confirmed by hotel
- `OrderCancelled` - Order cancelled