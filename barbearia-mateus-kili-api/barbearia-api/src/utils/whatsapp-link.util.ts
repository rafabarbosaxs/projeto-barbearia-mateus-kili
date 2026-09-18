import { env } from '../config/env';
import { formatWhatsappForDisplay } from './phone.util';

interface BuildConfirmationLinkParams {
  clienteNome: string;
  clienteWhatsapp: string; // já normalizado
  servicoNome: string;
  dataLabel: string; // ex.: "sáb., 02/08"
  horaLabel: string; // ex.: "14:20"
}

/**
 * Monta o link https://wa.me/... que abre uma conversa com o NÚMERO DO
 * BARBEIRO (BARBER_WHATSAPP_NUMBER), já com a mensagem de confirmação do
 * agendamento preenchida. É o cliente quem envia essa mensagem para o
 * Mateus — o back-end não dispara nada automaticamente por WhatsApp.
 */
export function buildWhatsappConfirmationLink(params: BuildConfirmationLinkParams): string {
  const { clienteNome, clienteWhatsapp, servicoNome, dataLabel, horaLabel } = params;

  const message = [
    'Olá Mateus! Gostaria de confirmar meu agendamento 💈',
    '',
    `Serviço: ${servicoNome}`,
    `Data: ${dataLabel}`,
    `Horário: ${horaLabel}`,
    `Nome: ${clienteNome}`,
    `Meu WhatsApp: ${formatWhatsappForDisplay(clienteWhatsapp)}`,
    '',
    '(Mensagem gerada automaticamente pelo site)',
  ].join('\n');

  return `https://wa.me/${env.BARBER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
