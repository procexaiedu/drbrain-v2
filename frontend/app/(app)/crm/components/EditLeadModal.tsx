'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useUpdateLead, useConvertLead } from '../hooks/useLeads';
import { Lead, LeadFormData, LeadStatus, ORIGEM_LEAD_OPTIONS, LEAD_STATUS_OPTIONS, MOTIVO_PERDA_OPTIONS } from '../types';

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function EditLeadModal({ isOpen, onClose, lead }: EditLeadModalProps) {
  const [formData, setFormData] = useState<LeadFormData & { motivo_perda_lead?: string }>({
    nome_lead: '',
    telefone_principal: '',
    email_lead: '',
    origem_lead: '',
    status_funil_lead: 'Novo Lead',
    notas_internas_lead: '',
    motivo_perda_lead: ''
  });

  const updateLeadMutation = useUpdateLead();
  const convertLeadMutation = useConvertLead();

  // Preencher formulário quando lead mudar
  useEffect(() => {
    if (lead) {
      setFormData({
        nome_lead: lead.nome_lead || '',
        telefone_principal: lead.telefone_principal || '',
        email_lead: lead.email_lead || '',
        origem_lead: lead.origem_lead || '',
        status_funil_lead: lead.status_funil_lead || 'Novo Lead',
        notas_internas_lead: lead.notas_internas_lead || '',
        motivo_perda_lead: lead.motivo_perda_lead || ''
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead) return;

    try {
      // Verificar se o status foi alterado para "Convertido"
      const statusChanged = formData.status_funil_lead === 'Convertido' && lead.status_funil_lead !== 'Convertido';
      
      if (statusChanged) {
        const confirmed = window.confirm(
          `Atenção! Ao alterar o status para "Convertido", o lead "${lead.nome_lead}" será automaticamente transformado em paciente. Deseja continuar?`
        );
        
        if (confirmed) {
          // Usar o endpoint de conversão
          await convertLeadMutation.mutateAsync(lead.id);
          onClose();
        }
      } else {
        // Atualização normal do lead
        await updateLeadMutation.mutateAsync({
          leadId: lead.id,
          leadData: formData
        });
        onClose();
      }
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!lead) return null;

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Editar Lead
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="nome_lead" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="nome_lead"
                      name="nome_lead"
                      required
                      value={formData.nome_lead}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome completo do lead"
                    />
                  </div>

                  <div>
                    <label htmlFor="telefone_principal" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      id="telefone_principal"
                      name="telefone_principal"
                      required
                      value={formData.telefone_principal}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label htmlFor="email_lead" className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      id="email_lead"
                      name="email_lead"
                      value={formData.email_lead}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="origem_lead" className="block text-sm font-medium text-gray-700 mb-1">
                      Origem
                    </label>
                    <select
                      id="origem_lead"
                      name="origem_lead"
                      value={formData.origem_lead}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {ORIGEM_LEAD_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status_funil_lead" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status_funil_lead"
                      name="status_funil_lead"
                      value={formData.status_funil_lead}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {LEAD_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.status_funil_lead === 'Perdido' && (
                    <div>
                      <label htmlFor="motivo_perda_lead" className="block text-sm font-medium text-gray-700 mb-1">
                        Motivo da Perda
                      </label>
                      <select
                        id="motivo_perda_lead"
                        name="motivo_perda_lead"
                        value={formData.motivo_perda_lead}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione um motivo</option>
                        {MOTIVO_PERDA_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="notas_internas_lead" className="block text-sm font-medium text-gray-700 mb-1">
                      Notas Internas
                    </label>
                    <textarea
                      id="notas_internas_lead"
                      name="notas_internas_lead"
                      rows={3}
                      value={formData.notas_internas_lead || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Informações adicionais sobre o lead..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={updateLeadMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateLeadMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 