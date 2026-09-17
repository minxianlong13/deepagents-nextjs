# Development Guide

## Prerequisites

### Required Software
- **Node.js**: Version 18.x (LTS)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version` should show v18.x.x

- **pnpm**: Version 8.15.7+
  - Install: `npm install -g pnpm@8.15.7`
  - Verify: `pnpm --version`

- **Docker**: Latest stable version
  - Download from [docker.com](https://www.docker.com/)
  - Required for containerized development and testing

- **Google Chrome**: Latest stable version
  - Required for Puppeteer screenshot functionality
  - Automatically installed in Docker container

### Optional Tools
- **AWS CLI**: For S3 bucket access during development
- **Visual Studio Code**: Recommended IDE with TypeScript support
- **Postman**: For API testing and debugging

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-screenshot-service.git
cd passkey-screenshot-service
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm list
```

### 3. Environment Configuration
Create environment configuration files:

```bash
# Create local environment file
cp packages/service/.env.example packages/service/.env.local
```

Edit `packages/service/.env.local`:
```env
BUCKET_NAME=passkey-screenshots-dev
DW_ROOT_PATH=/local
NODE_ENV=development
```

### 4. SSL Certificate Setup
The service requires SSL certificates for HTTPS operation:

```bash
cd packages/service/cert

# Generate self-signed certificates for local development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=US/ST=VA/L=McLean/O=Cvent/CN=localhost"

# Copy certificates to source directory
cp key.pem ../src/
cp cert.pem ../src/
```

### 5. Start Development Server
```bash
cd packages/service

# Start in development mode (with hot reload)
pnpm dev

# Alternative: Start in production mode
pnpm dev:prod
```

The service will be available at `https://localhost:7443`

### 6. Verify Installation
Test the health endpoint:
```bash
curl -k https://localhost:7443/local/ok
```

Expected response:
```json
{"Status":"UP"}
```

## Development Workflow

### Project Structure
```
passkey-screenshot-service/
├── packages/
│   ├── service/                 # Main application
│   │   ├── src/                # TypeScript source code
│   │   │   ├── App.ts          # Express server setup
│   │   │   ├── ScreenshotService.ts    # Main business logic
│   │   │   ├── WebScreenshotService.ts # Browser automation
│   │   │   ├── DBClientService.ts      # S3 operations
│   │   │   ├── ResizeService.ts        # Image processing
│   │   │   └── RequestUtils.ts         # Request handling
│   │   ├── tests/              # Test files
│   │   ├── Resources/          # Static assets
│   │   ├── cert/              # SSL certificates
│   │   └── package.json       # Service dependencies
│   └── infra/                  # Infrastructure code
│       ├── lib/               # CDK stack definitions
│       ├── bin/               # CDK app entry points
│       └── tests/             # Infrastructure tests
├── .changeset/                # Version management
├── docs/                      # Documentation
└── package.json              # Root workspace configuration
```

### Development Commands

#### Service Development
```bash
cd packages/service

# Development with hot reload
pnpm dev

# Build TypeScript
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Lint code
pnpm lint

# Fix linting issues
pnpm fix

# Format code
pnpm format
```

#### Docker Development
```bash
cd packages/service

# Build Docker image
docker build -t passkey-screenshot-service .

# Run container
docker run -p 7443:7443 \
  -e BUCKET_NAME=passkey-screenshots-dev \
  passkey-screenshot-service

# Development with Docker
pnpm dev:docker
```

#### Infrastructure Development
```bash
cd packages/infra

# Install CDK dependencies
pnpm install

# Synthesize CloudFormation templates
pnpm cdk synth

# Deploy to development environment
pnpm deploy:sandbox

# Run infrastructure tests
pnpm test
```

### Code Structure Guidelines

#### Service Layer Organization
- **App.ts**: Express server configuration and routing
- **ScreenshotService.ts**: Main business logic and orchestration
- **WebScreenshotService.ts**: Browser automation with Puppeteer
- **DBClientService.ts**: S3 storage operations
- **ResizeService.ts**: Image processing with Sharp
- **RequestUtils.ts**: Request parsing and validation

#### Naming Conventions
- **Files**: PascalCase for classes, camelCase for utilities
- **Functions**: camelCase with descriptive names
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names

#### Error Handling
```typescript
// Use try-catch for async operations
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  LOG.error('Operation failed: %s', error.message);
  throw new Error('Descriptive error message');
}

// Use proper error types
if (!isValidUrl(url)) {
  throw new ValidationError('Invalid URL format');
}
```

#### Logging Standards
```typescript
import { LoggerFactory } from '@cvent/logging/LoggerFactory';

const LOG = LoggerFactory.create('ServiceName');

// Use appropriate log levels
LOG.debug('Debug information: %s', debugData);
LOG.info('Operation completed: %s', operationName);
LOG.warn('Warning condition: %s', warningMessage);
LOG.error('Error occurred: %s', error.message);
```

## Running Tests

### Unit Tests
```bash
cd packages/service

# Run all tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test ScreenshotService.test.ts

# Run tests in watch mode
pnpm test --watch
```

