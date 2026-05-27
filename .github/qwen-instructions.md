# Qwen Instructions — CLA Spec Kit

This file is the authoritative context for **Qwen** (local model) when developing generated applications in `/repos/`. All rules from the organization's standards are embedded here directly — no external file reads required.

**You are building production-grade applications on a fixed stack. Follow every rule below without exception.**

---

## What NOT to Help With

- Do not modify files in `/templates/` — these are master starter templates
- Do not modify files in `/specs/` — these are organizational standards documents
- Do not modify files in `/requirements/` — these are generated requirement specs
- Do not modify files in `/plans/` — these are generated build plans
- Do not modify files in `/ideas/` — these are user inputs

All code lives in `/repos/<app-name>/`. That is where you build.

---

## Fixed Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js 20 + TypeScript |
| Backend framework | Fastify (via `framework-nodejs-fastify`) |
| Config | `framework-nodejs-appconfig` reads from `src/static-config.json` locally |
| Logging | `framework-nodejs-logging` (Pino-based structured JSON) |
| Testing | Vitest + V8 coverage (85% minimum) |
| Linting | ESLint with `framework-eslint-config` |
| Frontend framework | React 18 + TypeScript + Vite |
| UI library | MUI (Material UI) v6 with `lib-seamlesscomponents-react` theme |
| Auth (frontend) | `framework-react-core` — Azure Entra OIDC via MSAL. **Do not reimplement auth.** |
| Routing | React Router v7 with `requireAuth()` loader for protected routes |
| Frontend testing | Vitest + React Testing Library |
| Component docs | Storybook 8 |
| Database | MSSQL (SQL Server) |
| Migrations | Flyway — versioned SQL files in `db/migrations/` |
| Local dev DB | SQL Server in Docker via `docker-compose.yml` |
| Auth (backend) | Azure Entra — JWT bearer token validation |
| Deployment | AKS (Azure Kubernetes Service) via Helm |

---

## Directory Structure

```
repos/<app-name>/
├── backend/
│   ├── src/
│   │   ├── features/             ← ALWAYS organize by business feature
│   │   │   └── <feature>/
│   │   │       └── v1/           ← version subdirectory per feature
│   │   │           ├── <feature>.routes.ts
│   │   │           ├── <feature>.service.ts
│   │   │           ├── <feature>.schema.ts
│   │   │           └── <feature>.types.ts
│   │   └── shared/
│   │       ├── auth/
│   │       │   ├── auth.middleware.ts
│   │       │   └── auth.types.ts
│   │       ├── db/
│   │       │   ├── db.client.ts
│   │       │   └── db.types.ts
│   │       └── errors/
│   │           └── error.handler.ts
│   ├── docs/
│   │   ├── openapi.yaml          ← written BEFORE route code (contract-first)
│   │   └── ops/                  ← incident runbooks, alert response, escalation paths
│   ├── postman/
│   │   └── collections/          ← runnable Postman collection with test scripts
│   └── tests/
│       ├── unit/
│       └── integration/
├── db/                           ← SIBLING to backend/, NOT inside it
│   ├── migrations/               ← Flyway versioned SQL files
│   │   ├── V1.0.0__create_schema.sql
│   │   └── V1.0.1__create_<tables>.sql
│   ├── seeds/
│   ├── flyway.conf.example       ← committed (no credentials)
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── <PageName>/<PageName>.tsx
│   │   ├── components/
│   │   ├── services/
│   │   │   └── <feature>Api.ts   ← ALL API calls go here, never in components
│   │   ├── types/
│   │   │   └── <feature>.types.ts
│   │   └── router.tsx
│   └── public/
│       └── static-config.json    ← Entra clientId + authority (never hardcoded)
└── helm/
    ├── Chart.yaml
    ├── values.yaml
    ├── values-dev.yaml
    ├── values-qa.yaml
    ├── values-uat.yaml
    └── values-prd.yaml
```

---

## API Standards (Non-Negotiable)

### URI Versioning

All routes MUST include the version in the URI path:

```
/api/v1/ResourceName
/api/v1.1/ResourceName
/api/v2/ResourceName
```

❌ `/api/users`, `/users`, `/v/users`
✅ `/api/v1/Users`, `/api/v2/Orders`

### Resource Naming

- **PascalCase plural nouns** — no hyphens, underscores, or verbs
- HTTP methods define the action, not the URL

