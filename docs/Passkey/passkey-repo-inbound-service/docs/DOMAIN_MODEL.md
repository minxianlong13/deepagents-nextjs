# Domain Model

## Glossary

### Business Event
A structured data message representing a significant occurrence in a hotel management system, such as a reservation creation, modification, or cancellation. Business events are the primary mechanism for data synchronization between vendor systems and the Passkey platform.

### External Data Load Event
A batch data synchronization event that contains multiple records for bulk processing, typically used for initial data loads or periodic synchronization of large datasets like inventory or rate information.

### GML (Guest Management Layer)
A standardized interface layer that provides unified access to guest-related data and operations across different hotel management systems, abstracting vendor-specific implementations.

### Hotel Configuration
Dynamic settings that control how inbound data is processed for a specific hotel, including feature flags, mapping rules, and integration preferences stored in DynamoDB.

### Inbound Integration
The process of receiving, validating, and processing data from external vendor systems into the Passkey platform, including real-time events and batch data loads.

### Mapping Codes
Translation rules that convert vendor-specific codes and identifiers into standardized Passkey platform codes, enabling consistent data representation across different hotel management systems.

### OHIP (Oracle Hospitality Integration Platform)
Oracle's integration platform that provides standardized APIs and event mechanisms for hotel management systems, serving as a common integration point for many hotel properties.

### Passkey Platform
Cvent's comprehensive hotel booking and inventory management platform that provides room block management, reservation processing, and integration services for events and meetings.

### Subscription Management
The system for managing real-time data subscriptions between vendor systems and the Passkey platform, including GraphQL subscriptions and webhook configurations.

### Vendor System
An external hotel management system (HMS) or property management system (PMS) that integrates with the Passkey platform to share reservation, inventory, and guest data.

### Vendor System ID (vsId)
A unique identifier assigned to each vendor system integration, used to route events and maintain configuration settings specific to that system.

## Core Entities

### BusinessEvent

**Description**: Represents a real-time event from a hotel management system that requires processing by the Passkey platform.

**Attributes**:
- `eventId`: String - Unique identifier for the event
- `eventType`: String - Type of event (RESERVATION_CREATED, INVENTORY_UPDATE, etc.)
- `timestamp`: DateTime - When the event occurred in the source system
- `vendorSystemId`: Long - Identifier of the originating vendor system
- `hotelId`: String - Identifier of the hotel where the event occurred
- `data`: Object - Event-specific payload containing the actual business data

**Relationships**:
- Belongs to a VendorSystem
- Associated with a Hotel
- May reference Reservation or Inventory entities

**Business Rules**:
- Events must have a valid timestamp within the last 24 hours
- Event types must be registered in the system configuration
- Events are processed exactly once (idempotency guaranteed)

### ExternalDataLoadEvent

**Description**: Represents a batch data synchronization operation containing multiple records for bulk processing.

**Attributes**:
- `loadId`: String - Unique identifier for the data load operation
- `eventType`: String - Type of data being loaded (INVENTORY_BULK, RATES_BULK, etc.)
- `vendorSystemId`: Long - Source vendor system identifier
- `hotelId`: String - Target hotel identifier
- `recordCount`: Integer - Number of records in the batch
- `data`: List<Object> - Collection of records to be processed
- `timestamp`: DateTime - When the load was initiated

**Relationships**:
- Belongs to a VendorSystem
- Associated with one or more Hotels
- May contain multiple Inventory or Rate records

**Business Rules**:
- Batch size is limited to 1000 records per load
- All records in a batch must be for the same hotel
- Failed records are logged but don't prevent processing of successful records

### HotelConfig

**Description**: Configuration settings that control how inbound data is processed for a specific hotel property.

**Attributes**:
- `hotelId`: String - Unique hotel identifier
- `vendorSystemId`: Long - Associated vendor system
- `gmlEnabled`: Boolean - Whether GML processing is enabled
- `inboundReservationEnabled`: Boolean - Whether reservation events are processed
- `inventorySyncEnabled`: Boolean - Whether inventory updates are processed
- `eventFilters`: List<String> - Event types that should be processed
- `mappingCodes`: Map<String, Object> - Code translation rules
- `webhookUrl`: String - URL for event notifications
- `lastUpdated`: DateTime - When configuration was last modified

**Relationships**:
- Belongs to a VendorSystem
- Associated with a Hotel
- Referenced by BusinessEvent processing

**Business Rules**:
- Each hotel can have only one active configuration per vendor system
- Configuration changes take effect immediately
- Disabled features will cause related events to be ignored

### SubscriptionManagement

**Description**: Manages real-time data subscriptions and GraphQL connections for vendor systems.

**Attributes**:
- `subscriptionId`: String - Unique subscription identifier
- `vendorSystemId`: Long - Vendor system requesting the subscription
- `eventTypes`: List<String> - Types of events to subscribe to
- `hotelFilters`: List<String> - Hotels to include in the subscription
- `connectionId`: String - WebSocket connection identifier
- `status`: String - Subscription status (ACTIVE, PAUSED, TERMINATED)
- `createdAt`: DateTime - When subscription was created
- `lastActivity`: DateTime - Last time data was sent

**Relationships**:
- Belongs to a VendorSystem
- May filter by specific Hotels
- Associated with GraphQL subscription connections

