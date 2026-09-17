# Domain Model

## Glossary

### User
A person who has an account that provides access to the Passkey system. Users belong to participant organizations and have specific types: Planner (event organizers), Hotel User (hotel staff), Admin User (system administrators), or API User (programmatic access).

### User Details
Comprehensive information about a user including personal data, preferences, login history, and system-specific settings.

### Participant
An organization or entity in Passkey (NOT a person). Types include Event Organizers, Hotels, Sister Property Organizations, Vendors/Sponsors, and Passkey itself. Users belong to participants through the participantId relationship.

### Favorites
Properties or hotels that a user has marked as preferred for future bookings. Users can add notes and manage their favorite properties list.

### User Preferences
Configurable settings that control how the system displays information to the user, including date/time formats, language, and notification preferences.

### User Type
Classification of users within the system that determines available features and permissions. Valid types: PLANNER (event organizers), HOTEL_USER (hotel staff), ADMIN_USER (system administrators), API_USER (programmatic access).

### User Status
Current state of a user account (e.g., ACTIVE, INACTIVE, SUSPENDED) that affects system access and functionality.

### Reporting Level
User's access level for viewing reports and analytics within the system.

### PK (Passkey) User ID
Internal identifier used within the Passkey system to reference users across different services and components.

### Action ID
Identifier for the last action performed by or on behalf of a user, used for audit trails and system tracking.

## Core Entities

### UserDetails
**Description**: Central entity representing a user's complete profile and system state.

**Attributes**:
- `userId`: Long - Primary identifier for the user
- `userName`: String - User's login name (typically email address)
- `userType`: UserType - Classification of the user (PLANNER, HOTEL_USER, ADMIN_USER, API_USER)
- `userTypeId`: Integer - Internal ID mapping to UserType enum
- `participantId`: Long - ID of the participant organization this user belongs to
- `emailAddress`: String - User's email address for communications
- `userStatusId`: Integer - Current status of the user account
- `lastLogin`: LocalDate - Timestamp of user's last successful login
- `lastPasswordChange`: LocalDate - When the user last updated their password
- `pkUserId`: Long - Passkey-specific user identifier
- `pkActionId`: Integer - Last action performed by/for the user
- `pkTimeStamp`: LocalDate - Timestamp of the last Passkey action
- `lastAcceptedTerms`: LocalDate - When user last accepted terms and conditions
- `lastNameFormatEnabled`: Boolean - Whether to display last name in formatted view
- `reportingLevelId`: Integer - User's access level for reports
- `dateFormatId`: Integer - Preferred date display format
- `timeFormatId`: Integer - Preferred time display format
- `typeEmailNotificationId`: Integer - Email notification preferences

**Relationships**:
- One-to-many with UserFavorites
- One-to-one with UserPreferences
- Many-to-one with Participant (user belongs to a participant organization)

### UserFavorites
**Description**: Properties or hotels that a user has saved for quick access and future bookings.

**Attributes**:
- `favoriteId`: Long - Unique identifier for the favorite record
- `userId`: Long - Reference to the user who owns this favorite
- `propertyId`: Long - Identifier of the favorited property/hotel
- `propertyName`: String - Display name of the property
- `dateAdded`: LocalDate - When the favorite was added
- `notes`: String - User's personal notes about the property
- `sortOrder`: Integer - User-defined ordering of favorites

**Relationships**:
- Many-to-one with UserDetails
- References external Property entity

### UserPreferences
**Description**: User-specific configuration settings that control system behavior and display.

**Attributes**:
- `userId`: Long - Reference to the user
- `dateFormatId`: Integer - Preferred date display format (1=MM/DD/YYYY, 2=DD/MM/YYYY, etc.)
- `timeFormatId`: Integer - Preferred time display format (1=12-hour, 2=24-hour)
- `typeEmailNotificationId`: Integer - Email notification preferences
- `lastNameFormatEnabled`: Boolean - Whether to show formatted last names
- `language`: String - Preferred language code (en-US, en-GB, etc.)
- `timezone`: String - User's timezone for date/time display
- `currency`: String - Preferred currency for price display
- `measurementUnit`: String - Preferred measurement system (metric/imperial)

