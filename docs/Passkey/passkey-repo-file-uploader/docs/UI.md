# User Interface

## Overview
Passkey File Uploader is a Next.js application that provides secure multi-part file upload capabilities within the Passkey ecosystem. The application offers both a user interface for file uploads and API endpoints for programmatic access.

UI framework/technology: Next.js 13+ with App Router, React, TypeScript

## Access
- **URL**: `https://upload.passkey.com` (production), `https://dev-upload.passkey.com` (development)
- **Auth**: API key authentication and session-based authentication
- **Roles**: System users, service accounts, authenticated applications

## Pages

### Home Page
- **Route**: `/`
- **Purpose**: Main landing page with upload interface
- **Key Sections**:
  - File upload area with drag-and-drop
  - Upload progress indicators
  - File list and status
- **User Actions**: Select files, drag and drop files, initiate uploads, monitor progress
- **Data Shown**: Upload status, file information, progress bars
- **Permissions**: Authenticated users

### Example Upload Page
- **Route**: `/example`
- **Purpose**: Demonstration page showing upload functionality and API usage
- **Key Sections**:
  - Sample upload form
  - Code examples
  - API documentation snippets
- **User Actions**: Test file uploads, view examples, copy code snippets
- **Data Shown**: Example forms, code samples, upload results
- **Permissions**: Authenticated users

### API Version 1
- **Route**: `/v1/*`
- **Purpose**: API endpoints for programmatic file uploads
- **Key Sections**:
  - RESTful API endpoints
  - Upload initiation
  - Progress tracking
- **User Actions**: API calls for upload operations
- **Data Shown**: JSON responses, upload metadata
- **Permissions**: API key authentication

### Error Pages
- **Route**: `/error`, `/not-found`
- **Purpose**: Handle error states and not found pages
- **Key Sections**:
  - Error message display
  - Troubleshooting information
  - Contact support options
- **User Actions**: Retry operations, contact support
- **Data Shown**: Error details, help information
- **Permissions**: Public access

## User Flows

### File Upload Flow
1. **Home Page** — User accesses upload interface
2. **File Selection** — User selects or drags files to upload area
3. **Upload Initiation** — System begins secure multi-part upload
4. **Progress Monitoring** — User monitors upload progress
5. **Completion** — Upload completes with confirmation and file details

### API Integration Flow
1. **Authentication** — Service authenticates with API key
2. **Upload Request** — API call initiates upload session
3. **Multi-part Upload** — File chunks uploaded securely
4. **Progress Tracking** — Monitor upload status via API
5. **Completion** — Receive upload confirmation and file metadata

## Navigation Structure
- **Header**: Application title, user authentication status
- **Main Content**: Upload interface, file management
- **Footer**: API documentation links, support information
- **Minimal Navigation**: Focus on upload functionality

## UI Components
- **File Upload**: Drag-and-drop upload area, file selection buttons
- **Progress Indicators**: Upload progress bars, status indicators
- **File Lists**: Uploaded file listings with metadata
- **Forms**: Upload configuration forms, API key input
- **Notifications**: Success/error messages, upload status alerts

Component library used: Custom React components with Tailwind CSS, built-in Next.js components for file handling