# Passkey Database Domain Model

## Overview

The Passkey Database domain model represents the core business entities and relationships for Cvent's hotel booking platform. The model is distributed across multiple schemas, each serving specific business functions within the hospitality and event management domain.

## Core Business Domains

### Hotel Management Domain

#### Hotels Entity
```sql
-- COMMON.HOTELS
CREATE TABLE HOTELS (
    hotel_id NUMBER PRIMARY KEY,
    hotel_name VARCHAR2(255) NOT NULL,
    hotel_code VARCHAR2(50) UNIQUE,
    address_line1 VARCHAR2(255),
    address_line2 VARCHAR2(255),
    city VARCHAR2(100),
    state VARCHAR2(50),
    country VARCHAR2(50),
    postal_code VARCHAR2(20),
    phone VARCHAR2(50),
    email VARCHAR2(255),
    status VARCHAR2(20) DEFAULT 'ACTIVE',
    created_date DATE DEFAULT SYSDATE,
    created_by NUMBER,
    modified_date DATE,
    modified_by NUMBER
);
```

#### Room Types Entity
```sql
-- COMMON.ROOM_TYPES
CREATE TABLE ROOM_TYPES (
    room_type_id NUMBER PRIMARY KEY,
    hotel_id NUMBER REFERENCES HOTELS(hotel_id),
    room_type_code VARCHAR2(50),
    room_type_name VARCHAR2(255),
    description CLOB,
    max_occupancy NUMBER,
    base_rate NUMBER(10,2),
    status VARCHAR2(20) DEFAULT 'ACTIVE'
);
```

### Event Management Domain

#### Events Entity
```sql
-- GUI.EVENTS
CREATE TABLE EVENTS (
    event_id NUMBER PRIMARY KEY,
    event_code VARCHAR2(50) UNIQUE,
    event_name VARCHAR2(255) NOT NULL,
    event_type VARCHAR2(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hotel_id NUMBER,
    organization_id NUMBER,
    planner_id NUMBER,
    status VARCHAR2(20) DEFAULT 'ACTIVE',
    room_block_start DATE,
    room_block_end DATE,
    cutoff_date DATE,
    created_date DATE DEFAULT SYSDATE,
    created_by NUMBER
);
```

#### Event Profiles Entity
```sql
-- EVENTPROFILE.EVENT_PROFILES
CREATE TABLE EVENT_PROFILES (
    profile_id NUMBER PRIMARY KEY,
    event_id NUMBER REFERENCES GUI.EVENTS(event_id),
    profile_type VARCHAR2(50),
    profile_data CLOB,
    settings CLOB,
    created_date DATE DEFAULT SYSDATE
);
```

### Reservation Management Domain

#### Reservations Entity
```sql
-- BRIDGE.RESERVATIONS
CREATE TABLE RESERVATIONS (
    reservation_id NUMBER PRIMARY KEY,
    confirmation_number VARCHAR2(50) UNIQUE,
    event_id NUMBER,
    guest_first_name VARCHAR2(100),
    guest_last_name VARCHAR2(100),
    guest_email VARCHAR2(255),
    guest_phone VARCHAR2(50),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_type_id NUMBER,
    number_of_rooms NUMBER DEFAULT 1,
    number_of_guests NUMBER DEFAULT 1,
    special_requests CLOB,
    status VARCHAR2(20) DEFAULT 'CONFIRMED',
    rate_amount NUMBER(10,2),
    total_amount NUMBER(10,2),
    created_date DATE DEFAULT SYSDATE,
    created_by NUMBER
);
```

#### Guest Information Entity
```sql
-- BRIDGE.GUESTS
CREATE TABLE GUESTS (
    guest_id NUMBER PRIMARY KEY,
    first_name VARCHAR2(100),
    last_name VARCHAR2(100),
    email VARCHAR2(255),
    phone VARCHAR2(50),
    address_line1 VARCHAR2(255),
    address_line2 VARCHAR2(255),
    city VARCHAR2(100),
    state VARCHAR2(50),
    country VARCHAR2(50),
    postal_code VARCHAR2(20),
    preferences CLOB,
    loyalty_number VARCHAR2(50)
);
```

### User Management Domain

