# Domain Model

## Glossary

### Vendor
A third-party company or organization that provides hospitality technology solutions, such as property management systems (PMS), central reservation systems (CRS), or other hotel management software.

### Vendor System
A specific technology platform or software instance operated by a vendor. A single vendor may operate multiple vendor systems for different purposes or client segments.

### Hotel Connector
The configuration and mapping information that connects a specific hotel property to a vendor system, including codes and identifiers used for integration.

### Transporter
A software component responsible for transmitting messages between Passkey and vendor systems. Different transporters handle different communication protocols and message formats.

### Transporter Parameters
Configuration settings specific to a transporter, such as API endpoints, authentication credentials, timeout values, and protocol-specific options.

### Message Type
A category of communication between Passkey and vendor systems, such as reservation creation, modification, or cancellation messages.

### Partner Message Type
A message type configuration specific to a particular vendor partner, including partner-specific settings and enabled/disabled status.

### Hotel Code
A unique identifier assigned to a hotel property by a vendor system, used for routing messages and identifying the correct property in vendor communications.

### Chain Code
An identifier representing a hotel chain or brand within a vendor system, used for grouping properties and applying chain-level configurations.

### Brand Code
An identifier for a specific hotel brand within a chain, providing more granular categorization than chain codes.

### GL Code
General Ledger code used for financial reporting and accounting integration between Passkey and vendor systems.

### Authorized Partner
A vendor or technology partner that has been authorized to integrate with Passkey and access specific functionalities or data.

### GML (Guest Message Language)
A standardized messaging protocol used for communication between hospitality systems, enabling consistent data exchange formats.

### ARI (Availability, Rates, and Inventory)
Real-time data about hotel room availability, pricing, and inventory levels, typically synchronized between systems.

### Outbound/Inbound Transfer Types
Classifications for different types of data transfers, where outbound refers to messages sent from Passkey to vendor systems, and inbound refers to messages received from vendor systems.

### Retry Settings
Configuration parameters that control how the system handles failed message transmissions, including retry counts, intervals, and conditions for different error types.

### Split Folio Group
A configuration setting that determines how billing and payment information is divided and processed across multiple folios or accounts.

## Core Entities

### Vendor
**Description**: Represents a technology vendor or partner company in the hospitality industry.

**Attributes**:
- `vendorId`: Long - Unique identifier for the vendor
- `name`: String - Display name of the vendor company
- `description`: String - Detailed description of the vendor and their services

**Relationships**:
- One-to-many with VendorSystem (a vendor can have multiple systems)

### VendorSystem
**Description**: Represents a specific technology platform or software instance operated by a vendor.

**Attributes**:
- `vendorSystemId`: Long - Unique identifier for the vendor system
- `vendorId`: Long - Reference to the parent vendor
- `name`: String - Display name of the vendor system
- `authorizedPartnerId`: Long - ID of the authorized partner (optional)
- `outboundTransporterTypeID`: Integer - Type of outbound transporter (optional)
- `outboundTransporterClass`: String - Fully qualified class name of the outbound transporter
- `outBoundTransferTypeID`: Integer - Type of outbound transfer (optional)
- `inBoundTransferTypeID`: Integer - Type of inbound transfer (optional)
- `ariTransferTypeID`: Integer - ARI transfer type ID (optional)
- `outboundBatchSize`: Integer - Size of outbound message batches (optional)
- `outboundMaxRetries`: Integer - Maximum number of retry attempts
- `outboundRetryInterval`: Integer - Interval between retry attempts (seconds)
- `splitFolioGroup`: Integer - Split folio group configuration (optional)
- `contactEmail`: String - Email for error notifications (optional)
- `timedOutRetry`: Boolean - Whether to retry on timeout errors
- `unableToConnectRetry`: Boolean - Whether to retry on connection errors
- `transporterFailureRetry`: Boolean - Whether to retry on transporter failures
- `internalErrorRetry`: Boolean - Whether to retry on internal errors
- `otherRejectionsRetry`: Boolean - Whether to retry on other rejection types
- `gmlEnabled`: Boolean - Whether GML protocol is enabled
- `outboundReservationTimeoutInterval`: Integer - Timeout for reservation messages
- `outboundSuspended`: Boolean - Whether outbound messaging is suspended
- `inboundSuspended`: Boolean - Whether inbound messaging is suspended

**Relationships**:
- Many-to-one with Vendor
- One-to-many with HotelConnector (associated hotels)
- One-to-many with TransporterParameters
- One-to-many with PartnerMessageType

### HotelConnector
**Description**: Represents the connection and mapping between a hotel property and a vendor system.

**Attributes**:
- `hotelId`: Long - Unique identifier for the hotel property
- `vendorSystemId`: Long - Reference to the vendor system (optional)
- `chainCode`: String - Hotel chain identifier in the vendor system
- `hotelCode`: String - Hotel property identifier in the vendor system
- `brandCode`: String - Hotel brand identifier in the vendor system
- `glCode`: String - General ledger code for financial integration

**Relationships**:
- Many-to-one with VendorSystem (when vendorSystemId is present)
- Represents hotel properties in external systems

### HotelMapping
**Description**: Represents the integration status and mapping of a hotel to vendor systems.

**Attributes**:
- `hotelId`: Long - Unique identifier for the hotel property
- `vendorSystemId`: Long - Reference to the vendor system
- `chainCode`: String - Hotel chain identifier
- `hotelCode`: String - Hotel property identifier
- `brandCode`: String - Hotel brand identifier
- `integrationStatus`: String - Current status of the integration

