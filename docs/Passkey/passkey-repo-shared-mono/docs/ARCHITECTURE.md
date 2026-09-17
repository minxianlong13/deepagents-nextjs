# Architecture

## System Overview

The Passkey Shared Monorepo follows a modern TypeScript monorepo architecture built on Nx and the Cvent Development Framework (CDF). It provides a centralized location for shared libraries that support the Passkey microfrontend ecosystem.

## Architectural Principles

- **Shared Libraries**: Common functionality extracted into reusable packages
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Microfrontend Support**: Components designed for distributed frontend architecture
- **GraphQL-First**: Schema-driven development with code generation
- **Automated Workflows**: CI/CD pipeline with automated testing and publishing

## Components

### Core Infrastructure

#### **Nx Workspace**
- **Purpose**: Monorepo management and task orchestration
- **Location**: `nx.json`, `project.json` files
- **Key Features**:
  - Affected task execution
  - Dependency graph management
  - Caching and remote cache support
  - Plugin-based architecture

#### **CDF Integration**
- **Purpose**: Cvent Development Framework integration
- **Location**: `cdf.config.mjs` files
- **Key Features**:
  - Standardized build processes
  - Deployment automation
  - Environment management

#### **pnpm Workspace**
- **Purpose**: Package management and dependency resolution
- **Location**: `pnpm-workspace.yaml`, `package.json`
- **Key Features**:
  - Efficient dependency hoisting
  - Workspace-aware package linking
  - Lock file optimization

### Package Architecture

#### **passkey-navigation-model**
- **Purpose**: GraphQL schema and type definitions for navigation
- **Architecture Pattern**: Schema-first GraphQL development
- **Key Components**:
  - `src/schema/`: GraphQL schema definitions
  - `src/resolvers/`: GraphQL resolvers
  - `src/types/`: Generated TypeScript types
  - `src/operations/`: GraphQL operations
  - `src/gql/`: Generated GraphQL code

#### **passkey-components**
- **Purpose**: Reusable React components for Passkey applications
- **Architecture Pattern**: Component library with TypeScript
- **Key Components**:
  - `src/GlobalNavigation.tsx`: Main navigation component
  - `src/index.ts`: Package exports
  - `src/__tests__/`: Component tests

## Data Flow

### Development Workflow
```
Developer Changes → Nx Affected Analysis → Build/Test/Lint → Changeset → PR → Merge → Release
```

### Package Publishing Flow
```
Source Code → TypeScript Compilation → Package Build → Changeset Version → NPM Publish → Nexus Repository
```

### GraphQL Code Generation Flow
```
GraphQL Schema → CodeGen → TypeScript Types → Package Build → Distribution
```

## Design Patterns

### **Monorepo Pattern**
- Centralized shared code management
- Atomic cross-package changes
- Unified tooling and configuration
- Dependency graph optimization

### **Schema-First GraphQL**
- Schema definitions drive type generation
- Consistent API contracts
- Automated type safety
- Client-server contract validation

### **Component Library Pattern**
- Reusable UI components
- Consistent design system
- Centralized component testing
- Version-controlled component API

### **Changesets Pattern**
- Semantic versioning automation
- Changelog generation
- Multi-package release coordination
- Developer-friendly version management

## Module Structure

### Root Level Configuration
```
├── nx.json                 # Nx workspace configuration
├── package.json           # Root dependencies and scripts
├── pnpm-workspace.yaml   # Workspace package definitions
├── tsconfig.json         # Base TypeScript configuration
├── Jenkinsfile           # CI/CD pipeline definition
└── renovate.json         # Dependency update automation
```

### Package Structure Template
```
packages/{package-name}/
├── src/                  # Source code
├── package.json         # Package configuration
├── tsconfig.json        # Package TypeScript config
├── project.json         # Nx project configuration
├── jest.config.ts       # Testing configuration
├── cdf.config.mjs       # CDF configuration
└── README.md           # Package documentation
```

## Build System

### **Nx Task Pipeline**
1. **Affected Analysis**: Determines which packages need processing
2. **Dependency Resolution**: Orders tasks based on package dependencies
3. **Parallel Execution**: Runs independent tasks concurrently
4. **Caching**: Leverages local and remote caching for efficiency

### **TypeScript Compilation**
- Multiple output formats (ESM, CJS)
- Type declaration generation
- Source map generation
- Alias resolution

### **Testing Strategy**
- Jest-based unit testing
- Component testing with React Testing Library
- Coverage reporting
- Automated test execution in CI

## Deployment Architecture

### **CI/CD Pipeline**
- **Trigger**: Push to master branch or PR creation
- **Build**: Nx affected build execution
- **Test**: Comprehensive test suite execution
- **Quality**: ESLint, Prettier, SonarQube analysis
- **Release**: Automated package publishing to Nexus

### **Environment Management**
- **Development**: Local development with hot reload
- **CI**: Jenkins-based automated testing
- **Production**: Published packages in Nexus repository

## Integration Points

### **External Dependencies**
- **@cvent/cdf**: Cvent Development Framework
- **@cvent/eslint-config**: Standardized linting rules
- **@cvent/jest-config**: Testing configuration
- **@cvent/prettier-config**: Code formatting rules

### **Consumer Applications**
- Passkey microfrontend applications
- Other Cvent applications requiring navigation components
- GraphQL clients consuming navigation schemas

## Scalability Considerations

- **Package Isolation**: Each package can be versioned independently
- **Dependency Management**: Careful dependency boundaries prevent coupling
- **Build Optimization**: Nx caching reduces build times as repository grows
- **Type Safety**: TypeScript ensures refactoring safety across packages