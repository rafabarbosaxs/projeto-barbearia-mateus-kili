import { Prisma, AppointmentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { normalizeWhatsapp } from '../../utils/phone.util';
import { isOverlapConstraintViolation } from '../../utils/prisma-errors.util';
import { buildWhatsappConfirmationLink } from '../../utils/whatsapp-link.util';
import {
  combineLocalDateTime,
  formatLocalDateLabel,
  formatLocalHHMM,
  isBeforeNow,
  toJSDate,
} from '../../utils/time.util';
import { getBusinessHoursFor, isSlotFree, isWithinBusinessHours } from '../availability/availability.service';
import { CreateAppointmentInput } from './appointments.schema';

export async function createAppointment(input: CreateAppointmentInput) {
  const clienteWhatsapp = normalizeWhatsapp(input.clienteWhatsapp);

  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service || !service.ativo) {
    throw AppError.notFound('Serviço não encontrado ou indisponível.');
  }

  const inicioLocal = combineLocalDateTime(input.data, input.hora);
  const fimLocal = inicioLocal.plus({ minutes: service.duracaoMinutos });
  const inicioJS = toJSDate(inicioLocal);
  const fimJS = toJSDate(fimLocal);

  if (isBeforeNow(inicioJS)) {
    throw AppError.badRequest('Não é possível agendar um horário que já passou.');
  }

  try {
    // Isolation level Serializable + a checagem explícita abaixo cobrem o
    // caso comum. A EXCLUDE CONSTRAINT do banco (migration 000002) é quem
    // garante a atomicidade real contra corrida entre transações
    // concorrentes — se ela disparar, caímos no catch abaixo.
    const appointment = await prisma.$transaction(
      async (tx) => {
        const hours = await getBusinessHoursFor(input.data, tx);
        if (!hours || !isWithinBusinessHours(inicioJS, fimJS, hours)) {
          throw AppError.badRequest('Esse horário está fora do expediente ou cai na pausa do barbeiro.');
        }

        const free = await isSlotFree(input.data, inicioJS, fimJS, tx);
        if (!free) {
          throw AppError.conflict('Esse horário não está mais disponível. Escolha outro horário.');
        }

        return tx.appointment.create({
          data: {
            clienteNome: input.clienteNome,
            clienteWhatsapp,
            serviceId: service.id,
            dataHoraInicio: inicioJS,
            dataHoraFim: fimJS,
            status: AppointmentStatus.PENDENTE,
          },
          include: { service: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const whatsappConfirmationUrl = buildWhatsappConfirmationLink({
      clienteNome: appointment.clienteNome,
      clienteWhatsapp: appointment.clienteWhatsapp,
      servicoNome: appointment.service.nome,
      dataLabel: formatLocalDateLabel(appointment.dataHoraInicio),
      horaLabel: formatLocalHHMM(appointment.dataHoraInicio),
    });

    return { appointment, whatsappConfirmationUrl };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (isOverlapConstraintViolation(err)) {
      throw AppError.conflict('Esse horário acabou de ser reservado por outro cliente. Escolha outro horário.');
    }
    throw err;
  }
}

export function listAppointmentsByDate(dateStr: string) {
  // Usa a mesma referência de expediente do dia para limitar a busca;
  // se não houver grade cadastrada, cai para o dia civil local completo.
  return prisma.appointment.findMany({
    where: {
      dataHoraInicio: {
        gte: toJSDate(combineLocalDateTime(dateStr, '00:00')),
        lt: toJSDate(combineLocalDateTime(dateStr, '23:59')),
      },
    },
    include: { service: true },
    orderBy: { dataHoraInicio: 'asc' },
  });
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    throw AppError.notFound('Agendamento não encontrado.');
  }

  try {
    return await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { service: true },
    });
  } catch (err) {
    // Só pode acontecer ao mudar de volta para PENDENTE/CONFIRMADO um
    // agendamento que colidiria com outro já existente nesse mesmo horário.
    if (isOverlapConstraintViolation(err)) {
      throw AppError.conflict('Não é possível reativar: o horário já está ocupado por outro agendamento.');
    }
    throw err;
  }
}
