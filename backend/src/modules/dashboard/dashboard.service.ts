import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { DashboardLockedException } from '../../common/exceptions/app.exception';
import { DashboardViewType, QueryDashboardDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(userId: string, query: QueryDashboardDto) {
    // 1. Validar se o usuário tem o Dashboard desbloqueado (DEC-05, RF-06, RF-10)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dashboardUnlocked: true },
    });

    if (!user || !user.dashboardUnlocked) {
      throw new DashboardLockedException();
    }

    // 2. Buscar todos os anos e meses que possuem movimentações financeiras REAIS (Transaction)
    // Declarações "Não tenho esse gasto" jamais contam como movimentação nem alteram gráficos (DEC-32, RF-10, RF-16)
    const realTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      select: {
        amountCents: true,
        type: true,
        transactionDate: true,
        sheet: {
          select: {
            year: true,
            month: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Mapear períodos disponíveis que têm transações reais
    const periodsMap = new Map<number, Set<number>>();
    realTransactions.forEach((tx) => {
      const y = tx.sheet.year;
      const m = tx.sheet.month;
      if (!periodsMap.has(y)) {
        periodsMap.set(y, new Set<number>());
      }
      periodsMap.get(y)!.add(m);
    });

    const availablePeriods = Array.from(periodsMap.entries())
      .map(([year, monthsSet]) => ({
        year,
        months: Array.from(monthsSet).sort((a, b) => a - b),
      }))
      .sort((a, b) => b.year - a.year);

    // Se o usuário não tem nenhuma transação real ainda (desbloqueou apenas com declarações)
    if (realTransactions.length === 0 || availablePeriods.length === 0) {
      return {
        availablePeriods: [],
        currentPeriod: {
          view: query.view || DashboardViewType.MONTHLY,
          year: query.year || new Date().getFullYear(),
          month: query.month || new Date().getMonth() + 1,
        },
        incomeCents: 0,
        expenseCents: 0,
        balanceCents: 0,
        expensesByCategory: [],
        monthlyComparison: [],
        hasData: false,
      };
    }

    const currentYear = query.year || availablePeriods[0].year;
    const currentMonth =
      query.month ||
      (availablePeriods.find((p) => p.year === currentYear)?.months.slice(-1)[0] ??
        1);

    const view = query.view || DashboardViewType.MONTHLY;

    let filteredTransactions = realTransactions;

    if (view === DashboardViewType.MONTHLY) {
      filteredTransactions = realTransactions.filter(
        (tx) => tx.sheet.year === currentYear && tx.sheet.month === currentMonth
      );
    } else {
      // ANNUAL view: agrupa todas as transações reais daquele ano
      filteredTransactions = realTransactions.filter(
        (tx) => tx.sheet.year === currentYear
      );
    }

    // Calcular somatórios de receitas, despesas e saldo em centavos
    let incomeCents = 0;
    let expenseCents = 0;

    const categoryExpenseMap = new Map<string, { categoryId: string; categoryName: string; amountCents: number }>();

    filteredTransactions.forEach((tx) => {
      if (tx.type === TransactionType.INCOME) {
        incomeCents += tx.amountCents;
      } else {
        expenseCents += tx.amountCents;
        const catId = tx.category.id;
        if (!categoryExpenseMap.has(catId)) {
          categoryExpenseMap.set(catId, {
            categoryId: catId,
            categoryName: tx.category.name,
            amountCents: 0,
          });
        }
        categoryExpenseMap.get(catId)!.amountCents += tx.amountCents;
      }
    });

    const balanceCents = incomeCents - expenseCents;

    // Despesas por Categoria com percentual
    const expensesByCategory = Array.from(categoryExpenseMap.values())
      .map((item) => ({
        ...item,
        percentage:
          expenseCents > 0
            ? Math.round((item.amountCents / expenseCents) * 100)
            : 0,
      }))
      .sort((a, b) => b.amountCents - a.amountCents);

    // Comparativo mensal dos 12 meses do ano selecionado para gráficos de barras
    const monthlyComparison = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthTxs = realTransactions.filter(
        (tx) => tx.sheet.year === currentYear && tx.sheet.month === monthNum
      );
      let mIncome = 0;
      let mExpense = 0;
      monthTxs.forEach((tx) => {
        if (tx.type === TransactionType.INCOME) mIncome += tx.amountCents;
        else mExpense += tx.amountCents;
      });
      return {
        month: monthNum,
        incomeCents: mIncome,
        expenseCents: mExpense,
        balanceCents: mIncome - mExpense,
      };
    });

    return {
      availablePeriods,
      currentPeriod: {
        view,
        year: currentYear,
        month: currentMonth,
      },
      incomeCents,
      expenseCents,
      balanceCents,
      expensesByCategory,
      monthlyComparison,
      hasData: filteredTransactions.length > 0,
    };
  }
}