#### Users Entity
```sql
-- COMMON.USERS
CREATE TABLE USERS (
    user_id NUMBER PRIMARY KEY,
    username VARCHAR2(100) UNIQUE NOT NULL,
    email VARCHAR2(255) UNIQUE NOT NULL,
    first_name VARCHAR2(100),
    last_name VARCHAR2(100),
    user_type VARCHAR2(50), -- 'PLANNER', 'HOTEL_STAFF', 'ADMIN', etc.
    organization_id NUMBER,
    hotel_id NUMBER,
    status VARCHAR2(20) DEFAULT 'ACTIVE',
    last_login_date DATE,
    created_date DATE DEFAULT SYSDATE,
    password_hash VARCHAR2(255),
    password_salt VARCHAR2(100)
);
```

#### Organizations Entity
```sql
-- COMMON.ORGANIZATIONS
CREATE TABLE ORGANIZATIONS (
    organization_id NUMBER PRIMARY KEY,
    organization_name VARCHAR2(255) NOT NULL,
    organization_type VARCHAR2(50),
    contact_email VARCHAR2(255),
    contact_phone VARCHAR2(50),
    address_line1 VARCHAR2(255),
    city VARCHAR2(100),
    state VARCHAR2(50),
    country VARCHAR2(50),
    status VARCHAR2(20) DEFAULT 'ACTIVE'
);
```

### Permission and Security Domain

#### Roles Entity
```sql
-- PERM.ROLES
CREATE TABLE ROLES (
    role_id NUMBER PRIMARY KEY,
    role_name VARCHAR2(100) UNIQUE NOT NULL,
    role_description VARCHAR2(500),
    role_type VARCHAR2(50), -- 'SYSTEM', 'BUSINESS', 'CUSTOM'
    status VARCHAR2(20) DEFAULT 'ACTIVE',
    created_date DATE DEFAULT SYSDATE
);
```

#### User Roles Entity
```sql
-- PERM.USER_ROLES
CREATE TABLE USER_ROLES (
    user_role_id NUMBER PRIMARY KEY,
    user_id NUMBER REFERENCES COMMON.USERS(user_id),
    role_id NUMBER REFERENCES ROLES(role_id),
    granted_by NUMBER,
    granted_date DATE DEFAULT SYSDATE,
    status VARCHAR2(20) DEFAULT 'ACTIVE'
);
```

#### Permissions Entity
```sql
-- PERM.PERMISSIONS
CREATE TABLE PERMISSIONS (
    permission_id NUMBER PRIMARY KEY,
    permission_name VARCHAR2(100) UNIQUE NOT NULL,
    resource_type VARCHAR2(100),
    action_type VARCHAR2(50), -- 'CREATE', 'READ', 'UPDATE', 'DELETE'
    description VARCHAR2(500)
);
```

### E-commerce Domain

#### Payments Entity
```sql
-- ECOMMERCE.PAYMENTS
CREATE TABLE PAYMENTS (
    payment_id NUMBER PRIMARY KEY,
    reservation_id NUMBER,
    payment_method VARCHAR2(50), -- 'CREDIT_CARD', 'BANK_TRANSFER', etc.
    payment_amount NUMBER(10,2),
    payment_currency VARCHAR2(3) DEFAULT 'USD',
    payment_status VARCHAR2(20), -- 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
    transaction_id VARCHAR2(100),
    payment_date DATE,
    processed_date DATE,
    gateway_response CLOB,
    created_date DATE DEFAULT SYSDATE
);
```

#### Invoices Entity
```sql
-- ECOMMERCE.INVOICES
CREATE TABLE INVOICES (
    invoice_id NUMBER PRIMARY KEY,
    reservation_id NUMBER,
    invoice_number VARCHAR2(50) UNIQUE,
    invoice_date DATE,
    due_date DATE,
    subtotal NUMBER(10,2),
    tax_amount NUMBER(10,2),
    total_amount NUMBER(10,2),
    status VARCHAR2(20), -- 'DRAFT', 'SENT', 'PAID', 'OVERDUE'
    created_date DATE DEFAULT SYSDATE
);
```

## Domain Relationships

### Core Entity Relationships

