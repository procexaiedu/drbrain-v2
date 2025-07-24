"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface ConnectionStatus {
  success: boolean;
  status: 'open' | 'connecting' | 'connected' | 'pending' | 'disconnected' | 'not_configured' | 'pairing';
  instanceName?: string;
  qrcode?: string;
}

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrcode: string | null;
  status: ConnectionStatus['status'];
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, qrcode, status }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Conectar ao WhatsApp</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="text-center">
          {qrcode ? (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <Image 
                src={qrcode} 
                alt="QR Code WhatsApp"
                width={256}
                height={256}
                className="mx-auto object-contain"
                priority
              />
            </div>
          ) : (
             <div className="mb-6 h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                <svg className="animate-spin h-8 w-8 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">A gerar QR Code...</p>
             </div>
          )}
          
          <div className="space-y-3 text-sm text-gray-600">
            <p className="font-semibold text-gray-700">Instruções para conectar:</p>
            <ol className="text-left list-decimal list-inside space-y-2 bg-gray-50 p-4 rounded-lg">
              <li>Abra o WhatsApp no seu telemóvel.</li>
              <li>Vá para <span className="font-semibold">Definições &gt; Aparelhos conectados</span>.</li>
              {/* CORREÇÃO: As aspas foram substituídas por &quot; para evitar erro de build */}
              <li>Toque em <span className="font-semibold">&quot;Conectar um aparelho&quot;</span>.</li>
              <li>Aponte a câmara do seu telemóvel para este QR Code.</li>
            </ol>
          </div>
          <div className="mt-4 text-xs text-gray-500">Status: {status}</div>
        </div>
      </div>
    </div>
  );
};

// O resto do componente WhatsappConnectionCard permanece igual
const WhatsappConnectionCard: React.FC = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: connectionStatus, isLoading } = useQuery<ConnectionStatus>({
    queryKey: ['whatsapp-connection-status'],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');
      const response = await fetch('/edge/v1/evolution-manager/connection-status', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    },
    enabled: !!session,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'open' ? false : 5000;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');
      const response = await fetch('/edge/v1/evolution-manager/connect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate connection');
      }
      return response.json() as Promise<ConnectionStatus>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connection-status'] });
      setShowQRModal(true);
    },
    onError: (error) => {
      console.error('Connect error:', error);
    },
  });
  
  useEffect(() => {
    if (connectionStatus?.status === 'open' && showQRModal) {
      setShowQRModal(false);
    }
  }, [connectionStatus, showQRModal]);

  const getStatusText = (status: ConnectionStatus['status'] | undefined) => {
    switch (status) {
      case 'open':
      case 'connected':
        return 'Conectado';
      case 'pairing':
      case 'pending':
      case 'connecting':
        return 'Aguardando Conexão';
      case 'disconnected':
        return 'Desconectado';
      case 'not_configured':
      default:
        return 'Não Configurado';
    }
  };

  const isConnected = connectionStatus?.status === 'open' || connectionStatus?.status === 'connected';

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Ícone, Título, etc. */}
          </div>
          <button 
            onClick={() => connectMutation.mutate()} 
            disabled={isConnected || connectMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {connectMutation.isPending ? 'A conectar...' : (isConnected ? 'Conectado' : 'Conectar WhatsApp')}
          </button>
        </div>
      </div>

      <QRCodeModal 
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrcode={connectionStatus?.qrcode || null}
        status={connectionStatus?.status || 'pairing'}
      />
    </>
  );
};


export default WhatsappConnectionCard; 