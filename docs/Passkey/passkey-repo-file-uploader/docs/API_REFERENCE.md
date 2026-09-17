# API Reference

## Base URL

**Production**: `https://passkey-file-uploader-sb.prod.cvent.org`  
**Staging**: `https://passkey-file-uploader-sb.staging.cvent.org`  
**Development**: `https://passkey-file-uploader-sb.dev.cvent.org`

All API endpoints are prefixed with `/passkey-file-uploader/v1/file-upload`

## Authentication

All endpoints require OAuth authentication with the `FILE_UPLOAD` scope.

**Authorization Header**:
```
Authorization: Bearer <access_token>
```

## Endpoints

### POST /passkey-file-uploader/v1/file-upload

**Description**: Upload a new file with metadata

**Content-Type**: `multipart/form-data`

**Request Parts**:
- `file` (required): The file to upload
- `metadata` (required): JSON metadata about the file

**Metadata Schema**:
```json
{
  "application": "string",  // Name of the uploading application
  "type": "string"         // Logical file type (e.g., "image", "room-list")
}
```

**Example Request**:
```bash
curl -X POST \
  https://passkey-file-uploader-sb.prod.cvent.org/passkey-file-uploader/v1/file-upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F 'metadata={"application":"passkey-reservation","type":"contract"}'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "document.pdf",
  "contentType": "application/pdf",
  "fileSize": 1048576,
  "status": "UPLOADED",
  "application": "passkey-reservation",
  "type": "contract"
}
```

**Status Codes**:
- `200 OK`: File uploaded successfully
- `400 Bad Request`: Invalid file or metadata
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `413 Payload Too Large`: File exceeds size limit
- `415 Unsupported Media Type`: File type not allowed
- `500 Internal Server Error`: Server error during upload

---

### GET /passkey-file-uploader/v1/file-upload/{id}

**Description**: Get the status and metadata of an uploaded file

**Path Parameters**:
- `id` (required): The unique file identifier

**Example Request**:
```bash
curl -X GET \
  https://passkey-file-uploader-sb.prod.cvent.org/passkey-file-uploader/v1/file-upload/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "document.pdf",
  "contentType": "application/pdf",
  "fileSize": 1048576,
  "status": "READY",
  "application": "passkey-reservation",
  "type": "contract"
}
```

**Status Codes**:
- `200 OK`: File metadata retrieved successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: File not found
- `500 Internal Server Error`: Server error

---

### GET /passkey-file-uploader/v1/file-upload/{id}/content

**Description**: Download the original uploaded file

**Path Parameters**:
- `id` (required): The unique file identifier

**Example Request**:
```bash
curl -X GET \
  https://passkey-file-uploader-sb.prod.cvent.org/passkey-file-uploader/v1/file-upload/550e8400-e29b-41d4-a716-446655440000/content \
  -H "Authorization: Bearer <token>" \
  -o downloaded-file.pdf
```

**Response**:
- **Content-Type**: `application/octet-stream`
- **Content-Disposition**: `attachment; filename="original-filename.ext"`
- **Body**: Binary file content

**Status Codes**:
- `200 OK`: File downloaded successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: File not found or not ready for download
- `500 Internal Server Error`: Server error

---

### GET /passkey-file-uploader/v1/file-upload/{id}/content/{alternateType}

**Description**: Download an alternate version of the uploaded file

**Path Parameters**:
- `id` (required): The unique file identifier
- `alternateType` (required): The type of alternate version (e.g., "thumbnail", "compressed")

**Example Request**:
```bash
curl -X GET \
  https://passkey-file-uploader-sb.prod.cvent.org/passkey-file-uploader/v1/file-upload/550e8400-e29b-41d4-a716-446655440000/content/thumbnail \
  -H "Authorization: Bearer <token>" \
  -o thumbnail.jpg
```

**Response**:
- **Content-Type**: `application/octet-stream`
- **Body**: Binary file content for the alternate version

**Status Codes**:
- `200 OK`: Alternate file downloaded successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: File or alternate version not found
- `500 Internal Server Error`: Server error

