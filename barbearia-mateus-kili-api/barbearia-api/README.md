# Barbearia Mateus Kili — API de Agendamento

API RESTful em Node.js + TypeScript + Express + Prisma + PostgreSQL para o
sistema de agendamento online da barbearia do Mateus Kili
([@barbeirodafavela1](https://www.instagram.com/barbeirodafavela1/)).
Atende **um único barbeiro** e foi desenhada para garantir **zero
double-booking**, mesmo sob concorrência real.

---

## 1. Stack

- Node.js + TypeScript
- Express
- PostgreSQL + Prisma ORM
- Zod (validação de payload)
- JWT (autenticação do painel admin)
- Luxon (toda a lógica de fuso horário — `America/Sao_Paulo`)

## 2. Como rodar localmente

```bash
# 1) instalar dependências
npm install

# 2) subir um Postgres local (ou aponte DATABASE_URL para o seu)
docker compose up -d

# 3) configurar variáveis de ambiente
cp .env.example .env
# edite o .env — veja a seção 3 sobre como gerar ADMIN_PASSWORD_HASH

# 4) aplicar as migrations
npx prisma migrate deploy
# (em desenvolvimento, "npx prisma migrate dev" também funciona)

# 5) gerar o client do Prisma
npx prisma generate

# 6) popular serviços e horário de funcionamento iniciais
npm run prisma:seed

# 7) subir a API em modo dev (hot reload)
npm run dev
```

A API sobe em `http://localhost:3000` (ou na porta definida em `PORT`).
`GET /health` retorna `{ "status": "ok" }` para checagem rápida.

## 3. Variáveis de ambiente

Veja `.env.example` para a lista completa. As que exigem atenção:

- **`BARBER_WHATSAPP_NUMBER`** — número real do Mateus, formato
  `55DDDNUMERO` (sem espaços/símbolos). É para esse número que o link de
  confirmação gerado em `POST /api/appointments` aponta.
- **`CORS_ORIGIN`** — domínio(s) do front-end autorizados a chamar a API,
  separados por vírgula (ex.: `https://barbeariamateuskili.com`). Em
  desenvolvimento pode ficar vazio (libera qualquer origem, incluindo abrir
  o `index.html` via `file://`). **Em produção é obrigatório** e não pode
  ser `*` — a API se recusa a subir sem isso (ver seção 10).
- **`ADMIN_EMAIL`** / **`ADMIN_PASSWORD_HASH`** — como o sistema atende um
  único barbeiro, não existe tabela de usuários: as credenciais do painel
  vivem em variáveis de ambiente. Gere o hash da senha com:
  ```bash
  node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA_AQUI', 12))"
  ```
  e cole o resultado em `ADMIN_PASSWORD_HASH`.
- **`JWT_SECRET`** — troque por um valor aleatório forte em produção (mín.
  32 caracteres; gere com
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- **`SLOT_STEP_MINUTES`** — granularidade da grade de horários oferecida
  (padrão 20min). Não precisa bater com a duração de nenhum serviço.

## 4. Prevenção de double-booking (como funciona de verdade)

Existem **duas camadas**, e isso é importante — a primeira sozinha não é
suficiente sob concorrência real:

1. **Aplicação** (`appointments.service.ts`): antes do `INSERT`, a criação
   roda dentro de uma transação `Serializable` que confere expediente,
   pausa, bloqueios e agendamentos existentes.
2. **Banco de dados** (migration
   `prisma/migrations/000002_add_overlap_constraint`): cria uma constraint
   `EXCLUDE USING gist` sobre uma coluna gerada `tstzrange`, que faz o
   próprio Postgres **rejeitar atomicamente** qualquer INSERT/UPDATE cujo
   intervalo `[dataHoraInicio, dataHoraFim)` se sobreponha a outro
   agendamento `PENDENTE`/`CONFIRMADO`.

A camada 2 é a garantia real: é ela quem resolve a corrida entre duas
requisições simultâneas tentando reservar exatamente o mesmo horário — a
checagem da aplicação sozinha (`SELECT` seguido de `INSERT`) é vulnerável a
essa corrida, mesmo dentro de uma transação, dependendo do isolation level e
do driver. Quando a constraint dispara, a API captura o erro do Postgres e
responde `409 Conflict` com uma mensagem amigável
(`src/utils/prisma-errors.util.ts`).

> ⚠️ Isso exige a extensão `btree_gist` no Postgres (a migration já faz
> `CREATE EXTENSION IF NOT EXISTS btree_gist`). O usuário do banco precisa
> ter permissão para criar extensões — em bancos gerenciados (RDS, Supabase,
> Neon etc.) normalmente já vem habilitada ou pode ser ativada pelo painel.

## 5. Fuso horário

Toda a lógica de negócio (expediente, pausa, disponibilidade) é pensada em
`America/Sao_Paulo`. O Postgres guarda tudo em UTC (`timestamptz`).
`src/utils/time.util.ts` é a única fronteira de conversão entre os dois
mundos — nenhum outro arquivo deveria fazer `new Date()` "cru" para lógica
de agenda.

## 6. Normalização do WhatsApp

`src/utils/phone.util.ts` aceita o número em qualquer formato comum
(`(61) 90000-0000`, `+55 61 90000-0000`, `61990000000`...) e sempre devolve
`55DDDNUMERO` (só dígitos). A decisão de "já tem código do país" é feita
pela **quantidade de dígitos**, não só pelo prefixo `"55"` — porque `55`
também é um DDD válido (região de Santa Maria/RS), o que geraria
ambiguidade se a checagem fosse só pelo prefixo.

## 7. Endpoints

### Públicos

#### `GET /api/services`
Lista os serviços ativos.
```json
{ "services": [ { "id": "...", "nome": "Corte Afro Signature", "preco": 60, "duracaoMinutos": 45, "ativo": true } ] }
```

#### `GET /api/availability?date=YYYY-MM-DD&serviceId=<uuid>`
Retorna os horários livres para aquele serviço naquele dia.
```json
{ "date": "2026-08-05", "serviceId": "...", "slots": ["09:00", "09:20", "10:40"] }
```

#### `POST /api/appointments`
Cria o agendamento (status inicial `PENDENTE`) e devolve o link do WhatsApp
já preenchido para o cliente confirmar com o barbeiro.

Request:
```json
{
  "clienteNome": "Ana Souza",
  "clienteWhatsapp": "(61) 90000-0000",
  "serviceId": "5f2c...",
  "data": "2026-08-05",
  "hora": "09:20"
}
```

Response `201`:
```json
{
  "appointment": { "id": "...", "status": "PENDENTE", "dataHoraInicio": "...", "...": "..." },
  "whatsappConfirmationUrl": "https://wa.me/5561999999999?text=..."
}
```

Se o horário já tiver sido reservado por outro cliente entre a checagem e o
commit, a resposta é `409 Conflict`.

### Painel do barbeiro (JWT)

#### `POST /api/auth/login`
```json
{ "email": "mateus@barbeirodafavela.com", "senha": "..." }
```
Retorna `{ "token": "..." }`. Envie esse token como
`Authorization: Bearer <token>` nas rotas abaixo.

#### `GET /api/admin/appointments?date=YYYY-MM-DD`
Agenda completa do dia (qualquer status).

#### `PATCH /api/admin/appointments/:id/status`
```json
{ "status": "CONFIRMADO" }
```
Valores aceitos: `PENDENTE`, `CONFIRMADO`, `CANCELADO`, `CONCLUIDO`.

#### `POST /api/admin/blocked-slots`
Bloqueia um horário ou o dia inteiro (folga, imprevisto).
```json
{
  "dataInicio": "2026-08-10T00:00:00-03:00",
  "dataFim": "2026-08-10T23:59:59-03:00",
  "motivo": "Folga"
}
```

Bônus (para o bloqueio ser gerenciável de fato num painel):
- `GET /api/admin/blocked-slots` — lista bloqueios.
- `DELETE /api/admin/blocked-slots/:id` — remove um bloqueio.

## 8. Estrutura de pastas

```
src/
  app.ts                 # montagem do Express + middlewares globais
  server.ts              # bootstrap/listen
  config/                # env validado (Zod) + client do Prisma
  middlewares/            # auth (JWT), validate (Zod), error handler
  modules/
    services/             # GET /api/services
    availability/          # cálculo de horários livres (núcleo da regra de negócio)
    appointments/          # POST /api/appointments + service de criação
    auth/                  # login do painel
    admin/                 # agenda do dia, status, bloqueios
  utils/
    time.util.ts           # fronteira de fuso horário
    phone.util.ts          # normalização de WhatsApp
    whatsapp-link.util.ts  # geração do link wa.me
    prisma-errors.util.ts  # detecção da violação da constraint de overlap
    AppError.ts
prisma/
  schema.prisma
  seed.ts
  migrations/
    000001_init/                      # tabelas base
    000002_add_overlap_constraint/    # EXCLUDE constraint (double-booking)
```

## 9. Segurança e produção (auditoria)

O que já está implementado no código:

| Item | Onde |
|---|---|
| Helmet (headers de segurança, remove `X-Powered-By`) | `src/app.ts` |
| CORS restrito por env (`CORS_ORIGIN`), obrigatório em produção | `src/app.ts`, `src/config/env.ts` |
| Rate limit — login (5/15min), agendamento (10/min), admin (120/min), leitura pública (120/min) | `src/app.ts` |
| `trust proxy` habilitado (IP real do cliente atrás de reverse proxy) | `src/app.ts` |
| Limite de tamanho do body (`15kb`) | `src/app.ts` |
| Validação de payload com Zod em toda rota | `src/middlewares/validate.middleware.ts` + `*.schema.ts` |
| Validação de env vars com Zod, com checagens extras em produção (JWT_SECRET fraco/placeholder, hash bcrypt inválido, número de WhatsApp de exemplo, CORS_ORIGIN vazio ou `*`) | `src/config/env.ts` |
| Erros: stack trace só aparece com `NODE_ENV=development`; mensagens genéricas em produção; nenhum segredo (`JWT_SECRET`, `ADMIN_PASSWORD_HASH`) é logado ou retornado em resposta | `src/middlewares/error.middleware.ts` |
| Comparação de senha sempre roda (mesmo com e-mail errado) — evita vazar por tempo de resposta se um e-mail é o do admin | `src/modules/auth/auth.service.ts` |
| `uncaughtException` / `unhandledRejection` derrubam o processo de forma controlada (deixe o orquestrador reiniciar) | `src/server.ts` |
| Prevenção de double-booking (transação Serializable + EXCLUDE constraint) — **não alterado nesta auditoria** | `src/modules/appointments/appointments.service.ts`, migration `000002` |

## 10. HTTPS / reverse proxy

Esta API **não termina TLS sozinha** (não há HTTPS embutido no Express) —
isso é proposital: em produção, o certificado/HTTPS deve ficar por conta de
um reverse proxy na frente (Nginx, Caddy, ou o load balancer da própria
plataforma — Render, Railway, Fly.io, ECS/ALB etc. já fazem isso). O que a
API já faz para funcionar corretamente nesse cenário:

- `app.set('trust proxy', 1)` — para o rate limit e qualquer log de IP
  usarem o IP real do cliente (`X-Forwarded-For`), não o do proxy.
- Não define nenhuma URL absoluta `http://` fixa nas respostas (o link do
  WhatsApp é `https://wa.me/...`, sempre absoluto por natureza).

Exemplo mínimo de bloco Nginx (ajuste domínio/paths):
```nginx
server {
  listen 443 ssl;
  server_name api.barbeariamateuskili.com;

  ssl_certificate     /etc/letsencrypt/live/api.barbeariamateuskili.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.barbeariamateuskili.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 11. O que fica para uma próxima etapa (fora do escopo pedido)

- Multi-barbeiro (hoje o schema e a auth assumem intencionalmente um único
  profissional, como pedido).
- Envio automático de mensagem via WhatsApp Business API — hoje o fluxo é
  client-side: o cliente confirma via `wa.me`.
- Reenvio de lembrete automático antes do horário.
- Testes automatizados (unitários para `availability.service` e de
  integração para o fluxo de criação de agendamento).
