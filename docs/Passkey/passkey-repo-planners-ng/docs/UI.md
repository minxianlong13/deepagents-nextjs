# User Interface

## Overview
Passkey Planners NG is a JSP-based web application that provides event planners with comprehensive tools for managing hotel bookings, room inventory, and event logistics. The application serves as the primary interface for event planners to create and manage hotel room blocks for events.

UI framework/technology: Java Server Pages (JSP), Spring MVC, jQuery, Bootstrap

## Access
- **URL**: `https://planners.passkey.com` (production), `https://dev-planners.passkey.com` (development)
- **Auth**: Username/password authentication with session management
- **Roles**: Event planners, hotel coordinators, system administrators

## Pages

### Login Page
- **Route**: `/auth/login`
- **Purpose**: User authentication for event planners and coordinators
- **Key Sections**:
  - Login form with username/password fields
  - Remember me option
  - Password reset link
- **User Actions**: Enter credentials, login, request password reset
- **Data Shown**: Login form, authentication errors
- **Permissions**: Public access

### Dashboard
- **Route**: `/dashboard` (layout)
- **Purpose**: Main navigation hub and overview for authenticated users
- **Key Sections**:
  - Navigation menu
  - Quick stats and metrics
  - Recent activity feed
- **User Actions**: Navigate to main features, view recent events
- **Data Shown**: User dashboard, event summaries, navigation options
- **Permissions**: Authenticated planners

### Event Request Wizard
- **Route**: `/event-request-wizard/*`
- **Purpose**: Multi-step wizard for creating new event room blocks
- **Key Sections**:
  - **Menu** (`/menu`): Event type selection and initial setup
  - **Rooms** (`/rooms`): Room type and quantity specification
  - **Complete** (`/complete`): Final review and submission
- **User Actions**: Select event details, specify room requirements, submit requests
- **Data Shown**: Event forms, room options, pricing information
- **Permissions**: Event planners

### Event Management
- **Route**: `/event/*`
- **Purpose**: Manage existing events and room inventory
- **Key Sections**:
  - **Inventory** (`/inventory`): Room availability and allocation
  - **Room Lists** (`/room-lists`): Detailed room assignments and guest lists
- **User Actions**: Modify room blocks, assign rooms, manage inventory
- **Data Shown**: Room availability, guest assignments, inventory status
- **Permissions**: Event planners, hotel coordinators

### Hotel Review
- **Route**: `/hotel-review`
- **Purpose**: Review and approve hotel proposals and contracts
- **Key Sections**:
  - Hotel proposal details
  - Contract terms and conditions
  - Approval workflow
- **User Actions**: Review proposals, approve/reject contracts, add comments
- **Data Shown**: Hotel details, contract terms, approval status
- **Permissions**: Senior planners, administrators

### Reports
- **Route**: `/report/*`
- **Purpose**: Generate and view various reports and analytics
- **Key Sections**:
  - **Reports** (`/reports`): Report selection and parameters
  - **Report** (`/report`): Individual report display
- **User Actions**: Select report types, set parameters, generate reports
- **Data Shown**: Report listings, generated reports, analytics data
- **Permissions**: Planners, administrators

### Profile Management
- **Route**: `/editProfile`
- **Purpose**: Manage user profile and account settings
- **Key Sections**:
  - Personal information form
  - Contact details
  - Preferences and settings
- **User Actions**: Update profile information, change preferences
- **Data Shown**: User profile data, account settings
- **Permissions**: Authenticated users (own profile)

### Analytics
- **Route**: `/analytics`
- **Purpose**: View performance metrics and business intelligence
- **Key Sections**:
  - Key performance indicators
  - Charts and graphs
  - Trend analysis
- **User Actions**: View metrics, filter data, export reports
- **Data Shown**: Analytics dashboards, performance metrics
- **Permissions**: Administrators, senior planners

## User Flows

### Event Creation Flow
1. **Dashboard** — Planner accesses main dashboard
2. **Event Request Wizard - Menu** — Select event type and basic details
3. **Event Request Wizard - Rooms** — Specify room requirements and dates
4. **Event Request Wizard - Complete** — Review and submit event request
5. **Confirmation** — Receive event creation confirmation

### Room Management Flow
1. **Dashboard** — Access event management tools
2. **Event Inventory** — View current room allocations
3. **Room Lists** — Manage specific room assignments
4. **Updates** — Modify room blocks and guest assignments
5. **Confirmation** — Save changes and notify stakeholders

### Hotel Approval Flow
1. **Dashboard** — Access pending hotel reviews
2. **Hotel Review** — Review hotel proposals and terms
3. **Evaluation** — Assess proposal against requirements
4. **Decision** — Approve or reject with comments
5. **Notification** — System notifies relevant parties

## Navigation Structure
- **Top Navigation**: User profile, logout, main application areas
- **Dashboard Layout**: Centralized navigation with quick access to key features
- **Breadcrumb Navigation**: Current location within multi-step processes
- **Sidebar Menus**: Context-sensitive navigation within feature areas

## UI Components
- **Forms**: Multi-step wizards, profile forms, search forms
- **Data Tables**: Event listings, room inventories, guest lists
- **Modals**: Password reset, confirmation dialogs, help overlays
- **Charts**: Analytics dashboards, occupancy reports
- **Wizards**: Step-by-step event creation and management processes
- **Navigation**: Responsive menu systems, breadcrumbs

Component library used: Bootstrap 3.x for responsive design, jQuery for interactions, custom JSP components for business logic integration