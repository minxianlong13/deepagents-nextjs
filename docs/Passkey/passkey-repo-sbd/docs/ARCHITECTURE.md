# Architecture

## System Overview

The Passkey Sub-Block Dashboard follows a hybrid multi-tier architecture that combines traditional Java EE patterns with modern frontend technologies. The system is designed as a monorepo containing both backend Java components and frontend TypeScript applications, deployed as a unified service on WildFly application server.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js/TS)  │◄──►│   (Java EJB)    │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Dashboard UI  │    │ • Business      │    │ • Auth Service  │
│ • React Comp.   │    │   Logic         │    │ • Commerce      │
│ • GraphQL       │    │ • Data Access   │    │ • Reporting     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### Frontend Layer (packages/app/web)
- **Purpose**: Provides the user interface for sub-block dashboard operations
- **Location**: `packages/app/web/src/`
- **Technology**: Next.js 12, React 18, TypeScript
- **Key Features**:
  - Server-side rendering (SSR)
  - GraphQL client integration
  - Responsive dashboard interface
  - Real-time data visualization

### Backend Layer (packages/app/ejb)
- **Purpose**: Handles business logic, data processing, and external service integration
- **Location**: `packages/app/ejb/src/`
- **Technology**: Java EE, EJB 3.x, JAX-RS
- **Key Components**:
  - Session beans for business logic
  - REST endpoints for API access
  - Data access objects (DAOs)
  - Service integration layers

### Enterprise Application Archive (packages/app/ear)
- **Purpose**: Packages the complete application for WildFly deployment
- **Location**: `packages/app/ear/`
- **Contents**:
  - EJB modules
  - Web application archives
  - Configuration descriptors
  - Deployment metadata

### Infrastructure Components

#### Group Core (packages/app/group-core)
- **Purpose**: Shared utilities and core functionality
- **Contains**: Common libraries, utilities, and shared components

#### Malware Scanner (packages/app/malware-scanner)
- **Purpose**: Security scanning for uploaded content
- **Integration**: ClamAV-based malware detection

## Data Flow

### Request Processing Flow

1. **User Request**: Browser sends request to WildFly server
2. **Frontend Routing**: Next.js handles client-side routing and SSR
3. **API Calls**: Frontend makes GraphQL/REST calls to backend
4. **Business Logic**: EJB components process business rules
5. **Data Access**: DAOs interact with databases and external services
6. **Response**: Data flows back through the layers to the UI

### Authentication Flow

1. **Login Request**: User initiates authentication
2. **Auth Service**: Delegates to passkey-authentication-service
3. **Token Validation**: Backend validates JWT tokens
4. **Session Management**: EJB manages user sessions
5. **Authorization**: Role-based access control applied

## Design Patterns

### Backend Patterns

- **Session Facade**: EJB session beans provide coarse-grained business interfaces
- **Data Access Object (DAO)**: Abstracts database access logic
- **Service Layer**: Encapsulates business logic and coordinates operations
- **Dependency Injection**: CDI for component lifecycle management

### Frontend Patterns

- **Component-Based Architecture**: React components for UI modularity
- **State Management**: React hooks and context for state handling
- **Server-Side Rendering**: Next.js for improved performance and SEO
- **GraphQL Integration**: Apollo Client for efficient data fetching

## Module Structure

### Maven Multi-Module Project

```
passkey-sbd/
├── packages/app/                 # Main application
│   ├── pom.xml                  # Parent POM
│   ├── ejb/                     # EJB module
│   │   ├── pom.xml
│   │   └── src/main/java/
│   ├── web/                     # Web module
│   │   ├── pom.xml
│   │   └── src/main/webapp/
│   ├── ear/                     # Enterprise archive
│   │   ├── pom.xml
│   │   └── src/main/application/
│   ├── group-core/              # Shared utilities
│   └── malware-scanner/         # Security component
├── packages/infra/              # Infrastructure as code
└── package.json                 # Node.js workspace root
```

### TypeScript/Node.js Workspace

```
passkey-sbd/
├── package.json                 # Workspace root
├── pnpm-workspace.yaml         # pnpm workspace config
├── nx.json                     # Nx monorepo config
└── packages/
    ├── app/                    # Main application
    │   ├── package.json
    │   ├── next.config.mjs
    │   ├── tsconfig.json
    │   └── src/
    └── infra/                  # CDK infrastructure
        ├── package.json
        └── src/
```

## Deployment Architecture

### Container Strategy
- **Base Image**: Custom WildFly image with Java 17
- **Application Deployment**: EAR file deployed to WildFly
- **Static Assets**: Next.js build artifacts served by WildFly
- **Configuration**: Environment-specific configs via Hogan templates

### Service Integration
- **Service Discovery**: Direct service-to-service communication
- **Load Balancing**: AWS Application Load Balancer
- **Health Checks**: WildFly management endpoints
- **Monitoring**: Datadog APM integration

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Issued by passkey-authentication-service
- **Role-Based Access**: EJB security annotations
- **Session Management**: WildFly session clustering

### Data Protection
- **Input Validation**: JAX-RS validation annotations
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: React's built-in XSS prevention
- **Malware Scanning**: ClamAV integration for file uploads

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: EJB stateless session beans
- **Session Clustering**: WildFly cluster configuration
- **Database Connection Pooling**: Configurable connection pools

### Performance Optimization
- **Caching**: EJB method-level caching
- **CDN Integration**: Static asset delivery
- **Database Optimization**: Query optimization and indexing
- **Lazy Loading**: On-demand data fetching in frontend