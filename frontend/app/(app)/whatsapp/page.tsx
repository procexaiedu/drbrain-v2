"use client";

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import ChatList from '@/components/whatsapp/ChatList';
import ChatWindow from '@/components/whatsapp/ChatWindow';
import { WhatsAppConversation } from '@/components/whatsapp/types';

const WhatsAppPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('whatsapp-messages-channel')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'whatsapp_messages',
          filter: `medico_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          
          // Invalidate conversations to update unread counts and last message
          queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
          
          // If the message is for the active conversation, invalidate messages
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', selectedConversation.id] });
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'whatsapp_conversations',
          filter: `medico_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New conversation created:', payload);
          // Invalidate conversations to show new conversation
          queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, queryClient, user?.id]);

  const handleSelectConversation = (conversation: WhatsAppConversation) => {
    setSelectedConversation(conversation);
    setIsMobileMenuOpen(false); // Close mobile menu when conversation is selected
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setIsMobileMenuOpen(true);
  };

  return (
    <div className="h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">WhatsApp Business</h1>
              <p className="text-sm text-gray-500">Secretaria IA</p>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-64px)] flex">
        {/* Chat List - Left Column */}
        <div className={`
          w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 bg-white
          ${selectedConversation ? 'hidden md:block' : 'block'}
          ${isMobileMenuOpen ? 'block' : 'hidden md:block'}
        `}>
          <ChatList
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Chat Window - Right Column */}
        <div className={`
          flex-1 bg-gray-50
          ${selectedConversation ? 'block' : 'hidden md:block'}
        `}>
          {selectedConversation ? (
            <div className="h-full flex flex-col">
              {/* Mobile back button */}
              <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
                <button
                  onClick={handleBackToList}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar
                </button>
              </div>

              <div className="flex-1">
                <ChatWindow conversation={selectedConversation} />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md mx-auto p-8">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Bem-vindo ao WhatsApp Business
                </h2>
                <p className="text-gray-600 mb-6">
                  Sua Secretaria IA está pronta para atender seus pacientes. Selecione uma conversa à esquerda para começar.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium mb-1">Como funciona:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Pacientes enviam mensagens via WhatsApp</li>
                        <li>• A IA responde automaticamente</li>
                        <li>• Você pode intervir e responder manualmente</li>
                        <li>• Todas as conversas ficam salvas aqui</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
          <span>WhatsApp conectado</span>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPage; 