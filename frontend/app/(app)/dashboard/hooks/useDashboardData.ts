import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { DashboardData } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/edge';

async function fetchDashboardData(): Promise<DashboardData> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${API_BASE}/v1/get-dashboard-summary`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
  }

  return response.json();
}

export function useDashboardData() {
  const query = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Adicionar dados simulados para funcionalidades avançadas
  const enhancedData = query.data ? {
    ...query.data,
    lastUpdated: new Date(),
    stats: {
      totalLeads: query.data.metricas_crm.leads_ativos,
      totalPacientes: query.data.metricas_crm.total_pacientes_ativos,
      totalProntuarios: query.data.metricas_prontuarios.prontuarios_finalizados + query.data.metricas_prontuarios.prontuarios_rascunho,
      conversionRate: Math.round((query.data.metricas_crm.total_pacientes_ativos / Math.max(query.data.metricas_crm.leads_ativos, 1)) * 100),
      avgResponseTime: '2.5h',
      systemHealth: 'excellent' as const,
    },
    sparklineData: {
      leads: [12, 15, 18, 14, 20, 16, 22],
      pacientes: [8, 10, 12, 9, 15, 11, 18],
      prontuarios: [5, 7, 9, 6, 11, 8, 13],
    }
  } : undefined;

  return {
    ...query,
    data: enhancedData,
  };
} 