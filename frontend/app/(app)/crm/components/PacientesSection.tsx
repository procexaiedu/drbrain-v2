'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { usePacientes, useDeletePaciente } from '../hooks/usePacientes';
import { Paciente, PacienteStatus, PACIENTE_STATUS_OPTIONS } from '../types';
import StatusBadge from '@/components/ui/StatusBadge';
import NewPacienteModal from './NewPacienteModal';
import EditPacienteModal from './EditPacienteModal';
import ViewPacienteModal from './ViewPacienteModal';

export default function PacientesSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PacienteStatus | ''>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  const { data: pacientesData, isLoading, error } = usePacientes(
    searchTerm,
    statusFilter || undefined,
    1,
    50
  );

  const deletePacienteMutation = useDeletePaciente();

  const pacientes = pacientesData?.data || [];

  // Métricas por status
  const metrics = PACIENTE_STATUS_OPTIONS.map(status => ({
    ...status,
    count: pacientes.filter(p => p.status_paciente === status.value).length
  }));

  const handleView = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsViewModalOpen(true);
  };

  const handleEdit = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (paciente: Paciente) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente ${paciente.nome_completo}?`)) {
      try {
        await deletePacienteMutation.mutateAsync(paciente.id);
      } catch (error) {
        console.error('Erro ao excluir paciente:', error);
      }
    }
  };

  const handleWhatsApp = (paciente: Paciente) => {
    if (paciente.telefone_principal) {
      const phone = paciente.telefone_principal.replace(/\D/g, '');
      const message = encodeURIComponent(`Olá ${paciente.nome_completo}, tudo bem?`);
      window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar pacientes. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.value}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.count}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-50">
                <StatusBadge status={metric.value} type="paciente" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros e Ações */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PacienteStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              {PACIENTE_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Novo Paciente */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Paciente
          </button>
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando pacientes...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhum paciente encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Nascimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pacientes.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {paciente.nome_completo}
                        </div>
                        {paciente.cpf && (
                          <div className="text-sm text-gray-500">
                            CPF: {paciente.cpf}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {paciente.telefone_principal || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {paciente.email_paciente || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(paciente.data_nascimento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={paciente.status_paciente} type="paciente" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(paciente.data_cadastro_paciente)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {/* TODO: Implementar visualização */}}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ver detalhes"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(paciente)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {paciente.telefone_principal && (
                          <button
                            onClick={() => handleWhatsApp(paciente)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="WhatsApp"
                          >
                            <PhoneIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(paciente)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Excluir"
                          disabled={deletePacienteMutation.isPending}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      <NewPacienteModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      <EditPacienteModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPaciente(null);
        }}
        paciente={selectedPaciente}
      />
    </div>
  );
} 