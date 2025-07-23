'use client';

import React, { useMemo } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  UserGroupIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Lead, Paciente, LeadStatus, LEAD_STATUS_OPTIONS } from '../types';
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TimelineComponent from './TimelineComponent';

interface AnalyticsDashboardProps {
  leads: Lead[];
  pacientes: Paciente[];
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
}

export default function AnalyticsDashboard({ leads, pacientes }: AnalyticsDashboardProps) {
  // Calcular métricas
  const metrics = useMemo(() => {
    const today = new Date();
    const last30Days = subDays(today, 30);
    const last60Days = subDays(today, 60);

    // Leads dos últimos 30 dias
    const recentLeads = leads.filter(lead => 
      isAfter(new Date(lead.created_at), last30Days)
    );

    // Leads dos 30 dias anteriores (para comparação)
    const previousLeads = leads.filter(lead => 
      isAfter(new Date(lead.created_at), last60Days) &&
      isBefore(new Date(lead.created_at), last30Days)
    );

    // Taxa de conversão
    const convertedLeads = leads.filter(lead => lead.status_funil_lead === 'Convertido');
    const conversionRate = leads.length > 0 ? (convertedLeads.length / leads.length) * 100 : 0;

    // Leads perdidos
    const lostLeads = leads.filter(lead => lead.status_funil_lead === 'Perdido');
    const lossRate = leads.length > 0 ? (lostLeads.length / leads.length) * 100 : 0;

    // Pacientes ativos
    const activePacientes = pacientes.filter(p => p.status_paciente === 'Paciente Ativo');

    // Leads por origem
    const leadsByOrigin = leads.reduce((acc, lead) => {
      const origin = lead.origem_lead || 'Não informado';
      acc[origin] = (acc[origin] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Tempo médio no funil (estimativa baseada em status)
    const getStatusWeight = (status: LeadStatus): number => {
      const weights = {
        'Novo Lead': 1,
        'Contato Inicial': 2,
        'Interesse em Agendamento': 3,
        'Consulta Marcada': 4,
        'Convertido': 5,
        'Perdido': 0
      };
      return weights[status] || 0;
    };

    const avgFunnelProgress = leads.length > 0 
      ? leads.reduce((sum, lead) => sum + getStatusWeight(lead.status_funil_lead), 0) / leads.length
      : 0;

    return {
      totalLeads: leads.length,
      recentLeads: recentLeads.length,
      previousLeads: previousLeads.length,
      conversionRate,
      lossRate,
      activePacientes: activePacientes.length,
      totalPacientes: pacientes.length,
      leadsByOrigin,
      avgFunnelProgress
    };
  }, [leads, pacientes]);

  // Calcular mudança percentual
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const leadsChange = calculateChange(metrics.recentLeads, metrics.previousLeads);

  const metricCards: MetricCard[] = [
    {
      title: 'Total de Leads',
      value: metrics.totalLeads,
      change: leadsChange,
      changeType: leadsChange > 0 ? 'increase' : leadsChange < 0 ? 'decrease' : 'neutral',
      icon: UserGroupIcon,
      color: 'blue',
      description: 'Últimos 30 dias'
    },
    {
      title: 'Taxa de Conversão',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: ArrowTrendingUpIcon,
      color: 'green',
      description: 'Leads convertidos em pacientes'
    },
    {
      title: 'Taxa de Perda',
      value: `${metrics.lossRate.toFixed(1)}%`,
      icon: ArrowTrendingDownIcon,
      color: 'red',
      description: 'Leads perdidos'
    },
    {
      title: 'Pacientes Ativos',
      value: metrics.activePacientes,
      icon: CheckCircleIcon,
      color: 'emerald',
      description: `${metrics.totalPacientes} total`
    },
    {
      title: 'Progresso Médio',
      value: `${(metrics.avgFunnelProgress * 20).toFixed(0)}%`,
      icon: ChartBarIcon,
      color: 'purple',
      description: 'Avanço no funil de vendas'
    }
  ];

  // Distribuição por status
  const statusDistribution = LEAD_STATUS_OPTIONS.map(status => ({
    ...status,
    count: leads.filter(lead => lead.status_funil_lead === status.value).length,
    percentage: leads.length > 0 
      ? (leads.filter(lead => lead.status_funil_lead === status.value).length / leads.length) * 100 
      : 0
  }));

  // Top origens de leads
  const topOrigins = Object.entries(metrics.leadsByOrigin)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  {metric.description && (
                    <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                  )}
                  {metric.change !== undefined && (
                    <div className="flex items-center mt-2">
                      {metric.changeType === 'increase' ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      ) : metric.changeType === 'decrease' ? (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      ) : (
                        <div className="h-4 w-4 mr-1" />
                      )}
                      <span className={`text-xs font-medium ${
                        metric.changeType === 'increase' ? 'text-green-600' : 
                        metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <IconComponent className={`h-6 w-6 text-${metric.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Distribuição por Status
          </h3>
          <div className="space-y-3">
            {statusDistribution.map((status) => (
              <div key={status.value} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full bg-${status.color}-500`}></div>
                  <span className="text-sm font-medium text-gray-700">{status.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{status.count}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${status.color}-500 h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${status.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">
                    {status.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Origens de Leads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Principais Origens
          </h3>
          <div className="space-y-3">
            {topOrigins.length > 0 ? (
              topOrigins.map(([origin, count], index) => {
                const percentage = metrics.totalLeads > 0 ? (count / metrics.totalLeads) * 100 : 0;
                return (
                  <div key={origin} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                        <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{origin}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum dado de origem disponível
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Insights e Recomendações */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Insights e Recomendações
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.conversionRate < 10 && (
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Melhore a Conversão</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Sua taxa de conversão está em {metrics.conversionRate.toFixed(1)}%. 
                    Considere melhorar o follow-up com leads qualificados.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {metrics.lossRate > 30 && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Alta Taxa de Perda</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {metrics.lossRate.toFixed(1)}% dos leads são perdidos. 
                    Analise os motivos e ajuste a estratégia de abordagem.
                  </p>
                </div>
              </div>
            </div>
          )}

          {leadsChange > 20 && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Crescimento Acelerado</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Excelente! Você teve um crescimento de {leadsChange.toFixed(1)}% 
                    em novos leads nos últimos 30 dias.
                  </p>
                </div>
              </div>
            </div>
          )}

          {metrics.totalLeads < 10 && (
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Aumente sua Base</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Você tem poucos leads cadastrados. Considere investir em 
                    marketing digital ou campanhas de captação.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline de Atividades */}
      <TimelineComponent leads={leads} pacientes={pacientes} maxEvents={15} />
    </div>
  );
} 