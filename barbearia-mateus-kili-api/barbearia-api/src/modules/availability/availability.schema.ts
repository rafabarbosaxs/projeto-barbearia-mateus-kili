import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  date: z
    .string({ required_error: 'date é obrigatório' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date deve estar no formato YYYY-MM-DD'),
  serviceId: z.string({ required_error: 'serviceId é obrigatório' }).uuid('serviceId inválido'),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
