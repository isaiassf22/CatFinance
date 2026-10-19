import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import {
  CategoryAlreadyExistsException,
  CannotDeleteSystemCategoryException,
  CategoryNotFoundException,
  ConfirmationRequiredException,
} from '../../common/exceptions/app.exception';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    recurrenceRule: {
      findFirst: jest.fn(),
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
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('createCategory', () => {
    it('should create category when name is unique for that type', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue({
        id: 'cat-1',
        name: 'Curso de Piano',
        type: TransactionType.EXPENSE,
        isSystem: false,
        isEssential: false,
      });

      const result = await service.createCategory('user-1', {
        name: 'Curso de Piano',
        type: TransactionType.EXPENSE,
      });

      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: {
          type: TransactionType.EXPENSE,
          normalizedName: 'curso de piano',
          OR: [{ userId: 'user-1' }, { isSystem: true, userId: null }],
        },
      });
      expect(result.name).toBe('Curso de Piano');
    });

    it('should allow same category name in opposite type (CB-02)', async () => {
      // Searching for EXPENSE with name "Investimentos" returns null (even if INCOME has Investimentos)
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue({
        id: 'cat-expense',
        name: 'Investimentos',
        type: TransactionType.EXPENSE,
        isSystem: false,
        isEssential: false,
      });

      const result = await service.createCategory('user-1', {
        name: 'Investimentos',
        type: TransactionType.EXPENSE,
      });

      expect(result.type).toBe(TransactionType.EXPENSE);
      expect(result.name).toBe('Investimentos');
    });

    it('should throw CategoryAlreadyExistsException on duplicate in same type', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue({
        id: 'existing-id',
        name: 'Lazer',
        type: TransactionType.EXPENSE,
      });

      await expect(
        service.createCategory('user-1', {
          name: 'lazer ',
          type: TransactionType.EXPENSE,
        })
      ).rejects.toThrow(CategoryAlreadyExistsException);
    });
  });

  describe('getDeletePreview and deleteCategory', () => {
    it('should throw CannotDeleteSystemCategoryException when attempting to delete system category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'sys-moradia',
        name: 'Moradia',
        isSystem: true,
        userId: null,
      });

      await expect(
        service.getDeletePreview('user-1', 'sys-moradia')
      ).rejects.toThrow(CannotDeleteSystemCategoryException);

      await expect(
        service.deleteCategory('user-1', 'sys-moradia', true)
      ).rejects.toThrow(CannotDeleteSystemCategoryException);
    });

    it('should throw CategoryNotFoundException if category belongs to another user (CB-01)', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-user-b',
        userId: 'user-b',
        isSystem: false,
      });

      await expect(
        service.getDeletePreview('user-a', 'cat-user-b')
      ).rejects.toThrow(CategoryNotFoundException);

      await expect(
        service.deleteCategory('user-a', 'cat-user-b', true)
      ).rejects.toThrow(CategoryNotFoundException);
    });

    it('should throw ConfirmationRequiredException if confirm is not true', async () => {
      await expect(
        service.deleteCategory('user-1', 'cat-1', false)
      ).rejects.toThrow(ConfirmationRequiredException);
    });

    it('should atomically delete category and its linked transactions and rules', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-custom',
        userId: 'user-1',
        isSystem: false,
      });

      await service.deleteCategory('user-1', 'cat-custom', true);

      expect(mockPrismaService.transaction.deleteMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-custom', userId: 'user-1' },
      });
      expect(mockPrismaService.recurrenceRule.deleteMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-custom', userId: 'user-1' },
      });
      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-custom' },
      });
    });
  });
});
