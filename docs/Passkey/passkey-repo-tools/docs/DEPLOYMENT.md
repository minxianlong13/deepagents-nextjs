# Deployment

## Infrastructure
Passkey Tools is deployed as a local development utility rather than a centralized service. Each developer installs and configures the tool on their local machine or development environment.

### Deployment Model
- **Local Installation**: Direct Python package installation
- **No Containerization**: Runs directly on host Python environment
- **Configuration-Based**: Environment-specific settings via YAML files
- **PATH Integration**: Optional global command access

## Environments

### Development Environment
- **Purpose**: Local developer workstations
- **Installation**: Manual setup via git clone and pipenv
- **Configuration**: Personal `~/.passkey/config.yml`
- **Authentication**: Individual developer credentials
- **Usage**: Direct command-line execution

### Team Environment
- **Purpose**: Shared team resources and configurations
- **Installation**: Standardized setup procedures
- **Configuration**: Team-specific defaults and shared queries
- **Authentication**: Team-based API tokens
- **Usage**: Collaborative development workflows

### CI/CD Integration
- **Purpose**: Automated build and release processes
- **Installation**: Pipeline-based setup
- **Configuration**: Environment-specific tokens
- **Authentication**: Service account credentials
- **Usage**: Automated release and deployment tasks

## Installation Process

### Prerequisites Installation
```bash
# Install asdf version manager
git clone https://github.com/asdf-vm/asdf.git ~/.asdf
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc

# Add Python plugin
asdf plugin add python

# Install Python version
asdf install python 3.11.0
asdf global python 3.11.0
```

### Tool Installation
```bash
# Clone repository
git clone https://github.com/cvent-internal/passkey-tools.git
cd passkey-tools

# Install Python version from .tool-versions
asdf install

# Install pipenv
python -m pip install pipenv

# Install dependencies
python -m pipenv install

# Setup configuration
mkdir -p ~/.passkey
cp config.example.yaml ~/.passkey/config.yml
cp logs.example.yml ~/.passkey/logs.yml
```

### PATH Configuration
```bash
# Add to shell profile (.bashrc, .zshrc, etc.)
export PATH="$PATH:/path/to/passkey-tools/bin"

# Or create symlink
ln -s /path/to/passkey-tools/bin/passkey /usr/local/bin/passkey
```

## Configuration Management

### Environment-Specific Configuration
Each environment requires specific configuration values:

**Development**:
```yaml
# ~/.passkey/config.yml
environment: alpha
aws_profile: passkey-dev
github:
  token: "dev_github_token"
pbb:
  url: "https://pbb-alpha.cvent.com"
  key: "alpha_pbb_key"
```

**Production**:
```yaml
# ~/.passkey/config.yml
environment: prod
aws_profile: passkey-prod
github:
  token: "prod_github_token"
pbb:
  url: "https://pbb-prod.cvent.com"
  key: "prod_pbb_key"
```

### Token Management
- **GitHub Tokens**: Personal access tokens with appropriate scopes
- **AWS Credentials**: Managed via oktaws and AWS profiles
- **API Keys**: Service-specific tokens stored in configuration
- **Rotation**: Manual token rotation based on expiration policies

### Configuration Validation
```bash
# Validate configuration
passkey --help  # Should show all available commands

# Test AWS connectivity
passkey service list

# Test GitHub integration
passkey github pull-requests

# Test PBB connectivity
passkey pbb merchant <test-merchant-id>
```

## CI/CD Pipeline

### Build Process
The tool doesn't require a traditional build process but follows these steps:

1. **Code Checkout**: Clone repository from GitHub
2. **Dependency Installation**: Run `pipenv install`
3. **Configuration Setup**: Deploy environment-specific config files
4. **Testing**: Execute integration tests against target environments
5. **Documentation**: Generate and deploy documentation

### Release Process
```bash
# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Update documentation
mkdocs build
mkdocs gh-deploy

# Notify team of new release
# Update installation instructions
```

### Deployment Automation
```yaml
# Example GitHub Actions workflow
name: Deploy Passkey Tools
on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install pipenv
          pipenv install
      - name: Run tests
        run: pipenv run python -m pytest
      - name: Build documentation
        run: |
          pip install mkdocs
          mkdocs build
```

## Rollback Procedures

### Version Rollback
```bash
# Rollback to previous version
git checkout v1.0.0  # Previous stable version
pipenv install       # Reinstall dependencies

# Or use git to revert specific commits
git revert <commit-hash>
```

### Configuration Rollback
```bash
# Backup current configuration
cp ~/.passkey/config.yml ~/.passkey/config.yml.backup

# Restore previous configuration
cp ~/.passkey/config.yml.previous ~/.passkey/config.yml

# Validate configuration
passkey service list
```

### Emergency Procedures
1. **Service Outage**: Switch to manual processes or alternative tools
2. **Authentication Issues**: Regenerate tokens and update configuration
3. **API Changes**: Update client code and redeploy
4. **Configuration Corruption**: Restore from backup or recreate from template

## Monitoring & Health Checks

### Installation Verification
```bash
# Check Python environment
python --version
pipenv --version

# Verify tool installation
passkey --version
passkey --help

# Test core functionality
passkey service list --environment alpha
```

### Operational Monitoring
- **Command Success Rates**: Track successful vs failed command executions
- **API Response Times**: Monitor external service response times
- **Error Patterns**: Identify common failure modes
- **Usage Analytics**: Track most-used commands and features

### Alerting
- **Token Expiration**: Automated alerts for expiring API tokens
- **Service Availability**: Monitoring of dependent services
- **Configuration Issues**: Validation of configuration files
- **Version Updates**: Notifications of new releases and updates

## Security Considerations

### Credential Management
- Store sensitive tokens in secure configuration files
- Use environment-specific credentials
- Implement token rotation procedures
- Avoid committing credentials to version control

### Access Control
- Limit tool access to authorized team members
- Use principle of least privilege for API tokens
- Implement audit logging for sensitive operations
- Regular access reviews and cleanup

### Network Security
- Use HTTPS for all API communications
- Validate SSL certificates
- Implement proper timeout and retry mechanisms
- Monitor for suspicious network activity