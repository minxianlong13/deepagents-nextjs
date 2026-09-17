# Passkey Database Technical Details

## Database Configuration

### Oracle Database Version
- **Version**: Oracle Database 19c Enterprise Edition
- **Character Set**: AL32UTF8
- **National Character Set**: AL16UTF16
- **Block Size**: 8KB
- **Compatibility**: 19.0.0

### Instance Configuration

#### Memory Settings
```sql
-- SGA Configuration
sga_target = 4G
pga_aggregate_target = 1G
shared_pool_size = 1G
buffer_cache_size = 2G
large_pool_size = 256M
java_pool_size = 128M
```

#### Process Configuration
```sql
-- Process Limits
processes = 500
sessions = 600
open_cursors = 1000
```

### Tablespace Configuration

#### Transaction Database (TXN)
```sql
-- System Tablespaces
SYSTEM          - 2GB (AUTOEXTEND ON)
SYSAUX          - 1GB (AUTOEXTEND ON)
TEMP            - 1GB (AUTOEXTEND ON)
UNDOTBS1        - 2GB (AUTOEXTEND ON)

-- Application Tablespaces
COMMON_DATA     - 5GB (AUTOEXTEND ON MAXSIZE 20GB)
COMMON_INDEX    - 2GB (AUTOEXTEND ON MAXSIZE 10GB)
GUI_DATA        - 3GB (AUTOEXTEND ON MAXSIZE 15GB)
GUI_INDEX       - 1GB (AUTOEXTEND ON MAXSIZE 5GB)
BRIDGE_DATA     - 10GB (AUTOEXTEND ON MAXSIZE 50GB)
BRIDGE_INDEX    - 3GB (AUTOEXTEND ON MAXSIZE 15GB)
PERM_DATA       - 1GB (AUTOEXTEND ON MAXSIZE 5GB)
ECOMMERCE_DATA  - 5GB (AUTOEXTEND ON MAXSIZE 25GB)
ARCHIVE_DATA    - 20GB (AUTOEXTEND ON MAXSIZE 100GB)
```

#### Business Intelligence Database (BI)
```sql
-- BI-Specific Tablespaces
BI_DATA         - 15GB (AUTOEXTEND ON MAXSIZE 100GB)
BI_INDEX        - 5GB (AUTOEXTEND ON MAXSIZE 25GB)
BI_TEMP         - 5GB (AUTOEXTEND ON MAXSIZE 20GB)
```

## Schema Architecture

### Schema Naming Conventions

```sql
-- Business Domain Schemas
COMMON          -- Shared reference data
GUI             -- User interface data
BRIDGE          -- Integration and bridging
PERM            -- Permissions and security
ECOMMERCE       -- E-commerce transactions
EVENTPROFILE    -- Event profile management

-- Microservice Schemas
MS_*_USER       -- Microservice user schemas
API_USER        -- External API access
SERVICE_OWNER   -- Service ownership

-- Archive Schemas
*_ARCHIVE       -- Historical data storage

-- System Schemas
SYSTEM          -- Oracle system schema
PUBLIC          -- Public synonyms and grants
```

### Object Naming Standards

```sql
-- Tables
HOTELS                  -- Singular, uppercase
EVENT_PROFILES         -- Underscore for compound names

-- Indexes
IDX_HOTELS_CITY        -- IDX_ prefix, table_column format
PK_HOTELS              -- PK_ for primary keys
FK_EVENTS_HOTEL_ID     -- FK_ for foreign keys

-- Sequences
HOTEL_SEQ              -- Table name + _SEQ
EVENT_ID_SEQ           -- Specific ID sequences

-- Triggers
TRG_HOTELS_AUDIT       -- TRG_ prefix, table_purpose
TRG_EVENTS_BIU         -- Before Insert/Update

-- Procedures/Functions
PKG_HOTEL_MGMT         -- PKG_ prefix for packages
PROC_UPDATE_STATUS     -- PROC_ prefix for procedures
FUNC_GET_HOTEL_NAME    -- FUNC_ prefix for functions
```

## Security Implementation

### User Management

#### System Users
```sql
-- Database Administrator
CREATE USER DBA_USER IDENTIFIED BY <password>
DEFAULT TABLESPACE USERS
TEMPORARY TABLESPACE TEMP;

GRANT DBA TO DBA_USER;

-- Application Schema Owners
CREATE USER COMMON IDENTIFIED BY <password>
DEFAULT TABLESPACE COMMON_DATA
TEMPORARY TABLESPACE TEMP;

GRANT CONNECT, RESOURCE TO COMMON;
GRANT CREATE VIEW, CREATE SYNONYM TO COMMON;
```

