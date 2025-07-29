'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

interface WhatsappConnectionCardProps {
  currentStatus: string;
}

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

export default function WhatsappConnectionCard({ currentStatus }: WhatsappConnectionCardProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!SUPABASE_FUNCTIONS_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL is not defined");
    return <div className="text-red-500">Erro: URL das funções Supabase não configurada.</div>;
  }

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not logged in');
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/evolution-manager/connect`, { method: 'POST' }); // URL corrigida
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to initiate connection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappConnectionStatus', user?.id] });
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
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/evolution-manager/disconnect`, { method: 'DELETE' }); // URL corrigida
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to disconnect');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappConnectionStatus', user?.id] });
      setQrCodeImage(null);
      setShowQrModal(false);
      alert('Disconnected successfully!');
    },
    onError: (error: any) => {
      alert(`Disconnection error: ${error.message}`);
    },
  });

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
      (payload: { new: any, eventType: string }) => {
        console.log('Realtime QR code/status update received:', payload);
        if (payload.new.connection_status === 'qrcode' && payload.new.access_token) { 
          setQrCodeImage(`data:image/png;base64,${payload.new.access_token}`);
          setShowQrModal(true);
        } else if (payload.new.connection_status === 'connected') {
          setQrCodeImage(null);
          setShowQrModal(false);
          queryClient.invalidateQueries({ queryKey: ['whatsappConnectionStatus', user.id] });
          queryClient.invalidateQueries({ queryKey: ['whatsappConversations', user.id] }); 
        } else if (payload.new.connection_status === 'disconnected') {
          setQrCodeImage(null);
          setShowQrModal(false);
          queryClient.invalidateQueries({ queryKey: ['whatsappConnectionStatus', user.id] });
          queryClient.invalidateQueries({ queryKey: ['whatsappConversations', user.id] });
        }
      }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to whatsapp_qr_updates:${user.id}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

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
          disabled={connectMutation.isPending || currentStatus === 'connecting'}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connectMutation.isPending || currentStatus === 'connecting' ? 'Iniciando Conexão...' : 'Conectar WhatsApp'}
        </button>
      ) : (
        <button
          onClick={() => disconnectMutation.mutate()}
          disabled={disconnectMutation.isPending}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disconnectMutation.isPending ? 'Desconectando...' : 'Desconectar WhatsApp'}
        </button>
      )}

      {showQrModal && qrCodeImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h3 className="text-xl font-bold mb-4">Escaneie o QR Code</h3>
            <p className="text-gray-700 mb-4">Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código abaixo:</p>
            <Image
              src={qrCodeImage}
              alt="QR Code"
              width={256} // Tamanho fixo para QR Code (w-64 = 256px)
              height={256} // Tamanho fixo para QR Code (h-64 = 256px)
              className="mx-auto mb-4"
              unoptimized={true} // QRCodes geralmente não se beneficiam de otimização e podem ser quebrados.
            />
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