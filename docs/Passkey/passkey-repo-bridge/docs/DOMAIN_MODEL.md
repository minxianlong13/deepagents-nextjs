# Domain Model

## Glossary

### Bridge Registration
A bridge registration represents a guest's intent to book a hotel room for an event. It serves as an intermediate step between event registration and actual hotel reservation confirmation.

### Registration Number
A unique identifier (acknowledgment number) generated when a bridge registration is created. Used to track and manage the registration throughout its lifecycle.

### Confirmation Number
A unique identifier for a hotel reservation provided by the hotel or booking system when a reservation is confirmed.

### Association
The link between a bridge registration and a hotel reservation, established when a guest's registration is matched with an actual hotel booking.

### Event
A gathering or conference for which hotel accommodations are being managed through the Passkey system.

### Sub-Block Group
A subdivision within an event's room block, allowing for more granular management of hotel inventory and reservations.

### Guest
The person making the hotel reservation, including their personal information and contact details.

### Travel Details
Information about the guest's stay including check-in/check-out dates, number of nights, and room preferences.

### Payment Information
Details about how the guest will guarantee or pay for their hotel reservation, including credit card information.

## Core Entities

### Registration
**Description**: The primary entity representing a bridge registration request

**Attributes**:
- `regNumber`: String - Unique registration acknowledgment number (generated)
- `eventId`: Long - Identifier of the associated event
- `subBlockGroupId`: Long - Optional sub-block group identifier
- `guest`: Guest - Guest information
- `address`: Address - Guest's address information
- `travelInfo`: TravelInfo - Travel and stay details
- `payInfo`: PayInfo - Payment and guarantee information
- `customFields`: CustomFields - Additional custom data
- `status`: String - Registration status (PENDING, CONFIRMED, CANCELLED)
- `createdDate`: DateTime - When the registration was created
- `modifiedDate`: DateTime - When the registration was last modified

**Relationships**:
- One-to-many with RegAssociation (a registration can be associated with multiple reservations)

### Guest
**Description**: Represents the person making the hotel reservation

**Attributes**:
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Contact email address
- `phone`: String - Contact phone number
- `title`: String - Optional title (Mr., Ms., Dr., etc.)
- `company`: String - Optional company name
- `rewardProgram`: RewardProgram - Optional loyalty program information

**Relationships**:
- Embedded within Registration

### Address
**Description**: Physical address information for the guest

**Attributes**:
- `address1`: String - Primary address line
- `address2`: String - Optional secondary address line
- `city`: String - City name
- `state`: String - State or province
- `postalCode`: String - ZIP or postal code
- `country`: Country - Country information

**Relationships**:
- Embedded within Registration

### TravelInfo
**Description**: Details about the guest's travel and stay

**Attributes**:
- `checkInDate`: LocalDate - Planned check-in date
- `checkOutDate`: LocalDate - Planned check-out date
- `numberOfNights`: Integer - Duration of stay
- `travelDetails`: TravelDetails - Optional flight and arrival information

**Relationships**:
- Embedded within Registration

### PayInfo
**Description**: Payment and guarantee information

**Attributes**:
- `guaranteeType`: String - Type of guarantee (CREDIT_CARD, DEPOSIT, etc.)
- `cardType`: String - Credit card type (VISA, MASTERCARD, etc.)
- `cardNumber`: String - Masked credit card number
- `expirationMonth`: Integer - Card expiration month
- `expirationYear`: Integer - Card expiration year
- `cardHolderName`: String - Name on the credit card
- `otherPayment`: OtherPayment - Alternative payment methods

**Relationships**:
- Embedded within Registration

### RegAssociation
**Description**: Links a bridge registration to a hotel reservation

**Attributes**:
- `registrationNumber`: String - Bridge registration number
- `confirmationNumber`: String - Hotel reservation confirmation number
- `associationType`: String - Type of association (CONFIRMED, PENDING, etc.)
- `associationDate`: DateTime - When the association was created

**Relationships**:
- Many-to-one with Registration

### Country
**Description**: Country information

**Attributes**:
- `code`: String - ISO country code (US, CA, etc.)
- `name`: String - Full country name

### RewardProgram
**Description**: Hotel loyalty program information

**Attributes**:
- `programName`: String - Name of the loyalty program
- `membershipNumber`: String - Guest's membership number

### CustomFields
**Description**: Additional custom data fields

**Attributes**:
- `field1`: String - Custom field 1
- `field2`: String - Custom field 2
- `field3`: String - Custom field 3
- `field4`: String - Custom field 4
- `field5`: String - Custom field 5

## Business Rules

### Registration Lifecycle
1. **Creation**: Registration starts in PENDING status
2. **Confirmation**: Status changes to CONFIRMED when associated with reservation
3. **Cancellation**: Status changes to CANCELLED, associations are removed
4. **Modification**: Existing registrations can be updated except for regNumber

### Association Rules
- A registration can be associated with multiple reservations
- Each association must have a unique combination of registration and confirmation numbers
- Associations are automatically removed when a registration is cancelled
- Unlinking removes the association but doesn't affect the registration status

### Validation Rules
- Guest first name, last name, and email are required
- Check-in date must be before check-out date
- Event ID is required for all registrations
- Credit card information must be valid if provided
- Email addresses must be in valid format
- Phone numbers should follow standard formatting

### Data Integrity
- Registration numbers are unique across the system
- Confirmation numbers can be reused across different registrations
- Soft deletes are used to maintain audit trails
- All modifications are timestamped

## Status Transitions

```
PENDING → CONFIRMED (when associated with reservation)
PENDING → CANCELLED (explicit cancellation)
CONFIRMED → CANCELLED (explicit cancellation)
CANCELLED → [terminal state]
```

## Event Relationships

- Registrations belong to specific events
- Events can have multiple sub-block groups
- Sub-block groups help organize room inventory
- Reservation counts are tracked at event and sub-block group levels