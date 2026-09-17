# Domain Model

## Glossary

### Navigation
The system of links, menus, and interface elements that allow users to move between different sections and features of Passkey applications.

### Microfrontend
An architectural pattern where frontend applications are decomposed into smaller, independently deployable applications that work together to form a cohesive user experience.

### GraphQL Schema
A contract that defines the structure of data that can be queried or mutated, including types, fields, and operations.

### Changeset
A file-based approach to managing package versions and changelogs in monorepos, allowing developers to declare intended changes before they are released.

### CDF (Cvent Development Framework)
Cvent's internal development framework that provides standardized tooling, build processes, and deployment automation for applications.

### Nx Workspace
A development environment that provides tools for managing monorepos, including task orchestration, dependency graph analysis, and caching.

### Component Library
A collection of reusable UI components that provide consistent design and behavior across multiple applications.

### Type Generation
The process of automatically creating TypeScript type definitions from external sources like GraphQL schemas.

### Affected Analysis
Nx's capability to determine which packages or projects have been impacted by code changes, enabling efficient task execution.

### Remote Caching
A system that stores build artifacts and task results in a shared location, allowing teams to share computation results.

## Core Entities

### NavigationItem
**Description**: Represents a single item in the navigation hierarchy

**Attributes**:
- `id`: string - Unique identifier for the navigation item
- `label`: string - Display text for the navigation item
- `url`: string (optional) - Target URL when the item is clicked
- `icon`: string (optional) - Icon identifier or URL for visual representation
- `children`: NavigationItem[] (optional) - Nested navigation items
- `isActive`: boolean (optional) - Whether the item represents the current page/section
- `isVisible`: boolean (optional) - Whether the item should be displayed
- `permissions`: string[] (optional) - Required permissions to access this item

**Relationships**:
- Parent-child relationships with other NavigationItems (hierarchical structure)
- Associated with NavigationContext for permission evaluation

### NavigationContext
**Description**: Contains contextual information needed to determine navigation structure and permissions

**Attributes**:
- `userId`: string - Identifier of the current user
- `accountId`: string - Identifier of the current account/organization
- `eventId`: string (optional) - Identifier of the current event context
- `permissions`: string[] - List of permissions granted to the user
- `features`: string[] - List of enabled features for the user/account

**Relationships**:
- Used by NavigationResolvers to filter and customize navigation
- Referenced by NavigationItem for permission checks

### Package
**Description**: Represents a publishable unit within the monorepo

**Attributes**:
- `name`: string - NPM package name (e.g., @cvent/passkey-navigation-model)
- `version`: string - Semantic version number
- `description`: string - Package description
- `dependencies`: object - Runtime dependencies
- `devDependencies`: object - Development dependencies
- `exports`: object - Package entry points

**Relationships**:
- Contains source code, tests, and configuration
- May depend on other packages within the monorepo
- Published to Nexus repository for consumption

### GraphQLSchema
**Description**: Defines the structure and operations available in the GraphQL API

**Attributes**:
- `types`: object - Type definitions (NavigationItem, NavigationContext, etc.)
- `queries`: object - Available query operations
- `mutations`: object - Available mutation operations
- `resolvers`: object - Functions that resolve GraphQL operations

**Relationships**:
- Generates TypeScript types through code generation
- Implemented by resolver functions
- Consumed by GraphQL clients

### Component
**Description**: Represents a reusable React component

**Attributes**:
- `name`: string - Component name (e.g., GlobalNavigation)
- `props`: object - Component properties interface
- `state`: object (optional) - Internal component state
- `methods`: object - Public methods exposed by the component
- `events`: object - Events emitted by the component

**Relationships**:
- May consume data from GraphQL operations
- Can be composed with other components
- Exported from component library package

## Business Rules

### Navigation Visibility Rules
1. **Permission-Based Filtering**: Navigation items are only visible if the user has the required permissions
2. **Feature Flag Gating**: Navigation items may be hidden based on enabled features
3. **Context Sensitivity**: Navigation structure may vary based on current context (event, account, etc.)
4. **Hierarchical Inheritance**: Child navigation items inherit visibility rules from their parents

### Package Versioning Rules
1. **Semantic Versioning**: All packages follow semantic versioning (MAJOR.MINOR.PATCH)
2. **Changeset Requirement**: All changes must include a changeset describing the impact
3. **Independent Versioning**: Each package can be versioned independently
4. **Breaking Change Policy**: Major version bumps required for breaking changes

### Component Design Rules
1. **Accessibility Compliance**: All components must meet WCAG 2.1 AA standards
2. **TypeScript Strict Mode**: All components must be written in strict TypeScript
3. **Testing Coverage**: Components must have comprehensive test coverage
4. **Design System Compliance**: Components must follow Cvent design system guidelines

### GraphQL Schema Rules
1. **Schema-First Development**: Schema definitions drive implementation
2. **Backward Compatibility**: Schema changes must maintain backward compatibility
3. **Type Safety**: All operations must have corresponding TypeScript types
4. **Documentation**: All schema elements must be documented

## Data Relationships

### Navigation Hierarchy
```
NavigationContext
    ↓ (filters)
NavigationItem (root)
    ↓ (contains)
NavigationItem (children)
    ↓ (may contain)
NavigationItem (grandchildren)
```

### Package Dependencies
```
passkey-components
    ↓ (depends on)
passkey-navigation-model
    ↓ (generates from)
GraphQL Schema
```

### Build Pipeline Flow
```
Source Code
    ↓ (analyzed by)
Nx Affected Analysis
    ↓ (triggers)
Build Tasks
    ↓ (produces)
Package Artifacts
    ↓ (published to)
Nexus Repository
```

## Domain Constraints

### Navigation Constraints
- Maximum navigation depth: 3 levels
- Maximum items per level: 20
- Navigation item labels must be 1-50 characters
- URLs must be valid HTTP/HTTPS or relative paths

### Package Constraints
- Package names must follow @cvent/passkey-* pattern
- Version numbers must follow semantic versioning
- Package size should not exceed 10MB
- Dependencies must be explicitly declared

### Component Constraints
- Components must be pure functions or properly memoized
- Props must be immutable
- Side effects must be contained within useEffect hooks
- Components must handle loading and error states

### GraphQL Constraints
- Query depth limited to 10 levels
- Query complexity scoring to prevent expensive operations
- Rate limiting on mutations
- Authentication required for all operations

## State Management

### Component State
- Local component state managed with React hooks
- Global state avoided in favor of prop drilling or context
- State updates must be immutable
- Side effects handled through useEffect

### Navigation State
- Navigation data cached at the application level
- Refresh triggered by context changes
- Optimistic updates for user preferences
- Error states handled gracefully with fallbacks

### Build State
- Nx maintains dependency graph and task cache
- Remote cache shared across CI/CD pipeline
- Incremental builds based on affected analysis
- Build artifacts versioned and stored

## Integration Patterns

### Microfrontend Integration
- Components exported as federated modules
- Shared dependencies managed at the shell level
- Runtime integration through module federation
- Type safety maintained across application boundaries

### GraphQL Integration
- Schema stitching for distributed GraphQL APIs
- Client-side caching with normalized data
- Optimistic updates for better user experience
- Error boundaries for graceful degradation

### CI/CD Integration
- Automated testing on all pull requests
- Parallel execution of independent tasks
- Automated publishing on successful builds
- Rollback capabilities for failed deployments