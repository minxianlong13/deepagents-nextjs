# Domain Model

## Glossary

### Event
A gathering or conference that requires hotel accommodations for attendees. Events have specific dates, locations, and housing requirements that drive the reservation process.

### Planner
An event organizer who uses the portal to manage hotel reservations and housing logistics for their events. Planners have two access levels: Event-Level planners have full access to all hotels and attendee groups within an event, while SBG-Level planners are restricted to specific sub-block groups they're assigned to. Planners are NOT tied to specific hotels - they manage reservations across all hotels in their assigned events or sub-block groups.

### Reservation
A booking for hotel rooms associated with a specific event. Reservations include details such as check-in/check-out dates, room types, rates, and guest information.

### Hotel
An accommodation provider that offers rooms for event attendees. Hotels have inventory, rates, and availability that can be booked through the portal.

### Room Block
A group of hotel rooms reserved for a specific event, typically at negotiated rates. Room blocks help ensure availability and pricing for event attendees.

### Inventory
The available hotel rooms and room types that can be booked for specific dates. Inventory management ensures accurate availability and prevents overbooking.

### Pick-up
The actual number of rooms booked by event attendees compared to the reserved room block. Pick-up rates are important metrics for event success and hotel relationships.

### Rate
The price charged for hotel rooms, which can vary by room type, dates, and negotiated agreements. Rates may include special event pricing or group discounts.

### Sub-Block Group (SBG)
A subdivision used for planner access control within events. Multiple attendee groups can share the same SBG ID, allowing SBG-Level planners to manage reservations for their assigned groups across all hotels in the event, but not see other groups.

### Attendee
An individual attending an event who may require hotel accommodations. Attendees book rooms within the reserved blocks or through direct arrangements. Note: This refers to people attending events, not to be confused with Participants which are system-level organization entities in Passkey.

### Housing
The overall accommodation management for an event, including room blocks, reservations, and attendee assignments. Housing encompasses all lodging-related activities.

### Portal
The web-based interface that planners use to manage events, reservations, and housing logistics. The portal provides tools for planning, booking, and reporting.

### Dashboard
The main interface showing key metrics, recent activities, and quick access to common functions. Dashboards provide at-a-glance views of event and reservation status.

### Report
Generated documents or data exports that provide insights into event performance, reservation status, financial summaries, and other analytics.

---

## Core Entities

### Event
**Description**: Represents a planned gathering requiring hotel accommodations

**Attributes**:
- `eventId`: String - Unique identifier for the event
- `eventName`: String - Display name of the event
- `startDate`: Date - Event start date
- `endDate`: Date - Event end date
- `location`: String - Event location (city, venue)
- `expectedAttendees`: Integer - Anticipated number of attendees
- `description`: String - Event description and details
- `status`: Enum - Event status (planning, active, completed, cancelled)
- `createdDate`: DateTime - When the event was created
- `lastModified`: DateTime - Last update timestamp
- `plannerId`: String - ID of the responsible planner

**Relationships**:
- One-to-many with Reservations
- Many-to-many with Hotels (through room blocks)
- One-to-many with Reports

---

### Planner
**Description**: Event organizer who manages hotel reservations and housing logistics

**Attributes**:
- `plannerId`: String - Unique planner identifier
- `firstName`: String - Planner's first name
- `lastName`: String - Planner's last name
- `email`: String - Contact email address
- `phone`: String - Contact phone number
- `organization`: String - Company or organization name
- `plannerType`: Enum - Planner access level (EVENT_LEVEL, SBG_LEVEL)
- `preferences`: JSON - User interface and notification preferences
- `lastLogin`: DateTime - Last login timestamp
- `isActive`: Boolean - Account status

**Relationships**:
- One-to-many with Events (Event-Level planners)
- Many-to-many with Sub-Block Groups (SBG-Level planners)
- One-to-many with Reservations
- One-to-many with Reports

