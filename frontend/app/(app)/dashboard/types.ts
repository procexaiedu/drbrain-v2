export interface DashboardData {
  saudacao_nome_medico: string;
  metricas_crm: {
    leads_por_status: Record<string, number>;
    leads_ativos: number;
    novos_pacientes_mes: number;
    pacientes_por_status: Record<string, number>;
    total_pacientes_ativos: number;
  };
  metricas_prontuarios: {
    prontuarios_por_status: Record<string, number>;
    prontuarios_rascunho: number;
    prontuarios_finalizados: number;
    criados_ultimos_7_dias: { data: string; contagem: number }[];
    finalizados_ultimos_7_dias: { data: string; contagem: number }[];
  };
  placeholders_agenda: {
    proximas_consultas: number;
    consultas_hoje: number;
    consultas_semana: number;
  };
  placeholders_financeiro: {
    receita_mes: number;
    consultas_pagas: number;
    pendencias: number;
  };
  // Dados adicionais para funcionalidades avançadas
  lastUpdated?: Date;
  stats?: DashboardStats;
  sparklineData?: {
    leads: number[];
    pacientes: number[];
    prontuarios: number[];
  };
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Novos tipos para componentes avançados
export interface AdvancedMetricCardProps extends MetricCardProps {
  sparklineData?: number[];
  comparison?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  alert?: {
    type: 'warning' | 'success' | 'info' | 'error';
    message: string;
  };
  onClick?: () => void;
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'success' | 'info' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  timestamp: Date;
}

export interface ActivityItem {
  id: string;
  type: 'lead' | 'paciente' | 'prontuario' | 'sistema';
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
}

export interface DashboardStats {
  totalLeads: number;
  totalPacientes: number;
  totalProntuarios: number;
  conversionRate: number;
  avgResponseTime: string;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesData {
  data: string;
  contagem: number;
  dataFormatada?: string;
} 