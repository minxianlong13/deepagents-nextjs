# Domain Model

## Glossary

### Add-on
A supplementary service or product that can be purchased in addition to a hotel reservation. Examples include airport shuttles, spa services, meal packages, or room upgrades.

### Marketable Add-on
An add-on that is available for purchase and can be associated with reservations. These are configured by hotel administrators and define pricing, availability, and purchase rules.

### Reservation Add-on
An instance of a marketable add-on that has been associated with a specific reservation. This represents the actual purchase or selection of an add-on by a guest.

### Confirmation Number
A unique identifier for a hotel reservation, used to link add-ons to specific bookings.

### Block
A group of hotel rooms reserved for a specific event or group. Add-ons can be associated at the block level to apply to all reservations within that block.

### GL Code (General Ledger Code)
An accounting code used to categorize revenue from add-on sales for financial reporting purposes.

### Guest
The person staying in the hotel room who can select and purchase add-ons.

### Event
A specific occasion or gathering (conference, wedding, etc.) for which hotel reservations and add-ons are managed.

### Hotel
The property where reservations are made and add-ons are provided.

## Core Entities

### Addon
**Description**: Base entity representing any type of add-on in the system

**Attributes**:
- `id`: String - Unique identifier for the add-on
- `name`: String - Display name of the add-on
- `description`: String - Detailed description of what the add-on provides
- `isActive`: Boolean - Whether the add-on is currently available

**Relationships**:
- Extended by MarketableAddon and ReservationAddon

### MarketableAddon
**Description**: An add-on available for purchase, with pricing and availability rules

**Attributes**:
- `id`: String - Unique identifier
- `name`: String - Add-on name
- `description`: String - Detailed description
- `price`: BigDecimal - Cost per unit
- `currency`: String - Currency code (e.g., "USD")
- `blockId`: Long - Associated block identifier (optional)
- `hotelId`: Long - Associated hotel identifier
- `eventId`: Long - Associated event identifier
- `guestCanSelectQuantity`: Boolean - Whether guests can choose quantity
- `maxQuantityPerGuest`: Integer - Maximum units per guest (if quantity selection enabled)
- `maxQuantityPerEventFlag`: Boolean - Whether there's an event-wide limit
- `maxQuantityPerEvent`: Integer - Maximum units for entire event
- `glCode`: String - General ledger code for accounting
- `isActive`: Boolean - Availability status
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:
- Belongs to Hotel (via hotelId)
- Belongs to Event (via eventId)
- Optionally belongs to Block (via blockId)
- Can have multiple ReservationAddons

**Business Rules**:
- Either blockId OR (hotelId AND eventId) must be specified
- If guestCanSelectQuantity is true, maxQuantityPerGuest must be positive
- If maxQuantityPerEventFlag is true, maxQuantityPerEvent must be positive
- Price must be non-negative
- Currency must be a valid ISO currency code

### ReservationAddon
**Description**: An add-on that has been associated with a specific reservation

**Attributes**:
- `id`: String - Unique identifier for this association
- `addonId`: String - Reference to the MarketableAddon
- `confirmationNumber`: String - Reservation confirmation number
- `quantity`: Integer - Number of units selected
- `guestId`: String - Identifier of the guest who selected the add-on
- `guestName`: String - Name of the guest
- `specialRequests`: String - Additional requests or notes (optional)
- `status`: ReservationAddonStatus - Current status of the add-on
- `unitPrice`: BigDecimal - Price per unit at time of selection
- `totalPrice`: BigDecimal - Total cost (unitPrice × quantity)
- `currency`: String - Currency code
- `createdAt`: DateTime - When the association was created
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:
- References MarketableAddon (via addonId)
- Belongs to Reservation (via confirmationNumber)
- Belongs to Guest (via guestId)

**Business Rules**:
- Quantity must be positive
- Total price must equal unit price × quantity
- Status transitions follow defined workflow
- Cannot exceed maxQuantityPerGuest from MarketableAddon

### ReservationAddonRequest
**Description**: Request model for creating or updating reservation add-on associations

