import React, { useState } from 'react';
import {
  LayoutDashboard,
  Lock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TactileButton } from '../../components/ui/TactileButton';
import { formatCentsToBRL } from '../../lib/formatters';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  // Condition from RF-06: Requires dashboardUnlocked == true
  if (!user?.dashboardUnlocked) {
    return (
      <div className="card-tactile p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 my-8">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-duo-goldDark flex items-center justify-center mx-auto border-b-4 border-amber-300 shadow-sm">
          <Lock className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-wider text-duo-goldDark bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Desbloqueio Especial
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight mt-3">
            Dashboard em Construção! 🐱
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-2">
            Para liberar seus gráficos e relatórios detalhados, preencha as <strong>5 Despesas Essenciais</strong> (Moradia, Alimentação, Transporte, Saúde e Educação) em qualquer mês.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left text-xs font-bold text-gray-600 space-y-2">
          <p className="flex items-center gap-2 text-gray-800">
            <Sparkles className="w-4 h-4 text-duo-green" />
            Você pode preencher lançando um gasto real ou marcando <em>"Não tenho esse gasto"</em>.
          </p>
          <p className="flex items-center gap-2 text-gray-800">
            <Sparkles className="w-4 h-4 text-duo-blue" />
            O desbloqueio é vitalício e permanente!
          </p>
        </div>

        <TactileButton
          variant="gold"
          size="lg"
          fullWidth
          onClick={() => navigate('/sheets')}
        >
          Ir para Minhas Planilhas
          <ArrowRight className="w-5 h-5" />
        </TactileButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-duo-goldDark" />
            Dashboard Financeiro
          </h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Visão consolidada de entradas, saídas e distribuição por categoria.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border-2 border-duo-gray">
          <button
            onClick={() => setViewType('MONTHLY')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewType === 'MONTHLY'
                ? 'bg-duo-blue text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setViewType('ANNUAL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewType === 'ANNUAL'
                ? 'bg-duo-blue text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-tactile bg-emerald-50/50 border-duo-green/40 border-b-duo-greenDark">
          <p className="text-xs font-black uppercase text-duo-greenDark">Total Receitas</p>
          <p className="text-2xl font-black text-gray-800 mt-1">{formatCentsToBRL(0)}</p>
        </div>
        <div className="card-tactile bg-red-50/50 border-duo-coral/40 border-b-duo-coralDark">
          <p className="text-xs font-black uppercase text-duo-coralDark">Total Despesas</p>
          <p className="text-2xl font-black text-gray-800 mt-1">{formatCentsToBRL(0)}</p>
        </div>
        <div className="card-tactile bg-blue-50/50 border-duo-blue/40 border-b-duo-blueDark">
          <p className="text-xs font-black uppercase text-duo-blueDark">Saldo Líquido</p>
          <p className="text-2xl font-black text-gray-800 mt-1">{formatCentsToBRL(0)}</p>
        </div>
      </div>

      {/* Empty Movements State */}
      <div className="card-tactile text-center py-16 space-y-3">
        <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto" />
        <h3 className="text-lg font-black text-gray-700">
          Ainda não há lançamentos para este período
        </h3>
        <p className="text-xs font-bold text-gray-400 max-w-sm mx-auto">
          Adicione receitas e despesas nas suas planilhas para visualizar os gráficos de pizza e evolução.
        </p>
      </div>
    </div>
  );
};
