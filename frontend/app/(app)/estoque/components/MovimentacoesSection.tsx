'use client';

import React, { useState, Fragment } from 'react';
import { useMovimentacoes, useCreateMovimentacao, useUpdateMovimentacao, useDeleteMovimentacao } from '../hooks/useMovimentacoes';
import { MovimentacaoEstoque } from '../types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ProductSelect from '@/components/ui/ProductSelect';

export default function MovimentacoesSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<MovimentacaoEstoque['tipo_movimentacao'] | undefined>(undefined);
  const [produtoIdFilter, setProdutoIdFilter] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, error } = useMovimentacoes(search, tipoFilter, produtoIdFilter, page, limit);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMovimentacao, setCurrentMovimentacao] = useState<Partial<MovimentacaoEstoque> | null>(null);

  const createMovimentacaoMutation = useCreateMovimentacao();
  const updateMovimentacaoMutation = useUpdateMovimentacao();
  const deleteMovimentacaoMutation = useDeleteMovimentacao();

  const handleNewMovimentacaoClick = () => {
    setIsEditing(false);
    setCurrentMovimentacao({ tipo_movimentacao: 'ENTRADA', quantidade: 0, data_movimentacao: format(new Date(), 'yyyy-MM-dd') }); // Valores padrão
    setIsModalOpen(true);
  };

  const handleEditMovimentacaoClick = (movimentacao: MovimentacaoEstoque) => {
    setIsEditing(true);
    setCurrentMovimentacao(movimentacao);
    setIsModalOpen(true);
  };

  const handleDeleteMovimentacaoClick = (movimentacaoId: string) => {
    toast(`Tem certeza que deseja excluir esta movimentação?`, {
      action: {
        label: 'Excluir',
        onClick: () => deleteMovimentacaoMutation.mutate(movimentacaoId),
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
    if (!currentMovimentacao) return;

    try {
      if (isEditing) {
        await updateMovimentacaoMutation.mutateAsync({ movimentacaoId: currentMovimentacao.id!, movimentacaoData: currentMovimentacao });
      } else {
        await createMovimentacaoMutation.mutateAsync(currentMovimentacao as Omit<MovimentacaoEstoque, 'id' | 'medico_id' | 'created_at' | 'updated_at'>);
      }
      setIsModalOpen(false);
      setCurrentMovimentacao(null);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentMovimentacao(prev => ({
      ...prev,
      [name]: name === 'quantidade' ? parseInt(value) : value,
    }));
  };

  if (isLoading) return <div className="text-center py-8">Carregando movimentações...</div>;
  if (isError) return <div className="text-center py-8 text-red-600">Erro ao carregar movimentações: {error?.message}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Movimentações de Estoque</h2>
        <button
          onClick={handleNewMovimentacaoClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Nova Movimentação
        </button>
      </div>

      <div className="mb-4 flex space-x-4">
        <input
          type="text"
          placeholder="Buscar movimentações..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <select
          value={tipoFilter || ''}
          onChange={(e) => setTipoFilter(e.target.value as MovimentacaoEstoque['tipo_movimentacao'] | undefined)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos os Tipos</option>
          <option value="ENTRADA">Entrada</option>
          <option value="SAIDA">Saída</option>
          <option value="AJUSTE">Ajuste</option>
        </select>
        <ProductSelect
          selectedProductId={produtoIdFilter || null}
          onSelectProduct={(id) => setProdutoIdFilter(id || undefined)}
          label="Filtrar por Produto"
        />
      </div>

      {data?.data && data.data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.data.map((movimentacao) => (
                <tr key={movimentacao.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{movimentacao.produtos?.nome_produto || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movimentacao.tipo_movimentacao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movimentacao.quantidade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(movimentacao.data_movimentacao), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditMovimentacaoClick(movimentacao)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteMovimentacaoClick(movimentacao.id)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Controles de Paginação */}
          <nav
            className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
            aria-label="Pagination"
          >
            <div className="flex flex-1 justify-between sm:justify-end">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!data?.hasMore}
                className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </nav>
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhuma movimentação encontrada.</p>
      )}

      {/* Modal de Criação/Edição de Movimentação */}
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
                    <CubeTransparentIcon className="h-6 w-6 mr-2" />
                    {isEditing ? 'Editar Movimentação' : 'Nova Movimentação'}
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="produto_id" className="block text-sm font-medium text-gray-700">Produto</label>
                        <ProductSelect
                          selectedProductId={currentMovimentacao?.produto_id || null}
                          onSelectProduct={(id) => setCurrentMovimentacao(prev => ({ ...prev, produto_id: id || undefined }))}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="tipo_movimentacao" className="block text-sm font-medium text-gray-700">Tipo de Movimentação</label>
                        <select name="tipo_movimentacao" id="tipo_movimentacao" value={currentMovimentacao?.tipo_movimentacao || 'ENTRADA'} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                          <option value="ENTRADA">Entrada</option>
                          <option value="SAIDA">Saída</option>
                          <option value="AJUSTE">Ajuste</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700">Quantidade</label>
                        <input type="number" name="quantidade" id="quantidade" value={currentMovimentacao?.quantidade || 0} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="data_movimentacao" className="block text-sm font-medium text-gray-700">Data da Movimentação</label>
                        <input type="date" name="data_movimentacao" id="data_movimentacao" value={currentMovimentacao?.data_movimentacao ? format(new Date(currentMovimentacao.data_movimentacao), 'yyyy-MM-dd') : ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="origem_destino" className="block text-sm font-medium text-gray-700">Origem/Destino (Opcional)</label>
                        <input type="text" name="origem_destino" id="origem_destino" value={currentMovimentacao?.origem_destino || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">Observações (Opcional)</label>
                        <textarea name="observacoes" id="observacoes" rows={3} value={currentMovimentacao?.observacoes || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
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
                          {isEditing ? 'Salvar Alterações' : 'Criar Movimentação'}
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