**Relationships**:
- Links hotels to their integrated vendor systems
- Provides integration status tracking

### TransporterParameters
**Description**: Configuration parameters specific to a transporter implementation.

**Attributes**:
- `name`: String - Parameter name/key
- `value`: String - Parameter value
- `description`: String - Human-readable description of the parameter (optional)

**Relationships**:
- Many-to-one with VendorSystem
- Provides configuration for transporter implementations

### MessageType
**Description**: Defines a category of message that can be exchanged between systems.

**Attributes**:
- `messageTypeId`: Integer - Unique identifier for the message type
- `name`: String - Name of the message type (e.g., "RESERVATION_CREATE")
- `description`: String - Description of the message type's purpose
- `enabled`: Boolean - Whether this message type is currently active
- `category`: String - Category grouping for the message type
- `totalCount`: Integer - Total count for pagination (query result metadata)

**Relationships**:
- One-to-many with PartnerMessageType

### PartnerMessageType
**Description**: Partner-specific configuration for message types.

**Attributes**:
- `partnerMessageTypeId`: Integer - Unique identifier
- `partnerId`: Long - Reference to the partner/vendor
- `messageTypeId`: Integer - Reference to the base message type
- `enabled`: Boolean - Whether this message type is enabled for the partner
- `configuration`: Object - Partner-specific configuration settings
- `totalCount`: Integer - Total count for pagination (query result metadata)

**Relationships**:
- Many-to-one with MessageType
- Links message types to specific vendor partners

### VendorSystemAssign
**Description**: Request model for assigning hotels to vendor systems.

**Attributes**:
- `vendorSystemId`: Long - Target vendor system for assignment
- `hotelIds`: List<Long> - List of hotel IDs to assign
- `assignmentType`: String - Type of assignment operation
- `effectiveDate`: DateTime - When the assignment becomes effective

**Relationships**:
- References VendorSystem and hotel entities
- Used for bulk assignment operations

### VendorSystemAssignResponse
**Description**: Response model for assignment operations.

**Attributes**:
- `successfulAssignments`: List<Long> - Hotel IDs that were successfully assigned
- `failedAssignments`: List<AssignmentError> - Details of failed assignments

**Relationships**:
- Contains results of assignment operations
- Provides detailed error information for failures

## Business Rules

### Vendor System Configuration
1. **Unique Vendor System IDs**: Each vendor system must have a unique identifier across the entire platform
2. **Required Transporter**: Every vendor system must specify an outbound transporter class for message delivery
3. **Retry Configuration**: Retry settings must be configured for each vendor system to handle communication failures
4. **Contact Information**: Vendor systems should have contact email addresses for error notifications

### Hotel Assignment Rules
1. **Single Primary Assignment**: A hotel can only be assigned to one primary vendor system at a time
2. **Chain Code Consistency**: Hotels within the same chain should use consistent chain codes across vendor systems
3. **Hotel Code Uniqueness**: Hotel codes must be unique within a vendor system's scope
4. **Assignment Validation**: Hotel assignments must be validated against vendor system capabilities

### Message Type Management
1. **Partner Enablement**: Message types must be explicitly enabled for each partner before use
2. **Backward Compatibility**: Disabling message types should not break existing integrations
3. **Configuration Inheritance**: Partner message types inherit base configuration but can override specific settings

### Transporter Parameter Rules
1. **Required Parameters**: Each transporter implementation defines a set of required parameters
2. **Parameter Validation**: Parameter values must be validated according to transporter specifications
3. **Secure Storage**: Sensitive parameters (credentials, API keys) must be stored securely
4. **Environment Separation**: Parameters should be environment-specific (dev, staging, production)

### Retry and Error Handling
1. **Retry Limits**: Maximum retry attempts must be configured to prevent infinite loops
2. **Exponential Backoff**: Retry intervals should increase exponentially to reduce system load
3. **Error Classification**: Different error types should have different retry strategies
4. **Circuit Breaker**: Repeated failures should trigger circuit breaker patterns to protect system stability

### Data Consistency Rules
1. **Referential Integrity**: All foreign key relationships must be maintained
2. **Audit Trail**: Changes to vendor system configurations should be logged for audit purposes
3. **Synchronization**: Hotel connector information should be synchronized with external systems
4. **Validation**: All data modifications should be validated before persistence

## Integration Patterns

### Hotel-to-Vendor System Mapping
Hotels are connected to vendor systems through a flexible mapping system that supports:
- Multiple identification schemes (hotel codes, chain codes, brand codes)
- Dynamic assignment and reassignment
- Integration status tracking
- Configuration inheritance from chain and brand levels

### Message Flow Architecture
The system supports bidirectional message flow:
- **Outbound**: Passkey → Vendor System (reservations, modifications, cancellations)
- **Inbound**: Vendor System → Passkey (confirmations, updates, availability)
- **ARI**: Specialized availability, rates, and inventory synchronization

### Configuration Hierarchy
Configuration follows a hierarchical pattern:
1. **Global Defaults**: System-wide default settings
2. **Vendor Level**: Vendor-specific overrides
3. **Vendor System Level**: System-specific configurations
4. **Hotel Level**: Property-specific customizations

This hierarchy allows for efficient management while providing flexibility for specific requirements.