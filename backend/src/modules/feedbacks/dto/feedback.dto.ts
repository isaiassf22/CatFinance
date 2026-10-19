import { z } from 'zod';

export const createFeedbackSchema = z.object({
  message: z.string().min(1, 'A mensagem não pode estar vazia.').max(2000, 'A mensagem não pode ultrapassar 2000 caracteres.'),
  pageContext: z.string().max(255).optional(),
});

export type CreateFeedbackDto = z.infer<typeof createFeedbackSchema>;
