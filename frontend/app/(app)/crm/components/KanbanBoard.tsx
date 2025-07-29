'use client';

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Lead, LeadStatus, LEAD_STATUS_OPTIONS } from '../types';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUpdateLead } from '../hooks/useLeads';

interface KanbanBoardProps {
  leads: Lead[];
  onViewLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  onNewLead: () => void;
  isLoading?: boolean;
}

interface KanbanColumn {
  id: LeadStatus;
  title: string;
  color: string;
  leads: Lead[];
}

export default function KanbanBoard({
  leads,
  onViewLead,
  onEditLead,
  onDeleteLead,
  onNewLead,
  isLoading = false
}: KanbanBoardProps) {
  const updateLead = useUpdateLead();

  // Organizar leads por status
  const getColumns = useCallback((): KanbanColumn[] => {
    return LEAD_STATUS_OPTIONS.map(status => ({
      id: status.value,
      title: status.label,
      color: status.color,
      leads: leads.filter(lead => lead.status_funil_lead === status.value)
    }));
  }, [leads]);

  const [columns, setColumns] = useState<KanbanColumn[]>(getColumns());

  // Atualizar colunas quando leads mudarem
  React.useEffect(() => {
    setColumns(getColumns());
  }, [getColumns]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não há destino, não fazer nada
    if (!destination) return;

    // Se a posição não mudou, não fazer nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;

    const newStatus = destination.droppableId as LeadStatus;

    // Atualizar o status do lead
    try {
      await updateLead.mutateAsync({
        leadId: lead.id,
        leadData: {
          status_funil_lead: newStatus
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar status do lead:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const handleWhatsApp = (lead: Lead) => {
    const phone = lead.telefone_principal.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${lead.nome_lead}, tudo bem?`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Carregando leads...</span>
      </div>
    );
  }

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4 h-full">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                {/* Header da coluna */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-${column.color}-500`}></div>
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                      {column.leads.length}
                    </span>
                  </div>
                  {column.id === 'Novo Lead' && (
                    <button
                      onClick={onNewLead}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                      title="Adicionar novo lead"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Área de drop */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {column.leads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-move ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                              }`}
                            >
                              {/* Header do card */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                                    {lead.nome_lead}
                                  </h4>
                                  <div className="flex items-center space-x-1 mt-1">
                                    <StatusBadge status={lead.status_funil_lead} type="lead" />
                                  </div>
                                </div>
                              </div>

                              {/* Informações de contato */}
                              <div className="space-y-2 mb-3">
                                {lead.telefone_principal && (
                                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <PhoneIcon className="h-3 w-3" />
                                    <span>{lead.telefone_principal}</span>
                                  </div>
                                )}
                                {lead.email_lead && (
                                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <EnvelopeIcon className="h-3 w-3" />
                                    <span className="truncate">{lead.email_lead}</span>
                                  </div>
                                )}
                                {lead.origem_lead && (
                                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <UserIcon className="h-3 w-3" />
                                    <span>{lead.origem_lead}</span>
                                  </div>
                                )}
                              </div>

                              {/* Data de criação */}
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                                <CalendarIcon className="h-3 w-3" />
                                <span>Criado em {formatDate(lead.created_at)}</span>
                              </div>

                              {/* Notas (se houver) */}
                              {lead.notas_internas_lead && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded text-left">
                                    {lead.notas_internas_lead.length > 60
                                      ? `${lead.notas_internas_lead.substring(0, 60)}...`
                                      : lead.notas_internas_lead
                                    }
                                  </p>
                                </div>
                              )}

                              {/* Ações */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="flex space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewLead(lead);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Visualizar"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditLead(lead);
                                    }}
                                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                    title="Editar"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleWhatsApp(lead);
                                    }}
                                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                    title="WhatsApp"
                                  >
                                    <PhoneIcon className="h-4 w-4" />
                                  </button>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteLead(lead);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Excluir"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 