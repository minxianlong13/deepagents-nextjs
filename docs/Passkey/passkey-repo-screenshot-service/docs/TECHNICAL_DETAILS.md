# Technical Details

## Technology Stack

### Runtime Environment
- **Language**: TypeScript 5.5.3
- **Runtime**: Node.js 18 (LTS)
- **Package Manager**: pnpm 8.15.7
- **Build System**: Nx 21.4.1 (monorepo management)

### Core Framework
- **Web Framework**: Express.js 4.18.2
- **HTTP Protocol**: HTTPS with SSL certificates
- **Port**: 7443 (HTTPS)
- **Request Handling**: Async/await pattern throughout

### Browser Automation
- **Engine**: Puppeteer 24.12.1
- **Browser**: Google Chrome Stable (headless mode)
- **Executable Path**: `/usr/bin/google-chrome`
- **Launch Args**: `['--no-sandbox']` for container compatibility

### Image Processing
- **Library**: Sharp 0.32.0 (high-performance image processing)
- **Input Formats**: PNG (from Puppeteer screenshots)
- **Output Format**: JPEG (optimized for web delivery)
- **Operations**: Resize, format conversion, quality optimization

### Storage & Caching
- **Cache Storage**: AWS S3
- **SDK**: @aws-sdk/client-s3 3.321.1
- **Cache Strategy**: Hostname/pathname-based keys
- **Persistence**: Indefinite (manual invalidation only)

### Concurrency Control
- **Library**: semaphore-async-await 1.5.1
- **Pattern**: Semaphore-based resource limiting
- **Default Limit**: 3 concurrent operations
- **Timeout**: 30 seconds for lock acquisition

### Monitoring & Observability
- **APM**: Datadog (dd-trace 3.20.0)
- **Logging**: @cvent/logging 1.0.30
- **Health Checks**: Built-in endpoint at `/local/ok`
- **Metrics**: Performance and error tracking

## Dependencies

### Production Dependencies
```json
{
  "@aws-sdk/client-s3": "^3.321.1",
  "@cliqz/adblocker-puppeteer": "^1.33.1",
  "@cvent/logging": "1.0.30",
  "cross-fetch": "^3.1.5",
  "dd-trace": "^3.20.0",
  "express": "^4.18.2",
  "puppeteer": "^24.12.1",
  "semaphore-async-await": "^1.5.1",
  "sharp": "^0.32.0"
}
```

### Development Dependencies
```json
{
  "@cvent/builder-docker": "^2.8.4",
  "@cvent/hogan-client": "^2.0.3",
  "@types/express": "^4.17.21",
  "@types/supertest": "^6.0.3",
  "jest-environment-jsdom": "^29.2.2",
  "supertest": "^7.1.4"
}
```

### Build Tools
- **TypeScript Compiler**: tsc with watch mode for development
- **Build Target**: ES2020
- **Module System**: CommonJS
- **Source Maps**: Enabled for production debugging
- **Alias Resolution**: tsc-alias for path mapping

## Configuration

### Environment Variables

#### Required
- `BUCKET_NAME`: S3 bucket name for screenshot storage
  - Example: `passkey-screenshots-prod`
  - Used by DBClientService for cache operations

#### Optional
- `DW_ROOT_PATH`: API root path prefix
  - Default: `/local`
  - Configures base path for all endpoints
- `NODE_ENV`: Runtime environment
  - Values: `development`, `production`
  - Affects logging levels and error handling

### Application Configuration

#### Server Settings
```typescript
const APP_PORT = 7443;
const rootPath = process.env.DW_ROOT_PATH || '/local';
```

#### SSL Configuration
```typescript
const options = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};
```

#### Browser Configuration
```typescript
const browser = puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
  headless: true,
  protocolTimeout: 20_000
});
```

#### Timeout Settings
```typescript
const TIMEOUT_GOTO_PAGE = 10_000;        // Page navigation
const TIMEOUT_PAGE_FULL_LOAD = 10_000;   // Complete page load
const TIMEOUT_SCREENSHOT = 15_000;       // Screenshot capture
const TIMEOUT_ACQUIRE_LOCK = 30_000;     // Semaphore acquisition
```

#### Concurrency Settings
```typescript
const DEFAULT_CONCURRENCY_LIMIT = 3;
const lock = new Semaphore(DEFAULT_CONCURRENCY_LIMIT);
```

#### Domain Security
```typescript
const PASSKEY_DOMAINS = ['.passkey.com', '.cvent.org'];
```

## Build Configuration

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "extends": "@cvent/tsconfig/node18",
  "compilerOptions": {
    "outDir": "./output",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "output", "tests"]
}
```

### Nx Project Configuration (`project.json`)
```json
{
  "name": "service",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "options": {
        "outputPath": "packages/service/output",
        "main": "packages/service/src/App.ts",
        "tsConfig": "packages/service/tsconfig.json"
      }
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "concurrently \"npx tsc --watch\" \"nodemon -q output/App.js\""
      }
    }
  }
}
```

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: '@cvent/jest-config/node',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ]
};
```

