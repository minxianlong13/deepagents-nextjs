# Architecture

## System Overview

The Passkey Book Mono repository implements a modern, microservice-oriented architecture using a TypeScript monorepo structure. The system is built around a Next.js web application with supporting libraries, infrastructure as code, and comprehensive testing suites.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   CDN/CloudFront│    │   Load Balancer │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │   Next.js Application   │
                    │  (passkey-book-ui/app)  │
                    └─────────────┬───────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │   Shared Library        │
                    │  (passkey-book-ui/lib)  │
                    └─────────────┬───────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │   Backend Services      │
                    │  (Passkey Microservices)│
                    └─────────────────────────┘
```

## Components

### Next.js Application (`packages/passkey-book-ui/app`)
- **Purpose**: Main web application providing the booking interface
- **Location**: `packages/passkey-book-ui/app/src`
- **Key Features**:
  - Server-side rendering with Next.js App Router
  - TypeScript for type safety
  - Tailwind CSS for styling
  - Internationalization support
  - Feature flag integration
  - Observability and logging

**Key Directories**:
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable React components
- `src/config/` - Application configuration
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `src/middleware.ts` - Next.js middleware for request processing

### Shared Library (`packages/passkey-book-ui/lib`)
- **Purpose**: Common utilities, components, and business logic
- **Location**: `packages/passkey-book-ui/lib/src`
- **Key Features**:
  - Shared TypeScript types and interfaces
  - Common utility functions
  - Reusable business logic
  - Build configurations for both ESM and CJS

### Infrastructure (`packages/passkey-book-ui/infra`)
- **Purpose**: AWS CDK infrastructure definitions
- **Location**: `packages/passkey-book-ui/infra`
- **Key Features**:
  - Infrastructure as Code using AWS CDK
  - Environment-specific configurations
  - Deployment automation

### E2E Testing (`packages/passkey-book-ui/e2e`)
- **Purpose**: End-to-end testing with Playwright
- **Location**: `packages/passkey-book-ui/e2e`
- **Key Features**:
  - Browser automation testing
  - Cross-browser compatibility testing
  - Integration testing scenarios

## Data Flow

### Request Processing Flow

1. **Client Request**: User accesses the application through web browser
2. **CDN/CloudFront**: Static assets served from CDN, dynamic requests forwarded
3. **Load Balancer**: Distributes traffic across application instances
4. **Next.js Middleware**: Processes requests, handles authentication, logging
5. **App Router**: Routes requests to appropriate page components
6. **Server Components**: Fetch data from backend services
7. **Client Components**: Handle user interactions and client-side state
8. **Backend Integration**: Communicate with Passkey microservices for data

### Build and Deployment Flow

1. **Source Code**: Developers commit changes to Git
2. **Jenkins Pipeline**: Automated CI/CD pipeline triggered
3. **Build Process**: Nx builds all affected packages
4. **Testing**: Unit tests, integration tests, and E2E tests run
5. **Infrastructure**: CDK deploys/updates AWS infrastructure
6. **Application Deployment**: Application deployed to ECS/containers
7. **Monitoring**: Application health and performance monitored

## Design Patterns

### Monorepo Architecture
- **Pattern**: Nx-based monorepo with workspace management
- **Benefits**: Shared dependencies, consistent tooling, atomic changes
- **Implementation**: PNPM workspaces with Nx build orchestration

### Component-Based Architecture
- **Pattern**: React component composition with TypeScript
- **Benefits**: Reusability, maintainability, type safety
- **Implementation**: Shared component library with strict typing

### Infrastructure as Code
- **Pattern**: AWS CDK for infrastructure management
- **Benefits**: Version-controlled infrastructure, reproducible deployments
- **Implementation**: TypeScript-based CDK constructs

### Feature Flag Pattern
- **Pattern**: LaunchDarkly integration for feature toggles
- **Benefits**: Safe feature rollouts, A/B testing capabilities
- **Implementation**: Server and client-side feature flag evaluation

### Middleware Pattern
- **Pattern**: Next.js middleware for cross-cutting concerns
- **Benefits**: Centralized request processing, authentication, logging
- **Implementation**: Single middleware file handling multiple concerns

## Module Structure

### Workspace Organization

```
passkey-book-mono/
├── packages/
│   └── passkey-book-ui/           # Main UI package
│       ├── app/                   # Next.js application
│       │   ├── src/
│       │   │   ├── app/          # App Router pages
│       │   │   ├── components/   # React components
│       │   │   ├── config/       # Configuration
│       │   │   ├── hooks/        # Custom hooks
│       │   │   ├── utils/        # Utilities
│       │   │   └── middleware.ts # Request middleware
│       │   ├── public/           # Static assets
│       │   ├── locales/          # Internationalization
│       │   └── bin/              # CDK deployment scripts
│       ├── lib/                  # Shared library
│       │   ├── src/              # Library source code
│       │   └── scripts/          # Build scripts
│       ├── infra/                # Infrastructure code
│       └── e2e/                  # E2E tests
├── .changeset/                   # Version management
├── nx.json                       # Nx configuration
└── pnpm-workspace.yaml          # Workspace definition
```

### Dependency Graph

```
┌─────────────────┐
│   app package   │
└─────────┬───────┘
          │ depends on
          ▼
┌─────────────────┐
│   lib package   │
└─────────────────┘

┌─────────────────┐
│  infra package  │ (independent)
└─────────────────┘

┌─────────────────┐
│   e2e package   │ (test dependency on app)
└─────────────────┘
```

## Technology Integration

### Build System
- **Nx**: Monorepo build orchestration and caching
- **PNPM**: Fast, efficient package management
- **TypeScript**: Type checking and compilation
- **ESLint/Prettier**: Code quality and formatting

### Runtime Environment
- **Next.js 14**: React framework with App Router
- **React 18**: UI library with concurrent features
- **Node.js 18**: Runtime environment
- **AWS ECS**: Container orchestration

### Development Tools
- **Jest**: Unit testing framework
- **Playwright**: E2E testing framework
- **Storybook**: Component development and documentation
- **VS Code**: Development environment with workspace settings

## Scalability Considerations

### Horizontal Scaling
- Container-based deployment allows easy scaling
- Load balancer distributes traffic across instances
- CDN reduces server load for static assets

### Code Organization
- Monorepo structure supports multiple teams
- Shared libraries prevent code duplication
- Nx caching improves build performance

### Performance Optimization
- Next.js SSR/SSG for fast initial page loads
- Code splitting for optimal bundle sizes
- Image optimization and lazy loading
- Service worker for offline capabilities

## Security Architecture

### Authentication & Authorization
- Integration with Cvent's authentication system
- JWT token validation in middleware
- Role-based access control

### Data Protection
- HTTPS enforcement
- Content Security Policy headers
- Input validation and sanitization
- Secure cookie handling

### Infrastructure Security
- VPC isolation
- Security groups and NACLs
- IAM roles with least privilege
- Secrets management with AWS Secrets Manager