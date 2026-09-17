---
name: "passkey-repo-clamav-service"
description: "Provides malware detection capabilities for file uploads in Passkey applications. Built as an AWS CDK application, it deploys a ClamAV daemon service running on AWS ECS Fargate with network load balancing and comprehensive monitoring to scan uploaded files before processing or storage. Use when working with: the passkey-clamav repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-clamav`
- **Type**: AWS CDK/TypeScript Containerized Service
- **Owner**: Not specified in docs
- **DB**: None (Stateless Service)
- **Registry ID**: Not specified in docs

## What This Service Does
Provides malware detection capabilities for file uploads in Passkey applications. Built as an AWS CDK application, it deploys a ClamAV daemon service running on AWS ECS Fargate with network load balancing and comprehensive monitoring to scan uploaded files before processing or storage.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Antivirus Scanning | Malware detection capabilities for uploaded files |
| ClamAV Integration | Official ClamAV antivirus engine for reliable malware detection |
| Containerized Deployment | Docker container running on AWS ECS Fargate |
| Network Load Balancer | High-availability access through AWS Network Load Balancer |
| Auto-scaling | Automatic scaling based on demand with configurable capacity |
| Virus Definition Updates | Automatic updates via FreshClam |
| Malware Detection | Identification of malicious software in uploaded files |
| File Upload Security | Security scanning before file processing or storage |
| ECS Fargate | AWS container orchestration platform |
| ClamAV Daemon | Background service running ClamAV antivirus engine |

## Architecture at a Glance
```
passkey-clamav/
├── AWS CDK Infrastructure
├── Docker Container (ClamAV)
├── ECS Fargate Service
├── Network Load Balancer
└── Monitoring & Logging

File Uploads → Passkey Services → ClamAV Service → Malware Detection → Response
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| ClamAV Daemon | `Port 3310` | ClamAV daemon protocol for file scanning |
| Health Checks | `ECS Integration` | Service health monitoring |
| Virus Scanning | `TCP Protocol` | File content scanning for malware |

## Key Business Rules
- All uploaded files must be scanned for malware before processing or storage
- ClamAV daemon runs on port 3310 using standard ClamAV protocol
- Service automatically scales based on demand with configurable min/max capacity
- Virus definitions are automatically updated via FreshClam
- Containerized deployment ensures scalability and reliability
- Network Load Balancer provides high-availability access
- Multi-environment support enables deployment across AWS accounts and regions
- Comprehensive monitoring and logging through Datadog integration
- Service is stateless and does not store scanned files

## Service Dependencies

| Service | Purpose |
|---------|---------|
| AWS ECS Fargate | Container orchestration platform |
| AWS Network Load Balancer | Load balancing and high availability |
| Datadog | Monitoring, logging, and alerting |
| ClamAV | Open-source antivirus engine |
| FreshClam | Virus definition updates |
| Passkey File Upload Services | Primary consumers of scanning service |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — ClamAV protocol and usage documentation
- `docs/ARCHITECTURE.md` — System design and components
- `docs/DOMAIN_MODEL.md` — Core concepts and terminology
- `docs/TECHNICAL_DETAILS.md` — Technology stack and configuration
- `docs/DEPLOYMENT.md` — Infrastructure and deployment processes
- `docs/DEVELOPMENT.md` — Local development and contribution guide

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-clamav` to browse:
- `lib/` — AWS CDK infrastructure code
- `docker/` — Docker container configuration
- `src/` — Service implementation
- `catalog-info.yaml` — Backstage service metadata
