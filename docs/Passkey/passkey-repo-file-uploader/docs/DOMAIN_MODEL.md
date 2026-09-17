# Domain Model

## Glossary

### File Upload
A complete file transfer operation from a client application to the Passkey File Uploader service, including the file content, metadata, and processing workflow.

### Upload Metadata
Comprehensive information about an uploaded file, including system-generated identifiers, original file properties, processing status, and application context.

### File Metadata
Application-provided context information that accompanies a file upload, specifying the source application and logical file type for proper categorization and processing.

### Upload Status
The current state of a file within the processing pipeline, indicating whether it's been uploaded, is being processed, is ready for use, or has encountered an error.

### Application Context
The identifier of the Passkey service or application that initiated the file upload, used for access control, auditing, and workflow routing.

### File Type
A logical categorization of the uploaded file's purpose or content type, distinct from the technical MIME type, used for business logic and processing decisions.

### Malware Scanning
Automated security process that examines uploaded files for malicious content using ClamAV antivirus engine before marking files as ready for use.

### Alternate Version
A processed or transformed version of the original uploaded file, such as thumbnails, compressed versions, or format conversions, accessible via separate endpoints.

### File Identifier
A system-generated UUID that uniquely identifies an uploaded file throughout its lifecycle, used for all subsequent operations and references.

### Multipart Upload
HTTP upload mechanism that allows sending both file content and metadata in a single request using multipart/form-data encoding.

## Core Entities

### FileMetadata

**Description**: Input metadata provided by client applications during file upload to specify context and categorization.

**Attributes**:
- `application`: String - The name of the Passkey application uploading the file
- `type`: String - The logical category or purpose of the file

**Relationships**:
- Used as input for creating UploadMetadata
- Embedded within UploadMetadata for persistence

**Business Rules**:
- Both application and type are required fields
- Application must be a valid Passkey service identifier
- Type should follow established naming conventions for consistency

**Example Values**:
```json
{
  "application": "passkey-reservation",
  "type": "contract"
}
```

### UploadMetadata

**Description**: Complete file information maintained by the system throughout the file's lifecycle.

**Attributes**:
- `id`: String (UUID) - Unique system-generated identifier
- `originalName`: String - Original filename as provided by the client
- `contentType`: String - MIME type detected from file content
- `fileSize`: Long - Size of the file in bytes
- `status`: UploadStatus - Current processing state
- `application`: String - Source application identifier
- `type`: String - Logical file category

**Relationships**:
- Contains FileMetadata information
- References stored file content in S3
- Tracked through status transitions

**Business Rules**:
- ID is immutable once generated
- Status follows defined state transitions
- File size must be within configured limits
- Original name preserved for download purposes

**State Transitions**:
```
UPLOADED → PROCESSING → READY
UPLOADED → PROCESSING → ERROR
```

### UploadStatus

**Description**: Enumeration representing the current state of a file in the processing pipeline.

**Values**:
- `UPLOADED`: File has been received and stored but not yet processed
- `PROCESSING`: File is currently undergoing processing (malware scanning, etc.)
- `READY`: File has completed all processing and is available for download
- `ERROR`: An error occurred during processing, file may not be usable

**State Transitions**:
- **UPLOADED → PROCESSING**: Automatic transition when processing begins
- **PROCESSING → READY**: Successful completion of all processing steps
- **PROCESSING → ERROR**: Processing failure or malware detection
- **ERROR → PROCESSING**: Manual retry of failed processing (admin only)

**Business Rules**:
- Files in UPLOADED or PROCESSING states are not available for download
- Only READY files can be downloaded by clients
- ERROR state requires investigation and potential manual intervention
- Status changes are logged for audit purposes

## Business Rules

### File Upload Constraints

1. **Size Limitations**:
   - Maximum file size: 100 MB per upload
   - Minimum file size: 1 byte (empty files rejected)
   - Size validation occurs before storage

2. **File Type Restrictions**:
   - All common file types accepted
   - Executable files (.exe, .bat, .sh) may be restricted
   - MIME type validation against file content

3. **Security Requirements**:
   - All files must pass malware scanning
   - Files containing viruses are quarantined and marked as ERROR
   - Suspicious files may require manual review

