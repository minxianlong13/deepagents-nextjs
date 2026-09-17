# API Reference

## Base Command
`passkey [COMMAND] [OPTIONS]`

All commands support the global `--config` option to override the default configuration environment.

## Service Commands

### passkey service list
**Description**: List all services and their versions running in an environment

**Usage**:
```bash
passkey service list [--environment ENV]
```

**Options**:
- `--environment`: Target environment (default from config)

**Output**: Tabular list of services with versions

### passkey service info
**Description**: Get detailed information about specific services

**Usage**:
```bash
passkey service info SERVICE_NAME [SERVICE_NAME...]
```

**Arguments**:
- `SERVICE_NAME`: Service name or substring match

**Output**: Service details including EC2 instances, IPs, and ports

### passkey service metadata
**Description**: Query service metadata stored in S3

**Usage**:
```bash
passkey service metadata SERVICE_NAME [VERSION]
```

**Arguments**:
- `SERVICE_NAME`: Name of the service
- `VERSION`: Optional specific version

**Output**: Service metadata or version list

## PBB (Payment) Commands

### passkey pbb merchant
**Description**: Query merchant account information

**Usage**:
```bash
passkey pbb merchant MERCHANT_ID [--json]
```

**Arguments**:
- `MERCHANT_ID`: Merchant account identifier

**Options**:
- `--json`: Output raw JSON data

**Output**: Merchant account details

### passkey pbb payment
**Description**: Query payment information

**Usage**:
```bash
passkey pbb payment PAYMENT_ID [--by-ref] [--json]
```

**Arguments**:
- `PAYMENT_ID`: Payment ID or caller reference ID

**Options**:
- `--by-ref`: Search by caller reference ID instead of payment ID
- `--json`: Output raw JSON data

**Output**: Payment details including status, amount, and transaction info

### passkey pbb refund
**Description**: Query refund information

**Usage**:
```bash
passkey pbb refund REFUND_ID [--by-ref] [--json]
```

**Arguments**:
- `REFUND_ID`: Refund ID or caller reference ID

**Options**:
- `--by-ref`: Search by caller reference ID
- `--json`: Output raw JSON data

**Output**: Refund details and status

## Reservation Commands

### passkey reservation list
**Description**: List reservations processed by the reservation engine

**Usage**:
```bash
passkey reservation list [--start DATETIME]
```

**Options**:
- `--start`: Start time for query (default: last 6 hours)

**Output**: List of reservations with status and timestamps

### passkey reservation summary
**Description**: Get detailed summary for specific reservations

**Usage**:
```bash
passkey reservation summary CONFIRMATION_NUMBER [CONFIRMATION_NUMBER...]
```

**Arguments**:
- `CONFIRMATION_NUMBER`: Reservation confirmation number

**Output**: Detailed reservation information including dates, charges, and status

## GitHub Commands

### passkey github fill-cache
**Description**: Load team members and repositories into configuration cache

**Usage**:
```bash
passkey github fill-cache
```

**Output**: Updates configuration file with team and repository data

### passkey github pull-requests
**Description**: Display relevant pull requests for the team

**Usage**:
```bash
passkey github pull-requests [--sort ORDER] [--extended-users]
```

**Options**:
- `--sort`: Sort order (`default` or `age`)
- `--extended-users`: Include bots and extended users

**Output**: Formatted list of pull requests

## Backstage Commands

### passkey backstage api-keys
**Description**: Check API key expiration status

**Usage**:
```bash
passkey backstage api-keys --team TEAM [--days DAYS] [--errors-only] [--prod-only] [--ecommerce]
```

**Options**:
- `--team`: Team name
- `--days`: Days until expiration threshold
- `--errors-only`: Show only keys with issues
- `--prod-only`: Production environment only
- `--ecommerce`: Include ecommerce services

**Output**: API key status and expiration information

## Release Commands

### passkey release
**Description**: Manage service releases and deployments

**Usage**:
```bash
passkey release [SUBCOMMAND] [OPTIONS]
```

**Subcommands**: Various release management operations (see release documentation)

## Monitoring Commands

### passkey monitor
**Description**: Monitor service health and metrics

**Usage**:
```bash
passkey monitor [SUBCOMMAND] [OPTIONS]
```

**Output**: Service monitoring data and alerts

## Log Commands

### passkey logs
**Description**: Query and analyze service logs

**Usage**:
```bash
passkey logs [QUERY_NAME] [OPTIONS]
```

**Arguments**:
- `QUERY_NAME`: Predefined query from logs.yml

**Output**: Log entries matching the query

## AWS Infrastructure Commands

### passkey stack
**Description**: CloudFormation stack operations

**Usage**:
```bash
passkey stack [SUBCOMMAND] [OPTIONS]
```

### passkey dynamodb
**Description**: DynamoDB table operations

**Usage**:
```bash
passkey dynamodb [SUBCOMMAND] [OPTIONS]
```

### passkey sfn
**Description**: Step Functions operations

**Usage**:
```bash
passkey sfn [SUBCOMMAND] [OPTIONS]
```

## Configuration Commands

### Global Options
All commands support:
- `--config ENV`: Override configuration environment
- `--help`: Show command help

### Environment Variables
- `AWS_PROFILE`: AWS profile to use
- `PASSKEY_CONFIG`: Path to configuration file

### Exit Codes
- `0`: Success
- `1`: Command failed or error occurred
- `2`: Invalid arguments or configuration