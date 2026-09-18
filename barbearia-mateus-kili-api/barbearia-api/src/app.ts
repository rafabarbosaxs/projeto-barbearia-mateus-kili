import 'express-async-errors'; // precisa vir antes de qualquer rota ser registrada
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { servicesRouter } from './modules/services/services.routes';
import { availabilityRouter } from './modules/availability/availability.routes';
import { appointmentsRouter } from './modules/appointments/appointments.routes';
import { authRouter } from './modules/auth/auth.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';

export const app = express();

// Necessário para que req.ip / express-rate-limit enxerguem o IP real do
// cliente quando a API roda atrás de um reverse proxy / load balancer
// (Nginx, Render, Railway, Heroku etc.), que é o cenário esperado em
// produção. Sem isso, todo tráfego chegaria com o IP do proxy e o rate
// limit por IP perderia o sentido (ou bloquearia todo mundo junto).
app.set('trust proxy', 1);

app.use(helmet());

/**
 * CORS restrito às origens do front-end (env.CORS_ORIGINS).
 *
 * Em desenvolvimento, se CORS_ORIGIN não for definido, liberamos qualquer
 * origem — inclusive a string "null" que os navegadores mandam quando o
 * index.html é aberto direto do disco (file://), pra não travar o teste
 * local. Em produção, env.ts já falha o boot se CORS_ORIGIN estiver vazio
 * ou for "*", então aqui só validamos a lista configurada.
 */
app.use(
  cors({
    origin(origin, callback) {
      const isDev = env.NODE_ENV !== 'production';
      const allowed = env.CORS_ORIGINS.length === 0 ? isDev : env.CORS_ORIGINS.includes(origin ?? '');

      // Requisições sem header Origin (curl, health checks, chamadas
      // servidor-a-servidor) não são requisições de navegador cross-origin
      // e o CORS não se aplica a elas — sempre liberadas.
      if (!origin || allowed) return callback(null, true);

      return callback(new Error('Origem não permitida pelo CORS.'));
    },
  }),
);

// Limite de tamanho do corpo da requisição — esta API só recebe JSON
// pequeno (nunca upload de arquivo), então 15kb já é bem folgado e ajuda a
// mitigar ataques de payload gigante.
app.use(express.json({ limit: '15kb' }));

// Leitura pública (catálogo/disponibilidade): permissivo.
const publicReadLimiter = rateLimit({ windowMs: 60_000, limit: 120 });
// Criação de agendamento: mais restrito, evita spam de reservas.
const createAppointmentLimiter = rateLimit({ windowMs: 60_000, limit: 10 });
// Login: o alvo mais sensível a força bruta — poucas tentativas por IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Muitas tentativas de login. Tente novamente mais tarde.', code: 'RATE_LIMITED' } },
});
// Painel admin: já exige JWT, mas ainda vale limitar para conter abuso/DoS.
const adminLimiter = rateLimit({ windowMs: 60_000, limit: 120 });

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/services', publicReadLimiter, servicesRouter);
app.use('/api/availability', publicReadLimiter, availabilityRouter);
app.use('/api/appointments', createAppointmentLimiter, appointmentsRouter);

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/admin', adminLimiter, adminRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
