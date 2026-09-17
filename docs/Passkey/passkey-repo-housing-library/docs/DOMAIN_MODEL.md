# Domain Model

## Glossary

### Housing Library
A centralized repository of housing-related resources including room types, event templates, images, and configuration data used across the Passkey platform for hotel and event management.

### Room Category
A classification system for hotel rooms that defines characteristics such as bed types, occupancy limits, amenities, and pricing tiers. Used to standardize room offerings across different hotels.

### Event Template
Pre-configured templates that define standard settings, layouts, and configurations for different types of events (corporate meetings, conferences, weddings, etc.).

### Bundle Hotel
A collection of hotels grouped together for event organizers, typically offering coordinated pricing, availability, and services for large events requiring multiple accommodation options.

### Participant Profile Settings
Configuration parameters that control how participant information is collected, displayed, and managed within the Passkey system for specific organizations or events.

### Image Metadata
Descriptive information associated with images in the library, including titles, descriptions, tags, and categorization data used for search and organization.

### Organization
A business entity (hotel chain, event management company, etc.) that uses the Passkey platform to manage their housing and event operations.

### Passkey Settings
System-wide configuration parameters that control various aspects of the Passkey platform behavior for specific organizations or events.

## Core Entities

### Room
**Description**: Represents a hotel room with its characteristics and amenities

**Attributes**:
- `id`: String - Unique room identifier
- `name`: String - Display name of the room
- `type`: RoomType - Classification of the room (STANDARD, DELUXE, SUITE, etc.)
- `description`: String - Detailed description of the room
- `maxOccupancy`: Integer - Maximum number of guests
- `beds`: List<Bed> - Bed configurations in the room
- `amenities`: List<String> - Available amenities
- `images`: List<String> - Associated image identifiers
- `active`: Boolean - Whether the room is currently available

**Relationships**:
- Belongs to a RoomCategory
- Contains multiple Bed entities
- Associated with multiple ImageResponse entities

### Bed
**Description**: Represents bed configuration within a room

**Attributes**:
- `type`: String - Type of bed (KING, QUEEN, TWIN, SOFA_BED, etc.)
- `count`: Integer - Number of beds of this type

**Relationships**:
- Belongs to a Room entity

### RoomType
**Description**: Enumeration of standard room classifications

**Values**:
- `STANDARD` - Basic accommodation
- `DELUXE` - Enhanced standard room
- `SUITE` - Multi-room accommodation
- `PRESIDENTIAL` - Luxury suite
- `ACCESSIBLE` - ADA compliant room

### EventTemplate
**Description**: Pre-configured template for event setup

**Attributes**:
- `id`: String - Unique template identifier
- `name`: String - Template name
- `eventSubType`: EventSubType - Type of event this template supports
- `description`: String - Template description
- `configuration`: Object - Template-specific configuration data

**Relationships**:
- Associated with EventSubType
- Used by multiple events

### EventSubType
**Description**: Classification of event types

**Attributes**:
- `id`: String - Unique identifier
- `name`: String - Display name
- `category`: String - Parent category
- `description`: String - Detailed description

**Relationships**:
- Used by EventTemplate entities

### BundleHotel
**Description**: Hotel included in an event bundle

**Attributes**:
- `hotelId`: String - Hotel identifier
- `name`: String - Hotel name
- `address`: String - Hotel address
- `priority`: Integer - Display priority in bundle
- `contractTerms`: Object - Specific terms for this hotel in the bundle

**Relationships**:
- Part of hotel bundles for events
- Associated with Room entities

### ImageResponse
**Description**: Represents an image in the library with metadata

**Attributes**:
- `imageId`: String - Unique image identifier
- `url`: String - Image access URL
- `metadata`: ImageMetadata - Associated metadata
- `uploadedAt`: DateTime - Upload timestamp
- `contentType`: String - MIME type of the image
- `size`: Long - File size in bytes

**Relationships**:
- Associated with Room entities
- Contains ImageMetadata

### ImageMetadataRequest
**Description**: Metadata information for images

