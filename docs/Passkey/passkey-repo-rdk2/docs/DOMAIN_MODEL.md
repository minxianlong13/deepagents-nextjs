# Domain Model

## Glossary

### Event
A housing event managed through Passkey — typically a conference, convention, or trade show that requires hotel room blocks.

### Event Hotel
A hotel associated with a specific event, containing room blocks and rates for that event's attendees.

### Hotel
A physical hotel property in the Passkey system with profile information, images, and venue certifications.

### Room Block
An allocation of hotel rooms reserved for an event at negotiated rates for specific date ranges.

### Sub-Block Group (SBG)
A subdivision of a room block assigned to a specific group or organization within an event. Manages room night allocations.

### Autoblock
Automated room block provisioning that creates blocks based on predefined rules and configurations.

### Reservation
A hotel room booking made by an attendee/participant for an event. Note: Reservations are made through booking apps (passkey-book, call center, etc.), not through Passkey Manage. RDK2 provides reservation viewing and management capabilities.

### Participant
An attendee or guest who has a reservation or is associated with an event.

### Planner
An event planner who manages housing for their organization's attendees. Accesses the planner portal.

### Notification Template
Email/communication templates used to send notifications to planners, hotels, or attendees about housing events.

### Housing Library
A reusable library of hotel and housing configurations that can be applied across events.

### Room Category
A classification of room types (e.g., Standard King, Deluxe Double) with associated attributes.

### Ledger
Financial tracking of room block commitments, deposits, and transactions.

### Transfer Log
A record of room block transfers between sub-block groups or events.

### Vendor System
An external hotel property management system integrated with Passkey for reservation synchronization.

### Registration Link (RegLink)
A URL that allows attendees to self-register and book housing for an event.

### Smart Room Assistant
An AI-powered feature that provides room assignment suggestions and optimization.

### SmartCamp Config
Configuration data for the SmartCamp feature (campus-style multi-venue events).

### Business Text
Customizable labels and text strings used throughout the UI, allowing per-organization branding.

### Guarantee Rules
Rules governing room block guarantees, including deposit requirements and cancellation policies.

## Business Rules
- Auth tokens are validated server-side on every page load via `getAuthPropsOrRedirect`
- CSRF tokens are generated and stored in localStorage for mutation protection
- User permissions are checked via passkey-permission service before rendering protected pages
- Feature flags (LaunchDarkly) control feature availability per environment and user
- Redis caching is used server-side with configurable TTLs per data type
- The app integrates with legacy Resdesk for login flow (cookie-based session sharing)
- Reports are rendered via an embedded reporting service with separate auth
- Event sorting supports multiple fields (EventSortBy, EventRequestSortBy enums)
