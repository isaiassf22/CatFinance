import React, { useState } from 'react';
import {
  Settings,
  MessageSquare,
  AlertTriangle,
  Send,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { TactileButton } from '../../components/ui/TactileButton';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Feedback State
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // Delete Account State
  const [confirmationText, setConfirmationText] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle Onboarding
  const handleToggleOnboarding = async () => {
    try {
      const newStatus = !user?.onboardingCompleted;
      await api.patch('/me/onboarding', { completed: newStatus });
      updateUser({ onboardingCompleted: newStatus });
      toast.success(
        newStatus ? 'Onboarding marcado como concluído!' : 'Onboarding resetado!'
      );
    } catch {
      // Handled by api interceptor
    }
  };

  // Submit Feedback
  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    try {
      setIsSendingFeedback(true);
      await api.post('/feedbacks', {
        message: feedbackMessage,
        pageContext: 'settings',
      });
      toast.success('Obrigado pelo seu feedback! O CatFinance ouve você.');
      setFeedbackMessage('');
    } catch {
      // Handled by api interceptor
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // Delete Account (Hard Delete Cascade)
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationText !== 'EXCLUIR') {
      toast.error('Você deve digitar exatamente a palavra EXCLUIR.');
      return;
    }
    if (!currentPassword) {
      toast.error('Digite sua senha atual para confirmar a exclusão.');
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete('/me', {
        data: {
          confirmationText,
          currentPassword,
        },
      });
      toast.success('Sua conta e todos os seus dados foram excluídos definitivamente.');
      logout();
      navigate('/login');
    } catch {
      // Handled by api interceptor
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-gray-700" />
          Ajustes e Conta
        </h1>
        <p className="text-sm font-bold text-gray-500 mt-1">
          Gerencie suas preferências, envie sugestões ou encerre sua conta.
        </p>
      </div>

      {/* Onboarding Preferences */}
      <div className="card-tactile p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-duo-green" />
          Tour de Boas-Vindas (Onboarding)
        </h2>
        <p className="text-xs font-semibold text-gray-600">
          Status atual:{' '}
          <span className="font-black text-gray-800">
            {user?.onboardingCompleted ? 'Concluído' : 'Pendente'}
          </span>
        </p>
        <TactileButton
          variant="gray"
          size="sm"
          onClick={handleToggleOnboarding}
        >
          {user?.onboardingCompleted
            ? 'Marcar Onboarding como Pendente'
            : 'Marcar Onboarding como Concluído'}
        </TactileButton>
      </div>

      {/* Feedback Box */}
      <div className="card-tactile p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-duo-blue" />
          Caixa de Sugestões e Feedback
        </h2>
        <p className="text-xs font-semibold text-gray-600">
          Encontrou algo difícil ou quer sugerir uma melhoria? Envie uma mensagem direta para nós!
        </p>
        <form onSubmit={handleSendFeedback} className="space-y-3">
          <textarea
            rows={3}
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            placeholder="Conte-nos o que achou ou o que podemos melhorar..."
            className="w-full px-4 py-3 rounded-2xl border-2 border-duo-gray font-bold text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-duo-blue transition-all resize-none"
          />
          <TactileButton
            type="submit"
            variant="blue"
            size="md"
            disabled={isSendingFeedback || !feedbackMessage.trim()}
          >
            <Send className="w-4 h-4" />
            {isSendingFeedback ? 'Enviando...' : 'Enviar Feedback'}
          </TactileButton>
        </form>
      </div>

      {/* Danger Zone: Hard Delete Account */}
      <div className="card-tactile p-6 border-duo-coral/60 border-b-duo-coralDark bg-red-50/20 space-y-4">
        <div className="flex items-center gap-3 text-duo-coral">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <h2 className="text-lg font-black text-gray-800">Zona de Perigo: Excluir Conta</h2>
        </div>
        <p className="text-xs font-semibold text-gray-600 leading-relaxed">
          Ao excluir sua conta, todos os seus dados (planilhas, lançamentos, regras de recorrência e progresso em aulas) serão <strong>permanentemente apagados (Hard Delete atômico)</strong>. Esta ação não pode ser desfeita.
        </p>

        <form onSubmit={handleDeleteAccount} className="space-y-3">
          <div>
            <label className="block text-xs font-black uppercase text-gray-700 mb-1">
              Digite a palavra <span className="text-duo-coral">EXCLUIR</span> para confirmar:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="EXCLUIR"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-duo-gray font-bold text-sm bg-white focus:outline-none focus:border-duo-coral"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-700 mb-1">
              Sua senha atual:
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-duo-gray font-bold text-sm bg-white focus:outline-none focus:border-duo-coral"
            />
          </div>

          <TactileButton
            type="submit"
            variant="coral"
            size="md"
            disabled={isDeleting || confirmationText !== 'EXCLUIR' || !currentPassword}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Excluindo dados...' : 'Excluir Minha Conta Definitivamente'}
          </TactileButton>
        </form>
      </div>
    </div>
  );
};