**Attributes**:
- `title`: String - Image title
- `description`: String - Image description
- `tags`: List<String> - Searchable tags
- `category`: String - Image category
- `altText`: String - Accessibility text

### ParticipantProfileSettingsRequest
**Description**: Configuration for participant profile management

**Attributes**:
- `organizationId`: String - Organization identifier
- `eventId`: String - Event identifier (optional)
- `allowProfileEditing`: Boolean - Whether participants can edit profiles
- `requiredFields`: List<String> - Mandatory profile fields
- `optionalFields`: List<String> - Optional profile fields
- `customFields`: Map<String, Object> - Organization-specific fields

### PasskeySettings
**Description**: System configuration parameters

**Attributes**:
- `organizationId`: String - Organization identifier
- `eventId`: String - Event identifier (optional)
- `settings`: Map<String, Object> - Key-value configuration pairs
- `lastModified`: DateTime - Last update timestamp
- `modifiedBy`: String - User who made the last change

## Business Rules

### Room Management Rules
1. **Occupancy Limits**: Maximum occupancy must be greater than 0 and reasonable for the room type
2. **Bed Configuration**: Total bed capacity should align with maximum occupancy
3. **Room Activation**: Only active rooms are available for booking
4. **Amenity Validation**: Amenities must be from approved list for consistency

### Image Management Rules
1. **File Type Restrictions**: Only JPEG, PNG, GIF, and WebP formats are supported
2. **Size Limits**: Maximum file size of 10MB per image
3. **Metadata Requirements**: Title and description are required for searchability
4. **Tag Limitations**: Maximum of 10 tags per image for performance

### Event Template Rules
1. **Template Uniqueness**: Template names must be unique within an organization
2. **Event Type Matching**: Templates can only be used with compatible event sub-types
3. **Configuration Validation**: Template configurations must pass schema validation

### Bundle Hotel Rules
1. **Hotel Availability**: Hotels must be active and available for the event dates
2. **Priority Ordering**: Priority values must be unique within a bundle
3. **Contract Validation**: Contract terms must be approved before bundle activation

### Participant Settings Rules
1. **Field Validation**: Required fields cannot be empty or null
2. **Custom Field Limits**: Maximum of 20 custom fields per organization
3. **Permission Checks**: Only authorized users can modify profile settings

### Organization Data Isolation
1. **Data Segregation**: Organizations can only access their own data
2. **Cross-Organization Sharing**: Explicit permissions required for shared resources
3. **Audit Trail**: All data modifications are logged with user attribution

## Data Relationships

### Primary Relationships
- **Organization** → **Room Categories** (1:N)
- **Room Category** → **Rooms** (1:N)
- **Room** → **Beds** (1:N)
- **Room** → **Images** (N:N)
- **Organization** → **Event Templates** (1:N)
- **Event Template** → **Event Sub Type** (N:1)
- **Organization** → **Bundle Hotels** (1:N)

### Secondary Relationships
- **Event** → **Event Template** (N:1)
- **Participant** → **Profile Settings** (N:1)
- **Image** → **Multiple Entities** (N:N) - Rooms, Hotels, Events

## Entity Lifecycle

### Room Lifecycle
1. **Creation**: Room created with basic information
2. **Configuration**: Beds, amenities, and images added
3. **Activation**: Room made available for booking
4. **Updates**: Modifications to room details
5. **Deactivation**: Room removed from availability (soft delete)

### Image Lifecycle
1. **Upload**: Image file uploaded to storage
2. **Processing**: Image processed and thumbnails generated
3. **Metadata Assignment**: Title, description, and tags added
4. **Association**: Linked to rooms, hotels, or events
5. **Archival**: Moved to archive storage when no longer needed

### Event Template Lifecycle
1. **Creation**: Template created with basic structure
2. **Configuration**: Detailed settings and rules defined
3. **Testing**: Template validated with test events
4. **Publication**: Made available for event creation
5. **Versioning**: Updates create new versions while preserving history