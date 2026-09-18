import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

/**
 * Valida req[source] contra um schema Zod. Em caso de sucesso, substitui
 * req[source] pelo dado já parseado/transformado (coerções do Zod incluídas)
 * para que o controller receba dados confiáveis e tipados.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        AppError.badRequest('Dados inválidos.', result.error.flatten().fieldErrors),
      );
    }
    (req as any)[source] = result.data;
    next();
  };
}
