/# Passkey Event Service - Domain Model Analysis

## Overview

The Passkey Event Service is a comprehensive hotel booking and event management system that facilitates hotel room reservations for events. The domain model centers around **Events** that have associated **Blocks** (hotel room allocations), **Attendee Groups**, **Guarantee Plans**, and various booking configurations.

## Core Domain Entities

### 1. Event (Primary Aggregate Root)
**Interface**: `com.cvent.passkeyevent.model.Event`  
**Implementation**: `com.cvent.passkeyevent.entities.ModifiableEvent`

The central domain entity representing a hotel booking event.

**Key Properties**:
- `id` - Unique event identifier
- `name` - Event name
- `location` - Event location
- `eventInfo` - Detailed event information (dates, status, type)
- `webInfoSummary` - Web booking configuration summary
- `planners` - Event planners (deprecated)
- `groupTypes` - Attendee group types
- `blocks` - Hotel room blocks
- `venue` - Event venue information
- `reservationContact` - Contact information for reservations
- `owner` - Event owner information
- `locale` - Default locale and supported locales

### 2. EventInfo
**Interface**: `com.cvent.passkeyevent.model.EventInfo`

Contains detailed event scheduling and configuration information.

**Key Properties**:
- `status` - Event status (OPEN, PRE_OPEN, CLOSED, CANCELLED, NEW, MY)
- `typeId` - Event type (Corporate, Wedding, Association, Social, Sports, Other)
- `isCityWide` - City-wide vs hotel-direct event flag
- `cutoffDate` - Default reservation cutoff date
- `openDateUTC` / `shutoffDateUTC` - Reservation availability window
- `startDate` / `endDate` - Event attendance dates
- `contractStartDateDefault` / `contractEndDateDefault` - Contract dates including shoulder nights
- `timeZone` - Event timezone
- `currencyId` / `currency` - Currency information
- `guaranteePlanId` - Default guarantee plan

### 3. Block
**Interface**: `com.cvent.passkeyevent.model.block.Block`

Represents hotel room inventory allocations for an event.

**Key Properties**:
- Block identification and hotel association
- Room inventory and availability
- Pricing and rate information
- Booking preferences and restrictions

### 4. AttendeeGroupType / GroupType (Sub-Block)
**Entities**: Various attendee group type classes

Represents different categories of event attendees with specific booking rules. Also known as Sub-Blocks.

**Key Properties**:
- `groupTypeId` - Unique identifier
- `eventId` - Associated event
- `groupTypeName` - Group name (unique within event)
- `maxRooms` - Maximum rooms allowed
- `guaranteedFlag` - Guarantee requirement
- `rollupFlag` - Whether counts aggregate to parent totals
- `groupFlag` - Group booking flag
- `reservationAccessCode` - 20-char globally unique access code for bookings
- `guaranteePlanId` - Associated guarantee plan

### 5. GuaranteePlan
**Interface**: `com.cvent.passkeyevent.model.guaranteePlan.GuaranteePlan`  
**Entity**: `com.cvent.passkeyevent.entities.guaranteePlan.GuaranteePlanEntity`

Defines payment and guarantee requirements for reservations. Three types: Guest Credit Card, Guest Other Payment, and Master Guarantee (rooming list/master billing).

**Key Properties**:
- `guaranteePlanId` - Unique identifier
- `name` - Plan name
- `paymentTypeGuestCC` - Guest credit card payment configuration
- `paymentTypeGuestOther` - Alternative payment methods configuration
- `paymentTypeMasterGuarantee` - Master guarantee (no individual guarantee) configuration

## Data Transfer Objects (DTOs)

### 1. PlannerEventDTO
**Class**: `com.cvent.passkeyevent.entities.PlannerEventDTO`

Minimal DTO implementation of Event interface for planner-specific operations.

### 2. RecentlyViewedEvent
**Class**: `com.cvent.passkeyevent.entities.RecentlyViewedEvent`

Tracks user's recently accessed events with timestamp information.

### 3. GroupCode
**Class**: `com.cvent.passkeyevent.entities.GroupCode`

Represents access codes for attendee groups.

## Service Layer

### 1. EventService
**Class**: `com.cvent.passkeyevent.services.EventService`

Primary business logic service for event management operations.

**Key Responsibilities**:
- Event search and retrieval
- Attendee group type management
- Guarantee plan operations
- Group code validation
- Event caching and performance optimization
- Recently viewed events tracking

### 2. BlockService
**Class**: `com.cvent.passkeyevent.services.BlockService`

Manages hotel room block operations and inventory.

### 3. GuaranteeRulesService
**Class**: `com.cvent.passkeyevent.services.GuaranteeRulesService`

Handles guarantee plan rules and calculations.

