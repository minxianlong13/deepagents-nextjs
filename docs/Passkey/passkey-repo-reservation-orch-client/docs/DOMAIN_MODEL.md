# Domain Model

## Glossary

### Reservation
A booking record representing a guest's stay at a hotel, including check-in/check-out dates, room details, guest information, and payment details.

### Guest
An individual who will be staying at the hotel, including personal information, contact details, and preferences.

### Room
A physical accommodation unit at a hotel with specific characteristics like room type, bed configuration, and amenities.

### Room Night
A single night's stay in a room, used for pricing and availability calculations.

### Batch Operation
A collection of multiple reservation operations (create, modify, cancel) processed together for efficiency.

### Guarantee Type
A method of securing a reservation, typically involving payment authorization or deposit requirements.

### Add-on
Additional services or amenities that can be added to a reservation, such as breakfast, parking, or spa services.

### Commerce Transaction
Financial operations related to reservations, including payments, refunds, and authorization holds.

### Group Booking
A reservation that covers multiple rooms or guests, typically for events, conferences, or group travel.

### Orchestration
The coordination and management of complex reservation workflows across multiple systems and services.

## Core Entities

### Reservation

**Description**: The central entity representing a hotel booking with all associated details.

**Attributes**:
- `id`: String - Unique reservation identifier
- `hotelId`: String - Identifier of the hotel
- `checkIn`: LocalDate - Check-in date
- `checkOut`: LocalDate - Check-out date
- `guest`: Guest - Primary guest information
- `room`: Room - Room details and preferences
- `roomNights`: List<RoomNight> - Nightly rate breakdown
- `totalAmount`: Money - Total reservation cost
- `status`: ReservationStatus - Current reservation state
- `confirmationNumber`: String - Guest-facing confirmation code
- `payInfo`: PayInfo - Payment and billing information
- `addons`: List<Addon> - Additional services
- `auditInformation`: AuditInformation - Creation and modification tracking

**Relationships**:
- Contains one primary Guest
- Associated with one Room configuration
- May have multiple RoomNights for pricing
- Can include multiple Addons
- Links to PayInfo for financial details

### Guest

**Description**: Represents an individual guest with personal and contact information.

**Attributes**:
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Email address for communication
- `phone`: String - Primary phone number
- `address`: Address - Mailing address
- `dateOfBirth`: LocalDate - Date of birth (optional)
- `rewardProgram`: RewardProgram - Loyalty program information
- `preferences`: List<String> - Guest preferences and special requests
- `transportationInformation`: TransportationInformation - Arrival/departure details
- `consents`: List<Consent> - Privacy and marketing consents

**Relationships**:
- Belongs to one Reservation (primary guest)
- May have associated RewardProgram
- Contains Address information
- May have TransportationInformation

### Room

**Description**: Defines the accommodation details and preferences for a reservation.

**Attributes**:
- `roomType`: RoomType - Type of room (standard, suite, etc.)
- `bedType`: String - Bed configuration preference
- `smokingPreference`: String - Smoking or non-smoking
- `accessibilityFeatures`: List<String> - ADA accommodations
- `floorPreference`: String - Preferred floor level
- `viewPreference`: String - Room view preference
- `maxOccupancy`: Integer - Maximum number of guests

**Relationships**:
- Associated with RoomType for categorization
- Part of one Reservation

### RoomNight

**Description**: Represents pricing and details for a single night of a reservation.

**Attributes**:
- `date`: LocalDate - The specific night
- `rate`: Money - Nightly rate amount
- `taxes`: Money - Tax amount for the night
- `fees`: Money - Additional fees
- `total`: Money - Total cost for the night
- `rateCode`: String - Rate plan identifier
- `roomTypeCode`: String - Room type for this night

**Relationships**:
- Belongs to one Reservation
- Multiple RoomNights make up the full stay

### Money

**Description**: Represents monetary amounts with currency information.

**Attributes**:
- `amount`: BigDecimal - Monetary amount
- `currency`: String - ISO currency code (USD, EUR, etc.)

**Business Rules**:
- All monetary calculations must preserve precision
- Currency conversions handled at service level
- Amounts are immutable once created

### PayInfo

**Description**: Contains payment and billing information for a reservation.

**Attributes**:
- `cardMetadata`: CardMetadata - Credit card information (tokenized)
- `billingAddress`: Address - Billing address
- `paymentMethod`: String - Type of payment method
- `authorizationCode`: String - Payment authorization reference
- `transactionId`: String - Payment processor transaction ID

