# Passkey Database Deployment Guide

## Overview

The Passkey Database service uses a comprehensive deployment strategy combining Liquibase for database change management, Jenkins for CI/CD automation, and Git-based feature workflows. This guide covers all aspects of deploying database changes across multiple environments.

## Deployment Architecture

### CI/CD Pipeline Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │───▶│   Jenkins   │───▶│  Liquibase  │───▶│   Target    │
│ Repository  │    │   Pipeline  │    │  Deployment │    │ Environment │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                    │                    │                │
       ▼                    ▼                    ▼                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Feature   │    │   Build     │    │   Change    │    │  Database   │
│   Branch    │    │ Validation  │    │   Scripts   │    │   Update    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Environment Promotion Path

```
Development ──▶ Alpha ──▶ IT50 ──▶ Staging ──▶ UAT ──▶ Production
     │             │        │         │        │         │
     ▼             ▼        ▼         ▼        ▼         ▼
   Dev DB      Alpha DB  IT50 DB   Stg DB   UAT DB    Prod DB
```

## Jenkins Pipeline Configuration

### Pipeline Parameters

The Jenkins pipeline accepts the following parameters:

| Parameter | Values | Description |
|-----------|--------|-------------|
| Environment | alpha, it50, dev | Target deployment environment |
| Type | deploy, rollback | Deployment operation type |
| Feature | GROUP-XXXX | Feature branch identifier |

### Pipeline Stages

#### 1. Parameter Validation
```groovy
stage('Validate Parameters') {
    when {
        expression {
            return (params.Feature as Boolean) && (params.Type as Boolean)
        }
    }
    steps {
        script {
            echo "Environment: ${params.Environment}"
            echo "Type: ${params.Type}"
            echo "Feature: ${params.Feature}"
        }
    }
}
```

#### 2. Database Configuration Resolution
```groovy
def all_db_configs = [
    dev: [
        db_host_txn: '10.64.28.19',
        db_sid_txn: 'GMTXDEV',
        region: 'nonprod',
        branch: 'development'
    ],
    alpha: [
        db_host_txn: 'ap50-pas-txn02.core.cvent.org',
        db_sid_txn: 'PKTXNQAI',
        db_host_bi: 'ap50-pas-bi02.core.cvent.org',
        db_sid_bi: 'PKBIQAI',
        region: 'nonprod',
        branch: 'development'
    ]
    // Additional environments...
];
```

#### 3. File Discovery and Processing
```groovy
stage('Process Database Changes') {
    steps {
        script {
            def files = []
            def mainFiles = []
            
            switch (params.Type) {
                case 'deploy':
                    files = findFiles(glob: "TXN/FEATURES/${params.Feature}/deploy_outage.xml") +
                            findFiles(glob: "BI/FEATURES/${params.Feature}/deploy_outage.xml")
                    mainFiles = findFiles(glob: "TXN/FEATURES/${params.Feature}/deploy.xml") +
                                findFiles(glob: "BI/FEATURES/${params.Feature}/deploy.xml")
                    break
                case 'rollback':
                    files = findFiles(glob: "TXN/FEATURES/${params.Feature}/ROLLBACK/rollback.xml") +
                            findFiles(glob: "BI/FEATURES/${params.Feature}/ROLLBACK/rollback.xml")
                    break
            }
        }
    }
}
```

#### 4. Liquibase Deployment
```groovy
stage('Deploy Changes') {
    steps {
        script {
            def buildJob = build job: 'dba-liquibase-deploy-oracle-github',
                parameters: [
                    string(name: 'TARGET_INSTANCE', value: db_host),
                    string(name: 'TARGET_DATABASE', value: db_sid),
                    string(name: 'BRANCH', value: branch),
                    string(name: 'GITHUB_REPO', value: 'passkey-database'),
                    string(name: 'CHANGE_LOG_FILE', value: changelogFile),
                    string(name: 'LIQUIBASE_ACTION', value: 'update'),
                    string(name: 'REGION', value: db_config.region)
                ]
        }
    }
}
```

## Liquibase Configuration

### Change Log Structure

#### Master Change Log
```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.8.xsd">

    <!-- Include feature-specific changelogs -->
    <include file="TXN/FEATURES/GROUP-1234/deploy.xml"/>
    <include file="BI/FEATURES/GROUP-1234/deploy.xml"/>
    
</databaseChangeLog>
```

#### Feature Change Log Example
```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.8.xsd">

    <changeSet id="GROUP-1234-001" author="developer">
        <comment>Add new hotel status column</comment>
        <sqlFile path="TXN/FEATURES/GROUP-1234/001_add_hotel_status.sql"
                 splitStatements="false"
                 stripComments="false"/>
        <rollback>
            <sqlFile path="TXN/FEATURES/GROUP-1234/ROLLBACK/001_remove_hotel_status.sql"/>
        </rollback>
    </changeSet>

    <changeSet id="GROUP-1234-002" author="developer">
        <comment>Update hotel status values</comment>
        <sqlFile path="TXN/FEATURES/GROUP-1234/002_update_hotel_status.sql"/>
        <rollback>
            <sqlFile path="TXN/FEATURES/GROUP-1234/ROLLBACK/002_revert_hotel_status.sql"/>
        </rollback>
    </changeSet>

</databaseChangeLog>
```