**Business Rules**:
- Event-Level planners have full access to all hotels and attendee groups within their events
- SBG-Level planners are restricted to specific sub-block groups they're assigned to
- Planners are NOT tied to specific hotels - they manage across all hotels in their scope
- Email addresses must be unique across all planners

---

### Sub-Block Group (SBG)
**Description**: Subdivision used for planner access control within events

**Attributes**:
- `sbgId`: String - Unique sub-block group identifier
- `eventId`: String - Associated event ID
- `sbgName`: String - Display name for the sub-block group
- `description`: String - Group description
- `createdDate`: DateTime - Creation timestamp
- `isActive`: Boolean - Group status

**Relationships**:
- Many-to-one with Event
- Many-to-many with Planners (SBG-Level planners)
- One-to-many with Attendee Groups (multiple groups can share same SBG ID)

**Business Rules**:
- Multiple attendee groups can share the same SBG ID
- SBG-Level planners can only access their assigned sub-block groups
- Sub-block groups must belong to a valid event

---

### Reservation
**Description**: Hotel room booking associated with an event

**Attributes**:
- `reservationId`: String - Unique reservation identifier
- `eventId`: String - Associated event ID
- `hotelId`: String - Hotel where rooms are reserved
- `roomType`: String - Type of room (standard, suite, etc.)
- `checkInDate`: Date - Guest check-in date
- `checkOutDate`: Date - Guest check-out date
- `roomCount`: Integer - Number of rooms reserved
- `rate`: Decimal - Room rate per night
- `totalAmount`: Decimal - Total reservation cost
- `status`: Enum - Reservation status (pending, confirmed, cancelled)
- `confirmationNumber`: String - Hotel confirmation reference
- `createdDate`: DateTime - Reservation creation timestamp
- `modifiedDate`: DateTime - Last modification timestamp

**Relationships**:
- Many-to-one with Event
- Many-to-one with Hotel
- Many-to-one with Planner
- One-to-many with Guests

---

### Hotel
**Description**: Accommodation provider offering rooms for events

**Attributes**:
- `hotelId`: String - Unique hotel identifier
- `hotelName`: String - Hotel name
- `address`: String - Hotel street address
- `city`: String - Hotel city
- `state`: String - Hotel state/province
- `country`: String - Hotel country
- `postalCode`: String - Postal/ZIP code
- `phone`: String - Hotel contact phone
- `email`: String - Hotel contact email
- `starRating`: Integer - Hotel star rating (1-5)
- `amenities`: List<String> - Available amenities
- `isActive`: Boolean - Hotel availability status

**Relationships**:
- One-to-many with Reservations
- One-to-many with RoomTypes
- Many-to-many with Events (through room blocks)

---

### RoomType
**Description**: Specific type of accommodation offered by a hotel

**Attributes**:
- `roomTypeId`: String - Unique room type identifier
- `hotelId`: String - Associated hotel ID
- `typeName`: String - Room type name (Standard, Deluxe, Suite)
- `description`: String - Room type description
- `maxOccupancy`: Integer - Maximum guests per room
- `baseRate`: Decimal - Standard room rate
- `amenities`: List<String> - Room-specific amenities
- `isAvailable`: Boolean - Current availability status

**Relationships**:
- Many-to-one with Hotel
- One-to-many with Reservations

---

### Guest
**Description**: Individual attendee with hotel accommodation

**Attributes**:
- `guestId`: String - Unique guest identifier
- `reservationId`: String - Associated reservation ID
- `firstName`: String - Guest first name
- `lastName`: String - Guest last name
- `email`: String - Guest email address
- `phone`: String - Guest phone number
- `specialRequests`: String - Accommodation requests
- `checkInStatus`: Enum - Check-in status (pending, checked-in, checked-out)
- `roomNumber`: String - Assigned room number

**Relationships**:
- Many-to-one with Reservation
- Many-to-one with Event

---

### Report
**Description**: Generated analytics and data exports

