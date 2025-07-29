'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useDashboardData } from './hooks/useDashboardData';
import { MetricCard } from './components/MetricCard';
import { AdvancedMetricCard } from './components/AdvancedMetricCard';
import { DashboardHeader } from './components/DashboardHeader';
import { AlertsPanel } from './components/AlertsPanel';
import { ActivityTimeline } from './components/ActivityTimeline';
import { PieChart } from './components/PieChart';
import { LineChart } from './components/LineChart';
import { QuickActions } from './components/QuickActions';
import { ChartData } from './types';
import {
  UserGroupIcon,
  UserPlusIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

export default function DashboardPage() {
  const { setPageTitle, setPageSubtitle, setBreadcrumbs } = useApp();
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();

  useEffect(() => {
    setPageTitle('Dashboard');
    setPageSubtitle('Visão geral do sistema Dr.Brain');
    setBreadcrumbs([]);
  }, [setPageTitle, setPageSubtitle, setBreadcrumbs]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Erro ao carregar dados</h3>
              <p className="text-red-700 mt-1">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  // Preparar dados para os gráficos
  const leadsChartData: ChartData[] = Object.entries(dashboardData.metricas_crm.leads_por_status).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const pacientesChartData: ChartData[] = Object.entries(dashboardData.metricas_crm.pacientes_por_status).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const prontuariosChartData: ChartData[] = Object.entries(dashboardData.metricas_prontuarios.prontuarios_por_status).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Header Inteligente */}
      <DashboardHeader
        nomeMedico={dashboardData.saudacao_nome_medico}
        lastUpdated={dashboardData.lastUpdated}
        onRefresh={() => refetch()}
        isLoading={isLoading}
        stats={dashboardData.stats}
      />

      {/* Métricas Principais Avançadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdvancedMetricCard
          title="Leads Ativos"
          value={dashboardData.metricas_crm.leads_ativos}
          subtitle="Potenciais pacientes"
          icon={<UserPlusIcon className="h-6 w-6 text-white" />}
          color="blue"
          sparklineData={dashboardData.sparklineData?.leads}
          comparison={{
            value: 12,
            label: "vs mês anterior",
            isPositive: true
          }}
          alert={dashboardData.metricas_crm.leads_ativos > 10 ? {
            type: 'info',
            message: 'Muitos leads aguardando follow-up'
          } : undefined}
        />
        
        <AdvancedMetricCard
          title="Pacientes Ativos"
          value={dashboardData.metricas_crm.total_pacientes_ativos}
          subtitle="Em acompanhamento"
          icon={<UserGroupIcon className="h-6 w-6 text-white" />}
          color="green"
          sparklineData={dashboardData.sparklineData?.pacientes}
          comparison={{
            value: 8,
            label: "vs mês anterior",
            isPositive: true
          }}
          alert={{
            type: 'success',
            message: 'Crescimento consistente na base de pacientes'
          }}
        />
        
        <AdvancedMetricCard
          title="Prontuários Rascunho"
          value={dashboardData.metricas_prontuarios.prontuarios_rascunho}
          subtitle="Aguardando finalização"
          icon={<ClockIcon className="h-6 w-6 text-white" />}
          color="orange"
          sparklineData={dashboardData.sparklineData?.prontuarios}
          comparison={{
            value: 3,
            label: "vs semana anterior",
            isPositive: false
          }}
          alert={dashboardData.metricas_prontuarios.prontuarios_rascunho > 5 ? {
            type: 'warning',
            message: 'Muitos prontuários pendentes'
          } : undefined}
        />
        
        <AdvancedMetricCard
          title="Prontuários Finalizados"
          value={dashboardData.metricas_prontuarios.prontuarios_finalizados}
          subtitle="Concluídos"
          icon={<CheckCircleIcon className="h-6 w-6 text-white" />}
          color="purple"
          comparison={{
            value: 15,
            label: "vs mês anterior",
            isPositive: true
          }}
          alert={{
            type: 'success',
            message: 'Excelente produtividade!'
          }}
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Novos Pacientes"
          value={dashboardData.metricas_crm.novos_pacientes_mes}
          subtitle="Este mês"
          icon={<UserPlusIcon className="h-6 w-6 text-white" />}
          color="indigo"
        />
        
        <MetricCard
          title="Consultas Hoje"
          value={dashboardData.placeholders_agenda.consultas_hoje}
          subtitle="Agendadas para hoje"
          icon={<CalendarDaysIcon className="h-6 w-6 text-white" />}
          color="blue"
        />
        
        <MetricCard
          title="Receita do Mês"
          value={`R$ ${dashboardData.placeholders_financeiro.receita_mes.toLocaleString('pt-BR')}`}
          subtitle="Faturamento atual"
          icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />}
          color="green"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          data={leadsChartData}
          title="Distribuição de Leads por Status"
        />
        
        <PieChart
          data={pacientesChartData}
          title="Distribuição de Pacientes por Status"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          data={prontuariosChartData}
          title="Distribuição de Prontuários por Status"
        />
        
        <LineChart
          data={dashboardData.metricas_prontuarios.criados_ultimos_7_dias}
          title="Prontuários Criados - Últimos 7 Dias"
          color="#8B5CF6"
        />
      </div>

      {/* Alertas e Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel data={dashboardData} />
        <ActivityTimeline data={dashboardData} />
      </div>

      {/* Placeholders para Módulos Futuros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Agenda (Em Breve)</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Próximas consultas</span>
              <span className="font-semibold text-gray-900">{dashboardData.placeholders_agenda.proximas_consultas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Consultas esta semana</span>
              <span className="font-semibold text-gray-900">{dashboardData.placeholders_agenda.consultas_semana}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Financeiro (Em Breve)</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Consultas pagas</span>
              <span className="font-semibold text-gray-900">{dashboardData.placeholders_financeiro.consultas_pagas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Pendências</span>
              <span className="font-semibold text-gray-900">{dashboardData.placeholders_financeiro.pendencias}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <QuickActions />
    </div>
  );
} 