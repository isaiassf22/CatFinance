import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ProgressBar } from '../../components/ui/ProgressBar';

interface LessonSummary {
  id: string;
  orderIndex: number;
  title: string;
  summary: string;
  isLocked: boolean;
  isCompleted: boolean;
  bestScorePercent: number;
  questionsCount: number;
}

export const LearnPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<{ items: LessonSummary[] }>({
    queryKey: ['lessons'],
    queryFn: async () => {
      const res = await api.get('/lessons');
      return res.data;
    },
  });

  const lessons = data?.items ?? [];
  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const totalCount = lessons.length || 5;

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="card-tactile bg-purple-50/80 border-purple-200 border-b-purple-400 p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md border-b-4 border-purple-800">
          <GraduationCap className="w-9 h-9" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-200 text-purple-900 px-2.5 py-0.5 rounded-full">
              Trilha Gamificada
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-800 mt-1">
            Educação Financeira Descomplicada
          </h1>
          <p className="text-xs font-semibold text-gray-600 mt-1">
            Aulas curtas, reflexões práticas e quizzes rápidos para adultos iniciantes.
          </p>

          <div className="mt-4">
            <ProgressBar
              value={completedCount}
              max={totalCount}
              variant="blue"
              showLabel
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 space-y-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Carregando sua jornada educativa...</p>
        </div>
      )}

      {error && (
        <div className="card-tactile p-6 text-center text-duo-coral font-bold text-sm">
          Não foi possível carregar as aulas. Tente recarregar a página.
        </div>
      )}

      {/* Visual Duolingo-style Path with Connected Circular Tactile Nodes */}
      {!isLoading && !error && (
        <div className="relative py-6 flex flex-col items-center">
          {/* Vertical Connecting Curved Path Line */}
          <div className="absolute top-10 bottom-10 w-2.5 bg-gray-200 rounded-full z-0" />

          <div className="space-y-12 w-full z-10">
            {lessons.map((lesson, index) => {
              // Zig-zag offset for tactile nodes: alternating center, left, right
              const offsets = [
                'translate-x-0',
                '-translate-x-8 sm:-translate-x-12',
                'translate-x-8 sm:translate-x-12',
                '-translate-x-6 sm:-translate-x-10',
                'translate-x-0',
              ];
              const offsetClass = offsets[index % offsets.length];

              const isCompleted = lesson.isCompleted;
              const isLocked = lesson.isLocked;

              return (
                <div
                  key={lesson.id}
                  className={`flex flex-col items-center transition-transform ${offsetClass}`}
                >
                  {/* Circular Tactile Node */}
                  <button
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) {
                        navigate(`/learn/${lesson.id}`);
                      }
                    }}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-duo-green text-white border-b-6 border-duo-greenDark hover:brightness-105 active:border-b-0 active:translate-y-1.5 shadow-lg shadow-green-100'
                        : isLocked
                        ? 'bg-gray-200 text-gray-400 border-b-6 border-gray-300 cursor-not-allowed shadow-none'
                        : 'bg-duo-blue text-white border-b-6 border-duo-blueDark hover:brightness-105 active:border-b-0 active:translate-y-1.5 shadow-lg shadow-blue-100 animate-bounce'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                        <span className="text-[10px] font-black mt-0.5">{lesson.bestScorePercent}%</span>
                      </>
                    ) : isLocked ? (
                      <Lock className="w-8 h-8 sm:w-9 sm:h-9" />
                    ) : (
                      <>
                        <BookOpen className="w-8 h-8 sm:w-9 sm:h-9" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Aula {lesson.orderIndex}</span>
                      </>
                    )}

                    {/* Floating Trophy or Sparkle Indicator */}
                    {isCompleted && (
                      <div className="absolute -top-2 -right-1 bg-amber-400 text-white rounded-full p-1.5 shadow-md border-2 border-white">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {!isLocked && !isCompleted && (
                      <div className="absolute -top-2 -right-1 bg-purple-500 text-white rounded-full p-1.5 shadow-md border-2 border-white animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>

                  {/* Lesson Card Tag / Title */}
                  <div
                    onClick={() => {
                      if (!isLocked) {
                        navigate(`/learn/${lesson.id}`);
                      }
                    }}
                    className={`mt-3 max-w-xs text-center cursor-pointer transition ${
                      isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'
                    }`}
                  >
                    <div className="inline-block bg-white border-2 border-gray-200 rounded-2xl px-3.5 py-1.5 shadow-sm">
                      <p className="text-xs font-black text-gray-800 leading-snug">
                        {lesson.title}
                      </p>
                      <p className="text-[11px] font-semibold text-gray-500 line-clamp-1 mt-0.5">
                        {lesson.summary}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
