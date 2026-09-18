import 'dotenv/config';
import { z } from 'zod';

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const KNOWN_PLACEHOLDER_JWT_SECRET = 'troque-por-um-segredo-forte-e-aleatorio';
const KNOWN_PLACEHOLDER_WHATSAPP = '5561999999999';

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    TZ: z.string().default('America/Sao_Paulo'),
    SLOT_STEP_MINUTES: z.coerce.number().int().positive().default(20),

    // Origens (frontend) autorizadas a chamar a API via CORS. Lista separada
    // por vírgula, ex.: "https://barbeariamateuskili.com,https://admin.barbeariamateuskili.com"
    // Em desenvolvimento pode ficar vazio — nesse caso a API libera qualquer
    // origem para facilitar testar o front-end local (inclusive `file://`,
    // cujo header Origin chega como a string "null"). Em produção é
    // obrigatório informar pelo menos uma origem.
    CORS_ORIGIN: z.string().optional().default(''),

    JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter pelo menos 16 caracteres'),
    JWT_EXPIRES_IN: z.string().default('12h'),

    ADMIN_EMAIL: z.string().email(),
    ADMIN_PASSWORD_HASH: z.string().min(1, 'ADMIN_PASSWORD_HASH é obrigatório'),

    BARBER_WHATSAPP_NUMBER: z.string().min(10, 'BARBER_WHATSAPP_NUMBER inválido'),
  })
  .superRefine((data, ctx) => {
    // Em desenvolvimento/teste, deixamos passar valores de exemplo (senão
    // ninguém consegue rodar o projeto localmente a partir do .env.example
    // sem gerar um hash bcrypt e um JWT_SECRET antes de dar o primeiro
    // "npm run dev"). Em produção, esses mesmos valores de exemplo — ou
    // qualquer coisa fora do formato esperado — derrubam o boot da API.
    if (data.NODE_ENV !== 'production') return;

    if (data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'Em produção, JWT_SECRET deve ter pelo menos 32 caracteres aleatórios.',
      });
    }
    if (data.JWT_SECRET === KNOWN_PLACEHOLDER_JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET ainda está com o valor de exemplo do .env.example. Gere um valor real.',
      });
    }

    if (!BCRYPT_HASH_REGEX.test(data.ADMIN_PASSWORD_HASH)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ADMIN_PASSWORD_HASH'],
        message:
          'ADMIN_PASSWORD_HASH não parece um hash bcrypt válido. Gere com: ' +
          `node -e "console.log(require('bcryptjs').hashSync('SUASENHA', 12))"`,
      });
    }

    if (data.BARBER_WHATSAPP_NUMBER === KNOWN_PLACEHOLDER_WHATSAPP) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BARBER_WHATSAPP_NUMBER'],
        message: 'BARBER_WHATSAPP_NUMBER ainda está com o número de exemplo. Configure o número real do barbeiro.',
      });
    }

    if (data.CORS_ORIGIN.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'Em produção, CORS_ORIGIN é obrigatório (domínio(s) do front-end, separados por vírgula).',
      });
    } else if (data.CORS_ORIGIN.split(',').some((origin) => origin.trim() === '*')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'Em produção, CORS_ORIGIN não pode ser "*" — informe o(s) domínio(s) real(is) do front-end.',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  // Lista já normalizada (sem espaços, sem entradas vazias) de origens
  // liberadas no CORS. Vazio em dev = "libera qualquer origem" (ver app.ts).
  CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

// Garante que toda a lógica de Date do processo (ex.: `new Date()`,
// bibliotecas que não recebem zone explícita) opere no fuso configurado.
process.env.TZ = env.TZ;
