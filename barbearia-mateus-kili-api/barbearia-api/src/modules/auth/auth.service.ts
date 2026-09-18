import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { LoginInput } from './auth.schema';

/**
 * Sistema de um único barbeiro: não existe tabela `User`/`Admin` no banco.
 * As credenciais do Mateus vivem em variáveis de ambiente
 * (ADMIN_EMAIL / ADMIN_PASSWORD_HASH), e o login apenas confere e emite um
 * JWT. Se um dia o negócio crescer para vários profissionais, essa função é
 * o único lugar a trocar por uma tabela real de usuários.
 */
export async function login(input: LoginInput): Promise<{ token: string }> {
  const { email, senha } = input;

  const emailMatches = email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();

  // Roda o bcrypt.compare mesmo quando o e-mail já está errado (comparando
  // contra o hash real de qualquer forma) para não vazar, por diferença de
  // tempo de resposta, se um e-mail testado é ou não o do admin.
  const senhaValida = await bcrypt.compare(senha, env.ADMIN_PASSWORD_HASH);

  if (!emailMatches || !senhaValida) {
    throw AppError.unauthorized('Credenciais inválidas.');
  }

  const token = jwt.sign({ sub: env.ADMIN_EMAIL, role: 'admin' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token };
}
