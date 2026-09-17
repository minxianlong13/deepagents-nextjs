# Deployment

## Infrastructure
AWS-based via CDK (`packages/infra/`). CDF (Cvent Development Framework) manages the deployment pipeline. Docker containers deployed to ECS.

## Environments
| Environment | Code | Purpose |
|---|---|---|
| Dev | `dev` | Local development |
| Staging | `ts50`, `sg50` | Pre-production testing. `sg50` has Datadog profiling enabled |
| Integration | `ct50` | Integration testing (uses production reporting-service URLs) |
| Production | `pr50`, `pr51` | Production |

## CI/CD Pipeline
- **CI**: Jenkins (`Jenkinsfile`) using `pipeline-utils` library
  - Build label: `ecs-x86-xlarge`
  - Package filter: `root-only`
  - Parallel CI builds across branches (`lock: 'branch'`)
  - Release branches: `master`, `release/.*`, `hotfix/.*`
  - Publish branches: `development`, `master`
- **Deploy**: Octopus Deploy (project: `passkey-rdk2-app`)
- **Slack Notifications**: `#passkey-api` for master/development, `_owner_` for all branches
- **Scheduled Tests**:
  - `ts50`: Tuesdays 2am (excluding `@ignore` and `@pvt_Karate`)
  - `pr50`: Mon-Fri 3am (`@pvt_Karate` only) → `#passkey-api-pvt-results`

## CDK Infrastructure
```
packages/infra/
├── lib/
│   ├── Application.ts    # Main CDK app definition
│   ├── commonProps.ts     # Shared stack properties
│   └── tags.ts            # Resource tagging
└── bin/                   # CDK entry points
```

### CDK Commands
```bash
# Diff against deployed environments
pnpm -- cdk -a 'cdk.out/sg50' diff
pnpm -- cdk -a 'cdk.out/ts50' diff
pnpm -- cdk -a 'cdk.out/pr50' diff

# Allow/deny infra updates
pnpm allow:staging      # ts50/sg50
pnpm allow:integration  # ct50
pnpm allow:production   # pr50/pr51
pnpm deny:staging
pnpm deny:integration
pnpm deny:production
```

## Configuration Management
- Hogan templates (`.env.template`) resolve environment-specific values at deploy time
- AWS Secrets Manager (`@aws-sdk/client-secrets-manager`) for secrets
- AWS SSM Parameter Store (`@aws-sdk/client-ssm`) for config parameters
- Oktaws for AWS credential management (profile: `cvent-passkey-dev`)

## Rollback Procedures
- Use Octopus Deploy's rollback feature to redeploy previous version
- CDK dry run via `pnpm -- cdk -a 'cdk.out/{env}' diff` before deploying
