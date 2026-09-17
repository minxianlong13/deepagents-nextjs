# User Interface

## Overview
Passkey Autoblock UI provides comprehensive React-based user interfaces for hotel room autoblock workflows. This monorepo contains two main applications and a shared widget library that enables both guest-facing booking experiences and administrative site management.

**UI Framework**: React (16 & 18), Redux, Apollo GraphQL Client
**Component Library**: Carina UI (Cvent's design system) + Custom Widgets
**Build System**: Modern JavaScript toolchain with pnpm workspaces

## Access
- **Guestside Site**: Public access for event attendees
- **Site Editor**: Authenticated access for event organizers and administrators
- **Auth**: Cvent SSO authentication for administrative functions

## Applications

### Passkey Autoblock Guestside Site
- **Purpose**: Guest-facing interface for hotel room selection and booking
- **Technology**: React 18, Redux, Apollo GraphQL
- **Key Sections**:
  - Hotel search and filtering interface
  - Interactive maps with hotel locations
  - Room selection and amenities display
  - Booking workflow and confirmation
  - Multi-language support
- **User Actions**: Search hotels, filter results, select rooms, complete bookings
- **Data Shown**: Hotel information, room availability, pricing, amenities
- **Permissions**: Public access for event attendees

### Passkey Autoblock Site Editor
- **Purpose**: Administrative interface for configuring autoblock sites
- **Technology**: React 16, Redux, Rich text editor
- **Key Sections**:
  - Site configuration dashboard
  - Content management tools
  - Preview functionality
  - Template management
  - Publishing controls
- **User Actions**: Configure sites, manage content, preview changes, publish updates
- **Data Shown**: Site configuration, content templates, preview states
- **Permissions**: Authenticated event organizers and administrators

## User Flows

### Guest Booking Flow
1. **Landing Page** — Guest accesses autoblock site for their event
2. **Hotel Search** — Guest searches and filters available hotels
3. **Hotel Details** — Guest views hotel information and amenities
4. **Room Selection** — Guest selects room type and dates
5. **Booking Form** — Guest enters personal and payment information
6. **Confirmation** — Guest receives booking confirmation

### Site Editor Flow
1. **Dashboard** — Administrator accesses site editor interface
2. **Site Configuration** — Administrator configures site settings and branding
3. **Content Management** — Administrator adds/edits site content and templates
4. **Preview** — Administrator previews changes before publishing
5. **Publishing** — Administrator publishes site for guest access

## Navigation Structure
- **Guestside Site**: Linear booking flow with breadcrumb navigation
- **Site Editor**: Dashboard-based navigation with sidebar menu
- **Shared Components**: Consistent navigation patterns across applications

## UI Components

### Shared Widget Library (30+ Components)
- **HotelBanner**: Hotel branding and key information display
- **RoomList**: Room type listings with availability and pricing
- **ContactInfo**: Hotel contact details and location information
- **SearchFilters**: Hotel and room filtering controls
- **BookingForm**: Guest information and payment collection
- **MapView**: Interactive hotel location mapping
- **AvailabilityCalendar**: Date selection and availability display
- **PricingDisplay**: Room rates and total cost calculation

### Application-Specific Components
- **Guestside Components**: Booking workflow, guest forms, confirmation pages
- **Site Editor Components**: Configuration forms, content editors, preview modes
- **Layout Components**: Headers, footers, navigation, responsive containers

### Design System Integration
- **Carina UI**: Cvent's design system for consistent styling and behavior
- **Custom Theming**: Event-specific branding and customization
- **Responsive Design**: Mobile-first approach with breakpoint management
- **Accessibility**: WCAG compliance and keyboard navigation support

## Development Tools
- **Storybook**: Component library documentation and development
- **Hot Reload**: Development server with live updates
- **Testing**: Jest and React Testing Library for component tests
- **Linting**: ESLint and Prettier for code quality
- **Build Tools**: Modern JavaScript bundling and optimization