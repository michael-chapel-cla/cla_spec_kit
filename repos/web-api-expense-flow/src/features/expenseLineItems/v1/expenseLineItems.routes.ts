import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authMiddleware } from '../../../shared/auth/auth.middleware.js';
import type { DbClient } from '../../../shared/db/db.client.js';
import { ExpenseLineItemsService } from './expenseLineItems.service.js';
import { createExpenseLineItemSchema, updateExpenseLineItemSchema } from './expenseLineItems.schema.js';

export async function expenseLineItemsRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },
) {
  const service = new ExpenseLineItemsService(options.db);

  app.get('/ExpenseLineItems', { preHandler: authMiddleware }, async (req, reply) => {
    const { reportId } = req.query as { reportId?: string };
    if (!reportId) return reply.status(400).send({ error: 'BAD_REQUEST', message: 'reportId query param required', timestamp: new Date().toISOString(), requestId: req.id });
    const items = await service.listForReport(req.user.tenantId, parseInt(reportId, 10));
    return reply.send(items);
  });

  app.post('/ExpenseLineItems', { preHandler: authMiddleware }, async (req, reply) => {
    const parsed = createExpenseLineItemSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(422).send({ error: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })), timestamp: new Date().toISOString(), requestId: req.id });
    const id = await service.create(req.user.tenantId, parsed.data);
    return reply.status(201).header('Location', `/api/v1/ExpenseLineItems/${id}`).send({ id });
  });

  app.put('/ExpenseLineItems/:id', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updateExpenseLineItemSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(422).send({ error: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })), timestamp: new Date().toISOString(), requestId: req.id });
    await service.update(req.user.tenantId, parseInt(id, 10), parsed.data);
    const items = await service.listForReport(req.user.tenantId, 0); // caller should re-fetch
    return reply.send({ id: parseInt(id, 10) });
  });

  app.delete('/ExpenseLineItems/:id', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await service.delete(req.user.tenantId, parseInt(id, 10));
    return reply.status(204).send();
  });
}
