# Domain Model

## Glossary

### GDPR (General Data Protection Regulation)
European Union regulation on data protection and privacy that governs how personal data is collected, processed, and stored. Applies to all organizations processing EU residents' personal data.

### Data Subject
An individual whose personal data is being processed. In the Passkey context, this includes hotel guests, event attendees, and other users of Passkey services.

### Data Controller
The entity that determines the purposes and means of processing personal data. Typically the hotel or event organizer using Passkey services.

### Data Processor
The entity that processes personal data on behalf of the data controller. Cvent/Passkey acts as a data processor for its clients.

### Personal Data
Any information relating to an identified or identifiable natural person, including names, email addresses, phone numbers, location data, and online identifiers.

### Processing
Any operation performed on personal data, including collection, recording, organization, structuring, storage, adaptation, retrieval, consultation, use, disclosure, erasure, or destruction.

### Data Subject Rights
Rights granted to individuals under GDPR, including access, rectification, erasure (right to be forgotten), portability, and objection to processing.

### Lawful Basis
The legal justification for processing personal data under GDPR, such as consent, contract performance, legal obligation, vital interests, public task, or legitimate interests.

### Data Protection Impact Assessment (DPIA)
A process to identify and minimize data protection risks of a project or system that processes personal data.

### Breach Notification
The requirement to notify supervisory authorities and affected individuals of personal data breaches within specific timeframes.

## Core Entities

### GDPR Request
**Description**: Represents a data subject's request under GDPR rights

**Attributes**:
- `requestId`: string - Unique identifier for the request
- `requestType`: enum - Type of GDPR request (ACCESS, RECTIFICATION, ERASURE, PORTABILITY, OBJECTION)
- `dataSubjectId`: string - Identifier of the person making the request
- `submittedAt`: timestamp - When the request was submitted
- `status`: enum - Current status (PENDING, IN_PROGRESS, COMPLETED, REJECTED)
- `completedAt`: timestamp - When the request was completed
- `requestorEmail`: string - Email address of the requester
- `verificationStatus`: enum - Identity verification status
- `processingNotes`: string - Internal notes about processing

**Relationships**:
- Related to Data Subject
- May have multiple Processing Activities
- Links to Compliance Tasks

### Data Subject
**Description**: An individual whose personal data is processed by Passkey services

**Attributes**:
- `subjectId`: string - Unique identifier
- `email`: string - Primary email address
- `firstName`: string - Given name
- `lastName`: string - Family name
- `phoneNumber`: string - Contact phone number
- `createdAt`: timestamp - When record was created
- `lastUpdatedAt`: timestamp - Last modification timestamp
- `consentStatus`: object - Current consent preferences
- `dataRetentionPolicy`: string - Applicable retention policy

**Relationships**:
- Has multiple GDPR Requests
- Associated with Processing Activities
- Linked to Hotel/Event bookings

### Processing Activity
**Description**: A specific data processing operation performed on personal data

**Attributes**:
- `activityId`: string - Unique identifier
- `activityName`: string - Human-readable name
- `purpose`: string - Purpose of processing
- `lawfulBasis`: enum - Legal basis for processing
- `dataCategories`: array - Types of personal data processed
- `retentionPeriod`: duration - How long data is retained
- `isActive`: boolean - Whether activity is currently active
- `riskLevel`: enum - Assessed risk level (LOW, MEDIUM, HIGH)

**Relationships**:
- Processes Data Subject information
- Subject to GDPR Requests
- Monitored by Compliance Tasks

### Compliance Task
**Description**: Automated or manual task to ensure GDPR compliance

**Attributes**:
- `taskId`: string - Unique identifier
- `taskType`: enum - Type of compliance task
- `scheduledAt`: timestamp - When task should execute
- `executedAt`: timestamp - When task was actually executed
- `status`: enum - Task status (SCHEDULED, RUNNING, COMPLETED, FAILED)
- `parameters`: object - Task-specific parameters
- `result`: object - Task execution results
- `nextScheduledAt`: timestamp - Next execution time (for recurring tasks)

**Relationships**:
- May be triggered by GDPR Requests
- Operates on Processing Activities
- Generates Audit Logs

### Audit Log
**Description**: Record of actions taken for compliance and accountability

**Attributes**:
- `logId`: string - Unique identifier
- `timestamp`: timestamp - When action occurred
- `action`: string - Description of action taken
- `actor`: string - Who performed the action (user or system)
- `dataSubjectId`: string - Affected data subject (if applicable)
- `requestId`: string - Related GDPR request (if applicable)
- `metadata`: object - Additional context information

