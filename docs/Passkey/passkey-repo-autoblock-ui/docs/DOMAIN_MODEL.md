# Domain Model

## Glossary

### Autoblock
A pre-negotiated block of hotel rooms reserved for event attendees at special rates. Event organizers can create autoblocks to guarantee room availability and pricing for their events.

### Guestside Site
The customer-facing website where event attendees can search, view, and book hotel rooms from available autoblocks. This is the primary interface for end users.

### Site Editor
The administrative interface used by event organizers and hotel coordinators to configure autoblock sites, manage content, and customize the guest experience.

### Widget
Reusable UI components that provide specific functionality (hotel search, room selection, contact forms, etc.). Widgets can be configured and arranged to create custom autoblock sites.

### Passkey
Cvent's hotel booking platform that connects event organizers with hotels to manage room blocks and reservations for events and meetings.

### Room Block
A specific allocation of hotel rooms set aside for an event, typically with negotiated rates and terms. Multiple room blocks can exist within a single autoblock.

### Booking Workflow
The multi-step process guests follow to search for hotels, select rooms, provide contact information, and complete their reservation.

### Nucleus
Cvent's internal design system and component library that provides consistent UI patterns, themes, and components across applications.

## Core Entities

### Hotel
**Description**: Represents a hotel property with rooms available for booking

**Attributes**:
- `id`: String - Unique hotel identifier
- `name`: String - Hotel name
- `description`: String - Hotel description and overview
- `starRating`: Number - Hotel star rating (1-5)
- `address`: Address - Physical location details
- `contactInfo`: ContactInfo - Phone, email, website
- `amenities`: Array<Amenity> - Hotel facilities and services
- `images`: Array<Image> - Hotel photos and media
- `location`: GeoLocation - Latitude/longitude coordinates
- `policies`: Array<Policy> - Cancellation, pet, smoking policies

**Relationships**:
- Has many Rooms
- Has many Bookings
- Belongs to many Autoblocks

### Room
**Description**: Represents a bookable room type within a hotel

**Attributes**:
- `id`: String - Unique room identifier
- `name`: String - Room type name (e.g., "Standard King")
- `description`: String - Room details and features
- `capacity`: Number - Maximum occupancy
- `bedConfiguration`: String - Bed types and quantities
- `size`: Number - Room size in square feet
- `amenities`: Array<Amenity> - Room-specific amenities
- `images`: Array<Image> - Room photos
- `pricing`: RoomPricing - Rate information
- `availability`: Availability - Current availability status

**Relationships**:
- Belongs to Hotel
- Has many BookedRooms
- Has many RoomSelections

### Booking
**Description**: Represents a completed hotel reservation

**Attributes**:
- `id`: String - Unique booking identifier
- `confirmationNumber`: String - Hotel confirmation code
- `status`: BookingStatus - Current booking state
- `checkIn`: Date - Check-in date
- `checkOut`: Date - Check-out date
- `guestInfo`: GuestInfo - Primary guest details
- `totalCost`: Money - Total booking amount
- `createdAt`: DateTime - Booking creation timestamp
- `lastUpdated`: DateTime - Last modification timestamp
- `specialRequests`: String - Guest special requests

**Relationships**:
- Belongs to Hotel
- Has many BookedRooms
- Belongs to Guest
- Belongs to Autoblock

### Autoblock
**Description**: Represents a room block configuration for an event

**Attributes**:
- `id`: String - Unique autoblock identifier
- `eventName`: String - Associated event name
- `eventDates`: DateRange - Event start and end dates
- `cutoffDate`: Date - Booking deadline
- `groupCode`: String - Special booking code
- `hotels`: Array<Hotel> - Available hotels
- `configuration`: AutoblockConfiguration - Site settings
- `status`: AutoblockStatus - Active, expired, draft

**Relationships**:
- Has many Hotels
- Has many Bookings
- Belongs to Event
- Has one Site

### Site
**Description**: Represents a configured autoblock website

**Attributes**:
- `id`: String - Unique site identifier
- `name`: String - Site display name
- `url`: String - Site URL
- `theme`: ThemeConfiguration - Visual styling
- `widgets`: Array<WidgetConfiguration> - Page components
- `content`: ContentConfiguration - Text and media
- `settings`: SiteSettings - Behavior configuration
- `isPublished`: Boolean - Publication status

