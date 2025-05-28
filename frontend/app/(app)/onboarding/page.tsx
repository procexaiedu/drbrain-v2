'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// import { useApp } from '@/context/AppContext'; // Removido temporariamente para perfil local
import ChatInterface from '@/components/chat/ChatInterface';
import { Message } from '@/components/chat/ChatMessage';
import { supabase } from '@/lib/supabaseClient';
import { CpuChipIcon } from '@heroicons/react/24/solid';

interface MedicoProfile {
  nome_completo?: string;
  // outros campos do perfil se necessário
}

interface OnboardingResponse extends Message {}

export default function OnboardingPage() {
  const { user, isLoading: authLoading, signOut } = useAuth(); // Corrigido para signOut
  // const { medicoNome, setMedicoNome, fetchMedicoProfile, profileError } = useApp(); // Removido
  const [medicoNome, setMedicoNome] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [chatKey, setChatKey] = useState<number>(0);

  const agentAvatarNode = (
    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
      <CpuChipIcon className="h-5 w-5 text-white" />
    </div>
  );

  const fetchMedicoProfile = useCallback(async () => {
    if (!user) return;
    setIsProfileLoading(true);
    setProfileError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão não encontrada para buscar perfil.");

      const response = await fetch('/edge/v1/get-medico-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Erro ao buscar perfil do médico: ${response.status}`);
      }
      const profile: MedicoProfile = await response.json();
      setMedicoNome(profile.nome_completo || null);
    } catch (err: any) {
      console.error("Erro ao buscar perfil do médico:", err);
      setProfileError(err.message || "Falha ao carregar dados do perfil.");
      setMedicoNome(null); // Garantir que nome seja nulo em caso de erro
    } finally {
      setIsProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !medicoNome && isProfileLoading) { // Adicionado isProfileLoading para evitar chamadas múltiplas
      fetchMedicoProfile();
    }
  }, [user, medicoNome, fetchMedicoProfile, isProfileLoading]);

  useEffect(() => {
    const loadOnboardingHistory = async () => {
      if (user) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("Sessão não encontrada para carregar histórico.");

          const response = await fetch('/edge/v1/get-onboarding-history', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.message || 'Falha ao carregar histórico do onboarding');
          }
          const historyMessages: Message[] = await response.json();
          
          const currentMedicoName = medicoNome || user.email?.split('@')[0] || 'Usuário';
          const processedHistory = historyMessages.map(msg => ({
            ...msg,
            avatar: msg.sender === 'agent' ? agentAvatarNode : undefined,
            userName: msg.sender === 'agent' ? 'Sarah (IA)' : `Dr. ${currentMedicoName}`
          }));
          
          setInitialMessages(processedHistory);
          setChatKey(prevKey => prevKey + 1);

        } catch (err: any) {
          console.error("Erro ao carregar histórico do onboarding:", err);
          const welcomeMessage: Message = {
            id: 'agent-welcome-error',
            text: `Olá, Dr. ${medicoNome || 'Médico(a)'}! Tivemos um problema ao carregar seu histórico. Vamos começar seu onboarding para configurar sua Secretária IA. Qual seu nome completo?`,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            avatar: agentAvatarNode,
            userName: 'Sarah (IA)',
          };
          setInitialMessages([welcomeMessage]);
          setChatKey(prevKey => prevKey + 1);
        }
      }
    };

    if (user && (medicoNome || profileError) && !isProfileLoading) { // Carregar histórico se nome existe ou se houve erro de perfil (e não está carregando)
        loadOnboardingHistory();
    } else if (user && !medicoNome && !authLoading && !profileError && !isProfileLoading) {
      // Se user existe, não está carregando auth, nem perfil, e não houve erro de perfil, significa que fetchMedicoProfile terminou sem nome
       const welcomeMessage: Message = {
            id: 'agent-profile-error-generic',
            text: `Bem-vindo(a)! Para começarmos, por favor, me diga seu nome completo.`,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            avatar: agentAvatarNode,
            userName: 'Sarah (IA)',
        };
        setInitialMessages([welcomeMessage]);
        setChatKey(prevKey => prevKey + 1);
    }

  }, [user, medicoNome, authLoading, profileError, fetchMedicoProfile, agentAvatarNode, isProfileLoading]);

  const handleSendMessage = useCallback(async (messageType: 'text' | 'audio', content: string): Promise<Message | null> => {
    if (!user) {
      setError('Você precisa estar logado para interagir com o onboarding.');
      return null;
    }
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão inválida para enviar mensagem.");

      const payload = {
        medico_id: user.id,
        agente_destino: 'onboarding_medico_ai',
        message_type: messageType,
        content: content,
      };

      const response = await fetch('/edge/v1/onboarding-chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido do servidor.' }));
        throw new Error(errorData.message);
      }

      const responseData: OnboardingResponse = await response.json();
      
      // Tentativa simples de atualizar o nome se o N8N confirmar
      if (responseData.text.toLowerCase().includes('nome registrado como') && !medicoNome) {
        const nameFromBody = responseData.text.split('nome registrado como ')[1]?.split('.')[0];
        if (nameFromBody && nameFromBody.trim() !== '') {
            setMedicoNome(nameFromBody.trim());
        }
      }
      
      return {
        ...responseData,
        sender: 'agent',
        avatar: agentAvatarNode,
        userName: 'Sarah (IA)',
      };

    } catch (err: any) {
      console.error('Erro ao enviar mensagem para onboarding:', err);
      setError(err.message || 'Falha na comunicação com o servidor.');
      return {
        id: 'error-' + Date.now().toString(),
        text: err.message || 'Desculpe, ocorreu um erro. Tente novamente.',
        sender: 'agent',
        timestamp: new Date().toISOString(),
        avatar: agentAvatarNode,
        userName: 'Sarah (IA)',
      };
    }
  }, [user, medicoNome, agentAvatarNode]); // Removido fetchMedicoProfile daqui, pois a atualização de nome é local ou via side-effect

  const handleOnboardingComplete = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleClearChat = useCallback(() => {
    const currentMedicoName = medicoNome || 'Médico(a)';
    const welcomeMessage: Message = {
        id: 'agent-welcome-cleared',
        text: `Olá novamente, Dr. ${currentMedicoName}! Vamos recomeçar seu onboarding. Qual seu nome completo?`,
        sender: 'agent',
        timestamp: new Date().toISOString(),
        avatar: agentAvatarNode,
        userName: 'Sarah (IA)',
    };
    setInitialMessages([welcomeMessage]);
    setChatKey(prevKey => prevKey + 1);
  }, [medicoNome, agentAvatarNode]);

  if (authLoading || !user || isProfileLoading) { // Modificado para incluir isProfileLoading
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mb-6"></div>
        <p className="text-lg font-semibold text-indigo-700">Carregando seus dados...</p>
        <p className="text-sm text-gray-600">Estamos preparando tudo para você.</p>
      </div>
    );
  }
  // Se houve erro de perfil E não há nome, mostramos um estado de erro específico antes do chat.
  // Mas se o chat puder lidar com nome nulo e pedir, podemos ir direto para o chat.
  // A lógica atual de initialMessages já tenta lidar com isso.

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden" style={{height: 'calc(100vh - 4rem)', maxHeight: '700px'}}>
        <ChatInterface
          key={chatKey}
          medicoNome={medicoNome || 'Convidado'} // Passa o nome local ou um fallback
          onSendMessage={handleSendMessage}
          onOnboardingComplete={handleOnboardingComplete}
          initialMessages={initialMessages}
          agentName="Sarah (IA)"
          agentAvatar={agentAvatarNode}
          chatTitle="Onboarding Dr.Brain"
          chatSubtitle={`Personalizando a Secretária IA para Dr. ${medicoNome || 'você'}`}
          onClearChat={handleClearChat}
          inputPlaceholder="Digite seu nome ou responda à Sarah..."
        />
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md max-w-2xl w-full text-sm">
          <strong>Erro:</strong> {error}
        </div>
      )}
    </div>
  );
} 