'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

export default function WhatsAppConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true); // Novo estado
  const [isConnecting, setIsConnecting] = useState(false); // Novo estado
  const [isGettingQrCode, setIsGettingQrCode] = useState(false); // Novo estado
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = async () => {
      setIsCheckingStatus(true); // Inicia verificação de status
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-manager/status');
        if (error) {
            console.error('Erro ao verificar status do WhatsApp:', error);
            setIsConnected(false);
        } else {
            setIsConnected(data.status === 'connected');
            if (data.status === 'connected') {
                setQrCode(null); // Limpa QR code se já estiver conectado
            }
        }
      } catch (error: any) {
        console.warn('Função whatsapp-manager/status não encontrada ou erro, assumindo desconectado.', error);
        setIsConnected(false);
      } finally {
        setIsCheckingStatus(false); // Finaliza verificação de status
      }
    };
    checkStatus();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true); // Inicia conexão
    setQrCode(null); // Limpa QR code anterior ao tentar conectar
    toast({ id: `connecting-${Date.now()}`, title: "Iniciando conexão...", description: "Por favor, aguarde." });
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager/connect');
      if (error) throw error;

      if (data.status === 'qrcode_requested') {
        toast({ id: `qrcode-requested-${Date.now()}`, title: "QR Code solicitado!", description: "Aguardando geração do QR Code..." });
        await handleGetQrCode(); // Chama a função para obter o QR Code
      } else {
        toast({ id: `connect-success-${Date.now()}`, title: "Conectado!", description: "Sua conta WhatsApp foi conectada com sucesso." });
        setIsConnected(true);
      }

    } catch (error: any) {
      toast({
        id: `error-connect-${Date.now()}`,
        title: 'Erro ao Conectar',
        description: error.message || 'Verifique o console para mais detalhes.',
        variant: 'destructive',
      });
      setIsConnected(false);
    } finally {
      setIsConnecting(false); // Finaliza conexão
    }
  };

  const handleGetQrCode = async () => {
    setIsGettingQrCode(true); // Inicia obtenção do QR Code
    toast({ id: `getting-qrcode-${Date.now()}`, title: "Obtendo QR Code...", description: "Isso pode levar alguns segundos." });
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager/qrcode');
      if (error) throw error;
      
      if (data.qrcode) {
        setQrCode(data.qrcode);
        toast({ id: `qrcode-success-${Date.now()}`, title: "QR Code Gerado!", description: "Escaneie o QR Code com seu celular." });
      } else {
        toast({ id: `no-qrcode-${Date.now()}`, title: "QR Code não disponível", description: "Tente novamente em alguns instantes." });
      }
    } catch (error: any) {
      toast({
        id: `error-qrcode-${Date.now()}`,
        title: 'Erro ao Obter QR Code',
        description: error.message || 'Verifique o console para mais detalhes.',
        variant: 'destructive',
      });
      setQrCode(null);
    } finally {
      setIsGettingQrCode(false); // Finaliza obtenção do QR Code
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true); // Reutilizando isConnecting para o estado de desconexão
    setQrCode(null); // Limpa QR code ao desconectar
    toast({ id: `disconnecting-${Date.now()}`, title: "Desconectando...", description: "Por favor, aguarde." });
    try {
      const { error } = await supabase.functions.invoke('whatsapp-manager/disconnect'); // Assumindo que existe uma função disconnect
      if (error) throw error;
      setIsConnected(false);
      toast({ id: `disconnect-success-${Date.now()}`, title: "Desconectado!", description: "Sua conta WhatsApp foi desconectada." });
    } catch (error: any) {
      toast({
        id: `error-disconnect-${Date.now()}`,
        title: 'Erro ao Desconectar',
        description: error.message || 'Verifique o console para mais detalhes.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp</CardTitle>
        <CardDescription>
          {isConnected ? 'Você está conectado ao WhatsApp.' : 'Conecte sua conta do WhatsApp para ativar a Secretária IA.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCheckingStatus ? (
          <p>Verificando status...</p>
        ) : (
          <>
            {isConnected ? (
              <Button onClick={handleDisconnect} disabled={isConnecting} variant="destructive">
                {isConnecting ? 'Desconectando...' : 'Desconectar'}
              </Button>
            ) : (
              <>
                {qrCode ? (
                  <div>
                    <p>Escaneie o QR Code com seu celular:</p>
                    <img src={qrCode} alt="QR Code do WhatsApp" className="mx-auto my-4 border rounded-lg p-2" />
                    <Button onClick={handleGetQrCode} disabled={isGettingQrCode}>
                        {isGettingQrCode ? 'Atualizando QR Code...' : 'Gerar Novo QR Code'}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleConnect} disabled={isConnecting || isGettingQrCode}>
                    {isConnecting ? 'Conectando...' : 'Conectar'}
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
