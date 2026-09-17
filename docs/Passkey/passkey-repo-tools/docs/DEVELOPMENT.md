# Development Guide

## Prerequisites
- **Python 3.x**: Version 3.8 or higher
- **asdf**: Version manager for consistent Python versions
- **pipenv**: Python dependency management
- **Git**: Version control
- **oktaws**: AWS authentication tool
- **Text Editor**: VS Code, PyCharm, or similar with Python support

## Local Setup

### Initial Environment Setup
```bash
# Install asdf (if not already installed)
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.10.2
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc
source ~/.bashrc

# Add Python plugin
asdf plugin add python

# Clone the repository
git clone https://github.com/cvent-internal/passkey-tools.git
cd passkey-tools

# Install Python version specified in .tool-versions
asdf install

# Install pipenv
python -m pip install pipenv

# Create virtual environment and install dependencies
pipenv install

# Setup configuration files
mkdir -p ~/.passkey
cp config.example.yaml ~/.passkey/config.yml
cp logs.example.yml ~/.passkey/logs.yml
```

### Configuration Setup
```bash
# Edit configuration with your tokens
vim ~/.passkey/config.yml

# Required tokens:
# - GitHub personal access token
# - Jenkins API token
# - Datadog API and app keys
# - Octo API token
# - PBB API key (environment-specific)
```

### AWS Setup
```bash
# Install and configure oktaws
# Follow: https://wiki.cvent.com/display/AWS/Oktaws

# Test AWS connectivity
oktaws
aws sts get-caller-identity
```

## Running the Tool

### Development Mode
```bash
# Activate virtual environment
pipenv shell

# Run commands directly
python passkey.py --help
python passkey.py service list

# Or use the bin script
./bin/passkey --help
```

### Production Mode
```bash
# Add to PATH for global access
export PATH="$PATH:$(pwd)/bin"

# Run from anywhere
passkey --help
passkey service list
```

## Code Structure

### Package Organization
```
passkey-tools/
├── passkey.py              # Main CLI entry point
├── bin/                    # Executable wrapper scripts
│   └── passkey            # Shell script wrapper
├── pylibs/                 # Core Python libraries
│   ├── __init__.py        # Package initialization
│   ├── commands/          # CLI command implementations
│   │   ├── __init__.py
│   │   ├── service.py     # Service management commands
│   │   ├── github.py      # GitHub integration
│   │   ├── pbb.py         # Payment system commands
│   │   ├── reservation.py # Reservation commands
│   │   └── ...           # Other command modules
│   ├── api.py             # HTTP client utilities
│   ├── aws.py             # AWS service integrations
│   ├── config.py          # Configuration management
│   ├── colors.py          # Terminal color utilities
│   └── ...               # Other utility modules
├── config.example.yaml    # Configuration template
├── logs.example.yml       # Log query template
├── Pipfile               # Dependency specification
├── Pipfile.lock          # Locked dependencies
└── docs/                 # Documentation
```

### Command Module Structure
Each command module follows this pattern:
```python
import click
from pylibs.config import load_config

@click.group()
def cli():
    """Command group description"""
    pass

@cli.command()
@click.argument('argument_name')
@click.option('--option-name', help='Option description')
def subcommand(argument_name, option_name):
    """Subcommand description"""
    config = load_config()
    # Implementation here
    pass
```

## Coding Standards

### Python Style Guide
- Follow PEP 8 style guidelines
- Use meaningful variable and function names
- Add docstrings for all functions and classes
- Keep functions focused and single-purpose
- Use type hints where appropriate

### Code Organization
- Group related functionality in modules
- Use consistent error handling patterns
- Implement proper logging and debugging
- Follow the existing project structure

### Example Code Style
```python
import click
from typing import Optional, List
from pylibs.config import Config
from pylibs.colors import Colors

def format_service_info(services: List[dict], config: Config) -> str:
    """
    Format service information for display.
    
    Args:
        services: List of service dictionaries
        config: Configuration object
        
    Returns:
        Formatted string for display
    """
    if not services:
        return Colors.warning("No services found")
    
    # Implementation here
    return formatted_output

@click.command()
@click.argument('service_name', required=False)
@click.option('--json', 'output_json', is_flag=True, 
              help='Output raw JSON data')
def info(service_name: Optional[str], output_json: bool) -> None:
    """Get detailed information about services."""
    try:
        config = load_config()
        services = get_services(service_name, config)
        
        if output_json:
            click.echo(json.dumps(services, indent=2))
        else:
            click.echo(format_service_info(services, config))
            
    except Exception as e:
        click.echo(Colors.error(f"Error: {e}"))
        raise click.Abort()
```

## Testing

### Running Tests
```bash
# Install test dependencies (if any)
pipenv install --dev

# Run unit tests
python -m pytest tests/

# Run integration tests
python -m pytest tests/integration/

# Run specific test file
python -m pytest tests/test_service.py

# Run with coverage
python -m pytest --cov=pylibs tests/
```

