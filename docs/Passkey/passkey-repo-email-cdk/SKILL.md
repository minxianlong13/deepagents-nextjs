---
name: "passkey-repo-email-cdk"
description: "A comprehensive email processing framework infrastructure built using AWS CDK and TypeScript. Provides a robust, scalable email processing pipeline designed for the Passkey for Hotels platform with automated scheduling, fault tolerance, and comprehensive monitoring. Use when working with: the passkey-email-cdk repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-email-cdk`
- **Type**: AWS CDK Infrastructure (Email Processing)
- **Owner**: Passkey Team (`#passkey`)
- **DB**: DynamoDB + SQS
- **Registry ID**: passkey-email-cdk

## What This Service Does
A comprehensive email processing framework infrastructure built using AWS CDK and TypeScript. Provides a robust, scalable email processing pipeline designed for the Passkey for Hotels platform with automated scheduling, fault tolerance, and comprehensive monitoring.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Email Processing Pipeline | End-to-end workflow for hotel email operations |
| Step Functions Orchestration | AWS service managing complex email workflows |
| Queue-based Processing | SQS FIFO queues for reliable message handling |
| Email Event Scheduling | Automated timing of email delivery |
| Fault-tolerant Delivery | Retry mechanisms for failed email operations |
| Template Processing | Hogan.js integration for dynamic email content |
| Email Task Logs | DynamoDB storage for processing history |
| Email Automation | Automated email workflows for hotel operations |
| Lambda-based Architecture | Modular functions for different processing stages |
| FIFO Queues | First-in-first-out message processing |

## Architecture at a Glance
```
passkey-email-cdk/
├── lib/
│   ├── step-functions/        # Workflow orchestration
│   ├── lambda-functions/      # Email processing functions
│   ├── sqs-queues/           # Message queuing infrastructure
│   ├── dynamodb-tables/      # Email logs and automation data
│   └── email-templates/      # Hogan.js template processing
└── bin/                      # CDK application entry points
```

## API Surface

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| Step Functions | Workflow orchestration | Complex email processing workflows |
| Lambda Functions | Processing stages | Modular email handling functions |
| SQS FIFO Queues | Message processing | Reliable, ordered message handling |
| DynamoDB Tables | Data persistence | Email task logs, automation data |
| Template Engine | Content generation | Hogan.js dynamic email templates |

## Key Business Rules
- Step Functions orchestrate complex email processing workflows
- SQS FIFO queues ensure reliable and ordered message processing
- Lambda functions provide modular processing stages
- DynamoDB stores email task logs and automation data
- Template processing enables dynamic email content generation
- Fault-tolerant delivery includes retry mechanisms for failures
- Email event scheduling automates timing of communications
- Comprehensive logging enables monitoring and troubleshooting
- Scalable architecture handles varying email volumes
- Hotel-specific email operations support hospitality workflows

## Service Dependencies

| Service | Purpose |
|---------|---------|
| AWS Step Functions | Workflow orchestration and state management |
| AWS Lambda | Serverless email processing functions |
| AWS SQS | Message queuing and reliable delivery |
| AWS DynamoDB | Email logs and automation data storage |
| Hogan.js | Email template processing engine |
| Email Delivery Services | Actual email sending infrastructure |
| Passkey Hotel Services | Source data for hotel email operations |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-email-cdk` to browse:
- `lib/` — CDK infrastructure definitions
- `lambda/` — Email processing functions
- `templates/` — Email template definitions
- `bin/` — CDK application entry points
- `catalog-info.yaml` — Backstage service metadata
