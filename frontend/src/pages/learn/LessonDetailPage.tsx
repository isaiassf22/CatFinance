import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { TactileButton } from '../../components/ui/TactileButton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import confetti from 'canvas-confetti';

export const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // Cards state & Quiz state
  const [currentStep, setCurrentStep] = useState<'CARDS' | 'QUIZ' | 'FINISHED'>('CARDS');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const cards = [
    {
      title: 'Por que o dinheiro parece sumir?',
      content:
        'A maior parte das pessoas não sabe exatamente onde gasta porque pequenas despesas do dia a dia passam despercebidas: um cafezinho aqui, um lanche ali. O primeiro passo não é cortar tudo, é apenas olhar com curiosidade.',
    },
    {
      title: 'Anotar traz liberdade, não prisão',
      content:
        'Saber quanto entra e quanto sai devolve a você o poder de escolha. Não existe certo ou errado no que você gasta, desde que você saiba exatamente o que está acontecendo.',
    },
    {
      title: 'Pergunta para reflexão 💭',
      content:
        'Pense nos seus gastos da última semana: qual deles você nem lembrava mais que tinha feito?',
    },
  ];

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setCurrentStep('QUIZ');
    }
  };

  const handleFinishQuiz = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    setCurrentStep('FINISHED');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <TactileButton variant="gray" size="sm" onClick={() => navigate('/learn')}>
          <ArrowLeft className="w-5 h-5" />
        </TactileButton>

        <div className="flex-1">
          <ProgressBar
            value={
              currentStep === 'CARDS'
                ? ((currentCardIndex + 1) / cards.length) * 50
                : currentStep === 'QUIZ'
                ? 80
                : 100
            }
            variant="green"
          />
        </div>
      </div>

      {/* Cards View */}
      {currentStep === 'CARDS' && (
        <div className="card-tactile p-6 sm:p-10 space-y-6 text-center">
          <span className="text-xs font-black uppercase text-duo-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Aula #{lessonId} • Cartão {currentCardIndex + 1} de {cards.length}
          </span>

          <h2 className="text-2xl font-black text-gray-800">
            {cards[currentCardIndex].title}
          </h2>

          <p className="text-base font-semibold text-gray-600 leading-relaxed text-left sm:text-center">
            {cards[currentCardIndex].content}
          </p>

          <TactileButton
            variant="blue"
            size="lg"
            fullWidth
            onClick={handleNextCard}
            className="mt-6"
          >
            {currentCardIndex < cards.length - 1 ? (
              <>
                Próximo Cartão
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Fazer Quiz da Aula
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </TactileButton>
        </div>
      )}

      {/* Quiz Screen Placeholder */}
      {currentStep === 'QUIZ' && (
        <div className="card-tactile p-6 sm:p-10 space-y-6 text-center">
          <span className="text-xs font-black uppercase text-duo-purple bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Quiz Rápido
          </span>

          <h2 className="text-xl font-black text-gray-800">
            Qual é a primeira atitude recomendada para organizar a vida financeira?
          </h2>

          <div className="space-y-3 text-left">
            <button
              onClick={handleFinishQuiz}
              className="w-full card-tactile p-4 text-left font-bold text-sm text-gray-700 hover:border-duo-green hover:border-b-duo-greenDark active:translate-y-0.5"
            >
              A) Cortar 100% de qualquer lazer imediatamente
            </button>
            <button
              onClick={handleFinishQuiz}
              className="w-full card-tactile p-4 text-left font-bold text-sm text-gray-700 hover:border-duo-green hover:border-b-duo-greenDark active:translate-y-0.5"
            >
              B) Apenas anotar e observar os gastos com curiosidade, sem culpa
            </button>
            <button
              onClick={handleFinishQuiz}
              className="w-full card-tactile p-4 text-left font-bold text-sm text-gray-700 hover:border-duo-green hover:border-b-duo-greenDark active:translate-y-0.5"
            >
              C) Fazer um empréstimo para pagar pequenos boletos
            </button>
          </div>
        </div>
      )}

      {/* Finished Screen */}
      {currentStep === 'FINISHED' && (
        <div className="card-tactile p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-duo-green text-white flex items-center justify-center mx-auto shadow-lg border-b-4 border-duo-greenDark">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-800">Parabéns! 🏆</h2>
            <p className="text-sm font-semibold text-gray-500 mt-2">
              Você concluiu esta aula e foi aprovado(a) no quiz com sucesso!
            </p>
          </div>

          <TactileButton
            variant="green"
            size="lg"
            fullWidth
            onClick={() => navigate('/learn')}
          >
            Voltar para a Trilha
          </TactileButton>
        </div>
      )}
    </div>
  );
};
