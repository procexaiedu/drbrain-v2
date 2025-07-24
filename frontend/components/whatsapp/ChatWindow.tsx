import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { WhatsAppConversation, MessagesResponse } from './types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  conversation: WhatsAppConversation;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const { session } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messagesData, isLoading, error, refetch } = useQuery<MessagesResponse>({
    queryKey: ['whatsapp-messages', conversation.id],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('No session');
      
      const response = await fetch(`/edge/v1/whatsapp-chat/messages?conversation_id=${conversation.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return response.json();
    },
    enabled: !!session?.access_token && !!conversation.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const messages = messagesData?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getContactName = (conversation: WhatsAppConversation) => {
    if (conversation.contact_name && conversation.contact_name !== conversation.contact_jid) {
      return conversation.contact_name;
    }
    const phoneNumber = conversation.contact_jid.split('@')[0];
    return `+${phoneNumber}`;
  };

  const getContactInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const contactName = getContactName(conversation);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Contact Avatar */}
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {getContactInitials(contactName)}
              </span>
            </div>
            
            {/* Contact Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {contactName}
              </h2>
              <p className="text-sm text-gray-500">
                {conversation.contact_jid.split('@')[0]}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => refetch()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Atualizar mensagens"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500">Carregando mensagens...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 mb-2">Erro ao carregar mensagens</p>
              <button 
                onClick={() => refetch()}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma mensagem ainda</h3>
              <p className="text-gray-500">
                Esta é uma nova conversa. Envie uma mensagem para começar.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {/* Welcome message for new conversations */}
            {messages.length === 1 && (
              <div className="text-center py-8 border-b border-gray-100 mb-4">
                <div className="text-sm text-gray-500">
                  <p className="mb-2">💬 <strong>Nova conversa iniciada</strong></p>
                  <p>Suas mensagens e as respostas da IA aparecerão aqui.</p>
                  <p className="mt-1 text-xs">
                    A IA responderá automaticamente com base nas suas configurações.
                  </p>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput conversation={conversation} />
    </div>
  );
};

export default ChatWindow; 