'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown'; // Para renderizar Markdown do agente
import remarkGfm from 'remark-gfm'; // Importar remark-gfm
import { UserIcon, CpuChipIcon } from '@heroicons/react/24/solid'; // Ícones sólidos para avatares padrão

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
  });

  const defaultUserAvatar = (
    <div className="w-full h-full rounded-full bg-indigo-500 flex items-center justify-center">
      <UserIcon className="h-5 w-5 text-white" />
    </div>
  );

  const defaultAgentAvatar = (
    <div className="w-full h-full rounded-full bg-purple-500 flex items-center justify-center">
      <CpuChipIcon className="h-5 w-5 text-white" />
    </div>
  );

  const avatarContent = message.avatar ? (
    typeof message.avatar === 'string' ? (
      <img src={message.avatar} alt={message.userName || 'avatar'} className="w-full h-full object-cover rounded-full" />
    ) : (
      message.avatar // Renderiza o ReactNode diretamente
    )
  ) : isUser ? (
    defaultUserAvatar
  ) : (
    defaultAgentAvatar
  );

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} my-2`}>
      <div className={`flex items-end max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse space-x-reverse space-x-2' : 'flex-row space-x-2'}`}>
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 self-start mt-1">
          {avatarContent}
        </div>

        {/* Balão da Mensagem e Conteúdo */}
        <div 
          className={`px-4 py-3 rounded-xl shadow-md relative group ${
            isUser 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none' 
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
          }`}
        >
          {/* Nome do Usuário/Agente (opcional, pode ser redundante se o avatar for claro) */}
          {/* <p className={`text-xs font-semibold mb-1 ${isUser ? 'text-indigo-200 text-right' : 'text-gray-600'}`}>
            {message.userName}
          </p> */}
          
          {message.isLoading ? (
            <div className="flex items-center space-x-1.5 py-1">
              <div className={`w-2 h-2 ${isUser ? 'bg-indigo-200' : 'bg-gray-400'} rounded-full animate-pulse`}></div>
              <div className={`w-2 h-2 ${isUser ? 'bg-indigo-200' : 'bg-gray-400'} rounded-full animate-pulse delay-75`}></div>
              <div className={`w-2 h-2 ${isUser ? 'bg-indigo-200' : 'bg-gray-400'} rounded-full animate-pulse delay-150`}></div>
            </div>
          ) : message.audioSrc ? (
            <audio controls src={message.audioSrc} className="max-w-full h-10" />
          ) : (
            <div className={`prose prose-sm max-w-none ${isUser ? 'text-white prose-invert' : 'text-gray-700'} break-words whitespace-pre-line`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className={`${isUser ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-500'} underline`} />,
                  p: ({node, ...props}) => <p {...props} />,
                }}
              >
                {isUser ? message.text : message.text.replace(/^```markdown\n|\n```$/g, '')}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;