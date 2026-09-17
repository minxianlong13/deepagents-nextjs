# Domain Model

## Glossary

### Core Business Terms

#### Guest Management Layer (GML)
The centralized system for managing guest information, preferences, and interactions across the Passkey platform. Handles guest lifecycle from initial contact through post-stay follow-up.

#### CRTS (Central Reservation Transaction System)
A standardized format and system for processing reservation transactions, particularly for integration with General Ledger (GL) systems and financial reporting.

#### Exchange Rate Management
The process of maintaining current and historical currency exchange rates for multi-currency transactions and financial reporting in the hospitality industry.

#### Nor1
A third-party revenue optimization platform that provides upselling and cross-selling opportunities for hotels through data analytics and guest behavior prediction.

#### Roche Integration
A specialized reporting and data integration system for Roche-specific business requirements, likely related to pharmaceutical or healthcare event management.

#### Billing Report Generation
Automated creation of financial reports for billing purposes, including transaction summaries, revenue reports, and customer billing statements.

#### Passkey Services
The umbrella term for the collection of microservices that support the Passkey platform's core functionality, including reservation management, payment processing, and guest services.

### Technical Terms

#### Service Aggregator
A design pattern where multiple independent services are consolidated into a single deployable unit while maintaining their individual functionality and independence.

#### Cron-based Scheduling
A time-based job scheduling system where services are executed automatically at predetermined intervals using Unix cron syntax.

#### Monorepo
A software development strategy where multiple related projects are stored in a single repository, allowing for shared tooling and coordinated releases.

#### Changeset Management
A version control and release management system that tracks changes across multiple packages in a monorepo and coordinates version bumps and releases.

## Core Entities

### Service Entity
**Description**: Represents an individual microservice within the Passkey Services aggregator

**Attributes**:
- `name`: String - Service identifier (e.g., "GMLService", "ExchangeRates")
- `version`: String - Current service version following semantic versioning
- `schedule`: String - Cron expression defining execution schedule
- `status`: Enum - Current service status (RUNNING, STOPPED, ERROR, SCHEDULED)
- `lastExecution`: DateTime - Timestamp of last successful execution
- `executionDuration`: Integer - Duration of last execution in milliseconds
- `logDirectory`: String - Path to service-specific log files

**Relationships**:
- Has many ExecutionLogs
- Belongs to ServiceAggregator
- Has one Configuration

### Guest Entity
**Description**: Represents a guest in the Guest Management Layer system

**Attributes**:
- `guestId`: String - Unique guest identifier
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Primary email address
- `phone`: String - Primary phone number
- `preferences`: JSON - Guest preferences and special requirements
- `loyaltyStatus`: Enum - Guest loyalty tier (STANDARD, SILVER, GOLD, PLATINUM)
- `createdDate`: DateTime - Account creation timestamp
- `lastUpdated`: DateTime - Last modification timestamp

**Relationships**:
- Has many Reservations
- Has many GuestInteractions
- Belongs to LoyaltyProgram

### Reservation Entity
**Description**: Represents a hotel reservation processed by various services

