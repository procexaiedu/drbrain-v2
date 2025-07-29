'use client';

import { useState, useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppContext } from '@/context/AppContext'; // Assuming AppContext holds user info for now

interface MessageInputProps {
  conversationId: string;
  contactJid: string;
}

export default function MessageInput({ conversationId, contactJid }: MessageInputProps) {
  const [messageContent, setMessageContent] = useState('');
  const { user } = useContext(AppContext);
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.id) throw new Error('User not logged in');
      if (!conversationId) throw new Error('Conversation not selected');

      const res = await fetch('/api/whatsapp-chat/send-message', {
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
      queryClient.invalidateQueries(['whatsappMessages', conversationId]); // Invalidate to refetch messages
      queryClient.invalidateQueries(['whatsappConversations', user?.id]); // Invalidate to update last message/unread count
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
        disabled={sendMessageMutation.isLoading || !messageContent.trim()}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sendMessageMutation.isLoading ? 'Enviando...' : 'Enviar'}
      </button>
    </div>
  );
} 