'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { Paciente } from '../types';
import StatusBadge from '@/components/ui/StatusBadge';
import DocumentosSection from './DocumentosSection';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ViewPacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente | null;
}

export default function ViewPacienteModal({ isOpen, onClose, paciente }: ViewPacienteModalProps) {
  if (!paciente) return null;

  const openWhatsApp = () => {
    if (paciente.telefone_principal) {
      const cleanPhone = paciente.telefone_principal.replace(/\D/g, '');
      const message = encodeURIComponent(`Olá ${paciente.nome_completo}, tudo bem?`);
      window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const sendEmail = () => {
    if (paciente.email_paciente) {
      const subject = encodeURIComponent(`Contato Dr.Brain - ${paciente.nome_completo}`);
      window.open(`mailto:${paciente.email_paciente}?subject=${subject}`, '_blank');
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

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
                      {paciente.nome_completo}
                    </Dialog.Title>
                    <div className="mt-1 flex items-center space-x-2">
                      <StatusBadge type="paciente" status={paciente.status_paciente} />
                      {paciente.lead_origem_id && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Convertido de Lead
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
                                {paciente.telefone_principal || 'Não informado'}
                              </span>
                              {paciente.telefone_principal && (
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
                                {paciente.email_paciente || 'Não informado'}
                              </span>
                              {paciente.email_paciente && (
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

                      {/* Dados Pessoais */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Dados Pessoais
                        </h4>
                        <div className="space-y-3">
                          {paciente.cpf && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <IdentificationIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">CPF:</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCPF(paciente.cpf)}
                              </span>
                            </div>
                          )}

                          {paciente.data_nascimento && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Nascimento:</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-medium text-gray-900">
                                  {format(new Date(paciente.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                                <div className="text-xs text-gray-500">
                                  {calculateAge(paciente.data_nascimento)} anos
                                </div>
                              </div>
                            </div>
                          )}

                          {paciente.sexo && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Sexo:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {paciente.sexo}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informações do Paciente */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Detalhes do Paciente
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <StatusBadge type="paciente" status={paciente.status_paciente} />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Cadastrado em:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {paciente.data_cadastro_paciente 
                                ? format(new Date(paciente.data_cadastro_paciente), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                : 'Não informado'
                              }
                            </span>
                          </div>

                          {paciente.updated_at && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Última atualização:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {format(new Date(paciente.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Endereço */}
                      {paciente.endereco_completo_json && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Endereço
                          </h4>
                          <div className="text-sm text-gray-700">
                            {typeof paciente.endereco_completo_json === 'string' 
                              ? paciente.endereco_completo_json 
                              : JSON.stringify(paciente.endereco_completo_json, null, 2)
                            }
                          </div>
                        </div>
                      )}

                      {/* Notas */}
                      {paciente.notas_gerais_paciente && (
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-amber-900 mb-2">
                            Notas Gerais
                          </h4>
                          <p className="text-sm text-amber-800 whitespace-pre-wrap">
                            {paciente.notas_gerais_paciente}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Documentos */}
                    <div>
                      <DocumentosSection 
                        contatoId={paciente.id}
                        tipoContato="paciente"
                        nomeContato={paciente.nome_completo}
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