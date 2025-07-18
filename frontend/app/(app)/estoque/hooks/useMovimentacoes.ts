'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { MovimentacaoEstoque, PaginatedResponse } from '../types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';

// Hook para listar movimentações de estoque
export function useMovimentacoes(
  search?: string,
  tipo?: MovimentacaoEstoque['tipo_movimentacao'],
  produto_id?: string,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['movimentacoes', search, tipo, produto_id, page, limit],
    queryFn: async (): Promise<PaginatedResponse<MovimentacaoEstoque>> => {
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
      if (tipo) {
        params.append('tipo_movimentacao', tipo);
      }
      if (produto_id) {
        params.append('produto_id', produto_id);
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/movimentacoes?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao carregar movimentações');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obter uma movimentação específica
export function useMovimentacao(movimentacaoId: string) {
  return useQuery({
    queryKey: ['movimentacao', movimentacaoId],
    queryFn: async (): Promise<MovimentacaoEstoque> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/movimentacoes/${movimentacaoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Movimentação não encontrada');
      }

      return response.json();
    },
    enabled: !!movimentacaoId,
  });
}

// Hook para criar uma nova movimentação
export function useCreateMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movimentacaoData: Omit<MovimentacaoEstoque, 'id' | 'medico_id' | 'created_at' | 'updated_at'>): Promise<MovimentacaoEstoque> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/movimentacoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movimentacaoData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao criar movimentação');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] }); // Invalida produtos para atualizar estoque
      toast.success('Movimentação criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar movimentação: ${error.message}`);
    },
  });
}

// Hook para atualizar uma movimentação
export function useUpdateMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ movimentacaoId, movimentacaoData }: { movimentacaoId: string; movimentacaoData: Partial<Omit<MovimentacaoEstoque, 'id' | 'medico_id' | 'created_at' | 'updated_at'>> }): Promise<MovimentacaoEstoque> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/movimentacoes/${movimentacaoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movimentacaoData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao atualizar movimentação');
      }

      return response.json();
    },
    onSuccess: (_, { movimentacaoId }) => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacao', movimentacaoId] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] }); // Invalida produtos para atualizar estoque
      toast.success('Movimentação atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar movimentação: ${error.message}`);
    },
  });
}

// Hook para deletar uma movimentação
export function useDeleteMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movimentacaoId: string): Promise<void> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-movimentacoes-lotes-management/movimentacoes/${movimentacaoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao deletar movimentação');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] }); // Invalida produtos para atualizar estoque
      toast.success('Movimentação deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar movimentação: ${error.message}`);
    },
  });
}
