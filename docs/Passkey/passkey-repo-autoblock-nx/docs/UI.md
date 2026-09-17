# User Interface

## Overview
Passkey Autoblock NX provides a Next.js-based web application for managing autoblock functionality in the Passkey system. This is an admin/management interface used by event organizers and Cvent staff to configure and manage hotel room blocks for events.

**UI Framework**: Next.js with React, TypeScript, and Apollo GraphQL client
**Component Library**: Carina UI (Cvent's design system)
**Storybook**: Available for component documentation and development

## Access
- **URL**: https://passkey-autoblock-apollo.core.cvent.org (production)
- **Auth**: Cvent SSO authentication via auth-service
- **Roles**: Requires `FULL_SITE_ACCESS` role for most operations

## Pages

### Home Page
- **Route**: `/`
- **Purpose**: Landing page and dashboard for autoblock management
- **Key Sections**:
  - Welcome message and navigation
  - Quick access to common autoblock operations
  - Recent activity summary
- **User Actions**: Navigate to specific autoblock functions
- **Data Shown**: User information, system status
- **Permissions**: Authenticated users with appropriate roles

### About Page
- **Route**: `/about`
- **Purpose**: Information about the application and its capabilities
- **Key Sections**:
  - Application version and build information
  - Feature descriptions
  - Contact information
- **User Actions**: View application details
- **Data Shown**: Static application metadata
- **Permissions**: All authenticated users

### Login Page
- **Route**: `/login`
- **Purpose**: Authentication entry point for users
- **Key Sections**:
  - Login form or SSO redirect
  - Authentication status messages
- **User Actions**: Authenticate via Cvent SSO
- **Data Shown**: Login form, authentication status
- **Permissions**: Public access for authentication

### Error Pages
- **Route**: `/404`, `/500`, custom error handling
- **Purpose**: Handle application errors and missing pages
- **Key Sections**:
  - Error message and description
  - Navigation back to main application
- **User Actions**: Return to main application
- **Data Shown**: Error details, troubleshooting information
- **Permissions**: All users

## User Flows

### Autoblock Management Flow
1. **Home Page** — User logs in and accesses dashboard
2. **GraphQL API** — User interacts with autoblock configuration via API calls
3. **Configuration Pages** — User manages block requests, hotels, and inventory
4. **Confirmation** — Changes are saved and confirmed

### Authentication Flow
1. **Login Page** — User initiates authentication
2. **SSO Redirect** — User authenticates via Cvent SSO
3. **Home Page** — User is redirected to main application
4. **Protected Resources** — User can access authorized features

## Navigation Structure
- **Main Navigation**: Top-level navigation bar with primary sections
- **Breadcrumbs**: Context-aware navigation showing current location
- **Side Navigation**: Secondary navigation for detailed operations
- **Footer**: Links to support, documentation, and system information

## UI Components

### Shared Components
- **Layout Components**: Page layouts, navigation, headers, footers
- **Form Components**: Input fields, buttons, validation messages
- **Data Display**: Tables, cards, status indicators
- **Feedback Components**: Loading states, error messages, success notifications

### Autoblock-Specific Components
- **Block Request Forms**: Configuration forms for autoblock requests
- **Hotel Management**: Components for managing participating hotels
- **Inventory Display**: Room availability and booking status
- **Survey Configuration**: Forms for booking survey setup

### Component Library
- **Carina UI**: Cvent's design system for consistent styling
- **Custom Components**: Application-specific UI elements
- **Storybook**: Component documentation and development environment

## Development Tools
- **Storybook**: Component library documentation at `/.storybook/`
- **GraphQL Playground**: API exploration and testing
- **Development Server**: Hot-reload development environment
- **Testing**: Jest and React Testing Library for component tests