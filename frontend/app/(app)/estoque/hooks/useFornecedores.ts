import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Fornecedor, PaginatedResponse } from '../types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';

// Hook para listar fornecedores
export function useFornecedores(
  search?: string,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['fornecedores', search, page, limit],
    queryFn: async (): Promise<PaginatedResponse<Fornecedor>> => {
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

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/fornecedores?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao carregar fornecedores');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obter um fornecedor específico
export function useFornecedor(fornecedorId: string) {
  return useQuery({
    queryKey: ['fornecedor', fornecedorId],
    queryFn: async (): Promise<Fornecedor> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/fornecedores/${fornecedorId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Fornecedor não encontrado');
      }

      return response.json();
    },
    enabled: !!fornecedorId,
  });
}

// Hook para criar um novo fornecedor
export function useCreateFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fornecedorData: Omit<Fornecedor, 'id' | 'medico_id' | 'created_at' | 'updated_at'>): Promise<Fornecedor> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/fornecedores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fornecedorData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao criar fornecedor');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar fornecedor: ${error.message}`);
    },
  });
}

// Hook para atualizar um fornecedor
export function useUpdateFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fornecedorId, fornecedorData }: { fornecedorId: string; fornecedorData: Partial<Omit<Fornecedor, 'id' | 'medico_id' | 'created_at' | 'updated_at'>> }): Promise<Fornecedor> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/fornecedores/${fornecedorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fornecedorData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao atualizar fornecedor');
      }

      return response.json();
    },
    onSuccess: (_, { fornecedorId }) => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedor', fornecedorId] });
      toast.success('Fornecedor atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar fornecedor: ${error.message}`);
    },
  });
}

// Hook para deletar um fornecedor
export function useDeleteFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fornecedorId: string): Promise<void> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/fornecedores/${fornecedorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao deletar fornecedor');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar fornecedor: ${error.message}`);
    }
  });
}
