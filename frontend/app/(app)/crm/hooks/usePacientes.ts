import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Paciente, PacienteFormData, PacienteStatus, PaginatedResponse } from '../types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';

// Hook para listar pacientes
export function usePacientes(
  search?: string,
  status?: PacienteStatus,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['pacientes', search, status, page, limit],
    queryFn: async (): Promise<PaginatedResponse<Paciente>> => {
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

      const response = await fetch(`${API_BASE}/v1/crm-pacientes-management?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao carregar pacientes');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obter um paciente específico
export function usePaciente(pacienteId: string) {
  return useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: async (): Promise<Paciente> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/crm-pacientes-management/${pacienteId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Paciente não encontrado');
      }

      return response.json();
    },
    enabled: !!pacienteId,
  });
}

// Hook para criar um novo paciente
export function useCreatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pacienteData: PacienteFormData): Promise<Paciente> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/crm-pacientes-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pacienteData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao criar paciente');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar paciente: ${error.message}`);
    },
  });
}

// Hook para atualizar um paciente
export function useUpdatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      pacienteId, 
      pacienteData 
    }: { 
      pacienteId: string; 
      pacienteData: Partial<PacienteFormData> 
    }): Promise<Paciente> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/crm-pacientes-management/${pacienteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pacienteData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao atualizar paciente');
      }

      return response.json();
    },
    onSuccess: (_, { pacienteId }) => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['paciente', pacienteId] });
      toast.success('Paciente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar paciente: ${error.message}`);
    },
  });
}

// Hook para atualizar status do paciente
export function useUpdatePacienteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      pacienteId, 
      status 
    }: { 
      pacienteId: string; 
      status: PacienteStatus; 
    }): Promise<Paciente> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/crm-pacientes-management/${pacienteId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status_paciente: status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao atualizar status do paciente');
      }

      return response.json();
    },
    onSuccess: (_, { pacienteId }) => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['paciente', pacienteId] });
      toast.success('Status do paciente atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

// Hook para deletar um paciente
export function useDeletePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pacienteId: string): Promise<void> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch(`${API_BASE}/v1/crm-pacientes-management/${pacienteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao deletar paciente');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar paciente: ${error.message}`);
    },
  });
} 