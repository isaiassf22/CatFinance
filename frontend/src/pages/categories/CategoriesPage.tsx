import React, { useState } from 'react';
import { Tags, Plus, Shield, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { TactileButton } from '../../components/ui/TactileButton';

export const CategoriesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // 14 Standard System Categories defined in docs/RULES.md
  const standardExpenses = [
    { name: 'Moradia', isEssential: true },
    { name: 'Alimentação', isEssential: true },
    { name: 'Transporte', isEssential: true },
    { name: 'Saúde', isEssential: true },
    { name: 'Educação', isEssential: true },
    { name: 'Dívidas e cartão de crédito', isEssential: false },
    { name: 'Lazer', isEssential: false },
    { name: 'Cuidados pessoais', isEssential: false },
    { name: 'Outras despesas', isEssential: false },
  ];

  const standardIncomes = [
    { name: 'Salário', isEssential: false },
    { name: 'Investimentos', isEssential: false },
    { name: 'Pensão/auxílio', isEssential: false },
    { name: 'Dividendos', isEssential: false },
    { name: 'Outras receitas', isEssential: false },
  ];

  const displayed = activeTab === 'EXPENSE' ? standardExpenses : standardIncomes;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Tags className="w-8 h-8 text-duo-green" />
            Categorias Financeiras
          </h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            14 categorias padrão organizadas por tipo e suas categorias personalizadas.
          </p>
        </div>

        <TactileButton variant="green">
          <Plus className="w-5 h-5" />
          Nova Categoria
        </TactileButton>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('EXPENSE')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 border-b-4 transition-all ${
            activeTab === 'EXPENSE'
              ? 'bg-duo-coral text-white border-duo-coral border-b-duo-coralDark shadow-sm'
              : 'bg-white text-gray-600 border-duo-gray border-b-duo-grayDark hover:bg-gray-50'
          }`}
        >
          <ArrowDownLeft className="w-5 h-5" />
          Despesas ({standardExpenses.length})
        </button>

        <button
          onClick={() => setActiveTab('INCOME')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 border-b-4 transition-all ${
            activeTab === 'INCOME'
              ? 'bg-duo-green text-white border-duo-green border-b-duo-greenDark shadow-sm'
              : 'bg-white text-gray-600 border-duo-gray border-b-duo-grayDark hover:bg-gray-50'
          }`}
        >
          <ArrowUpRight className="w-5 h-5" />
          Receitas ({standardIncomes.length})
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayed.map((cat, index) => (
          <div
            key={index}
            className="card-tactile flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                  activeTab === 'EXPENSE'
                    ? 'bg-red-50 text-duo-coral'
                    : 'bg-green-50 text-duo-green'
                }`}
              >
                {index + 1}
              </div>
              <div>
                <p className="font-extrabold text-sm text-gray-800">{cat.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Padrão do Sistema
                  </span>
                  {cat.isEssential && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-duo-goldDark">
                      Essencial
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span title="Imutável pelo sistema">
              <Shield className="w-4 h-4 text-gray-300" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
