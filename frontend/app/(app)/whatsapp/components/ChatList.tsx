'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Conversation } from '../types';

interface ChatListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId: string | null;
}

export default function ChatList({ onSelectConversation, selectedConversationId }: ChatListProps) {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery<Conversation[]>(
    {
      queryKey: ['whatsappConversations', user?.id],
      queryFn: async () => {
        if (!user?.id) return [];
        const res = await fetch('/api/whatsapp-chat/conversations');
        if (!res.ok) throw new Error('Failed to fetch conversations');
        return res.json();
      },
      enabled: !!user?.id, 
      staleTime: 10 * 1000 
    }
  );

  // Garante que 'conversations' é sempre um array para métodos de array
  const conversations: Conversation[] = data || [];

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Carregando conversas...</div>;
  }

  if (isError) {
    return <div className="text-center py-4 text-red-500">Erro ao carregar conversas.</div>;
  }

  if (conversations.length === 0) { // Agora 'conversations' é sempre um array
    return <div className="text-center py-4 text-gray-500">Nenhuma conversa encontrada.</div>;
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Conversas</h3>
      <ul>
        {conversations
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()) // 'conversations' agora é Message[]
          .map((conv) => (
            <li
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 rounded-md mb-2 ${selectedConversationId === conv.id ? 'bg-blue-100' : ''}`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                {conv.contact_name ? conv.contact_name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="ml-3 flex-grow">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-800">{conv.contact_name || conv.contact_jid}</p>
                  {conv.last_message_at && (
                    <span className="text-xs text-gray-500">
                      {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600 truncate">Última mensagem...</p>
                  {conv.unread_messages > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                      {conv.unread_messages}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
} 