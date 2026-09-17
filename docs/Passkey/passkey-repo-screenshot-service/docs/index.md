# Passkey Screenshot Service Documentation

## Overview

This directory contains comprehensive documentation for the Passkey Screenshot Service, a TypeScript-based microservice that provides website screenshot functionality for the Passkey platform.

## Documentation Structure

### 📋 [README.md](./README.md)
**Overview and Quick Start**
- Service overview and purpose
- Key features and capabilities
- Quick start guide
- API endpoints summary
- Related services and dependencies

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
**System Architecture and Design**
- System overview and component diagram
- Detailed component descriptions
- Data flow and processing pipeline
- Design patterns and architectural decisions
- Module structure and organization
- Security architecture
- Scalability considerations

### 🔌 [API_REFERENCE.md](./API_REFERENCE.md)
**Endpoints and API Documentation**
- Complete API reference
- Request/response formats
- Parameter specifications
- Error handling and status codes
- Authentication and security
- SDK examples and code samples
- Performance characteristics

### 📚 [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)
**Domain Concepts and Glossary**
- Comprehensive glossary of terms
- Core entity definitions
- Business rules and constraints
- Data relationships and workflows
- State transitions and lifecycles
- Integration points

### ⚙️ [TECHNICAL_DETAILS.md](./TECHNICAL_DETAILS.md)
**Technology Stack and Implementation**
- Complete technology stack
- Dependencies and versions
- Configuration management
- Build and container setup
- Performance characteristics
- Security considerations
- Development tools and workflow

### 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md)
**Deployment and Infrastructure**
- Infrastructure overview (AWS/ECS)
- Environment configurations
- CI/CD pipeline details
- Monitoring and alerting
- Rollback procedures
- Security configuration
- Disaster recovery

### 💻 [DEVELOPMENT.md](./DEVELOPMENT.md)
**Local Development Guide**
- Prerequisites and setup
- Development workflow
- Testing strategies
- Debugging techniques
- Coding standards
- Common development tasks
- Troubleshooting guide

## Quick Navigation

### For New Developers
1. Start with [README.md](./README.md) for overview
2. Follow [DEVELOPMENT.md](./DEVELOPMENT.md) for local setup
3. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system understanding
4. Reference [API_REFERENCE.md](./API_REFERENCE.md) for endpoint details

### For Operations Teams
1. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for infrastructure
2. Check [TECHNICAL_DETAILS.md](./TECHNICAL_DETAILS.md) for configuration
3. Use [API_REFERENCE.md](./API_REFERENCE.md) for monitoring setup

### For Product Teams
1. Read [README.md](./README.md) for capabilities
2. Review [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) for business concepts
3. Reference [API_REFERENCE.md](./API_REFERENCE.md) for integration

### For Security Reviews
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) security section
2. Review [TECHNICAL_DETAILS.md](./TECHNICAL_DETAILS.md) security considerations
3. Examine [DEPLOYMENT.md](./DEPLOYMENT.md) security configuration

## Service Information

- **Repository**: [cvent-internal/passkey-screenshot-service](https://github.com/cvent-internal/passkey-screenshot-service)
- **Language**: TypeScript
- **Platform**: Node.js 18
- **Framework**: Express.js
- **Infrastructure**: AWS ECS/Fargate
- **Monitoring**: Datadog
- **Team**: Passkey Platform Team

## Key Features

- 🖼️ **Web Screenshot Capture**: Full-page screenshots using Puppeteer
- 🔒 **Domain Security**: Restricted to approved Passkey domains
- 💾 **S3 Caching**: Persistent screenshot storage and retrieval
- 🔄 **Dynamic Resizing**: On-demand image processing
- ⚡ **Concurrency Control**: Resource management with semaphores
- 🔐 **HTTPS Support**: Secure communication with SSL
- 📊 **Health Monitoring**: Built-in health checks and observability

## Getting Started

```bash
# Clone repository
git clone https://github.com/cvent-internal/passkey-screenshot-service.git

# Install dependencies
pnpm install

# Start development server
cd packages/service
pnpm dev

# Test the service
curl -k "https://localhost:7443/local/ok"
```

## Support

- **Team Slack**: #passkey-team
- **Documentation Issues**: Create GitHub issue
- **Code Questions**: Submit pull request for review
- **Architecture Discussions**: Contact senior developers

---

*Last Updated: December 2024*
*Documentation Version: 1.0*