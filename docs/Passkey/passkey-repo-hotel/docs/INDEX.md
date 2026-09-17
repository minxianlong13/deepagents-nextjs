# Passkey Hotel Service - Documentation Index

Complete technical documentation for the Passkey Hotel Service, a core microservice in Cvent's Passkey for Hotels platform.

## Quick Links

- **Repository**: [cvent-internal/passkey-hotel](https://github.com/cvent-internal/passkey-hotel)
- **Backstage**: [Service Catalog](https://backstage.core.cvent.org/catalog/default/component/passkey-hotel-service)
- **Datadog**: [Production Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-hotel-service)
- **Jenkins**: [CI/CD Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PA)/job/passkey-hotel)
- **Wiki**: [Hotel Microservice](https://wiki.cvent.com/display/PASKY/Hotel+Microservice)
- **Team**: Cherry Pickers
- **Owner**: boris.bronstien@cvent.com

## Documentation Structure

### 📖 [README.md](./README.md)
**Start here** - Overview, quick start guide, and service introduction.

**Contents**:
- Service overview and purpose
- Key features and capabilities
- Quick start instructions
- Architecture summary
- API overview
- Related services and integrations
- Monitoring and operations links

**Best for**: New team members, quick reference, getting started

---

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
System architecture, design patterns, and module structure.

**Contents**:
- Multi-module Maven project structure
- Component breakdown (6 modules)
- Package organization
- Technology stack (Java 17, Dropwizard, MyBatis)
- Design patterns (Repository, Service Layer, Immutables)
- Data flow and dependencies
- Build configuration and profiles

**Best for**: Understanding system design, architectural decisions, module relationships

---

### 🔌 [API_REFERENCE.md](./API_REFERENCE.md)
Complete REST API endpoint documentation.

**Contents**:
- 35+ REST endpoints across 8 resource classes
- Hotel management APIs (CRUD, search, bulk operations)
- Tax structure management
- Admin operations (cache, testing, system management)
- Organization and participant management
- Special requests and reservation processing
- API versioning (v1, v2)
- Request/response models
- Authentication requirements
- HTTP methods, paths, parameters
- Status codes and error handling

**Best for**: API consumers, integration developers, endpoint reference

---

### 📚 [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)
Domain concepts, business rules, and data models.

**Contents**:
- Core domain entities (Hotel, HotelTax, Organization, Participant)
- Domain glossary (25+ terms)
- Entity relationships and attributes
- Business rules for tax management, children policies, payment processing
- Service layer documentation
- Data Transfer Objects (DTOs)
- MyBatis data access patterns

**Best for**: Understanding business logic, domain concepts, data relationships

---

### ⚙️ [TECHNICAL_DETAILS.md](./TECHNICAL_DETAILS.md)
Technology stack, dependencies, and technical specifications.

**Contents**:
- Complete tech stack (Java 17, Dropwizard, Maven, Oracle DB)
- Dependency analysis from pom.xml (30+ dependencies)
- 6-module Maven architecture
- Code quality tools (Checkstyle, SonarQube, Checkmarx, JaCoCo)
- Database configuration (Oracle JDBC)
- Authentication integration (Cvent auth service)
- Monitoring and observability (Datadog)
- Development environment setup

**Best for**: Technical setup, dependency management, tooling configuration

---

### 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md)
Deployment procedures, infrastructure, and CI/CD.

**Contents**:
- Docker multi-stage build configuration
- Jenkins CI/CD pipeline (6 environments)
- Environment configuration (CI→Alpha→TS50→IT50→SG50→PR50)
- Branch-specific deployments
- Hogan template configuration management
- Database setup and migrations
- Monitoring integration (Datadog, Backstage)
- Security configuration
- Deployment commands and troubleshooting

**Best for**: DevOps, deployment procedures, infrastructure management

---

### 💻 [DEVELOPMENT.md](./DEVELOPMENT.md)
Local development setup, coding standards, and workflows.

**Contents**:
- Prerequisites and environment setup
- Local build and run instructions
- Testing guide (unit, integration, coverage)
- Code structure and organization
- Coding standards and best practices
- Common development tasks (adding endpoints, models, DB changes)
- IDE configuration (IntelliJ, Eclipse)
- Debugging techniques
- Git workflow and PR process
- Troubleshooting guide

**Best for**: Developers, local setup, day-to-day development tasks

---

## Documentation by Role

### 👨‍💻 For Developers
1. Start with [README.md](./README.md) for overview
2. Follow [DEVELOPMENT.md](./DEVELOPMENT.md) for local setup
3. Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand structure
4. Reference [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) for business logic
5. Use [API_REFERENCE.md](./API_REFERENCE.md) for endpoint details

### 🔧 For DevOps/SRE
1. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for infrastructure
2. Check [TECHNICAL_DETAILS.md](./TECHNICAL_DETAILS.md) for dependencies
3. Reference [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

### 📊 For Product/Business
1. Start with [README.md](./README.md) for capabilities
2. Review [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) for business rules
3. Check [API_REFERENCE.md](./API_REFERENCE.md) for features

### 🔌 For Integration Partners
1. Start with [API_REFERENCE.md](./API_REFERENCE.md) for endpoints
2. Review [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) for data models
3. Check [README.md](./README.md) for authentication

## Key Metrics

- **Language**: Java 17
- **Framework**: Dropwizard
- **Modules**: 6 (API, Service, Data Access, Shared, Client, Integration Tests)
- **Endpoints**: 35+ REST endpoints
- **API Versions**: v1, v2
- **Database**: Oracle
- **Test Coverage**: 80%+ target
- **Team**: Cherry Pickers
- **Status**: Production

## Service Information

| Property | Value |
|----------|-------|
| **Service Name** | passkey-hotel-service |
| **Repository** | cvent-internal/passkey-hotel |
| **Owner Team** | Cherry Pickers |
| **Business Unit** | Hospitality |
| **Platform** | Passkey for Hotels |
| **Lifecycle** | Production |
| **Service Registry ID** | 918ebe8a-101a-4736-bec2-aed8881fb312 |
| **Created By** | boris.bronstien@cvent.com |

## Related Documentation

- **Passkey Platform Wiki**: https://wiki.cvent.com/display/PASKY/
- **Hotel Microservice Wiki**: https://wiki.cvent.com/display/PASKY/Hotel+Microservice
- **Maven Setup**: https://wiki/display/DEV/Maven+Setup
- **Dropwizard**: https://www.dropwizard.io/
- **MyBatis**: https://mybatis.org/mybatis-3/
- **Cucumber**: https://cucumber.io/docs/cucumber/

## Support Channels

- **Team Slack**: #cherry-pickers
- **Platform Slack**: #passkey-platform
- **Incidents**: Follow on-call rotation

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for:
- Git workflow and branching strategy
- Coding standards and style guide
- Pull request process
- Testing requirements

---

**Last Updated**: February 2026  
**Documentation Version**: 1.0  
**Service Version**: Check repository for latest version