```
✅ CORRECT
GET    /api/v1/Users              ← list
GET    /api/v1/Users/123          ← get one
POST   /api/v1/Users              ← create
PUT    /api/v1/Users/123          ← replace
PATCH  /api/v1/Users/123          ← partial update
DELETE /api/v1/Users/123          ← delete

❌ WRONG
GET    /api/v1/getUsers
POST   /api/v1/createUser
GET    /api/v1/users              ← lowercase
GET    /api/v1/user-profiles      ← hyphens
GET    /api/v1/order_items        ← underscores
```

### Feature-Based Code Organization

**NEVER** organize by technical layer. **ALWAYS** organize by business feature:

```
✅ CORRECT
src/features/users/v1/users.routes.ts
src/features/users/v1/users.service.ts
src/features/products/v1/products.routes.ts

❌ WRONG
src/controllers/users.controller.ts
src/services/users.service.ts
src/repositories/users.repo.ts
```

### HTTP Status Codes (Required Contracts)

| Situation | Status | Notes |
|---|---|---|
| Successful GET/PUT/PATCH | 200 | |
| Resource created (POST) | 201 | MUST include `Location` header |
| DELETE success | 204 | No response body |
| Validation errors | 422 | |
| Missing/invalid auth | 401 | |
| Authenticated, lacking permission | 403 | |
| Resource not found | 404 | |
| Conflict (duplicate, etc.) | 409 | |
| Rate limit exceeded | 429 | |
| Unexpected server error | 500 | |

❌ Never use generic 400 for all errors — use 401/403/404/409/422 specifically.

```typescript
// ✅ POST creates resource
res.status(201).location(`/api/v1/Users/${user.id}`).json(user);

// ✅ DELETE
res.status(204).send();

// ✅ Validation error
res.status(422).json({
  error: 'VALIDATION_ERROR',
  message: 'Request validation failed',
  details: [{ field: 'email', message: 'Invalid email format' }],
  timestamp: new Date().toISOString(),
  requestId: req.id,
});
```

### Standard Error Format

All error responses MUST follow this exact structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "timestamp": "2026-03-27T12:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Health Endpoints (Required, Unprotected)

Every API MUST expose:
- `GET /health` — liveness check
- `GET /health/ready` — readiness check (DB connectivity)

```json
{ "status": "HEALTHY", "timestamp": "2026-04-16T12:00:00Z", "checks": { "database": "UP" } }
```

### Contract-First Development

1. Write `docs/openapi.yaml` **before** writing any route code
2. Each endpoint MUST include: summary, description, security scopes, parameters with constraints, request/response schemas, ALL expected status codes, examples
3. OpenAPI version MUST be 3.0.3+

### Postman Collections

- Create `postman/collections/<app-name>.json` covering all endpoints
- Include test scripts validating status codes, response schemas, and `Location` headers
- Include both happy-path and error examples

### JSON Conventions

- Property names: **camelCase** (`userId`, not `user_id` or `UserId`)
- Dates: **ISO 8601 with timezone** (`2026-03-27T12:00:00Z`)
- Omit optional fields when absent — never return `null` for optional properties

### SOLID Principles

- **One endpoint = one purpose** — no multi-action endpoints
- **Add new features via new major version** (`v2`) — never break `v1` clients
- Breaking changes (removing a field, changing type, renaming resource) ALWAYS require a new major version
- Non-breaking changes (adding optional fields/params, new endpoints) are allowed in same major version

---

## Security Rules (Non-Negotiable)

### S03 — No Hardcoded Secrets

**NEVER** hardcode API keys, passwords, tokens, client IDs, or any credential:

```typescript
❌ NEVER
const apiKey = 'sk_liv...z789';
const dbPassword = '123456';
const jwtSecret = 'my-secret-key';

✅ ALWAYS
const apiKey = process.env['API_KEY']!;
const dbPassword = process.env['DB_PASSWORD']!;
```

Also scan Helm values files and CI workflow env blocks — secrets frequently leak there:
```yaml
# ✅ Helm values — placeholder only, injected at deploy time
env:
  ENTRA_CLIENT_ID: ""
  API_KEY: ""
```

### S04 — No SQL Injection (Parameterized Queries Only)

**NEVER** interpolate variables into SQL strings:

```typescript
❌ NEVER
const user = await db.query(`SELECT * FROM Users WHERE Id = '${userId}'`);
const result = await db.execute("UPDATE Users SET Name = '" + name + "'");

✅ ALWAYS
const user = await db.query('SELECT * FROM Users WHERE Id = @id', { id: userId });
const result = await db.execute('UPDATE Users SET Name = @name WHERE Id = @id', { name, id });

// mssql parameterized pattern
request.input('UserId', sql.Int, userId);
const result = await request.query('SELECT * FROM Users WHERE Id = @UserId');
```