### Access Control Rules

1. **Authentication Requirements**:
   - Valid OAuth token with FILE_UPLOAD scope required
   - Token must not be expired or revoked
   - User must have appropriate permissions

2. **Authorization Policies**:
   - Users can only access files uploaded by their application context
   - Cross-application access requires elevated permissions
   - Admin users can access all files for support purposes

### Data Retention Policies

1. **File Lifecycle**:
   - Files are retained indefinitely unless explicitly deleted
   - Metadata is preserved even after file deletion for audit purposes
   - Backup copies maintained according to disaster recovery policies

2. **Cleanup Procedures**:
   - Failed uploads (ERROR status) may be automatically cleaned up after 30 days
   - Temporary processing files are cleaned up immediately after processing
   - Audit logs are retained for compliance requirements

### Processing Workflows

1. **Standard Upload Flow**:
   ```
   Client Upload → Validation → Storage → Malware Scan → Ready
   ```

2. **Error Handling**:
   - Validation failures result in immediate rejection
   - Storage failures trigger retry mechanisms
   - Malware detection results in quarantine and notification

3. **Alternate Version Generation**:
   - Triggered based on file type and application requirements
   - Generated asynchronously after main file is READY
   - Failures in alternate generation don't affect main file status

## Integration Patterns

### Client Integration

**Upload Pattern**:
```java
// 1. Prepare metadata
FileMetadata metadata = ImmutableFileMetadata.builder()
    .application("passkey-reservation")
    .type("floor-plan")
    .build();

// 2. Upload file
UploadMetadata result = client.uploadFile(file, metadata);

// 3. Poll for completion
while (result.getStatus() != UploadStatus.READY) {
    Thread.sleep(1000);
    result = client.getFileStatus(result.getId());
}

// 4. Use file
InputStream content = client.downloadFile(result.getId());
```

**Error Handling Pattern**:
```java
try {
    UploadMetadata result = client.uploadFile(file, metadata);
    return result.getId();
} catch (FileTooLargeException e) {
    // Handle size limit exceeded
} catch (UnsupportedFileTypeException e) {
    // Handle invalid file type
} catch (MalwareDetectedException e) {
    // Handle security violation
}
```

### Service Integration

**Async Processing Pattern**:
- Services upload files and receive immediate response
- Background processing updates file status
- Services poll or receive webhooks for completion
- Download occurs only after READY status confirmed

**Batch Operations Pattern**:
- Multiple files uploaded with same application context
- Bulk status checking for efficiency
- Coordinated processing for related files

## Data Consistency

### Transactional Boundaries

1. **Upload Transaction**:
   - File storage and metadata creation are atomic
   - Failure in either operation results in complete rollback
   - Partial uploads are not persisted

2. **Status Updates**:
   - Status changes are immediately consistent
   - Multiple concurrent status checks return consistent results
   - Status history is maintained for audit purposes

### Eventual Consistency

1. **Cross-Service Updates**:
   - Malware scan results may have slight delay
   - Alternate version availability is eventually consistent
   - Client applications should handle temporary inconsistencies

2. **Replication Lag**:
   - Read replicas may have slight delay for status updates
   - Critical operations use primary database
   - Monitoring ensures replication lag stays within acceptable bounds

## Performance Characteristics

### Scalability Limits

- **Concurrent Uploads**: 1000 simultaneous uploads per instance
- **File Processing**: 100 files processed concurrently
- **Storage Throughput**: Limited by S3 performance characteristics
- **Database Connections**: Pooled connections with circuit breaker patterns

### Caching Strategy

- **Metadata Caching**: Frequently accessed file metadata cached for 5 minutes
- **Status Caching**: File status cached for 30 seconds to reduce database load
- **Content Caching**: File content not cached due to size and access patterns

### Monitoring Metrics

- **Upload Success Rate**: Percentage of successful uploads
- **Processing Time**: Average time from upload to READY status
- **Error Rates**: Breakdown by error type and cause
- **Storage Utilization**: Total files and storage consumption
- **API Response Times**: Latency metrics for all endpoints