#### Microservice Users
```sql
-- Hotel Service User
CREATE USER MS_HOTEL_USER IDENTIFIED BY <password>
DEFAULT TABLESPACE USERS
TEMPORARY TABLESPACE TEMP;

GRANT CONNECT TO MS_HOTEL_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON COMMON.HOTELS TO MS_HOTEL_USER;
GRANT SELECT ON COMMON.COUNTRIES TO MS_HOTEL_USER;
```

### Role-Based Access Control

#### Standard Roles
```sql
-- Business Roles
CREATE ROLE PASSKEY_ADMIN;
CREATE ROLE PASSKEY_USER;
CREATE ROLE PASSKEY_READONLY;

-- Technical Roles
CREATE ROLE MICROSERVICE_ROLE;
CREATE ROLE API_ACCESS_ROLE;
CREATE ROLE REPORTING_ROLE;

-- Grant Hierarchies
GRANT PASSKEY_USER TO PASSKEY_ADMIN;
GRANT PASSKEY_READONLY TO PASSKEY_USER;
```

### Encryption and Security

#### Transparent Data Encryption (TDE)
```sql
-- Wallet Configuration
ALTER SYSTEM SET ENCRYPTION KEY IDENTIFIED BY "<wallet_password>";

-- Encrypted Tablespaces
CREATE TABLESPACE SECURE_DATA
DATAFILE '/path/to/secure_data01.dbf' SIZE 1G
ENCRYPTION USING 'AES256'
DEFAULT STORAGE(ENCRYPT);
```

#### Column-Level Encryption
```sql
-- Sensitive Data Encryption
ALTER TABLE COMMON.USERS MODIFY (
    password_hash ENCRYPT USING 'AES256',
    ssn ENCRYPT USING 'AES256'
);
```

## Performance Optimization

### Indexing Strategy

#### Primary Key Indexes
```sql
-- Automatically created with PRIMARY KEY constraints
ALTER TABLE COMMON.HOTELS ADD CONSTRAINT PK_HOTELS PRIMARY KEY (hotel_id);
```

#### Business Logic Indexes
```sql
-- Hotel search optimization
CREATE INDEX IDX_HOTELS_LOCATION ON COMMON.HOTELS(country, state, city, status);

-- Event date range queries
CREATE INDEX IDX_EVENTS_DATES ON GUI.EVENTS(start_date, end_date, status);

-- Reservation lookups
CREATE INDEX IDX_RESERVATIONS_GUEST ON BRIDGE.RESERVATIONS(guest_email, status);
CREATE INDEX IDX_RESERVATIONS_CONF ON BRIDGE.RESERVATIONS(confirmation_number);

-- Audit trail queries
CREATE INDEX IDX_AUDIT_LOG_DATE ON COMMON.AUDIT_LOG(created_date, table_name);
```

#### Composite Indexes
```sql
-- Multi-column search patterns
CREATE INDEX IDX_EVENTS_HOTEL_DATES 
ON GUI.EVENTS(hotel_id, start_date, end_date, status);

CREATE INDEX IDX_RESERVATIONS_EVENT_STATUS
ON BRIDGE.RESERVATIONS(event_id, status, check_in_date);
```

### Partitioning Implementation

#### Range Partitioning
```sql
-- Date-based partitioning for audit logs
CREATE TABLE COMMON.AUDIT_LOG_PARTITIONED (
    log_id NUMBER,
    table_name VARCHAR2(100),
    action_type VARCHAR2(50),
    created_date DATE,
    -- other columns
) PARTITION BY RANGE (created_date) (
    PARTITION p_2024_01 VALUES LESS THAN (DATE '2024-02-01'),
    PARTITION p_2024_02 VALUES LESS THAN (DATE '2024-03-01'),
    PARTITION p_2024_03 VALUES LESS THAN (DATE '2024-04-01'),
    -- monthly partitions
);
```

#### Hash Partitioning
```sql
-- Hash partitioning for large transaction tables
CREATE TABLE BRIDGE.RESERVATIONS_HASH (
    -- columns
) PARTITION BY HASH (reservation_id) PARTITIONS 8;
```

### Query Optimization

#### Optimizer Settings
```sql
-- Database-level optimizer settings
ALTER SYSTEM SET optimizer_mode = 'ALL_ROWS';
ALTER SYSTEM SET optimizer_index_cost_adj = 20;
ALTER SYSTEM SET optimizer_index_caching = 90;

-- Session-level hints for specific queries
SELECT /*+ FIRST_ROWS(100) */ hotel_id, hotel_name
FROM COMMON.HOTELS
WHERE status = 'ACTIVE'
ORDER BY hotel_name;
```

