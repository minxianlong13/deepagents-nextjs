# Domain Model

## Glossary

### GDPR (General Data Protection Regulation)
European Union regulation that governs data protection and privacy for individuals within the EU and European Economic Area. It requires organizations to protect personal data and gives individuals rights over their data.

### Obfuscation
The process of making personal data unreadable or unidentifiable while maintaining its structural integrity for system functionality. This includes masking, anonymization, and pseudonymization techniques.

### Personal Data
Any information relating to an identified or identifiable natural person, including names, email addresses, phone numbers, IP addresses, and other identifying information.

### Data Subject
An individual whose personal data is being processed. In the context of Passkey, this typically refers to hotel guests, event attendees, or system users.

### Right to Erasure (Right to be Forgotten)
A GDPR right that allows individuals to request the deletion or obfuscation of their personal data under certain circumstances.

### Batch Processing
The execution of GDPR obfuscation operations on multiple entities simultaneously, typically used for large-scale data processing requirements.

### Entity
A data subject or object that contains personal information requiring GDPR compliance processing. Examples include users, organizations, events, and reservations.

### Audit Trail
A chronological record of GDPR operations performed, including what data was processed, when, by whom, and for what reason.

### Data Retention Policy
Rules governing how long personal data can be stored before it must be deleted or obfuscated to comply with GDPR requirements.

## Core Entities

### GdprRequest
**Description**: Represents a request to obfuscate personal data for GDPR compliance

**Attributes**:
- `requestId`: String - Unique identifier for the GDPR request
- `entityId`: String - Identifier of the entity containing personal data
- `entityType`: EntityType - Type of entity (USER, ORGANIZATION, EVENT, etc.)
- `fields`: List<String> - Specific fields to be obfuscated
- `reason`: RequestReason - Reason for the obfuscation request
- `status`: RequestStatus - Current status of the request
- `createdAt`: Timestamp - When the request was created
- `updatedAt`: Timestamp - When the request was last modified
- `completedAt`: Timestamp - When the request was completed
- `requestedBy`: String - User who initiated the request
- `metadata`: Map<String, Object> - Additional request metadata

**Relationships**:
- Has many ObfuscationResults
- Belongs to BatchRequest (if part of batch)

### BatchRequest
**Description**: Represents a batch operation for processing multiple GDPR requests

**Attributes**:
- `batchId`: String - Unique identifier for the batch
- `totalEntities`: Integer - Total number of entities in the batch
- `processedEntities`: Integer - Number of entities processed
- `failedEntities`: Integer - Number of entities that failed processing
- `status`: BatchStatus - Current status of the batch
- `priority`: Priority - Processing priority level
- `createdAt`: Timestamp - When the batch was created
- `startedAt`: Timestamp - When processing began
- `completedAt`: Timestamp - When processing completed
- `estimatedCompletionTime`: Timestamp - Estimated completion time
- `createdBy`: String - User who created the batch

**Relationships**:
- Has many GdprRequests
- Has many BatchResults

### ObfuscationResult
**Description**: Result of obfuscating a specific field or set of fields

**Attributes**:
- `resultId`: String - Unique identifier for the result
- `requestId`: String - Associated GDPR request ID
- `fieldName`: String - Name of the obfuscated field
- `originalValue`: String - Original value (encrypted/hashed for audit)
- `obfuscatedValue`: String - The obfuscated value
- `obfuscationMethod`: ObfuscationMethod - Method used for obfuscation
- `processedAt`: Timestamp - When the obfuscation occurred
- `success`: Boolean - Whether obfuscation was successful
- `errorMessage`: String - Error details if obfuscation failed

**Relationships**:
- Belongs to GdprRequest

### Entity
**Description**: Represents a data subject or object containing personal information

**Attributes**:
- `entityId`: String - Unique identifier for the entity
- `entityType`: EntityType - Type of entity
- `personalDataFields`: List<String> - Fields containing personal data
- `lastObfuscated`: Timestamp - When entity was last obfuscated
- `retentionPolicy`: String - Applicable data retention policy
- `consentStatus`: ConsentStatus - Current consent status
- `dataSource`: String - Source system for the entity

**Relationships**:
- Has many GdprRequests
- Has many AuditEntries

### AuditEntry
**Description**: Audit trail record for GDPR operations

**Attributes**:
- `auditId`: String - Unique identifier for the audit entry
- `entityId`: String - Entity that was processed
- `operation`: AuditOperation - Type of operation performed
- `performedBy`: String - User who performed the operation
- `performedAt`: Timestamp - When the operation occurred
- `details`: String - Detailed description of the operation
- `ipAddress`: String - IP address of the requester
- `userAgent`: String - User agent of the requester
- `complianceReason`: String - Legal basis for the operation