```
ORGANIZATIONS (1) ──── (M) USERS
                              │
                              │ (M)
                              ▼
HOTELS (1) ──── (M) ROOM_TYPES    USER_ROLES (M) ──── (1) ROLES
   │                                   │                    │
   │ (1)                               │ (M)                │ (M)
   ▼                                   ▼                    ▼
EVENTS (1) ──── (M) RESERVATIONS ──── (1) USERS ──── (M) ROLE_PERMISSIONS
   │                    │                              │
   │ (1)                │ (M)                          │ (1)
   ▼                    ▼                              ▼
EVENT_PROFILES     GUESTS (1) ──── (M) GUEST_RESERVATIONS   PERMISSIONS
                        │
                        │ (1)
                        ▼
                   PAYMENTS (M) ──── (1) INVOICES
```

### Schema Distribution

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     COMMON      │    │       GUI       │    │     BRIDGE      │
│                 │    │                 │    │                 │
│ • HOTELS        │    │ • EVENTS        │    │ • RESERVATIONS  │
│ • USERS         │    │ • EVENT_TYPES   │    │ • GUESTS        │
│ • ORGANIZATIONS │    │ • UI_CONFIGS    │    │ • INTEGRATIONS  │
│ • COUNTRIES     │    │ • TEMPLATES     │    │ • API_LOGS      │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      PERM       │    │   ECOMMERCE     │    │ EVENTPROFILE    │
│                 │    │                 │    │                 │
│ • ROLES         │    │ • PAYMENTS      │    │ • EVENT_PROFILES│
│ • PERMISSIONS   │    │ • INVOICES      │    │ • PROFILE_DATA  │
│ • USER_ROLES    │    │ • TRANSACTIONS  │    │ • SETTINGS      │
│ • ACCESS_LOGS   │    │ • REFUNDS       │    │ • CUSTOMIZATIONS│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Types and Constraints

### Standard Data Types

```sql
-- Primary Keys
hotel_id NUMBER PRIMARY KEY

-- Foreign Keys
hotel_id NUMBER REFERENCES COMMON.HOTELS(hotel_id)

-- Status Fields (standardized)
status VARCHAR2(20) DEFAULT 'ACTIVE' 
CHECK (status IN ('ACTIVE', 'INACTIVE', 'DELETED', 'PENDING'))

-- Audit Fields (standard pattern)
created_date DATE DEFAULT SYSDATE NOT NULL,
created_by NUMBER NOT NULL,
modified_date DATE,
modified_by NUMBER

-- Monetary Values
amount NUMBER(10,2) -- 10 digits total, 2 decimal places

-- Email Addresses
email VARCHAR2(255) CHECK (email LIKE '%@%.%')

-- Phone Numbers
phone VARCHAR2(50) -- Flexible format for international numbers
```

### Business Rules and Constraints

#### Hotel Business Rules
```sql
-- Hotel must have valid address
ALTER TABLE HOTELS ADD CONSTRAINT chk_hotel_address 
CHECK (city IS NOT NULL AND country IS NOT NULL);

-- Hotel code must be uppercase
ALTER TABLE HOTELS ADD CONSTRAINT chk_hotel_code_format
CHECK (hotel_code = UPPER(hotel_code));
```

#### Event Business Rules
```sql
-- Event end date must be after start date
ALTER TABLE EVENTS ADD CONSTRAINT chk_event_dates
CHECK (end_date >= start_date);

-- Room block dates must be within event dates
ALTER TABLE EVENTS ADD CONSTRAINT chk_room_block_dates
CHECK (room_block_start >= start_date AND room_block_end <= end_date);
```

#### Reservation Business Rules
```sql
-- Check-out must be after check-in
ALTER TABLE RESERVATIONS ADD CONSTRAINT chk_reservation_dates
CHECK (check_out_date > check_in_date);

-- Number of rooms and guests must be positive
ALTER TABLE RESERVATIONS ADD CONSTRAINT chk_positive_numbers
CHECK (number_of_rooms > 0 AND number_of_guests > 0);
```

## Archive and Historical Data

### Archive Schema Pattern

Each business domain has corresponding archive schemas:

