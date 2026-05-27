import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authMiddleware, requireScope } from '../../../shared/auth/auth.middleware.js';
import type { DbClient } from '../../../shared/db/db.client.js';
import { UsersService } from './users.service.js';

export async function usersRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },
) {
  const service = new UsersService(options.db);

  app.get('/Users/Me', { preHandler: authMiddleware }, async (req, reply) => {
    const { oid, name, email, tid } = req.user;
    // Resolve TenantId from the JWT tid claim (simplified — real impl maps Entra tenant → app tenant)
    const tenantId = 1; // TODO: resolve from dbo.Tenants by Slug or external config
    const user = await service.upsertFromToken(tenantId, oid, name, email);
    const role = await service.getRoleForUser(tenantId, user.id);
    return reply.send({ ...user, role });
  });

  app.get('/Users', { preHandler: requireScope('finance', 'admin') }, async (req, reply) => {
    const users = await service.listForTenant(req.user.tenantId);
    return reply.send(users);
  });
}