**Relationships**:
- Belongs to Entity

## Enumerations

### EntityType
- `USER` - Individual user accounts
- `ORGANIZATION` - Company or organization records
- `EVENT` - Event-related data
- `RESERVATION` - Hotel reservation data
- `PAYMENT` - Payment and billing information
- `CONTACT` - Contact information records

### RequestStatus
- `QUEUED` - Request has been submitted and queued
- `IN_PROGRESS` - Request is currently being processed
- `COMPLETED` - Request has been successfully completed
- `FAILED` - Request processing failed
- `CANCELLED` - Request was cancelled before completion
- `PARTIAL` - Request partially completed with some failures

### BatchStatus
- `CREATED` - Batch has been created but not started
- `QUEUED` - Batch is queued for processing
- `IN_PROGRESS` - Batch is currently being processed
- `COMPLETED` - All items in batch processed successfully
- `FAILED` - Batch processing failed
- `CANCELLED` - Batch was cancelled
- `PARTIAL` - Batch completed with some failures

### RequestReason
- `GDPR_REQUEST` - Explicit GDPR right to erasure request
- `DATA_RETENTION` - Automated data retention policy
- `PRIVACY_REQUEST` - General privacy-related request
- `ACCOUNT_DELETION` - User account deletion
- `COMPLIANCE_AUDIT` - Compliance audit requirement

### ObfuscationMethod
- `MASK` - Replace characters with asterisks or other symbols
- `HASH` - One-way cryptographic hash
- `ENCRYPT` - Reversible encryption (for specific use cases)
- `ANONYMIZE` - Remove identifying characteristics
- `PSEUDONYMIZE` - Replace with pseudonymous identifiers
- `DELETE` - Complete removal of data

### Priority
- `LOW` - Non-urgent processing
- `NORMAL` - Standard processing priority
- `HIGH` - Expedited processing
- `URGENT` - Immediate processing required

### ConsentStatus
- `GRANTED` - User has provided consent
- `WITHDRAWN` - User has withdrawn consent
- `EXPIRED` - Consent has expired
- `PENDING` - Consent request pending
- `NOT_REQUIRED` - Consent not required for this data

### AuditOperation
- `OBFUSCATE` - Data obfuscation operation
- `DELETE` - Data deletion operation
- `ACCESS` - Data access operation
- `EXPORT` - Data export operation
- `CONSENT_UPDATE` - Consent status update

## Business Rules

### Data Obfuscation Rules
1. **Irreversibility**: Once data is obfuscated, it cannot be reversed to its original form
2. **Consistency**: The same input always produces the same obfuscated output
3. **Format Preservation**: Obfuscated data maintains the original format structure
4. **Referential Integrity**: Related data across systems is obfuscated consistently

### Batch Processing Rules
1. **Size Limits**: Batch operations are limited to 10,000 entities per batch
2. **Priority Handling**: HIGH and URGENT priority requests bypass normal queuing
3. **Failure Handling**: Individual failures don't stop batch processing
4. **Timeout Limits**: Batch operations timeout after 24 hours

### Audit Requirements
1. **Complete Logging**: All GDPR operations must be logged with full details
2. **Retention Period**: Audit logs are retained for 7 years minimum
3. **Immutability**: Audit entries cannot be modified after creation
4. **Access Control**: Audit logs require special permissions to access

### Data Retention Rules
1. **Automatic Processing**: Data retention policies trigger automatic obfuscation
2. **Grace Periods**: 30-day grace period before automatic processing
3. **Legal Holds**: Data under legal hold is exempt from automatic processing
4. **Consent Dependencies**: Active consent extends retention periods

### Compliance Requirements
1. **Response Time**: GDPR requests must be processed within 30 days
2. **Verification**: Identity verification required for all requests
3. **Documentation**: All operations must include legal basis documentation
4. **Cross-Border**: Special handling for cross-border data transfers

## Data Relationships

### Primary Relationships
- **GdprRequest** → **ObfuscationResult** (1:N)
- **BatchRequest** → **GdprRequest** (1:N)
- **Entity** → **GdprRequest** (1:N)
- **Entity** → **AuditEntry** (1:N)

### Derived Relationships
- **BatchRequest** → **ObfuscationResult** (1:N through GdprRequest)
- **User** → **AuditEntry** (1:N through performed operations)

### Referential Constraints
- All GdprRequests must reference a valid Entity
- ObfuscationResults must reference a valid GdprRequest
- AuditEntries must reference a valid Entity and operation performer
- BatchRequests cannot be deleted while containing active GdprRequests