```sql
-- Archive table pattern
CREATE TABLE COMMON_ARCHIVE.HOTELS_ARCHIVE (
    -- All original columns
    hotel_id NUMBER,
    hotel_name VARCHAR2(255),
    -- ... other columns
    
    -- Archive-specific columns
    archived_date DATE DEFAULT SYSDATE,
    archived_by NUMBER,
    archive_reason VARCHAR2(100),
    original_table VARCHAR2(100) DEFAULT 'HOTELS'
);
```

### Data Lifecycle

```
Active Data (Current Schemas)
        │
        ▼ (After retention period)
Archive Data (Archive Schemas)
        │
        ▼ (After extended retention)
Purged Data (Removed from system)
```

## Microservice Data Ownership

### Schema-to-Service Mapping

```
Service Domain          │ Primary Schema    │ Secondary Schemas
───────────────────────┼──────────────────┼─────────────────────
Hotel Service          │ COMMON           │ MS_HOTEL_USER
Event Service          │ GUI              │ MS_EVENT_USER
Reservation Service    │ BRIDGE           │ MS_RESERVATION_USER
Payment Service        │ ECOMMERCE        │ MS_PAYMENT_USER
User Service           │ COMMON           │ MS_USER_SERVICE_USER
Permission Service     │ PERM             │ MS_PERMISSION_USER
```

### Data Access Patterns

```sql
-- Microservice read pattern
SELECT h.hotel_id, h.hotel_name, h.city, h.status
FROM COMMON.HOTELS h
WHERE h.status = 'ACTIVE'
AND h.hotel_id = :hotel_id;

-- Microservice write pattern (through service user)
INSERT INTO BRIDGE.RESERVATIONS (
    reservation_id, event_id, guest_first_name, 
    guest_last_name, check_in_date, check_out_date,
    created_by, created_date
) VALUES (
    reservation_seq.NEXTVAL, :event_id, :first_name,
    :last_name, :check_in, :check_out,
    :service_user_id, SYSDATE
);
```

## Data Quality and Validation

### Validation Rules

```sql
-- Email validation
FUNCTION is_valid_email(p_email VARCHAR2) RETURN BOOLEAN IS
BEGIN
    RETURN REGEXP_LIKE(p_email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
END;

-- Phone validation
FUNCTION is_valid_phone(p_phone VARCHAR2) RETURN BOOLEAN IS
BEGIN
    RETURN REGEXP_LIKE(p_phone, '^\+?[1-9]\d{1,14}$');
END;

-- Date range validation
FUNCTION is_valid_date_range(p_start DATE, p_end DATE) RETURN BOOLEAN IS
BEGIN
    RETURN p_end >= p_start AND p_start >= TRUNC(SYSDATE);
END;
```

### Data Integrity Triggers

```sql
-- Audit trigger example
CREATE OR REPLACE TRIGGER trg_hotels_audit
    BEFORE UPDATE ON COMMON.HOTELS
    FOR EACH ROW
BEGIN
    :NEW.modified_date := SYSDATE;
    :NEW.modified_by := NVL(SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER'), USER);
    
    -- Log the change
    INSERT INTO COMMON.AUDIT_LOG (
        table_name, record_id, action_type, 
        old_values, new_values, changed_by, changed_date
    ) VALUES (
        'HOTELS', :NEW.hotel_id, 'UPDATE',
        hotel_to_json(:OLD), hotel_to_json(:NEW),
        :NEW.modified_by, SYSDATE
    );
END;
```

## Performance Considerations

### Indexing Strategy

```sql
-- Primary business indexes
CREATE INDEX idx_hotels_city_status ON COMMON.HOTELS(city, status);
CREATE INDEX idx_events_dates ON GUI.EVENTS(start_date, end_date);
CREATE INDEX idx_reservations_guest ON BRIDGE.RESERVATIONS(guest_email, status);

-- Composite indexes for common queries
CREATE INDEX idx_reservations_event_dates 
ON BRIDGE.RESERVATIONS(event_id, check_in_date, check_out_date);
```

### Partitioning Strategy

```sql
-- Date-based partitioning for large tables
CREATE TABLE BRIDGE.RESERVATIONS_PARTITIONED (
    -- columns
) PARTITION BY RANGE (created_date) (
    PARTITION p_2024_q1 VALUES LESS THAN (DATE '2024-04-01'),
    PARTITION p_2024_q2 VALUES LESS THAN (DATE '2024-07-01'),
    -- additional partitions
);
```