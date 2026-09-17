# Passkey Database API Reference

## Overview

The Passkey Database provides APIs through stored procedures, functions, and direct table access patterns. This document outlines the available database APIs, their usage patterns, and integration guidelines.

## Database Connection APIs

### Connection Strings

#### Transaction Database (TXN)
```sql
-- Alpha Environment
CONNECT username/password@ap50-pas-txn02.core.cvent.org:1521/PKTXNQAI

-- IT50 Environment  
CONNECT username/password@it50-pas-txn01.core.cvent.org:1521/PKTXNINT

-- Production Environment
CONNECT username/password@pr50-pas-txn01.core.cvent.org:1521/PKTXNPRD
```

#### Business Intelligence Database (BI)
```sql
-- Alpha Environment
CONNECT username/password@ap50-pas-bi02.core.cvent.org:1521/PKBIQAI

-- Production Environment
CONNECT username/password@pr50-pas-bi01.core.cvent.org:1521/PKBIPRD
```

## Schema Access Patterns

### Microservice User Access

Each microservice has dedicated database users with specific privileges:

```sql
-- Example: Hotel Service Access
GRANT SELECT, INSERT, UPDATE, DELETE ON COMMON.HOTELS TO MS_HOTEL_USER;
GRANT SELECT ON COMMON.COUNTRIES TO MS_HOTEL_USER;
GRANT EXECUTE ON COMMON.HOTEL_PKG TO MS_HOTEL_USER;
```

### API User Access

External API access through dedicated API users:

```sql
-- API User Privileges
GRANT SELECT ON GUI.EVENTS TO API_USER;
GRANT SELECT ON COMMON.HOTELS TO API_USER;
GRANT EXECUTE ON API_OWNER.EVENT_API_PKG TO API_USER;
```

## Stored Procedure APIs

### Common Utilities Package

```sql
-- Package: COMMON.UTIL_PKG
-- Purpose: Common utility functions

-- Get System Configuration
FUNCTION get_config_value(p_config_name VARCHAR2) RETURN VARCHAR2;

-- Audit Trail Functions
PROCEDURE log_user_action(
    p_user_id NUMBER,
    p_action VARCHAR2,
    p_table_name VARCHAR2,
    p_record_id NUMBER
);

-- Date Utilities
FUNCTION get_business_date RETURN DATE;
FUNCTION format_display_date(p_date DATE) RETURN VARCHAR2;
```

### Hotel Management APIs

```sql
-- Package: COMMON.HOTEL_PKG
-- Purpose: Hotel data management

-- Get Hotel Information
FUNCTION get_hotel_details(p_hotel_id NUMBER) RETURN hotel_rec;

-- Update Hotel Status
PROCEDURE update_hotel_status(
    p_hotel_id NUMBER,
    p_status VARCHAR2,
    p_user_id NUMBER
);

-- Search Hotels
FUNCTION search_hotels(
    p_city VARCHAR2 DEFAULT NULL,
    p_state VARCHAR2 DEFAULT NULL,
    p_country VARCHAR2 DEFAULT NULL
) RETURN hotel_cursor;
```

### Event Management APIs

```sql
-- Package: GUI.EVENT_PKG
-- Purpose: Event management operations

-- Create Event
PROCEDURE create_event(
    p_event_name VARCHAR2,
    p_start_date DATE,
    p_end_date DATE,
    p_hotel_id NUMBER,
    p_user_id NUMBER,
    p_event_id OUT NUMBER
);

-- Update Event
PROCEDURE update_event(
    p_event_id NUMBER,
    p_event_name VARCHAR2 DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_user_id NUMBER
);

-- Get Event Details
FUNCTION get_event_details(p_event_id NUMBER) RETURN event_rec;
```

### Reservation APIs

```sql
-- Package: BRIDGE.RESERVATION_PKG
-- Purpose: Reservation processing

-- Create Reservation
PROCEDURE create_reservation(
    p_event_id NUMBER,
    p_guest_name VARCHAR2,
    p_check_in DATE,
    p_check_out DATE,
    p_room_type VARCHAR2,
    p_user_id NUMBER,
    p_reservation_id OUT NUMBER
);

-- Cancel Reservation
PROCEDURE cancel_reservation(
    p_reservation_id NUMBER,
    p_reason VARCHAR2,
    p_user_id NUMBER
);

-- Get Reservation Status
FUNCTION get_reservation_status(p_reservation_id NUMBER) RETURN VARCHAR2;
```

## Data Access APIs

### Direct Table Access Patterns

#### Read Operations
```sql
-- Standard SELECT patterns for microservices
SELECT hotel_id, hotel_name, city, state, country
FROM COMMON.HOTELS
WHERE status = 'ACTIVE'
AND city = :city_param;

-- Paginated results
SELECT * FROM (
    SELECT ROWNUM rn, h.*
    FROM COMMON.HOTELS h
    WHERE status = 'ACTIVE'
    ORDER BY hotel_name
) WHERE rn BETWEEN :start_row AND :end_row;
```

#### Write Operations
```sql
-- Standard INSERT pattern
INSERT INTO GUI.EVENTS (
    event_id, event_name, start_date, end_date,
    hotel_id, created_by, created_date
) VALUES (
    event_seq.NEXTVAL, :event_name, :start_date, :end_date,
    :hotel_id, :user_id, SYSDATE
);

-- Standard UPDATE pattern
UPDATE BRIDGE.RESERVATIONS
SET status = :new_status,
    modified_by = :user_id,
    modified_date = SYSDATE
WHERE reservation_id = :reservation_id;
```

## Security and Authentication APIs

### Permission Checking

