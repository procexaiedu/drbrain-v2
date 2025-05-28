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
  inputPlaceholder
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
  
  return (
    <div className="flex flex-col h-full bg-gray-50 shadow-xl rounded-lg overflow-hidden border border-gray-200">
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

      <div className="flex-1 p-4 sm:p-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-thumb-rounded-full">
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={{
              ...msg,
              avatar: msg.sender === 'user' ? currentUserAvatar : currentAgentAvatar,
              userName: msg.sender === 'user' ? `Dr. ${medicoNome || 'Usuário'}` : resolvedAgentName
            }} 
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
            className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
            title="Descartar áudio"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="p-3 sm:p-4 border-t bg-white sticky bottom-0 z-10">
        <div className="flex items-end space-x-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRecording ? "Gravando áudio..." : (inputPlaceholder || "Digite sua mensagem...")}
            className="flex-1 py-2.5 px-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all duration-150 bg-white text-sm"
            rows={1}
            disabled={isRecording || isAgentTyping}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!((!inputText.trim() && !audioBlob) || isRecording || isAgentTyping)) {
                    handleSend();
                }
              }
            }}
          />
          <button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            title={isRecording ? "Parar Gravação" : "Gravar Áudio"}
            className={`
              p-2.5 text-white rounded-lg shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-offset-2 
              transition-colors duration-150 flex items-center justify-center
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              }
              ${isAgentTyping ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={isAgentTyping}
          >
            {isRecording ? (
              <StopCircleIcon className="h-5 w-5" />
            ) : (
              <MicrophoneIcon className="h-5 w-5" />
            )}
          </button>
          <button
            type="submit"
            title="Enviar Mensagem"
            className={`
              p-2.5 text-white bg-indigo-600 rounded-lg shadow-sm 
              hover:bg-indigo-700 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-indigo-500 
              transition-colors duration-150 flex items-center justify-center
              ${(!inputText.trim() && !audioBlob) || isAgentTyping || isRecording ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={(!inputText.trim() && !audioBlob) || isAgentTyping || isRecording}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 