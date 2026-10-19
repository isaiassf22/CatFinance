import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-duo-bg">
        <div className="w-16 h-16 rounded-full bg-duo-green/20 flex items-center justify-center text-duo-green animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>
        <p className="font-extrabold text-gray-500 mt-4 text-sm tracking-wide">
          Carregando CatFinance...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