```sql
-- Package: PERM.SECURITY_PKG
-- Purpose: Security and permission management

-- Check User Permission
FUNCTION has_permission(
    p_user_id NUMBER,
    p_resource VARCHAR2,
    p_action VARCHAR2
) RETURN BOOLEAN;

-- Get User Roles
FUNCTION get_user_roles(p_user_id NUMBER) RETURN role_cursor;

-- Validate Session
FUNCTION validate_session(p_session_id VARCHAR2) RETURN BOOLEAN;
```

### Audit Trail APIs

```sql
-- Package: COMMON.AUDIT_PKG
-- Purpose: Audit trail management

-- Log Database Action
PROCEDURE log_db_action(
    p_user_id NUMBER,
    p_action VARCHAR2,
    p_table_name VARCHAR2,
    p_record_id NUMBER,
    p_old_values CLOB DEFAULT NULL,
    p_new_values CLOB DEFAULT NULL
);

-- Get Audit History
FUNCTION get_audit_history(
    p_table_name VARCHAR2,
    p_record_id NUMBER,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
) RETURN audit_cursor;
```

## Reporting and Analytics APIs

### Business Intelligence Queries

```sql
-- Package: BI.REPORTING_PKG
-- Purpose: Business intelligence and reporting

-- Hotel Performance Report
FUNCTION get_hotel_performance(
    p_hotel_id NUMBER,
    p_start_date DATE,
    p_end_date DATE
) RETURN performance_cursor;

-- Revenue Analytics
FUNCTION get_revenue_analytics(
    p_period VARCHAR2, -- 'DAILY', 'WEEKLY', 'MONTHLY'
    p_start_date DATE,
    p_end_date DATE
) RETURN revenue_cursor;
```

## Integration APIs

### External System Integration

```sql
-- Package: API_OWNER.INTEGRATION_PKG
-- Purpose: External system integration

-- Export Data for External Systems
PROCEDURE export_hotel_data(
    p_format VARCHAR2, -- 'JSON', 'XML', 'CSV'
    p_filter_criteria VARCHAR2,
    p_output_clob OUT CLOB
);

-- Import External Data
PROCEDURE import_external_data(
    p_data_type VARCHAR2,
    p_data_payload CLOB,
    p_validation_mode VARCHAR2 DEFAULT 'STRICT'
);
```

## Error Handling

### Standard Error Codes

```sql
-- Application Error Codes
-20001: Invalid User ID
-20002: Permission Denied
-20003: Invalid Date Range
-20004: Hotel Not Found
-20005: Event Not Found
-20006: Reservation Conflict
-20007: Invalid Status Transition
-20008: Data Validation Error
-20009: External System Error
-20010: Session Expired
```

### Error Handling Pattern

```sql
-- Standard error handling in procedures
PROCEDURE example_procedure(p_param VARCHAR2) IS
BEGIN
    -- Validation
    IF p_param IS NULL THEN
        RAISE_APPLICATION_ERROR(-20008, 'Parameter cannot be null');
    END IF;
    
    -- Business logic
    -- ...
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20004, 'Record not found');
    WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20008, 'Duplicate record');
    WHEN OTHERS THEN
        -- Log error and re-raise
        log_error(SQLCODE, SQLERRM, 'example_procedure');
        RAISE;
END;
```

## Performance Guidelines

### Query Optimization

```sql
-- Use bind variables
SELECT * FROM COMMON.HOTELS WHERE hotel_id = :hotel_id;

-- Use appropriate indexes
-- Index on (status, city) for this query pattern
SELECT * FROM COMMON.HOTELS 
WHERE status = 'ACTIVE' AND city = :city;

-- Limit result sets
SELECT * FROM (
    SELECT * FROM GUI.EVENTS 
    WHERE event_date >= SYSDATE
    ORDER BY event_date
) WHERE ROWNUM <= 100;
```

### Connection Management

```sql
-- Use connection pooling
-- Set appropriate timeout values
-- Close cursors and connections properly
```

## Versioning and Compatibility

### API Versioning Strategy
- Backward compatibility maintained for 2 major versions
- Deprecated APIs marked with comments
- New APIs introduced with version tags

### Migration Support
```sql
-- Version compatibility check
FUNCTION get_api_version RETURN VARCHAR2;
FUNCTION is_compatible_version(p_required_version VARCHAR2) RETURN BOOLEAN;
```

## Usage Examples

### Complete Integration Example

```sql
-- Example: Creating a hotel reservation
DECLARE
    l_reservation_id NUMBER;
    l_event_id NUMBER;
BEGIN
    -- Validate user permissions
    IF NOT PERM.SECURITY_PKG.has_permission(
        p_user_id => :user_id,
        p_resource => 'RESERVATIONS',
        p_action => 'CREATE'
    ) THEN
        RAISE_APPLICATION_ERROR(-20002, 'Permission denied');
    END IF;
    
    -- Get event details
    l_event_id := GUI.EVENT_PKG.get_event_id(:event_code);
    
    -- Create reservation
    BRIDGE.RESERVATION_PKG.create_reservation(
        p_event_id => l_event_id,
        p_guest_name => :guest_name,
        p_check_in => :check_in_date,
        p_check_out => :check_out_date,
        p_room_type => :room_type,
        p_user_id => :user_id,
        p_reservation_id => l_reservation_id
    );
    
    -- Log the action
    COMMON.AUDIT_PKG.log_db_action(
        p_user_id => :user_id,
        p_action => 'CREATE_RESERVATION',
        p_table_name => 'RESERVATIONS',
        p_record_id => l_reservation_id
    );
    
    COMMIT;
    
    -- Return reservation ID
    :out_reservation_id := l_reservation_id;
END;
/
```