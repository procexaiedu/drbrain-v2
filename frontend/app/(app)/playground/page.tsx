'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css'; // Importar estilos do Allotment
import { BookOpenIcon, CloudArrowUpIcon, ArchiveBoxXMarkIcon, ArrowPathIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { CpuChipIcon, ChartBarIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid'; // Ícone para a IA
import { Toaster, toast } from 'sonner'; // Para notificações
import ConfirmationModal from '@/components/ui/ConfirmationModal'; // Importar o novo modal
import ChatInterface from '@/components/chat/ChatInterface'; // Descomentado
import { Message } from '@/components/chat/ChatMessage'; // Importar tipo Message
import { supabase } from '@/lib/supabaseClient'; // Corrigir import
import { useAuth } from '@/context/AuthContext'; // Para pegar o usuário autenticado
import { useApp } from '@/context/AppContext'; // Para controle de título da página
import dynamic from 'next/dynamic';

// Importar o editor markdown dinamicamente para evitar problemas de SSR
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
const MarkdownPreview = dynamic(() => import('@uiw/react-md-editor').then(mod => ({ default: mod.default.Markdown })), { ssr: false });

// interface MedicoProfile já existe no onboarding, idealmente seria compartilhada
interface MedicoProfile {
  id: string;
  nome_completo?: string | null;
  nome_secretaria_ia?: string | null;
  // outros campos que possam ser úteis
}

const apiCall = async (endpoint: string, method: string = 'POST', body: any = null) => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('Erro ao obter sessão ou sessão inválida:', sessionError);
    throw new Error('Sessão inválida ou expirada. Por favor, faça login novamente.');
  }
  const token = session.access_token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const basePath = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';
  const url = `${basePath}/v1${endpoint}`;
 
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const responseBody = await response.text();
    if (!response.ok) {
      let errorData;
      try { errorData = JSON.parse(responseBody); } catch (e) { errorData = { message: responseBody || response.statusText }; }
      console.error('Erro na chamada API:', response.status, errorData);
      throw new Error(errorData.message || `Erro ${response.status}`);
    }
    try { return JSON.parse(responseBody); } catch (e) { return { message: responseBody }; }
  } catch (error) {
    console.error('Falha na chamada API:', error);
    if (error instanceof Error) throw error; else throw new Error(String(error));
  }
};

interface PromptLabData {
  prompt_texto_laboratorio: string;
  updated_at_laboratorio: string | null;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  confirmButtonColor?: string;
}

