# Domain Model

## Glossary

### ARI (Availability, Rates, and Inventory)
Hotel industry standard for managing room availability, pricing, and inventory data. Used for real-time updates between hotel systems and booking platforms.

### Amadeus
Global travel technology platform providing APIs for hotel booking, flight reservations, and travel management services.

### GroupLink (GL)
Passkey's group booking management system that handles group reservations, room blocks, and group-specific workflows.

### GML (Group Management Layer)
API layer that provides group booking functionality, including group creation, modification, and management operations.

### Hash ID
Unique identifier used for vendor system identification in LaunchDarkly feature flag contexts.

### Hotel PMS (Property Management System)
Software used by hotels to manage operations including reservations, guest check-in/out, room assignments, and billing.

### Inbound Transfer
Process of receiving and processing hotel reservation data from external systems into Passkey's internal format. Part of the two-way RBX (Room Block Transfer) integration with hotel PMS systems.

### LaunchDarkly
Feature flag management platform used for controlled feature rollouts and A/B testing.

### PBB Gateway
Payment processing gateway for handling credit card transactions and payment workflows.

### RBX (Room Block Transfer)
Two-way reservation synchronization integration with hotel Property Management Systems (PMS). Enables bidirectional data exchange for reservation updates between Passkey and hotel systems.

### Transporter
Component responsible for data transfer between different hotel systems and Passkey services.

### Vendor System
External hotel PMS (Property Management System) integrated with Passkey for two-way reservation sync through RBX (Room Block Transfer).

### XML Transformation
Process of converting XML data formats between different hotel system schemas and Passkey's internal format.

## Core Entities

### Hotel
**Description**: Represents a hotel property with its basic information and configuration

**Attributes**:
- `hotelId`: String - Unique hotel identifier
- `hotelName`: String - Display name of the hotel
- `hotelCode`: String - Hotel's internal code
- `address`: Address - Physical location information
- `contactInfo`: ContactInfo - Hotel contact details
- `amenities`: List<String> - Available hotel amenities
- `roomTypes`: List<RoomType> - Available room categories

**Relationships**:
- Has many Reservations
- Has many RoomTypes
- Has many GroupBookings

### Reservation
**Description**: Individual hotel booking record

**Attributes**:
- `reservationId`: String - Unique reservation identifier
- `confirmationNumber`: String - Guest-facing confirmation code
- `hotelId`: String - Associated hotel identifier
- `guestName`: String - Primary guest name
- `checkIn`: LocalDate - Check-in date
- `checkOut`: LocalDate - Check-out date
- `roomType`: String - Booked room category
- `rate`: BigDecimal - Nightly room rate
- `totalAmount`: BigDecimal - Total booking cost
- `status`: ReservationStatus - Current reservation state
- `createdAt`: Instant - Booking creation timestamp
- `modifiedAt`: Instant - Last modification timestamp

**Relationships**:
- Belongs to Hotel
- May belong to GroupBooking
- Has many Payments
- Has many TransferLogs

### GroupBooking
**Description**: Group reservation containing multiple individual bookings

**Attributes**:
- `groupId`: String - Unique group identifier
- `groupName`: String - Group event name
- `hotelId`: String - Host hotel identifier
- `checkIn`: LocalDate - Group arrival date
- `checkOut`: LocalDate - Group departure date
- `totalRooms`: Integer - Total rooms in block
- `blockedRooms`: Integer - Rooms currently blocked
- `availableRooms`: Integer - Rooms available for booking
- `rateCode`: String - Special group rate code
- `status`: GroupStatus - Current group state
- `contactInfo`: ContactInfo - Group organizer details
- `cutoffDate`: LocalDate - Booking deadline

**Relationships**:
- Belongs to Hotel
- Has many Reservations
- Has one ContactInfo

### Transfer
**Description**: Data transfer record for hotel PMS integrations supporting two-way reservation sync through RBX (Room Block Transfer)

**Attributes**:
- `transferId`: String - Unique transfer identifier
- `sourceSystem`: String - Originating system name
- `targetSystem`: String - Destination system name
- `transferType`: TransferType - Type of data transfer
- `originalData`: String - Raw input data
- `transformedData`: String - Processed output data
- `status`: TransferStatus - Processing state
- `errors`: List<String> - Processing error messages
- `processedAt`: Instant - Processing start time
- `completedAt`: Instant - Processing completion time