#### Statistics Management
```sql
-- Automatic statistics gathering
BEGIN
    DBMS_STATS.SET_GLOBAL_PREFS('ESTIMATE_PERCENT', 'AUTO_SAMPLE_SIZE');
    DBMS_STATS.SET_GLOBAL_PREFS('METHOD_OPT', 'FOR ALL COLUMNS SIZE AUTO');
    DBMS_STATS.SET_GLOBAL_PREFS('DEGREE', 'AUTO');
END;
/

-- Manual statistics for critical tables
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(
        ownname => 'COMMON',
        tabname => 'HOTELS',
        estimate_percent => 100,
        method_opt => 'FOR ALL COLUMNS SIZE AUTO',
        cascade => TRUE
    );
END;
/
```

## Backup and Recovery

### Backup Strategy

#### RMAN Configuration
```sql
-- RMAN settings
CONFIGURE RETENTION POLICY TO RECOVERY WINDOW OF 30 DAYS;
CONFIGURE DEFAULT DEVICE TYPE TO DISK;
CONFIGURE BACKUP OPTIMIZATION ON;
CONFIGURE CONTROLFILE AUTOBACKUP ON;
CONFIGURE CONTROLFILE AUTOBACKUP FORMAT FOR DEVICE TYPE DISK TO 
'/backup/passkey/%F';
```

#### Backup Scripts
```bash
#!/bin/bash
# Daily backup script

export ORACLE_SID=PKTXNPRD
export ORACLE_HOME=/u01/app/oracle/product/19.0.0/dbhome_1

rman target / << EOF
RUN {
    ALLOCATE CHANNEL c1 DEVICE TYPE DISK;
    BACKUP DATABASE PLUS ARCHIVELOG;
    DELETE NOPROMPT OBSOLETE;
    RELEASE CHANNEL c1;
}
EXIT;
EOF
```

### Recovery Procedures

#### Point-in-Time Recovery
```sql
-- RMAN point-in-time recovery
STARTUP MOUNT;
RUN {
    SET UNTIL TIME "TO_DATE('2024-01-15 14:30:00','YYYY-MM-DD HH24:MI:SS')";
    RESTORE DATABASE;
    RECOVER DATABASE;
}
ALTER DATABASE OPEN RESETLOGS;
```

#### Flashback Database
```sql
-- Enable flashback database
ALTER DATABASE FLASHBACK ON;
ALTER SYSTEM SET DB_FLASHBACK_RETENTION_TARGET = 1440; -- 24 hours

-- Flashback to specific time
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
FLASHBACK DATABASE TO TIMESTAMP 
    TO_TIMESTAMP('2024-01-15 14:30:00','YYYY-MM-DD HH24:MI:SS');
ALTER DATABASE OPEN RESETLOGS;
```

## Monitoring and Maintenance

### Performance Monitoring

#### AWR Configuration
```sql
-- AWR snapshot settings
BEGIN
    DBMS_WORKLOAD_REPOSITORY.MODIFY_SNAPSHOT_SETTINGS(
        retention => 43200,    -- 30 days
        interval  => 60        -- 1 hour
    );
END;
/
```

#### Custom Monitoring Views
```sql
-- Database performance view
CREATE OR REPLACE VIEW V_DB_PERFORMANCE AS
SELECT 
    instance_name,
    status,
    startup_time,
    (SELECT value FROM v$sysstat WHERE name = 'user commits') commits,
    (SELECT value FROM v$sysstat WHERE name = 'user rollbacks') rollbacks,
    (SELECT value FROM v$sysstat WHERE name = 'physical reads') physical_reads
FROM v$instance;

-- Session monitoring view
CREATE OR REPLACE VIEW V_ACTIVE_SESSIONS AS
SELECT 
    s.sid,
    s.serial#,
    s.username,
    s.program,
    s.machine,
    s.status,
    s.logon_time,
    sq.sql_text
FROM v$session s
LEFT JOIN v$sql sq ON s.sql_id = sq.sql_id
WHERE s.type = 'USER'
AND s.status = 'ACTIVE';
```

### Maintenance Procedures

#### Index Maintenance
```sql
-- Rebuild fragmented indexes
SELECT 'ALTER INDEX ' || owner || '.' || index_name || ' REBUILD;'
FROM dba_indexes
WHERE owner IN ('COMMON', 'GUI', 'BRIDGE', 'PERM', 'ECOMMERCE')
AND status = 'UNUSABLE'
OR (blevel > 3 AND leaf_blocks > 1000);
```

#### Statistics Maintenance
```sql
-- Automated statistics job
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name => 'PASSKEY_STATS_JOB',
        job_type => 'PLSQL_BLOCK',
        job_action => 'BEGIN
                         DBMS_STATS.GATHER_SCHEMA_STATS(''COMMON'');
                         DBMS_STATS.GATHER_SCHEMA_STATS(''GUI'');
                         DBMS_STATS.GATHER_SCHEMA_STATS(''BRIDGE'');
                       END;',
        start_date => SYSTIMESTAMP,
        repeat_interval => 'FREQ=WEEKLY;BYDAY=SUN;BYHOUR=2',
        enabled => TRUE
    );
END;
/
```

