import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export interface AuthenticatedUser {
  oid: string;
  tid: string;
  email: string;
  name: string;
  role: string;
  tenantId: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}

const client = jwksClient({
  jwksUri: `${process.env['ENTRA_ISSUER']}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header',
      timestamp: new Date().toISOString(),
      requestId: request.id,
    });
  }

  const token = authHeader.slice(7);
  return new Promise<void>((resolve) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: process.env['ENTRA_ISSUER']!,
        audience: process.env['ENTRA_AUDIENCE']!,
      },
      (err, decoded) => {
        if (err || !decoded || typeof decoded === 'string') {
          reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
            timestamp: new Date().toISOString(),
            requestId: request.id,
          });
          resolve();
          return;
        }
        const claims = decoded as Record<string, unknown>;
        request.user = {
          oid: claims['oid'] as string,
          tid: claims['tid'] as string,
          email: (claims['preferred_username'] ?? claims['email']) as string,
          name: claims['name'] as string,
          role: (claims['role'] ?? 'employee') as string,
          tenantId: 0, // populated by users.service after DB lookup
        };
        resolve();
      },
    );
  });
}

export function requireScope(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
        requestId: request.id,
      });
    }
  };
}