**Attributes**:
- `addonId`: String - ID of the marketable add-on to associate
- `quantity`: Integer - Desired quantity
- `guestId`: String - Guest making the selection
- `specialRequests`: String - Optional special requests

**Validation Rules**:
- addonId must reference an active MarketableAddon
- quantity must be positive and within allowed limits
- guestId must be valid

### AddonMarketingItemRequest
**Description**: Request model for creating marketable add-ons

**Attributes**:
- `name`: String - Add-on name (required)
- `description`: String - Description (required)
- `price`: BigDecimal - Unit price (required, non-negative)
- `currency`: String - Currency code (required)
- `blockId`: Long - Block association (optional)
- `hotelId`: Long - Hotel association (required if no blockId)
- `eventId`: Long - Event association (required if no blockId)
- `guestCanSelectQuantity`: Boolean - Quantity selection flag
- `maxQuantityPerGuest`: Integer - Guest quantity limit
- `maxQuantityPerEventFlag`: Boolean - Event limit flag
- `maxQuantityPerEvent`: Integer - Event quantity limit
- `glCode`: String - Accounting code (optional)

## Enumerations

### ReservationAddonStatus
**Description**: Possible states of a reservation add-on

**Values**:
- `PENDING`: Add-on selected but not yet confirmed
- `CONFIRMED`: Add-on confirmed and will be provided
- `CANCELLED`: Add-on has been cancelled
- `COMPLETED`: Add-on has been delivered/consumed
- `REFUNDED`: Add-on was cancelled and refunded

### FilterOptions
**Description**: Options for filtering marketable add-ons

**Values**:
- `ACTIVE_ONLY`: Show only active add-ons
- `AVAILABLE_FOR_BOOKING`: Show add-ons available for new bookings
- `HAS_INVENTORY`: Show add-ons with available inventory

## Business Rules

### Add-on Creation Rules
1. **Association Requirements**: Every marketable add-on must be associated with either:
   - A specific block (blockId), OR
   - A hotel and event combination (hotelId + eventId)

2. **Quantity Management**: 
   - If guests can select quantity, a maximum per guest must be defined
   - If there's an event-wide limit, the maximum per event must be specified
   - Quantity limits must be positive integers

3. **Pricing Rules**:
   - Prices must be non-negative
   - Currency must be specified and valid
   - GL codes should follow organizational accounting standards

### Reservation Association Rules
1. **Availability**: Only active marketable add-ons can be associated with reservations
2. **Quantity Limits**: Associations must respect per-guest and per-event quantity limits
3. **Guest Validation**: Guest must be associated with the reservation
4. **Status Workflow**: Add-on status must follow valid state transitions

### Cancellation Rules
1. **Reservation Cancellation**: When a reservation is cancelled, all associated add-ons are automatically cancelled
2. **Individual Cancellation**: Individual add-ons can be cancelled without affecting the reservation
3. **Refund Processing**: Cancelled add-ons may be eligible for refunds based on hotel policy

## Data Relationships

```
Hotel (1) ──────────── (*) MarketableAddon
Event (1) ──────────── (*) MarketableAddon
Block (1) ──────────── (*) MarketableAddon (optional)

MarketableAddon (1) ── (*) ReservationAddon
Reservation (1) ─────── (*) ReservationAddon
Guest (1) ──────────── (*) ReservationAddon
```

## Integration Points

### Reservation Orchestrator
- Provides reservation data and confirmation numbers
- Triggers add-on association during booking process
- Handles reservation lifecycle events

### Auth Service
- Validates API keys and user permissions
- Provides authentication context for operations

### Business Text Service
- Supplies localized text for add-on names and descriptions
- Supports multi-language add-on content

### Payment Processing
- Handles financial transactions for add-on purchases
- Processes refunds for cancelled add-ons

## Domain Events

### AddonCreated
Triggered when a new marketable add-on is created
- Contains add-on details and association information
- Used for cache invalidation and notifications

### ReservationAddonAssociated
Triggered when add-ons are associated with a reservation
- Contains reservation and add-on details
- Used for inventory management and billing

### ReservationAddonCancelled
Triggered when add-ons are cancelled
- Contains cancellation details and reason
- Used for refund processing and inventory updates