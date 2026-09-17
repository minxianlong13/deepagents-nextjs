---
name: "passkey-repo-database-service"
description: "Manages the Oracle database infrastructure for Cvent's Passkey hotel booking platform, providing both OLTP (Online Transaction Processing) and OLAP (Online Analytical Processing) database environments with automated deployment capabilities. Use when working with: the passkey-database repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-database`
- **Type**: Oracle Database Infrastructure
- **Owner**: Passkey Team (`#passkey`)
- **DB**: Oracle (OLTP + OLAP)
- **Registry ID**: passkey-database

## What This Service Does
Manages the Oracle database infrastructure for Cvent's Passkey hotel booking platform, providing both OLTP (Online Transaction Processing) and OLAP (Online Analytical Processing) database environments with automated deployment capabilities.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| OLTP Database | Online Transaction Processing for real-time operations |
| OLAP Database | Online Analytical Processing for reporting and analytics |
| Dual Database Architecture | Separate TXN and BI databases for different workloads |
| Liquibase | Database change management and version control |
| Schema Management | Organized database structure with role-based access |
| Multi-Environment | Alpha, IT50, Dev, Staging, UAT, Production support |
| Feature-Based Development | Structured approach to database changes |
| Automated Deployments | Jenkins CI/CD pipeline for database updates |
| Rollback Capabilities | Ability to revert database changes |
| Role-Based Access | Security model with different permission levels |

## Architecture at a Glance
```
passkey-database/
├── schemas/
│   ├── oltp/                 # Transaction processing schemas
│   ├── olap/                # Analytical processing schemas
│   └── shared/              # Common database objects
├── liquibase/
│   ├── changesets/          # Database change definitions
│   ├── rollback/           # Rollback scripts
│   └── environments/       # Environment-specific configs
├── scripts/
│   ├── deployment/         # Deployment automation
│   └── maintenance/        # Database maintenance tasks
└── jenkins/                # CI/CD pipeline definitions
```

## API Surface

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| OLTP Schemas | Transaction processing | Real-time booking, reservation data |
| OLAP Schemas | Analytics processing | Reporting, data warehouse operations |
| Liquibase Scripts | Change management | Version control, automated deployments |
| Deployment Scripts | Automation | Environment provisioning, updates |
| Maintenance Tools | Operations | Backup, monitoring, optimization |

## Key Business Rules
- Dual database architecture separates transactional and analytical workloads
- Multi-environment support enables development lifecycle management
- Liquibase provides automated and repeatable database deployments
- Schema organization follows role-based access control principles
- Feature-based development enables structured change management
- Rollback capabilities ensure safe deployment practices
- Automated deployments reduce manual errors and deployment time
- Environment-specific configurations support different deployment targets
- Database changes are version controlled and auditable
- Comprehensive testing ensures database integrity across environments

## Service Dependencies

| Service | Purpose |
|---------|---------|
| Oracle Database | Primary database platform for OLTP and OLAP |
| Liquibase | Database change management and deployment |
| Jenkins | CI/CD pipeline for automated deployments |
| Passkey Microservices | Consumers of database services |
| Monitoring Tools | Database performance and health monitoring |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-database` to browse:
- `schemas/` — Database schema definitions
- `liquibase/` — Change management scripts
- `scripts/` — Deployment and maintenance automation
- `jenkins/` — CI/CD pipeline configurations
- `catalog-info.yaml` — Backstage service metadata
