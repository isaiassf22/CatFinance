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
    monthlySheet: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    transaction: {
      deleteMany: jest.fn(),
    },
    essentialDeclaration: {
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
});
