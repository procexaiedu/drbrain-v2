import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { AssinaturaRecorrente, PaginatedResponse } from '../types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';

// Hook para listar assinaturas recorrentes
export function useAssinaturas(
  search?: string,
  status?: AssinaturaRecorrente['status_assinatura'],
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['assinaturas', search, status, page, limit],
    queryFn: async (): Promise<PaginatedResponse<AssinaturaRecorrente>> => {
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
        params.append('status_assinatura', status);
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/assinaturas?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao carregar assinaturas');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obter uma assinatura específica
export function useAssinatura(assinaturaId: string) {
  return useQuery({
    queryKey: ['assinatura', assinaturaId],
    queryFn: async (): Promise<AssinaturaRecorrente> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/assinaturas/${assinaturaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Assinatura não encontrada');
      }

      return response.json();
    },
    enabled: !!assinaturaId,
  });
}

// Hook para criar uma nova assinatura
export function useCreateAssinatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assinaturaData: Omit<AssinaturaRecorrente, 'id' | 'medico_id' | 'created_at' | 'updated_at' | 'asaas_subscription_id' | 'data_proxima_cobranca'>): Promise<AssinaturaRecorrente> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/assinaturas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assinaturaData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao criar assinatura');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assinaturas'] });
      toast.success('Assinatura criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar assinatura: ${error.message}`);
    },
  });
}

// Hook para atualizar uma assinatura
export function useUpdateAssinatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assinaturaId, assinaturaData }: { assinaturaId: string; assinaturaData: Partial<Omit<AssinaturaRecorrente, 'id' | 'medico_id' | 'created_at' | 'updated_at' | 'asaas_subscription_id' | 'data_proxima_cobranca'>> }): Promise<AssinaturaRecorrente> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/assinaturas/${assinaturaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assinaturaData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao atualizar assinatura');
      }

      return response.json();
    },
    onSuccess: (_, { assinaturaId }) => {
      queryClient.invalidateQueries({ queryKey: ['assinaturas'] });
      queryClient.invalidateQueries({ queryKey: ['assinatura', assinaturaId] });
      toast.success('Assinatura atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar assinatura: ${error.message}`);
    },
  });
}

// Hook para deletar uma assinatura
export function useDeleteAssinatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assinaturaId: string): Promise<void> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/assinaturas/${assinaturaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao deletar assinatura');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assinaturas'] });
      toast.success('Assinatura deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar assinatura: ${error.message}`);
    },
  });
}