### 4. AdminService
**Class**: `com.cvent.passkeyevent.services.AdminService`

Administrative operations for event management.

## Domain Glossary

| Term | Definition |
|------|------------|
| **Event** | A housing event (conference, convention, trade show) that requires hotel room blocks |
| **Block** | A reserved allocation of hotel rooms for an event at negotiated rates |
| **Attendee Group Type (Sub-Block)** | A category of event attendees with specific booking rules and globally unique access codes |
| **Guarantee Plan** | Payment and guarantee requirements: Guest Credit Card, Guest Other Payment, or Master Guarantee |
| **Group Code** | 20-character globally unique access code that allows attendees to book rooms under specific group types |
| **City-Wide Event** | Event spanning multiple hotels in a city vs single hotel |
| **Cutoff Date** | Last date for making reservations |
| **Shoulder Nights** | Additional nights before/after the main event dates |
| **WebInfo** | Hotel-specific event configuration (visibility, ranking, dates, HQ flag, marketing message) |
| **Reservation Contact** | Contact information for reservation assistance |
| **Planner** | Person responsible for organizing and managing the event |
| **Venue** | Physical location where the event takes place |
| **Master Guarantee** | Centralized payment guarantee (rooming list/master billing) vs individual guarantees |
| **Rollup Flag** | Configuration determining if attendee group counts aggregate to parent totals |
| **Ecommerce Policy** | Rules governing deposits, cancellations, and processing fees |
| **Merchant Account** | Payment processing account configuration |
| **Participant** | Base entity for organizations in Passkey (NOT a person attending an event) |

## Business Rules

### Event Management Rules
1. **Event Status Lifecycle**: Events progress through states (PRE_OPEN → OPEN → NEAR_CUTOFF → CLOSED/CANCELLED)
2. **Date Validation**: Event start date must be before end date; cutoff date must be before event start
3. **Locale Support**: Events must have a default locale and can support multiple locales
4. **Owner Assignment**: Every event must have an assigned owner

### Attendee Group Rules
1. **Unique Group Names**: Group type names must be unique within an event
2. **Access Code Generation**: System generates globally unique 20-character access codes using safe character set
3. **Maximum Room Limits**: Each group type can have maximum room restrictions
4. **Guarantee Plan Association**: Group types must be associated with valid guarantee plans

### Booking Rules
1. **Reservation Window**: Bookings only allowed between open and shutoff dates
2. **Cutoff Date Enforcement**: No reservations accepted after cutoff date unless overridden
3. **Group Code Validation**: Valid group code required for group bookings
4. **Guarantee Requirements**: Payment guarantee required based on guarantee plan rules

### Block Management Rules
1. **Inventory Tracking**: Room blocks track available vs booked inventory
2. **Hotel Association**: Blocks must be associated with valid hotels
3. **Rate Management**: Blocks can have different rates for different room types and dates

### Payment and Guarantee Rules
1. **Payment Types**: Three types supported - Guest Credit Card, Guest Other Payment, and Master Guarantee (rooming list/master billing)
2. **Due Date Calculation**: Payment due dates calculated based on fixed dates or days following reservation
3. **Credit Card Validation**: Credit cards can be validated at checkout based on configuration
4. **Disclosure Requirements**: Payment types must include appropriate disclosure text

### Data Integrity Rules
1. **Referential Integrity**: Foreign key constraints ensure valid relationships between entities
2. **Cascade Operations**: Deleting events cascades to related entities with integrity checks
3. **Audit Trail**: System tracks creation and modification timestamps
4. **Soft Deletes**: Some entities use soft delete patterns to maintain historical data

### Performance and Caching Rules
1. **Recently Viewed Cache**: User's recently viewed events cached for performance
2. **Planner Summary Cache**: Event planner summaries cached with TTL
3. **Search Optimization**: Event searches optimized with pagination and field selection
4. **Concurrent Access**: System handles concurrent modifications with appropriate locking

## Architecture Patterns

### Domain-Driven Design
- **Aggregate Root**: Event serves as the primary aggregate root
- **Value Objects**: EventInfo, WebInfoSummary, and other configuration objects
- **Entities**: Event, Block, AttendeeGroupType with unique identities
- **Services**: Domain services for complex business logic

### Data Access Patterns
- **Repository Pattern**: EventDataAccess provides data access abstraction
- **MyBatis Integration**: SQL mapping for complex queries
- **Immutable Objects**: Use of Immutables library for value objects
- **DTO Pattern**: Separate DTOs for data transfer and API responses

### Service Layer Patterns
- **Service Facade**: EventService provides unified interface
- **Caching Strategy**: Multi-level caching for performance
- **Exception Handling**: Domain-specific exceptions with error codes
- **Validation**: Input validation at service boundaries