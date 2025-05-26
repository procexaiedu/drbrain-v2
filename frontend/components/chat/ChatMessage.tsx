'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown'; // Para renderizar Markdown do agente

// Reutilizando a interface Message de ChatInterface.tsx ou definindo-a aqui se movida.
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
  avatar?: React.ReactNode; // Alterado para React.ReactNode
  userName?: string;
  audioSrc?: string; // Para mensagens de áudio do usuário
  isLoading?: boolean; // Para mensagens do agente que estão carregando
  onboarding_status?: string; // Para funcionalidade do onboarding
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  // Formata o timestamp para algo mais legível
  const formattedTimestamp = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end max-w-xs md:max-w-md lg:max-w-lg ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {message.avatar && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${isUser ? 'ml-2' : 'mr-2'} self-start`}>
            {typeof message.avatar === 'string' ? (
              <img src={message.avatar} alt={message.userName || 'avatar'} className="w-full h-full object-cover" />
            ) : (
              message.avatar // Renderiza o ReactNode diretamente
            )}
          </div>
        )}
        {!message.avatar && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${isUser ? 'ml-2 bg-indigo-500' : 'mr-2 bg-gray-400'} self-start`}>
                {isUser ? message.userName?.substring(0,1) || 'U' : message.userName?.substring(0,1) || 'A'}
            </div>
        )}

        {/* Balão da Mensagem e Conteúdo */}
        <div className={`px-4 py-3 rounded-lg shadow-md ${isUser ? 'bg-indigo-500 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
          {/* Nome do Usuário/Agente */}
          <p className={`text-xs font-semibold mb-1 ${isUser ? 'text-indigo-200 text-right' : 'text-gray-600'}`}>
            {message.userName}
          </p>
          
          {/* Conteúdo da Mensagem */}
          {message.isLoading ? (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-1"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75 mr-1"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
            </div>
          ) : message.audioSrc ? (
            <audio controls src={message.audioSrc} className="max-w-full" />
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  // Para garantir que links abram em nova aba e tenham bom estilo
                  a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}

          {/* Timestamp */}
          <p className={`text-xs mt-2 ${isUser ? 'text-indigo-200 text-right' : 'text-gray-400 text-left'}`}>
            {formattedTimestamp}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 