import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { WhatsAppConversation, SendMessageResponse } from './types';

interface MessageInputProps {
  conversation: WhatsAppConversation;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversation, disabled = false }) => {
  const [message, setMessage] = useState('');
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!session?.access_token) throw new Error('No session');
      
      const phoneNumber = conversation.contact_jid.split('@')[0];
      
      const response = await fetch('/edge/v1/whatsapp-chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: phoneNumber,
          message: messageText,
          conversationId: conversation.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      return response.json() as Promise<SendMessageResponse>;
    },
    onSuccess: () => {
      // Invalidate queries to refresh messages and conversations
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      setMessage('');
    },
    onError: (error) => {
      console.error('Send message error:', error);
      alert(`Erro ao enviar mensagem: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(trimmedMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Message Input */}
        <div className="flex-1">
          <label htmlFor="message" className="sr-only">
            Sua mensagem
          </label>
          <textarea
            id="message"
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={disabled || sendMessageMutation.isPending}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
            style={{ 
              minHeight: '40px',
              maxHeight: '120px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled || sendMessageMutation.isPending}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {sendMessageMutation.isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="ml-2 hidden sm:block">Enviar</span>
            </>
          )}
        </button>
      </form>

      {/* Error/Success Messages */}
      {sendMessageMutation.isError && (
        <div className="mt-2 text-sm text-red-600">
          Erro ao enviar mensagem. Tente novamente.
        </div>
      )}

      {/* Contact Info */}
      <div className="mt-2 text-xs text-gray-500">
        Enviando para: {conversation.contact_name || conversation.contact_jid.split('@')[0]}
      </div>
    </div>
  );
};

export default MessageInput; 