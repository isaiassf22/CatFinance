import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

export const STANDARD_CATEGORIES = [
  // 5 Despesas Essenciais (type = EXPENSE, isEssential = true)
  { name: 'Moradia', type: TransactionType.EXPENSE, isEssential: true },
  { name: 'Alimentação', type: TransactionType.EXPENSE, isEssential: true },
  { name: 'Transporte', type: TransactionType.EXPENSE, isEssential: true },
  { name: 'Saúde', type: TransactionType.EXPENSE, isEssential: true },
  { name: 'Educação', type: TransactionType.EXPENSE, isEssential: true },

  // 4 Despesas Adicionais (type = EXPENSE, isEssential = false)
  { name: 'Dívidas e cartão de crédito', type: TransactionType.EXPENSE, isEssential: false },
  { name: 'Lazer', type: TransactionType.EXPENSE, isEssential: false },
  { name: 'Cuidados pessoais', type: TransactionType.EXPENSE, isEssential: false },
  { name: 'Outras despesas', type: TransactionType.EXPENSE, isEssential: false },

  // 5 Receitas Padrão (type = INCOME, isEssential = false)
  { name: 'Salário', type: TransactionType.INCOME, isEssential: false },
  { name: 'Investimentos', type: TransactionType.INCOME, isEssential: false },
  { name: 'Pensão/auxílio', type: TransactionType.INCOME, isEssential: false },
  { name: 'Dividendos', type: TransactionType.INCOME, isEssential: false },
  { name: 'Outras receitas', type: TransactionType.INCOME, isEssential: false },
];

export async function main() {
  console.log('Seeding 14 standard system categories...');

  for (const cat of STANDARD_CATEGORIES) {
    const normalizedName = cat.name.trim().toLowerCase();

    // Check if system category already exists (idempotent)
    const existing = await prisma.category.findFirst({
      where: {
        userId: null,
        type: cat.type,
        normalizedName,
      },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          userId: null,
          name: cat.name.trim(),
          normalizedName,
          type: cat.type,
          isSystem: true,
          isEssential: cat.isEssential,
        },
      });
      console.log(` Created standard category: [${cat.type}] ${cat.name}`);
    } else {
      console.log(` Existing standard category: [${cat.type}] ${cat.name}`);
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
