# API Reference

## Overview

The Passkey Shared Monorepo provides two main packages with distinct APIs: the navigation model package for GraphQL operations and the components package for React components.

## @cvent/passkey-navigation-model

### GraphQL Schema

The navigation model package provides GraphQL schema definitions and operations for global navigation functionality.

#### Base Types

##### NavigationItem
```graphql
type NavigationItem {
  id: ID!
  label: String!
  url: String
  icon: String
  children: [NavigationItem!]
  isActive: Boolean
  isVisible: Boolean
  permissions: [String!]
}
```

##### NavigationContext
```graphql
type NavigationContext {
  userId: ID!
  accountId: ID!
  eventId: ID
  permissions: [String!]!
  features: [String!]!
}
```

#### Queries

##### getNavigation
**Description**: Retrieves the navigation structure for a given context

**Query**:
```graphql
query GetNavigation($context: NavigationContext!) {
  navigation(context: $context) {
    items {
      id
      label
      url
      icon
      children {
        id
        label
        url
        icon
        isActive
        isVisible
      }
      isActive
      isVisible
    }
  }
}
```

**Variables**:
```typescript
interface NavigationContext {
  userId: string;
  accountId: string;
  eventId?: string;
  permissions: string[];
  features: string[];
}
```

**Response**:
```typescript
interface NavigationResponse {
  navigation: {
    items: NavigationItem[];
  };
}
```

#### Mutations

##### updateNavigationPreferences
**Description**: Updates user navigation preferences

**Mutation**:
```graphql
mutation UpdateNavigationPreferences($userId: ID!, $preferences: NavigationPreferencesInput!) {
  updateNavigationPreferences(userId: $userId, preferences: $preferences) {
    success
    message
  }
}
```

**Input Types**:
```typescript
interface NavigationPreferencesInput {
  collapsedSections: string[];
  pinnedItems: string[];
  customOrder: string[];
}
```

### TypeScript API

#### Generated Types

```typescript
// Auto-generated from GraphQL schema
export interface NavigationItem {
  __typename?: 'NavigationItem';
  id: Scalars['ID'];
  label: Scalars['String'];
  url?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  children?: Maybe<Array<NavigationItem>>;
  isActive?: Maybe<Scalars['Boolean']>;
  isVisible?: Maybe<Scalars['Boolean']>;
  permissions?: Maybe<Array<Scalars['String']>>;
}

export interface NavigationContext {
  __typename?: 'NavigationContext';
  userId: Scalars['ID'];
  accountId: Scalars['ID'];
  eventId?: Maybe<Scalars['ID']>;
  permissions: Array<Scalars['String']>;
  features: Array<Scalars['String']>;
}
```

#### Resolvers

```typescript
export interface NavigationResolvers {
  Query: {
    navigation: (
      parent: any,
      args: { context: NavigationContext },
      context: GraphQLContext
    ) => Promise<NavigationResponse>;
  };
  
  Mutation: {
    updateNavigationPreferences: (
      parent: any,
      args: { userId: string; preferences: NavigationPreferencesInput },
      context: GraphQLContext
    ) => Promise<MutationResponse>;
  };
}
```

#### Operations

```typescript
// Generated GraphQL operations
export const GetNavigationDocument = gql`
  query GetNavigation($context: NavigationContext!) {
    navigation(context: $context) {
      items {
        id
        label
        url
        icon
        children {
          id
          label
          url
          icon
          isActive
          isVisible
        }
        isActive
        isVisible
      }
    }
  }
`;

export function useGetNavigationQuery(
  options: Omit<Urql.UseQueryArgs<GetNavigationQueryVariables>, 'query'>
) {
  return Urql.useQuery<GetNavigationQuery>({ 
    query: GetNavigationDocument, 
    ...options 
  });
}
```

## @cvent/passkey-components

### React Components

#### GlobalNavigation

**Description**: Main navigation component for Passkey applications

