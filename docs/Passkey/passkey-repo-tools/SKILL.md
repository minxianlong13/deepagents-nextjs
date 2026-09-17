---
name: "passkey-repo-tools"
description: "Passkey Tools is a comprehensive Python CLI utility suite that streamlines development and operational tasks for the Passkey platform. It provides developers and operations teams with unified interfaces to interact with passkey services, AWS infrastructure, payment systems, and development workflows. Use when working with: the passkey-tools repository; PBB, Reservation Engine, Service Management, Release Automation, Octopus."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-tools`
- **Type**: Python CLI Utility Suite
- **Owner**: steakholders team (`#passkey-api`)
- **DB**: None (CLI tool)
- **Registry ID**: passkey-tools

## What This Service Does
Passkey Tools is a comprehensive Python CLI utility suite that streamlines development and operational tasks for the Passkey platform. It provides developers and operations teams with unified interfaces to interact with passkey services, AWS infrastructure, payment systems, and development workflows.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **PBB** | Payment Business Backend - payment processing system |
| **Reservation Engine** | Core reservation management system |
| **Service Management** | Query and monitor passkey services across environments |
| **Release Automation** | Automated deployment and release management |
| **Octopus** | Deployment orchestration platform |
| **Datadog Integration** | Monitoring and log analysis capabilities |
| **GitHub Tools** | Pull request and repository management features |
| **Backstage API** | Service catalog and API key management |
| **Environment Config** | Multi-environment configuration management |
| **CLI Commands** | Command-line interface for all operations |

## Architecture at a Glance
```
passkey-tools/
├── bin/                   # Executable scripts
├── pylibs/               # Python library modules
│   ├── commands/         # CLI command implementations
│   ├── services/         # Service integration modules
│   └── utils/            # Utility functions
├── docs/                 # Documentation and guides
├── config.example.yaml   # Configuration template
└── logs.example.yml      # Datadog log query definitions
```

## API Surface
| Command Group | Base Command | Key Operations |
|---------------|--------------|----------------|
| **Service Management** | `passkey service` | list, info, status monitoring |
| **Payment Operations** | `passkey pbb` | payment queries, refund tracking |
| **Reservation Management** | `passkey reservation` | reservation lookup, summaries |
| **GitHub Integration** | `passkey github` | pull request management |
| **Release Management** | `passkey release` | deployment automation |
| **AWS Operations** | `passkey aws` | infrastructure interaction |

## Key Business Rules
- All operations require proper authentication tokens (Octo, GitHub, Jenkins, Datadog)
- Configuration files must be stored in `~/.passkey/` directory
- Service queries respect environment-specific endpoints and credentials
- Payment operations require PBB system access and proper authorization
- GitHub operations are limited by user permissions and repository access
- Release operations follow established CI/CD pipeline workflows
- Datadog queries are limited by configured application keys and permissions

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **All Passkey Services** | Service monitoring and management |
| **AWS Infrastructure** | Cloud resource interaction |
| **GitHub API** | Repository and workflow management |
| **Jenkins CI/CD** | Build and deployment pipeline |
| **Datadog** | Monitoring and log analysis |
| **Octopus Deploy** | Release orchestration |
| **Backstage** | Service catalog integration |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full command docs with parameters, examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns
- `docs/DOMAIN_MODEL.md` — Complete command definitions, workflows
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, configuration
- `docs/DEPLOYMENT.md` — Installation and setup procedures
- `docs/DEVELOPMENT.md` — Local development and contribution guide

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-tools` to browse:
- `pylibs/` — Python library implementations
- `bin/` — Executable scripts and entry points
- `config.example.yaml` — Configuration template
- `Pipfile` — Python dependencies
- `catalog-info.yaml` — Backstage service metadata
