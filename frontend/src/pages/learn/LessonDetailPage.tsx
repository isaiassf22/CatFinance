import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trophy,
  HelpCircle,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { TactileButton } from '../../components/ui/TactileButton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface LessonCard {
  id: string;
  orderIndex: number;
  title: string;
  content: string;
}

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  orderIndex: number;
  prompt: string;
  options: QuizOption[];
}

interface LessonDetailResponse {
  id: string;
  orderIndex: number;
  title: string;
  summary: string;
  progress: {
    lastCardViewed: number;
    isCompleted: boolean;
    bestScorePercent: number;
  };
  cards: LessonCard[];
  questions: QuizQuestion[];
}

interface QuizSubmissionResult {
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  approvedNow: boolean;
  isLessonCompleted: boolean;
  results: {
    questionId: string;
    isCorrect: boolean;
  }[];
}

export const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<'CARDS' | 'QUIZ' | 'RESULTS'>('CARDS');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);

  const { data: lesson, isLoading, error } = useQuery<LessonDetailResponse>({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const res = await api.get(`/lessons/${lessonId}`);
      return res.data;
    },
    enabled: !!lessonId,
  });

  const cards = lesson?.cards ?? [];
  const questions = lesson?.questions ?? [];

  // Update card viewing progress mutation
  const progressMutation = useMutation({
    mutationFn: async (lastCardViewed: number) => {
      await api.patch(`/lessons/${lessonId}/progress`, { lastCardViewed });
    },
  });

  // Submit quiz mutation
  const quizMutation = useMutation({
    mutationFn: async () => {
      const answers = Object.entries(selectedAnswers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }));
      const res = await api.post<QuizSubmissionResult>(
        `/lessons/${lessonId}/quiz-submissions`,
        { answers },
      );
      return res.data;
    },
    onSuccess: (result) => {
      setSubmissionResult(result);
      setCurrentStep('RESULTS');
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });

      if (result.approvedNow || result.scorePercent >= 70) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
        toast.success('Parabéns! Você foi aprovado(a) no quiz! 🏆');
      } else {
        toast.error('Você não atingiu 70%. Tente novamente!');
      }
    },
    onError: () => {
      toast.error('Erro ao enviar quiz. Verifique se respondeu todas as perguntas.');
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="w-10 h-10 border-4 border-duo-green border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-gray-500">Carregando aula...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="card-tactile p-8 text-center space-y-4 max-w-md mx-auto">
        <p className="font-bold text-gray-700">Esta aula está indisponível ou bloqueada.</p>
        <TactileButton variant="gray" size="sm" onClick={() => navigate('/learn')}>
          Voltar para a Trilha
        </TactileButton>
      </div>
    );
  }

  const handleNextCard = () => {
    const nextIndex = currentCardIndex + 1;
    if (nextIndex < cards.length) {
      setCurrentCardIndex(nextIndex);
      progressMutation.mutate(nextIndex);
    } else {
      progressMutation.mutate(cards.length);
      setCurrentStep('QUIZ');
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const allQuestionsAnswered =
    questions.length > 0 &&
    questions.every((q) => !!selectedAnswers[q.id]);

  const handleRetryQuiz = () => {
    setSelectedAnswers({});
    setSubmissionResult(null);
    setCurrentStep('QUIZ');
  };

  // Progress Bar value calculation
  const totalSteps = cards.length + 1; // cards + quiz
  let currentStepProgress = 0;
  if (currentStep === 'CARDS') {
    currentStepProgress = ((currentCardIndex + 1) / totalSteps) * 100;
  } else if (currentStep === 'QUIZ') {
    const answeredCount = Object.keys(selectedAnswers).length;
    currentStepProgress = ((cards.length + (answeredCount / Math.max(questions.length, 1))) / totalSteps) * 100;
  } else {
    currentStepProgress = 100;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <TactileButton variant="gray" size="sm" onClick={() => navigate('/learn')}>
          <ArrowLeft className="w-5 h-5" />
        </TactileButton>

        <div className="flex-1">
          <ProgressBar
            value={currentStepProgress}
            variant={currentStep === 'RESULTS' && (submissionResult?.approvedNow || (submissionResult?.scorePercent ?? 0) >= 70) ? 'green' : 'blue'}
          />
        </div>
      </div>

      {/* Cards Reader View */}
      {currentStep === 'CARDS' && cards.length > 0 && (
        <div className="card-tactile p-6 sm:p-10 space-y-6 text-center bg-white shadow-md">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black uppercase text-duo-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Aula #{lesson.orderIndex} • {lesson.title}
            </span>
            <span className="text-xs font-extrabold text-gray-400">
              Cartão {currentCardIndex + 1} de {cards.length}
            </span>
          </div>

          <h2 className="text-2xl font-black text-gray-800 leading-snug">
            {cards[currentCardIndex].title}
          </h2>

          <div className="p-5 bg-gray-50 rounded-2xl border-2 border-gray-100 text-left">
            <p className="text-base font-semibold text-gray-700 leading-relaxed whitespace-pre-line">
              {cards[currentCardIndex].content}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            {currentCardIndex > 0 && (
              <TactileButton
                variant="gray"
                size="lg"
                onClick={handlePrevCard}
                className="flex-1"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Anterior
              </TactileButton>
            )}

            <TactileButton
              variant="blue"
              size="lg"
              fullWidth={currentCardIndex === 0}
              onClick={handleNextCard}
              className="flex-1"
            >
              {currentCardIndex < cards.length - 1 ? (
                <>
                  Próximo Cartão
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              ) : (
                <>
                  Fazer Quiz da Aula
                  <Sparkles className="w-5 h-5 ml-1" />
                </>
              )}
            </TactileButton>
          </div>
        </div>
      )}

      {/* Interactive Quiz View */}
      {currentStep === 'QUIZ' && (
        <div className="space-y-6">
          <div className="card-tactile bg-purple-50 border-purple-200 border-b-purple-400 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-base">Quiz de Conhecimento</h3>
                <p className="text-xs font-semibold text-gray-600">
                  Responda às questões para aprovar (mínimo de 70% de acertos).
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-purple-200 text-purple-900 px-3 py-1 rounded-full">
              {Object.keys(selectedAnswers).length} / {questions.length} respondidas
            </span>
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {questions.map((question, qIdx) => (
              <div key={question.id} className="card-tactile p-6 bg-white space-y-4">
                <h4 className="text-base font-black text-gray-800 leading-snug">
                  {qIdx + 1}. {question.prompt}
                </h4>

                <div className="space-y-2.5">
                  {question.options.map((option) => {
                    const isSelected = selectedAnswers[question.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectOption(question.id, option.id)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-duo-blue border-b-4 border-b-duo-blueDark text-duo-blue'
                            : 'bg-gray-50/50 border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="flex-1 pr-2">{option.text}</span>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-duo-blue bg-duo-blue text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Quiz Action */}
          <div className="pt-2">
            <TactileButton
              variant="green"
              size="lg"
              fullWidth
              disabled={!allQuestionsAnswered || quizMutation.isPending}
              onClick={() => quizMutation.mutate()}
            >
              {quizMutation.isPending ? 'Validando respostas...' : 'Enviar Quiz e Ver Resultado'}
            </TactileButton>
          </div>
        </div>
      )}

      {/* Quiz Results Screen */}
      {currentStep === 'RESULTS' && submissionResult && (
        <div className="card-tactile p-8 sm:p-12 text-center space-y-6 bg-white">
          <div
            className={`w-20 h-20 rounded-full text-white flex items-center justify-center mx-auto shadow-lg border-b-4 ${
              submissionResult.approvedNow || submissionResult.scorePercent >= 70
                ? 'bg-duo-green border-duo-greenDark'
                : 'bg-duo-coral border-duo-coralDark'
            }`}
          >
            {submissionResult.approvedNow || submissionResult.scorePercent >= 70 ? (
              <Trophy className="w-10 h-10" />
            ) : (
              <RotateCcw className="w-10 h-10" />
            )}
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-800">
              {submissionResult.approvedNow || submissionResult.scorePercent >= 70
                ? 'Aprovado(a)! 🏆'
                : 'Tente Mais Uma Vez!'}
            </h2>
            <p className="text-sm font-semibold text-gray-500 mt-2">
              Você acertou {submissionResult.correctCount} de {submissionResult.totalQuestions} questões (
              {submissionResult.scorePercent}%).
            </p>
          </div>

          {/* Individual Question Feedback List without leaking correct answer (DEC-25) */}
          <div className="space-y-3 text-left max-w-md mx-auto pt-2">
            {submissionResult.results.map((resItem, idx) => (
              <div
                key={resItem.questionId}
                className={`p-3.5 rounded-xl border-2 flex items-center justify-between text-xs font-bold ${
                  resItem.isCorrect
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <span>Questão {idx + 1}</span>
                <span className="flex items-center gap-1">
                  {resItem.isCorrect ? (
                    <>
                      <Check className="w-4 h-4 text-duo-green" />
                      Acertou
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-duo-coral" />
                      Incorreta
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <TactileButton
              variant="gray"
              size="lg"
              className="flex-1"
              onClick={handleRetryQuiz}
            >
              <RotateCcw className="w-5 h-5 mr-1" />
              Tentar Novamente
            </TactileButton>

            <TactileButton
              variant="green"
              size="lg"
              className="flex-1"
              onClick={() => navigate('/learn')}
            >
              Voltar para a Trilha
            </TactileButton>
          </div>
        </div>
      )}
    </div>
  );
};
