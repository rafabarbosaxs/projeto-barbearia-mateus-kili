-- Esta migration é o que de fato garante, no nível do PostgreSQL, que dois
-- agendamentos "ativos" (não CANCELADO) nunca podem ter intervalos de tempo
-- que se sobrepõem — mesmo sob concorrência real (duas requisições
-- simultâneas tentando reservar o mesmo horário).
--
-- A camada de aplicação (appointments.service.ts) também faz uma checagem
-- antes do INSERT, mas essa checagem sozinha É VULNERÁVEL a race condition
-- (duas transações podem ler "livre" ao mesmo tempo antes de qualquer uma
-- escrever). A EXCLUDE CONSTRAINT abaixo é avaliada pelo próprio Postgres de
-- forma atômica no momento do COMMIT, então ela é a garantia final.

-- Necessário para o operador de exclusão funcionar com o tipo TEXT (serviceId)
-- e para comparar ranges de timestamp com o operador &&.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Coluna gerada: representa o intervalo [dataHoraInicio, dataHoraFim) do
-- agendamento como um tstzrange, para podermos comparar sobreposição com &&.
ALTER TABLE "appointments"
  ADD COLUMN "periodo" tstzrange
  GENERATED ALWAYS AS (tstzrange("dataHoraInicio", "dataHoraFim", '[)')) STORED;

-- A constraint em si: rejeita qualquer INSERT/UPDATE cujo "periodo" tenha
-- interseção (&&) com o "periodo" de outro agendamento cujo status também
-- seja considerado "ativo" (PENDENTE ou CONFIRMADO). Agendamentos CANCELADO
-- ou CONCLUIDO não bloqueiam o horário.
ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_no_overlap"
  EXCLUDE USING gist (
    "periodo" WITH &&
  )
  WHERE (status IN ('PENDENTE', 'CONFIRMADO'));

-- Índice auxiliar (opcional, mas recomendado) para acelerar buscas por
-- sobreposição feitas manualmente pela aplicação antes do INSERT.
CREATE INDEX "appointments_periodo_idx" ON "appointments" USING gist ("periodo");
