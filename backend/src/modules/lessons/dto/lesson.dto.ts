import { z } from 'zod';

export const updateLessonProgressSchema = z.object({
  lastCardViewed: z.number().int().min(0),
});

export type UpdateLessonProgressDto = z.infer<typeof updateLessonProgressSchema>;

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOptionId: z.string().min(1),
    }),
  ).min(1, 'Pelo menos uma resposta deve ser enviada.'),
});

export type SubmitQuizDto = z.infer<typeof submitQuizSchema>;