### Liquibase Properties

#### Environment-Specific Properties
```properties
# Alpha Environment
driver=oracle.jdbc.OracleDriver
url=jdbc:oracle:thin:@ap50-pas-txn02.core.cvent.org:1521:PKTXNQAI
username=${DB_USERNAME}
password=${DB_PASSWORD}
changeLogFile=deploy.xml
contexts=alpha
logLevel=INFO
```

## Feature Development Workflow

### 1. Manual Feature Creation

#### Step-by-Step Process
```bash
# 1. Create feature branch
git checkout -b GROUP-1234

# 2. Create feature directory structure
mkdir -p TXN/FEATURES/GROUP-1234
mkdir -p TXN/FEATURES/GROUP-1234/ROLLBACK
mkdir -p BI/FEATURES/GROUP-1234
mkdir -p BI/FEATURES/GROUP-1234/ROLLBACK

# 3. Create SQL files
touch TXN/FEATURES/GROUP-1234/grants.sql
touch TXN/FEATURES/GROUP-1234/ROLLBACK/revokes.sql

# 4. Add grants to grants.sql
echo "GRANT SELECT ON COMMON.NEW_TABLE TO MS_HOTEL_USER;" >> TXN/FEATURES/GROUP-1234/grants.sql

# 5. Add revokes to revokes.sql
echo "REVOKE SELECT ON COMMON.NEW_TABLE FROM MS_HOTEL_USER;" >> TXN/FEATURES/GROUP-1234/ROLLBACK/revokes.sql

# 6. Update role files
echo "GRANT SELECT ON COMMON.NEW_TABLE TO MS_HOTEL_ROLE;" >> TXN/DATABASE/ROLES/MS_HOTEL_ROLE.sql

# 7. Generate deployment scripts
./TOOLS/collect-feature-changes.sh
./TOOLS/generate-feature-script.sh

# 8. Commit and push
git add .
git commit -m "GROUP-1234: Add new hotel management features"
git push origin GROUP-1234
```

### 2. Automated Feature Creation

#### Using the Automation Script
```bash
# Generate complete feature structure
./TOOLS/generate-grants-files.sh GROUP-1234

# This script performs:
# - Creates directory structure
# - Generates grants/revokes files
# - Adds files to git
# - Runs collect-feature-changes.sh
# - Runs generate-feature-script.sh
```

### 3. Feature Validation

#### Pre-deployment Checks
```bash
# Validate SQL syntax
sqlplus -s username/password@database @TXN/FEATURES/GROUP-1234/deploy.sql

# Check for conflicts
./TOOLS/validate-feature.sh GROUP-1234

# Review generated files
cat TXN/FEATURES/GROUP-1234/deploy.xml
cat TXN/FEATURES/GROUP-1234/ROLLBACK/rollback.xml
```

## Deployment Procedures

### Standard Deployment

#### 1. Deploy to Development
```bash
# Jenkins deployment
curl -X POST "https://jenkins.cvent.org/job/passkey-database/buildWithParameters" \
  -d "Environment=dev&Type=deploy&Feature=GROUP-1234"
```

#### 2. Deploy to Alpha
```bash
# After successful dev deployment
curl -X POST "https://jenkins.cvent.org/job/passkey-database/buildWithParameters" \
  -d "Environment=alpha&Type=deploy&Feature=GROUP-1234"
```

#### 3. Deploy to Higher Environments
```bash
# IT50 deployment
curl -X POST "https://jenkins.cvent.org/job/passkey-database/buildWithParameters" \
  -d "Environment=it50&Type=deploy&Feature=GROUP-1234"
```

### Emergency Deployment

#### Hotfix Process
```bash
# 1. Create hotfix branch
git checkout -b HOTFIX-1234

# 2. Create minimal changes
mkdir -p TXN/FEATURES/HOTFIX-1234
echo "-- Emergency fix" > TXN/FEATURES/HOTFIX-1234/hotfix.sql

# 3. Generate deployment files
./TOOLS/collect-feature-changes.sh
./TOOLS/generate-feature-script.sh

# 4. Deploy directly to production (with approval)
# Manual Jenkins trigger with production parameters
```

### Rollback Procedures

#### Automatic Rollback
```bash
# Jenkins rollback deployment
curl -X POST "https://jenkins.cvent.org/job/passkey-database/buildWithParameters" \
  -d "Environment=alpha&Type=rollback&Feature=GROUP-1234"
```

#### Manual Rollback
```sql
-- Connect to target database
sqlplus username/password@target_database

-- Execute rollback scripts
@TXN/FEATURES/GROUP-1234/ROLLBACK/rollback.sql

-- Verify rollback
SELECT * FROM DATABASECHANGELOG 
WHERE ID LIKE 'GROUP-1234%' 
ORDER BY DATEEXECUTED DESC;
```

## Environment-Specific Configurations

### Development Environment

