# Domain Model

## Glossary

### Business Text
A localized text entry that provides human-readable content for specific business elements within the Passkey platform. Business text can have both small (brief) and large (detailed) values.

### Business Text ID
A unique identifier that represents a specific piece of business content. IDs follow a hierarchical naming convention (e.g., "hotel.room.type.standard").

### Locale
A combination of language and region that defines the cultural and linguistic context for text content (e.g., "en_US" for English in the United States).

### Localization (L10n)
The process of adapting content for specific locales, including translation, cultural adaptation, and formatting.

### Internationalization (I18n)
The design and development process that enables software to support multiple locales without requiring engineering changes.

### Element Type
A categorization of business elements that can have associated text (e.g., HOTEL, ROOM_TYPE, ATTENDEE, CAMPAIGN).

### Custom Business Text
User-specific overrides of standard business text that allow personalization of content for individual users or organizations.

### Value Small
A brief, concise version of business text suitable for labels, buttons, or limited display space.

### Value Large
A detailed, comprehensive version of business text suitable for descriptions, help text, or expanded content areas.

## Core Entities

### BusinessText
**Description**: The primary entity representing localized text content in the system.

**Attributes**:
- `userId`: Long - The user ID associated with this business text entry
- `businessTextId`: String - Unique identifier for the business text (required)
- `locale`: String - Locale identifier in format "language_COUNTRY" (required)
- `valueSmall`: String - Brief version of the text (optional)
- `valueLarge`: String - Detailed version of the text (optional)

**Relationships**:
- Associated with a specific User (via userId)
- Linked to a Locale for language/region context
- May have custom overrides per user

**Business Rules**:
- Business text ID must be unique within a locale
- At least one of valueSmall or valueLarge must be provided
- Locale must follow ISO standard format (xx_XX)
- User ID must be valid and exist in the system

### BusinessTextElement
**Description**: Represents the components used to generate business text IDs.

**Attributes**:
- `elementType`: BusinessTextElementType - The type of business element
- `elements`: List<Element> - Collection of element components

**Relationships**:
- Contains multiple Element objects
- Used to generate BusinessText IDs

**Business Rules**:
- Element type must be valid and supported
- Elements list cannot be empty
- Generated IDs must be unique

### Locale
**Description**: Represents a supported language and region combination.

**Attributes**:
- `id`: String - Locale identifier (e.g., "en_US")
- `name`: String - Human-readable name
- `language`: String - ISO language code
- `country`: String - ISO country code

**Relationships**:
- Referenced by BusinessText entries
- Associated with Country entities

**Business Rules**:
- Locale ID must follow ISO standard format
- Language and country codes must be valid ISO codes
- Each locale must have a unique identifier

### Country
**Description**: Represents country information with localization support.

**Attributes**:
- `code`: String - ISO country code (e.g., "US")
- `name`: String - Default country name
- `localizedName`: String - Localized country name

**Relationships**:
- Referenced by Locale entities
- May have multiple localized names

**Business Rules**:
- Country code must be valid ISO 3166-1 alpha-2 code
- Each country must have a unique code
- Localized names should be provided for supported locales

## Element Types

### HOTEL
**Description**: Represents hotel-related business text
**Usage**: Hotel names, descriptions, amenities

### ROOM_TYPE
**Description**: Represents room type classifications
**Usage**: Standard, deluxe, suite room types

### ATTENDEE
**Description**: Represents attendee-related text
**Usage**: Attendee roles, statuses, categories

### CAMPAIGN
**Description**: Represents marketing campaign text
**Usage**: Campaign names, descriptions, promotional content

### IMAGE
**Description**: Represents image-related text
**Usage**: Image captions, alt text, descriptions

### ITEM
**Description**: Represents general item text
**Usage**: Product names, item descriptions

### PARTICIPANT
**Description**: Represents participant-related text
**Usage**: Participant roles, statuses, types

### EVENT_HOTEL_ROOM_TYPE
**Description**: Represents event-specific room type text
**Usage**: Event room classifications, special room types