**Relationships**:
- May relate to Reservation
- Has many TransferLogs

### Payment
**Description**: Payment transaction record

**Attributes**:
- `paymentId`: String - Unique payment identifier
- `reservationId`: String - Associated reservation
- `amount`: BigDecimal - Payment amount
- `currency`: String - Payment currency code
- `paymentMethod`: PaymentMethod - Payment type
- `gatewayTransactionId`: String - Gateway reference
- `status`: PaymentStatus - Transaction state
- `processedAt`: Instant - Payment processing time
- `gatewayResponse`: String - Gateway response data

**Relationships**:
- Belongs to Reservation
- May have Refunds

### Email
**Description**: Email communication record

**Attributes**:
- `emailId`: String - Unique email identifier
- `templateId`: String - Email template used
- `recipient`: String - Recipient email address
- `subject`: String - Email subject line
- `status`: EmailStatus - Delivery status
- `sentAt`: Instant - Send timestamp
- `deliveredAt`: Instant - Delivery confirmation time
- `data`: Map<String, Object> - Template data variables

**Relationships**:
- May relate to Reservation
- May relate to GroupBooking

### ContactInfo
**Description**: Contact information for guests and group organizers

**Attributes**:
- `name`: String - Full contact name
- `email`: String - Email address
- `phone`: String - Phone number
- `company`: String - Company/organization name
- `address`: Address - Mailing address

**Relationships**:
- Used by GroupBooking
- Used by Reservation

## Business Rules

### Reservation Management
- Check-in date must be before check-out date
- Reservations cannot be created for past dates
- Confirmation numbers must be unique within a hotel
- Room type must be available for the requested dates
- Guest information is required for all reservations

### Group Booking Rules
- Group bookings require minimum 10 rooms
- Cutoff date must be at least 30 days before arrival
- Room blocks automatically release after cutoff date
- Group rates are valid only within the group booking period
- Group organizer contact information is mandatory

### Payment Processing
- Payments must be processed before check-in
- Refunds require original payment reference
- Payment amounts must match reservation totals
- Credit card information is encrypted and tokenized
- Failed payments trigger automatic retry logic

### Transfer Processing
- All inbound transfers must be validated against schema
- Failed transfers are queued for manual review
- Transfer logs are retained for audit purposes
- Duplicate transfers are detected and rejected
- XML transformations preserve data integrity

### Email Communications
- Confirmation emails are sent immediately after booking
- Modification emails are triggered by reservation changes
- Group organizers receive summary reports
- Email delivery failures trigger retry attempts
- Unsubscribe requests are honored immediately

### Feature Flag Management
- LaunchDarkly flags control feature availability
- Vendor system ID is used as context for flag evaluation
- Boolean flags control simple on/off features
- JSON flags support complex feature configurations
- Local development supports mock flag values

## Data Validation Rules

### Date Validation
- All dates must be in ISO 8601 format (YYYY-MM-DD)
- Check-in dates cannot be in the past
- Stay duration cannot exceed 365 days
- Group booking periods cannot exceed 30 days

### Financial Validation
- All monetary amounts use BigDecimal for precision
- Currency codes must be valid ISO 4217 codes
- Negative amounts are not allowed for charges
- Payment amounts must match reservation totals

### Contact Information Validation
- Email addresses must be valid format
- Phone numbers must include country code
- Names cannot contain special characters
- Company names are optional but recommended for groups

### System Integration Validation
- Hotel IDs must exist in the system
- Room types must be valid for the specific hotel
- Rate codes must be active and applicable
- Vendor system identifiers must be registered PMS systems

## State Transitions

### Reservation Status Flow
```
PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT
    ↓         ↓            ↓
CANCELLED  MODIFIED   NO_SHOW
```

### Group Booking Status Flow
```
TENTATIVE → CONFIRMED → ACTIVE → COMPLETED
     ↓          ↓         ↓
CANCELLED  MODIFIED  EXPIRED
```

### Transfer Status Flow
```
RECEIVED → PROCESSING → COMPLETED
    ↓          ↓           ↓
QUEUED    FAILED    VALIDATED
```

### Payment Status Flow
```
PENDING → PROCESSING → COMPLETED
    ↓         ↓           ↓
FAILED   CANCELLED   REFUNDED
```