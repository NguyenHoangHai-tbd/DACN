import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { useAuthStore } from './features/auth/store/authStore';
import { LoginForm } from './features/auth/components/LoginForm';
import { LandingPage } from './features/landing/pages/LandingPage';
import { GlobalRealtimeProvider } from './shared/signalr/components/GlobalRealtimeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function MainApp() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />
        } 
      />
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

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
