# ExpenseFlow DB

Flyway SQL Server migration scripts for ExpenseFlow. Consumed by `web-api-expense-flow` via docker-compose volume mount (`../db-expense-flow/migrations`).

## Migration files

| File | Description |
|---|---|
| `V1.0.0__create_schema.sql` | Schema guard |
| `V1.0.1__create_tenants_users.sql` | Tenants, Users, UserRoles, Departments |
| `V1.0.2__create_expense_tables.sql` | ExpensePolicies, ExpenseReports, ExpenseLineItems, Receipts |
| `V1.0.3__create_approvals_notifications.sql` | Approvals, Notifications |

## Local development (standalone)

Copy and edit the Flyway config, then run via docker-compose:

```bash
# Option 1: docker-compose (starts SQL Server + db-init + flyway)
DB_PASSWORD=Change_Me_123! DB_DATABASE=ExpenseFlowDb DB_USER=sa docker compose up

# Option 2: Flyway CLI with flyway.conf
cp flyway.conf.example flyway.conf
# edit flyway.conf with your local credentials
flyway migrate
```

## Rules

- **Never edit an applied migration** — create a new versioned file instead
- Naming: `V{major}.{minor}.{patch}__{description}.sql` (double underscore, uppercase V)
- Stored procedures and views → `R__{name}.sql` repeatable migrations
- All tables must include: `Id INT IDENTITY(1,1)` PK, `CreatedOn DATETIME2`, `ModifiedOn DATETIME2`
- Never commit `flyway.conf` — only `flyway.conf.example`
