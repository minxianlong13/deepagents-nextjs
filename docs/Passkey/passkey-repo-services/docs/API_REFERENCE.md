# API Reference

## Overview

Passkey Services is primarily a collection of scheduled batch processing services rather than traditional REST APIs. Most services operate as cron jobs that process data, generate reports, or synchronize with external systems. However, some services may expose health check endpoints or internal APIs.

## Service Endpoints

### Health Check Endpoints

Most services include health check capabilities accessible via their shell scripts:

#### GMLService Health Check
**Endpoint**: Shell script execution
```bash
/opt/PasskeyServices/GMLService/GMLService.sh health
```

**Description**: Checks the health status of the Guest Management Layer service

**Response**: 
- Exit code 0: Service healthy
- Exit code 1: Service unhealthy

#### Nor1Processor Health Check
**Endpoint**: Shell script execution
```bash
/opt/PasskeyServices/Nor1Processor/Nor1Processor.sh health
```

**Description**: Validates Nor1 integration connectivity and service status

## Service Interfaces

### GMLService (Guest Management Layer)

**Purpose**: Processes guest management operations
**Execution**: Every minute via cron
**Input Sources**: 
- Database queries for guest data
- Internal Passkey APIs

**Processing Operations**:
- Guest data synchronization
- Status updates
- Data validation and cleanup

**Output**:
- Updated guest records
- Processing logs in JSON format
- Error notifications

### ExchangeRates Service

**Purpose**: Updates currency exchange rates
**Execution**: Monthly (1st day at 9 AM)
**Input Sources**:
- External currency exchange APIs
- Historical rate data

**Processing Operations**:
- Fetch current exchange rates
- Validate rate changes
- Update rate tables

**Output**:
- Updated exchange rate tables
- Rate change notifications
- Processing summary reports

### GLResCRTSService (GL Reservation CRTS)

**Purpose**: Processes GL reservation data for CRTS system
**Execution**: On-demand or scheduled
**Input Sources**:
- Reservation database
- GL (General Ledger) systems

**Processing Operations**:
- Reservation data extraction
- GL code mapping
- CRTS format transformation

**Output**:
- CRTS-formatted data files
- Processing status reports
- Error logs for failed transformations

### Nor1Processor

**Purpose**: Integrates with Nor1 third-party service
**Execution**: Daily at 6 AM
**Input Sources**:
- Nor1 API endpoints
- Local reservation data

**Processing Operations**:
- Data synchronization with Nor1
- Reservation updates
- Revenue optimization data processing

**Output**:
- Synchronized reservation data
- Nor1 integration status
- Performance metrics

### Billing Report Service

**Purpose**: Generates web billing reports
**Execution**: Monthly (2nd day at 6 AM)
**Input Sources**:
- Billing database
- Transaction records
- Customer data

**Processing Operations**:
- Billing data aggregation
- Report generation
- Format conversion (PDF, Excel, etc.)

**Output**:
- Generated billing reports
- Report delivery notifications
- Processing statistics

### Roche Report Service

**Purpose**: Generates reports for Roche integration
**Execution**: Daily at 8:50 PM
**Input Sources**:
- Roche-specific data sources
- Integration databases

**Processing Operations**:
- Data extraction and transformation
- Report formatting
- Delivery preparation

**Output**:
- Roche-formatted reports
- Delivery confirmations
- Processing logs

## Configuration APIs

### Environment Configuration

Services use configuration files rather than runtime APIs:

**Configuration Location**: `{service}/configs/`
**Format**: Properties files, YAML, or JSON
**Environment Variables**:
- `LOG_DIR`: Logging directory path
- `ENVIRONMENT`: Current environment (dev, alpha, prod)

### Build and Deployment APIs

#### Maven Build Interface
```bash
# Build specific service
mvn -f {service}/pom.xml clean package -Dmaven.compiler.release=11

# Run tests
mvn -f {service}/pom.xml test

# SonarQube analysis
mvn -f {service}/pom.xml sonar:sonar -Dsonar.host.url=https://sonar.core.cvent.org
```

#### pnpm Workspace Interface
```bash
# Build all services
pnpm build

# Build specific service
pnpm build:{service-name}

# Run tests
pnpm test

# Version management
pnpm changeset
```

## Monitoring and Observability

### Log File APIs

**Log Directory**: `/services/passkey/{environment}/services/logs/json`
**Format**: JSON structured logs
**Access**: File system based

**Log Structure**:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "GMLService",
  "message": "Processing completed successfully",
  "processingTime": 1250,
  "recordsProcessed": 1500
}
```

### Cron Execution Monitoring

**Cron Log Location**: Service-specific cron log files
**Format**: Standard output/error capture
**Example**:
```bash
# Enable cron logging
*/3 * * * * /opt/PasskeyServices/Nor1Processor/Nor1Processor.sh health >> /opt/PasskeyServices/Nor1Processor/cron.log 2>&1
```

## Error Handling

### Service Error Codes

**Exit Code 0**: Successful execution
**Exit Code 1**: General error
**Exit Code 2**: Configuration error
**Exit Code 3**: Database connection error
**Exit Code 4**: External API error

### Error Response Format

Services log errors in structured format:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "service": "ExchangeRates",
  "error": {
    "code": "API_CONNECTION_FAILED",
    "message": "Failed to connect to exchange rate API",
    "details": "Connection timeout after 30 seconds"
  }
}
```

## Integration Patterns

### Database Integration
- **Connection**: Service-specific database connections
- **Transactions**: Individual service transaction management
- **Pooling**: Connection pooling per service

### External API Integration
- **Authentication**: Service-specific API keys and credentials
- **Rate Limiting**: Handled per service
- **Retry Logic**: Configurable retry policies

### Inter-Service Communication
- **Method**: Database-based data sharing
- **Synchronization**: File-based coordination when needed
- **Event Handling**: Log-based event tracking

## Security Considerations

### Authentication
- Services run under dedicated system user (`passkey`)
- File system permissions for log and config access
- Database authentication per service

### Data Protection
- Sensitive data logging restrictions
- Configuration file encryption for credentials
- Secure API key management

### Network Security
- Internal network communication only
- External API calls through secure channels
- Certificate validation for HTTPS connections