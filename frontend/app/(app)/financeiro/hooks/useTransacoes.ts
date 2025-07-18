import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TransacaoFinanceira, PaginatedResponse } from '../types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';

// Hook para listar transações financeiras
export function useTransacoes(
  search?: string,
  tipo?: TransacaoFinanceira['tipo_transacao'],
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['transacoes', search, tipo, page, limit],
    queryFn: async (): Promise<PaginatedResponse<TransacaoFinanceira>> => {
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
        params.append('tipo_transacao', tipo);
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/transacoes?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao carregar transações');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obter uma transação específica
export function useTransacao(transacaoId: string) {
  return useQuery({
    queryKey: ['transacao', transacaoId],
    queryFn: async (): Promise<TransacaoFinanceira> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/transacoes/${transacaoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Transação não encontrada');
      }

      return response.json();
    },
    enabled: !!transacaoId,
  });
}

// Hook para criar uma nova transação
export function useCreateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transacaoData: Omit<TransacaoFinanceira, 'id' | 'medico_id' | 'created_at' | 'updated_at'>): Promise<TransacaoFinanceira> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/transacoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transacaoData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao criar transação');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast.success('Transação criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar transação: ${error.message}`);
    },
  });
}

// Hook para atualizar uma transação
export function useUpdateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transacaoId, transacaoData }: { transacaoId: string; transacaoData: Partial<Omit<TransacaoFinanceira, 'id' | 'medico_id' | 'created_at' | 'updated_at'>> }): Promise<TransacaoFinanceira> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/transacoes/${transacaoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transacaoData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao atualizar transação');
      }

      return response.json();
    },
    onSuccess: (_, { transacaoId }) => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['transacao', transacaoId] });
      toast.success('Transação atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar transação: ${error.message}`);
    },
  });
}

// Hook para deletar uma transação
export function useDeleteTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transacaoId: string): Promise<void> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/financeiro-management/transacoes/${transacaoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao deletar transação');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast.success('Transação deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar transação: ${error.message}`);
    },
  });
}
