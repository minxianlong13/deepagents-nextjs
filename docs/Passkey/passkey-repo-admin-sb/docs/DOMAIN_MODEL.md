# Domain Model

## Glossary

### Contact
A person or entity that interacts with the Passkey platform, typically representing hotel staff, event planners, or other business contacts who manage reservations and bookings.

### User Identity
A platform user account that represents an authenticated individual with access to Passkey services. This includes both internal Cvent users and external customer users.

### Email Type
A categorization system for different types of email communications (marketing, notifications, alerts, etc.) that can be associated with contacts to manage communication preferences.

### Participant
An individual who participates in events or bookings managed through the Passkey platform, often linked to reservations and accommodations.

### Platform User
A registered user of the Cvent platform with authenticated access to Passkey services, including administrative and operational capabilities.

### Contact Status
The current state of a contact in the system (active, inactive, pending, etc.) that determines their eligibility for communications and operations.

### GDPR Compliance
Data protection and privacy compliance features that ensure user data is handled according to General Data Protection Regulation requirements.

### Analytics Event
Tracked actions and interactions within the system used for reporting, monitoring, and business intelligence purposes.

## Core Entities

### Contact
**Description**: Represents a business contact who interacts with the Passkey platform

**Attributes**:
- `contactId`: Long - Unique identifier for the contact
- `firstName`: String - Contact's first name
- `lastName`: String - Contact's last name
- `emailAddress`: String - Primary email address
- `phoneNumber`: String - Contact phone number
- `companyName`: String - Associated company or organization
- `jobTitle`: String - Professional title or role
- `contactStatusId`: Long - Reference to contact status
- `createdAt`: Timestamp - Record creation time
- `updatedAt`: Timestamp - Last modification time
- `createdBy`: String - User who created the record
- `updatedBy`: String - User who last updated the record

**Relationships**:
- Many-to-Many with `EmailType` through `ContactEmailTypeAssociation`
- Many-to-One with `ContactStatus`

### UserIdentity
**Description**: Represents an authenticated user's identity and profile information

**Attributes**:
- `userIdentityId`: String - Unique identifier for user identity
- `userId`: String - Platform user ID
- `emailAddress`: String - User's email address
- `firstName`: String - User's first name
- `lastName`: String - User's last name
- `displayName`: String - Preferred display name
- `userType`: String - Type of user (PLATFORM_USER, ADMIN, etc.)
- `isActive`: Boolean - Whether the user account is active
- `lastLoginAt`: Timestamp - Last successful login time
- `createdAt`: Timestamp - Account creation time
- `updatedAt`: Timestamp - Last profile update time

**Relationships**:
- One-to-One with `PlatformUser`
- One-to-Many with analytics events and audit logs

### EmailType
**Description**: Defines categories of email communications for contact preferences

**Attributes**:
- `emailTypeId`: Long - Unique identifier for email type
- `typeName`: String - Name of the email type (MARKETING, NOTIFICATIONS, etc.)
- `description`: String - Detailed description of the email type
- `isActive`: Boolean - Whether this email type is currently available
- `sortOrder`: Integer - Display order for UI purposes
- `createdAt`: Timestamp - Record creation time

**Relationships**:
- Many-to-Many with `Contact` through `ContactEmailTypeAssociation`

### ContactEmailTypeAssociation
**Description**: Junction entity managing the many-to-many relationship between contacts and email types

**Attributes**:
- `associationId`: Long - Unique identifier for the association
- `contactId`: Long - Reference to contact
- `emailTypeId`: Long - Reference to email type
- `isSubscribed`: Boolean - Whether contact is subscribed to this email type
- `subscribedAt`: Timestamp - When subscription was activated
- `unsubscribedAt`: Timestamp - When subscription was deactivated (if applicable)
- `createdAt`: Timestamp - Association creation time

**Relationships**:
- Many-to-One with `Contact`
- Many-to-One with `EmailType`

### ContactStatus
**Description**: Defines the current state and availability of a contact

**Attributes**:
- `contactStatusId`: Long - Unique identifier for status
- `statusName`: String - Name of the status (ACTIVE, INACTIVE, PENDING, etc.)
- `description`: String - Description of what this status means
- `isActive`: Boolean - Whether contacts with this status are considered active
- `allowCommunication`: Boolean - Whether contacts with this status can receive communications
- `sortOrder`: Integer - Display order for UI purposes

**Relationships**:
- One-to-Many with `Contact`

### Participant
**Description**: Represents an individual participating in events or bookings

**Attributes**:
- `participantId`: String - Unique identifier for participant
- `firstName`: String - Participant's first name
- `lastName`: String - Participant's last name
- `emailAddress`: String - Participant's email address
- `phoneNumber`: String - Contact phone number
- `registrationDate`: Timestamp - When participant registered
- `status`: String - Current participation status

**Relationships**:
- May be linked to `Contact` records for business relationships
- Associated with reservations and bookings (external systems)

### PlatformUser
**Description**: Represents a registered user of the Cvent platform

