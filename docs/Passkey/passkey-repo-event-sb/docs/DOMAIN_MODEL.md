# Domain Model

## Glossary

### Event
A scheduled gathering or conference managed through the Passkey platform. Events have associated hotels, attendees, and various configuration settings that control booking behavior and attendee experience.

### Passkey
Cvent's hotel booking and housing management platform that enables event organizers to manage hotel reservations for their attendees. Provides tools for room block management, attendee registration, and payment processing.

### SBG (Sub-Block Group)
A subdivision used for planner access control within an event. Multiple attendee groups can share the same SBG ID, which determines planner access scope. SBGs are not the same as Attendee Group Types.

### FlipTo Settings
Configuration parameters that control automatic hotel switching behavior when primary hotels become unavailable or reach capacity. Enables seamless attendee experience by automatically offering alternative accommodations.

### Marketing Items
Additional products, services, or amenities that can be offered to event attendees during the booking process. Examples include spa packages, transportation, meal plans, or welcome gifts.

### Merchant Account
Payment processing configuration that enables the collection of payments for hotel bookings, marketing items, and other event-related charges. Contains payment gateway settings and fee structures.

### Consent
Privacy and data processing agreements that attendees must acknowledge during registration. Includes privacy policies, marketing communication preferences, and data usage consents required for GDPR compliance.

### Locale
Language and regional settings that determine how event information, dates, currencies, and other content are displayed to attendees. Supports internationalization for global events.

### Group Type
Classification system for organizing attendees into categories (e.g., VIP, Executive, Standard) that may have different booking privileges, rates, or access to amenities.

### Mail Configuration
Email template and delivery settings for automated communications sent to attendees, including confirmation emails, reminders, and promotional messages.

### Legacy Integration
Backward compatibility layer that maintains support for existing systems and data formats while transitioning to the new Spring Boot architecture.

## Core Entities

### Event
**Description**: Central entity representing a scheduled event with associated hotels and attendees.

**Attributes**:
- `id`: Long - Unique event identifier
- `name`: String - Event display name
- `description`: String - Event description
- `startDate`: LocalDateTime - Event start date and time
- `endDate`: LocalDateTime - Event end date and time
- `status`: EventStatus - Current event status (PRE_OPEN, OPEN, NEAR_CUTOFF, CLOSED, CANCELLED)
- `locale`: String - Default locale for the event
- `timezone`: String - Event timezone
- `organizerId`: Long - Reference to event organizer
- `venueId`: Long - Reference to primary venue

**Relationships**:
- One-to-many with MarketingItem
- One-to-many with FlipToSettings
- One-to-many with AttendeeGroupTypeDetails
- One-to-one with MerchantAccount
- One-to-many with Consent

**Business Rules**:
- Event start date must be before end date
- Status transitions follow defined workflow (PRE_OPEN → OPEN → NEAR_CUTOFF → CLOSED)
- Events can be CANCELLED from any state
- Locale must be supported by the system
- Events cannot be deleted once they have attendees

### MarketingItem
**Description**: Additional products or services offered to attendees during booking.

**Attributes**:
- `id`: Long - Unique marketing item identifier
- `title`: String - Display title for the item
- `description`: String - Detailed description
- `type`: MarketingItemType - Category (AMENITY, UPGRADE, SERVICE)
- `price`: BigDecimal - Item price
- `currency`: String - Price currency code
- `available`: Boolean - Availability status
- `hotelId`: Long - Associated hotel (optional)
- `eventId`: Long - Associated event
- `locale`: String - Localization setting

**Relationships**:
- Many-to-one with Event
- Many-to-one with Hotel (optional)

**Business Rules**:
- Price must be non-negative
- Currency must be valid ISO code
- Items can be hotel-specific or event-wide
- Availability can be toggled without deletion

### FlipToSettings
**Description**: Configuration parameters controlling automatic hotel switching behavior.

**Attributes**:
- `id`: Long - Unique setting identifier
- `settingName`: String - Configuration parameter name
- `settingValue`: String - Configuration value
- `description`: String - Setting description
- `eventId`: Long - Associated event

**Relationships**:
- Many-to-one with Event

**Business Rules**:
- Setting names must be from predefined list
- Values must conform to setting type constraints
- Settings are event-specific and inherited by hotels
- Changes require validation against business rules

### AttendeeGroupTypeDetails
**Description**: Information about Attendee Group Types within an event - categories of attendees (VIP, general, staff, speakers) that can be organized into Sub-Block Groups for planner access control.

**Attributes**:
- `groupId`: Long - Unique group identifier
- `groupName`: String - Display name for the group
- `groupType`: String - Group classification
- `attendeeCount`: Integer - Number of attendees in group
- `status`: GroupStatus - Current group status
- `closedDate`: LocalDateTime - When group was closed
- `eventId`: Long - Associated event