### Test Structure
```bash
tests/
├── __init__.py
├── conftest.py           # Test configuration and fixtures
├── test_config.py        # Configuration tests
├── test_service.py       # Service command tests
├── integration/          # Integration tests
│   ├── test_aws.py      # AWS integration tests
│   └── test_github.py   # GitHub integration tests
└── fixtures/            # Test data and mocks
    ├── config.yaml      # Test configuration
    └── responses.json   # Mock API responses
```

### Writing Tests
```python
import pytest
from unittest.mock import Mock, patch
from pylibs.commands.service import get_services

def test_get_services_success():
    """Test successful service retrieval."""
    mock_config = Mock()
    mock_config.aws_profile = 'test'
    
    with patch('pylibs.aws.list_services') as mock_list:
        mock_list.return_value = [{'name': 'test-service'}]
        
        result = get_services('test', mock_config)
        
        assert len(result) == 1
        assert result[0]['name'] == 'test-service'
        mock_list.assert_called_once()

@pytest.fixture
def sample_config():
    """Provide sample configuration for tests."""
    return {
        'github': {'token': 'test-token'},
        'aws_profile': 'test-profile'
    }
```

## Common Development Tasks

### Adding a New Command
1. Create new command module in `pylibs/commands/`
2. Implement Click command group and subcommands
3. Add command import to `passkey.py`
4. Register command with main CLI group
5. Add tests for new functionality
6. Update documentation

### Adding a New API Integration
1. Create client module in `pylibs/`
2. Implement authentication and request handling
3. Add configuration options for API endpoints
4. Create command module that uses the client
5. Add error handling and retry logic
6. Write integration tests

### Debugging Commands
```bash
# Enable debug mode
export PASSKEY_DEBUG=1

# Run with verbose output
passkey --verbose service list

# Use Python debugger
python -m pdb passkey.py service list

# Check configuration loading
python -c "from pylibs.config import load_config; print(load_config())"
```

### Configuration Testing
```bash
# Validate configuration syntax
python -c "import yaml; yaml.safe_load(open('~/.passkey/config.yml'))"

# Test specific configuration sections
passkey github fill-cache  # Tests GitHub token
passkey service list       # Tests AWS credentials
passkey pbb merchant test  # Tests PBB API key
```

## Contributing Guidelines

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation as needed
4. Submit pull request with description
5. Address code review feedback
6. Merge after approval

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Error handling is appropriate
- [ ] Configuration changes are documented
- [ ] Backward compatibility is maintained

### Release Process
1. Update version numbers
2. Update CHANGELOG.md
3. Create release tag
4. Update documentation
5. Notify team of changes

## Troubleshooting

### Common Issues
- **Import Errors**: Check virtual environment activation
- **AWS Credentials**: Verify oktaws setup and profile configuration
- **API Tokens**: Check token validity and permissions
- **Configuration**: Validate YAML syntax and required fields

### Debug Commands
```bash
# Check Python environment
which python
python --version
pipenv --version

# Verify dependencies
pipenv check
pipenv graph

# Test configuration
python -c "from pylibs.config import load_config; config = load_config(); print('Config loaded successfully')"

# Test AWS connectivity
aws sts get-caller-identity --profile passkey-alpha
```

## Additional Resources

## Quick Start


### Prerequisites
- Python 3.x
- asdf (for version management)
- pipenv
- oktaws (for AWS authentication)

### Installation
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-tools.git
cd passkey-tools

# Install asdf and Python
asdf plugin add python
asdf install

# Install dependencies
python -m pip install pipenv
python -m pipenv install

# Setup configuration
mkdir -p ~/.passkey
cp config.example.yaml ~/.passkey/config.yml
cp logs.example.yml ~/.passkey/logs.yml

# Add to PATH (optional)
export PATH="$PATH:$(pwd)/bin"
```

### Basic Usage
```bash
# List all services in an environment
passkey service list

# Get service information
passkey service info passkey-payment

# Query payment information
passkey pbb payment --by-ref PASSKEY-FIN-842377-PR-949509

# List recent reservations
passkey reservation list

# View pull requests
passkey github pull-requests
```

## Configuration

The tool uses YAML configuration files stored in `~/.passkey/`:
- `config.yml`: Main configuration with API tokens and environment settings
- `logs.yml`: Datadog log query definitions

Required tokens:
- **Octo Token**: From https://octo.core.cvent.org/app#/Spaces-1/users/me/apiKeys
- **GitHub Token**: Personal access token for GitHub API
- **Jenkins Token**: From Jenkins user profile configuration
- **Datadog Keys**: Application keys for monitoring integration

## Repository Information

- **Language**: Python
- **Stars**: 4
- **Owner**: steakholders team
- **Lifecycle**: incubating
- **Business Unit**: hospitality
- **Platform**: passkey