**Props**:
```typescript
interface GlobalNavigationProps {
  /** Navigation context for fetching navigation data */
  context: NavigationContext;
  
  /** Optional custom navigation items */
  customItems?: NavigationItem[];
  
  /** Callback fired when navigation item is clicked */
  onNavigate?: (item: NavigationItem) => void;
  
  /** Whether navigation is collapsed */
  collapsed?: boolean;
  
  /** Callback fired when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
  
  /** Custom CSS class name */
  className?: string;
  
  /** Custom styles */
  style?: React.CSSProperties;
  
  /** Theme variant */
  variant?: 'light' | 'dark';
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: Error | null;
}
```

**Usage**:
```tsx
import { GlobalNavigation } from '@cvent/passkey-components';

function App() {
  const navigationContext = {
    userId: 'user-123',
    accountId: 'account-456',
    eventId: 'event-789',
    permissions: ['read:events', 'write:events'],
    features: ['navigation-v2', 'advanced-search']
  };

  return (
    <GlobalNavigation
      context={navigationContext}
      onNavigate={(item) => {
        console.log('Navigating to:', item.url);
        // Handle navigation
      }}
      onCollapseChange={(collapsed) => {
        console.log('Navigation collapsed:', collapsed);
      }}
      variant="light"
    />
  );
}
```

**Methods**:
```typescript
interface GlobalNavigationRef {
  /** Refresh navigation data */
  refresh: () => Promise<void>;
  
  /** Collapse/expand navigation */
  setCollapsed: (collapsed: boolean) => void;
  
  /** Get current navigation state */
  getState: () => {
    collapsed: boolean;
    loading: boolean;
    error: Error | null;
    items: NavigationItem[];
  };
}
```

**Events**:
- `onNavigate`: Fired when user clicks a navigation item
- `onCollapseChange`: Fired when navigation collapse state changes
- `onError`: Fired when navigation data loading fails
- `onLoad`: Fired when navigation data loads successfully

### Hooks

#### useNavigation

**Description**: Hook for accessing navigation data and state

```typescript
function useNavigation(context: NavigationContext): {
  items: NavigationItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  // Implementation
}
```

**Usage**:
```tsx
import { useNavigation } from '@cvent/passkey-components';

function NavigationContainer() {
  const { items, loading, error, refresh } = useNavigation({
    userId: 'user-123',
    accountId: 'account-456',
    permissions: ['read:events'],
    features: ['navigation-v2']
  });

  if (loading) return <div>Loading navigation...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <nav>
      {items.map(item => (
        <a key={item.id} href={item.url}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

## Package Installation

### NPM Installation

```bash
# Install navigation model
npm install @cvent/passkey-navigation-model

# Install components
npm install @cvent/passkey-components
```

### pnpm Installation

```bash
# Install navigation model
pnpm add @cvent/passkey-navigation-model

# Install components  
pnpm add @cvent/passkey-components
```

## Version Compatibility

| Package Version | Node.js | TypeScript | React |
|----------------|---------|------------|-------|
| 1.x.x          | >=16    | >=4.5      | >=17  |
| 2.x.x          | >=18    | >=4.8      | >=18  |
| 3.x.x          | >=20    | >=5.0      | >=18  |

## Error Handling

### GraphQL Errors

```typescript
import { useGetNavigationQuery } from '@cvent/passkey-navigation-model';

function NavigationComponent() {
  const [result] = useGetNavigationQuery({
    variables: { context }
  });

  if (result.error) {
    console.error('GraphQL Error:', result.error);
    // Handle error appropriately
  }

  return <div>{/* Component JSX */}</div>;
}
```

### Component Errors

```tsx
import { GlobalNavigation } from '@cvent/passkey-components';

function App() {
  return (
    <GlobalNavigation
      context={context}
      onError={(error) => {
        console.error('Navigation Error:', error);
        // Report to error tracking service
      }}
    />
  );
}
```

## Migration Guide

### From v1 to v2

1. Update import paths:
```typescript
// Old
import { Navigation } from '@cvent/passkey-components/Navigation';

// New
import { GlobalNavigation } from '@cvent/passkey-components';
```

2. Update prop names:
```typescript
// Old
<Navigation items={items} onItemClick={handler} />

// New
<GlobalNavigation context={context} onNavigate={handler} />
```

3. Update GraphQL operations:
```typescript
// Old
const { data } = useNavigationQuery();

// New
const [result] = useGetNavigationQuery({ variables: { context } });
```