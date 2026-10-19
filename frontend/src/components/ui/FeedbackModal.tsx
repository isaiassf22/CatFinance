import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquarePlus, Send, X, CheckCircle2 } from 'lucide-react';
import { TactileButton } from './TactileButton';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Digite uma mensagem antes de enviar.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/feedbacks', {
        message: message.trim(),
        pageContext: location.pathname,
      });

      setSentSuccess(true);
      toast.success('Obrigado pelo seu feedback!');
      setTimeout(() => {
        setMessage('');
        setSentSuccess(false);
        onClose();
      }, 1800);
    } catch {
      toast.error('Não foi possível enviar o feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card-tactile bg-white max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {sentSuccess ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-green-100 text-duo-green rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-800">
              Mensagem Recebida! 🐱
            </h3>
            <p className="text-xs font-semibold text-gray-500">
              Nosso time e nossos agentes automatizados lêem cada sugestão com carinho.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800">
                  Enviar Feedback
                </h3>
                <p className="text-xs font-semibold text-gray-500">
                  Tem alguma dúvida, elogio ou sugestão de melhoria?
                </p>
              </div>
            </div>

            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conte para nós como tem sido sua experiência no CatFinance..."
                rows={4}
                maxLength={1000}
                className="w-full rounded-2xl border-2 border-gray-200 p-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-purple-500 resize-none transition"
              />
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mt-1">
                <span>Contexto: {location.pathname}</span>
                <span>{message.length} / 1000</span>
              </div>
            </div>

            <div className="flex gap-2">
              <TactileButton
                type="button"
                variant="gray"
                size="md"
                className="flex-1"
                onClick={onClose}
              >
                Cancelar
              </TactileButton>
              <TactileButton
                type="submit"
                variant="purple"
                size="md"
                className="flex-1"
                disabled={isSubmitting || !message.trim()}
              >
                <Send className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </TactileButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
