# Flyway + MSSQL Developer Guide

Database migrations with Flyway against SQL Server — local dev setup via Docker Compose, migration authoring, and GitHub Actions CI/CD.

  

---

  

## Table of Contents

1. [How Flyway Works](#1-how-flyway-works)

2. [Project Structure](#2-project-structure)

3. [Local Development](#3-local-development)

4. [Writing Migrations](#4-writing-migrations)

5. [Running Migrations Locally](#5-running-migrations-locally)

6. [Flyway Configuration Reference](#6-flyway-configuration-reference)

7. [GitHub Actions CI/CD](#7-github-actions-cicd)

8. [Common Workflows](#8-common-workflows)

9. [Troubleshooting](#9-troubleshooting)

  

---

  

## 1. How Flyway Works

  

Flyway tracks which SQL scripts have been applied to a database using a metadata table (`flyway_schema_history`) it creates automatically on first run. Each migration is a versioned SQL file. Flyway compares the files in your migrations directory against what's recorded in the history table and runs anything that hasn't been applied yet — in version order.

  

```

V1.0.0__create_schema.sql    → applied ✓  (recorded in flyway_schema_history)

V1.0.1__add_users_table.sql  → applied ✓

V1.0.2__add_audit_log.sql    → pending → Flyway runs this

```

  

Key rules:

- Once a migration is applied and committed, **never edit it** — Flyway checksums every file and will error if a previously-applied migration changes

- Version numbers must be unique and increase monotonically

- Use `R__` prefix for repeatable migrations (views, stored procedures, functions) that re-run whenever their content changes

  

---

## 2. Project Structure

  

```

your-repo/

├── flyway.conf                    # Flyway configuration (uses env var substitution)

├── docker-compose.yml             # Local dev stack: db, db-init, flyway

├── .env                           # Local env vars (gitignored — copy from .env.example)

├── .env.example                   # Template committed to repo

├── src/

│   ├── sql/

│   │   ├── V1.0.0__create_schema.sql

│   │   ├── V1.0.1__add_users_table.sql

│   │   └── ...                    # Add new migrations here

│   └── scripts/

│       └── db-init.sh             # Creates the database if it doesn't exist (see Section 3)

└── .github/

    └── workflows/

        └── database-migration.yml # Runs Flyway migrations against Azure SQL (see Section 7)

```

  

Migration files live in **`src/sql/`** and follow the naming convention `V{major}.{minor}.{patch}__{description}.sql`.

  

---

  

## 3. Local Development

  

Local dev uses Docker Compose directly — no dev container required. Three services coordinate the startup sequence:

  

| Service    | Image                              | Role |

|------------|------------------------------------|------|

| `db`       | `mcr.microsoft.com/mssql/server:2022-latest` | SQL Server instance |

| `db-init`  | `mcr.microsoft.com/mssql-tools`    | Creates the target database if it doesn't exist |

| `flyway`   | `flyway/flyway`                    | Runs Flyway migrations against the database |

  

### Setup

  

1. Copy `.env.example` to `.env` and fill in your values:

  

```bash

SQL_SERVER=mssql_server

SQL_PORT=1433

SQL_DATABASE=YourDatabaseName

SQL_USERNAME=sa

SQL_PASSWORD=YourStrong!Password123

```

  

2. Run the commands listed in [Section 5](#5-running-migrations-locally).

  

> SQL Server's SA password must meet complexity requirements: min 8 chars, mix of uppercase, lowercase, digits, and symbols.

  

### Docker Compose Services

  

**`db`** — SQL Server. The port is mapped from `${SQL_PORT}` on the host to `1433` in the container. Data is persisted in the `mssql_data` volume.

  

**`db-init`** — Runs after the `db` service is healthy. Creates the database defined by `${SQL_DATABASE}` if it doesn't already exist, using the script below.

  

**`flyway`** — Runs `flyway migrate` using:

- `src/sql/` mounted to `/flyway/sql`

- `flyway.conf` mounted to `/flyway/conf/flyway.conf`

- Environment variables loaded from `.env`

  

Flyway depends on `db-init` completing successfully before it runs.

  

### `docker-compose.yml`

  

```yaml

version: "3.8"

  

services:

  db:

    image: mcr.microsoft.com/mssql/server:2022-latest

    container_name: mssql_server

    environment:

      ACCEPT_EULA: "Y"

      MSSQL_SA_PASSWORD: ${SQL_PASSWORD}

    ports:

      - "${SQL_PORT}:1433"

    volumes:

      - mssql_data:/var/opt/mssql

    networks:

      - servicenet

    healthcheck:

      test:

        [

          "CMD-SHELL",

          "bash -c 'echo > /dev/tcp/localhost/1433' >/dev/null 2>/dev/null",

        ]

      interval: 10s

      timeout: 5s

      retries: 10

  

  db-init:

    image: mcr.microsoft.com/mssql-tools

    networks:

      - servicenet

    entrypoint: ["bash", "/scripts/db-init.sh"]

    volumes:

      - ./src/scripts:/scripts

    env_file:

      - .env

    depends_on:

      db:

        condition: service_healthy

    restart: "no"

    deploy:

      restart_policy:

        condition: none

  

  flyway:

    image: flyway/flyway

    container_name: flyway

    command: migrate

    volumes:

      - ./src/sql:/flyway/sql

      - ./flyway.conf:/flyway/conf/flyway.conf

    env_file:

      - .env

    networks:

      - servicenet

    restart: "no"

    depends_on:

      db:

        condition: service_healthy

      db-init:

        condition: service_completed_successfully

  

volumes:

  mssql_data:

  

networks:

  servicenet:

```

  

### `src/scripts/db-init.sh`

  

Run by the `db-init` container. Waits for SQL Server to accept connections, then creates the target database if it doesn't already exist.

  

```bash

#!/bin/bash

set -e

  

# Retry until SQL Server is available

for i in {1..30}; do

  if /opt/mssql-tools/bin/sqlcmd \

    -S "$SQL_SERVER,$SQL_PORT" \

    -U "$SQL_USERNAME" \

    -P "$SQL_PASSWORD" \

    -Q "SELECT 1" -C >/dev/null 2>&1; then

    break

  fi

  echo "Waiting for SQL Server to accept connections..."

  sleep 2

done

  

# Create the database if it doesn't exist

/opt/mssql-tools/bin/sqlcmd \

  -S "$SQL_SERVER,$SQL_PORT" \

  -U "$SQL_USERNAME" \

  -P "$SQL_PASSWORD" \

  -C \

  -Q "

    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '$SQL_DATABASE')

    BEGIN

        CREATE DATABASE [$SQL_DATABASE];

    END

  "

  

echo "Database '$SQL_DATABASE' is ready."

```

  

---

  

## 4. Writing Migrations

  

### Naming Convention

  

```

V{version}__{description}.sql

│            │

│            └─ Double-underscore separator, words separated by underscores

└─ Version: semantic (1.0.0, 1.0.1, 1.1.0, 2.0.0)

  

Examples:

  V1.0.0__create_schema.sql

  V1.0.1__add_users_table.sql

  V1.1.0__add_audit_log.sql

  R__vw_user_summary.sql              ← repeatable: re-runs when content changes

```

  

### SQL Server Migration Patterns

  

**Create a table**

```sql

-- V1.1.0__create_audit_log.sql

CREATE TABLE dbo.AuditLog (

    AuditId     INT             NOT NULL IDENTITY(1,1),

    UserId      INT             NOT NULL,

    Action      NVARCHAR(100)   NOT NULL,

    CreatedOn   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

  

    CONSTRAINT PK_AuditLog PRIMARY KEY CLUSTERED (AuditId)

);

  

CREATE INDEX IX_AuditLog_UserId ON dbo.AuditLog (UserId);

```

  

**Add a column (with a default for existing rows)**

```sql

-- V1.1.1__add_timezone_to_users.sql

ALTER TABLE dbo.Users

    ADD TimeZone NVARCHAR(50) NOT NULL DEFAULT 'UTC';

```

  

**Add a foreign key**

```sql

-- V1.2.0__add_document_fk.sql

ALTER TABLE dbo.Documents

    ADD CONSTRAINT FK_Documents_Users FOREIGN KEY (UserId)

        REFERENCES dbo.Users (UserId)

        ON DELETE CASCADE;

```

  

**Rename a column (SQL Server pattern — no direct RENAME)**

```sql

-- V1.2.1__rename_displayname.sql

EXEC sp_rename 'dbo.Users.DisplayName', 'Username', 'COLUMN';

```

  

**Create or alter a stored procedure (use repeatable migration)**

```sql

-- R__usp_get_user_documents.sql

-- Repeatable migrations re-run whenever this file changes.

CREATE OR ALTER PROCEDURE dbo.usp_GetUserDocuments

    @UserId INT

AS

BEGIN

    SET NOCOUNT ON;

    SELECT d.DocumentId, d.Title, d.CreatedOn

    FROM dbo.Documents d

    WHERE d.UserId = @UserId

    ORDER BY d.CreatedOn DESC;

END;

```

  

**Data migration with transaction**

```sql

-- V1.3.0__backfill_user_status.sql

BEGIN TRANSACTION;

  

    UPDATE dbo.Users

    SET Enabled = 1

    WHERE Enabled IS NULL;

  

    IF EXISTS (SELECT 1 FROM dbo.Users WHERE Enabled IS NULL)

    BEGIN

        ROLLBACK;

        THROW 50001, 'Backfill failed: NULL Enabled values remain', 1;

    END

  

COMMIT;

```

  

**Conditional DDL (idempotent pattern when needed)**

```sql

-- V1.3.1__add_phone_to_users.sql

IF NOT EXISTS (

    SELECT 1 FROM sys.columns

    WHERE object_id = OBJECT_ID('dbo.Users')

    AND name = 'Phone'

)

BEGIN

    ALTER TABLE dbo.Users ADD Phone NVARCHAR(20) NULL;

END;

```

  

### SQL Safety Rules

  

These rules apply to all SQL written in migration files.

  

**Never use `'NULL'` as a string literal — use the SQL `NULL` keyword without quotes.**

```sql

-- ❌ Wrong

INSERT INTO dbo.Users (Phone) VALUES ('NULL');

  

-- ✅ Correct

INSERT INTO dbo.Users (Phone) VALUES (NULL);

```

  

**Convert booleans explicitly to integers (`1` or `0`) for `BIT` fields.**

```sql

-- ❌ Wrong — do not rely on implicit conversion

INSERT INTO dbo.Users (Enabled) VALUES (true);

  

-- ✅ Correct

INSERT INTO dbo.Users (Enabled) VALUES (1);

```

  

**Never interpolate variables directly into SQL strings in application code that calls the database — always use parameterized queries.**

  

This rule applies to any application code (Node.js, C#, etc.) that executes dynamic SQL, not to static migration files themselves:

  

```js

// ❌ Unsafe: vulnerable to SQL injection

const sql = `INSERT INTO Clients (ClientName) VALUES ('${clientName}')`;

  

// ✅ Safe: uses parameters

const sql = `

  INSERT INTO Clients (ClientGuid, ClientName, ContactEmail, ContactName, DisplayName, Config, Enabled)

  OUTPUT INSERTED.ClientId AS clientID,

         INSERTED.ClientGuid AS clientGuid,

         INSERTED.ClientName AS clientName,

         INSERTED.ContactEmail AS contactEmail,

         INSERTED.ContactName AS contactName,

         INSERTED.DisplayName AS displayName,

         INSERTED.Config AS config,

         INSERTED.Enabled AS enabled,

         INSERTED.CreatedOn AS createdOn,

         INSERTED.ModifiedOn AS modifiedOn

  VALUES (@ClientGuid, @ClientName, @ContactEmail, @ContactName, @DisplayName, @Config, @Enabled);

`;

  

// Bind parameters safely (example: mssql)

request.input('ClientGuid', sql.UniqueIdentifier, uuidv4());

request.input('ClientName', sql.VarChar, clientName);

request.input('ContactEmail', sql.VarChar, contactEmail || null);

request.input('ContactName', sql.VarChar, contactName || null);

request.input('DisplayName', sql.VarChar, displayName || null);

request.input('Config', sql.VarChar, config || null);

request.input('Enabled', sql.Bit, enabled ? 1 : 0);

```

  

### What NOT to Do in a Migration

  

**❌ Never edit or delete an already-applied migration file**

  

Flyway checksums every file. If you change a file that has already been applied, every subsequent `flyway migrate` will fail with a checksum mismatch. The only safe fix is to revert the file or run `flyway repair` (local dev only).

  

```sql

-- ❌ Wrong: editing V1.0.0__create_schema.sql after it has been applied

--    breaks all future migrations on every environment that has run it.

  

-- ✅ Correct: create a new migration to make further changes

-- V1.0.1__add_missing_column.sql

ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(20) NULL;

```

  

---

  

**❌ Never leave transactions open — always COMMIT or ROLLBACK explicitly**

  

An unclosed transaction causes Flyway to hang indefinitely waiting for the lock to release.

  

```sql

-- ❌ Wrong: transaction never committed — Flyway hangs

BEGIN TRANSACTION;

    UPDATE dbo.Users SET Enabled = 1 WHERE Enabled IS NULL;

-- missing COMMIT

  

-- ✅ Correct: always close the transaction

BEGIN TRANSACTION;

  

    UPDATE dbo.Users SET Enabled = 1 WHERE Enabled IS NULL;

  

    IF EXISTS (SELECT 1 FROM dbo.Users WHERE Enabled IS NULL)

    BEGIN

        ROLLBACK;

        THROW 50001, 'Backfill failed: NULL Enabled values remain', 1;

    END

  

COMMIT;

```

  

---

  

**❌ Never use `SELECT *` in a migration**

  

Schema changes in a later migration can silently break a migration that relied on `SELECT *` column ordering.

  

```sql

-- ❌ Wrong: column order is fragile and will break if schema changes

INSERT INTO dbo.AuditLog SELECT * FROM dbo.AuditLog_Staging;

  

-- ✅ Correct: name every column explicitly

INSERT INTO dbo.AuditLog (UserId, Action, CreatedOn)

SELECT UserId, Action, CreatedOn

FROM dbo.AuditLog_Staging;

```

  

---

  

**✅ Keep each migration focused on one logical change**

  

One migration = one concern. This makes rollback strategies clearer and failure diagnosis easier.

  

```sql

-- ❌ Wrong: two unrelated changes in one file make partial failures hard to recover

-- V1.1.0__mixed_changes.sql

ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(20) NULL;

CREATE TABLE dbo.AuditLog (...);

  

-- ✅ Correct: split into separate versioned files

-- V1.1.0__add_phone_to_users.sql

ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(20) NULL;

  

-- V1.1.1__create_audit_log.sql

CREATE TABLE dbo.AuditLog (...);

```

  

---

  

**✅ Use `IF NOT EXISTS` / `IF EXISTS` guards when writing additive DDL**

  

Guards make migrations safe to re-run during development and protect against partial-failure replays.

  

```sql

-- ❌ Wrong: fails if the column already exists (e.g. after a partial retry)

ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(20) NULL;

  

-- ✅ Correct: idempotent — safe to run more than once

IF NOT EXISTS (

    SELECT 1 FROM sys.columns

    WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'PhoneNumber'

)

BEGIN

    ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(20) NULL;

END;

```

  

---

  

## 5. Running Migrations Locally

  

### Docker Compose Commands

  

```bash

# Start SQL Server

docker compose --env-file .env up -d db

  

# Initialize the database (creates it if it doesn't exist)

docker compose --env-file .env run --rm db-init

  

# Run pending migrations

docker compose --env-file .env run --rm flyway migrate

  

# Show migration status (applied + pending)

docker compose --env-file .env run --rm flyway info

  

# Validate checksums of applied migrations

docker compose --env-file .env run --rm flyway validate

  

# Repair the schema history table (fix failed migration entry)

docker compose --env-file .env run --rm flyway repair

  

# Full reset: destroy volumes, restart, re-init, re-migrate

docker compose --env-file .env down -v \

  && docker compose --env-file .env up -d db \

  && docker compose --env-file .env run --rm db-init \

  && docker compose --env-file .env run --rm flyway migrate

  

# Stop and remove containers (preserves volume data)

docker compose down

```

  

> Pass any Flyway subcommand (`migrate`, `info`, `validate`, `repair`, `baseline`) to the `flyway` service via `docker compose run --rm flyway <command>`.

  

---

  

## 6. Flyway Configuration Reference

  

### `flyway.conf` (committed to repo)

  

```properties

flyway.url=jdbc:sqlserver://${SQL_SERVER}:${SQL_PORT};databaseName=${SQL_DATABASE};encrypt=true;trustServerCertificate=true

flyway.user=${SQL_USERNAME}

flyway.password=${SQL_PASSWORD}

flyway.locations=filesystem:/flyway/sql

flyway.connectRetries=10

```

  

Environment variable placeholders (`${VAR}`) are resolved at runtime from the `.env` file (loaded via `env_file:` in `docker-compose.yml`) or from the shell environment in CI/CD.

  

> In CI/CD, add a second location if you download the SQL files as an artifact to a separate path:

> ```properties

> flyway.locations=filesystem:/flyway/sql,filesystem:downloaded_sql_artifacts

> ```

  

### `.env` (local — gitignored)

  

```bash

SQL_SERVER=mssql_server

SQL_PORT=1433

SQL_DATABASE=YourDatabaseName

SQL_USERNAME=sa

SQL_PASSWORD=YourStrong!Password123

```

  

### JDBC URL Reference

  

```properties

# Local dev — SQL Server in Docker (trust self-signed cert)

jdbc:sqlserver://mssql_server:1433;databaseName=mydb;encrypt=true;trustServerCertificate=true

  

# Azure SQL — SQL auth

jdbc:sqlserver://yourserver.database.windows.net:1433;database=mydb;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net

  

# Azure SQL — Managed Identity (no password needed)

jdbc:sqlserver://yourserver.database.windows.net:1433;database=mydb;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;Authentication=ActiveDirectoryDefault

  

# Named instance

jdbc:sqlserver://hostname\INSTANCENAME:1433;databaseName=mydb

```

  

---

  

## 7. GitHub Actions CI/CD

  

### Workflow: Database Migration (`.github/workflows/database-migration.yml`)

  

**Trigger:** Manual (`workflow_dispatch`) with environment selection

  

Runs Flyway migrations against an Azure SQL database. Authentication uses **Azure AD Managed Identity** (`Authentication=ActiveDirectoryDefault`) — no password is stored in GitHub.

  

The workflow:

1. Logs in to Azure via OIDC (Workload Identity Federation — no stored secrets)

2. Checks connectivity to the target SQL server

3. Checks out the repository

4. Uploads `src/sql/` as a GitHub Actions artifact (for audit trail)

5. Installs Flyway via `red-gate/setup-flyway@v1`

6. Downloads the artifact to `downloaded_sql_artifacts/` (matches `flyway.locations` in `flyway.conf`)

7. Runs `flyway migrate` with the environment-specific connection URL

  

```yaml

name: Flyway Database Migration

run-name: Migrate Database to ${{ github.event.inputs.environment }} by ${{ github.actor }}

  

on:

  workflow_dispatch:

    inputs:

      environment:

        type: choice

        description: Target environment

        options:

          - dev

          - qa

          - uat

          - prod

        default: dev

        required: true

  

permissions:

  contents: read

  id-token: write

  

jobs:

  migrate:

    runs-on: ubuntu-latest

    environment: ${{ github.event.inputs.environment }}

  

    steps:

      - name: Azure login

        uses: azure/login@v2

        with:

          client-id: ${{ vars.AZURE_CLIENT_ID }}

          tenant-id: ${{ vars.AZURE_TENANT_ID }}

          allow-no-subscriptions: true

  

      - name: Connectivity check

        shell: bash

        run: |

          nslookup ${{ vars.SQL_SERVER }}

          nc -zv ${{ vars.SQL_SERVER }} 1433

  

      - name: Checkout repository

        uses: actions/checkout@v4

  

      - name: Upload SQL artifact

        uses: actions/upload-artifact@v4

        with:

          name: sql-migrations

          path: src/sql/

          retention-days: ${{ vars.RETENTION_DAYS }}

  

      - name: Install Flyway

        uses: red-gate/setup-flyway@v1

  

      - name: Download SQL artifact

        uses: actions/download-artifact@v4

        with:

          name: sql-migrations

          path: downloaded_sql_artifacts/

  

      - name: Run Flyway Migrate

        run: |

          flyway migrate \

            -configFiles=flyway.conf \

            -user="${{ vars.SQL_USER }}" \

            -url="jdbc:sqlserver://${{ vars.SQL_SERVER }}:1433;database=${{ vars.SQL_DATABASE }};encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;Authentication=ActiveDirectoryDefault"

```

  

Required GitHub Environment variables (configured per environment in Settings → Environments):

  

| Variable | Description |

|----------|-------------|

| `AZURE_CLIENT_ID` | App registration / managed identity client ID |

| `AZURE_TENANT_ID` | Azure AD tenant ID |

| `SQL_SERVER` | Azure SQL server hostname (e.g. `myserver.database.windows.net`) |

| `SQL_DATABASE` | Target database name |

| `SQL_USER` | Azure AD user or managed identity for Flyway auth |

| `RETENTION_DAYS` | How many days to keep the SQL artifact |

  

> No `FLYWAY_PASSWORD` is needed — `Authentication=ActiveDirectoryDefault` uses the runner's managed identity or the Azure login from the previous step.

  

#### Using SQL auth instead of Managed Identity

  

If your environment uses SQL authentication, replace the `-url` and `-user` flags with a secret-backed password:

  

```yaml

      - name: Run Flyway Migrate

        env:

          FLYWAY_URL: jdbc:sqlserver://${{ vars.SQL_SERVER }}:1433;database=${{ vars.SQL_DATABASE }};encrypt=true;trustServerCertificate=false

          FLYWAY_USER: ${{ vars.SQL_USER }}

          FLYWAY_PASSWORD: ${{ secrets.SQL_PASSWORD }}

        run: flyway migrate -configFiles=flyway.conf

```

  

Store `SQL_PASSWORD` as an **encrypted secret** (not a variable) in the GitHub Environment.

  

---

  

## 8. Common Workflows

  

### Starting fresh on a new machine

  

```bash

# 1. Clone the repo

git clone https://github.com/your-org/your-repo.git && cd your-repo

  

# 2. Create your local .env

cp .env.example .env

# Edit .env and set SQL_SERVER, SQL_PORT, SQL_DATABASE, SQL_USERNAME, SQL_PASSWORD

  

# 3. Start SQL Server, initialize the database, and run migrations

docker compose --env-file .env up -d db

docker compose --env-file .env run --rm db-init

docker compose --env-file .env run --rm flyway migrate

```

  

### Adding a new migration

  

```bash

# 1. Check the current highest applied version

docker compose --env-file .env run --rm flyway info

  

# 2. Create the next versioned file in src/sql/

touch src/sql/V1.0.2__add_notifications_table.sql

  

# 3. Write your SQL, then apply it

docker compose --env-file .env run --rm flyway migrate

  

# 4. Verify it applied cleanly

docker compose --env-file .env run --rm flyway info

  

# 5. Commit

git add src/sql/V1.0.2__add_notifications_table.sql

git commit -m "Add notifications table (V1.0.2)"

```

  

### Fixing a failed migration

  

When a migration fails partway through, Flyway marks it as `FAILED` in the history table. Fix the underlying issue, then:

  

```bash

# Clean up any partial changes manually if needed, then repair the history table

docker compose --env-file .env run --rm flyway repair

  

# Re-run

docker compose --env-file .env run --rm flyway migrate

```

  

### Resetting local dev database

  

```bash

# Full wipe and re-migrate

docker compose --env-file .env down -v \

  && docker compose --env-file .env up -d db \

  && docker compose --env-file .env run --rm db-init \

  && docker compose --env-file .env run --rm flyway migrate

```

  

---

  

## 9. Troubleshooting

  

### `FlywayException: Found non-empty schema(s) but no schema history table`

  

Flyway found tables in the schema but no `flyway_schema_history` table — the database was set up outside Flyway.

  

```bash

# Mark the existing state as baseline version 0

docker compose --env-file .env run --rm flyway baseline

```

  

### `Validate failed: Migration checksum mismatch`

  

A previously-applied migration file was edited after it ran.

  

```bash

# Local dev only — update the stored checksum to match the current file

docker compose --env-file .env run --rm flyway repair

```

  

> Never repair checksum mismatches on shared or production databases without understanding why the file changed. The correct fix is to revert the file to its original content.

  

### `Connection refused` or `Login failed`

  

```bash

# Check that the db container is running and healthy

docker ps

docker logs mssql_server

  

# Verify the .env values are correct

cat .env

```

  

Common mistakes:

- `SQL_SERVER` must match the container name (`mssql_server`) when running inside Docker Compose

- Password must meet SQL Server complexity requirements: min 8 chars, mix of uppercase, lowercase, digits, and symbols

- `SQL_USERNAME` defaults to `sa` for local dev; Azure SQL uses an AD user or managed identity in CI

  

### `db-init` times out before SQL Server is ready

  

The `db-init.sh` script retries for up to 60 seconds (30 × 2s). If SQL Server takes longer to start:

  

```bash

# Check SQL Server startup logs

docker logs mssql_server

  

# Manually re-run db-init after SQL Server is healthy

docker compose --env-file .env run --rm db-init

```

  

### Migration hangs indefinitely

  

Most commonly caused by an open transaction in a migration file:

  

```sql

-- ❌ This hangs — transaction never committed

BEGIN TRANSACTION;

ALTER TABLE dbo.Users ADD Phone NVARCHAR(20) NULL;

-- missing COMMIT

```

  

Fix the SQL, then run `flyway repair` before re-running.

  

### CI: `flyway` command not found

  

The CI workflow installs Flyway via `red-gate/setup-flyway@v1`. If the step fails, check that the runner has internet access to reach the Flyway download endpoint.

  

### CI: Connectivity check fails

  

The migration workflow checks connectivity before running migrations:

  

```bash

nslookup $SQL_SERVER

nc -zv $SQL_SERVER 1433

```

  

If this fails, check the runner's network/firewall rules and the Azure SQL server firewall — the runner's outbound IP must be in the SQL server allowlist.

  

---

  

*Flyway docs: [flywaydb.org/documentation](https://flywaydb.org/documentation) — SQL Server JDBC driver: [Microsoft JDBC Driver for SQL Server](https://learn.microsoft.com/en-us/sql/connect/jdbc/microsoft-jdbc-driver-for-sql-server)*