import { prisma } from '../../config/prisma';

export function listActiveServices() {
  return prisma.service.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  });
}
