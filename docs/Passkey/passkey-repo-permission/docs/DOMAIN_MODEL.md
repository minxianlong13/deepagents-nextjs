# Domain Model

## Permission System Architecture

The Passkey Permission Service operates two coexisting permission systems that serve different purposes:

### Legacy Database-Driven System
- **Purpose**: Basic permission lookups and storage
- **Implementation**: Oracle database via passkey-permission-data-access module
- **Usage**: Traditional role-based permissions, module privileges
- **Status**: Legacy but still actively used

### Modern Code-Driven Strategy Pattern System
- **Purpose**: Context-specific permission logic and advanced authorization
- **Implementation**: ContextStrategy interface with code-based implementations
- **Location**: `services/context/strategy/` directory
- **Contexts**: event/, hotel/, reservation/, inventory/, reglink/, roomList/, waitList/, groupLink/
- **Usage**: Complex business rules, contextual permissions, dynamic authorization
- **Status**: Modern approach for new features

Both systems coexist and are used based on the complexity and context requirements of the permission check.

## Glossary

### Permission
A specific authorization granted to a user that allows them to perform certain actions within the Passkey system. Permissions are granular and context-aware, meaning they can vary based on the user's role and the specific business context (event, hotel, etc.).

### Context Type
A categorization that defines the scope or domain in which permissions are evaluated. Context types include USER, EVENT, HOTEL, and PARTICIPANT, each representing different business entities within the Passkey ecosystem.

### Module Privilege
A high-level permission grouping that represents access to specific functional modules within the Passkey platform, such as event management, hotel management, or reporting capabilities.

### Global Navigation
The dynamic menu system that provides users with contextual navigation options based on their permissions and current business context. This is primarily used in the Resdesk application.

### App Switcher
A navigation component that organizes available applications and features into logical sections, allowing users to quickly access different parts of the Passkey platform based on their permissions.

### User Metadata
Information about an authenticated user including their identity, display preferences, and associated permissions. This data is extracted from authentication tokens and used for personalization.

### Context Decorator
A design pattern implementation that enhances permission contexts with additional business logic specific to different entity types (users, events, hotels, participants).

### ContextStrategy
An interface defining the contract for context-specific permission logic in the modern code-driven system. Implementations exist for event, hotel, reservation, inventory, reglink, roomList, waitList, and groupLink contexts, located in services/context/strategy/ directory.

### Permission Context
An abstraction that encapsulates the business context in which permissions are being evaluated, including relevant entity IDs and user information.

### Cache Manager
A component responsible for managing cached permission data to improve performance and reduce database load for frequently accessed permission information.

### Resdesk
The primary frontend application for the Passkey platform that consumes the permission service for user authorization and navigation menu generation.

## Core Entities

### Permission
**Description**: Represents a specific authorization within the Passkey system

**Attributes**:
- `id`: String - Unique identifier for the permission
- `name`: String - Human-readable permission name (e.g., "VIEW_EVENTS", "MANAGE_HOTELS")
- `description`: String - Detailed description of what the permission allows
- `module`: String - The functional module this permission belongs to
- `context`: String - The business context where this permission applies

**Relationships**:
- Associated with Users through role assignments
- Grouped by Modules for organizational purposes
- Scoped by Context Types for granular control

### ContextType
**Description**: Enumeration defining the different business contexts for permission evaluation

**Values**:
- `USER`: Permissions related to user management and profile operations
- `EVENT`: Permissions specific to event planning and management
- `HOTEL`: Permissions for hotel inventory and booking management  
- `PARTICIPANT`: Permissions related to event participant management

**Relationships**:
- Used by Permission Context to determine evaluation scope
- Associated with specific Decorators for context-specific logic

### NavigationResponse
**Description**: Complete navigation structure returned to client applications

**Attributes**:
- `appSwitcher`: AppSwitcher - The main navigation structure
- `userMetadata`: UserMetadata - Information about the current user

**Relationships**:
- Contains AppSwitcher with organized navigation sections
- Includes UserMetadata for personalization

### AppSwitcherSection
**Description**: A logical grouping of related navigation items

**Attributes**:
- `title`: String - Display name for the section (e.g., "Events", "Reports")
- `items`: List<AppSwitcherItem> - Navigation items within this section

**Relationships**:
- Contains multiple AppSwitcherItems
- Part of the overall AppSwitcher structure

