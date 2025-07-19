import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { DocumentoContato, DocumentoUploadData } from '../types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';

// Hook para listar documentos de um contato (lead ou paciente)
export function useDocumentosContato(
  contatoId: string,
  tipoContato: 'lead' | 'paciente'
) {
  return useQuery({
    queryKey: ['documentos', tipoContato, contatoId],
    queryFn: async (): Promise<{ data: DocumentoContato[] }> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const params = new URLSearchParams();
      
      if (tipoContato === 'lead') {
        params.append('lead_id', contatoId);
      } else {
        params.append('paciente_id', contatoId);
      }

      const response = await fetch(`${API_BASE}/v1/crm-documentos?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao carregar documentos');
      }

      return response.json();
    },
    enabled: !!contatoId && !!tipoContato,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para fazer upload de documento
export function useUploadDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contatoId,
      tipoContato,
      documentoData,
    }: {
      contatoId: string;
      tipoContato: 'lead' | 'paciente';
      documentoData: DocumentoUploadData;
    }): Promise<{ documento: DocumentoContato; message: string }> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const formData = new FormData();
      formData.append('file', documentoData.file);
      
      if (tipoContato === 'lead') {
        formData.append('lead_id', contatoId);
      } else {
        formData.append('paciente_id', contatoId);
      }
      
      if (documentoData.descricao_documento) {
        formData.append('descricao_documento', documentoData.descricao_documento);
      }

      const response = await fetch(`${API_BASE}/v1/crm-documentos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          // Não incluir Content-Type para FormData - o navegador define automaticamente
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao fazer upload do documento');
      }

      return response.json();
    },
    onSuccess: (_, { contatoId, tipoContato }) => {
      queryClient.invalidateQueries({ queryKey: ['documentos', tipoContato, contatoId] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar documento: ${error.message}`);
    },
  });
}

// Hook para obter URL de download de documento
export function useDownloadDocumento() {
  return useMutation({
    mutationFn: async (documentoId: string): Promise<{
      download_url: string;
      nome_arquivo: string;
      tipo_arquivo: string;
      tamanho_arquivo: number;
      expires_in: number;
    }> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/crm-documentos/${documentoId}/download`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao gerar URL de download');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Abrir o download automaticamente
      const link = document.createElement('a');
      link.href = data.download_url;
      link.target = '_blank';
      link.download = data.nome_arquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao fazer download: ${error.message}`);
    },
  });
}

// Hook para deletar documento
export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentoId: string): Promise<{ success: boolean; message: string }> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/crm-documentos/${documentoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao deletar documento');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries de documentos para garantir que sejam atualizadas
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success('Documento deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar documento: ${error.message}`);
    },
  });
} 