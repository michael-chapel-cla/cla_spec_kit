import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { requireScope } from '../../../shared/auth/auth.middleware.js';
import type { DbClient } from '../../../shared/db/db.client.js';
import { PoliciesService } from './policies.service.js';
import { createPolicySchema, updatePolicySchema } from './policies.schema.js';

export async function policiesRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },
) {
  const service = new PoliciesService(options.db);

  app.get('/Policies', { preHandler: requireScope('finance', 'admin') }, async (req, reply) => {
    return reply.send(await service.list(req.user.tenantId));
  });

  app.post('/Policies', { preHandler: requireScope('finance', 'admin') }, async (req, reply) => {
    const parsed = createPolicySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(422).send({ error: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })), timestamp: new Date().toISOString(), requestId: req.id });
    const id = await service.create(req.user.tenantId, parsed.data);
    return reply.status(201).header('Location', `/api/v1/Policies/${id}`).send({ id });
  });

  app.put('/Policies/:id', { preHandler: requireScope('finance', 'admin') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updatePolicySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(422).send({ error: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })), timestamp: new Date().toISOString(), requestId: req.id });
    await service.update(req.user.tenantId, parseInt(id, 10), parsed.data);
    return reply.send({ id: parseInt(id, 10) });
  });

  app.delete('/Policies/:id', { preHandler: requireScope('finance', 'admin') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await service.deactivate(req.user.tenantId, parseInt(id, 10));
    return reply.status(204).send();
  });
}
