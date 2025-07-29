'use client';

import { useState, useContext, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppContext } from '@/context/AppContext';
import { createClient } from '@/lib/supabaseClient';

interface WhatsappConnectionCardProps {
  currentStatus: string;
}

export default function WhatsappConnectionCard({ currentStatus }: WhatsappConnectionCardProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const { user } = useContext(AppContext);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not logged in');
      const res = await fetch('/api/evolution-manager/connect', { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to initiate connection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsappConnectionStatus', user?.id]);
      // QR code will be pushed via Supabase Realtime, so no direct QR data here.
      // We just open the modal.
      setShowQrModal(true);
    },
    onError: (error: any) => {
      alert(`Connection error: ${error.message}`);
      setShowQrModal(false);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not logged in');
      const res = await fetch('/api/evolution-manager/disconnect', { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to disconnect');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsappConnectionStatus', user?.id]);
      setQrCodeImage(null);
      setShowQrModal(false);
      alert('Disconnected successfully!');
    },
    onError: (error: any) => {
      alert(`Disconnection error: ${error.message}`);
    },
  });

  // Realtime subscription for QR code
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`whatsapp_qr_updates:${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'medico_oauth_tokens',
        filter: `medico_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('Realtime QR code/status update received:', payload);
        if (payload.new.connection_status === 'qrcode' && payload.new.access_token) { // Assuming access_token temporarily holds base64 QR
          setQrCodeImage(`data:image/png;base64,${payload.new.access_token}`);
          setShowQrModal(true);
        } else if (payload.new.connection_status === 'connected') {
          setQrCodeImage(null);
          setShowQrModal(false);
          queryClient.invalidateQueries(['whatsappConnectionStatus', user.id]);
          queryClient.invalidateQueries(['whatsappConversations', user.id]); // Refresh conversations on connect
        } else if (payload.new.connection_status === 'disconnected') {
          setQrCodeImage(null);
          setShowQrModal(false);
          queryClient.invalidateQueries(['whatsappConnectionStatus', user.id]);
          queryClient.invalidateQueries(['whatsappConversations', user.id]); // Clear conversations on disconnect
        }
      }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to whatsapp_qr_updates:${user.id}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, supabase]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4">Conectar WhatsApp</h2>
      <p className="text-gray-600 mb-6 text-center">
        Conecte sua conta do WhatsApp para ativar a Secretaria de IA e gerenciar suas conversas.
      </p>

      <div className="mb-4">
        <p className="text-lg font-medium">Status Atual: 
          <span className={`ml-2 font-semibold ${currentStatus === 'connected' ? 'text-green-600' : currentStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'}`}>
            {currentStatus === 'connected' ? 'Conectado' : currentStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
          </span>
        </p>
      </div>

      {currentStatus === 'disconnected' || currentStatus === 'error' || currentStatus === 'connecting' ? (
        <button
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isLoading || currentStatus === 'connecting'}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connectMutation.isLoading || currentStatus === 'connecting' ? 'Iniciando Conexão...' : 'Conectar WhatsApp'}
        </button>
      ) : (
        <button
          onClick={() => disconnectMutation.mutate()}
          disabled={disconnectMutation.isLoading}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disconnectMutation.isLoading ? 'Desconectando...' : 'Desconectar WhatsApp'}
        </button>
      )}

      {showQrModal && qrCodeImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h3 className="text-xl font-bold mb-4">Escaneie o QR Code</h3>
            <p className="text-gray-700 mb-4">Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código abaixo:</p>
            <img src={qrCodeImage} alt="QR Code" className="mx-auto mb-4 w-64 h-64" />
            <p className="text-sm text-gray-500">Aguardando conexão...</p>
            <button
              onClick={() => setShowQrModal(false)}
              className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {connectMutation.isError && (
        <p className="text-red-500 mt-4">Erro: {connectMutation.error?.message}</p>
      )}
      {disconnectMutation.isError && (
        <p className="text-red-500 mt-4">Erro: {disconnectMutation.error?.message}</p>
      )}
    </div>
  );
} 