**Relationships**:
- Belongs to one Reservation
- Contains CardMetadata for payment details
- Associated with billing Address

### Addon

**Description**: Additional services or amenities that can be added to a reservation.

**Attributes**:
- `code`: String - Service code identifier
- `name`: String - Human-readable service name
- `description`: String - Detailed service description
- `price`: Money - Cost of the addon
- `quantity`: Integer - Number of units
- `date`: LocalDate - Date when service is provided (optional)
- `category`: String - Service category (dining, recreation, etc.)

**Relationships**:
- Belongs to one Reservation
- May be date-specific or for entire stay

### Address

**Description**: Physical address information for guests and billing.

**Attributes**:
- `street1`: String - Primary street address
- `street2`: String - Secondary address line (optional)
- `city`: String - City name
- `state`: String - State or province
- `postalCode`: String - ZIP or postal code
- `country`: String - Country code (ISO format)

**Relationships**:
- Used by Guest for mailing address
- Used by PayInfo for billing address

### Batch Models

#### BatchStatus

**Description**: Represents the overall status of a batch operation.

**Attributes**:
- `batchId`: String - Unique batch identifier
- `status`: ProcessStatus - Overall batch status
- `totalOperations`: Integer - Total number of operations in batch
- `completedOperations`: Integer - Number of completed operations
- `failedOperations`: Integer - Number of failed operations
- `results`: List<BatchOperationResult> - Individual operation results

#### BatchOperationResult

**Description**: Result of an individual operation within a batch.

**Attributes**:
- `clientReferenceId`: String - Client-provided operation identifier
- `operationType`: String - Type of operation (CREATE, MODIFY, CANCEL)
- `status`: ProcessStatus - Operation status
- `reservation`: Reservation - Resulting reservation (if successful)
- `error`: ReservationErrorResponse - Error details (if failed)

## Business Rules

### Reservation Lifecycle
1. **Creation**: New reservations start in PENDING status
2. **Confirmation**: Successful processing moves to CONFIRMED
3. **Modification**: Changes create new version with audit trail
4. **Cancellation**: Cancelled reservations retain history but cannot be modified

### Payment Processing
- All payments must be authorized before reservation confirmation
- Refunds follow hotel-specific cancellation policies
- Payment information is tokenized for security

### Date Validation
- Check-in date must be in the future (except for same-day bookings)
- Check-out date must be after check-in date
- Maximum stay length enforced per hotel policy

### Guest Information
- Primary guest must be 18 years or older
- Valid email address required for confirmation
- Phone number required for contact purposes

### Room Assignment
- Room type availability validated at booking time
- Special requests handled as preferences, not guarantees
- Accessibility requirements prioritized in room assignment

### Batch Operations
- Maximum 100 operations per batch
- All operations in batch must use same authentication
- Client reference IDs must be unique within batch
- Partial batch failures are supported

### Audit Trail
- All reservation changes tracked with timestamps
- User/system identification for each modification
- Immutable audit records for compliance

## Status Enumerations

### Reservation.ProcessStatus
- `PENDING` - Initial state, processing not started
- `PROCESSING` - Operation in progress
- `SUCCESS` - Operation completed successfully
- `FAILED` - Operation failed with errors
- `TIMEOUT` - Operation exceeded time limit

### ReservationStatus
- `CONFIRMED` - Reservation is confirmed and active
- `CANCELLED` - Reservation has been cancelled
- `NO_SHOW` - Guest did not arrive for reservation
- `CHECKED_IN` - Guest has checked in
- `CHECKED_OUT` - Guest has completed stay

### PaymentStatus
- `AUTHORIZED` - Payment method authorized
- `CAPTURED` - Payment has been processed
- `REFUNDED` - Payment has been refunded
- `FAILED` - Payment processing failed

## Data Validation Rules

### Required Fields
- Reservation: hotelId, checkIn, checkOut, guest
- Guest: firstName, lastName, email
- Room: roomType
- Money: amount, currency

### Format Validation
- Email addresses must be valid format
- Phone numbers follow international format
- Dates in ISO-8601 format
- Currency codes follow ISO-4217 standard

### Business Constraints
- Stay length: minimum 1 night, maximum 30 nights
- Advance booking: up to 365 days in future
- Guest age: minimum 18 years for primary guest
- Payment amounts: must be positive values