### AppSwitcherItem
**Description**: Individual navigation item with link and metadata

**Attributes**:
- `id`: String - Unique identifier for the navigation item
- `title`: String - Display text for the navigation link
- `url`: String - Target URL for the navigation item
- `icon`: String - Icon identifier for visual representation
- `description`: String - Tooltip or description text

**Relationships**:
- Belongs to an AppSwitcherSection
- Generated based on user Permissions

### UserMetadata
**Description**: Information about the authenticated user extracted from tokens

**Attributes**:
- `userId`: Long - Unique user identifier
- `userName`: String - User's login name or email
- `displayName`: String - User's full name for display purposes
- `permissions`: List<String> - List of permission names granted to the user

**Relationships**:
- Associated with Permissions through user roles
- Used for generating personalized NavigationResponse

### PermissionContext
**Description**: Encapsulates the business context for permission evaluation

**Attributes**:
- `contextType`: ContextType - The type of context being evaluated
- `userId`: Long - The user requesting permissions
- `entityId`: Long - ID of the relevant business entity (event, hotel, etc.)
- `additionalParameters`: Map<String, Object> - Context-specific parameters

**Relationships**:
- Enhanced by Context Decorators
- Used by Permission Services for evaluation

## Business Rules

### Permission Evaluation Rules

1. **Context Specificity**: Permissions are always evaluated within a specific business context. A user may have different permissions for different events or hotels.

2. **Hierarchical Permissions**: Some permissions imply others. For example, "MANAGE_EVENT" typically includes "VIEW_EVENT" capabilities.

3. **Role-Based Access**: Users are assigned roles, and roles contain sets of permissions. Permission evaluation considers all roles assigned to a user.

4. **Context Inheritance**: Certain permissions may be inherited from parent contexts. For example, event-level permissions might inherit from user-level permissions.

### Navigation Generation Rules

1. **Permission-Based Filtering**: Navigation items are only included if the user has the required permissions to access them.

2. **Context-Aware URLs**: Navigation URLs are generated with appropriate context parameters (e.g., event ID) when available.

3. **Dynamic Sections**: Navigation sections are dynamically created based on the user's available permissions and may vary between users.

4. **Fallback Handling**: If a user has no permissions for a particular section, that section is omitted from the navigation.

### Caching Rules

1. **Permission Caching**: User permissions are cached for performance, with appropriate cache invalidation when roles or permissions change.

2. **Context Sensitivity**: Cached permissions are keyed by both user ID and context to ensure accurate permission evaluation.

3. **Cache Expiration**: Cached data has configurable expiration times to balance performance with data freshness.

### Authentication Rules

1. **Token Validation**: All requests must include valid authentication tokens (API key for service calls, bearer token for user context).

2. **User Context Extraction**: User metadata is extracted from bearer tokens and validated before permission evaluation.

3. **Service Authentication**: Service-to-service calls use API key authentication and may operate with elevated privileges.

### Data Consistency Rules

1. **Permission Synchronization**: Permission changes are propagated across all relevant contexts and cached data is invalidated appropriately.

2. **Context Validation**: All context parameters are validated to ensure they reference valid business entities.

3. **Audit Trail**: Permission evaluations and changes are logged for security and compliance purposes.

## Entity Relationships Diagram

```
User
├── has many → UserMetadata
├── assigned → Roles
└── granted → Permissions

Permission
├── belongs to → Module
├── scoped by → ContextType
└── evaluated in → PermissionContext

PermissionContext
├── has → ContextType
├── enhanced by → ContextDecorator
└── cached by → CacheManager

NavigationResponse
├── contains → AppSwitcher
└── includes → UserMetadata

AppSwitcher
└── contains → AppSwitcherSection
    └── contains → AppSwitcherItem

ContextType
├── USER
├── EVENT  
├── HOTEL
└── PARTICIPANT
```

## Data Flow Relationships

1. **Permission Request Flow**:
   User → Authentication → PermissionContext → ContextDecorator → Permission Evaluation → Cached Result

2. **Navigation Generation Flow**:
   User Token → UserMetadata Extraction → Permission Resolution → Navigation Building → AppSwitcher Creation

3. **Context Resolution Flow**:
   Request Parameters → Context Type Determination → Context Decorator Selection → Enhanced Context → Permission Evaluation