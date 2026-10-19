import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Tags,
  LayoutDashboard,
  GraduationCap,
  Settings,
  LogOut,
  Cat,
  MessageSquarePlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TactileButton } from '../ui/TactileButton';
import { FeedbackModal } from '../ui/FeedbackModal';
import { GuidedOnboardingModal } from '../ui/GuidedOnboardingModal';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => user ? !user.onboardingCompleted : false
  );

  const navItems = [
    {
      to: '/sheets',
      label: 'Planilhas',
      icon: <FolderKanban className="w-6 h-6" />,
      color: 'text-duo-blue',
      activeBg: 'bg-blue-50 text-duo-blue border-2 border-duo-blue/30',
    },
    {
      to: '/categories',
      label: 'Categorias',
      icon: <Tags className="w-6 h-6" />,
      color: 'text-duo-green',
      activeBg: 'bg-green-50 text-duo-green border-2 border-duo-green/30',
    },
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-6 h-6" />,
      color: 'text-duo-goldDark',
      activeBg: 'bg-amber-50 text-duo-goldDark border-2 border-duo-gold/30',
    },
    {
      to: '/learn',
      label: 'Aprender',
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'text-purple-600',
      activeBg: 'bg-purple-50 text-purple-600 border-2 border-purple-200',
    },
    {
      to: '/settings',
      label: 'Ajustes',
      icon: <Settings className="w-6 h-6" />,
      color: 'text-gray-600',
      activeBg: 'bg-gray-100 text-gray-800 border-2 border-gray-300',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-duo-bg flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r-2 border-duo-gray p-5 justify-between sticky top-0 h-screen select-none">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-duo-green flex items-center justify-center text-white shadow-md border-b-4 border-duo-greenDark">
              <Cat className="w-7 h-7" />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight text-gray-800">
                CatFinance
              </span>
              <span className="block text-[11px] font-extrabold text-duo-green uppercase tracking-wider">
                Educação & Controle
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-2xl font-black text-sm tracking-wide transition-all ${
                    isActive
                      ? `${item.activeBg} shadow-sm font-extrabold`
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile, Feedback & Logout */}
        <div className="pt-4 border-t-2 border-duo-gray space-y-3">
          <TactileButton
            variant="purple"
            size="sm"
            fullWidth
            onClick={() => setIsFeedbackOpen(true)}
            className="text-xs"
          >
            <MessageSquarePlus className="w-4 h-4 mr-1" />
            Enviar Feedback
          </TactileButton>

          <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-[10px] font-black uppercase text-gray-400">
              Conta Conectada
            </p>
            <p className="text-xs font-bold text-gray-700 truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>

          <TactileButton
            variant="gray"
            size="sm"
            fullWidth
            onClick={handleLogout}
            className="text-xs text-duo-coral hover:text-duo-coralDark"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </TactileButton>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Floating feedback button on mobile */}
      <div className="md:hidden fixed top-4 right-4 z-40">
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="p-2.5 bg-purple-600 text-white rounded-full shadow-lg border-b-2 border-purple-800 active:translate-y-0.5"
          title="Enviar Feedback"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Guided Onboarding Modal */}
      {user && !user.onboardingCompleted && (
        <GuidedOnboardingModal
          isOpen={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-duo-gray flex items-center justify-around py-2 px-1 z-50 shadow-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive
                  ? 'text-duo-blue font-extrabold scale-110'
                  : 'text-gray-400 hover:text-gray-700'
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