---

### DELETE /passkey-file-uploader/v1/file-upload/{id}

**Description**: Delete an uploaded file and all its metadata

**Path Parameters**:
- `id` (required): The unique file identifier

**Example Request**:
```bash
curl -X DELETE \
  https://passkey-file-uploader-sb.prod.cvent.org/passkey-file-uploader/v1/file-upload/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

**Response**: No content (empty body)

**Status Codes**:
- `204 No Content`: File deleted successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: File not found
- `500 Internal Server Error`: Server error

## Data Models

### FileMetadata

Input metadata provided during file upload.

```json
{
  "application": "string",  // Required: Name of the uploading application
  "type": "string"         // Required: Logical file type
}
```

**Field Descriptions**:
- `application`: Identifies which Passkey application is uploading the file (e.g., "passkey-reservation", "passkey-housing")
- `type`: Categorizes the file's purpose (e.g., "image", "contract", "room-list", "floor-plan")

### UploadMetadata

Complete file information returned by the API.

```json
{
  "id": "string",           // Unique file identifier (UUID)
  "originalName": "string", // Original filename as uploaded
  "contentType": "string",  // MIME type of the file
  "fileSize": "number",     // File size in bytes
  "status": "string",       // Current processing status
  "application": "string",  // Uploading application name
  "type": "string"         // Logical file type
}
```

**Field Descriptions**:
- `id`: UUID generated by the service for unique file identification
- `originalName`: Preserves the original filename for download purposes
- `contentType`: MIME type detected from the file content
- `fileSize`: Size of the uploaded file in bytes
- `status`: Current processing state (see UploadStatus)
- `application`: Same as provided in FileMetadata
- `type`: Same as provided in FileMetadata

### UploadStatus

Enumeration of possible file processing states.

| Status | Description |
|--------|-------------|
| `UPLOADED` | File has been received and stored, but not yet processed |
| `PROCESSING` | File is currently being processed (e.g., malware scanning) |
| `READY` | File has been fully processed and is ready for download |
| `ERROR` | An error occurred during processing |

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_FILE` | File is corrupted or invalid format |
| 400 | `INVALID_METADATA` | Required metadata fields missing or invalid |
| 400 | `FILE_TOO_LARGE` | File exceeds maximum size limit |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication token |
| 403 | `FORBIDDEN` | Insufficient permissions for operation |
| 404 | `FILE_NOT_FOUND` | Requested file does not exist |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | File type not supported |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Upload Limit**: 100 uploads per hour per user
- **Download Limit**: 1000 downloads per hour per user
- **Status Check Limit**: 10000 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## File Size Limits

- **Maximum File Size**: 100 MB per file
- **Supported Formats**: All common file types (images, documents, archives, etc.)
- **Malware Scanning**: All files are automatically scanned for malware

## SDK Usage

### Java Client

```java
// Initialize client
FileUploaderClient client = FileUploaderClient.builder()
    .baseUrl("https://passkey-file-uploader-sb.prod.cvent.org")
    .accessToken(accessToken)
    .build();

// Upload file
FileMetadata metadata = ImmutableFileMetadata.builder()
    .application("passkey-reservation")
    .type("contract")
    .build();

UploadMetadata result = client.uploadFile(file, metadata);

// Check status
UploadMetadata status = client.getFileStatus(result.getId());

// Download file
InputStream fileStream = client.downloadFile(result.getId());
```

### TypeScript/JavaScript

```typescript
// Upload file
const formData = new FormData();
formData.append('file', file);
formData.append('metadata', JSON.stringify({
  application: 'passkey-reservation',
  type: 'contract'
}));

const response = await fetch('/passkey-file-uploader/v1/file-upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const uploadMetadata = await response.json();
```

## Webhooks (Future Enhancement)

*Note: Webhook functionality is planned for future releases*

The service will support webhooks for real-time status updates:

```json
{
  "event": "file.status.changed",
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "READY",
  "timestamp": "2024-01-15T10:30:00Z"
}
```