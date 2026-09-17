# Domain Model

## Glossary

### Venue
A physical location or property in the Cvent ecosystem that can host events. Venues are the primary entity that hotels are associated with in Passkey.

### Hotel
A lodging establishment that provides accommodation services. In the context of this service, hotels are imported from external providers and integrated into the Passkey platform.

### Provider
An external system or service that supplies hotel data. Examples include Choice Hotels, Ice Portal, and the Passkey platform itself.

### External ID
A unique identifier used by external providers to reference their hotels, rooms, or other entities. These IDs are mapped to internal Passkey identifiers.

### Import Strategy
A specific implementation that handles the import process for a particular combination of source and target providers. Each strategy knows how to transform data between different provider formats.

### Import Mapping
A data structure that contains the mapping between source, target, and image provider IDs for a specific import operation.

### Room Type
A classification of hotel rooms based on their features, size, amenities, and configuration (e.g., Standard King, Deluxe Suite).

### Media Asset
Digital content associated with hotels or rooms, primarily images that showcase the property's features and amenities.

### Assignment
The relationship between a hotel and a venue in Passkey. A hotel can be assigned to a venue to indicate it provides accommodation for that location.

## Core Entities

### Hotel Entity
**Description**: Represents a hotel property with all its associated information and metadata.

**Attributes**:
- `id`: UUID - Internal Passkey identifier
- `name`: String - Hotel name
- `address`: Address - Physical location information
- `description`: String - Hotel description and amenities
- `starRating`: Integer - Hotel star rating (1-5)
- `phoneNumber`: String - Contact phone number
- `emailAddress`: String - Contact email
- `website`: String - Hotel website URL
- `checkInTime`: Time - Standard check-in time
- `checkOutTime`: Time - Standard check-out time
- `policies`: List<Policy> - Hotel policies and rules
- `amenities`: List<Amenity> - Available amenities
- `images`: List<MediaAsset> - Hotel images and media

**Relationships**:
- One-to-Many with Room entities
- Many-to-Many with Venue entities (through assignments)
- One-to-Many with ProviderMapping entities

### Room Entity
**Description**: Represents a specific room type or configuration within a hotel.

**Attributes**:
- `id`: UUID - Internal room identifier
- `hotelId`: UUID - Reference to parent hotel
- `roomType`: String - Type classification
- `name`: String - Room name or description
- `maxOccupancy`: Integer - Maximum number of guests
- `bedConfiguration`: String - Bed types and quantities
- `size`: Integer - Room size in square feet/meters
- `amenities`: List<Amenity> - Room-specific amenities
- `baseRate`: BigDecimal - Base nightly rate
- `images`: List<MediaAsset> - Room images
- `availability`: Boolean - Current availability status

**Relationships**:
- Many-to-One with Hotel entity
- One-to-Many with MediaAsset entities

### ProviderMapping Entity
**Description**: Maps external provider IDs to internal Passkey entities.

**Attributes**:
- `id`: UUID - Internal mapping identifier
- `entityId`: UUID - Internal entity ID (hotel, room, etc.)
- `entityType`: EntityType - Type of entity being mapped
- `providerCode`: String - Provider identifier (CHOICE, ICEPORTAL)
- `externalId`: String - Provider's external identifier
- `lastSyncDate`: DateTime - Last synchronization timestamp
- `isActive`: Boolean - Mapping status

**Relationships**:
- References Hotel, Room, or other entities based on entityType

### MediaAsset Entity
**Description**: Represents digital media content associated with hotels or rooms.

**Attributes**:
- `id`: UUID - Internal media identifier
- `entityId`: UUID - Associated entity (hotel or room)
- `entityType`: EntityType - Type of associated entity
- `mediaType`: MediaType - Image, video, document, etc.
- `url`: String - S3 storage URL
- `originalUrl`: String - Original source URL
- `title`: String - Media title or caption
- `description`: String - Media description
- `sortOrder`: Integer - Display order
- `fileSize`: Long - File size in bytes
- `dimensions`: String - Image dimensions (width x height)
- `uploadDate`: DateTime - Upload timestamp

**Relationships**:
- Many-to-One with Hotel or Room entities

