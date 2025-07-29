'use client';

import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import WhatsappConnectionCard from '@/components/ui/WhatsappConnectionCard';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import { Conversation } from './types';
import { useAuth } from '@/context/AuthContext'; // Usando o hook useAuth
import { useEffect } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export default function WhatsappPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { user } = useAuth(); // Usando o hook useAuth
  const queryClient = useQueryClient();

  const { data: connectionStatus } = useQuery({
    queryKey: ['whatsappConnectionStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) return { status: 'disconnected', message: 'User not logged in' };
      const res = await fetch(`/api/evolution-manager/connection-status`);
      if (!res.ok) throw new Error('Failed to fetch connection status');
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    if (!user?.id) return;

    let channel: RealtimeChannel | null = null;

    if (connectionStatus?.status !== 'connected') {
      channel = supabase
        .channel(`whatsapp_updates:${user.id}`)
        .on<RealtimePostgresChangesPayload<{
          EventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
          New: any,
          Old: any,
          Errors: string[] | null,
          schema: 'public',
          table: 'medico_oauth_tokens'
        }>>(
          'postgres_changes', 
          { 
            event: '*',
            schema: 'public',
            table: 'medico_oauth_tokens',
            filter: `medico_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Realtime medico_oauth_tokens change received!', payload);
            queryClient.invalidateQueries({ queryKey: ['whatsappConnectionStatus', user.id] });
            queryClient.invalidateQueries({ queryKey: ['whatsappConversations', user.id] });
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to whatsapp_updates:${user.id}`);
          }
        });
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, connectionStatus?.status, queryClient]);

  useEffect(() => {
    if (!user?.id) return;

    const channels: RealtimeChannel[] = [];

    const conversationsChannel = supabase
      .channel(`whatsapp_conversations_medico:${user.id}`)
      .on<RealtimePostgresChangesPayload<{
        EventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
        New: Conversation,
        Old: Conversation,
        Errors: string[] | null,
        schema: 'public',
        table: 'whatsapp_conversations'
      }>>(
        'postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: `medico_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime whatsapp_conversations change received!', payload);
          queryClient.invalidateQueries({ queryKey: ['whatsappConversations', user.id] });
          if (payload.eventType === 'INSERT' && 'id' in payload.new) { 
            const newConversationId = payload.new.id as string; // Acessando diretamente e cast simples para string
            const messagesChannel = supabase
              .channel(`whatsapp_messages_conv:${newConversationId}`)
              .on<RealtimePostgresChangesPayload<{
                EventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
                New: any,
                Old: any,
                Errors: string[] | null,
                schema: 'public',
                table: 'whatsapp_messages'
              }>>(
                'postgres_changes', 
                {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'whatsapp_messages',
                  filter: `conversation_id=eq.${newConversationId}`,
                },
                (msgPayload) => {
                  console.log('Realtime whatsapp_messages INSERT received!', msgPayload);
                  queryClient.invalidateQueries({ queryKey: ['whatsappMessages', newConversationId] });
                  queryClient.invalidateQueries({ queryKey: ['whatsappConversations', user.id] });
                }
              )
              .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                  console.log(`Subscribed to whatsapp_messages_conv:${newConversationId}`);
                }
              });
            channels.push(messagesChannel);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to whatsapp_conversations_medico:${user.id}`);
        }
      });
    channels.push(conversationsChannel);

    if (selectedConversation?.id) {
      const messagesChannel = supabase
        .channel(`whatsapp_messages_conv:${selectedConversation.id}`)
        .on<RealtimePostgresChangesPayload<{
          EventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
          New: any,
          Old: any,
          Errors: string[] | null,
          schema: 'public',
          table: 'whatsapp_messages'
        }>>(
          'postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whatsapp_messages',
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload) => {
            console.log('Realtime whatsapp_messages INSERT received for selected conv!', payload);
            queryClient.invalidateQueries({ queryKey: ['whatsappMessages', selectedConversation.id] });
            queryClient.invalidateQueries({ queryKey: ['whatsappConversations', user.id] });
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to whatsapp_messages_conv:${selectedConversation.id}`);
          }
        });
      channels.push(messagesChannel);
    }

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.id, selectedConversation?.id, queryClient]);

  if (connectionStatus?.status !== 'connected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <WhatsappConnectionCard currentStatus={connectionStatus?.status || 'disconnected'} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <div className="w-1/3 border-r bg-white p-4 overflow-y-auto">
        <ChatList onSelectConversation={setSelectedConversation} selectedConversationId={selectedConversation?.id ?? null} /> {/* Corrigido: ?? null */}
      </div>
      <div className="w-2/3 flex flex-col">
        {selectedConversation ? (
          <ChatWindow conversation={selectedConversation} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Selecione uma conversa para começar.
          </div>
        )}
      </div>
    </div>
  );
} 