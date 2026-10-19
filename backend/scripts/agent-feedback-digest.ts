import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- AGENT FEEDBACK DIGEST ---');
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Fetch unread/unprocessed feedbacks received in the last 48 hours
  const feedbacks = await prisma.feedback.findMany({
    where: {
      createdAt: { gte: fortyEightHoursAgo },
      processedByAgent: false,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Feedbacks pendentes encontrados (últimas 48h): ${feedbacks.length}`);

  if (feedbacks.length === 0) {
    console.log('Nenhum feedback pendente para processar.');
    return;
  }

  // Group by pageContext
  const groupedByContext: Record<string, typeof feedbacks> = {};
  for (const fb of feedbacks) {
    const ctx = fb.pageContext || 'GLOBAL/DESCONHECIDO';
    if (!groupedByContext[ctx]) {
      groupedByContext[ctx] = [];
    }
    groupedByContext[ctx].push(fb);
  }

  console.log('\n=== RELATÓRIO DE FEEDBACKS POR CONTEXTO ===\n');
  for (const [context, items] of Object.entries(groupedByContext)) {
    console.log(`📌 Contexto: ${context} (${items.length} feedbacks)`);
    for (const item of items) {
      const userStr = item.user ? item.user.email : 'Usuário Anônimo';
      console.log(`  - [${item.createdAt.toISOString()}] (${userStr}): ${item.message}`);
    }
    console.log('');
  }

  // Mark all processed feedbacks as processedByAgent = true
  const ids = feedbacks.map((f) => f.id);
  await prisma.feedback.updateMany({
    where: { id: { in: ids } },
    data: { processedByAgent: true },
  });

  console.log(`✅ ${ids.length} feedbacks marcados como processados com sucesso.`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar agent-feedback-digest:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
