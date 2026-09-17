# Architecture

## System Overview
Passkey Tools follows a modular CLI architecture built on Python's Click framework. The system is designed as a collection of command modules that interact with various external services and APIs to provide a unified development experience for the passkey platform.

## Components

### Core CLI Framework
- **Purpose**: Main entry point and command orchestration
- **Location**: `passkey.py`
- **Key Classes**: Click-based command groups and error handling

### Command Modules
- **Purpose**: Individual CLI command implementations
- **Location**: `pylibs/commands/`
- **Key Classes**: 
  - `service.py` - AWS service management
  - `github.py` - GitHub integration
  - `pbb.py` - Payment system queries
  - `reservation.py` - Reservation management
  - `release.py` - Release automation
  - `backstage.py` - Service catalog operations
  - `monitor.py` - Monitoring and alerting
  - `logs.py` - Log analysis and queries

### Core Libraries
- **Purpose**: Shared utilities and API clients
- **Location**: `pylibs/`
- **Key Classes**:
  - `aws.py` - AWS service interactions
  - `api.py` - HTTP client utilities
  - `config.py` - Configuration management
  - `git.py` - Git operations
  - `octopus.py` - Octo API client
  - `pbb.py` - Payment backend client
  - `reservations.py` - Reservation API client

### Configuration System
- **Purpose**: Centralized configuration management
- **Location**: `~/.passkey/config.yml`
- **Key Features**: Environment-specific settings, API tokens, default values

## Data Flow

### Command Execution Flow
1. User invokes CLI command via `passkey.py`
2. Click framework routes to appropriate command module
3. Command module loads configuration from `~/.passkey/config.yml`
4. Module uses appropriate library (aws.py, api.py, etc.) to interact with external services
5. Results are formatted and displayed to user

### Configuration Loading
1. Default configuration loaded from `config.example.yaml`
2. User-specific overrides loaded from `~/.passkey/config.yml`
3. Command-line arguments override configuration values
4. Environment variables provide additional context

### External Service Integration
- **AWS Services**: Via boto3 and custom AWS utilities
- **GitHub API**: Via requests and GitHub REST API
- **PBB**: Via custom HTTP client
- **Datadog**: Via datadog-api-client
- **Jenkins**: Via custom Jenkins API client
- **Octo**: Via custom Octopus Deploy client

## Design Patterns

### Command Pattern
Each CLI command is implemented as a separate module with a consistent interface using Click decorators.

### Factory Pattern
Configuration loading uses factory methods to create environment-specific clients and settings.

### Adapter Pattern
External service integrations use adapter classes to provide consistent interfaces across different APIs.

### Strategy Pattern
Different output formats (JSON, table, text) are implemented using strategy pattern for flexible display options.

## Module Structure

### Single Module Architecture
The project follows a single-module Python package structure:
- Root-level `passkey.py` serves as the main entry point
- `pylibs/` contains all shared libraries and utilities
- `pylibs/commands/` contains CLI command implementations
- Configuration files are external to the codebase

### Package Organization
```
passkey-tools/
├── passkey.py              # Main CLI entry point
├── pylibs/                 # Core libraries
│   ├── commands/           # CLI command modules
│   ├── aws.py             # AWS integrations
│   ├── api.py             # HTTP utilities
│   ├── config.py          # Configuration management
│   └── ...                # Other utilities
├── bin/                   # Executable scripts
├── config.example.yaml    # Configuration template
└── docs/                  # Documentation
```

### Dependency Management
- Uses Pipenv for Python dependency management
- Dependencies defined in `Pipfile`
- Lock file ensures reproducible builds
- Minimal external dependencies for reliability

## Error Handling
- Global exception handling for AWS credential expiration
- Command-specific error handling for API failures
- Graceful degradation when services are unavailable
- Colored output for warnings and errors using custom Colors utility