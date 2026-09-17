---
name: "passkey-repo-gdpr-service"
description: "Provides GDPR compliance functionality for the Passkey platform. Enables search and obfuscation of personal user information upon request, ensuring compliance with GDPR regulations for data privacy and protection through secure data masking and batch processing capabilities. Use when working with: the passkey-gdpr repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-gdpr`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Cherry Pickers Team (`#cherry-pickers`)
- **DB**: DynamoDB (for batch operations)
- **Registry ID**: Not specified in docs

## What This Service Does
Provides GDPR compliance functionality for the Passkey platform. Enables search and obfuscation of personal user information upon request, ensuring compliance with GDPR regulations for data privacy and protection through secure data masking and batch processing capabilities.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Data Obfuscation | Secure masking and anonymization of personal information |
| GDPR Compliance | Adherence to General Data Protection Regulation requirements |
| Batch Processing | Efficient handling of large-scale GDPR requests |
| Personal Data | Any information relating to identifiable individuals |
| Data Masking | Process of hiding original data with modified content |
| Privacy Request | User request for data access, correction, or deletion |
| Audit Trail | Comprehensive logging and tracking of GDPR operations |
| Data Subject | Individual whose personal data is being processed |
| Right to Erasure | GDPR right allowing individuals to request data deletion |
| Data Protection | Safeguarding of personal information from unauthorized access |

## Architecture at a Glance
```
passkey-gdpr/
├── passkey-gdpr-api/           # API contracts and specifications
├── passkey-gdpr-service/       # Main service with REST resources
├── passkey-gdpr-data-access/   # Data access layer
└── passkey-gdpr-shared/        # Shared utilities and models

GDPR Requests → GDPR Service → Data Masking → DynamoDB/External Services
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Data Obfuscation | `/passkey-gdpr/v1/obfuscate` | Secure masking of personal information |
| Batch Processing | `/passkey-gdpr/v1/batch` | Large-scale GDPR request handling |
| Privacy Requests | `/passkey-gdpr/v1/requests` | Individual privacy request processing |
| Audit Operations | `/passkey-gdpr/v1/audit` | Compliance logging and tracking |
| Admin Controls | `/passkey-gdpr/v1/admin` | Administrative service management |
| Data Search | `/passkey-gdpr/v1/search` | Search for personal user information |

## Key Business Rules
- All personal data obfuscation must be secure and irreversible
- Batch processing enables efficient handling of large-scale GDPR requests
- Comprehensive audit trails must be maintained for all GDPR operations
- Integration with external GDPR masking services ensures compliance
- Data subject rights must be respected including access, correction, and erasure
- Privacy requests require proper authentication and authorization
- Data masking must preserve data utility while protecting privacy
- Multi-environment support ensures proper testing before production deployment
- LaunchDarkly feature flags control GDPR functionality rollout

## Service Dependencies

| Service | Purpose |
|---------|---------|
| auth-service | Authentication and authorization |
| gdpr-mask-service | External GDPR masking functionality |
| DynamoDB | Data persistence for batch operations |
| LaunchDarkly | Feature flag management |
| Passkey Platform | Core integration with other microservices |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-gdpr` to browse:
- `passkey-gdpr-service/src/main/java/com/cvent/passkey/gdpr/resources/` — REST endpoints
- `passkey-gdpr-data-access/src/main/java/com/cvent/passkey/gdpr/dao/` — Data access layer
- `passkey-gdpr-shared/src/main/java/com/cvent/passkey/gdpr/model/` — Domain models
- `catalog-info.yaml` — Backstage service metadata
