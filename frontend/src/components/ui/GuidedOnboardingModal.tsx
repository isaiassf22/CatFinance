import React, { useState } from 'react';
import {
  Sparkles,
  FolderKanban,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { TactileButton } from './TactileButton';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';

interface GuidedOnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const GuidedOnboardingModal: React.FC<GuidedOnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  if (!isOpen) return null;

  const steps = [
    {
      icon: <Sparkles className="w-10 h-10 text-duo-green" />,
      badge: 'Bem-vindo(a) ao CatFinance! 🐱',
      title: 'Organizar suas finanças agora é leve e divertido',
      description:
        'Sem planilhas chatas cheias de fórmulas complicadas. Criamos uma experiência gamificada, sem julgamentos, para te ajudar a conquistar clareza e paz mental.',
      actionText: 'Como funciona?',
    },
    {
      icon: <FolderKanban className="w-10 h-10 text-duo-blue" />,
      badge: 'Pastas Mensais & Os 5 Essenciais',
      title: 'Comece com 5 gastos indispensáveis',
      description:
        'Em cada mês, você acompanha: Moradia, Alimentação, Transporte, Saúde e Educação. Se não tiver um deles no mês (ex: não gastou com saúde), basta clicar em "Não tenho esse gasto".',
      actionText: 'E depois?',
    },
    {
      icon: <CheckCircle2 className="w-10 h-10 text-duo-gold" />,
      badge: 'Desbloqueio Permanente',
      title: 'Conquiste seu Dashboard Financeiro',
      description:
        'Ao preencher os 5 essenciais no seu primeiro mês (com lançamentos reais ou declaração), você desbloqueia para sempre o Dashboard com gráficos comparativos e análises completas.',
      actionText: 'Quase lá!',
    },
    {
      icon: <GraduationCap className="w-10 h-10 text-purple-600" />,
      badge: 'Trilha Educativa',
      title: 'Aprenda no seu ritmo com quizzes interativos',
      description:
        'Acesse a aba Aprender para desmistificar conceitos de reserva de emergência, fluxo de caixa e renegociação de dívidas. Você ganha conquistas a cada aula!',
      actionText: 'Começar Minha Jornada!',
    },
  ];

  const current = steps[step];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      try {
        setIsFinishing(true);
        await api.patch('/me/onboarding', { completed: true });
        updateUser({ onboardingCompleted: true });
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
        onComplete();
      } catch {
        onComplete();
      } finally {
        setIsFinishing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="card-tactile bg-white max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
        {/* Step Indicator */}
        <div className="flex justify-center gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === step
                  ? 'w-8 bg-duo-green'
                  : idx < step
                  ? 'w-2 bg-duo-greenLight'
                  : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Icon & Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-gray-50 border-2 border-gray-100 flex items-center justify-center shadow-inner">
            {current.icon}
          </div>
          <span className="text-xs font-black uppercase text-duo-green bg-green-50 border border-green-200 px-3 py-1 rounded-full tracking-wide">
            {current.badge}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-800 leading-tight">
            {current.title}
          </h2>
          <p className="text-sm font-semibold text-gray-600 leading-relaxed max-w-md mx-auto">
            {current.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <TactileButton
            variant={step === steps.length - 1 ? 'green' : 'blue'}
            size="lg"
            fullWidth
            onClick={handleNext}
            disabled={isFinishing}
          >
            {isFinishing ? (
              'Preparando...'
            ) : (
              <>
                {current.actionText}
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </TactileButton>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-duo-green" />
          <span>Seus dados ficam 100% isolados e seguros</span>
        </div>
      </div>
    </div>
  );
};
