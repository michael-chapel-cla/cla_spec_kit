# ExpenseFlow DB — Copilot Instructions

Flyway migration scripts for ExpenseFlow (MSSQL / SQL Server 2022). These migrations are consumed by `web-api-expense-flow` via docker-compose volume mount.

## Migration Files (`migrations/`)

| File | Tables Created |
|---|---|
| `V1.0.0__create_schema.sql` | Schema guard |
| `V1.0.1__create_tenants_users.sql` | Tenants, Departments, Users, UserRoles |
| `V1.0.2__create_expense_tables.sql` | ExpensePolicies, ExpenseReports, Receipts, ExpenseLineItems |
| `V1.0.3__create_approvals_notifications.sql` | Approvals, Notifications |

## Database Tables

| Table | Purpose |
|---|---|
| `dbo.Tenants` | Company / organisation records — root of multi-tenant isolation |
| `dbo.Departments` | Org units for spend grouping and manager routing |
| `dbo.Users` | Employee profiles linked to Entra OID |
| `dbo.UserRoles` | Role assignments per user (employee/manager/finance/admin) |
| `dbo.ExpensePolicies` | Per-category spend rules per tenant |
| `dbo.ExpenseReports` | Expense submission containers — one per period per user |
| `dbo.ExpenseLineItems` | Individual expense line items within a report |
| `dbo.Receipts` | Receipt image metadata and Azure Blob storage references |
| `dbo.Approvals` | Approval/rejection actions by managers |
| `dbo.Notifications` | Outbound email event log |

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
