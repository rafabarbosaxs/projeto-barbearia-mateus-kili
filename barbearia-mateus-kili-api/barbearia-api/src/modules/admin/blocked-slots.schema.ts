import { z } from 'zod';

/**
 * `dataInicio`/`dataFim` são ISO 8601 completos (data + hora), para permitir
 * tanto bloquear um horário específico quanto o dia inteiro (nesse caso o
 * front-end simplesmente envia 00:00 até 23:59 do dia, no fuso local).
 */
export const createBlockedSlotSchema = z
  .object({
    dataInicio: z.string({ required_error: 'dataInicio é obrigatório' }).datetime({ offset: true }),
    dataFim: z.string({ required_error: 'dataFim é obrigatório' }).datetime({ offset: true }),
    motivo: z.string({ required_error: 'motivo é obrigatório' }).trim().min(2).max(200),
  })
  .refine((data) => new Date(data.dataFim) > new Date(data.dataInicio), {
    message: 'dataFim deve ser depois de dataInicio',
    path: ['dataFim'],
  });

export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>;