export default function PlaygroundPage() {
  const { user } = useAuth(); // Pegar usuário do contexto de autenticação
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [medicoProfile, setMedicoProfile] = useState<MedicoProfile | null>(null);
  const [promptLab, setPromptLab] = useState<PromptLabData | null>(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  
  const [secretariaMessages, setSecretariaMessages] = useState<Message[]>([]);
  const [bobMessages, setBobMessages] = useState<Message[]>([]);
  const [confirmationModalState, setConfirmationModalState] = useState<ModalState | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);

  const { setPageTitle, setPageSubtitle, setBreadcrumbs } = useApp();

  // Configurar título da página
  useEffect(() => {
    setPageTitle('Playground IA');
    setPageSubtitle('Configure sua Secretária IA e converse com Bob, o Engenheiro');
    setBreadcrumbs([]);
  }, [setPageTitle, setPageSubtitle, setBreadcrumbs]);

  const fetchMedicoProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(prev => ({ ...prev, profile: true }));
    try {
      const data = await apiCall('/get-medico-profile', 'GET');
      setMedicoProfile(data as MedicoProfile);
    } catch (error: any) {
      toast.error(`Erro ao buscar perfil do médico: ${error.message}`);
      setMedicoProfile(null); // Limpar perfil em caso de erro
    }
    setIsLoading(prev => ({ ...prev, profile: false }));
  }, [user]);

  const fetchChatHistory = useCallback(async (chatType: 'secretaria' | 'bob') => {
    if (!user || !medicoProfile) return;
    const endpoint = chatType === 'secretaria' ? '/get-playground-secretaria-history' : '/get-playground-bob-history';
    const setMessages = chatType === 'secretaria' ? setSecretariaMessages : setBobMessages;
    const agentNameFromProfile = medicoProfile?.nome_secretaria_ia || 'Secretária IA';
    const agentName = chatType === 'secretaria' ? agentNameFromProfile : 'Bob, o Engenheiro';
    const agentAvatarIcon = chatType === 'secretaria' ? <CpuChipIcon className="h-8 w-8 text-purple-300" /> : "https://placehold.co/40/3b82f6/ffffff?text=BOB";
    const userAvatarIcon = <UserCircleIcon className="h-8 w-8 text-gray-500" />;

    setIsLoading(prev => ({ ...prev, [`history_${chatType}`]: true }));
    try {
      const history = await apiCall(`${endpoint}?medico_id=${user.id}`, 'GET');
      const processedHistory = (history as any[]).map(msg => ({
        ...msg,
        avatar: msg.sender === 'user' ? userAvatarIcon : agentAvatarIcon,
        userName: msg.sender === 'user' ? `Dr. ${medicoProfile?.nome_completo || 'Médico(a)'}` : agentName,
      }));
      setMessages(processedHistory);
    } catch (error: any) {
      console.warn(`Erro ao buscar histórico do chat ${chatType}: ${error.message}`);
      setMessages([]);
    }
    setIsLoading(prev => ({ ...prev, [`history_${chatType}`]: false }));
  }, [user, medicoProfile]);

  useEffect(() => {
    if (user) {
      fetchMedicoProfile();
    }
  }, [user, fetchMedicoProfile]);

  useEffect(() => {
    if (medicoProfile) { 
      fetchChatHistory('secretaria');
      fetchChatHistory('bob');
    }
  }, [medicoProfile, fetchChatHistory]);

  const setLoadingState = (action: string, value: boolean) => {
    setIsLoading(prev => ({ ...prev, [action]: value }));
  };

  const handleSendMessage = async (
    chatType: 'secretaria' | 'bob',
    messageType: 'text' | 'audio',
    content: string
  ): Promise<Message | null> => {
    if (!user || !medicoProfile) {
      toast.error("Perfil do médico não carregado. Não é possível enviar mensagem.");
      return null;
    }

    const endpoint = chatType === 'secretaria' ? '/playground-secretaria-ia-chat' : '/playground-bob-chat';
    const setMessages = chatType === 'secretaria' ? setSecretariaMessages : setBobMessages;
    const currentMessages = chatType === 'secretaria' ? secretariaMessages : bobMessages;
    
    const agentNameFromProfile = medicoProfile.nome_secretaria_ia || 'Secretária IA';
    const agentName = chatType === 'secretaria' ? agentNameFromProfile : 'Bob, o Engenheiro';
    const agentAvatarIcon = chatType === 'secretaria' ? <CpuChipIcon className="h-8 w-8 text-purple-300" /> : "https://placehold.co/40/3b82f6/ffffff?text=BOB";
    const userAvatarIcon = <UserCircleIcon className="h-8 w-8 text-gray-500" />;

    const payload = {
      medico_id: user.id,
      agente_destino: chatType === 'secretaria' ? 'playground_secretaria_ia' : 'playground_bob',
      message_type: messageType,
      content: content,
    };

    const userMessageText = messageType === 'text' ? content : (audioPlaybackUrl ? '[Mensagem de Áudio]' : 'Enviando áudio...');
    const audioSrcForUserMessage = messageType === 'audio' ? audioPlaybackUrl : undefined; // Passar URL para preview se disponível

    const newUserMessage: Message = {
      id: Date.now().toString() + '_user',
      sender: 'user',
      timestamp: new Date().toISOString(),
      userName: `Dr. ${medicoProfile.nome_completo || 'Médico(a)'}`,
      avatar: userAvatarIcon,
      text: userMessageText,
      audioSrc: audioSrcForUserMessage || undefined, 
    };
    setMessages([...currentMessages, newUserMessage]);
    
    // Limpar audioPlaybackUrl após usar para a mensagem do usuário
    if (messageType === 'audio') {
      // setAudioPlaybackUrl(null); // Comentado pois o ChatInterface pode controlar isso
    }

    try {
      const response = await apiCall(endpoint, 'POST', payload);
      if (chatType === 'bob' && response.prompt_atualizado) {
        handleViewEditPrompt();
        toast.info("Bob atualizou seu prompt de laboratório!");
      }
      return {
        id: response.id || Date.now().toString() + '_agent',
        text: response.reply || response.message || response.text || "Não entendi.",
        sender: 'agent',
        timestamp: response.timestamp || new Date().toISOString(),
        avatar: agentAvatarIcon,
        userName: agentName,
        audioSrc: response.audioSrc, // Se o agente responder com áudio
      };
    } catch (error: any) {
      console.error(`Erro ao enviar mensagem para ${chatType}:`, error);
      toast.error(`${agentName}: ${error.message}`);
      return {
        id: Date.now().toString() + '_error',
        text: `Desculpe, houve um erro ao contatar ${agentName}.`,
        sender: 'agent',
        timestamp: new Date().toISOString(),
        avatar: agentAvatarIcon,
        userName: agentName,
      };
    }
  };

  // Adicionar audioPlaybackUrl ao estado da PlaygroundPage para que handleSendMessage possa usá-lo
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState<string | null>(null);

  const handleClearChat = async (chatType: 'secretaria' | 'bob') => {
    if (!user) return;
    const action = chatType === 'secretaria' ? 'clearSecretaria' : 'clearBob';
    const endpoint = chatType === 'secretaria' ? '/limpar-memoria-playground-secretaria' : '/limpar-memoria-bob';
    const setMessages = chatType === 'secretaria' ? setSecretariaMessages : setBobMessages;
    const agentName = chatType === 'secretaria' ? (medicoProfile?.nome_secretaria_ia || 'Secretária IA') : 'Bob';

    setLoadingState(action, true);
    try {
      await apiCall(endpoint, 'POST', { medico_id: user.id }); 
      setMessages([]); 
      toast.success(`Memória do chat com ${agentName} limpa!`);
    } catch (error: any) {
      toast.error(`Erro ao limpar chat com ${agentName}: ${error.message}`);
    }
    setLoadingState(action, false);
  };

  const handleViewEditPrompt = useCallback(async () => { 
    setLoadingState('viewPrompt', true);
    try {
      const data = await apiCall('/get-prompt-laboratorio', 'GET');
      setPromptLab(data as PromptLabData);
      setEditedPrompt(data.prompt_texto_laboratorio || '');
      setIsEditingPrompt(false);
      setIsPromptModalOpen(true);
    } catch (error: any) {
      toast.error(`Erro ao buscar prompt de laboratório: ${error.message}`);
      setPromptLab(null);
    }
    setLoadingState('viewPrompt', false);
  }, []);

  const handleSavePrompt = async () => {
    setLoadingState('savePrompt', true);
    try {
      await apiCall('/update-prompt-laboratorio', 'POST', { prompt_texto: editedPrompt });
      toast.success('Prompt de laboratório salvo com sucesso!');
      
      // Atualizar os dados locais
      if (promptLab) {
        setPromptLab({
          ...promptLab,
          prompt_texto_laboratorio: editedPrompt,
          updated_at_laboratorio: new Date().toISOString()
        });
      }
      setIsEditingPrompt(false);
    } catch (error: any) {
      toast.error(`Erro ao salvar prompt: ${error.message}`);
    }
    setLoadingState('savePrompt', false);
  };

  const handleCancelEdit = () => {
    setEditedPrompt(promptLab?.prompt_texto_laboratorio || '');
    setIsEditingPrompt(false);
  };

  const executeDiscardChanges = async () => {
    setLoadingState('discardPrompt', true);
    try {
      await apiCall('/descartar-prompt-laboratorio', 'POST');
      toast.success('Alterações do laboratório descartadas com sucesso!');
      await handleViewEditPrompt(); 
    } catch (error: any) {
      toast.error(`Erro ao descartar alterações: ${error.message}`);
    }
    setLoadingState('discardPrompt', false);
    setConfirmationModalState(null);
  };

  const handleDiscardChanges = () => {
    setConfirmationModalState({
      isOpen: true,
      title: 'Descartar Alterações do Laboratório',
      message: 'Tem certeza que deseja descartar as alterações do laboratório? O prompt de laboratório será revertido para o prompt de produção atual.',
      onConfirm: executeDiscardChanges,
      confirmText: 'Descartar',
      confirmButtonColor: 'bg-red-600 hover:bg-red-700',
    });
  };

  const executePublishPrompt = async () => {
    setLoadingState('publishPrompt', true);
    try {
      await apiCall('/publicar-prompt-laboratorio', 'POST');
      toast.success('Prompt publicado para produção com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao publicar prompt: ${error.message}`);
    }
    setLoadingState('publishPrompt', false);
    setConfirmationModalState(null);
  };

  const handlePublishPrompt = () => {
    setConfirmationModalState({
      isOpen: true,
      title: 'Publicar Prompt para Produção',
      message: 'Tem certeza que deseja publicar o prompt do laboratório para produção? Isto substituirá o seu prompt de produção atual.',
      onConfirm: executePublishPrompt,
      confirmText: 'Publicar',
      confirmButtonColor: 'bg-green-600 hover:bg-green-700',
    });
  };

  if ((isLoading['profile'] && !medicoProfile) || (isLoading['history_secretaria'] && secretariaMessages.length === 0) || (isLoading['history_bob'] && bobMessages.length === 0) ) {
    return (
      <div className="flex items-center justify-center h-screen fixed inset-0 bg-gray-100 bg-opacity-75 z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-indigo-700 font-semibold">Carregando dados do Playground...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="bottom-right" />
      <div className="p-6 h-[calc(100vh-var(--header-height,80px))] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Playground da Secretária IA
          </h1>
          <p className="text-slate-600">Configure e teste suas inteligências artificiais</p>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 min-h-0">
          <div className="md:col-span-2 flex flex-col min-h-0 h-full">
            <Allotment defaultSizes={[50, 50]}>
              <Allotment.Pane minSize={300}>
                <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden backdrop-blur-sm">
                  <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{medicoProfile?.nome_secretaria_ia || 'Secretária IA'}</h2>
                        <p className="text-purple-100 text-sm opacity-90">Playground • Prompt de Laboratório Ativo</p>
                      </div>
                      <button
                        onClick={() => handleClearChat('secretaria')}
                        disabled={isLoading['clearSecretaria'] || isLoading['history_secretaria']}
                        className={`p-3 transition-all rounded-full ${isLoading['clearSecretaria'] ? 'text-purple-300 cursor-not-allowed' : 'text-purple-100 hover:text-white hover:bg-white/20 hover:scale-110'}`}
                        title="Limpar Chat da Secretária IA"
                      >
                        <ArrowPathIcon className={`h-5 w-5 ${isLoading['clearSecretaria'] ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ChatInterface 
                      medicoNome={medicoProfile?.nome_completo || 'Médico(a)'}
                      onSendMessage={(type, msg) => handleSendMessage('secretaria', type, msg)}
                      onOnboardingComplete={() => {}} 
                      initialMessages={secretariaMessages}
                      agentName={medicoProfile?.nome_secretaria_ia || 'Secretária IA'}
                      agentAvatar={<CpuChipIcon className="h-8 w-8 text-purple-500" />} 
                      userAvatar={<UserCircleIcon className="h-8 w-8 text-slate-600" />}
                      hideHeader={true}
                      setAudioPlaybackUrlForParent={setAudioPlaybackUrl}
                      variant="playground"
                      chatContext="secretaria"
                      onSendToBob={(text) => handleSendMessage('bob', 'text', text)}
                    />
                  </div>
                </div>
              </Allotment.Pane>
              <Allotment.Pane minSize={300}>
                <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden backdrop-blur-sm">
                  <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Bob, o Engenheiro</h2>
                        <p className="text-blue-100 text-sm opacity-90">Especialista em Otimização de Prompts</p>
                      </div>
                      <button
                        onClick={() => handleClearChat('bob')}
                        disabled={isLoading['clearBob'] || isLoading['history_bob']}
                        className={`p-3 transition-all rounded-full ${isLoading['clearBob'] ? 'text-blue-300 cursor-not-allowed' : 'text-blue-100 hover:text-white hover:bg-white/20 hover:scale-110'}`}
                        title="Limpar Chat com Bob"
                      >
                        <ArrowPathIcon className={`h-5 w-5 ${isLoading['clearBob'] ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ChatInterface 
                      medicoNome={medicoProfile?.nome_completo || 'Médico(a)'}
                      onSendMessage={(type, msg) => handleSendMessage('bob', type, msg)}
                      onOnboardingComplete={() => {}} 
                      initialMessages={bobMessages}
                      agentName="Bob, o Engenheiro"
                      agentAvatar="https://placehold.co/40/3b82f6/ffffff?text=BOB" 
                      userAvatar={<UserCircleIcon className="h-8 w-8 text-slate-600" />}
                      hideHeader={true}
                      setAudioPlaybackUrlForParent={setAudioPlaybackUrl}
                      variant="playground"
                      chatContext="bob"
                    />
                  </div>
                </div>
              </Allotment.Pane>
            </Allotment>
          </div>
          
          <div className="md:col-span-1 bg-white/90 backdrop-blur-md p-8 shadow-2xl rounded-3xl border border-white/50 flex flex-col space-y-6 max-h-[calc(100vh-var(--header-height,80px)-80px)] overflow-y-auto">
                          <div className="text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">Controles do Prompt</h2>
                <p className="text-slate-500 text-sm">Gerencie suas configurações de IA</p>
              </div>

              {/* Analytics Dashboard */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  Analytics da Sessão
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{secretariaMessages.length}</div>
                    <div className="text-sm text-slate-600">Mensagens Secretária</div>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{bobMessages.length}</div>
                    <div className="text-sm text-slate-600">Mensagens Bob</div>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.ceil((secretariaMessages.reduce((acc, msg) => acc + msg.text.length, 0) + 
                                   bobMessages.reduce((acc, msg) => acc + msg.text.length, 0)) / 4)}
                    </div>
                    <div className="text-sm text-slate-600">Tokens Totais</div>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {((secretariaMessages.length + bobMessages.length) * 1.2).toFixed(1)}s
                    </div>
                    <div className="text-sm text-slate-600">Tempo Médio</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Templates */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2 text-emerald-500" />
                  Ações Rápidas
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleSendMessage('secretaria', 'text', 'Como você pode me ajudar hoje?')}
                    className="w-full text-left px-4 py-3 bg-white/70 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 text-sm"
                  >
                    💬 Iniciar conversa amigável
                  </button>
                  <button
                    onClick={() => handleSendMessage('secretaria', 'text', 'Teste sua capacidade de agendamento: preciso marcar uma consulta para próxima semana')}
                    className="w-full text-left px-4 py-3 bg-white/70 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 text-sm"
                  >
                    📅 Testar agendamento
                  </button>
                  <button
                    onClick={() => handleSendMessage('bob', 'text', 'Analise meu prompt atual e sugira 3 melhorias específicas')}
                    className="w-full text-left px-4 py-3 bg-white/70 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 text-sm"
                  >
                    🔧 Pedir análise ao Bob
                  </button>
                  <button
                    onClick={() => handleSendMessage('bob', 'text', 'Me ajude a criar uma versão mais empática do prompt da secretária')}
                    className="w-full text-left px-4 py-3 bg-white/70 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 text-sm"
                  >
                    ❤️ Melhorar empatia
                  </button>
                </div>
              </div>
            <button 
              onClick={handleViewEditPrompt}
              disabled={isLoading['viewPrompt']}
              className="w-full flex items-center px-6 py-4 bg-blue-50 border border-blue-200 rounded-2xl text-base font-medium text-slate-800 hover:bg-blue-100 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 group"
            >
              <BookOpenIcon className="h-6 w-6 mr-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-left flex-1">
                <div className="font-bold text-lg">{isLoading['viewPrompt'] ? 'Buscando...' : 'Prompt de Laboratório'}</div>
                <div className="text-sm text-slate-600">Ver e editar configurações</div>
              </div>
            </button>
            <button 
              onClick={handleDiscardChanges}
              disabled={isLoading['discardPrompt'] || isLoading['viewPrompt']}
              className="w-full flex items-center px-6 py-4 bg-orange-50 border border-orange-200 rounded-2xl text-base font-medium text-slate-800 hover:bg-orange-100 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 group"
            >
              <ArchiveBoxXMarkIcon className="h-6 w-6 mr-4 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-left flex-1">
                <div className="font-bold text-lg">{isLoading['discardPrompt'] ? 'Descartando...' : 'Descartar Alterações'}</div>
                <div className="text-sm text-slate-600">Reverter para versão atual</div>
              </div>
            </button>
            <button 
              onClick={handlePublishPrompt}
              disabled={isLoading['publishPrompt'] || isLoading['viewPrompt']}
              className="w-full flex items-center px-6 py-4 bg-green-50 border border-green-200 rounded-2xl text-base font-medium text-slate-800 hover:bg-green-100 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 group"
            >
              <CloudArrowUpIcon className="h-6 w-6 mr-4 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-left flex-1">
                <div className="font-bold text-lg">{isLoading['publishPrompt'] ? 'Publicando...' : 'Publicar para Produção'}</div>
                <div className="text-sm text-slate-600">Ativar configurações atuais</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {confirmationModalState && (
        <ConfirmationModal 
          isOpen={confirmationModalState.isOpen}
          title={confirmationModalState.title}
          message={confirmationModalState.message}
          onConfirm={confirmationModalState.onConfirm}
          onCancel={() => setConfirmationModalState(null)}
          confirmText={confirmationModalState.confirmText}
          confirmButtonColor={confirmationModalState.confirmButtonColor}
          isLoading={isLoading['discardPrompt'] || isLoading['publishPrompt']}
        />
      )}

      {isPromptModalOpen && promptLab && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditingPrompt ? 'Editar Prompt de Laboratório' : 'Prompt de Laboratório'}
              </h2>
              <button 
                onClick={() => setIsPromptModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading['savePrompt']}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden mb-6">
              {isEditingPrompt ? (
                <div className="h-full" data-color-mode="light">
                  <MDEditor
                    value={editedPrompt}
                    onChange={(value) => setEditedPrompt(value || '')}
                    preview="edit"
                    height={400}
                    data-color-mode="light"
                  />
                </div>
              ) : (
                <div className="h-[400px] overflow-y-auto border border-gray-300 rounded-md">
                  <div className="p-4 bg-gray-50" data-color-mode="light">
                    <MarkdownPreview source={promptLab.prompt_texto_laboratorio || 'Nenhum prompt de laboratório definido.'} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 mb-4">
              Última atualização: {promptLab.updated_at_laboratorio ? new Date(promptLab.updated_at_laboratorio).toLocaleString('pt-BR') : 'Nunca'}
            </div>
            
            <div className="flex justify-end space-x-3">
              {isEditingPrompt ? (
                <>
                  <button 
                    onClick={handleCancelEdit}
                    disabled={isLoading['savePrompt']}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSavePrompt}
                    disabled={isLoading['savePrompt']}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading['savePrompt'] ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsPromptModalOpen(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  >
                    Fechar
                  </button>
                  <button 
                    onClick={() => setIsEditingPrompt(true)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 