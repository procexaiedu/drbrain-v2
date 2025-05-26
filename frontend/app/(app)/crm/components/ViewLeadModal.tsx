'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Lead } from '../types';
import StatusBadge from '@/components/ui/StatusBadge';
import DocumentosSection from './DocumentosSection';
import { useConvertLead } from '../hooks/useLeads';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ViewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function ViewLeadModal({ isOpen, onClose, lead }: ViewLeadModalProps) {
  const convertLead = useConvertLead();
  
  if (!lead) return null;

  const openWhatsApp = () => {
    if (lead.telefone_principal) {
      const cleanPhone = lead.telefone_principal.replace(/\D/g, '');
      const message = encodeURIComponent(`Olá ${lead.nome_lead}, tudo bem?`);
      window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const sendEmail = () => {
    if (lead.email_lead) {
      const subject = encodeURIComponent(`Contato Dr.Brain - ${lead.nome_lead}`);
      window.open(`mailto:${lead.email_lead}?subject=${subject}`, '_blank');
    }
  };

  const handleConvertLead = async () => {
    if (window.confirm(`Tem certeza que deseja converter o lead "${lead.nome_lead}" em paciente?`)) {
      try {
        await convertLead.mutateAsync(lead.id);
        onClose();
      } catch (error) {
        console.error('Erro ao converter lead:', error);
      }
    }
  };

  const canConvert = lead.status_funil_lead !== 'Convertido' && 
                    lead.status_funil_lead !== 'Perdido' && 
                    !lead.paciente_id_convertido;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold leading-6 text-gray-900"
                    >
                      {lead.nome_lead}
                    </Dialog.Title>
                    <div className="mt-1 flex items-center space-x-2">
                      <StatusBadge type="lead" status={lead.status_funil_lead} />
                      {lead.origem_lead && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {lead.origem_lead}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Botão de Conversão */}
                  {canConvert && (
                    <div className="mb-6">
                      <button
                        onClick={handleConvertLead}
                        disabled={convertLead.isPending}
                        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        {convertLead.isPending ? 'Convertendo...' : 'Converter em Paciente'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informações Básicas */}
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Informações de Contato
                        </h4>
                        <div className="space-y-3">
                          {/* Telefone */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <PhoneIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Telefone:</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {lead.telefone_principal || 'Não informado'}
                              </span>
                              {lead.telefone_principal && (
                                <button
                                  onClick={openWhatsApp}
                                  className="text-green-600 hover:text-green-700 text-xs bg-green-50 px-2 py-1 rounded"
                                >
                                  WhatsApp
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Email */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">E-mail:</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {lead.email_lead || 'Não informado'}
                              </span>
                              {lead.email_lead && (
                                <button
                                  onClick={sendEmail}
                                  className="text-blue-600 hover:text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded"
                                >
                                  Enviar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Informações do Lead */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Detalhes do Lead
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <StatusBadge type="lead" status={lead.status_funil_lead} />
                          </div>
                          
                          {lead.origem_lead && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Origem:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {lead.origem_lead}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Criado em:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>

                          {lead.data_ultima_atualizacao_status && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Última atualização:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {format(new Date(lead.data_ultima_atualizacao_status), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                          )}

                          {lead.status_funil_lead === 'Perdido' && lead.motivo_perda_lead && (
                            <div className="pt-2 border-t border-gray-200">
                              <span className="text-sm text-gray-600">Motivo da perda:</span>
                              <p className="text-sm text-red-600 mt-1">
                                {lead.motivo_perda_lead}
                              </p>
                            </div>
                          )}

                          {lead.status_funil_lead === 'Convertido' && lead.paciente_id_convertido && (
                            <div className="pt-2 border-t border-gray-200">
                              <span className="text-sm text-green-600 font-medium">
                                ✅ Lead convertido em paciente
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notas */}
                      {lead.notas_internas_lead && (
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-amber-900 mb-2">
                            Notas Internas
                          </h4>
                          <p className="text-sm text-amber-800 whitespace-pre-wrap">
                            {lead.notas_internas_lead}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Documentos */}
                    <div>
                      <DocumentosSection 
                        contatoId={lead.id}
                        tipoContato="lead"
                        nomeContato={lead.nome_lead}
                      />
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 