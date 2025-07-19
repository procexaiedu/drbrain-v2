'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AppShell from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: { conversation: string };
  created_at: string;
  is_from_me: boolean;
  sender_jid: string;
}

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const [activeConversationJid, setActiveConversationJid] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data: instanceData, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .single();

      if (instanceError || !instanceData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('instance_id', instanceData.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data as Message[]);
        const lastReceivedMessage = [...data].reverse().find(m => !m.is_from_me);
        if (lastReceivedMessage) {
            setActiveConversationJid(lastReceivedMessage.sender_jid);
        }
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel('whatsapp-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationJid) return;

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-manager/send-message', {
        body: {
          recipient_jid: activeConversationJid,
          message_body: newMessage,
        },
      });

      if (error) throw error;

      setNewMessage('');
      toast({ id: `message-sent-${Date.now()}`, title: "Mensagem enviada!" });

    } catch (error: any) {
      toast({
        id: `error-send-message-${Date.now()}`,
        title: 'Erro ao Enviar Mensagem',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AppShell>
      <div className="flex h-full bg-gray-100">
        {/* Sidebar com a lista de conversas */}
        <div className="w-1/3 bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Conversas</h2>
          </div>
          <div className="p-4 hover:bg-gray-100 cursor-pointer">
             <p className="font-semibold">{activeConversationJid ? activeConversationJid.split('@')[0] : 'Nenhuma conversa'}</p>
             <p className="text-sm text-gray-500 truncate">Última mensagem...</p>
           </div>
        </div>

        {/* Área do chat */}
        <div className="w-2/3 flex flex-col">
          {/* Header do chat */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="font-semibold">{activeConversationJid ? activeConversationJid.split('@')[0] : 'Selecione uma conversa'}</h3>
          </div>

          {/* Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {loading ? (
              <p className="text-center text-gray-500">Carregando mensagens...</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.is_from_me ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-lg p-3 rounded-2xl ${msg.is_from_me ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    <p className="text-sm">{msg.content?.conversation || '[Mensagem sem texto]'}</p>
                  </div>
                </div>
              ))
            )}
             {messages.length === 0 && !loading && (
                <p className="text-center text-gray-500">Nenhuma mensagem nesta conversa ainda.</p>
             )}
          </div>

          {/* Input de mensagem */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={activeConversationJid ? "Digite uma mensagem..." : "Selecione uma conversa para responder"}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!activeConversationJid || isSending}
              />
              <Button type="submit" disabled={!activeConversationJid || isSending}>
                {isSending ? 'Enviando...' : 'Enviar'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