### S07 / S13 — JWT Validation (All Claims Required)

**NEVER** call `jwt.verify()` without explicit algorithm, issuer, and audience:

```typescript
❌ NEVER
const payload = jwt.verify(token, process.env.JWT_SECRET!);      // no alg
const payload = jwt.verify(token, publicKey, {});                  // empty options
const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }); // missing iss/aud

✅ ALWAYS
const payload = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],                           // explicit — prevents alg:none attacks
  issuer: process.env['ENTRA_ISSUER']!,           // must match Entra token endpoint
  audience: process.env['ENTRA_AUDIENCE']!,       // must match this app's client ID
});
// Also validate: exp, nbf, required scopes
```

Validate ALL of: `iss`, `aud`, `exp`, `nbf`, required scopes, cryptographic signature with explicit algorithm.

### S12 — No Stack Traces in API Responses

**NEVER** expose `err.stack`, file paths, or library internals in responses:

```typescript
❌ NEVER
app.setErrorHandler((err, req, reply) => {
  reply.send({ error: err.message, stack: err.stack });
});

✅ ALWAYS
app.setErrorHandler((err, req, reply) => {
  req.log.error({ err, requestId: req.id }, 'Request failed');
  const statusCode = err.statusCode ?? 500;
  reply.status(statusCode).send({
    error: statusCode >= 500 ? 'INTERNAL_ERROR' : (err.code ?? 'REQUEST_ERROR'),
    message: statusCode >= 500 ? 'An unexpected error occurred.' : err.message,
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
});
```

### S15 — No Wildcard CORS

**NEVER** allow all origins in production:

```typescript
❌ NEVER
app.register(cors, { origin: '*' });
framework.enableCORS({ origins: ['*'] });

✅ ALWAYS
const ALLOWED_ORIGINS = process.env['CORS_ORIGINS']!.split(',');
app.register(cors, {
  origin: ALLOWED_ORIGINS,
  credentials: true,
});
```

### S16 — Rate Limiting Required

Every Fastify server MUST register `@fastify/rate-limit`:

```typescript
import rateLimit from '@fastify/rate-limit';

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
});
```

### S18 — Security Headers Required

Every Fastify server MUST register `@fastify/helmet`:

```typescript
import helmet from '@fastify/helmet';

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
});
```

Required headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`.

### S19 — No Sensitive Data in Logs

**NEVER** log passwords, tokens, API keys, Authorization headers, or full request bodies:

```typescript
❌ NEVER
logger.info({ user: req.body.user, password: req.body.password });
logger.debug({ headers: req.headers }); // contains Authorization header
console.log(req.body);

✅ ALWAYS
logger.info({ userId: user.id, email: user.email });
// Use Pino redaction for automatic scrubbing:
const logger = pino({
  redact: ['password', 'token', 'apiKey', 'authorization', '*.password', '*.token'],
});
```

### S10 — No XSS via innerHTML (Frontend)

```tsx
❌ NEVER
<div dangerouslySetInnerHTML={{ __html: userContent }} />
element.innerHTML = apiResponse.htmlContent;

✅ ALWAYS
<div>{userContent}</div>  // React escapes automatically

// If HTML is required, sanitize first:
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### S08 — Use Cryptographically Secure Random

```typescript
❌ NEVER
const token = Math.random().toString(36).slice(2);
const sessionId = Date.now() + Math.random();

✅ ALWAYS
import { randomBytes, randomInt } from 'node:crypto';
const token = randomBytes(32).toString('hex');
const sessionId = randomBytes(16).toString('base64url');
```

### S22 — Never Disable TLS Verification

```typescript
❌ NEVER
new https.Agent({ rejectUnauthorized: false })
const db = new Client({ ssl: false });

✅ ALWAYS
// Default TLS — no agent override needed
const response = await fetch(url);
const db = new Client({ ssl: { rejectUnauthorized: true } });
```

---

## Code Quality Rules

### Q01 — No TypeScript `any`

`any` disables type checking. Use `unknown` + Zod to narrow:

```typescript
❌ NEVER
function process(data: any): any { ... }
const result: any = await fetchUser(id);

✅ ALWAYS
function process(data: unknown): ProcessedResult {
  const validated = DataSchema.parse(data);  // narrow with Zod
  return transform(validated);
}

// Validate API responses with Zod:
const ApiResponse = z.object({ users: z.array(UserSchema), total: z.number() });
const result = ApiResponse.parse(await fetchUser(id));
```

