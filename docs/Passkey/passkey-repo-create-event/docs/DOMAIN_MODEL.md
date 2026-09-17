# Domain Model

## Glossary

### Event
A Passkey event represents a hospitality booking opportunity, typically associated with conferences, meetings, or group accommodations. Events serve as the central organizing unit for room reservations and related services.

### Bundle
A predefined template or package that contains standardized event configurations, settings, and features. Bundles enable rapid event creation with consistent configurations across similar event types.

### GML (Group Meeting List)
A specialized event type that represents group meetings or corporate events with specific requirements and configurations tailored for business travel and group accommodations.

### Affiliate
A partner organization or entity that can create and manage events within the Passkey platform, often with specific branding, commission structures, and operational requirements.

### Participant
An individual who will be attending an event and potentially making room reservations. Participants can have various roles and access levels within an event.

### Event Planner
The primary contact and organizer responsible for managing an event, including its configuration, participant management, and overall coordination.

### Commerce
The payment and financial processing aspects of an event, including payment methods, pricing structures, fees, and transaction handling.

### Guarantee Plan
A financial arrangement that defines how room reservations are guaranteed, including payment requirements, cancellation policies, and risk management.

### Room Block
A reserved allocation of hotel rooms set aside for event participants, with specific rates, availability periods, and booking terms.

### Business Text
Localized and customizable text content used throughout the event booking process, including labels, messages, notifications, and user interface elements.

### Web Setup
The configuration of the online booking interface and user experience for event participants, including branding, layout, and functional settings.

### Template
A reusable configuration pattern that defines standard settings, layouts, and features for creating consistent events across similar use cases.

## Core Entities

### Event
**Description**: The central domain entity representing a Passkey event with all its associated data and configurations.

**Key Attributes**:
- `eventId`: Long - Unique identifier for the event
- `eventName`: String - Display name of the event
- `eventDescription`: String - Detailed description of the event
- `startDate`: LocalDateTime - Event start date and time
- `endDate`: LocalDateTime - Event end date and time
- `status`: EventStatus - Current status (ACTIVE, CANCELLED, COMPLETED)
- `organizationId`: Long - Associated organization identifier

**Relationships**:
- Has one EventDetails (detailed configuration)
- Has one EventPlanner (primary contact)
- Has many Participants (attendees)
- Has one WebSetup (online interface configuration)
- Has one Commerce (payment configuration)

### EventDetails
**Description**: Comprehensive configuration and settings for an event, including all operational parameters.

**Key Attributes**:
- `eventId`: Long - Reference to parent event
- `groupType`: GroupType - Type of group (CORPORATE, ASSOCIATION, etc.)
- `expectedAttendees`: Integer - Anticipated number of participants
- `cutoffDate`: LocalDateTime - Booking cutoff date
- `eventSettings`: EventSettings - Operational settings and flags
- `guaranteePlan`: GuaranteePlan - Financial guarantee configuration

**Relationships**:
- Belongs to one Event
- Has many MarketingItems (promotional materials)
- Has one Address (event location)
- Has many AcceptedCards (payment methods)

### DefaultEvent
**Description**: Standard event creation request containing basic event information and configuration.

**Key Attributes**:
- `eventInfo`: EventInfo - Basic event information
- `eventDetails`: EventDetails - Detailed event configuration
- `webSetup`: WebSetup - Web interface settings
- `businessText`: BusinessText - Localized text content

**Relationships**:
- Composed of EventInfo, EventDetails, WebSetup, and BusinessText

### BundleEvent
**Description**: Event created from a predefined bundle template with customizable overrides.

**Key Attributes**:
- `bundleId`: Long - Reference to the bundle template
- `eventInfo`: EventInfo - Basic event information
- `customizations`: Map<String, Object> - Bundle-specific customizations
- `overrides`: EventDetails - Settings that override bundle defaults

**Relationships**:
- References a Bundle template
- Contains customized EventInfo and EventDetails

### GMLEvent
**Description**: Specialized event type for Group Meeting List events with enhanced corporate features.

**Key Attributes**:
- `gmlCode`: String - Unique GML identifier
- `assocGMLCode`: AssocGMLCode - Associated GML code information
- `corporateSettings`: Map<String, Object> - Corporate-specific configurations
- `eventInfo`: EventInfo - Basic event information

**Relationships**:
- Extends standard Event functionality
- Has specialized corporate configurations

### Participant
**Description**: Individual attendee or potential attendee of an event.

**Key Attributes**:
- `participantId`: Long - Unique participant identifier
- `firstName`: String - Participant's first name
- `lastName`: String - Participant's last name
- `email`: String - Contact email address
- `phone`: String - Contact phone number
- `role`: ParticipantRole - Role within the event (ATTENDEE, ORGANIZER, etc.)
- `registrationStatus`: RegistrationStatus - Current registration state

**Relationships**:
- Belongs to one Event
- May have multiple Reservations
- Has one UserIdentity (authentication information)

### EventPlanner
**Description**: Primary contact and organizer responsible for event management.

**Key Attributes**:
- `plannerId`: Long - Unique planner identifier
- `firstName`: String - Planner's first name
- `lastName`: String - Planner's last name
- `email`: String - Primary contact email
- `phone`: String - Contact phone number
- `organization`: String - Associated organization name

**Relationships**:
- Manages one or more Events
- Has authentication credentials
- May be associated with an Affiliate

### Commerce
**Description**: Financial and payment processing configuration for an event.

**Key Attributes**:
- `paymentTypes`: List<PaymentType> - Accepted payment methods
- `processingFees`: List<Fee> - Associated processing fees
- `taxStructure`: HotelTaxStructure - Tax calculation configuration
- `cancellationFees`: List<CancellationFee> - Cancellation penalty structure
- `guaranteeSettings`: GuaranteePlan - Payment guarantee requirements

