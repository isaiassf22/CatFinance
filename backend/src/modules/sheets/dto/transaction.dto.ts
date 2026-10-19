import { z } from 'zod';
import { TransactionType } from '@prisma/client';

export const CreateTransactionSchema = z.object({
  description: z
    .string({ required_error: 'Descrição é obrigatória' })
    .trim()
    .min(1, 'Descrição não pode estar vazia')
    .max(100, 'Descrição deve ter no máximo 100 caracteres'),
  amountCents: z
    .number({ required_error: 'Valor em centavos é obrigatório' })
    .int('Valor deve ser um número inteiro de centavos')
    .min(1, 'Valor deve ser de pelo menos 1 centavo (>= 1)'),
  type: z.nativeEnum(TransactionType, {
    errorMap: () => ({ message: 'Tipo deve ser "INCOME" ou "EXPENSE"' }),
  }),
  categoryId: z
    .string({ required_error: 'Categoria é obrigatória' })
    .uuid('ID de categoria inválido'),
  transactionDate: z
    .string({ required_error: 'Data é obrigatória' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  notes: z
    .string()
    .trim()
    .max(500, 'Observação deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  isRecurring: z.boolean().default(false),
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Descrição não pode estar vazia')
    .max(100, 'Descrição deve ter no máximo 100 caracteres')
    .optional(),
  amountCents: z
    .number()
    .int('Valor deve ser um número inteiro de centavos')
    .min(1, 'Valor deve ser de pelo menos 1 centavo (>= 1)')
    .optional(),
  categoryId: z.string().uuid('ID de categoria inválido').optional(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'Observação deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  isRecurring: z.boolean().optional(),
});

export type UpdateTransactionDto = z.infer<typeof UpdateTransactionSchema>;

export const CreateEssentialDeclarationSchema = z.object({
  categoryId: z
    .string({ required_error: 'Categoria é obrigatória' })
    .uuid('ID de categoria inválido'),
});

export type CreateEssentialDeclarationDto = z.infer<
  typeof CreateEssentialDeclarationSchema
>;

export const ApplyRecurrencesSchema = z.object({
  ruleIds: z.array(z.string().uuid('ID de regra inválido')).optional(),
});

export type ApplyRecurrencesDto = z.infer<typeof ApplyRecurrencesSchema>;

