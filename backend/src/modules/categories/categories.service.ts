import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';
import {
  CategoryAlreadyExistsException,
  CategoryNotFoundException,
  CannotDeleteSystemCategoryException,
  ConfirmationRequiredException,
} from '../../common/exceptions/app.exception';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(userId: string, type?: TransactionType) {
    const items = await this.prisma.category.findMany({
      where: {
        OR: [{ userId }, { isSystem: true, userId: null }],
        ...(type ? { type } : {}),
      },
      select: {
        id: true,
        name: true,
        type: true,
        isSystem: true,
        isEssential: true,
        createdAt: true,
      },
      orderBy: [{ isSystem: 'desc' }, { isEssential: 'desc' }, { name: 'asc' }],
    });

    return { items };
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const normalizedName = dto.name.trim().toLowerCase();

    // Check conflict: cannot duplicate name within the SAME type (user or system)
    const conflict = await this.prisma.category.findFirst({
      where: {
        type: dto.type,
        normalizedName,
        OR: [{ userId }, { isSystem: true, userId: null }],
      },
    });

    if (conflict) {
      throw new CategoryAlreadyExistsException(
        `Já existe uma categoria chamada "${dto.name}" cadastrada como ${
          dto.type === 'INCOME' ? 'Receita' : 'Despesa'
        }`
      );
    }

    const category = await this.prisma.category.create({
      data: {
        userId,
        name: dto.name.trim(),
        normalizedName,
        type: dto.type,
        isSystem: false,
        isEssential: false,
      },
      select: {
        id: true,
        name: true,
        type: true,
        isSystem: true,
        isEssential: true,
        createdAt: true,
      },
    });

    return category;
  }

  async getDeletePreview(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new CategoryNotFoundException();
    }

    if (category.isSystem) {
      throw new CannotDeleteSystemCategoryException();
    }

    if (category.userId !== userId) {
      throw new CategoryNotFoundException();
    }

    const linkedTransactionsCount = await this.prisma.transaction.count({
      where: { categoryId, userId },
    });

    const activeRecurrence = await this.prisma.recurrenceRule.findFirst({
      where: { categoryId, userId, isActive: true },
    });

    const distinctSheets = await this.prisma.transaction.findMany({
      where: { categoryId, userId },
      select: { sheetId: true },
      distinct: ['sheetId'],
    });

    return {
      categoryId,
      linkedTransactionsCount,
      hasActiveRecurrence: !!activeRecurrence,
      affectedSheetsCount: distinctSheets.length,
    };
  }

  async deleteCategory(userId: string, categoryId: string, confirm = false) {
    if (!confirm) {
      throw new ConfirmationRequiredException(
        'Confirmação explícita é obrigatória (?confirm=true) para excluir a categoria'
      );
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new CategoryNotFoundException();
    }

    if (category.isSystem) {
      throw new CannotDeleteSystemCategoryException();
    }

    if (category.userId !== userId) {
      throw new CategoryNotFoundException();
    }

    // Atomic Cascade deletion
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete transactions linked to this category
      await tx.transaction.deleteMany({
        where: { categoryId, userId },
      });

      // 2. Delete recurrence rules linked to this category
      await tx.recurrenceRule.deleteMany({
        where: { categoryId, userId },
      });

      // 3. Delete essential declarations if any (essential are system, but safe guard)
      await tx.essentialDeclaration.deleteMany({
        where: { categoryId, userId },
      });

      // 4. Delete the category itself
      await tx.category.delete({
        where: { id: categoryId },
      });
    });

    return { success: true, message: 'Categoria excluída com sucesso' };
  }
}
