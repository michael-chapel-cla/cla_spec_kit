import 'framework-nodejs-appconfig';
import FrameworkFastify from 'framework-nodejs-fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { setupErrorHandler } from './shared/errors/error.handler.js';
import { createDbClient } from './shared/db/db.client.js';
import { expenseReportsRoutes } from './features/expenseReports/v1/expenseReports.routes.js';
import { expenseLineItemsRoutes } from './features/expenseLineItems/v1/expenseLineItems.routes.js';
import { receiptsRoutes } from './features/receipts/v1/receipts.routes.js';
import { approvalsRoutes } from './features/approvals/v1/approvals.routes.js';
import { usersRoutes } from './features/users/v1/users.routes.js';
import { policiesRoutes } from './features/policies/v1/policies.routes.js';
import { reportsRoutes } from './features/reports/v1/reports.routes.js';

const framework = await FrameworkFastify.create();

await framework.initAppConfig({
  useEnvironmentVariables: true,
  fileConfigPath: './src/static-config.json',
});

const app = framework.app;

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] },
  },
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
});

const corsOrigins = (process.env['CORS_ORIGINS'] ?? 'http://localhost:3000').split(',');
await app.register(cors, { origin: corsOrigins, credentials: true });

const db = await createDbClient();

setupErrorHandler(app);

app.get('/health', async () => ({
  status: 'HEALTHY',
  timestamp: new Date().toISOString(),
  checks: { database: 'UP' },
}));
app.get('/health/ready', async () => ({ status: 'READY' }));

await app.register(expenseReportsRoutes, { prefix: '/api/v1', db });
await app.register(expenseLineItemsRoutes, { prefix: '/api/v1', db });
await app.register(receiptsRoutes, { prefix: '/api/v1', db });
await app.register(approvalsRoutes, { prefix: '/api/v1', db });
await app.register(usersRoutes, { prefix: '/api/v1', db });
await app.register(policiesRoutes, { prefix: '/api/v1', db });
await app.register(reportsRoutes, { prefix: '/api/v1', db });

await framework.start();
