# Architecture

## System Overview

Passkey Smart follows a traditional Java EE architecture pattern using WildFly application server. The service is designed as a multi-module Maven project with clear separation of concerns between presentation, business logic, and data access layers.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Email Client  │    │  Campaign Mgmt  │    │  External APIs  │
│   (SMTP)        │    │  Interface      │    │  (Auth, Housing)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Passkey Smart Service                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │    EAR      │  │    EJB      │  │         Core            │ │
│  │ (Packaging) │  │ (Business)  │  │ (Shared Components)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  WildFly Server │    │ Oracle Database │    │   Monitoring    │
│  (Runtime)      │    │ (Persistence)   │    │   (Datadog)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### EAR Module (Enterprise Archive)
- **Purpose**: Packages the entire application for deployment to WildFly
- **Location**: `packages/app/ear/`
- **Key Files**: 
  - `application.xml` - Application descriptor
  - Deployment configuration

### EJB Module (Enterprise JavaBeans)
- **Purpose**: Contains business logic and service layer components
- **Location**: `packages/app/ejb/`
- **Key Components**:
  - Session beans for campaign management
  - Message-driven beans for asynchronous processing
  - Business logic services
  - Integration with external services

### Core Module
- **Purpose**: Shared components, utilities, and domain models
- **Location**: `packages/app/core/`
- **Key Components**:
  - Domain entities and DTOs
  - Utility classes
  - Common interfaces
  - Configuration models

## Data Flow

### Email Campaign Execution Flow
1. **Campaign Trigger**: Campaign execution initiated via JMX MBean or scheduled job
2. **Configuration Retrieval**: Smart email setup configuration loaded from database
3. **Template Processing**: Email templates retrieved and personalized
4. **Recipient Resolution**: Target recipients identified based on campaign criteria
5. **Email Generation**: Individual emails generated with personalized content
6. **SMTP Delivery**: Emails sent via configured SMTP server
7. **Status Tracking**: Campaign execution status and metrics recorded

### Integration Flow
1. **Authentication**: Service authenticates with passkey-authentication-service
2. **Data Retrieval**: Housing and reservation data fetched from related services
3. **Business Logic**: Campaign rules and logic applied
4. **External Communication**: Emails sent via SMTP, metrics sent to Datadog

## Design Patterns

### Enterprise Patterns
- **Session Facade**: EJB session beans provide coarse-grained service interfaces
- **Data Access Object (DAO)**: Encapsulates database access logic
- **Dependency Injection**: CDI used for component wiring and lifecycle management
- **Observer Pattern**: Event-driven processing for campaign execution

### Integration Patterns
- **Service Layer**: Clear separation between business logic and external integrations
- **Configuration Management**: Environment-specific configuration via Hogan templates
- **Circuit Breaker**: Resilient integration with external services
- **Monitoring**: Comprehensive observability with structured logging and metrics

## Module Structure

### Maven Multi-Module Layout
```
passkey-smart/
├── packages/app/
│   ├── pom.xml (parent)
│   ├── core/
│   │   ├── pom.xml
│   │   └── src/main/java/
│   ├── ejb/
│   │   ├── pom.xml
│   │   └── src/main/java/
│   └── ear/
│       ├── pom.xml
│       └── src/main/application/
├── scripts/ (deployment and setup)
├── configs/ (WildFly configuration)
└── docs/ (documentation)
```

### Package Organization
- `com.lanyon.group.smart.*` - Main application packages
- Business logic organized by functional domains
- Clear separation between API, service, and data access layers
- Shared utilities and models in core module

## Deployment Architecture

### Application Server
- **Runtime**: WildFly 16.0.0.Final
- **Java Version**: Java 17
- **Packaging**: EAR (Enterprise Archive)
- **Configuration**: Environment-specific standalone XML files

### Database Integration
- **Database**: Oracle Database
- **Connection**: JNDI datasource configuration
- **ORM**: Hibernate EntityManager 5.6.15.Final
- **Transaction Management**: Container-managed transactions (CMT)

### Monitoring & Observability
- **Logging**: Log4j2 with structured logging
- **Metrics**: Datadog integration for application metrics
- **Health Checks**: Built-in application health monitoring
- **JMX**: Management beans for operational control

## Security Considerations

- **Authentication**: Integration with passkey-authentication-service
- **Authorization**: Role-based access control
- **Data Protection**: Secure handling of customer email data
- **Communication**: Encrypted communication with external services
- **Configuration**: Secure management of sensitive configuration values