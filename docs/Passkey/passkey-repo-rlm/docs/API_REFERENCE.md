# API Reference

## Base URL

**Development**: `https://dev-rlm.passkey.com`  
**Production**: `https://rlm.passkey.com`

## Authentication

All API endpoints require authentication through the Passkey Authentication Service. Include the session token in requests:

```http
Cookie: JSESSIONID=<session-id>
```

## File Upload Endpoints

### POST /upload

**Description**: Upload a spreadsheet file for room list processing

**Content-Type**: `multipart/form-data`

**Request Parameters**:
- `file` (required): The spreadsheet file (Excel or CSV)
- `eventId` (required): The event ID for processing
- `processType` (optional): Type of processing (`create`, `modify`, `cancel`)

**Request Example**:
```http
POST /upload HTTP/1.1
Host: dev-rlm.passkey.com
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="roomlist.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[binary file content]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="eventId"

12345
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Response**:
```json
{
  "uploadId": "uuid-string",
  "status": "uploaded",
  "filename": "roomlist.xlsx",
  "fileSize": 1024000,
  "eventId": "12345",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 200: File uploaded successfully
- 400: Invalid file format or missing parameters
- 401: Authentication required
- 413: File too large
- 415: Unsupported file type

### GET /upload/{uploadId}/status

**Description**: Get the processing status of an uploaded file

**Path Parameters**:
- `uploadId` - The upload ID returned from the upload endpoint

**Response**:
```json
{
  "uploadId": "uuid-string",
  "status": "processing",
  "progress": {
    "totalRows": 1000,
    "processedRows": 250,
    "successfulRows": 240,
    "errorRows": 10
  },
  "errors": [
    {
      "row": 15,
      "column": "guestEmail",
      "message": "Invalid email format",
      "severity": "error"
    }
  ],
  "startTime": "2024-01-15T10:30:00Z",
  "estimatedCompletion": "2024-01-15T10:45:00Z"
}
```

**Status Values**:
- `uploaded`: File received, awaiting processing
- `scanning`: Malware scan in progress
- `parsing`: File being parsed
- `processing`: Reservations being processed
- `completed`: Processing finished successfully
- `failed`: Processing failed
- `cancelled`: Processing was cancelled

## Processing Management Endpoints

### POST /process/{uploadId}/start

**Description**: Start processing an uploaded file

**Path Parameters**:
- `uploadId` - The upload ID

**Request Body**:
```json
{
  "processType": "create",
  "options": {
    "skipDuplicates": true,
    "validateOnly": false,
    "batchSize": 100
  }
}
```

**Response**:
```json
{
  "processId": "process-uuid",
  "status": "started",
  "estimatedDuration": "PT15M"
}
```

### POST /process/{processId}/cancel

**Description**: Cancel an ongoing processing operation

**Path Parameters**:
- `processId` - The process ID

**Response**:
```json
{
  "processId": "process-uuid",
  "status": "cancelling",
  "message": "Cancellation request received"
}
```

## Validation Endpoints

### POST /validate/file

**Description**: Validate a file format without processing

**Request**: Same as `/upload` endpoint

**Response**:
```json
{
  "valid": true,
  "fileType": "xlsx",
  "rowCount": 1000,
  "columnCount": 15,
  "headers": [
    "guestFirstName",
    "guestLastName",
    "guestEmail",
    "roomType",
    "checkIn",
    "checkOut"
  ],
  "issues": [
    {
      "type": "warning",
      "message": "Column 'phoneNumber' is recommended but missing"
    }
  ]
}
```

### POST /validate/data

**Description**: Validate room list data against business rules

**Request Body**:
```json
{
  "eventId": "12345",
  "rooms": [
    {
      "guestFirstName": "John",
      "guestLastName": "Doe",
      "guestEmail": "john.doe@example.com",
      "roomType": "Standard King",
      "checkIn": "2024-02-01",
      "checkOut": "2024-02-03"
    }
  ]
}
```

**Response**:
```json
{
  "valid": true,
  "validationResults": [
    {
      "rowIndex": 0,
      "valid": true,
      "warnings": [],
      "errors": []
    }
  ],
  "summary": {
    "totalRows": 1,
    "validRows": 1,
    "warningRows": 0,
    "errorRows": 0
  }
}
```

## Event Information Endpoints

### GET /events/{eventId}/info

**Description**: Get event information and configuration

**Path Parameters**:
- `eventId` - The event ID

**Response**:
```json
{
  "eventId": "12345",
  "eventName": "Annual Conference 2024",
  "hotelId": "hotel-456",
  "hotelName": "Grand Hotel",
  "dateRange": {
    "start": "2024-02-01",
    "end": "2024-02-05"
  },
  "roomTypes": [
    {
      "code": "STD_KING",
      "name": "Standard King",
      "available": true
    }
  ],
  "rlmSettings": {
    "modificationEnabled": true,
    "maxFileSize": 10485760,
    "allowedFileTypes": ["xlsx", "csv"],
    "rateLimits": {
      "maxConcurrentProcesses": 3,
      "maxRowsPerBatch": 1000
    }
  }
}
```

## Rate Limiting Information

### GET /limits/current

**Description**: Get current rate limiting status

**Response**:
```json
{
  "currentProcesses": 2,
  "maxConcurrentProcesses": 3,
  "queuedRequests": 5,
  "estimatedWaitTime": "PT5M",
  "rateLimits": {
    "requestsPerMinute": 60,
    "requestsRemaining": 45,
    "resetTime": "2024-01-15T10:31:00Z"
  }
}
```

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File validation failed",
    "details": [
      {
        "field": "file",
        "message": "File format not supported"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-uuid"
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED`: User not authenticated
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed
- `FILE_TOO_LARGE`: Uploaded file exceeds size limit
- `UNSUPPORTED_FILE_TYPE`: File type not supported
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `PROCESSING_ERROR`: Error during file processing
- `EXTERNAL_SERVICE_ERROR`: External service unavailable
- `INTERNAL_SERVER_ERROR`: Unexpected server error

## WebSocket Events (Real-time Updates)

### Connection

```javascript
const ws = new WebSocket('wss://dev-rlm.passkey.com/ws/updates');
```

### Event Types

#### Processing Status Update
```json
{
  "type": "processing_status",
  "uploadId": "uuid-string",
  "status": "processing",
  "progress": {
    "totalRows": 1000,
    "processedRows": 250
  }
}
```

#### Processing Complete
```json
{
  "type": "processing_complete",
  "uploadId": "uuid-string",
  "status": "completed",
  "summary": {
    "totalRows": 1000,
    "successfulRows": 950,
    "errorRows": 50
  }
}
```

#### Error Notification
```json
{
  "type": "error",
  "uploadId": "uuid-string",
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Failed to process row 150"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent system overload:

- **File Uploads**: 10 uploads per minute per user
- **Status Checks**: 60 requests per minute per user
- **Processing Operations**: 3 concurrent processes per event
- **Validation Requests**: 30 requests per minute per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642248660
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { RLMClient } from '@cvent/passkey-rlm-client';

const client = new RLMClient({
  baseUrl: 'https://dev-rlm.passkey.com',
  sessionToken: 'your-session-token'
});

// Upload file
const upload = await client.uploadFile({
  file: fileBlob,
  eventId: '12345',
  processType: 'create'
});

// Monitor progress
const status = await client.getUploadStatus(upload.uploadId);
console.log(`Progress: ${status.progress.processedRows}/${status.progress.totalRows}`);
```

### Java

```java
import com.cvent.passkey.rlm.client.RLMClient;

RLMClient client = new RLMClient.Builder()
    .baseUrl("https://dev-rlm.passkey.com")
    .sessionToken("your-session-token")
    .build();

// Upload file
UploadResponse upload = client.uploadFile(
    UploadRequest.builder()
        .file(fileBytes)
        .eventId("12345")
        .processType("create")
        .build()
);

// Monitor progress
UploadStatus status = client.getUploadStatus(upload.getUploadId());
System.out.println("Progress: " + status.getProgress().getProcessedRows() + 
                  "/" + status.getProgress().getTotalRows());
```