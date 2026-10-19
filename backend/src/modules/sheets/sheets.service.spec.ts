import { Test, TestingModule } from '@nestjs/testing';
import { SheetsService } from './sheets.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SheetAlreadyExistsException,
  SheetNotFoundException,
  ConfirmationRequiredException,
} from '../../common/exceptions/app.exception';

describe('SheetsService', () => {
  let service: SheetsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    monthlySheet: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    recurrenceRule: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    essentialDeclaration: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SheetsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SheetsService>(SheetsService);
  });

  describe('createSheet', () => {
    it('should create sheet when user does not have that year and month', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue(null);
      mockPrismaService.monthlySheet.create.mockResolvedValue({
        id: 'sheet-1',
        year: 2026,
        month: 10,
        recurrencePromptDismissed: false,
      });

      const result = await service.createSheet('user-1', {
        year: 2026,
        month: 10,
      });

      expect(mockPrismaService.monthlySheet.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          year: 2026,
          month: 10,
        },
        select: expect.any(Object),
      });
      expect(result.month).toBe(10);
    });

    it('should throw SheetAlreadyExistsException on recreating same month (CB-08)', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'existing-sheet',
        year: 2026,
        month: 10,
      });

      await expect(
        service.createSheet('user-1', {
          year: 2026,
          month: 10,
        })
      ).rejects.toThrow(SheetAlreadyExistsException);
    });
  });

  describe('deleteSheet', () => {
    it('should throw ConfirmationRequiredException if confirm is false', async () => {
      await expect(
        service.deleteSheet('user-1', 'sheet-1', false)
      ).rejects.toThrow(ConfirmationRequiredException);
    });

    it('should throw SheetNotFoundException if sheet belongs to another user (CB-01)', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-user-b',
        userId: 'user-b',
      });

      await expect(
        service.deleteSheet('user-a', 'sheet-user-b', true)
      ).rejects.toThrow(SheetNotFoundException);
    });

    it('should atomically delete sheet and its monthly records preserving recurrence rules', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-1',
        userId: 'user-1',
      });

      await service.deleteSheet('user-1', 'sheet-1', true);

      expect(mockPrismaService.transaction.deleteMany).toHaveBeenCalledWith({
        where: { sheetId: 'sheet-1', userId: 'user-1' },
      });
      expect(mockPrismaService.essentialDeclaration.deleteMany).toHaveBeenCalledWith({
        where: { sheetId: 'sheet-1', userId: 'user-1' },
      });
      expect(mockPrismaService.monthlySheet.delete).toHaveBeenCalledWith({
        where: { id: 'sheet-1' },
      });
    });
  });

  describe('addTransaction', () => {
    it('should reject transactionDate outside of sheet month/year (CB-07, DEC-14)', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-1',
        userId: 'user-1',
        year: 2026,
        month: 10,
      });

      await expect(
        service.addTransaction('user-1', 'sheet-1', {
          description: 'Compra fora do mês',
          amountCents: 5000,
          type: 'EXPENSE' as any,
          categoryId: 'cat-1',
          transactionDate: '2026-11-01',
          isRecurring: false,
        })
      ).rejects.toThrow('A data do lançamento (2026-11-01) deve pertencer ao mês e ano da planilha (10/2026)');
    });

    it('should automatically remove "Não tenho esse gasto" declaration when real expense is added (CB-11, DEC-12)', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-1',
        userId: 'user-1',
        year: 2026,
        month: 10,
      });

      mockPrismaService.category.findFirst.mockResolvedValue({
        id: 'cat-moradia',
        name: 'Moradia',
        type: 'EXPENSE',
        isEssential: true,
      });

      mockPrismaService.transaction.create.mockResolvedValue({
        id: 'tx-1',
        description: 'Aluguel',
        amountCents: 150000,
        type: 'EXPENSE',
      });

      mockPrismaService.essentialDeclaration.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.user.findUnique.mockResolvedValue({ dashboardUnlocked: true });

      const result = await service.addTransaction('user-1', 'sheet-1', {
        description: 'Aluguel',
        amountCents: 150000,
        type: 'EXPENSE' as any,
        categoryId: 'cat-moradia',
        transactionDate: '2026-10-15',
        isRecurring: false,
      });

      expect(result.removedDeclaration).toBe(true);
      expect(mockPrismaService.essentialDeclaration.deleteMany).toHaveBeenCalledWith({
        where: {
          sheetId: 'sheet-1',
          categoryId: 'cat-moradia',
        },
      });
    });
  });

  describe('addEssentialDeclaration', () => {
    it('should reject declaration on non-essential category', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-1',
        userId: 'user-1',
      });

      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-lazer',
        name: 'Lazer',
        type: 'EXPENSE',
        isSystem: true,
        isEssential: false,
      });

      await expect(
        service.addEssentialDeclaration('user-1', 'sheet-1', {
          categoryId: 'cat-lazer',
        })
      ).rejects.toThrow('Apenas as 5 categorias essenciais de despesa aceitam declaração de ausência de gasto');
    });

    it('should block declaration if real expense already exists in that category for that month (DEC-12)', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-1',
        userId: 'user-1',
      });

      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-moradia',
        name: 'Moradia',
        type: 'EXPENSE',
        isSystem: true,
        isEssential: true,
      });

      mockPrismaService.transaction.findFirst.mockResolvedValue({
        id: 'tx-existing',
        amountCents: 120000,
        type: 'EXPENSE',
      });

      await expect(
        service.addEssentialDeclaration('user-1', 'sheet-1', {
          categoryId: 'cat-moradia',
        })
      ).rejects.toThrow('Não é possível declarar "Não tenho esse gasto" para "Moradia"');
    });
  });

  describe('applyRecurrences (CB-12, DEC-17)', () => {
    it('should adjust day 31 to 28 in February non-leap year (CB-12) and preserve idempotency (DEC-17)', async () => {
      // Planilha de Fevereiro de 2025 (não bissexto: 28 dias)
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-feb-2025',
        userId: 'user-1',
        year: 2025,
        month: 2,
        transactions: [], // Nenhuma transação ainda
      });

      // Regra de recorrência com dayOfMonth = 31
      mockPrismaService.recurrenceRule.findMany.mockResolvedValue([
        {
          id: 'rule-31',
          userId: 'user-1',
          categoryId: 'cat-1',
          type: 'EXPENSE',
          description: 'Internet Fibra',
          amountCents: 12000,
          notes: 'Fim do mês',
          dayOfMonth: 31,
          startYear: 2025,
          startMonth: 1,
          isActive: true,
          category: {
            id: 'cat-1',
            isEssential: false,
          },
        },
      ]);

      mockPrismaService.transaction.create.mockImplementation(({ data }) => ({
        id: 'tx-feb-generated',
        ...data,
      }));

      mockPrismaService.user.findUnique.mockResolvedValue({ dashboardUnlocked: true });

      const result = await service.applyRecurrences('user-1', 'sheet-feb-2025', {});

      expect(result.generatedCount).toBe(1);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recurrenceRuleId: 'rule-31',
            transactionDate: new Date(Date.UTC(2025, 1, 28, 12, 0, 0)),
          }),
        })
      );
    });

    it('should adjust day 31 to 29 in February leap year (2024)', async () => {
      // Planilha de Fevereiro de 2024 (ano bissexto: 29 dias)
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-feb-2024',
        userId: 'user-1',
        year: 2024,
        month: 2,
        transactions: [],
      });

      mockPrismaService.recurrenceRule.findMany.mockResolvedValue([
        {
          id: 'rule-31',
          userId: 'user-1',
          categoryId: 'cat-1',
          type: 'EXPENSE',
          description: 'Internet Fibra',
          amountCents: 12000,
          dayOfMonth: 31,
          startYear: 2024,
          startMonth: 1,
          isActive: true,
          category: { id: 'cat-1', isEssential: false },
        },
      ]);

      mockPrismaService.transaction.create.mockImplementation(({ data }) => ({
        id: 'tx-leap-generated',
        ...data,
      }));

      mockPrismaService.user.findUnique.mockResolvedValue({ dashboardUnlocked: true });

      const result = await service.applyRecurrences('user-1', 'sheet-feb-2024', {});

      expect(result.generatedCount).toBe(1);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionDate: new Date(Date.UTC(2024, 1, 29, 12, 0, 0)),
          }),
        })
      );
    });

    it('should be 100% idempotent and not generate duplicates if rule is already applied in sheet (DEC-17)', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-with-applied',
        userId: 'user-1',
        year: 2026,
        month: 10,
        transactions: [{ recurrenceRuleId: 'rule-already-applied' }],
      });

      mockPrismaService.recurrenceRule.findMany.mockResolvedValue([
        {
          id: 'rule-already-applied',
          userId: 'user-1',
          categoryId: 'cat-1',
          dayOfMonth: 10,
          category: { id: 'cat-1', isEssential: false },
        },
      ]);

      const result = await service.applyRecurrences('user-1', 'sheet-with-applied', {});
      expect(result.generatedCount).toBe(0);
      expect(result.transactions).toHaveLength(0);
    });
  });

  describe('dismissRecurrencePrompt', () => {
    it('should set recurrencePromptDismissed = true on the sheet', async () => {
      mockPrismaService.monthlySheet.findUnique.mockResolvedValue({
        id: 'sheet-1',
        userId: 'user-1',
      });

      await service.dismissRecurrencePrompt('user-1', 'sheet-1');

      expect(mockPrismaService.monthlySheet.update).toHaveBeenCalledWith({
        where: { id: 'sheet-1' },
        data: { recurrencePromptDismissed: true },
      });
    });
  });
});
