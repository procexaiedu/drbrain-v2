'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// import { useApp } from '@/context/AppContext'; // Removido temporariamente para perfil local
import ChatInterface from '@/components/chat/ChatInterface';
import { Message } from '@/components/chat/ChatMessage';
import { supabase } from '@/lib/supabaseClient';
import { CpuChipIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

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
  const [hasAttemptedHistoryLoad, setHasAttemptedHistoryLoad] = useState(false); // Novo estado

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [chatKey, setChatKey] = useState<number>(0);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [clearHistoryError, setClearHistoryError] = useState<string | null>(null);

  const agentAvatarNode = (
    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
      <CpuChipIcon className="h-5 w-5 text-white" />
    </div>
  );

  const fetchMedicoProfile = useCallback(async () => {
    if (!user) return;
    // console.log("Onboarding: Iniciando fetchMedicoProfile");
    setIsProfileLoading(true);
    setProfileError(null);
    setHasAttemptedHistoryLoad(false); // Resetar flag de histórico antes de buscar perfil
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
      // console.log("Onboarding: Perfil recebido:", profile);
      setMedicoNome(profile.nome_completo || null);
    } catch (err: any) {
      console.error("Erro ao buscar perfil do médico:", err);
      setProfileError(err.message || "Falha ao carregar dados do perfil.");
      setMedicoNome(null);
    } finally {
      // console.log("Onboarding: fetchMedicoProfile finalizado");
      setIsProfileLoading(false);
    }
  }, [user]);

  // Efeito para buscar o perfil do médico SOMENTE QUANDO user mudar e não houver nome
  useEffect(() => {
    // console.log("Onboarding: useEffect [user] disparado. User:", user);
    if (user) {
      setMedicoNome(null); // Limpa nome anterior se usuário mudou
      setProfileError(null);
      setIsProfileLoading(true); // Garante que vai buscar o perfil
      setHasAttemptedHistoryLoad(false); // Resetar flag para o novo usuário
      fetchMedicoProfile();
    } else {
      // Limpar dados se não houver usuário (ex: logout)
      setMedicoNome(null);
      setProfileError(null);
      setIsProfileLoading(false); // Não está carregando se não há usuário
      setInitialMessages([]);
      setHasAttemptedHistoryLoad(false);
    }
  }, [user, fetchMedicoProfile]); // fetchMedicoProfile aqui é estável devido ao useCallback com [user]

  // Efeito para carregar histórico OU definir mensagem inicial
  useEffect(() => {
    // console.log(`Onboarding: useEffect [user, medicoNome, profileError, isProfileLoading, authLoading] disparado. 
    // User: ${!!user}, MedicoNome: ${medicoNome}, ProfileError: ${profileError}, 
    // IsProfileLoading: ${isProfileLoading}, AuthLoading: ${authLoading}, HasAttemptedHistoryLoad: ${hasAttemptedHistoryLoad}`);

    if (!user || authLoading || isProfileLoading || hasAttemptedHistoryLoad) {
      // console.log("Onboarding: Abortando loadOnboardingHistory (condições não atendidas ou já tentado)");
      return; // Só prosseguir se user existir, auth e profile não estiverem carregando, e não tiver tentado carregar histórico ainda
    }

    const loadOnboardingHistory = async () => {
      // console.log("Onboarding: Iniciando loadOnboardingHistory");
      setHasAttemptedHistoryLoad(true); // Marcar que a tentativa foi feita
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !user) throw new Error("Sessão ou usuário não encontrado para carregar histórico.");

        const response = await fetch(`/edge/v1/get-onboarding-history?sessionId=${encodeURIComponent(user.id)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          // console.warn("Onboarding: Falha ao carregar histórico, status:", response.status, errData);
          throw new Error(errData?.message || 'Falha ao carregar histórico do onboarding');
        }
        const historyMessages: Message[] = await response.json();
        // console.log("Onboarding: Histórico recebido:", historyMessages);
        
        const currentMedicoName = medicoNome || user.email?.split('@')[0] || 'Usuário';
        const processedHistory = historyMessages.map(msg => {
          let text = msg.text;
          if (msg.sender === 'user') {
            // Tenta remover o padrão "Mensagem: olá Nome_Medico: [Nome Real]"
            // Isso é um paliativo. O ideal é corrigir na origem do salvamento do histórico.
            const pattern = /^Mensagem: olá Nome_Medico: .*?$/i;
            if (pattern.test(text)) {
              // Extrai o que vem depois de "Mensagem: " e "Nome_Medico: [Nome]"
              // Se o padrão for "Mensagem: olá Nome_Medico: Alberto de Souza", queremos "olá"
              // Esta lógica pode precisar de ajuste fino dependendo da variabilidade do prefixo.
              // Por enquanto, uma abordagem simples: se o padrão completo existir, 
              // pegamos a parte original que seria a "mensagem" real.
              // Exemplo: "Mensagem: olá Nome_Medico: Alberto de Souza" -> "olá"
              // Isso pode ser muito agressivo. Uma alternativa mais segura é verificar o prompt original:
              // Se o prompt era "Olá", e o histórico é "Mensagem: Olá Nome_Medico: Alberto", então o texto deve ser "Olá".
              // Por simplicidade e com base na imagem, vou tentar uma remoção mais direta do prefixo conhecido.
              text = text.replace(/^Mensagem: (.*?) Nome_Medico: .*$/i, '$1').trim();
              if (text.startsWith("olá")) {
                // Se após a remoção, a mensagem começar com "olá" (como no exemplo da imagem),
                // e o nome do médico estiver no prefixo, podemos assumir que "olá" é a mensagem original.
                // Caso contrário, a regex acima pode não ter funcionado como esperado.
              } 
              // Se a regex acima não capturar bem ou se o formato variar muito,
              // será preciso uma lógica mais robusta ou a correção na fonte de dados.
            }
          }
          return {
            ...msg,
            text, // usa o texto processado
            avatar: msg.sender === 'agent' ? agentAvatarNode : undefined,
            userName: msg.sender === 'agent' ? 'Sarah (IA)' : `Dr. ${currentMedicoName}`
          };
        });
        
        setInitialMessages(processedHistory);
        setChatKey(prevKey => prevKey + 1);

      } catch (err: any) {
        // console.error("Erro dentro de loadOnboardingHistory:", err);
        let welcomeText = `Olá, Dr. ${medicoNome || 'Médico(a)'}! Tivemos um problema ao carregar seu histórico. Vamos começar seu onboarding para configurar sua Secretária IA. Qual seu nome completo?`;
        if (profileError && !medicoNome) {
            welcomeText = `Bem-vindo(a)! Tivemos um problema ao carregar seus dados. Para começarmos, por favor, me diga seu nome completo.`;
        }
        const welcomeMessage: Message = {
          id: 'agent-welcome-error',
          text: welcomeText,
          sender: 'agent',
          timestamp: new Date().toISOString(),
          avatar: agentAvatarNode,
          userName: 'Sarah (IA)',
        };
        setInitialMessages([welcomeMessage]);
        setChatKey(prevKey => prevKey + 1);
      }
    };

    loadOnboardingHistory();

  // Cuidado com as dependências aqui para evitar loops.
  // A ideia é que este efeito rode APÓS a tentativa de carregar o perfil.
  }, [user, medicoNome, profileError, isProfileLoading, authLoading, agentAvatarNode, hasAttemptedHistoryLoad]); 
  // Removido fetchMedicoProfile daqui

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
  }, [user, medicoNome, agentAvatarNode]);

  const handleOnboardingComplete = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const confirmClearHistory = useCallback(async () => {
    if (!user) {
      setClearHistoryError("Usuário não autenticado.");
      return;
    }
    setIsClearingHistory(true);
    setClearHistoryError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão inválida para limpar histórico.");

      const response = await fetch('/edge/v1/limpar-historico-onboarding', {
        method: 'POST', // Edge function agora espera POST para consistência com outras e para passar token
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        // Body pode ser vazio ou enviar o medico_id se a função for adaptada, mas a função atual usa o user.id do token
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao limpar histórico.' }));
        throw new Error(errorData.message);
      }

      // Se chegou aqui, o histórico no DB foi limpo com sucesso
      // Agora, limpa o chat localmente
      const currentMedicoName = medicoNome || 'Médico(a)';
      const welcomeMessage: Message = {
          id: 'agent-welcome-cleared',
          text: `Histórico limpo! Olá novamente, Dr. ${currentMedicoName}! Vamos recomeçar seu onboarding. Qual seu nome completo?`,
          sender: 'agent',
          timestamp: new Date().toISOString(),
          avatar: agentAvatarNode,
          userName: 'Sarah (IA)',
      };
      setInitialMessages([welcomeMessage]);
      setChatKey(prevKey => prevKey + 1);
      setHasAttemptedHistoryLoad(false);
      setShowClearConfirmModal(false);

    } catch (err: any) {
      console.error("Erro ao limpar histórico de onboarding:", err);
      setClearHistoryError(err.message || "Falha ao limpar histórico no servidor.");
    } finally {
      setIsClearingHistory(false);
    }
  }, [user, medicoNome, agentAvatarNode]);

  const handleClearChat = useCallback(() => {
    // Em vez de limpar diretamente, abre o modal de confirmação
    setClearHistoryError(null); // Limpa erros anteriores do modal
    setShowClearConfirmModal(true);
  }, []);

  // Estado de Carregamento Principal
  if (authLoading || (!user && !authLoading)) { // Se autenticação está carregando ou se já terminou e não há usuário
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mb-6"></div>
        <p className="text-lg font-semibold text-indigo-700">{authLoading ? 'Verificando autenticação...' : 'Redirecionando...'}</p>
      </div>
    );
  }
  // Se chegou aqui, user existe e authLoading é false.
  // Agora, verificamos o carregamento do perfil.
  if (isProfileLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mb-6"></div>
          <p className="text-lg font-semibold text-indigo-700">Carregando seus dados...</p>
          <p className="text-sm text-gray-600">Estamos preparando tudo para você.</p>
        </div>
      );
  }

  // Se chegou aqui, user existe, authLoading é false, isProfileLoading é false.
  // O histórico já deve ter sido carregado ou a mensagem de boas-vindas definida pelo useEffect de histórico.
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-white overflow-hidden">
      <header className="bg-gray-800/50 backdrop-blur-md shadow-lg p-4 sm:p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="h-8 w-8 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              Onboarding Dr. Brain
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {medicoNome && (
              <span className="text-sm text-gray-300 hidden sm:block">
                Dr(a). {medicoNome}
              </span>
            )}
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
        <div className="container mx-auto h-full max-w-4xl">
          {error && (
            <div className="bg-red-500/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4" role="alert">
              <strong className="font-bold">Erro: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {profileError && (
            <div className="bg-yellow-500/20 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg mb-4" role="alert">
              <strong className="font-bold">Aviso de Perfil: </strong>
              <span className="block sm:inline">{profileError}</span>
            </div>
          )}

          <ChatInterface
            key={chatKey}
            medicoNome={medicoNome || (user?.email?.split('@')[0] || 'Dr(a).')}
            chatTitle={medicoNome ? `Bem-vindo(a) ao Onboarding, Dr. ${medicoNome}!` : "Onboarding Dr. Brain"}
            initialMessages={initialMessages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onOnboardingComplete={handleOnboardingComplete}
            agentName="Sarah (IA)"
            agentAvatar={agentAvatarNode}
            userAvatar={null}
            inputPlaceholder={medicoNome ? "Digite sua resposta aqui..." : "Qual seu nome completo para começarmos?"}
          />
        </div>
      </main>

      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
            <div className="flex items-start space-x-3 mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="mt-0 text-left"> {/* Ajustado para alinhar com o ícone */}
                <h3 className="text-lg sm:text-xl font-semibold leading-6 text-white" id="modal-title">
                  Confirmar Limpeza do Histórico
                </h3>
              </div>
            </div>
            <div className="text-sm sm:text-base text-slate-300 mb-6">
              <p>
                Você tem certeza que deseja limpar todo o histórico de mensagens do seu onboarding?
              </p>
              <p className="mt-2 font-semibold text-red-400">
                Esta ação é irreversível e apagará permanentemente todas as suas interações anteriores com a Sarah (IA) nesta etapa.
              </p>
            </div>

            {clearHistoryError && (
              <div className="bg-red-500/20 border border-red-700 text-red-300 px-3 py-2 rounded-md mb-4 text-sm" role="alert">
                {clearHistoryError}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="button"
                disabled={isClearingHistory}
                onClick={confirmClearHistory}
                className={`w-full inline-flex justify-center rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 transition-colors duration-150 ${isClearingHistory ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isClearingHistory ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Limpando...
                  </>
                ) : "Sim, Limpar Histórico"}
              </button>
              <button
                type="button"
                disabled={isClearingHistory}
                onClick={() => setShowClearConfirmModal(false)}
                className="w-full inline-flex justify-center rounded-md bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 transition-colors duration-150 sm:mt-0"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 