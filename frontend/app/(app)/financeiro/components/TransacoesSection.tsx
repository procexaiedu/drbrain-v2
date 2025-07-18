'use client';

import React, { useState, Fragment } from 'react';
import { useTransacoes, useCreateTransacao, useUpdateTransacao, useDeleteTransacao } from '../hooks/useTransacoes';
import { TransacaoFinanceira } from '../types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TransacoesSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransacaoFinanceira['tipo_transacao'] | undefined>(undefined);
  const { data, isLoading, isError, error } = useTransacoes(search, typeFilter, page, limit);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransacao, setCurrentTransacao] = useState<Partial<TransacaoFinanceira> | null>(null);

  const createTransacaoMutation = useCreateTransacao();
  const updateTransacaoMutation = useUpdateTransacao();
  const deleteTransacaoMutation = useDeleteTransacao();

  const handleNewTransacaoClick = () => {
    setIsEditing(false);
    setCurrentTransacao({ tipo_transacao: 'RECEITA', valor: 0, data_transacao: format(new Date(), 'yyyy-MM-dd') }); // Valores padrão
    setIsModalOpen(true);
  };

  const handleEditTransacaoClick = (transacao: TransacaoFinanceira) => {
    setIsEditing(true);
    setCurrentTransacao(transacao);
    setIsModalOpen(true);
  };

  const handleDeleteTransacaoClick = (transacaoId: string) => {
    toast(`Tem certeza que deseja excluir esta transação?`, {
      action: {
        label: 'Excluir',
        onClick: () => deleteTransacaoMutation.mutate(transacaoId),
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
    if (!currentTransacao) return;

    try {
      if (isEditing) {
        await updateTransacaoMutation.mutateAsync({ transacaoId: currentTransacao.id!, transacaoData: currentTransacao });
      } else {
        await createTransacaoMutation.mutateAsync(currentTransacao as Omit<TransacaoFinanceira, 'id' | 'medico_id' | 'created_at' | 'updated_at'>);
      }
      setIsModalOpen(false);
      setCurrentTransacao(null);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTransacao(prev => ({
      ...prev,
      [name]: name === 'valor' ? parseFloat(value) : value,
    }));
  };

  if (isLoading) return <div className="text-center py-8">Carregando transações...</div>;
  if (isError) return <div className="text-center py-8 text-red-600">Erro ao carregar transações: {error?.message}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Transações Financeiras</h2>
        <button
          onClick={handleNewTransacaoClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Nova Transação
        </button>
      </div>

      <div className="mb-4 flex space-x-4">
        <input
          type="text"
          placeholder="Buscar transações..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <select
          value={typeFilter || ''}
          onChange={(e) => setTypeFilter(e.target.value as TransacaoFinanceira['tipo_transacao'] | undefined)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos os Tipos</option>
          <option value="RECEITA">Receita</option>
          <option value="DESPESA">Despesa</option>
        </select>
      </div>

      {data?.data && data.data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.data.map((transacao) => (
                <tr key={transacao.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transacao.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transacao.tipo_transacao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {transacao.valor.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(transacao.data_transacao), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditTransacaoClick(transacao)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteTransacaoClick(transacao.id)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhuma transação encontrada.</p>
      )}

      {/* Modal de Criação/Edição de Transação */}
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
                    <BanknotesIcon className="h-6 w-6 mr-2" />
                    {isEditing ? 'Editar Transação' : 'Nova Transação'}
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
                        <input type="text" name="descricao" id="descricao" value={currentTransacao?.descricao || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="valor" className="block text-sm font-medium text-gray-700">Valor</label>
                        <input type="number" name="valor" id="valor" value={currentTransacao?.valor || 0} onChange={handleChange} required step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="data_transacao" className="block text-sm font-medium text-gray-700">Data da Transação</label>
                        <input type="date" name="data_transacao" id="data_transacao" value={currentTransacao?.data_transacao ? format(new Date(currentTransacao.data_transacao), 'yyyy-MM-dd') : ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="tipo_transacao" className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select name="tipo_transacao" id="tipo_transacao" value={currentTransacao?.tipo_transacao || 'RECEITA'} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                          <option value="RECEITA">Receita</option>
                          <option value="DESPESA">Despesa</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoria (Opcional)</label>
                        <input type="text" name="categoria" id="categoria" value={currentTransacao?.categoria || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="meio_pagamento" className="block text-sm font-medium text-gray-700">Meio de Pagamento (Opcional)</label>
                        <input type="text" name="meio_pagamento" id="meio_pagamento" value={currentTransacao?.meio_pagamento || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
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
                          {isEditing ? 'Salvar Alterações' : 'Criar Transação'}
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