**Attributes**:
- `platformUserId`: String - Unique platform user identifier
- `accountId`: String - Associated account identifier
- `userType`: String - Type of platform user
- `permissions`: String - JSON representation of user permissions
- `isActive`: Boolean - Whether the user account is active
- `createdAt`: Timestamp - Account creation time
- `lastAccessAt`: Timestamp - Last platform access time

**Relationships**:
- One-to-One with `UserIdentity`
- Associated with various platform resources and permissions

### UserOrContactDetailsEntity
**Description**: Aggregated view entity for combined user and contact information queries

**Attributes**:
- `entityId`: String - Identifier (could be userId or contactId)
- `entityType`: String - Type of entity (USER or CONTACT)
- `firstName`: String - First name
- `lastName`: String - Last name
- `emailAddress`: String - Email address
- `displayName`: String - Display name for UI
- `status`: String - Current status
- `lastActivity`: Timestamp - Last recorded activity

**Relationships**:
- Virtual entity that aggregates data from `UserIdentity` and `Contact`

## Business Rules

### Contact Management Rules
1. **Email Uniqueness**: Each contact must have a unique email address within the system
2. **Status Validation**: Only contacts with active status can receive communications
3. **Email Type Subscriptions**: Contacts can be subscribed to multiple email types simultaneously
4. **Audit Trail**: All contact modifications must be tracked with user and timestamp information

### User Identity Rules
1. **Authentication Required**: All user operations require valid authentication tokens
2. **Profile Completeness**: Users must have minimum required profile information (name, email)
3. **Account Deactivation**: Deactivated users cannot access platform services but data is retained
4. **Permission Inheritance**: User permissions are inherited from their account and role assignments

### Email Type Rules
1. **Active Types Only**: Only active email types can be assigned to new contact associations
2. **Subscription Management**: Users can opt-out of specific email types while maintaining others
3. **Type Hierarchy**: Some email types may have dependencies or exclusions with others

### GDPR Compliance Rules
1. **Data Retention**: User data must be retained according to configured retention policies
2. **Right to Erasure**: Users can request complete data deletion with appropriate verification
3. **Data Portability**: Users can request export of all their personal data
4. **Consent Management**: Email subscriptions require explicit consent and easy opt-out mechanisms

### Analytics Rules
1. **Event Tracking**: All significant user actions should generate analytics events
2. **Data Anonymization**: Analytics data should be anonymized for reporting purposes
3. **Retention Limits**: Analytics events have configurable retention periods
4. **Privacy Compliance**: Analytics must respect user privacy preferences and GDPR requirements

## Data Relationships Diagram

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   ContactStatus │────│       Contact        │────│   EmailType     │
│                 │    │                      │    │                 │
│ - statusId      │    │ - contactId          │    │ - emailTypeId   │
│ - statusName    │    │ - firstName          │    │ - typeName      │
│ - description   │    │ - lastName           │    │ - description   │
│ - isActive      │    │ - emailAddress       │    │ - isActive      │
└─────────────────┘    │ - phoneNumber        │    └─────────────────┘
                       │ - companyName        │             │
                       │ - jobTitle           │             │
                       │ - contactStatusId    │             │
                       └──────────────────────┘             │
                                  │                         │
                                  │                         │
                       ┌──────────▼─────────────────────────▼┐
                       │  ContactEmailTypeAssociation       │
                       │                                    │
                       │ - associationId                    │
                       │ - contactId                        │
                       │ - emailTypeId                      │
                       │ - isSubscribed                     │
                       │ - subscribedAt                     │
                       └────────────────────────────────────┘

┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│  PlatformUser   │────│    UserIdentity      │    │   Participant   │
│                 │    │                      │    │                 │
│ - platformUserId│    │ - userIdentityId     │    │ - participantId │
│ - accountId     │    │ - userId             │    │ - firstName     │
│ - userType      │    │ - emailAddress       │    │ - lastName      │
│ - permissions   │    │ - firstName          │    │ - emailAddress  │
│ - isActive      │    │ - lastName           │    │ - phoneNumber   │
└─────────────────┘    │ - displayName        │    └─────────────────┘
                       │ - userType           │
                       │ - isActive           │
                       │ - lastLoginAt        │
                       └──────────────────────┘
```

## Entity Lifecycle

### Contact Lifecycle
1. **Creation**: Contact created with required information and default status
2. **Activation**: Contact status set to active, enabling communications
3. **Updates**: Profile information and email preferences can be modified
4. **Deactivation**: Contact marked inactive but data retained
5. **Deletion**: Complete removal from system (GDPR compliance)

### User Identity Lifecycle
1. **Registration**: User account created with basic profile information
2. **Verification**: Email verification and account activation
3. **Active Use**: Regular platform access and profile updates
4. **Suspension**: Temporary account deactivation
5. **Termination**: Account closure with data retention or deletion options

### Email Type Association Lifecycle
1. **Subscription**: Contact opts into specific email type
2. **Active Communication**: Contact receives emails of subscribed types
3. **Modification**: Subscription preferences updated
4. **Unsubscription**: Contact opts out of specific email type
5. **Cleanup**: Inactive associations may be archived