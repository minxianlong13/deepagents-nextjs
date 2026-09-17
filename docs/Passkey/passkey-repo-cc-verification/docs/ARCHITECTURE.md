# Architecture

## System Overview

The Passkey Credit Card Verification service follows a serverless, event-driven architecture built on AWS Lambda and API Gateway WebSocket. The system provides real-time credit card verification through a secure WebSocket connection, integrating with the Passkey Ledger service for payment processing.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PBR Survey    │───▶│  API Gateway     │───▶│  Lambda         │
│   Frontend      │    │  WebSocket       │    │  Functions      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Authorizer     │    │  Passkey        │
                       │   Lambda         │    │  Ledger API     │
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  AWS Secrets     │
                       │  Manager         │
                       └──────────────────┘
```

## Components

### API Gateway WebSocket
- **Purpose**: Manages WebSocket connections for real-time communication
- **Location**: AWS API Gateway
- **Key Features**: Connection management, routing, authorization integration

### Authorizer Lambda
- **Purpose**: Validates bearer tokens before allowing WebSocket connections
- **Location**: `app/lambda/authorizer.ts`
- **Key Classes**: `handler`, `authResult`, `EffectVal`
- **Integration**: Calls external auth service to verify tokens

### Request Processor Lambda
- **Purpose**: Processes credit card verification requests
- **Location**: `app/lambda/requestProcessor.ts`
- **Key Classes**: `handler`
- **Integration**: Forwards requests to Passkey Ledger service

### Utility Services
- **HTTPS Client**: Handles external API calls
- **Secrets Manager**: Retrieves API keys and sensitive configuration
- **Location**: `app/lambda/utils/`

## Data Flow

1. **Connection Establishment**
   - Client initiates WebSocket connection with bearer token
   - API Gateway triggers Authorizer Lambda
   - Authorizer validates token against auth service
   - Connection allowed/denied based on token validity

2. **Credit Card Verification**
   - Client sends verification request via WebSocket
   - API Gateway routes to Request Processor Lambda
   - Lambda extracts contextId, bearerToken, and userId
   - Request forwarded to Passkey Ledger API
   - Response returned to client via WebSocket

3. **Error Handling**
   - Invalid tokens result in connection denial
   - API errors are logged and handled gracefully
   - Client receives appropriate error responses

## Design Patterns

### Serverless Architecture
- Event-driven Lambda functions
- Pay-per-use pricing model
- Automatic scaling based on demand

### Gateway Pattern
- API Gateway acts as single entry point
- Handles routing, authentication, and connection management
- Decouples client from backend services

### Proxy Pattern
- Service acts as proxy to Passkey Ledger
- Adds authentication and connection management
- Maintains WebSocket state for real-time updates

### Secrets Management Pattern
- Centralized secret storage in AWS Secrets Manager
- Runtime secret retrieval
- No hardcoded credentials in code

## Infrastructure as Code

The service uses AWS CDK (Cloud Development Kit) for infrastructure management:

### CDK Structure
- **Application**: `lib/application.ts` - Main CDK app
- **Stack**: `lib/stack.ts` - Resource definitions
- **Gateway Builder**: `lib/GatewayBuilder.ts` - API Gateway configuration
- **Lambda Builder**: `lib/LambdaBuilder.ts` - Lambda function setup

### Key Resources
- API Gateway WebSocket API
- Lambda functions with appropriate IAM roles
- Secrets Manager integration
- CloudWatch logging and monitoring

## Security Architecture

### Authentication Flow
1. Bearer token provided in WebSocket connection
2. Authorizer Lambda validates token
3. API key retrieved from Secrets Manager
4. External auth service validates token
5. Connection allowed/denied based on validation

### Network Security
- HTTPS/WSS encryption for all communications
- API Gateway provides DDoS protection
- Lambda functions run in isolated execution environments

### Secrets Management
- API keys stored in AWS Secrets Manager
- Runtime retrieval prevents credential exposure
- Automatic rotation support