import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSheetDto } from './dto/sheet.dto';
import {
  SheetAlreadyExistsException,
  SheetNotFoundException,
  ConfirmationRequiredException,
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
}
