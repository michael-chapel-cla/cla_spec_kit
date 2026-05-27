# <App Name> DB — Copilot Instructions

Flyway migration scripts for <App Name> (MSSQL / SQL Server 2022). These migrations are consumed by `web-api-<app-name>` via docker-compose volume mount.

## Migration Files (`migrations/`)

| File | Purpose |
|---|---|
| `V1.0.0__create_schema.sql` | Schema guard — establishes dbo schema |

Add rows to this table as new migrations are created.

## Rules

- **NEVER edit an applied migration** — create a new `V{n}__description.sql` file instead
- Naming: `V{major}.{minor}.{patch}__{description}.sql` (double underscore, uppercase V)
- All tables must include:
  ```sql
  Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_TableName PRIMARY KEY CLUSTERED (Id)
  CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  ModifiedOn DATETIME2 NULL
  ```
- All strings: `NVARCHAR`, all booleans: `BIT` (use 1/0 not true/false), all timestamps: `DATETIME2`
- Use `IF NOT EXISTS` guards for all DDL
- Stored procedures and views → `R__{name}.sql` repeatable migrations
- Data migrations must use `BEGIN TRANSACTION / COMMIT` with verification
- Never `SELECT *` in migrations
- `flyway.conf` must NOT be committed — only `flyway.conf.example`
- TenantId is on every business table — never omit it