### Integration Tests
```bash
# Run integration tests (requires Docker)
pnpm test:integration

# Run with real S3 bucket (requires AWS credentials)
AWS_PROFILE=dev pnpm test:integration
```

### Test Structure
```typescript
// Example test file: ScreenshotService.test.ts
import { processScreenshot } from '../src/ScreenshotService';
import { Request, Response } from 'express';

describe('ScreenshotService', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: { imageId: 'test123' },
      query: { websiteUrl: 'https://demo.passkey.com' }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn()
    };
  });

  it('should process valid screenshot request', async () => {
    await processScreenshot(mockRequest as Request, mockResponse as Response);
    
    expect(mockResponse.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': expect.any(Number)
    });
  });

  it('should reject invalid domains', async () => {
    mockRequest.query = { websiteUrl: 'https://malicious.com' };
    
    await processScreenshot(mockRequest as Request, mockResponse as Response);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });
});
```

## Debugging

### Local Debugging
```bash
# Start with debugging enabled
cd packages/service
NODE_OPTIONS="--inspect" pnpm dev

# Connect debugger (VS Code)
# Create .vscode/launch.json:
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Process",
  "port": 9229,
  "restart": true,
  "localRoot": "${workspaceFolder}/packages/service",
  "remoteRoot": "/service"
}
```

### Browser Debugging
```typescript
// Enable Puppeteer debugging
const browser = await puppeteer.launch({
  headless: false,  // Show browser window
  devtools: true,   // Open DevTools
  slowMo: 250      // Slow down operations
});
```

### Log Debugging
```bash
# Enable debug logs
DEBUG=* pnpm dev

# Filter specific modules
DEBUG=ScreenshotService pnpm dev

# View logs in real-time
tail -f logs/application.log
```

## Coding Standards

### TypeScript Configuration
- **Strict Mode**: Enabled for type safety
- **No Implicit Any**: All types must be explicit
- **Null Checks**: Strict null checking enabled
- **ES2020 Target**: Modern JavaScript features

### ESLint Rules
```json
{
  "extends": ["@cvent/eslint-config"],
  "rules": {
    "no-console": "error",
    "prefer-const": "error",
    "no-var": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### Code Formatting
```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check

# Auto-fix on save (VS Code)
# Add to settings.json:
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Git Hooks
```bash
# Install pre-commit hooks
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "pnpm lint && pnpm test"
```

## Common Development Tasks

### Adding a New Endpoint
1. **Define Route** in `App.ts`:
```typescript
app.get(`${rootPath}/new-endpoint`, async (req: Request, res: Response) => {
  await newEndpointHandler(req, res);
});
```

2. **Implement Handler** in appropriate service:
```typescript
export async function newEndpointHandler(req: Request, res: Response) {
  // Implementation
}
```

3. **Add Tests**:
```typescript
describe('New Endpoint', () => {
  it('should handle valid requests', async () => {
    // Test implementation
  });
});
```

### Adding New Dependencies
```bash
# Add production dependency
pnpm add package-name

# Add development dependency
pnpm add -D package-name

# Update package.json and install
pnpm install
```

### Environment-Specific Configuration
```typescript
// Use environment variables
const config = {
  bucketName: process.env.BUCKET_NAME || 'default-bucket',
  timeout: parseInt(process.env.TIMEOUT || '30000'),
  debug: process.env.NODE_ENV === 'development'
};
```

### Performance Profiling
```bash
# Profile memory usage
node --inspect --max-old-space-size=4096 output/App.js

# Profile CPU usage
node --prof output/App.js

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 7443
lsof -i :7443

# Kill process
kill -9 <PID>
```

#### SSL Certificate Issues
```bash
# Regenerate certificates
cd packages/service/cert
rm *.pem
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

#### Chrome/Puppeteer Issues
```bash
# Install Chrome dependencies (Linux)
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2

# Use system Chrome
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm dev
```

### Debug Commands
```bash
# Check service health
curl -k https://localhost:7443/local/ok

# Test screenshot endpoint
curl -k "https://localhost:7443/local/picture/test?websiteUrl=https://demo.passkey.com" \
  --output test-screenshot.jpg

# Check logs
tail -f logs/application.log

# Monitor resource usage
docker stats passkey-screenshot-service
```

### Getting Help
- **Internal Documentation**: Check Confluence wiki
- **Team Slack**: #passkey-team channel
- **Code Reviews**: Create pull request for feedback
- **Architecture Questions**: Consult with senior developers

## Additional Resources

## Quick Start


### Prerequisites

- Node.js 18+
- pnpm 8.15.7+
- Docker (for containerized deployment)
- Google Chrome (installed in container)

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
cd packages/service
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### Docker Development

```bash
# Build and run with Docker
cd packages/service
pnpm dev:docker
```

### Environment Variables

- `BUCKET_NAME`: S3 bucket name for screenshot storage
- `DW_ROOT_PATH`: API root path (default: `/local`)

## API Endpoints


### Screenshot Endpoint
```
GET /local/picture/:imageId?websiteUrl=<url>&width=<width>&height=<height>
```

### Health Check
```
GET /local/ok
```