### HOTEL_ROOM_TYPE
**Description**: Represents standard hotel room type text
**Usage**: Standard hotel room classifications

### REWARD
**Description**: Represents reward program text
**Usage**: Reward names, descriptions, benefits

### GUARANTEE_PLAN_PAYMENT
**Description**: Represents payment guarantee text
**Usage**: Payment terms, guarantee descriptions

### BLOCK_REQUEST_PREFERENCES
**Description**: Represents booking preference text
**Usage**: Preference options, selection criteria

### EVENT_CUSTOM_MESSAGE
**Description**: Represents custom event messaging
**Usage**: Event-specific custom messages

### PARTICIPANT_EVENT
**Description**: Represents participant event text
**Usage**: Event participation descriptions

## Business Rules

### Business Text Management
1. **Uniqueness**: Business text IDs must be unique within a locale
2. **Validation**: All required fields must be provided and valid
3. **Locale Support**: Only supported locales can be used
4. **User Association**: Business text must be associated with a valid user
5. **Content Requirements**: At least one value (small or large) must be provided

### ID Generation
1. **Hierarchical Structure**: IDs follow a dot-separated hierarchy
2. **Element Composition**: IDs are generated from business elements
3. **Consistency**: Generated IDs must be consistent and predictable
4. **Uniqueness**: Generated IDs must be globally unique

### Localization Rules
1. **Locale Format**: Must follow "language_COUNTRY" format (e.g., "en_US")
2. **Fallback Strategy**: System should fall back to default locale if specific locale not found
3. **Character Encoding**: All text must support UTF-8 encoding
4. **Cultural Adaptation**: Text should be culturally appropriate for the target locale

### Custom Business Text
1. **Override Priority**: Custom text takes precedence over standard text
2. **User Scope**: Custom text is scoped to specific users
3. **Inheritance**: Custom text inherits structure from standard text
4. **Validation**: Custom text must follow same validation rules as standard text

### Data Integrity
1. **Referential Integrity**: All foreign key relationships must be maintained
2. **Cascade Operations**: Deletions should cascade appropriately
3. **Audit Trail**: Changes should be logged for audit purposes
4. **Backup Strategy**: Critical data must be backed up regularly

## Domain Events

### BusinessTextCreated
**Triggered**: When new business text is created
**Data**: BusinessText entity, user context, timestamp

### BusinessTextUpdated
**Triggered**: When existing business text is modified
**Data**: Old and new BusinessText entities, user context, timestamp

### BusinessTextDeleted
**Triggered**: When business text is removed
**Data**: Deleted BusinessText entity, user context, timestamp

### LocaleAdded
**Triggered**: When new locale support is added
**Data**: Locale entity, configuration details

### CustomTextOverrideCreated
**Triggered**: When custom text override is created
**Data**: Custom BusinessText entity, user context

## Integration Points

### External Systems
- **Auth Service**: User authentication and authorization
- **User Management**: User ID validation and context
- **Audit Service**: Change tracking and compliance
- **Translation Services**: Automated translation capabilities

### Internal Dependencies
- **Database**: Oracle database for persistence
- **Caching Layer**: Redis for performance optimization (future)
- **Configuration Service**: Environment-specific settings
- **Monitoring**: Metrics and health check integration

## Data Validation Rules

### Business Text ID Format
- Must contain only alphanumeric characters, dots, and hyphens
- Cannot start or end with a dot
- Maximum length: 255 characters
- Must follow hierarchical naming convention

### Locale Format
- Must match pattern: `^[a-z]{2}_[A-Z]{2}$`
- Language code must be valid ISO 639-1
- Country code must be valid ISO 3166-1 alpha-2

### Text Content
- Maximum length for valueSmall: 255 characters
- Maximum length for valueLarge: 4000 characters
- Must be valid UTF-8 encoded text
- Cannot contain control characters (except newlines in valueLarge)

### User ID
- Must be positive integer
- Must exist in user management system
- Must have appropriate permissions for the operation