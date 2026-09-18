import { env } from './config/env'; // valida e carrega variáveis de ambiente antes de tudo
import { app } from './app';

// Erros que escapam de qualquer try/catch/middleware não devem deixar o
// processo rodando num estado indefinido — melhor logar bem alto e morrer,
// deixando o orquestrador (Docker/PM2/systemd) reiniciar o processo.
process.on('uncaughtException', (err) => {
  console.error('💥 uncaughtException — encerrando processo:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 unhandledRejection — encerrando processo:', reason);
  process.exit(1);
});

const server = app.listen(env.PORT, () => {
  console.log(`🪒 Barbearia Mateus Kili API rodando na porta ${env.PORT} (${env.NODE_ENV})`);
  console.log(`   Fuso horário: ${env.TZ}`);
});

function shutdown(signal: string) {
  console.log(`\nRecebido ${signal}, encerrando servidor...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
