# Deployment

## Infrastructure

### CI/CD Platform
- **Primary**: Jenkins with Cvent pipeline-utils library
- **Runner**: ECS x86 medium instances
- **Orchestration**: Nx workspace task runner with CDF integration
- **Artifact Storage**: Nexus Repository Manager

### Cloud Infrastructure
- **Compute**: AWS ECS for build agents
- **Storage**: AWS S3 for build artifacts and cache
- **CDN**: CloudFront for remote cache distribution
- **Registry**: Nexus for NPM package hosting

### Package Distribution
- **Registry**: Nexus Repository (https://nexus.core.cvent.org/nexus/)
- **Scope**: @cvent organization packages
- **Access**: Public within Cvent organization
- **Versioning**: Semantic versioning with Changesets

## Environments

### Development Environment
- **Purpose**: Local development and testing
- **Access**: Developer workstations
- **Configuration**:
  - Node.js 22+ via asdf
  - pnpm 8+ package manager
  - Local Nx cache enabled
  - Hot reload for development

**Setup Commands**:
```bash
# Install version manager
asdf install

# Install dependencies
pnpm install

# Start development mode
pnpm dev
```

### CI Environment
- **Purpose**: Automated testing and validation
- **Platform**: Jenkins on AWS ECS
- **Configuration**:
  - Parallel test execution
  - Remote cache enabled
  - SonarQube integration
  - Security scanning

**Pipeline Stages**:
1. Checkout and setup
2. Install dependencies
3. Affected analysis
4. Parallel build/test/lint
5. Quality gates
6. Artifact generation

### Staging Environment
- **Purpose**: Pre-production validation
- **Access**: Internal testing teams
- **Configuration**:
  - Published packages from CI
  - Integration testing
  - Performance validation
  - User acceptance testing

### Production Environment
- **Purpose**: Live package distribution
- **Access**: All Cvent applications
- **Configuration**:
  - Nexus Repository hosting
  - CDN distribution
  - Version management
  - Usage analytics

## CI/CD Pipeline

### Pipeline Configuration

#### Jenkinsfile
```groovy
#!/usr/bin/env groovy

@Library('pipeline-utils') _

buildPipeline(
  label: 'ecs-x86-medium',
  packageFilter: 'root-only',
  stablePrereleaseId: true,
  skipCacheBehavior: 'remote-only',
  awsUser: 'cdk',
  ci: [
    lock: 'branch' // allow parallel ci builds across branches
  ],
  trunk: 'master',
  release: [
    branches: ['master']
  ],
  slack: [
    [branches: ['master'], channels: ['#passkey-api', '#passkey-steakholders-alerts'], events: ['FAILURE']],
    [branches: ['.*'], channels: ['_owner_']]
  ],
  mend: [
    slack: '#passkey-api'
  ]
)
```

### Build Stages

#### 1. Setup and Checkout
```bash
# Checkout source code
git checkout ${BRANCH_NAME}

# Setup Node.js environment
nvm use $(cat .tool-versions | grep nodejs | cut -d' ' -f2)

# Install pnpm
npm install -g pnpm@8
```

#### 2. Dependency Installation
```bash
# Install dependencies with frozen lockfile
pnpm install --frozen-lockfile

# Verify dependency integrity
pnpm audit --audit-level moderate
```

#### 3. Affected Analysis
```bash
# Determine affected packages
export AFFECTED_PACKAGES=$(nx show projects --affected --base=origin/master)

# Set base for affected commands
export NX_BASE=$(getBaseForNxAffected)
```

#### 4. Quality Checks
```bash
# Parallel execution of quality checks
nx affected ${NX_BASE} --target=lint --parallel=3
nx affected ${NX_BASE} --target=format --parallel=3
nx affected ${NX_BASE} --target=test --parallel=3
```

#### 5. Build and Package
```bash
# Build affected packages
nx affected ${NX_BASE} --target=build --parallel=3

# Generate package artifacts
nx affected ${NX_BASE} --target=package --parallel=3
```

#### 6. Security and Quality Gates
```bash
# SonarQube analysis
nx affected ${NX_BASE} --target=sonar

# Dependency vulnerability check
pnpm audit --audit-level high

# License compliance check
nx affected ${NX_BASE} --target=license-check
```

#### 7. Release (Master Branch Only)
```bash
# Version packages with changesets
pnpm changeset version

# Publish to Nexus
pnpm changeset publish
```

### Branch Strategy

#### Feature Branches
- **Pattern**: `feature/description` or `fix/description`
- **Pipeline**: Full CI pipeline without publishing
- **Merge**: Requires PR approval and passing checks

#### Master Branch
- **Protection**: Branch protection enabled
- **Pipeline**: Full CI/CD with automatic publishing
- **Deployment**: Automatic package release on successful build

#### Release Branches
- **Pattern**: `release/v*.*.*`
- **Purpose**: Hotfix releases and version preparation
- **Pipeline**: Full CI/CD with manual approval gates

### Deployment Triggers

#### Automatic Triggers
- Push to master branch → Full CI/CD pipeline
- Pull request creation → CI validation pipeline
- Dependency updates → Security and compatibility checks

#### Manual Triggers
- Hotfix releases → Manual pipeline execution
- Emergency rollbacks → Manual version revert
- Performance testing → Load test pipeline

## Configuration Management

### Environment Variables

#### CI/CD Environment
```bash
# Build configuration
NODE_ENV=production
NX_CLOUD_ACCESS_TOKEN=${NX_CLOUD_TOKEN}
SONAR_TOKEN=${SONAR_AUTH_TOKEN}

# Publishing configuration
NPM_TOKEN=${NEXUS_NPM_TOKEN}
NPM_REGISTRY=https://nexus.core.cvent.org/nexus/repository/npm-public/

# AWS configuration
AWS_REGION=us-east-1
AWS_ROLE_ARN=${CDK_DEPLOYMENT_ROLE}
```

#### Package Configuration
```json
{
  "publishConfig": {
    "registry": "https://nexus.core.cvent.org/nexus/repository/npm-public/",
    "access": "public"
  }
}
```

### Secrets Management

#### Jenkins Credentials
- `NEXUS_NPM_TOKEN`: NPM authentication token
- `SONAR_AUTH_TOKEN`: SonarQube authentication
- `NX_CLOUD_TOKEN`: Nx Cloud remote cache access
- `SLACK_WEBHOOK`: Notification webhook URLs

#### AWS IAM Roles
- `cdk-deployment-role`: CDK deployment permissions
- `nexus-publisher-role`: Package publishing permissions
- `cache-access-role`: Remote cache read/write access

## Rollback Procedures

### Package Rollback

#### Immediate Rollback
```bash
# Identify problematic version
npm view @cvent/passkey-components versions --json

# Deprecate problematic version
npm deprecate @cvent/passkey-components@1.2.3 "Critical bug - use 1.2.2 instead"

# Publish hotfix version
pnpm changeset version
pnpm changeset publish
```

#### Consumer Application Rollback
```bash
# Update package.json to previous version
npm install @cvent/passkey-components@1.2.2

# Or use version range
npm install @cvent/passkey-components@"~1.2.2"
```

### Build Rollback

#### Pipeline Rollback
```bash
# Revert commit on master
git revert ${COMMIT_SHA}
git push origin master

# Manual pipeline trigger
jenkins-cli build passkey-shared-mono
```

#### Cache Invalidation
```bash
# Clear Nx cache
nx reset

# Clear remote cache
nx clear-cache --remote
```

### Emergency Procedures

#### Critical Bug Response
1. **Immediate**: Deprecate affected package versions
2. **Short-term**: Deploy hotfix with patch version
3. **Communication**: Notify consumers via Slack channels
4. **Long-term**: Root cause analysis and prevention

#### Security Vulnerability Response
1. **Assessment**: Evaluate vulnerability impact
2. **Patching**: Apply security patches immediately
3. **Publishing**: Emergency release with security fix
4. **Notification**: Security advisory to consumers

## Monitoring and Alerting

### Build Monitoring

#### Jenkins Metrics
- Build success/failure rates
- Build duration trends
- Test coverage metrics
- Dependency vulnerability counts

#### Slack Notifications
```yaml
Channels:
  - "#passkey-api": Build failures on master
  - "#passkey-steakholders-alerts": Critical issues
  - "_owner_": All build notifications

Events:
  - Build failures
  - Security vulnerabilities
  - Deployment completions
  - Performance regressions
```

### Package Usage Monitoring

#### Nexus Analytics
- Download statistics
- Version adoption rates
- Consumer application tracking
- Performance metrics

#### Error Tracking
- Package runtime errors
- Integration failures
- Performance issues
- User feedback

### Health Checks

#### Automated Checks
```bash
# Package integrity check
npm pack --dry-run

# Dependency health check
pnpm audit --audit-level moderate

# Build reproducibility check
nx affected --target=build --skip-cache
```

#### Manual Validation
- Smoke tests in staging environment
- Integration tests with consumer applications
- Performance benchmarking
- Security penetration testing

## Disaster Recovery

### Backup Strategy

#### Source Code Backup
- Primary: GitHub repository
- Secondary: Automated Git mirrors
- Retention: Indefinite with branch protection

#### Build Artifacts Backup
- Primary: Nexus Repository
- Secondary: S3 backup storage
- Retention: 2 years for all versions

#### Configuration Backup
- Jenkins job configurations
- AWS infrastructure as code
- Secrets and credentials (encrypted)

### Recovery Procedures

#### Repository Recovery
```bash
# Clone from backup mirror
git clone ${BACKUP_REPOSITORY_URL}

# Restore branch protection rules
gh api repos/:owner/:repo/branches/master/protection --method PUT

# Restore webhook configurations
gh api repos/:owner/:repo/hooks --method POST
```

#### Package Recovery
```bash
# Restore from backup registry
npm publish --registry ${BACKUP_REGISTRY_URL}

# Verify package integrity
npm pack --dry-run

# Update package metadata
npm dist-tag add @cvent/package@version latest
```

#### Infrastructure Recovery
```bash
# Restore Jenkins configuration
jenkins-cli create-job < job-config.xml

# Restore AWS resources
cdk deploy --all

# Restore monitoring and alerting
terraform apply -var-file=monitoring.tfvars
```