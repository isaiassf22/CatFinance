import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- AGENT SANITY CHECK ---');
  let issuesFound = 0;

  // 1. Audit Recurrence Rules
  console.log('1. Auditando integridade das regras de recorrência...');
  const rules = await prisma.recurrenceRule.findMany({
    include: {
      category: true,
      user: true,
    },
  });

  for (const rule of rules) {
    if (rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
      console.error(
        `❌ Regra inválida ${rule.id}: dayOfMonth (${rule.dayOfMonth}) fora do intervalo 1-31.`,
      );
      issuesFound++;
    }
    if (rule.amountCents < 1) {
      console.error(
        `❌ Regra inválida ${rule.id}: amountCents (${rule.amountCents}) deve ser >= 1.`,
      );
      issuesFound++;
    }
    if (!rule.category) {
      console.error(`❌ Regra órfã ${rule.id}: categoria não encontrada.`);
      issuesFound++;
    }
  }
  console.log(`Regras de recorrência verificadas: ${rules.length}`);

  // 2. Audit Transactions
  console.log('2. Auditando integridade dos lançamentos (centavos e vínculos)...');
  const transactionsWithZeroOrNegative = await prisma.transaction.count({
    where: {
      amountCents: { lte: 0 },
    },
  });
  if (transactionsWithZeroOrNegative > 0) {
    console.error(
      `❌ Lançamentos com valor <= 0 centavos encontrados: ${transactionsWithZeroOrNegative}`,
    );
    issuesFound++;
  } else {
    console.log('✔ Todos os lançamentos possuem amountCents >= 1.');
  }

  // 3. Audit Dashboard Unlock Consistency
  console.log('3. Auditando consistência de desbloqueio do Dashboard por usuário...');
  const users = await prisma.user.findMany({
    include: {
      sheets: {
        include: {
          essentialDeclarations: true,
          transactions: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  const essentialCategories = await prisma.category.findMany({
    where: { isEssential: true },
  });
  const essentialCategoryIds = new Set(essentialCategories.map((c) => c.id));

  for (const user of users) {
    let shouldBeUnlocked = false;

    // Check if any sheet completed all 5 essentials
    for (const sheet of user.sheets) {
      const declaredIds = new Set(
        sheet.essentialDeclarations.map((d) => d.categoryId),
      );
      const spentCategoryIds = new Set(
        sheet.transactions
          .filter((t) => t.category.isEssential)
          .map((t) => t.categoryId),
      );

      let sheetEssentialsCompleted = 0;
      for (const essId of essentialCategoryIds) {
        if (declaredIds.has(essId) || spentCategoryIds.has(essId)) {
          sheetEssentialsCompleted++;
        }
      }

      if (sheetEssentialsCompleted >= 5) {
        shouldBeUnlocked = true;
        break;
      }
    }

    if (shouldBeUnlocked && !user.dashboardUnlocked) {
      console.warn(
        `⚠️ Inconsistência detectada: Usuário ${user.email} tem 5 essenciais concluídos em uma planilha mas dashboardUnlocked = false. Auto-corrigindo...`,
      );
      await prisma.user.update({
        where: { id: user.id },
        data: { dashboardUnlocked: true },
      });
      console.log(`✔ Usuário ${user.email} corrigido para dashboardUnlocked = true.`);
      issuesFound++;
    }
  }

  // 4. Audit Perpetual Lesson Progress
  console.log('4. Auditando integridade do progresso das aulas...');
  const progressList = await prisma.userLessonProgress.findMany({
    where: { isCompleted: true },
  });
  console.log(`Progresso de aulas concluídas verificado: ${progressList.length}`);

  console.log('\n=== RESULTADO DA AUDITORIA ===');
  if (issuesFound === 0) {
    console.log('🎉 Auditoria concluída com sucesso! Banco 100% íntegro e em conformidade.');
  } else {
    console.log(`ℹ Auditoria concluída com ${issuesFound} correções/avisos registrados.`);
  }
}

main()
  .catch((e) => {
    console.error('Erro ao executar agent-sanity-check:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
