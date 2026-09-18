import { prisma } from '../../config/prisma';
import { CreateBlockedSlotInput } from './blocked-slots.schema';

export function createBlockedSlot(input: CreateBlockedSlotInput) {
  return prisma.blockedSlot.create({
    data: {
      dataInicio: new Date(input.dataInicio),
      dataFim: new Date(input.dataFim),
      motivo: input.motivo,
    },
  });
}

export function listBlockedSlots() {
  return prisma.blockedSlot.findMany({ orderBy: { dataInicio: 'asc' } });
}

export function deleteBlockedSlot(id: string) {
  return prisma.blockedSlot.delete({ where: { id } });
}