**Business Rules**:
- Subscriptions automatically terminate after 24 hours of inactivity
- Maximum of 10 concurrent subscriptions per vendor system
- Event filtering is applied before transmission to reduce bandwidth

### SubscriptionTaskMessage

**Description**: Represents a task for managing subscription lifecycle operations.

**Attributes**:
- `taskId`: String - Unique task identifier
- `vendorSystemId`: Long - Target vendor system
- `action`: String - Task action (SUBSCRIBE, UNSUBSCRIBE, MODIFY)
- `eventTypes`: List<String> - Event types for the subscription
- `callbackUrl`: String - Webhook URL for notifications
- `credentials`: Object - Authentication credentials for the callback
- `status`: String - Task status (PENDING, COMPLETED, FAILED)
- `createdAt`: DateTime - When task was created

**Relationships**:
- Belongs to a VendorSystem
- May create or modify SubscriptionManagement entities

**Business Rules**:
- Tasks are processed asynchronously
- Failed tasks are retried up to 3 times
- Credentials are encrypted at rest

### VendorSystem

**Description**: Represents an external hotel management system that integrates with the Passkey platform.

**Attributes**:
- `vendorSystemId`: Long - Unique system identifier
- `systemName`: String - Human-readable system name
- `systemType`: String - Type of system (PMS, HMS, CRS, etc.)
- `version`: String - System version or API version
- `status`: String - Integration status (ACTIVE, INACTIVE, MAINTENANCE)
- `capabilities`: List<String> - Supported features and operations
- `contactInfo`: Object - Technical contact information
- `lastHealthCheck`: DateTime - Last successful health check

**Relationships**:
- Has many HotelConfig entities
- Has many SubscriptionManagement entities
- Generates BusinessEvent and ExternalDataLoadEvent entities

**Business Rules**:
- Each vendor system must pass health checks every 15 minutes
- Inactive systems cannot send events or receive subscriptions
- System capabilities determine available integration features

## Data Relationships

```
VendorSystem (1) ──── (many) HotelConfig
     │                        │
     │                        │
     └── (many) BusinessEvent ─┘
     │
     └── (many) SubscriptionManagement
     │
     └── (many) ExternalDataLoadEvent

HotelConfig (1) ──── (many) BusinessEvent
     │
     └── (1) Hotel

SubscriptionManagement (1) ──── (many) GraphQLConnection
```

## Business Rules

### Event Processing Rules

1. **Idempotency**: Events with duplicate `eventId` values are processed only once
2. **Ordering**: Events are processed in timestamp order within each hotel
3. **Validation**: All events must pass schema validation before processing
4. **Filtering**: Events are filtered based on hotel configuration settings
5. **Retry Logic**: Failed events are retried up to 3 times with exponential backoff

### Configuration Management Rules

1. **Immediate Effect**: Configuration changes take effect immediately for new events
2. **Validation**: Configuration changes are validated before being applied
3. **Audit Trail**: All configuration changes are logged with user and timestamp
4. **Rollback**: Previous configurations can be restored in case of issues
5. **Default Values**: Missing configuration values use system defaults

### Subscription Management Rules

1. **Connection Limits**: Maximum 10 concurrent subscriptions per vendor system
2. **Timeout**: Inactive subscriptions are terminated after 24 hours
3. **Rate Limiting**: Subscription data is rate-limited to prevent overwhelming clients
4. **Authentication**: All subscriptions require valid OAuth tokens
5. **Filtering**: Subscriptions can filter by event type and hotel

### Data Integrity Rules

1. **Referential Integrity**: All foreign key relationships are enforced
2. **Data Validation**: Input data is validated against defined schemas
3. **Consistency**: Related data updates are performed atomically
4. **Archival**: Historical data is archived after 90 days
5. **Encryption**: Sensitive data is encrypted at rest and in transit

### Integration Rules

1. **API Versioning**: Breaking changes require new API versions
2. **Backward Compatibility**: Existing integrations continue to work during upgrades
3. **Error Handling**: Errors are returned in standardized format
4. **Monitoring**: All integrations are monitored for health and performance
5. **Documentation**: API changes are documented and communicated to partners

## Event Types

### Reservation Events
- `RESERVATION_CREATED` - New reservation made
- `RESERVATION_MODIFIED` - Existing reservation changed
- `RESERVATION_CANCELLED` - Reservation cancelled
- `RESERVATION_CONFIRMED` - Reservation confirmed by hotel
- `RESERVATION_CHECKED_IN` - Guest checked in
- `RESERVATION_CHECKED_OUT` - Guest checked out

### Inventory Events
- `INVENTORY_UPDATE` - Room availability changed
- `INVENTORY_BLOCK_CREATED` - New room block created
- `INVENTORY_BLOCK_MODIFIED` - Room block modified
- `INVENTORY_BLOCK_RELEASED` - Room block released

### Rate Events
- `RATE_UPDATE` - Room rates changed
- `RATE_PLAN_CREATED` - New rate plan created
- `RATE_PLAN_MODIFIED` - Rate plan modified
- `RATE_PLAN_DEACTIVATED` - Rate plan deactivated

### Configuration Events
- `CONFIG_UPDATED` - Hotel configuration changed
- `MAPPING_UPDATED` - Code mappings changed
- `FEATURE_ENABLED` - Feature enabled for hotel
- `FEATURE_DISABLED` - Feature disabled for hotel