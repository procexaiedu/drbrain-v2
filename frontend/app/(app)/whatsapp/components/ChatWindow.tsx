'use client';

import { useContext, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Conversation, Message } from '../types';
import MessageInput from './MessageInput'; // Confirmed path and export
import { supabase } from '@/lib/supabaseClient';

interface ChatWindowProps {
  conversation: Conversation;
}

export default function ChatWindow({ conversation }: ChatWindowProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivLement>(null);

  const { data, isLoading, isError } = useQuery<Message[]>(
    ['whatsappMessages', conversation.id],
    async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/whatsapp-chat/messages?conversation_id=${conversation.id}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    { enabled: !!user?.id && !!conversation.id } 
  );

  // Ensure messages is always an array for mapping
  const messages: Message[] = data || [];

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not logged in');

      const res = await fetch(`/api/whatsapp-chat/mark-as-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.id, medico_id: user.id }),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappConversations', user?.id] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (conversation.id && conversation.unread_messages > 0) {
      markAsReadMutation.mutate();
    }

    if (user?.id && conversation.id) {
        const messagesChannel = supabase
            .channel(`whatsapp_messages_conv_window:${conversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'whatsapp_messages',
                filter: `conversation_id=eq.${conversation.id}`,
            },
            (payload) => {
                console.log('Realtime whatsapp_messages INSERT received in ChatWindow!', payload);
                queryClient.invalidateQueries({ queryKey: ['whatsappMessages', conversation.id] });
                queryClient.invalidateQueries({ queryKey: ['whatsappConversations', user.id] });
            }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messagesChannel);
        };
    }

  }, [conversation.id, conversation.unread_messages, user?.id, queryClient]);

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center h-full text-gray-500">Carregando mensagens...</div>;
  }

  if (isError) {
    return <div className="flex flex-col items-center justify-center h-full text-red-500">Erro ao carregar mensagens.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b p-4 text-lg font-semibold text-gray-800">
        {conversation.contact_name || conversation.contact_jid}
      </div>
      <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-4 ${message.sent_by === 'medico' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-lg p-3 max-w-[70%]
                ${message.sent_by === 'medico'
                  ? 'bg-blue-500 text-white'
                  : message.sent_by === 'ia'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-800'
                }`}
            >
              <p className="font-semibold text-xs mb-1">
                {message.sent_by === 'medico' ? 'Você' : message.sent_by === 'ia' ? 'IA' : conversation.contact_name || 'Contato'}
              </p>
              <p>{message.message_content}</p>
              <span className="block text-right text-xs mt-1 opacity-75">
                {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput conversationId={conversation.id} contactJid={conversation.contact_jid} />
    </div>
  );
} 