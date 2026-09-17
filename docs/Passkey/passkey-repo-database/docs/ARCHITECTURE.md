# Passkey Database Architecture

## Overview

The Passkey Database service implements a dual-database architecture supporting Cvent's hotel booking platform. The system separates transactional workloads (OLTP) from analytical workloads (OLAP) to optimize performance and scalability.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │    │   Applications  │    │   BI/Analytics  │
│   (Passkey)     │    │   (External)    │    │   (Reporting)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────┐    ┌─────────────────┐
│           TXN Database (OLTP)           │    │   BI Database   │
│                                         │    │     (OLAP)      │
│  ┌─────────────┐  ┌─────────────────┐  │    │                 │
│  │   Schemas   │  │   Microservice  │  │◄───┤  Data Warehouse │
│  │             │  │     Users       │  │    │   & Analytics   │
│  │ • COMMON    │  │                 │  │    │                 │
│  │ • GUI       │  │ • MS_*_USER     │  │    │                 │
│  │ • PERM      │  │ • API_USER      │  │    │                 │
│  │ • BRIDGE    │  │ • etc.          │  │    │                 │
│  └─────────────┘  └─────────────────┘  │    │                 │
└─────────────────────────────────────────┘    └─────────────────┘
```

## Database Architecture

### Transaction Database (TXN)

The TXN database handles all operational workloads and is organized into functional schemas:

#### Core Business Schemas
- **COMMON**: Shared reference data and utilities
- **GUI**: User interface and presentation layer data
- **PERM**: Permissions and security management
- **BRIDGE**: Integration and data bridging
- **ECOMMERCE**: E-commerce transactions
- **EVENTPROFILE**: Event management data
- **PADLOCK**: Security and access control

#### Microservice Schemas
- **MS_*_USER**: Dedicated schemas for each microservice
- **API_USER**: External API access
- **SERVICE_OWNER**: Service management

#### Archive Schemas
- ***_ARCHIVE**: Historical data storage for each business domain

### Business Intelligence Database (BI)

The BI database supports analytical workloads:
- Data warehouse structures
- Reporting and analytics
- Historical data analysis
- Performance metrics

## Schema Organization

### Naming Conventions

```
Schema Types:
├── Business Domains (COMMON, GUI, PERM, etc.)
├── Microservices (MS_*_USER)
├── Archives (*_ARCHIVE)
├── System (SYSTEM, PUBLIC)
└── Utilities (UPLOAD, XFER, etc.)
```

### Access Patterns

1. **Owner Schemas**: Hold database objects (tables, procedures, etc.)
2. **User Schemas**: Application access with limited privileges
3. **Service Schemas**: Microservice-specific access
4. **Archive Schemas**: Historical data with read-only access

## Infrastructure Components

### Database Links
- Cross-database connectivity
- External system integration
- Data synchronization

### Tablespaces
- Optimized storage allocation
- Performance tuning
- Backup and recovery optimization

### Roles and Security
- Role-based access control (RBAC)
- Principle of least privilege
- Microservice isolation

## Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Application │───▶│ TXN Database│───▶│ BI Database │
│   Layer     │    │   (OLTP)    │    │   (OLAP)    │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │   Archive   │
                   │  Storage    │
                   └─────────────┘
```

### Data Movement
1. **Real-time**: Direct application writes to TXN
2. **Batch ETL**: Scheduled data movement to BI
3. **Archival**: Historical data migration to archive schemas

## Deployment Architecture

### Environment Topology

```
Development ──▶ Alpha ──▶ IT50 ──▶ Staging ──▶ UAT ──▶ Production
     │             │        │         │        │         │
     ▼             ▼        ▼         ▼        ▼         ▼
   Dev DB      Alpha DB  IT50 DB   Stg DB   UAT DB    Prod DB
```

### CI/CD Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │───▶│   Jenkins   │───▶│  Liquibase  │
│ Repository  │    │   Pipeline  │    │  Deployment │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │   Target    │
                   │ Environment │
                   └─────────────┘
```

## Performance Architecture

### OLTP Optimizations
- Normalized data structures
- Optimized indexes for transactional queries
- Connection pooling
- Query optimization

### OLAP Optimizations
- Denormalized structures for reporting
- Materialized views
- Partitioning strategies
- Aggregation tables

## Security Architecture

### Multi-layered Security
1. **Network**: VPC and security groups
2. **Database**: User authentication and authorization
3. **Schema**: Role-based access control
4. **Object**: Granular permissions

### Access Control Matrix
```
Role Type        │ TXN Access │ BI Access │ Archive Access
─────────────────┼────────────┼───────────┼───────────────
Application User │ Read/Write │ None      │ None
Service User     │ Limited RW │ None      │ None
BI User          │ Read Only  │ Read/Write│ Read Only
Admin User       │ Full       │ Full      │ Full
```

## Scalability Considerations

### Horizontal Scaling
- Read replicas for reporting workloads
- Microservice schema isolation
- Load balancing across connections

### Vertical Scaling
- Resource allocation per environment
- Performance monitoring and tuning
- Capacity planning

## Disaster Recovery

### Backup Strategy
- Regular automated backups
- Point-in-time recovery capability
- Cross-region backup replication

### High Availability
- Oracle RAC configuration (production)
- Failover mechanisms
- Monitoring and alerting

## Integration Points

### External Systems
- Oracle Data Integrator (ODI)
- Oracle GoldenGate (OGG)
- Third-party APIs
- Reporting tools

### Internal Services
- Passkey microservices
- Authentication services
- Monitoring and logging systems