**Relationships**:
- Many-to-one with Event
- One-to-many with Attendee (implied)

**Business Rules**:
- Groups can only be closed, not reopened
- Attendee count must match actual registrations
- Group types must be predefined for the event
- Closed groups cannot accept new attendees

### MerchantAccount
**Description**: Payment processing configuration for event-related transactions.

**Attributes**:
- `merchantId`: String - External merchant identifier
- `accountName`: String - Display name for the account
- `currency`: String - Primary currency for transactions
- `paymentMethods`: List<PaymentMethod> - Supported payment types
- `status`: AccountStatus - Account status
- `eventId`: Long - Associated event
- `processingFee`: BigDecimal - Transaction processing fee percentage
- `transactionFee`: BigDecimal - Fixed transaction fee
- `settlementPeriod`: String - Payment settlement timeframe

**Relationships**:
- One-to-one with Event

**Business Rules**:
- Only one active merchant account per event
- Fees must be within acceptable ranges
- Payment methods must be enabled for the merchant
- Currency must match event's primary currency

### Consent
**Description**: Privacy and data processing agreements required for attendee registration.

**Attributes**:
- `consentId`: Long - Unique consent identifier
- `consentType`: ConsentType - Type of consent (PRIVACY_POLICY, MARKETING, etc.)
- `title`: String - Display title
- `description`: String - Consent description
- `required`: Boolean - Whether consent is mandatory
- `version`: String - Consent version number
- `effectiveDate`: LocalDateTime - When consent becomes effective
- `eventId`: Long - Associated event

**Relationships**:
- Many-to-one with Event
- Many-to-many with Attendee (through ConsentAgreement)

**Business Rules**:
- Required consents must be acknowledged before booking
- Version changes require re-acknowledgment
- Consent history must be maintained for audit
- GDPR compliance requirements must be met

## Entity Relationships

```
Event (1) ←→ (∞) MarketingItem
Event (1) ←→ (∞) FlipToSettings  
Event (1) ←→ (∞) AttendeeGroupTypeDetails
Event (1) ←→ (1) MerchantAccount
Event (1) ←→ (∞) Consent

Hotel (1) ←→ (∞) MarketingItem [optional]
Attendee (∞) ←→ (∞) Consent [through ConsentAgreement]
```

## Data Validation Rules

### Event Validation
- Event name: 1-255 characters, required
- Start/End dates: Valid datetime, start < end
- Status: Must be valid enum value
- Locale: Must be supported locale code
- Timezone: Valid timezone identifier

### Marketing Item Validation
- Title: 1-100 characters, required
- Price: >= 0, up to 2 decimal places
- Currency: Valid ISO 4217 code
- Type: Must be valid enum value

### FlipTo Settings Validation
- Setting name: Must be from approved list
- Setting value: Type-specific validation
- Numeric values: Range validation
- Boolean values: true/false only

### Consent Validation
- Title: 1-200 characters, required
- Version: Semantic versioning format
- Effective date: Cannot be in the past
- Type: Must be valid enum value

## Business Invariants

### Event Lifecycle
1. Events start in PRE_OPEN status
2. Only OPEN events accept new bookings
3. NEAR_CUTOFF events may have restricted booking
4. CLOSED events are read-only
5. CANCELLED events cannot be reactivated

### Payment Processing
1. Each event must have exactly one active merchant account
2. All prices must use the event's primary currency
3. Payment methods must be enabled for the merchant
4. Transaction fees are calculated consistently

### Data Privacy
1. Required consents must be acknowledged before booking
2. Consent withdrawal must be honored immediately
3. Personal data retention follows defined policies
4. Audit trails must be maintained for compliance

### Group Management
1. Closed groups cannot accept new members
2. Group capacity cannot exceed hotel inventory
3. VIP groups have priority over standard groups
4. Group rates must be validated against contracts

## State Transitions

### Event Status Flow
```
PRE_OPEN → OPEN → NEAR_CUTOFF → CLOSED
    ↓        ↓         ↓         ↓
    CANCELLED ← ← ← ← ← ←
```

### Group Status Flow
```
OPEN → CLOSED
  ↓
CANCELLED
```

### Consent Status Flow
```
DRAFT → ACTIVE → SUPERSEDED
   ↓       ↓
WITHDRAWN ← ←
```

## Integration Patterns

### External System Integration
- **Cvent Auth**: User authentication and authorization
- **Payment Gateway**: Transaction processing
- **Email Service**: Automated communications
- **Reporting System**: Analytics and business intelligence

### Data Synchronization
- Event data synchronized with legacy systems
- Real-time updates for booking availability
- Batch processing for reporting data
- Event-driven updates for status changes

### API Contracts
- RESTful APIs for external consumption
- GraphQL for flexible data queries
- Webhook notifications for real-time updates
- Bulk APIs for data migration and imports