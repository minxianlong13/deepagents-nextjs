# User Interface

## Overview
Passkey Admin is a Next.js/React-based administrative portal for managing hotel properties and configurations within the Passkey system. The application provides hotel administrators and staff with tools to manage hotel details, contact information, and administrative settings.

UI framework/technology: Next.js 13+ with App Router and Pages Router hybrid, React, TypeScript

## Access
- **URL**: `https://admin.passkey.com` (production), `https://dev-admin.passkey.com` (development)
- **Auth**: SSO authentication via login page with redirect to identity provider
- **Roles**: Hotel administrators, property managers, system administrators

## Pages

### Home Page
- **Route**: `/`
- **Purpose**: Landing page and dashboard overview for authenticated users
- **Key Sections**:
  - Welcome message and user context
  - Quick navigation to main features
  - Recent activity summary
- **User Actions**: Navigate to hotel management, profile settings
- **Data Shown**: User information, accessible hotels
- **Permissions**: Authenticated users

### Login Page
- **Route**: `/login`
- **Purpose**: User authentication and SSO integration
- **Key Sections**:
  - Login form with email/username input
  - SSO provider buttons
  - Password reset link
- **User Actions**: Enter credentials, initiate SSO login, request password reset
- **Data Shown**: Login form, error messages
- **Permissions**: Public access

### Hotel Management
- **Route**: `/hotel/[hotelId]`
- **Purpose**: Manage specific hotel properties and settings
- **Key Sections**:
  - Hotel details form
  - Property information
  - Configuration settings
- **User Actions**: Edit hotel details, update settings, save changes
- **Data Shown**: Hotel information, property details, configuration options
- **Permissions**: Hotel administrators for specific properties

### Hotel Contact Management
- **Route**: `/hotel/[hotelId]/contact`
- **Purpose**: Manage organizational contact information for hotel participants
- **Key Sections**:
  - Organizational contact details form
  - Primary and secondary organizational contacts
  - Communication preferences
- **User Actions**: Add/edit organizational contacts, update contact information, set preferences
- **Data Shown**: Organizational contact details, phone numbers, email addresses
- **Permissions**: Hotel administrators, property managers

### SSO Identity Provider
- **Route**: `/ssoidp/*`
- **Purpose**: Handle SSO authentication flows and callbacks
- **Key Sections**:
  - Authentication processing
  - Redirect handling
  - Error states
- **User Actions**: Complete SSO authentication
- **Data Shown**: Authentication status, loading states
- **Permissions**: Public access during auth flow

### Error Pages
- **Route**: `/404`, `/500`
- **Purpose**: Handle not found and server error states
- **Key Sections**:
  - Error message display
  - Navigation options
  - Support contact information
- **User Actions**: Return to home, contact support
- **Data Shown**: Error details, help information
- **Permissions**: Public access

## User Flows

### Hotel Administration Flow
1. **Login Page** — User authenticates via SSO
2. **Home Page** — User sees available hotels and options
3. **Hotel Management** — User selects and manages specific hotel
4. **Contact Management** — User updates organizational contact information for hotel participants
5. **Save/Confirmation** — Changes are saved and confirmed

### Authentication Flow
1. **Login Page** — User initiates login
2. **SSO Provider** — User authenticates with identity provider
3. **SSO Callback** — System processes authentication
4. **Home Page** — User is redirected to main dashboard

## Navigation Structure
- **Top Navigation**: User profile, logout, main navigation links
- **Sidebar**: Hotel selection, main feature areas
- **Breadcrumbs**: Current location within hotel management hierarchy
- **Footer**: System information, support links

## UI Components
- **Forms**: Hotel details forms, organizational contact management forms
- **Data Tables**: Hotel listings, contact directories
- **Modals**: Confirmation dialogs, error messages
- **Navigation**: Responsive navigation bar, sidebar menu
- **Authentication**: Login forms, SSO integration components

Component library used: Custom React components with Tailwind CSS styling, Emotion for CSS-in-JS