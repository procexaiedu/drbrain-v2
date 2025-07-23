'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import ChatMessage, { Message } from './ChatMessage'; 
import { PaperAirplaneIcon, MicrophoneIcon, StopCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface ChatInterfaceProps {
  medicoNome: string;
  onSendMessage: (messageType: 'text' | 'audio', content: string) => Promise<Message | null>;
  onOnboardingComplete: () => void;
  initialMessages?: Message[];
  userAvatar?: React.ReactNode;
  agentAvatar?: React.ReactNode;
  agentName?: string;
  hideHeader?: boolean;
  setAudioPlaybackUrlForParent?: (url: string | null) => void;
  chatTitle?: string;
  chatSubtitle?: string;
  onClearChat?: () => void;
  inputPlaceholder?: string;
  variant?: 'default' | 'playground';
  chatContext?: 'secretaria' | 'bob';
  onSendToBob?: (text: string) => void;
}

export default function ChatInterface({
  medicoNome,
  onSendMessage,
  onOnboardingComplete,
  initialMessages,
  userAvatar,
  agentAvatar,
  agentName,
  hideHeader,
  setAudioPlaybackUrlForParent,
  chatTitle,
  chatSubtitle,
  onClearChat,
  inputPlaceholder,
  variant = 'default',
  chatContext,
  onSendToBob
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resolvedAgentName = agentName || 'Agente IA';
  const DEFAULT_USER_AVATAR_PLACEHOLDER = 'https://placehold.co/40/8b5cf6/ffffff?text=Dr';
  const DEFAULT_AGENT_AVATAR_PLACEHOLDER = 'https://placehold.co/40/7c3aed/ffffff?text=IA';
  const isPlayground = variant === 'playground';

  const currentAgentAvatar = agentAvatar || DEFAULT_AGENT_AVATAR_PLACEHOLDER;
  const currentUserAvatar = userAvatar || DEFAULT_USER_AVATAR_PLACEHOLDER;

  useEffect(() => {
    if (messages.length === 0 && initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const handleStartRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: {noiseSuppression: true, echoCancellation: true} });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(completeAudioBlob);
          const playbackUrl = URL.createObjectURL(completeAudioBlob);
          setAudioPlaybackUrl(playbackUrl);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setAudioBlob(null);
        setAudioPlaybackUrl(null);
      } catch (err) {
        console.error('Erro ao acessar o microfone:', err);
        alert('Não foi possível acessar o microfone. Verifique as permissões.');
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !audioBlob) || isAgentTyping) return;

    let messageType: 'text' | 'audio';
    let contentForApi: string;
    let userMessageTextForDisplay: string;
    let audioSrcForDisplay: string | undefined = audioPlaybackUrl || undefined;

    if (audioBlob) {
      messageType = 'audio';
      contentForApi = await blobToBase64(audioBlob);
      userMessageTextForDisplay = '🎙️ Gravação de áudio';
    } else {
      messageType = 'text';
      contentForApi = inputText.trim();
      userMessageTextForDisplay = contentForApi;
    }

    const newUserMessage: Message = {
      id: Date.now().toString() + '_user',
      sender: 'user',
      timestamp: new Date().toISOString(),
      userName: `Dr. ${medicoNome || 'Usuário'}`,
      avatar: currentUserAvatar,
      text: userMessageTextForDisplay, 
      audioSrc: audioSrcForDisplay, 
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setAudioBlob(null);
    setAudioPlaybackUrl(null);
    if (setAudioPlaybackUrlForParent) setAudioPlaybackUrlForParent(null);
    
    setIsAgentTyping(true);

    try {
      const agentResponse = await onSendMessage(messageType, contentForApi);
      if (agentResponse) {
        setMessages(prev => [
          ...prev,
          {
            ...agentResponse,
            avatar: agentAvatar,
            userName: resolvedAgentName,
            isLoading: false,
          }
        ]);
        if (agentResponse.onboarding_status === 'completed') {
          setTimeout(() => {
            onOnboardingComplete();
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem ou receber resposta:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: 'Desculpe, não consegui processar sua mensagem. Tente novamente mais tarde.',
        sender: 'agent',
        timestamp: new Date().toISOString(),
        avatar: agentAvatar,
        userName: resolvedAgentName,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    setIsAgentTyping(false);
    textareaRef.current?.focus();
  };

  const handleClearChat = () => {
    if (onClearChat) {
        onClearChat();
    } else {
        setMessages(initialMessages || []);
    }
    setAudioBlob(null);
    setAudioPlaybackUrl(null);
    if (setAudioPlaybackUrlForParent) setAudioPlaybackUrlForParent(null);
  }

  // Funcionalidades novas do playground
  const handleCopyMessage = (text: string) => {
    // Feedback visual de cópia (poderia adicionar toast)
    console.log('Mensagem copiada:', text);
  };

  const handleSendToBobFromMessage = (text: string) => {
    if (onSendToBob) {
      onSendToBob(text);
    }
  };

  const handleRegenerateResponse = (messageId: string) => {
    // Implementar regeneração da última resposta
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const previousUserMessage = messages[messageIndex - 1];
      if (previousUserMessage.sender === 'user') {
        // Regenerar usando a mensagem anterior do usuário
        const regenerateContent = previousUserMessage.audioSrc ? 
          'Regenerar resposta anterior' : previousUserMessage.text;
        onSendMessage('text', regenerateContent);
      }
    }
  };

  const handleRateMessage = (messageId: string, rating: 'good' | 'bad') => {
    // Implementar rating - poderia salvar no localStorage ou enviar para API
    console.log(`Mensagem ${messageId} avaliada como: ${rating}`);
    // Aqui poderia adicionar visual feedback ou salvar a avaliação
  };

  // Estilos condicionais
  const containerClasses = isPlayground 
    ? "flex flex-col h-full bg-transparent overflow-hidden"
    : "flex flex-col h-full bg-gray-50 shadow-xl rounded-lg overflow-hidden border border-gray-200";

  const formClasses = isPlayground 
    ? "p-6"
    : "border-t border-gray-200 bg-white p-3 sm:p-4 flex items-end space-x-2";

  const inputContainerClasses = isPlayground 
    ? "bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl p-4 focus-within:ring-2 focus-within:ring-blue-400/50 focus-within:border-blue-400/50 transition-all duration-300 shadow-xl shadow-slate-500/10 relative"
    : "";

  const textareaClasses = isPlayground 
    ? "flex-1 bg-transparent border-none resize-none focus:ring-0 focus:outline-none transition-all duration-300 min-h-[48px] max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent text-slate-900 placeholder-slate-500 text-base"
    : "flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-150 min-h-[44px] max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 text-gray-900 placeholder-gray-500";

  const buttonClasses = isPlayground 
    ? "w-10 h-10 rounded-full transition-all duration-300 disabled:opacity-50 shadow-lg"
    : "p-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50";

  return (
    <div className={containerClasses}>
      {!hideHeader && (
        <header className="bg-white text-gray-800 p-4 shadow-sm border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{chatTitle || `Chat com ${resolvedAgentName}`}</h1>
            {chatSubtitle && <p className="text-xs text-gray-500">{chatSubtitle}</p>}
          </div>
          {onClearChat && (
            <button 
              onClick={handleClearChat}
              title="Limpar conversa"
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          )}
        </header>
      )}

      <div className={`flex-1 p-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300/50 scrollbar-track-transparent scrollbar-thumb-rounded-full ${isPlayground ? 'bg-gradient-to-b from-transparent to-white/20' : ''}`}>
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={{
              ...msg,
              avatar: msg.sender === 'user' ? currentUserAvatar : currentAgentAvatar,
              userName: msg.sender === 'user' ? `Dr. ${medicoNome || 'Usuário'}` : resolvedAgentName
            }}
            variant={variant}
            chatContext={chatContext}
            onCopyMessage={handleCopyMessage}
            onSendToBob={handleSendToBobFromMessage}
            onRegenerateResponse={handleRegenerateResponse}
            onRateMessage={handleRateMessage}
          />
        ))}
        {isAgentTyping && messages.length > 0 && messages[messages.length -1].sender === 'user' && (
          <ChatMessage 
            message={{
              id: 'agent-typing',
              sender: 'agent',
              text: '', 
              isLoading: true,
              timestamp: new Date().toISOString(),
              avatar: currentAgentAvatar,
              userName: resolvedAgentName
            }}
            variant={variant}
            chatContext={chatContext}
            onCopyMessage={handleCopyMessage}
            onSendToBob={handleSendToBobFromMessage}
            onRegenerateResponse={handleRegenerateResponse}
            onRateMessage={handleRateMessage}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {audioPlaybackUrl && (
        <div className="px-4 py-3 border-t bg-gray-100 flex items-center justify-between space-x-3">
          <audio controls src={audioPlaybackUrl} className="w-full max-w-xs h-10"></audio>
          <button 
            onClick={() => { 
              setAudioBlob(null); 
              setAudioPlaybackUrl(null);
              if (setAudioPlaybackUrlForParent) setAudioPlaybackUrlForParent(null);
            }} 
            className="p-2 text-red-500 hover:text-red-700"
            title="Descartar áudio"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className={formClasses}>
        {isPlayground ? (
          <div className={inputContainerClasses}>
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={inputPlaceholder || "Digite sua mensagem..."}
                className={textareaClasses}
                rows={1}
                disabled={isRecording || isAgentTyping}
              />
              <div className="flex items-center gap-2 pb-1">
                {!isRecording && !audioBlob && (
                  <button 
                    type="button" 
                    onClick={handleStartRecording}
                    disabled={isAgentTyping}
                    className={`${buttonClasses} bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-110 active:scale-95 flex items-center justify-center`}
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                  </button>
                )}
                {isRecording && (
                  <button 
                    type="button" 
                    onClick={handleStopRecording} 
                    className={`${buttonClasses} bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:scale-110 active:scale-95 flex items-center justify-center animate-pulse`}
                  >
                    <StopCircleIcon className="h-5 w-5" />
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={(!inputText.trim() && !audioBlob) || isAgentTyping || isRecording}
                  className={`${buttonClasses} bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-110 active:scale-95 disabled:from-slate-300 disabled:to-slate-400 disabled:hover:scale-100 flex items-center justify-center`}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={inputPlaceholder || "Digite sua mensagem..."}
              className={textareaClasses}
              rows={1}
              disabled={isRecording || isAgentTyping}
            />
            {!isRecording && !audioBlob && (
              <button 
                type="button" 
                onClick={handleStartRecording}
                disabled={isAgentTyping}
                className={buttonClasses}
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>
            )}
            {isRecording && (
              <button type="button" onClick={handleStopRecording} className="p-3 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                <StopCircleIcon className="h-5 w-5" />
              </button>
            )}
            <button 
              type="submit" 
              disabled={(!inputText.trim() && !audioBlob) || isAgentTyping || isRecording}
              className={buttonClasses}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </form>
    </div>
  );
} 