### Q03 — No console.log

**NEVER** use `console.log` in production code. Use the Fastify logger:

```typescript
❌ NEVER
console.log('User logged in:', userId);
console.log(req.body);

✅ ALWAYS
fastify.log.info({ userId, action: 'login' }, 'User logged in');
fastify.log.debug({ path: req.url }, 'Request received');
```

### Q05 — async/await Only (No .then() Chains)

```typescript
❌ AVOID
fetchUser(id)
  .then(user => processUser(user))
  .then(result => saveResult(result))
  .catch(err => handleError(err));

✅ PREFER
try {
  const user = await fetchUser(id);
  const result = await processUser(user);
  await saveResult(result);
} catch (err) {
  handleError(err);
}
```

### Q02 — Test Coverage Thresholds

Required minimums: **Lines ≥ 85% | Branches ≥ 80% | Functions ≥ 85%**

Every component, service, and utility must test:
- Happy path with valid inputs
- Validation errors / rejected inputs
- Not-found / empty state
- Authentication / authorization enforcement
- Async error handling (rejected promises, network errors)
- Edge cases: empty arrays, null values, maximum values

### Q11 — Service Layer Required (No Direct API Calls in Components)

API calls MUST go in `src/services/<feature>Api.ts`, never in components:

```typescript
❌ NEVER — in a React component
useEffect(() => {
  fetch('/api/v1/Users').then(r => r.json()).then(setUsers);
}, []);

✅ ALWAYS — in src/services/usersApi.ts
export const usersApi = {
  async getUsers(): Promise<User[]> {
    const { data } = await axios.get('/api/v1/Users');
    return UserArraySchema.parse(data);
  }
};

// In the component, use a hook that calls the service
const users = useUsers();
```

### Q12 — useEffect Dependency Arrays

```typescript
❌ NEVER
useEffect(() => {
  fetchUser(userId); // userId used but not in deps — stale closure
}, []);

useEffect(() => {
  setCount(count + 1); // infinite loop
}, [count]);

✅ ALWAYS
useEffect(() => {
  fetchUser(userId);
}, [userId]);

const options = useMemo(() => ({ page, limit }), [page, limit]);
useEffect(() => { fetchData(options); }, [options]);
```

### Q13 — Clean Up Timers and Subscriptions

```typescript
❌ NEVER
useEffect(() => {
  const interval = setInterval(pollStatus, 5000); // never cleared
}, []);

✅ ALWAYS
useEffect(() => {
  const interval = setInterval(pollStatus, 5000);
  return () => clearInterval(interval); // cleanup on unmount
}, []);
```

### Q07 — React List Keys

```tsx
❌ NEVER
{items.map((item, index) => <ListItem key={index} />)}

✅ ALWAYS
{items.map((item) => <ListItem key={item.id} />)}
```

### General Code Style

```typescript
// ✅ Use const for immutable variables
const fastify = require('fastify')();

// ✅ Use strict equality
if (user.id === '10') { ... }

// ✅ Use arrow functions
fastify.get('/user', (req, res) => { ... });

// ✅ Early returns over deep nesting
if (!req.body) return res.status(400).send({ error: 'Missing body' });
if (!req.body.email) return res.status(400).send({ error: 'Email required' });

// ✅ Named middleware for better stack traces
async function attachUser(req, res) { ... }
fastify.addHook('preHandler', attachUser);

// ✅ Throw Error objects, not strings
throw new Error('Something went wrong');  // not: throw 'Something went wrong'

// ✅ Always return a response
fastify.get('/user', (req, res) => {
  if (!req.query.id) {
    return res.status(400).send({ error: 'ID is required' });
  }
  return res.send({ user: 'John Doe' });
});

// ✅ DB connection pool — close in finally
const db = await getDatabaseConnection();
try {
  const data = await db.query('SELECT ...');
  res.send(data);
} finally {
  db.close();
}

// ✅ Parallel async operations
const [users, orders] = await Promise.all([fetchUsers(), fetchOrders()]);
```

---

## Database Rules (Flyway + MSSQL)

### DB Location

The database lives at `/repos/<app-name>/db/` — a **sibling** to `backend/`, **NOT inside it**.

### Table Schema Standards

Every table MUST include these columns:

```sql
Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_TableName PRIMARY KEY CLUSTERED (Id),
CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
ModifiedOn DATETIME2 NULL
```

