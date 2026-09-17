# API Reference

## Base URL

The service is accessible via DNS names that follow the pattern:
- **Development**: `passkey-clamav-{environment}.{internal-domain}`
- **Production**: `passkey-clamav-pr50.{internal-domain}`
- **CI**: `passkey-clamav-ci-{version}.{internal-domain}`

## Protocol

Passkey ClamAV uses the **ClamAV daemon protocol** over TCP on port **3310**. This is not a REST API but a binary protocol for efficient virus scanning.

## Connection Details

- **Port**: 3310
- **Protocol**: TCP
- **Connection Type**: Persistent or per-request
- **Timeout**: Configurable (default: 30 seconds)

## ClamAV Commands

### PING
**Description**: Test if the daemon is alive and responding

**Command**: `PING`

**Response**: `PONG`

**Example**:
```bash
echo "PING" | nc passkey-clamav-pr50.internal.domain 3310
# Response: PONG
```

### VERSION
**Description**: Get the version of ClamAV daemon

**Command**: `VERSION`

**Response**: Version information string

**Example**:
```bash
echo "VERSION" | nc passkey-clamav-pr50.internal.domain 3310
# Response: ClamAV 1.0.0/26849/Mon Jan 29 09:14:23 2024
```

### SCAN (File Path)
**Description**: Scan a file by its path (not typically used in containerized environment)

**Command**: `SCAN /path/to/file`

**Response**: 
- `{filepath}: OK` - File is clean
- `{filepath}: {virus_name} FOUND` - Virus detected

### INSTREAM
**Description**: Scan data sent through the socket (primary method for file scanning)

**Command Format**:
1. Send `INSTREAM`
2. Send data in chunks with 4-byte length prefix
3. Send 0-length chunk to indicate end

**Response**:
- `stream: OK` - No virus found
- `stream: {virus_name} FOUND` - Virus detected
- `stream: {error_message} ERROR` - Scanning error

**Example** (conceptual):
```bash
# This is typically handled by client libraries
echo -e "INSTREAM\n" | nc passkey-clamav-pr50.internal.domain 3310
# Then send: [4-byte length][data chunk][4-byte length][data chunk]...[0000]
```

### STATS
**Description**: Get daemon statistics

**Command**: `STATS`

**Response**: Statistics including pools, threads, queue, and memory usage

### RELOAD
**Description**: Reload virus database (admin command)

**Command**: `RELOAD`

**Response**: `RELOADING`

## Client Integration

### Node.js Example
```javascript
const net = require('net');

function scanBuffer(buffer, host, port = 3310) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(port, host);
    
    client.on('connect', () => {
      client.write('INSTREAM\n');
      
      // Send buffer length (4 bytes, big-endian)
      const lengthBuffer = Buffer.alloc(4);
      lengthBuffer.writeUInt32BE(buffer.length, 0);
      client.write(lengthBuffer);
      
      // Send file data
      client.write(buffer);
      
      // Send termination (0 length)
      const termBuffer = Buffer.alloc(4);
      termBuffer.writeUInt32BE(0, 0);
      client.write(termBuffer);
    });
    
    client.on('data', (data) => {
      const response = data.toString().trim();
      client.end();
      
      if (response.includes('OK')) {
        resolve({ clean: true, virus: null });
      } else if (response.includes('FOUND')) {
        const virus = response.match(/stream: (.+) FOUND/)?.[1];
        resolve({ clean: false, virus });
      } else {
        reject(new Error(`Scan error: ${response}`));
      }
    });
    
    client.on('error', reject);
  });
}
```

### Java Example
```java
import java.io.*;
import java.net.*;

public class ClamAVClient {
    public ScanResult scanBytes(byte[] data, String host, int port) throws IOException {
        try (Socket socket = new Socket(host, port);
             OutputStream out = socket.getOutputStream();
             InputStream in = socket.getInputStream()) {
            
            // Send INSTREAM command
            out.write("INSTREAM\n".getBytes());
            
            // Send data length (4 bytes, big-endian)
            out.write(intToBytes(data.length));
            
            // Send data
            out.write(data);
            
            // Send termination (0 length)
            out.write(intToBytes(0));
            
            // Read response
            BufferedReader reader = new BufferedReader(new InputStreamReader(in));
            String response = reader.readLine();
            
            return parseResponse(response);
        }
    }
    
    private byte[] intToBytes(int value) {
        return new byte[] {
            (byte)(value >>> 24),
            (byte)(value >>> 16),
            (byte)(value >>> 8),
            (byte)value
        };
    }
}
```

## Response Codes and Status

### Success Responses
- `OK` - File is clean, no virus detected
- `PONG` - Daemon is alive (response to PING)
- `RELOADING` - Database reload initiated

### Virus Detection
- `{virus_name} FOUND` - Specific virus detected
- Common virus names: `Eicar-Test-Signature`, `Win.Trojan.Agent`, etc.

### Error Responses
- `UNKNOWN COMMAND` - Invalid command sent
- `SIZE LIMIT EXCEEDED` - File too large to scan
- `ACCESS DENIED` - Permission error
- `ENGINE ERROR` - Internal ClamAV error

## Configuration Limits

Based on the ClamAV configuration (`clamav/clamd.conf`):

- **Max File Size**: Configurable (typically 100MB)
- **Max Scan Size**: Configurable (typically 100MB)  
- **Max Recursion**: 10 levels for archives
- **Timeout**: 30 seconds per scan
- **Connection Timeout**: 30 seconds

## Health Check Endpoint

The service includes health checks integrated with the ECS service:

- **Method**: TCP connection test on port 3310
- **Frequency**: Every 30 seconds
- **Healthy Threshold**: 3 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures

## Error Handling

### Connection Errors
- **Connection Refused**: Service is down or unreachable
- **Timeout**: Network or processing timeout
- **Connection Reset**: Service restart or overload

### Protocol Errors
- **Invalid Command**: Check command syntax
- **Malformed Data**: Ensure proper data formatting
- **Size Limits**: File exceeds configured limits

### Best Practices
1. **Connection Pooling**: Reuse connections for multiple scans
2. **Timeout Handling**: Set appropriate client timeouts
3. **Retry Logic**: Implement exponential backoff for transient errors
4. **Error Logging**: Log all scan results and errors for debugging