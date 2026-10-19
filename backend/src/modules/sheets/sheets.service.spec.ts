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
});
