# Technical Details

## Technology Stack
- **Language**: Python 3.x
- **CLI Framework**: Click
- **Dependency Management**: Pipenv
- **Version Management**: asdf
- **AWS SDK**: boto3
- **HTTP Client**: requests
- **Data Processing**: pandas, tabulate
- **Configuration**: PyYAML

## Dependencies

### Core Dependencies (from Pipfile)
- **requests**: HTTP client for API interactions
- **click**: Command-line interface framework
- **boto**: AWS SDK for Python (legacy)
- **awslogs**: AWS CloudWatch logs integration
- **tabulate**: Table formatting for output
- **munch**: Dictionary-like object access
- **pyyaml**: YAML configuration parsing
- **python-dateutil**: Date/time parsing utilities
- **jira**: JIRA API client
- **datadog-api-client**: Datadog monitoring integration
- **jsonpath-ng**: JSON path queries

### Development Dependencies
- Standard Python development tools
- No additional dev-specific packages in current Pipfile

## Configuration

### Environment Variables
- `AWS_PROFILE`: AWS profile for authentication
- `PASSKEY_CONFIG`: Override default configuration path
- `OKTAWS_*`: Oktaws authentication variables

### Configuration Files
- **Main Config**: `~/.passkey/config.yml`
  - API tokens and credentials
  - Environment-specific settings
  - Default command parameters
  - Team and repository caching

- **Log Queries**: `~/.passkey/logs.yml`
  - Predefined Datadog log queries
  - Query templates and filters
  - Environment-specific log sources

### Configuration Structure
```yaml
# Example configuration structure
github:
  token: "github_token_here"
  team:
    name: "team-name"
    members: []
    repositories: []

pbb:
  url: "https://pbb-api-url"
  key: "pbb_api_key"

jenkins:
  url: "https://ci-jenkins.core.cvent.org"
  token: "jenkins_token"

datadog:
  api_key: "datadog_api_key"
  app_key: "datadog_app_key"

octo:
  url: "https://octo.core.cvent.org"
  token: "octo_token"
```

## Build System

### Pipenv Configuration
- Uses `Pipfile` for dependency specification
- `Pipfile.lock` ensures reproducible builds
- Python version constraint: `python_version = "3"`
- PyPI as the primary package source

### Version Management
- Uses `.tool-versions` file for asdf compatibility
- Specifies Python version for consistent environments
- Supports multiple Python versions across team

### Package Structure
```
passkey-tools/
├── passkey.py              # Main entry point
├── Pipfile                 # Dependencies
├── Pipfile.lock           # Locked dependencies
├── .tool-versions         # asdf version specification
├── bin/                   # Executable scripts
├── pylibs/                # Core libraries
│   ├── commands/          # CLI commands
│   ├── *.py              # Utility modules
└── config.example.yaml    # Configuration template
```

## Database Integration

### AWS Services
- **DynamoDB**: NoSQL database queries and operations
- **S3**: Service metadata storage and retrieval
- **CloudFormation**: Infrastructure stack management
- **EC2**: Instance information and management
- **Step Functions**: Workflow orchestration

### External APIs
- **GitHub API**: Repository and pull request management
- **Jenkins API**: Build and deployment information
- **Datadog API**: Monitoring and log queries
- **PBB API**: Payment and refund operations
- **Octo API**: Deployment and release management
- **Backstage API**: Service catalog operations

## Authentication & Security

### AWS Authentication
- Uses oktaws for temporary credential management
- Supports multiple AWS profiles
- Automatic credential refresh detection
- Role-based access control

### API Token Management
- Secure token storage in configuration files
- Token rotation and expiration monitoring
- Environment-specific token isolation
- Encrypted storage recommendations

### Security Best Practices
- No hardcoded credentials in source code
- Configuration files excluded from version control
- Token validation and error handling
- Secure API communication over HTTPS

## Monitoring & Logging

### Application Logging
- Colored console output using custom Colors utility
- Error categorization and formatting
- Debug mode support for troubleshooting
- Structured logging for operational insights

### External Monitoring
- Datadog integration for metrics and logs
- Custom query definitions in logs.yml
- Real-time log streaming capabilities
- Alert integration and notification support

### Performance Monitoring
- Command execution timing
- API response time tracking
- Resource usage monitoring
- Error rate and success metrics

## Error Handling

### Exception Management
- Global exception handlers for common errors
- AWS credential expiration detection
- API rate limiting and retry logic
- Graceful degradation for service unavailability

### Error Categories
- **Authentication Errors**: Credential and token issues
- **API Errors**: External service failures
- **Configuration Errors**: Invalid or missing configuration
- **Network Errors**: Connectivity and timeout issues

### Recovery Mechanisms
- Automatic retry for transient failures
- Fallback options for degraded services
- User guidance for common error scenarios
- Detailed error messages with resolution steps

## Development Tools

### Code Quality
- EditorConfig for consistent formatting
- CODEOWNERS for code review assignments
- GitHub integration for collaboration
- Documentation generation with MkDocs

### Testing Strategy
- Integration testing with external services
- Configuration validation testing
- Command-line interface testing
- Mock services for development

### Deployment
- No containerization (direct Python execution)
- PATH-based installation for global access
- Configuration-driven environment management
- Version-controlled release documentation