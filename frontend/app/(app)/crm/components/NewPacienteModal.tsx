'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCreatePaciente } from '../hooks/usePacientes';
import { PacienteFormData, PACIENTE_STATUS_OPTIONS } from '../types';

interface NewPacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewPacienteModal({ isOpen, onClose }: NewPacienteModalProps) {
  const [formData, setFormData] = useState<PacienteFormData>({
    nome_completo: '',
    cpf: '',
    email_paciente: '',
    telefone_principal: '',
    data_nascimento: '',
    sexo: undefined,
    status_paciente: 'Paciente Ativo',
    notas_gerais_paciente: '',
  });

  const createPaciente = useCreatePaciente();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPaciente.mutateAsync(formData);
      onClose();
      // Reset form
      setFormData({
        nome_completo: '',
        cpf: '',
        email_paciente: '',
        telefone_principal: '',
        data_nascimento: '',
        sexo: undefined,
        status_paciente: 'Paciente Ativo',
        notas_gerais_paciente: '',
      });
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || undefined
    }));
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Novo Paciente
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome Completo */}
                    <div className="md:col-span-2">
                      <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        id="nome_completo"
                        name="nome_completo"
                        required
                        value={formData.nome_completo}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Nome completo do paciente"
                      />
                    </div>

                    {/* CPF */}
                    <div>
                      <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                        CPF
                      </label>
                      <input
                        type="text"
                        id="cpf"
                        name="cpf"
                        value={formData.cpf || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="000.000.000-00"
                      />
                    </div>

                    {/* Data de Nascimento */}
                    <div>
                      <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        id="data_nascimento"
                        name="data_nascimento"
                        value={formData.data_nascimento || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* Sexo */}
                    <div>
                      <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 mb-1">
                        Sexo
                      </label>
                      <select
                        id="sexo"
                        name="sexo"
                        value={formData.sexo || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Selecione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    {/* Telefone */}
                    <div>
                      <label htmlFor="telefone_principal" className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone Principal
                      </label>
                      <input
                        type="tel"
                        id="telefone_principal"
                        name="telefone_principal"
                        value={formData.telefone_principal || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email_paciente" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email_paciente"
                        name="email_paciente"
                        value={formData.email_paciente || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="status_paciente" className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <select
                        id="status_paciente"
                        name="status_paciente"
                        required
                        value={formData.status_paciente}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {PACIENTE_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notas */}
                    <div className="md:col-span-2">
                      <label htmlFor="notas_gerais_paciente" className="block text-sm font-medium text-gray-700 mb-1">
                        Notas Gerais
                      </label>
                      <textarea
                        id="notas_gerais_paciente"
                        name="notas_gerais_paciente"
                        rows={3}
                        value={formData.notas_gerais_paciente || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Observações sobre o paciente..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createPaciente.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createPaciente.isPending ? 'Criando...' : 'Criar Paciente'}
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