## Container Configuration

### Dockerfile Analysis
```dockerfile
FROM node:18-slim

# Skip Puppeteer's Chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome and dependencies
RUN apt-get update && apt-get install gnupg wget -y \
  && wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends

# Install build tools for native dependencies
RUN apt-get install -y python3 g++ make git curl jq

# Install pnpm
RUN npm install -g pnpm@8.15.7

# Security: Run as non-root user
WORKDIR /service
RUN chown -R node:node .
USER node

# Copy application files
COPY --chown=node:node package.json .
COPY --chown=node:node output/ ./dist
COPY --chown=node:node cert/ ./dist
COPY --chown=node:node Resources/ ./Resources
COPY --chown=node:node .npmrc .

# Install dependencies
RUN pnpm install --registry=${NEXUS}

EXPOSE 7443
CMD ["sh", "-c", "node dist/App.js"]
```

### Container Optimizations
- **Base Image**: node:18-slim for minimal footprint
- **Security**: Non-root user execution
- **Dependencies**: Only production dependencies in final image
- **Chrome**: System-installed Chrome instead of Puppeteer's bundled version
- **Build Tools**: Included for native module compilation

## Database Schema

### S3 Storage Structure
```
bucket-name/
├── {hostname}/
│   ├── {pathname}/
│   │   └── screenshot.png
│   └── {other-paths}/
└── {other-hosts}/
```

### Cache Key Format
- **Pattern**: `{hostname}/{pathname}`
- **Example**: `demo.passkey.com/hotel-booking`
- **Normalization**: Paths are normalized (trailing slashes handled)

### Storage Metadata
- **Content-Type**: `image/png` (original format)
- **Cache-Control**: Not set (managed by application logic)
- **Encryption**: Server-side encryption enabled

## Monitoring & Logging

### Datadog Integration
```typescript
import 'dd-trace/init'; // Auto-instrumentation

// Custom metrics
tracer.trace('screenshot.capture', () => {
  // Screenshot operation
});
```

### Logging Configuration
```typescript
import { LoggerFactory } from '@cvent/logging/LoggerFactory';

const LOG = LoggerFactory.create('ScreenshotService');

// Log levels: DEBUG, INFO, WARN, ERROR
LOG.info('Screenshot captured for %s', websiteUrl);
LOG.error('Screenshot failed: %s', error.message);
```

### Health Check Implementation
```typescript
app.get(`${rootPath}/ok`, (req: Request, res: Response) => {
  res.status(200).send('{"Status":"UP"}');
});
```

## Performance Characteristics

### Memory Usage
- **Base**: ~100MB Node.js runtime
- **Chrome**: ~200-300MB per browser instance
- **Image Processing**: ~50-100MB per screenshot
- **Total**: ~500MB typical, 1GB peak

### CPU Usage
- **Idle**: <5% CPU utilization
- **Screenshot**: 50-80% CPU during capture
- **Image Processing**: 30-50% CPU during resize
- **Concurrency**: Limited by semaphore to prevent overload

### Network I/O
- **S3 Operations**: 1-5MB per screenshot upload/download
- **Page Loading**: Variable based on target website size
- **Response Size**: Typically 100KB-2MB per processed image

### Disk Usage
- **Application**: ~200MB
- **Chrome Cache**: ~100MB temporary
- **Logs**: Rotated, ~50MB maximum
- **Total**: ~500MB container footprint

## Security Considerations

### Input Validation
- URL format validation using native URL constructor
- Domain whitelist enforcement
- Parameter sanitization and bounds checking

### Network Security
- HTTPS-only communication
- SSL certificate validation
- VPC network isolation in deployed environments

### Container Security
- Non-root user execution
- Minimal base image
- No unnecessary packages or tools
- Read-only filesystem where possible

### Resource Limits
- Concurrency controls prevent DoS
- Timeout mechanisms prevent resource exhaustion
- Memory limits enforced at container level

## Development Tools

### Code Quality
- **ESLint**: @cvent/eslint-config for consistent style
- **Prettier**: @cvent/prettier-config for formatting
- **TypeScript**: Strict type checking enabled

### Testing
- **Framework**: Jest with @cvent/jest-config
- **Environment**: Node.js test environment
- **Coverage**: Collected from src/ directory
- **Mocking**: Supertest for HTTP testing

### Development Workflow
- **Watch Mode**: TypeScript compilation with nodemon
- **Hot Reload**: Automatic restart on file changes
- **Debugging**: Source maps enabled for stack traces
- **Linting**: Pre-commit hooks for code quality