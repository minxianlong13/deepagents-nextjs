# Architecture

## System Overview

The Passkey Inbound Service is designed as a microservice that acts as the primary integration gateway for external vendor systems into the Cvent Passkey platform. It follows a layered architecture pattern with clear separation of concerns and implements event-driven communication patterns for scalability and reliability.

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Vendor Systems                      │
│              (Hotel Management Systems, OHIP)                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ REST/GraphQL/Events
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                Passkey Inbound Service                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Controllers │  │   GraphQL   │  │    Lambda Handler       │  │
│  │   (REST)    │  │ Subscriptions│  │   (Event Processing)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                 Service Layer                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │  │
│  │  │    OHIP     │ │    Admin    │ │   External Data     │   │  │
│  │  │  Services   │ │  Services   │ │   Load Services     │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   Data Layer                                │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │  │
│  │  │  DynamoDB   │ │     SQS     │ │        S3           │   │  │
│  │  │    DAOs     │ │  Services   │ │    Services         │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                      │ Events/Messages
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Downstream Passkey Services                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ Inventory   │ │ Reservation │ │      Event Data         │   │
│  │  Service    │ │   Service   │ │       Service           │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### REST Controllers

#### EventController
- **Purpose**: Handles inbound business events from vendor systems
- **Location**: `com.cvent.passkeyinbound.controllers.EventController`
- **Key Endpoints**:
  - `POST /passkey-inbound/v1/external-data-load/events` - External data load events
  - `POST /passkey-inbound/v1/ohip/subscription-tasks` - OHIP subscription management
  - `POST /passkey-inbound/v1/ohip/{vsId}/events` - Single business event processing
  - `POST /passkey-inbound/v1/ohip/{vsId}/events/batch` - Batch event processing

#### GmlController
- **Purpose**: Handles GML (Guest Management Layer) operations
- **Location**: `com.cvent.passkeyinbound.controllers.GmlController`
- **Functionality**: Guest data management and synchronization

#### HousingHotelsController
- **Purpose**: Manages housing and hotel-related operations
- **Location**: `com.cvent.passkeyinbound.controllers.HousingHotelsController`
- **Functionality**: Hotel inventory and housing block management

#### InboundSettingsController
- **Purpose**: Configuration management for inbound operations
- **Location**: `com.cvent.passkeyinbound.controllers.InboundSettingsController`
- **Functionality**: Vendor system and hotel configuration management

#### GraphQlSubscriptionController
- **Purpose**: Manages GraphQL subscriptions for real-time data
- **Location**: `com.cvent.passkeyinbound.controllers.GraphQlSubscriptionController`
- **Functionality**: Real-time event streaming and subscription management

### Service Layer

#### OHIP Services
- **AdminService**: Administrative operations for OHIP integrations
- **OhipBusinessEventSqsService**: SQS message handling for business events
- **GraphQlSubscriptionService**: GraphQL subscription lifecycle management
- **LambdaService**: AWS Lambda function invocation and management

#### Integration Services
- **PasskeyInventoryServiceImpl**: Integration with inventory management
- **PasskeyReservationServiceImpl**: Reservation system integration
- **PasskeyEventService**: Event data processing and routing
- **PasskeyVendorServiceImpl**: Vendor system management
- **PasskeyCoreMapperServiceImpl**: Data transformation and mapping

#### Utility Services
- **S3ServiceImpl**: AWS S3 operations for file storage
- **SqsSenderServiceImpl**: SQS message publishing
- **BlockMatchingServiceImpl**: Hotel block matching algorithms
- **MappingCodesMatchingServiceImpl**: Code mapping and validation

### Data Access Layer

#### DynamoDB DAOs
- **InboundConfigsDao**: Hotel and vendor configuration management
- **Location**: `com.cvent.passkeyinbound.dao.dynamo.InboundConfigsDao`
- **Purpose**: Manages dynamic configuration for inbound operations

#### SQS Services
- **ExternalDataLoadSqsService**: External data load queue management
- **OhipBusinessEventSqsService**: Business event queue processing
- **ResultMessageSqsService**: Result message handling

## Data Flow

### Inbound Event Processing

