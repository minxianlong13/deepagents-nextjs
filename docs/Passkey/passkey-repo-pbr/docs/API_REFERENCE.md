# API Reference

## Base URLs

The Passkey PBR service provides custom domain endpoints for different environments:

- **Production**: `https://pbr.passkey.com`
- **Staging**: `https://ct50-pbr.passkey.com`
- **Integration**: `https://it50-pbr.passkey.com`
- **Alpha**: `https://alpha-pbr.passkey.com`

## Endpoints

### GET /survey

**Description**: Main survey endpoint that routes requests to the backend passkey-pbr-survey-wrapper service.

**URL Pattern**: `/{environment}/survey` or `/survey` (for production)

**Method**: `GET`

**Path Parameters**: None

**Query Parameters**: 
- All query parameters are passed through to the backend service
- Backend service handles parameter validation and processing

**Request Headers**:
- Standard HTTP headers are forwarded to backend service
- No special headers required

**Request Body**: Not applicable (GET request)

**Response**: 
- Response is proxied directly from the backend service
- Content-Type and other headers are preserved from backend

**Example Requests**:

```bash
# Production survey access
curl -X GET "https://pbr.passkey.com/survey"

# Staging survey access  
curl -X GET "https://ct50-pbr.passkey.com/survey"

# Survey with query parameters (passed to backend)
curl -X GET "https://pbr.passkey.com/survey?param1=value1&param2=value2"
```

**Status Codes**:
- `200`: Success - Survey content returned from backend
- `404`: Not Found - Invalid path or backend service unavailable
- `500`: Internal Server Error - Backend service error or configuration issue
- `502`: Bad Gateway - Backend service unreachable
- `503`: Service Unavailable - Temporary backend service issue

### Legacy URL Support (Production Only)

For backward compatibility, the production environment supports legacy URL patterns:

#### GET /pr50/survey

**Description**: Legacy production survey URL that routes to the same backend as `/survey`

**URL**: `https://pbr.passkey.com/pr50/survey`

**Behavior**: Identical to `/survey` endpoint

#### GET /ct50/survey

**Description**: Legacy staging survey URL that redirects to the staging domain

**URL**: `https://pbr.passkey.com/ct50/survey`

**Behavior**: Redirects to `https://ct50-pbr.passkey.com/survey`

## HTTP Integration Details

### Backend Service Integration

The API Gateway uses HTTP integration to connect to the backend service:

**Integration Type**: HTTP Proxy Integration

**Backend Service**: passkey-pbr-survey-wrapper

**Integration URL Pattern**: `{serviceEndpoint}/v1/survey`

**HTTP Method**: GET (matches incoming request method)

**Request Transformation**: 
- No request transformation applied
- All headers, query parameters, and path parameters forwarded as-is

**Response Transformation**:
- No response transformation applied  
- Backend response returned directly to client

### Configuration Sources

Backend service endpoints are resolved dynamically from Hogan configuration:

```typescript
// Configuration structure from Hogan
{
  "passkey-pbr-survey-wrapper": {
    "endpoint": {
      "internal": "https://internal-service-url"
    },
    "custom-domain": "pbr.passkey.com"
  }
}
```

## Error Handling

### API Gateway Errors

**404 Not Found**:
```json
{
  "message": "Missing Authentication Token"
}
```
- Occurs when accessing undefined paths
- Standard API Gateway error response

**502 Bad Gateway**:
```json
{
  "message": "Internal server error"
}
```
- Occurs when backend service is unreachable
- May indicate configuration or network issues

### Backend Service Errors

Backend service errors are passed through transparently:
- HTTP status codes preserved
- Response body and headers forwarded as-is
- Error format depends on backend service implementation

## Rate Limiting

- No rate limiting configured at API Gateway level
- Backend service may implement its own rate limiting
- Standard AWS API Gateway throttling limits apply

## Monitoring and Logging

### CloudWatch Integration

API Gateway automatically logs to CloudWatch:
- Access logs (if enabled)
- Execution logs for debugging
- Metrics for request count, latency, and errors

### Custom Metrics

Available CloudWatch metrics:
- `4XXError`: Client error count
- `5XXError`: Server error count  
- `Count`: Total request count
- `IntegrationLatency`: Backend response time
- `Latency`: Total request latency

### Datadog Integration

Service monitoring available in Datadog:
- Service: `passkey-pbr-cdk`
- Environment-specific dashboards
- APM traces for request flow analysis

## Security

### SSL/TLS Configuration

- **Protocol**: TLS 1.2 minimum
- **Certificate**: AWS Certificate Manager (ACM)
- **Endpoint Type**: Regional
- **Security Policy**: `TLS_1_2`

### Authentication

- No authentication required at API Gateway level
- Backend service handles any required authentication
- Public access for survey endpoints

### CORS Configuration

CORS handling delegated to backend service:
- No CORS configuration at API Gateway level
- Backend service must handle preflight requests
- Cross-origin requests supported based on backend configuration

## Development and Testing

### Local Testing

API Gateway cannot be tested locally. Use deployed environments:

```bash
# Test staging environment
curl -v https://ct50-pbr.passkey.com/survey

# Test with verbose output for debugging
curl -v -H "User-Agent: Test-Client" https://pbr.passkey.com/survey
```

### Health Checks

No dedicated health check endpoint. Monitor via:
- CloudWatch metrics
- Datadog service monitoring  
- Backend service health endpoints

### Debugging

For troubleshooting API Gateway issues:

1. Check CloudWatch logs for execution details
2. Verify backend service availability
3. Confirm Hogan configuration is correct
4. Validate certificate and domain configuration