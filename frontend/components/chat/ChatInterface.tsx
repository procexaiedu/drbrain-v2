'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import ChatMessage, { Message } from './ChatMessage'; 
import { PaperAirplaneIcon, MicrophoneIcon, StopCircleIcon } from '@heroicons/react/24/solid';

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
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

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

  const handleStartRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(completeAudioBlob);
          const playbackUrl = URL.createObjectURL(completeAudioBlob);
          if (setAudioPlaybackUrlForParent) {
            setAudioPlaybackUrlForParent(playbackUrl);
          }
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setAudioBlob(null);
        if (setAudioPlaybackUrlForParent) {
            setAudioPlaybackUrlForParent(null);
        }
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
    let audioSrcForDisplay: string | undefined = undefined;

    if (audioBlob) {
      messageType = 'audio';
      contentForApi = await blobToBase64(audioBlob);
      userMessageTextForDisplay = '[Mensagem de Áudio]'; 
    } else {
      messageType = 'text';
      contentForApi = inputText.trim();
      userMessageTextForDisplay = contentForApi;
    }

    const newUserMessage: Message = {
      id: Date.now().toString() + '_user',
      sender: 'user',
      timestamp: new Date().toISOString(),
      userName: `Dr. ${medicoNome}`,
      avatar: currentUserAvatar,
      text: userMessageTextForDisplay, 
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setAudioBlob(null);
    if (setAudioPlaybackUrlForParent) {
        setAudioPlaybackUrlForParent(null);
    }
    setIsAgentTyping(true);

    try {
      const agentResponse = await onSendMessage(messageType, contentForApi);
      if (agentResponse) {
        setMessages(prev => [
          ...prev,
          {
            ...agentResponse,
            isLoading: false,
          }
        ]);
        if (agentResponse.onboarding_status === 'completed') {
          setTimeout(() => {
            onOnboardingComplete();
          }, 2500); 
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem ou receber resposta:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
        sender: 'agent',
        timestamp: new Date().toISOString(),
        avatar: currentAgentAvatar,
        userName: resolvedAgentName,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    setIsAgentTyping(false);
  };
  
  return (
    <div className="flex flex-col h-full bg-white shadow-lg rounded-lg overflow-hidden">
      {!hideHeader && (
        <header className="bg-indigo-600 text-white p-4 shadow-md flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Bem-vindo ao Dr.Brain, Dr. {medicoNome}!</h1>
            <p className="text-sm text-indigo-200">Vamos personalizar sua experiência e configurar sua Secretária IA.</p>
          </div>
        </header>
      )}

      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
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

      {audioBlob && (
        <div className="p-3 border-t bg-gray-100 flex items-center justify-between">
          <audio controls src={URL.createObjectURL(audioBlob)} className="w-full max-w-xs"></audio>
          <button 
            onClick={() => { 
              setAudioBlob(null); 
              if (setAudioPlaybackUrlForParent) setAudioPlaybackUrlForParent(null);
            }} 
            className="p-2 text-red-500 hover:text-red-700"
            title="Descartar áudio"
          >
            X
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 border-t bg-gray-100">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRecording ? "Gravando áudio..." : "Digite sua mensagem ou grave um áudio..."}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all duration-150"
            rows={1}
            disabled={isRecording || isAgentTyping}
            style={{ minHeight: '48px', maxHeight: '120px' }}
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
            className={`p-3 text-white bg-indigo-600 rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-150 ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
            disabled={isAgentTyping}
          >
            {isRecording ? (
              <StopCircleIcon className="h-6 w-6" />
            ) : (
              <MicrophoneIcon className="h-6 w-6" />
            )}
          </button>
          <button
            type="submit"
            className="p-3 text-white bg-indigo-600 rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-150"
            disabled={(!inputText.trim() && !audioBlob) || isAgentTyping || isRecording}
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
      </form>
    </div>
  );
} 