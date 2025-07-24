'use client';

import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown'; // Para renderizar Markdown do agente
import remarkGfm from 'remark-gfm'; // Importar remark-gfm
import { 
  UserIcon, 
  CpuChipIcon, 
  ClipboardDocumentIcon,
  ArrowRightCircleIcon,
  ArrowPathIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/solid';

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
  variant?: 'default' | 'playground';
  onCopyMessage?: (text: string) => void;
  onSendToBob?: (text: string) => void;
  onRegenerateResponse?: (messageId: string) => void;
  onRateMessage?: (messageId: string, rating: 'good' | 'bad') => void;
  chatContext?: 'secretaria' | 'bob';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  variant = 'default',
  onCopyMessage,
  onSendToBob,
  onRegenerateResponse,
  onRateMessage,
  chatContext
}) => {
  const isUser = message.sender === 'user';
  const isPlayground = variant === 'playground';
  
  // Funcionalidades específicas do playground
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      if (onCopyMessage) onCopyMessage(message.text);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleSendToBob = () => {
    if (onSendToBob && chatContext === 'secretaria') {
      onSendToBob(`Por favor, analise e melhore esta resposta da Secretária IA:\n\n"${message.text}"\n\nSugestões de melhoria:`);
    }
  };

  const getResponseTime = () => {
    // Simula tempo de resposta baseado no tamanho da mensagem
    const wordCount = message.text.split(' ').length;
    return Math.round((wordCount * 0.1 + Math.random() * 2) * 100) / 100;
  };

  const getTokenCount = () => {
    // Estimativa aproximada de tokens (1 token ≈ 4 caracteres)
    return Math.ceil(message.text.length / 4);
  };

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
      <Image src={message.avatar} alt={message.userName || 'avatar'} className="w-full h-full object-cover rounded-full" width={40} height={40} />
    ) : (
      message.avatar // Renderiza o ReactNode diretamente
    )
  ) : isUser ? (
    defaultUserAvatar
  ) : (
    defaultAgentAvatar
  );

  // Estilos condicionais baseados na variant
  const containerClasses = `flex w-full ${isUser ? 'justify-end' : 'justify-start'} ${isPlayground ? 'my-4' : 'my-2'}`;
  const messageContainerClasses = `flex items-end max-w-[85%] md:max-w-[75%] ${
    isUser ? 'flex-row-reverse space-x-reverse space-x-3' : 'flex-row space-x-3'
  }`;

  const balloonClasses = isPlayground 
    ? `px-6 py-4 relative group ${
        isUser 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl rounded-br-lg shadow-xl shadow-blue-500/25 backdrop-blur-sm' 
          : 'bg-white/90 text-slate-800 border border-white/50 rounded-3xl rounded-bl-lg shadow-xl shadow-slate-500/10 backdrop-blur-md'
      }`
    : `px-4 py-3 rounded-xl shadow-md relative group ${
        isUser 
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none' 
          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
      }`;

  return (
    <div className={`${containerClasses} ${isPlayground ? 'animate-fade-in-up' : ''}`}>
      <div className={messageContainerClasses}>
        {/* Avatar */}
        <div className={`${isPlayground ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 self-start mt-1 ${isPlayground ? 'ring-2 ring-white/30 shadow-lg' : ''}`}>
          {avatarContent}
        </div>

        {/* Balão da Mensagem e Conteúdo */}
        <div className={balloonClasses}>
          {message.isLoading ? (
            <div className="flex items-center space-x-1.5 py-1">
              <div className={`w-2 h-2 ${isUser ? 'bg-blue-200' : 'bg-gray-400'} rounded-full animate-pulse`}></div>
              <div className={`w-2 h-2 ${isUser ? 'bg-blue-200' : 'bg-gray-400'} rounded-full animate-pulse delay-75`}></div>
              <div className={`w-2 h-2 ${isUser ? 'bg-blue-200' : 'bg-gray-400'} rounded-full animate-pulse delay-150`}></div>
            </div>
          ) : message.audioSrc ? (
            <audio controls src={message.audioSrc} className="max-w-full h-10" />
          ) : (
            <>
              <div className={`prose prose-sm max-w-none break-words whitespace-pre-line ${
                isPlayground 
                  ? (isUser ? 'text-white prose-invert' : 'text-slate-800')
                  : (isUser ? 'text-white prose-invert' : 'text-gray-700')
              }`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className={`${
                      isPlayground
                        ? (isUser ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-700')
                        : (isUser ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-500')
                    } underline`} />,
                    p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                  }}
                >
                  {isUser ? message.text : message.text.replace(/^```markdown\n|\n```$/g, '')}
                </ReactMarkdown>
              </div>

              {/* Actions & Metrics - Apenas no playground */}
              {isPlayground && !message.isLoading && (
                <>
                  {/* Metrics Bar */}
                  <div className={`flex items-center justify-between mt-3 pt-3 border-t ${
                    isUser 
                      ? 'border-blue-400/30' 
                      : 'border-slate-200/50'
                  } text-xs opacity-60`}>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>{getResponseTime()}s</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChatBubbleBottomCenterTextIcon className="h-3 w-3" />
                        <span>{getTokenCount()} tokens</span>
                      </div>
                    </div>
                    <div className="text-xs opacity-50">
                      {formattedTimestamp}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={`flex items-center justify-end space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className={`p-1.5 rounded-full transition-all duration-200 hover:scale-110 ${
                        isUser 
                          ? 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-100' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title="Copiar mensagem"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>

                    {/* Send to Bob (apenas para respostas da Secretária) */}
                    {!isUser && chatContext === 'secretaria' && onSendToBob && (
                      <button
                        onClick={handleSendToBob}
                        className="p-1.5 rounded-full transition-all duration-200 hover:scale-110 bg-purple-100 hover:bg-purple-200 text-purple-600"
                        title="Enviar para Bob melhorar"
                      >
                        <ArrowRightCircleIcon className="h-4 w-4" />
                      </button>
                    )}

                    {/* Regenerate (apenas para respostas da IA) */}
                    {!isUser && onRegenerateResponse && (
                      <button
                        onClick={() => onRegenerateResponse(message.id)}
                        className="p-1.5 rounded-full transition-all duration-200 hover:scale-110 bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                        title="Regenerar resposta"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                    )}

                    {/* Rating Buttons (apenas para respostas da IA) */}
                    {!isUser && onRateMessage && (
                      <>
                        <button
                          onClick={() => onRateMessage(message.id, 'good')}
                          className="p-1.5 rounded-full transition-all duration-200 hover:scale-110 bg-green-100 hover:bg-green-200 text-green-600"
                          title="Boa resposta"
                        >
                          <HandThumbUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onRateMessage(message.id, 'bad')}
                          className="p-1.5 rounded-full transition-all duration-200 hover:scale-110 bg-red-100 hover:bg-red-200 text-red-600"
                          title="Resposta ruim"
                        >
                          <HandThumbDownIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;