import { DateTime } from 'luxon';
import { env } from '../config/env';
import { AppError } from './AppError';

/**
 * Todo o negócio (grade de horários, disponibilidade, exibição para o
 * cliente/barbeiro) é pensado em horário de Brasília. O banco guarda tudo em
 * UTC (timestamptz) — este arquivo é a única fronteira de conversão entre os
 * dois mundos, para nunca espalhar `new Date()` ingênuo pelo código.
 */
const ZONE = env.TZ;

/** Interpreta "YYYY-MM-DD" como um dia de calendário em America/Sao_Paulo. */
export function parseLocalDate(dateStr: string): DateTime {
  const dt = DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: ZONE });
  if (!dt.isValid) {
    throw AppError.badRequest(`Data inválida: "${dateStr}". Use o formato YYYY-MM-DD.`);
  }
  return dt.startOf('day');
}

/** 0 = domingo ... 6 = sábado, calculado no fuso local (não em UTC). */
export function weekdayOf(dateStr: string): number {
  const dt = parseLocalDate(dateStr);
  // Luxon: weekday 1=segunda ... 7=domingo. Convertemos para 0=domingo...6=sábado.
  return dt.weekday % 7;
}

/** Combina uma data (YYYY-MM-DD) com um horário ("HH:mm") no fuso local. */
export function combineLocalDateTime(dateStr: string, hhmm: string): DateTime {
  const match = /^([0-1]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!match) {
    throw AppError.badRequest(`Horário inválido: "${hhmm}". Use o formato HH:mm.`);
  }
  const [, h, m] = match;
  return parseLocalDate(dateStr).set({ hour: Number(h), minute: Number(m), second: 0, millisecond: 0 });
}

export function toJSDate(dt: DateTime): Date {
  return dt.toJSDate();
}

/** Formata um instante (Date/UTC do banco) como "HH:mm" no fuso local. */
export function formatLocalHHMM(date: Date): string {
  return DateTime.fromJSDate(date).setZone(ZONE).toFormat('HH:mm');
}

/** Formata um instante como rótulo de data amigável em pt-BR, ex.: "sáb, 02/08". */
export function formatLocalDateLabel(date: Date): string {
  return DateTime.fromJSDate(date).setZone(ZONE).setLocale('pt-BR').toFormat('ccc, dd/LL');
}

/** Dois intervalos [aStart, aEnd) e [bStart, bEnd) se sobrepõem? */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** O instante já passou (com uma margem opcional de minutos), no fuso local? */
export function isBeforeNow(date: Date, bufferMinutes = 0): boolean {
  const now = DateTime.now().setZone(ZONE).plus({ minutes: bufferMinutes });
  return DateTime.fromJSDate(date).setZone(ZONE) < now;
}

export const TIMEZONE = ZONE;
