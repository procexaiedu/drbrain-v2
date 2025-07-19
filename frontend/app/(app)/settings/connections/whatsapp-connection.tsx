'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

export default function WhatsAppConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-manager/status');
        if (error) throw error;
        setIsConnected(data.status === 'connected');
      } catch (error: any) {
        // It's okay if it fails, means no instance yet
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-manager/connect');
      if (error) throw error;
      handleGetQrCode();
    } catch (error: any) {
      toast({
        title: 'Erro ao Conectar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetQrCode = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager/qrcode');
      if (error) throw error;
      setQrCode(data.qrcode);
    } catch (error: any) {
      toast({
        title: 'Erro ao Obter QR Code',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
        {isLoading ? (
          <p>Verificando status...</p>
        ) : (
          <>
            {isConnected ? (
              <Button variant="destructive">Desconectar</Button>
            ) : (
              <>
                {qrCode ? (
                  <div>
                    <p>Escaneie o QR Code com seu celular:</p>
                    <img src={qrCode} alt="QR Code do WhatsApp" />
                  </div>
                ) : (
                  <Button onClick={handleConnect}>Conectar</Button>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
