import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const OnboardingSchema = z.object({
  completed: z.boolean({ required_error: 'O campo completed é obrigatório' }),
});

export type OnboardingDto = z.infer<typeof OnboardingSchema>;

export const DeleteAccountSchema = z.object({
  confirmationText: z.literal('EXCLUIR', {
    errorMap: () => ({ message: 'Texto de confirmação deve ser exatamente "EXCLUIR"' }),
  }),
  currentPassword: z.string().min(1, 'A senha atual é obrigatória'),
});

export type DeleteAccountDto = z.infer<typeof DeleteAccountSchema>;