**Relationships**:
- Links to GDPR Requests
- References Data Subjects
- Created by Compliance Tasks

## Business Rules

### Data Subject Rights Processing

#### Right of Access (Article 15)
- Data subjects can request information about their personal data processing
- Response must be provided within 1 month (extendable to 3 months)
- Must include data categories, purposes, recipients, retention periods
- First copy is free; additional copies may incur reasonable fees

#### Right to Rectification (Article 16)
- Data subjects can request correction of inaccurate personal data
- Controllers must rectify without undue delay
- Must notify recipients of rectifications where possible
- Automated systems must be updated to prevent re-occurrence

#### Right to Erasure (Article 17)
- Data subjects can request deletion of personal data
- Applies when data is no longer necessary, consent withdrawn, or unlawfully processed
- Must consider legal obligations and legitimate interests
- Technical measures required to inform third parties of erasure requests

#### Right to Data Portability (Article 20)
- Data subjects can receive their data in structured, machine-readable format
- Applies to data processed based on consent or contract
- Must be provided in commonly used format (JSON, CSV, XML)
- Direct transmission to another controller when technically feasible

### Data Retention Rules

#### Automatic Deletion
- Personal data must be deleted when retention period expires
- Deletion must be secure and irreversible
- Logs of deletion must be maintained for audit purposes
- Backup systems must also purge expired data

#### Legal Hold
- Data subject to legal proceedings cannot be deleted
- Litigation hold overrides normal retention policies
- Must be documented and regularly reviewed
- Release requires legal approval

#### Consent Withdrawal
- When consent is withdrawn, processing must stop immediately
- Data must be deleted unless other lawful basis exists
- Withdrawal must be as easy as giving consent
- Systems must be designed to handle consent changes

### Security and Privacy by Design

#### Data Minimization
- Only collect data necessary for specified purposes
- Regular reviews to identify unnecessary data collection
- Automated systems should enforce data minimization
- Documentation required for all data collection decisions

#### Purpose Limitation
- Data can only be used for original stated purposes
- Compatible uses must be assessed and documented
- New purposes require new lawful basis
- Users must be informed of purpose changes

#### Storage Limitation
- Data must not be kept longer than necessary
- Retention periods must be defined and enforced
- Regular deletion schedules must be implemented
- Exceptions must be documented and justified

### Breach Response

#### Detection and Assessment
- Breaches must be detected within 72 hours where possible
- Risk assessment must consider likelihood and severity
- High-risk breaches require individual notification
- All breaches must be documented regardless of notification requirement

#### Notification Requirements
- Supervisory authority notification within 72 hours
- Individual notification without undue delay for high-risk breaches
- Notifications must include specific required information
- Failure to notify can result in significant fines

### Cross-Border Data Transfers

#### Adequacy Decisions
- Transfers to adequate countries require no additional safeguards
- EU Commission maintains list of adequate countries
- Adequacy status can be revoked, requiring immediate action
- Regular monitoring of adequacy decisions required

#### Standard Contractual Clauses (SCCs)
- Required for transfers to non-adequate countries
- Must use EU Commission approved clauses
- Additional safeguards may be required based on local laws
- Regular assessment of transfer mechanisms required

## Compliance Workflows

### GDPR Request Processing Workflow
1. **Request Intake**: Validate and log incoming requests
2. **Identity Verification**: Confirm requester identity
3. **Scope Assessment**: Determine data and systems involved
4. **Processing**: Execute request according to type
5. **Quality Review**: Verify completeness and accuracy
6. **Response Delivery**: Provide response to data subject
7. **Documentation**: Record all actions taken

### Scheduled Compliance Tasks
1. **Data Retention Review**: Monthly review of data retention compliance
2. **Consent Audit**: Quarterly audit of consent records
3. **Access Log Review**: Weekly review of data access logs
4. **Breach Monitoring**: Continuous monitoring for potential breaches
5. **Policy Updates**: Annual review of privacy policies and procedures

### Integration Points

#### Passkey Services Integration
- Hotel reservation systems
- Event management platforms
- Payment processing systems
- Customer communication tools
- Analytics and reporting systems

#### External System Integration
- Legal case management systems
- Customer support platforms
- Identity verification services
- Data backup and archival systems
- Regulatory reporting systems