'use client';

import Link from 'next/link';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { AlertItem, DashboardData } from '../types';

interface AlertsPanelProps {
  data: DashboardData;
}

const alertIcons = {
  warning: ExclamationTriangleIcon,
  success: CheckCircleIcon,
  info: InformationCircleIcon,
  error: XCircleIcon,
};

const alertColors = {
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    text: 'text-yellow-900',
    subtitle: 'text-yellow-700',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    text: 'text-green-900',
    subtitle: 'text-green-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-900',
    subtitle: 'text-blue-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-900',
    subtitle: 'text-red-700',
  },
};

export function AlertsPanel({ data }: AlertsPanelProps) {
  // Gerar alertas inteligentes baseados nos dados
  const generateAlerts = (): AlertItem[] => {
    const alerts: AlertItem[] = [];

    // Alert para muitos prontuários em rascunho
    if (data.metricas_prontuarios.prontuarios_rascunho > 5) {
      alerts.push({
        id: 'prontuarios-rascunho',
        type: 'warning',
        title: 'Prontuários Pendentes',
        message: `Você tem ${data.metricas_prontuarios.prontuarios_rascunho} prontuários em rascunho aguardando finalização.`,
        action: {
          label: 'Ver Prontuários',
          href: '/prontuarios?status=rascunho'
        },
        timestamp: new Date(),
      });
    }

    // Alert para leads ativos sem follow-up
    if (data.metricas_crm.leads_ativos > 10) {
      alerts.push({
        id: 'leads-follow-up',
        type: 'info',
        title: 'Leads Aguardando Follow-up',
        message: `${data.metricas_crm.leads_ativos} leads ativos podem precisar de acompanhamento.`,
        action: {
          label: 'Ver Leads',
          href: '/crm?tab=leads&status=ativo'
        },
        timestamp: new Date(),
      });
    }

    // Alert positivo para boa performance
    if (data.metricas_prontuarios.prontuarios_finalizados > data.metricas_prontuarios.prontuarios_rascunho) {
      alerts.push({
        id: 'boa-performance',
        type: 'success',
        title: 'Excelente Produtividade!',
        message: 'Você tem mais prontuários finalizados do que em rascunho. Parabéns!',
        timestamp: new Date(),
      });
    }

    // Alert para consultas hoje
    if (data.placeholders_agenda.consultas_hoje > 0) {
      alerts.push({
        id: 'consultas-hoje',
        type: 'info',
        title: 'Consultas Agendadas',
        message: `Você tem ${data.placeholders_agenda.consultas_hoje} consultas agendadas para hoje.`,
        action: {
          label: 'Ver Agenda',
          href: '/agenda'
        },
        timestamp: new Date(),
      });
    }

    // Alert para novos pacientes
    if (data.metricas_crm.novos_pacientes_mes > 0) {
      alerts.push({
        id: 'novos-pacientes',
        type: 'success',
        title: 'Novos Pacientes',
        message: `${data.metricas_crm.novos_pacientes_mes} novos pacientes foram cadastrados este mês.`,
        action: {
          label: 'Ver Pacientes',
          href: '/crm?tab=pacientes&filter=novos'
        },
        timestamp: new Date(),
      });
    }

    return alerts.slice(0, 4); // Limitar a 4 alertas
  };

  const alerts = generateAlerts();

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📢 Alertas e Notificações</h3>
        <div className="text-center py-8">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">Tudo em ordem! Nenhum alerta no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📢 Alertas e Notificações</h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const IconComponent = alertIcons[alert.type];
          const colors = alertColors[alert.type];

          return (
            <div
              key={alert.id}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start space-x-3">
                <IconComponent className={`h-5 w-5 ${colors.icon} mt-0.5 flex-shrink-0`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${colors.text}`}>{alert.title}</h4>
                    <span className="text-xs text-gray-500">
                      {alert.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${colors.subtitle} mt-1`}>
                    {alert.message}
                  </p>
                  
                  {alert.action && (
                    <Link
                      href={alert.action.href}
                      className={`inline-flex items-center space-x-1 text-sm font-medium ${colors.icon} hover:underline mt-2`}
                    >
                      <span>{alert.action.label}</span>
                      <ChevronRightIcon className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Alertas são gerados automaticamente com base na sua atividade
          </p>
        </div>
      )}
    </div>
  );
} 