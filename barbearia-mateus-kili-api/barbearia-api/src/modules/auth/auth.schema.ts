import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ required_error: 'email é obrigatório' }).email('email inválido'),
  senha: z.string({ required_error: 'senha é obrigatória' }).min(1, 'senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;
