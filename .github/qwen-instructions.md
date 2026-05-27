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
