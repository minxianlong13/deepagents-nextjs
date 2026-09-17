---
name: "passkey-repo-gdpr-app"
description: "A TypeScript-based infrastructure project that provides GDPR compliance functionality for the Passkey platform. Manages AWS infrastructure and Lambda functions to handle GDPR-related operations including data processing, scheduling, and authorization. Use when working with: the passkey-gdpr-app repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-gdpr-app`
- **Type**: TypeScript AWS CDK Infrastructure
- **Owner**: Passkey Team (`#passkey`)
- **DB**: None (Infrastructure/Lambda)
- **Registry ID**: passkey-gdpr-app

## What This Service Does
A TypeScript-based infrastructure project that provides GDPR compliance functionality for the Passkey platform. Manages AWS infrastructure and Lambda functions to handle GDPR-related operations including data processing, scheduling, and authorization.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| GDPR Compliance | General Data Protection Regulation compliance for data privacy |
| Data Processing | Automated workflows for handling personal data requests |
| Scheduled Tasks | Automated compliance operations on defined schedules |
| API Authorization | Security layer for GDPR operation access control |
| Lambda Functions | Serverless functions for GDPR data processing |
| Infrastructure as Code | CDK-based AWS resource management |
| Data Subject Rights | Individual rights under GDPR (access, deletion, portability) |
| Personal Data | Any information relating to identified individuals |

## Architecture at a Glance
```
passkey-gdpr-app/
├── packages/
│   ├── gdpr-lambda/          # Lambda functions for GDPR operations
│   ├── gdpr-scheduler/       # Scheduled compliance tasks
│   ├── gdpr-auth/           # Authorization for GDPR operations
│   └── infra/               # CDK infrastructure definitions
├── tools/                   # Build and development tools
└── nx.json                 # Nx workspace configuration
```

## API Surface

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| Lambda Functions | GDPR data processing | Serverless execution, event-driven |
| Scheduler | Automated compliance tasks | Periodic execution, task orchestration |
| Authorization API | Access control | Token-based auth, role validation |
| Infrastructure | AWS resource management | CDK v2, IaC deployment |

## Key Business Rules
- GDPR compliance requires automated data processing workflows
- Scheduled tasks ensure regular compliance operations
- API authorization protects sensitive GDPR operations
- Lambda functions provide scalable serverless execution
- Infrastructure as Code ensures consistent deployments
- Data subject rights must be honored within legal timeframes
- Personal data processing requires proper authorization
- Compliance tasks must be auditable and traceable

## Service Dependencies

| Service | Purpose |
|---------|---------|
| AWS Lambda | Serverless function execution |
| AWS EventBridge | Scheduled task orchestration |
| AWS CDK | Infrastructure deployment |
| Passkey Data Services | Source data for GDPR operations |
| Auth Service | Authentication and authorization |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-gdpr-app` to browse:
- `packages/gdpr-lambda/` — Lambda function implementations
- `packages/gdpr-scheduler/` — Scheduled task definitions
- `packages/gdpr-auth/` — Authorization logic
- `packages/infra/` — CDK infrastructure code
- `catalog-info.yaml` — Backstage service metadata
