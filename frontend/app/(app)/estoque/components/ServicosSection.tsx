'use client';

import React, { useState, Fragment } from 'react';
import { useServicos, useCreateServico, useUpdateServico, useDeleteServico } from '../hooks/useServicos';
import { Servico } from '../types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function ServicosSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error } = useServicos(search, page, limit);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentServico, setCurrentServico] = useState<Partial<Servico> | null>(null);

  const createServicoMutation = useCreateServico();
  const updateServicoMutation = useUpdateServico();
  const deleteServicoMutation = useDeleteServico();

  const handleNewServicoClick = () => {
    setIsEditing(false);
    setCurrentServico({ preco_servico: 0 }); // Valor padrão
    setIsModalOpen(true);
  };

  const handleEditServicoClick = (servico: Servico) => {
    setIsEditing(true);
    setCurrentServico(servico);
    setIsModalOpen(true);
  };

  const handleDeleteServicoClick = (servicoId: string) => {
    toast(`Tem certeza que deseja excluir este serviço?`, {
      action: {
        label: 'Excluir',
        onClick: () => deleteServicoMutation.mutate(servicoId),
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
    if (!currentServico) return;

    try {
      if (isEditing) {
        await updateServicoMutation.mutateAsync({ servicoId: currentServico.id!, servicoData: currentServico });
      } else {
        await createServicoMutation.mutateAsync(currentServico as Servico);
      }
      setIsModalOpen(false);
      setCurrentServico(null);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentServico(prev => ({
      ...prev,
      [name]: name === 'preco_servico' || name === 'duracao_estimada_minutos' ? parseFloat(value) : value,
    }));
  };

  if (isLoading) return <div className="text-center py-8">Carregando serviços...</div>;
  if (isError) return <div className="text-center py-8 text-red-600">Erro ao carregar serviços: {error?.message}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Serviços</h2>
        <button
          onClick={handleNewServicoClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Serviço
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar serviços..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {data?.data && data.data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração (min)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.data.map((servico) => (
                <tr key={servico.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{servico.nome_servico}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {servico.preco_servico.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{servico.duracao_estimada_minutos || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditServicoClick(servico)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteServicoClick(servico.id)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhum serviço encontrado.</p>
      )}

      {/* Modal de Criação/Edição de Serviço */}
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
                    <TagIcon className="h-6 w-6 mr-2" />
                    {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="nome_servico" className="block text-sm font-medium text-gray-700">Nome do Serviço</label>
                        <input type="text" name="nome_servico" id="nome_servico" value={currentServico?.nome_servico || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="preco_servico" className="block text-sm font-medium text-gray-700">Preço do Serviço</label>
                        <input type="number" name="preco_servico" id="preco_servico" value={currentServico?.preco_servico || 0} onChange={handleChange} required step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="duracao_estimada_minutos" className="block text-sm font-medium text-gray-700">Duração Estimada (minutos)</label>
                        <input type="number" name="duracao_estimada_minutos" id="duracao_estimada_minutos" value={currentServico?.duracao_estimada_minutos || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="descricao_servico" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
                        <textarea name="descricao_servico" id="descricao_servico" rows={3} value={currentServico?.descricao_servico || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
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
                          {isEditing ? 'Salvar Alterações' : 'Criar Serviço'}
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
