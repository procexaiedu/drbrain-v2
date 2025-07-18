'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { LoteProduto, PaginatedResponse } from '../types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';

// Hook para listar lotes de produtos
export function useLotes(
  search?: string,
  produto_id?: string,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['lotes', search, produto_id, page, limit],
    queryFn: async (): Promise<PaginatedResponse<LoteProduto>> => {
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
      if (produto_id) {
        params.append('produto_id', produto_id);
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/lotes?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao carregar lotes');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obter um lote específico
export function useLote(loteId: string) {
  return useQuery({
    queryKey: ['lote', loteId],
    queryFn: async (): Promise<LoteProduto> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/lotes/${loteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Lote não encontrado');
      }

      return response.json();
    },
    enabled: !!loteId,
  });
}

// Hook para criar um novo lote
export function useCreateLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loteData: Omit<LoteProduto, 'id' | 'medico_id' | 'created_at' | 'updated_at'>): Promise<LoteProduto> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/lotes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loteData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao criar lote');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
      toast.success('Lote criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar lote: ${error.message}`);
    },
  });
}

// Hook para atualizar um lote
export function useUpdateLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ loteId, loteData }: { loteId: string; loteData: Partial<Omit<LoteProduto, 'id' | 'medico_id' | 'created_at' | 'updated_at'>> }): Promise<LoteProduto> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/lotes/${loteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loteData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao atualizar lote');
      }

      return response.json();
    },
    onSuccess: (_, { loteId }) => {
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
      queryClient.invalidateQueries({ queryKey: ['lote', loteId] });
      toast.success('Lote atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar lote: ${error.message}`);
    },
  });
}

// Hook para deletar um lote
export function useDeleteLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loteId: string): Promise<void> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/lotes/${loteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao deletar lote');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
      toast.success('Lote deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar lote: ${error.message}`);
    },
  });
}
