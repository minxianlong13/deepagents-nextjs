# Domain Model

## Glossary

### Access Code
A 20-character globally unique identifier used in booking URLs to identify specific attendee group types. Uses safe character set to avoid homoglyphs and provides secure access to event booking.

### Attendee Group Type
A category of attendees within an event (VIP, general, staff, speakers). Each group type has its own access code, cutoff date, guarantee plan, and room allocation limits.

### Attendee
An individual who is attending an event and needs hotel accommodations. Attendees can make reservations for themselves and additional guests.

### Block
A group of hotel rooms reserved for an event, typically at negotiated rates. Blocks have specific availability periods and booking deadlines.

### Booking Contact
The primary contact person for a reservation, responsible for payment and communication regarding the booking.

### Entity
A base domain object that represents a business concept within the Passkey system. All domain objects extend from this base entity.

### Event
A conference, meeting, or gathering that requires hotel accommodations for attendees. Events are associated with specific hotels and room blocks.

### Guest
An individual who will be staying in a hotel room. A reservation can have multiple guests, with one designated as the primary guest.

### Guarantee Plan
Payment and guarantee requirements for reservations. Types include Guest Credit Card (card required at booking), Guest Other Payment (alternative methods with due dates), and Master Guarantee (rooming list or master billing).

### Owner
The organization or individual who owns/organizes an event and manages the associated hotel bookings and room blocks.

### Payer
The person or entity responsible for payment of a hotel reservation. May be different from the guest staying in the room.

### Reservation (Res)
A confirmed hotel booking that includes room details, guest information, dates, and payment information.

### Queue-It
A virtual waiting room service used for high-demand event launches to prevent system overload. Provides rate limiting and custom branding. This is separate from the waitlist functionality.

### Room Block
A specific allocation of rooms within a hotel that are reserved for an event, with defined rates and availability periods.

### Waitlist
A queue for reservations when inventory is exhausted. Uses FIFO (first-in-first-out) processing when rooms become available. This is different from Queue-It, which is a virtual waiting room for high-traffic situations.

## Core Entities

### Guest
**Description**: Represents an individual who will be staying in a hotel room

**Attributes**:
- `guestId`: Long - Unique identifier for the guest
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Guest's email address
- `phone`: String - Guest's phone number
- `dateOfBirth`: Date - Guest's date of birth
- `specialRequests`: String - Any special accommodation requests
- `isPrimary`: Boolean - Whether this is the primary guest for the reservation

**Relationships**:
- Belongs to one or more Reservations
- Associated with ChildProfile for minors
- Linked to BookingContact for communication

### Reservation (ResRoomInfo)
**Description**: A confirmed hotel booking with all associated details

**Attributes**:
- `reservationId`: Long - Unique reservation identifier
- `confirmationNumber`: String - Human-readable confirmation code
- `checkInDate`: Date - Reservation check-in date
- `checkOutDate`: Date - Reservation check-out date
- `numberOfNights`: Integer - Duration of stay
- `numberOfGuests`: Integer - Total number of guests
- `roomType`: String - Type of room reserved
- `totalAmount`: BigDecimal - Total cost of reservation
- `status`: String - Current reservation status
- `createdDate`: Date - When reservation was created
- `modifiedDate`: Date - Last modification timestamp

**Relationships**:
- Contains multiple Guests
- Associated with one Payer
- Linked to ResCharges for billing details
- Connected to Block for room allocation
- Has ResReminder for notifications

### Payer
**Description**: Entity responsible for payment of a hotel reservation

**Attributes**:
- `payerId`: Long - Unique payer identifier
- `firstName`: String - Payer's first name
- `lastName`: String - Payer's last name
- `email`: String - Payer's email address
- `phone`: String - Payer's phone number
- `billingAddress`: Address - Billing address information
- `paymentMethod`: String - Preferred payment method

**Relationships**:
- Associated with CreditCard for payment processing
- Linked to multiple Reservations
- Connected to BookingContact

### CreditCard
**Description**: Payment card information for processing reservations

**Attributes**:
- `cardId`: Long - Unique card identifier
- `cardNumber`: String - Encrypted card number
- `expiryMonth`: Integer - Card expiration month
- `expiryYear`: Integer - Card expiration year
- `cardType`: String - Type of credit card (Visa, MasterCard, etc.)
- `nameOnCard`: String - Cardholder name
- `billingZip`: String - Billing ZIP code

