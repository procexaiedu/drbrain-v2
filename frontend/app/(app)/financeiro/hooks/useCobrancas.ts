import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Cobranca, PaginatedResponse } from '../types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';

// Hook para listar cobranças
export function useCobrancas(
  search?: string,
  status?: Cobranca['status_cobranca'],
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['cobrancas', search, status, page, limit],
    queryFn: async (): Promise<PaginatedResponse<Cobranca>> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search?.trim()) {
        params.append('search', search.trim());
      }

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/cobrancas?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao carregar cobranças');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obter uma cobrança específica
export function useCobranca(cobrancaId: string) {
  return useQuery({
    queryKey: ['cobranca', cobrancaId],
    queryFn: async (): Promise<Cobranca> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/cobrancas/${cobrancaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Cobrança não encontrada');
      }

      return response.json();
    },
    enabled: !!cobrancaId,
  });
}

// Hook para criar uma nova cobrança
export function useCreateCobranca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cobrancaData: Omit<Cobranca, 'id' | 'medico_id' | 'created_at' | 'updated_at' | 'asaas_charge_id' | 'asaas_invoice_id' | 'link_pagamento' | 'qr_code_pix_base64' | 'data_pagamento' | 'status_cobranca'>): Promise<Cobranca> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/cobrancas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cobrancaData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao criar cobrança');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cobrança: ${error.message}`);
    },
  });
}

// Hook para atualizar uma cobrança
export function useUpdateCobranca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cobrancaId, cobrancaData }: { cobrancaId: string; cobrancaData: Partial<Omit<Cobranca, 'id' | 'medico_id' | 'created_at' | 'updated_at' | 'asaas_charge_id' | 'asaas_invoice_id' | 'link_pagamento' | 'qr_code_pix_base64' | 'data_pagamento' | 'status_cobranca'>> }): Promise<Cobranca> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/cobrancas/${cobrancaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cobrancaData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao atualizar cobrança');
      }

      return response.json();
    },
    onSuccess: (_, { cobrancaId }) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['cobranca', cobrancaId] });
      toast.success('Cobrança atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar cobrança: ${error.message}`);
    },
  });
}

// Hook para deletar uma cobrança
export function useDeleteCobranca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cobrancaId: string): Promise<void> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/cobrancas/${cobrancaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao deletar cobrança');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar cobrança: ${error.message}`);
    },
  });
}

// Hook para gerar link/QR Code Asaas
export function useGerarLinkCobrancaAsaas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cobrancaId: string): Promise<{ link_pagamento: string; qr_code_pix_base64: string; message: string }> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/cobrancas/${cobrancaId}/gerar-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao gerar link/QR Code Asaas');
      }

      return response.json();
    },
    onSuccess: (_, cobrancaId) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['cobranca', cobrancaId] });
      toast.success('Link/QR Code Asaas gerado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar link/QR Code Asaas: ${error.message}`);
    },
  });
}
