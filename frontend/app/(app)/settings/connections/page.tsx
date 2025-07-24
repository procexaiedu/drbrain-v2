"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import WhatsappConnectionCard from '@/components/whatsapp/WhatsappConnectionCard';

// Componente wrapper para usar useSearchParams
function ConnectionsPageContent() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Inicia como true para cobrir a verificação inicial
  const [isSubmitting, setIsSubmitting] = useState(false); // Para ações de conectar/desconectar
  const { session } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('/edge/v1/google-calendar-auth-status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.isConnected);
        } else {
          console.warn('Falha ao verificar status da conexão, assumindo desconectado.');
          setIsConnected(false); 
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Erro ao buscar status da conexão:', error.message);
        } else {
          console.error('Erro desconhecido ao buscar status da conexão:', error);
        }
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    const statusParam = searchParams.get('status');
    if (statusParam === 'google_calendar_connected') {
      setIsConnected(true);
      setIsLoading(false);
      // Opcional: limpar o parâmetro da URL
      // window.history.replaceState(null, '', window.location.pathname);
    } else {
      checkConnectionStatus();
    }
  }, [session, searchParams]);

  const handleConnect = async () => {
    if (!session || !session.access_token) {
      console.error("Sessão ou token de acesso não encontrados.");
      alert("Você precisa estar logado para conectar sua conta Google Calendar.");
      return;
    }
    setIsSubmitting(true);
    try {
      const connectUrl = '/edge/v1/google-calendar-auth-connect';
      const response = await fetch(connectUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao conectar', details: response.statusText }));
        console.error("Erro ao obter URL de conexão:", errorData);
        alert(`Falha ao iniciar conexão: ${errorData.error} - ${errorData.details || 'Verifique o console.'}`);
        setIsSubmitting(false);
        return;
      }

      const { googleAuthUrl } = await response.json();
      if (googleAuthUrl) {
        window.location.href = googleAuthUrl;
      } else {
        console.error("URL de autorização do Google não recebida.");
        alert("Não foi possível obter a URL de autorização do Google.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Erro inesperado ao tentar conectar com o Google Calendar:", error);
      alert("Ocorreu um erro inesperado. Verifique o console.");
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!session || !session.access_token) {
      console.error("Sessão ou token de acesso não encontrados.");
      alert("Você precisa estar logado para desconectar sua conta Google Calendar.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/edge/v1/google-calendar-auth-disconnect', { // Endpoint a ser criado
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao desconectar' }));
        throw new Error(errorData.message || 'Falha ao desconectar');
      }
      setIsConnected(false);
      alert('Desconectado do Google Calendar com sucesso!');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erro ao desconectar:', error.message);
        alert('Falha ao desconectar: ' + error.message);
      } else {
        console.error('Erro desconhecido ao desconectar:', error);
        alert('Falha ao desconectar: Erro desconhecido.');
      }
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Verificando status da conexão...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Minhas Conexões</h1>
      
      <div className="space-y-6">
        {/* WhatsApp Business Connection */}
        <WhatsappConnectionCard />
        
        {/* Google Calendar Connection */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Google Calendar</h2>
              <p className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Não conectado - Conecte para sincronizar sua agenda.'}
              </p>
            </div>
            {isConnected ? (
              <button 
                onClick={handleDisconnect} 
                disabled={isSubmitting} 
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Desconectando...' : 'Desconectar'}
              </button>
            ) : (
              <button 
                onClick={handleConnect} 
                disabled={isSubmitting} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Conectando...' : 'Conectar com Google Calendar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal que usa Suspense para useSearchParams
const ConnectionsPage = () => {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConnectionsPageContent />
    </Suspense>
  );
};

export default ConnectionsPage; 