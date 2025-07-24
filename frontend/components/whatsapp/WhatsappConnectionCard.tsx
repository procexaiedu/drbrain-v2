"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface ConnectionStatus {
  success: boolean;
  status: 'connected' | 'pending' | 'disconnected' | 'not_configured' | 'open';
  instanceName?: string;
  qrcode?: string;
}

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrcode: string;
  status: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, qrcode, status }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Conectar WhatsApp</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="text-center">
          <div className="mb-4">
            <Image 
              src={`data:image/png;base64,${qrcode}`} 
              alt="QR Code WhatsApp"
              className="mx-auto max-w-full h-64 w-64 object-contain border rounded"
              width={256}
              height={256}
              priority
            />
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p className="font-medium">Instruções para conectar:</p>
            <ol className="text-left space-y-1">
              <li>1. Abra o WhatsApp Business no seu celular</li>
              <li>2. Toque em &quot;Mais opções&quot; (⋮) → &quot;Aparelhos conectados&quot;</li>
              <li>3. Toque em &quot;Conectar um aparelho&quot;</li>
              <li>4. Escaneie este QR Code</li>
            </ol>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <strong>Status:</strong> {status === 'pending' ? 'Aguardando pareamento...' : 'Conectando...'}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Esta tela será atualizada automaticamente quando a conexão for estabelecida.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WhatsappConnectionCard: React.FC = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // Query para verificar status da conexão
  const { data: connectionStatus, isLoading, error } = useQuery<ConnectionStatus>({
    queryKey: ['whatsapp-connection-status'],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('No session');
      
      const response = await fetch('/edge/v1/evolution-manager/connection-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch connection status');
      }
      
      return response.json();
    },
    enabled: !!session?.access_token,
    refetchInterval: 5000, // Polling a cada 5 segundos
    refetchOnWindowFocus: true,
  });

  // Mutation para conectar
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('No session');
      
      const response = await fetch('/edge/v1/evolution-manager/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.qrcode) {
        setQrCode(data.qrcode);
        setShowQRModal(true);
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connection-status'] });
    },
    onError: (error) => {
      console.error('Connect error:', error);
      alert(`Erro ao conectar: ${error.message}`);
    },
  });

  // Mutation para desconectar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('No session');
      
      const response = await fetch('/edge/v1/evolution-manager/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setShowQRModal(false);
      setQrCode('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connection-status'] });
    },
    onError: (error) => {
      console.error('Disconnect error:', error);
      alert(`Erro ao desconectar: ${error.message}`);
    },
  });

  // Fechar modal automaticamente quando conectar
  useEffect(() => {
    if (connectionStatus?.status === 'open') {
      setShowQRModal(false);
      setQrCode('');
    }
  }, [connectionStatus?.status]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'open':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'disconnected':
      case 'not_configured':
      default:
        return 'text-red-600';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'open':
        return 'Conectado';
      case 'pending':
        return 'Pareamento pendente';
      case 'disconnected':
        return 'Desconectado';
      case 'not_configured':
        return 'Não configurado';
      default:
        return 'Status desconhecido';
    }
  };

  const getStatusDescription = (status?: string) => {
    switch (status) {
      case 'open':
        return 'WhatsApp Business conectado e funcionando. Você pode receber mensagens e usar a IA.';
      case 'pending':
        return 'Aguardando pareamento. Escaneie o QR Code com seu WhatsApp Business.';
      case 'disconnected':
        return 'WhatsApp desconectado. Conecte para ativar a Secretaria IA.';
      case 'not_configured':
        return 'WhatsApp não configurado. Configure para começar a usar a Secretaria IA.';
      default:
        return 'Verificando status da conexão...';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-red-600">WhatsApp Business</h2>
            <p className="text-sm text-red-500">
              Erro ao verificar status: {error.message}
            </p>
          </div>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-connection-status'] })}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const isConnected = connectionStatus?.status === 'open';
  const isPending = connectionStatus?.status === 'pending';

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                WhatsApp Business
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isConnected ? 'bg-green-100 text-green-800' : 
                  isPending ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  <span className={`w-2 h-2 mr-1.5 rounded-full ${
                    isConnected ? 'bg-green-400' : 
                    isPending ? 'bg-yellow-400' : 
                    'bg-red-400'
                  }`}></span>
                  {getStatusText(connectionStatus?.status)}
                </span>
              </h2>
              <p className="text-sm text-gray-600 max-w-lg">
                {getStatusDescription(connectionStatus?.status)}
              </p>
              {connectionStatus?.instanceName && (
                <p className="text-xs text-gray-500 mt-1">
                  Instância: {connectionStatus.instanceName}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            {isConnected ? (
              <button 
                onClick={() => disconnectMutation.mutate()} 
                disabled={disconnectMutation.isPending} 
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center space-x-2"
              >
                {disconnectMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Desconectando...</span>
                  </>
                ) : (
                  <span>Desconectar</span>
                )}
              </button>
            ) : (
              <button 
                onClick={() => connectMutation.mutate()} 
                disabled={connectMutation.isPending} 
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
              >
                {connectMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Conectando...</span>
                  </>
                ) : (
                  <span>Conectar WhatsApp</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <QRCodeModal 
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrcode={qrCode}
        status={connectionStatus?.status || 'pending'}
      />
    </>
  );
};

export default WhatsappConnectionCard; 