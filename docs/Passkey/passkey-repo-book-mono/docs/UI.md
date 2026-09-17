# User Interface

## Overview
Passkey Book UI is a guest-facing hotel booking application built with Next.js 13+ using the App Router. It provides an internationalized booking experience for event attendees to search and reserve hotel rooms through passkey allocations.

**Technology**: Next.js 13+ with App Router, React, TypeScript, Tailwind CSS

## Access
- **URL**: `/{locale}/event/{eventId}/owner/{ownerId}/...`
- **Auth**: Guest access (no authentication required for booking)
- **Roles**: Event attendees and general public

## Pages

### Root Landing Page
- **Route**: `/{locale}`
- **Purpose**: Entry point for users without specific event context
- **Key Sections**:
  - Welcome message and branding
  - Event search or direct access options
- **User Actions**: Navigate to specific event booking flows
- **Data Shown**: General passkey information
- **Permissions**: Public access

### Event Landing Page
- **Route**: `/{locale}/event/{eventId}/owner/{ownerId}/landing`
- **Purpose**: Event-specific landing page showing available hotel options
- **Key Sections**:
  - Event information and dates
  - Hotel search interface
  - Available hotel listings
  - Booking call-to-action
- **User Actions**: Search hotels, view hotel details, start booking process
- **Data Shown**: Event details, hotel availability, pricing information
- **Permissions**: Public access

### Hotel Search & Booking Home
- **Route**: `/{locale}/event/{eventId}/owner/{ownerId}/home`
- **Purpose**: Main booking interface for hotel search and reservation
- **Key Sections**:
  - Hotel search filters (dates, room type, guests)
  - Search results with hotel listings
  - Hotel details and amenities
  - Room selection and pricing
  - Booking form
- **User Actions**: 
  - Filter and search hotels
  - Select rooms and dates
  - Enter guest information
  - Complete reservation
- **Data Shown**: 
  - Hotel inventory and availability
  - Room rates and packages
  - Guest reservation details
- **Permissions**: Public access

### Error Pages
- **Route**: `/{locale}/error`
- **Purpose**: Handle application errors gracefully
- **Key Sections**:
  - Error message display
  - Recovery options
- **User Actions**: Return to previous page or restart booking
- **Data Shown**: Error details and help information
- **Permissions**: Public access

### Loading States
- **Route**: `/{locale}/loading`
- **Purpose**: Show loading indicators during data fetching
- **Key Sections**:
  - Loading spinners and progress indicators
- **User Actions**: Wait for content to load
- **Data Shown**: Loading status
- **Permissions**: Public access

### Not Found Page
- **Route**: `/{locale}/not-found`
- **Purpose**: Handle invalid URLs or missing content
- **Key Sections**:
  - 404 error message
  - Navigation options
- **User Actions**: Return to valid pages
- **Data Shown**: Error message and navigation links
- **Permissions**: Public access

## User Flows

### Hotel Booking Flow
1. **Landing Page** — User arrives via event-specific URL or searches for event
2. **Hotel Search** — User enters dates, location, and guest preferences
3. **Hotel Selection** — User browses available hotels and compares options
4. **Room Selection** — User selects specific room type and rate
5. **Guest Information** — User enters personal and payment details
6. **Confirmation** — User reviews and confirms reservation
7. **Acknowledgment** — User receives booking confirmation

### Hotel Search & Compare Flow
1. **Landing Page** — User starts from event landing page
2. **Search Interface** — User sets search criteria (dates, guests, preferences)
3. **Results Browsing** — User views hotel listings with filters and sorting
4. **Hotel Details** — User explores individual hotel amenities and policies
5. **Comparison** — User compares multiple hotels side-by-side
6. **Selection** — User proceeds to booking for chosen hotel

## Navigation Structure
- **Internationalized Routing**: All routes prefixed with locale (e.g., `/en`, `/es`, `/fr`)
- **Hierarchical Structure**: Event → Owner → Booking Flow
- **Breadcrumb Navigation**: Shows current position in booking process
- **Back/Forward Navigation**: Supports browser navigation within booking flow
- **Deep Linking**: Direct access to specific booking steps via URL parameters

## UI Components

### Core Components
- **Hotel Search Interface**: Advanced search with filters for dates, location, amenities
- **Hotel Listings**: Card-based display with images, ratings, and key information
- **Booking Forms**: Multi-step forms with validation and progress indicators
- **Error Boundaries**: Graceful error handling with recovery options
- **Loading States**: Skeleton screens and progress indicators
- **Manage Reservation Modal**: Post-booking reservation management
- **Send Acknowledgment Modal**: Email confirmation functionality

### Component Libraries
- **Custom Components**: Built specifically for passkey booking experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Nucleus Text**: Typography system for consistent text rendering
- **Normalize.css**: Cross-browser CSS normalization

### Shared UI Elements
- **Theme Provider**: Consistent theming across the application
- **App Providers**: Context providers for global state management
- **Runtime Config**: Dynamic configuration management
- **HTTP Log ID Provider**: Request tracking and logging
- **Splash Components**: Landing page elements and branding
- **Hotel Search Components**: Reusable search and filter components
- **Landing Components**: Event-specific landing page elements

### Internationalization
- **Multi-language Support**: Supports multiple locales with dynamic routing
- **Localized Content**: Event information, hotel descriptions, and UI text
- **Currency Formatting**: Locale-appropriate pricing display
- **Date Formatting**: Regional date and time formats