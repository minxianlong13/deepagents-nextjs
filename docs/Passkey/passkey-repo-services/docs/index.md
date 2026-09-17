# Passkey Services Documentation Index

## Repository Overview
**Repository**: [cvent-internal/passkey-services](https://github.com/cvent-internal/passkey-services)  
**Type**: TypeScript/JavaScript Monorepo with Java Services  
**Open Issues**: 41  
**Primary Language**: Java (services) with TypeScript orchestration  

## Documentation Structure

### 📋 [README.md](README.md)
**Overview and Quick Start Guide**
- Repository purpose and key features
- Services included in the aggregator
- Quick setup and installation instructions
- Related services and integrations

### 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md)
**System Architecture and Design**
- Service aggregator pattern implementation
- Component structure and organization
- Data flow and design patterns
- Module structure and deployment architecture

### 🔌 [API_REFERENCE.md](API_REFERENCE.md)
**Service Interfaces and Endpoints**
- Health check endpoints
- Service-specific interfaces
- Configuration APIs
- Monitoring and observability interfaces

### 📚 [DOMAIN_MODEL.md](DOMAIN_MODEL.md)
**Business Concepts and Data Models**
- Glossary of business and technical terms
- Core entities and relationships
- Business rules and constraints
- Domain events and data flow

### ⚙️ [TECHNICAL_DETAILS.md](TECHNICAL_DETAILS.md)
**Technology Stack and Implementation**
- Technology stack and dependencies
- Configuration management
- Database schemas and connections
- Build system and monitoring setup

### 🚀 [DEPLOYMENT.md](DEPLOYMENT.md)
**Deployment and Infrastructure Guide**
- Infrastructure and server architecture
- Environment configurations (dev, alpha, beta, prod)
- CI/CD pipeline and deployment process
- Rollback procedures and disaster recovery

### 💻 [DEVELOPMENT.md](DEVELOPMENT.md)
**Local Development Setup**
- Prerequisites and development tools
- Local setup and environment configuration
- Coding standards and best practices
- Common development tasks and troubleshooting

## Service Breakdown

### Core Services (Java-based)
1. **GMLService** - Guest Management Layer (runs every minute)
2. **ExchangeRates** - Currency exchange rate updates (monthly)
3. **GLResCRTSService** - GL Reservation CRTS processing
4. **Nor1Processor** - Nor1 integration processor (daily)
5. **billing-report** - Web billing report generation (monthly)
6. **roche-report** - Roche report service (daily)
7. **exchange-rates** - Alternative exchange rate service

### Orchestration Layer (TypeScript/JavaScript)
- **pnpm workspace** - Monorepo management
- **Changesets** - Version management
- **Jenkins Pipeline** - CI/CD orchestration
- **Build Scripts** - Maven build coordination

## Key Characteristics

### Architecture Pattern
- **Service Aggregator**: Multiple independent Java services in single repository
- **Cron-based Scheduling**: Services run on predetermined schedules
- **Shared Infrastructure**: Unified logging, configuration, and deployment

### Technology Stack
- **Languages**: Java 11 (services), TypeScript/JavaScript (orchestration)
- **Build Tools**: Maven (Java), pnpm (Node.js ecosystem)
- **Deployment**: Jenkins + Octo deployment system
- **Monitoring**: Log4j logging with centralized log directory

### Deployment Model
- **Environments**: Development, Alpha, Beta, Production
- **Scheduling**: Unix cron for service execution
- **Logging**: Centralized logging to `/services/passkey/{env}/services/logs/json`
- **Configuration**: Environment-specific property files

## Quick Navigation

| Topic | Document | Description |
|-------|----------|-------------|
| Getting Started | [README.md](README.md) | Repository overview and quick start |
| System Design | [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture patterns and components |
| Service APIs | [API_REFERENCE.md](API_REFERENCE.md) | Endpoints and service interfaces |
| Business Logic | [DOMAIN_MODEL.md](DOMAIN_MODEL.md) | Domain concepts and data models |
| Implementation | [TECHNICAL_DETAILS.md](TECHNICAL_DETAILS.md) | Technology stack and configuration |
| Operations | [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment and infrastructure |
| Development | [DEVELOPMENT.md](DEVELOPMENT.md) | Local setup and coding guidelines |

## Repository Statistics
- **Created**: May 1, 2025
- **Last Updated**: January 27, 2026
- **Open Issues**: 41
- **Language**: Java (primary services)
- **Framework**: Service Aggregator with TypeScript orchestration
- **Team**: Passkey Platform Team

## Related Documentation
- Individual service README files in `packages/app/{ServiceName}/README.MD`
- Service-specific catalog-info.yaml files for Backstage integration
- Build and deployment scripts in `pipeline/` directory
- Cron configuration in `packages/app/services_crontab`

---
*This documentation was generated following the repo-documenter skill structure for comprehensive repository documentation.*