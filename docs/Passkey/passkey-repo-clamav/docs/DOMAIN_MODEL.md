# Domain Model

## Glossary

### Antivirus Scanning
The process of examining files, data streams, or system memory for malicious software (malware) using signature-based detection, heuristic analysis, and behavioral monitoring.

### ClamAV
An open-source antivirus engine designed for detecting trojans, viruses, malware, and other malicious threats. Originally developed for Unix-like systems but now cross-platform.

### ClamAV Daemon (clamd)
The background service component of ClamAV that provides on-demand scanning capabilities through a TCP socket interface, allowing multiple clients to perform virus scans efficiently.

### FreshClam
The automatic virus database update tool for ClamAV that downloads the latest virus signatures and definitions from ClamAV's update servers.

### Virus Signature
A unique pattern or fingerprint that identifies a specific piece of malware. ClamAV uses these signatures to detect known threats in scanned files.

### INSTREAM Protocol
ClamAV's binary protocol for scanning data sent directly through a TCP connection, allowing clients to scan file contents without requiring file system access.

### EICAR Test File
A standard antivirus test file (European Institute for Computer Antivirus Research) used to verify that antivirus software is working correctly without using actual malware.

### Malware
Malicious software designed to damage, disrupt, or gain unauthorized access to computer systems, including viruses, trojans, worms, ransomware, and spyware.

### Quarantine
The process of isolating detected malicious files to prevent them from causing harm while allowing for further analysis or safe removal.

### False Positive
When antivirus software incorrectly identifies a clean, legitimate file as malicious, potentially blocking or removing safe content.

### Heuristic Analysis
A detection method that identifies potentially malicious behavior or characteristics in files, even if they don't match known virus signatures.

## Core Entities

### Scan Request
**Description**: Represents a request to scan file content for malware

**Attributes**:
- `data`: Buffer or stream - The file content to be scanned
- `size`: Number - Size of the data in bytes
- `timestamp`: Date - When the scan was initiated
- `clientId`: String - Identifier of the requesting client

**Relationships**:
- Has one Scan Result
- Originates from Client Application

### Scan Result
**Description**: The outcome of a malware scan operation

**Attributes**:
- `status`: Enum - CLEAN, INFECTED, ERROR
- `virusName`: String - Name of detected virus (if any)
- `scanTime`: Number - Duration of scan in milliseconds
- `errorMessage`: String - Error details (if status is ERROR)

**Relationships**:
- Belongs to one Scan Request
- May reference Virus Definition

### Virus Definition
**Description**: A signature or pattern used to identify specific malware

**Attributes**:
- `signatureId`: String - Unique identifier for the signature
- `virusName`: String - Human-readable name of the virus
- `severity`: Enum - LOW, MEDIUM, HIGH, CRITICAL
- `lastUpdated`: Date - When this definition was last updated
- `category`: String - Type of malware (trojan, worm, etc.)

**Relationships**:
- Referenced by Scan Results
- Part of Virus Database

### Virus Database
**Description**: Collection of all virus definitions and signatures

**Attributes**:
- `version`: String - Database version number
- `lastUpdate`: Date - When database was last refreshed
- `signatureCount`: Number - Total number of signatures
- `updateSource`: String - Source URL for updates

**Relationships**:
- Contains many Virus Definitions
- Updated by FreshClam Service

### Client Connection
**Description**: A TCP connection from a client application to the ClamAV daemon

**Attributes**:
- `connectionId`: String - Unique connection identifier
- `clientAddress`: String - IP address of connecting client
- `establishedAt`: Date - Connection establishment time
- `lastActivity`: Date - Last command received
- `status`: Enum - ACTIVE, IDLE, CLOSED

**Relationships**:
- Generates multiple Scan Requests
- Belongs to Client Application

### Service Configuration
**Description**: Runtime configuration parameters for the ClamAV service

**Attributes**:
- `maxFileSize`: Number - Maximum file size for scanning (bytes)
- `maxScanSize`: Number - Maximum data to scan within a file
- `maxRecursion`: Number - Maximum archive extraction depth
- `scanTimeout`: Number - Timeout for individual scans (seconds)
- `logLevel`: Enum - DEBUG, INFO, WARN, ERROR

**Relationships**:
- Applied to all Scan Requests
- Managed by Service Instance

## Business Rules

### File Size Limits
- Files exceeding `maxFileSize` configuration are rejected without scanning
- Compressed archives are limited by `maxScanSize` for extracted content
- Recursive archive extraction is limited to `maxRecursion` levels

### Scan Timeout Rules
- Individual scans must complete within `scanTimeout` seconds
- Connections idle for more than connection timeout are automatically closed
- Long-running scans are terminated and marked as ERROR

### Virus Detection Logic
1. **Signature Matching**: Primary detection method using known virus signatures
2. **Heuristic Analysis**: Secondary detection for suspicious patterns
3. **Archive Scanning**: Recursive scanning of compressed files and containers
4. **Clean Result**: File passes all detection methods

### Database Update Rules
- Virus definitions are updated automatically via FreshClam
- Updates occur at configured intervals (typically hourly)
- Service continues operating with existing definitions if updates fail
- Critical updates may trigger service restart for immediate application

### Error Handling Rules
- **Corrupted Files**: Return ERROR status with descriptive message
- **Unsupported Formats**: Attempt best-effort scanning or skip gracefully
- **Resource Exhaustion**: Reject new requests until resources are available
- **Network Errors**: Maintain service availability with cached definitions

### Security Rules
- All scan operations are logged for audit purposes
- Detected malware details are logged but infected content is not stored
- Client connections are rate-limited to prevent abuse
- Service operates in isolated network environment

### Performance Rules
- Concurrent scan limit based on available CPU and memory resources
- Priority given to smaller files for faster throughput
- Large file scans may be queued during high load periods
- Health checks ensure service responsiveness

## Data Flow Patterns

### Standard Scan Flow
1. Client establishes TCP connection to port 3310
2. Client sends INSTREAM command
3. Client transmits file data with length prefixes
4. ClamAV processes data against virus database
5. Service returns scan result (CLEAN/INFECTED/ERROR)
6. Connection may be reused or closed

### Database Update Flow
1. FreshClam checks for database updates on schedule
2. Downloads new signatures from ClamAV servers
3. Validates and installs updated definitions
4. Notifies daemon to reload virus database
5. Service continues with updated detection capabilities

### Error Recovery Flow
1. Service detects error condition (timeout, corruption, etc.)
2. Logs error details for debugging
3. Returns appropriate error response to client
4. Maintains service availability for other requests
5. May trigger automatic recovery procedures