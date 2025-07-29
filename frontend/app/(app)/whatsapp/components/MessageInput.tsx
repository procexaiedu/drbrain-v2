'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

interface MessageInputProps {
  conversationId: string;
  contactJid: string;
}

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

export default function MessageInput({ conversationId, contactJid }: MessageInputProps) {
  const [messageContent, setMessageContent] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!SUPABASE_FUNCTIONS_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL is not defined");
    return <div className="text-red-500">Erro: URL das funções Supabase não configurada.</div>;
  }

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.id) throw new Error('User not logged in');
      if (!conversationId) throw new Error('Conversation not selected');

      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/whatsapp-chat/send-message`, { // URL corrigida
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_content: message,
          contact_jid: contactJid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      setMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['whatsappMessages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['whatsappConversations', user?.id] });
    },
    onError: (error: any) => {
      alert(`Error sending message: ${error.message}`);
    },
  });

  const handleSendMessage = () => {
    if (messageContent.trim()) {
      sendMessageMutation.mutate(messageContent);
    }
  };

  return (
    <div className="p-4 border-t bg-gray-50 flex items-center">
      <input
        type="text"
        value={messageContent}
        onChange={(e) => setMessageContent(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage();
          }
        }}
        placeholder="Digite sua mensagem..."
        className="flex-grow border rounded-full py-2 px-4 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSendMessage}
        disabled={sendMessageMutation.isPending || !messageContent.trim()}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sendMessageMutation.isPending ? 'Enviando...' : 'Enviar'}
      </button>
    </div>
  );
} 