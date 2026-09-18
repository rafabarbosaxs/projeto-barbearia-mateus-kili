import { AppError } from './AppError';

/**
 * Normaliza um número de WhatsApp brasileiro para o formato internacional
 * usado pelo wa.me: apenas dígitos, sempre com código do país (55).
 *
 * Aceita entradas como:
 *   "(61) 90000-0000"  -> "5561900000000"... na verdade "556190000000" (ver nota)
 *   "+55 61 90000-0000" -> "5561900000000"
 *   "61 9 0000-0000"
 *
 * A decisão de "já tem código do país" é feita pela QUANTIDADE de dígitos,
 * não apenas pelo prefixo "55" — porque 55 também é um DDD válido (região de
 * Santa Maria/RS). Um número local de 10 ou 11 dígitos que comece com "55"
 * (DDD 55) não pode ser confundido com um número que já inclui o código do
 * país: por isso comparamos o tamanho total antes de decidir.
 */
export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  let national: string; // DDD + número, sem código do país
  if (digits.length === 10 || digits.length === 11) {
    // Já é DDD + número (fixo de 8 ou celular de 9 dígitos), sem código do país.
    national = digits;
  } else if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    // Já inclui o código do país.
    national = digits.slice(2);
  } else {
    throw AppError.badRequest(
      'Número de WhatsApp inválido. Informe DDD + número, com ou sem o código do país (55).',
    );
  }

  const ddd = Number(national.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    throw AppError.badRequest('DDD inválido no número de WhatsApp.');
  }

  return `55${national}`;
}

/**
 * Formata um número já normalizado (55DDDNUMERO) para exibição amigável,
 * ex.: "55 (61) 90000-0000".
 */
export function formatWhatsappForDisplay(normalized: string): string {
  const country = normalized.slice(0, 2);
  const ddd = normalized.slice(2, 4);
  const rest = normalized.slice(4);
  const middle = rest.length === 9 ? rest.slice(0, 5) : rest.slice(0, 4);
  const end = rest.length === 9 ? rest.slice(5) : rest.slice(4);
  return `+${country} (${ddd}) ${middle}-${end}`;
}