**Attributes**:
- `reportId`: String - Unique report identifier
- `reportType`: Enum - Type of report (occupancy, revenue, pickup)
- `eventId`: String - Associated event ID (optional)
- `generatedBy`: String - Planner who generated the report
- `generatedDate`: DateTime - Report generation timestamp
- `parameters`: JSON - Report generation parameters
- `format`: Enum - Output format (HTML, PDF, Excel)
- `filePath`: String - Location of generated file
- `status`: Enum - Report status (generating, completed, failed)

**Relationships**:
- Many-to-one with Event (optional)
- Many-to-one with Planner

---

### FileUpload
**Description**: Uploaded documents and files associated with events

**Attributes**:
- `fileId`: String - Unique file identifier
- `eventId`: String - Associated event ID (optional)
- `originalFilename`: String - Original file name
- `storedFilename`: String - System-generated file name
- `fileSize`: Long - File size in bytes
- `mimeType`: String - File MIME type
- `uploadedBy`: String - Planner who uploaded the file
- `uploadDate`: DateTime - Upload timestamp
- `scanResult`: Enum - Malware scan result (clean, infected, pending)
- `description`: String - File description

**Relationships**:
- Many-to-one with Event (optional)
- Many-to-one with Planner

---

## Business Rules

### Event Management Rules

1. **Event Dates**: Event end date must be after start date
2. **Event Status**: Only active events can have new reservations created
3. **Event Modification**: Completed events cannot be modified
4. **Event-Level Planner Access**: Event-Level planners have full access to all hotels and attendee groups within their assigned events
5. **SBG-Level Planner Access**: SBG-Level planners are restricted to only their assigned sub-block groups across all hotels
6. **Planner-Hotel Independence**: Planners are NOT tied to specific hotels - they manage reservations across all hotels within their scope

### Reservation Rules

1. **Date Validation**: Check-out date must be after check-in date
2. **Inventory Check**: Room count cannot exceed available inventory
3. **Rate Validation**: Rates must be positive values
4. **Modification Window**: Reservations can only be modified within cancellation policy
5. **Status Transitions**: Reservations follow specific status transition rules

### Hotel and Inventory Rules

1. **Availability**: Hotels must be active to accept new reservations
2. **Room Types**: Each hotel must have at least one active room type
3. **Capacity**: Room occupancy cannot exceed maximum capacity
4. **Rate Management**: Rates can vary by date and room type

### Security and Access Rules

1. **Authentication**: All operations require valid user authentication
2. **Authorization**: Users can only access data they have permissions for
3. **Data Privacy**: Personal guest information is protected and encrypted
4. **Audit Trail**: All modifications are logged with user and timestamp

### File Upload Rules

1. **File Size**: Maximum file size is 10MB
2. **File Types**: Only approved file types are allowed
3. **Malware Scanning**: All files must pass malware scanning before storage
4. **Retention**: Files are retained according to data retention policies

### Reporting Rules

1. **Data Access**: Reports only include data the user has access to
2. **Date Ranges**: Report date ranges must be valid and reasonable
3. **Export Limits**: Large reports may be limited or require approval
4. **Scheduling**: Automated reports follow configured schedules

## Data Relationships

### Primary Relationships

- **Event → Reservations**: One event can have multiple reservations
- **Hotel → Reservations**: One hotel can have multiple reservations
- **Planner → Events**: One planner can manage multiple events
- **Reservation → Guests**: One reservation can include multiple guests

### Secondary Relationships

- **Event → Reports**: Events can have multiple associated reports
- **Event → Files**: Events can have multiple uploaded files
- **Hotel → RoomTypes**: Hotels offer multiple room types
- **Planner → Reports**: Planners can generate multiple reports

### Derived Relationships

- **Event → Hotels**: Through reservations, events are connected to hotels
- **Planner → Hotels**: Through events and reservations, planners work with hotels
- **Guest → Hotels**: Through reservations, guests stay at hotels