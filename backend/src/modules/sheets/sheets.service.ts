import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSheetDto } from './dto/sheet.dto';
import {
  SheetAlreadyExistsException,
  SheetNotFoundException,
  ConfirmationRequiredException,
  TransactionNotFoundException,
  InvalidTransactionDateException,
  CategoryNotFoundException,
  CategoryTypeMismatchException,
  EssentialCategoryRequiredException,
  DeclarationBlockedByExistingExpenseException,
} from '../../common/exceptions/app.exception';

@Injectable()
export class SheetsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSheets(userId: string, yearParam?: number) {
    const currentYear = new Date().getFullYear();
    const targetYear = yearParam || currentYear;

    // 1. Get all distinct years where user has sheets
    const userSheets = await this.prisma.monthlySheet.findMany({
      where: { userId },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    const yearsWithSheets = userSheets.map((s) => s.year);
    if (!yearsWithSheets.includes(currentYear)) {
      yearsWithSheets.unshift(currentYear);
    }
    yearsWithSheets.sort((a, b) => b - a);

    // 2. Get existing sheets for targetYear with transaction and declaration count
    const sheetsInYear = await this.prisma.monthlySheet.findMany({
      where: { userId, year: targetYear },
      include: {
        transactions: {
          select: { id: true, categoryId: true },
        },
        essentialDeclarations: {
          select: { id: true, categoryId: true },
        },
      },
      orderBy: { month: 'asc' },
    });

    // 3. Find 5 system essential category IDs
    const essentialCategories = await this.prisma.category.findMany({
      where: { isSystem: true, isEssential: true },
      select: { id: true },
    });
    const essentialCategoryIds = new Set(essentialCategories.map((c) => c.id));

    const existingSheets = sheetsInYear.map((sheet) => {
      const hasRealTransactions = sheet.transactions.length > 0;

      // Count completed essentials in this sheet
      const completedEssentialCategories = new Set<string>();
      sheet.transactions.forEach((tx) => {
        if (essentialCategoryIds.has(tx.categoryId)) {
          completedEssentialCategories.add(tx.categoryId);
        }
      });
      sheet.essentialDeclarations.forEach((decl) => {
        if (essentialCategoryIds.has(decl.categoryId)) {
          completedEssentialCategories.add(decl.categoryId);
        }
      });

      return {
        id: sheet.id,
        year: sheet.year,
        month: sheet.month,
        recurrencePromptDismissed: sheet.recurrencePromptDismissed,
        hasRealTransactions,
        essentialProgress: {
          completed: completedEssentialCategories.size,
          total: 5,
        },
        createdAt: sheet.createdAt,
        updatedAt: sheet.updatedAt,
      };
    });

    // 4. Calculate available months to create in this year (1 to 12)
    const existingMonthNumbers = new Set(existingSheets.map((s) => s.month));
    const availableMonthsToCreate: number[] = [];
    for (let m = 1; m <= 12; m++) {
      if (!existingMonthNumbers.has(m)) {
        availableMonthsToCreate.push(m);
      }
    }

    return {
      yearsWithSheets,
      existingSheets,
      availableMonthsToCreate,
    };
  }

  async createSheet(userId: string, dto: CreateSheetDto) {
    const existing = await this.prisma.monthlySheet.findUnique({
      where: {
        userId_year_month: {
          userId,
          year: dto.year,
          month: dto.month,
        },
      },
    });

    if (existing) {
      throw new SheetAlreadyExistsException(
        `Já existe uma planilha para o mês ${dto.month}/${dto.year}`
      );
    }

    const sheet = await this.prisma.monthlySheet.create({
      data: {
        userId,
        year: dto.year,
        month: dto.month,
      },
      select: {
        id: true,
        year: true,
        month: true,
        recurrencePromptDismissed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sheet;
  }

  async getSheetDetail(userId: string, year: number, month: number) {
    const sheet = await this.prisma.monthlySheet.findUnique({
      where: {
        userId_year_month: {
          userId,
          year,
          month,
        },
      },
      include: {
        transactions: {
          include: {
            category: {
              select: { id: true, name: true, type: true, isEssential: true },
            },
          },
          orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        },
        essentialDeclarations: {
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!sheet) {
      throw new SheetNotFoundException();
    }

    // Calculate Summary in cents
    let incomeCents = 0;
    let expenseCents = 0;

    sheet.transactions.forEach((tx) => {
      if (tx.type === TransactionType.INCOME) {
        incomeCents += tx.amountCents;
      } else {
        expenseCents += tx.amountCents;
      }
    });

    const balanceCents = incomeCents - expenseCents;

    // Get 5 essential categories to check completion status
    const essentialCategories = await this.prisma.category.findMany({
      where: { isSystem: true, isEssential: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const essentialsStatus = essentialCategories.map((cat) => {
      const realTx = sheet.transactions.find((tx) => tx.categoryId === cat.id);
      const decl = sheet.essentialDeclarations.find((d) => d.categoryId === cat.id);

      if (realTx) {
        return {
          categoryId: cat.id,
          name: cat.name,
          isFilled: true,
          filledBy: 'TRANSACTION',
          amountCents: realTx.amountCents,
        };
      }
      if (decl) {
        return {
          categoryId: cat.id,
          name: cat.name,
          isFilled: true,
          filledBy: 'DECLARATION',
          amountCents: 0,
        };
      }
      return {
        categoryId: cat.id,
        name: cat.name,
        isFilled: false,
        filledBy: null,
        amountCents: null,
      };
    });

    return {
      sheet: {
        id: sheet.id,
        year: sheet.year,
        month: sheet.month,
        recurrencePromptDismissed: sheet.recurrencePromptDismissed,
        createdAt: sheet.createdAt,
        updatedAt: sheet.updatedAt,
      },
      summary: {
        incomeCents,
        expenseCents,
        balanceCents,
      },
      essentialsStatus,
      transactions: sheet.transactions,
      pendingRecurrences: [],
    };
  }

  async deleteSheet(userId: string, sheetId: string, confirm = false) {
    if (!confirm) {
      throw new ConfirmationRequiredException(
        'Confirmação explícita é obrigatória (?confirm=true) para excluir a planilha'
      );
    }

    const sheet = await this.prisma.monthlySheet.findUnique({
      where: { id: sheetId },
    });

    if (!sheet || sheet.userId !== userId) {
      throw new SheetNotFoundException();
    }

    // Atomic cascade deletion: delete transactions and declarations in this sheet
    // Recurrence rules are preserved for other months as per RF-13/DEC-07
    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { sheetId, userId },
      });

      await tx.essentialDeclaration.deleteMany({
        where: { sheetId, userId },
      });

      await tx.monthlySheet.delete({
        where: { id: sheetId },
      });
    });
  }

  // --- MÉTODOS DO ÉPICO 3: TRANSAÇÕES E DECLARAÇÕES ESSENCIAIS ---

  async addTransaction(userId: string, sheetId: string, dto: import('./dto/transaction.dto').CreateTransactionDto) {
    const sheet = await this.prisma.monthlySheet.findUnique({
      where: { id: sheetId },
    });

    if (!sheet || sheet.userId !== userId) {
      throw new SheetNotFoundException();
    }

    // 1. Validar correspondência estrita de ano e mês (DEC-14, DEC-31)
    const [yearStr, monthStr, dayStr] = dto.transactionDate.split('-');
    const txYear = parseInt(yearStr, 10);
    const txMonth = parseInt(monthStr, 10);
    const txDay = parseInt(dayStr, 10);

    if (txYear !== sheet.year || txMonth !== sheet.month) {
      throw new InvalidTransactionDateException(
        `A data do lançamento (${dto.transactionDate}) deve pertencer ao mês e ano da planilha (${sheet.month}/${sheet.year})`
      );
    }

    // 2. Validar existência e tipo da categoria (DEC-10, DEC-35)
    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        OR: [{ userId }, { isSystem: true }],
      },
    });

    if (!category) {
      throw new CategoryNotFoundException();
    }

    if (category.type !== dto.type) {
      throw new CategoryTypeMismatchException(
        `A categoria "${category.name}" é do tipo ${category.type}, incompatível com a movimentação ${dto.type}`
      );
    }

    // 3. Execução em transação atômica: criação de recorrência (se isRecurring), transação e remoção automática de declaração (DEC-12)
    const dateObj = new Date(Date.UTC(txYear, txMonth - 1, txDay, 12, 0, 0));

    let removedDeclaration = false;
    let createdTransaction: any = null;

    await this.prisma.$transaction(async (tx) => {
      let recurrenceRuleId: string | null = null;

      if (dto.isRecurring) {
        const rule = await tx.recurrenceRule.create({
          data: {
            userId,
            categoryId: dto.categoryId,
            type: dto.type,
            description: dto.description,
            amountCents: dto.amountCents,
            notes: dto.notes,
            dayOfMonth: txDay,
            startYear: sheet.year,
            startMonth: sheet.month,
            isActive: true,
          },
        });
        recurrenceRuleId = rule.id;
      }

      createdTransaction = await tx.transaction.create({
        data: {
          userId,
          sheetId,
          categoryId: dto.categoryId,
          recurrenceRuleId,
          description: dto.description,
          amountCents: dto.amountCents,
          type: dto.type,
          transactionDate: dateObj,
          notes: dto.notes,
        },
        include: {
          category: {
            select: { id: true, name: true, type: true, isEssential: true },
          },
          recurrenceRule: {
            select: { id: true, isActive: true },
          },
        },
      });

      // Transição automática: se for despesa real em categoria essencial e houver declaração "Não tenho esse gasto", remove (DEC-12)
      if (dto.type === TransactionType.EXPENSE && category.isEssential) {
        const deletedDecl = await tx.essentialDeclaration.deleteMany({
          where: {
            sheetId,
            categoryId: dto.categoryId,
          },
        });
        if (deletedDecl.count > 0) {
          removedDeclaration = true;
        }
      }
    });

    // 4. Checar se as 5 essenciais foram concluídas para desbloquear permanentemente o Dashboard (DEC-05)
    const dashboardUnlockedNow = await this.checkAndUnlockDashboard(userId, sheetId);

    return {
      transaction: createdTransaction,
      removedDeclaration,
      dashboardUnlockedNow,
    };
  }

  async updateTransaction(userId: string, transactionId: string, dto: import('./dto/transaction.dto').UpdateTransactionDto) {
    const existingTx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        sheet: true,
        category: true,
      },
    });

    if (!existingTx || existingTx.userId !== userId) {
      throw new TransactionNotFoundException();
    }

    const sheet = existingTx.sheet;

    // 1. Validar correspondência de data caso fornecida
    let dateObj = existingTx.transactionDate;
    if (dto.transactionDate) {
      const [yearStr, monthStr, dayStr] = dto.transactionDate.split('-');
      const txYear = parseInt(yearStr, 10);
      const txMonth = parseInt(monthStr, 10);
      const txDay = parseInt(dayStr, 10);

      if (txYear !== sheet.year || txMonth !== sheet.month) {
        throw new InvalidTransactionDateException(
          `A data do lançamento (${dto.transactionDate}) deve pertencer ao mês e ano da planilha (${sheet.month}/${sheet.year})`
        );
      }
      dateObj = new Date(Date.UTC(txYear, txMonth - 1, txDay, 12, 0, 0));
    }

    // 2. Validar categoria se fornecida
    let category = existingTx.category;
    if (dto.categoryId && dto.categoryId !== existingTx.categoryId) {
      const newCategory = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          OR: [{ userId }, { isSystem: true }],
        },
      });

      if (!newCategory) {
        throw new CategoryNotFoundException();
      }

      if (newCategory.type !== existingTx.type) {
        throw new CategoryTypeMismatchException(
          `A categoria "${newCategory.name}" é do tipo ${newCategory.type}, incompatível com a movimentação ${existingTx.type}`
        );
      }
      category = newCategory;
    }

    let recurrenceDeactivated = false;

    // 3. Atualizar atomicamente
    let updatedTx: any = null;
    await this.prisma.$transaction(async (tx) => {
      // Se tiver regra de recorrência e isRecurring foi explicitamente desmarcado (false), desativa a regra para os próximos meses (DEC-15)
      if (existingTx.recurrenceRuleId && dto.isRecurring === false) {
        await tx.recurrenceRule.update({
          where: { id: existingTx.recurrenceRuleId },
          data: { isActive: false },
        });
        recurrenceDeactivated = true;
      }

      updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          description: dto.description ?? existingTx.description,
          amountCents: dto.amountCents ?? existingTx.amountCents,
          categoryId: dto.categoryId ?? existingTx.categoryId,
          transactionDate: dateObj,
          notes: dto.notes !== undefined ? dto.notes : existingTx.notes,
        },
        include: {
          category: {
            select: { id: true, name: true, type: true, isEssential: true },
          },
          recurrenceRule: {
            select: { id: true, isActive: true },
          },
        },
      });

      // Se mudou para categoria essencial de despesa, remove declaração de ausência se houver
      if (existingTx.type === TransactionType.EXPENSE && category.isEssential) {
        await tx.essentialDeclaration.deleteMany({
          where: {
            sheetId: sheet.id,
            categoryId: category.id,
          },
        });
      }
    });

    const dashboardUnlockedNow = await this.checkAndUnlockDashboard(userId, sheet.id);

    return {
      transaction: updatedTx,
      recurrenceDeactivated,
      dashboardUnlockedNow,
    };
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || transaction.userId !== userId) {
      throw new TransactionNotFoundException();
    }

    await this.prisma.transaction.delete({
      where: { id: transactionId },
    });
  }

  async addEssentialDeclaration(userId: string, sheetId: string, dto: import('./dto/transaction.dto').CreateEssentialDeclarationDto) {
    const sheet = await this.prisma.monthlySheet.findUnique({
      where: { id: sheetId },
    });

    if (!sheet || sheet.userId !== userId) {
      throw new SheetNotFoundException();
    }

    // 1. Categoria deve ser do sistema e essencial (RF-09, DEC-12)
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category || !category.isSystem || !category.isEssential || category.type !== TransactionType.EXPENSE) {
      throw new EssentialCategoryRequiredException(
        'Apenas as 5 categorias essenciais de despesa aceitam declaração de ausência de gasto'
      );
    }

    // 2. Não pode haver despesa real nesta categoria e mês (DEC-12)
    const existingExpense = await this.prisma.transaction.findFirst({
      where: {
        sheetId,
        categoryId: dto.categoryId,
        type: TransactionType.EXPENSE,
      },
    });

    if (existingExpense) {
      throw new DeclarationBlockedByExistingExpenseException(
        `Não é possível declarar "Não tenho esse gasto" para "${category.name}" pois já existe um lançamento de R$ ${(existingExpense.amountCents / 100).toFixed(2)} registrado neste mês.`
      );
    }

    // 3. Criação idempotente (upsert)
    const declaration = await this.prisma.essentialDeclaration.upsert({
      where: {
        sheetId_categoryId: {
          sheetId,
          categoryId: dto.categoryId,
        },
      },
      create: {
        userId,
        sheetId,
        categoryId: dto.categoryId,
      },
      update: {},
    });

    // 4. Checar se as 5 essenciais foram concluídas para desbloqueio permanente do Dashboard (DEC-05)
    const dashboardUnlockedNow = await this.checkAndUnlockDashboard(userId, sheetId);

    return {
      declarationId: declaration.id,
      dashboardUnlockedNow,
    };
  }

  async removeEssentialDeclaration(userId: string, sheetId: string, categoryId: string) {
    const sheet = await this.prisma.monthlySheet.findUnique({
      where: { id: sheetId },
    });

    if (!sheet || sheet.userId !== userId) {
      throw new SheetNotFoundException();
    }

    await this.prisma.essentialDeclaration.deleteMany({
      where: {
        sheetId,
        categoryId,
        userId,
      },
    });
  }

  /**
   * Checa se todas as 5 categorias essenciais foram preenchidas nesta planilha.
   * Se sim e o usuário ainda não tiver o dashboard liberado, atualiza `dashboardUnlocked = true` (DEC-05).
   */
  async checkAndUnlockDashboard(userId: string, sheetId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dashboardUnlocked: true },
    });

    if (!user || user.dashboardUnlocked) {
      return false;
    }

    const essentialCategories = await this.prisma.category.findMany({
      where: { isSystem: true, isEssential: true },
      select: { id: true },
    });

    const essentialIds = essentialCategories.map((c) => c.id);

    const [transactions, declarations] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          sheetId,
          categoryId: { in: essentialIds },
          type: TransactionType.EXPENSE,
        },
        select: { categoryId: true },
      }),
      this.prisma.essentialDeclaration.findMany({
        where: {
          sheetId,
          categoryId: { in: essentialIds },
        },
        select: { categoryId: true },
      }),
    ]);

    const completedCategoryIds = new Set<string>();
    transactions.forEach((tx) => completedCategoryIds.add(tx.categoryId));
    declarations.forEach((decl) => completedCategoryIds.add(decl.categoryId));

    const isAllCompleted = essentialIds.every((id) => completedCategoryIds.has(id));

    if (isAllCompleted) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          dashboardUnlocked: true,
          dashboardUnlockedAt: new Date(),
        },
      });
      return true;
    }

    return false;
  }
}

