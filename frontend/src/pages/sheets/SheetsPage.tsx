import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Folder,
  Calendar,
  Plus,
  ArrowRight,
  ShieldCheck,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { TactileButton } from '../../components/ui/TactileButton';
import { SelectableCard } from '../../components/ui/SelectableCard';
import { getMonthName } from '../../lib/formatters';
import { toast } from 'sonner';

interface SheetItem {
  id: string;
  year: number;
  month: number;
  recurrencePromptDismissed: boolean;
  hasRealTransactions: boolean;
  essentialProgress: {
    completed: number;
    total: number;
  };
}

interface SheetsResponse {
  yearsWithSheets: number[];
  existingSheets: SheetItem[];
  availableMonthsToCreate: number[];
}

export const SheetsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMonthToCreate, setSelectedMonthToCreate] = useState<number>(1);
  const [sheetToDelete, setSheetToDelete] = useState<SheetItem | null>(null);

  // Fetch Sheets for selected year
  const { data, isLoading } = useQuery<SheetsResponse>({
    queryKey: ['sheets', selectedYear],
    queryFn: async () => {
      const response = await api.get<SheetsResponse>(`/sheets?year=${selectedYear}`);
      return response.data;
    },
  });

  const yearsWithSheets = data?.yearsWithSheets || [currentYear];
  const existingSheets = data?.existingSheets || [];
  const availableMonths = data?.availableMonthsToCreate || [];

  // Create Sheet Mutation
  const createSheetMutation = useMutation({
    mutationFn: async (vars: { year: number; month: number }) => {
      const response = await api.post('/sheets', vars);
      return response.data;
    },
    onSuccess: (newSheet) => {
      toast.success(`Planilha de ${getMonthName(newSheet.month)} criada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
      setIsCreateModalOpen(false);
      navigate(`/sheets/${newSheet.year}/${newSheet.month}`);
    },
  });

  // Delete Sheet Mutation
  const deleteSheetMutation = useMutation({
    mutationFn: async (sheetId: string) => {
      await api.delete(`/sheets/${sheetId}?confirm=true`);
    },
    onSuccess: () => {
      toast.success('Planilha excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
      setSheetToDelete(null);
    },
  });

  const handleOpenCreateModal = () => {
    if (availableMonths.length > 0) {
      setSelectedMonthToCreate(availableMonths[0]);
    }
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSheetMutation.mutate({
      year: selectedYear,
      month: selectedMonthToCreate,
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            Minhas Planilhas Mensais 📂
          </h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Navegue pelos anos e acerte as finanças mês a mês sem complicação.
          </p>
        </div>

        <TactileButton variant="green" onClick={handleOpenCreateModal}>
          <Plus className="w-5 h-5" />
          Criar Planilha Mensal
        </TactileButton>
      </div>

      {/* Year Selection Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {yearsWithSheets.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all duration-100 flex items-center gap-2 border-2 border-b-4 select-none ${
              selectedYear === year
                ? 'bg-duo-blue text-white border-duo-blue border-b-duo-blueDark shadow-sm'
                : 'bg-white text-gray-600 border-duo-gray border-b-duo-grayDark hover:bg-gray-50'
            }`}
          >
            <Folder className="w-5 h-5" />
            Ano {year}
          </button>
        ))}
      </div>

      {/* Monthly Sheets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-700 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-duo-blue" />
            Meses Registrados em {selectedYear}
          </h2>
          <span className="text-xs font-extrabold text-gray-400">
            {existingSheets.length} planilha(s)
          </span>
        </div>

        {isLoading ? (
          <div className="card-tactile text-center py-12 text-gray-400 font-bold">
            Carregando planilhas de {selectedYear}...
          </div>
        ) : existingSheets.length === 0 ? (
          <div className="card-tactile text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-duo-blue mx-auto flex items-center justify-center">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-800">
                Nenhuma planilha criada em {selectedYear}
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-1">
                Comece criando sua primeira planilha deste ano!
              </p>
            </div>
            <TactileButton variant="blue" size="md" onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4" />
              Criar Planilha Agora
            </TactileButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingSheets.map((sheet) => (
              <div key={sheet.id} className="relative group">
                <SelectableCard
                  icon={<Calendar className="w-6 h-6 text-duo-blue" />}
                  title={getMonthName(sheet.month)}
                  subtitle={`Planilha de ${sheet.year}`}
                  badge={`5 Essenciais: ${sheet.essentialProgress.completed}/5`}
                  variant="blue"
                  onClick={() => navigate(`/sheets/${sheet.year}/${sheet.month}`)}
                >
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-black text-duo-blue">
                    <span>
                      {sheet.hasRealTransactions
                        ? 'Contém movimentações'
                        : 'Sem lançamentos reais'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </SelectableCard>

                {/* Delete button option */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetToDelete(sheet);
                  }}
                  title="Deletar planilha"
                  className="absolute top-4 right-4 p-2 rounded-xl text-gray-300 hover:text-duo-coral hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Helpful Education Tip */}
      <div className="p-5 rounded-2xl bg-amber-50 border-2 border-duo-gold border-b-4 border-b-duo-goldDark flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-duo-gold/30 flex items-center justify-center text-duo-goldDark flex-shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-black text-sm text-gray-800">
            Dica do CatFinance: As 5 Despesas Essenciais
          </h3>
          <p className="text-xs font-semibold text-gray-600 mt-1">
            Preencha Moradia, Alimentação, Transporte, Saúde e Educação em qualquer mês
            para desbloquear permanentemente seu Dashboard com relatórios e gráficos!
          </p>
        </div>
      </div>

      {/* MODAL: Criar Planilha Mensal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border-2 border-duo-gray border-b-4 border-b-duo-grayDark p-6 max-w-md w-full space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-duo-green" />
                Criar Planilha Mensal
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availableMonths.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <p className="font-bold text-gray-600 text-sm">
                  Todos os 12 meses de {selectedYear} já foram criados!
                </p>
                <TactileButton
                  variant="gray"
                  size="md"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Fechar
                </TactileButton>
              </div>
            ) : (
              <form onSubmit={handleConfirmCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-600 mb-1">
                    Ano Selecionado
                  </label>
                  <input
                    type="number"
                    disabled
                    value={selectedYear}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-duo-gray font-bold text-sm bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-600 mb-1">
                    Escolha o Mês Disponível
                  </label>
                  <select
                    value={selectedMonthToCreate}
                    onChange={(e) => setSelectedMonthToCreate(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-duo-gray font-bold text-sm bg-white focus:outline-none focus:border-duo-green cursor-pointer"
                  >
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>
                        {getMonthName(m)} (Mês {m})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] font-semibold text-gray-400 mt-1">
                    Meses já criados anteriormente não são listados.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <TactileButton
                    type="button"
                    variant="gray"
                    fullWidth
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </TactileButton>
                  <TactileButton
                    type="submit"
                    variant="green"
                    fullWidth
                    disabled={createSheetMutation.isPending}
                  >
                    {createSheetMutation.isPending ? 'Criando...' : 'Criar Planilha'}
                  </TactileButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Exclusão de Planilha */}
      {sheetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border-2 border-duo-coral border-b-4 border-b-duo-coralDark p-6 max-w-md w-full space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-duo-coral flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-gray-800">
                Deletar Planilha de {getMonthName(sheetToDelete.month)}/{sheetToDelete.year}?
              </h3>
              <p className="text-xs font-semibold text-gray-600 leading-relaxed">
                Esta ação apagará <strong>atomicamente</strong> a planilha, seus lançamentos e declarações deste mês.
                <br />
                <em>(Suas regras de recorrência para outros meses continuarão preservadas).</em>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <TactileButton
                variant="gray"
                fullWidth
                onClick={() => setSheetToDelete(null)}
              >
                Voltar
              </TactileButton>
              <TactileButton
                variant="coral"
                fullWidth
                disabled={deleteSheetMutation.isPending}
                onClick={() => deleteSheetMutation.mutate(sheetToDelete.id)}
              >
                {deleteSheetMutation.isPending ? 'Deletando...' : 'Sim, Deletar'}
              </TactileButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
