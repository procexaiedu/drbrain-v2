'use client';

import React, { useState, useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { Message } from '@/components/chat/ChatMessage';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // Para buscar nome do médico se necessário

// Componente de Loader simples (pode ser movido para um arquivo compartilhado)
const FullScreenLoader = () => (
  <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
    <p className="ml-3 text-indigo-700 font-semibold">Carregando Onboarding...</p>
  </div>
);

interface MedicoProfile {
  id?: string;
  nome_completo?: string;
  // adicionar outros campos se o onboarding precisar deles diretamente
}

export default function OnboardingPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [medicoProfile, setMedicoProfile] = useState<MedicoProfile | null>(null);
  const [profileIsLoading, setProfileIsLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [historyIsLoading, setHistoryIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar perfil e histórico de chat
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setProfileIsLoading(true);
      setHistoryIsLoading(true);
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão não encontrada para buscar dados.");
        const accessToken = session.access_token;

        // Buscar perfil do médico
        if (!medicoProfile) { // Só busca perfil se ainda não tiver
          const profileResponse = await fetch('/edge/v1/get-medico-profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (!profileResponse.ok) {
            const errData = await profileResponse.json().catch(() => ({}));
            throw new Error(errData.message || `Erro ao buscar perfil: ${profileResponse.statusText}`);
          }
          const profile = await profileResponse.json();
          setMedicoProfile(profile);
        }
        setProfileIsLoading(false);

        // Buscar histórico do chat
        const historyResponse = await fetch(`/edge/v1/get-onboarding-history?sessionId=${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`, // Proteger a função de histórico também
            'Content-Type': 'application/json',
          },
        });

        if (!historyResponse.ok) {
          const errData = await historyResponse.json().catch(() => ({}));
          console.warn('Não foi possível carregar o histórico do chat:', errData.message || historyResponse.statusText);
          // Não tratar como erro fatal, pode ser a primeira vez do usuário
          setChatHistory([]); 
        } else {
          const fetchedHistory = await historyResponse.json();
          // Aqui podemos adicionar lógica para garantir que o avatar e userName corretos sejam atribuídos
          const processedHistory = fetchedHistory.map((msg: any) => ({
            ...msg,
            avatar: msg.sender === 'user' 
              ? 'https://placehold.co/40/8b5cf6/ffffff?text=Dr' 
              : 'https://placehold.co/40/7c3aed/ffffff?text=IA',
            userName: msg.sender === 'user' 
              ? medicoProfile?.nome_completo || 'Doutor(a)' 
              : 'Agente de Onboarding',
            // Se a Edge function não definir timestamp ou id válidos, o ChatInterface/Message tem fallbacks
            // mas idealmente a edge function já os normaliza a partir do jsonb.
          }));
          setChatHistory(processedHistory);
        }

      } catch (e: any) {
        console.error("Erro ao carregar dados para onboarding:", e);
        setError(e.message || 'Não foi possível carregar as informações necessárias para o onboarding.');
        // Definir profile e history como não carregando em caso de erro para evitar loop no loader
        setProfileIsLoading(false); 
      }
      setHistoryIsLoading(false);
    };

    if (user && !authIsLoading) {
      fetchData();
    }
  }, [user, authIsLoading, medicoProfile]); // medicoProfile está aqui para que userName seja atualizado no histórico

  // Função para enviar mensagem para o BFF (que encaminhará para o N8N)
  const handleSendMessageToBFF = async (messageType: 'text' | 'audio', content: string): Promise<Message | null> => {
    if (!user) {
      console.error('Usuário não autenticado ao tentar enviar mensagem de onboarding.');
      return {
        id: Date.now().toString() + '_error_auth',
        text: 'Erro de autenticação. Por favor, tente recarregar a página.',
        sender: 'agent',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada ou inválida.");

      const payload = {
        medico_id: user.id,
        agente_destino: 'onboarding_medico_v1', // Identificador do workflow N8N de onboarding
        message_type: messageType,
        content: content, // Conteúdo da mensagem (texto ou áudio Base64)
      };

      const response = await fetch('/edge/v1/onboarding-chat', { // Novo endpoint BFF para o chat de onboarding
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido do servidor.' }));
        console.error('Erro na resposta do BFF/N8N:', errorData);
        return {
          id: Date.now().toString() + '_error_server',
          text: errorData.message || 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
          sender: 'agent',
          timestamp: new Date().toISOString(),
        };
      }

      const agentResponse = await response.json();
      // A resposta do N8N deve ser uma mensagem no formato esperado pelo ChatMessage
      // Ex: { id: 'string', text: 'string', sender: 'agent', timestamp: 'string', onboarding_status?: 'completed' | 'in_progress' }
      return {
          ...agentResponse, 
          sender: 'agent', // Garantir que é do agente
          id: agentResponse.id || Date.now().toString() + '_agent', 
          timestamp: agentResponse.timestamp || new Date().toISOString(),
          // onboarding_status será usado pelo ChatInterface para disparar onOnboardingComplete
      };

    } catch (e: any) {
      console.error('Erro ao enviar mensagem para BFF/N8N:', e);
      return {
        id: Date.now().toString() + '_error_network',
        text: 'Erro de comunicação. Verifique sua conexão e tente novamente.',
        sender: 'agent',
        timestamp: new Date().toISOString(),
      };
    }
  };

  const handleOnboardingComplete = () => {
    // Poderia marcar localmente ou apenas redirecionar, 
    // N8N é quem deve atualizar medico_profiles.onboarding_concluido
    console.log('Onboarding sinalizado como completo pelo N8N!');
    router.push('/dashboard');
  };

  const getInitialAgentMessage = (): Message | null => {
    if (chatHistory.length > 0) {
      return null; // Não mostra mensagem inicial se já houver histórico
    }
    return {
      id: 'agent-initial-greeting',
      text: `Olá, Dr. ${medicoProfile?.nome_completo || 'Doutor(a)'}! Sou a Sarah, sua assistente de onboarding no Dr. Brain. Estou aqui para ajudá-lo(a) a configurar sua conta e sua futura secretária virtual. Vamos começar? Você pode digitar ou enviar mensagens de voz.`,
      sender: 'agent',
      timestamp: new Date().toISOString(),
      isLoading: false,
      // Avatar e userName serão adicionados pelo ChatInterface ou Message component se não definidos aqui
    };
  };

  if (authIsLoading || profileIsLoading || historyIsLoading) {
    return <FullScreenLoader />;
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Erro no Onboarding</h2>
        <p className="text-gray-700 mb-2">{error}</p>
        <p className="text-gray-600">Tente <button onClick={() => window.location.reload()} className="text-indigo-600 hover:underline">recarregar a página</button> ou contate o suporte.</p>
      </div>
    );
  }

  if (!user || !medicoProfile) {
    // Caso o usuário não seja encontrado ou perfil não carregue, embora AppLayout deva proteger.
    // Ou se o erro não foi pego acima mas perfil ainda é null.
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-700">Não foi possível carregar as informações necessárias. Por favor, tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <ChatInterface 
        medicoNome={medicoProfile.nome_completo || ''}
        onSendMessage={handleSendMessageToBFF}
        onOnboardingComplete={handleOnboardingComplete}
        // Passa o histórico existente e a mensagem inicial apenas se aplicável
        initialMessages={chatHistory.length > 0 ? chatHistory : (getInitialAgentMessage() ? [getInitialAgentMessage()!] : [])}
      />
    </div>
  );
} 