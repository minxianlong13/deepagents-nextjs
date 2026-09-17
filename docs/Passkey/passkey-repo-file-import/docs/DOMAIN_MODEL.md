# Domain Model

## Glossary

### ACK Number
**Definition**: Passkey Acknowledgment Number - A unique identifier assigned to each reservation in the Passkey system. This serves as the primary key for reservation lookups and operations.

**Format**: Alphanumeric string
**Example**: "ACK123456"
**Usage**: Used to validate reservation existence and retrieve reservation details

### External Confirmation Number
**Definition**: A confirmation number from an external reservation system that needs to be mapped to a Passkey ACK number. This enables integration between Passkey and third-party reservation systems.

**Format**: String (2-40 characters)
**Example**: "EXT789012", "HOTEL-CONF-2024-001"
**Usage**: Provides a bridge between external systems and Passkey reservations

### Reservation ID
**Definition**: Internal database identifier for a reservation record. This is different from the ACK number and is used for internal system operations.

**Format**: Numeric string
**Example**: "987654321"
**Usage**: Used for database operations and internal service communication

### Participant ID
**Definition**: Identifier for the user or entity that owns the reservations being processed. Derived from the account mapping ID provided in import requests.

**Format**: Long integer
**Example**: 12345
**Usage**: Used for authorization and filtering reservations by ownership

### Schema Name
**Definition**: Identifier for the type of import being performed. Currently supports "rezhub-reservation" for RezHub reservation imports.

**Format**: String
**Example**: "rezhub-reservation"
**Usage**: Determines the validation rules and processing logic for imports

### Import Batch
**Definition**: A collection of records processed together in a single import operation. The service processes imports in batches to optimize performance and memory usage.

**Size**: Configurable (default: 100 records)
**Usage**: Balances processing efficiency with memory consumption

### RezHub
**Definition**: Cvent's reservation management system that handles hotel reservation processing and external system integrations.

**Purpose**: Processes the mapping between external confirmation numbers and Passkey ACK numbers
**Integration**: Accessed through the Resdesk client

## Core Entities

### ImportDataRow
**Description**: Represents a single row of data from an imported file

**Attributes**:
- `row`: Integer - The row number in the original file
- `columns`: List<ImportDataColumn> - The data columns for this row

**Relationships**:
- Contains multiple ImportDataColumn entities
- Part of an ImportDataRequest

### ImportDataColumn
**Description**: Represents a single data field within an import row

**Attributes**:
- `name`: String - The column name (e.g., "ackNumber", "externalConfirmationNumber")
- `value`: Object - The actual data value

**Relationships**:
- Belongs to an ImportDataRow
- Maps to ImportSchemaField definitions

### ImportDataStatusRow
**Description**: Tracks the processing status of each imported row

**Attributes**:
- `row`: Integer - The row number being reported
- `status`: ImportDataStatus - The processing result (SUCCESS, SKIPPED, FAILED)

**Status Values**:
- `SUCCESS`: Record was successfully processed and mapped
- `SKIPPED`: Record was skipped due to validation issues or missing data
- `FAILED`: Record processing failed due to system errors

**Relationships**:
- Part of an ImportDataResponse
- Corresponds to an ImportDataRow

### ImportSchemaField
**Description**: Defines the structure and validation rules for import fields

**Attributes**:
- `name`: String - The field name
- `description`: String - Human-readable field description
- `validator`: FieldValidator - Validation rules for the field

**Relationships**:
- Part of an ImportSchema
- Referenced by ImportDataColumn names

### ExternalConfNumberMapping
**Description**: Contains the collection of ACK number to external confirmation number mappings for processing

**Attributes**:
- `ackExtConfNumberRecord`: List<AckExtConfNumber> - Collection of mapping records

**Relationships**:
- Contains multiple AckExtConfNumber entities
- Sent to RezHub for processing

### AckExtConfNumber
**Description**: Represents a single mapping between an ACK number and external confirmation number

**Attributes**:
- `ackNumber`: String - The Passkey ACK number
- `extConfNumber`: String - The external confirmation number
- `reservationId`: String - The internal reservation ID

**Relationships**:
- Part of ExternalConfNumberMapping
- Links external systems to Passkey reservations

## Business Rules

### ACK Number Validation
1. **Existence Check**: ACK numbers must exist in the Passkey reservation system
2. **Ownership Validation**: Users can only process ACK numbers they own (based on participant ID)
3. **Duplicate Prevention**: Duplicate ACK numbers within a single import batch are ignored
4. **Format Validation**: ACK numbers must be valid alphanumeric strings

### External Confirmation Number Rules
1. **Length Constraints**: Must be between 2 and 40 characters
2. **Required Field**: Cannot be null or empty for successful processing
3. **Uniqueness**: Should be unique within the context of the external system
4. **Format Flexibility**: Accepts various formats to accommodate different external systems

### Import Processing Rules
1. **Batch Size Limit**: Maximum 100 records per batch (configurable)
2. **Partial Success**: Individual record failures don't stop batch processing
3. **Status Tracking**: Every record receives a processing status
4. **Retry Logic**: Failed external service calls are retried once
5. **Graceful Degradation**: Invalid records are skipped rather than failing the entire import

### Data Consistency Rules
1. **Atomic Mapping**: Each ACK-External number pair is processed atomically
2. **Idempotent Operations**: Repeated imports of the same data should be safe
3. **Audit Trail**: All processing activities are logged for troubleshooting
4. **Validation Order**: Schema validation occurs before business rule validation

## Data Flow Relationships

### Import Schema Flow
```
ImportSchemaRequest → ImportSchema → ImportSchemaField → FieldValidator
```

### Import Strategy Flow
```
ImportDataStrategyRequest → ImportDataStrategyResponse
```

### Data Processing Flow
```
ImportDataRequest → ImportDataRow → ImportDataColumn
                 ↓
            Validation & Processing
                 ↓
ExternalConfNumberMapping → AckExtConfNumber → RezHub Processing
                 ↓
ImportDataResponse → ImportDataStatusRow
```

## Validation Hierarchy

### Schema Level
- Field presence validation
- Data type validation
- Format validation (length, pattern)

### Business Level
- ACK number existence validation
- Ownership validation
- Duplicate detection

### System Level
- External service availability
- Processing capacity limits
- Error handling and recovery

## Integration Points

### Upstream Dependencies
- **File Import Service**: Provides import data and coordinates the import process
- **Auth Service**: Validates API keys and user permissions

### Downstream Dependencies
- **Passkey Reservation Service**: Validates ACK numbers and retrieves reservation IDs
- **Passkey Resdesk**: Processes the final mapping in RezHub system

### Data Transformation Points
1. **UUID to Long Conversion**: User and account IDs are converted from UUID format to Long
2. **Column Mapping**: Generic column data is mapped to specific domain fields
3. **Status Enumeration**: Processing results are converted to standardized status codes
4. **Batch Aggregation**: Individual records are collected into processing batches