**Relationships**:
- Belongs to one Event
- References multiple PaymentType entities
- Contains fee and tax configurations

### WebSetup
**Description**: Configuration for the online booking interface and user experience.

**Key Attributes**:
- `templateId`: Long - Reference to UI template
- `branding`: BrandingSettings - Visual branding configuration
- `features`: Map<String, Boolean> - Enabled/disabled features
- `customMessages`: List<CustomMessage> - Custom user messages
- `websiteSettings`: WebsiteSettings - General website configuration

**Relationships**:
- Belongs to one Event
- References TemplateBasic for layout
- Contains multiple CustomMessage entities

### Address
**Description**: Physical location information for events and related entities.

**Key Attributes**:
- `street1`: String - Primary street address
- `street2`: String - Secondary address line
- `city`: String - City name
- `state`: String - State or province
- `postalCode`: String - ZIP or postal code
- `country`: String - Country code
- `coordinates`: GeoCoordinates - Latitude/longitude if available

**Relationships**:
- Used by Event (event location)
- Used by Hotel (hotel address)
- Used by Participant (contact address)

### Affiliate
**Description**: Partner organization with specific operational and branding requirements.

**Key Attributes**:
- `affiliateId`: Long - Unique affiliate identifier
- `name`: String - Affiliate organization name
- `commissionRate`: BigDecimal - Commission percentage
- `brandingRequirements`: BrandingConfig - Branding specifications
- `operationalSettings`: Map<String, Object> - Affiliate-specific settings

**Relationships**:
- Can create multiple Events
- Has associated EventPlanners
- Has specific branding and operational configurations

## Business Rules

### Event Creation Rules
1. **Date Validation**: Event start date must be in the future
2. **Duration Limits**: Events cannot exceed 365 days in duration
3. **Capacity Constraints**: Expected attendees must be within reasonable limits (1-50,000)
4. **Cutoff Date Logic**: Booking cutoff must be before event start date
5. **Organization Association**: Events must be associated with a valid organization

### Event Modification Rules
1. **Active Event Constraints**: Certain fields cannot be modified after event activation
2. **Participant Impact**: Changes affecting existing participants require notification
3. **Financial Implications**: Commerce changes may require participant re-confirmation
4. **Date Change Restrictions**: Date changes have specific business rules and participant impact

### Event Cancellation Rules
1. **Cancellation Windows**: Different cancellation policies based on timing
2. **Participant Notifications**: All participants must be notified of cancellation
3. **Financial Cleanup**: Refunds and fee processing must be handled
4. **Dependency Cleanup**: Related reservations and bookings must be cancelled
5. **Audit Trail**: Cancellation reasons and timestamps must be recorded

### Participant Management Rules
1. **Unique Email Constraint**: Each participant email must be unique within an event
2. **Role Permissions**: Different participant roles have different access levels
3. **Registration Limits**: Events may have maximum participant limits
4. **Contact Requirements**: Minimum contact information must be provided

### Commerce Rules
1. **Payment Method Validation**: At least one payment method must be configured
2. **Fee Calculation**: Processing fees must be calculated consistently
3. **Tax Compliance**: Tax structures must comply with local regulations
4. **Guarantee Requirements**: Guarantee plans must meet minimum requirements
5. **Refund Policies**: Cancellation fees must follow defined policies

### Bundle and Template Rules
1. **Template Integrity**: Bundle templates must maintain referential integrity
2. **Customization Limits**: Not all bundle settings can be overridden
3. **Version Control**: Template changes affect future events, not existing ones
4. **Validation Requirements**: Bundle customizations must pass validation

### Affiliate Rules
1. **Commission Calculations**: Commission rates must be within acceptable ranges
2. **Branding Compliance**: Affiliate branding must meet platform standards
3. **Operational Boundaries**: Affiliates can only access their own events
4. **Data Isolation**: Affiliate data must be properly segregated

## Data Relationships

### Event Hierarchy
```
Event (1) -> EventDetails (1)
Event (1) -> EventPlanner (1)
Event (1) -> Participants (*)
Event (1) -> WebSetup (1)
Event (1) -> Commerce (1)
Event (1) -> Address (1)
```

### Commerce Relationships
```
Commerce (1) -> PaymentTypes (*)
Commerce (1) -> CancellationFees (*)
Commerce (1) -> HotelTaxStructure (1)
Commerce (1) -> GuaranteePlan (1)
```

### Web Configuration Relationships
```
WebSetup (1) -> TemplateBasic (1)
WebSetup (1) -> CustomMessages (*)
WebSetup (1) -> WebsiteSettings (1)
WebSetup (1) -> S3ImageMetaData (*)
```

### Affiliate Relationships
```
Affiliate (1) -> Events (*)
Affiliate (1) -> EventPlanners (*)
Affiliate (1) -> BrandingConfig (1)
```

## Domain Events

### Event Lifecycle Events
- **EventCreated**: Triggered when a new event is successfully created
- **EventModified**: Triggered when event details are updated
- **EventCancelled**: Triggered when an event is cancelled
- **EventActivated**: Triggered when an event becomes active for bookings

### Participant Events
- **ParticipantRegistered**: New participant joins an event
- **ParticipantUpdated**: Participant information is modified
- **ParticipantRemoved**: Participant is removed from an event

### Commerce Events
- **PaymentProcessed**: Payment transaction completed
- **RefundIssued**: Refund processed for cancelled booking
- **FeeCalculated**: Processing or cancellation fee calculated

### System Events
- **ValidationFailed**: Business rule validation failure
- **IntegrationError**: External service integration failure
- **AuditLogCreated**: Audit trail entry created for compliance