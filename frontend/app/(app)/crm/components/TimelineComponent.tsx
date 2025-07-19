'use client';

import React, { useMemo } from 'react';
import {
  UserPlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Lead, Paciente, LeadStatus } from '../types';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineComponentProps {
  leads: Lead[];
  pacientes: Paciente[];
  maxEvents?: number;
}

interface TimelineEvent {
  id: string;
  type: 'lead_created' | 'lead_status_changed' | 'lead_converted' | 'paciente_created';
  title: string;
  description: string;
  date: Date;
  icon: React.ComponentType<any>;
  color: string;
  entity: Lead | Paciente;
}

export default function TimelineComponent({ 
  leads, 
  pacientes, 
  maxEvents = 10 
}: TimelineComponentProps) {
  
  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Eventos de criação de leads
    leads.forEach(lead => {
      const createdDate = parseISO(lead.created_at);
      if (isValid(createdDate)) {
        events.push({
          id: `lead-created-${lead.id}`,
          type: 'lead_created',
          title: 'Novo Lead Criado',
          description: `${lead.nome_lead} foi adicionado como novo lead`,
          date: createdDate,
          icon: UserPlusIcon,
          color: 'blue',
          entity: lead
        });
      }

      // Eventos de conversão de leads
      if (lead.status_funil_lead === 'Convertido') {
        events.push({
          id: `lead-converted-${lead.id}`,
          type: 'lead_converted',
          title: 'Lead Convertido',
          description: `${lead.nome_lead} foi convertido em paciente`,
          date: createdDate, // Usando data de criação como aproximação
          icon: CheckCircleIcon,
          color: 'green',
          entity: lead
        });
      }

      // Eventos de leads perdidos
      if (lead.status_funil_lead === 'Perdido') {
        events.push({
          id: `lead-lost-${lead.id}`,
          type: 'lead_status_changed',
          title: 'Lead Perdido',
          description: `${lead.nome_lead} foi marcado como perdido`,
          date: createdDate,
          icon: XCircleIcon,
          color: 'red',
          entity: lead
        });
      }
    });

    // Eventos de criação de pacientes
    pacientes.forEach(paciente => {
      const createdDate = paciente.data_cadastro_paciente 
        ? parseISO(paciente.data_cadastro_paciente)
        : parseISO(paciente.updated_at);
      if (isValid(createdDate)) {
        events.push({
          id: `paciente-created-${paciente.id}`,
          type: 'paciente_created',
          title: 'Novo Paciente',
          description: `${paciente.nome_completo} foi cadastrado como paciente`,
          date: createdDate,
          icon: CheckCircleIcon,
          color: 'emerald',
          entity: paciente
        });
      }
    });

    // Ordenar por data (mais recente primeiro) e limitar
    return events
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, maxEvents);
  }, [leads, pacientes, maxEvents]);

  const formatEventDate = (date: Date): string => {
    try {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return 'Ontem';
      } else if (diffInDays < 7) {
        return `${diffInDays} dias atrás`;
      } else {
        return format(date, 'dd/MM/yyyy', { locale: ptBR });
      }
    }
  };

  if (timelineEvents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Timeline de Atividades
        </h3>
        <div className="text-center py-8">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">Nenhuma atividade</h4>
          <p className="mt-1 text-sm text-gray-500">
            As atividades aparecerão aqui conforme você gerencia leads e pacientes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <ClockIcon className="h-5 w-5 mr-2 text-indigo-600" />
        Timeline de Atividades
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({timelineEvents.length} {timelineEvents.length === 1 ? 'evento' : 'eventos'})
        </span>
      </h3>

      <div className="flow-root">
        <ul className="-mb-8">
          {timelineEvents.map((event, eventIdx) => {
            const IconComponent = event.icon;
            const isLast = eventIdx === timelineEvents.length - 1;

            return (
              <li key={event.id}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full bg-${event.color}-500 flex items-center justify-center ring-8 ring-white`}>
                        <IconComponent className="h-4 w-4 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {event.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {event.description}
                        </p>
                        <div className="mt-2 flex items-center space-x-2">
                          <CalendarIcon className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatEventDate(event.date)}
                          </span>
                        </div>
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        <time dateTime={event.date.toISOString()}>
                          {getRelativeTime(event.date)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {timelineEvents.length >= maxEvents && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Mostrando os {maxEvents} eventos mais recentes
          </p>
        </div>
      )}
    </div>
  );
} 