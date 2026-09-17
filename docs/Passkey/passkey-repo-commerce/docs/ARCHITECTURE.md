# Architecture

## System Overview

Passkey Commerce follows a traditional Java EE multi-tier architecture deployed on Wildfly application server. The system is designed as a bridge between legacy Passkey applications and modern payment processing infrastructure, utilizing Enterprise JavaBeans (EJBs) for transaction management and business logic.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Legacy Apps    │───▶│ Passkey Commerce │───▶│ Payment Systems │
│                 │    │     (EJBs)      │    │ (PBB/Gateways)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (Oracle)      │
                       └─────────────────┘
```

## Components

### Core Module (`core/`)
- **Purpose**: Shared domain models, utilities, and data access components
- **Location**: `core/src/main/java/`
- **Key Classes**:
  - `com.passkey.core.model.*` - Domain entities (Event, Bed, etc.)
  - `com.passkey.core.dao.*` - Data access objects
  - `com.passkey.core.util.*` - Utility classes and helpers
  - `com.passkey.core.business.*` - Business objects

### EJB Module (`group-commerce-ejb/`)
- **Purpose**: Business logic implementation and EJB services
- **Location**: `group-commerce-ejb/src/main/java/`
- **Key Components**:
  - Payment Connector EJBs for different merchant account types
  - E-commerce scheduler for automated processing
  - Transaction management and business rules

### EAR Module (`group-commerce-ear/`)
- **Purpose**: Enterprise application packaging for deployment
- **Location**: `group-commerce-ear/`
- **Contents**: Application deployment descriptor and module assembly

## Data Flow

### Payment Processing Flow
1. **Request Initiation**: Legacy application initiates payment request
2. **EJB Invocation**: Appropriate payment connector EJB is called
3. **Gateway Selection**: System determines merchant account type (Authorize.NET, Stripe, CPS)
4. **PBB Integration**: Request is forwarded to Payment Black Box service
5. **Response Processing**: Payment response is processed and returned
6. **Database Update**: Transaction details are persisted

### Scheduled Processing Flow
1. **Timer Activation**: EJB timer triggers every 3 minutes
2. **Transaction Retrieval**: System queries for pending captures/refunds
3. **Batch Processing**: Transactions are processed in batches
4. **Status Updates**: Transaction statuses are updated in database
5. **Error Handling**: Failed transactions are logged and retried

## Design Patterns

### Enterprise Patterns
- **Session Facade**: EJBs provide coarse-grained interfaces to business logic
- **Data Access Object (DAO)**: Centralized data access through DAO pattern
- **Business Object**: Domain logic encapsulated in business objects
- **Service Layer**: Clear separation between presentation and business logic

### Integration Patterns
- **Adapter Pattern**: Payment connectors adapt to different gateway APIs
- **Strategy Pattern**: Different payment processing strategies per merchant type
- **Template Method**: Common payment processing workflow with gateway-specific implementations

## Module Structure

### Maven Multi-Module Layout
```
passkey-commerce/
├── pom.xml                    # Parent POM with dependency management
├── core/                      # Shared components
│   ├── pom.xml
│   └── src/main/java/
├── group-commerce-ejb/        # Business logic EJBs
│   ├── pom.xml
│   └── src/main/java/
├── group-commerce-ear/        # Enterprise application
│   ├── pom.xml
│   └── src/main/application/
└── configs/                   # Environment configurations
```

### Package Organization
- `com.passkey.core.*` - Core domain and utilities
- `com.passkey.pbb.*` - Payment Black Box integration
- `com.passkey.ecommercescheduler.*` - Scheduled processing
- `com.passkey.util.*` - Utility classes
- `com.lanyon.*` - Legacy namespace components

## Technology Architecture

### Application Server
- **Wildfly 26.1.3.Final**: Jakarta EE 8 compliant application server
- **Port Configuration**: Default port 8080 + offset 100 = 8180
- **Management Interface**: Admin console on port 9990 + offset

### Database Integration
- **Oracle Database**: Primary data store
- **Connection Pooling**: Wildfly managed datasources
- **Transaction Management**: Container-managed transactions (CMT)

### Configuration Management
- **Hogan Templates**: Environment-specific configuration templating
- **Properties Files**: Environment-specific property files
- **JNDI Resources**: Database connections and external service references

## Security Architecture

### Authentication & Authorization
- **EJB Security**: Method-level security annotations
- **Container Security**: Wildfly security domains
- **Service-to-Service**: Secure communication with PBB

### Data Protection
- **Sensitive Data**: Payment information handled through PBB
- **Audit Logging**: Transaction audit trails
- **Encryption**: Data encryption in transit and at rest

## Scalability Considerations

### Horizontal Scaling
- **Stateless EJBs**: Support for clustering and load balancing
- **Database Connection Pooling**: Efficient resource utilization
- **Asynchronous Processing**: Non-blocking payment operations where possible

### Performance Optimization
- **Connection Pooling**: Optimized database connections
- **Caching**: Strategic caching of frequently accessed data
- **Batch Processing**: Efficient bulk transaction processing

## Integration Points

### External Services
- **Payment Black Box (PBB)**: Primary payment processing service
- **Authorize.NET**: Direct merchant account integration
- **Stripe**: Payment gateway integration
- **Cvent Payment Service (CPS)**: Internal payment service

### Internal Dependencies
- **passkey-ecommerce-service**: E-commerce operations
- **passkey-gl**: General ledger integration
- **Auth Service**: Authentication and authorization

## Monitoring & Observability

### Application Monitoring
- **Datadog**: Application performance monitoring
- **Wildfly Metrics**: JVM and application server metrics
- **Custom Metrics**: Business-specific monitoring

### Logging
- **SLF4J/Log4j2**: Structured logging framework
- **Centralized Logging**: Log aggregation and analysis
- **Audit Trails**: Payment transaction logging

## Deployment Architecture

### Environment Tiers
- **Development**: Local development and testing
- **Staging**: Pre-production validation
- **Production**: Live commerce processing

### Infrastructure
- **Containerization**: Docker-based deployment
- **Orchestration**: Kubernetes/OpenShift deployment
- **Load Balancing**: High availability configuration