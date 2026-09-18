import { z } from 'zod';

export const createAppointmentSchema = z.object({
  clienteNome: z
    .string({ required_error: 'clienteNome é obrigatório' })
    .trim()
    .min(2, 'Nome muito curto')
    .max(120, 'Nome muito longo'),
  clienteWhatsapp: z
    .string({ required_error: 'clienteWhatsapp é obrigatório' })
    .min(8, 'clienteWhatsapp inválido'),
  serviceId: z.string({ required_error: 'serviceId é obrigatório' }).uuid('serviceId inválido'),
  data: z
    .string({ required_error: 'data é obrigatório' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato YYYY-MM-DD'),
  hora: z
    .string({ required_error: 'hora é obrigatório' })
    .regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'hora deve estar no formato HH:mm'),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO'], {
    required_error: 'status é obrigatório',
  }),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const listAdminAppointmentsQuerySchema = z.object({
  date: z
    .string({ required_error: 'date é obrigatório' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date deve estar no formato YYYY-MM-DD'),
});
