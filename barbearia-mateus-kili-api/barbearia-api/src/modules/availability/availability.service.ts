import { DateTime } from 'luxon';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import {
  combineLocalDateTime,
  formatLocalHHMM,
  isBeforeNow,
  parseLocalDate,
  rangesOverlap,
  toJSDate,
  weekdayOf,
} from '../../utils/time.util';

/** Aceita tanto o client padrão do Prisma quanto um client de transação. */
type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

export interface OpenHours {
  abertura: DateTime;
  fechamento: DateTime;
  pausaInicio: DateTime | null;
  pausaFim: DateTime | null;
}

/**
 * Retorna a grade de horários do dia (já combinada com a data, em DateTime
 * local), ou `null` se a barbearia estiver fechada nesse dia da semana.
 */
export async function getBusinessHoursFor(
  dateStr: string,
  db: PrismaClientOrTx = prisma,
): Promise<OpenHours | null> {
  const diaSemana = weekdayOf(dateStr);
  const hours = await db.businessHours.findUnique({ where: { diaSemana } });

  if (!hours || hours.fechado) return null;

  return {
    abertura: combineLocalDateTime(dateStr, hours.horaAbertura),
    fechamento: combineLocalDateTime(dateStr, hours.horaFechamento),
    pausaInicio: hours.pausaInicio ? combineLocalDateTime(dateStr, hours.pausaInicio) : null,
    pausaFim: hours.pausaFim ? combineLocalDateTime(dateStr, hours.pausaFim) : null,
  };
}

/** O intervalo [start, end) cabe dentro do expediente e fora da pausa? */
export function isWithinBusinessHours(start: Date, end: Date, hours: OpenHours): boolean {
  const abertura = toJSDate(hours.abertura);
  const fechamento = toJSDate(hours.fechamento);

  if (start < abertura || end > fechamento) return false;

  if (hours.pausaInicio && hours.pausaFim) {
    const pausaInicio = toJSDate(hours.pausaInicio);
    const pausaFim = toJSDate(hours.pausaFim);
    if (rangesOverlap(start, end, pausaInicio, pausaFim)) return false;
  }

  return true;
}

interface BusyPeriod {
  start: Date;
  end: Date;
}

/**
 * Junta, num único array, os períodos "ocupados" do dia: agendamentos ativos
 * (PENDENTE/CONFIRMADO) + bloqueios manuais. CANCELADO e CONCLUIDO nunca
 * ocupam a agenda.
 */
async function getBusyPeriods(
  dateStr: string,
  hours: OpenHours,
  db: PrismaClientOrTx = prisma,
): Promise<BusyPeriod[]> {
  const dayStart = toJSDate(hours.abertura);
  const dayEnd = toJSDate(hours.fechamento);

  const [appointments, blockedSlots] = await Promise.all([
    db.appointment.findMany({
      where: {
        status: { in: ['PENDENTE', 'CONFIRMADO'] },
        dataHoraInicio: { lt: dayEnd },
        dataHoraFim: { gt: dayStart },
      },
      select: { dataHoraInicio: true, dataHoraFim: true },
    }),
    db.blockedSlot.findMany({
      where: {
        dataInicio: { lt: dayEnd },
        dataFim: { gt: dayStart },
      },
      select: { dataInicio: true, dataFim: true },
    }),
  ]);

  return [
    ...appointments.map((a) => ({ start: a.dataHoraInicio, end: a.dataHoraFim })),
    ...blockedSlots.map((b) => ({ start: b.dataInicio, end: b.dataFim })),
  ];
}

/** O intervalo [start, end) está livre de agendamentos e bloqueios? */
export async function isSlotFree(
  dateStr: string,
  start: Date,
  end: Date,
  db: PrismaClientOrTx = prisma,
): Promise<boolean> {
  const hours = await getBusinessHoursFor(dateStr, db);
  if (!hours) return false;

  const busy = await getBusyPeriods(dateStr, hours, db);
  return !busy.some((period) => rangesOverlap(start, end, period.start, period.end));
}

/**
 * Calcula os horários livres (formato "HH:mm") para um serviço em uma data,
 * considerando expediente, pausa, agendamentos existentes e bloqueios.
 *
 * A granularidade dos candidatos é `SLOT_STEP_MINUTES` (padrão 20min) — ou
 * seja, o horário oferecido ao cliente sempre cai numa grade "redonda"
 * mesmo que a duração do serviço seja, por exemplo, 45 minutos.
 */
export async function computeAvailableSlots(dateStr: string, serviceId: string): Promise<string[]> {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.ativo) {
    throw AppError.notFound('Serviço não encontrado ou indisponível.');
  }

  const hours = await getBusinessHoursFor(dateStr, prisma);
  if (!hours) return [];

  const busy = await getBusyPeriods(dateStr, hours, prisma);
  const step = env.SLOT_STEP_MINUTES;
  const duration = service.duracaoMinutos;

  const slots: string[] = [];
  let cursor = hours.abertura;

  while (true) {
    const candidateStart = cursor;
    const candidateEnd = cursor.plus({ minutes: duration });

    if (candidateEnd > hours.fechamento) break;

    const startJS = toJSDate(candidateStart);
    const endJS = toJSDate(candidateEnd);

    const withinPausa =
      hours.pausaInicio && hours.pausaFim
        ? rangesOverlap(startJS, endJS, toJSDate(hours.pausaInicio), toJSDate(hours.pausaFim))
        : false;

    const overlapsBusy = busy.some((period) => rangesOverlap(startJS, endJS, period.start, period.end));

    const alreadyPast = isBeforeNow(startJS);

    if (!withinPausa && !overlapsBusy && !alreadyPast) {
      slots.push(formatLocalHHMM(startJS));
    }

    cursor = cursor.plus({ minutes: step });
  }

  return slots;
}