**Relationships**:
- Belongs to Autoblock
- Has many WidgetConfigurations

### Guest
**Description**: Represents a person making a hotel booking

**Attributes**:
- `id`: String - Unique guest identifier
- `firstName`: String - Guest first name
- `lastName`: String - Guest last name
- `email`: String - Contact email address
- `phone`: String - Contact phone number
- `preferences`: GuestPreferences - Booking preferences
- `loyaltyPrograms`: Array<LoyaltyProgram> - Hotel loyalty memberships

**Relationships**:
- Has many Bookings
- Has many RoomSelections

### Widget Configuration
**Description**: Represents a configured widget instance on a site

**Attributes**:
- `id`: String - Unique widget instance identifier
- `type`: WidgetType - Widget component type
- `position`: Number - Display order on page
- `settings`: Object - Widget-specific configuration
- `content`: Object - Widget content and text
- `styling`: Object - Custom CSS and appearance
- `isVisible`: Boolean - Visibility toggle

**Relationships**:
- Belongs to Site
- References WidgetType

## Business Rules

### Booking Rules
1. **Availability Validation**: Rooms must be available for selected dates before booking
2. **Capacity Limits**: Room selections cannot exceed maximum occupancy
3. **Date Validation**: Check-in date must be before check-out date
4. **Cutoff Enforcement**: Bookings cannot be made after autoblock cutoff date
5. **Minimum Stay**: Some hotels may require minimum night stays
6. **Maximum Advance**: Bookings typically limited to 18 months in advance

### Pricing Rules
1. **Rate Calculation**: Total cost includes base rate + taxes + fees
2. **Group Rates**: Autoblock rates may differ from public rates
3. **Currency Handling**: All prices displayed in event's configured currency
4. **Tax Inclusion**: Tax calculation varies by hotel location and guest residence
5. **Cancellation Fees**: May apply based on hotel policy and timing

### Site Configuration Rules
1. **Widget Dependencies**: Some widgets require others to function (e.g., RoomList needs HotelSearch)
2. **Theme Consistency**: All widgets must use compatible theme settings
3. **Content Validation**: Required fields must be populated before publishing
4. **URL Uniqueness**: Site URLs must be unique across the platform
5. **Permission Levels**: Only authorized users can modify site configurations

### Data Validation Rules
1. **Email Format**: Email addresses must be valid format
2. **Phone Numbers**: Phone numbers validated based on country codes
3. **Date Ranges**: All date ranges must be logically valid
4. **Required Fields**: Core booking information cannot be empty
5. **Character Limits**: Text fields have maximum length restrictions

### Workflow Rules
1. **Booking Expiration**: Room selections expire after 30 minutes of inactivity
2. **Session Management**: User sessions timeout after 2 hours
3. **Concurrent Bookings**: System prevents double-booking of limited inventory
4. **Status Transitions**: Bookings follow defined state machine transitions
5. **Notification Triggers**: Automated emails sent at key workflow points

## State Machines

### Booking Status Flow
```
Draft → Pending → Confirmed → Checked-In → Checked-Out
  ↓       ↓         ↓
Cancelled ← Cancelled ← Cancelled
```

### Site Status Flow
```
Draft → Review → Published → Archived
  ↓       ↓         ↓
Draft ← Draft ← Unpublished
```

### Room Availability States
```
Available → Selected → Booked → Occupied → Available
    ↓         ↓
Unavailable ← Released
```

## Data Relationships

### Entity Relationship Overview
```
Event (1) ←→ (1) Autoblock (1) ←→ (1) Site
                    ↓
              (1) ←→ (many) Hotel
                    ↓
              (1) ←→ (many) Room
                    ↓
              (many) ←→ (many) Booking
                    ↓
              (1) ←→ (many) Guest
```

### Widget Hierarchy
```
Site
├── Header Widget
├── HotelSearch Widget
├── HotelList Widget
│   └── HotelBanner Widget (nested)
├── RoomList Widget
│   └── RoomSummary Widget (nested)
├── ContactInfo Widget
├── ReviewSubmit Widget
└── Footer Widget
```