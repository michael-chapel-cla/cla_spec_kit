import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { requireScope } from '../../../shared/auth/auth.middleware.js';
import type { DbClient } from '../../../shared/db/db.client.js';
import { ReportsService } from './reports.service.js';
import { reportQuerySchema } from './reports.schema.js';

export async function reportsRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },
) {
  const service = new ReportsService(options.db);

  app.get('/Reports/Spend', { preHandler: requireScope('finance', 'admin') }, async (req, reply) => {
    const parsed = reportQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: 'BAD_REQUEST', message: 'Missing or invalid query params', details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })), timestamp: new Date().toISOString(), requestId: req.id });
    const data = await service.getSpendByCategory(req.user.tenantId, parsed.data.periodStart, parsed.data.periodEnd);
    return reply.send(data);
  });

  app.get('/Reports/Export', { preHandler: requireScope('finance', 'admin') }, async (req, reply) => {
    const parsed = reportQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: 'BAD_REQUEST', message: 'Missing or invalid query params', details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })), timestamp: new Date().toISOString(), requestId: req.id });
    const rows = await service.getExportRows(req.user.tenantId, parsed.data.periodStart, parsed.data.periodEnd);
    const csv = service.toCsv(rows);
    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="expense-export-${parsed.data.periodStart}-${parsed.data.periodEnd}.csv"`)
      .send(csv);
  });
}
