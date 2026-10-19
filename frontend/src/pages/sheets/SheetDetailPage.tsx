import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
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
  Edit2,
  X,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { TactileButton } from '../../components/ui/TactileButton';
import { getMonthName, formatCentsToBRL, parseBRLToCents } from '../../lib/formatters';
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
    categoryId: string;
    notes?: string | null;
    recurrenceRuleId?: string | null;
    category: {
      id: string;
      name: string;
      type: 'INCOME' | 'EXPENSE';
      isEssential: boolean;
    };
  }>;
}

interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  isSystem: boolean;
  isEssential: boolean;
}

export const SheetDetailPage: React.FC = () => {
  const { year, month } = useParams<{ year: string; month: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const numYear = Number(year) || new Date().getFullYear();
  const numMonth = Number(month) || new Date().getMonth() + 1;

  // Options & Deletion states
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Transaction Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [formDescription, setFormDescription] = useState('');
  const [formAmountStr, setFormAmountStr] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);

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

  // Fetch Categories for Dropdown
  const { data: categoriesData } = useQuery<{ items: CategoryItem[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<{ items: CategoryItem[] }>('/categories');
      return response.data;
    },
  });

  const availableCategories = (categoriesData?.items || []).filter(
    (c) => c.type === formType
  );

  // Min and Max dates strictly restricted to the sheet's month and year (DEC-14, DEC-31)
  const lastDayOfMonth = new Date(numYear, numMonth, 0).getDate();
  const minDateStr = `${numYear}-${String(numMonth).padStart(2, '0')}-01`;
  const maxDateStr = `${numYear}-${String(numMonth).padStart(2, '0')}-${String(
    lastDayOfMonth
  ).padStart(2, '0')}`;

  // Trigger celebration on completing all 5 essentials and unlocking dashboard
  const triggerConfettiCelebration = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B'],
    });
  };

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

  // Essential Declaration Mutation ("Não tenho esse gasto")
  const declarationMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!data?.sheet.id) return;
      const res = await api.post(
        `/sheets/${data.sheet.id}/essential-declarations`,
        { categoryId }
      );
      return res.data;
    },
    onSuccess: (resData) => {
      toast.success('Declaração registrada!');
      queryClient.invalidateQueries({ queryKey: ['sheet-detail', numYear, numMonth] });
      queryClient.invalidateQueries({ queryKey: ['me'] });

      if (resData?.dashboardUnlockedNow) {
        triggerConfettiCelebration();
        toast.success(
          '🎉 Parabéns! Você concluiu as 5 despesas essenciais e liberou o Dashboard!'
        );
      }
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error?.message ||
          'Erro ao registrar declaração de ausência'
      );
    },
  });

  // Remove Essential Declaration Mutation
  const removeDeclarationMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!data?.sheet.id) return;
      await api.delete(
        `/sheets/${data.sheet.id}/essential-declarations/${categoryId}`
      );
    },
    onSuccess: () => {
      toast.success('Declaração removida!');
      queryClient.invalidateQueries({ queryKey: ['sheet-detail', numYear, numMonth] });
    },
  });

  // Save Transaction (Create or Update)
  const saveTransactionMutation = useMutation({
    mutationFn: async () => {
      if (!data?.sheet.id) return;
      const amountCents = parseBRLToCents(formAmountStr);
      if (amountCents < 1) {
        throw new Error('Informe um valor válido em centavos (mínimo R$ 0,01)');
      }
      if (!formDescription.trim()) {
        throw new Error('A descrição é obrigatória');
      }
      if (!formCategoryId) {
        throw new Error('Selecione uma categoria');
      }
      if (!formDate) {
        throw new Error('Selecione uma data');
      }

      if (editingTransaction) {
        const res = await api.patch(`/transactions/${editingTransaction.id}`, {
          description: formDescription.trim(),
          amountCents,
          categoryId: formCategoryId,
          transactionDate: formDate,
          notes: formNotes.trim() || null,
          isRecurring: formIsRecurring,
        });
        return { isEdit: true, data: res.data };
      } else {
        const res = await api.post(`/sheets/${data.sheet.id}/transactions`, {
          description: formDescription.trim(),
          amountCents,
          type: formType,
          categoryId: formCategoryId,
          transactionDate: formDate,
          notes: formNotes.trim() || null,
          isRecurring: formIsRecurring,
        });
        return { isEdit: false, data: res.data };
      }
    },
    onSuccess: (result) => {
      toast.success(
        result?.isEdit
          ? 'Lançamento atualizado com sucesso!'
          : 'Lançamento adicionado com sucesso!'
      );
      setIsTransactionModalOpen(false);
      resetTransactionForm();
      queryClient.invalidateQueries({ queryKey: ['sheet-detail', numYear, numMonth] });
      queryClient.invalidateQueries({ queryKey: ['me'] });

      if (result?.data?.dashboardUnlockedNow) {
        triggerConfettiCelebration();
        toast.success(
          '🎉 Incrível! Você completou as 5 despesas essenciais e liberou o Dashboard!'
        );
      }
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Erro ao salvar lançamento'
      );
    },
  });

  // Delete Transaction Mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      await api.delete(`/transactions/${transactionId}`);
    },
    onSuccess: () => {
      toast.success('Lançamento removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['sheet-detail', numYear, numMonth] });
    },
  });

  const resetTransactionForm = () => {
    setEditingTransaction(null);
    setFormType('EXPENSE');
    setFormDescription('');
    setFormAmountStr('');
    setFormCategoryId('');
    setFormDate(minDateStr);
    setFormNotes('');
    setFormIsRecurring(false);
  };

  const openCreateTransactionModal = (initialCategory?: CategoryItem) => {
    resetTransactionForm();
    if (initialCategory) {
      setFormType(initialCategory.type);
      setFormCategoryId(initialCategory.id);
    }
    setFormDate(minDateStr);
    setIsTransactionModalOpen(true);
  };

  const openEditTransactionModal = (tx: any) => {
    setEditingTransaction(tx);
    setFormType(tx.type);
    setFormDescription(tx.description);
    setFormAmountStr((tx.amountCents / 100).toFixed(2).replace('.', ','));
    setFormCategoryId(tx.category?.id || tx.categoryId);
    const dateFormatted = tx.transactionDate.includes('T')
      ? tx.transactionDate.split('T')[0]
      : tx.transactionDate;
    setFormDate(dateFormatted);
    setFormNotes(tx.notes || '');
    setFormIsRecurring(!!tx.recurrenceRuleId);
    setIsTransactionModalOpen(true);
  };

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
  const completedEssentialsCount = essentialsStatus.filter((e) => e.isFilled).length;

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
            onClick={() => openCreateTransactionModal()}
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
          <div>
            <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-duo-green" />
              Status das 5 Despesas Essenciais
            </h2>
            <p className="text-xs font-semibold text-gray-500">
              Conclua as 5 no mesmo mês com despesa real ou "Não tenho esse gasto" para desbloquear o Dashboard!
            </p>
          </div>
          <span
            className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
              completedEssentialsCount === 5
                ? 'bg-duo-green text-white border-duo-greenDark'
                : 'bg-blue-50 text-duo-blue border-duo-blue/30'
            }`}
          >
            {completedEssentialsCount} de 5 concluídas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {essentialsStatus.map((item) => (
            <div
              key={item.categoryId}
              className={`p-3.5 rounded-2xl border-2 border-b-4 flex flex-col justify-between transition-all ${
                item.isFilled
                  ? 'bg-emerald-50/40 border-duo-green border-b-duo-greenDark'
                  : 'bg-white border-duo-gray border-b-duo-grayDark'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shadow-xs">
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
                  <p className="text-[11px] font-bold mt-0.5 text-gray-500">
                    {item.isFilled
                      ? item.filledBy === 'DECLARATION'
                        ? 'Declarado ausente'
                        : formatCentsToBRL(item.amountCents || 0)
                      : 'Pendente'}
                  </p>
                </div>
              </div>

              {/* Botões contextuais para a categoria essencial */}
              <div className="mt-4 pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                {!item.isFilled ? (
                  <>
                    <button
                      onClick={() => {
                        const matchedCat = availableCategories.find(
                          (c) => c.id === item.categoryId
                        );
                        openCreateTransactionModal(matchedCat);
                      }}
                      className="text-[10px] font-black py-1.5 px-2 bg-duo-green text-white rounded-xl hover:bg-duo-greenDark active:translate-y-0.5 text-center"
                    >
                      Lançar gasto
                    </button>
                    <button
                      onClick={() => declarationMutation.mutate(item.categoryId)}
                      disabled={declarationMutation.isPending}
                      className="text-[10px] font-bold py-1 px-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-center"
                    >
                      Não tenho esse gasto
                    </button>
                  </>
                ) : item.filledBy === 'DECLARATION' ? (
                  <button
                    onClick={() => removeDeclarationMutation.mutate(item.categoryId)}
                    className="text-[10px] font-bold py-1 px-2 text-duo-coral hover:bg-red-50 rounded-lg text-center"
                  >
                    Remover declaração
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-center text-duo-green">
                    ✓ Despesa registrada
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="card-tactile space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-800">
            Lançamentos do Mês ({transactions.length})
          </h2>
          <TactileButton
            variant="blue"
            size="sm"
            onClick={() => openCreateTransactionModal()}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </TactileButton>
        </div>

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
                className="py-3.5 flex items-center justify-between group hover:bg-gray-50/50 px-2 rounded-xl transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-800">{tx.description}</p>
                    {tx.recurrenceRuleId && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-100 text-duo-blue flex items-center gap-1">
                        <RefreshCw className="w-2.5 h-2.5" /> Recorrente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">
                    {tx.category?.name} • {tx.transactionDate.split('T')[0]}
                    {tx.notes ? ` • Obs: ${tx.notes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-black text-base ${
                      tx.type === 'INCOME' ? 'text-duo-green' : 'text-duo-coral'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'} {formatCentsToBRL(tx.amountCents)}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => openEditTransactionModal(tx)}
                      className="p-1.5 text-gray-400 hover:text-duo-blue rounded-lg hover:bg-blue-50"
                      title="Editar lançamento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Deseja realmente excluir este lançamento?')) {
                          deleteTransactionMutation.mutate(tx.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-duo-coral rounded-lg hover:bg-red-50"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Modal (Create / Edit) */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border-2 border-duo-gray border-b-4 border-b-duo-grayDark p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-duo-blue" />
                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <button
                onClick={() => setIsTransactionModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher (only for new transactions) */}
            {!editingTransaction && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('EXPENSE');
                    setFormCategoryId('');
                  }}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    formType === 'EXPENSE'
                      ? 'bg-duo-coral text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('INCOME');
                    setFormCategoryId('');
                  }}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    formType === 'INCOME'
                      ? 'bg-duo-green text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Receita
                </button>
              </div>
            )}

            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Aluguel, Supermercado, Salário"
                  className="input-tactile text-sm"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Valor (R$)
                </label>
                <input
                  type="text"
                  value={formAmountStr}
                  onChange={(e) => setFormAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="input-tactile text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Categoria
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="input-tactile text-sm font-bold bg-white"
                >
                  <option value="">Selecione uma categoria...</option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isEssential ? '⭐ (Essencial)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Data do Lançamento (restrita a {getMonthName(numMonth)}/{numYear})
                </label>
                <input
                  type="date"
                  min={minDateStr}
                  max={maxDateStr}
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="input-tactile text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Anotações adicionais"
                  className="input-tactile text-sm"
                  maxLength={500}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isRecurringCheck"
                  checked={formIsRecurring}
                  onChange={(e) => setFormIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-duo-green focus:ring-duo-green"
                />
                <label
                  htmlFor="isRecurringCheck"
                  className="text-xs font-extrabold text-gray-700 cursor-pointer"
                >
                  Repetir mensalmente (lançamento recorrente)
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <TactileButton
                variant="gray"
                fullWidth
                onClick={() => setIsTransactionModalOpen(false)}
              >
                Cancelar
              </TactileButton>
              <TactileButton
                variant={formType === 'INCOME' ? 'green' : 'coral'}
                fullWidth
                disabled={saveTransactionMutation.isPending}
                onClick={() => saveTransactionMutation.mutate()}
              >
                {saveTransactionMutation.isPending ? 'Salvando...' : 'Salvar'}
              </TactileButton>
            </div>
          </div>
        </div>
      )}

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
