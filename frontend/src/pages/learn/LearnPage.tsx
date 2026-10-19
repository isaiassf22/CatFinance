import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { SelectableCard } from '../../components/ui/SelectableCard';
import { ProgressBar } from '../../components/ui/ProgressBar';

export const LearnPage: React.FC = () => {
  const navigate = useNavigate();

  // 5 Modules defined in docs/RULES.md (RF-18, RF-20)
  const modules = [
    {
      id: 'lesson-1',
      orderIndex: 1,
      title: '1. O Início: Para onde vai o meu dinheiro?',
      summary: 'Descubra a importância de registrar pequenos gastos sem neura.',
      isLocked: false,
      isCompleted: true,
      bestScore: 100,
    },
    {
      id: 'lesson-2',
      orderIndex: 2,
      title: '2. As 5 Despesas Essenciais',
      summary: 'Entenda como separar o que é indispensável das despesas extras.',
      isLocked: false,
      isCompleted: false,
      bestScore: 0,
    },
    {
      id: 'lesson-3',
      orderIndex: 3,
      title: '3. Recorrências: Adeus juros e surpresas',
      summary: 'Aprenda a mapear custos fixos mensais com tranquilidade.',
      isLocked: true,
      isCompleted: false,
      bestScore: 0,
    },
    {
      id: 'lesson-4',
      orderIndex: 4,
      title: '4. Reserva de Emergência sem Mistério',
      summary: 'Como juntar os primeiros reais mesmo ganhando pouco.',
      isLocked: true,
      isCompleted: false,
      bestScore: 0,
    },
    {
      id: 'lesson-5',
      orderIndex: 5,
      title: '5. Próximos Passos: Poupar e Respirar Aliviado',
      summary: 'Consolide seus hábitos para manter a vida financeira nos trilhos.',
      isLocked: true,
      isCompleted: false,
      bestScore: 0,
    },
  ];

  const completedCount = modules.filter((m) => m.isCompleted).length;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="card-tactile bg-purple-50/70 border-purple-200 border-b-purple-400 p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
          <GraduationCap className="w-9 h-9" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full">
              Trilha Gamificada
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-800 mt-1">
            Educação Financeira Descomplicada
          </h1>
          <p className="text-xs font-semibold text-gray-600 mt-1">
            Aulas curtas, reflexões práticas e quizzes divertidos sem julgamentos.
          </p>

          <div className="mt-4">
            <ProgressBar
              value={completedCount}
              max={modules.length}
              variant="blue"
              showLabel
            />
          </div>
        </div>
      </div>

      {/* Duolingo Trail of Lessons */}
      <div className="space-y-4">
        {modules.map((lesson) => (
          <SelectableCard
            key={lesson.id}
            icon={
              lesson.isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-duo-green" />
              ) : lesson.isLocked ? (
                <Lock className="w-6 h-6 text-gray-400" />
              ) : (
                <BookOpen className="w-6 h-6 text-duo-blue" />
              )
            }
            title={lesson.title}
            subtitle={lesson.summary}
            badge={lesson.isCompleted ? 'Aprovado 🏆' : undefined}
            variant={lesson.isCompleted ? 'green' : lesson.isLocked ? 'gold' : 'blue'}
            className={lesson.isLocked ? 'opacity-70 bg-gray-50' : undefined}
            onClick={() => {
              if (!lesson.isLocked) {
                navigate(`/learn/${lesson.id}`);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};
