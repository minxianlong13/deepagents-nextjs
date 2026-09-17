# Architecture

## System Overview

The Passkey File Uploader follows a modern microservices architecture with a clear separation between frontend and backend concerns. The system is designed for scalability, security, and maintainability within the Passkey ecosystem.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   External      │
│   (Next.js)     │◄──►│  (Spring Boot)   │◄──►│   Services      │
│                 │    │                  │    │                 │
│ - File Upload   │    │ - REST API       │    │ - AWS S3        │
│ - Progress UI   │    │ - File Processing│    │ - ClamAV        │
│ - Status Display│    │ - Metadata Mgmt  │    │ - OAuth         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components

### Frontend Application (passkey-file-uploader)
- **Purpose**: Provides user interface for file upload operations
- **Location**: `packages/passkey-file-uploader/`
- **Technology**: Next.js 14, React 18, TypeScript
- **Key Features**:
  - Drag-and-drop file upload interface
  - Real-time upload progress tracking
  - File status monitoring
  - Integration with Cvent Design System (Carina)

### Backend Service (passkey-file-uploader-sb)
- **Purpose**: Core API service handling file operations and business logic
- **Location**: `packages/passkey-file-uploader-sb/`
- **Technology**: Spring Boot 3, Java 17
- **Key Components**:
  - **Controllers**: REST API endpoints
  - **Services**: Business logic layer
  - **Data Access**: File metadata persistence
  - **Storage**: S3 integration for file storage
  - **Security**: OAuth integration and authorization

### Model Library
- **Purpose**: Shared data models and contracts
- **Location**: `packages/passkey-file-uploader-sb/model/`
- **Key Classes**:
  - `FileMetadata`: Upload context and type information
  - `UploadMetadata`: Complete file information and status
  - `UploadStatus`: File processing state enumeration

### Java Client Library
- **Purpose**: Client SDK for other services to integrate with file uploader
- **Location**: `packages/passkey-file-uploader-sb/java-client/`
- **Features**: Type-safe API client with authentication handling

## Data Flow

### File Upload Process

1. **Client Initiation**: User selects file in frontend interface
2. **Metadata Preparation**: Frontend collects file metadata (application, type)
3. **Multipart Upload**: File and metadata sent to backend API
4. **Initial Processing**: Backend validates file and creates upload record
5. **Storage**: File uploaded to S3 with generated unique identifier
6. **Malware Scanning**: File queued for ClamAV virus scanning
7. **Status Updates**: Processing status tracked and available via API
8. **Completion**: File marked as READY when all processing complete

### File Retrieval Process

1. **Status Check**: Client queries file status via GET /file-upload/{id}
2. **Download Request**: Client requests file content via GET /file-upload/{id}/content
3. **Authorization**: Backend validates user permissions
4. **Stream Response**: File streamed directly from S3 to client

## Design Patterns

### Repository Pattern
- **Implementation**: Data access layer abstraction
- **Benefits**: Testability and separation of concerns
- **Location**: `UploadRecordMapper` and related data access classes

### Service Layer Pattern
- **Implementation**: Business logic encapsulation in service classes
- **Benefits**: Reusable business operations and transaction management
- **Location**: `FileUploadService` and related service classes

### Immutable Value Objects
- **Implementation**: Using Immutables library for model classes
- **Benefits**: Thread safety and reduced bugs
- **Location**: All model classes in the model package

### Dependency Injection
- **Implementation**: Spring Boot's IoC container
- **Benefits**: Loose coupling and testability
- **Usage**: Throughout service and controller layers

## Module Structure

### Monorepo Organization
```
passkey-file-uploader/
├── packages/
│   ├── passkey-file-uploader/          # Frontend Next.js app
│   │   ├── app/                        # Next.js app directory
│   │   ├── e2e/                        # End-to-end tests
│   │   └── types/                      # TypeScript type definitions
│   └── passkey-file-uploader-sb/       # Backend Spring Boot service
│       ├── model/                      # Shared data models
│       ├── java-client/                # Client library
│       ├── service/                    # Main Spring Boot application
│       ├── infra/                      # Infrastructure as code
│       └── it/                         # Integration tests
```

### Backend Module Dependencies
```
service (Main Application)
├── depends on: model
├── depends on: java-client (for testing)
└── provides: REST API

model (Data Models)
├── no dependencies
└── provides: Shared contracts

java-client (Client SDK)
├── depends on: model
└── provides: Type-safe client

infra (Infrastructure)
├── depends on: service configuration
└── provides: AWS CDK deployment
```

## Security Architecture

### Authentication & Authorization
- **OAuth Integration**: Cvent OAuth service for user authentication
- **Scope-based Access**: `FILE_UPLOAD` scope required for all operations
- **Request Validation**: Input sanitization and validation at API layer

### File Security
- **Malware Scanning**: All uploaded files scanned with ClamAV
- **Secure Storage**: Files stored in private S3 buckets with encryption
- **Access Control**: Signed URLs for secure file access
- **Input Sanitization**: All user inputs sanitized to prevent injection attacks

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: Service instances can be scaled horizontally
- **Load Balancing**: Multiple instances behind load balancer
- **Database**: Shared database for metadata consistency

### Storage Scaling
- **S3 Integration**: Virtually unlimited storage capacity
- **CDN Integration**: Potential for CloudFront distribution
- **Multipart Uploads**: Support for large file uploads

### Performance Optimization
- **Streaming**: Direct file streaming to/from S3
- **Async Processing**: Background malware scanning
- **Caching**: Metadata caching for frequently accessed files

## Monitoring & Observability

### Application Monitoring
- **Datadog Integration**: Application performance monitoring
- **Custom Metrics**: Upload success rates, processing times
- **Health Checks**: Service health endpoints

### Logging
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Security Logging**: Audit trail for file operations
- **Error Tracking**: Comprehensive error logging and alerting

## Integration Points

### Internal Services
- **passkey-clamav**: Malware scanning service
- **Cvent OAuth**: Authentication service
- **Other Passkey Services**: Via Java client library

### External Services
- **AWS S3**: Primary file storage
- **AWS CloudWatch**: Monitoring and alerting
- **Datadog**: Application performance monitoring

## Deployment Architecture

### Environment Separation
- **Development**: Local development with LocalStack
- **Staging**: AWS staging environment for testing
- **Production**: AWS production environment with high availability

### Infrastructure Components
- **ECS/Fargate**: Container orchestration
- **Application Load Balancer**: Traffic distribution
- **RDS**: Database for metadata storage
- **S3**: File storage with versioning and encryption
- **CloudWatch**: Monitoring and logging