**Attributes**:
- `reservationId`: String - Unique reservation identifier
- `guestId`: String - Associated guest identifier
- `hotelId`: String - Hotel property identifier
- `checkInDate`: Date - Scheduled check-in date
- `checkOutDate`: Date - Scheduled check-out date
- `roomType`: String - Reserved room category
- `totalAmount`: Decimal - Total reservation cost
- `currency`: String - Currency code (ISO 4217)
- `status`: Enum - Reservation status (CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
- `createdDate`: DateTime - Reservation creation timestamp

**Relationships**:
- Belongs to Guest
- Has many BillingTransactions
- Has many ReservationModifications

### Exchange Rate Entity
**Description**: Represents currency exchange rates managed by the ExchangeRates service

**Attributes**:
- `baseCurrency`: String - Base currency code (ISO 4217)
- `targetCurrency`: String - Target currency code (ISO 4217)
- `rate`: Decimal - Exchange rate value
- `effectiveDate`: Date - Date when rate becomes effective
- `source`: String - Rate source provider
- `lastUpdated`: DateTime - Last update timestamp

**Relationships**:
- Used by BillingTransactions
- Has historical ExchangeRateHistory records

### Billing Transaction Entity
**Description**: Represents financial transactions processed by billing services

**Attributes**:
- `transactionId`: String - Unique transaction identifier
- `reservationId`: String - Associated reservation
- `amount`: Decimal - Transaction amount
- `currency`: String - Transaction currency
- `transactionType`: Enum - Type (CHARGE, REFUND, ADJUSTMENT)
- `status`: Enum - Transaction status (PENDING, COMPLETED, FAILED)
- `processedDate`: DateTime - Processing timestamp
- `description`: String - Transaction description

**Relationships**:
- Belongs to Reservation
- References ExchangeRate
- Included in BillingReports

### Report Entity
**Description**: Represents generated reports from various reporting services

**Attributes**:
- `reportId`: String - Unique report identifier
- `reportType`: Enum - Report category (BILLING, ROCHE, EXCHANGE_RATE)
- `generatedDate`: DateTime - Report generation timestamp
- `reportPeriod`: String - Reporting period (e.g., "2024-01", "2024-Q1")
- `format`: Enum - Report format (PDF, EXCEL, CSV, JSON)
- `filePath`: String - Generated file location
- `status`: Enum - Generation status (PENDING, COMPLETED, FAILED)
- `recordCount`: Integer - Number of records included

**Relationships**:
- Contains multiple ReportData records
- Generated by specific Service

### Configuration Entity
**Description**: Represents service-specific configuration settings

**Attributes**:
- `serviceId`: String - Associated service identifier
- `environment`: Enum - Target environment (DEV, ALPHA, BETA, PROD)
- `configKey`: String - Configuration parameter name
- `configValue`: String - Configuration parameter value
- `isEncrypted`: Boolean - Whether value is encrypted
- `lastModified`: DateTime - Last modification timestamp

**Relationships**:
- Belongs to Service
- Has ConfigurationHistory for audit trail

## Business Rules

### Service Execution Rules

1. **Scheduling Constraints**
   - Services must not overlap execution windows to prevent resource conflicts
   - Critical services (GMLService) have higher priority and shorter intervals
   - Reporting services are scheduled during low-traffic periods

2. **Data Consistency Rules**
   - Exchange rates must be updated before billing report generation
   - Guest data synchronization must complete before reservation processing
   - All financial transactions must reference valid exchange rates

3. **Error Handling Rules**
   - Failed service executions must be logged with detailed error information
   - Critical services (GMLService) have automatic retry mechanisms
   - Non-critical services can be manually restarted after failure analysis

### Data Validation Rules

1. **Guest Data Validation**
   - Email addresses must be valid and unique per guest
   - Phone numbers must follow international formatting standards
   - Guest preferences must be validated against available options

2. **Reservation Validation**
   - Check-in date must be before check-out date
   - Reservation amounts must be positive values
   - Currency codes must be valid ISO 4217 codes

3. **Financial Data Validation**
   - Exchange rates must be positive decimal values
   - Transaction amounts must match reservation totals
   - Billing reports must balance to zero net difference

### Integration Rules

1. **External API Integration**
   - All external API calls must include timeout and retry logic
   - API responses must be validated before processing
   - Failed API calls must be logged for monitoring and alerting

2. **Database Integration**
   - All database operations must be transactional
   - Connection pooling must be configured per service
   - Database timeouts must be appropriate for service execution windows

3. **File System Integration**
   - Log files must be rotated to prevent disk space issues
   - Generated reports must be archived according to retention policies
   - Configuration files must be backed up before modifications

## Data Relationships

### Primary Relationships
```
Guest (1) ←→ (N) Reservation
Reservation (1) ←→ (N) BillingTransaction
ExchangeRate (1) ←→ (N) BillingTransaction
Service (1) ←→ (N) ExecutionLog
Service (1) ←→ (1) Configuration
```

### Derived Relationships
```
Guest → BillingTransaction (through Reservation)
Service → Report (through execution)
Configuration → ExecutionLog (through Service)
```

## Domain Events

### Service Execution Events
- ServiceStarted
- ServiceCompleted
- ServiceFailed
- ServiceScheduled

### Data Processing Events
- GuestDataUpdated
- ReservationProcessed
- ExchangeRateUpdated
- ReportGenerated

### Integration Events
- ExternalAPICallCompleted
- DatabaseConnectionEstablished
- ConfigurationUpdated
- LogFileRotated