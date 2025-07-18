import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Servico, PaginatedResponse } from '../types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';

// Hook para listar serviços
export function useServicos(
  search?: string,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['servicos', search, page, limit],
    queryFn: async (): Promise<PaginatedResponse<Servico>> => {
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

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/servicos?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao carregar serviços');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obter um serviço específico
export function useServico(servicoId: string) {
  return useQuery({
    queryKey: ['servico', servicoId],
    queryFn: async (): Promise<Servico> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/servicos/${servicoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Serviço não encontrado');
      }

      return response.json();
    },
    enabled: !!servicoId,
  });
}

// Hook para criar um novo serviço
export function useCreateServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (servicoData: Omit<Servico, 'id' | 'medico_id' | 'created_at' | 'updated_at'>): Promise<Servico> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/servicos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicoData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao criar serviço');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast.success('Serviço criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar serviço: ${error.message}`);
    },
  });
}

// Hook para atualizar um serviço
export function useUpdateServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ servicoId, servicoData }: { servicoId: string; servicoData: Partial<Omit<Servico, 'id' | 'medico_id' | 'created_at' | 'updated_at'>> }): Promise<Servico> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/servicos/${servicoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicoData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao atualizar serviço');
      }

      return response.json();
    },
    onSuccess: (_, { servicoId }) => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      queryClient.invalidateQueries({ queryKey: ['servico', servicoId] });
      toast.success('Serviço atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar serviço: ${error.message}`);
    },
  });
}

// Hook para deletar um serviço
export function useDeleteServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (servicoId: string): Promise<void> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/estoque-produtos-management/servicos/${servicoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao deletar serviço');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast.success('Serviço deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar serviço: ${error.message}`);
    },
  });
}