SQL type rules:
- Strings: `NVARCHAR` (never `VARCHAR`)
- Booleans: `BIT` (use `1`/`0`, never `true`/`false`)
- Timestamps: `DATETIME2` (never `DATETIME`)
- Identity PKs: `INT NOT NULL IDENTITY(1,1)`

### Migration File Naming

```
V{major}.{minor}.{patch}__{description}.sql   ← versioned, runs once
R__{name}.sql                                  ← repeatable, re-runs on content change (views, procs)

✅ Valid examples
V1.0.0__create_schema.sql
V1.0.1__create_users_table.sql
V1.1.0__add_audit_log.sql
R__vw_user_summary.sql
R__usp_get_user_documents.sql

❌ Invalid
V1_initial_schema.sql      ← single underscore
v1__initial_schema.sql     ← lowercase v
1__create_users.sql        ← missing V prefix
V1__Create Users.sql       ← spaces in name
```

### Migration Rules

**D03 — Never Edit an Applied Migration** (CRITICAL)

Once a migration is applied and committed, **never change it**. Flyway checksums every file and will error on all environments if a previously-applied file changes.

```sql
❌ Editing V1.0.0__create_schema.sql after it was applied
✅ Create V1.0.1__fix_column_default.sql to correct the error
```

**D04 — Always Parameterize Application SQL** (CRITICAL)

```typescript
❌ NEVER
const sql = `SELECT * FROM Users WHERE Id = '${userId}'`;

✅ ALWAYS
request.input('UserId', sql.Int, userId);
const result = await request.query('SELECT * FROM Users WHERE Id = @UserId');
```

**D05 — Never SELECT \***

```sql
❌ NEVER
SELECT * FROM dbo.Users;

✅ ALWAYS
SELECT Id, Email, DisplayName, CreatedOn FROM dbo.Users;
```

**D06 — Data Migrations Need Transactions with Verification**

```sql
BEGIN TRANSACTION;

  UPDATE dbo.Users
  SET Status = 'active'
  WHERE Status IS NULL;

  -- Verify before committing
  IF EXISTS (SELECT 1 FROM dbo.Users WHERE Status IS NULL)
  BEGIN
    ROLLBACK;
    THROW 50001, 'Backfill failed: NULL Status values remain', 1;
  END

COMMIT;
```

**D07 — DROP/TRUNCATE Requires Existence Check**

```sql
-- ✅ Always check existence before dropping
IF OBJECT_ID('dbo.LegacyTable', 'U') IS NOT NULL
  DROP TABLE dbo.LegacyTable;
```

**D08 — Every BEGIN TRANSACTION Must Have COMMIT or ROLLBACK**

An unclosed transaction causes Flyway to hang indefinitely.

**D09 — flyway.conf Must Not Be Committed**

`flyway.conf` must be in `.gitignore`. Only `flyway.conf.example` (with placeholder values) is committed.

**D11 — Use Repeatable Migrations for Stored Procedures and Views**

```sql
❌ NEVER — stored proc in versioned migration
-- V12__update_get_orders_proc.sql
CREATE PROCEDURE dbo.usp_GetOrders ...

✅ ALWAYS — stored proc in repeatable migration
-- R__usp_get_orders.sql
CREATE OR ALTER PROCEDURE dbo.usp_GetOrders
  @UserId INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT d.Id, d.Title, d.CreatedOn
  FROM dbo.Documents d
  WHERE d.UserId = @UserId
  ORDER BY d.CreatedOn DESC;
END;
```

**D12 — Use IF NOT EXISTS Guards for Additive DDL**

```sql
-- ✅ Idempotent — safe to run more than once
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'Phone'
)
BEGIN
  ALTER TABLE dbo.Users ADD Phone NVARCHAR(20) NULL;
END;
```

### Local DB Workflow

```bash
# Start SQL Server
docker compose --env-file backend/.env up -d db

# Create database
docker compose --env-file backend/.env run --rm db-init

# Run pending migrations
docker compose --env-file backend/.env run --rm flyway migrate

# Check migration status
docker compose --env-file backend/.env run --rm flyway info

# Full reset (local dev only)
docker compose --env-file backend/.env down -v \
  && docker compose --env-file backend/.env up -d db \
  && docker compose --env-file backend/.env run --rm db-init \
  && docker compose --env-file backend/.env run --rm flyway migrate
```

---

## Authentication

### Frontend (SPA)

Authentication is handled entirely by `framework-react-core` via MSAL. **Do not reimplement auth.**

- Protected routes: use `loader: requireAuth()` from `framework-react-core`
- Entra `clientId` and `authority` come from `public/static-config.json` — **never hardcode them**
- The framework handles token acquisition, refresh, and login redirects

