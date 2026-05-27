import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authMiddleware } from '../../../shared/auth/auth.middleware.js';
import type { DbClient } from '../../../shared/db/db.client.js';
import { ExpenseReportsService } from './expenseReports.service.js';
import {
  createExpenseReportSchema,
  updateExpenseReportSchema,
} from './expenseReports.schema.js';

export async function expenseReportsRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },
) {
  const service = new ExpenseReportsService(options.db);

  app.get('/ExpenseReports', { preHandler: authMiddleware }, async (req, reply) => {
    const { tenantId, userId, role } = req.user;
    const reports =
      role === 'finance' || role === 'admin'
        ? await service.listAll(tenantId)
        : await service.listForUser(tenantId, userId);
    return reply.send(reports);
  });

  app.post('/ExpenseReports', { preHandler: authMiddleware }, async (req, reply) => {
    const parsed = createExpenseReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        timestamp: new Date().toISOString(),
        requestId: req.id,
      });
    }
    const id = await service.create(req.user.tenantId, req.user.userId, parsed.data);
    return reply.status(201).header('Location', `/api/v1/ExpenseReports/${id}`).send({ id });
  });

  app.get('/ExpenseReports/:id', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const report = await service.getById(req.user.tenantId, parseInt(id, 10));
    if (!report) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Report not found', timestamp: new Date().toISOString(), requestId: req.id });
    return reply.send(report);
  });

  app.patch('/ExpenseReports/:id', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updateExpenseReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })), timestamp: new Date().toISOString(), requestId: req.id });
    }
    await service.update(req.user.tenantId, parseInt(id, 10), parsed.data);
    const updated = await service.getById(req.user.tenantId, parseInt(id, 10));
    return reply.send(updated);
  });

  app.post('/ExpenseReports/:id/Submit', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const violations = await service.submit(req.user.tenantId, parseInt(id, 10));
    if (violations.length > 0) {
      return reply.status(422).send({ error: 'POLICY_VIOLATION', message: 'Report has policy violations', details: violations, timestamp: new Date().toISOString(), requestId: req.id });
    }
    return reply.send({ status: 'Pending' });
  });

  app.delete('/ExpenseReports/:id', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await service.delete(req.user.tenantId, parseInt(id, 10));
    return reply.status(204).send();
  });
}
