import { z } from 'zod';

export enum DashboardViewType {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export const QueryDashboardSchema = z.object({
  view: z
    .nativeEnum(DashboardViewType, {
      errorMap: () => ({ message: 'Visão deve ser "MONTHLY" ou "ANNUAL"' }),
    })
    .default(DashboardViewType.MONTHLY),
  year: z
    .string()
    .regex(/^\d{4}$/, 'Ano deve possuir 4 dígitos')
    .transform((val) => parseInt(val, 10))
    .optional(),
  month: z
    .string()
    .regex(/^([1-9]|1[0-2])$/, 'Mês deve ser um número entre 1 e 12')
    .transform((val) => parseInt(val, 10))
    .optional(),
});

export type QueryDashboardDto = z.infer<typeof QueryDashboardSchema>;
