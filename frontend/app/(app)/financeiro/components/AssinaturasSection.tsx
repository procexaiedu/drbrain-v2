'use client';

import React, { useState, Fragment } from 'react';
import { useAssinaturas, useCreateAssinatura, useUpdateAssinatura, useDeleteAssinatura } from '../hooks/useAssinaturas';
import { AssinaturaRecorrente } from '../types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AssinaturasSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssinaturaRecorrente['status_assinatura'] | undefined>(undefined);
  const { data, isLoading, isError, error } = useAssinaturas(search, statusFilter, page, limit);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAssinatura, setCurrentAssinatura] = useState<Partial<AssinaturaRecorrente> | null>(null);

  const createAssinaturaMutation = useCreateAssinatura();
  const updateAssinaturaMutation = useUpdateAssinatura();
  const deleteAssinaturaMutation = useDeleteAssinatura();

  const handleNewAssinaturaClick = () => {
    setIsEditing(false);
    setCurrentAssinatura({ status_assinatura: 'ATIVA', valor_recorrencia: 0, data_inicio: format(new Date(), 'yyyy-MM-dd'), periodo_recorrencia: 'MENSAL' }); // Valores padrão
    setIsModalOpen(true);
  };

  const handleEditAssinaturaClick = (assinatura: AssinaturaRecorrente) => {
    setIsEditing(true);
    setCurrentAssinatura(assinatura);
    setIsModalOpen(true);
  };

  const handleDeleteAssinaturaClick = (assinaturaId: string) => {
    toast(`Tem certeza que deseja excluir esta assinatura?`, {
      action: {
        label: 'Excluir',
        onClick: () => deleteAssinaturaMutation.mutate(assinaturaId),
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
      duration: Infinity,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAssinatura) return;

    try {
      if (isEditing) {
        await updateAssinaturaMutation.mutateAsync({ assinaturaId: currentAssinatura.id!, assinaturaData: currentAssinatura });
      } else {
        await createAssinaturaMutation.mutateAsync(currentAssinatura as Omit<AssinaturaRecorrente, 'id' | 'medico_id' | 'created_at' | 'updated_at' | 'asaas_subscription_id' | 'data_proxima_cobranca'>);
      }
      setIsModalOpen(false);
      setCurrentAssinatura(null);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentAssinatura(prev => ({
      ...prev,
      [name]: name === 'valor_recorrencia' ? parseFloat(value) : value,
    }));
  };

  if (isLoading) return <div className="text-center py-8">Carregando assinaturas...</div>;
  if (isError) return <div className="text-center py-8 text-red-600">Erro ao carregar assinaturas: {error?.message}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Assinaturas Recorrentes</h2>
        <button
          onClick={handleNewAssinaturaClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Nova Assinatura
        </button>
      </div>

      <div className="mb-4 flex space-x-4">
        <input
          type="text"
          placeholder="Buscar assinaturas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value as AssinaturaRecorrente['status_assinatura'] | undefined)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos os Status</option>
          <option value="ATIVA">Ativa</option>
          <option value="PAUSADA">Pausada</option>
          <option value="CANCELADA">Cancelada</option>
          <option value="CONCLUIDA">Concluída</option>
        </select>
      </div>

      {data?.data && data.data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.data.map((assinatura) => (
                <tr key={assinatura.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assinatura.pacientes?.nome_completo || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assinatura.servicos?.nome_servico || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {assinatura.valor_recorrencia.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assinatura.periodo_recorrencia}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assinatura.status_assinatura}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditAssinaturaClick(assinatura)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteAssinaturaClick(assinatura.id)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhuma assinatura encontrada.</p>
      )}

      {/* Modal de Criação/Edição de Assinatura */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
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
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <ReceiptPercentIcon className="h-6 w-6 mr-2" />
                    {isEditing ? 'Editar Assinatura' : 'Nova Assinatura'}
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* TODO: Adicionar PatientSelect para vincular a um paciente */}
                      {/* TODO: Adicionar ServiceSelect para vincular a um serviço */}
                      <div>
                        <label htmlFor="valor_recorrencia" className="block text-sm font-medium text-gray-700">Valor da Recorrência</label>
                        <input type="number" name="valor_recorrencia" id="valor_recorrencia" value={currentAssinatura?.valor_recorrencia || 0} onChange={handleChange} required step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="periodo_recorrencia" className="block text-sm font-medium text-gray-700">Período da Recorrência</label>
                        <select name="periodo_recorrencia" id="periodo_recorrencia" value={currentAssinatura?.periodo_recorrencia || 'MENSAL'} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                          <option value="DIARIO">Diário</option>
                          <option value="SEMANAL">Semanal</option>
                          <option value="QUINZENAL">Quinzenal</option>
                          <option value="MENSAL">Mensal</option>
                          <option value="BIMESTRAL">Bimestral</option>
                          <option value="TRIMESTRAL">Trimestral</option>
                          <option value="SEMESTRAL">Semestral</option>
                          <option value="ANUAL">Anual</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-700">Data de Início</label>
                        <input type="date" name="data_inicio" id="data_inicio" value={currentAssinatura?.data_inicio ? format(new Date(currentAssinatura.data_inicio), 'yyyy-MM-dd') : ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="status_assinatura" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status_assinatura" id="status_assinatura" value={currentAssinatura?.status_assinatura || 'ATIVA'} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                          <option value="ATIVA">Ativa</option>
                          <option value="PAUSADA">Pausada</option>
                          <option value="CANCELADA">Cancelada</option>
                          <option value="CONCLUIDA">Concluída</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">Observações (Opcional)</label>
                        <textarea name="observacoes" id="observacoes" rows={3} value={currentAssinatura?.observacoes || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                      </div>
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          {isEditing ? 'Salvar Alterações' : 'Criar Assinatura'}
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