```typescript
// router.tsx
import { requireAuth } from 'framework-react-core';

const router = createBrowserRouter([
  {
    path: '/dashboard',
    loader: requireAuth(),
    element: <Dashboard />,
  },
]);
```

### Backend (API)

Validate JWT Bearer tokens on every protected route. Required validations:

```typescript
// auth.middleware.ts
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';

async function authenticate(req, reply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing token' });
  }

  const token = authHeader.slice(7);
  const JWKS = createRemoteJWKSet(new URL(`${process.env['ENTRA_ISSUER']}/discovery/v2.0/keys`));

  const { payload } = await jwtVerify(token, JWKS, {
    algorithms: ['RS256'],           // ✅ explicit algorithm
    issuer: process.env['ENTRA_ISSUER']!,     // ✅ validate issuer
    audience: process.env['ENTRA_AUDIENCE']!, // ✅ validate audience
  });

  // Also check: exp (done by jose), required scopes
  req.user = payload;
}
```

Required environment variables:
```
ENTRA_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0
ENTRA_AUDIENCE=<client-id>
```

---

## Logging

Use the Fastify logger (`framework-nodejs-logging`, Pino-based). Every log entry MUST include:

```json
{
  "timestamp": "2026-03-27T12:00:00.123Z",
  "level": "INFO",
  "message": "...",
  "requestId": "uuid",
  "method": "GET",
  "path": "/api/v1/Users",
  "statusCode": 200,
  "latencyMs": 45,
  "service": "app-name",
  "environment": "production"
}
```

**NEVER log**: passwords, tokens, API keys, Authorization headers, full credit card numbers, SSNs, or full request bodies.

Use redaction:
```typescript
const logger = pino({
  redact: ['password', 'token', 'apiKey', 'authorization', '*.password'],
});
```

Mask IPs: last octet only (`192.168.1.xxx`).

---

## Frontend Architecture

### Service Layer (Required)

All API calls go in `src/services/<feature>Api.ts`. Components call custom hooks that call services:

```typescript
// src/services/usersApi.ts
import axios from 'axios';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  displayName: z.string(),
});

export const usersApi = {
  async getUsers(): Promise<User[]> {
    const { data } = await axios.get('/api/v1/Users');
    return z.array(UserSchema).parse(data);
  },

  async createUser(input: CreateUserInput): Promise<User> {
    const { data } = await axios.post('/api/v1/Users', input);
    return UserSchema.parse(data);
  },
};
```

### Protected Routes

```typescript
// router.tsx
import { requireAuth } from 'framework-react-core';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },                          // public
  { path: '/dashboard', loader: requireAuth(), element: <Dashboard /> }, // protected
]);
```

### Auth Config

`public/static-config.json` must contain these keys. Source code must never contain `clientId`, `authority`, or scope URI strings as literals.

```json
{
  "FRAMEWORK_UI_NAME": "My App",
  "clientId": "",
  "authority": "https://login.microsoftonline.com/<tenant-id>",
  "scopes": ["api://my-app/Read", "api://my-app/Write"]
}
```

### TypeScript Rules (Frontend)

```typescript
// ✅ Explicit return types on all exported functions and hooks
export function useUsers(): User[] { ... }
export async function fetchReport(id: number): Promise<Report> { ... }

// ❌ No TypeScript any — use unknown + Zod to narrow
const data: any = await fetchUser(id);   // ❌
const data = UserSchema.parse(await fetchUser(id));  // ✅

// ✅ Default exports for page components; named exports for everything else
export default function Dashboard() { ... }   // page — default
export function StatusChip(...) { ... }       // component — named
```

### MUI Components

Use MUI v6 with `lib-seamlesscomponents-react` theme for all UI:

```tsx
import { Button, TextField, Box, Typography, DataGrid } from '@mui/material';

export function UserList() {
  const users = useUsers();
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Users</Typography>
      <DataGrid rows={users} columns={columns} />
    </Box>
  );
}
```

---

## Helm Configuration

Each app has its own Helm chart at `/repos/<app-name>/helm/`. Key files:

- `Chart.yaml` — chart name and description
- `values.yaml` — base config (app name, image repo, Istio path prefix, service account)
- `values-dev.yaml` — dev hostname, Azure Workload Identity client ID placeholder
- `values-qa.yaml`, `values-uat.yaml`, `values-prd.yaml` — environment hostnames

Secrets are **never** in Helm values files — they are injected at deploy time from Key Vault or CI secrets:

