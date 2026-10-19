import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tags,
  Plus,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  AlertTriangle,
  X,
  Repeat,
  Receipt,
  FolderOpen,
} from 'lucide-react';
import { api } from '../../lib/api';
import { TactileButton } from '../../components/ui/TactileButton';
import { toast } from 'sonner';

interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  isSystem: boolean;
  isEssential: boolean;
  createdAt: string;
}

interface DeletePreviewResponse {
  categoryId: string;
  linkedTransactionsCount: number;
  hasActiveRecurrence: boolean;
  affectedSheetsCount: number;
}

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [deletePreview, setDeletePreview] = useState<DeletePreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Fetch Categories
  const { data, isLoading } = useQuery<{ items: CategoryItem[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<{ items: CategoryItem[] }>('/categories');
      return response.data;
    },
  });

  const categories = data?.items || [];
  const filteredCategories = categories.filter((c) => c.type === activeTab);
  const expenseCount = categories.filter((c) => c.type === 'EXPENSE').length;
  const incomeCount = categories.filter((c) => c.type === 'INCOME').length;

  // Create Category Mutation
  const createMutation = useMutation({
    mutationFn: async (vars: { name: string; type: 'INCOME' | 'EXPENSE' }) => {
      const response = await api.post('/categories', vars);
      return response.data;
    },
    onSuccess: (cat) => {
      toast.success(`Categoria "${cat.name}" criada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreateModalOpen(false);
      setNewCatName('');
    },
  });

  // Delete Category Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}?confirm=true`);
    },
    onSuccess: () => {
      toast.success('Categoria excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryToDelete(null);
      setDeletePreview(null);
    },
  });

  const handleOpenDelete = async (cat: CategoryItem) => {
    setCategoryToDelete(cat);
    setIsLoadingPreview(true);
    try {
      const res = await api.get<DeletePreviewResponse>(
        `/categories/${cat.id}/delete-preview`
      );
      setDeletePreview(res.data);
    } catch {
      setCategoryToDelete(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createMutation.mutate({
      name: newCatName.trim(),
      type: newCatType,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Tags className="w-8 h-8 text-duo-green" />
            Categorias Financeiras
          </h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Categorias do sistema e personalizadas com tipagem estrita (Receita / Despesa).
          </p>
        </div>

        <TactileButton
          variant="green"
          onClick={() => {
            setNewCatType(activeTab);
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </TactileButton>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('EXPENSE')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 border-b-4 transition-all duration-75 select-none ${
            activeTab === 'EXPENSE'
              ? 'bg-duo-coral text-white border-duo-coral border-b-duo-coralDark shadow-sm'
              : 'bg-white text-gray-600 border-duo-gray border-b-duo-grayDark hover:bg-gray-50'
          }`}
        >
          <ArrowDownLeft className="w-5 h-5" />
          Despesas ({expenseCount})
        </button>

        <button
          onClick={() => setActiveTab('INCOME')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 border-b-4 transition-all duration-75 select-none ${
            activeTab === 'INCOME'
              ? 'bg-duo-green text-white border-duo-green border-b-duo-greenDark shadow-sm'
              : 'bg-white text-gray-600 border-duo-gray border-b-duo-grayDark hover:bg-gray-50'
          }`}
        >
          <ArrowUpRight className="w-5 h-5" />
          Receitas ({incomeCount})
        </button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="card-tactile text-center py-12 text-gray-400 font-bold">
          Carregando categorias...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCategories.map((cat, index) => (
            <div
              key={cat.id}
              className={`card-tactile flex items-center justify-between p-4 ${
                !cat.isSystem ? 'border-l-4 border-l-duo-blue' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    activeTab === 'EXPENSE'
                      ? 'bg-red-50 text-duo-coral'
                      : 'bg-green-50 text-duo-green'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-sm text-gray-800 truncate">
                    {cat.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {cat.isSystem ? 'Sistema' : 'Personalizada'}
                    </span>
                    {cat.isEssential && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-duo-goldDark">
                        Essencial
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {cat.isSystem ? (
                <span title="Categoria padrão do sistema (Imutável)">
                  <Shield className="w-4 h-4 text-gray-300" />
                </span>
              ) : (
                <button
                  onClick={() => handleOpenDelete(cat)}
                  title="Excluir categoria"
                  className="p-2 rounded-xl text-gray-300 hover:text-duo-coral hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Nova Categoria */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border-2 border-duo-gray border-b-4 border-b-duo-grayDark p-6 max-w-md w-full space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Plus className="w-6 h-6 text-duo-green" />
                Criar Categoria Personalizada
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-600 mb-1">
                  Tipo da Categoria
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCatType('EXPENSE')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs border-2 select-none ${
                      newCatType === 'EXPENSE'
                        ? 'bg-red-50 text-duo-coral border-duo-coral'
                        : 'bg-white text-gray-500 border-duo-gray'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatType('INCOME')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs border-2 select-none ${
                      newCatType === 'INCOME'
                        ? 'bg-green-50 text-duo-green border-duo-green'
                        : 'bg-white text-gray-500 border-duo-gray'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-600 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  placeholder="Ex: Trabalho Freelance, Pet, etc."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-duo-gray font-bold text-sm bg-white focus:outline-none focus:border-duo-green"
                />
                <p className="text-[11px] font-semibold text-gray-400 mt-1">
                  Você pode usar o mesmo nome em tipos opostos (ex: Investimentos em receitas e em despesas).
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
                  disabled={createMutation.isPending || !newCatName.trim()}
                >
                  {createMutation.isPending ? 'Salvando...' : 'Criar Categoria'}
                </TactileButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Exclusão com Delete-Preview */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border-2 border-duo-coral border-b-4 border-b-duo-coralDark p-6 max-w-md w-full space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-duo-coral flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-gray-800">
                Excluir Categoria "{categoryToDelete.name}"?
              </h3>
              <p className="text-xs font-semibold text-gray-600">
                A exclusão desta categoria é definitiva e apagará atomicamente os seguintes registros vinculados:
              </p>
            </div>

            {isLoadingPreview ? (
              <p className="text-center text-xs font-bold text-gray-400 py-3">
                Calculando impacto da exclusão...
              </p>
            ) : deletePreview ? (
              <div className="bg-red-50/70 rounded-2xl p-4 border border-red-100 text-xs font-bold text-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-duo-coral" />
                  <span>
                    {deletePreview.linkedTransactionsCount} lançamento(s) vinculados serão apagados
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-duo-coral" />
                  <span>
                    Afetará {deletePreview.affectedSheetsCount} planilha(s) mensais
                  </span>
                </div>

                {deletePreview.hasActiveRecurrence && (
                  <div className="flex items-center gap-2 text-duo-coral font-black">
                    <Repeat className="w-4 h-4" />
                    <span>⚠️ Há regra de recorrência mensal ativa vinculada a esta categoria!</span>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex gap-3 pt-2">
              <TactileButton
                variant="gray"
                fullWidth
                onClick={() => {
                  setCategoryToDelete(null);
                  setDeletePreview(null);
                }}
              >
                Voltar
              </TactileButton>
              <TactileButton
                variant="coral"
                fullWidth
                disabled={deleteMutation.isPending || isLoadingPreview}
                onClick={() => deleteMutation.mutate(categoryToDelete.id)}
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
              </TactileButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
