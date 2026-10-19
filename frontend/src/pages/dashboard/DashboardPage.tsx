import React, { useState } from 'react';
import {
  LayoutDashboard,
  Lock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { TactileButton } from '../../components/ui/TactileButton';
import { formatCentsToBRL, getMonthName } from '../../lib/formatters';
import { api } from '../../lib/api';

interface DashboardResponse {
  availablePeriods: Array<{
    year: number;
    months: number[];
  }>;
  currentPeriod: {
    view: 'MONTHLY' | 'ANNUAL';
    year: number;
    month: number;
  };
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  expensesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    amountCents: number;
    percentage: number;
  }>;
  monthlyComparison: Array<{
    month: number;
    incomeCents: number;
    expenseCents: number;
    balanceCents: number;
  }>;
  hasData: boolean;
}

const COLORS = [
  '#FF4B4B',
  '#1CB0F6',
  '#FFC800',
  '#58CC02',
  '#A855F7',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [viewType, setViewType] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();

  // Condition from RF-06: Requires dashboardUnlocked == true
  if (!user?.dashboardUnlocked) {
    return (
      <div className="card-tactile p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 my-8">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-duo-goldDark flex items-center justify-center mx-auto border-b-4 border-amber-300 shadow-sm">
          <Lock className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-wider text-duo-goldDark bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Conquista Bloqueada
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight mt-3">
            Dashboard em Construção! 🐱
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-2">
            Para liberar seus gráficos e relatórios detalhados, preencha as{' '}
            <strong>5 Despesas Essenciais</strong> (Moradia, Alimentação, Transporte, Saúde e Educação) em qualquer mês.
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

  // Fetch Dashboard Data
  const { data, isLoading } = useQuery<DashboardResponse>({
    queryKey: ['dashboard', viewType, selectedYear, selectedMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('view', viewType);
      if (selectedYear) params.append('year', selectedYear.toString());
      if (selectedMonth) params.append('month', selectedMonth.toString());

      const res = await api.get<DashboardResponse>(`/dashboard?${params.toString()}`);
      return res.data;
    },
  });

  const availableYears = data?.availablePeriods.map((p) => p.year) || [];
  const currentYear = selectedYear || data?.currentPeriod.year || availableYears[0];
  const monthsInSelectedYear =
    data?.availablePeriods.find((p) => p.year === currentYear)?.months || [];
  const currentMonth =
    selectedMonth || data?.currentPeriod.month || monthsInSelectedYear[0] || 1;

  if (isLoading) {
    return (
      <div className="card-tactile text-center py-20 text-gray-400 font-bold">
        Carregando gráficos do Dashboard...
      </div>
    );
  }

  const hasData = data?.hasData || false;
  const incomeCents = data?.incomeCents || 0;
  const expenseCents = data?.expenseCents || 0;
  const balanceCents = data?.balanceCents || 0;
  const expensesByCategory = data?.expensesByCategory || [];
  const monthlyComparison = data?.monthlyComparison || [];

  // Formatar dados do gráfico comparativo
  const barChartData = monthlyComparison.map((m) => ({
    name: getMonthName(m.month).slice(0, 3),
    Receitas: m.incomeCents / 100,
    Despesas: m.expenseCents / 100,
    Saldo: m.balanceCents / 100,
  }));

  // Formatar dados do gráfico de pizza
  const pieChartData = expensesByCategory.map((c) => ({
    name: c.categoryName,
    value: c.amountCents / 100,
    percentage: c.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-duo-goldDark" />
            Dashboard Financeiro
          </h1>
          <p className="text-xs sm:text-sm font-bold text-gray-500 mt-1">
            Visão consolidada de entradas, saídas e distribuição por categoria.
          </p>
        </div>

        {/* View Switcher and Period Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Período */}
          {availableYears.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={currentYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setSelectedMonth(undefined);
                }}
                className="input-tactile text-xs font-bold py-2 px-3 bg-white"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {viewType === 'MONTHLY' && monthsInSelectedYear.length > 0 && (
                <select
                  value={currentMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="input-tactile text-xs font-bold py-2 px-3 bg-white"
                >
                  {monthsInSelectedYear.map((m) => (
                    <option key={m} value={m}>
                      {getMonthName(m)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Toggle Mensal / Anual */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border-2 border-duo-gray">
            <button
              onClick={() => setViewType('MONTHLY')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                viewType === 'MONTHLY'
                  ? 'bg-duo-blue text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewType('ANNUAL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                viewType === 'ANNUAL'
                  ? 'bg-duo-blue text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Anual
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-tactile bg-emerald-50/50 border-duo-green/40 border-b-duo-greenDark flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-duo-green text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-duo-greenDark">
              Total Receitas
            </p>
            <p className="text-xl sm:text-2xl font-black text-gray-800 mt-0.5">
              {formatCentsToBRL(incomeCents)}
            </p>
          </div>
        </div>

        <div className="card-tactile bg-red-50/50 border-duo-coral/40 border-b-duo-coralDark flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-duo-coral text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-duo-coralDark">
              Total Despesas
            </p>
            <p className="text-xl sm:text-2xl font-black text-gray-800 mt-0.5">
              {formatCentsToBRL(expenseCents)}
            </p>
          </div>
        </div>

        <div className="card-tactile bg-blue-50/50 border-duo-blue/40 border-b-duo-blueDark flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-duo-blue text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-duo-blueDark">
              Saldo Líquido
            </p>
            <p className="text-xl sm:text-2xl font-black text-gray-800 mt-0.5">
              {formatCentsToBRL(balanceCents)}
            </p>
          </div>
        </div>
      </div>

      {/* Graphs or Empty State */}
      {!hasData ? (
        <div className="card-tactile text-center py-16 space-y-4 my-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-duo-goldDark flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-800">
              Ainda não há movimentações financeiras reais
            </h3>
            <p className="text-xs font-semibold text-gray-500 max-w-md mx-auto">
              Você desbloqueou o Dashboard preenchendo as 5 essenciais! Para visualizar os gráficos de evolução e distribuição, lance receitas ou despesas nas suas planilhas.
            </p>
          </div>
          <div className="pt-2">
            <TactileButton
              variant="blue"
              size="md"
              onClick={() => navigate('/sheets')}
            >
              <Calendar className="w-4 h-4" />
              Ver Minhas Planilhas
            </TactileButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Despesas por Categoria (Pizza) */}
          <div className="card-tactile space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-duo-coral" />
                Despesas por Categoria
              </h2>
              <span className="text-xs font-bold text-gray-400">
                {viewType === 'MONTHLY'
                  ? `${getMonthName(currentMonth)}/${currentYear}`
                  : `Ano ${currentYear}`}
              </span>
            </div>

            {pieChartData.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-bold text-xs">
                Nenhuma despesa registrada neste período.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) =>
                        `R$ ${Number(value).toFixed(2).replace('.', ',')}`
                      }
                    />
                    <Legend
                      formatter={(value, entry: any) => (
                        <span className="text-xs font-bold text-gray-700">
                          {value} ({entry.payload.percentage}%)
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Gráfico 2: Evolução Mensal Receitas vs Despesas (Barras) */}
          <div className="card-tactile space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-duo-blue" />
                Evolução Mensal ({currentYear})
              </h2>
              <span className="text-xs font-bold text-gray-400">12 Meses</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: any) =>
                      `R$ ${Number(value).toFixed(2).replace('.', ',')}`
                    }
                  />
                  <Legend />
                  <Bar dataKey="Receitas" fill="#58CC02" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#FF4B4B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