1. **Event Ingestion**: External vendor systems send events via REST API
2. **Validation**: Controllers validate incoming requests and authentication
3. **Configuration Lookup**: Service retrieves hotel/vendor configurations from DynamoDB
4. **Event Processing**: Business logic processes and transforms event data
5. **Message Publishing**: Processed events are published to appropriate SQS queues
6. **Downstream Routing**: Events are routed to relevant Passkey services

### GraphQL Subscription Flow

1. **Subscription Request**: Clients establish GraphQL subscriptions
2. **Authentication**: OAuth-based authentication and authorization
3. **Event Filtering**: Subscriptions are filtered based on vendor system and hotel
4. **Real-time Updates**: Live events are streamed to subscribed clients
5. **Connection Management**: WebSocket connections are managed for reliability

### Configuration Management

1. **Dynamic Configuration**: Hotel and vendor settings stored in DynamoDB
2. **Cache Layer**: Frequently accessed configurations are cached
3. **Real-time Updates**: Configuration changes are applied without service restart
4. **Validation**: Configuration changes are validated before application

## Design Patterns

### Repository Pattern
- **Implementation**: DAO classes abstract data access logic
- **Benefits**: Separation of data access from business logic
- **Example**: `InboundConfigsDao` for configuration management

### Service Layer Pattern
- **Implementation**: Business logic encapsulated in service classes
- **Benefits**: Reusable business operations, clear separation of concerns
- **Example**: `AdminService` for administrative operations

### Event-Driven Architecture
- **Implementation**: SQS-based asynchronous message processing
- **Benefits**: Scalability, reliability, loose coupling
- **Example**: Business event processing through SQS queues

### Dependency Injection
- **Implementation**: Spring Framework's IoC container
- **Benefits**: Testability, modularity, configuration management
- **Example**: Service dependencies injected via constructor injection

### Circuit Breaker Pattern
- **Implementation**: Resilience patterns for external service calls
- **Benefits**: Fault tolerance, graceful degradation
- **Example**: Passkey service client integrations

## Module Structure

### Multi-Module Maven Project

```
passkey-inbound-service/
├── parent/                    # Parent POM configuration
├── model/                     # Shared data models and DTOs
├── java-client/              # Client library for service consumption
├── service/                  # Main Spring Boot application
├── it/                       # Integration tests
└── integrations-event-handler-lambda/  # AWS Lambda handler
```

### Service Module Structure

```
service/
├── src/main/java/com/cvent/passkeyinbound/
│   ├── controllers/          # REST and GraphQL controllers
│   ├── services/            # Business logic services
│   │   └── impl/           # Service implementations
│   ├── dao/                # Data access objects
│   │   └── dynamo/        # DynamoDB DAOs
│   ├── ohip/              # OHIP-specific services
│   │   └── services/      # OHIP service implementations
│   ├── config/            # Spring configuration classes
│   └── model/             # Internal data models
├── src/main/resources/      # Configuration files
└── src/test/               # Unit and integration tests
```

## Security Architecture

### Authentication & Authorization
- **OAuth 2.0**: Token-based authentication using Cvent's OAuth service
- **Scope-based Authorization**: Fine-grained permissions using `@CventAuthorization`
- **API Key Authentication**: Local development and service-to-service communication

### Data Protection
- **Encryption in Transit**: HTTPS/TLS for all external communications
- **Encryption at Rest**: AWS services provide encryption for stored data
- **Sensitive Data Handling**: PII and sensitive data are properly masked in logs

### Network Security
- **VPC Isolation**: Service runs within private VPC subnets
- **Security Groups**: Restrictive firewall rules for network access
- **API Gateway**: External access controlled through API Gateway

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: Service instances are stateless for easy scaling
- **Load Balancing**: Multiple instances behind application load balancer
- **Auto Scaling**: AWS Auto Scaling based on CPU and memory metrics

### Performance Optimization
- **Connection Pooling**: Database and HTTP connection pooling
- **Caching**: Configuration and frequently accessed data caching
- **Async Processing**: Non-blocking operations using Spring WebFlux

### Resource Management
- **Memory Management**: JVM tuning for optimal memory usage
- **Thread Pools**: Configured thread pools for different operation types
- **Circuit Breakers**: Protection against cascading failures