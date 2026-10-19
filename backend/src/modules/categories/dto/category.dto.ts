import { z } from 'zod';
import { TransactionType } from '@prisma/client';

export const CreateCategorySchema = z.object({
  name: z
    .string({ required_error: 'Nome da categoria é obrigatório' })
    .trim()
    .min(1, 'Nome da categoria não pode estar em branco')
    .max(50, 'Nome da categoria deve ter no máximo 50 caracteres'),
  type: z.nativeEnum(TransactionType, {
    errorMap: () => ({ message: 'Tipo deve ser "INCOME" ou "EXPENSE"' }),
  }),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

export const QueryCategorySchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
});

export type QueryCategoryDto = z.infer<typeof QueryCategorySchema>;