### ImportRequest Entity
**Description**: Represents a request to import data from one provider to another.

**Attributes**:
- `id`: UUID - Request identifier
- `venueId`: UUID - Target venue
- `sourceProvider`: String - Source data provider
- `targetProvider`: String - Target system
- `imagesProvider`: String - Image source provider
- `requestType`: ImportType - Type of import operation
- `status`: ImportStatus - Current request status
- `createdBy`: String - User who initiated the request
- `createdDate`: DateTime - Request creation time
- `completedDate`: DateTime - Request completion time
- `errorMessage`: String - Error details if failed

**Relationships**:
- References Venue entity
- One-to-Many with ImportResult entities

## Business Rules

### Hotel Import Rules

1. **Provider Validation**
   - Source and target providers must be supported
   - Provider combination must have an available import strategy
   - External IDs must exist for the specified venue

2. **Data Integrity**
   - Hotel names must be unique within a provider
   - Required fields must be present (name, address)
   - Star ratings must be between 1 and 5

3. **Image Processing**
   - Images must be accessible from source URLs
   - Supported formats: JPEG, PNG, WebP
   - Maximum file size: 10MB per image
   - Images are stored in S3 with CDN distribution

### Room Import Rules

1. **Hotel Prerequisites**
   - Hotel must exist in target system before importing rooms
   - Hotel must be successfully assigned to venue

2. **Room Validation**
   - Room types must be valid classifications
   - Maximum occupancy must be positive integer
   - Base rates must be non-negative

3. **Image Association**
   - Room images are imported after room data
   - Images are linked to specific room types
   - Failed image imports don't block room creation

### Assignment Rules

1. **Hotel Assignment**
   - Hotel must exist in both source and target systems
   - Venue must be active and accessible
   - Only one hotel can be assigned per venue per provider

2. **Unassignment**
   - Assignment must exist before unassignment
   - Unassignment doesn't delete hotel data
   - Related bookings are preserved

### Provider Mapping Rules

1. **ID Mapping**
   - External IDs must be unique within a provider
   - Mappings are created during import operations
   - Stale mappings are marked inactive, not deleted

2. **Synchronization**
   - Last sync date is updated on successful operations
   - Failed syncs don't update timestamps
   - Mappings can be manually refreshed

## Data Relationships

### Entity Relationship Diagram

```
Venue ──────────── Hotel ──────────── Room
  │                  │                  │
  │                  │                  │
  └── Assignment ────┘                  │
                     │                  │
                     │                  │
              ProviderMapping    MediaAsset
                     │                  │
                     │                  │
                ImportRequest ──────────┘
                     │
                     │
                ImportResult
```

### Key Relationships

1. **Venue-Hotel**: Many-to-Many through Assignment
2. **Hotel-Room**: One-to-Many (Hotel has multiple rooms)
3. **Hotel-MediaAsset**: One-to-Many (Hotel has multiple images)
4. **Room-MediaAsset**: One-to-Many (Room has multiple images)
5. **Entity-ProviderMapping**: One-to-Many (Entity mapped to multiple providers)

## Import Process Flow

### Data Transformation Pipeline

1. **Source Data Extraction**
   - Retrieve data from external provider APIs
   - Validate data format and completeness
   - Handle provider-specific data structures

2. **Data Mapping**
   - Transform source data to internal format
   - Apply business rules and validations
   - Create or update provider mappings

3. **Target Data Creation**
   - Create entities in target system
   - Establish relationships between entities
   - Update existing data if necessary

4. **Media Processing**
   - Download images from source URLs
   - Process and optimize images
   - Upload to S3 storage
   - Create media asset records

5. **Verification**
   - Validate imported data integrity
   - Confirm all relationships are established
   - Update import status and timestamps

## Error Handling Patterns

### Validation Errors
- Missing required fields
- Invalid data formats
- Business rule violations

### Integration Errors
- External API failures
- Network connectivity issues
- Authentication/authorization failures

### Data Consistency Errors
- Duplicate entity creation attempts
- Orphaned relationship references
- Stale provider mappings

### Recovery Strategies
- Retry mechanisms for transient failures
- Partial import completion tracking
- Manual intervention workflows for complex errors