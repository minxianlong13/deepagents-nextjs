# Architecture

## System Overview

The Passkey Room List Manager (RLM) is a hybrid application that combines a traditional Java Enterprise Edition backend with a modern TypeScript frontend. The system is designed to handle bulk reservation processing with rate limiting capabilities, file upload processing, and integration with multiple Passkey services.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (WildFly)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ - React UI      │    │ - JAX-RS APIs   │    │ - Auth Service  │
│ - File Upload   │    │ - EJB Services  │    │ - ClamAV        │
│ - Real-time     │    │ - JPA Entities  │    │ - Inventory     │
│   Updates       │    │ - Rate Limiting │    │ - Commerce      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (Oracle)      │
                    │                 │
                    │ - Room Data     │
                    │ - Guest Info    │
                    │ - Reservations  │
                    │ - Processing    │
                    │   Status        │
                    └─────────────────┘
```

## Components

### Frontend Layer (Next.js/TypeScript)

- **Purpose**: Modern web interface for file upload and processing management
- **Location**: `packages/app/web/src/main/webapp/`
- **Key Technologies**: Next.js 12, React 18, TypeScript
- **Responsibilities**:
  - File upload interface
  - Processing status display
  - Real-time updates
  - User authentication integration

### Backend Layer (Java/WildFly)

#### Core Module
- **Purpose**: Domain models, utilities, and shared business logic
- **Location**: `packages/app/core/`
- **Key Classes**:
  - Domain entities and DTOs
  - Utility classes for file processing
  - Rate limiting logic
  - Integration clients

#### EJB Module
- **Purpose**: Enterprise Java Beans providing business services
- **Location**: `packages/app/ejb/`
- **Key Services**:
  - Room list processing services
  - File upload handling
  - Reservation management
  - External service integration

#### Web Module
- **Purpose**: REST API endpoints and web layer
- **Location**: `packages/app/web/`
- **Key Components**:
  - JAX-RS REST endpoints
  - Servlet-based file upload
  - JSP pages for legacy UI
  - Security filters

#### EAR Module
- **Purpose**: Enterprise Application Archive packaging
- **Location**: `packages/app/ear/`
- **Responsibilities**:
  - Application packaging
  - Deployment configuration
  - Module coordination

### External Integrations

#### Authentication Service
- **Purpose**: User authentication and authorization
- **Integration**: passkey-authentication-java-client
- **Usage**: Session management, user validation

#### ClamAV Service
- **Purpose**: Malware scanning for uploaded files
- **Integration**: passkey-clamav-service
- **Usage**: File security validation

#### Inventory Service
- **Purpose**: Room availability and inventory management
- **Integration**: passkey-inventory-service
- **Usage**: Room validation, availability checks

#### Commerce Services
- **Purpose**: Payment processing and financial operations
- **Integration**: commerce, payments-wallet-service
- **Usage**: Reservation payment handling

## Data Flow

### File Upload and Processing Flow

1. **Upload Initiation**
   - User selects spreadsheet file in frontend
   - File is uploaded to backend via REST API
   - Initial validation (file type, size) performed

2. **Security Scanning**
   - File sent to ClamAV service for malware scanning
   - Processing blocked if threats detected
   - Clean files proceed to parsing

3. **File Parsing**
   - Spreadsheet parsed to extract room/guest data
   - Data validation against business rules
   - Rate limiting applied to prevent system overload

4. **Reservation Processing**
   - Room availability checked via Inventory Service
   - Reservations created/modified via Reservation Saga
   - Payment processing handled via Commerce services

5. **Status Updates**
   - Real-time status updates sent to frontend
   - Processing results stored in database
   - Error handling and retry logic applied

### Rate Limiting Flow

```
Request → Rate Limiter → Queue → Processor → External Services
    ↓         ↓           ↓         ↓            ↓
  Validate  Check      Buffer    Execute     Update
  Request   Limits     Requests  Business    Status
                                 Logic
```

## Design Patterns

### Repository Pattern
- **Implementation**: EJB-based data access layer
- **Purpose**: Abstraction of data persistence logic
- **Benefits**: Testability, maintainability, separation of concerns

### Service Layer Pattern
- **Implementation**: EJB services for business logic
- **Purpose**: Encapsulation of business operations
- **Benefits**: Transaction management, security, reusability

### Command Pattern
- **Implementation**: File processing commands
- **Purpose**: Encapsulation of processing operations
- **Benefits**: Undo/redo capability, queuing, logging

### Observer Pattern
- **Implementation**: Real-time status updates
- **Purpose**: Notification of processing state changes
- **Benefits**: Loose coupling, real-time feedback

## Module Structure

### Maven Multi-Module Layout

```
passkey-rlm/
├── packages/app/
│   ├── pom.xml (parent)
│   ├── core/
│   │   ├── pom.xml
│   │   └── src/main/java/com/
│   │       ├── lanyon/     # Legacy domain models
│   │       └── passkey/    # Modern domain models
│   ├── ejb/
│   │   ├── pom.xml
│   │   └── src/main/java/  # Business services
│   ├── web/
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/       # REST endpoints, servlets
│   │       └── webapp/     # JSP, static files, Next.js
│   └── ear/
│       ├── pom.xml
│       └── src/main/application/  # EAR configuration
└── packages/infra/         # AWS CDK infrastructure
```

### Package Organization

- **com.lanyon.group**: Legacy domain models and utilities
- **com.passkey.rlm**: Modern RLM-specific components
- **com.amazonaws**: AWS integration utilities
- **oracle**: Database-specific utilities

## Deployment Architecture

### Development Environment
- **WildFly**: Local application server
- **Oracle**: Local or shared database
- **Port Forwarding**: 80/443 → 8080/8443

### Production Environment
- **AWS ECS**: Container orchestration
- **Application Load Balancer**: Traffic distribution
- **RDS Oracle**: Managed database service
- **CloudWatch**: Monitoring and logging

## Security Architecture

### Authentication
- Integration with Passkey Authentication Service
- Session-based authentication for web interface
- Token-based authentication for API calls

### Authorization
- Role-based access control
- Event-specific permissions
- Organization-level restrictions

### File Security
- ClamAV malware scanning
- File type validation
- Size limitations
- Temporary file cleanup

### Data Protection
- HTTPS/TLS encryption in transit
- Database encryption at rest
- PCI compliance for payment data
- GDPR compliance for personal data

## Scalability Considerations

### Rate Limiting
- Configurable processing limits
- Queue-based request handling
- Backpressure mechanisms

### Horizontal Scaling
- Stateless application design
- Load balancer distribution
- Database connection pooling

### Performance Optimization
- Lazy loading of large datasets
- Caching of frequently accessed data
- Asynchronous processing for bulk operations