**Relationships**:
- One-to-one with UserDetails

### Participant
**Description**: Represents an organization or entity in Passkey (NOT a person). Types include Event Organizers, Hotels, Sister Property Organizations, Vendors/Sponsors, and Passkey itself. Users belong to participants.

**Attributes**:
- `participantId`: Long - Unique identifier for the participant organization
- `objectType`: String - Type of participant (Event Organizer, Hotel, etc.)
- `organizationName`: String - Name of the organization
- `contactInfo`: ContactInfo - Organization contact information
- `customerFlags`: Integer - Bitwise configuration flags
- `permissionLevels`: String - Read/write/delete permission levels

**Relationships**:
- One-to-many with UserDetails (users belong to participant organizations)
- One-to-many with Events (for event organizer participants)
- One-to-many with Hotels (for hotel participants)

## Business Rules

### User Management Rules
1. **Unique Email Addresses**: Each user must have a unique email address within the system
2. **Username Validation**: Usernames must be valid email addresses
3. **Password Policy**: Passwords must meet complexity requirements and be changed periodically
4. **Account Status**: Only ACTIVE users can perform booking operations
5. **Terms Acceptance**: Users must accept current terms and conditions to access booking features

### Favorites Management Rules
1. **Duplicate Prevention**: Users cannot add the same property to favorites multiple times
2. **Favorites Limit**: Users can have a maximum of 50 favorite properties
3. **Property Validation**: Only active, bookable properties can be added to favorites
4. **Notes Length**: User notes are limited to 500 characters
5. **Automatic Cleanup**: Favorites for inactive properties are automatically removed after 90 days

### Preferences Rules
1. **Format Validation**: Date and time format IDs must reference valid system formats
2. **Language Support**: Language codes must be supported by the system
3. **Timezone Validation**: Timezone values must be valid IANA timezone identifiers
4. **Default Values**: New users receive system default preferences
5. **Inheritance**: Some preferences can be inherited from organization settings

### Participant Rules
1. **Contact Information**: At least one contact method (email or phone) is required
2. **Name Validation**: First and last names are required and must contain valid characters
3. **Email Format**: Email addresses must be properly formatted and validated
4. **User Association**: Participants can optionally be linked to user accounts
5. **Privacy Compliance**: Participant data handling must comply with GDPR and privacy regulations

## Data Relationships

### User-Centric Model
```
UserDetails (n) ←→ (1) Participant (users belong to participant organization)
     ↓
     (1) ←→ (0..1) UserPreferences
     ↓
     (1) ←→ (0..n) UserFavorites
```

### External Relationships
- **Auth Service**: UserDetails.userId maps to Auth Service user records
- **Property Service**: UserFavorites.propertyId references external property data
- **Reservation Service**: Participants link to booking and reservation records
- **Reporting Service**: User data feeds into analytics and reporting systems

## Validation Rules

### Data Integrity
- All foreign key relationships must be valid
- Required fields cannot be null or empty
- Date fields must be valid dates and within reasonable ranges
- Numeric fields must be within defined bounds

### Business Logic Validation
- User status changes must follow defined state transitions
- Preference updates must maintain system consistency
- Favorite additions must validate property availability
- Participant data must meet booking system requirements

## Audit and Tracking

### Change Tracking
- All user detail changes are logged with timestamps
- Preference modifications are tracked for analytics
- Favorite additions/removals are recorded
- Login activities are monitored and stored

### Data Retention
- User details are retained according to privacy policies
- Inactive user data is archived after defined periods
- Audit logs are maintained for compliance requirements
- Deleted data follows secure deletion procedures