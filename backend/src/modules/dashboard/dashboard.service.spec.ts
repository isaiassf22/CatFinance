import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardLockedException } from '../../common/exceptions/app.exception';
import { DashboardViewType } from './dto/dashboard.dto';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getDashboardData', () => {
    it('should throw DashboardLockedException (403) when user has dashboardUnlocked = false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        dashboardUnlocked: false,
      });

      await expect(
        service.getDashboardData('user-locked', {
          view: DashboardViewType.MONTHLY,
        })
      ).rejects.toThrow(DashboardLockedException);
    });

    it('should return empty state (hasData: false) when unlocked but without any real transactions (RF-16)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        dashboardUnlocked: true,
      });

      // No transactions
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.getDashboardData('user-unlocked', {
        view: DashboardViewType.MONTHLY,
      });

      expect(result.hasData).toBe(false);
      expect(result.availablePeriods).toHaveLength(0);
      expect(result.incomeCents).toBe(0);
      expect(result.expenseCents).toBe(0);
      expect(result.balanceCents).toBe(0);
    });

    it('should compute monthly summary and expensesByCategory using real transactions in cents', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        dashboardUnlocked: true,
      });

      mockPrismaService.transaction.findMany.mockResolvedValue([
        {
          amountCents: 500000,
          type: 'INCOME',
          transactionDate: new Date('2026-10-05'),
          sheet: { year: 2026, month: 10 },
          category: { id: 'cat-salario', name: 'Salário' },
        },
        {
          amountCents: 150000,
          type: 'EXPENSE',
          transactionDate: new Date('2026-10-10'),
          sheet: { year: 2026, month: 10 },
          category: { id: 'cat-moradia', name: 'Moradia' },
        },
        {
          amountCents: 50000,
          type: 'EXPENSE',
          transactionDate: new Date('2026-10-15'),
          sheet: { year: 2026, month: 10 },
          category: { id: 'cat-alimentacao', name: 'Alimentação' },
        },
      ]);

      const result = await service.getDashboardData('user-unlocked', {
        view: DashboardViewType.MONTHLY,
        year: 2026,
        month: 10,
      });

      expect(result.hasData).toBe(true);
      expect(result.incomeCents).toBe(500000);
      expect(result.expenseCents).toBe(200000);
      expect(result.balanceCents).toBe(300000);
      expect(result.expensesByCategory).toHaveLength(2);
      expect(result.expensesByCategory[0].categoryName).toBe('Moradia');
      expect(result.expensesByCategory[0].percentage).toBe(75);
      expect(result.expensesByCategory[1].categoryName).toBe('Alimentação');
      expect(result.expensesByCategory[1].percentage).toBe(25);
    });

    it('should aggregate all transactions in year for ANNUAL view', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        dashboardUnlocked: true,
      });

      mockPrismaService.transaction.findMany.mockResolvedValue([
        {
          amountCents: 300000,
          type: 'INCOME',
          transactionDate: new Date('2026-01-05'),
          sheet: { year: 2026, month: 1 },
          category: { id: 'cat-salario', name: 'Salário' },
        },
        {
          amountCents: 300000,
          type: 'INCOME',
          transactionDate: new Date('2026-02-05'),
          sheet: { year: 2026, month: 2 },
          category: { id: 'cat-salario', name: 'Salário' },
        },
        {
          amountCents: 100000,
          type: 'EXPENSE',
          transactionDate: new Date('2026-01-10'),
          sheet: { year: 2026, month: 1 },
          category: { id: 'cat-moradia', name: 'Moradia' },
        },
      ]);

      const result = await service.getDashboardData('user-unlocked', {
        view: DashboardViewType.ANNUAL,
        year: 2026,
      });

      expect(result.hasData).toBe(true);
      expect(result.incomeCents).toBe(600000);
      expect(result.expenseCents).toBe(100000);
      expect(result.balanceCents).toBe(500000);
    });
  });
});
