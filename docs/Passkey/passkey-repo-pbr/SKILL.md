---
name: "passkey-repo-pbr-cdk"
description: "Provides infrastructure as code for managing custom domain routing for Passkey survey services. Creates and manages API Gateway infrastructure to route survey requests through branded domains like `pbr.passkey.com` to the underlying passkey-pbr-survey-wrapper service. Use when working with: the passkey-pbr repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-pbr`
- **Type**: TypeScript AWS CDK Application
- **Owner**: Passkey Team (`#passkey`)
- **DB**: None (Infrastructure only)
- **Registry ID**: Not specified

## What This Service Does
Provides infrastructure as code for managing custom domain routing for Passkey survey services. Creates and manages API Gateway infrastructure to route survey requests through branded domains like `pbr.passkey.com` to the underlying passkey-pbr-survey-wrapper service.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| PBR | Public Block Request - system for managing public-facing survey endpoints |
| Custom Domain | Branded domain name (e.g., pbr.passkey.com) for clean survey URLs |
| API Gateway | AWS proxy service routing HTTP requests to backend services |
| HTTP Integration | Transparent proxy forwarding requests without transformation |
| Hogan | Cvent's configuration management service for environment-specific data |
| Deployment Target | Environment identifier (pr50, ct50, it50) for infrastructure deployment |
| CDK Stack | Unit of deployment containing related AWS resources |
| Regional Endpoint | API Gateway endpoint deployed in specific AWS region |

## Architecture at a Glance
```
packages/passkey-pbr-cdk/
├── lib/
│   ├── application.ts          # Main CDK app orchestrator
│   └── api-gateway-stack.ts    # AWS infrastructure definition
├── bin/                        # Environment-specific entry points
└── test/                       # CDK unit tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Survey Routing | `/survey` | GET - Route to backend survey service |
| Health Check | `/` | GET - Basic connectivity verification |

## Key Business Rules
- Custom domains provide branded URLs instead of exposing internal AWS endpoints
- All requests are transparently proxied to backend services without transformation
- Environment-specific configurations are managed through Hogan service
- SSL certificates are automatically managed through AWS Certificate Manager
- Legacy URL patterns are supported for backward compatibility

## Service Dependencies
| Service | Purpose |
|---------|---------|
| passkey-pbr-survey-wrapper | Backend Java service handling survey logic |
| Hogan Configuration Service | Environment-specific configuration data |
| AWS Certificate Manager | SSL certificate management |
| AWS API Gateway | HTTP routing and proxy functionality |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-pbr` to browse:
- `packages/passkey-pbr-cdk/lib/` — CDK application and stack definitions
- `packages/passkey-pbr-cdk/bin/` — Environment-specific deployment scripts
- `packages/passkey-pbr-cdk/test/` — CDK unit tests
- `catalog-info.yaml` — Backstage service metadata
