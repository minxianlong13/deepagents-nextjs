# API Reference

## Overview

Passkey Smart primarily operates as a backend service with JMX-based management interfaces rather than traditional REST APIs. The service is designed for internal system integration and administrative control.

## Management Interfaces

### JMX MBeans

The service exposes management operations through JMX (Java Management Extensions) for operational control and monitoring.

#### Campaign Management MBean

**MBean Name**: `com.cvent.passkey:type=CampaignManager`

**Operations**:

##### Execute Campaign
**Description**: Triggers configuration setup for a specific email campaign

**Method**: `executeCampaign(String smartEmailSetupId)`

**Parameters**:
- `smartEmailSetupId` (String) - Unique identifier for the smart email setup configuration

**Returns**: Configuration status and campaign setup details

**Example Usage**:
```java
// Via Java Mission Control or JConsole
executeCampaign("campaign-123-abc")
```

##### Get Campaign Status
**Description**: Retrieves the current status of a campaign

**Method**: `getCampaignStatus(String campaignId)`

**Parameters**:
- `campaignId` (String) - Campaign identifier

**Returns**: Campaign execution status, progress, and metrics

##### List Active Campaigns
**Description**: Returns list of currently active campaigns

**Method**: `listActiveCampaigns()`

**Returns**: Array of active campaign information

#### Email Template MBean

**MBean Name**: `com.cvent.passkey:type=EmailTemplateManager`

**Operations**:

##### Validate Template
**Description**: Validates email template syntax and variables

**Method**: `validateTemplate(String templateId)`

**Parameters**:
- `templateId` (String) - Template identifier

**Returns**: Validation results and error details if any

##### Refresh Templates
**Description**: Reloads email templates from database

**Method**: `refreshTemplates()`

**Returns**: Number of templates refreshed

## Internal Service Interfaces

### Campaign Service Interface

The service provides internal Java interfaces for integration with other Passkey services.

#### ICampaignService

**Package**: `com.lanyon.group.smart.service`

**Methods**:

##### processEmailCampaign
```java
CampaignResult processEmailCampaign(
    String smartEmailSetupId,
    CampaignParameters parameters
)
```

**Parameters**:
- `smartEmailSetupId` - Configuration identifier
- `parameters` - Campaign configuration parameters

**Returns**: `CampaignResult` with configuration details

##### scheduleRecurringCampaign
```java
void scheduleRecurringCampaign(
    String smartEmailSetupId,
    ScheduleConfiguration schedule
)
```

**Parameters**:
- `smartEmailSetupId` - Configuration identifier  
- `schedule` - Recurring schedule configuration

### Email Service Interface

#### IEmailService

**Package**: `com.lanyon.group.smart.service`

**Methods**:

##### configurePersonalizedEmail
```java
EmailResult configurePersonalizedEmail(
    EmailTemplate template,
    RecipientData recipient,
    Map<String, Object> variables
)
```

**Parameters**:
- `template` - Email template object
- `recipient` - Recipient information
- `variables` - Template variable substitutions

**Returns**: `EmailResult` with configuration status

## Configuration Endpoints

### Health Check

**Endpoint**: Internal health check mechanism
**Method**: Automatic via WildFly health subsystem
**Response**: Service health status and dependencies

### Metrics

**Endpoint**: JMX metrics exposure
**Method**: Via JMX or Datadog agent
**Metrics Available**:
- Campaign execution count
- Email delivery success rate
- Template processing time
- Database connection status

## Error Handling

### Common Error Codes

- `CAMPAIGN_NOT_FOUND` - Specified campaign configuration not found
- `TEMPLATE_INVALID` - Email template validation failed
- `EMAIL_SERVICE_CONNECTION_ERROR` - Unable to connect to email service
- `DATABASE_ERROR` - Database connectivity or query issues
- `AUTHENTICATION_FAILED` - Service authentication failure

### Error Response Format

```java
public class ServiceError {
    private String errorCode;
    private String message;
    private String details;
    private long timestamp;
    // getters and setters
}
```

## Integration Examples

### Manual Campaign Execution via JMX

1. Connect to WildFly JMX console
2. Navigate to `com.cvent.passkey` MBeans
3. Select appropriate campaign management MBean
4. Execute `executeCampaign` operation with required parameters

### Programmatic Integration

```java
@Inject
private ICampaignService campaignService;

public void configureWelcomeEmail(String guestId) {
    CampaignParameters params = new CampaignParameters();
    params.setGuestId(guestId);
    params.setTriggerType("WELCOME");
    
    CampaignResult result = campaignService.processEmailCampaign(
        "welcome-email-setup", 
        params
    );
    
    if (result.isSuccess()) {
        log.info("Welcome email configured successfully");
    }
}
```

## Authentication & Authorization

- Service-to-service authentication via passkey-authentication-service
- Role-based access control for JMX operations
- Secure configuration management for sensitive data
- Integration with Cvent's internal security framework