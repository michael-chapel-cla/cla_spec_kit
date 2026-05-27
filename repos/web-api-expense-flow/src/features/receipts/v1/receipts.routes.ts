import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authMiddleware } from '../../../shared/auth/auth.middleware.js';
import type { DbClient } from '../../../shared/db/db.client.js';
import { ReceiptsService } from './receipts.service.js';
import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES } from './receipts.schema.js';

export async function receiptsRoutes(
  app: FastifyInstance,
  options: FastifyPluginOptions & { db: DbClient },
) {
  const service = new ReceiptsService(options.db);

  app.post('/Receipts', { preHandler: authMiddleware }, async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'BAD_REQUEST', message: 'No file uploaded', timestamp: new Date().toISOString(), requestId: req.id });
    if (!ALLOWED_CONTENT_TYPES.includes(data.mimetype)) return reply.status(422).send({ error: 'VALIDATION_ERROR', message: `Unsupported file type. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`, timestamp: new Date().toISOString(), requestId: req.id });

    const buffer = await data.toBuffer();
    if (buffer.length > MAX_FILE_SIZE_BYTES) return reply.status(413).send({ error: 'PAYLOAD_TOO_LARGE', message: 'File exceeds 10 MB limit', timestamp: new Date().toISOString(), requestId: req.id });

    const { tenantId, userId } = req.user;
    const blobPath = `receipts-${tenantId}/${Date.now()}-${data.filename}`;

    // TODO: upload buffer to Azure Blob Storage at blobPath

    const id = await service.store(tenantId, userId, blobPath, data.mimetype, buffer.length, data.filename);
    return reply.status(201).header('Location', `/api/v1/Receipts/${id}/Download`).send({ id });
  });

  app.get('/Receipts/:id/Download', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const receipt = await service.getById(req.user.tenantId, parseInt(id, 10));
    if (!receipt) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Receipt not found', timestamp: new Date().toISOString(), requestId: req.id });
    const url = service.generateSasUrl(receipt.blobPath);
    return reply.send({ url, expiresInSeconds: 3600 });
  });
}
