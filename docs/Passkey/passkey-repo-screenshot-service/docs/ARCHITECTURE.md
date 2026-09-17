# Architecture

## System Overview

The Passkey Screenshot Service is a containerized TypeScript microservice that provides on-demand website screenshot generation. It follows a layered architecture pattern with clear separation of concerns between web handling, screenshot processing, caching, and image manipulation.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│  HTTPS Server   │────│   Express App   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       │                                 │                                 │
                ┌──────▼──────┐                 ┌────────▼────────┐                ┌─────▼─────┐
                │ Screenshot  │                 │   DB Client     │                │  Request  │
                │  Service    │                 │   Service       │                │  Utils    │
                └──────┬──────┘                 └────────┬────────┘                └───────────┘
                       │                                 │
                ┌──────▼──────┐                 ┌────────▼────────┐
                │    Web      │                 │      S3         │
                │ Screenshot  │                 │    Storage      │
                │  Service    │                 └─────────────────┘
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │   Resize    │
                │  Service    │
                └─────────────┘
```

## Components

### Express Application (`App.ts`)
- **Purpose**: HTTP server setup and routing
- **Location**: `packages/service/src/App.ts`
- **Key Responsibilities**:
  - HTTPS server configuration with SSL certificates
  - Route definition for screenshot and health endpoints
  - Request/response handling

### Screenshot Service (`ScreenshotService.ts`)
- **Purpose**: Main orchestration layer for screenshot processing
- **Location**: `packages/service/src/ScreenshotService.ts`
- **Key Responsibilities**:
  - URL validation and domain security enforcement
  - Cache lookup and management
  - Concurrency control using semaphores
  - Error handling and fallback image serving
  - Coordination between web screenshot and storage services

### Web Screenshot Service (`WebScreenshotService.ts`)
- **Purpose**: Browser automation and screenshot capture
- **Location**: `packages/service/src/WebScreenshotService.ts`
- **Key Responsibilities**:
  - Puppeteer browser management
  - Page navigation and loading
  - Screenshot capture with timeout handling
  - Banner removal and page cleanup

### DB Client Service (`DBClientService.ts`)
- **Purpose**: S3 storage operations for screenshot caching
- **Location**: `packages/service/src/DBClientService.ts`
- **Key Responsibilities**:
  - S3 object retrieval and storage
  - Cache key generation based on hostname/pathname
  - Error handling for storage operations

### Resize Service (`ResizeService.ts`)
- **Purpose**: Image processing and resizing
- **Location**: `packages/service/src/ResizeService.ts`
- **Key Responsibilities**:
  - Dynamic image resizing using Sharp library
  - Format conversion and optimization
  - Dimension calculation and aspect ratio handling

### Request Utils (`RequestUtils.ts`)
- **Purpose**: Request parameter parsing and validation
- **Location**: `packages/service/src/RequestUtils.ts`
- **Key Responsibilities**:
  - Query parameter extraction
  - Default value assignment
  - Input validation and sanitization

## Data Flow

### Screenshot Request Flow

1. **Request Reception**: Express server receives HTTPS request at `/local/picture/:imageId`
2. **Parameter Parsing**: RequestUtils extracts and validates query parameters
3. **URL Validation**: ScreenshotService validates URL format and domain restrictions
4. **Cache Lookup**: DBClientService checks S3 for existing screenshot
5. **Cache Hit**: If found and not force refresh, return cached image
6. **Cache Miss**: Acquire semaphore lock for screenshot generation
7. **Screenshot Capture**: WebScreenshotService uses Puppeteer to capture page
8. **Storage**: Save new screenshot to S3 cache
9. **Image Processing**: ResizeService processes image based on client requirements
10. **Response**: Return processed image to client

### Error Handling Flow

1. **Validation Errors**: Return 400 Bad Request for invalid URLs or parameters
2. **Domain Restrictions**: Return 400 Bad Request for non-approved domains
3. **Timeout Errors**: Return fallback "unavailable" image
4. **Screenshot Failures**: Return fallback image and log error
5. **Storage Failures**: Continue with screenshot generation, log warning

## Design Patterns

### Service Layer Pattern
- Clear separation between HTTP handling and business logic
- Each service has a single responsibility
- Services are loosely coupled through interfaces

### Repository Pattern
- DBClientService abstracts storage operations
- Consistent interface for cache operations
- Easy to mock for testing

### Semaphore Pattern
- Controls concurrent browser instances
- Prevents resource exhaustion
- Provides graceful degradation under load

### Circuit Breaker Pattern
- Timeout handling for external operations
- Fallback responses for failures
- Resource protection through limits

## Module Structure

### Monorepo Organization
```
passkey-screenshot-service/
├── packages/
│   ├── service/           # Main application
│   │   ├── src/          # TypeScript source code
│   │   ├── Resources/    # Static assets (fallback images)
│   │   ├── cert/         # SSL certificates
│   │   └── tests/        # Unit and integration tests
│   └── infra/            # Infrastructure as Code
│       ├── lib/          # CDK stack definitions
│       ├── bin/          # CDK app entry points
│       └── tests/        # Infrastructure tests
├── .changeset/           # Version management
└── docs/                 # Documentation
```

### Service Package Structure
```
packages/service/src/
├── App.ts                # Express server setup
├── ScreenshotService.ts  # Main business logic
├── WebScreenshotService.ts # Browser automation
├── DBClientService.ts    # S3 storage operations
├── ResizeService.ts      # Image processing
└── RequestUtils.ts       # Request handling utilities
```

## Security Architecture

### Domain Restrictions
- Whitelist-based domain validation
- Only `.passkey.com` and `.cvent.org` domains allowed
- URL parsing and validation before processing

### HTTPS Enforcement
- All communication over HTTPS
- SSL certificate management
- Secure headers and protocols

### Resource Limits
- Concurrency limits prevent DoS attacks
- Timeout controls prevent resource exhaustion
- Memory and CPU limits in container

### Input Validation
- URL format validation
- Parameter sanitization
- Error handling for malicious inputs

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Container-based deployment
- Load balancer distribution

### Caching Strategy
- S3-based persistent cache
- Hostname/pathname-based keys
- Configurable cache invalidation

### Resource Management
- Semaphore-controlled concurrency
- Browser instance pooling
- Memory-efficient image processing

### Performance Optimization
- Async/await throughout
- Non-blocking I/O operations
- Efficient image processing with Sharp