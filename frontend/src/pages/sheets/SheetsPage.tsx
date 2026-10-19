import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Calendar,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { TactileButton } from '../../components/ui/TactileButton';
import { SelectableCard } from '../../components/ui/SelectableCard';
import { getMonthName } from '../../lib/formatters';

export const SheetsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Example placeholder state preparing for Passo 2 integration
  const availableYears = [currentYear];
  const exampleSheets = [
    {
      id: 'sheet-1',
      year: currentYear,
      month: new Date().getMonth() + 1,
      essentialCompleted: 0,
      hasRealTransactions: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">
            Minhas Planilhas Mensais 📂
          </h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Navegue pelos anos e acerte as finanças mês a mês sem complicação.
          </p>
        </div>

        <TactileButton
          variant="green"
          onClick={() => {
            // Will open modal in Passo 2
            navigate(`/sheets/${selectedYear}/${new Date().getMonth() + 1}`);
          }}
        >
          <Plus className="w-5 h-5" />
          Nova Planilha
        </TactileButton>
      </div>

      {/* Year Selection Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all duration-700 flex items-center gap-2 border-2 border-b-4 select-none ${
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
            {exampleSheets.length} planilha(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exampleSheets.map((sheet) => (
            <SelectableCard
              key={sheet.id}
              icon={<Calendar className="w-6 h-6 text-duo-blue" />}
              title={getMonthName(sheet.month)}
              subtitle={`Planilha de ${sheet.year}`}
              badge={`5 Essenciais: ${sheet.essentialCompleted}/5`}
              variant="blue"
              onClick={() => navigate(`/sheets/${sheet.year}/${sheet.month}`)}
            >
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-black text-duo-blue">
                <span>Abrir planilha</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </SelectableCard>
          ))}
        </div>
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
    </div>
  );
};
