import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Cat, LogIn } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import { TactileButton } from '../../components/ui/TactileButton';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.post<{ accessToken: string; user: User }>(
        '/auth/login',
        data
      );
      login(response.data);
      toast.success('Bem-vindo(a) de volta!');
      navigate('/sheets');
    } catch {
      // Handled by api interceptor
    }
  };

  return (
    <div className="min-h-screen bg-duo-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full card-tactile p-8 space-y-6 text-center">
        {/* Header Mascot Icon */}
        <div className="w-20 h-20 bg-duo-blue/20 rounded-3xl flex items-center justify-center mx-auto text-duo-blue border-b-4 border-duo-blue/40 shadow-sm">
          <Cat className="w-12 h-12" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">
            Entrar no CatFinance
          </h1>
          <p className="text-sm font-bold text-gray-500 mt-2">
            Controle financeiro descomplicado e acolhedor.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-600 mb-1">
              E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              className={`w-full px-4 py-3 rounded-2xl border-2 font-bold text-sm bg-gray-50 focus:bg-white focus:outline-none transition-all ${
                errors.email
                  ? 'border-duo-coral focus:border-duo-coral'
                  : 'border-duo-gray focus:border-duo-blue'
              }`}
            />
            {errors.email && (
              <p className="text-xs font-bold text-duo-coral mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-600 mb-1">
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={`w-full px-4 py-3 rounded-2xl border-2 font-bold text-sm bg-gray-50 focus:bg-white focus:outline-none transition-all ${
                errors.password
                  ? 'border-duo-coral focus:border-duo-coral'
                  : 'border-duo-gray focus:border-duo-blue'
              }`}
            />
            {errors.password && (
              <p className="text-xs font-bold text-duo-coral mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <TactileButton
            type="submit"
            variant="blue"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            className="mt-6"
          >
            <LogIn className="w-5 h-5" />
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </TactileButton>
        </form>

        <div className="pt-4 border-t-2 border-duo-gray">
          <p className="text-sm font-bold text-gray-500">
            Ainda não tem conta?{' '}
            <Link
              to="/register"
              className="text-duo-green hover:underline font-extrabold"
            >
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
