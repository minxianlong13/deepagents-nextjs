# User Interface

## Overview
Passkey Call Center is an internal administrative application built with Next.js using the Pages Router. It provides call center agents and administrators with tools to search, view, and manage hotel reservations, events, and customer inquiries.

**Technology**: Next.js with Pages Router, React, TypeScript, Carina UI v1 & v2, Tailwind CSS

## Access
- **URL**: Internal call center application (specific URL varies by environment)
- **Auth**: Internal authentication required (likely SSO/SAML)
- **Roles**: Call center agents, supervisors, administrators

## Pages

### Home/Dashboard
- **Route**: `/`
- **Purpose**: Main dashboard and entry point for call center operations
- **Key Sections**:
  - Quick search interface
  - Recent activity summary
  - Navigation to main functions
  - Performance metrics and alerts
- **User Actions**: 
  - Access search functions
  - View recent reservations
  - Navigate to specific tools
- **Data Shown**: Dashboard metrics, recent activity, system status
- **Permissions**: All authenticated users

### Login Page
- **Route**: `/login`
- **Purpose**: User authentication and system access
- **Key Sections**:
  - Login form
  - Authentication options
  - System announcements
- **User Actions**: 
  - Enter credentials
  - Authenticate via SSO
  - Access development login (dev environments)
- **Data Shown**: Login form, system messages
- **Permissions**: Public access (pre-authentication)

### Search Results
- **Route**: `/results`
- **Purpose**: Display search results for reservations, events, or customers
- **Key Sections**:
  - Search results table
  - Filtering and sorting options
  - Pagination controls
  - Export functionality
- **User Actions**: 
  - Review search results
  - Apply additional filters
  - Select items for detailed view
  - Export data
- **Data Shown**: 
  - Reservation details
  - Event information
  - Customer data
  - Hotel availability
- **Permissions**: Agent-level access required

### Error Pages
- **Route**: `/404`, `/500`, `/_error`
- **Purpose**: Handle various error conditions gracefully
- **Key Sections**:
  - Error message and code
  - Recovery suggestions
  - Contact information
- **User Actions**: 
  - Return to previous page
  - Contact support
  - Restart session
- **Data Shown**: Error details, help information
- **Permissions**: Available to all users

## User Flows

### Reservation Search & Management Flow
1. **Dashboard** — Agent starts from main dashboard
2. **Search Interface** — Agent enters search criteria (guest name, confirmation number, event)
3. **Results Review** — Agent reviews search results and selects relevant reservation
4. **Reservation Details** — Agent views complete reservation information
5. **Modification/Action** — Agent performs required actions (modify, cancel, notes)
6. **Confirmation** — Agent confirms changes and updates customer

### Event Management Flow
1. **Dashboard** — Agent accesses event management tools
2. **Event Search** — Agent searches for specific events or date ranges
3. **Event Details** — Agent reviews event information and associated reservations
4. **Bulk Operations** — Agent performs bulk actions on event reservations
5. **Reporting** — Agent generates reports for event performance

### Customer Service Flow
1. **Incoming Call** — Agent receives customer inquiry
2. **Customer Lookup** — Agent searches by phone, email, or name
3. **Account Review** — Agent reviews customer history and current reservations
4. **Issue Resolution** — Agent addresses customer concerns or requests
5. **Documentation** — Agent logs interaction and resolution details

## Navigation Structure
- **Top Navigation**: Primary navigation bar with main sections
- **Breadcrumb Navigation**: Shows current location within the application
- **Sidebar Navigation**: Context-sensitive navigation for detailed views
- **Quick Actions**: Floating action buttons for common tasks
- **Search Bar**: Global search functionality accessible from all pages

## UI Components

### Core Components
- **Advanced Search Interface**: Multi-criteria search with filters and operators
- **Data Tables**: Sortable, filterable tables for displaying search results
- **Reservation Management Forms**: Complex forms for reservation modifications
- **Event Management Tools**: Interfaces for managing event details and allocations
- **Customer Profile Views**: Comprehensive customer information displays
- **Bulk Action Tools**: Interfaces for performing operations on multiple items

### Component Libraries
- **Carina UI v1**: Legacy Cvent design system components (`@cvent/carina`)
- **Carina UI v2**: Modern Cvent design system components (`@cvent/carina-v2`)
- **Passkey Components**: Custom components specific to passkey functionality (`@cvent/passkey-components`)
- **Tailwind CSS**: Utility-first CSS framework for custom styling

### Shared UI Elements
- **Base Page Layout**: Consistent page structure and navigation
- **Alert Provider**: System-wide notification and alert management
- **Theme Provider**: Consistent theming using Carina design tokens
- **Global Styles**: Standardized styling and typography
- **Top Navigation**: Primary navigation bar with user context
- **Error Boundary**: Application-level error handling and recovery
- **Dev Login**: Development environment authentication bypass

### Search & Results Components
- **Advanced Search Forms**: Complex search interfaces with multiple criteria
- **Search Results Tables**: Paginated, sortable data tables
- **Filter Panels**: Dynamic filtering options for search results
- **Export Tools**: Data export functionality for reports and analysis

### Reservation Components
- **Find Reservations Interface**: Specialized search for reservation lookup
- **Reservation Details Views**: Comprehensive reservation information display
- **Modification Forms**: Interfaces for changing reservation details
- **History Tracking**: Audit trail and change history display

### Event Management Components
- **Event Search Interface**: Tools for finding and filtering events
- **Event Details Views**: Comprehensive event information and statistics
- **Allocation Management**: Tools for managing room blocks and availability
- **Reporting Interfaces**: Event performance and utilization reports

### Utility Components
- **Gainsight Integration**: Customer success platform integration
- **Layout Components**: Reusable layout and structure elements
- **Form Utilities**: Common form components and validation
- **Data Visualization**: Charts and graphs for reporting and analytics

### Development Tools
- **Storybook Integration**: Component documentation and testing
- **Dev Tools**: Development environment utilities and debugging aids
- **Test Utilities**: Testing helpers and mock components

## Internationalization
- **Multi-language Support**: Supports multiple locales for international call centers
- **Localized Content**: UI text, error messages, and help content
- **Regional Formatting**: Date, time, and currency formatting per locale
- **Phrase Integration**: Translation management system integration