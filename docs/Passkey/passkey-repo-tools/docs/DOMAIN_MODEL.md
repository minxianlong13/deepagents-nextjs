# Domain Model

## Glossary

### Passkey
The hotel reservation and inventory management platform developed by Cvent for the hospitality industry.

### Service
A microservice within the passkey ecosystem that provides specific business functionality (e.g., payment processing, reservation management).

### PBB (Payment Business Backend)
The payment processing system that handles credit card transactions, refunds, and merchant account management.

### Reservation Engine
The core system responsible for processing hotel reservations, managing inventory, and coordinating with external systems.

### Octo (Octopus Deploy)
The deployment and release management platform used for managing passkey service deployments across environments.

### Backstage
The service catalog and developer portal that provides metadata and API key management for passkey services.

### Merchant Account
A business account that allows hotels to accept credit card payments through the PBB system.

### Confirmation Number
A unique identifier assigned to each hotel reservation for tracking and reference purposes.

### Attendee Code
A code associated with event attendees that links reservations to specific events or groups.

### Service Metadata
Configuration and deployment information stored in S3 that describes service versions, dependencies, and runtime parameters.

## Core Entities

### Service
**Description**: Represents a passkey microservice running in the AWS infrastructure

**Attributes**:
- `name`: string - Service name (e.g., "passkey-payment-service")
- `version`: string - Current deployed version
- `ec2_instance`: string - EC2 instance identifier
- `private_ip`: string - Internal IP address
- `ports`: array - Port mappings for the service
- `environment`: string - Deployment environment (alpha, beta, prod)

**Relationships**:
- Related to ServiceMetadata for configuration details
- Associated with EC2 instances for infrastructure

### Payment
**Description**: Represents a payment transaction processed through PBB

**Attributes**:
- `payment_id`: string - Unique payment identifier
- `caller_reference_id`: string - External reference ID
- `merchant_account_id`: string - Associated merchant account
- `tenant_id`: string - Tenant identifier
- `state`: string - Payment state (SaleApproved, Failed, etc.)
- `transaction_id`: string - Payment processor transaction ID
- `amount`: decimal - Payment amount
- `invoice_number`: string - Invoice reference
- `email`: string - Customer email
- `phone`: string - Customer phone number

**Relationships**:
- Belongs to a MerchantAccount
- May have associated Refunds

### Refund
**Description**: Represents a refund transaction for a previous payment

**Attributes**:
- `refund_id`: string - Unique refund identifier
- `caller_reference_id`: string - External reference ID
- `merchant_account_id`: string - Associated merchant account
- `tenant_id`: string - Tenant identifier
- `state`: string - Refund state (RefundApproved, RefundFailed, etc.)
- `amount`: decimal - Refund amount
- `invoice_number`: string - Original invoice reference

**Relationships**:
- Associated with original Payment
- Belongs to a MerchantAccount

### MerchantAccount
**Description**: Represents a merchant account for payment processing

**Attributes**:
- `merchant_account_id`: string - Unique merchant identifier
- `name`: string - Merchant account name
- `tenant_id`: string - Tenant identifier
- `processor`: string - Payment processor type
- `created_date`: datetime - Account creation date
- `accepted_types`: array - Accepted card types

**Relationships**:
- Has many Payments
- Has many Refunds

### Reservation
**Description**: Represents a hotel reservation in the system

**Attributes**:
- `confirmation_number`: string - Unique confirmation identifier
- `status`: string - Reservation status (NEW, MODIFIED, CANCELLED)
- `arrival_date`: date - Check-in date
- `departure_date`: date - Check-out date
- `attendee_code`: string - Associated event attendee code
- `last_modified`: datetime - Last modification timestamp
- `guests`: integer - Number of guests
- `payment_type`: string - Payment method type
- `total_charges`: decimal - Total reservation cost
- `currency`: string - Currency code

**Relationships**:
- May have a master acknowledgment (for modifications)
- Associated with payment transactions

### PullRequest
**Description**: Represents a GitHub pull request for team repositories

**Attributes**:
- `number`: integer - Pull request number
- `title`: string - Pull request title
- `author`: string - Pull request author
- `repository`: string - Repository name
- `status`: string - Pull request status
- `created_date`: datetime - Creation timestamp
- `updated_date`: datetime - Last update timestamp

**Relationships**:
- Belongs to a Repository
- Created by a User

### APIKey
**Description**: Represents an API key managed through Backstage

**Attributes**:
- `key_id`: string - Unique key identifier
- `service_name`: string - Associated service
- `team`: string - Owning team
- `environment`: string - Environment (dev, staging, prod)
- `expiration_date`: datetime - Key expiration date
- `status`: string - Key status (active, expired, revoked)

**Relationships**:
- Belongs to a Service
- Owned by a Team

## Business Rules

### Payment Processing
- Payments must have a valid merchant account before processing
- Refunds cannot exceed the original payment amount
- Payment states follow a defined lifecycle (pending → approved/failed)

### Reservation Management
- Confirmation numbers must be unique across the system
- Reservations can be modified, creating a new confirmation with a master acknowledgment
- Arrival date must be before departure date

### Service Deployment
- Services must have valid metadata before deployment
- Version numbers follow semantic versioning
- Each service instance must have unique port assignments

### API Key Management
- API keys have expiration dates and must be rotated regularly
- Production keys require additional approval processes
- Expired keys are automatically flagged for renewal

### Release Management
- Releases follow a promotion path: alpha → beta → production
- Each release requires approval gates and testing validation
- Rollback procedures must be available for all production releases