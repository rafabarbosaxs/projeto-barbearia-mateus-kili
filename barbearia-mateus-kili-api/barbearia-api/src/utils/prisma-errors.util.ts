import { Prisma } from '@prisma/client';

/**
 * A EXCLUDE CONSTRAINT "appointments_no_overlap" (ver migration
 * 000002_add_overlap_constraint) não é um erro "conhecido" do Prisma como o
 * P2002 de unique constraint — ela chega como PrismaClientUnknownRequestError
 * (ou, dependendo da versão do engine, PrismaClientKnownRequestError com um
 * code genérico), carregando a mensagem crua do Postgres. Por isso a forma
 * mais robusta e estável entre versões de detectar esse caso específico é
 * checar o texto da mensagem pelo nome da constraint.
 */
export function isOverlapConstraintViolation(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    return error.message.includes('appointments_no_overlap');
  }
  return false;
}
