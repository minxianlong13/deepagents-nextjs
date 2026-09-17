# User Interface

## Overview
Passkey ResDesk is part of **Passkey Manage**, a comprehensive hotel reservation management system with a web-based administrative interface built using JSP (JavaServer Pages) technology. The UI serves as the primary management portal for hotel staff, event organizers, and Passkey administrators to view and manage existing reservations, events, hotel inventory, and various operational aspects of the group housing system. Note: Passkey Manage does not create new reservations - those are created through booking applications like passkey-book.

The interface uses a traditional server-rendered JSP architecture with Struts framework for MVC pattern implementation, providing a robust administrative dashboard for hospitality management.

## Access
- **URL**: Typically deployed at `https://{environment}-manage.passkey.com` or similar domain patterns
- **Auth**: Session-based authentication with username/password login, supports SSO integration
- **Roles**: Multiple user types including Passkey users, Hotel users (ID 103), HotelDirect users, Event organizers, and various administrative roles

## Pages

### Home Dashboard
- **Route**: `/home.jsp`
- **Purpose**: Main landing page after login, provides overview of pending tasks and announcements
- **Key Sections**:
  - Approval Requests: Shows events requiring approval for Passkey users
  - GroupmasterLink Messages: Displays pending messages queue for hotel users
  - General Announcements: System-wide notifications and updates
  - HotelDirect Announcements: Specific announcements for HotelDirect users
- **User Actions**: Navigate to event summaries, view pending approvals, access announcements
- **Data Shown**: Event lists, message counts, announcement content, user-specific notifications
- **Permissions**: Content varies by user type (Passkey, Hotel, HotelDirect users see different sections)

### Login Page
- **Route**: `/Login` (servlet mapping)
- **Purpose**: User authentication entry point
- **Key Sections**:
  - Login form with username/password fields
  - SSO integration support
  - Password reset functionality
- **User Actions**: Login, password reset, SSO authentication
- **Data Shown**: Login form, error messages, authentication options
- **Permissions**: Public access for authentication

### Error Pages
- **Route**: `/error.jsp`, `/sessionerror.jsp`, `/invalidurl.jsp`, `/invalidEntryUrl.jsp`
- **Purpose**: Handle various error conditions and invalid access attempts
- **Key Sections**:
  - Error message display
  - Navigation options back to valid pages
- **User Actions**: Return to valid application areas
- **Data Shown**: Error descriptions, troubleshooting information
- **Permissions**: Available to authenticated users experiencing errors

### Hotel Management
- **Route**: `/Hotel` (servlet mapping)
- **Purpose**: Hotel-specific management interface for inventory, rates, and property management
- **Key Sections**:
  - Hotel search and selection interface
  - Booking and inventory management
  - Rate management tools
  - Property configuration
- **User Actions**: Search hotels, manage inventory, update rates, configure properties
- **Data Shown**: Hotel listings, availability data, rate information, booking details
- **Permissions**: Hotel users and administrators

### Event Management
- **Route**: `/Event` (servlet mapping), various event-related JSPs
- **Purpose**: Comprehensive event setup and management interface
- **Key Sections**:
  - Event wizard for setup
  - Event summary and details
  - Attendee management
  - Housing block management
- **User Actions**: Create events, configure housing blocks, manage attendees, approve requests
- **Data Shown**: Event details, housing inventory, attendee lists, approval queues
- **Permissions**: Event organizers, Passkey administrators

### Organizer Interface
- **Route**: `/Organizer` (servlet mapping)
- **Purpose**: Event organizer-specific tools and dashboards
- **Key Sections**:
  - Delegate profile management
  - Event oversight tools
  - Reporting and analytics
- **User Actions**: Manage delegate profiles, monitor event progress, generate reports
- **Data Shown**: Delegate information, event metrics, booking summaries
- **Permissions**: Event organizers and authorized staff

### API and Lookup Services
- **Route**: `/API/lookup.jsp`, `/API/elookup.jsp`, `/API/select_event.jsp`
- **Purpose**: AJAX endpoints and lookup services for dynamic content
- **Key Sections**:
  - Data lookup interfaces
  - Event selection tools
  - API response formatting
- **User Actions**: Search and select data, populate forms dynamically
- **Data Shown**: Lookup results, event lists, formatted API responses
- **Permissions**: Authenticated users with appropriate access levels

### Upload and File Management
- **Route**: `/upload.jsp`
- **Purpose**: File upload interface for various system documents and data
- **Key Sections**:
  - File selection and upload forms
  - Upload progress indicators
  - File validation and processing
- **User Actions**: Select files, upload documents, monitor upload progress
- **Data Shown**: Upload forms, progress status, validation results
- **Permissions**: Users with file upload privileges

### Terms and Conditions
- **Route**: `/termsconditions.jsp`
- **Purpose**: Display and manage terms and conditions acceptance
- **Key Sections**:
  - Terms and conditions content
  - Acceptance tracking
  - Version management
- **User Actions**: Review terms, accept conditions, track acceptance history
- **Data Shown**: Legal terms, acceptance status, version information
- **Permissions**: All authenticated users

## User Flows

### Event Approval Workflow
1. **Home Dashboard** — Passkey user sees pending approval requests
2. **Event Summary** — User clicks on event requiring approval to view details
3. **Event Management** — User reviews event configuration and housing blocks
4. **Approval Action** — User approves or requests changes to the event setup

### Hotel Booking Management
1. **Hotel Interface** — Hotel user accesses hotel management tools
2. **Inventory Management** — User updates room availability and rates
3. **Booking Review** — User reviews incoming reservations and modifications
4. **Confirmation Processing** — User confirms or modifies booking details

### Event Setup Workflow
1. **Event Creation** — Organizer initiates new event setup
2. **Event Wizard** — Step-by-step configuration of event parameters
3. **Housing Block Setup** — Configure room blocks and rates with hotels
4. **Approval Submission** — Submit event for Passkey approval
5. **Go-Live** — Activate event for attendee bookings

### File Upload Process
1. **Upload Interface** — User accesses file upload functionality
2. **File Selection** — User selects appropriate files for upload
3. **Validation** — System validates file format and content
4. **Processing** — Files are processed and integrated into system
5. **Confirmation** — User receives confirmation of successful upload

## Navigation Structure
The application uses a combination of:
- **Servlet-based routing**: Main functional areas accessed via servlet mappings (`/Hotel`, `/Event`, `/Organizer`)
- **Direct JSP access**: Utility pages and specific functions accessed directly
- **Frame-based layout**: Some areas use framesets for complex layouts
- **Action-based navigation**: Struts actions for form processing and workflow management
- **Breadcrumb navigation**: Context-aware navigation within functional areas

## UI Components
- **Traditional HTML forms**: Standard form elements with server-side validation
- **Data tables**: Sortable and filterable tables for data display
- **Modal dialogs**: JavaScript-based popups for secondary actions
- **Date pickers**: Calendar widgets for date selection
- **File upload controls**: Multi-file upload with progress indicators
- **Navigation menus**: Context-sensitive menu systems
- **Status indicators**: Visual indicators for approval status, booking status, etc.
- **Print functionality**: Specialized printing interfaces for reports and documents

The UI follows traditional web application patterns with server-side rendering, form-based interactions, and page-based navigation, optimized for administrative and professional use cases in the hospitality industry.