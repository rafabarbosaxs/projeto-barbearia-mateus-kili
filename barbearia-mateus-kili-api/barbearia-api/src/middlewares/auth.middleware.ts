import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export interface AdminTokenPayload {
  sub: string; // email do admin
  role: 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

/**
 * Exige um Bearer token JWT válido, emitido por POST /api/auth/login.
 * Como o sistema atende um único barbeiro, não há tabela de usuários nem
 * papéis diferentes — qualquer token válido representa o próprio Mateus.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token de autenticação ausente.'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;
    req.admin = payload;
    next();
  } catch {
    next(AppError.unauthorized('Token inválido ou expirado.'));
  }
}
