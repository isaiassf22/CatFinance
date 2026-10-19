import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { SheetsPage } from './pages/sheets/SheetsPage';
import { SheetDetailPage } from './pages/sheets/SheetDetailPage';
import { CategoriesPage } from './pages/categories/CategoriesPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LearnPage } from './pages/learn/LearnPage';
import { LessonDetailPage } from './pages/learn/LessonDetailPage';
import { SettingsPage } from './pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <BrowserRouter>
          <Routes>
            {/* Public Routes (Redirect to /sheets if logged in) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected Routes (Require JWT Auth) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/sheets" replace />} />
                <Route path="/sheets" element={<SheetsPage />} />
                <Route path="/sheets/:year/:month" element={<SheetDetailPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/learn" element={<LearnPage />} />
                <Route path="/learn/:lessonId" element={<LessonDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/sheets" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
