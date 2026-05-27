import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { requireScope } from '../../../shared/auth/auth.middleware.js';
import type { DbClient } from '../../../shared/db/db.client.js';
import { ApprovalsService } from './approvals.service.js';
import { createApprovalSchema } from './approvals.schema.js';

export async function approvalsRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },
) {
  const service = new ApprovalsService(options.db);

  app.get('/Approvals', { preHandler: requireScope('manager', 'finance', 'admin') }, async (req, reply) => {
    const approvals = await service.listPendingForManager(req.user.tenantId, req.user.userId);
    return reply.send(approvals);
  });

  app.get('/Approvals/:id', { preHandler: requireScope('manager', 'finance', 'admin') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const approval = await service.getById(req.user.tenantId, parseInt(id, 10));
    if (!approval) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Approval not found', timestamp: new Date().toISOString(), requestId: req.id });
    return reply.send(approval);
  });

  app.post('/Approvals', { preHandler: requireScope('manager', 'finance', 'admin') }, async (req, reply) => {
    const parsed = createApprovalSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(422).send({ error: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })), timestamp: new Date().toISOString(), requestId: req.id });
    const id = await service.create(req.user.tenantId, req.user.userId, parsed.data);
    return reply.status(201).header('Location', `/api/v1/Approvals/${id}`).send({ id });
  });
}
