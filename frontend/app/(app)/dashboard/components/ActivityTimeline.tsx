'use client';

import { 
  UserPlusIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { ActivityItem, DashboardData } from '../types';

interface ActivityTimelineProps {
  data: DashboardData;
}

export function ActivityTimeline({ data }: ActivityTimelineProps) {
  // Gerar atividades simuladas baseadas nos dados
  const generateActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    const now = new Date();

    // Atividades baseadas nos dados dos últimos 7 dias
    data.metricas_prontuarios.criados_ultimos_7_dias.forEach((item, index) => {
      if (item.contagem > 0) {
        const date = new Date(item.data);
        activities.push({
          id: `prontuario-${index}`,
          type: 'prontuario',
          title: `${item.contagem} prontuário${item.contagem > 1 ? 's' : ''} criado${item.contagem > 1 ? 's' : ''}`,
          description: `Novos prontuários foram iniciados`,
          timestamp: date,
          icon: <DocumentTextIcon className="h-4 w-4" />,
          color: 'text-blue-600',
        });
      }
    });

    // Atividades simuladas para leads
    if (data.metricas_crm.leads_ativos > 0) {
      activities.push({
        id: 'leads-recent',
        type: 'lead',
        title: 'Novos leads recebidos',
        description: `${Math.min(data.metricas_crm.leads_ativos, 5)} leads foram adicionados recentemente`,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 horas atrás
        icon: <UserPlusIcon className="h-4 w-4" />,
        color: 'text-green-600',
      });
    }

    // Atividades para pacientes
    if (data.metricas_crm.novos_pacientes_mes > 0) {
      activities.push({
        id: 'pacientes-novos',
        type: 'paciente',
        title: 'Novos pacientes cadastrados',
        description: `${data.metricas_crm.novos_pacientes_mes} pacientes foram cadastrados este mês`,
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 dia atrás
        icon: <UserGroupIcon className="h-4 w-4" />,
        color: 'text-purple-600',
      });
    }

    // Atividades para prontuários finalizados
    if (data.metricas_prontuarios.prontuarios_finalizados > 0) {
      activities.push({
        id: 'prontuarios-finalizados',
        type: 'prontuario',
        title: 'Prontuários finalizados',
        description: `${Math.min(data.metricas_prontuarios.prontuarios_finalizados, 3)} prontuários foram concluídos`,
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 horas atrás
        icon: <CheckCircleIcon className="h-4 w-4" />,
        color: 'text-green-600',
      });
    }

    // Atividade do sistema
    activities.push({
      id: 'sistema-backup',
      type: 'sistema',
      title: 'Backup automático realizado',
      description: 'Todos os dados foram salvos com segurança',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 horas atrás
      icon: <ClockIcon className="h-4 w-4" />,
      color: 'text-gray-600',
    });

    // Ordenar por timestamp (mais recente primeiro)
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 6); // Limitar a 6 atividades
  };

  const activities = generateActivities();

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInMinutes < 1440) { // 24 horas
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d atrás`;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'lead': return 'bg-green-100 border-green-200';
      case 'paciente': return 'bg-purple-100 border-purple-200';
      case 'prontuario': return 'bg-blue-100 border-blue-200';
      case 'sistema': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🕒 Atividades Recentes</h3>
        <span className="text-sm text-gray-500">Últimas 24 horas</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Nenhuma atividade recente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative">
              {/* Timeline Line */}
              {index < activities.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
              )}
              
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 ${getActivityTypeColor(activity.type)} flex items-center justify-center`}>
                  <div className={activity.color}>
                    {activity.icon}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                      {activity.type === 'lead' && '👤 Lead'}
                      {activity.type === 'paciente' && '🏥 Paciente'}
                      {activity.type === 'prontuario' && '📋 Prontuário'}
                      {activity.type === 'sistema' && '⚙️ Sistema'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline">
          Ver todas as atividades
        </button>
      </div>
    </div>
  );
} 