#### Configuration
```yaml
environment: development
database:
  host: 10.64.28.19
  port: 1521
  service: GMTXDEV
deployment:
  auto_approve: true
  validation_level: basic
  backup_required: false
```

#### Deployment Settings
- Automatic approval for changes
- Basic validation only
- No backup requirement
- Fast deployment mode

### Alpha Environment

#### Configuration
```yaml
environment: alpha
database:
  txn:
    host: ap50-pas-txn02.core.cvent.org
    port: 1521
    service: PKTXNQAI
  bi:
    host: ap50-pas-bi02.core.cvent.org
    port: 1521
    service: PKBIQAI
deployment:
  auto_approve: false
  validation_level: standard
  backup_required: true
```

#### Deployment Settings
- Manual approval required
- Standard validation
- Backup before deployment
- Rollback capability required

### Production Environment

#### Configuration
```yaml
environment: production
database:
  txn:
    host: pr50-pas-txn01.core.cvent.org
    port: 1521
    service: PKTXNPRD
  bi:
    host: pr50-pas-bi01.core.cvent.org
    port: 1521
    service: PKBIPRD
deployment:
  auto_approve: false
  validation_level: strict
  backup_required: true
  change_window_required: true
```

#### Deployment Settings
- Multiple approvals required
- Strict validation
- Full backup before deployment
- Change window scheduling
- Rollback plan mandatory

## Monitoring and Validation

### Deployment Monitoring

#### Real-time Monitoring
```sql
-- Monitor active deployments
SELECT 
    id,
    author,
    filename,
    dateexecuted,
    exectype,
    md5sum
FROM DATABASECHANGELOG 
WHERE dateexecuted >= SYSDATE - 1/24  -- Last hour
ORDER BY dateexecuted DESC;
```

#### Deployment Status Check
```bash
#!/bin/bash
# Check deployment status

FEATURE=$1
DATABASE=$2

sqlplus -s username/password@$DATABASE << EOF
SET PAGESIZE 0
SET FEEDBACK OFF
SELECT 'SUCCESS' FROM DATABASECHANGELOG 
WHERE ID LIKE '${FEATURE}%' 
AND EXECTYPE = 'EXECUTED';
EXIT;
EOF
```

### Post-Deployment Validation

#### Automated Validation
```sql
-- Validate schema objects
SELECT object_name, object_type, status
FROM user_objects
WHERE status = 'INVALID'
AND last_ddl_time >= SYSDATE - 1/24;

-- Validate grants
SELECT grantee, privilege, table_name
FROM user_tab_privs
WHERE grantee LIKE 'MS_%_USER'
ORDER BY grantee, table_name;
```

#### Manual Validation Checklist
- [ ] All changesets executed successfully
- [ ] No invalid objects created
- [ ] Grants applied correctly
- [ ] Application connectivity verified
- [ ] Performance impact assessed
- [ ] Rollback plan tested

## Troubleshooting

### Common Deployment Issues

#### 1. Liquibase Lock Issues
```sql
-- Check for locks
SELECT * FROM DATABASECHANGELOGLOCK;

-- Release locks if needed
UPDATE DATABASECHANGELOGLOCK SET LOCKED = 0, LOCKGRANTED = NULL, LOCKEDBY = NULL;
COMMIT;
```

#### 2. Invalid SQL Syntax
```bash
# Validate SQL before deployment
sqlplus -s username/password@database << EOF
SET ECHO ON
SET FEEDBACK ON
@TXN/FEATURES/GROUP-1234/deploy.sql
EXIT;
EOF
```

#### 3. Permission Issues
```sql
-- Check user permissions
SELECT * FROM user_sys_privs WHERE privilege LIKE '%DDL%';
SELECT * FROM user_tab_privs WHERE table_name = 'DATABASECHANGELOG';
```

#### 4. Rollback Failures
```sql
-- Manual rollback steps
-- 1. Identify failed changeset
SELECT * FROM DATABASECHANGELOG WHERE ID = 'GROUP-1234-001';

-- 2. Execute manual rollback
-- (Execute rollback SQL manually)

-- 3. Update changelog
DELETE FROM DATABASECHANGELOG WHERE ID = 'GROUP-1234-001';
COMMIT;
```

### Emergency Procedures

#### Database Recovery
```bash
# 1. Stop application connections
# 2. Restore from backup if needed
rman target / << EOF
RUN {
    RESTORE DATABASE;
    RECOVER DATABASE;
}
EOF

# 3. Restart services
# 4. Validate system functionality
```

#### Communication Plan
1. **Immediate**: Notify development team
2. **15 minutes**: Update stakeholders
3. **30 minutes**: Provide status update
4. **Resolution**: Post-mortem analysis

## Best Practices

### Development Best Practices
- Always create rollback scripts
- Test in development first
- Use descriptive changeset IDs
- Include meaningful comments
- Follow SQL formatting standards

### Deployment Best Practices
- Deploy during maintenance windows
- Monitor system performance
- Validate changes immediately
- Keep rollback plan ready
- Document all changes

### Security Best Practices
- Use encrypted connections
- Rotate deployment credentials
- Audit all database changes
- Restrict production access
- Implement approval workflows