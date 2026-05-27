import { FastifyInstance } from 'fastify';

export function setupErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    req.log.error({ err, requestId: req.id }, 'Request failed');
    const statusCode = err.statusCode ?? 500;
    reply.status(statusCode).send({
      error: statusCode >= 500 ? 'INTERNAL_ERROR' : (err.code ?? 'REQUEST_ERROR'),
      message:
        statusCode >= 500 ? 'An unexpected error occurred.' : err.message,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  });
}
