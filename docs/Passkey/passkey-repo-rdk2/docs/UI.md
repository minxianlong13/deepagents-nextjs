# User Interface

## Overview
RDK2 is the Passkey Manage web application — the primary UI for hotel housing management used by Cvent staff and hotel operators. Built with Next.js (Pages Router) + Carina UI component library + Tailwind CSS.

## Access
- **URL**: `http://localhost:3000` (dev) / `https://{env}-manage.passkey.com` (deployed)
- **Auth**: Cookie-based via `cvent-auth` cookie (from auth-service) + Resdesk session cookie
- **Roles**: Permission-based access via passkey-permission service

## Pages

### Home / Event List (`/`)
- **Route**: `/` (`index.tsx`)
- **Purpose**: Landing page showing all events for the user's organization
- **Key Sections**: Event list with search, sort, and filter
- **User Actions**: Search events, create event, navigate to event details

### Login (`/login`)
- **Route**: `/login`
- **Purpose**: Authentication entry point
- **User Actions**: Login via Cvent auth or dev login (local only)

### Logout (`/logout`)
- **Route**: `/logout`
- **Purpose**: Session termination

### Event Pages (`/event/...`)
- **Route**: `/event/[eventId]/...`
- **Purpose**: Event detail views and management
- **Key Sections**: Event overview, hotel associations, room blocks, notifications
- **User Actions**: View/edit event details, manage hotels, configure room blocks

### Management Pages (`/manage/...`)
- **Route**: `/manage/...`
- **Purpose**: Administrative management functions

### Reports (`/reports`)
- **Route**: `/reports`
- **Purpose**: Embedded reporting interface
- **Key Sections**: Report viewer with auth token passthrough
- **User Actions**: View and generate reports

### Request Queue (`/request-queue/...`)
- **Route**: `/request-queue/...`
- **Purpose**: Housing block request management
- **User Actions**: Review, approve, or reject block requests

### Reservations (`/reservations/...`)
- **Route**: `/reservations/...`
- **Purpose**: Reservation search and viewing (reservations are made through booking apps, not Manage)
- **User Actions**: Search participants, view reservation details

### Navigate to Report Article (`/navigateToReportArticle`)
- **Route**: `/navigateToReportArticle`
- **Purpose**: Redirect to specific report articles

## Navigation Structure
- **Top Navigation**: `TopNavigation.tsx` — main app header with navigation links
- **Side Navigation**: `sideNav/` — contextual side menu for event detail pages
- **Planner Navigation**: `@cvent/planner-navigation` — shared navigation for planner portal
- **Page Layout**: `BasePage.tsx` wraps pages, `PageWithSideMenu.tsx` for pages with side nav

## UI Components
- **Component Library**: Carina UI (`@cvent/carina`) — Cvent's design system
- **Styling**: Tailwind CSS + Emotion (CSS-in-JS)
- **Storybook**: Component documentation at `src/stories/`
- **Key Domain Components**:
  - `homepage/` — Event list, search, cards
  - `event-hotel/` — Hotel association management
  - `eventOverview/` — Event summary dashboard
  - `subBlockGroup/` — Sub-block group management
  - `roomCategories/` — Room category configuration
  - `notifications/` — Notification template management
  - `block-requests/` — Block request handling
  - `request-queue/` — Request queue views
  - `guaranteeRules/` — Guarantee rule configuration
  - `templateEditor/` — Email template editor
  - `hotel/` — Hotel profile views
- **Shared Components**: `common/`, `utils/`, `withPermissions.tsx` (permission HOC)
- **Analytics**: `Gainsight.tsx`, `LogOnPageLoad.tsx` for tracking