**Relationships**:
- Belongs to one Payer
- Used for multiple Reservations
- Associated with payment transactions

### Block
**Description**: A group of hotel rooms reserved for an event

**Attributes**:
- `blockId`: Long - Unique block identifier
- `blockName`: String - Descriptive name for the block
- `hotelId`: Long - Associated hotel identifier
- `eventId`: Long - Associated event identifier
- `startDate`: Date - Block availability start date
- `endDate`: Date - Block availability end date
- `cutoffDate`: Date - Last date for bookings
- `totalRooms`: Integer - Total rooms in block
- `availableRooms`: Integer - Currently available rooms
- `rate`: BigDecimal - Negotiated room rate

**Relationships**:
- Contains multiple Reservations
- Associated with specific Hotel
- Linked to Event
- Connected to Amenities

### AttendeeGroupType
**Description**: A category of attendees within an event with specific access and rates

**Attributes**:
- `groupTypeId`: Long - Unique group type identifier
- `groupTypeName`: String - Name of the attendee group (VIP, General, Staff)
- `accessCode`: String - 20-character unique code for booking URLs
- `eventId`: Long - Associated event identifier
- `cutoffDate`: Date - Group-specific cutoff date (can override event default)
- `maxRoomAllocation`: Integer - Maximum rooms allocated to this group
- `rollupFlag`: Boolean - Whether counts aggregate to parent totals

**Relationships**:
- Belongs to one Event
- Associated with GuaranteePlan
- Linked to multiple Reservations

### GuaranteePlan
**Description**: Payment and guarantee requirements for reservations

**Attributes**:
- `planId`: Long - Unique plan identifier
- `planName`: String - Descriptive name for the plan
- `paymentType`: String - Type of payment (Guest Credit Card, Guest Other Payment, Master Guarantee)
- `cvvRequired`: Boolean - Whether CVV validation is required
- `billingAddressRequired`: Boolean - Whether billing address is required
- `dueDate`: Date - When payment is due
- `customText`: String - Custom instructions for alternative payment methods

**Relationships**:
- Associated with Events (default plan)
- Can be overridden by AttendeeGroupType
- Linked to EcommercePolicy

### Bed
**Description**: Bed configuration options for hotel rooms

**Attributes**:
- `bedId`: Long - Unique bed identifier
- `bedType`: String - Type of bed (King, Queen, Twin, etc.)
- `quantity`: Integer - Number of beds of this type
- `description`: String - Detailed bed description

**Relationships**:
- Associated with room types
- Linked to guest preferences

### Addon
**Description**: Additional services or amenities that can be added to a reservation

**Attributes**:
- `addonId`: Long - Unique addon identifier
- `name`: String - Addon name
- `description`: String - Detailed description
- `price`: BigDecimal - Additional cost
- `category`: String - Addon category (parking, breakfast, etc.)
- `isOptional`: Boolean - Whether addon is optional

**Relationships**:
- Can be added to Reservations
- Associated with Hotels
- Linked to pricing rules

### ResCharges
**Description**: Detailed billing information for a reservation

**Attributes**:
- `chargeId`: Long - Unique charge identifier
- `reservationId`: Long - Associated reservation
- `chargeType`: String - Type of charge (room, tax, fee, etc.)
- `amount`: BigDecimal - Charge amount
- `description`: String - Charge description
- `chargeDate`: Date - When charge was applied

**Relationships**:
- Belongs to one Reservation
- Associated with payment processing
- Linked to tax calculations

### Language
**Description**: Language preferences and localization settings

**Attributes**:
- `languageId`: Long - Unique language identifier
- `languageCode`: String - ISO language code (en-US, es-ES, etc.)
- `languageName`: String - Display name for language
- `isActive`: Boolean - Whether language is currently supported

**Relationships**:
- Associated with Guest preferences
- Linked to localized content
- Connected to BusinessText for translations

### BusinessText
**Description**: Localized text content for the application

**Attributes**:
- `textId`: Long - Unique text identifier
- `textKey`: String - Key for text lookup
- `languageCode`: String - Language for this text
- `textValue`: String - Localized text content
- `category`: String - Text category or section

