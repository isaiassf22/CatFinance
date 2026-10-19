import { z } from 'zod';

export const CreateSheetSchema = z.object({
  year: z.coerce.number().int().min(2000, 'Ano inválido').max(2100, 'Ano inválido'),
  month: z.coerce.number().int().min(1, 'Mês deve ser entre 1 e 12').max(12, 'Mês deve ser entre 1 e 12'),
});

export type CreateSheetDto = z.infer<typeof CreateSheetSchema>;

export const QuerySheetYearSchema = z.object({
  year: z.coerce.number().int().optional(),
});

export type QuerySheetYearDto = z.infer<typeof QuerySheetYearSchema>;
