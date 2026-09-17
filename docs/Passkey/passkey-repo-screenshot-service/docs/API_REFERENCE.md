# API Reference

## Base URL

The service runs on HTTPS port 7443:
```
https://localhost:7443
```

In deployed environments, the service is accessible through load balancers and API gateways.

## Authentication

Currently, the service does not require authentication. Access control is implemented through:
- Domain restrictions (only approved Passkey domains)
- Network-level security (VPC, security groups)
- Rate limiting through concurrency controls

## Endpoints

### GET /local/picture/:imageId

**Description**: Captures or retrieves a cached screenshot of a website and returns it as a resized image.

**Path Parameters**:
- `imageId` (string) - Unique identifier for the screenshot request (currently not used for lookup, but required for routing)

**Query Parameters**:
- `websiteUrl` (string, required) - The URL of the website to screenshot
  - Must be a valid HTTP/HTTPS URL
  - Domain must end with `.passkey.com` or `.cvent.org`
  - Example: `https://demo.passkey.com/hotel-booking`

- `width` (number, optional) - Desired width of the returned image in pixels
  - Default: 1200
  - Range: 1-4000
  - Used for viewport width during capture and final image resizing

- `height` (number, optional) - Desired height of the returned image in pixels
  - Default: 800
  - Range: 1-4000
  - Used for viewport height during capture and final image resizing

- `screenshotWidth` (number, optional) - Override width for screenshot capture
  - If not provided, uses `width` parameter
  - Allows different capture and output dimensions

- `screenshotHeight` (number, optional) - Override height for screenshot capture
  - If not provided, uses `height` parameter
  - Allows different capture and output dimensions

- `forceRefresh` (boolean, optional) - Force new screenshot capture, bypassing cache
  - Default: false
  - Set to `true` to ignore cached screenshots

- `previewToken` (string, optional) - Authentication token for preview pages
  - Passed to the target website for accessing preview content
  - Added as `previewToken` query parameter to the target URL

**Request Examples**:

```bash
# Basic screenshot request
GET /local/picture/hotel123?websiteUrl=https://demo.passkey.com/hotel-booking&width=800&height=600

# Force refresh with custom dimensions
GET /local/picture/hotel123?websiteUrl=https://demo.passkey.com/hotel-booking&width=1200&height=800&forceRefresh=true

# Preview page with token
GET /local/picture/preview456?websiteUrl=https://staging.passkey.com/preview&previewToken=abc123&width=1024&height=768
```

**Response**:

