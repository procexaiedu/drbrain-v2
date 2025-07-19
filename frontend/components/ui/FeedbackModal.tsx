'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, PaperAirplaneIcon, MicrophoneIcon, StopCircleIcon, StarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid } from '@heroicons/react/24/solid';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ChatMessage, { Message } from '@/components/chat/ChatMessage';
import { toast } from 'sonner';

export default function FeedbackModal() {
  const { isFeedbackModalOpen, closeFeedbackModal } = useApp();
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isClearingMemory, setIsClearingMemory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const medicoNome = user?.user_metadata?.nome_completo || 'Médico(a)';

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Carregar histórico quando modal abre
  useEffect(() => {
    if (isFeedbackModalOpen && user && messages.length === 0) {
      fetchFeedbackHistory();
    }
  }, [isFeedbackModalOpen, user]);

  const fetchFeedbackHistory = async () => {
    if (!user) return;
    
    setIsHistoryLoading(true);
    try {
      const response = await fetch(`/edge/v1/get-feedback-history?medico_id=${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 400) {
          console.log('Nenhum histórico encontrado para este médico');
          setMessages([]);
          return;
        }
        throw new Error('Erro ao buscar histórico');
      }

      const history = await response.json();
      const processedHistory = (history as any[]).map(msg => ({
        ...msg,
        avatar: msg.sender === 'user' ? '👨‍⚕️' : '🤖',
        userName: msg.sender === 'user' ? `Dr. ${medicoNome}` : 'Agente Feedback',
      }));
      
      setMessages(processedHistory);
    } catch (error: any) {
      console.warn(`Erro ao buscar histórico do feedback: ${error.message}`);
      setMessages([]);
    }
    setIsHistoryLoading(false);
  };

  const handleClearMemory = async () => {
    if (!user) return;
    
    setIsClearingMemory(true);
    try {
      const response = await fetch('/edge/v1/limpar-memoria-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao limpar memória');
      }

      setMessages([]);
      toast.success('Memória do agente de feedback limpa!');
    } catch (error: any) {
      toast.error(`Erro ao limpar memória: ${error.message}`);
    }
    setIsClearingMemory(false);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Erro ao acessar o microfone. Verifique as permissões.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSendFeedback = async (e?: FormEvent) => {
    e?.preventDefault();
    
    if ((!inputText.trim() && !audioBlob) || isLoading || !user) return;

    const messageType = audioBlob ? 'audio' : 'text';
    let contentForApi = '';
    let userMessageTextForDisplay = '';

    if (audioBlob) {
      const base64Audio = await blobToBase64(audioBlob);
      contentForApi = base64Audio;
      userMessageTextForDisplay = '🎤 Mensagem de áudio';
    } else {
      contentForApi = inputText.trim();
      userMessageTextForDisplay = inputText.trim();
    }

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      userName: `Dr. ${medicoNome}`,
      avatar: '👨‍⚕️',
      text: userMessageTextForDisplay,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setAudioBlob(null);
    setIsAgentTyping(true);
    setIsLoading(true);

    try {
      const response = await fetch('/edge/v1/feedback-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message_type: messageType,
          content: contentForApi,
          medico_id: user?.id,
          agente_destino: 'feedback_agente'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar feedback');
      }

      const agentResponse = await response.json();
      
      const agentMessage: Message = {
        id: Date.now().toString() + '_agent',
        sender: 'agent',
        text: agentResponse.reply || agentResponse.message || agentResponse.text || agentResponse.response || 'Obrigado pelo seu feedback!',
        timestamp: new Date().toISOString(),
        avatar: '🤖',
        userName: 'Agente Feedback'
      };

      setMessages(prev => [...prev, agentMessage]);

    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: 'Desculpe, houve um erro ao processar seu feedback. Tente novamente ou entre em contato com nosso suporte.',
        sender: 'agent',
        timestamp: new Date().toISOString(),
        avatar: '⚠️',
        userName: 'Sistema'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAgentTyping(false);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setInputText('');
      setAudioBlob(null);
      setIsRecording(false);
      setIsAgentTyping(false);
      closeFeedbackModal();
    }
  };

  return (
    <Transition.Root show={isFeedbackModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                        <ChatBubbleLeftRightIconSolid className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-lg font-bold text-white">
                          💬 Central de Feedback
                        </Dialog.Title>
                        <p className="text-indigo-200 text-sm">
                          Sua opinião é fundamental para melhorarmos!
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleClearMemory}
                        disabled={isClearingMemory || isHistoryLoading}
                        className={`p-2 transition-colors rounded ${
                          isClearingMemory ? 'text-gray-400 cursor-not-allowed' : 'text-red-300 hover:text-red-100 hover:bg-white/20'
                        }`}
                        title="Limpar Memória do Chat"
                      >
                        <ArrowPathIcon className={`h-5 w-5 ${isClearingMemory ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="rounded-xl p-2 text-white/80 hover:text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-all disabled:opacity-50"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading do histórico */}
                {isHistoryLoading && (
                  <div className="flex items-center justify-center p-4 bg-gray-50">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                    <span className="ml-2 text-gray-600">Carregando histórico...</span>
                  </div>
                )}

                {/* Chat Area */}
                <div className="flex flex-col h-96">
                  {/* Messages */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-200">
                    {messages.length === 0 && !isHistoryLoading && (
                      <div className="text-center text-gray-500 mt-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                          <p className="text-lg mb-2">👋 Olá, Dr. {medicoNome}!</p>
                          <p>Como posso ajudar com seu feedback sobre o sistema?</p>
                          <p className="text-sm mt-2 text-gray-400">Compartilhe suas sugestões, críticas ou elogios.</p>
                        </div>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))}
                    {isAgentTyping && (
                      <ChatMessage 
                        message={{
                          id: 'agent-typing',
                          sender: 'agent',
                          text: '', 
                          isLoading: true,
                          timestamp: new Date().toISOString(),
                          avatar: '🤖',
                          userName: 'Agente Feedback'
                        }}
                      />
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Audio Preview */}
                  {audioBlob && (
                    <div className="px-4 py-3 border-t bg-indigo-50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                            <MicrophoneIcon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1 max-w-xs"></audio>
                      </div>
                      <button 
                        onClick={() => setAudioBlob(null)} 
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Descartar áudio"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Input Area */}
                  <form onSubmit={handleSendFeedback} className="p-4 border-t bg-white">
                    <div className="flex items-end space-x-3">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isRecording ? "🎤 Gravando áudio..." : "Digite seu feedback ou grave um áudio..."}
                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all duration-150"
                        rows={2}
                        disabled={isRecording || isAgentTyping || isLoading}
                      />
                      
                      {/* Audio Recording Button */}
                      <button
                        type="button"
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        disabled={isAgentTyping || isLoading}
                        className={`p-3 rounded-xl transition-all duration-150 ${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        } disabled:opacity-50`}
                        title={isRecording ? "Parar gravação" : "Gravar áudio"}
                      >
                        {isRecording ? (
                          <StopCircleIcon className="h-5 w-5" />
                        ) : (
                          <MicrophoneIcon className="h-5 w-5" />
                        )}
                      </button>

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={(!inputText.trim() && !audioBlob) || isRecording || isAgentTyping || isLoading}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Enviar feedback"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                          <PaperAirplaneIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 