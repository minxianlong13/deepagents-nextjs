# Passkey Planners NG Documentation

Welcome to the comprehensive documentation for the Passkey Planner Portal, a next-generation event planners dashboard for managing hotel reservations and housing logistics.

## Documentation Overview

This documentation provides complete technical and operational information for developers, operators, and stakeholders working with the Passkey Planner Portal.

## Quick Navigation

### 📋 [README](README.md)
**Start here** - Overview, purpose, key features, and quick start guide for the Passkey Planner Portal.

### 🏗️ [Architecture](ARCHITECTURE.md)
System design, components, data flow, and architectural patterns used in the application.

### 🔌 [API Reference](API_REFERENCE.md)
Complete endpoint documentation including request/response formats, authentication, and error handling.

### 📊 [Domain Model](DOMAIN_MODEL.md)
Business entities, relationships, glossary of terms, and business rules governing the system.

### ⚙️ [Technical Details](TECHNICAL_DETAILS.md)
Technology stack, dependencies, configuration, database schema, and performance optimization.

### 🚀 [Deployment](DEPLOYMENT.md)
Infrastructure, environments, CI/CD pipeline, configuration management, and rollback procedures.

### 💻 [Development](DEVELOPMENT.md)
Local setup, development workflow, coding standards, troubleshooting, and common tasks.

---

## Repository Information

- **Repository**: [cvent-internal/passkey-planners-ng](https://github.com/cvent-internal/passkey-planners-ng)
- **Primary Language**: Java
- **Framework**: Spring Framework with WildFly
- **Team**: cherry-pickers
- **Business Unit**: Hospitality
- **Platform**: Passkey

## Key Links

- **Jenkins CI/CD**: [Build Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PAS)/job/passkey-planners-ng)
- **Octopus Deploy**: [Deployment Dashboard](https://octo.core.cvent.org/app#/Spaces-1/projects/planner-portal/deployments)
- **Monitoring**: [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-planner-portal)
- **Code Quality**: [SonarQube Analysis](https://sonar.core.cvent.org)
- **Testing**: [Bluecumber Tests](https://qe-jenkins.core.cvent.org/job/Passkey_Bluecumber) (tags: `@planner-portal`)

## Getting Started

1. **New to the project?** Start with the [README](README.md) for an overview
2. **Setting up locally?** Follow the [Development Guide](DEVELOPMENT.md)
3. **Understanding the system?** Review the [Architecture](ARCHITECTURE.md)
4. **Integrating with APIs?** Check the [API Reference](API_REFERENCE.md)
5. **Deploying changes?** Consult the [Deployment Guide](DEPLOYMENT.md)

## Documentation Maintenance

This documentation is maintained alongside the codebase and should be updated when:
- New features are added
- APIs are modified
- Architecture changes occur
- Deployment procedures change
- Development workflows are updated

For questions or updates to this documentation, please contact the cherry-pickers team or create an issue in the repository.

---

*Last updated: January 2024*