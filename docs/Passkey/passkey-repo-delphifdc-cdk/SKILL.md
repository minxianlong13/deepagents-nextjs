---
name: "passkey-repo-delphifdc-cdk"
description: "An AWS CDK project that provisions and manages AWS infrastructure for the passkey-delphifdc-service. Creates DynamoDB tables and IAM roles necessary for the Delphi.fdc (File Data Collector) component with automated infrastructure provisioning. Use when working with: the passkey-delphifdc-cdk repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-delphifdc-cdk`
- **Type**: AWS CDK Infrastructure (DynamoDB + IAM)
- **Owner**: Passkey Team (`#passkey`)
- **DB**: DynamoDB
- **Registry ID**: passkey-delphifdc-cdk

## What This Service Does
An AWS CDK project that provisions and manages AWS infrastructure for the passkey-delphifdc-service. Creates DynamoDB tables and IAM roles necessary for the Delphi.fdc (File Data Collector) component with automated infrastructure provisioning.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Delphi.fdc | File Data Collector component for Passkey platform |
| DynamoDB Tables | NoSQL storage for tasks, notifications, history, and errors |
| IAM Roles | Identity and access management for ECS tasks |
| Multi-Environment | Support for CI, Alpha, CT50, IT50, PR50, PR51, SG50, TS50 |
| TTL Configuration | Time-to-live attributes for automatic data cleanup |
| ECS Task Roles | Execution roles for containerized applications |
| Least-Privilege Access | Minimal required permissions for security |
| Infrastructure as Code | CDK-based automated resource provisioning |

## Architecture at a Glance
```
passkey-delphifdc-cdk/
├── lib/
│   ├── dynamodb-stack.ts      # DynamoDB table definitions
│   ├── iam-stack.ts          # IAM roles and policies
│   └── ttl-config.ts         # Time-to-live configurations
├── bin/
│   └── delphifdc-app.ts      # CDK application entry point
└── config/                   # Environment-specific configurations
```

## API Surface

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| DynamoDB Tables | Data storage | Tasks, notifications, history, errors |
| IAM Roles | Access control | ECS task execution, DynamoDB permissions |
| TTL Attributes | Data lifecycle | Automatic cleanup of expired records |
| Multi-Environment | Deployment targets | Support for 8 different environments |

## Key Business Rules
- Four core DynamoDB tables support file data collection operations
- IAM roles follow least-privilege principle for security
- TTL configuration enables automatic data cleanup
- Multi-environment support ensures consistent deployments
- ECS task roles provide appropriate DynamoDB access
- Infrastructure provisioning is automated and repeatable
- Environment-specific configurations support different deployment targets
- CDK ensures infrastructure consistency across environments

## Service Dependencies

| Service | Purpose |
|---------|---------|
| AWS DynamoDB | NoSQL data storage for tasks and notifications |
| AWS IAM | Identity and access management |
| AWS ECS | Container execution platform |
| AWS CDK | Infrastructure as code framework |
| passkey-delphifdc-service | Consumer of provisioned infrastructure |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-delphifdc-cdk` to browse:
- `lib/` — CDK infrastructure stack definitions
- `bin/` — CDK application entry points
- `config/` — Environment-specific configurations
- `catalog-info.yaml` — Backstage service metadata