**Success (200 OK)**:
- **Content-Type**: `image/jpeg`
- **Content-Length**: Size of the image in bytes
- **Body**: Binary JPEG image data

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "Invalid or missing URL: <url>"
}
```
```json
{
  "error": "URL not allowed: <url>"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Error processing image"
}
```

**Response Headers**:
```
Content-Type: image/jpeg
Content-Length: <size>
Cache-Control: public, max-age=3600
```

**Status Codes**:
- `200`: Success - Screenshot captured and returned
- `400`: Bad Request - Invalid URL, unsupported domain, or malformed parameters
- `500`: Internal Server Error - Screenshot capture failed, image processing error
- `503`: Service Unavailable - Concurrency limit reached (returns fallback image)

### GET /local/ok

**Description**: Health check endpoint to verify service availability.

**Parameters**: None

**Request Example**:
```bash
GET /local/ok
```

**Response**:

**Success (200 OK)**:
```json
{
  "Status": "UP"
}
```

**Response Headers**:
```
Content-Type: application/json
```

## Error Handling

### Domain Validation Errors
The service only allows screenshots of websites hosted on approved domains:
- `.passkey.com`
- `.cvent.org`

Requests for other domains will return a 400 Bad Request error.

### Timeout Handling
The service implements several timeout mechanisms:
- **Page Load Timeout**: 10 seconds for initial page navigation
- **Full Load Timeout**: 10 seconds for complete page loading
- **Screenshot Timeout**: 15 seconds for screenshot capture
- **Semaphore Timeout**: 30 seconds for acquiring concurrency lock

When timeouts occur, the service returns a fallback "unavailable" image instead of an error.

### Concurrency Limits
The service limits concurrent screenshot operations to prevent resource exhaustion:
- **Default Limit**: 3 concurrent operations
- **Behavior**: When limit is reached, requests wait up to 30 seconds for availability
- **Fallback**: If timeout occurs, returns fallback image

### Fallback Images
When screenshot capture fails, the service returns a pre-generated "unavailable" image:
- **Location**: `./Resources/unavailable.png`
- **Format**: PNG converted to JPEG
- **Dimensions**: Resized to match requested dimensions

## Rate Limiting

Rate limiting is implemented through:
1. **Concurrency Control**: Maximum 3 simultaneous screenshot operations
2. **Timeout Controls**: Prevents long-running operations from blocking resources
3. **Resource Limits**: Container-level CPU and memory constraints

## Caching

### Cache Strategy
- **Storage**: AWS S3 bucket
- **Key Format**: `{hostname}/{pathname}`
- **TTL**: No explicit expiration (manual invalidation via `forceRefresh`)
- **Cache Hit**: Returns cached image immediately
- **Cache Miss**: Generates new screenshot and stores in cache

### Cache Invalidation
- Use `forceRefresh=true` parameter to bypass cache
- Cache keys are based on hostname and pathname only
- Query parameters (except `previewToken`) don't affect cache keys

## Performance Considerations

### Response Times
- **Cache Hit**: ~100-200ms (S3 retrieval + image processing)
- **Cache Miss**: ~5-15 seconds (page load + screenshot + processing)
- **Timeout Fallback**: ~30 seconds maximum

### Image Processing
- **Format**: Always returns JPEG regardless of source format
- **Quality**: Optimized for web delivery
- **Compression**: Balanced quality/size ratio using Sharp library

### Concurrent Requests
- **Limit**: 3 simultaneous screenshot captures
- **Queue**: Additional requests wait for available slots
- **Timeout**: 30-second maximum wait time

## SDK Examples

### cURL
```bash
# Basic screenshot
curl -X GET "https://screenshot-service.passkey.com/local/picture/hotel123?websiteUrl=https://demo.passkey.com&width=800&height=600" \
  -H "Accept: image/jpeg" \
  --output screenshot.jpg

# Force refresh
curl -X GET "https://screenshot-service.passkey.com/local/picture/hotel123?websiteUrl=https://demo.passkey.com&forceRefresh=true" \
  --output screenshot.jpg

# Health check
curl -X GET "https://screenshot-service.passkey.com/local/ok"
```

### JavaScript/Node.js
```javascript
const fetch = require('node-fetch');
const fs = require('fs');

async function captureScreenshot(url, width = 1200, height = 800) {
  const params = new URLSearchParams({
    websiteUrl: url,
    width: width.toString(),
    height: height.toString()
  });
  
  const response = await fetch(
    `https://screenshot-service.passkey.com/local/picture/screenshot?${params}`,
    { method: 'GET' }
  );
  
  if (!response.ok) {
    throw new Error(`Screenshot failed: ${response.status} ${response.statusText}`);
  }
  
  const buffer = await response.buffer();
  fs.writeFileSync('screenshot.jpg', buffer);
  return buffer;
}

// Usage
captureScreenshot('https://demo.passkey.com/hotel-booking', 1024, 768)
  .then(() => console.log('Screenshot saved'))
  .catch(console.error);
```

### Python
```python
import requests

def capture_screenshot(url, width=1200, height=800, force_refresh=False):
    params = {
        'websiteUrl': url,
        'width': width,
        'height': height,
        'forceRefresh': force_refresh
    }
    
    response = requests.get(
        'https://screenshot-service.passkey.com/local/picture/screenshot',
        params=params
    )
    
    response.raise_for_status()
    
    with open('screenshot.jpg', 'wb') as f:
        f.write(response.content)
    
    return response.content

# Usage
screenshot_data = capture_screenshot(
    'https://demo.passkey.com/hotel-booking',
    width=1024,
    height=768
)
```