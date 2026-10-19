import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Plus,
  Trash2,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Home,
  Utensils,
  Car,
  HeartPulse,
  GraduationCap,
} from 'lucide-react';
import { api } from '../../lib/api';
import { TactileButton } from '../../components/ui/TactileButton';
import { getMonthName, formatCentsToBRL } from '../../lib/formatters';
import { toast } from 'sonner';

interface SheetDetailResponse {
  sheet: {
    id: string;
    year: number;
    month: number;
    recurrencePromptDismissed: boolean;
  };
  summary: {
    incomeCents: number;
    expenseCents: number;
    balanceCents: number;
  };
  essentialsStatus: Array<{
    categoryId: string;
    name: string;
    isFilled: boolean;
    filledBy: 'TRANSACTION' | 'DECLARATION' | null;
    amountCents: number | null;
  }>;
  transactions: Array<{
    id: string;
    description: string;
    amountCents: number;
    type: 'INCOME' | 'EXPENSE';
    transactionDate: string;
    category: {
      name: string;
    };
  }>;
}

export const SheetDetailPage: React.FC = () => {
  const { year, month } = useParams<{ year: string; month: string }>();
  const navigate = useNavigate();

  const numYear = Number(year) || new Date().getFullYear();
  const numMonth = Number(month) || new Date().getMonth() + 1;

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch Sheet Detail
  const { data, isLoading } = useQuery<SheetDetailResponse>({
    queryKey: ['sheet-detail', numYear, numMonth],
    queryFn: async () => {
      const response = await api.get<SheetDetailResponse>(
        `/sheets/${numYear}/${numMonth}`
      );
      return response.data;
    },
  });

  // Delete Sheet Mutation
  const deleteMutation = useMutation({
    mutationFn: async (sheetId: string) => {
      await api.delete(`/sheets/${sheetId}?confirm=true`);
    },
    onSuccess: () => {
      toast.success('Planilha excluída com sucesso!');
      navigate('/sheets');
    },
  });

  const getEssentialIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'moradia':
        return <Home className="w-5 h-5 text-duo-blue" />;
      case 'alimentação':
        return <Utensils className="w-5 h-5 text-duo-green" />;
      case 'transporte':
        return <Car className="w-5 h-5 text-duo-goldDark" />;
      case 'saúde':
        return <HeartPulse className="w-5 h-5 text-duo-coral" />;
      case 'educação':
        return <GraduationCap className="w-5 h-5 text-purple-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="card-tactile text-center py-16 text-gray-400 font-bold">
        Carregando planilha de {getMonthName(numMonth)}/{numYear}...
      </div>
    );
  }

  const summary = data?.summary || { incomeCents: 0, expenseCents: 0, balanceCents: 0 };
  const essentialsStatus = data?.essentialsStatus || [];
  const transactions = data?.transactions || [];

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

        <div className="flex items-center gap-2 relative">
          <TactileButton
            variant="green"
            size="md"
            onClick={() => toast.info('O cadastro de lançamentos faz parte do Passo 3!')}
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Lançamento</span>
          </TactileButton>

          {/* Options Menu Button */}
          <div className="relative">
            <button
              onClick={() => setIsOptionsOpen(!isOptionsOpen)}
              className="p-3 bg-white border-2 border-duo-gray border-b-4 border-b-duo-grayDark rounded-2xl hover:bg-gray-50 active:translate-y-0.5"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {isOptionsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border-2 border-duo-gray shadow-xl py-2 z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    setIsOptionsOpen(false);
                    toast.info('Recuperar recorrentes configurado para o Passo 4.');
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-gray-700 hover:bg-blue-50 hover:text-duo-blue flex items-center gap-2.5"
                >
                  <RefreshCw className="w-4 h-4 text-duo-blue" />
                  Recuperar recorrentes
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={() => {
                    setIsOptionsOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-duo-coral hover:bg-red-50 flex items-center gap-2.5"
                >
                  <Trash2 className="w-4 h-4 text-duo-coral" />
                  Deletar planilha
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
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

      {/* 5 Despesas Essenciais Progress Bar / Grid */}
      <div className="card-tactile space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
            Status das 5 Despesas Essenciais
          </h2>
          <span className="text-xs font-black text-duo-blue">
            {essentialsStatus.filter((e) => e.isFilled).length} de 5 concluídas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {essentialsStatus.map((item) => (
            <div
              key={item.categoryId}
              className={`p-3 rounded-2xl border-2 border-b-4 flex flex-col justify-between transition-all ${
                item.isFilled
                  ? 'bg-emerald-50/40 border-duo-green border-b-duo-greenDark'
                  : 'bg-white border-duo-gray border-b-duo-grayDark'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shadow-xs">
                  {getEssentialIcon(item.name)}
                </div>
                {item.isFilled ? (
                  <CheckCircle2 className="w-5 h-5 text-duo-green" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <div className="mt-3">
                <p className="font-extrabold text-xs text-gray-800 truncate">
                  {item.name}
                </p>
                <p className="text-[10px] font-bold mt-0.5 text-gray-500">
                  {item.isFilled
                    ? item.filledBy === 'DECLARATION'
                      ? 'Declarado ausente'
                      : formatCentsToBRL(item.amountCents || 0)
                    : 'Pendente'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="card-tactile space-y-4">
        <h2 className="text-lg font-black text-gray-800">
          Lançamentos do Mês ({transactions.length})
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-500">
              Nenhum lançamento adicionado nesta planilha ainda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-sm text-gray-800">{tx.description}</p>
                  <p className="text-xs text-gray-400 font-semibold">
                    {tx.category.name} • {tx.transactionDate}
                  </p>
                </div>
                <span
                  className={`font-black text-sm ${
                    tx.type === 'INCOME' ? 'text-duo-green' : 'text-duo-coral'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'} {formatCentsToBRL(tx.amountCents)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Sheet Confirmation Modal */}
      {isDeleteModalOpen && data?.sheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border-2 border-duo-coral border-b-4 border-b-duo-coralDark p-6 max-w-md w-full space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-duo-coral flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-gray-800">
                Deletar Planilha de {getMonthName(data.sheet.month)}/{data.sheet.year}?
              </h3>
              <p className="text-xs font-semibold text-gray-600 leading-relaxed">
                Esta ação apagará <strong>atomicamente</strong> esta planilha, seus lançamentos e declarações deste mês.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <TactileButton
                variant="gray"
                fullWidth
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </TactileButton>
              <TactileButton
                variant="coral"
                fullWidth
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(data.sheet.id)}
              >
                {deleteMutation.isPending ? 'Deletando...' : 'Sim, Deletar'}
              </TactileButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
