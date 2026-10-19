import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Plus,
} from 'lucide-react';
import { TactileButton } from '../../components/ui/TactileButton';
import { getMonthName, formatCentsToBRL } from '../../lib/formatters';

export const SheetDetailPage: React.FC = () => {
  const { year, month } = useParams<{ year: string; month: string }>();
  const navigate = useNavigate();

  const numYear = Number(year) || new Date().getFullYear();
  const numMonth = Number(month) || new Date().getMonth() + 1;

  // Initial placeholder state for Passo 1.5
  const summary = {
    incomeCents: 0,
    expenseCents: 0,
    balanceCents: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TactileButton
            variant="gray"
            size="sm"
            onClick={() => navigate('/sheets')}
          >
            <ArrowLeft className="w-5 h-5" />
          </TactileButton>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-duo-blue" />
              {getMonthName(numMonth)} de {numYear}
            </h1>
            <p className="text-xs font-bold text-gray-400">
              Lançamentos financeiros reais e 5 despesas essenciais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TactileButton variant="green" size="md">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Lançamento</span>
          </TactileButton>
        </div>
      </div>

      {/* Financial Summary Cards (100% centavos formatados em BRL) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receitas */}
        <div className="card-tactile bg-emerald-50/50 border-duo-green/40 border-b-duo-greenDark flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-duo-green text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-duo-greenDark">
              Total de Receitas
            </p>
            <p className="text-xl font-black text-gray-800">
              {formatCentsToBRL(summary.incomeCents)}
            </p>
          </div>
        </div>

        {/* Despesas */}
        <div className="card-tactile bg-red-50/50 border-duo-coral/40 border-b-duo-coralDark flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-duo-coral text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-duo-coralDark">
              Total de Despesas
            </p>
            <p className="text-xl font-black text-gray-800">
              {formatCentsToBRL(summary.expenseCents)}
            </p>
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="card-tactile bg-blue-50/50 border-duo-blue/40 border-b-duo-blueDark flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-duo-blue text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-duo-blueDark">
              Saldo do Mês
            </p>
            <p className="text-xl font-black text-gray-800">
              {formatCentsToBRL(summary.balanceCents)}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State / Placeholder for Passo 2 and Passo 3 */}
      <div className="card-tactile text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-duo-blue/10 text-duo-blue mx-auto flex items-center justify-center">
          <DollarSign className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-black text-gray-800">
            Nenhum lançamento adicionado ainda
          </h3>
          <p className="text-sm font-semibold text-gray-500 mt-1">
            Cadastre suas receitas e despesas ou recupere seus lançamentos recorrentes.
          </p>
        </div>
      </div>
    </div>
  );
};