**Relationships**:
- Associated with Language
- Used throughout the application for localization

## Business Rules

### Reservation Rules
1. **Check-in Date**: Must be in the future and within block availability period
2. **Check-out Date**: Must be after check-in date
3. **Guest Capacity**: Number of guests cannot exceed room capacity
4. **Payment Required**: Valid payment method required for confirmation based on guarantee plan
5. **Cutoff Date**: Reservations must be made before block cutoff date (or attendee group cutoff if different)
6. **Access Code**: Valid access code required in booking URL to determine attendee group type and available rates

### Attendee Group Rules
1. **Access Code**: Each attendee group type has a unique 20-character access code for booking URLs
2. **Room Allocation**: Cannot exceed maximum room allocation for the attendee group type
3. **Cutoff Date**: Group-specific cutoff dates can override event default cutoff
4. **Guarantee Plan**: Groups can have their own guarantee plan overriding the event default

### Guest Rules
1. **Primary Guest**: Each reservation must have exactly one primary guest
2. **Age Verification**: Guests under 18 require ChildProfile
3. **Contact Information**: Primary guest must have valid email and phone
4. **Special Requests**: Limited to 500 characters

### Payment Rules
1. **Guarantee Plan Compliance**: Payment must comply with the applicable guarantee plan requirements
2. **Credit Card Validation**: When required by guarantee plan, card must pass validation checks
3. **Billing Address**: Must match credit card billing address when required
4. **Payment Authorization**: Payment must be authorized before confirmation
5. **Refund Policy**: Cancellations subject to hotel and block policies

### Waitlist Rules
1. **FIFO Processing**: Waitlisted reservations processed in first-in-first-out order
2. **Auto-fulfill**: Automatic fulfillment when rooms become available (if enabled)
3. **Separate from Queue-It**: Waitlist is for inventory exhaustion; Queue-It is for traffic management

### Block Rules
1. **Availability**: Rooms must be available in block for booking
2. **Rate Validity**: Block rates valid only during specified period
3. **Capacity Limits**: Cannot exceed total rooms allocated to block
4. **Booking Window**: Reservations only accepted within booking window

### Data Integrity Rules
1. **Audit Trail**: All entities extend AuditableEntity for change tracking
2. **Soft Deletes**: Entities marked as inactive rather than deleted
3. **Referential Integrity**: Foreign key relationships maintained
4. **Data Validation**: Input validation at entity and service levels

## Entity Relationships

### Core Relationship Diagram
```
Event
  ├── AttendeeGroupType (1:N)
  │   ├── AccessCode (1:1)
  │   ├── GuaranteePlan (N:1)
  │   └── Reservation (1:N)
  ├── Block (1:N)
  │   ├── Reservation (1:N)
  │   │   ├── Guest (1:N)
  │   │   ├── Payer (N:1)
  │   │   ├── ResCharges (1:N)
  │   │   └── ResReminder (1:N)
  │   └── Amenity (N:N)
  ├── BookingContact (1:N)
  ├── GuaranteePlan (1:1) [Default]
  └── CustomMessage (1:N)

Payer
  ├── CreditCard (1:N)
  └── Reservation (1:N)

Guest
  ├── ChildProfile (1:1)
  └── Language (N:1)
```

### Inheritance Hierarchy
```
Entity (Base)
├── AuditableEntity
│   ├── Guest
│   ├── Reservation
│   ├── Payer
│   ├── Block
│   ├── AttendeeGroupType
│   └── GuaranteePlan
└── TrackableEntity
    ├── CreditCard
    ├── ResCharges
    └── BusinessText
```

## Data Validation

### Common Validation Rules
- **Email Format**: Valid email address format required
- **Phone Numbers**: International phone number format validation
- **Dates**: Valid date ranges and logical date ordering
- **Currency**: Positive decimal values for monetary amounts
- **Text Length**: Maximum length constraints on text fields
- **Required Fields**: Non-null validation for mandatory fields

### Custom Validators
- **@GuestsDates**: Validates check-in/check-out date logic
- **@GreaterThan**: Ensures numeric values meet minimum thresholds
- **@State**: Validates state/province codes
- **Credit Card**: Luhn algorithm validation for card numbers