## Integration Technologies

### Oracle Data Integrator (ODI)

#### ODI Configuration
```sql
-- ODI repository connection
CREATE USER ODI_REPO IDENTIFIED BY <password>
DEFAULT TABLESPACE ODI_DATA
TEMPORARY TABLESPACE TEMP;

GRANT CONNECT, RESOURCE TO ODI_REPO;
GRANT CREATE VIEW, CREATE SYNONYM TO ODI_REPO;
```

#### ETL Mappings
- TXN to BI data synchronization
- External system data imports
- Data quality transformations
- Archive data movement

### Oracle GoldenGate (OGG)

#### GoldenGate Setup
```sql
-- GoldenGate user
CREATE USER GGADMIN IDENTIFIED BY <password>;
GRANT DBA TO GGADMIN;

-- Supplemental logging
ALTER DATABASE ADD SUPPLEMENTAL LOG DATA;
ALTER DATABASE ADD SUPPLEMENTAL LOG DATA (PRIMARY KEY, UNIQUE) COLUMNS;
```

#### Replication Configuration
```
-- Extract configuration
EXTRACT E_PASSKEY
USERID GGADMIN, PASSWORD <password>
EXTTRAIL ./dirdat/lt
TABLE COMMON.HOTELS;
TABLE GUI.EVENTS;
TABLE BRIDGE.RESERVATIONS;

-- Replicat configuration
REPLICAT R_PASSKEY
USERID GGADMIN, PASSWORD <password>
MAP COMMON.HOTELS, TARGET BI.HOTELS_DIM;
MAP GUI.EVENTS, TARGET BI.EVENTS_FACT;
```

## Environment-Specific Configurations

### Development Environment
```sql
-- Reduced memory settings
sga_target = 1G
pga_aggregate_target = 512M

-- Development-specific parameters
optimizer_mode = 'FIRST_ROWS'
cursor_sharing = 'SIMILAR'
```

### Production Environment
```sql
-- Production memory settings
sga_target = 8G
pga_aggregate_target = 2G

-- Production-specific parameters
optimizer_mode = 'ALL_ROWS'
cursor_sharing = 'EXACT'
parallel_max_servers = 16
```

### High Availability Configuration
```sql
-- RAC-specific parameters (Production)
cluster_database = TRUE
instance_number = 1  -- Node 1
thread = 1

-- Data Guard configuration
log_archive_dest_1 = 'LOCATION=/arch/local VALID_FOR=(ALL_LOGFILES,ALL_ROLES) DB_UNIQUE_NAME=PKTXNPRD'
log_archive_dest_2 = 'SERVICE=PKTXNSTBY VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE) DB_UNIQUE_NAME=PKTXNSTBY'
```

## Troubleshooting and Diagnostics

### Common Issues and Solutions

#### Performance Issues
```sql
-- Identify slow queries
SELECT sql_id, elapsed_time, executions, 
       elapsed_time/executions avg_elapsed
FROM v$sql
WHERE executions > 0
ORDER BY avg_elapsed DESC;

-- Check for blocking sessions
SELECT blocking_session, sid, serial#, wait_class, event
FROM v$session
WHERE blocking_session IS NOT NULL;
```

#### Space Management
```sql
-- Check tablespace usage
SELECT tablespace_name,
       ROUND(used_mb, 2) used_mb,
       ROUND(free_mb, 2) free_mb,
       ROUND(total_mb, 2) total_mb,
       ROUND((used_mb/total_mb)*100, 2) pct_used
FROM (
    SELECT tablespace_name,
           SUM(bytes)/1024/1024 total_mb
    FROM dba_data_files
    GROUP BY tablespace_name
) t1,
(
    SELECT tablespace_name,
           SUM(bytes)/1024/1024 free_mb
    FROM dba_free_space
    GROUP BY tablespace_name
) t2,
(
    SELECT tablespace_name,
           SUM(bytes)/1024/1024 used_mb
    FROM dba_segments
    GROUP BY tablespace_name
) t3
WHERE t1.tablespace_name = t2.tablespace_name(+)
AND t1.tablespace_name = t3.tablespace_name(+);
```

### Diagnostic Scripts

#### Health Check Script
```sql
-- Database health check
SELECT 'Database Status' as check_type, status as result FROM v$database
UNION ALL
SELECT 'Instance Status', status FROM v$instance
UNION ALL
SELECT 'Archive Mode', log_mode FROM v$database
UNION ALL
SELECT 'Flashback Status', flashback_on FROM v$database;
```

#### Connection Monitoring
```sql
-- Monitor database connections
SELECT username, count(*) session_count
FROM v$session
WHERE username IS NOT NULL
GROUP BY username
ORDER BY session_count DESC;
```