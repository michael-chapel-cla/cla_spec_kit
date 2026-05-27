# <App Name> DB

Flyway migration scripts for the `<app-name>` application. This repo is a sibling of `web-api-<app-name>` — the API's `docker-compose.yml` mounts `../db-<app-name>/migrations` to run migrations on startup.

## Prerequisites

- Docker Desktop

## Local Setup

1. Copy `flyway.conf.example` to `flyway.conf` and set a local password (never commit `flyway.conf`).
2. Create a `.env` file:
   ```
   DB_PASSWORD=Change_Me_123!
   DB_DATABASE=<AppName>Db
   DB_USER=sa
   ```
3. Start the stack from the **API repo** (`web-api-<app-name>`):
   ```bash
   docker-compose up
   ```
   The API's docker-compose mounts `../db-<app-name>/migrations` — both repos must be sibling directories.

Alternatively, run just the DB stack from this repo:
```bash
docker-compose up
```

## Adding Migrations

1. Create `migrations/V{major}.{minor}.{patch}__{description}.sql`
2. Use `IF NOT EXISTS` guards for all DDL
3. Never edit an applied migration — always add a new file

## Migration Naming

```
V1.0.1__create_tenants_users.sql
V1.0.2__create_core_tables.sql
V2.0.0__add_feature_tables.sql
R__refresh_reporting_view.sql   ← repeatable (views, procedures)
```

## Table Conventions

Every table must include:
```sql
Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_TableName PRIMARY KEY CLUSTERED (Id)
TenantId   INT NOT NULL
CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
ModifiedOn DATETIME2 NULL
```

- Strings: `NVARCHAR`
- Booleans: `BIT` (1/0)
- Timestamps: `DATETIME2`