```yaml
# ✅ values-dev.yaml
env:
  ENTRA_CLIENT_ID: ""         # injected at deploy time
  ENTRA_AUDIENCE: ""          # injected at deploy time
  DB_PASSWORD: ""             # injected at deploy time
```

---

## Environment Variables (Required for Every Backend)

| Variable | Description | Example |
|---|---|---|
| `DB_SERVER` | MSSQL server hostname | `mssql_server` |
| `DB_DATABASE` | Database name | `AppDb` |
| `DB_USER` | DB username | `sa` |
| `DB_PASSWORD` | DB password | — |
| `DB_PORT` | DB port | `1433` |
| `ENTRA_ISSUER` | JWT issuer | `https://login.microsoftonline.com/<tenant>/v2.0` |
| `ENTRA_AUDIENCE` | JWT audience | `<client-id>` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |

Always validate required env vars at startup:

```typescript
const required = ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'DB_PORT', 'ENTRA_ISSUER', 'ENTRA_AUDIENCE', 'CORS_ORIGINS'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}
```

---

## Framework Usage Rules

### W01–W06 — Backend App Startup Sequence

The correct startup sequence is fixed. Do not deviate.

```typescript
// app.ts
import 'framework-nodejs-appconfig';
import FrameworkFastify from 'framework-nodejs-fastify';

const framework = await FrameworkFastify.create();                  // W01

await framework.initAppConfig({
  useEnvironmentVariables: true,                                     // W02, W03
  fileConfigPath: './src/static-config.json',
});

const app = framework.app;

await app.register(helmet, { ... });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
await app.register(cors, { origin: corsOrigins, credentials: true });
await app.register(myFeatureRoutes, { prefix: '/api/v1', db });     // W04

await framework.start();                                             // W06 — always last
```

❌ Never create Fastify directly (`const app = fastify()`) — always use `FrameworkFastify.create()`.  
❌ Never call `framework.start()` before all plugins are registered.

### W04/W05 — Route Plugin Signature

Every route file must export an `async function` accepting `FastifyInstance` and `FastifyPluginOptions & { db: DbClient }`. The `db` client is passed via options — never import it as a module-level singleton inside route files.

```typescript
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { DbClient } from '../../../shared/db/db.client.js';

export async function myFeatureRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },   // W05
) {
  const service = new MyFeatureService(options.db);
  app.get('/MyFeature', { preHandler: authMiddleware }, async (req, reply) => {
    return reply.send(await service.list(req.user.tenantId));
  });
}
```

### W07 — `requireScope` vs `authMiddleware`

Use `authMiddleware` for routes accessible to any authenticated user. Use `requireScope(...roles)` for role-gated routes. Never stack both on the same route.

```typescript
// ✅ Any authenticated user
app.get('/ExpenseReports', { preHandler: authMiddleware }, ...);

// ✅ Finance or admin only
app.get('/Reports/Spend', { preHandler: requireScope('finance', 'admin') }, ...);

// ❌ W07 — admin-only route using bare authMiddleware (no role check)
app.delete('/Policies/:id', { preHandler: authMiddleware }, ...);
```

### DB Client — Singleton + Constructor Injection

Create the pool once in `app.ts`, pass it to route plugins via `options.db`, inject into service constructors.

```typescript
// app.ts
const db = await createDbClient();
await app.register(myFeatureRoutes, { prefix: '/api/v1', db });

// myFeature.service.ts
export class MyFeatureService {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: number) {
    const result = await this.db.executeQuery((req) =>
      req.input('tenantId', sql.Int, tenantId)
         .query('SELECT Id, Name FROM dbo.MyTable WHERE TenantId = @tenantId'),
    );
    return result.recordset;
  }
}
```

### W08/W09 — Frontend Route Protection

`framework-react-core` handles all MSAL token acquisition, refresh, and login redirects. Do not reimplement this logic.

```typescript
import { requireAuth } from 'framework-react-core/routes';
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  { path: '/dashboard',       loader: requireAuth(), element: <Dashboard /> },   // ✅
  { path: '/admin/policies',  loader: requireAuth(), element: <Policies /> },    // ✅
  { path: '/auth/callback',   element: <AuthCallback /> },                       // public — no loader
]);
```

❌ Never check `sessionStorage.getItem('msal.idtoken')` or navigate to `/login` manually.

### W10/W11 — Theme Provider

`RouterProvider` must be wrapped in `ThemeProvider` using `claTheme` or `claDarkTheme` from `lib-seamlesscomponents-react`. Never call MUI's `createTheme()` directly.

