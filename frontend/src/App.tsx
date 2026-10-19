import { Sparkles, DollarSign, BookOpen, ShieldCheck } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full card-tactile text-center space-y-6">
        <div className="w-20 h-20 bg-duo-green/20 rounded-full flex items-center justify-center mx-auto text-duo-green">
          <Sparkles className="w-10 h-10 animate-bounce" />
        </div>
        
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">CatFinance 🐱</h1>
          <p className="text-gray-500 font-semibold mt-2">
            Controle financeiro pessoal e educação financeira sem julgamentos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-duo-blue" />
            <span className="text-xs font-bold text-gray-700">100% em centavos</span>
          </div>
          <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-duo-green" />
            <span className="text-xs font-bold text-gray-700">Trilha de Aulas</span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2 col-span-2">
            <ShieldCheck className="w-6 h-6 text-duo-purple" />
            <span className="text-xs font-bold text-gray-700">Isolamento total e privacidade</span>
          </div>
        </div>

        <button className="btn-tactile-green w-full text-lg">
          Começar Agora
        </button>
      </div>
    </div>
  );
}
