import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { useAuthStore } from './features/auth/store/authStore';
import { LoginForm } from './features/auth/components/LoginForm';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function MainApp() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />
        } 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

import { GlobalRealtimeProvider } from './shared/signalr/components/GlobalRealtimeProvider';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GlobalRealtimeProvider>
           <Toaster position="top-center" richColors />
           <MainApp />
        </GlobalRealtimeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
