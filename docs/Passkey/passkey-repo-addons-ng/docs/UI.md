# User Interface

## Overview
Passkey Add-ons NG is a modern web application built with Spring MVC and JSP technology, providing a streamlined interface for hotel staff to manage event add-on bookings and guest arrivals. The UI serves as a specialized portal for tracking and managing additional services (add-ons) that guests purchase alongside their hotel reservations, such as tours, meals, transportation, and other event-related services.

The interface uses Spring MVC with JSP views, Tiles templating, and AJAX-powered dynamic content loading, providing a responsive and user-friendly experience for hospitality staff managing event add-ons.

## Access
- **URL**: Typically deployed at add-on specific subdomain or path within Passkey infrastructure
- **Auth**: Spring Security-based authentication with username/password, supports session management and CSRF protection
- **Roles**: Primarily hotel staff, event coordinators, and administrators with add-on management permissions

## Pages

### Login Page
- **Route**: `/login` (Spring MVC mapping)
- **Purpose**: Secure authentication entry point for add-on management system
- **Key Sections**:
  - Login form with username and password fields
  - Forgot username and password recovery dialogs
  - Error message display for failed authentication
  - CSRF protection integration
- **User Actions**: Login with credentials, recover forgotten username/password, handle authentication errors
- **Data Shown**: Login form, authentication status, recovery options
- **Permissions**: Public access for authentication, redirects authenticated users

### Main Portal Dashboard
- **Route**: `/portal` or main application entry
- **Purpose**: Primary interface for viewing and managing add-on bookings and guest arrivals
- **Key Sections**:
  - Tab navigation between "bookings" and "arrivals" views
  - Filter controls for add-on selection and date ranges
  - Data table with sortable columns for booking/arrival information
  - Legend for status indicators (New, Changed, Cancelled)
  - Export and print functionality
- **User Actions**: Switch between bookings/arrivals, filter data by add-on and date range, sort columns, export data, print reports
- **Data Shown**: Guest information, add-on details, booking dates, quantities, prices, reservation status
- **Permissions**: Authenticated users with add-on access rights

### Bookings View
- **Route**: `/bookings`
- **Purpose**: Display and manage all add-on bookings within specified date ranges
- **Key Sections**:
  - Booking filter controls (add-on type, date range selection)
  - Comprehensive booking data table with guest details
  - Status indicators for new, changed, and cancelled bookings
  - Detailed booking information including prices and quantities
- **User Actions**: Filter bookings by add-on and date, sort booking data, view detailed booking information
- **Data Shown**: Guest names, add-on types, booking dates, quantities, prices, totals, reservation details
- **Permissions**: Users with booking management access

### Arrivals View
- **Route**: `/arrivals`
- **Purpose**: Track and manage guest arrivals with add-on services
- **Key Sections**:
  - Arrival-specific filtering (upcoming arrivals, date ranges)
  - Guest arrival information with add-on details
  - Status tracking for arrival management
  - Integration with reservation systems
- **User Actions**: Filter upcoming arrivals, track arrival status, manage arrival-related add-ons
- **Data Shown**: Arrival dates, guest information, associated add-ons, stay dates, reservation status
- **Permissions**: Users with arrival management access

### Hotel Search Interface
- **Route**: `/hotelSearch` (based on JSP file)
- **Purpose**: Search and select hotels for add-on management context
- **Key Sections**:
  - Hotel search form and filters
  - Hotel selection interface
  - Integration with add-on management
- **User Actions**: Search hotels, select hotel context for add-on management
- **Data Shown**: Hotel listings, search results, selection options
- **Permissions**: Authenticated users with hotel access rights

### Account Management Pages
- **Route**: `/account/*` (password reset, incomplete fields, etc.)
- **Purpose**: User account management and profile completion
- **Key Sections**:
  - Password reset functionality (`pwdreset.jsp`, `pwdreset-success.jsp`, `pwdreset-error.jsp`)
  - Incomplete profile field completion (`incompleteFields.jsp`)
  - Account status management
- **User Actions**: Reset passwords, complete profile information, manage account settings
- **Data Shown**: Account forms, status messages, profile completion requirements
- **Permissions**: Authenticated users managing their own accounts

### Error and Status Pages
- **Route**: Various error handling routes
- **Purpose**: Handle application errors and provide user feedback
- **Key Sections**:
  - Resource not found handling (`resourceNotFound.jsp`)
  - Uncaught exception handling (`uncaughtException.jsp`)
  - Session timeout management (`sessionTimeout.jsp`)
- **User Actions**: Navigate back to valid application areas, re-authenticate if needed
- **Data Shown**: Error messages, navigation options, status information
- **Permissions**: Available to users experiencing errors or session issues

## User Flows

### Add-on Booking Management
1. **Login** — User authenticates to access the add-on management system
2. **Portal Dashboard** — User lands on main portal with booking/arrival tabs
3. **Filter Selection** — User selects specific add-on types and date ranges
4. **Data Review** — User reviews filtered booking data in sortable table format
5. **Export/Print** — User exports data or prints reports for offline use

### Arrival Tracking Workflow
1. **Arrivals Tab** — User switches to arrivals view from main portal
2. **Date Range Selection** — User selects upcoming arrival date ranges
3. **Add-on Filtering** — User filters by specific add-on types for arrivals
4. **Status Monitoring** — User monitors arrival status and add-on fulfillment
5. **Data Export** — User exports arrival data for operational use

### Password Recovery Process
1. **Login Page** — User clicks "Forgot Password" link
2. **Recovery Dialog** — User enters username in password reset dialog
3. **Email Processing** — System sends password reset email
4. **Reset Completion** — User completes password reset via email link
5. **Login Return** — User returns to login with new credentials

### Hotel Context Selection
1. **Hotel Search** — User accesses hotel search interface
2. **Search Criteria** — User enters hotel search parameters
3. **Hotel Selection** — User selects appropriate hotel from results
4. **Context Setting** — System sets hotel context for add-on management
5. **Portal Access** — User proceeds to main portal with hotel context

## Navigation Structure
The application uses:
- **Tab-based navigation**: Primary navigation between bookings and arrivals views
- **Spring MVC routing**: RESTful URL patterns for different functional areas
- **Tiles templating**: Consistent layout structure across pages
- **AJAX content loading**: Dynamic content updates without full page refreshes
- **Breadcrumb navigation**: Context-aware navigation within functional areas
- **Modal dialogs**: Overlay dialogs for secondary actions and forms

## UI Components
- **Modern web forms**: Spring form tags with validation and CSRF protection
- **Dynamic data tables**: AJAX-powered sortable and filterable tables with pagination
- **Date range pickers**: jQuery UI date pickers for date range selection
- **Status indicators**: Color-coded status indicators for booking states
- **Export controls**: Built-in export functionality for data tables
- **Print optimization**: Specialized print layouts for reports
- **Modal dialogs**: jQuery UI dialogs for password recovery and secondary actions
- **Responsive elements**: Adaptive layout elements for different screen sizes
- **Loading indicators**: Progress indicators for AJAX operations
- **Filter controls**: Advanced filtering interfaces for data refinement

The UI follows modern web application patterns with AJAX-enhanced interactions, responsive design elements, and user-friendly interfaces optimized for hospitality staff managing event add-ons and guest services.