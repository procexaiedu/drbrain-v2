'use client';

import React, { useState, Fragment } from 'react';
import { useFornecedores, useCreateFornecedor, useUpdateFornecedor, useDeleteFornecedor } from '../hooks/useFornecedores';
import { Fornecedor } from '../types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function FornecedoresSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error } = useFornecedores(search, page, limit);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFornecedor, setCurrentFornecedor] = useState<Partial<Fornecedor> | null>(null);

  const createFornecedorMutation = useCreateFornecedor();
  const updateFornecedorMutation = useUpdateFornecedor();
  const deleteFornecedorMutation = useDeleteFornecedor();

  const handleNewFornecedorClick = () => {
    setIsEditing(false);
    setCurrentFornecedor({});
    setIsModalOpen(true);
  };

  const handleEditFornecedorClick = (fornecedor: Fornecedor) => {
    setIsEditing(true);
    setCurrentFornecedor(fornecedor);
    setIsModalOpen(true);
  };

  const handleDeleteFornecedorClick = (fornecedorId: string) => {
    toast(`Tem certeza que deseja excluir este fornecedor?`, {
      action: {
        label: 'Excluir',
        onClick: () => deleteFornecedorMutation.mutate(fornecedorId),
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
    if (!currentFornecedor) return;

    try {
      if (isEditing) {
        await updateFornecedorMutation.mutateAsync({ fornecedorId: currentFornecedor.id!, fornecedorData: currentFornecedor });
      } else {
        await createFornecedorMutation.mutateAsync(currentFornecedor as Fornecedor);
      }
      setIsModalOpen(false);
      setCurrentFornecedor(null);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentFornecedor(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) return <div className="text-center py-8">Carregando fornecedores...</div>;
  if (isError) return <div className="text-center py-8 text-red-600">Erro ao carregar fornecedores: {error?.message}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Fornecedores</h2>
        <button
          onClick={handleNewFornecedorClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Fornecedor
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar fornecedores..."
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.data.map((fornecedor) => (
                <tr key={fornecedor.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fornecedor.nome_fornecedor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fornecedor.contato_principal || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fornecedor.telefone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditFornecedorClick(fornecedor)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteFornecedorClick(fornecedor.id)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhum fornecedor encontrado.</p>
      )}

      {/* Modal de Criação/Edição de Fornecedor */}
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
                    <BuildingStorefrontIcon className="h-6 w-6 mr-2" />
                    {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="nome_fornecedor" className="block text-sm font-medium text-gray-700">Nome do Fornecedor</label>
                        <input type="text" name="nome_fornecedor" id="nome_fornecedor" value={currentFornecedor?.nome_fornecedor || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="contato_principal" className="block text-sm font-medium text-gray-700">Contato Principal</label>
                        <input type="text" name="contato_principal" id="contato_principal" value={currentFornecedor?.contato_principal || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input type="text" name="telefone" id="telefone" value={currentFornecedor?.telefone || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" id="email" value={currentFornecedor?.email || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ (Opcional)</label>
                        <input type="text" name="cnpj" id="cnpj" value={currentFornecedor?.cnpj || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
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
                          {isEditing ? 'Salvar Alterações' : 'Criar Fornecedor'}
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
