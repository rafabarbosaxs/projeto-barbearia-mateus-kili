import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

/**
 * Handler final de erros. Graças ao `express-async-errors` (importado em
 * app.ts), qualquer rejeição de Promise dentro de um controller async cai
 * automaticamente aqui — não é necessário try/catch manual em cada rota.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Recurso não encontrado.', code: 'NOT_FOUND' } });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: { message: 'Registro duplicado.', code: 'CONFLICT' } });
    }
  }

  console.error('Erro não tratado:', err);

  return res.status(500).json({
    error: {
      message: 'Erro interno do servidor.',
      code: 'INTERNAL_ERROR',
      ...(env.NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
}

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({
    error: { message: `Rota não encontrada: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' },
  });
}
