import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ------------------------------------------------------------------
  // Serviços — catálogo real informado pelo Mateus.
  //
  // Observações:
  // - Onde o preço é uma faixa ("a partir de X até Y"), o campo `preco`
  //   (numérico único no schema) guarda o valor inicial, e a faixa/critério
  //   completo fica descrito em `descricao` — é o cliente/barbeiro quem
  //   fecha o valor final na conversa do WhatsApp.
  // - As durações (`duracaoMinutos`) não foram informadas; usei estimativas
  //   padrão de barbearia como ponto de partida. Ajuste os números abaixo
  //   (ou depois direto no banco/painel) se algum serviço demorar mais ou
  //   menos que isso na prática — a duração é o que define o tamanho do
  //   intervalo bloqueado na agenda para aquele serviço.
  // ------------------------------------------------------------------
  const services = [
    { nome: 'Corte masculino', descricao: 'Corte masculino tradicional.', preco: 40, duracaoMinutos: 30 },
    { nome: 'Corte feminino', descricao: 'Corte feminino.', preco: 50, duracaoMinutos: 40 },
    {
      nome: 'Corte feminino na tesoura + máquina',
      descricao: 'Corte feminino combinando tesoura e máquina.',
      preco: 80,
      duracaoMinutos: 60,
    },
    { nome: 'Corte Black', descricao: 'Corte Black.', preco: 50, duracaoMinutos: 40 },
    { nome: 'Flat Top', descricao: 'Flat Top.', preco: 50, duracaoMinutos: 40 },
    { nome: 'Barba', descricao: 'Barba.', preco: 40, duracaoMinutos: 20 },
    {
      nome: 'Hair Tattoo',
      descricao: 'A partir de R$ 150,00 até R$ 350,00, dependendo do trabalho.',
      preco: 150,
      duracaoMinutos: 90,
    },
    { nome: 'Pezinho', descricao: 'Pezinho.', preco: 10, duracaoMinutos: 15 },
    {
      nome: 'Coloração',
      descricao: 'A partir de R$ 100,00, dependendo do tamanho e tipo de cabelo.',
      preco: 100,
      duracaoMinutos: 60,
    },
  ];

  for (const service of services) {
    // Service.nome não é @unique no schema, então evitamos duplicar em
    // reexecuções do seed checando existência antes de criar/atualizar.
    const exists = await prisma.service.findFirst({ where: { nome: service.nome } });
    if (exists) {
      await prisma.service.update({ where: { id: exists.id }, data: { ...service, ativo: true } });
    } else {
      await prisma.service.create({ data: service });
    }
  }

  // Catálogo antigo (placeholder) que este seed criava antes — não faz mais
  // parte dos procedimentos reais do Mateus. Em vez de excluir (o que
  // quebraria agendamentos antigos que apontam pra esses serviços via FK),
  // só desativamos: eles somem de GET /api/services mas o histórico
  // continua íntegro.
  const descontinuados = ['Corte Afro Signature', 'Cortes Coloridos', 'Arte Capilar'];
  await prisma.service.updateMany({
    where: { nome: { in: descontinuados } },
    data: { ativo: false },
  });

  // ------------------------------------------------------------------
  // Horário de funcionamento — segunda a sábado, 9h às 18h, domingo fechado.
  // ------------------------------------------------------------------
  const businessHours = [
    { diaSemana: 0, horaAbertura: '09:00', horaFechamento: '18:00', pausaInicio: null, pausaFim: null, fechado: true },
    { diaSemana: 1, horaAbertura: '09:00', horaFechamento: '18:00', pausaInicio: null, pausaFim: null, fechado: false },
    { diaSemana: 2, horaAbertura: '09:00', horaFechamento: '18:00', pausaInicio: null, pausaFim: null, fechado: false },
    { diaSemana: 3, horaAbertura: '09:00', horaFechamento: '18:00', pausaInicio: null, pausaFim: null, fechado: false },
    { diaSemana: 4, horaAbertura: '09:00', horaFechamento: '18:00', pausaInicio: null, pausaFim: null, fechado: false },
    { diaSemana: 5, horaAbertura: '09:00', horaFechamento: '18:00', pausaInicio: null, pausaFim: null, fechado: false },
    { diaSemana: 6, horaAbertura: '09:00', horaFechamento: '18:00', pausaInicio: null, pausaFim: null, fechado: false },
  ];

  for (const bh of businessHours) {
    await prisma.businessHours.upsert({
      where: { diaSemana: bh.diaSemana },
      update: bh,
      create: bh,
    });
  }

  console.log('Seed concluído: serviços e horário de funcionamento configurados.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
