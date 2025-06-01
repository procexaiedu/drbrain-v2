"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // Corrigido para usar useAuth
// import { Button } from '@/components/ui/button'; // Comentado: aguardando definição/criação do componente Button

const ConnectionsPage = () => {
  const [isConnected, setIsConnected] = useState(false); // Simulação inicial
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth(); // Corrigido para usar useAuth e obter a session

  // TODO: Adicionar lógica para buscar o status real da conexão do backend
  useEffect(() => {
    // Exemplo: verificar se há tokens para 'google_calendar' para este médico
    // const checkConnectionStatus = async () => {
    //   try {
    //     const response = await fetch('/edge/v1/auth/google/calendar/status'); // Endpoint a ser criado
    //     const data = await response.json();
    //     setIsConnected(data.isConnected);
    //   } catch (error) {
    //     if (error instanceof Error) {
    //       console.error('Erro ao buscar status da conexão:', error.message);
    //     } else {
    //       console.error('Erro desconhecido ao buscar status da conexão:', error);
    //     }
    //   }
    // };
    // checkConnectionStatus();
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (!session || !session.access_token) { // Verifica se a session e o access_token existem
        console.error("Sessão ou token de acesso não encontrados, não é possível conectar.");
        alert("Você precisa estar logado para conectar sua conta Google Calendar.");
        setIsLoading(false);
        return;
      }

      const connectUrl = '/edge/v1/google-calendar-auth-connect';
      console.log("Tentando obter URL de conexão do Google Calendar de:", connectUrl);

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
        alert(`Falha ao iniciar conexão: ${errorData.error} - ${errorData.details || 'Verifique o console para mais detalhes.'}`);
        setIsLoading(false);
        return;
      }

      const { googleAuthUrl } = await response.json();
      if (googleAuthUrl) {
        console.log("Redirecionando para URL de autorização do Google:", googleAuthUrl);
        window.location.href = googleAuthUrl;
      } else {
        console.error("URL de autorização do Google não recebida.");
        alert("Não foi possível obter a URL de autorização do Google. Tente novamente.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro inesperado ao tentar conectar com o Google Calendar:", error);
      alert("Ocorreu um erro inesperado. Verifique o console e tente novamente.");
      setIsLoading(false);
    }
    // Não é necessário setIsLoading(false) aqui se o redirecionamento ocorrer, 
    // mas é bom ter em caso de falha antes do redirecionamento.
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar chamada ao endpoint de desconexão
      // const response = await fetch('/edge/v1/auth/google/calendar/disconnect', { method: 'POST' });
      // if (!response.ok) throw new Error('Falha ao desconectar');
      // setIsConnected(false);
      alert('Desconexão do Google Calendar (simulado)');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erro ao desconectar:', error.message);
        alert('Falha ao desconectar: ' + error.message);
      } else {
        console.error('Erro desconhecido ao desconectar:', error);
        alert('Falha ao desconectar: Erro desconhecido.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Minhas Conexões</h1>
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
              disabled={isLoading} 
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {isLoading ? 'Desconectando...' : 'Desconectar'}
            </button>
          ) : (
            <button 
              onClick={handleConnect} 
              disabled={isLoading} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Redirecionando...' : 'Conectar com Google Calendar'}
            </button>
          )}
        </div>
        {/* TODO: Adicionar mais informações sobre a conexão, como conta conectada, se aplicável */}
      </div>
      {/* Adicionar outros cards de conexão aqui, se necessário */}
    </div>
  );
};

export default ConnectionsPage; 