```tsx
import { ThemeProvider } from '@mui/material/styles';
import { claTheme } from 'lib-seamlesscomponents-react';   // W11
import { RouterProvider } from 'react-router-dom';

export function App() {
  return (
    <ThemeProvider theme={claTheme}>   // W10 — RouterProvider inside ThemeProvider
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
```

### W12 — ESLint Config

All repos must extend `framework-eslint-config`. Do not replace it with a custom config.

```typescript
// eslint.config.mts (backend)
import frameworkConfig from 'framework-eslint-config';
export default [...frameworkConfig];

// eslint.config.js (frontend)
import frameworkConfig from 'framework-eslint-config';
export default [...frameworkConfig, { /* app-specific additions only */ }];
```

---

## Self-Audit Checklist

Before considering any feature complete, verify:

**API**
- [ ] `docs/openapi.yaml` exists and was written before route code
- [ ] All routes use `/api/v{n}/ResourceName` (PascalCase, plural, versioned)
- [ ] No verbs in URLs
- [ ] POST returns 201 + Location header
- [ ] DELETE returns 204, no body
- [ ] Validation errors return 422
- [ ] Standard error format: `{ error, message, details, timestamp, requestId }`
- [ ] No stack traces in error responses
- [ ] All routes protected except `/health` and `/health/ready`
- [ ] Postman collection exists with test scripts

**Security**
- [ ] No hardcoded secrets anywhere (source, Helm values, CI files)
- [ ] All SQL uses parameterized queries — zero string interpolation
- [ ] JWT validation has explicit `algorithms: ['RS256']`, `issuer`, `audience`
- [ ] CORS uses explicit origin list from env — no `*`
- [ ] `@fastify/rate-limit` registered
- [ ] `@fastify/helmet` registered
- [ ] No sensitive data in logs

**Code Quality**
- [ ] No TypeScript `any` — use `unknown` + Zod
- [ ] No `console.log` — use Fastify logger
- [ ] Async/await only — no `.then()` chains
- [ ] API calls in `src/services/` not in components
- [ ] Test coverage: Lines ≥ 85%, Branches ≥ 80%, Functions ≥ 85%

**Database**
- [ ] DB at `/repos/<app-name>/db/` (not inside `backend/`)
- [ ] Migration names: `V{n.n.n}__{desc}.sql` (double underscore)
- [ ] Every table has `Id INT IDENTITY(1,1)`, `CreatedOn DATETIME2`, `ModifiedOn DATETIME2`
- [ ] No `SELECT *` in migrations
- [ ] Data migrations wrapped in transactions with COMMIT + verification
- [ ] Stored procedures in `R__` repeatable migrations with `CREATE OR ALTER`
- [ ] `flyway.conf` in `.gitignore`, only `flyway.conf.example` committed

**Frontend**
- [ ] All API calls in `src/services/<feature>Api.ts` — none in components
- [ ] All protected routes have `loader: requireAuth()` — only `/auth/callback` is public
- [ ] No manual auth logic (`sessionStorage`, `Navigate to="/login"`) in components
- [ ] `App.tsx`: `RouterProvider` inside `ThemeProvider` with `claTheme` from `lib-seamlesscomponents-react`
- [ ] `public/static-config.json` has `FRAMEWORK_UI_NAME`, `clientId`, `authority`, `scopes`
- [ ] No `clientId`, `authority`, or scope URI strings hardcoded in `.ts`/`.tsx` files
- [ ] All exported functions and hooks have explicit return types
- [ ] Default exports on page components only; named exports everywhere else

**Framework Compliance**
- [ ] `app.ts` startup order: `FrameworkFastify.create()` → `initAppConfig({ useEnvironmentVariables: true })` → register plugins → `framework.start()`
- [ ] All route plugins registered with `prefix: '/api/v1'`
- [ ] All route plugin signatures: `FastifyInstance, FastifyPluginOptions & { db: DbClient }`
- [ ] Role-gated routes use `requireScope(...)` — not bare `authMiddleware`
- [ ] `createDbClient()` called once in `app.ts`, passed via `options.db`
- [ ] Service constructors receive `DbClient` via injection — no global db singleton in route files
- [ ] `eslint.config.*` extends `framework-eslint-config` in all three repos

**Infrastructure**
- [ ] No secrets in Helm values files — empty strings with comments
- [ ] `GET /health` and `GET /health/ready` respond without auth
- [ ] `public/static-config.json` has `clientId` and `authority` (empty for templates)
