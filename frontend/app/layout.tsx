'use client'; // Adicionar no topo se ainda não for client component

// Conteúdo inicial para o layout raiz
import '@/styles/globals.css';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Opcional, para dev

// Criar uma instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false, // Opcional: desabilitar refetch ao focar janela
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryClientProvider client={queryClient}> {/* Provedor do React Query */}
          <AuthProvider>
            {children}
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} /> {/* Opcional: Devtools */}
        </QueryClientProvider>
      </body>
    </html>
  );
} 